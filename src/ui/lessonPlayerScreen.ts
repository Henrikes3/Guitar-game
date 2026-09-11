import type { Navigator, Screen } from './router';
import { LessonListScreen } from './lessonListScreen';
import { getLesson, type LessonStep } from '../lessons/lessons';
import { PitchDetector, type PitchFrame } from '../audio/pitchDetector';
import { OnsetDetector } from '../game/onsetDetector';
import { Synth } from '../audio/synth';
import { fretMidi, noteNameAt } from '../guitar/fretboard';
import { midiToFrequency } from '../audio/noteUtils';
import { CHORDS } from '../guitar/chords';
import { renderChordDiagram, renderSingleNoteDiagram } from './fretboardDiagram';

const HOLD_TO_PASS_SECONDS = 0.35;
const ADVANCE_DELAY_MS = 700;

export class LessonPlayerScreen implements Screen {
  private root: HTMLElement | null = null;
  private detector: PitchDetector | null = null;
  private onsetDetector = new OnsetDetector();
  private synth = new Synth();
  private stepIndex = 0;
  private holdStart: number | null = null;
  private stepPassed = false;
  private advanceTimeout: number | null = null;

  constructor(private nav: Navigator, private lessonId: string) {}

  mount(root: HTMLElement): void {
    this.root = root;
    if (!getLesson(this.lessonId)) {
      this.nav.go((nav) => new LessonListScreen(nav));
      return;
    }
    this.renderShell();
    this.renderStep();
  }

  private get lesson() {
    return getLesson(this.lessonId)!;
  }

  private renderShell(): void {
    const root = this.root!;
    root.innerHTML = `
      <div class="screen lesson-screen">
        <button class="back-button" data-action="back">← Voltar às aulas</button>
        <div class="lesson-progress-bar"><div class="lesson-progress-fill" data-el="progress"></div></div>
        <button class="mic-toggle" data-action="toggle-mic">🎤 Ligar microfone</button>
        <div class="lesson-step" data-el="step"></div>
      </div>
    `;
    root.querySelector('[data-action="back"]')?.addEventListener('click', () => {
      this.nav.go((nav) => new LessonListScreen(nav));
    });
    root.querySelector('[data-action="toggle-mic"]')?.addEventListener('click', () => void this.toggleMic());
  }

  private async toggleMic(): Promise<void> {
    const button = this.root?.querySelector<HTMLButtonElement>('[data-action="toggle-mic"]');
    if (this.detector?.isActive) {
      this.detector.stop();
      if (button) button.textContent = '🎤 Ligar microfone';
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

  private currentStep(): LessonStep {
    return this.lesson.steps[this.stepIndex];
  }

  private renderStep(): void {
    const root = this.root!;
    const step = this.currentStep();
    this.holdStart = null;
    this.stepPassed = false;
    this.onsetDetector.reset();
    if (this.advanceTimeout !== null) {
      window.clearTimeout(this.advanceTimeout);
      this.advanceTimeout = null;
    }

    const progress = root.querySelector<HTMLElement>('[data-el="progress"]');
    if (progress) progress.style.width = `${(100 * (this.stepIndex + 1)) / this.lesson.steps.length}%`;

    const stepEl = root.querySelector<HTMLElement>('[data-el="step"]')!;
    const isFirst = this.stepIndex === 0;
    const isLast = this.stepIndex === this.lesson.steps.length - 1;

    let diagramHtml = '';
    let referenceButton = '';
    if (step.kind === 'note') {
      const label = noteNameAt(step.string, step.fret);
      diagramHtml = renderSingleNoteDiagram({ string: step.string, fret: step.fret, finger: step.finger, label });
      referenceButton = `<button class="secondary-button" data-action="reference">🔊 Ouvir a nota (${label})</button>`;
    } else if (step.kind === 'chord') {
      const shape = CHORDS[step.chordId];
      diagramHtml = renderChordDiagram(shape);
      referenceButton = `<button class="secondary-button" data-action="reference">🔊 Ouvir o acorde</button>`;
    }

    stepEl.innerHTML = `
      <span class="lesson-step-counter">Passo ${this.stepIndex + 1} de ${this.lesson.steps.length}</span>
      <h2>${step.title}</h2>
      <p class="lesson-step-body">${step.body}</p>
      ${diagramHtml ? `<div class="lesson-diagram">${diagramHtml}</div>` : ''}
      ${referenceButton}
      <div class="lesson-feedback" data-el="feedback"></div>
      <div class="lesson-nav">
        <button class="secondary-button" data-action="prev" ${isFirst ? 'disabled' : ''}>← Anterior</button>
        <button class="primary-button" data-action="next">${isLast ? 'Concluir' : 'Próximo →'}</button>
      </div>
    `;

    stepEl.querySelector('[data-action="reference"]')?.addEventListener('click', () => {
      this.synth.resume();
      if (step.kind === 'note') {
        this.synth.playNote(midiToFrequency(fretMidi(step.string, step.fret)), 0.9);
      } else if (step.kind === 'chord') {
        const shape = CHORDS[step.chordId];
        this.synth.playChord(shape.notes.map((n) => midiToFrequency(fretMidi(n.string, n.fret))), 1.1);
      }
    });
    stepEl.querySelector('[data-action="prev"]')?.addEventListener('click', () => this.goTo(this.stepIndex - 1));
    stepEl.querySelector('[data-action="next"]')?.addEventListener('click', () => this.goTo(this.stepIndex + 1));
  }

  private goTo(index: number): void {
    if (index < 0) return;
    if (index >= this.lesson.steps.length) {
      this.nav.go((nav) => new LessonListScreen(nav));
      return;
    }
    this.stepIndex = index;
    this.renderStep();
  }

  private onPitch(frame: PitchFrame): void {
    const step = this.currentStep();
    const feedbackEl = this.root?.querySelector<HTMLElement>('[data-el="feedback"]');
    if (!feedbackEl || this.stepPassed) return;

    if (step.kind === 'note') {
      const targetMidi = fretMidi(step.string, step.fret);
      if (frame.pitch && frame.pitch.note.midi === targetMidi) {
        const now = performance.now();
        if (this.holdStart === null) this.holdStart = now;
        const held = (now - this.holdStart) / 1000;
        feedbackEl.className = 'lesson-feedback lesson-feedback--close';
        feedbackEl.textContent = `Detectado: ${frame.pitch.note.fullName} ✓ mantenha...`;
        if (held >= HOLD_TO_PASS_SECONDS) {
          this.markPassed(feedbackEl, `Correto! Essa é a nota ${noteNameAt(step.string, step.fret)}.`);
        }
      } else {
        this.holdStart = null;
        feedbackEl.className = 'lesson-feedback';
        feedbackEl.textContent = frame.pitch ? `Detectado: ${frame.pitch.note.fullName} — ainda não é essa nota` : 'Ouvindo...';
      }
    } else if (step.kind === 'chord') {
      if (this.onsetDetector.update(frame.level, performance.now() / 1000)) {
        this.markPassed(feedbackEl, 'Dedilhado detectado! (a checagem de acordes é aproximada — confira visualmente se as notas do diagrama batem.)');
      } else {
        feedbackEl.textContent = feedbackEl.textContent || 'Ouvindo...';
      }
    }
  }

  private markPassed(feedbackEl: HTMLElement, message: string): void {
    this.stepPassed = true;
    feedbackEl.className = 'lesson-feedback lesson-feedback--pass';
    feedbackEl.textContent = `✓ ${message}`;
    this.synth.playHit();
    this.advanceTimeout = window.setTimeout(() => this.goTo(this.stepIndex + 1), ADVANCE_DELAY_MS);
  }

  unmount(): void {
    if (this.advanceTimeout !== null) window.clearTimeout(this.advanceTimeout);
    this.detector?.stop();
    this.detector = null;
  }
}
