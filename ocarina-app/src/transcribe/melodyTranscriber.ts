import type { PitchFrame } from '../audio/pitchDetector';

export type Articulation = 'isolated' | 'continuous';

export interface NoteSegment {
  midi: number;
  start: number;
  end: number;
  /** 'isolated' = start a fresh breath/tonguing on this note (a rest or the
   *  start of the recording came before it). 'continuous' = keep blowing
   *  from the previous note with no gap - just change the fingering. */
  articulation: Articulation;
}

const SILENCE_HOLD_SECONDS = 0.15;
const MIN_NOTE_DURATION_SECONDS = 0.08;

/**
 * Turns a live stream of pitch-detector frames into a sequence of discrete
 * notes with start/end times, i.e. hum/sing/play a melody near the mic and
 * get back "which notes, in what order" - the piece most people actually
 * mean by "achar as notas de uma música" (finding the notes for a song).
 *
 * This only works for one voice/instrument at a time (monophonic), which is
 * exactly what an ocarina (or a human voice) produces, so no polyphony
 * heuristics are needed here, unlike chord strums.
 */
export class MelodyTranscriber {
  private segments: NoteSegment[] = [];
  private currentMidi: number | null = null;
  private currentStart = 0;
  private currentArticulation: Articulation = 'isolated';
  private silenceSince: number | null = null;

  pushFrame(frame: PitchFrame, time: number): void {
    const detectedMidi = frame.pitch?.note.midi ?? null;

    if (detectedMidi === null) {
      if (this.currentMidi !== null) {
        if (this.silenceSince === null) this.silenceSince = time;
        if (time - this.silenceSince >= SILENCE_HOLD_SECONDS) {
          this.closeCurrentNote(this.silenceSince);
        }
      }
      return;
    }

    this.silenceSince = null;

    if (this.currentMidi === null) {
      // Nothing was sounding a moment ago (start of recording, or a rest) -
      // this note begins a fresh breath.
      this.startNote(detectedMidi, time, 'isolated');
      return;
    }

    if (detectedMidi !== this.currentMidi) {
      // Pitch changed with no silence in between - same breath, just a
      // different fingering.
      this.closeCurrentNote(time);
      this.startNote(detectedMidi, time, 'continuous');
    }
  }

  private startNote(midi: number, time: number, articulation: Articulation): void {
    this.currentMidi = midi;
    this.currentStart = time;
    this.currentArticulation = articulation;
  }

  private closeCurrentNote(endTime: number): void {
    if (this.currentMidi !== null && endTime - this.currentStart >= MIN_NOTE_DURATION_SECONDS) {
      this.segments.push({ midi: this.currentMidi, start: this.currentStart, end: endTime, articulation: this.currentArticulation });
    }
    this.currentMidi = null;
    this.silenceSince = null;
  }

  /** Call when recording stops, to flush a still-sounding note. */
  finish(time: number): NoteSegment[] {
    if (this.currentMidi !== null) this.closeCurrentNote(time);
    return this.segments;
  }

  getSegments(): NoteSegment[] {
    return this.segments;
  }

  reset(): void {
    this.segments = [];
    this.currentMidi = null;
    this.silenceSince = null;
  }
}

export interface FitToRangeResult {
  shiftSemitones: number;
  segments: NoteSegment[];
  outOfRangeCount: number;
}

/**
 * Shifts a whole melody by a fixed number of semitones (preserving its exact
 * intervals/character) to best fit an instrument's playable range. Useful
 * because a hummed melody often sits outside where a given ocarina can
 * actually play it.
 */
export function fitToRange(segments: NoteSegment[], minMidi: number, maxMidi: number): FitToRangeResult {
  if (segments.length === 0) return { shiftSemitones: 0, segments: [], outOfRangeCount: 0 };

  const midis = segments.map((s) => s.midi);
  const melodyMin = Math.min(...midis);
  const melodyMax = Math.max(...midis);
  const melodyRange = melodyMax - melodyMin;
  const instrumentRange = maxMidi - minMidi;

  let shift: number;
  if (melodyRange <= instrumentRange) {
    const idealLow = minMidi + (instrumentRange - melodyRange) / 2;
    shift = Math.round(idealLow - melodyMin);
  } else {
    const melodyCenter = (melodyMin + melodyMax) / 2;
    const instrumentCenter = (minMidi + maxMidi) / 2;
    shift = Math.round(instrumentCenter - melodyCenter);
  }

  const shifted = segments.map((s) => ({ ...s, midi: s.midi + shift }));
  const outOfRangeCount = shifted.filter((s) => s.midi < minMidi || s.midi > maxMidi).length;
  return { shiftSemitones: shift, segments: shifted, outOfRangeCount };
}
