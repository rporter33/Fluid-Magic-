// Random-restart hill climb over OKLCH (L, C, h) per terrain for a muted palette.
// Hard constraints: mean OKLCH C <= budget; per-terrain hue windows (identity); band rule on fills (all 11 banners, 20/12);
// wild grounds >= 20/12 from every fill; keyline contrast >= 3:1. Objective: maximize min over terrain pairs of min(dN/WN, dCVD/WC).
// Usage: npx tsx search.ts <budget fraction> <seed> <WN> <WC> <restarts> <iters>
import { BRIGHT, TERRAINS, type T, type Pal, oklch, fromOklch, ALL_BANNERS, keylineFor, wcag, f1, f3, closest, VISIONS, labAs, deltaE2000, MAP_KEYLINES } from './lib';
import type { Lab, Vision } from './colorMath';
import { mulberry } from './rng';
import { STATES, stOver } from './lib';
const A = process.argv.slice(2).map(Number);
const FR = A[0] ?? 0.6, SEED = A[1] ?? 1, WN = A[2] ?? 12, WC = A[3] ?? 8, RESTARTS = A[4] ?? 12, ITERS = A[5] ?? 1500;
const USE_STATES = (A[6] ?? 0) === 1;
const BUDGET = (FR * TERRAINS.reduce((s, t) => s + oklch(BRIGHT[t]).C, 0)) / 7;
const HUE: Record<T, [number, number]> = { plains: [100, 122], farmland: [70, 86], forest: [122, 142], hills: [62, 86], mountains: [215, 255], swamp: [188, 216], wasteland: [22, 46] };
const LR: Record<T, [number, number]> = { plains: [0.79, 0.86], farmland: [0.66, 0.79], forest: [0.35, 0.45], hills: [0.47, 0.57], mountains: [0.64, 0.75], swamp: [0.43, 0.53], wasteland: [0.57, 0.67] };
const CMIN: Record<T, number> = { plains: 0.025, farmland: 0.058, forest: 0.035, hills: 0.03, mountains: 0.012, swamp: 0.02, wasteland: 0.025 };
const CMAX: Record<T, number> = { plains: 0.042, farmland: 0.09, forest: 0.058, hills: 0.048, mountains: 0.026, swamp: 0.038, wasteland: 0.042 };
const V: Vision[] = ['normal', 'protan', 'deutan', 'tritan'];
const labs = (h: string) => V.map((v) => labAs(h, v));
const BL = ALL_BANNERS.map(labs), WL = ['#2A292C', '#24222A'].map(labs);
const KL: Record<string, Lab[]> = { [MAP_KEYLINES.light]: labs(MAP_KEYLINES.light), [MAP_KEYLINES.dark]: labs(MAP_KEYLINES.dark) };
const dn = (a: Lab[], b: Lab[]) => deltaE2000(a[0]!, b[0]!);
const dc = (a: Lab[], b: Lab[]) => Math.min(deltaE2000(a[1]!, b[1]!), deltaE2000(a[2]!, b[2]!), deltaE2000(a[3]!, b[3]!));
type P = Record<T, { L: number; C: number; h: number }>;
const hexOf = (p: P) => { const o = {} as Pal; for (const t of TERRAINS) { const h = fromOklch(p[t].L, p[t].C, p[t].h); if (!h) return null; o[t] = h; } return o; };
function score(p: P): number {
  const meanC = TERRAINS.reduce((s, t) => s + p[t].C, 0) / 7;
  if (meanC > BUDGET) return -100 - (meanC - BUDGET) * 100;
  const pal = hexOf(p); if (!pal) return -200;
  let pen = 0; const FL = {} as Record<T, Lab[]>;
  for (const t of TERRAINS) {
    const f = pal[t], k = keylineFor(f), fl = (FL[t] = labs(f)), kl = KL[k]!;
    if (wcag(k, f) < 3) pen += 1;
    for (const w of WL) pen += Math.max(0, 20 - dn(w, fl)) / 20 + Math.max(0, 12 - dc(w, fl)) / 12;
    const kOk = dn(kl, fl) >= 20 && dc(kl, fl) >= 12;
    for (const b of BL) { if (dn(b, fl) >= 20 && dc(b, fl) >= 12) continue; if (kOk && dn(kl, b) >= 20 && dc(kl, b) >= 12) continue; pen += 1; }
  }
  let m = 1e9;
  if (USE_STATES) { const SV = {} as Record<T, Lab[][]>; for (const t of TERRAINS) SV[t] = STATES.map((st) => labs(stOver(pal[t], st, pal[t])));
    for (let i = 0; i < 7; i++) for (let j = i + 1; j < 7; j++) for (const a of SV[TERRAINS[i]!]) for (const b of SV[TERRAINS[j]!]) m = Math.min(m, dn(a, b) / WN, dc(a, b) / WC); }
  else for (let i = 0; i < 7; i++) for (let j = i + 1; j < 7; j++) { const a = FL[TERRAINS[i]!], b = FL[TERRAINS[j]!]; m = Math.min(m, dn(a, b) / WN, dc(a, b) / WC); }
  return m - pen * 2;
}
const R = mulberry(SEED);
const rand = (a: number, b: number) => a + (b - a) * R();
let best: { p: P; s: number } | null = null;
for (let restart = 0; restart < RESTARTS; restart++) {
  let p = {} as P; for (const t of TERRAINS) p[t] = { L: rand(...LR[t]), C: rand(CMIN[t], CMAX[t]), h: rand(...HUE[t]) };
  let s = score(p);
  for (let it = 0; it < ITERS; it++) {
    const t = TERRAINS[Math.floor(R() * 7)]!, q = { ...p, [t]: { ...p[t] } } as P, k = R(), st = it < ITERS / 2 ? 1 : 0.3;
    if (k < 0.4) q[t].L = Math.min(LR[t][1], Math.max(LR[t][0], q[t].L + (R() - 0.5) * 0.06 * st));
    else if (k < 0.75) q[t].C = Math.min(CMAX[t], Math.max(CMIN[t], q[t].C + (R() - 0.5) * 0.02 * st));
    else q[t].h = Math.min(HUE[t][1], Math.max(HUE[t][0], q[t].h + (R() - 0.5) * 12 * st));
    const s2 = score(q); if (s2 >= s) { p = q; s = s2; }
  }
  if (!best || s > best.s) best = { p, s };
}
const pal = hexOf(best!.p)!;
console.log(`budget ${f3(BUDGET)} (x${FR}) seed ${SEED} weights ${WN}/${WC} score ${f3(best!.s)}`);
for (const t of TERRAINS) { const o = oklch(pal[t]); console.log(`${t.padEnd(10)} ${pal[t]} L ${f3(o.L)} C ${f3(o.C)} h ${f1(o.h)}`); }
for (const v of VISIONS) { const c = closest(pal, v); console.log(`closest ${v}: ${c.a}/${c.b} ${f1(c.d)}`); }
console.log(JSON.stringify(pal));
