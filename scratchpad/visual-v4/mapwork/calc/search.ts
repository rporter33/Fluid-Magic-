// v4 relief palette search: the terrain albedos nearest a natural, low-key target (CIEDE2000, lightness weighted
// 1/KL) that keep every hard constraint:
//  - docs/09's 20 / 12 on raw albedos and across the approved untinted states (raw, haze, out of sight, ash 10%,
//    moss 6%), every pair of different terrains in any two states;
//  - a relief floor: albedo +- RK x the terrain's relief amplitude (0.4: the interquartile range), raw and out of sight, at RN / RC;
//  - both wild grounds 20 / 12 from every albedo in every state;
//  - the rail rule: every one of the 11 banners on every terrain's ground (albedo +- the full relief amplitude),
//    untinted and under its own rim glow at T0, in every state: banner direct, or keylineFor(albedo) against both;
//  - keylineFor(albedo) at 4:1 or more;
//  - snow (the wilds' mark) 20 / 12 from every albedo's lit relief;
//  - no albedo lighter than LMAX (low key) or darker than LMIN (the wild grounds stay the darkest ground), and no
//    albedo above OKLCH chroma CMAX (information owns the saturation).
// Deterministic: a seeded (1+1) annealer over CIELAB, one albedo moved per step (palette-ab/decide/search.ts's scheme).
// Run from the repo root: npx tsx search.ts <seed> <iters> [out.json]
import { writeFileSync } from 'node:fs';
import * as L from './lib.ts';
import { labAs, deltaE2000, type Vision } from './colorMath.ts';
const { T } = L; type Pal = L.Pal; type Terr = L.Terr;
const [seedS = '1', itS = '20000', outPath] = process.argv.slice(2);
const KL = Number(process.env.KL ?? 2), RN = Number(process.env.RN ?? 17), RC = Number(process.env.RC ?? 10), RK = Number(process.env.RK ?? 0.5);
const T0 = Number(process.env.T0 ?? 0.35), LMAX = Number(process.env.LMAX ?? 74), LMIN = Number(process.env.LMIN ?? 22), CMAX = Number(process.env.CMAX ?? 0.1), MARGIN = 0.15;
// per-terrain chroma caps and OKLCH hue windows (naturalness): e.g. mountains near-neutral cool grey
const CMAXT: Partial<Record<Terr, number>> = JSON.parse(process.env.CMAXT ?? '{}');
const HUEW: Partial<Record<Terr, [number, number]>> = JSON.parse(process.env.HUEW ?? '{}');
const LMAXT: Partial<Record<Terr, number>> = JSON.parse(process.env.LMAXT ?? '{}');
// natural, low-key targets: forest from the references' dense forest, plains from their open and light grass, mountains
// from their lit and shade rock, the rest invented in the same key (no reference shows them)
const TGT: Pal = JSON.parse(process.env.TGT ?? 'null') ?? { plains: '#66703A', farmland: '#A88A4A', forest: '#24391A', hills: '#6E5B3C', mountains: '#7D7975', swamp: '#3E4A40', wasteland: '#A49684' };
const START: Pal = JSON.parse(process.env.START ?? 'null') ?? TGT;
const VIS: Vision[] = ['normal', 'protan', 'deutan', 'tritan'];
type Labs = [number, number, number][];
const labs = (h: string): Labs => VIS.map((v) => labAs(h, v) as [number, number, number]);
const de = (a: Labs, b: Labs, v: number) => deltaE2000(a[v]!, b[v]!);
const short = (a: Labs, b: Labs, n: number, c: number) => { const x = n + MARGIN - de(a, b, 0); let s = x > 0 ? x : 0; for (let v = 1; v < 4; v++) { const y = c + MARGIN - de(a, b, v); if (y > s) s = y; } return s; };
const BAN = L.BANNERS.map((b) => ({ b, L: labs(b) }));
// snow is the wilds' mark: no passable ground's lit relief may come within 20 / 12 of it
const SNOWL = labs('#F2EEE6');
const GR = [L.GRANITE, L.MERE].map(labs);
const KEYS = [L.MAP_KEYLINES.light, L.MAP_KEYLINES.dark].map(labs);
interface FD { hex: string; st: Labs[]; rel: Labs[]; own: number }
function prep(t: Terr, f: string): FD {
  const st = L.BASE_STATES.map((s) => labs(L.baseState(f, s, f)));
  const rel = (process.env.RSTATES === 'all' ? L.BASE_STATES : (['raw', 'outOfSight'] as const)).flatMap((s) => L.reliefVars(t, f, RK).map((x) => labs(L.baseState(x, s, f))));
  let own = 0; const key = L.keylineFor(f);
  // the rail rule with railKeyline: one keyline per (banner, terrain), the one of the two with the smaller shortfall
  for (const B of BAN) { let best = 1e18;
    for (const kl of KEYS) { let pk = 0;
      for (const s of L.BASE_STATES) for (const g0 of L.reliefVars(t, f, 1)) for (const tt of [0, T0]) {
        const g = labs(L.baseState(L.tint(g0, B.b, tt, 'over'), s, f)); const d = short(B.L, g, 20, 12);
        if (d > 0) { const k = Math.max(short(kl, g, 20, 12), short(kl, B.L, 20, 12)); pk += Math.min(d, k) ** 2; } }
      if (pk < best) best = pk; }
    own += best; }
  for (const g of GR) for (const x of st) own += short(g, x, 20, 12) ** 2;
  const hinge = (x: number, need: number) => (x < need ? ((need - x) * 10) ** 2 : 0);
  own += hinge(L.wcag(key, f), 4.0);
  const Lf = L.Ls(f); const lm = LMAXT[t] ?? LMAX; if (Lf > lm) own += (Lf - lm) ** 2; own += short(SNOWL, labs(L.shadeL(f, L.AMP[t])), 20, 12) ** 2; if (Lf < LMIN) own += (LMIN - Lf) ** 2; const [, Cf, hf] = L.oklch(f); const cm = CMAXT[t] ?? CMAX; if (Cf > cm) own += ((Cf - cm) * 200) ** 2;
  const hw = HUEW[t]; if (hw && Cf > 0.012) { const out = hf < hw[0] ? hw[0] - hf : hf > hw[1] ? hf - hw[1] : 0; own += (out * Cf * 10) ** 2; }
  return { hex: f, st, rel, own };
}
function pairPen(a: FD, b: FD) { let p = 0; for (const x of a.st) for (const y of b.st) p += short(x, y, 20, 12) ** 2; for (const x of a.rel) for (const y of b.rel) p += short(x, y, RN, RC) ** 2; return p; }
const tgtL = T.map((t) => labs(TGT[t]));
const dObj = (a: readonly [number, number, number], b: readonly [number, number, number]) => deltaE2000([50 + (a[0] - 50) / KL, a[1], a[2]], [50 + (b[0] - 50) / KL, b[1], b[2]]);
const dist = (k: number, hex: string) => dObj(labAs(hex, 'normal'), tgtL[k]![0]) ** 2;
const LAMBDA = 400;
let rs = Number(seedS) >>> 0 || 1; const R = () => { rs = (rs + 0x6d2b79f5) >>> 0; let t = rs; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const gauss = () => { let u = 0; while (u === 0) u = R(); const v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const toHexLab = (l: number, a: number, b: number) => { const c = L.lab2rgb([l, a, b]); if (c.some((x) => x < -0.5 || x > 255.5)) return null; return L.rgb2hex(c); };
const cur: FD[] = T.map((t) => prep(t, START[t]));
const PP: number[][] = T.map(() => T.map(() => 0));
for (let i = 0; i < 7; i++) for (let j = i + 1; j < 7; j++) PP[i]![j] = PP[j]![i] = pairPen(cur[i]!, cur[j]!);
const pen = () => { let p = 0; for (let i = 0; i < 7; i++) { p += cur[i]!.own; for (let j = i + 1; j < 7; j++) p += PP[i]![j]!; } return p; };
let O = T.reduce((s, _t, k) => s + dist(k, cur[k]!.hex), 0) + LAMBDA * pen();
const iters = Number(itS);
let best = { O, pen: pen(), pal: T.map((_t, k) => cur[k]!.hex) };
for (let it = 0; it < iters; it++) {
  const frac = it / iters, sigma = 4 * (1 - frac) + 0.4, temp = 50 * (1 - frac) ** 3;
  const k = Math.floor(R() * 7); const L0 = L.rgb2lab(L.hex2rgb(cur[k]!.hex));
  const hx = toHexLab(L0[0]! + sigma * gauss(), L0[1]! + sigma * gauss(), L0[2]! + sigma * gauss()); if (!hx || hx === cur[k]!.hex) continue;
  const nd = prep(T[k]!, hx); const row = T.map((_t, j) => (j === k ? 0 : pairPen(nd, cur[j]!)));
  const dPen = nd.own - cur[k]!.own + row.reduce((s, x, j) => s + x - PP[k]![j]!, 0);
  const dO = dist(k, hx) - dist(k, cur[k]!.hex) + LAMBDA * dPen;
  if (dO < 0 || (temp > 0 && R() < Math.exp(-dO / temp))) {
    cur[k] = nd; for (let j = 0; j < 7; j++) if (j !== k) { PP[k]![j] = row[j]!; PP[j]![k] = row[j]!; }
    O += dO; const p = pen();
    if ((p === 0 && (best.pen > 0 || O < best.O)) || (best.pen > 0 && p < best.pen)) best = { O, pen: p, pal: T.map((_t, q) => cur[q]!.hex) };
  }
  if (it % 5000 === 0) console.error(`it ${it} O ${O.toFixed(1)} pen ${pen().toFixed(3)} best ${best.O.toFixed(1)}/${best.pen.toFixed(3)}`);
}
const pal = Object.fromEntries(T.map((t, k) => [t, best.pal[k]!])) as Pal;
const dists = T.map((t) => `${t} ${L.f1(deltaE2000(labAs(pal[t], 'normal'), labAs(TGT[t], 'normal')))}`);
console.log(JSON.stringify({ seed: seedS, iters, KL, RN, RC, RK, RSTATES: process.env.RSTATES ?? 'raw+outOfSight', T0, LMAX, LMIN, LMAXT, CMAX, CMAXT, HUEW, TGT, pen: best.pen, sumSq: best.O - LAMBDA * best.pen, pal, distToTarget: dists }));
if (outPath) writeFileSync(outPath, JSON.stringify(pal, null, 1));
