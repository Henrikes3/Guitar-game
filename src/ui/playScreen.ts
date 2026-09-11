import type { Navigator, Screen } from './router';
import { SongSelectScreen } from './songSelectScreen';
import { ResultsScreen } from './resultsScreen';
import { getChart } from '../game/songs';
import type { Chart } from '../game/chart';
import { GameEngine, type EngineSnapshot } from '../game/engine';
import { HighwayRenderer } from '../game/renderer';
import { PitchDetector, type PitchFrame } from '../audio/pitchDetector';
import { OnsetDetector } from '../game/onsetDetector';
import { Synth } from '../audio/synth';
import { CHORDS } from '../guitar/chords';
import { renderChordDiagram } from './fretboardDiagram';

export class PlayScreen implements Screen {
  private root: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private renderer: HighwayRenderer | null = null;
  private engine: GameEngine | null = null;
  private detector: PitchDetector | null = null;
  private onsetDetector = new OnsetDetector();
  private synth = new Synth();
  private rafId: number | null = null;
  private running = false;

  private latestPitchFrame: PitchFrame | null = null;
  private pendingKeyString: number | null = null;
  private pendingStrum = false;
  private usingMic = false;
  private lastPreviewChordId: string | null = null;

  private resizeHandler = () => this.renderer?.resize();

  constructor(private nav: Navigator, private chartId: string) {}

  private get chart(): Chart {
    return getChart(this.chartId)!;
  }

  mount(root: HTMLElement): void {
    this.root = root;
    if (!getChart(this.chartId)) {
      this.nav.go((nav) => new SongSelectScreen(nav));
      return;
    }

    const chart = this.chart;
    root.innerHTML = `
      <div class="screen play-screen">
        <div class="play-topbar">
          <button class="back-button" data-action="exit">← Sair</button>
          <div class="play-hud">
            <span data-el="score">Pontos: 0</span>
            <span data-el="combo">Combo: 0</span>
            <span data-el="accuracy">Precisão: —</span>
          </div>
        </div>
        <h1 class="play-title">${chart.title}</h1>

        <div class="play-body">
          <div class="play-canvas-wrap">
            <canvas class="play-canvas" data-el="canvas"></canvas>
          </div>
          ${
            chart.mode === 'chords'
              ? `<div class="play-side-panel" data-el="side-panel">
                   <h3>Próximo acorde</h3>
                   <div data-el="next-chord"></div>
                 </div>`
              : ''
          }
        </div>

        <div class="play-start-overlay" data-el="overlay">
          <h2>Pronto para tocar?</h2>
          <p>${chart.description}</p>
          <button class="primary-button" data-action="start-mic">🎤 Tocar com microfone (recomendado)</button>
          <button class="secondary-button" data-action="start-keyboard">⌨️ Praticar só o ritmo com o teclado</button>
          <p class="play-hint">
            ${
              chart.mode === 'notes'
                ? 'No modo teclado, as teclas 1 a 6 simulam as cordas Mi-Lá-Ré-Sol-Si-mi, mas só conferem a corda, não o traste — use o microfone para validar a nota exata.'
                : 'No modo teclado, aperte espaço no tempo de cada acorde para simular o dedilhado.'
            }
          </p>
          ${
            chart.sourceUrl
              ? `<a class="play-source-link" href="${chart.sourceUrl}" target="_blank" rel="noopener noreferrer">Ver cifra completa no ${chart.sourceName ?? 'site de origem'} ↗</a>`
              : ''
          }
        </div>
      </div>
    `;

    this.canvas = root.querySelector<HTMLCanvasElement>('[data-el="canvas"]');
    this.renderer = new HighwayRenderer(this.canvas!);

    root.querySelector('[data-action="exit"]')?.addEventListener('click', () => this.exit());
    root.querySelector('[data-action="start-mic"]')?.addEventListener('click', () => void this.begin(true));
    root.querySelector('[data-action="start-keyboard"]')?.addEventListener('click', () => void this.begin(false));

    window.addEventListener('resize', this.resizeHandler);
    window.addEventListener('keydown', this.onKeyDown);
    this.renderer.resize();
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (!this.running || event.repeat) return;
    if (event.key >= '1' && event.key <= '6') {
      this.pendingKeyString = Number(event.key) - 1;
    } else if (event.code === 'Space') {
      event.preventDefault();
      this.pendingStrum = true;
    }
  };

  private async begin(withMic: boolean): Promise<void> {
    const overlay = this.root?.querySelector<HTMLElement>('[data-el="overlay"]');
    this.usingMic = withMic;

    if (withMic) {
      try {
        this.detector = new PitchDetector((frame) => (this.latestPitchFrame = frame));
        await this.detector.start();
      } catch (err) {
        console.error(err);
        alert('Não foi possível acessar o microfone. Vamos continuar no modo teclado.');
        this.usingMic = false;
      }
    }

    overlay?.remove();
    this.engine = new GameEngine(this.chart);
    this.engine.onFeedback = (fb) => {
      if (fb.correct) this.synth.playHit();
      else this.synth.playMiss();
    };
    this.engine.start(performance.now() / 1000, 2.5);
    this.running = true;
    this.loop();
  }

  private loop = (): void => {
    if (!this.running || !this.engine || !this.renderer) return;
    const now = performance.now() / 1000;

    let strum = this.pendingStrum;
    this.pendingStrum = false;
    if (this.usingMic && this.chart.mode === 'chords') {
      const level = this.latestPitchFrame?.level ?? 0;
      if (this.onsetDetector.update(level, now)) strum = true;
    }
    const keyString = this.pendingKeyString;
    this.pendingKeyString = null;

    const snapshot = this.engine.update(now, {
      pitch: this.usingMic ? this.latestPitchFrame?.pitch ?? null : null,
      keyString,
      strum,
    });

    this.renderer.render(this.chart, snapshot);
    this.updateHud(snapshot);

    if (this.chart.mode === 'chords') this.updateNextChordPanel(snapshot);

    if (snapshot.finished) {
      this.finish(snapshot);
      return;
    }
    this.rafId = requestAnimationFrame(this.loop);
  };

  private updateHud(snapshot: EngineSnapshot): void {
    const root = this.root!;
    root.querySelector('[data-el="score"]')!.textContent = `Pontos: ${snapshot.score}`;
    root.querySelector('[data-el="combo"]')!.textContent = `Combo: ${snapshot.combo}`;
    const judged = snapshot.hits + snapshot.misses;
    const accuracy = judged > 0 ? Math.round((100 * snapshot.hits) / judged) : null;
    root.querySelector('[data-el="accuracy"]')!.textContent = `Precisão: ${accuracy === null ? '—' : accuracy + '%'}`;
  }

  private updateNextChordPanel(snapshot: EngineSnapshot): void {
    const panel = this.root?.querySelector<HTMLElement>('[data-el="next-chord"]');
    if (!panel) return;
    const upcoming = snapshot.chords.find((c) => c.judged === 'pending');
    const chordId = upcoming?.event.chordId ?? null;
    if (chordId === this.lastPreviewChordId) return;
    this.lastPreviewChordId = chordId;
    if (!chordId) {
      panel.innerHTML = '';
      return;
    }
    const shape = CHORDS[chordId];
    panel.innerHTML = `<div class="next-chord-name">${shape.name}</div>${renderChordDiagram(shape)}`;
  }

  private finish(snapshot: EngineSnapshot): void {
    this.running = false;
    this.stopLoop();
    this.detector?.stop();
    this.nav.go((nav) => new ResultsScreen(nav, this.chart, snapshot));
  }

  private exit(): void {
    this.nav.go((nav) => new SongSelectScreen(nav));
  }

  private stopLoop(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  unmount(): void {
    this.running = false;
    this.stopLoop();
    this.detector?.stop();
    this.detector = null;
    window.removeEventListener('resize', this.resizeHandler);
    window.removeEventListener('keydown', this.onKeyDown);
  }
}
