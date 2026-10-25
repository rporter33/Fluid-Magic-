// The band rule for the lit-bead rail on the NATURAL ground, with the repo's own colour math (colorMath.ts, colors.ts copied verbatim).
// Grounds per terrain: natural bake pixels at seven lightness quantiles (0.5% to 99.5%) within 0.12 D of a border (natural-grounds.json),
// each also half-blended with every other terrain's median; each untinted and under the banner's glow at its 0.35 peak; in every state:
// the approved ones (raw, unexplored haze 4%, out of sight 10%, ash 10%, moss 6%) and the natural view's proposed fog (haze 10% + 25%
// desaturation; out of sight 25%). Coverage: solid; keylines at 0.75 (the rest the banner or the ground, worst); all lines at 0.75.
// Pass: the banner differs from the ground, or a keyline differs from both, at CIEDE2000 20 normal and 12 under each deficiency.
// Run from the repo root: npx tsx <this file>
import { labAs, deltaE2000, type Vision } from './colorMath.ts';
import { NATION_BANNERS, MAP_KEYLINES, contrastRatio } from './colors.ts';
import * as fs from 'node:fs';
const G = JSON.parse(fs.readFileSync(new URL(process.env.GROUNDS ?? './natural-grounds.json', import.meta.url), 'utf8')) as Record<string, string[]>;
const T = ['plains', 'farmland', 'forest', 'hills', 'mountains', 'swamp', 'wasteland'];
const hex = (c: number[]) => '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a: string, b: string, t: number) => { const A = rgb(a), B = rgb(b); return hex(A.map((v, j) => v + (B[j]! - v) * t)); };
const C = new Map<string, readonly [number, number, number]>();
const lab = (h: string, v: Vision) => { const k = h + v; let x = C.get(k); if (!x) { x = labAs(h, v) as [number, number, number]; C.set(k, x); } return x; };
const ok = (a: string, b: string) => deltaE2000(lab(a, 'normal'), lab(b, 'normal')) >= 20 && Math.min(...(['protan', 'deutan', 'tritan'] as Vision[]).map((v) => deltaE2000(lab(a, v), lab(b, v)))) >= 12;
function lab2hex([L, a, b]: readonly number[]) { const fy = (L! + 16) / 116, fx = fy + a! / 500, fz = fy - b! / 200; const fi = (t: number) => (t ** 3 > 216 / 24389 ? t ** 3 : (116 * t - 16) / (24389 / 27)); const X = fi(fx) * 0.95047, Y = fi(fy), Z = fi(fz) * 1.08883; const r = 3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z, g = -0.969266 * X + 1.8760108 * Y + 0.041556 * Z, bb = 0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z; const s = (c: number) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.max(0, c) ** (1 / 2.4) - 0.055); return hex([s(r), s(g), s(bb)]); }
const desat = (h: string, t: number) => mix(h, lab2hex([lab(h, 'normal')[0], 0, 0]), t);
const STATES: Record<string, (h: string) => string> = {
  raw: (h) => h, haze4: (h) => mix(h, '#E8DCC2', 0.04), outOfSight10: (h) => desat(h, 0.1), ash10: (h) => mix(h, '#8F8C88', 0.1), moss6: (h) => mix(h, '#5E7F45', 0.06),
  natUnexplored: (h) => desat(mix(h, '#E8DCC2', 0.1), 0.25), natOutOfSight: (h) => desat(h, 0.25),
};
const banners = Object.values(NATION_BANNERS).flat(); const KL = MAP_KEYLINES.light, KD = MAP_KEYLINES.dark;
const COVS: Record<string, [number, number]> = { solid: [1, 1], keylines075: [0.75, 1], all075: [0.75, 0.75] };
const res: Record<string, { n: number; fail: number; worst: number; worstAt: string; fails: string[]; by?: Record<string, number> }> = {};
for (const [cn, [kc, bc]] of Object.entries(COVS)) {
  const r = (res[cn] = { n: 0, fail: 0, worst: 99, worstAt: '', fails: [] as string[] });
  for (const B of banners) for (const t of T) {
    const grounds: string[] = [...G[t]!]; for (const u of T) if (u !== t) for (const g of G[t]!.filter((_, k) => k === 1 || k === 3 || k === 5)) grounds.push(mix(g, G[u]![3]!, 0.5));
    for (const g0 of grounds) for (const glow of [0, 0.35]) for (const [sn, st] of Object.entries(STATES)) {
      const g = st(mix(g0, B, glow));
      const Bs = [mix(KD, B, bc), mix(KL, B, bc)]; // the banner line sits between the two keylines: its best pixel shares the rest with one of them
      const K1s = [mix(B, KD, kc), mix(g, KD, kc)], K2s = [mix(B, KL, kc), mix(g, KL, kc)];
      let pass = true;
      for (const Bp of Bs) { const p = ok(Bp, g) || K1s.every((K) => ok(K, Bp) && ok(K, g)) || K2s.every((K) => ok(K, Bp) && ok(K, g)); if (!p) pass = false; }
      const con = Math.max(...[...Bs, ...K1s, ...K2s].map((x) => contrastRatio(x, g)));
      r.n++; if (!pass) { r.fail++; (r as any).by ??= {}; const kk = B + ' ' + t + ' ' + sn; (r as any).by[kk] = ((r as any).by[kk] ?? 0) + 1; if (r.fails.length < 8) r.fails.push(`${B} on ${t} ${g0} glow ${glow} ${sn}`); }
      if (con < r.worst) { r.worst = +con.toFixed(2); r.worstAt = `${B} on ${t} ${g0} glow ${glow} ${sn}`; }
    }
  }
}
console.log(JSON.stringify(res, null, 1));
// the wild contour (3 px ink #1C1A17 with the light rim #E9E4D8) against the natural grounds: the band rule's form, ink or rim differs from the ground
let wn = 0, wf = 0; for (const t of T) for (const g of G[t]!) for (const [, st] of Object.entries(STATES)) { const gg = st(g); wn++; if (!(ok('#1C1A17', gg) || ok('#E9E4D8', gg))) wf++; }
console.log('wild contour (ink or rim differs from the natural ground, every state):', wn, 'cases,', wf, 'fail');
// granite and mere against the natural grounds' medians, for information (the distinct-colours rule no longer binds the natural view)
for (const w of ['#2A292C', '#24222A', '#8A857E']) console.log(w, T.map((t) => `${t} ${deltaE2000(lab(w, 'normal'), lab(G[t]![3]!, 'normal')).toFixed(1)}/${Math.min(...(['protan', 'deutan', 'tritan'] as Vision[]).map((v) => deltaE2000(lab(w, v), lab(G[t]![3]!, v)))).toFixed(1)}`).join(', '));
