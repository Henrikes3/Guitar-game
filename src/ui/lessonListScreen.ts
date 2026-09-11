import type { Navigator, Screen } from './router';
import { MenuScreen } from './menuScreen';
import { LessonPlayerScreen } from './lessonPlayerScreen';
import { LESSONS } from '../lessons/lessons';

export class LessonListScreen implements Screen {
  constructor(private nav: Navigator) {}

  mount(root: HTMLElement): void {
    root.innerHTML = `
      <div class="screen">
        <button class="back-button" data-action="back">← Voltar</button>
        <h1>Aulas</h1>
        <p class="tuner-hint">Cada aula é uma sequência curta de passos. Use o microfone para receber feedback em tempo real, ou avance manualmente.</p>
        <div class="lesson-list">
          ${LESSONS.map(
            (lesson) => `
            <button class="lesson-card" data-id="${lesson.id}">
              <span class="lesson-card-title">${lesson.title}</span>
              <span class="lesson-card-desc">${lesson.summary}</span>
              <span class="lesson-card-steps">${lesson.steps.length} passos</span>
            </button>
          `,
          ).join('')}
        </div>
      </div>
    `;

    root.querySelector('[data-action="back"]')?.addEventListener('click', () => {
      this.nav.go((nav) => new MenuScreen(nav));
    });
    root.querySelectorAll<HTMLButtonElement>('.lesson-card').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id!;
        this.nav.go((nav) => new LessonPlayerScreen(nav, id));
      });
    });
  }

  unmount(): void {}
}
