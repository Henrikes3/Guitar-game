const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

export interface NoteInfo {
  /** Note letter name, e.g. "E" or "C#" */
  name: string;
  octave: number;
  /** e.g. "E2" */
  fullName: string;
  /** MIDI note number (A4 = 69) */
  midi: number;
  /** Frequency in Hz of the exact, in-tune note */
  frequency: number;
  /** How far the *input* frequency this was derived from is from the note, in cents (-50..50) */
  cents: number;
}

/** Converts a frequency in Hz to the nearest musical note, plus how far off (in cents) it is. */
export function frequencyToNote(frequency: number, a4 = 440): NoteInfo {
  const midiFloat = 69 + 12 * Math.log2(frequency / a4);
  const midi = Math.round(midiFloat);
  const cents = Math.round((midiFloat - midi) * 100);
  const name = NOTE_NAMES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  const frequencyExact = midiToFrequency(midi, a4);
  return { name, octave, fullName: `${name}${octave}`, midi, frequency: frequencyExact, cents };
}

export function midiToFrequency(midi: number, a4 = 440): number {
  return a4 * Math.pow(2, (midi - 69) / 12);
}

/** How many cents `frequency` is away from `targetMidi`. Positive = sharp, negative = flat. */
export function centsOff(frequency: number, targetMidi: number, a4 = 440): number {
  const targetFreq = midiToFrequency(targetMidi, a4);
  return Math.round(1200 * Math.log2(frequency / targetFreq));
}
