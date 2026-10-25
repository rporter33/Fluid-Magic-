// Full evaluation of a painted (muted) terrain palette against the approved one.
// Run: cd /home/user/Fluid-Magic- && npx tsx <dir>/eval.ts '<palette json>' '<recipe json>'
import {
  OOS,
  BRIGHT, TERRAINS, type T, type Pal, oklch, lch, dN, dCvd, dE, ALL_BANNERS, M1_BANNERS, keylineFor, bandOk, wcag, f1, f2, f3,
  VISIONS, STATES, stOver, shadeL, over, greyEqL, desat, softLight, type State, mLab,
} from './lib';

export interface Rec { M: number; E: number; B: number; relief?: number; rimDL?: number; rimA?: number; hi?: number }
/** v3's PAINT table (p55-paint.js): mottle M (+-L* at alpha .55 peak), edge pool E (the pooled edge's L* step), blooms B. */
export const REC_V3: Record<T, Rec> = {
  plains: { M: 3, E: -7, B: 1 }, farmland: { M: 3, E: -7, B: 0 }, forest: { M: 3, E: -5, B: 0 }, hills: { M: 0, E: -6, B: 1 },
  mountains: { M: 1, E: -7, B: 1, relief: 0.08 }, swamp: { M: 1, E: -6, B: 2 }, wasteland: { M: 0, E: -8, B: 1 },
};
/** The proposed painted recipe (texture angle): a stronger lightness-only mottle in larger blotches, a deeper irregular edge pool,
 * darker bloom rims. E is the pooled edge's L* step at the band's inner edge (the band rule sees E and E-3). */
export const REC_PAINTED: Record<T, Rec> = { // E - 3 = the worst 1st-percentile L* step measured in Mid bakes (bake command); hi = the worst 99th percentile
  plains: { M: 6, E: -15, B: 2, rimDL: -12, rimA: 0.4, hi: 8 }, farmland: { M: 4, E: -14, B: 0, hi: 8 }, forest: { M: 6, E: -13, B: 0, hi: 8 },
  hills: { M: 6, E: -15, B: 1, rimDL: -12, rimA: 0.4, hi: 8 }, mountains: { M: 6, E: -14, B: 1, relief: 0.1, rimDL: -12, rimA: 0.4, hi: 8 },
  swamp: { M: 6, E: -14, B: 2, rimDL: -12, rimA: 0.4, hi: 8 }, wasteland: { M: 6, E: -12, B: 2, rimDL: -12, rimA: 0.4, hi: 8 },
};
/** v3 as measured in its Mid bakes: p01 down to -12.7 L*, p99 up to +3.4 L* (E -10 gives -10 and -13). */
export const REC_V3_MEASURED: Record<T, Rec> = Object.fromEntries(Object.entries(REC_V3).map(([t, r]) => [t, { ...r, E: -10, hi: 3.4 }])) as Record<T, Rec>;
/** Texture families (what each terrain draws at Mid; final.md §2.3-2.6, critique fixes 1, 4, 10). Pairs that share a family are "twins". */
export const FAMILY: Record<T, string[]> = {
  plains: ['speckle', 'tufts', 'copse'], farmland: ['patchwork', 'parallel'], forest: ['canopy'], hills: ['relief', 'hachure'],
  mountains: ['relief', 'peaks'], swamp: ['streaks', 'tufts'], wasteland: ['patchwork-lines'],
};
// Twins: a shared vocabulary that could be mistaken at the start zoom (relief ranges; tuft clusters; copse vs canopy; polygon networks).
export const TWINS = new Set(['hills/mountains', 'plains/swamp', 'plains/forest', 'farmland/wasteland']);
export const pairKey = (a: T, b: T) => (TERRAINS.indexOf(a) < TERRAINS.indexOf(b) ? `${a}/${b}` : `${b}/${a}`);

const DARK_T = new Set<T>(['forest', 'hills', 'swamp']);
const WILD = { peaks: '#2A292C', mere: '#24222A' };
const MODE_BASE: Record<T, string> = Object.fromEntries(TERRAINS.map((t) => [t, ({ forest: '#79786B', hills: '#7E7767', swamp: '#6F7A77' } as Record<string, string>)[t] ?? desat(BRIGHT[t], 0.8)])) as Record<T, string>;
const HEAT = ['#4C5E96', '#8170AC', '#C4808E', '#E6AC6E', '#F8E6A6'];
const heatAt = (t: number) => { const x = Math.max(0, Math.min(0.9999, t)) * 4, k = Math.floor(x), f = x - k; return over(HEAT[k]!, HEAT[k + 1]!, f); };

/** The painted variants of a terrain's ground: fill, mottle at the blotch peak (0.55) and full, edge pool and pool -3, bloom fill and rim, relief. */
export function paintVars(f: string, r: Rec, peak = 0.55) {
  const v = [f, shadeL(f, r.M * peak), shadeL(f, -r.M * peak), shadeL(f, r.E), shadeL(f, r.E - 3)];
  if (r.B) v.push(over(f, shadeL(f, 4), 0.35), over(f, shadeL(f, r.rimDL ?? -9), r.rimA ?? 0.3));
  if (r.relief) v.push(over(f, '#3A4466', r.relief));
  if (r.hi) v.push(shadeL(f, r.hi));
  return v;
}

export function evaluate(P: Pal, REC: Record<T, Rec>, label: string, opts: { relaxN?: number; relaxC?: number; quiet?: boolean } = {}) {
  const out: string[] = []; const say = (s = '') => out.push(s);
  const relaxN = opts.relaxN ?? 14, relaxC = opts.relaxC ?? 9;
  say(`# ${label}`);
  // A. chroma
  const cb = TERRAINS.reduce((s, t) => s + oklch(BRIGHT[t]).C, 0) / 7, cp = TERRAINS.reduce((s, t) => s + oklch(P[t]).C, 0) / 7;
  say(`\n## A. Chroma: mean OKLCH C ${f3(cp)} = ${f1((100 * cp) / cb)}% of the approved ${f3(cb)}`);
  for (const t of TERRAINS) { const o = oklch(P[t]), c = lch(P[t]), ob = oklch(BRIGHT[t]); say(`${t.padEnd(10)} ${P[t]}  OKLCH L ${f3(o.L)} C ${f3(o.C)} h ${f1(o.h).padStart(5)}  (approved ${BRIGHT[t]} C ${f3(ob.C)}, ${f1((100 * o.C) / ob.C)}%)  CIELAB L* ${f1(c.L)} C* ${f1(c.C)}  ΔE to approved ${f1(dN(P[t], BRIGHT[t]))}`); }
  // B. pairs on means
  say(`\n## B. Terrain pairs on means (fills), raw and across every approved Ownership state pair (haze, out of sight, ash 10%, moss 6%)`);
  const rows: { k: string; n: number; c: number; nS: number; cS: number; worstV: string; twin: boolean }[] = [];
  for (let i = 0; i < 7; i++) for (let j = i + 1; j < 7; j++) {
    const a = TERRAINS[i]!, b = TERRAINS[j]!; const k = pairKey(a, b);
    let nS = 1e9, cS = 1e9;
    for (const sa of STATES) for (const sb of STATES) { const x = stOver(P[a], sa, P[a]), y = stOver(P[b], sb, P[b]); nS = Math.min(nS, dN(x, y)); cS = Math.min(cS, dCvd(x, y)); }
    const per = VISIONS.slice(1).map((v) => [v, dE(P[a], P[b], v)] as const).sort((p, q) => p[1] - q[1])[0]!;
    rows.push({ k, n: dN(P[a], P[b]), c: dCvd(P[a], P[b]), nS, cS, worstV: per[0], twin: TWINS.has(k) });
  }
  rows.sort((p, q) => Math.min(p.nS / 20, p.cS / 12) - Math.min(q.nS / 20, q.cS / 12));
  for (const r of rows) say(`${r.k.padEnd(20)} raw ${f1(r.n).padStart(5)} / ${f1(r.c).padStart(5)} (${r.worstV})   all states ${f1(r.nS).padStart(5)} / ${f1(r.cS).padStart(5)}   ${r.twin ? 'TWIN (texture shares a family: needs 20/12)' : 'texture-distinct'}${r.nS >= 20 && r.cS >= 12 ? '' : r.twin ? '  <-- TWIN UNDER 20/12' : r.nS >= relaxN && r.cS >= relaxC ? '  (under 20/12, carried by texture)' : '  <-- UNDER THE RELAXED FLOOR'}`);
  const minRaw = { n: Math.min(...rows.map((r) => r.n)), c: Math.min(...rows.map((r) => r.c)) }, minS = { n: Math.min(...rows.map((r) => r.nS)), c: Math.min(...rows.map((r) => r.cS)) };
  const twinS = rows.filter((r) => r.twin), distS = rows.filter((r) => !r.twin);
  say(`floor raw ${f1(minRaw.n)} / ${f1(minRaw.c)}; all states ${f1(minS.n)} / ${f1(minS.c)}; twins (all states) ${f1(Math.min(...twinS.map((r) => r.nS)))} / ${f1(Math.min(...twinS.map((r) => r.cS)))}; texture-distinct pairs (all states) ${f1(Math.min(...distS.map((r) => r.nS)))} / ${f1(Math.min(...distS.map((r) => r.cS)))}; pairs under 20/12 in some state: ${rows.filter((r) => r.nS < 20 || r.cS < 12).length} of 21`);
  for (const v of VISIONS) { let m = { d: 1e9, k: '' }; for (let i = 0; i < 7; i++) for (let j = i + 1; j < 7; j++) { const d = dE(P[TERRAINS[i]!], P[TERRAINS[j]!], v); if (d < m.d) m = { d, k: `${TERRAINS[i]}/${TERRAINS[j]}` }; } say(`  closest raw ${v}: ${m.k} ${f1(m.d)}`); }
  // C. texture extremes (pixel level; information, not a floor)
  say(`\n## C. Pixel extremes of the paint (mottle at the blotch peak 0.55 M and at full M, edge pool E and E-3, blooms, relief), every state: the closest pair of different terrains`);
  for (const pk of [0.55, 1]) { let wn = { v: 1e9, s: '' }, wc = { v: 1e9, s: '' };
    for (let i = 0; i < 7; i++) for (let j = i + 1; j < 7; j++) { const a = TERRAINS[i]!, b = TERRAINS[j]!;
      for (const x0 of paintVars(P[a], REC[a], pk)) for (const y0 of paintVars(P[b], REC[b], pk)) for (const sa of ['raw', 'outOfSight', 'ash10', 'moss6'] as State[]) for (const sb of ['raw', 'outOfSight', 'ash10', 'moss6'] as State[]) {
        const x = stOver(x0, sa, P[a]), y = stOver(y0, sb, P[b]); const n = dN(x, y), c = dCvd(x, y); if (n < wn.v) wn = { v: n, s: `${a} ${x} vs ${b} ${y}` }; if (c < wc.v) wc = { v: c, s: `${a} ${x} vs ${b} ${y}` }; } }
    say(`peak ${pk}: closest normal ${f1(wn.v)} (${wn.s}); closest CVD ${f1(wc.v)} (${wc.s})`); }
  { let wn = 1e9, wc = 1e9; for (let i = 0; i < 7; i++) for (let j = i + 1; j < 7; j++) { const a = TERRAINS[i]!, b = TERRAINS[j]!;
      const mv = (t: T) => [P[t], shadeL(P[t], REC[t].M * 0.55), shadeL(P[t], -REC[t].M * 0.55), ...(REC[t].relief ? [over(P[t], '#3A4466', REC[t].relief!)] : [])];
      for (const x0 of mv(a)) for (const y0 of mv(b)) for (const sa of STATES) for (const sb of STATES) { const x = stOver(x0, sa, P[a]), y = stOver(y0, sb, P[b]); wn = Math.min(wn, dN(x, y)); wc = Math.min(wc, dCvd(x, y)); } }
    say(`H13's measure (mottle at the blotch peak and the relief wash only, every state): ${f1(wn)} / ${f1(wc)}`); }
  // D. band rule
  say(`\n## D. Band rule (20/12, unrelaxed): every banner on every terrain's paint variants under every Ownership state; keyline = keylineFor(fill)`);
  for (const [nm, list] of [['M1 banners (palette.test.ts set, R and G)', M1_BANNERS], ['all 11 banners', ALL_BANNERS]] as const) {
    let tot = 0, direct = 0, key = 0, fail = 0, fillsDirect = 0, fillsTot = 0; const fails: string[] = []; let worst = { v: 1e9, s: '' };
    for (const t of TERRAINS) { const k = keylineFor(P[t]);
      for (const b of list) { fillsTot++; if (bandOk(b, P[t], k).direct) fillsDirect++; }
      for (const st of STATES) for (const p0 of paintVars(P[t], REC[t], 1)) { const g = stOver(p0, st, P[t]);
        for (const b of list) { tot++; const r = bandOk(b, g, k); if (r.direct) { direct++; const m = Math.min(dN(b, g), (dCvd(b, g) * 20) / 12); if (m < worst.v) worst = { v: m, s: `${b} on ${t}/${st} ${g}: ${f1(dN(b, g))} / ${f1(dCvd(b, g))}` }; } else if (r.outlined) key++; else { fail++; fails.push(`${b} on ${t}/${st} ${g} (keyline ${k}: vs ground ${f1(dN(k, g))}/${f1(dCvd(k, g))}, vs banner ${f1(dN(k, b))}/${f1(dCvd(k, b))}; direct ${f1(dN(b, g))}/${f1(dCvd(b, g))})`); } } } }
    say(`${nm}: ${tot} pairs, ${direct} direct, ${key} through the keyline, ${fail} FAIL; closest direct ${worst.s}. On flat fills: ${fillsDirect} of ${fillsTot} banner/fill pairs pass direct (tokens stand on flat fills: fewer misses = tokens pop more)`);
    fails.slice(0, 10).forEach((x) => say('  FAIL ' + x));
  }
  // E. keylines
  say(`\n## E. Keylines (keylineFor) and their 3:1 test`);
  say(TERRAINS.map((t) => `${t} ${keylineFor(P[t])} ${f2(wcag(keylineFor(P[t]), P[t]))}:1${keylineFor(P[t]) !== keylineFor(BRIGHT[t]) ? ' (FLIPS from approved)' : ''}`).join('; '));
  // F. wilds
  say(`\n## F. Wild grounds against every fill, every state (wilds draw no state overlay)`);
  for (const [k, w] of Object.entries(WILD)) { let wn = { d: 1e9, t: '' }, wc = { d: 1e9, t: '' }; for (const t of TERRAINS) for (const st of STATES) { const g = stOver(P[t], st, P[t]); const n = dN(w, g), c = dCvd(w, g); if (n < wn.d) wn = { d: n, t: `${t}/${st}` }; if (c < wc.d) wc = { d: c, t: `${t}/${st}` }; } say(`${k} ground ${w}: closest normal ${wn.t} ${f1(wn.d)}, closest CVD ${wc.t} ${f1(wc.d)}`); }
  // G. data modes
  say(`\n## G. Data modes (MODE_BASE frozen at the approved values; heat ramp sampled at 41 steps) against the fills`);
  { let wn = { d: 1e9, s: '' }, wc = { d: 1e9, s: '' }; const own: string[] = [];
    const data: [string, string][] = [...TERRAINS.map((t) => [`base:${t}`, MODE_BASE[t]] as [string, string]), ...Array.from({ length: 41 }, (_, i) => [`heat${f2(i / 40)}`, heatAt(i / 40)] as [string, string])];
    for (const t of TERRAINS) { for (const [k, c] of data) { const n = dN(P[t], c), cv = dCvd(P[t], c); if (n < wn.d) wn = { d: n, s: `${t} vs ${k} ${c}` }; if (cv < wc.d) wc = { d: cv, s: `${t} vs ${k} ${c}` }; } own.push(`${t} ${f1(dN(P[t], MODE_BASE[t]))}`); }
    say(`closest normal ${f1(wn.d)} (${wn.s}); closest CVD ${f1(wc.d)} (${wc.s})`); say(`a mode switch changes each terrain by (fill vs its own data-mode base): ${own.join(', ')}`); }
  // H. state visibility
  say(`\n## H. How much each Ownership state changes a province (ΔE raw vs state), and the out-of-sight grey alpha that would match the approved change`);
  for (const t of TERRAINS) { const s = (['haze', 'outOfSight', 'ash10', 'moss6'] as State[]).map((st) => `${st} ${f1(dN(P[t], stOver(P[t], st, P[t])))} (approved ${f1(dN(BRIGHT[t], stOver(BRIGHT[t], st, BRIGHT[t])))})`);
    const want = dN(BRIGHT[t], over(BRIGHT[t], greyEqL(BRIGHT[t]), 0.1)); let a = 0.1; while (a < 0.6 && dN(P[t], over(P[t], greyEqL(P[t]), a)) < want) a += 0.01;
    say(`${t.padEnd(10)} ${s.join(', ')}; out of sight needs grey at ${f2(a)} to match`); }
  // I. lettering
  say(`\n## I. Lettering (WCAG) on the worst paint variant`);
  const v3Halo = (t: T) => (DARK_T.has(t) ? { ink: '#F4EEDF', halo: '#14120F', a: 0.75 } : { ink: '#2A1F14', halo: '#F2EAD6', a: 0.8 });
  for (const t of TERRAINS) { const vs = paintVars(P[t], REC[t], 1).flatMap((x) => STATES.map((st) => stOver(x, st, P[t]))); const h = v3Halo(t);
    const name = Math.min(...vs.map((g) => wcag(h.ink, over(g, h.halo, h.a)))); const reg = (DARK_T.has(t) ? '#F4EEDF' : '#2A1F14');
    const region = Math.min(...vs.map((g) => { const ground = over(g, P[t], 0.5); return wcag(over(ground, reg, 0.9), ground); }));
    const altInk = DARK_T.has(t) ? '#2A1F14' : '#F4EEDF', alt = Math.min(...vs.map((g) => { const ground = over(g, P[t], 0.5); return wcag(over(ground, altInk, 0.9), ground); }));
    say(`${t.padEnd(10)} place name ${f2(name)}:1 (${DARK_T.has(t) ? 'light on dark halo' : 'ink on paper halo'}); region ink at 90% ${f2(region)}:1 (the other ink would give ${f2(alt)}:1)`); }
  // J. tracks
  say(`\n## J. Tracks: 1.8 px dots, pitch 2.75 px, alpha 1 (dot peak / line average WCAG), on the fill and the worst paint variant`);
  say(TERRAINS.map((t) => { const ink = DARK_T.has(t) ? '#E8DCC2' : '#3E3428', avgA = (Math.PI * 1.8) / (4 * 2.75); const worst = Math.min(...paintVars(P[t], REC[t], 1).map((x) => wcag(ink, x))); return `${t} ${f2(wcag(ink, P[t]))}/${f2(wcag(over(P[t], ink, avgA), P[t]))} (worst peak ${f2(worst)})`; }).join('; '));
  // K. stamp faces
  say(`\n## K. Stamp faces (lit = fill +12 L* mixed 12% #F6D9A0; shade = fill -18 L* mixed 14% #3A4466): ΔE to the fill, and feature ink #3E3428 on the lit face`);
  say(TERRAINS.map((t) => { const lit = over(shadeL(P[t], 12), '#F6D9A0', 0.12), sh = over(shadeL(P[t], -18), '#3A4466', 0.14); return `${t} lit ${lit} (${f1(dN(lit, P[t]))}) shade ${sh} (${f1(dN(sh, P[t]))}) ink/lit ${f2(wcag('#3E3428', lit))}`; }).join('\n'));
  // L. paper tooth amplitude
  say(`\n## L. Paper tooth: L* swing of a grey 128 +- 20 in soft-light at alpha a, per fill`);
  for (const a of [0.5, 0.65, 0.8]) say(`alpha ${a}: ` + TERRAINS.map((t) => `${t} ${f1(mLab(softLight(P[t], 148, a))[0] - mLab(softLight(P[t], 108, a))[0])}`).join(', '));
  if (!opts.quiet) console.log(out.join('\n'));
  return { minRaw, minS, rows, out };
}

if (process.argv[1] && process.argv[1].endsWith('eval.ts')) {
  const P = process.argv[2] ? (JSON.parse(process.argv[2]) as Pal) : BRIGHT;
  if (process.argv[5]) OOS.alpha = JSON.parse(process.argv[5]) as Record<string, number>;
  const R = process.argv[3] === 'painted' ? REC_PAINTED : process.argv[3] === 'v3m' ? REC_V3_MEASURED : process.argv[3] ? (JSON.parse(process.argv[3]) as Record<T, Rec>) : REC_V3;
  evaluate(P, R, process.argv[4] ?? 'palette');
}
