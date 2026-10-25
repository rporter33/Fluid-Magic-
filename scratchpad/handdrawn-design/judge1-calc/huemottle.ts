// Temperature mottle: each blotch pair varies L* by ±M (as design §1.4) and also shifts (a*, b*) by ±t along a warm-cool axis.
// Worst case over all extremes (fill, light-warm, dark-cool, light-cool, dark-warm) for every terrain pair.
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
const M: Record<string, number> = { Plains: 4, Farmland: 3, Forest: 4, Hills: 2, Mountains: 2, Swamp: 2, Wasteland: 2 };
const W = [0.35, 0.94]; // warm axis in (a*, b*): toward ochre
function ext(t: string, tt: number) { const l = toLab(FILLS[t]!); const out = [FILLS[t]!]; for (const sl of [-1, 0, 1]) for (const sw of [-1, 0, 1]) { if (!sl && !sw) continue; out.push(fromLab([l[0] + sl * M[t]!, l[1] + sw * tt * W[0]!, l[2] + sw * tt * W[1]!])); } return out; }
for (const tt of [0, 2, 3, 4, 5]) { const n = Object.keys(FILLS); let pn = 1e9, ps = '', pc = 1e9, pcs = '';
  for (let i = 0; i < n.length; i++) for (let j = i + 1; j < n.length; j++) for (const a of ext(n[i]!, tt)) for (const b of ext(n[j]!, tt)) { const x = d(a, b, 'normal'); if (x < pn) { pn = x; ps = n[i] + '/' + n[j]; } const c = Math.min(...VISIONS.filter((v) => v !== 'normal').map((v) => d(a, b, v))); if (c < pc) { pc = c; pcs = n[i] + '/' + n[j]; } }
  console.log(`warm-cool mottle ±${tt} (a*b*) with design L* mottle: closest normal ${pn.toFixed(1)} (${ps}), closest CVD ${pc.toFixed(1)} (${pcs})`); }
