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
const REC: Record<string, { M: number; E: number; G: number; lift: number }> = { // design.md §1.4 exactly
  Plains: { M: 4, E: -7, G: 0.25, lift: 1.2 }, Farmland: { M: 3, E: -7, G: 0.2, lift: 1.2 }, Forest: { M: 4, E: -5, G: 0.45, lift: 0.8 },
  Hills: { M: 2, E: -6, G: 0.6, lift: 1.0 }, Mountains: { M: 2, E: -7, G: 0.7, lift: 1.2 }, Swamp: { M: 2, E: -6, G: 0.35, lift: 1.0 }, Wasteland: { M: 2, E: -8, G: 0.8, lift: 1.4 } };
const DARK = new Set(['Forest', 'Hills', 'Swamp']);
const banners = [...new Set(Object.values(NATION_BANNERS).flat())];
const f1 = (n: number) => n.toFixed(1), f2 = (n: number) => n.toFixed(2);
const states = (f: string) => ({ raw: f, haze: over(f, '#E8DCC2', 0.04), outOfSight: desat(f, 0.1), ash10: over(f, '#8F8C88', 0.1), moss6: over(f, '#5E7F45', 0.06) });

console.log('# Judge 2 color checks (handdrawn-design/judge2-calc/colors.ts)\n');
console.log('## A. Granulation and paper as L* swings (soft-light, gamma space, as canvas composites)');
for (const [n, f] of Object.entries(FILLS)) {
  const r = REC[n]!; const gHi = Ls(softLight(f, 128 + 26, r.G)) - Ls(f), gLo = Ls(softLight(f, 128 - 26, r.G)) - Ls(f);
  const pHi = Ls(softLight(f, 148, 0.5)) - Ls(f), pLo = Ls(softLight(f, 108, 0.5)) - Ls(f);
  console.log(`${n}: granulation ${f1(gLo)}/${f1(gHi)} L*, paper ${f1(pLo)}/${f1(pHi)} L*, mottle ±${r.M}; pixel-level worst stack ${f1(-r.M + gLo + pLo)}/${f1(r.M + gHi + pHi)}`);
}

console.log('\n## B. Band rule on every Ownership fill state (raw, haze, out of sight, ash 10%, moss 6%) with the design\'s amplitudes');
console.log('variants: fill, ±M (blotch), +4 bloom at .35, bloom rim -9 at .30, edge pool E and E-3. Pass = direct 20/12 or keyline (docs/09).');
let tot = 0, direct = 0, viaKey = 0, fail = 0; const fails: string[] = []; let worst = { v: 1e9, s: '' };
for (const [n, f0] of Object.entries(FILLS)) for (const [st, f] of Object.entries(states(f0))) {
  const r = REC[n]!; const vars = [f, shadeL(f, r.M), shadeL(f, -r.M), over(f, shadeL(f, 4), 0.35), over(f, shadeL(f, -9), 0.3), shadeL(f, r.E), shadeL(f, r.E - 3)];
  const key = keylineFor(f0);
  for (const b of banners) for (const p of vars) {
    tot++; const ok = dN(b, p) >= 20 && dC(b, p) >= 12; const kOk = dN(key, p) >= 20 && dC(key, p) >= 12 && dN(key, b) >= 20 && dC(key, b) >= 12;
    if (ok) { direct++; const m = Math.min(dN(b, p), dC(b, p) * 20 / 12); if (m < worst.v) worst = { v: m, s: `${b} on ${n}/${st} ${p}: ${f1(dN(b, p))}/${f1(dC(b, p))}` }; }
    else if (kOk) viaKey++; else { fail++; fails.push(`${b} on ${n}/${st} ${p} (direct ${f1(dN(b, p))}/${f1(dC(b, p))}, keyline ${key}: vs paint ${f1(dN(key, p))}/${f1(dC(key, p))}, vs banner ${f1(dN(key, b))}/${f1(dC(key, b))})`); }
  }
}
console.log(`${tot} pairs: ${direct} direct, ${viaKey} keyline, ${fail} fail; closest direct ${worst.s}`);
for (const s of fails.slice(0, 12)) console.log('  FAIL ' + s);

console.log('\n## C. Terrain pairs at blotch extremes across Ownership states (the distinct-colors rule is 20 / 12)');
const names = Object.keys(FILLS); let wN = { v: 1e9, s: '' }, wC = { v: 1e9, s: '' }; let under = 0, pairsN = 0;
for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
  const A = names[i]!, B = names[j]!;
  for (const [sa, fa] of Object.entries(states(FILLS[A]!))) for (const [sb, fb] of Object.entries(states(FILLS[B]!))) {
    const va = [fa, shadeL(fa, REC[A]!.M), shadeL(fa, -REC[A]!.M)], vb = [fb, shadeL(fb, REC[B]!.M), shadeL(fb, -REC[B]!.M)];
    for (const a of va) for (const b of vb) { pairsN++; const n = dN(a, b), c = dC(a, b); if (n < 20 || c < 12) under++; if (n < wN.v) wN = { v: n, s: `${A}/${sa} ${a} vs ${B}/${sb} ${b}` }; if (c < wC.v) wC = { v: c, s: `${A}/${sa} ${a} vs ${B}/${sb} ${b}` }; }
  }
}
console.log(`${pairsN} extreme pairs, ${under} under 20/12; closest normal ${f1(wN.v)} (${wN.s}); closest CVD ${f1(wC.v)} (${wC.s})`);

console.log('\n## D. Borders on the paint: border ink vs the pixel just inside (d = 1.5 px, inside the 2 px ribbon edge)');
console.log('v2: fill + black 12% (3 px pigment edge). painted: inner shadow f-28 L* at .45, Gaussian sigma = blur/2, then pooling line f-14 L* at .35.');
for (const [n, f] of Object.entries(FILLS)) {
  const v2 = over(f, '#000000', 0.12);
  const rows: string[] = [];
  for (const [band, blur] of [['Far', 4], ['Mid', 6], ['Near', 8]] as const) {
    const sig = blur / 2, a = 0.45 * (1 - Phi(1.5 / sig)); let px = over(f, shadeL(f, -28), a); if (band !== 'Far') px = over(px, shadeL(f, -14), 0.35);
    rows.push(`${band} ${px} WCAG ${f2(wcag('#2B2620', px))} dE ${f1(dN('#2B2620', px))}`);
  }
  console.log(`${n}${DARK.has(n) ? ' (dark)' : ''}: v2 ${v2} WCAG ${f2(wcag('#2B2620', v2))} dE ${f1(dN('#2B2620', v2))}; ${rows.join('; ')}`);
}
console.log('two unowned Forest provinces: the border is the only separator; between Forest and Forest the border vs paint ΔE above is all there is.');

console.log('\n## E. Tracks: dots 1.6 px every 3.5 px at .85, specified at the top of the band and baked there; seen at scale s of that');
const INKD = '#3E3428', INKL = '#E8DCC2';
for (const s of [1, 0.6, 0.42, 0.389]) {
  const dia = 1.6 * s, pitch = 3.5 * s; const cov = dia >= 1 ? 1 : (Math.PI * (dia / 2) ** 2) / Math.min(1, dia) / 1; // per-pixel coverage inside the dot column
  const along = Math.min(1, dia / pitch) ; const aEff = 0.85 * (dia >= 1 ? 1 : Math.PI * (dia / 2) ** 2 / pitch);
  const row = Object.entries(FILLS).map(([n, f]) => { const ink = DARK.has(n) ? INKL : INKD; const top = over(f, ink, dia >= 1 ? 0.85 : aEff); return `${n} ${f2(wcag(top, f))}`; });
  console.log(`s=${s} (${s === 1 ? 'Mid top, 180 px' : s === 0.389 ? 'Mid bottom, 70 px' : s === 0.42 ? 'about the start zoom' : '108 px'}): dot ${f2(dia)} px, pitch ${f2(pitch)} px, effective alpha ${f2(dia >= 1 ? 0.85 : aEff)}: ${row.join(', ')}`);
  void cov; void along;
}
console.log('worst-case mottle: tracks at .85 on the dark side of the mottle (light fills) or light side (dark fills):');
console.log('  ' + Object.entries(FILLS).map(([n, f]) => { const ink = DARK.has(n) ? INKL : INKD; const g = shadeL(f, DARK.has(n) ? REC[n]!.M : -REC[n]!.M); return `${n} ${f2(wcag(over(g, ink, 0.85), g))}`; }).join(', '));

console.log('\n## F. Region names (no halo) over what they actually cross');
const RINK = (n: string) => (DARK.has(n) ? '#F1E8D2' : '#33261A');
for (const [n, f] of Object.entries(FILLS)) {
  const ink = RINK(n), r = REC[n]!; const g = (base: string) => f2(wcag(over(base, ink, 0.85), base));
  console.log(`${n}: fill ${g(f)}, mottle ${g(shadeL(f, r.M))}/${g(shadeL(f, -r.M))}, edge pool ${g(shadeL(f, r.E))}, over the border ink #2B2620 ${g('#2B2620')}`);
}
const rb = banners.map((b) => ({ b, dark: f2(wcag(over(b, '#33261A', 0.85), b)), light: f2(wcag(over(b, '#F1E8D2', 0.85), b)) }));
console.log('over each banner band (dark ink / light ink): ' + rb.map((x) => `${x.b} ${x.dark}/${x.light}`).join(', '));

console.log('\n## G. Wild names (#E9E4D8, no halo) over the wild\'s own drawing');
for (const [k, c] of [['granite ground', '#46423F'], ['peak lit face', '#8A857E'], ['peak shadow', '#46423F'], ['snow', '#F2EEE6'], ['rim', '#E9E4D8']] as const) console.log(`  on ${k} ${c}: WCAG ${f2(wcag('#E9E4D8', c))}`);

console.log('\n## H. Other new marks');
console.log(`camp pole shield #8C8A80 vs independents' pewter token #91A092: dE ${f1(dN('#8C8A80', '#91A092'))} / CVD ${f1(dC('#8C8A80', '#91A092'))} (same family by design: a small plain shield reads as a token)`);
console.log(`brook water #BCD6D9 vs path thread #F4EEDF: dE ${f1(dN('#BCD6D9', '#F4EEDF'))} / CVD ${f1(dC('#BCD6D9', '#F4EEDF'))}; brook bank #35535A vs thread edge #1C1A17: dE ${f1(dN('#35535A', '#1C1A17'))}`);
const drops = ['#F3E6B8', '#3A7BD5', '#3D2B4F', '#FD6533', '#00674B'];
console.log(`Wellspring drops that are also NATION_BANNERS entries: ${drops.filter((x) => banners.includes(x)).join(', ')} (${drops.filter((x) => banners.includes(x)).length} of 5)`);
console.log(`spring-stone disc #E9E1CC vs label halo #F2EAD6: dE ${f1(dN('#E9E1CC', '#F2EAD6'))}; vs W banner #F3E6B8: ${f1(dN('#E9E1CC', '#F3E6B8'))}/${f1(dC('#E9E1CC', '#F3E6B8'))}`);
console.log(`fog brook line #3E3428 at .5, 1 px, vs fills (WCAG): ${Object.entries(FILLS).filter(([n]) => !DARK.has(n)).map(([n, f]) => `${n} ${f2(wcag(over(f, '#3E3428', 0.5), f))}`).join(', ')}; the fog border is #2B2620 dotted 2/3 px`);
console.log(`scree tick (feature ink) vs wild rim tick #E9E4D8: shape and color differ by ${f1(dN('#3E3428', '#E9E4D8'))}; both are short ticks at 60-80 degrees on a peak's foot`);
