import { frequencyToNote, type NoteInfo } from './noteUtils';

// Guitar fundamentals roughly span E2 (~82Hz) to well above the 12th fret of the
// high E string (~660Hz); we widen the window a bit for detection noise/bends.
const MIN_FREQUENCY = 70;
const MAX_FREQUENCY = 1200;
const MIN_RMS = 0.01;

/**
 * Autocorrelation-based pitch detector (ACF with amplitude trimming + parabolic
 * interpolation). This is a standard, well-known technique for monophonic pitch
 * tracking that works well in real time for a single plucked/strummed guitar
 * string. It is NOT polyphonic — feed it a full chord and it will only lock on
 * to the strongest periodic component (usually close to the bass note), which
 * is why chord "detection" in this project falls back to a best-effort heuristic
 * (see game/chordListener.ts) instead of true chord transcription.
 */
export function autoCorrelate(buffer: Float32Array, sampleRate: number): number {
  const size = buffer.length;

  let rms = 0;
  for (let i = 0; i < size; i++) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / size);
  if (rms < MIN_RMS) return -1;

  // Trim silence/noise from both ends so autocorrelation focuses on the
  // sustained periodic part of the waveform.
  const threshold = 0.2;
  let start = 0;
  let end = size - 1;
  for (let i = 0; i < size / 2; i++) {
    if (Math.abs(buffer[i]) >= threshold) {
      start = i;
      break;
    }
  }
  for (let i = 1; i < size / 2; i++) {
    if (Math.abs(buffer[size - i]) >= threshold) {
      end = size - i;
      break;
    }
  }

  const trimmed = buffer.subarray(start, end);
  const n = trimmed.length;
  if (n < 2) return -1;

  const correlations = new Float32Array(n);
  for (let lag = 0; lag < n; lag++) {
    let sum = 0;
    for (let i = 0; i < n - lag; i++) sum += trimmed[i] * trimmed[i + lag];
    correlations[lag] = sum;
  }

  // Skip the initial downslope from lag 0 so we find the *first* real peak
  // (the fundamental period) rather than lag 0 itself.
  let d = 0;
  while (d + 1 < n && correlations[d] > correlations[d + 1]) d++;

  let maxPos = -1;
  let maxVal = -Infinity;
  for (let i = d; i < n; i++) {
    if (correlations[i] > maxVal) {
      maxVal = correlations[i];
      maxPos = i;
    }
  }
  if (maxPos <= 0) return -1;

  // Parabolic interpolation around the peak for sub-sample accuracy.
  const x1 = correlations[maxPos - 1] ?? correlations[maxPos];
  const x2 = correlations[maxPos];
  const x3 = correlations[maxPos + 1] ?? correlations[maxPos];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  const refinedPos = a !== 0 ? maxPos - b / (2 * a) : maxPos;

  if (refinedPos <= 0) return -1;
  const frequency = sampleRate / refinedPos;
  if (frequency < MIN_FREQUENCY || frequency > MAX_FREQUENCY) return -1;
  return frequency;
}

export interface PitchResult {
  frequency: number;
  note: NoteInfo;
}

export interface PitchFrame {
  /** RMS level of the analysed frame, roughly 0..1. Reported every frame
   *  regardless of whether a clean pitch was found, so callers can use it for
   *  onset/strum detection (a chord strum's noisy attack often defeats the
   *  monophonic pitch tracker even though the mic level clearly spikes). */
  level: number;
  pitch: PitchResult | null;
}

export type PitchCallback = (frame: PitchFrame) => void;

/** Wraps mic capture + the autocorrelation detector into a simple start/stop API. */
export class PitchDetector {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private stream: MediaStream | null = null;
  private buffer: Float32Array<ArrayBuffer>;
  private rafId: number | null = null;
  private readonly onPitch: PitchCallback;

  constructor(onPitch: PitchCallback, fftSize = 2048) {
    this.onPitch = onPitch;
    this.buffer = new Float32Array(fftSize);
  }

  get isActive(): boolean {
    return this.audioContext !== null;
  }

  async start(): Promise<void> {
    if (this.isActive) return;
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    this.audioContext = new AudioContext();
    const source = this.audioContext.createMediaStreamSource(this.stream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = this.buffer.length;
    source.connect(this.analyser);
    this.tick();
  }

  stop(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.stream?.getTracks().forEach((track) => track.stop());
    void this.audioContext?.close();
    this.audioContext = null;
    this.analyser = null;
    this.stream = null;
  }

  private tick = (): void => {
    if (!this.analyser || !this.audioContext) return;
    this.analyser.getFloatTimeDomainData(this.buffer);

    let rms = 0;
    for (let i = 0; i < this.buffer.length; i++) rms += this.buffer[i] * this.buffer[i];
    rms = Math.sqrt(rms / this.buffer.length);

    const frequency = autoCorrelate(this.buffer, this.audioContext.sampleRate);
    const pitch = frequency > 0 ? { frequency, note: frequencyToNote(frequency) } : null;
    this.onPitch({ level: rms, pitch });
    this.rafId = requestAnimationFrame(this.tick);
  };
}
