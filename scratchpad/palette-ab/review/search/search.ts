// Synthesis search: the palette nearest a target look (by CIEDE2000) that keeps every hard constraint of the strict
// proposal: the docs/09 rule on raw fills, the band rule for all 11 banners on every painted variant and state and the
// deepest pool point, the approved Ownership states at 20/12, H13's 19.5/11.0 at v3's mottle, both wild grounds at
// 20/12, region ink at 90% >= 3, kits >= 3, data-mode colors no closer to the fills than today (7.2 / 2.2, approved
// MODE_BASE and ramp), the keyline and label-ink sets unchanged, and tracks no worse than a floor.
// Deterministic: a seeded (1+1) annealer over CIELAB, one fill moved per step, with incremental re-evaluation.
// Run from the repo root: npx tsx search.ts <target-name> <start-name> <seed> <iters> [out.json] [weights-json]
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { labAs, deltaE2000, type Vision } from './colorMath.ts';
import * as E from './ev.ts';
const { T } = E; type Pal = E.Pal; type Terr = E.Terr;
const here = dirname(fileURLToPath(import.meta.url));
const PALS: Record<string, Pal> = JSON.parse(readFileSync(join(here, 'palettes.json'), 'utf8'));
const [tgtName = 'texture', startName = 'texture', seedS = '1', itS = '20000', outPath, wS] = process.argv.slice(2);
const TGT = PALS[tgtName]!; const START = PALS[startName]!;
const W: Record<Terr, number> = { plains: 1, farmland: 1, forest: 1, hills: 1, mountains: 1, swamp: 1, wasteland: 1, ...(wS ? JSON.parse(wS) : {}) };
const MARGIN = 0.15; // margin over every ΔE threshold, so rounding never decides a pass
const VIS: Vision[] = ['normal', 'protan', 'deutan', 'tritan'];
type Labs = [number, number, number][]; // per vision
const labs = (h: string): Labs => VIS.map((v) => labAs(h, v) as [number, number, number]);
const BAN = E.BANNERS.map((b) => ({ b, L: labs(b) }));
const GR = [E.GRANITE, E.MERE].map(labs);
const de = (a: Labs, b: Labs, v: number) => deltaE2000(a[v]!, b[v]!);
const short = (a: Labs, b: Labs, n: number, c: number) => { const x = n + MARGIN - de(a, b, 0); let s = x > 0 ? x : 0; for (let v = 1; v < 4; v++) { const y = c + MARGIN - de(a, b, v); if (y > s) s = y; } return s; };
// mode colors (approved MODE_BASE frozen, approved ramp at 0.05 steps)
// the heat ramp is handled apart (decision.md: the 4th stop); here only the frozen bases, which Dominion and Springs show
const CLOTHMIN = Number(process.env.CLOTHMIN ?? 0);
const HEATON = process.env.HEAT === '1'; // also keep the fills 7.2 / 2.2 from every step of the approved ramp
const MODES = (() => { const m = E.modeColors(E.APPROVED_BASE); return [...m.bases, ...(HEATON ? m.heatC : [])].map(labs); })();

interface FillData { hex: string; flat: Labs[]; h13: Labs[]; band: Labs[]; key: Labs; own: number }
function prep(t: Terr, f: string): FillData {
  const flat = E.STATES.map((s) => labs(E.stOver(f, s, f)));
  const hv = E.h13Vars()(t, f), h13 = E.STATES.flatMap((s) => hv.map((x) => labs(E.stOver(x, s, f))));
  const bandC = E.STATES.flatMap((s) => [...E.paintVars(t, f), E.poolMax(f)].map((x) => E.stOver(x, s, f)));
  const band = bandC.map(labs), key = labs(E.keylineFor(f));
  let own = 0;
  // band rule, every banner on every painted variant, state and the deepest pool point
  for (const g of band) for (const B of BAN) { const d = short(B.L, g, 20, 12); if (d > 0) { const k = Math.max(short(key, g, 20, 12), short(key, B.L, 20, 12)); own += Math.min(d, k) ** 2; } }
  // optional: no fill within CLOTHMIN (normal vision) of the cloth, so no province reads as bare margin (approved min 13.5)
  if (CLOTHMIN) own += Math.max(0, CLOTHMIN + MARGIN - de(labs(E.CLOTH), flat[0]!, 0)) ** 2;
  // wild grounds vs flat fills in every state
  for (const g of GR) for (const x of flat) own += short(g, x, 20, 12) ** 2;
  // data modes no closer than today's floor (7.2 normal, 2.2 deficient)
  for (const m of MODES) own += short(m, flat[0]!, 7.2, 2.2) ** 2;
  // ink (WCAG), scaled so 0.1 of contrast weighs like 1 ΔE
  const hinge = (x: number, need: number) => (x < need ? ((need - x) * 10) ** 2 : 0);
  const allG = E.STATES.flatMap((s) => E.paintVars(t, f).map((x) => E.stOver(x, s, f)));
  own += hinge(Math.min(...allG.map((g) => E.regionInk(t, g))), 3.02);
  for (const tones of Object.values(E.KITS)) own += hinge(E.kitBest(tones, f), 3.02);
  own += hinge(E.wcag(E.keylineFor(f), f), 4.0);
  own += hinge(Math.max(E.wcag(E.GRANITE, f), E.wcag(E.RIM, f)), 3.5);
  const tr = E.track(t, f); own += hinge(tr.avg, 1.8) + hinge(Math.min(...allG.map((g) => E.track(t, g).peak)), 2.5);
  // sets unchanged: label ink (DARK_T) and the keyline per terrain
  const dark = E.DARK_T.has(t), lightWins = E.wcag('#F4EEDF', f) / E.wcag('#2A1F14', f);
  own += dark ? hinge(lightWins, 1.15) : hinge(1 / lightWins, 1.15);
  const keyDark = E.keylineFor(f) === E.MAP_KEYLINES.dark, wasDark = E.keylineFor(PALS.approved![t]) === E.MAP_KEYLINES.dark; if (keyDark !== wasDark) own += 100;
  return { hex: f, flat, h13, band, key, own };
}
function pairPen(a: FillData, b: FillData) {
  let p = 0;
  // raw fills (the repo test)
  p += short(a.flat[0]!, b.flat[0]!, 20, 12) ** 2;
  for (const x of a.flat) for (const y of b.flat) p += short(x, y, 20, 12) ** 2;
  for (const x of a.h13) for (const y of b.h13) p += short(x, y, 19.5, 11.0) ** 2;
  return p;
}
// objective
const tgtL = T.map((t) => labs(TGT[t]));
// the objective's distance: CIEDE2000 with a lightness weight kL (KL=2 lets lightness move at half cost, keeping hue and chroma)
const KL = Number(process.env.KL ?? 1);
const dObj = (a: readonly [number, number, number], b: readonly [number, number, number]) => KL === 1 ? deltaE2000(a, b) : deltaE2000([50 + (a[0] - 50) / KL, a[1], a[2]], [50 + (b[0] - 50) / KL, b[1], b[2]]);
const dist = (k: number, hex: string) => W[T[k]!] * dObj(labAs(hex, 'normal'), tgtL[k]![0]) ** 2;
const LAMBDA = 400;
let rs = Number(seedS) >>> 0 || 1; const R = () => { rs = (rs + 0x6d2b79f5) >>> 0; let t = rs; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const gauss = () => { let u = 0, v = 0; while (u === 0) u = R(); v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const toHexLab = (L: number, a: number, b: number) => { const c = E.lab2rgb([L, a, b]); if (c.some((x) => x < -0.5 || x > 255.5)) return null; return E.rgb2hex(c); };

const cur: FillData[] = T.map((t) => prep(t, START[t]));
const PP: number[][] = T.map(() => T.map(() => 0));
for (let i = 0; i < 7; i++) for (let j = i + 1; j < 7; j++) PP[i]![j] = PP[j]![i] = pairPen(cur[i]!, cur[j]!);
const pen = () => { let p = 0; for (let i = 0; i < 7; i++) { p += cur[i]!.own; for (let j = i + 1; j < 7; j++) p += PP[i]![j]!; } return p; };
const obj = () => T.reduce((s, _t, k) => s + dist(k, cur[k]!.hex), 0) + LAMBDA * pen();
let O = obj(); const iters = Number(itS);
let best = { O, pen: pen(), pal: T.map((_t, k) => cur[k]!.hex) };
for (let it = 0; it < iters; it++) {
  const frac = it / iters, sigma = 4 * (1 - frac) + 0.4, temp = 50 * (1 - frac) ** 3;
  const k = Math.floor(R() * 7); const L0 = E.rgb2lab(E.hex2rgb(cur[k]!.hex));
  const hx = toHexLab(L0[0]! + sigma * gauss(), L0[1]! + sigma * gauss(), L0[2]! + sigma * gauss()); if (!hx || hx === cur[k]!.hex) continue;
  const nd = prep(T[k]!, hx); const row = T.map((_t, j) => (j === k ? 0 : pairPen(nd, cur[j]!)));
  const oldOwn = cur[k]!.own, oldRow = PP[k]!.slice();
  const dPen = nd.own - oldOwn + row.reduce((s, x, j) => s + x - oldRow[j]!, 0);
  const dO = dist(k, hx) - dist(k, cur[k]!.hex) + LAMBDA * dPen;
  if (dO < 0 || (temp > 0 && R() < Math.exp(-dO / temp))) {
    cur[k] = nd; for (let j = 0; j < 7; j++) if (j !== k) { PP[k]![j] = row[j]!; PP[j]![k] = row[j]!; }
    O += dO; const p = pen();
    if ((p === 0 && (best.pen > 0 || O < best.O)) || (best.pen > 0 && p < best.pen)) best = { O, pen: p, pal: T.map((_t, q) => cur[q]!.hex) };
  }
  if (it % 5000 === 0) console.error(`it ${it} O ${O.toFixed(1)} pen ${pen().toFixed(3)} best ${best.O.toFixed(1)}/${best.pen.toFixed(3)}`);
}
const pal = Object.fromEntries(T.map((t, k) => [t, best.pal[k]!])) as Pal;
const dists = T.map((t) => `${t} ${E.f1(deltaE2000(labAs(pal[t], 'normal'), labAs(TGT[t], 'normal')))}`);
console.log(JSON.stringify({ KL, HEAT: HEATON, CLOTHMIN, W, target: tgtName, start: startName, seed: seedS, iters, pen: best.pen, sumSq: best.O - LAMBDA * best.pen, pal, distToTarget: dists }));
if (outPath) writeFileSync(outPath, JSON.stringify(pal, null, 1));
