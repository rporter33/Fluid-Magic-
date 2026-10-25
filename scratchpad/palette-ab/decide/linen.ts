import { labAs } from './colorMath.ts';
const hex2rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const rgb2hex = (c: number[]) => '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();
const s2l = (c: number) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const l2s = (c: number) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.max(0, c) ** (1 / 2.4) - 0.055);
function rgb2lab([r, g, b]: number[]) { const R = s2l(r!), G = s2l(g!), B = s2l(b!); const X = (0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047, Y = 0.2126 * R + 0.7152 * G + 0.0722 * B, Z = (0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883; const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116); return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))]; }
function lab2rgb([L, a, b]: number[]) { const fy = (L! + 16) / 116, fx = fy + a! / 500, fz = fy - b! / 200; const fi = (t: number) => (t ** 3 > 0.008856 ? t ** 3 : (t - 16 / 116) / 7.787); const X = fi(fx) * 0.95047, Y = fi(fy), Z = fi(fz) * 1.08883; return [l2s(3.2406 * X - 1.5372 * Y - 0.4986 * Z), l2s(-0.9689 * X + 1.8758 * Y + 0.0415 * Z), l2s(0.0557 * X - 0.204 * Y + 1.057 * Z)]; }
const desat = (h: string, k: number) => { const l = rgb2lab(hex2rgb(h)); l[1]! *= 1; l[1] = l[1]! * (1 - k); l[2] = l[2]! * (1 - k); return rgb2hex(lab2rgb(l)); };
const mix = (a: string, b: string, t: number) => { const A = hex2rgb(a), B = hex2rgb(b); return rgb2hex(A.map((v, j) => v + (B[j]! - v) * t)); };
for (const [f, want] of [['#374C2B', '#79786B'], ['#856824', '#7E7767'], ['#1A727A', '#6F7A77']]) {
  const d = desat(f!, 0.8);
  for (const lin of ['#E8DCC2', '#F4EEDF', '#EFE9DC', '#E9E4D8']) for (const a of [0.12, 0.19, 0.33]) { const m = mix(d, lin, a); if (Math.abs(parseInt(m.slice(1, 3), 16) - parseInt(want!.slice(1, 3), 16)) <= 2 && Math.abs(parseInt(m.slice(5, 7), 16) - parseInt(want!.slice(5, 7), 16)) <= 2) console.log(f, d, lin, a, m, want, labAs(m, 'normal')[0].toFixed(1)); }
}
