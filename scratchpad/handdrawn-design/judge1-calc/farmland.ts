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
function minPairs(F: Record<string, string>) { const n = Object.keys(F); let pn = 1e9, ps = '', pc = 1e9, pcs = '';
  for (let i = 0; i < n.length; i++) for (let j = i + 1; j < n.length; j++) { const a = F[n[i]!]!, b = F[n[j]!]!; const x = d(a, b, 'normal'); if (x < pn) { pn = x; ps = n[i] + '/' + n[j]; } const c = Math.min(...VISIONS.filter((v) => v !== 'normal').map((v) => d(a, b, v))); if (c < pc) { pc = c; pcs = n[i] + '/' + n[j]; } }
  return { pn, pc, s: `normal ${pn.toFixed(1)} (${ps}), CVD ${pc.toFixed(1)} (${pcs})` }; }
const fl = toLab(FILLS.Farmland!); const hue = Math.atan2(fl[2], fl[1]);
const res: string[] = [];
for (const C of [44, 48, 52, 56, 60]) for (const L of [66, 69, 72, 75, 78]) for (const dh of [-0.06, 0, 0.06]) {
  const h = hue + dh; const F = { ...FILLS, Farmland: fromLab([L, C * Math.cos(h), C * Math.sin(h)]) }; const m = minPairs(F);
  if (m.pn >= 20 && m.pc >= 12) res.push(`Farmland ${F.Farmland} L${L} C${C} dh${dh}: ${m.s}`);
}
console.log(res.length ? res.join('\n') : 'none pass');
