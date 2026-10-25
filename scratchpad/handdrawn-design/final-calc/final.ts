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
// Run: cd /home/user/Fluid-Magic- && npx tsx <this file>
const MANA: Record<string, string> = { W: '#F3E6B8', U: '#3A7BD5', B: '#3D2B4F', R: '#FD6533', G: '#00674B' };
const CLOTH = '#E8DCC2', ASH = '#8F8C88', MOSS = '#5E7F45';
const greyEqL = (f: string) => fromLab([Ls(f), 0, 0]);
const say = (s = '') => console.log(s);
// Ownership states as live overlays over the paint (final.md R-F1): haze, out of sight (equal-L* grey 10%), ash 10%, moss 6%
const stOver = (x: string, st: string, f: string) => st === 'raw' ? x : st === 'haze' ? over(x, CLOTH, 0.04) : st === 'outOfSight' ? over(x, greyEqL(f), 0.1) : st === 'ash10' ? over(x, ASH, 0.1) : over(x, MOSS, 0.06);
const STATES = ['raw', 'haze', 'outOfSight', 'ash10', 'moss6'];

say('# final.md measurements\n');
say('## A. Out of sight as an overlay: equal-L* grey at 10% against the approved desaturation by 10%');
say(Object.entries(FILLS).map(([n, f]) => `${n} grey ${greyEqL(f)}: ΔE ${f1(dN(over(f, greyEqL(f), 0.1), desat(f, 0.1)))}`).join('; '));

// relief wash: cool #3A4466 at alpha RW on the ground to the lower right of humps and peaks (Hills, Mountains)
let RW = 0.12, RWC = '#3A4466'; let RT = new Set(['Hills', 'Mountains']);
type Amp = Record<string, number>;
function pairs(label: string, M: Amp, k: number, relief: boolean, fills = FILLS) {
  const names = Object.keys(fills); let wN = { v: 1e9, s: '' }, wC = { v: 1e9, s: '' }; let under = 0;
  const vars = (n: string) => { const f = fills[n]!; const v = [f, shadeL(f, M[n]! * k), shadeL(f, -M[n]! * k)]; if (relief && RT.has(n)) v.push(over(f, RWC, RW)); return v; };
  for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
    const A = names[i]!, B = names[j]!;
    for (const sa of STATES) for (const sb of STATES) for (const a0 of vars(A)) for (const b0 of vars(B)) {
      const a = stOver(a0, sa, fills[A]!), b = stOver(b0, sb, fills[B]!); const n = dN(a, b), c = dC(a, b);
      if (n < 20 || c < 12) under++; if (n < wN.v) wN = { v: n, s: `${A}/${sa} vs ${B}/${sb}` }; if (c < wC.v) wC = { v: c, s: `${A}/${sa} vs ${B}/${sb}` };
    }
  }
  say(`${label}: closest normal ${f1(wN.v)} (${wN.s}); closest CVD ${f1(wC.v)} (${wC.s}); extreme pairs under 20/12: ${under}`);
  return wC.v;
}
say('\n## B. Terrain pairs across the approved states (overlays after the paint), mottle extremes, peak 0.55 x M and full M');
const OPT: Record<string, Amp> = {
  'design 4/3/4/2/2/2/2': { Plains: 4, Farmland: 3, Forest: 4, Hills: 2, Mountains: 2, Swamp: 2, Wasteland: 2 },
  'H,W 0': { Plains: 4, Farmland: 3, Forest: 4, Hills: 0, Mountains: 2, Swamp: 2, Wasteland: 0 },
  'H,W 0; M,S 1': { Plains: 4, Farmland: 3, Forest: 4, Hills: 0, Mountains: 1, Swamp: 1, Wasteland: 0 },
  'P 3; H,W 0; M,S 1': { Plains: 3, Farmland: 3, Forest: 4, Hills: 0, Mountains: 1, Swamp: 1, Wasteland: 0 },
  'P 3, F 3; H,W 0; M,S 1': { Plains: 3, Farmland: 3, Forest: 3, Hills: 0, Mountains: 1, Swamp: 1, Wasteland: 0 },
  'none': { Plains: 0, Farmland: 0, Forest: 0, Hills: 0, Mountains: 0, Swamp: 0, Wasteland: 0 },
};
for (const [nm, M] of Object.entries(OPT)) { pairs(`${nm} @0.55`, M, 0.55, false); pairs(`${nm} @1.0`, M, 1, false); }
say('with the relief wash (#3A4466 at 0.12 on Hills and Mountains ground):');
pairs('P 3; H,W 0; M,S 1 @0.55 + relief', OPT['P 3; H,W 0; M,S 1']!, 0.55, true);
pairs('P 3; H,W 0; M,S 1 @1.0 + relief', OPT['P 3; H,W 0; M,S 1']!, 1, true);
pairs('none + relief', OPT['none']!, 1, true);
const PICK = OPT['P 3, F 3; H,W 0; M,S 1']!;
RT = new Set(['Mountains']); say('relief on Mountains only:');
for (const [c, a] of [['#3A4466', 0.06], ['#3A4466', 0.08], ['#3A4466', 0.10], ['#3A4466', 0.12]] as const) { RW = a; RWC = c; pairs(`M-only relief ${c} at ${a} @0.55`, PICK, 0.55, true); pairs(`M-only relief ${c} at ${a} @1.0`, PICK, 1, true); }
RT = new Set(['Hills', 'Mountains']);
for (const [c, a] of [['#3A4466', 0.05], ['#3A4466', 0.07], ['#3A4466', 0.09], ['#6B7596', 0.10], ['#6B7596', 0.14], ['#8A93AE', 0.12]] as const) { RW = a; RWC = c; pairs(`relief ${c} at ${a}, mottle P3 F3 H0 M1 S1 W0 @0.55`, PICK, 0.55, true); pairs(`relief ${c} at ${a}, @1.0`, PICK, 1, true); say(`   relief peak on Hills: ${over(FILLS.Hills!, c, a)} (ΔL* ${f1(Ls(over(FILLS.Hills!, c, a)) - Ls(FILLS.Hills!))}), on Mountains: ${over(FILLS.Mountains!, c, a)} (ΔL* ${f1(Ls(over(FILLS.Mountains!, c, a)) - Ls(FILLS.Mountains!))})`); }

// ---------------------------------------------------------------- the final recipe
const FIN: Record<string, { M: number; E: number; B: number }> = { Plains: { M: 3, E: -7, B: 1 }, Farmland: { M: 3, E: -7, B: 0 }, Forest: { M: 3, E: -5, B: 0 }, Hills: { M: 0, E: -6, B: 1 }, Mountains: { M: 1, E: -7, B: 1 }, Swamp: { M: 1, E: -6, B: 2 }, Wasteland: { M: 0, E: -8, B: 1 } };
RW = 0.08; RWC = '#3A4466'; RT = new Set(['Mountains']);
const paintVars = (n: string, f: string) => { const r = FIN[n]!; const v = [f, shadeL(f, r.M), shadeL(f, -r.M), shadeL(f, r.E), shadeL(f, r.E - 3)]; if (r.B) v.push(over(f, shadeL(f, 4), 0.35), over(f, shadeL(f, -9), 0.3)); if (RT.has(n)) v.push(over(f, RWC, RW)); return v; };
say('\n## C. Band rule on the final paint (overlays after paint; mottle, edge pool, blooms, Mountains relief wash), every state');
{ let tot = 0, direct = 0, key = 0, fail = 0; let worst = { v: 1e9, s: '' }; const fails: string[] = [];
  for (const [n, f0] of Object.entries(FILLS)) for (const st of STATES) for (const p0 of paintVars(n, f0)) { const p = stOver(p0, st, f0); const k = keylineFor(f0);
    for (const b of banners) { tot++; const ok = dN(b, p) >= 20 && dC(b, p) >= 12; const kOk = dN(k, p) >= 20 && dC(k, p) >= 12 && dN(k, b) >= 20 && dC(k, b) >= 12;
      if (ok) { direct++; const m = Math.min(dN(b, p), dC(b, p) * 20 / 12); if (m < worst.v) worst = { v: m, s: `${b} on ${n}/${st} ${p}: ${f1(dN(b, p))}/${f1(dC(b, p))}` }; } else if (kOk) key++; else { fail++; fails.push(`${b} on ${n}/${st} ${p}`); } } }
  say(`${tot} pairs: ${direct} direct, ${key} keyline, ${fail} fail; closest direct ${worst.s}`); fails.slice(0, 8).forEach((x) => say('  FAIL ' + x)); }
pairs('final mottle @0.55 + Mountains relief 0.08', Object.fromEntries(Object.entries(FIN).map(([k, v]) => [k, v.M])), 0.55, true);
pairs('final mottle @1.0 + Mountains relief 0.08', Object.fromEntries(Object.entries(FIN).map(([k, v]) => [k, v.M])), 1, true);

say('\n## D. Tracks as a live layer of screen-constant dots (same size at every zoom): dot peak and line average (WCAG), on the fill and on the worst paint variant');
const INKD = '#3E3428', INKL = '#E8DCC2';
for (const [d, p, a] of [[1.6, 3.5, 0.85], [1.6, 3.2, 0.9], [1.8, 3.0, 0.9], [1.8, 3.0, 1.0], [1.6, 3.0, 1.0], [1.6, 2.8, 1.0]] as const) {
  const peakA = a * Math.min(1, d), avgA = a * Math.PI * d / (4 * p);
  const rows = Object.entries(FILLS).map(([n, f]) => { const ink = DARK.has(n) ? INKL : INKD; const worst = paintVars(n, f).map((x) => wcag(over(x, ink, peakA), x)).reduce((m, x) => Math.min(m, x), 99); return `${n} ${f2(wcag(over(f, ink, peakA), f))}/${f2(wcag(over(f, ink, avgA), f))} (worst peak ${f2(worst)})`; });
  say(`d ${d} px, pitch ${p} px, alpha ${a}: peak/avg: ${rows.join(', ')}`);
}
{ const M = FILLS.Mountains!; const fw = 1.95 * 0.44, fa = 0.75 * Math.min(1, fw) * (6.4 / 11.2); say(`reference, v2 footpath (R34) at the start zoom: avg ${f2(wcag(over(M, '#2B2620', fa), M))}, dash peak ${f2(wcag(over(M, '#2B2620', 0.75 * Math.min(1, fw)), M))}`); }
say(`paper-ink track dot #E8DCC2 vs Sanctity pale stone #CFC6B4: ΔE ${f1(dN('#E8DCC2', '#CFC6B4'))} / CVD ${f1(dC('#E8DCC2', '#CFC6B4'))} (they differ by form: dots vs a solid path)`);

say('\n## E. Region names (no halo): ink per terrain at alpha a, over the fill, mottle and edge pool (WCAG; 3:1 for display capitals)');
for (const [dk, lt] of [['#33261A', '#F1E8D2'], ['#2A1F14', '#F4EEDF']] as const) for (const a of [0.7, 0.8, 0.85, 0.9]) {
  const rows = Object.entries(FILLS).map(([n, f]) => { const ink = DARK.has(n) ? lt : dk; const vs = paintVars(n, f).concat(STATES.map((s) => stOver(f, s, f))); const w = vs.map((x) => wcag(over(x, ink, a), x)).reduce((m, x) => Math.min(m, x), 99); return `${n} ${f2(wcag(over(f, ink, a), f))} (worst ${f2(w)})`; });
  say(`${dk}/${lt} at ${a}: ${rows.join(', ')}`);
}

say('\n## F. Settlement kits under the one light: lit = tone +8 L* mixed 12% #F6D9A0, shade = tone -12 L* mixed 14% #3A4466; best tone per fill (3:1 needed, final 3.11 item 6)');
const lit = (t: string) => over(shadeL(t, 8), '#F6D9A0', 0.12), shade = (t: string) => over(shadeL(t, -12), '#3A4466', 0.14);
const KITS: Record<string, string[]> = { Cinder: ['#8F8C88', '#3A3633', '#3A3836', '#2B2A28', '#5E5953'], Thornwood: ['#A0785A', '#4E6B3A', '#6B4A2B', '#5E4630', '#9A958C'], Independents: ['#D8CBB0', '#C2A86B', '#9A958C', '#B9B4AA'] };
for (const [k, tones] of Object.entries(KITS)) {
  const faces = tones.flatMap((t) => [lit(t), shade(t)]);
  const rows = Object.entries(FILLS).map(([n, f]) => { const bestFace = faces.concat(['#1C1A17']).reduce((m, t) => Math.max(m, wcag(t, f)), 0); const bestFlat = tones.concat(['#1C1A17']).reduce((m, t) => Math.max(m, wcag(t, f)), 0); const tonesOnly = faces.reduce((m, t) => Math.max(m, wcag(t, f)), 0); return `${n} ${f2(bestFace)} (approved flat tones + ink ${f2(bestFlat)}; faces without ink ${f2(tonesOnly)})`; });
  say(`${k}: faces ${tones.map((t) => `${t}→${lit(t)}/${shade(t)}`).join(' ')}`); say(`   best face tone per fill: ${rows.join(', ')}`);
}

say('\n## G. Pigment flecks: distance to every banner and mana primary (normal / worst CVD) and WCAG on their fill');
const FLECK: Record<string, [string, string]> = { 'Swamp sedge grey': ['Swamp', '#C9C7B8'], 'Swamp sedge 3': ['Swamp', '#BDB8A0'], 'Plains lilac': ['Plains', '#CDB9DA'], 'Plains cornflower': ['Plains', '#B9CBE6'], 'Plains cream': ['Plains', '#F2E9C9'], 'Swamp straw': ['Swamp', '#D9CB98'], 'Swamp pale sedge': ['Swamp', '#DCD6B0'], 'Wasteland rust 2': ['Wasteland', '#9A6446'], 'Mountains lichen 2': ['Mountains', '#C2A65E'], 'Plains wildflower white': ['Plains', '#F4F1E6'], 'Plains wildflower butter': ['Plains', '#E7D27A'], 'Mountains ochre lichen': ['Mountains', '#B59A55'], 'Wasteland rust': ['Wasteland', '#8E5A3E'], 'Swamp sedge head': ['Swamp', '#C9BF8A'], 'Forest fern tip': ['Forest', '#6F8A4A'] };
const refs = [...banners, ...Object.values(MANA)];
for (const [nm, [t, c]] of Object.entries(FLECK)) { let wn = { v: 1e9, r: '' }, wc = { v: 1e9, r: '' }; for (const r of refs) { const n = dN(c, r), cv = dC(c, r); if (n < wn.v) wn = { v: n, r }; if (cv < wc.v) wc = { v: cv, r }; } say(`${nm} ${c}: nearest ${wn.r} ${f1(wn.v)}, nearest CVD ${wc.r} ${f1(wc.v)}; on ${t} WCAG ${f2(wcag(c, FILLS[t]!))}, ΔE from fill ${f1(dN(c, FILLS[t]!))}`); }

say('\n## H. Farmland A/B #E6B047 (owner question): terrain pairs, band rule on its paint, tracks');
{ const F2: Record<string, string> = { ...FILLS, Farmland: '#E6B047' };
  pairs('Farmland #E6B047, no paint', OPT['none']!, 1, false, F2);
  pairs('Farmland #E6B047, final mottle @0.55', Object.fromEntries(Object.entries(FIN).map(([k, v]) => [k, v.M])), 0.55, true, F2);
  pairs('Farmland #E6B047, final mottle @1.0', Object.fromEntries(Object.entries(FIN).map(([k, v]) => [k, v.M])), 1, true, F2);
  let tot = 0, direct = 0, key = 0, fail = 0; const f0 = '#E6B047';
  for (const st of STATES) for (const p0 of paintVars('Farmland', f0)) { const p = stOver(p0, st, f0); const k = keylineFor(FILLS.Farmland!); for (const b of banners) { tot++; if (dN(b, p) >= 20 && dC(b, p) >= 12) direct++; else if (dN(k, p) >= 20 && dC(k, p) >= 12 && dN(k, b) >= 20 && dC(k, b) >= 12) key++; else fail++; } }
  say(`band rule on #E6B047 paint, every state: ${tot} pairs, ${direct} direct, ${key} keyline, ${fail} fail (keyline ${keylineFor(FILLS.Farmland!)})`);
  say(`#E6B047: L* ${f1(Ls(f0))}, chroma ${f1(Math.hypot(toLab(f0)[1], toLab(f0)[2]))}; approved #EEBA3A: L* ${f1(Ls('#EEBA3A'))}, chroma ${f1(Math.hypot(toLab('#EEBA3A')[1], toLab('#EEBA3A')[2]))}; ΔE between them ${f1(dN(f0, '#EEBA3A'))}`); }

say('\n## I. Other checks');
say(`wild name #E9E4D8 on snow #F2EEE6 ${f2(wcag('#E9E4D8', '#F2EEE6'))}, on lit face #8A857E ${f2(wcag('#E9E4D8', '#8A857E'))}, on granite #2A292C ${f2(wcag('#E9E4D8', '#2A292C'))}`);
say(`camp canvas #B9B4A6 vs pewter token #91A092: ${f1(dN('#B9B4A6', '#91A092'))}/${f1(dC('#B9B4A6', '#91A092'))}`);
say(`stook straw (Farmland lit) ${over(shadeL(FILLS.Farmland!, 12), '#F6D9A0', 0.12)} vs siege tents in #FD6533: ${f1(dN(over(shadeL(FILLS.Farmland!, 12), '#F6D9A0', 0.12), '#FD6533'))}/${f1(dC(over(shadeL(FILLS.Farmland!, 12), '#F6D9A0', 0.12), '#FD6533'))}`);

say('\n## J. Farmland search: fills that keep 20/12 in every approved state pair (no paint) and the texture floor (peak 19.5/11.0) with the final mottle');
{ const res: string[] = []; const h0 = Math.atan2(toLab('#EEBA3A')[2], toLab('#EEBA3A')[1]);
  for (const L of [74, 75, 76, 77, 78, 79]) for (const C of [52, 56, 60, 64]) for (const dh of [-0.08, -0.04, 0, 0.04]) {
    const f = fromLab([L, C * Math.cos(h0 + dh), C * Math.sin(h0 + dh)]); const F2 = { ...FILLS, Farmland: f };
    const quiet = (fn: () => number) => { const o = console.log; console.log = () => {}; try { return fn(); } finally { console.log = o; } };
    const raw = quiet(() => pairs('x', OPT['none']!, 1, false, F2)); if (raw < 12) continue;
    const pk = quiet(() => pairs('x', Object.fromEntries(Object.entries(FIN).map(([k, v]) => [k, v.M])), 0.55, true, F2));
    res.push(`${f} L${L} C${C} dh${dh}: states CVD ${f1(raw)}, peak CVD ${f1(pk)}, ΔE from #EEBA3A ${f1(dN(f, '#EEBA3A'))}`); }
  say(res.length ? res.join('\n') : 'none pass'); }

say('\n## K. Farmland #EDB141 (the passing trim): pairs, band rule, tracks');
{ const f0 = '#EDB141'; const F2 = { ...FILLS, Farmland: f0 };
  pairs('Farmland #EDB141, no paint', OPT['none']!, 1, false, F2);
  pairs('Farmland #EDB141, final mottle @0.55', Object.fromEntries(Object.entries(FIN).map(([k, v]) => [k, v.M])), 0.55, true, F2);
  pairs('Farmland #EDB141, final mottle @1.0', Object.fromEntries(Object.entries(FIN).map(([k, v]) => [k, v.M])), 1, true, F2);
  let tot = 0, direct = 0, key = 0, fail = 0;
  for (const st of STATES) for (const p0 of paintVars('Farmland', f0)) { const p = stOver(p0, st, f0); const k = keylineFor(FILLS.Farmland!); for (const b of banners) { tot++; if (dN(b, p) >= 20 && dC(b, p) >= 12) direct++; else if (dN(k, p) >= 20 && dC(k, p) >= 12 && dN(k, b) >= 20 && dC(k, b) >= 12) key++; else fail++; } }
  say(`band rule on #EDB141 paint, every state: ${tot} pairs, ${direct} direct, ${key} keyline, ${fail} fail`);
  say(`#EDB141: L* ${f1(Ls(f0))}, chroma ${f1(Math.hypot(toLab(f0)[1], toLab(f0)[2]))}; ΔE from #EEBA3A ${f1(dN(f0, '#EEBA3A'))}; tracks peak ${f2(wcag(over(f0, '#3E3428', 1), f0))}`); }

say('\n## L. Army tokens (banner or pewter) against the final paint, every state: pairs newly under 20/12 relative to the same state unpainted');
{ const GR: Record<string, [number, number]> = { Plains: [-0.7, 0.4], Farmland: [-0.6, 0.3], Forest: [-2.1, 2.6], Hills: [-2.9, 2.6], Mountains: [-3.1, 2.3], Swamp: [-1.5, 1.5], Wasteland: [-3.7, 2.9] }; // judge 2 colors.out A
  const toks = [...banners, '#91A092'];
  for (const [label, varsOf] of [
    ['mottle only', (n: string, f: string) => [shadeL(f, FIN[n]!.M), shadeL(f, -FIN[n]!.M)]],
    ['mottle, blooms, relief', (n: string, f: string) => paintVars(n, f).filter((x, k) => k < 3 || k > 4)],
    ['mottle, blooms, relief, granulation', (n: string, f: string) => paintVars(n, f).filter((x, k) => k < 3 || k > 4).flatMap((x) => [x, shadeL(x, GR[n]![0]), shadeL(x, GR[n]![1])])],
  ] as const) { const worse = new Set<string>();
    for (const b of toks) for (const [n, f0] of Object.entries(FILLS)) for (const st of STATES) { const flat = stOver(f0, st, f0); if (!(dN(b, flat) >= 20 && dC(b, flat) >= 12)) continue; for (const p0 of varsOf(n, f0)) { const p = stOver(p0, st, f0); if (!(dN(b, p) >= 20 && dC(b, p) >= 12)) worse.add(`${b} on ${n}`); } }
    say(`${label}: ${worse.size ? [...worse].join(', ') : 'none'}`); } }
