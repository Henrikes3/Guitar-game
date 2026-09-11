import type { Chart, NoteEvent, ChordEvent } from './chart';
import { fretMidi } from '../guitar/fretboard';
import type { PitchResult } from '../audio/pitchDetector';

export const NOTE_HIT_WINDOW = 0.4; // seconds, +/- around the note's target time
const CHORD_EARLY_GRACE = 0.5; // a strum slightly before the window still counts

export type Judgement = 'pending' | 'hit' | 'miss';

export interface NoteState {
  event: NoteEvent;
  judged: Judgement;
}

export interface ChordState {
  event: ChordEvent;
  judged: Judgement;
}

export interface FrameInput {
  pitch: PitchResult | null;
  /** String index (0-5) simulated via keyboard this frame, if any. */
  keyString?: number | null;
  /** A strum/pluck was detected (mic onset) or simulated (spacebar) this frame. */
  strum?: boolean;
}

export interface FeedbackEvent {
  correct: boolean;
  string?: number;
  at: number;
}

export interface EngineSnapshot {
  elapsed: number;
  notes: NoteState[];
  chords: ChordState[];
  score: number;
  combo: number;
  maxCombo: number;
  hits: number;
  misses: number;
  total: number;
  finished: boolean;
}

export class GameEngine {
  readonly chart: Chart;
  private notes: NoteState[];
  private chords: ChordState[];
  private startedAt = 0;
  private score = 0;
  private combo = 0;
  private maxCombo = 0;
  private hits = 0;
  private misses = 0;
  private finished = false;
  private elapsed = -Infinity;

  onFeedback: ((feedback: FeedbackEvent) => void) | null = null;

  constructor(chart: Chart) {
    this.chart = chart;
    this.notes = chart.events.filter((e): e is NoteEvent => e.type === 'note').map((event) => ({ event, judged: 'pending' }));
    this.chords = chart.events.filter((e): e is ChordEvent => e.type === 'chord').map((event) => ({ event, judged: 'pending' }));
  }

  start(nowSeconds: number, leadInSeconds = 2): void {
    this.startedAt = nowSeconds + leadInSeconds;
  }

  private judgeHit(state: NoteState | ChordState): void {
    state.judged = 'hit';
    this.hits++;
    this.combo++;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.score += 100 + Math.min(this.combo, 20) * 5;
    const string = 'string' in state.event ? state.event.string : undefined;
    this.onFeedback?.({ correct: true, string, at: this.elapsed });
  }

  private judgeMiss(state: NoteState | ChordState): void {
    state.judged = 'miss';
    this.misses++;
    this.combo = 0;
    this.onFeedback?.({ correct: false, at: this.elapsed });
  }

  update(nowSeconds: number, input: FrameInput): EngineSnapshot {
    this.elapsed = nowSeconds - this.startedAt;
    const elapsed = this.elapsed;

    if (this.chart.mode === 'notes') {
      for (const state of this.notes) {
        if (state.judged !== 'pending') continue;
        const { time, string, fret } = state.event;
        if (elapsed < time - NOTE_HIT_WINDOW) continue;
        if (elapsed > time + NOTE_HIT_WINDOW) {
          this.judgeMiss(state);
          continue;
        }
        const targetMidi = fretMidi(string, fret);
        const pitchMatches = input.pitch !== null && input.pitch.note.midi === targetMidi;
        const keyMatches = input.keyString !== undefined && input.keyString !== null && input.keyString === string;
        if (pitchMatches || keyMatches) {
          this.judgeHit(state);
        }
      }
    } else {
      for (const state of this.chords) {
        if (state.judged !== 'pending') continue;
        const { time, holdDuration } = state.event;
        if (elapsed < time - CHORD_EARLY_GRACE) continue;
        if (elapsed > time + holdDuration) {
          this.judgeMiss(state);
          continue;
        }
        if (input.strum) {
          this.judgeHit(state);
        }
      }
    }

    if (!this.finished && elapsed > this.chart.duration) {
      this.finished = true;
    }

    return this.snapshot();
  }

  snapshot(): EngineSnapshot {
    return {
      elapsed: this.elapsed,
      notes: this.notes,
      chords: this.chords,
      score: this.score,
      combo: this.combo,
      maxCombo: this.maxCombo,
      hits: this.hits,
      misses: this.misses,
      total: this.notes.length + this.chords.length,
      finished: this.finished,
    };
  }
}
