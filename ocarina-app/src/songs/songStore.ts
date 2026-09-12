import type { Articulation } from '../transcribe/melodyTranscriber';

const STORAGE_KEY = 'ocarina-hero:songs';

export interface SavedNote {
  midi: number;
  /** seconds this note lasts, used only to pace playback/preview */
  duration: number;
  /** 'isolated' = start a fresh breath/tonguing; 'continuous' = keep
   *  blowing from the previous note, just change the fingering. */
  articulation: Articulation;
}

export interface SavedSong {
  id: string;
  title: string;
  createdAt: number;
  notes: SavedNote[];
}

function readAll(): SavedSong[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(songs: SavedSong[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(songs));
  } catch {
    // localStorage unavailable (private browsing, quota, etc.) - silently skip persistence.
  }
}

export function loadSongs(): SavedSong[] {
  return readAll().sort((a, b) => b.createdAt - a.createdAt);
}

export function getSong(id: string): SavedSong | undefined {
  return readAll().find((s) => s.id === id);
}

export function saveSong(title: string, notes: SavedNote[]): SavedSong {
  const song: SavedSong = { id: `song-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, title, createdAt: Date.now(), notes };
  const all = readAll();
  all.push(song);
  writeAll(all);
  return song;
}

export function deleteSong(id: string): void {
  writeAll(readAll().filter((s) => s.id !== id));
}
