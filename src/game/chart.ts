export interface NoteEvent {
  type: 'note';
  time: number; // seconds from song start
  string: number; // 0 = low E ... 5 = high E
  fret: number;
  finger?: number;
}

export interface ChordEvent {
  type: 'chord';
  time: number; // seconds from song start
  chordId: string; // key into CHORDS
  holdDuration: number; // how long the player has to strum it
}

export type ChartEvent = NoteEvent | ChordEvent;

export type ChartMode = 'notes' | 'chords';

export interface Chart {
  id: string;
  title: string;
  description: string;
  bpm: number;
  mode: ChartMode;
  events: ChartEvent[];
  duration: number; // seconds, used to know when the song ends
  /** Link to the chord-chart page this exercise was transcribed from, if any. */
  sourceUrl?: string;
  sourceName?: string;
}
