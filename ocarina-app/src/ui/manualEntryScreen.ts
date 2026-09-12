import type { Navigator, Screen } from './router';
import { MenuScreen } from './menuScreen';
import { PracticeScreen } from './practiceScreen';
import { OCARINA_MIN_MIDI, OCARINA_MAX_MIDI, solfegeName } from '../ocarina/fingering';
import { frequencyToNote, midiToFrequency } from '../audio/noteUtils';
import { Synth } from '../audio/synth';
import { saveSong } from '../songs/songStore';

const DEFAULT_NOTE_DURATION = 0.5;

function noteLabel(midi: number): string {
  const info = frequencyToNote(midiToFrequency(midi));
  return `${solfegeName(info.name)}${info.octave}`;
}

export class ManualEntryScreen implements Screen {
  private root: HTMLElement | null = null;
  private sequence: number[] = [];
  private synth = new Synth();

  constructor(private nav: Navigator) {}

  mount(root: HTMLElement): void {
    this.root = root;
    root.innerHTML = `
      <div class="screen">
        <button class="back-button" data-action="back">← Voltar</button>
        <h1>Digitar notas</h1>
        <p class="tuner-hint">Clique nas notas na ordem da melodia. Já sabendo as notas de algum lugar, é só montar a sequência aqui.</p>

        <div class="note-picker" data-el="picker"></div>

        <div class="manual-sequence-row">
          <h3>Sequência</h3>
          <div class="note-chip-row" data-el="sequence"></div>
        </div>

        <div class="manual-actions">
          <button class="secondary-button" data-action="undo">↩️ Remover última</button>
          <button class="secondary-button" data-action="clear">🗑️ Limpar</button>
          <button class="secondary-button" data-action="preview">🔊 Ouvir sequência</button>
        </div>

        <label class="song-title-label">
          Nome da música
          <input type="text" class="song-title-input" data-el="title" placeholder="Ex: Minha melodia" />
        </label>
        <button class="primary-button" data-action="save">💾 Salvar e praticar</button>
      </div>
    `;

    const picker = root.querySelector<HTMLElement>('[data-el="picker"]')!;
    for (let midi = OCARINA_MIN_MIDI; midi <= OCARINA_MAX_MIDI; midi++) {
      const button = document.createElement('button');
      button.className = 'note-picker-button';
      button.textContent = noteLabel(midi);
      button.addEventListener('click', () => this.addNote(midi));
      picker.appendChild(button);
    }

    root.querySelector('[data-action="back"]')?.addEventListener('click', () => this.nav.go((nav) => new MenuScreen(nav)));
    root.querySelector('[data-action="undo"]')?.addEventListener('click', () => {
      this.sequence.pop();
      this.renderSequence();
    });
    root.querySelector('[data-action="clear"]')?.addEventListener('click', () => {
      this.sequence = [];
      this.renderSequence();
    });
    root.querySelector('[data-action="preview"]')?.addEventListener('click', () => this.preview());
    root.querySelector('[data-action="save"]')?.addEventListener('click', () => this.save());

    this.renderSequence();
  }

  private addNote(midi: number): void {
    this.sequence.push(midi);
    this.synth.resume();
    this.synth.playNote(midiToFrequency(midi), 0.35);
    this.renderSequence();
  }

  private renderSequence(): void {
    const el = this.root?.querySelector<HTMLElement>('[data-el="sequence"]');
    if (!el) return;
    el.innerHTML = this.sequence.length
      ? this.sequence.map((midi) => `<span class="note-chip">${noteLabel(midi)}</span>`).join('')
      : '<span class="note-chip-empty">(nenhuma nota ainda)</span>';
  }

  private preview(): void {
    this.synth.resume();
    this.sequence.forEach((midi, i) => {
      setTimeout(() => this.synth.playNote(midiToFrequency(midi), DEFAULT_NOTE_DURATION * 0.9), i * DEFAULT_NOTE_DURATION * 1000);
    });
  }

  private save(): void {
    if (this.sequence.length === 0) return;
    const input = this.root?.querySelector<HTMLInputElement>('[data-el="title"]');
    const title = input?.value.trim() || 'Melodia sem nome';
    const notes = this.sequence.map((midi) => ({ midi, duration: DEFAULT_NOTE_DURATION }));
    const song = saveSong(title, notes);
    this.nav.go((nav) => new PracticeScreen(nav, song.id));
  }

  unmount(): void {}
}
