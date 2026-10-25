import { readFileSync } from 'node:fs';
import { contrastRatio } from './colors';
const S = JSON.parse(readFileSync(process.argv[2]!, 'utf8'));
const E = JSON.parse(readFileSync(process.argv[2]!.replace('/samples/', '/dump/'), 'utf8'));
const nm = (i: number) => (E.provs.find((p: { i: number }) => p.i === i) || { name: i }).name;
for (const h of S.hair) { if (h.type !== 'internal' || (h.fog[0] && h.fog[1])) continue; let best = 0, bk = 0; for (let k = 0; k <= 12; k++) { const c = contrastRatio(h.lines[14 + k], h.land[14 + k]); if (c > best) { best = c; bk = k; } }
  if (best < 3.2) console.log(nm(h.i), nm(h.j), h.ulT, h.lrT, h.fog, 'best', best.toFixed(2), 'at', bk / 2, 'px', 'lines', h.lines.slice(8, 28).join(' '), '\n  land ', h.land.slice(8, 28).join(' ')); }
