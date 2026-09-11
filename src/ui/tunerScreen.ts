import type { Navigator, Screen } from './router';
import { MenuScreen } from './menuScreen';
import { PitchDetector, type PitchFrame } from '../audio/pitchDetector';
import { STANDARD_TUNING, STRING_DISPLAY_NAMES } from '../guitar/fretboard';
import { STRING_COLORS } from '../ui/theme';
import { Synth } from '../audio/synth';
import { midiToFrequency } from '../audio/noteUtils';

export class TunerScreen implements Screen {
  private detector: PitchDetector | null = null;
  private synth = new Synth();
  private root: HTMLElement | null = null;

  constructor(private nav: Navigator) {}

  mount(root: HTMLElement): void {
    this.root = root;
    root.innerHTML = `
      <div class="screen tuner-screen">
        <button class="back-button" data-action="back">← Voltar</button>
        <h1>Afinador</h1>
        <p class="tuner-hint">Toque uma corda solta por vez e ajuste a tarraxa até o indicador ficar verde no centro.</p>

        <button class="primary-button" data-action="start-mic">🎤 Ligar microfone</button>
        <p class="tuner-status" data-el="status"></p>

        <div class="tuner-display" data-el="display" hidden>
          <div class="tuner-note" data-el="note">—</div>
          <div class="tuner-gauge">
            <div class="tuner-gauge-track">
              <div class="tuner-gauge-center-mark"></div>
              <div class="tuner-gauge-needle" data-el="needle"></div>
            </div>
            <div class="tuner-gauge-labels"><span>bemol</span><span>afinado</span><span>sustenido</span></div>
          </div>
          <div class="tuner-cents" data-el="cents"></div>
        </div>

        <h2 class="tuner-strings-title">Cordas do violão (afinação padrão)</h2>
        <div class="tuner-strings" data-el="strings">
          ${STANDARD_TUNING.map(
            (s, i) => `
            <button class="tuner-string-button" data-string="${i}" style="--string-color:${STRING_COLORS[i]}">
              <span class="tuner-string-name">${STRING_DISPLAY_NAMES[i]}</span>
              <span class="tuner-string-freq">${s.openName}</span>
            </button>
          `,
          ).join('')}
        </div>
      </div>
    `;

    root.querySelector('[data-action="back"]')?.addEventListener('click', () => this.goBack());
    root.querySelector('[data-action="start-mic"]')?.addEventListener('click', () => void this.startMic());
    root.querySelectorAll<HTMLButtonElement>('.tuner-string-button').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.string);
        this.synth.resume();
        this.synth.playNote(midiToFrequency(STANDARD_TUNING[idx].openMidi), 1.2);
      });
    });
  }

  private async startMic(): Promise<void> {
    const root = this.root;
    if (!root) return;
    const statusEl = root.querySelector<HTMLElement>('[data-el="status"]');
    const startButton = root.querySelector<HTMLButtonElement>('[data-action="start-mic"]');
    try {
      this.detector = new PitchDetector((result) => this.onPitch(result));
      await this.detector.start();
      if (statusEl) statusEl.textContent = '';
      startButton?.setAttribute('hidden', 'true');
      root.querySelector<HTMLElement>('[data-el="display"]')?.removeAttribute('hidden');
    } catch (err) {
      console.error(err);
      if (statusEl) {
        statusEl.textContent =
          'Não foi possível acessar o microfone. Verifique a permissão do navegador e tente novamente (é preciso HTTPS ou localhost).';
      }
    }
  }

  private onPitch(frame: PitchFrame): void {
    const root = this.root;
    if (!root) return;
    const noteEl = root.querySelector<HTMLElement>('[data-el="note"]');
    const needleEl = root.querySelector<HTMLElement>('[data-el="needle"]');
    const centsEl = root.querySelector<HTMLElement>('[data-el="cents"]');
    if (!noteEl || !needleEl || !centsEl) return;

    if (!frame.pitch) {
      noteEl.textContent = '—';
      centsEl.textContent = 'Toque uma corda';
      needleEl.style.left = '50%';
      needleEl.className = 'tuner-gauge-needle';
      return;
    }

    const { note } = frame.pitch;
    noteEl.textContent = note.fullName;
    const clampedCents = Math.max(-50, Math.min(50, note.cents));
    const percent = 50 + clampedCents;
    needleEl.style.left = `${percent}%`;

    const abs = Math.abs(note.cents);
    needleEl.className = 'tuner-gauge-needle ' + (abs <= 5 ? 'in-tune' : abs <= 15 ? 'close' : 'off');
    centsEl.textContent = abs <= 5 ? 'Afinado!' : note.cents > 0 ? `${abs} cents agudo demais` : `${abs} cents grave demais`;
  }

  private goBack(): void {
    this.nav.go((nav) => new MenuScreen(nav));
  }

  unmount(): void {
    this.detector?.stop();
    this.detector = null;
  }
}
