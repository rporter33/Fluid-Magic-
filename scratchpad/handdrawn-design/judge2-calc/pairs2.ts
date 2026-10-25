// Judge 2 color checks for the painted map. Run: cd /home/user/Fluid-Magic- && npx tsx <this file>
// Uses the repo's colorMath (CIEDE2000 under four visions) and NATION_BANNERS / keylineFor.
import { labAs, deltaE2000, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath.ts';
import { NATION_BANNERS, keylineFor } from '/home/user/Fluid-Magic-/src/content/colors.ts';

const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const hx = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0').toUpperCase();
const toHex = (c: number[]) => `#${hx(c[0]!)}${hx(c[1]!)}${hx(c[2]!)}`;
const over = (base: string, top: string, a: number) => toHex(rgb(base).map((v, i) => v * (1 - a) + rgb(top)[i]! * a));
const lin = (c: number) => { const s = c / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
const lum = (h: string) => { const [r, g, b] = rgb(h).map(lin); return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!; };
const wcag = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x! + 0.05) / (y! + 0.05); };
const d = (a: string, b: string, v: (typeof VISIONS)[number]) => deltaE2000(labAs(a, v), labAs(b, v));
const dN = (a: string, b: string) => d(a, b, 'normal');
const dC = (a: string, b: string) => Math.min(...VISIONS.filter((v) => v !== 'normal').map((v) => d(a, b, v)));
const s2l = (c: number) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const l2s = (c: number) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.max(0, c) ** (1 / 2.4) - 0.055);
function toLab(h: string) { const [R, G, B] = rgb(h).map(s2l) as [number, number, number]; const X = (0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047, Y = 0.2126 * R + 0.7152 * G + 0.0722 * B, Z = (0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883; const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116); return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))] as [number, number, number]; }
function fromLab([L, a, b]: number[]) { const fy = (L! + 16) / 116, fx = fy + a! / 500, fz = fy - b! / 200; const fi = (t: number) => (t ** 3 > 0.008856 ? t ** 3 : (t - 16 / 116) / 7.787); const X = fi(fx) * 0.95047, Y = fi(fy), Z = fi(fz) * 1.08883; return toHex([l2s(3.2406 * X - 1.5372 * Y - 0.4986 * Z), l2s(-0.9689 * X + 1.8758 * Y + 0.0415 * Z), l2s(0.0557 * X - 0.204 * Y + 1.057 * Z)]); }
const shadeL = (h: string, dl: number) => { const l = toLab(h); l[0] = Math.max(0, Math.min(100, l[0] + dl)); return fromLab(l); };
const desat = (h: string, k: number) => { const l = toLab(h); l[1] *= 1 - k; l[2] *= 1 - k; return fromLab(l); };
const Ls = (h: string) => toLab(h)[0];
// W3C soft-light in gamma-encoded space (what canvas does), with alpha
function softLight(base: string, grey: number, alpha: number) {
  const cs = grey / 255;
  return toHex(rgb(base).map((v) => { const cb = v / 255; const D = cb <= 0.25 ? ((16 * cb - 12) * cb + 4) * cb : Math.sqrt(cb); const B = cs <= 0.5 ? cb - (1 - 2 * cs) * cb * (1 - cb) : cb + (2 * cs - 1) * (D - cb); return 255 * ((1 - alpha) * cb + alpha * B); }));
}
const Phi = (x: number) => { const t = 1 / (1 + 0.2316419 * Math.abs(x)); const dd = 0.3989423 * Math.exp(-x * x / 2); const p = dd * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return x > 0 ? 1 - p : p; };

const f1 = (n: number) => n.toFixed(1);
const FILLS: Record<string, string> = { Plains: '#C1D29F', Farmland: '#EEBA3A', Forest: '#374C2B', Hills: '#856824', Mountains: '#8DA4AD', Swamp: '#1A727A', Wasteland: '#AE897F' };
// Terrain-pair extremes across Ownership states, for several mottle settings
const states = (f: string) => ({ raw: f, haze: over(f, '#E8DCC2', 0.04), outOfSight: desat(f, 0.1), ash10: over(f, '#8F8C88', 0.1), moss6: over(f, '#5E7F45', 0.06) });
function run(label: string, M: Record<string, number>) {
  const names = Object.keys(FILLS); let wN = { v: 1e9, s: '' }, wC = { v: 1e9, s: '' }; const below: Record<string, number> = {};
  for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
    const A = names[i]!, B = names[j]!;
    for (const [sa, fa] of Object.entries(states(FILLS[A]!))) for (const [sb, fb] of Object.entries(states(FILLS[B]!))) {
      const va = [fa, shadeL(fa, M[A]!), shadeL(fa, -M[A]!)], vb = [fb, shadeL(fb, M[B]!), shadeL(fb, -M[B]!)];
      for (const a of va) for (const b of vb) { const n = dN(a, b), c = dC(a, b); if (c < 12 || n < 20) below[`${A}-${B}`] = (below[`${A}-${B}`] ?? 0) + 1; if (n < wN.v) wN = { v: n, s: `${A}/${sa} vs ${B}/${sb}` }; if (c < wC.v) wC = { v: c, s: `${A}/${sa} vs ${B}/${sb}` }; }
    }
  }
  console.log(`${label}: closest normal ${f1(wN.v)} (${wN.s}); closest CVD ${f1(wC.v)} (${wC.s}); pairs under 20/12 by terrain pair: ${JSON.stringify(below)}`);
}
const z = { Plains: 0, Farmland: 0, Forest: 0, Hills: 0, Mountains: 0, Swamp: 0, Wasteland: 0 };
run('no mottle (the approved states)', z);
run('design (4/3/4/2/2/2/2)', { Plains: 4, Farmland: 3, Forest: 4, Hills: 2, Mountains: 2, Swamp: 2, Wasteland: 2 });
run('Hills and Wasteland at 1', { Plains: 4, Farmland: 3, Forest: 4, Hills: 1, Mountains: 2, Swamp: 2, Wasteland: 1 });
run('Hills and Wasteland at 0', { Plains: 4, Farmland: 3, Forest: 4, Hills: 0, Mountains: 2, Swamp: 2, Wasteland: 0 });
run('Hills, Wasteland 0; Mountains, Swamp 1', { Plains: 4, Farmland: 3, Forest: 4, Hills: 0, Mountains: 1, Swamp: 1, Wasteland: 0 });
const D = { Plains: 4, Farmland: 3, Forest: 4, Hills: 2, Mountains: 2, Swamp: 2, Wasteland: 2 };
const sc = (k: number) => Object.fromEntries(Object.entries(D).map(([a, b]) => [a, b * k]));
run('design x 0.55 (a single blotch peak: radial alpha 0.55)', sc(0.55));
run('design x 0.8 (two same-sign blotches overlapping)', sc(0.8));
