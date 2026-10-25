// Painted map palette checks. Run: cd /home/user/Fluid-Magic- && npx tsx <this file>
// Uses the repository's own color math (tests/content/colorMath.ts) and banners (src/content/colors.ts).
import { labAs, deltaE2000, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath.ts';
import { NATION_BANNERS, keylineFor, COLORS, COLOR_DEFS } from '/home/user/Fluid-Magic-/src/content/colors.ts';

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
// sRGB <-> Lab (D65) for lightness shifts, as the mockup's shadeL
const s2l = (c: number) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const l2s = (c: number) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.max(0, c) ** (1 / 2.4) - 0.055);
function toLab(h: string) { const [R, G, B] = rgb(h).map(s2l) as [number, number, number]; const X = (0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047, Y = 0.2126 * R + 0.7152 * G + 0.0722 * B, Z = (0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883; const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116); return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))] as [number, number, number]; }
function fromLab([L, a, b]: number[]) { const fy = (L! + 16) / 116, fx = fy + a! / 500, fz = fy - b! / 200; const fi = (t: number) => (t ** 3 > 0.008856 ? t ** 3 : (t - 16 / 116) / 7.787); const X = fi(fx) * 0.95047, Y = fi(fy), Z = fi(fz) * 1.08883; return toHex([l2s(3.2406 * X - 1.5372 * Y - 0.4986 * Z), l2s(-0.9689 * X + 1.8758 * Y + 0.0415 * Z), l2s(0.0557 * X - 0.204 * Y + 1.057 * Z)]); }
const shadeL = (h: string, dl: number) => { const l = toLab(h); l[0] = Math.max(0, Math.min(100, l[0] + dl)); return fromLab(l); };
const Lstar = (h: string) => toLab(h)[0];

const FILLS: Record<string, string> = { Plains: '#C1D29F', Farmland: '#EEBA3A', Forest: '#374C2B', Hills: '#856824', Mountains: '#8DA4AD', Swamp: '#1A727A', Wasteland: '#AE897F' };
const DARK = new Set(['Forest', 'Hills', 'Swamp']);
const banners = [...new Set(Object.values(NATION_BANNERS).flat())];
const f2 = (n: number) => n.toFixed(2), f1 = (n: number) => n.toFixed(1);
const out: string[] = []; const log = (s = '') => out.push(s);

log('# Painted map palette checks (handdrawn-design/calc/painted.ts)');
log('');
log('## 0. Fill lightness (L*)');
for (const [n, f] of Object.entries(FILLS)) log(`${n} ${f} L* ${f1(Lstar(f))}`);

// 1. The wash extremes, per terrain recipe: mottle +-M, edge band E (darkening), granulation +-G
const RECIPE: Record<string, { M: number; E: number; G: number }> = {
  Plains: { M: 4, E: -7, G: 3 }, Farmland: { M: 3, E: -7, G: 2 }, Forest: { M: 3, E: -5, G: 4 },
  Hills: { M: 4, E: -6, G: 5 }, Mountains: { M: 4, E: -7, G: 6 }, Swamp: { M: 4, E: -6, G: 4 }, Wasteland: { M: 4, E: -8, G: 6 },
};
log('');
log('## 1. Band rule against the painted extremes (every banner, every terrain)');
log('Paint extremes per terrain: fill + mottle high, fill - mottle low, fill + edge band (darkest wash, before the');
log('1 px pooling line, which lies under the band). The band passes if banner vs paint >= 20 normal and >= 12 under');
log('each deficiency, or keylineFor(fill) differs from both by those minimums (docs/09).');
let worstDirect = { v: 1e9, s: '' }; let fails = 0; let viaKey = 0; let total = 0;
for (const [n, f] of Object.entries(FILLS)) {
  const r = RECIPE[n]!; const variants = [f, shadeL(f, r.M), shadeL(f, -r.M), shadeL(f, r.E), shadeL(f, r.E - 3)];
  const key = keylineFor(f);
  for (const b of banners) for (const p of variants) {
    total++;
    const direct = dN(b, p) >= 20 && dC(b, p) >= 12;
    const keyOk = dN(key, p) >= 20 && dC(key, p) >= 12 && dN(key, b) >= 20 && dC(key, b) >= 12;
    if (direct) { const m = Math.min(dN(b, p), dC(b, p) * 20 / 12); if (m < worstDirect.v) worstDirect = { v: m, s: `${b} on ${n} ${p}: ${f1(dN(b, p))} / ${f1(dC(b, p))}` }; }
    else if (keyOk) viaKey++;
    else { fails++; log(`  FAIL ${b} on ${n} paint ${p} (direct ${f1(dN(b, p))}/${f1(dC(b, p))}, keyline ${key})`); }
  }
}
log(`checked ${total} banner x paint pairs: ${total - fails - viaKey} direct, ${viaKey} through the keyline, ${fails} fail`);
log(`closest direct pass: ${worstDirect.s}`);

// Same check for the raw fills, for comparison with the existing palette test
let rawKey = 0, rawFail = 0;
for (const [, f] of Object.entries(FILLS)) for (const b of banners) { const key = keylineFor(f); const direct = dN(b, f) >= 20 && dC(b, f) >= 12; const keyOk = dN(key, f) >= 20 && dC(key, f) >= 12 && dN(key, b) >= 20 && dC(key, b) >= 12; if (!direct && keyOk) rawKey++; if (!direct && !keyOk) rawFail++; }
log(`raw fills for comparison: ${rawKey} through the keyline, ${rawFail} fail`);

// 2. Terrain pairs stay distinct when painted: the closest painted variants of two different terrains
log('');
log('## 2. Terrain pairs, painted (mottle extremes of one against the other; edge bands excluded, they lie under borders)');
const names = Object.keys(FILLS); let pw = { v: 1e9, s: '' }, pc = { v: 1e9, s: '' };
for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
  const A = names[i]!, B = names[j]!; const va = [FILLS[A]!, shadeL(FILLS[A]!, RECIPE[A]!.M), shadeL(FILLS[A]!, -RECIPE[A]!.M)], vb = [FILLS[B]!, shadeL(FILLS[B]!, RECIPE[B]!.M), shadeL(FILLS[B]!, -RECIPE[B]!.M)];
  for (const a of va) for (const b of vb) { const n = dN(a, b), c = dC(a, b); if (n < pw.v) pw = { v: n, s: `${A} ${a} vs ${B} ${b}` }; if (c < pc.v) pc = { v: c, s: `${A} ${a} vs ${B} ${b}` }; }
}
log(`closest normal: ${f1(pw.v)} (${pw.s}); closest under a deficiency: ${f1(pc.v)} (${pc.s})`);
log('(the province mean stays the fill; these are the extremes a 6 px blotch can reach)');

// 3. Labels: ink with a paper halo, against the halo laid over each fill (the halo is 85% opaque)
log('');
log('## 3. Lettering (WCAG)');
const INK = '#2A1F14', HALO = '#F2EAD6';
for (const a of [0.85, 0.75]) { const row = Object.entries(FILLS).map(([n, f]) => `${n} ${f2(wcag(INK, over(f, HALO, a)))}`); log(`place-name ink ${INK} on halo ${HALO}@${a} over: ${row.join(', ')}`); }
log(`approved style for comparison, #F4EEDF on rgba(20,18,15,.85) over: ${Object.entries(FILLS).map(([n, f]) => `${n} ${f2(wcag('#F4EEDF', over(f, '#14120F', 0.85)))}`).join(', ')}`);
// region names: translucent ink without halo, large text (3:1)
const RL = '#4A3826', RD = '#F1E8D2';
for (const a of [0.75, 0.85]) log(`region ink at ${a}: light terrains ${RL}: ${Object.entries(FILLS).filter(([n]) => !DARK.has(n)).map(([n, f]) => `${n} ${f2(wcag(over(f, RL, a), f))}`).join(', ')}; dark terrains ${RD}: ${Object.entries(FILLS).filter(([n]) => DARK.has(n)).map(([n, f]) => `${n} ${f2(wcag(over(f, RD, a), f))}`).join(', ')}`);
log(`wild names #E9E4D8 italic (approved): granite ${f2(wcag('#E9E4D8', '#2A292C'))}, water ${f2(wcag('#E9E4D8', '#24222A'))}`);

// 4. Tracks: round dots, sepia on light terrains, paper on dark terrains
log('');
log('## 4. Tracks (non-text 3:1 where they are the second channel, i.e. on Mountains)');
const TL = '#3E3428', TD = '#E8DCC2';
for (const a of [0.7, 0.8, 0.85]) log(`tracks at ${a}: ${Object.entries(FILLS).map(([n, f]) => `${n} ${f2(wcag(over(f, DARK.has(n) ? TD : TL, a), f))}`).join(', ')}`);
log(`fog dotted border #2B2620 vs track sepia ${TL}: dE ${f1(dN('#2B2620', TL))} (told apart by geometry: on the border vs across it, dash 2/3 vs dots 0.1/3.4, 2 px vs 1.6 px)`);

// 5. Water: brooks drawn as two bank lines with pale water between; ponds pale; meres stay near-black
log('');
log('## 5. Brooks and ponds');
const BANK = '#35535A', BROOK = '#BCD6D9', POND = '#A6C7CC', POND_RIM = '#DCEAEA';
log(`brook water ${BROOK} L* ${f1(Lstar(BROOK))}; bank ${BANK} L* ${f1(Lstar(BANK))}; pond ${POND} L* ${f1(Lstar(POND))}; mere water #24222A L* ${f1(Lstar('#24222A'))}`);
log(`pale water against each fill (WCAG): ${Object.entries(FILLS).map(([n, f]) => `${n} ${f2(wcag(BROOK, f))}`).join(', ')}`);
log(`bank line against each fill (WCAG): ${Object.entries(FILLS).map(([n, f]) => `${n} ${f2(wcag(BANK, f))}`).join(', ')}`);
log(`best of the two per fill: ${Object.entries(FILLS).map(([n, f]) => `${n} ${f2(Math.max(wcag(BANK, f), wcag(BROOK, f)))}`).join(', ')}`);
log(`pond against each fill (dE normal / CVD): ${Object.entries(FILLS).map(([n, f]) => `${n} ${f1(dN(POND, f))}/${f1(dC(POND, f))}`).join(', ')}`);
log(`brook and pond against every banner (dE normal / CVD min):`);
for (const b of banners) log(`  ${b}: brook ${f1(dN(BROOK, b))}/${f1(dC(BROOK, b))}, pond ${f1(dN(POND, b))}/${f1(dC(POND, b))}, bank ${f1(dN(BANK, b))}/${f1(dC(BANK, b))}`);
log(`pond vs mere water #24222A: ${f1(dN(POND, '#24222A'))}/${f1(dC(POND, '#24222A'))}; pond vs Wellspring basin water #7FA9BA: ${f1(dN(POND, '#7FA9BA'))}/${f1(dC(POND, '#7FA9BA'))}`);
log(`pond vs the wild rim #E9E4D8: ${f1(dN(POND, '#E9E4D8'))}/${f1(dC(POND, '#E9E4D8'))}`);

// 6. Stamp faces: warm lit face and cool shade face, against the plain faces of final 3.2
log('');
log('## 6. Warm-cool faces (stamps only; never a sheet-wide gradient, R19)');
const WARM = '#F6D9A0', COOL = '#3A4466';
for (const [n, f] of Object.entries(FILLS)) {
  const lit = shadeL(f, 12), sh = shadeL(f, -18), litW = over(lit, WARM, 0.12), shC = over(sh, COOL, 0.14);
  log(`${n}: lit ${lit} -> ${litW} (dE ${f1(dN(lit, litW))}), shade ${sh} -> ${shC} (dE ${f1(dN(sh, shC))}); shade vs fill dE ${f1(dN(shC, f))}, lit vs fill dE ${f1(dN(litW, f))}`);
}
log(`cast shadow rgba(38,42,64,.22) over each fill, dE from the fill: ${Object.entries(FILLS).map(([n, f]) => `${n} ${f1(dN(over(f, '#262A40', 0.22), f))}`).join(', ')}`);

// 7. Neutral illustrations: landmark stone, camp canvas, spring stone, each with a 1 px ink outline
log('');
log('## 7. Landmarks, camps, spring marks (one tone >= 3:1 on every fill, final 3.11 item 6)');
const STONE = '#CFC6B4', STONE_SH = '#8E877A', CANVAS = '#D9D2BF', OUTLINE = '#1C1A17';
for (const [nm, c] of [['stone', STONE], ['stone shade', STONE_SH], ['tent canvas', CANVAS], ['ink outline', OUTLINE]] as const) log(`${nm} ${c}: ${Object.entries(FILLS).map(([n, f]) => `${n} ${f2(wcag(c, f))}`).join(', ')}`);
log(`best of stone/ink per fill: ${Object.entries(FILLS).map(([n, f]) => `${n} ${f2(Math.max(wcag(STONE, f), wcag(OUTLINE, f)))}`).join(', ')}`);
log(`landmark stone vs wild rim #E9E4D8 ${f1(dN(STONE, '#E9E4D8'))}, vs snow #F2EEE6 ${f1(dN(STONE, '#F2EEE6'))} (shape tells them apart; landmarks never sit within band + 6 px of a wild)`);
log(`independent camp canvas ${CANVAS} vs independents' primary #8C8A80 ${f1(dN(CANVAS, '#8C8A80'))}; vs every banner (min normal/CVD): ${f1(Math.min(...banners.map((b) => dN(CANVAS, b))))}/${f1(Math.min(...banners.map((b) => dC(CANVAS, b))))}`);
// mana spring marks: the mana primary with an ink ring and a pale stone disc behind
log('mana spring marks (primary on a pale stone disc #E9E1CC with a 1 px ink ring): primary vs disc WCAG');
for (const c of COLORS) { const p = COLOR_DEFS[c].palette.primary; log(`  ${c} ${p}: on disc ${f2(wcag(p, '#E9E1CC'))}, ink ring on disc ${f2(wcag(OUTLINE, '#E9E1CC'))}`); }

// 8. Paper grain and fibres: the cloth margin, and the grain over fills
log('');
log('## 8. Paper');
log(`label halo ${HALO} vs cloth #E8DCC2: dE ${f1(dN(HALO, '#E8DCC2'))}; fibres #5A4628 at 10% over the cloth: ${over('#E8DCC2', '#5A4628', 0.1)}, #FFFAEB at 14%: ${over('#E8DCC2', '#FFFAEB', 0.14)}`);

console.log(out.join('\n'));
