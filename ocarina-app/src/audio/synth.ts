/** Small oscillator-based synth used for reference notes, metronome clicks and hit/miss feedback. */
export class Synth {
  private ctx: AudioContext;

  constructor(ctx?: AudioContext) {
    this.ctx = ctx ?? new AudioContext();
  }

  get audioContext(): AudioContext {
    return this.ctx;
  }

  resume(): void {
    void this.ctx.resume();
  }

  playNote(frequency: number, duration = 0.6, type: OscillatorType = 'sine', gainValue = 0.15): void {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(gainValue, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  playClick(strong = false): void {
    this.playNote(strong ? 1800 : 1200, 0.05, 'square', strong ? 0.12 : 0.07);
  }

  playHit(): void {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.08);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  playMiss(): void {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }
}
