// Local refinement of a hand-picked palette in OKLCH, inside a small box around the start values.
// Objective (maximize): min over texture-distinct pairs (dN/15, dCVD/10), twin pairs (dN/20, dCVD/12) and wild grounds vs fills
// (dN/20, dCVD/12), each across every approved Ownership state pair; band rule fails are penalized; mean chroma <= cap.
// Usage: npx tsx refine.ts '<palette json>' <chroma fraction cap> <seed> <iters>
import { over, BRIGHT, TERRAINS, type T, type Pal, oklch, fromOklch, ALL_BANNERS, keylineFor, labAs, deltaE2000, MAP_KEYLINES, STATES, stOver, f1, f3 } from './lib';
import type { Lab, Vision } from './colorMath';
import { mulberry } from './rng';
import { TWINS } from './eval';
const start = JSON.parse(process.argv[2]!) as Pal, CAP = +(process.argv[3] ?? 0.5), SEED = +(process.argv[4] ?? 1), ITERS = +(process.argv[5] ?? 4000);
const BUDGET = (CAP * TERRAINS.reduce((s, t) => s + oklch(BRIGHT[t]).C, 0)) / 7;
const V: Vision[] = ['normal', 'protan', 'deutan', 'tritan'];
const labs = (h: string) => V.map((v) => labAs(h, v));
const HEAT = ['#4C5E96', '#8170AC', '#C4808E', '#E6AC6E', '#F8E6A6'];
const heatAt = (t: number) => { const x = Math.max(0, Math.min(0.9999, t)) * 4, k = Math.floor(x), f = x - k; return over(HEAT[k]!, HEAT[k + 1]!, f); };
const MB = ['#CACDC3', '#CEC0A9', '#79786B', '#7E7767', '#9DA1A3', '#6F7A77', '#98908E'];
const DATA = [...Array.from({ length: 41 }, (_, i) => heatAt(i / 40)), ...MB].map((h) => labAs(h, 'normal'));
const DATA_MIN = +(process.env.DATA_MIN ?? 0);
const BL = ALL_BANNERS.map(labs), WL = ['#2A292C', '#24222A'].map(labs);
const KL: Record<string, Lab[]> = { [MAP_KEYLINES.light]: labs(MAP_KEYLINES.light), [MAP_KEYLINES.dark]: labs(MAP_KEYLINES.dark) };
const dn = (a: Lab[], b: Lab[]) => deltaE2000(a[0]!, b[0]!);
const dc = (a: Lab[], b: Lab[]) => Math.min(deltaE2000(a[1]!, b[1]!), deltaE2000(a[2]!, b[2]!), deltaE2000(a[3]!, b[3]!));
type P = Record<T, { L: number; C: number; h: number }>;
const p0 = {} as P; for (const t of TERRAINS) { const o = oklch(start[t]); p0[t] = { L: o.L, C: o.C, h: o.h }; }
const BOUNDS = JSON.parse(process.env.BOUNDS ?? '{}') as Record<string, Record<string, [number, number]>>;
const box = (t: T, k: 'L' | 'C' | 'h', v: number) => { const d = { L: 0.03, C: 0.012, h: 10 }[k]; const c = p0[t][k]; let lo = c - d, hi = c + d; const b = BOUNDS[t]?.[k]; if (b) { lo = Math.max(lo, b[0]); hi = Math.min(hi, b[1]); } return Math.min(hi, Math.max(lo, k === 'C' ? Math.max(0.008, v) : v)); };
const hexOf = (p: P) => { const o = {} as Pal; for (const t of TERRAINS) { const h = fromOklch(p[t].L, p[t].C, p[t].h); if (!h) return null; o[t] = h; } return o; };
function score(pal: Pal): { s: number; why: string } {
  const meanC = TERRAINS.reduce((s, t) => s + oklch(pal[t]).C, 0) / 7; if (meanC > BUDGET) return { s: -100, why: 'chroma' };
  let m = 1e9, why = ''; let pen = 0;
  const SV = {} as Record<T, Lab[][]>; for (const t of TERRAINS) SV[t] = STATES.map((st) => labs(stOver(pal[t], st, pal[t])));
  const upd = (v: number, w: string) => { if (v < m) { m = v; why = w; } };
  for (let i = 0; i < 7; i++) for (let j = i + 1; j < 7; j++) { const a = TERRAINS[i]!, b = TERRAINS[j]!, tw = TWINS.has(`${a}/${b}`), rn = tw ? 20 : +(process.env.DN ?? 15), rc = tw ? 12 : +(process.env.DC ?? 10);
    for (const x of SV[a]) for (const y of SV[b]) { upd(dn(x, y) / rn, `${a}/${b} N`); upd(dc(x, y) / rc, `${a}/${b} C`); } }
  for (const t of TERRAINS) { const fl = SV[t][0]!, k = keylineFor(pal[t]), kl = KL[k]!;
    for (const w of WL) for (const x of SV[t]) { upd(dn(w, x) / 20, `wild/${t} N`); upd(dc(w, x) / 12, `wild/${t} C`); }
    if (DATA_MIN) for (const d of DATA) upd(deltaE2000(d, fl[0]!) / DATA_MIN, `data/${t}`);
    const kOk = dn(kl, fl) >= 20 && dc(kl, fl) >= 12; for (const b of BL) { if (dn(b, fl) >= 20 && dc(b, fl) >= 12) continue; if (kOk && dn(kl, b) >= 20 && dc(kl, b) >= 12) continue; pen++; } }
  return { s: m - pen, why };
}
const R = mulberry(SEED);
let p = JSON.parse(JSON.stringify(p0)) as P, best = score(hexOf(p)!);
console.log(`start ${f3(best.s)} (${best.why})`);
for (let it = 0; it < ITERS; it++) {
  const t = TERRAINS[Math.floor(R() * 7)]!, q = JSON.parse(JSON.stringify(p)) as P, k = (['L', 'C', 'h'] as const)[Math.floor(R() * 3)]!, st = it < ITERS / 2 ? 1 : 0.35;
  q[t][k] = box(t, k, q[t][k] + (R() - 0.5) * { L: 0.02, C: 0.008, h: 6 }[k] * st);
  const pal = hexOf(q); if (!pal) continue; const s = score(pal); if (s.s >= best.s) { p = q; best = s; }
}
const pal = hexOf(p)!;
console.log(`end ${f3(best.s)} (${best.why}); mean C ${f3(TERRAINS.reduce((s, t) => s + oklch(pal[t]).C, 0) / 7)} cap ${f3(BUDGET)}`);
for (const t of TERRAINS) { const o = oklch(pal[t]); console.log(`${t.padEnd(10)} ${start[t]} -> ${pal[t]}  L ${f3(o.L)} C ${f3(o.C)} h ${f1(o.h)}`); }
console.log(JSON.stringify(pal));
