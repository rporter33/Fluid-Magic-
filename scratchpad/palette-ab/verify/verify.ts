// Color checks of the built mockup's two palettes, with the repo's own color math (tests/content/colorMath.ts) and colors
// (src/content/colors.ts), both copied unchanged into this directory. Run from the repo root so node_modules resolves:
//   npx tsx <this dir>/verify.ts <built game-screen.html>
// The fills, the data-mode bases and the heat ramp are read from the built HTML, so this checks what the page paints.
import { readFileSync } from 'node:fs';
import { closestPair, deltaE2000, labAs, VISIONS, type Vision } from './colorMath.ts';
import { contrastRatio, keylineFor, NATION_BANNERS } from './colors.ts';

const html = readFileSync(process.argv[2] ?? '', 'utf8');
const T = ['plains', 'farmland', 'forest', 'hills', 'mountains', 'swamp', 'wasteland'] as const;
type Pal = Record<string, string>;
const palOf = (name: string): Pal => {
  const m = html.match(new RegExp(`${name}: \\{ (plains: '#[0-9A-F]{6}'(?:, \\w+: '#[0-9A-F]{6}')*) \\}`));
  if (!m || !m[1]) throw new Error('no palette ' + name);
  return Object.fromEntries([...m[1].matchAll(/(\w+): '(#[0-9A-F]{6})'/g)].map((x) => [x[1] ?? '', x[2] ?? '']));
};
const PALS: Record<string, Pal> = { bright: palOf('bright'), painted: palOf('painted') };

// ---- the mockup's conversions (p10b-core.js), for the overlay states and the data-mode bases it derives
const hex2rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const rgb2hex = (c: number[]) => '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();
const s2l = (c: number) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const l2s = (c: number) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.max(0, c) ** (1 / 2.4) - 0.055);
function rgb2lab([r = 0, g = 0, b = 0]: number[]) { const R = s2l(r), G = s2l(g), B = s2l(b); const X = (0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047, Y = 0.2126 * R + 0.7152 * G + 0.0722 * B, Z = (0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883; const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116); return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))]; }
function lab2rgb([L = 0, a = 0, b = 0]: number[]) { const fy = (L + 16) / 116, fx = fy + a / 500, fz = fy - b / 200; const fi = (t: number) => (t ** 3 > 0.008856 ? t ** 3 : (t - 16 / 116) / 7.787); const X = fi(fx) * 0.95047, Y = fi(fy), Z = fi(fz) * 1.08883; return [l2s(3.2406 * X - 1.5372 * Y - 0.4986 * Z), l2s(-0.9689 * X + 1.8758 * Y + 0.0415 * Z), l2s(0.0557 * X - 0.204 * Y + 1.057 * Z)]; }
const desat = (h: string, k: number) => { const l = rgb2lab(hex2rgb(h)); l[1] = (l[1] ?? 0) * (1 - k); l[2] = (l[2] ?? 0) * (1 - k); return rgb2hex(lab2rgb(l)); };
const mix = (a: string, b: string, t: number) => { const A = hex2rgb(a), B = hex2rgb(b); return rgb2hex(A.map((v, j) => v + ((B[j] ?? 0) - v) * t)); };
const greyEqL = (f: string) => rgb2hex(lab2rgb([rgb2lab(hex2rgb(f))[0] ?? 0, 0, 0]));
const dE = (x: string, y: string, v: Vision) => deltaE2000(labAs(x, v), labAs(y, v));
const r1 = (x: number) => Math.round(x * 10) / 10;
const minBy = (v: Vision) => (v === 'normal' ? 20 : 12);

const M1 = ['R', 'G'] as const; // the test's banners: every banner of the colors M1 nations use (Cinder Horde R, Thornwood G)
const bannersOf = (cs: readonly string[]) => Object.fromEntries(cs.flatMap((c) => (NATION_BANNERS[c as 'R'] ?? []).map((hex, k) => [`${c}${k}`, hex])));
const B8 = bannersOf(M1), B11 = bannersOf(['W', 'U', 'B', 'R', 'G']);
const STATES: [string, (f: string) => string][] = [['raw', (f) => f], ['haze 4%', (f) => mix(f, '#E8DCC2', 0.04)], ['out of sight 10%', (f) => mix(f, greyEqL(f), 0.1)], ['ash 10%', (f) => mix(f, '#8F8C88', 0.1)], ['moss 6%', (f) => mix(f, '#5E7F45', 0.06)]];
const GRANITE = html.includes("'#2A292C'") ? '#2A292C' : '', MERE = html.includes("'#24222A'") ? '#24222A' : '';
const heatM = html.match(/const HEAT = \[([^\]]+)\]/), HEAT = heatM && heatM[1] ? [...heatM[1].matchAll(/'(#[0-9A-F]{6})'/g)].map((x) => x[1] ?? '') : [];
const modeOv = { forest: '#79786B', hills: '#7E7767', swamp: '#6F7A77' } as Record<string, string>;
if (!html.includes("{ forest: '#79786B', hills: '#7E7767', swamp: '#6F7A77' }[t] ?? desat(f, 0.8)") || !html.includes('Object.entries(PALETTES.bright)')) throw new Error('MODE_BASE is not built from the approved fills');
const MODE_BASE = Object.fromEntries(T.map((t) => [t, modeOv[t] ?? desat(PALS.bright?.[t] ?? '', 0.8)]));
const heat = (x: number) => { const y = Math.max(0, Math.min(0.9999, x)) * (HEAT.length - 1), k = Math.floor(y), f = y - k, a = hex2rgb(HEAT[k] ?? ''), b = hex2rgb(HEAT[k + 1] ?? ''); return rgb2hex(a.map((v, j) => v + ((b[j] ?? 0) - v) * f)); };
const MODE_COLORS = [...Object.values(MODE_BASE), ...Array.from({ length: 129 }, (_, k) => heat(k / 128))];

const out: string[] = [];
const say = (s: string) => out.push(s);
for (const [name, pal] of Object.entries(PALS)) {
  say(`\n== ${name} ${JSON.stringify(pal)}`);
  // 1. palette.test.ts replica: terrain fills distinct per vision
  const fills = Object.fromEntries(T.map((t) => [t, pal[t] ?? '']));
  const pairs = VISIONS.map((v) => { const c = closestPair(fills, v); return `${v} ${r1(c.deltaE)} (${c.a}/${c.b}) ${c.deltaE >= minBy(v) ? 'pass' : 'FAIL'}`; });
  say('terrain fills, closest pair: ' + pairs.join('; '));
  // 2. palette.test.ts replica: keyline 3:1 on every fill, and the band rule for the test's 8 banners; then all 11 banners
  say('keylineFor contrast: ' + T.map((t) => `${t} ${keylineFor(fills[t] ?? '') === '#1C1A17' ? 'dark' : 'light'} ${contrastRatio(keylineFor(fills[t] ?? ''), fills[t] ?? '').toFixed(2)}`).join(', '));
  for (const [lbl, banners] of [['band rule, the test\'s 8 M1 banners', B8], ['band rule, all 11 banners', B11]] as const) {
    let direct = 0, keyed = 0; const fails: string[] = [];
    for (const [bn, b] of Object.entries(banners)) for (const t of T) {
      const f = fills[t] ?? '', k = keylineFor(f); const vis = VISIONS.map((v) => ({ d: dE(b, f, v) >= minBy(v), o: dE(k, f, v) >= minBy(v) && dE(k, b, v) >= minBy(v) }));
      if (vis.every((x) => x.d)) direct++; else if (vis.every((x) => x.d || x.o)) keyed++; else fails.push(`${bn} on ${t}`);
    }
    say(`${lbl}: ${direct} direct, ${keyed} need the keyline, ${fails.length} fail ${fails.join(' ')}`);
  }
  // 3. the mockup's own band keylines (Cinder Horde #FD6533 with the dark keyline, Thornwood #00674B with the light one, at 70%)
  const mk = [['red #FD6533', '#FD6533', '#1C1A17'], ['green #00674B', '#00674B', '#F4EEDF']] as const;
  for (const [lbl, b, k] of mk) {
    const rows = T.map((t) => { const f = fills[t] ?? ''; const kk = mix(f, k, 0.7); const res = VISIONS.map((v) => (dE(b, f, v) >= minBy(v) ? 'd' : dE(kk, f, v) >= minBy(v) && dE(kk, b, v) >= minBy(v) ? 'k' : 'X')); return `${t} ${res.join('')}`; });
    say(`mockup band ${lbl} (d direct, k its 70% keyline, X fail; normal/protan/deutan/tritan): ${rows.join(', ')}`);
  }
  // 4. every terrain pair across the five Ownership states (the live overlay)
  let worstN = 99, worstD = 99, wn = '', wd = '';
  for (let a = 0; a < T.length; a++) for (let b = a + 1; b < T.length; b++) for (const [sa, fa] of STATES) for (const [sb, fb] of STATES) {
    const A = fa(fills[T[a]] ?? ''), B = fb(fills[T[b]] ?? '');
    const n = dE(A, B, 'normal'); if (n < worstN) { worstN = n; wn = `${T[a]} ${sa} / ${T[b]} ${sb}`; }
    for (const v of VISIONS.slice(1)) { const d = dE(A, B, v); if (d < worstD) { worstD = d; wd = `${T[a]} ${sa} / ${T[b]} ${sb} (${v})`; } }
  }
  say(`terrain pairs across the 5 Ownership states: normal ${r1(worstN)} (${wn}); worst deficiency ${r1(worstD)} (${wd}) ${worstN >= 20 && worstD >= 12 ? 'pass' : 'FAIL'}`);
  // 5. wild grounds against every fill in every state
  for (const [lbl, w] of [['granite', GRANITE], ['mere', MERE]] as const) {
    let n = 99, d = 99, at = '';
    for (const t of T) for (const [s, fs] of STATES) { const f = fs(fills[t] ?? ''); const a = dE(w, f, 'normal'); if (a < n) { n = a; at = t + ' ' + s; } for (const v of VISIONS.slice(1)) d = Math.min(d, dE(w, f, v)); }
    say(`wild ground ${lbl} ${w}: normal ${r1(n)} (closest ${at}), worst deficiency ${r1(d)} ${n >= 20 && d >= 12 ? 'pass' : 'FAIL'}`);
  }
  // 6. data-mode colors (frozen bases and the heat ramp, 129 samples) against the fills: information only (never on screen together)
  let mn = 99, md = 99, an = '', ad = '';
  for (const t of T) for (const c of MODE_COLORS) { const f = fills[t] ?? ''; const a = dE(c, f, 'normal'); if (a < mn) { mn = a; an = `${t} vs ${c}`; } for (const v of VISIONS.slice(1)) { const d = dE(c, f, v); if (d < md) { md = d; ad = `${t} vs ${c} (${v})`; } } }
  say(`data-mode colors against the fills (information): normal ${r1(mn)} (${an}); worst deficiency ${r1(md)} (${ad})`);
}
say(`\nMODE_BASE as built (both palettes): ${JSON.stringify(MODE_BASE)}; HEAT ${JSON.stringify(HEAT)}`);
console.log(out.join('\n'));
