import { fretMidi } from './fretboard';

export type FingerNum = 1 | 2 | 3 | 4;

export interface ChordNoteSpec {
  /** 0 = low E ... 5 = high E */
  string: number;
  fret: number;
  /** Suggested left-hand finger. Omitted for open strings. */
  finger?: FingerNum;
}

export interface ChordShape {
  id: string;
  /** Short name as musicians write it, e.g. "Em" */
  name: string;
  /** Friendly Portuguese name for teaching copy, e.g. "Mi menor" */
  fullName: string;
  notes: ChordNoteSpec[];
  mutedStrings: number[];
  /** MIDI number of the lowest string actually played — used both for display
   *  and as the anchor pitch our best-effort strum heuristic listens for. */
  rootMidi: number;
}

function defineChord(id: string, name: string, fullName: string, notes: ChordNoteSpec[], mutedStrings: number[]): ChordShape {
  const rootMidi = Math.min(...notes.map((n) => fretMidi(n.string, n.fret)));
  return { id, name, fullName, notes, mutedStrings, rootMidi };
}

export const CHORDS: Record<string, ChordShape> = {
  Em: defineChord(
    'Em',
    'Em',
    'Mi menor',
    [
      { string: 0, fret: 0 },
      { string: 1, fret: 2, finger: 2 },
      { string: 2, fret: 2, finger: 3 },
      { string: 3, fret: 0 },
      { string: 4, fret: 0 },
      { string: 5, fret: 0 },
    ],
    [],
  ),
  C: defineChord(
    'C',
    'C',
    'Dó maior',
    [
      { string: 1, fret: 3, finger: 3 },
      { string: 2, fret: 2, finger: 2 },
      { string: 3, fret: 0 },
      { string: 4, fret: 1, finger: 1 },
      { string: 5, fret: 0 },
    ],
    [0],
  ),
  G: defineChord(
    'G',
    'G',
    'Sol maior',
    [
      { string: 0, fret: 3, finger: 2 },
      { string: 1, fret: 2, finger: 1 },
      { string: 2, fret: 0 },
      { string: 3, fret: 0 },
      { string: 4, fret: 0 },
      { string: 5, fret: 3, finger: 3 },
    ],
    [],
  ),
  D: defineChord(
    'D',
    'D',
    'Ré maior',
    [
      { string: 1, fret: 0 },
      { string: 2, fret: 0 },
      { string: 3, fret: 2, finger: 1 },
      { string: 4, fret: 3, finger: 3 },
      { string: 5, fret: 2, finger: 2 },
    ],
    [0],
  ),
  Am: defineChord(
    'Am',
    'Am',
    'Lá menor',
    [
      { string: 1, fret: 0 },
      { string: 2, fret: 2, finger: 2 },
      { string: 3, fret: 2, finger: 3 },
      { string: 4, fret: 1, finger: 1 },
      { string: 5, fret: 0 },
    ],
    [0],
  ),
  A: defineChord(
    'A',
    'A',
    'Lá maior',
    [
      { string: 1, fret: 0 },
      { string: 2, fret: 2, finger: 1 },
      { string: 3, fret: 2, finger: 2 },
      { string: 4, fret: 2, finger: 3 },
      { string: 5, fret: 0 },
    ],
    [0],
  ),
  E: defineChord(
    'E',
    'E',
    'Mi maior',
    [
      { string: 0, fret: 0 },
      { string: 1, fret: 2, finger: 2 },
      { string: 2, fret: 2, finger: 3 },
      { string: 3, fret: 1, finger: 1 },
      { string: 4, fret: 0 },
      { string: 5, fret: 0 },
    ],
    [],
  ),
  Dm: defineChord(
    'Dm',
    'Dm',
    'Ré menor',
    [
      { string: 2, fret: 0 },
      { string: 3, fret: 2, finger: 2 },
      { string: 4, fret: 3, finger: 3 },
      { string: 5, fret: 1, finger: 1 },
    ],
    [0, 1],
  ),
  Bm: defineChord(
    'Bm',
    'Bm',
    'Si menor (pestana)',
    [
      { string: 1, fret: 2, finger: 1 },
      { string: 2, fret: 4, finger: 3 },
      { string: 3, fret: 4, finger: 4 },
      { string: 4, fret: 3, finger: 2 },
      { string: 5, fret: 2, finger: 1 },
    ],
    [0],
  ),
};

export const CHORD_ORDER = ['Em', 'Am', 'C', 'G', 'D', 'E', 'A', 'Dm'];
