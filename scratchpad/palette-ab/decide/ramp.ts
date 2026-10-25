// Can the data ramp's middle stops move so that both the approved and the chosen fills stay at least as far from every
// data-mode color as the approved pair does today (7.2 normal, 2.2 deficient), with R16's checks (L* kept per stop,
// adjacent stops >= 13 apart for normal vision, every mode color 20/12 direct against both grounds)? Grid over OKLCH C and h
// of stops 3 and 4 at their own lightness. Run from the repo root: npx tsx ramp.ts
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as E from './ev.ts';
const here = dirname(fileURLToPath(import.meta.url));
const PALS: Record<string, E.Pal> = JSON.parse(readFileSync(join(here, 'palettes.json'), 'utf8'));
const A = PALS.approved!, B = PALS.chosen!;
const [L3] = E.oklch('#C4808E'), [L4] = E.oklch('#E6AC6E');
let best: { s: number; H: string[]; a: string; b: string } | null = null;
const cand = (L: number) => { const out: string[] = []; for (let C = 0.02; C <= 0.16; C += 0.02) for (let h = 0; h < 360; h += 15) { const x = E.fromOklch(L, C, h); if (x) out.push(x); } return out; };
// prefilter: a stop must itself keep 7.2 / 2.2 from every fill of both palettes
const keep = (x: string) => E.T.every((t) => E.dN(x, A[t]) >= 7.2 && E.dN(x, B[t]) >= 7.2 && E.dC(x, A[t]) >= 2.2 && E.dC(x, B[t]) >= 2.2);
const c3 = cand(L3).filter(keep), c4 = cand(L4).filter(keep); console.error('candidates', c3.length, c4.length);
for (const s3 of c3) for (const s4 of c4) {
  const H = ['#4C5E96', '#8170AC', s3, s4, '#F8E6A6'];
  if (H.slice(1).some((h, k) => E.dN(H[k]!, h) < 13)) continue;
  const ra = E.modesVsFills(A, E.APPROVED_BASE, H), rb = E.modesVsFills(B, E.APPROVED_BASE, H);
  const s = Math.min(ra.wN.v / 7.2, rb.wN.v / 7.2, ra.wC.v / 2.2, rb.wC.v / 2.2);
  if (!best || s > best.s) { const gm = E.groundsVsModes(E.APPROVED_BASE, H); if (gm.granite!.direct === gm.granite!.tot && gm.mere!.direct === gm.mere!.tot) best = { s, H, a: `${E.f1(ra.wN.v)}/${E.f1(ra.wC.v)}`, b: `${E.f1(rb.wN.v)}/${E.f1(rb.wC.v)}` }; }
}
console.log(JSON.stringify(best));
