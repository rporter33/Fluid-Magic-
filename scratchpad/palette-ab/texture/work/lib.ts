// Shared helpers for the painted-palette (texture angle) measurements.
// Color difference and CVD simulation come from the repo's tests/content/colorMath.ts (copied here unchanged);
// banners and keylines from the repo's src/content/colors.ts (copied here unchanged).
// Run every script from /home/user/Fluid-Magic- with `npx tsx <script>` so node_modules resolves.
import { deltaE2000, labAs, VISIONS, type Vision } from './colorMath';
import { contrastRatio, keylineFor, MAP_KEYLINES, NATION_BANNERS } from './colors';

export { contrastRatio, keylineFor, MAP_KEYLINES, NATION_BANNERS, VISIONS, labAs, deltaE2000 };
export type { Vision };

export const TERRAINS = ['plains', 'farmland', 'forest', 'hills', 'mountains', 'swamp', 'wasteland'] as const;
export type T = (typeof TERRAINS)[number];
export type Pal = Record<T, string>;

/** docs/09-art-direction.md, the approved ("Clear colors") fills. */
export const BRIGHT: Pal = {
  plains: '#C1D29F', farmland: '#EEBA3A', forest: '#374C2B', hills: '#856824',
  mountains: '#8DA4AD', swamp: '#1A727A', wasteland: '#AE897F',
};

export const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
const hx = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0').toUpperCase();
export const toHex = (c: readonly number[]) => `#${hx(c[0]!)}${hx(c[1]!)}${hx(c[2]!)}`;
/** Source-over of `top` at alpha a on an opaque base, in gamma-encoded sRGB (what canvas does). */
export const over = (base: string, top: string, a: number) => toHex(rgb(base).map((v, i) => v * (1 - a) + rgb(top)[i]! * a));
const s2l = (c: number) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const l2s = (c: number) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.max(0, c) ** (1 / 2.4) - 0.055);

// The mockup's CIELAB (p10b-core.js rgb2lab/lab2rgb), used only to reproduce its shadeL/desat exactly.
export function mLab(h: string): [number, number, number] {
  const [R, G, B] = rgb(h).map(s2l) as [number, number, number];
  const X = (0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047, Y = 0.2126 * R + 0.7152 * G + 0.0722 * B, Z = (0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}
export function mFromLab([L, a, b]: readonly number[]): string {
  const fy = (L! + 16) / 116, fx = fy + a! / 500, fz = fy - b! / 200;
  const fi = (t: number) => (t ** 3 > 0.008856 ? t ** 3 : (t - 16 / 116) / 7.787);
  const X = fi(fx) * 0.95047, Y = fi(fy), Z = fi(fz) * 1.08883;
  return toHex([l2s(3.2406 * X - 1.5372 * Y - 0.4986 * Z), l2s(-0.9689 * X + 1.8758 * Y + 0.0415 * Z), l2s(0.0557 * X - 0.204 * Y + 1.057 * Z)]);
}
export const shadeL = (h: string, dl: number) => { const l = mLab(h); l[0] = Math.max(0, Math.min(100, l[0] + dl)); return mFromLab(l); };
export const desat = (h: string, k: number) => { const l = mLab(h); l[1] *= 1 - k; l[2] *= 1 - k; return mFromLab(l); };
export const greyEqL = (h: string) => mFromLab([mLab(h)[0], 0, 0]);

/** CIELAB (repo math, normal vision): L*, C*ab, h. */
export function lch(h: string) { const [L, a, b] = labAs(h, 'normal'); return { L, C: Math.hypot(a, b), h: ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360 }; }

// ---- OKLab / OKLCH (Ottosson 2020). Not a CVD simulation; used only for the chroma budget.
export function oklab(h: string): [number, number, number] {
  const [r, g, b] = rgb(h).map(s2l) as [number, number, number];
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
export function oklch(h: string) { const [L, a, b] = oklab(h); return { L, C: Math.hypot(a, b), h: ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360 }; }
/** OKLCH to hex; returns null when out of the sRGB gamut. */
export function fromOklch(L: number, C: number, hDeg: number): string | null {
  const a = C * Math.cos((hDeg * Math.PI) / 180), b = C * Math.sin((hDeg * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
  if (lin.some((v) => v < -1e-4 || v > 1 + 1e-4)) return null;
  return toHex(lin.map((v) => l2s(Math.min(1, Math.max(0, v)))));
}

export const dE = (a: string, b: string, v: Vision) => deltaE2000(labAs(a, v), labAs(b, v));
export const dN = (a: string, b: string) => dE(a, b, 'normal');
export const dCvd = (a: string, b: string) => Math.min(dE(a, b, 'protan'), dE(a, b, 'deutan'), dE(a, b, 'tritan'));
export const dAll = (a: string, b: string) => ({ normal: dN(a, b), protan: dE(a, b, 'protan'), deutan: dE(a, b, 'deutan'), tritan: dE(a, b, 'tritan') });

/** W3C soft-light of a grey `g` (0..255) at alpha over an opaque base, per channel in gamma-encoded space (what canvas does). */
export function softLight(base: string, grey: number, alpha: number) {
  const cs = grey / 255;
  return toHex(rgb(base).map((v) => { const cb = v / 255; const D = cb <= 0.25 ? ((16 * cb - 12) * cb + 4) * cb : Math.sqrt(cb); const B = cs <= 0.5 ? cb - (1 - 2 * cs) * cb * (1 - cb) : cb + (2 * cs - 1) * (D - cb); return 255 * ((1 - alpha) * cb + alpha * B); }));
}

// ---- the approved Ownership states as live overlays (final.md §2.1, p55-paint.js drawStateOverlay)
export const CLOTH = '#E8DCC2', ASH = '#8F8C88', MOSS = '#5E7F45';
export const STATES = ['raw', 'haze', 'outOfSight', 'ash10', 'moss6'] as const;
export type State = (typeof STATES)[number];
/** Out-of-sight grey alpha per fill (approved: 0.10 everywhere); a proposal may set its own. */
export const OOS: { alpha: Record<string, number> } = { alpha: {} };
export const stOver = (x: string, st: State, f: string) => st === 'raw' ? x : st === 'haze' ? over(x, CLOTH, 0.04) : st === 'outOfSight' ? over(x, greyEqL(f), OOS.alpha[f] ?? 0.1) : st === 'ash10' ? over(x, ASH, 0.1) : over(x, MOSS, 0.06);

/** Every nation banner (all five colors, every entry), and the ones palette.test.ts uses (the M1 nations: R and G). */
export const ALL_BANNERS = [...new Set(Object.values(NATION_BANNERS).flat())];
export const M1_BANNERS = [...NATION_BANNERS.R, ...NATION_BANNERS.G];

/** The band rule (docs/09, palette.test.ts): banner vs ground direct, or keyline vs both, at minN / minC. */
export function bandOk(banner: string, ground: string, keyline: string, minN = 20, minC = 12) {
  const direct = dN(banner, ground) >= minN && dCvd(banner, ground) >= minC;
  const outlined = dN(keyline, ground) >= minN && dCvd(keyline, ground) >= minC && dN(keyline, banner) >= minN && dCvd(keyline, banner) >= minC;
  return { ok: direct || outlined, direct, outlined };
}

export const lum = (h: string) => { const [r, g, b] = rgb(h).map(s2l) as [number, number, number]; return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export const wcag = (a: string, b: string) => contrastRatio(a, b);
export const f1 = (n: number) => n.toFixed(1), f2 = (n: number) => n.toFixed(2), f3 = (n: number) => n.toFixed(3);

/** Closest pair of a palette under one vision. */
export function closest(p: Partial<Pal> | Record<string, string>, v: Vision) {
  const ks = Object.keys(p); let best = { a: '', b: '', d: 1e9 };
  for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) { const d = dE((p as Record<string, string>)[ks[i]!]!, (p as Record<string, string>)[ks[j]!]!, v); if (d < best.d) best = { a: ks[i]!, b: ks[j]!, d }; }
  return best;
}
