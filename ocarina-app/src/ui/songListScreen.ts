import type { Navigator, Screen } from './router';
import { MenuScreen } from './menuScreen';
import { PracticeScreen } from './practiceScreen';
import { loadSongs, deleteSong } from '../songs/songStore';

export class SongListScreen implements Screen {
  private root: HTMLElement | null = null;

  constructor(private nav: Navigator) {}

  mount(root: HTMLElement): void {
    this.root = root;
    this.render();
  }

  private render(): void {
    const root = this.root!;
    const songs = loadSongs();
    root.innerHTML = `
      <div class="screen">
        <button class="back-button" data-action="back">← Voltar</button>
        <h1>Minhas músicas</h1>
        ${
          songs.length === 0
            ? '<p class="tuner-hint">Nenhuma música salva ainda. Grave uma melodia ou digite as notas no menu.</p>'
            : `<div class="song-list">
                ${songs
                  .map(
                    (s) => `
                  <div class="song-card">
                    <button class="song-card-main" data-id="${s.id}">
                      <span class="song-card-title">${escapeHtml(s.title)}</span>
                      <span class="song-card-desc">${s.notes.length} notas</span>
                    </button>
                    <button class="song-card-delete" data-delete="${s.id}" aria-label="Excluir">🗑️</button>
                  </div>
                `,
                  )
                  .join('')}
              </div>`
        }
      </div>
    `;

    root.querySelector('[data-action="back"]')?.addEventListener('click', () => this.nav.go((nav) => new MenuScreen(nav)));
    root.querySelectorAll<HTMLButtonElement>('.song-card-main').forEach((btn) => {
      btn.addEventListener('click', () => this.nav.go((nav) => new PracticeScreen(nav, btn.dataset.id!)));
    });
    root.querySelectorAll<HTMLButtonElement>('.song-card-delete').forEach((btn) => {
      btn.addEventListener('click', () => {
        deleteSong(btn.dataset.delete!);
        this.render();
      });
    });
  }

  unmount(): void {}
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
