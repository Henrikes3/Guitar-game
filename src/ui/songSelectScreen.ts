import type { Navigator, Screen } from './router';
import { MenuScreen } from './menuScreen';
import { PlayScreen } from './playScreen';
import { CHARTS } from '../game/songs';

export class SongSelectScreen implements Screen {
  constructor(private nav: Navigator) {}

  mount(root: HTMLElement): void {
    root.innerHTML = `
      <div class="screen">
        <button class="back-button" data-action="back">← Voltar</button>
        <h1>Escolha um exercício</h1>
        <div class="song-list">
          ${CHARTS.map(
            (chart) => `
            <div class="song-card">
              <button class="song-card-main" data-id="${chart.id}">
                <span class="song-card-title">${chart.title}</span>
                <span class="song-card-desc">${chart.description}</span>
                <span class="song-card-tag">${chart.mode === 'notes' ? '🎵 Notas' : '🎼 Acordes'} · ${chart.bpm} BPM</span>
              </button>
              ${
                chart.sourceUrl
                  ? `<a class="song-card-source" href="${chart.sourceUrl}" target="_blank" rel="noopener noreferrer">Ver cifra completa no ${chart.sourceName ?? 'site de origem'} ↗</a>`
                  : ''
              }
            </div>
          `,
          ).join('')}
        </div>
      </div>
    `;

    root.querySelector('[data-action="back"]')?.addEventListener('click', () => {
      this.nav.go((nav) => new MenuScreen(nav));
    });
    root.querySelectorAll<HTMLButtonElement>('.song-card-main').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id!;
        this.nav.go((nav) => new PlayScreen(nav, id));
      });
    });
  }

  unmount(): void {}
}
