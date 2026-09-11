import type { ChordShape } from '../guitar/chords';
import { STRING_COUNT } from '../guitar/fretboard';

const FRETS_SHOWN = 4;

export interface SingleNoteSpec {
  string: number;
  fret: number;
  finger?: number;
  label?: string;
}

interface DiagramOptions {
  width?: number;
  height?: number;
  /** Highlight color for the active dot(s), defaults to the CSS variable --accent */
  dotClass?: string;
}

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Renders a vertical chord-chart style SVG diagram (nut at the top). Shared by
 *  the lesson screens and the "upcoming chord" preview in the game highway. */
export function renderChordDiagram(shape: ChordShape, options: DiagramOptions = {}): string {
  const width = options.width ?? 150;
  const height = options.height ?? 170;
  const marginTop = 30;
  const marginSide = 16;
  const boardWidth = width - marginSide * 2;
  const boardHeight = height - marginTop - 14;
  const stringGap = boardWidth / (STRING_COUNT - 1);
  const fretGap = boardHeight / FRETS_SHOWN;

  const stringX = (s: number) => marginSide + s * stringGap;
  const fretY = (f: number) => marginTop + f * fretGap;

  let svg = `<svg viewBox="0 0 ${width} ${height}" class="chord-diagram" role="img" aria-label="Diagrama do acorde ${escapeXml(shape.name)}">`;
  svg += `<rect x="${marginSide - 1}" y="${marginTop - 3}" width="${boardWidth + 2}" height="4" class="chord-nut" />`;

  for (let f = 1; f <= FRETS_SHOWN; f++) {
    svg += `<line x1="${marginSide}" y1="${fretY(f)}" x2="${marginSide + boardWidth}" y2="${fretY(f)}" class="chord-fret" />`;
  }
  for (let s = 0; s < STRING_COUNT; s++) {
    svg += `<line x1="${stringX(s)}" y1="${marginTop}" x2="${stringX(s)}" y2="${marginTop + boardHeight}" class="chord-string" />`;
  }

  for (let s = 0; s < STRING_COUNT; s++) {
    const spec = shape.notes.find((n) => n.string === s);
    const muted = shape.mutedStrings.includes(s);
    if (muted) {
      svg += `<text x="${stringX(s)}" y="${marginTop - 12}" class="chord-marker chord-marker--mute" text-anchor="middle">×</text>`;
    } else if (spec && spec.fret === 0) {
      svg += `<text x="${stringX(s)}" y="${marginTop - 12}" class="chord-marker chord-marker--open" text-anchor="middle">○</text>`;
    } else if (spec) {
      const cy = fretY(spec.fret - 1) + fretGap / 2;
      svg += `<circle cx="${stringX(s)}" cy="${cy}" r="10" class="${options.dotClass ?? 'chord-dot'}" />`;
      if (spec.finger) {
        svg += `<text x="${stringX(s)}" y="${cy + 4}" class="chord-finger" text-anchor="middle">${spec.finger}</text>`;
      }
    }
  }

  svg += '</svg>';
  return svg;
}

/** Same visual language as renderChordDiagram, but highlighting a single target
 *  note (used in note-reading lessons). Other strings are drawn plain, with no
 *  x/o markers, since we are isolating one note rather than describing a full
 *  strum. */
export function renderSingleNoteDiagram(note: SingleNoteSpec, options: DiagramOptions = {}): string {
  const width = options.width ?? 150;
  const height = options.height ?? 170;
  const marginTop = 30;
  const marginSide = 16;
  const boardWidth = width - marginSide * 2;
  const boardHeight = height - marginTop - 14;
  const stringGap = boardWidth / (STRING_COUNT - 1);
  const fretsShown = Math.max(FRETS_SHOWN, note.fret + 1);
  const fretGap = boardHeight / fretsShown;

  const stringX = (s: number) => marginSide + s * stringGap;
  const fretY = (f: number) => marginTop + f * fretGap;

  let svg = `<svg viewBox="0 0 ${width} ${height}" class="chord-diagram" role="img" aria-label="Diagrama da nota ${escapeXml(note.label ?? '')}">`;
  svg += `<rect x="${marginSide - 1}" y="${marginTop - 3}" width="${boardWidth + 2}" height="4" class="chord-nut" />`;
  for (let f = 1; f <= fretsShown; f++) {
    svg += `<line x1="${marginSide}" y1="${fretY(f)}" x2="${marginSide + boardWidth}" y2="${fretY(f)}" class="chord-fret" />`;
  }
  for (let s = 0; s < STRING_COUNT; s++) {
    svg += `<line x1="${stringX(s)}" y1="${marginTop}" x2="${stringX(s)}" y2="${marginTop + boardHeight}" class="chord-string" />`;
  }

  if (note.fret === 0) {
    svg += `<text x="${stringX(note.string)}" y="${marginTop - 12}" class="chord-marker chord-marker--open" text-anchor="middle">○</text>`;
  } else {
    const cy = fretY(note.fret - 1) + fretGap / 2;
    svg += `<circle cx="${stringX(note.string)}" cy="${cy}" r="10" class="${options.dotClass ?? 'chord-dot chord-dot--target'}" />`;
    if (note.finger) {
      svg += `<text x="${stringX(note.string)}" y="${cy + 4}" class="chord-finger" text-anchor="middle">${note.finger}</text>`;
    }
  }

  svg += '</svg>';
  return svg;
}
