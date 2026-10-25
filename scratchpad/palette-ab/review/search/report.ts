// Full report for each palette. Run from the repo root: npx tsx <dir>/report.ts [names...]
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as E from './ev.ts';
const { T, f1, f2 } = E;
type Pal = E.Pal; type Terr = E.Terr;
const here = dirname(fileURLToPath(import.meta.url));
const PALS: Record<string, Pal> = JSON.parse(readFileSync(join(here, 'palettes.json'), 'utf8'));
const say = (s = '') => console.log(s);

// the texture proposal's own "Painted" recipe (its otherChanges 2), as extremes: mottle M at full, pool step -12 / -15,
// blooms +5 at .35 and -12 at .40, relief .10; the deepest pool -34 at .55 under the line -16 at .40
const TEXREC: Record<Terr, E.Rec> = { plains: { M: 6, E: -12, B: 1 }, farmland: { M: 4, E: -12, B: 0 }, forest: { M: 6, E: -12, B: 0 }, hills: { M: 6, E: -12, B: 1 }, mountains: { M: 6, E: -12, B: 1, relief: 0.1 }, swamp: { M: 6, E: -12, B: 1 }, wasteland: { M: 6, E: -12, B: 1 } };
const texVars = (t: Terr, f: string) => { const r = TEXREC[t]; const v = [f, E.shadeL(f, r.M), E.shadeL(f, -r.M), E.shadeL(f, -12), E.shadeL(f, -15)]; if (r.B) v.push(E.mix(f, E.shadeL(f, 5), 0.35), E.mix(f, E.shadeL(f, -12), 0.4)); if (r.relief) v.push(E.mix(f, E.RELIEF, r.relief)); return v; };
const texPool = (f: string) => E.mix(E.mix(f, E.shadeL(f, -34), 0.55), E.shadeL(f, -16), 0.4);

export function report(name: string, P: Pal, opt: { texPaint?: boolean } = {}) {
  const vars = opt.texPaint ? texVars : (t: Terr, f: string) => E.paintVars(t, f);
  const pool = opt.texPaint ? texPool : (f: string) => E.poolMax(f);
  say(`==================== ${name}${opt.texPaint ? ' (with its own Painted recipe)' : ' (v3 paint recipe)'}`);
  const st = E.stats(P);
  say('fill        hex      OKLCH L/C/h            L*    C*ab   keyline (WCAG)');
  for (const t of T) { const [L, C, h] = E.oklch(P[t]); say(`${t.padEnd(11)} ${P[t]}  ${L.toFixed(3)} ${C.toFixed(3)} ${h.toFixed(1).padStart(5)}    ${f1(E.Ls(P[t])).padStart(4)}  ${f1(E.Cab(P[t])).padStart(4)}   ${E.keylineFor(P[t])} (${f2(E.wcag(E.keylineFor(P[t]), P[t]))})`); }
  say(`muting: mean OKLCH C ${st.meanC.toFixed(3)}, max ${st.maxC.toFixed(3)}; mean C*ab ${f1(st.meanCab)}, max ${f1(st.maxCab)}; L* ${f1(st.Lmin)} to ${f1(st.Lmax)}`);
  say(`harmony: chroma-weighted hue concentration ${f2(st.conc)} (mean hue ${f1(st.meanHue)}); mean chroma outside OKLCH hue 60-140 ${st.offC.toFixed(3)}`);
  // A. the docs/09 rule (repo test replica)
  const raw = E.rawRule(P);
  say(`A. raw fills (repo closestPair): ${E.VISIONS.map((v) => `${v} ${f1(raw.per[v].deltaE)} (${raw.per[v].a}/${raw.per[v].b})`).join('; ')} -> ${raw.pass ? 'PASS' : 'FAIL'}`);
  const flat = (_t: Terr, f: string) => [f];
  const bm1 = E.bandRule(P, E.M1_BANNERS, flat), ball = E.bandRule(P, E.BANNERS, flat);
  say(`   band rule, 8 M1 banners (the test): ${bm1.direct} direct, ${bm1.key} keyline, ${bm1.fail} fail; all 11: ${ball.direct} direct, ${ball.key} keyline, ${ball.fail} fail ${ball.fails.slice(0, 4).join(', ')}`);
  say(`   keyline WCAG min ${f2(Math.min(...T.map((t) => E.wcag(E.keylineFor(P[t]), P[t]))))}; keyline set dark-on: ${T.filter((t) => E.keylineFor(P[t]) === E.MAP_KEYLINES.dark).join(',')}`);
  // B. approved companions
  const sp = E.statePairs(P);
  say(`B. pairs across the 5 Ownership states: ${f1(sp.wN.v)} (${sp.wN.s}) / ${f1(sp.wC.v)} (${sp.wC.s}); pairs under 20/12: ${sp.under}`);
  const bst = E.bandRule(P, E.BANNERS, (t, f) => E.STATES.map((s) => E.stOver(f, s, f)));
  say(`   band rule, flat fills in every state, 11 banners: ${bst.tot} pairs, ${bst.direct} direct, ${bst.key} keyline, ${bst.fail} fail`);
  const bp = E.bandRule(P, E.BANNERS, (t, f) => E.STATES.flatMap((s) => vars(t, f).map((x) => E.stOver(x, s, f))));
  say(`   band rule, painted variants x states: ${bp.tot} pairs, ${bp.direct} direct, ${bp.key} keyline, ${bp.fail} fail; closest direct ${bp.closest.s} ${bp.fails.slice(0, 4).join(', ')}`);
  const bpool = E.bandRule(P, E.BANNERS, (t, f) => E.STATES.map((s) => E.stOver(pool(f), s, f)));
  say(`   band rule, deepest pool point x states: ${bpool.tot} pairs, ${bpool.direct} direct, ${bpool.key} keyline, ${bpool.fail} fail ${bpool.fails.slice(0, 6).join(', ')}`);
  const h13 = E.statePairs(P, E.h13Vars());
  say(`   H13 floor (v3 mottle at the 0.55 blotch peak, every state; need 19.5 / 11.0): ${f1(h13.wN.v)} (${h13.wN.s}) / ${f1(h13.wC.v)} (${h13.wC.s})`);
  if (opt.texPaint) { const h13t = E.statePairs(P, (t, f) => { const r = TEXREC[t]; const v = [f, E.shadeL(f, 0.55 * r.M), E.shadeL(f, -0.55 * r.M)]; if (r.relief) v.push(E.mix(f, E.RELIEF, r.relief)); return v; }); say(`   H13 measure with its own mottle (M 6, Farmland 4) at the 0.55 peak: ${f1(h13t.wN.v)} (${h13t.wN.s}) / ${f1(h13t.wC.v)} (${h13t.wC.s})`); }
  for (const [nm, g] of [['granite', E.GRANITE], ['mere', E.MERE]] as const) { const r = E.grounds(P, g), rp = E.grounds(P, g, (_t, f) => [pool(f)]); say(`   wild ground ${nm} ${g}: flat fills x states ${f1(r.wN.v)} (${r.wN.s}) / ${f1(r.wC.v)} (${r.wC.s}) ${r.wN.v >= 20 && r.wC.v >= 12 ? 'PASS' : 'FAIL'}; deepest pool (info) ${f1(rp.wN.v)} / ${f1(rp.wC.v)} (${rp.wC.s})`); }
  say(`   wild edge, best of granite and rim (WCAG): ${T.map((t) => `${t} ${f2(Math.max(E.wcag(E.GRANITE, P[t]), E.wcag(E.RIM, P[t])))}`).join(', ')}`);
  // C. data modes
  for (const [nm, base] of [['derived from these fills', E.deriveBase(P)], ['frozen at the approved bases', E.APPROVED_BASE]] as const) {
    const mv = E.modesVsFills(P, base), gm = E.groundsVsModes(base);
    say(`C. data modes, MODE_BASE ${nm} (${T.map((t) => base[t]).join(' ')}):`);
    say(`   fills vs every base and heat step: ${f1(mv.wN.v)} (${mv.wN.s}) / ${f1(mv.wC.v)} (${mv.wC.s}); each fill vs its own base: ${T.map((t) => `${t} ${f1(mv.own[t]!)}`).join(', ')}`);
    say(`   grounds vs ${gm.granite!.tot} mode colors: granite ${gm.granite!.direct} direct / ${gm.granite!.rim} rim / ${gm.granite!.fail} fail; mere ${gm.mere!.direct} / ${gm.mere!.rim} / ${gm.mere!.fail}`);
  }
  // D. ink and marks
  const allG = (t: Terr) => E.STATES.flatMap((s) => vars(t, P[t]).map((x) => E.stOver(x, s, P[t])));
  const darkSet = T.filter((t) => E.wcag('#F4EEDF', P[t]) > E.wcag('#2A1F14', P[t]));
  say(`D. bare-fill contrast puts in the light-ink (dark) set: ${darkSet.join(',')} (DARK_T is forest,hills,swamp)`);
  say(`   place names with halos, flat zone / worst painted ground: ${T.map((t) => `${t} ${f2(E.placeName(t, P[t]))}/${f2(Math.min(...allG(t).map((g) => E.placeName(t, g))))}`).join(', ')}`);
  say(`   region ink 90%, worst over paint x states (+ deepest pool): ${T.map((t) => `${t} ${f2(Math.min(...allG(t).map((g) => E.regionInk(t, g))))} (${f2(E.regionInk(t, pool(P[t])))})`).join(', ')}`);
  say(`   region ink 100%, worst over paint x states: ${T.map((t) => `${t} ${f2(Math.min(...allG(t).map((g) => E.regionInk(t, g, 1))))}`).join(', ')}`);
  say(`   tracks peak/avg on fill; worst interior paint peak/avg; deepest pool peak: ${T.map((t) => { const a = E.track(t, P[t]); const w = allG(t).map((g) => E.track(t, g)); return `${t} ${f2(a.peak)}/${f2(a.avg)}; ${f2(Math.min(...w.map((x) => x.peak)))}/${f2(Math.min(...w.map((x) => x.avg)))}; ${f2(E.track(t, pool(P[t])).peak)}`; }).join(' | ')}`);
  say(`   settlement and stone tones, best tone incl. ink (need 3): ${Object.entries(E.KITS).map(([k, tn]) => `${k} ${f2(Math.min(...T.map((t) => E.kitBest(tn, P[t]))))} (${T.reduce((a, t) => (E.kitBest(tn, P[t]) < E.kitBest(tn, P[a]) ? t : a), T[0])})`).join(', ')}`);
  let tok = 0; const tokL: string[] = []; for (const t of T) for (const b of [...E.BANNERS, E.PEWTER]) if (!E.ok(b, P[t])) { tok++; tokL.push(`${b}/${t}`); }
  say(`   banner and pewter tokens under 20/12 on the flat token zone: ${tok} (${tokL.join(' ')})`);
  say(`   stamp outline (feature ink at .8) on the fill: ${T.map((t) => `${t} ${f2(E.wcag(E.mix(P[t], E.FEATURE_INK, 0.8), P[t]))}`).join(', ')}`);
  say();
  return { raw, sp, h13, bp, bpool };
}

const names = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(PALS);
for (const n of names) { const tex = n.endsWith('+texpaint'); const k = tex ? n.replace('+texpaint', '') : n; report(k, PALS[k]!, { texPaint: tex }); }
