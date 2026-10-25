// Out of sight (10% toward the fill's grey of equal L*) and haze (4% paper) against the raw fill, per terrain, both palettes.
import { deltaE2000, labAs } from './colorMath.ts';
const hex2rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const rgb2hex = (c: number[]) => '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();
const s2l = (c: number) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const l2s = (c: number) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.max(0, c) ** (1 / 2.4) - 0.055);
function rgb2lab([r = 0, g = 0, b = 0]: number[]) { const R = s2l(r), G = s2l(g), B = s2l(b); const X = (0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047, Y = 0.2126 * R + 0.7152 * G + 0.0722 * B, Z = (0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883; const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116); return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))]; }
function lab2rgb([L = 0, a = 0, b = 0]: number[]) { const fy = (L + 16) / 116, fx = fy + a / 500, fz = fy - b / 200; const fi = (t: number) => (t ** 3 > 0.008856 ? t ** 3 : (t - 16 / 116) / 7.787); const X = fi(fx) * 0.95047, Y = fi(fy), Z = fi(fz) * 1.08883; return [l2s(3.2406 * X - 1.5372 * Y - 0.4986 * Z), l2s(-0.9689 * X + 1.8758 * Y + 0.0415 * Z), l2s(0.0557 * X - 0.204 * Y + 1.057 * Z)]; }
const mix = (a: string, b: string, t: number) => { const A = hex2rgb(a), B = hex2rgb(b); return rgb2hex(A.map((v, j) => v + ((B[j] ?? 0) - v) * t)); };
const grey = (f: string) => rgb2hex(lab2rgb([rgb2lab(hex2rgb(f))[0] ?? 0, 0, 0]));
const PAL: Record<string, Record<string, string>> = {
  bright: { plains: '#C1D29F', farmland: '#EEBA3A', forest: '#374C2B', hills: '#856824', mountains: '#8DA4AD', swamp: '#1A727A', wasteland: '#AE897F' },
  painted: { plains: '#D4DCC0', farmland: '#CEA265', forest: '#243F1B', hills: '#7D6542', mountains: '#9FB8D0', swamp: '#58696E', wasteland: '#9E8A91' },
};
for (const [n, p] of Object.entries(PAL)) console.log(n, 'out of sight dE: ' + Object.entries(p).map(([t, f]) => `${t} ${deltaE2000(labAs(f, 'normal'), labAs(mix(f, grey(f), 0.1), 'normal')).toFixed(2)}`).join(', '));
