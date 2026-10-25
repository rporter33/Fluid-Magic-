import { labAs, deltaE2000, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath.ts';
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const hx = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0').toUpperCase();
const toHex = (c: number[]) => `#${hx(c[0]!)}${hx(c[1]!)}${hx(c[2]!)}`;
const d = (a: string, b: string, v: (typeof VISIONS)[number]) => deltaE2000(labAs(a, v), labAs(b, v));
const s2l = (c: number) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const l2s = (c: number) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.max(0, c) ** (1 / 2.4) - 0.055);
function toLab(h: string) { const [R, G, B] = rgb(h).map(s2l) as [number, number, number]; const X = (0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047, Y = 0.2126 * R + 0.7152 * G + 0.0722 * B, Z = (0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883; const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116); return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))] as [number, number, number]; }
function fromLab([L, a, b]: number[]) { const fy = (L! + 16) / 116, fx = fy + a! / 500, fz = fy - b! / 200; const fi = (t: number) => (t ** 3 > 0.008856 ? t ** 3 : (t - 16 / 116) / 7.787); const X = fi(fx) * 0.95047, Y = fi(fy), Z = fi(fz) * 1.08883; return toHex([l2s(3.2406 * X - 1.5372 * Y - 0.4986 * Z), l2s(-0.9689 * X + 1.8758 * Y + 0.0415 * Z), l2s(0.0557 * X - 0.204 * Y + 1.057 * Z)]); }
const FILLS: Record<string, string> = { Plains: '#C1D29F', Farmland: '#EEBA3A', Forest: '#374C2B', Hills: '#856824', Mountains: '#8DA4AD', Swamp: '#1A727A', Wasteland: '#AE897F' };
// glaze: reduce chroma by k and add a warm bias (a*, b*) shift
function glaze(h: string, k: number, wa: number, wb: number) { const l = toLab(h); return fromLab([l[0], l[1] * (1 - k) + wa, l[2] * (1 - k) + wb]); }
function minPairs(F: Record<string, string>) { const n = Object.keys(F); let pn = 1e9, ps = '', pc = 1e9, pcs = '';
  for (let i = 0; i < n.length; i++) for (let j = i + 1; j < n.length; j++) { const a = F[n[i]!]!, b = F[n[j]!]!; const x = d(a, b, 'normal'); if (x < pn) { pn = x; ps = n[i] + '/' + n[j]; } const c = Math.min(...VISIONS.filter((v) => v !== 'normal').map((v) => d(a, b, v))); if (c < pc) { pc = c; pcs = n[i] + '/' + n[j]; } }
  return `normal ${pn.toFixed(1)} (${ps}), CVD ${pc.toFixed(1)} (${pcs})`; }
console.log('approved', minPairs(FILLS));
for (const k of [0.1, 0.15, 0.2, 0.3]) for (const [wa, wb] of [[0, 0], [1, 3], [2, 5]]) {
  const G: Record<string, string> = {}; for (const [t, h] of Object.entries(FILLS)) G[t] = glaze(h, k, wa!, wb!);
  console.log(`chroma -${k * 100}% warm(${wa},${wb})`, minPairs(G), Object.values(G).join(' '));
}
// chroma of each fill
for (const [t, h] of Object.entries(FILLS)) { const l = toLab(h); console.log(t, h, 'L', l[0].toFixed(1), 'C', Math.hypot(l[1], l[2]).toFixed(1)); }
