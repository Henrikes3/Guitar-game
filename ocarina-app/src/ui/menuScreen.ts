import type { Navigator, Screen } from './router';
import { TranscribeScreen } from './transcribeScreen';
import { ManualEntryScreen } from './manualEntryScreen';
import { SongListScreen } from './songListScreen';

export class MenuScreen implements Screen {
  constructor(private nav: Navigator) {}

  mount(root: HTMLElement): void {
    root.innerHTML = `
      <div class="screen menu-screen">
        <h1 class="app-title">🎵 Ocarina Hero</h1>
        <p class="app-subtitle">Ache as notas de qualquer música e pratique com o dedilhado na tela.</p>

        <div class="menu-grid">
          <button class="menu-card" data-action="record">
            <span class="menu-card-icon">🎤</span>
            <span class="menu-card-title">Gravar melodia</span>
            <span class="menu-card-desc">Cante ou toque perto do microfone — o app descobre as notas pra você.</span>
          </button>
          <button class="menu-card" data-action="manual">
            <span class="menu-card-icon">✍️</span>
            <span class="menu-card-title">Digitar notas</span>
            <span class="menu-card-desc">Já sabe as notas? Monte a sequência clicando nelas.</span>
          </button>
          <button class="menu-card" data-action="songs">
            <span class="menu-card-icon">📂</span>
            <span class="menu-card-title">Minhas músicas</span>
            <span class="menu-card-desc">Veja o dedilhado das músicas que você já salvou.</span>
          </button>
        </div>

        <p class="menu-footnote">
          Aviso: a tabela de dedilhado é uma referência para ocarina de 12 furos — confirme com o encarte
          que veio com a sua ocarina, pequenas variações entre fabricantes são comuns.
        </p>
      </div>
    `;

    root.querySelector('[data-action="record"]')?.addEventListener('click', () => {
      this.nav.go((nav) => new TranscribeScreen(nav));
    });
    root.querySelector('[data-action="manual"]')?.addEventListener('click', () => {
      this.nav.go((nav) => new ManualEntryScreen(nav));
    });
    root.querySelector('[data-action="songs"]')?.addEventListener('click', () => {
      this.nav.go((nav) => new SongListScreen(nav));
    });
  }

  unmount(): void {}
}
