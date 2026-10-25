// Shared helpers for the palette decision. Color difference, CVD simulation, keylineFor and contrastRatio come
// from the repo's own files, copied verbatim into this directory (colorMath.ts, colors.ts).
// Paint and state models follow handdrawn-design/final-calc/final.ts (the approved measurements) and the mockup parts.
import { labAs, deltaE2000, VISIONS, type Vision } from './colorMath.ts';
import { NATION_BANNERS, keylineFor, contrastRatio, MAP_KEYLINES } from './colors.ts';
export { labAs, deltaE2000, VISIONS, keylineFor, contrastRatio, MAP_KEYLINES, NATION_BANNERS };
export type { Vision };

export const T = ['plains', 'farmland', 'forest', 'hills', 'mountains', 'swamp', 'wasteland'] as const;
export type Terr = (typeof T)[number];
export type Pal = Record<Terr, string>;

export const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const hx = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0').toUpperCase();
export const toHex = (c: number[]) => `#${hx(c[0]!)}${hx(c[1]!)}${hx(c[2]!)}`;
export const over = (base: string, top: string, a: number) => toHex(rgb(base).map((v, i) => v * (1 - a) + rgb(top)[i]! * a));
const s2l = (c: number) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const l2s = (c: number) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.max(0, c) ** (1 / 2.4) - 0.055);
export const wcag = (a: string, b: string) => contrastRatio(a, b);

// CIELAB (D65) both ways, as the mockup's rgb2lab / lab2rgb do (shadeL, desat)
export function toLab(h: string): [number, number, number] { const l = labAs(h, 'normal'); return [l[0], l[1], l[2]]; }
export function fromLab([L, a, b]: number[]) {
  const fy = (L! + 16) / 116, fx = fy + a! / 500, fz = fy - b! / 200;
  const fi = (t: number) => (t ** 3 > 216 / 24389 ? t ** 3 : (116 * t - 16) / (24389 / 27));
  const X = fi(fx) * 0.95047, Y = fi(fy), Z = fi(fz) * 1.08883;
  return toHex([l2s(3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z), l2s(-0.969266 * X + 1.8760108 * Y + 0.041556 * Z), l2s(0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z)]);
}
export const inGamut = ([L, a, b]: number[]) => {
  const fy = (L! + 16) / 116, fx = fy + a! / 500, fz = fy - b! / 200;
  const fi = (t: number) => (t ** 3 > 216 / 24389 ? t ** 3 : (116 * t - 16) / (24389 / 27));
  const X = fi(fx) * 0.95047, Y = fi(fy), Z = fi(fz) * 1.08883;
  const r = 3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z, g = -0.969266 * X + 1.8760108 * Y + 0.041556 * Z, bb = 0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z;
  return [r, g, bb].every((v) => v >= -1e-4 && v <= 1 + 1e-4);
};
export const shadeL = (h: string, dl: number) => { const l = toLab(h); l[0] = Math.max(0, Math.min(100, l[0] + dl)); return fromLab(l); };
export const desat = (h: string, k: number) => { const l = toLab(h); l[1] *= 1 - k; l[2] *= 1 - k; return fromLab(l); };
export const Ls = (h: string) => toLab(h)[0];
export const Cab = (h: string) => { const l = toLab(h); return Math.hypot(l[1], l[2]); };
export const hab = (h: string) => { const l = toLab(h); return ((Math.atan2(l[2], l[1]) * 180) / Math.PI + 360) % 360; };

// OKLCH (Ottosson)
export function oklch(h: string): [number, number, number] {
  const [r, g, b] = rgb(h).map(s2l) as [number, number, number];
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, Math.hypot(A, B), ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360];
}
export function fromOklch(L: number, C: number, hDeg: number): string | null {
  const A = C * Math.cos((hDeg * Math.PI) / 180), B = C * Math.sin((hDeg * Math.PI) / 180);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3, m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3, s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, b = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  if ([r, g, b].some((v) => v < -1e-4 || v > 1 + 1e-4)) return null;
  return toHex([l2s(r), l2s(g), l2s(b)]);
}

// Distances, cached per (hex, vision)
const LAB = new Map<string, readonly [number, number, number]>();
export const labV = (h: string, v: Vision) => { const k = h + v; let x = LAB.get(k); if (!x) { x = labAs(h, v) as [number, number, number]; LAB.set(k, x); } return x; };
export const dV = (a: string, b: string, v: Vision) => deltaE2000(labV(a, v), labV(b, v));
export const dN = (a: string, b: string) => dV(a, b, 'normal');
export const dC = (a: string, b: string) => Math.min(dV(a, b, 'protan'), dV(a, b, 'deutan'), dV(a, b, 'tritan'));

// The approved companions (final.md, wartable final.md R15 to R18)
export const CLOTH = '#E8DCC2', ASH = '#8F8C88', MOSS = '#5E7F45', GRANITE = '#2A292C', MERE = '#24222A', RIM = '#E9E4D8';
export const greyEqL = (f: string) => fromLab([Ls(f), 0, 0]);
export const STATES = ['raw', 'haze', 'outOfSight', 'ash10', 'moss6'] as const;
export type St = (typeof STATES)[number];
export const stOver = (x: string, st: St, f: string) => (st === 'raw' ? x : st === 'haze' ? over(x, CLOTH, 0.04) : st === 'outOfSight' ? over(x, greyEqL(f), 0.1) : st === 'ash10' ? over(x, ASH, 0.1) : over(x, MOSS, 0.06));
export const BANNERS = [...new Set(Object.values(NATION_BANNERS).flat())]; // all 11
export const M1_BANNERS = [...NATION_BANNERS.R, ...NATION_BANNERS.G]; // what palette.test.ts checks (NATIONS use R and G)

// The paint recipe (final.md §1.4, PAINT in p55-paint.js)
export type Rec = { M: number; E: number; B: number; relief?: number };
export const FIN: Record<Terr, Rec> = { plains: { M: 3, E: -7, B: 1 }, farmland: { M: 3, E: -7, B: 0 }, forest: { M: 3, E: -5, B: 0 }, hills: { M: 0, E: -6, B: 1 }, mountains: { M: 1, E: -7, B: 1, relief: 0.08 }, swamp: { M: 1, E: -6, B: 2 }, wasteland: { M: 0, E: -8, B: 1 } };
export const RELIEF = '#3A4466';
// the §1.6 / final.ts §C painted variants: fill, mottle extremes, edge pool and pool -3, bloom fill and rim, the Mountains relief wash
export const paintVars = (t: Terr, f: string, rec: Record<Terr, Rec> = FIN) => {
  const r = rec[t]; const v = [f, shadeL(f, r.M), shadeL(f, -r.M), shadeL(f, r.E), shadeL(f, r.E - 3)];
  if (r.B) v.push(over(f, shadeL(f, 4), 0.35), over(f, shadeL(f, -9), 0.3));
  if (r.relief) v.push(over(f, RELIEF, r.relief));
  return v;
};
// the deepest the mockup's pool can get: f - 28 L* at its full 0.45 alpha, under the pooling line f - 14 L* at 0.35
export const poolMax = (f: string) => over(over(f, shadeL(f, -28), 0.45), shadeL(f, -14), 0.35);

export const f1 = (n: number) => n.toFixed(1), f2 = (n: number) => n.toFixed(2);
export const isDark = (f: string) => keylineFor(f) === MAP_KEYLINES.light;
