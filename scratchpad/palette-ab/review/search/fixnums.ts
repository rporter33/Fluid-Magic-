// Numbers for the proposed faces (repo color math): passable-peak faces from the Mountains fill, forest crowns at +22, plains trees.
import { deltaE2000, labAs, VISIONS } from './colorMath.ts';
import { contrastRatio } from './colors.ts';
const hex2rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const rgb2hex = (c: number[]) => '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();
const s2l = (c: number) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const l2s = (c: number) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.max(0, c) ** (1 / 2.4) - 0.055);
function rgb2lab([r = 0, g = 0, b = 0]: number[]) { const R = s2l(r), G = s2l(g), B = s2l(b); const X = (0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047, Y = 0.2126 * R + 0.7152 * G + 0.0722 * B, Z = (0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883; const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116); return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))]; }
function lab2rgb([L = 0, a = 0, b = 0]: number[]) { const fy = (L + 16) / 116, fx = fy + a / 500, fz = fy - b / 200; const fi = (t: number) => (t ** 3 > 0.008856 ? t ** 3 : (t - 16 / 116) / 7.787); const X = fi(fx) * 0.95047, Y = fi(fy), Z = fi(fz) * 1.08883; return [l2s(3.2406 * X - 1.5372 * Y - 0.4986 * Z), l2s(-0.9689 * X + 1.8758 * Y + 0.0415 * Z), l2s(0.0557 * X - 0.204 * Y + 1.057 * Z)]; }
const shadeL = (h: string, d: number) => { const l = rgb2lab(hex2rgb(h)); l[0] = Math.max(0, Math.min(100, (l[0] ?? 0) + d)); return rgb2hex(lab2rgb(l)); };
const mix = (a: string, b: string, t: number) => { const A = hex2rgb(a), B = hex2rgb(b); return rgb2hex(A.map((v, j) => v + ((B[j] ?? 0) - v) * t)); };
const faces = (f: string) => ({ lit: mix(shadeL(f, 12), '#F6D9A0', 0.12), shade: mix(shadeL(f, -18), '#3A4466', 0.14) });
const L = (h: string) => (rgb2lab(hex2rgb(h))[0] ?? 0).toFixed(1);
const all = (a: string, b: string) => VISIONS.map((v) => deltaE2000(labAs(a, v), labAs(b, v)).toFixed(1)).join(' / ');
for (const [n, p] of Object.entries({ painted: { mountains: '#9FB8D0', forest: '#243F1B', plains: '#D4DCC0' }, bright: { mountains: '#8DA4AD', forest: '#374C2B', plains: '#C1D29F' } })) {
  const F = faces(p.mountains), sh = mix(shadeL(p.mountains, -26), '#3A4466', 0.14);
  console.log(`${n} peaks from fill: lit ${F.lit} (L* ${L(F.lit)}) WCAG ${contrastRatio(F.lit, p.mountains).toFixed(2)} dE ${all(F.lit, p.mountains)}; shade ${sh} (L* ${L(sh)}) WCAG ${contrastRatio(sh, p.mountains).toFixed(2)}`);
  const lit22 = mix(shadeL(p.forest, 22), '#F6D9A0', 0.12), lit12 = faces(p.forest).lit;
  console.log(`${n} forest crown lit: +12 ${lit12} (L* ${L(lit12)}, WCAG ${contrastRatio(lit12, p.forest).toFixed(2)}) -> +22 ${lit22} (L* ${L(lit22)}, WCAG ${contrastRatio(lit22, p.forest).toFixed(2)})`);
  const tf = shadeL(p.forest, 20), T = faces(tf);
  console.log(`${n} plains trees: lit ${T.lit} (L* ${L(T.lit)}) shade ${T.shade} (L* ${L(T.shade)}); lit vs plains WCAG ${contrastRatio(T.lit, p.plains).toFixed(2)} dE ${all(T.lit, p.plains)}`);
}
