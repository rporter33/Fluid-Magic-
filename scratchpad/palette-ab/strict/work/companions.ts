// What else has to move with a palette so the land reads painted, measured with the repo math:
//   1. mottle amplitudes that keep H13's texture floor (19.5 / 11.0 at the blotch peak, every approved state);
//   2. paper tooth and granulation: visible swing (ΔE2000 between the grey extremes) and mean shift, per option;
//   3. the deepest edge pool that keeps the band rule (every banner, every state) and the H13 floor between pooled edges;
//   4. the ink sets (DARK_T) and region-ink alpha.
// Run: cd /home/user/Fluid-Magic- && npx tsx <dir>/companions.ts '<palette json>'
import { TERRAINS, CURRENT, BANNERS, STATES, stOver, over, shadeL, keylineFor, dN, dC, passes, wcag, rgb, toHex, f1, f2, type T } from './lib.ts';

const P: Record<T, string> = process.argv[2] ? JSON.parse(process.argv[2]) : CURRENT;
const say = (s = '') => console.log(s);
const M0: Record<T, number> = { plains: 3, farmland: 3, forest: 3, hills: 0, mountains: 1, swamp: 1, wasteland: 0 };
const RELIEF: Partial<Record<T, number>> = { mountains: 0.08 };

function floor(M: Record<T, number>, k: number, extra?: (t: T, f: string) => string[]) {
  let wn = { v: 1e9, a: '' as T | '', b: '' as T | '' }, wc = { v: 1e9, a: '' as T | '', b: '' as T | '' };
  const vars = (t: T) => { const f = P[t]; const v = [f, shadeL(f, M[t] * k), shadeL(f, -M[t] * k)]; if (RELIEF[t]) v.push(over(f, '#3A4466', RELIEF[t]!)); if (extra) v.push(...extra(t, f)); return v; };
  for (let i = 0; i < 7; i++) for (let j = i + 1; j < 7; j++) { const A = TERRAINS[i]!, B = TERRAINS[j]!; const va = vars(A), vb = vars(B);
    for (const sa of STATES) for (const sb of STATES) for (const a0 of va) for (const b0 of vb) { const a = stOver(a0, sa, P[A]), b = stOver(b0, sb, P[B]); const n = dN(a, b), c = dC(a, b); if (n < wn.v) wn = { v: n, a: A, b: B }; if (c < wc.v) wc = { v: c, a: A, b: B }; } }
  return { wn, wc };
}
say('1. Mottle (§1.4 ±M L*, blotch peak 0.55 M) against H13\'s floor 19.5 / 11.0 in every approved state');
{ const M = { ...M0 }; let r = floor(M, 0.55);
  say(`   today's amplitudes ${JSON.stringify(M0)}: ${f1(r.wn.v)} (${r.wn.a}/${r.wn.b}) / ${f1(r.wc.v)} (${r.wc.a}/${r.wc.b})`);
  let guard = 0;
  while ((r.wn.v < 19.5 || r.wc.v < 11.0) && guard++ < 20) { // lower the larger amplitude of the worst pair by 1
    const pair = r.wn.v < 19.5 ? r.wn : r.wc; const a = pair.a as T, b = pair.b as T; const t = M[a] >= M[b] ? a : b; if (M[t] === 0) { say('   floor fails with no mottle on the worst pair: the palette itself sits under H13'); break; } M[t] -= 1; r = floor(M, 0.55); }
  say(`   amplitudes that keep the floor: ${JSON.stringify(M)}: ${f1(r.wn.v)} / ${f1(r.wc.v)}`);
  // and how much headroom each terrain has alone
  for (const t of TERRAINS) { let best = 0; for (let m = 1; m <= 6; m++) { const Mx = { ...M, [t]: m }; const q = floor(Mx, 0.55); if (q.wn.v >= 19.5 && q.wc.v >= 11.0) best = m; else break; } say(`   ${t}: up to ±${best} L* with the others as above`); }
}

say('\n2. Paper tooth and granulation (soft-light, W3C formula in gamma space as canvas does)');
const soft = (base: string, grey: number, alpha: number) => toHex(rgb(base).map((v) => { const cb = v / 255, cs = grey / 255; const D = cb <= 0.25 ? ((16 * cb - 12) * cb + 4) * cb : Math.sqrt(cb); const B = cs <= 0.5 ? cb - (1 - 2 * cs) * cb * (1 - cb) : cb + (2 * cs - 1) * (D - cb); return 255 * ((1 - alpha) * cb + alpha * B); }));
const meanOf = (cols: string[]) => toHex([0, 1, 2].map((j) => cols.reduce((s, c) => s + rgb(c)[j]!, 0) / cols.length));
for (const [amp, alpha] of [[20, 0.5], [28, 0.5], [20, 0.7], [28, 0.65], [34, 0.6]] as const) {
  const greys = Array.from({ length: 21 }, (_, k) => 128 - amp + (2 * amp * k) / 20);
  const row = TERRAINS.map((t) => { const f = P[t]; const sw = dN(soft(f, 128 - amp, alpha), soft(f, 128 + amp, alpha)); const m = meanOf(greys.map((g) => soft(f, g, alpha))); return `${t} ${f1(sw)} (mean ${f2(dN(m, f))})`; });
  say(`   tooth 128±${amp} at ${alpha}: swing (mean shift) ${row.join(', ')}`);
}
const G: Record<T, number> = { plains: 0.25, farmland: 0.2, forest: 0.45, hills: 0.6, mountains: 0.7, swamp: 0.35, wasteland: 0.8 };
say(`   granulation 128±26 at today's rec.G: ${TERRAINS.map((t) => `${t} ${f1(dN(soft(P[t], 102, G[t]), soft(P[t], 154, G[t])))}`).join(', ')}`);
{ const g2 = { plains: 0.5, farmland: 0.45 } as Record<string, number>; const greys = Array.from({ length: 21 }, (_, k) => 102 + (52 * k) / 20);
  say(`   granulation 128±26 at plains 0.5, farmland 0.45 (proposed): ${(['plains', 'farmland'] as T[]).map((t) => `${t} swing ${f1(dN(soft(P[t], 102, g2[t]!), soft(P[t], 154, g2[t]!)))}, mean shift ${f2(dN(meanOf(greys.map((g) => soft(P[t], g, g2[t]!))), P[t]))}`).join('; ')}`); }
say(`   granulation 128±26 at 0.6 on plains and farmland (yellows granulate little; this is the visibility a light fill needs): ${(['plains', 'farmland'] as T[]).map((t) => `${t} ${f1(dN(soft(P[t], 102, 0.6), soft(P[t], 154, 0.6)))}`).join(', ')}`);

say('\n3. Edge pool: today\'s rim darkening per terrain (§1.4 E: plains -7, farmland -7, forest -5, hills -6, mountains -7, swamp -6, wasteland -8) scaled by k; the band rule on E and E-3 for every banner in every state, and two pooled edges across a border (both sides at their own E) in every state, against the H13 floor 19.5 / 11.0');
const E0: Record<T, number> = { plains: -7, farmland: -7, forest: -5, hills: -6, mountains: -7, swamp: -6, wasteland: -8 };
for (const k of [1, 1.25, 1.5, 2]) {
  let fail = 0; for (const t of TERRAINS) for (const st of STATES) for (const p0 of [shadeL(P[t], E0[t] * k), shadeL(P[t], E0[t] * k - 3)]) { const g = stOver(p0, st, P[t]); const kl = keylineFor(P[t]); for (const b of BANNERS) if (!(passes(b, g) || (passes(kl, g) && passes(kl, b)))) fail++; }
  let wn = { v: 1e9, s: '' }, wc = { v: 1e9, s: '' }; for (let i = 0; i < 7; i++) for (let j = i + 1; j < 7; j++) { const A = TERRAINS[i]!, B = TERRAINS[j]!; for (const sa of STATES) for (const sb of STATES) { const a = stOver(shadeL(P[A], E0[A] * k), sa, P[A]), b = stOver(shadeL(P[B], E0[B] * k), sb, P[B]); const n = dN(a, b), c = dC(a, b); if (n < wn.v) wn = { v: n, s: `${A}/${B}` }; if (c < wc.v) wc = { v: c, s: `${A}/${B}` }; } }
  say(`   pool x${k}: band-rule fails ${fail}; pooled edge against pooled edge ${f1(wn.v)} (${wn.s}) / ${f1(wc.v)} (${wc.s})`);
}
say('   (the mockup pool: shadow f - 28 L* at 0.45, blur 11 band px at Mid; about E -6 to -8 at the rim. f - 34 at 0.55 is about 1.5 x deeper)');

say('\n4. Ink sets and region ink');
const dark = TERRAINS.filter((t) => wcag('#F4EEDF', P[t]) > wcag('#2A1F14', P[t]));
say(`   DARK_T by contrast (light ink, paper-ink tracks, light region ink): ${dark.join(', ')} (today forest, hills, swamp)`);
for (const a of [0.9, 1.0]) say(`   region ink at ${a} on fill, edge pool -8 and -11, every state: ${TERRAINS.map((t) => { const ink = dark.includes(t) ? '#F4EEDF' : '#2A1F14'; const vs = [P[t], shadeL(P[t], -8), shadeL(P[t], -11)].flatMap((x) => STATES.map((s) => stOver(x, s, P[t]))); return `${t} ${f2(Math.min(...vs.map((x) => wcag(over(x, ink, a), x))))}`; }).join(', ')}`);
