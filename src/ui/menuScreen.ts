import type { Navigator, Screen } from './router';
import { TunerScreen } from './tunerScreen';
import { LessonListScreen } from './lessonListScreen';
import { SongSelectScreen } from './songSelectScreen';

export class MenuScreen implements Screen {
  constructor(private nav: Navigator) {}

  mount(root: HTMLElement): void {
    root.innerHTML = `
      <div class="screen menu-screen">
        <h1 class="app-title">🎸 Violão Hero</h1>
        <p class="app-subtitle">Aprenda a tocar violão de verdade, no ritmo de um jogo.</p>

        <div class="menu-grid">
          <button class="menu-card" data-action="lessons">
            <span class="menu-card-icon">📘</span>
            <span class="menu-card-title">Aulas</span>
            <span class="menu-card-desc">Aprenda notas e acordes passo a passo, com diagramas.</span>
          </button>
          <button class="menu-card" data-action="play">
            <span class="menu-card-icon">🎮</span>
            <span class="menu-card-title">Tocar</span>
            <span class="menu-card-desc">Notas caem na tela — toque no violão de verdade no tempo certo.</span>
          </button>
          <button class="menu-card" data-action="tuner">
            <span class="menu-card-icon">🎚️</span>
            <span class="menu-card-title">Afinador</span>
            <span class="menu-card-desc">Afine seu violão usando o microfone.</span>
          </button>
        </div>

        <p class="menu-footnote">
          Dica: o modo "Tocar" e o Afinador usam o microfone para ouvir as notas reais do seu violão.
          Sem microfone, dá para praticar o ritmo com o teclado (teclas 1-6 e espaço).
        </p>
      </div>
    `;

    root.querySelector('[data-action="lessons"]')?.addEventListener('click', () => {
      this.nav.go((nav) => new LessonListScreen(nav));
    });
    root.querySelector('[data-action="play"]')?.addEventListener('click', () => {
      this.nav.go((nav) => new SongSelectScreen(nav));
    });
    root.querySelector('[data-action="tuner"]')?.addEventListener('click', () => {
      this.nav.go((nav) => new TunerScreen(nav));
    });
  }

  unmount(): void {}
}
