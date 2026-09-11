/**
 * Very small strum/pluck onset detector: flags a sudden rise in input level
 * over the recent baseline. This is intentionally simple — real polyphonic
 * chord recognition (proving *which* strings actually rang out) is beyond
 * what a lightweight autocorrelation pitch tracker can do, so chord "hits"
 * in this game are a best-effort rhythm check (did you strum roughly on
 * time?) rather than a verification of the exact chord shape. That
 * limitation is called out in the UI and README.
 */
export class OnsetDetector {
  private history: number[] = [];
  private readonly historyLength = 15;
  private cooldownUntil = 0;

  update(level: number, now: number): boolean {
    const baseline = this.history.length > 0 ? this.history.reduce((a, b) => a + b, 0) / this.history.length : 0;
    const isOnset = now > this.cooldownUntil && level > 0.045 && level > baseline * 2.2 + 0.01;

    this.history.push(level);
    if (this.history.length > this.historyLength) this.history.shift();

    if (isOnset) {
      this.cooldownUntil = now + 0.3;
      return true;
    }
    return false;
  }

  reset(): void {
    this.history = [];
    this.cooldownUntil = 0;
  }
}
