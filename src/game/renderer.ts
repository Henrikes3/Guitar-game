import type { EngineSnapshot } from './engine';
import type { Chart } from './chart';
import { STRING_COUNT, STRING_DISPLAY_NAMES } from '../guitar/fretboard';
import { STRING_COLORS } from '../ui/theme';
import { CHORDS } from '../guitar/chords';

const PIXELS_PER_SECOND = 210;
const HIT_LINE_RATIO = 0.8;
const NOTE_RADIUS = 24;
const VISIBLE_PAST = 0.6; // seconds of history still drawn below the hit line
const VISIBLE_FUTURE = 4.2; // seconds of look-ahead drawn above the hit line

/** Draws the falling-notes / chord highway onto a canvas. Pure presentation —
 *  all timing/scoring logic lives in GameEngine; this just visualizes an
 *  EngineSnapshot every frame. */
export class HighwayRenderer {
  private ctx: CanvasRenderingContext2D;

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context indisponível');
    this.ctx = ctx;
  }

  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.max(1, Math.round(rect.width * dpr));
    this.canvas.height = Math.max(1, Math.round(rect.height * dpr));
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private get cssWidth(): number {
    return this.canvas.getBoundingClientRect().width;
  }

  private get cssHeight(): number {
    return this.canvas.getBoundingClientRect().height;
  }

  private laneX(stringIndex: number, width: number): number {
    const margin = width * 0.08;
    const usable = width - margin * 2;
    return margin + (usable * (stringIndex + 0.5)) / STRING_COUNT;
  }

  render(chart: Chart, snapshot: EngineSnapshot): void {
    const width = this.cssWidth;
    const height = this.cssHeight;
    const ctx = this.ctx;
    const hitLineY = height * HIT_LINE_RATIO;

    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = '#0b0f1a';
    ctx.fillRect(0, 0, width, height);

    if (chart.mode === 'notes') {
      this.drawLanes(width, height, hitLineY);
      this.drawNotes(chart, snapshot, width, hitLineY);
    } else {
      this.drawChordLane(width, height, hitLineY);
      this.drawChords(snapshot, width, hitLineY);
    }

    this.drawHitLine(width, hitLineY);

    if (snapshot.elapsed < 0) {
      this.drawCountdown(width, height, snapshot.elapsed);
    }
  }

  private drawLanes(width: number, height: number, hitLineY: number): void {
    const ctx = this.ctx;
    for (let s = 0; s < STRING_COUNT; s++) {
      const x = this.laneX(s, width);
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      ctx.fillStyle = STRING_COLORS[s];
      ctx.globalAlpha = 0.85;
      ctx.font = '600 15px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(STRING_DISPLAY_NAMES[s], x, hitLineY + 34);
      ctx.globalAlpha = 1;
    }
  }

  private drawChordLane(width: number, height: number, hitLineY: number): void {
    const ctx = this.ctx;
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    const margin = width * 0.08;
    ctx.strokeRect(margin, 0, width - margin * 2, height);
    void hitLineY;
  }

  private drawHitLine(width: number, hitLineY: number): void {
    const ctx = this.ctx;
    const margin = width * 0.06;
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(margin, hitLineY);
    ctx.lineTo(width - margin, hitLineY);
    ctx.stroke();
  }

  private drawNotes(chart: Chart, snapshot: EngineSnapshot, width: number, hitLineY: number): void {
    const ctx = this.ctx;
    for (const state of snapshot.notes) {
      const dt = state.event.time - snapshot.elapsed;
      if (dt > VISIBLE_FUTURE || dt < -VISIBLE_PAST) continue;
      const x = this.laneX(state.event.string, width);
      const y = hitLineY - dt * PIXELS_PER_SECOND;
      const color = STRING_COLORS[state.event.string];

      ctx.beginPath();
      ctx.arc(x, y, NOTE_RADIUS, 0, Math.PI * 2);
      if (state.judged === 'hit') {
        ctx.fillStyle = 'rgba(74, 222, 128, 0.35)';
        ctx.fill();
        ctx.strokeStyle = '#4ade80';
      } else if (state.judged === 'miss') {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.18)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
      } else {
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      }
      ctx.lineWidth = 2.5;
      ctx.stroke();

      if (state.judged !== 'miss') {
        ctx.fillStyle = state.judged === 'hit' ? '#e2fbe8' : '#0b0f1a';
        ctx.font = '700 17px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(state.event.fret), x, y + 1);
        ctx.textBaseline = 'alphabetic';
      }
    }
    void chart;
  }

  private drawChords(snapshot: EngineSnapshot, width: number, hitLineY: number): void {
    const ctx = this.ctx;
    const margin = width * 0.08;
    const laneWidth = width - margin * 2;
    for (const state of snapshot.chords) {
      const dt = state.event.time - snapshot.elapsed;
      const dtEnd = state.event.time + state.event.holdDuration - snapshot.elapsed;
      if (dt > VISIBLE_FUTURE || dtEnd < -VISIBLE_PAST) continue;
      const yTop = hitLineY - dtEnd * PIXELS_PER_SECOND;
      const yBottom = hitLineY - dt * PIXELS_PER_SECOND;
      const chord = CHORDS[state.event.chordId];

      let fill = 'rgba(56, 189, 248, 0.25)';
      let stroke = 'rgba(56, 189, 248, 0.9)';
      if (state.judged === 'hit') {
        fill = 'rgba(74, 222, 128, 0.3)';
        stroke = '#4ade80';
      } else if (state.judged === 'miss') {
        fill = 'rgba(148, 163, 184, 0.15)';
        stroke = 'rgba(148, 163, 184, 0.6)';
      }

      const radius = 14;
      ctx.beginPath();
      ctx.roundRect(margin, Math.min(yTop, yBottom), laneWidth, Math.max(6, Math.abs(yBottom - yTop)), radius);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Stick the label to the top of the canvas while the bar is tall
      // enough to have scrolled off both edges, so the chord name stays
      // readable instead of drifting off-screen above the canvas. Only once
      // a meaningful slice of the bar is actually on screen, so a chord
      // that's still fully above the fold doesn't show its label early.
      const barTop = Math.min(yTop, yBottom);
      const barBottom = Math.max(yTop, yBottom);
      if (barBottom > 40) {
        const labelY = barTop < 0 ? Math.min(34, barBottom - 12) : barTop + 34;
        ctx.fillStyle = '#f8fafc';
        ctx.font = '700 26px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(chord?.name ?? state.event.chordId, width / 2, labelY);
      }
    }
  }

  private drawCountdown(width: number, height: number, elapsed: number): void {
    const ctx = this.ctx;
    const secondsLeft = Math.ceil(-elapsed);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#f8fafc';
    ctx.font = '800 72px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(secondsLeft > 0 ? String(secondsLeft) : 'Vai!', width / 2, height / 2);
    ctx.textBaseline = 'alphabetic';
  }
}
