// Independent re-measurement of terrain palettes for the painted A/B (palette-ab/decision.md).
// Color difference and CVD simulation: the repo's tests/content/colorMath.ts; banners, keylineFor and contrastRatio:
// src/content/colors.ts. Both copied verbatim into this directory (diff-checked). Paint derivations (shadeL, desat, mix)
// use the mockup's own conversions (p10b-core.js), so the variants are the ones the mockup paints.
// Run from the repo root so node_modules resolves: npx tsx <dir>/report.ts
import { labAs, deltaE2000, VISIONS, closestPair, type Vision } from './colorMath.ts';
import { NATION_BANNERS, keylineFor, contrastRatio, MAP_KEYLINES } from './colors.ts';
export { closestPair, keylineFor, contrastRatio, MAP_KEYLINES, NATION_BANNERS, VISIONS };

export const T = ['plains', 'farmland', 'forest', 'hills', 'mountains', 'swamp', 'wasteland'] as const;
export type Terr = (typeof T)[number];
export type Pal = Record<Terr, string>;

// ---- the mockup's conversions (p10b-core.js)
export const hex2rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const rgb2hex = (c: number[]) => '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();
const s2l = (c: number) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const l2s = (c: number) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.max(0, c) ** (1 / 2.4) - 0.055);
export function rgb2lab([r, g, b]: number[]) { const R = s2l(r!), G = s2l(g!), B = s2l(b!); const X = (0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047, Y = 0.2126 * R + 0.7152 * G + 0.0722 * B, Z = (0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883; const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116); return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))]; }
export function lab2rgb([L, a, b]: number[]) { const fy = (L! + 16) / 116, fx = fy + a! / 500, fz = fy - b! / 200; const fi = (t: number) => (t ** 3 > 0.008856 ? t ** 3 : (t - 16 / 116) / 7.787); const X = fi(fx) * 0.95047, Y = fi(fy), Z = fi(fz) * 1.08883; return [l2s(3.2406 * X - 1.5372 * Y - 0.4986 * Z), l2s(-0.9689 * X + 1.8758 * Y + 0.0415 * Z), l2s(0.0557 * X - 0.204 * Y + 1.057 * Z)]; }
const SH = new Map<string, string>();
export const shadeL = (h: string, dl: number) => { const k = h + dl; let v = SH.get(k); if (!v) { const l = rgb2lab(hex2rgb(h)); l[0] = Math.max(0, Math.min(100, l[0]! + dl)); v = rgb2hex(lab2rgb(l)); SH.set(k, v); } return v; };
export const desat = (h: string, k: number) => { const l = rgb2lab(hex2rgb(h)); l[1] = l[1]! * (1 - k); l[2] = l[2]! * (1 - k); return rgb2hex(lab2rgb(l)); };
export const mix = (a: string, b: string, t: number) => { const A = hex2rgb(a), B = hex2rgb(b); return rgb2hex(A.map((v, j) => v + (B[j]! - v) * t)); };
export const Ls = (h: string) => labAs(h, 'normal')[0];
export const Cab = (h: string) => { const l = labAs(h, 'normal'); return Math.hypot(l[1], l[2]); };
export const wcag = contrastRatio;
const GREY = new Map<string, string>();
export const greyEqL = (f: string) => { let v = GREY.get(f); if (!v) { v = rgb2hex(lab2rgb([rgb2lab(hex2rgb(f))[0]!, 0, 0])); GREY.set(f, v); } return v; };

// OKLCH (Ottosson), for chroma statistics and the search
export function oklch(h: string): [number, number, number] {
  const [r, g, b] = hex2rgb(h).map(s2l) as [number, number, number];
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, Math.hypot(A, B), ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360];
}
export function fromOklch(L: number, C: number, hDeg: number): string | null {
  const A = C * Math.cos((hDeg * Math.PI) / 180), B = C * Math.sin((hDeg * Math.PI) / 180);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3, m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3, s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, b = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  if ([r, g, b].some((v) => v < -1e-4 || v > 1 + 1e-4)) return null;
  return rgb2hex([l2s(r), l2s(g), l2s(b)]);
}

// ---- distances (repo colorMath), cached
const LAB = new Map<string, readonly [number, number, number]>();
const labV = (h: string, v: Vision) => { const k = h + v; let x = LAB.get(k); if (!x) { x = labAs(h, v) as [number, number, number]; LAB.set(k, x); } return x; };
export const dV = (a: string, b: string, v: Vision) => deltaE2000(labV(a, v), labV(b, v));
export const dN = (a: string, b: string) => dV(a, b, 'normal');
export const dC = (a: string, b: string) => Math.min(dV(a, b, 'protan'), dV(a, b, 'deutan'), dV(a, b, 'tritan'));
export const ok = (a: string, b: string, n = 20, c = 12) => dN(a, b) >= n && dC(a, b) >= c;

// ---- approved companions (wartable final.md R15 to R18; handdrawn final.md §1)
export const CLOTH = '#E8DCC2', ASH = '#8F8C88', MOSS = '#5E7F45', GRANITE = '#2A292C', MERE = '#24222A', RIM = '#E9E4D8', RELIEF = '#3A4466';
export const STATES = ['raw', 'haze', 'outOfSight', 'ash10', 'moss6'] as const;
export type St = (typeof STATES)[number];
export const stOver = (x: string, st: St, f: string) => (st === 'raw' ? x : st === 'haze' ? mix(x, CLOTH, 0.04) : st === 'outOfSight' ? mix(x, greyEqL(f), 0.1) : st === 'ash10' ? mix(x, ASH, 0.1) : mix(x, MOSS, 0.06));
export const BANNERS = [...new Set(Object.values(NATION_BANNERS).flat())]; // all 11
export const M1_BANNERS = [...NATION_BANNERS.R, ...NATION_BANNERS.G]; // what palette.test.ts checks
export const PEWTER = '#91A092';
export const DARK_T = new Set<Terr>(['forest', 'hills', 'swamp']);
export const FEATURE_INK = '#3E3428', PAPER_INK = '#E8DCC2', CONTOUR = '#1C1A17';

// v3's PAINT (p55-paint.js)
export type Rec = { M: number; E: number; B: number; relief?: number };
export const V3: Record<Terr, Rec> = { plains: { M: 3, E: -7, B: 1 }, farmland: { M: 3, E: -7, B: 0 }, forest: { M: 3, E: -5, B: 0 }, hills: { M: 0, E: -6, B: 1 }, mountains: { M: 1, E: -7, B: 1, relief: 0.08 }, swamp: { M: 1, E: -6, B: 2 }, wasteland: { M: 0, E: -8, B: 1 } };
// final.md §1.6 painted variants: fill, mottle extremes, edge pool E and E-3, bloom fill and rim, relief wash
export const paintVars = (t: Terr, f: string, rec: Record<Terr, Rec> = V3) => {
  const r = rec[t]; const v = [f, shadeL(f, r.M), shadeL(f, -r.M), shadeL(f, r.E), shadeL(f, r.E - 3)];
  if (r.B) v.push(mix(f, shadeL(f, 4), 0.35), mix(f, shadeL(f, -9), 0.3));
  if (r.relief) v.push(mix(f, RELIEF, r.relief));
  return v;
};
// the deepest point of v3's pool: f - 28 L* at its full 0.45 shadow alpha, under the pooling line f - 14 L* at 0.35
export const poolMax = (f: string, depth = 28, a = 0.45) => mix(mix(f, shadeL(f, -depth), a), shadeL(f, -14), 0.35);

export const f1 = (n: number) => n.toFixed(1), f2 = (n: number) => n.toFixed(2);

// ---- checks. Each returns numbers; report.ts prints them.
export function rawRule(P: Pal) {
  const per = Object.fromEntries(VISIONS.map((v) => [v, closestPair(P, v)])) as Record<Vision, { a: string; b: string; deltaE: number }>;
  const pass = VISIONS.every((v) => per[v].deltaE >= (v === 'normal' ? 20 : 12));
  return { per, pass };
}
export function bandRule(P: Pal, banners: string[], grounds: (t: Terr, f: string) => string[]) {
  let tot = 0, direct = 0, key = 0, fail = 0; const fails: string[] = []; let closest = { v: 1e9, s: '' };
  for (const t of T) { const f = P[t], k = keylineFor(f);
    for (const g of grounds(t, f)) for (const b of banners) { tot++;
      if (ok(b, g)) { direct++; const m = Math.min(dN(b, g), (dC(b, g) * 20) / 12); if (m < closest.v) closest = { v: m, s: `${b} on ${t} ${g}: ${f1(dN(b, g))}/${f1(dC(b, g))}` }; }
      else if (ok(k, g) && ok(k, b)) key++; else { fail++; fails.push(`${b} on ${t} ${g}`); } } }
  return { tot, direct, key, fail, fails, closest };
}
export function statePairs(P: Pal, vars: (t: Terr, f: string) => string[] = (_t, f) => [f], n = 20, c = 12) {
  let wN = { v: 1e9, s: '' }, wC = { v: 1e9, s: '' }, under = 0;
  for (let i = 0; i < T.length; i++) for (let j = i + 1; j < T.length; j++) { const A = T[i]!, B = T[j]!;
    for (const sa of STATES) for (const sb of STATES) for (const a0 of vars(A, P[A])) for (const b0 of vars(B, P[B])) {
      const a = stOver(a0, sa, P[A]), b = stOver(b0, sb, P[B]); const x = dN(a, b), y = dC(a, b);
      if (x < n || y < c) under++; if (x < wN.v) wN = { v: x, s: `${A}/${sa} vs ${B}/${sb}` }; if (y < wC.v) wC = { v: y, s: `${A}/${sa} vs ${B}/${sb}` }; } }
  return { wN, wC, under };
}
export const h13Vars = (rec: Record<Terr, Rec> = V3, k = 0.55) => (t: Terr, f: string) => { const r = rec[t]; const v = [f, shadeL(f, r.M * k), shadeL(f, -r.M * k)]; if (r.relief) v.push(mix(f, RELIEF, r.relief)); return v; };
export function grounds(P: Pal, g: string, vars: (t: Terr, f: string) => string[] = (_t, f) => [f]) {
  let wN = { v: 1e9, s: '' }, wC = { v: 1e9, s: '' };
  for (const t of T) for (const st of STATES) for (const x0 of vars(t, P[t])) { const x = stOver(x0, st, P[t]); const a = dN(g, x), b = dC(g, x); if (a < wN.v) wN = { v: a, s: `${t}/${st}` }; if (b < wC.v) wC = { v: b, s: `${t}/${st}` }; }
  return { wN, wC };
}
// data modes (R16): base = fill desaturated 80%, lifted to L* >= 50 with cloth; ramp #4C5E96 .. #F8E6A6
export const HEAT = ['#4C5E96', '#8170AC', '#C4808E', '#E6AC6E', '#F8E6A6'];
export const heat = (t: number, H = HEAT) => { const x = Math.max(0, Math.min(0.9999, t)) * (H.length - 1), k = Math.floor(x), fr = x - k, a = hex2rgb(H[k]!), b = hex2rgb(H[k + 1]!); return rgb2hex(a.map((v, j) => v + (b[j]! - v) * fr)); };
export const APPROVED_BASE: Pal = { plains: desat('#C1D29F', 0.8), farmland: desat('#EEBA3A', 0.8), forest: '#79786B', hills: '#7E7767', mountains: desat('#8DA4AD', 0.8), swamp: '#6F7A77', wasteland: desat('#AE897F', 0.8) };
export const deriveBase = (P: Pal): Pal => Object.fromEntries(T.map((t) => { const d = desat(P[t], 0.8); let a = 0; while (Ls(mix(d, CLOTH, a)) < 50 && a < 1) a += 0.01; return [t, a ? mix(d, CLOTH, a) : d]; })) as Pal;
export function modeColors(base: Pal, H = HEAT) {
  const heatC = Array.from({ length: 21 }, (_, k) => heat(k / 20, H));
  const dom: string[] = []; for (const t of T) for (const [n, b] of [['red', NATION_BANNERS.R[0]!], ['green', NATION_BANNERS.G[0]!]] as const) for (let s = 1; s <= 10; s++) dom.push(mix(base[t], b, n === 'red' ? 0.25 + s * 0.07 : 0.35 + s * 0.07));
  return { bases: T.map((t) => base[t]), heatC, dom };
}
export function modesVsFills(P: Pal, base: Pal, H = HEAT) {
  const { bases, heatC } = modeColors(base, H); let wN = { v: 1e9, s: '' }, wC = { v: 1e9, s: '' };
  for (const t of T) for (const m of [...bases, ...heatC]) { const a = dN(P[t], m), b = dC(P[t], m); if (a < wN.v) wN = { v: a, s: `${t} vs ${m}` }; if (b < wC.v) wC = { v: b, s: `${t} vs ${m}` }; }
  const own = Object.fromEntries(T.map((t) => [t, dN(P[t], base[t])]));
  return { wN, wC, own };
}
export function groundsVsModes(base: Pal, H = HEAT) {
  const { bases, heatC, dom } = modeColors(base, H); const all = [...bases, ...heatC, ...dom]; const out: Record<string, { direct: number; rim: number; fail: number; tot: number }> = {};
  for (const [nm, g] of [['granite', GRANITE], ['mere', MERE]] as const) { let direct = 0, rim = 0, fail = 0; for (const m of all) { if (ok(g, m)) direct++; else if (ok(RIM, m) && ok(RIM, g)) rim++; else fail++; } out[nm] = { direct, rim, fail, tot: all.length }; }
  return out;
}
// ink (WCAG)
export const placeName = (t: Terr, ground: string) => DARK_T.has(t) ? wcag('#F4EEDF', mix(ground, '#14120F', 0.75)) : wcag('#2A1F14', mix(ground, '#F2EAD6', 0.8));
export const regionInk = (t: Terr, ground: string, a = 0.9) => { const ink = DARK_T.has(t) ? '#F4EEDF' : '#2A1F14'; return wcag(mix(ground, ink, a), ground); };
export const trackInk = (t: Terr) => (DARK_T.has(t) ? PAPER_INK : FEATURE_INK);
export const track = (t: Terr, ground: string) => ({ peak: wcag(trackInk(t), ground), avg: wcag(mix(ground, trackInk(t), (Math.PI * 1.8) / (4 * 3.0)), ground) });
export const litF = (tone: string) => mix(shadeL(tone, 8), '#F6D9A0', 0.12), shadeF = (tone: string) => mix(shadeL(tone, -12), RELIEF, 0.14);
export const KITS: Record<string, string[]> = { Cinder: ['#8F8C88', '#3A3633', '#3A3836', '#2B2A28', '#5E5953'], Thornwood: ['#A0785A', '#4E6B3A', '#6B4A2B', '#5E4630', '#9A958C'], Independents: ['#D8CBB0', '#C2A86B', '#9A958C', '#B9B4AA'], Stone: ['#CFC6B4'], Camp: ['#B9B4A6'] };
export const kitBest = (tones: string[], f: string) => [...tones.flatMap((x) => [litF(x), shadeF(x)]), CONTOUR].reduce((m, x) => Math.max(m, wcag(x, f)), 0);

// muting statistics
export function stats(P: Pal) {
  const ok3 = T.map((t) => oklch(P[t])); const meanC = ok3.reduce((s, x) => s + x[1], 0) / 7, maxC = Math.max(...ok3.map((x) => x[1]));
  const cab = T.map((t) => Cab(P[t])); const meanCab = cab.reduce((s, x) => s + x, 0) / 7;
  // chroma-weighted hue concentration (1 = every fill on one hue, 0 = spread around the wheel): the reference's land sits in 70 to 95
  let sx = 0, sy = 0, sw = 0; for (const x of ok3) { sx += x[1] * Math.cos((x[2] * Math.PI) / 180); sy += x[1] * Math.sin((x[2] * Math.PI) / 180); sw += x[1]; }
  const conc = Math.hypot(sx, sy) / sw, meanHue = ((Math.atan2(sy, sx) * 180) / Math.PI + 360) % 360;
  // chroma that sits outside the reference's warm-earth window (OKLCH hue 60 to 140): the "board" colors (teal, blue, rose)
  const offC = ok3.reduce((s, x) => s + (x[2] >= 60 && x[2] <= 140 ? 0 : x[1]), 0) / 7;
  const Lr = T.map((t) => Ls(P[t]));
  return { meanC, maxC, meanCab, maxCab: Math.max(...cab), conc, meanHue, offC, Lmin: Math.min(...Lr), Lmax: Math.max(...Lr), ok3 };
}
