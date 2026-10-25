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

const FILLS: Record<string, string> = { Plains: '#C1D29F', Farmland: '#EEBA3A', Forest: '#374C2B', Hills: '#856824', Mountains: '#8DA4AD', Swamp: '#1A727A', Wasteland: '#AE897F' };
const DARK = new Set(["Forest", "Hills", "Swamp"]);
const banners = [...new Set(Object.values(NATION_BANNERS).flat())];
const f1 = (n: number) => n.toFixed(1), f2 = (n: number) => n.toFixed(2);
// ---------------------------------------------------------------- final.md measurements (handdrawn-design/final-calc/final.ts)
const MANA: Record<string, string> = { W: '#F3E6B8', U: '#3A7BD5', B: '#3D2B4F', R: '#FD6533', G: '#00674B' };
const CLOTH = '#E8DCC2', ASH = '#8F8C88', MOSS = '#5E7F45';
const greyEqL = (f: string) => fromLab([Ls(f), 0, 0]);
const say = (s = '') => console.log(s);
const stOver = (x: string, st: string, f: string) => st === 'raw' ? x : st === 'haze' ? over(x, CLOTH, 0.04) : st === 'outOfSight' ? over(x, greyEqL(f), 0.1) : st === 'ash10' ? over(x, ASH, 0.1) : over(x, MOSS, 0.06);
const STATES = ['raw', 'haze', 'outOfSight', 'ash10', 'moss6'];
const FIN: Record<string, { M: number; E: number; B: number }> = { Plains: { M: 3, E: -7, B: 1 }, Farmland: { M: 3, E: -7, B: 0 }, Forest: { M: 3, E: -5, B: 0 }, Hills: { M: 0, E: -6, B: 1 }, Mountains: { M: 1, E: -7, B: 1 }, Swamp: { M: 1, E: -6, B: 2 }, Wasteland: { M: 0, E: -8, B: 1 } };
const paintVars = (n: string, f: string) => { const r = FIN[n]!; const v = [f, shadeL(f, r.M), shadeL(f, -r.M), shadeL(f, r.E), shadeL(f, r.E - 3)]; if (r.B) v.push(over(f, shadeL(f, 4), 0.35), over(f, shadeL(f, -9), 0.3)); if (n === 'Mountains') v.push(over(f, '#3A4466', 0.08)); return v; };
const GR: Record<string, [number, number]> = { Plains: [-0.7, 0.4], Farmland: [-0.6, 0.3], Forest: [-2.1, 2.6], Hills: [-2.9, 2.6], Mountains: [-3.1, 2.3], Swamp: [-1.5, 1.5], Wasteland: [-3.7, 2.9] };

say('# final.md measurements, part 2 (handdrawn-design/final-calc/final2.ts)\n');
say('## M. Tracks as live screen-constant dots, 1.8 px, alpha 1, at the pitch range of the 2^(1/4) re-layout (2.8 to 3.33 px): WCAG dot peak / line average on the fill; worst peak and worst average over paint variants, granulation and every Ownership state');
const INKD = '#3E3428', INKL = '#E8DCC2';
for (const p of [2.5, 3.0]) {
  const d = 1.8, peakA = 1, avgA = Math.PI * d / (4 * p);
  const rows = Object.entries(FILLS).map(([n, f]) => { const ink = DARK.has(n) ? INKL : INKD; let wp = 99, wa = 99;
    for (const v0 of paintVars(n, f)) for (const g of [0, GR[n]![0], GR[n]![1]]) for (const st of STATES) { const v = stOver(shadeL(v0, g), st, f); wp = Math.min(wp, wcag(over(v, ink, peakA), v)); wa = Math.min(wa, wcag(over(v, ink, avgA), v)); }
    return `${n} ${f2(wcag(over(f, ink, peakA), f))}/${f2(wcag(over(f, ink, avgA), f))} (worst ${f2(wp)}/${f2(wa)})`; });
  say(`pitch ${p} px: ${rows.join(', ')}`);
}
say('v2 footpath (R34) at the start zoom, for reference: avg 1.80, dash peak 3.00 (final.out D)');

say('\n## N. Pigment flecks: ΔE2000 to the nearest banner and mana primary (normal / worst deficiency), chroma, WCAG on the fill');
const refs = [...banners, ...Object.values(MANA)];
const FL: Array<[string, string, string]> = [['Plains', 'wildflower white', '#EEEEE4'], ['Plains', 'wildflower white warm', '#F4F1E6'], ['Plains', 'cornflower', '#B9CBE6'], ['Plains', 'lilac', '#CDB9DA'], ['Mountains', 'ochre lichen', '#B59A55'], ['Mountains', 'grey lichen', '#C8CABF'], ['Wasteland', 'rust', '#8E5A3E'], ['Swamp', 'pale sedge', '#C9C7B8'], ['Swamp', 'sedge straw', '#BDB8A0']];
for (const [t, nm, c] of FL) { let wn = { v: 1e9, r: '' }, wc = { v: 1e9, r: '' }; for (const r of refs) { const a = dN(c, r), b = dC(c, r); if (a < wn.v) wn = { v: a, r }; if (b < wc.v) wc = { v: b, r }; } const lab = toLab(c); say(`${t} ${nm} ${c}: nearest ${wn.r} ${f1(wn.v)} / ${wc.r} ${f1(wc.v)}; C* ${f1(Math.hypot(lab[1], lab[2]))}; on the fill ${f2(wcag(c, FILLS[t]!))}`); }

say('\n## O. Paint means: what a 3% fleck coverage moves (ΔE2000 of the fill mixed 3% with the fleck)');
for (const [t, nm, c] of FL) say(`${t} ${nm}: ${f2(dN(FILLS[t]!, over(FILLS[t]!, c, 0.03)))}`);

say('\n## P. Settlement and landmark faces: warm lit (+8 L*, 12% #F6D9A0) and cool shade (-12 L*, 14% #3A4466) for the M1 kits and stone; ΔE from the approved flat tone');
for (const t of ['#3A3633', '#8F8C88', '#4E6B3A', '#A0785A', '#C2A86B', '#D8CBB0', '#CFC6B4', '#8C6A47']) { const lt = over(shadeL(t, 8), '#F6D9A0', 0.12), sh = over(shadeL(t, -12), '#3A4466', 0.14); say(`${t}: lit ${lt} (ΔE ${f1(dN(t, lt))}), shade ${sh} (ΔE ${f1(dN(t, sh))})`); }

say('\n## Q. Region-name ink at 0.9 over stamp faces with the knock-out halo (the run fill at 50%) under it: worst WCAG');
{ const faces = (f: string) => [over(shadeL(f, 12), '#F6D9A0', 0.12), over(shadeL(f, -18), '#3A4466', 0.14)];
  const rows = Object.entries(FILLS).map(([n, f]) => { const ink = DARK.has(n) ? '#F4EEDF' : '#2A1F14'; let wNo = 99, wHalo = 99; for (const fc of faces(f)) { wNo = Math.min(wNo, wcag(over(fc, ink, 0.9), fc)); const h = over(fc, f, 0.5); wHalo = Math.min(wHalo, wcag(over(h, ink, 0.9), h)); } return `${n} no halo ${f2(wNo)}, with halo ${f2(wHalo)}`; });
  say(rows.join('; ')); }

say('\n## R. Tracks (1.8 px dots, alpha 1) on the interior ground (fill, mottle, blooms, relief wash, granulation, every state; no edge pool), and inside the edge pool, by pitch');
const interior = (n: string, f: string) => paintVars(n, f).filter((_, k) => k !== 3 && k !== 4);
const pool = (n: string, f: string) => [shadeL(f, FIN[n]!.E), shadeL(f, FIN[n]!.E - 3)];
for (const p of [2.5, 2.6, 2.8, 3.0, 3.1, 3.33]) {
  const avgA = Math.PI * 1.8 / (4 * p);
  const rows = Object.entries(FILLS).map(([n, f]) => { const ink = DARK.has(n) ? INKL : INKD; let ip = 99, ia = 99, pp = 99;
    for (const v0 of interior(n, f)) for (const g of [0, GR[n]![0], GR[n]![1]]) for (const st of STATES) { const v = stOver(shadeL(v0, g), st, f); ip = Math.min(ip, wcag(over(v, ink, 1), v)); ia = Math.min(ia, wcag(over(v, ink, avgA), v)); }
    for (const v0 of pool(n, f)) for (const st of STATES) { const v = stOver(v0, st, f); pp = Math.min(pp, wcag(over(v, ink, 1), v)); }
    return `${n} interior ${f2(ip)}/${f2(ia)}, pool peak ${f2(pp)}`; });
  say(`pitch ${p} px: ${rows.join(', ')}`);
}

say('\n## S. The chosen flecks: nearest banner or mana primary, mean shift at their coverage, distance from the reserved stipples (Thornwood meadow #EFE7CF, Cinder ash #8F8C88)');
for (const [t, nm, c, cov] of [['Plains', 'sorrel seed heads', '#9A6446', 0.015], ['Mountains', 'ochre lichen', '#B59A55', 0.015], ['Wasteland', 'rust flecks', '#8E5A3E', 0.02], ['Swamp', 'sedge heads', '#C9C7B8', 0.015], ['Swamp', 'sedge heads olive', '#A99C70', 0.015], ['Swamp', 'sedge heads straw', '#B0A47A', 0.015], ['Swamp', 'sedge heads khaki', '#9E9A78', 0.015]] as const) {
  let wn = { v: 1e9, r: '' }, wc = { v: 1e9, r: '' }; for (const r of refs) { const a = dN(c, r), b = dC(c, r); if (a < wn.v) wn = { v: a, r }; if (b < wc.v) wc = { v: b, r }; }
  say(`${t} ${nm} ${c} at ${cov * 100}%: nearest ${wn.r} ${f1(wn.v)} / ${wc.r} ${f1(wc.v)}; mean shift ${f2(dN(FILLS[t]!, over(FILLS[t]!, c, cov)))}; vs meadow ${f1(dN(c, '#EFE7CF'))}, vs ash ${f1(dN(c, '#8F8C88'))}`); }
