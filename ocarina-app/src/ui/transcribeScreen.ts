import type { Navigator, Screen } from './router';
import { MenuScreen } from './menuScreen';
import { PracticeScreen } from './practiceScreen';
import { PitchDetector, type PitchFrame } from '../audio/pitchDetector';
import { MelodyTranscriber, fitToRange, type NoteSegment } from '../transcribe/melodyTranscriber';
import { OCARINA_MIN_MIDI, OCARINA_MAX_MIDI } from '../ocarina/fingering';
import { saveSong } from '../songs/songStore';
import { noteLabel, chipHtml } from './noteChip';

export class TranscribeScreen implements Screen {
  private root: HTMLElement | null = null;
  private detector: PitchDetector | null = null;
  private transcriber = new MelodyTranscriber();
  private recording = false;
  private startTime = 0;
  private rawSegments: NoteSegment[] = [];
  private finalSegments: NoteSegment[] = [];

  constructor(private nav: Navigator) {}

  mount(root: HTMLElement): void {
    this.root = root;
    this.renderIdle();
  }

  private renderIdle(): void {
    const root = this.root!;
    root.innerHTML = `
      <div class="screen">
        <button class="back-button" data-action="back">← Voltar</button>
        <h1>Gravar melodia</h1>
        <p class="tuner-hint">
          Já sabe de cor uma música (tipo abertura de anime)? Cante ou assobie ela BEM devagar, uma nota de
          cada vez, perto do microfone — não precisa achar a partitura em lugar nenhum. Uma pequena pausa
          entre as notas ajuda o app a separar cada uma.
        </p>
        <p class="tuner-hint">
          <strong>Não funciona bem</strong> apontando o microfone pra uma gravação da música tocando (banda
          completa, bateria, vários instrumentos juntos) — o detector só entende uma nota de cada vez, então
          o resultado sai bagunçado. Cantar/assobiar só a melodia funciona muito melhor.
        </p>
        <button class="primary-button" data-action="start">🎤 Ligar microfone e gravar</button>
        <p class="tuner-status" data-el="status"></p>
      </div>
    `;
    root.querySelector('[data-action="back"]')?.addEventListener('click', () => {
      this.nav.go((nav) => new MenuScreen(nav));
    });
    root.querySelector('[data-action="start"]')?.addEventListener('click', () => void this.startRecording());
  }

  private async startRecording(): Promise<void> {
    const statusEl = this.root?.querySelector<HTMLElement>('[data-el="status"]');
    try {
      this.transcriber.reset();
      this.detector = new PitchDetector((frame) => this.onPitch(frame));
      await this.detector.start();
    } catch (err) {
      console.error(err);
      if (statusEl) statusEl.textContent = 'Não foi possível acessar o microfone. Verifique a permissão do navegador.';
      return;
    }
    this.recording = true;
    this.startTime = performance.now() / 1000;
    this.renderRecording();
  }

  private renderRecording(): void {
    const root = this.root!;
    root.innerHTML = `
      <div class="screen">
        <h1>🔴 Gravando...</h1>
        <p class="tuner-hint">Toque a melodia devagar. Quando terminar, aperte parar.</p>
        <div class="transcribe-live" data-el="live">Ouvindo...</div>
        <div class="note-chip-row" data-el="notes"></div>
        <button class="primary-button" data-action="stop">⏹ Parar gravação</button>
      </div>
    `;
    root.querySelector('[data-action="stop"]')?.addEventListener('click', () => this.stopRecording());
  }

  private onPitch(frame: PitchFrame): void {
    if (!this.recording) return;
    const time = performance.now() / 1000 - this.startTime;
    const before = this.transcriber.getSegments().length;
    this.transcriber.pushFrame(frame, time);
    const liveEl = this.root?.querySelector<HTMLElement>('[data-el="live"]');
    if (liveEl) liveEl.textContent = frame.pitch ? `Ouvindo: ${noteLabel(frame.pitch.note.midi)}` : 'Ouvindo...';

    const after = this.transcriber.getSegments();
    if (after.length > before) {
      const notesEl = this.root?.querySelector<HTMLElement>('[data-el="notes"]');
      if (notesEl) {
        const last = after[after.length - 1];
        notesEl.insertAdjacentHTML('beforeend', chipHtml(last.midi, last.articulation, after.length === 1));
      }
    }
  }

  private stopRecording(): void {
    this.recording = false;
    const time = performance.now() / 1000 - this.startTime;
    this.rawSegments = this.transcriber.finish(time);
    this.finalSegments = this.rawSegments;
    this.detector?.stop();
    this.detector = null;
    this.renderResult();
  }

  private renderResult(): void {
    const root = this.root!;
    if (this.rawSegments.length === 0) {
      root.innerHTML = `
        <div class="screen">
          <h1>Nenhuma nota detectada</h1>
          <p class="tuner-hint">Tente de novo em um lugar mais silencioso, cantando/tocando um pouco mais forte e devagar.</p>
          <button class="primary-button" data-action="retry">Tentar de novo</button>
          <button class="secondary-button" data-action="back">← Voltar ao menu</button>
        </div>
      `;
      root.querySelector('[data-action="retry"]')?.addEventListener('click', () => this.renderIdle());
      root.querySelector('[data-action="back"]')?.addEventListener('click', () => this.nav.go((nav) => new MenuScreen(nav)));
      return;
    }

    const outOfRange = this.finalSegments.filter((s) => s.midi < OCARINA_MIN_MIDI || s.midi > OCARINA_MAX_MIDI).length;

    root.innerHTML = `
      <div class="screen">
        <h1>Melodia capturada!</h1>
        <p class="tuner-hint">${this.finalSegments.length} notas detectadas.</p>
        <div class="note-chip-row" data-el="notes">
          ${this.finalSegments.map((s, i) => chipHtml(s.midi, s.articulation, i === 0)).join('')}
        </div>
        <p class="tie-legend"><span class="note-tie">‿</span> = mesma respiração (ligado) &nbsp;·&nbsp; sem marca = sopro novo</p>
        ${
          outOfRange > 0
            ? `<p class="tuner-status" data-el="range-warning">${outOfRange} nota(s) fora do alcance comum da ocarina de 12 furos.</p>
               <button class="secondary-button" data-action="fit">🎯 Ajustar automaticamente para caber na ocarina</button>`
            : `<p class="transcribe-ok">Todas as notas cabem no alcance da ocarina de 12 furos. ✓</p>`
        }
        <label class="song-title-label">
          Nome da música
          <input type="text" class="song-title-input" data-el="title" placeholder="Ex: Minha melodia" />
        </label>
        <button class="primary-button" data-action="save">💾 Salvar e praticar</button>
        <button class="secondary-button" data-action="discard">🗑️ Descartar e regravar</button>
      </div>
    `;

    root.querySelector('[data-action="fit"]')?.addEventListener('click', () => {
      const result = fitToRange(this.finalSegments, OCARINA_MIN_MIDI, OCARINA_MAX_MIDI);
      this.finalSegments = result.segments;
      this.renderResult();
    });
    root.querySelector('[data-action="discard"]')?.addEventListener('click', () => this.renderIdle());
    root.querySelector('[data-action="save"]')?.addEventListener('click', () => this.save());
  }

  private save(): void {
    const input = this.root?.querySelector<HTMLInputElement>('[data-el="title"]');
    const title = input?.value.trim() || 'Melodia sem nome';
    const notes = this.finalSegments.map((s) => ({ midi: s.midi, duration: Math.max(0.3, s.end - s.start), articulation: s.articulation }));
    const song = saveSong(title, notes);
    this.nav.go((nav) => new PracticeScreen(nav, song.id));
  }

  unmount(): void {
    this.recording = false;
    this.detector?.stop();
    this.detector = null;
  }
}
