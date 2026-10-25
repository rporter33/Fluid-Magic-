// Shared color helpers for the strict painted-palette search.
// CIEDE2000 and the CVD simulation come from the repo's own tests/content/colorMath.ts (copied here unchanged);
// banners and keylineFor from src/content/colors.ts (copied unchanged). Run from /home/user/Fluid-Magic- with npx tsx.
import { deltaE2000, labAs, VISIONS, type Lab, type Vision } from './colorMath.ts';
import { contrastRatio, keylineFor, NATION_BANNERS, MAP_KEYLINES } from './colors.ts';

export { deltaE2000, labAs, VISIONS, contrastRatio, keylineFor, NATION_BANNERS, MAP_KEYLINES };
export type { Lab, Vision };

export const TERRAINS = ['plains', 'farmland', 'forest', 'hills', 'mountains', 'swamp', 'wasteland'] as const;
export type T = (typeof TERRAINS)[number];
export const CURRENT: Record<T, string> = {
  plains: '#C1D29F', farmland: '#EEBA3A', forest: '#374C2B', hills: '#856824',
  mountains: '#8DA4AD', swamp: '#1A727A', wasteland: '#AE897F',
};
/** Every banner in NATION_BANNERS (11; the repo test checks the 8 of the M1 nations' colors R and G). */
export const BANNERS = [...new Set(Object.values(NATION_BANNERS).flat())];
export const M1_BANNERS = [...new Set([...NATION_BANNERS.R, ...NATION_BANNERS.G])];
export const CLOTH = '#E8DCC2', ASH = '#8F8C88', MOSS = '#5E7F45';
export const GRANITE = '#2A292C', MERE = '#24222A', RIM = '#E9E4D8';

// ---- sRGB, CIELAB (repo math), OKLab
export const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
const hx = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0').toUpperCase();
export const toHex = (c: readonly number[]) => `#${hx(c[0]!)}${hx(c[1]!)}${hx(c[2]!)}`;
export const over = (base: string, top: string, a: number) => toHex(rgb(base).map((v, i) => v * (1 - a) + rgb(top)[i]! * a));
const s2l = (c: number) => { const s = c / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
const l2s = (c: number) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.max(0, c) ** (1 / 2.4) - 0.055);
export function oklab(h: string): [number, number, number] {
  const [r, g, b] = rgb(h).map(s2l) as [number, number, number];
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
export function oklch(h: string): [number, number, number] { const [L, a, b] = oklab(h); return [L, Math.hypot(a, b), ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360]; }
/** OKLCH -> hex, or null when out of the sRGB gamut (tolerance 0.5/255). */
export function fromOklch(L: number, C: number, hDeg: number): string | null {
  const a = C * Math.cos((hDeg * Math.PI) / 180), b = C * Math.sin((hDeg * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
  const srgb = lin.map(l2s);
  if (srgb.some((v) => v < -0.5 || v > 255.5)) return null;
  return toHex(srgb);
}
export const lab = (h: string) => labAs(h, 'normal');
export const Ls = (h: string) => lab(h)[0];
export const chroma = (h: string) => { const [, a, b] = lab(h); return Math.hypot(a, b); };
export const hueLab = (h: string) => { const [, a, b] = lab(h); return ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360; };
// CIELAB <-> hex (D65; the same constants the earlier calc scripts used for shadeL / greyEqL)
export function fromLab([L, a, b]: readonly number[]) {
  const fy = (L! + 16) / 116, fx = fy + a! / 500, fz = fy - b! / 200;
  const fi = (t: number) => (t ** 3 > 216 / 24389 ? t ** 3 : (116 * t - 16) / (24389 / 27));
  const X = fi(fx) * 0.95047, Y = fi(fy), Z = fi(fz) * 1.08883;
  return toHex([l2s(3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z), l2s(-0.969266 * X + 1.8760108 * Y + 0.041556 * Z), l2s(0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z)]);
}
export const shadeL = (h: string, dl: number) => { const l = [...lab(h)]; l[0] = Math.max(0, Math.min(100, l[0]! + dl)); return fromLab(l); };
export const desatLab = (h: string, k: number) => { const l = [...lab(h)]; l[1]! *= 1 - k; l[2]! *= 1 - k; return fromLab(l); };
export const greyEqL = (h: string) => fromLab([Ls(h), 0, 0]);

// ---- WCAG
const lum = (h: string) => { const [r, g, b] = rgb(h).map(s2l) as [number, number, number]; return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export const wcag = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x! + 0.05) / (y! + 0.05); };

// ---- the approved Ownership states as live overlays (final.md H10, R17, R18): raw, haze, out of sight, ash 10%, moss 6%
export const STATES = ['raw', 'haze', 'outOfSight', 'ash10', 'moss6'] as const;
export type St = (typeof STATES)[number];
// Caps (approved: haze 4%, out of sight 10%, ash 10%, moss 6%); env overrides exist only to measure what the caps cost.
export const CAPS = { haze: Number(process.env.HAZE ?? 0.04), oos: Number(process.env.OOS ?? 0.1), ash: Number(process.env.ASHC ?? 0.1), moss: Number(process.env.MOSSC ?? 0.06) };
export const stOver = (x: string, st: St, f: string) =>
  st === 'raw' ? x : st === 'haze' ? over(x, CLOTH, CAPS.haze) : st === 'outOfSight' ? over(x, greyEqL(f), CAPS.oos) : st === 'ash10' ? over(x, ASH, CAPS.ash) : over(x, MOSS, CAPS.moss);

// ---- distances
const LABC = new Map<string, Lab>();
export const labV = (h: string, v: Vision) => { const k = h + v; let x = LABC.get(k); if (!x) { x = labAs(h, v); LABC.set(k, x); } return x; };
export const dE = (a: string, b: string, v: Vision) => deltaE2000(labV(a, v), labV(b, v));
export const dN = (a: string, b: string) => dE(a, b, 'normal');
export const dC = (a: string, b: string) => Math.min(dE(a, b, 'protan'), dE(a, b, 'deutan'), dE(a, b, 'tritan'));
export const all4 = (a: string, b: string) => VISIONS.map((v) => dE(a, b, v));
export const pass4 = (d: number[], n = 20, c = 12) => d[0]! >= n && d[1]! >= c && d[2]! >= c && d[3]! >= c;
export const passes = (a: string, b: string, n = 20, c = 12) => dN(a, b) >= n && dC(a, b) >= c;
/** docs/09 band rule for one banner on one ground with that ground's keyline. */
export function bandOK(banner: string, ground: string, keyline: string, n = 20, c = 12) {
  return passes(banner, ground, n, c) || (passes(keyline, ground, n, c) && passes(keyline, banner, n, c));
}
export const f1 = (x: number) => x.toFixed(1), f2 = (x: number) => x.toFixed(2), f3 = (x: number) => x.toFixed(3);
