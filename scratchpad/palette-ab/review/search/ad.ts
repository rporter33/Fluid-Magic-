// Art-director spot checks with the repo's own color math (colorMath.ts, colors.ts copied unchanged).
// Run from the repo root: npx tsx ad.ts
import { deltaE2000, labAs, VISIONS, type Vision } from './colorMath.ts';
import { contrastRatio, keylineFor, NATION_BANNERS } from './colors.ts';
const hex2rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const rgb2hex = (c: number[]) => '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();
const s2l = (c: number) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const l2s = (c: number) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.max(0, c) ** (1 / 2.4) - 0.055);
function rgb2lab([r = 0, g = 0, b = 0]: number[]) { const R = s2l(r), G = s2l(g), B = s2l(b); const X = (0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047, Y = 0.2126 * R + 0.7152 * G + 0.0722 * B, Z = (0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883; const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116); return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))]; }
function lab2rgb([L = 0, a = 0, b = 0]: number[]) { const fy = (L + 16) / 116, fx = fy + a / 500, fz = fy - b / 200; const fi = (t: number) => (t ** 3 > 0.008856 ? t ** 3 : (t - 16 / 116) / 7.787); const X = fi(fx) * 0.95047, Y = fi(fy), Z = fi(fz) * 1.08883; return [l2s(3.2406 * X - 1.5372 * Y - 0.4986 * Z), l2s(-0.9689 * X + 1.8758 * Y + 0.0415 * Z), l2s(0.0557 * X - 0.204 * Y + 1.057 * Z)]; }
const shadeL = (h: string, d: number) => { const l = rgb2lab(hex2rgb(h)); l[0] = Math.max(0, Math.min(100, (l[0] ?? 0) + d)); return rgb2hex(lab2rgb(l)); };
const mix = (a: string, b: string, t: number) => { const A = hex2rgb(a), B = hex2rgb(b); return rgb2hex(A.map((v, j) => v + ((B[j] ?? 0) - v) * t)); };
const faces = (f: string) => ({ lit: mix(shadeL(f, 12), '#F6D9A0', 0.12), shade: mix(shadeL(f, -18), '#3A4466', 0.14) });
const dE = (a: string, b: string, v: Vision = 'normal') => deltaE2000(labAs(a, v), labAs(b, v));
const r1 = (x: number) => Math.round(x * 10) / 10;
const L = (h: string) => r1(rgb2lab(hex2rgb(h))[0] ?? 0);
const all = (a: string, b: string) => VISIONS.map((v) => r1(dE(a, b, v))).join(' / ');
const PAL: Record<string, Record<string, string>> = {
  bright: { plains: '#C1D29F', farmland: '#EEBA3A', forest: '#374C2B', hills: '#856824', mountains: '#8DA4AD', swamp: '#1A727A', wasteland: '#AE897F' },
  painted: { plains: '#D4DCC0', farmland: '#CEA265', forest: '#243F1B', hills: '#7D6542', mountains: '#9FB8D0', swamp: '#58696E', wasteland: '#9E8A91' },
};
const extra = process.argv[2]; if (extra) PAL.candidate = JSON.parse(extra);
for (const [name, p] of Object.entries(PAL)) {
  console.log(`\n== ${name}`);
  console.log('L*: ' + Object.entries(p).map(([t, f]) => `${t} ${L(f)}`).join(', '));
  // water on mountains (brook #BCD6D9, pond #A6C7CC) and on every fill: normal / protan / deutan / tritan
  for (const [w, c] of [['brook', '#BCD6D9'], ['pond', '#A6C7CC']]) console.log(`${w} ${c} vs mountains ${p.mountains}: dE ${all(c, p.mountains ?? '')}, WCAG ${contrastRatio(c, p.mountains ?? '').toFixed(2)}`);
  // passable peaks: literal faces against the mountains fill
  for (const [k, c] of [['peak lit', '#B4C1C6'], ['peak shade', '#6E7F86']]) console.log(`${k} ${c} vs mountains: dE ${all(c, p.mountains ?? '')}, WCAG ${contrastRatio(c, p.mountains ?? '').toFixed(2)}`);
  // plains copse crowns (faces of the plains fill) against the plains fill
  const F = faces(p.plains ?? ''); console.log(`plains copse: lit ${F.lit} (L* ${L(F.lit)}), shade ${F.shade} (L* ${L(F.shade)}); lit vs fill dE ${r1(dE(F.lit, p.plains ?? ''))}, WCAG ${contrastRatio(F.lit, p.plains ?? '').toFixed(2)}`);
  const FF = faces(p.forest ?? ''); console.log(`forest crowns: lit ${FF.lit} (L* ${L(FF.lit)}), shade ${FF.shade} (L* ${L(FF.shade)}); lit vs fill dE ${r1(dE(FF.lit, p.forest ?? ''))}, WCAG ${contrastRatio(FF.lit, p.forest ?? '').toFixed(2)}`);
  // Ember banners on Farmland: direct, and the keyline route
  for (const b of NATION_BANNERS.R) { const f = p.farmland ?? '', k = keylineFor(f); console.log(`Ember ${b} on farmland ${f}: direct ${all(b, f)}; keyline ${k} vs fill ${all(k, f)}, vs banner ${all(k, b)}`); }
}
