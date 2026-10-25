// v4 relief map: color checks. Color difference and CVD simulation come from the repo's
// tests/content/colorMath.ts; banners, keylineFor and contrastRatio from src/content/colors.ts. Both are
// copied verbatim into this directory (diff-checked against the repo at 41779dd).
// Conversions (mix in sRGB, lightness shifts in CIELAB) follow palette-ab/decide/ev.ts, so numbers compare.
// Run from the repo root so node_modules resolves: npx tsx <this dir>/<script>.ts
import { labAs, deltaE2000, VISIONS, closestPair, type Vision } from './colorMath.ts';
import { NATION_BANNERS, keylineFor, contrastRatio, MAP_KEYLINES } from './colors.ts';
export { labAs, deltaE2000, VISIONS, closestPair, keylineFor, contrastRatio, MAP_KEYLINES, NATION_BANNERS };
export type { Vision };

export const T = ['plains', 'farmland', 'forest', 'hills', 'mountains', 'swamp', 'wasteland'] as const;
export type Terr = (typeof T)[number];
export type Pal = Record<Terr, string>;

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
/** Tint that keeps the ground's CIELAB lightness: a*b* move toward the banner's by t (a "color" blend). */
export const tintKeepL = (a: string, b: string, t: number) => { const A = rgb2lab(hex2rgb(a)), B = rgb2lab(hex2rgb(b)); return rgb2hex(lab2rgb([A[0]!, A[1]! + (B[1]! - A[1]!) * t, A[2]! + (B[2]! - A[2]!) * t])); };
export const Ls = (h: string) => labAs(h, 'normal')[0];
export const Cab = (h: string) => { const l = labAs(h, 'normal'); return Math.hypot(l[1], l[2]); };
export const wcag = contrastRatio;
const GREY = new Map<string, string>();
export const greyEqL = (f: string) => { let v = GREY.get(f); if (!v) { v = rgb2hex(lab2rgb([rgb2lab(hex2rgb(f))[0]!, 0, 0])); GREY.set(f, v); } return v; };
export function oklch(h: string): [number, number, number] {
  const [r, g, b] = hex2rgb(h).map(s2l) as [number, number, number];
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, Math.hypot(A, B), ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360];
}

const LAB = new Map<string, readonly [number, number, number]>();
export const labV = (h: string, v: Vision) => { const k = h + v; let x = LAB.get(k); if (!x) { x = labAs(h, v) as [number, number, number]; LAB.set(k, x); } return x; };
export const dV = (a: string, b: string, v: Vision) => deltaE2000(labV(a, v), labV(b, v));
export const dN = (a: string, b: string) => dV(a, b, 'normal');
export const dC = (a: string, b: string) => Math.min(dV(a, b, 'protan'), dV(a, b, 'deutan'), dV(a, b, 'tritan'));
export const ok = (a: string, b: string, n = 20, c = 12) => dN(a, b) >= n && dC(a, b) >= c;
export const f1 = (n: number) => n.toFixed(1), f2 = (n: number) => n.toFixed(2);

// ---- approved companions (war table final R15 to R18; docs/09)
export const LINEN = '#E8DCC2', ASH = '#8F8C88', MOSS = '#5E7F45', GRANITE = '#2A292C', MERE = '#24222A', RIM = '#E9E4D8';
export const BANNERS = [...new Set(Object.values(NATION_BANNERS).flat())]; // all 11
export const M1_BANNERS = [...NATION_BANNERS.R, ...NATION_BANNERS.G];
export const INDEP = '#8C8A80';

// ---- v4 states. Untinted states are the approved ones (palette.test.ts "Map states"), with the unexplored haze
// renamed: it is a dust sheet of the model's unpainted gesso, the same #E8DCC2 at 4%.
export const GESSO = LINEN;
export const BASE_STATES = ['raw', 'haze', 'outOfSight', 'ash10', 'moss6'] as const;
export type BSt = (typeof BASE_STATES)[number];
export const baseState = (x: string, st: BSt, f: string) => (st === 'raw' ? x : st === 'haze' ? mix(x, GESSO, 0.04) : st === 'outOfSight' ? mix(x, greyEqL(f), 0.1) : st === 'ash10' ? mix(x, ASH, 0.1) : mix(x, MOSS, 0.06));

// ---- the owner tint
export type TintMode = 'over' | 'keepL';
export const tint = (x: string, b: string | null, t: number, mode: TintMode) => (b === null || t === 0 ? x : mode === 'over' ? mix(x, b, t) : tintKeepL(x, b, t));

// ---- relief: p95 lightness deviation of the mean-neutral hillshade plus canopy and ground texture, per terrain (L*)
export type Amp = Record<Terr, number>;
export const AMP: Amp = { plains: 4, farmland: 4, forest: 6, hills: 9, mountains: 16, swamp: 3, wasteland: 6 };
export const reliefVars = (t: Terr, f: string, k = 1, amp: Amp = AMP) => [f, shadeL(f, amp[t] * k), shadeL(f, -amp[t] * k)];

/** Every pair of different terrains in every combination of the given states. */
export function pairs(P: Pal, states: ((t: Terr, f: string) => string[]), n = 20, c = 12) {
  let wN = { v: 1e9, s: '' }, wC = { v: 1e9, s: '' }, under = 0, tot = 0;
  const S = T.map((t) => states(t, P[t]));
  for (let i = 0; i < T.length; i++) for (let j = i + 1; j < T.length; j++) for (const a of S[i]!) for (const b of S[j]!) {
    tot++; const x = dN(a, b), y = dC(a, b);
    if (x < n || y < c) under++;
    if (x < wN.v) wN = { v: x, s: `${T[i]} ${a} vs ${T[j]} ${b}` };
    if (y < wC.v) wC = { v: y, s: `${T[i]} ${a} vs ${T[j]} ${b}` };
  }
  return { wN, wC, under, tot };
}
export function fromOklchSafe(Lk: number, C: number, hDeg: number): string | null {
  const A = C * Math.cos((hDeg * Math.PI) / 180), B = C * Math.sin((hDeg * Math.PI) / 180);
  const l = (Lk + 0.3963377774 * A + 0.2158037573 * B) ** 3, m = (Lk - 0.1055613458 * A - 0.0638541728 * B) ** 3, s = (Lk - 0.0894841775 * A - 1.291485548 * B) ** 3;
  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, b = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  if ([r, g, b].some((v) => v < -1e-4 || v > 1 + 1e-4)) return null;
  const l2s = (c: number) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.max(0, c) ** (1 / 2.4) - 0.055);
  return rgb2hex([l2s(r), l2s(g), l2s(b)]);
}
