import type { Navigator, Screen } from './router';
import { MenuScreen } from './menuScreen';
import { SongSelectScreen } from './songSelectScreen';
import { PlayScreen } from './playScreen';
import type { Chart } from '../game/chart';
import type { EngineSnapshot } from '../game/engine';

function gradeFor(accuracy: number): string {
  if (accuracy >= 95) return 'Impecável! 🌟';
  if (accuracy >= 80) return 'Muito bom! 👏';
  if (accuracy >= 60) return 'Bom progresso! 💪';
  if (accuracy >= 30) return 'Continue praticando! 🎸';
  return 'Vamos de novo, com calma. 🙂';
}

export class ResultsScreen implements Screen {
  constructor(private nav: Navigator, private chart: Chart, private snapshot: EngineSnapshot) {}

  mount(root: HTMLElement): void {
    const judged = this.snapshot.hits + this.snapshot.misses;
    const accuracy = judged > 0 ? Math.round((100 * this.snapshot.hits) / judged) : 0;

    root.innerHTML = `
      <div class="screen results-screen">
        <h1>Resultado</h1>
        <h2 class="results-chart-title">${this.chart.title}</h2>
        <p class="results-grade">${gradeFor(accuracy)}</p>

        <div class="results-grid">
          <div class="results-stat"><span class="results-stat-value">${this.snapshot.score}</span><span class="results-stat-label">Pontos</span></div>
          <div class="results-stat"><span class="results-stat-value">${accuracy}%</span><span class="results-stat-label">Precisão</span></div>
          <div class="results-stat"><span class="results-stat-value">${this.snapshot.hits}</span><span class="results-stat-label">Acertos</span></div>
          <div class="results-stat"><span class="results-stat-value">${this.snapshot.misses}</span><span class="results-stat-label">Erros</span></div>
          <div class="results-stat"><span class="results-stat-value">${this.snapshot.maxCombo}</span><span class="results-stat-label">Maior combo</span></div>
        </div>

        <div class="results-actions">
          <button class="primary-button" data-action="retry">🔁 Tentar de novo</button>
          <button class="secondary-button" data-action="songs">🎵 Outro exercício</button>
          <button class="secondary-button" data-action="menu">🏠 Menu</button>
        </div>
      </div>
    `;

    root.querySelector('[data-action="retry"]')?.addEventListener('click', () => {
      this.nav.go((nav) => new PlayScreen(nav, this.chart.id));
    });
    root.querySelector('[data-action="songs"]')?.addEventListener('click', () => {
      this.nav.go((nav) => new SongSelectScreen(nav));
    });
    root.querySelector('[data-action="menu"]')?.addEventListener('click', () => {
      this.nav.go((nav) => new MenuScreen(nav));
    });
  }

  unmount(): void {}
}
