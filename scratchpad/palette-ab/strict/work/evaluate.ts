// Measures a terrain palette against every rule and companion the painted map depends on, next to the current fills.
// Run: cd /home/user/Fluid-Magic- && npx tsx <dir>/evaluate.ts '<json of terrain -> hex>' [label]
// Uses the repo's colorMath (copied) and colors.ts (copied); paint models follow handdrawn-design/final-calc/final.ts and
// the mockup parts (p55-paint.js PAINT and the edge pool, p52-stamps.js faces, p57-letter.js inks, p60-draw.js MODE_BASE).
import {
  TERRAINS, CURRENT, BANNERS, M1_BANNERS, STATES, stOver, over, oklch, chroma, Ls, lab, shadeL, desatLab, keylineFor, contrastRatio,
  dN, dC, all4, pass4, passes, bandOK, GRANITE, MERE, RIM, CLOTH, wcag, f1, f2, f3, type T, VISIONS, dE, rgb, toHex,
} from './lib.ts';

const arg = process.argv[2];
const PROP: Record<T, string> = arg ? JSON.parse(arg) : CURRENT;
const label = process.argv[3] ?? 'proposal';
const say = (s = '') => console.log(s);
const PAINT: Record<T, { M: number; E: number; G: number; B: number; relief?: number }> = {
  plains: { M: 3, E: -7, G: 0.25, B: 1 }, farmland: { M: 3, E: -7, G: 0.2, B: 0 }, forest: { M: 3, E: -5, G: 0.45, B: 0 },
  hills: { M: 0, E: -6, G: 0.6, B: 1 }, mountains: { M: 1, E: -7, G: 0.7, B: 1, relief: 0.08 }, swamp: { M: 1, E: -6, G: 0.35, B: 2 },
  wasteland: { M: 0, E: -8, G: 0.8, B: 1 },
};
const DARK_T_NOW = new Set<T>(['forest', 'hills', 'swamp']);
type Pal = Record<T, string>;

function pairsMin(P: Pal, vars: (t: T, f: string) => string[], states: readonly (typeof STATES)[number][] = STATES) {
  let wn = { v: 1e9, s: '' }, wc = { v: 1e9, s: '' }, under = 0;
  for (let i = 0; i < 7; i++) for (let j = i + 1; j < 7; j++) {
    const A = TERRAINS[i]!, B = TERRAINS[j]!;
    for (const sa of states) for (const sb of states) for (const a0 of vars(A, P[A])) for (const b0 of vars(B, P[B])) {
      const a = stOver(a0, sa, P[A]), b = stOver(b0, sb, P[B]); const n = dN(a, b), c = dC(a, b);
      if (n < 20 || c < 12) under++;
      if (n < wn.v) wn = { v: n, s: `${A}/${sa} vs ${B}/${sb}` }; if (c < wc.v) wc = { v: c, s: `${A}/${sa} vs ${B}/${sb}` };
    }
  }
  return { wn, wc, under };
}
const fmtP = (r: ReturnType<typeof pairsMin>) => `${f1(r.wn.v)} (${r.wn.s}) / ${f1(r.wc.v)} (${r.wc.s}); extreme pairs under 20/12: ${r.under}`;

function paintVars(t: T, f: string, E = PAINT[t].E) {
  const r = PAINT[t]; const v = [f, shadeL(f, r.M), shadeL(f, -r.M), shadeL(f, E), shadeL(f, E - 3)];
  if (r.B) v.push(over(f, shadeL(f, 4), 0.35), over(f, shadeL(f, -9), 0.3));
  if (r.relief) v.push(over(f, '#3A4466', r.relief));
  return v;
}

function report(P: Pal, name: string) {
  say(`\n==================== ${name}`);
  say('fill        hex      OKLCH L/C/h            L*    C*    hue*   keyline (contrast)');
  for (const t of TERRAINS) { const h = P[t], [L, C, H] = oklch(h), k = keylineFor(h); say(`${t.padEnd(11)} ${h}  ${f3(L)} ${f3(C)} ${f1(H).padStart(5)}   ${f1(Ls(h)).padStart(5)} ${f1(chroma(h)).padStart(5)}   ${k} (${f2(contrastRatio(k, h))})`); }
  const mC = TERRAINS.reduce((s, t) => s + oklch(P[t])[1], 0) / 7, mCs = TERRAINS.reduce((s, t) => s + chroma(P[t]), 0) / 7;
  say(`mean OKLCH C ${f3(mC)}; mean C*ab ${f1(mCs)}; max C*ab ${f1(Math.max(...TERRAINS.map((t) => chroma(P[t]))))}; L* range ${f1(Math.min(...TERRAINS.map((t) => Ls(P[t]))))} to ${f1(Math.max(...TERRAINS.map((t) => Ls(P[t]))))}`);

  say('\n-- A. docs/09 rule on the raw fills (the repo test)');
  for (const v of VISIONS) { let w = { d: 1e9, s: '' }; for (let i = 0; i < 7; i++) for (let j = i + 1; j < 7; j++) { const d = dE(P[TERRAINS[i]!], P[TERRAINS[j]!], v); if (d < w.d) w = { d, s: `${TERRAINS[i]}/${TERRAINS[j]}` }; } say(`  ${v.padEnd(7)} closest ${f1(w.d)} (${w.s}) ${w.d >= (v === 'normal' ? 20 : 12) ? 'PASS' : 'FAIL'}`); }
  for (const [bn, set] of [['M1 banners (test)', M1_BANNERS], ['all 11 banners', BANNERS]] as const) {
    let direct = 0, key = 0, fail = 0; const fl: string[] = [];
    for (const t of TERRAINS) for (const b of set) { const f = P[t]; if (passes(b, f)) direct++; else if (bandOK(b, f, keylineFor(f))) key++; else { fail++; fl.push(`${b} on ${t}`); } }
    say(`  band rule, ${bn}: ${direct} direct, ${key} via keyline, ${fail} fail ${fl.join(', ')}`);
  }
  say(`  keyline contrast min ${f2(Math.min(...TERRAINS.map((t) => contrastRatio(keylineFor(P[t]), P[t]))))} (test: >= 3)`);

  say('\n-- B. Approved companions');
  say(`  pairs across the Ownership states (raw, haze, out of sight, ash 10%, moss 6%): ${fmtP(pairsMin(P, (t, f) => [f]))}`);
  { let tot = 0, direct = 0, key = 0, fail = 0; const fl: string[] = [];
    for (const t of TERRAINS) for (const st of STATES) { const g = stOver(P[t], st, P[t]); const k = keylineFor(P[t]); for (const b of BANNERS) { tot++; if (passes(b, g)) direct++; else if (passes(k, g) && passes(k, b)) key++; else { fail++; fl.push(`${b} on ${t}/${st}`); } } }
    say(`  band rule in every state, all banners: ${tot} pairs, ${direct} direct, ${key} keyline, ${fail} fail ${fl.slice(0, 6).join(', ')}`); }
  for (const [gn, g] of [['granite', GRANITE], ['mere water', MERE]] as const) {
    let w = { n: 1e9, c: 1e9, sn: '', sc: '' }; for (const t of TERRAINS) for (const st of STATES) { const x = stOver(P[t], st, P[t]); const n = dN(g, x), c = dC(g, x); if (n < w.n) w = { ...w, n, sn: `${t}/${st}` }; if (c < w.c) w = { ...w, c, sc: `${t}/${st}` }; }
    say(`  wild ground ${gn} ${g} vs every fill, every state: ${f1(w.n)} (${w.sn}) / ${f1(w.c)} (${w.sc}) ${w.n >= 20 && w.c >= 12 ? 'PASS' : 'FAIL'}`);
  }
  say(`  wild edge, best of granite and rim (WCAG; approved worst 4.14 on Hills): ${TERRAINS.map((t) => `${t} ${f2(Math.max(wcag(GRANITE, P[t]), wcag(RIM, P[t])))}`).join(', ')}`);

  say('\n-- C. Data modes (p60-draw.js MODE_BASE: Lab desaturation 80%, lifted with linen to L* >= 50 as R16 did for Forest, Hills, Swamp)');
  const lift50 = (f: string) => { const d = desatLab(f, 0.8); let k = 0, x = d; while (Ls(x) < 50 && k < 1) { k += 0.01; x = over(d, CLOTH, k); } return x; };
  const MB = Object.fromEntries(TERRAINS.map((t) => [t, lift50(P[t])])) as Pal;
  say(`  mode bases: ${TERRAINS.map((t) => `${t} ${MB[t]}`).join(', ')}`);
  const HEAT = ['#4C5E96', '#8170AC', '#C4808E', '#E6AC6E', '#F8E6A6'];
  const heat = (x: number) => { const s = Math.min(0.9999, x) * 4, k = Math.floor(s), fr = s - k, a = rgb(HEAT[k]!), b = rgb(HEAT[k + 1]!); return toHex(a.map((v, j) => v + (b[j]! - v) * fr)); };
  const modeCols: Record<string, string> = {};
  for (const t of TERRAINS) { modeCols[`base ${t}`] = MB[t]; for (const b of BANNERS) for (const a of [0.34, 0.48, 0.6, 0.7]) modeCols[`${b}@${a}/${t}`] = over(MB[t], b, a); }
  for (let i = 0; i <= 20; i++) modeCols[`heat ${i / 20}`] = heat(i / 20);
  for (const [gn, g] of [['granite', GRANITE], ['water', MERE]] as const) { let direct = 0, rim = 0, fail = 0; for (const c of Object.values(modeCols)) { if (passes(g, c)) direct++; else if (passes(RIM, c) && passes(RIM, g)) rim++; else fail++; } say(`  ${gn} vs ${Object.keys(modeCols).length} mode colors: ${direct} direct, ${rim} via rim, ${fail} fail`); }
  say(`  each fill against its own mode base (how far Ownership is from a data mode): ${TERRAINS.map((t) => `${t} ${f1(dN(P[t], MB[t]))}`).join(', ')}`);
  { let w = { v: 1e9, s: '' }, wc = { v: 1e9, s: '' }, under = 0; const cols = Object.entries(modeCols).filter(([k]) => k.startsWith('heat') || k.startsWith('base'));
    for (const [k, c] of cols) for (const t of TERRAINS) { if (k === `base ${t}`) continue; const n = dN(c, P[t]), cv = dC(c, P[t]); if (n < 20 || cv < 12) under++; if (n < w.v) w = { v: n, s: `${k} ${c} vs ${t}` }; if (cv < wc.v) wc = { v: cv, s: `${k} ${c} vs ${t}` }; }
    say(`  heat ramp and other terrains' mode bases vs every fill: closest ${f1(w.v)} (${w.s}) / ${f1(wc.v)} (${wc.s}); ${under} of ${cols.length * 7 - 7} under 20/12`); }

  say('\n-- D. Paint (final.md §1.4 recipe at today\'s amplitudes)');
  const mot = (k: number) => (t: T, f: string) => { const M = PAINT[t].M * k; const v = [f, shadeL(f, M), shadeL(f, -M)]; if (PAINT[t].relief) v.push(over(f, '#3A4466', PAINT[t].relief!)); return v; };
  say(`  H13 texture floor (19.5 / 11.0), mottle at the blotch peak 0.55 M: ${fmtP(pairsMin(P, mot(0.55)))}`);
  say(`  mottle at full amplitude: ${fmtP(pairsMin(P, mot(1)))}`);
  { let tot = 0, direct = 0, key = 0, fail = 0; const fl: string[] = [];
    for (const t of TERRAINS) for (const st of STATES) for (const p0 of paintVars(t, P[t])) { const g = stOver(p0, st, P[t]); const k = keylineFor(P[t]); for (const b of BANNERS) { tot++; if (passes(b, g)) direct++; else if (passes(k, g) && passes(k, b)) key++; else { fail++; fl.push(`${b} on ${t}/${st} ${g}`); } } }
    say(`  band rule on the painted variants (mottle, edge pool E and E-3, blooms, relief), every state: ${tot} pairs, ${direct} direct, ${key} keyline, ${fail} fail ${fl.slice(0, 5).join(', ')}`); }
  // edge-pool sweep: deepest edge darkening (in L*) that keeps the band rule on the pooled edge in every state and keeps two pooled edges across a border >= 20/12
  for (const E of [-6, -8, -10, -12, -14, -16]) {
    let fail = 0; for (const t of TERRAINS) for (const st of STATES) for (const p0 of [shadeL(P[t], E), shadeL(P[t], E - 3)]) { const g = stOver(p0, st, P[t]); const k = keylineFor(P[t]); for (const b of BANNERS) if (!(passes(b, g) || (passes(k, g) && passes(k, b)))) fail++; }
    const r = pairsMin(P, (t, f) => [shadeL(f, E)], ['raw']);
    say(`  edge pool at ${E} L* (both sides pooled across a border): band-rule fails ${fail}; pooled pair floor ${f1(r.wn.v)} / ${f1(r.wc.v)} (${r.wc.s})`);
  }
  // soft-light texture amplitude on each fill: paper tooth (grey 128 +- 20, alpha 0.5) and granulation (128 +- 26 at rec.G)
  const soft = (base: string, grey: number, alpha: number) => toHex(rgb(base).map((v) => { const cb = v / 255, cs = grey / 255; const D = cb <= 0.25 ? ((16 * cb - 12) * cb + 4) * cb : Math.sqrt(cb); const B = cs <= 0.5 ? cb - (1 - 2 * cs) * cb * (1 - cb) : cb + (2 * cs - 1) * (D - cb); return 255 * ((1 - alpha) * cb + alpha * B); }));
  say(`  paper tooth swing on each fill (ΔE2000 between grey 108 and 148 at soft-light 0.5): ${TERRAINS.map((t) => `${t} ${f1(dN(soft(P[t], 108, 0.5), soft(P[t], 148, 0.5)))}`).join(', ')}`);
  say(`  granulation swing (grey 102 vs 154 at rec.G): ${TERRAINS.map((t) => `${t} ${f1(dN(soft(P[t], 102, PAINT[t].G), soft(P[t], 154, PAINT[t].G)))}`).join(', ')}`);
  say(`  paper (cloth ${CLOTH}, L* ${f1(Ls(CLOTH))}) to each fill: ${TERRAINS.map((t) => `${t} ΔE ${f1(dN(CLOTH, P[t]))} ΔL* ${f1(Ls(P[t]) - Ls(CLOTH))}`).join(', ')}`);

  say('\n-- E. Ink on the land (WCAG)');
  const nameDark = (f: string) => wcag('#2A1F14', over(f, '#F2EAD6', 0.8)), nameLight = (f: string) => wcag('#F4EEDF', over(f, '#14120F', 0.75));
  say(`  place names, dark ink on a pale halo / light ink on a dark halo (letter vs halo over the fill; the bare-fill contrast decides which set a terrain joins):`);
  for (const t of TERRAINS) { const f = P[t]; const bd = wcag('#2A1F14', f), bl = wcag('#F4EEDF', f); say(`    ${t.padEnd(10)} on bare fill: dark ${f2(bd)}, light ${f2(bl)} -> ${bd >= bl ? 'light set (dark ink)' : 'DARK_T (light ink)'}${DARK_T_NOW.has(t) !== bd < bl ? '  [differs from DARK_T today]' : ''}; with halos: ${f2(nameDark(f))} / ${f2(nameLight(f))}`); }
  const darkSet = new Set(TERRAINS.filter((t) => wcag('#2A1F14', P[t]) < wcag('#F4EEDF', P[t])));
  say(`  region ink at 90% on the ground (fill, mottle, pool, blooms, every state), set by bare-fill contrast: ${TERRAINS.map((t) => { const ink = darkSet.has(t) ? '#F4EEDF' : '#2A1F14'; const vs = paintVars(t, P[t]).flatMap((x) => STATES.map((s) => stOver(x, s, P[t]))); return `${t} ${f2(Math.min(...vs.map((x) => wcag(over(x, ink, 0.9), x))))}`; }).join(', ')} (need 3)`);
  say(`  tracks (1.8 px dots, pitch 3.0, alpha 1), peak / line average, ink by the same set: ${TERRAINS.map((t) => { const ink = darkSet.has(t) ? '#E8DCC2' : '#3E3428'; const f = P[t]; const worst = Math.min(...paintVars(t, f).map((x) => wcag(over(x, ink, 1), x))); return `${t} ${f2(wcag(over(f, ink, 1), f))}/${f2(wcag(over(f, ink, (Math.PI * 1.8) / (4 * 3)), f))} (worst paint ${f2(worst)})`; }).join(', ')}`);
  say(`  stamp outline (feature ink #3E3428 at 0.8) on the fill: ${TERRAINS.map((t) => `${t} ${f2(wcag(over(P[t], '#3E3428', 0.8), P[t]))}`).join(', ')}`);
  const lit = (f: string) => over(shadeL(f, 12), '#F6D9A0', 0.12), shd = (f: string) => over(shadeL(f, -18), '#3A4466', 0.14);
  say(`  stamp faces (lit / shade) ΔE from the fill: ${TERRAINS.map((t) => `${t} ${lit(P[t])} ${f1(dN(lit(P[t]), P[t]))} / ${shd(P[t])} ${f1(dN(shd(P[t]), P[t]))}`).join(', ')}`);
  const KITS: Record<string, string[]> = { Cinder: ['#8F8C88', '#3A3633', '#3A3836', '#2B2A28', '#5E5953'], Thornwood: ['#A0785A', '#4E6B3A', '#6B4A2B', '#5E4630', '#9A958C'], Independents: ['#D8CBB0', '#C2A86B', '#9A958C', '#B9B4AA'] };
  const klit = (x: string) => over(shadeL(x, 8), '#F6D9A0', 0.12), kshd = (x: string) => over(shadeL(x, -12), '#3A4466', 0.14);
  for (const [k, tones] of Object.entries(KITS)) { const faces = tones.flatMap((x) => [klit(x), kshd(x)]).concat(['#1C1A17']); say(`  settlement kit ${k}, best tone incl. ink outline (need 3): ${TERRAINS.map((t) => `${t} ${f2(Math.max(...faces.map((x) => wcag(x, P[t]))))}`).join(', ')}`); }
  const FLECK: Partial<Record<T, string>> = { plains: '#9A6446', mountains: '#B59A55', wasteland: '#8E5A3E', swamp: '#A99C70' };
  say(`  flecks today: ${Object.entries(FLECK).map(([t, c]) => `${t} ${c} ΔE ${f1(dN(c!, P[t as T]))} from the fill, WCAG ${f2(wcag(c!, P[t as T]))}`).join(', ')}`);
  { const toks = [...BANNERS, '#91A092']; let under = 0; const list: string[] = []; for (const b of toks) for (const t of TERRAINS) if (!passes(b, P[t])) { under++; list.push(`${b}/${t}`); } say(`  banner and pewter tokens under 20/12 on the flat token zone: ${under} (${list.join(' ')})`); }
}

report(CURRENT, 'current fills (docs/09)');
if (arg) report(PROP, label);
