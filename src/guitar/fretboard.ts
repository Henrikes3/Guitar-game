import { midiToFrequency, frequencyToNote } from '../audio/noteUtils';

export interface GuitarString {
  /** 0 = low E (thickest string), 5 = high E (thinnest) */
  index: number;
  openName: string;
  openMidi: number;
}

/** Standard EADGBE tuning. Index 0 is the low (thick) E string, matching how a
 *  chord chart lists strings top-to-bottom, and how the game lanes are drawn
 *  left-to-right. */
export const STANDARD_TUNING: GuitarString[] = [
  { index: 0, openName: 'E2', openMidi: 40 },
  { index: 1, openName: 'A2', openMidi: 45 },
  { index: 2, openName: 'D3', openMidi: 50 },
  { index: 3, openName: 'G3', openMidi: 55 },
  { index: 4, openName: 'B3', openMidi: 59 },
  { index: 5, openName: 'E4', openMidi: 64 },
];

export const STRING_COUNT = STANDARD_TUNING.length;
export const STRING_DISPLAY_NAMES = ['E', 'A', 'D', 'G', 'B', 'e'];

export function fretMidi(stringIndex: number, fret: number): number {
  return STANDARD_TUNING[stringIndex].openMidi + fret;
}

export function fretFrequency(stringIndex: number, fret: number): number {
  return midiToFrequency(fretMidi(stringIndex, fret));
}

export function noteNameAt(stringIndex: number, fret: number): string {
  return frequencyToNote(fretFrequency(stringIndex, fret)).fullName;
}
