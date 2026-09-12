import type { Navigator, Screen } from './router';
import { SongListScreen } from './songListScreen';
import { getSong, type SavedSong } from '../songs/songStore';
import { fingeringForMidi, solfegeName } from '../ocarina/fingering';
import { renderOcarinaDiagram, renderThumbHoles } from './ocarinaDiagram';
import { frequencyToNote, midiToFrequency } from '../audio/noteUtils';
import { Synth } from '../audio/synth';
import { PitchDetector, type PitchFrame } from '../audio/pitchDetector';

const HOLD_TO_PASS_SECONDS = 0.3;
const ADVANCE_DELAY_MS = 500;

export class PracticeScreen implements Screen {
  private root: HTMLElement | null = null;
  private song: SavedSong | undefined;
  private index = 0;
  private synth = new Synth();
  private detector: PitchDetector | null = null;
  private holdStart: number | null = null;
  private passed = false;
  private advanceTimeout: number | null = null;

  constructor(private nav: Navigator, private songId: string) {}

  mount(root: HTMLElement): void {
    this.root = root;
    this.song = getSong(this.songId);
    if (!this.song || this.song.notes.length === 0) {
      this.nav.go((nav) => new SongListScreen(nav));
      return;
    }
    this.renderShell();
    this.renderStep();
  }

  private renderShell(): void {
    const root = this.root!;
    root.innerHTML = `
      <div class="screen">
        <button class="back-button" data-action="back">← Minhas músicas</button>
        <h1>${escapeHtml(this.song!.title)}</h1>
        <div class="lesson-progress-bar"><div class="lesson-progress-fill" data-el="progress"></div></div>
        <button class="mic-toggle" data-action="toggle-mic">🎤 Ligar microfone (conferir a nota)</button>
        <div class="lesson-step" data-el="step"></div>
      </div>
    `;
    root.querySelector('[data-action="back"]')?.addEventListener('click', () => this.nav.go((nav) => new SongListScreen(nav)));
    root.querySelector('[data-action="toggle-mic"]')?.addEventListener('click', () => void this.toggleMic());
  }

  private async toggleMic(): Promise<void> {
    const button = this.root?.querySelector<HTMLButtonElement>('[data-action="toggle-mic"]');
    if (this.detector?.isActive) {
      this.detector.stop();
      if (button) button.textContent = '🎤 Ligar microfone (conferir a nota)';
      return;
    }
    try {
      this.detector = this.detector ?? new PitchDetector((frame) => this.onPitch(frame));
      await this.detector.start();
      if (button) button.textContent = '🎤 Microfone ligado';
    } catch (err) {
      console.error(err);
      if (button) button.textContent = '🎤 Sem acesso ao microfone';
    }
  }

  private renderStep(): void {
    const root = this.root!;
    const notes = this.song!.notes;
    const midi = notes[this.index].midi;
    this.holdStart = null;
    this.passed = false;
    if (this.advanceTimeout !== null) {
      window.clearTimeout(this.advanceTimeout);
      this.advanceTimeout = null;
    }

    const progress = root.querySelector<HTMLElement>('[data-el="progress"]');
    if (progress) progress.style.width = `${(100 * (this.index + 1)) / notes.length}%`;

    const info = frequencyToNote(midiToFrequency(midi));
    const label = `${solfegeName(info.name)}${info.octave}`;
    const fingering = fingeringForMidi(midi);
    const isFreshBreath = this.index === 0 || notes[this.index].articulation === 'isolated';

    const stepEl = root.querySelector<HTMLElement>('[data-el="step"]')!;
    stepEl.innerHTML = `
      <span class="lesson-step-counter">Nota ${this.index + 1} de ${notes.length}</span>
      <h2>${label}</h2>
      <div class="breath-indicator ${isFreshBreath ? 'breath-indicator--new' : 'breath-indicator--tied'}">
        ${
          isFreshBreath
            ? '🌬️ Sopro novo — comece a nota do zero'
            : '🔗 Ligado — continue soprando, só troque o dedilhado'
        }
      </div>
      ${
        fingering
          ? `<div class="ocarina-diagrams">
               ${renderOcarinaDiagram(fingering, label)}
               ${renderThumbHoles(fingering)}
             </div>
             ${fingering.approximate ? '<p class="fingering-warning">Nota entre furos (sustenido/bemol) — dedilhado aproximado, técnica de meio-furo varia por instrumento.</p>' : ''}`
          : '<p class="fingering-warning">Fora do alcance de referência (ocarina de 12 furos) — toque na oitava que fizer sentido no seu instrumento.</p>'
      }
      <button class="secondary-button" data-action="reference">🔊 Ouvir a nota</button>
      <div class="lesson-feedback" data-el="feedback"></div>
      <div class="lesson-nav">
        <button class="secondary-button" data-action="prev" ${this.index === 0 ? 'disabled' : ''}>← Anterior</button>
        <button class="primary-button" data-action="next">${this.index === notes.length - 1 ? 'Concluir' : 'Próxima →'}</button>
      </div>
    `;

    stepEl.querySelector('[data-action="reference"]')?.addEventListener('click', () => {
      this.synth.resume();
      this.synth.playNote(midiToFrequency(midi), 0.8);
    });
    stepEl.querySelector('[data-action="prev"]')?.addEventListener('click', () => this.goTo(this.index - 1));
    stepEl.querySelector('[data-action="next"]')?.addEventListener('click', () => this.goTo(this.index + 1));
  }

  private goTo(index: number): void {
    if (index < 0) return;
    if (index >= this.song!.notes.length) {
      this.nav.go((nav) => new SongListScreen(nav));
      return;
    }
    this.index = index;
    this.renderStep();
  }

  private onPitch(frame: PitchFrame): void {
    const feedbackEl = this.root?.querySelector<HTMLElement>('[data-el="feedback"]');
    if (!feedbackEl || this.passed) return;
    const targetMidi = this.song!.notes[this.index].midi;

    if (frame.pitch && frame.pitch.note.midi === targetMidi) {
      const now = performance.now();
      if (this.holdStart === null) this.holdStart = now;
      const held = (now - this.holdStart) / 1000;
      feedbackEl.className = 'lesson-feedback lesson-feedback--close';
      feedbackEl.textContent = `Detectado: ${frame.pitch.note.fullName} ✓ mantenha...`;
      if (held >= HOLD_TO_PASS_SECONDS) {
        this.passed = true;
        feedbackEl.className = 'lesson-feedback lesson-feedback--pass';
        feedbackEl.textContent = '✓ Certinho!';
        this.synth.playHit();
        this.advanceTimeout = window.setTimeout(() => this.goTo(this.index + 1), ADVANCE_DELAY_MS);
      }
    } else {
      this.holdStart = null;
      feedbackEl.className = 'lesson-feedback';
      feedbackEl.textContent = frame.pitch ? `Detectado: ${frame.pitch.note.fullName} — ainda não é essa` : 'Ouvindo...';
    }
  }

  unmount(): void {
    if (this.advanceTimeout !== null) window.clearTimeout(this.advanceTimeout);
    this.detector?.stop();
    this.detector = null;
  }
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
