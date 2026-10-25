import { labAs, deltaE2000, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath.ts';
import { NATION_BANNERS } from '/home/user/Fluid-Magic-/src/content/colors.ts';
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
const FILLS: Record<string, string> = { Plains: '#C1D29F', Farmland: '#EEBA3A', Forest: '#374C2B', Hills: '#856824', Mountains: '#8DA4AD', Swamp: '#1A727A', Wasteland: '#AE897F' };
const banners = [...new Set([...Object.values(NATION_BANNERS).flat(), '#91A092'])];
console.log('Tokens (painted wood in the banner, pewter #91A092 for independents) against flat fills and painted extremes (fill +-4 L*):');
let flatFail = 0, paintFail = 0, worse: string[] = [];
for (const b of banners) for (const [n, f] of Object.entries(FILLS)) {
  const flatOk = dN(b, f) >= 20 && dC(b, f) >= 12;
  const paintOk = [f, shadeL(f, 4), shadeL(f, -4)].every((p) => dN(b, p) >= 20 && dC(b, p) >= 12);
  if (!flatOk) flatFail++; if (!paintOk) paintFail++; if (flatOk && !paintOk) worse.push(`${b} on ${n}`);
}
console.log(`  pairs below 20/12 on the flat fill: ${flatFail}; on the painted extremes: ${paintFail}; newly below because of paint: ${worse.join(', ') || 'none'}`);
console.log('  every token keeps its 1.5 px outline #1C1A17 at 70% and a contact shadow; outline vs paint extremes (WCAG, worst per fill):');
console.log('  ' + Object.entries(FILLS).map(([n, f]) => `${n} ${Math.min(...[f, shadeL(f, 4), shadeL(f, -4)].map((p) => wcag(over(p, '#1C1A17', 0.7), p))).toFixed(2)}`).join(', '));
console.log('  the token top-edge highlight (banner +12 L*) and count plate (banner secondary, flat) carry it where the outline is weak (Forest, Swamp, Hills): plate text is unchanged');
