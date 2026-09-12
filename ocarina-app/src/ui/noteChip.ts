import type { Articulation } from '../transcribe/melodyTranscriber';
import { frequencyToNote, midiToFrequency } from '../audio/noteUtils';
import { solfegeName } from '../ocarina/fingering';

export function noteLabel(midi: number): string {
  const info = frequencyToNote(midiToFrequency(midi));
  return `${solfegeName(info.name)}${info.octave}`;
}

/** A tie mark before a chip means "same breath as the previous note" (no
 *  new attack). No mark (or the first chip in a sequence) means "start a
 *  fresh breath/tonguing here". */
export function chipHtml(midi: number, articulation: Articulation, isFirst: boolean): string {
  const tie = !isFirst && articulation === 'continuous' ? '<span class="note-tie" title="Mesma respiração">‿</span>' : '';
  return `${tie}<span class="note-chip">${noteLabel(midi)}</span>`;
}
