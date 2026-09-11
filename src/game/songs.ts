import type { Chart, NoteEvent, ChordEvent } from './chart';
import { CHORD_ORDER } from '../guitar/chords';

interface FirstPositionSpot {
  string: number;
  fret: number;
  finger?: number;
}

// A handful of first-position (open position, frets 0-3) note spots used to
// build the melody exercise below. Picking a single octave that stays on the
// A/D/G strings keeps the whole tune inside the very first frets a beginner
// learns.
const MELODY_NOTE_POS: Record<string, FirstPositionSpot> = {
  C: { string: 1, fret: 3, finger: 3 },
  D: { string: 2, fret: 0 },
  E: { string: 2, fret: 2, finger: 2 },
  F: { string: 2, fret: 3, finger: 3 },
  G: { string: 3, fret: 0 },
  A: { string: 3, fret: 2, finger: 2 },
};

function buildMelody(id: string, title: string, description: string, bpm: number, sequence: [keyof typeof MELODY_NOTE_POS, number][]): Chart {
  const secondsPerBeat = 60 / bpm;
  const events: NoteEvent[] = [];
  let time = 1.5; // lead room before the first note
  for (const [note, beats] of sequence) {
    const spot = MELODY_NOTE_POS[note];
    events.push({ type: 'note', time, string: spot.string, fret: spot.fret, finger: spot.finger });
    time += beats * secondsPerBeat;
  }
  return { id, title, description, bpm, mode: 'notes', events, duration: time + 2 };
}

const OPEN_STRINGS_CHART: Chart = (() => {
  const events: NoteEvent[] = [];
  let time = 1.5;
  const gap = 1.1;
  // Down and back up across all six open strings, twice.
  const order = [0, 1, 2, 3, 4, 5, 4, 3, 2, 1, 0, 1, 2, 3, 4, 5];
  for (const string of order) {
    events.push({ type: 'note', time, string, fret: 0 });
    time += gap;
  }
  return {
    id: 'open-strings',
    title: 'Cordas Soltas',
    description: 'Toque cada corda solta (sem pressionar nenhum traste) na ordem mostrada. Ótimo primeiro contato com o instrumento.',
    bpm: 55,
    mode: 'notes',
    events,
    duration: time + 2,
  };
})();

const FIRST_FRETS_CHART: Chart = (() => {
  const events: NoteEvent[] = [];
  let time = 1.5;
  const gap = 1.3;
  // One string at a time: open, fret 1, fret 2, fret 3 — the classic
  // "um dedo por traste" (one finger per fret) warm-up.
  for (let string = 0; string < 6; string++) {
    for (let fret = 0; fret <= 3; fret++) {
      events.push({ type: 'note', time, string, fret, finger: fret === 0 ? undefined : fret });
      time += gap;
    }
  }
  return {
    id: 'first-frets',
    title: 'Primeiros Trastes',
    description: 'Um dedo por traste: dedo 1 no primeiro traste, dedo 2 no segundo, dedo 3 no terceiro. Treine corda por corda.',
    bpm: 46,
    mode: 'notes',
    events,
    duration: time + 2,
  };
})();

const TWINKLE_CHART = buildMelody(
  'twinkle-twinkle',
  'Brilha, Brilha Estrelinha',
  'Sua primeira música completa, usando só as notas Dó Ré Mi Fá Sol Lá na primeira posição.',
  80,
  [
    ['C', 1], ['C', 1], ['G', 1], ['G', 1], ['A', 1], ['A', 1], ['G', 2],
    ['F', 1], ['F', 1], ['E', 1], ['E', 1], ['D', 1], ['D', 1], ['C', 2],
    ['G', 1], ['G', 1], ['F', 1], ['F', 1], ['E', 1], ['E', 1], ['D', 2],
    ['G', 1], ['G', 1], ['F', 1], ['F', 1], ['E', 1], ['E', 1], ['D', 2],
    ['C', 1], ['C', 1], ['G', 1], ['G', 1], ['A', 1], ['A', 1], ['G', 2],
    ['F', 1], ['F', 1], ['E', 1], ['E', 1], ['D', 1], ['D', 1], ['C', 2],
  ],
);

const CHORD_PROGRESSION_CHART: Chart = (() => {
  const events: ChordEvent[] = [];
  const progression = ['Em', 'C', 'G', 'D'];
  const holdDuration = 3.6;
  let time = 2;
  for (let round = 0; round < 2; round++) {
    for (const chordId of progression) {
      events.push({ type: 'chord', time, chordId, holdDuration });
      time += holdDuration;
    }
  }
  return {
    id: 'first-chords',
    title: 'Primeira Progressão',
    description: `Troque entre ${progression.join(' - ')} no seu tempo. O objetivo aqui é a transição limpa entre acordes, não velocidade.`,
    bpm: 70,
    mode: 'chords',
    events,
    duration: time + 1.5,
  };
})();

const UNRAVEL_CHART: Chart = (() => {
  const events: ChordEvent[] = [];
  // Main recurring progression of the verse/chorus loop, transcribed from the
  // chord chart (chords only — no lyrics are stored here or anywhere in this
  // project). Bm is a barre chord, a step up in difficulty from the other
  // practice charts.
  const progression = ['C', 'D', 'Bm', 'Em'];
  const holdDuration = 3.2;
  let time = 2;
  for (let round = 0; round < 4; round++) {
    for (const chordId of progression) {
      events.push({ type: 'chord', time, chordId, holdDuration });
      time += holdDuration;
    }
  }
  return {
    id: 'unravel',
    title: 'Unravel (Abertura de Tokyo Ghoul)',
    description:
      `Loop principal da música em ${progression.join(' - ')}. Inclui o acorde Bm (pestana) — mais avançado que os outros exercícios. ` +
      'Progressão simplificada a partir da cifra; pequenas variações da música original (como acordes de passagem) foram omitidas para manter o exercício redondo.',
    bpm: 92,
    mode: 'chords',
    events,
    duration: time + 1.5,
    sourceUrl: 'https://www.cifraclub.com.br/som-de-anime/unravel-abertura-de-tokyo-ghoul/',
    sourceName: 'Cifra Club',
  };
})();

export const CHARTS: Chart[] = [OPEN_STRINGS_CHART, FIRST_FRETS_CHART, TWINKLE_CHART, CHORD_PROGRESSION_CHART, UNRAVEL_CHART];

export function getChart(id: string): Chart | undefined {
  return CHARTS.find((c) => c.id === id);
}

// Re-exported so screens can list every chord shape covered by lessons in a
// sensible teaching order without importing two modules.
export const LESSON_CHORD_ORDER = CHORD_ORDER;
