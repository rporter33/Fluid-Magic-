// Hill-climb repair: from a palette that passes every hard constraint of search.ts (level states, wash, identity, floors), move
// one fill at a time to its OKLCH neighbours (L ±0.008, C ±0.005, h ±3 deg, one or two steps) until H13's texture floor
// (19.5 / 11.0 at today's paint amplitudes, every approved state) also holds, then keep descending the objective while every
// constraint holds. Deterministic. Run: cd /home/user/Fluid-Magic- && npx tsx <dir>/repair.ts '<palette json>' <obj rms|rmshue> <tag>
import { writeFileSync } from 'node:fs';
import {
  TERRAINS, BANNERS, STATES, stOver, over, shadeL, oklch, fromOklch, Ls, keylineFor, contrastRatio, dN, dC, passes, wcag,
  GRANITE, MERE, RIM, chroma, f1, f3, type T,
} from './lib.ts';

let P: Record<T, string> = JSON.parse(process.argv[2]!);
const OBJ = process.argv[3] ?? 'rms', tag = process.argv[4] ?? 'repair';
const REF_C: Record<T, number> = { plains: 0.086, farmland: 0.111, forest: 0.062, hills: 0.083, mountains: 0.051, swamp: 0.043, wasteland: 0.089 };
const HUE: Record<T, [number, number][]> = { plains: [[86, 136]], farmland: [[64, 92]], forest: [[100, 160]], hills: [[48, 86]], mountains: [[196, 266]], swamp: [[130, 206]], wasteland: [[14, 56], [74, 100]] };
const LSTAR: Record<T, [number, number]> = { plains: [66, 83], farmland: [58, 78], forest: [24, 42], hills: [34, 56], mountains: [52, 76], swamp: [32, 55], wasteland: [48, 72] };
const REF_H: Record<T, number> = { plains: 86, farmland: 75.4, forest: 100, hills: 71.5, mountains: 228, swamp: 130, wasteland: 74 };
const M: Record<T, number> = { plains: 3, farmland: 3, forest: 3, hills: 0, mountains: 1, swamp: 1, wasteland: 0 };
const LMAX = Ls('#E8DCC2') - 6;
const dh = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);
const cost = (t: T, hex: string) => { const [, C, h] = oklch(hex); return OBJ === 'rmshue' ? C * C * (1 + Math.sin((dh(h, REF_H[t]) * Math.PI) / 180) ** 2) : C * C; };
const total = (Q: Record<T, string>) => TERRAINS.reduce((s, t) => s + cost(t, Q[t]), 0);

const unaryMemo = new Map<string, boolean>();
function unary(t: T, hex: string) {
  const k = t + hex; const m = unaryMemo.get(k); if (m !== undefined) return m;
  const [, C, h] = oklch(hex), L = Ls(hex), c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  let ok = C >= REF_C[t] / 2 - 0.001 && HUE[t].some(([a, b]) => h >= a && h <= b) && L >= LSTAR[t][0] && L <= LSTAR[t][1] && L <= LMAX && c[0]! <= 232 && c[1]! <= 220 && c[2]! <= 194;
  const kl = keylineFor(hex); ok &&= contrastRatio(kl, hex) >= 3 && Math.max(wcag(GRANITE, hex), wcag(RIM, hex)) >= 3;
  if (ok) for (const st of STATES) { const g = stOver(hex, st, hex); for (const b of BANNERS) if (!(passes(b, g) || (passes(kl, g) && passes(kl, b)))) { ok = false; break; } if (!ok) break; for (const gr of [GRANITE, MERE]) if (!passes(gr, g)) ok = false; if (!ok) break; }
  if (ok && (process.env.INK ?? '1') === '1') ok = inkOK(t, hex);
  unaryMemo.set(k, ok); return ok;
}
// Approved ink and mark contrasts that depend on the fill (final.md §1.6, H14, §3.11 item 6): every settlement kit, the stone of
// landmarks, ruins and heroes, and the camp canvas keep one tone (faces or the ink outline) at 3:1 or more on the fill; region ink at
// 90% keeps 3:1 on the fill, its edge pool (E, E-3) and every state, in the set its bare-fill contrast puts it in.
const KITS: string[][] = [['#8F8C88', '#3A3633', '#3A3836', '#2B2A28', '#5E5953'], ['#A0785A', '#4E6B3A', '#6B4A2B', '#5E4630', '#9A958C'], ['#D8CBB0', '#C2A86B', '#9A958C', '#B9B4AA'], ['#CFC6B4', '#E8DCC5', '#9E978E'], ['#B9B4A6']];
const klit = (x: string) => over(shadeL(x, 8), '#F6D9A0', 0.12), kshd = (x: string) => over(shadeL(x, -12), '#3A4466', 0.14);
const E0: Record<T, number> = { plains: -7, farmland: -7, forest: -5, hills: -6, mountains: -7, swamp: -6, wasteland: -8 };
function inkOK(t: T, hex: string) {
  for (const tones of KITS) { const faces = tones.flatMap((x) => [x, klit(x), kshd(x)]).concat(['#1C1A17']); if (Math.max(...faces.map((x) => wcag(x, hex))) < 3) return false; }
  const dark = wcag('#F4EEDF', hex) > wcag('#2A1F14', hex), ink = dark ? '#F4EEDF' : '#2A1F14';
  for (const g0 of [hex, shadeL(hex, E0[t]), shadeL(hex, E0[t] - 3)]) for (const st of STATES) { const g = stOver(g0, st, hex); if (wcag(over(g, ink, 0.9), g) < 3) return false; }
  return true;
}
const vars = (t: T, f: string) => { const v = [f]; if (M[t]) v.push(shadeL(f, 0.55 * M[t]), shadeL(f, -0.55 * M[t])); if (t === 'mountains') v.push(over(f, '#3A4466', 0.08)); return v; };
const pairMemo = new Map<string, number>();
/** Shortfall of one terrain pair: 0 when base (20/12, every state) and H13 (19.5/11.0 on variants, every state) both hold. */
function pairShort(A: T, a: string, B: T, b: string) {
  const k = a < b ? a + b : b + a; const m = pairMemo.get(k); if (m !== undefined) return m;
  let s = 0;
  for (const sa of STATES) for (const sb of STATES) { const x = stOver(a, sa, a), y = stOver(b, sb, b); s += Math.max(0, 20 - dN(x, y)) + Math.max(0, (12 - dC(x, y)) * (20 / 12)); }
  const va = vars(A, a), vb = vars(B, b);
  for (const a0 of va) for (const b0 of vb) for (const sa of STATES) for (const sb of STATES) { const x = stOver(a0, sa, a), y = stOver(b0, sb, b); s += Math.max(0, 19.5 - dN(x, y)) + Math.max(0, (11 - dC(x, y)) * (20 / 12)); }
  pairMemo.set(k, s); return s;
}
const short = (Q: Record<T, string>) => { let s = TERRAINS.reduce((u, t) => u + (unary(t, Q[t]) ? 0 : 5), 0); for (let i = 0; i < 7; i++) for (let j = i + 1; j < 7; j++) s += pairShort(TERRAINS[i]!, Q[TERRAINS[i]!], TERRAINS[j]!, Q[TERRAINS[j]!]); return s; };
function neighbours(t: T, hex: string) {
  const [L, C, h] = oklch(hex); const out = new Set<string>();
  for (const s of unary(t, hex) ? [1, 2] : [1, 2, 3, 4, 5]) for (const dl of [-1, 0, 1]) for (const dc of [-1, 0, 1]) for (const dhh of [-1, 0, 1]) { if (!dl && !dc && !dhh) continue; const x = fromOklch(L + s * dl * 0.008, Math.max(0, C + s * dc * 0.005), h + s * dhh * 3); if (x && x !== hex && unary(t, x)) out.add(x); }
  return [...out];
}
for (const t of TERRAINS) if (!unary(t, P[t])) console.log(`warning: ${t} ${P[t]} fails a unary constraint at the start`);
let S = short(P), Cst = total(P);
console.log(`[${tag}] start: shortfall ${f3(S)}, cost ${Cst.toExponential(4)}, mean C ${f3(TERRAINS.reduce((s, t) => s + oklch(P[t])[1], 0) / 7)}`);
for (let step = 0; step < 400; step++) {
  let best: { t: T; hex: string; S: number; C: number } | null = null;
  for (const t of TERRAINS) for (const x of neighbours(t, P[t])) {
    const Q = { ...P, [t]: x }; const s = short(Q), c = total(Q);
    const better = S > 1e-9 ? s < (best ? best.S : S) - 1e-9 || (best && Math.abs(s - best.S) < 1e-9 && c < best.C) : s <= 1e-9 && c < (best ? best.C : Cst) - 1e-12;
    if (better) best = { t, hex: x, S: s, C: c };
  }
  if (!best) break;
  P = { ...P, [best.t]: best.hex }; S = best.S; Cst = best.C;
  if (step % 5 === 0 || S <= 1e-9) console.log(`  step ${step}: ${best.t} -> ${best.hex}; shortfall ${f3(S)}, mean C ${f3(TERRAINS.reduce((s, t) => s + oklch(P[t])[1], 0) / 7)}`);
}
console.log(`[${tag}] end: shortfall ${f3(S)} (${S <= 1e-9 ? 'every constraint and H13 hold' : 'H13 not reached'}), mean OKLCH C ${f3(TERRAINS.reduce((s, t) => s + oklch(P[t])[1], 0) / 7)}, mean C*ab ${f1(TERRAINS.reduce((s, t) => s + chroma(P[t]), 0) / 7)}`);
for (const t of TERRAINS) { const [L, C, h] = oklch(P[t]); console.log(`  ${t.padEnd(10)} ${P[t]}  OKLCH ${f3(L)} ${f3(C)} ${f1(h)}  L* ${f1(Ls(P[t]))} C* ${f1(chroma(P[t]))}`); }
writeFileSync(new URL(`./result-${tag}.json`, import.meta.url), JSON.stringify({ tag, obj: OBJ, shortfall: S, fills: P }, null, 1));
