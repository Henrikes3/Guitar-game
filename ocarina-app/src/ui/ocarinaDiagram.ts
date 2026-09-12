import type { Fingering } from '../ocarina/fingering';

const WIDTH = 220;
const HEIGHT = 150;

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Renders a plain, schematic pendant-ocarina outline (10 front holes in a
 *  row + 2 thumb holes shown separately, since those sit on the back and
 *  aren't visible from this angle). Filled circle = covered, outlined = open. */
export function renderOcarinaDiagram(fingering: Fingering, label: string): string {
  const frontHoleRadius = 8;
  const bodyCenterY = 65;
  const frontY = bodyCenterY;
  const marginX = 34;
  const usableWidth = WIDTH - marginX * 2;
  const frontX = (i: number) => marginX + (usableWidth * (i + 0.5)) / 10;

  let svg = `<svg viewBox="0 0 ${WIDTH} ${HEIGHT}" class="ocarina-diagram" role="img" aria-label="Dedilhado para ${escapeXml(label)}">`;

  // Generic pendant-ocarina body outline (a plain rounded oval - not any
  // specific instrument or brand).
  svg += `<ellipse cx="${WIDTH / 2}" cy="${bodyCenterY}" rx="${WIDTH / 2 - 12}" ry="42" class="ocarina-body" />`;
  // Windway/mouthpiece nub at the top.
  svg += `<rect x="${WIDTH / 2 - 10}" y="10" width="20" height="14" rx="5" class="ocarina-mouthpiece" />`;

  for (let i = 0; i < 10; i++) {
    const covered = fingering.covered[i];
    svg += `<circle cx="${frontX(i)}" cy="${frontY}" r="${frontHoleRadius}" class="${covered ? 'ocarina-hole-covered' : 'ocarina-hole-open'}" />`;
  }

  svg += `<text x="${WIDTH / 2}" y="${HEIGHT - 6}" class="ocarina-caption" text-anchor="middle">furos frontais</text>`;

  svg += '</svg>';
  return svg;
}

/** Small side diagram for the two thumb holes (back of the instrument). */
export function renderThumbHoles(fingering: Fingering): string {
  const width = 90;
  const height = 60;
  const radius = 9;
  const rightCovered = fingering.covered[10];
  const leftCovered = fingering.covered[11];

  return `
    <svg viewBox="0 0 ${width} ${height}" class="ocarina-thumb-diagram" role="img" aria-label="Furos dos polegares (parte de trás)">
      <circle cx="${width * 0.32}" cy="${height / 2}" r="${radius}" class="${leftCovered ? 'ocarina-hole-covered' : 'ocarina-hole-open'}" />
      <circle cx="${width * 0.68}" cy="${height / 2}" r="${radius}" class="${rightCovered ? 'ocarina-hole-covered' : 'ocarina-hole-open'}" />
      <text x="${width / 2}" y="${height - 4}" class="ocarina-caption" text-anchor="middle">polegares (atrás)</text>
    </svg>
  `;
}
