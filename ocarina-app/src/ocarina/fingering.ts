export type HolePosition = { kind: 'front'; index: number } | { kind: 'thumb'; side: 'left' | 'right' };

export const FRONT_HOLE_COUNT = 10;

const SOLFEGE: Record<string, string> = {
  C: 'Dó',
  'C#': 'Dó#',
  D: 'Ré',
  'D#': 'Ré#',
  E: 'Mi',
  F: 'Fá',
  'F#': 'Fá#',
  G: 'Sol',
  'G#': 'Sol#',
  A: 'Lá',
  'A#': 'Lá#',
  B: 'Si',
};

// Lowest note of the reference chart (all 12 holes covered): A4. This matches
// the common low end of a standard 12-hole "Alto C" pendant ocarina.
const LOWEST_MIDI = 69; // A4
export const OCARINA_MIN_MIDI = LOWEST_MIDI;
export const OCARINA_MAX_MIDI = LOWEST_MIDI + 15; // C6, about an octave and a fifth up

// Order the 12 holes are conventionally lifted as pitch rises: the two
// holes nearest where the hands meet first, working outward, thumb holes
// (on the back of the instrument) last. This is a GENERIC reference
// fingering, not verified against any specific manufacturer's chart -
// always cross-check with the chart that came with your instrument.
const UNCOVER_ORDER: HolePosition[] = [
  { kind: 'front', index: 6 },
  { kind: 'front', index: 5 },
  { kind: 'front', index: 7 },
  { kind: 'front', index: 4 },
  { kind: 'front', index: 8 },
  { kind: 'front', index: 3 },
  { kind: 'front', index: 9 },
  { kind: 'front', index: 2 },
  { kind: 'front', index: 10 },
  { kind: 'front', index: 1 },
  { kind: 'thumb', side: 'right' },
  { kind: 'thumb', side: 'left' },
];

// Natural (white-key) scale degrees from the lowest note: semitone offsets
// and how many of the 12 holes are uncovered at each one. Distributed
// roughly proportionally to the semitone gap between consecutive natural
// notes; both arrays run A4, B4, C5, D5, E5, F5, G5, A5, B5, C6.
const SCALE_DEGREE_SEMITONES = [0, 2, 3, 5, 7, 8, 10, 12, 14, 15];
const SCALE_DEGREE_UNCOVERED = [0, 2, 3, 4, 6, 7, 8, 10, 11, 12];

export interface Fingering {
  /** 12 booleans: front holes 1-10 (index 0-9), then thumb-right, thumb-left. */
  covered: boolean[];
  /** True when this fingering was interpolated for a sharp/flat rather than
   *  taken directly from the natural-note reference chart. */
  approximate: boolean;
}

function coveredPatternFor(uncoveredCount: number): boolean[] {
  const covered = new Array(12).fill(true) as boolean[];
  for (let i = 0; i < uncoveredCount; i++) {
    const hole = UNCOVER_ORDER[i];
    if (hole.kind === 'front') covered[hole.index - 1] = false;
    else covered[hole.side === 'right' ? 10 : 11] = false;
  }
  return covered;
}

/**
 * Best-effort fingering for a MIDI note on a standard 12-hole pendant
 * ocarina tuned in C. GENERIC REFERENCE CHART - see module doc comment.
 * Returns null outside the range this reference chart covers.
 */
export function fingeringForMidi(midi: number): Fingering | null {
  if (midi < OCARINA_MIN_MIDI || midi > OCARINA_MAX_MIDI) return null;
  const semitoneOffset = midi - LOWEST_MIDI;
  const degreeIndex = SCALE_DEGREE_SEMITONES.indexOf(semitoneOffset);
  if (degreeIndex !== -1) {
    return { covered: coveredPatternFor(SCALE_DEGREE_UNCOVERED[degreeIndex]), approximate: false };
  }

  // Sharp/flat between two natural notes: approximate with one extra hole
  // open from the natural note below. Real instruments usually need a
  // half-hole technique here, which varies more between makers.
  let below = 0;
  for (let i = 0; i < SCALE_DEGREE_SEMITONES.length; i++) {
    if (SCALE_DEGREE_SEMITONES[i] <= semitoneOffset) below = i;
  }
  const uncovered = Math.min(12, SCALE_DEGREE_UNCOVERED[below] + 1);
  return { covered: coveredPatternFor(uncovered), approximate: true };
}

export function solfegeName(letterName: string): string {
  return SOLFEGE[letterName] ?? letterName;
}
