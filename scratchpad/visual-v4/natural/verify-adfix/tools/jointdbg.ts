import { readFileSync } from 'node:fs';
import { contrastRatio } from './colors';
for (const f of process.argv.slice(2)) {
  const S = JSON.parse(readFileSync(f, 'utf8')); const E = JSON.parse(readFileSync(f.replace('/samples/', '/dump/'), 'utf8'));
  const len = (i: number, j: number) => { const e = E.edges.find((q: { i: number; j: number }) => q.i === i && q.j === j); return Math.hypot(e.b[0] - e.a[0], e.b[1] - e.a[1]); };
  for (const h of S.hair) { if (h.fog[0] && h.fog[1]) continue; const rng = h.type === 'neutral' ? [-6, 6] : [0, 12], lim = h.type === 'neutral' ? 2.3 : 3.2; let best = 0; for (let k = rng[0]; k <= rng[1]; k++) best = Math.max(best, contrastRatio(h.lines[14 + k], h.land[14 + k]));
    if (best < lim) { const L = len(h.i, h.j), nseg = Math.ceil(L / (0.1 * E.info.Dpx) - 1e-9), pos = h.t * nseg; console.log(f.split('/').pop(), h.type, best.toFixed(2), 'edge px', L.toFixed(0), 'segments', nseg, 'position in segments', pos.toFixed(2), 'distance to nearest joint px', (Math.abs(pos - Math.round(pos)) * L / nseg).toFixed(1)); } }
}
