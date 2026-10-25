// Constrained search for the most muted terrain palette that keeps docs/09's rule exactly.
//   Variables: OKLCH L, C, h per terrain, each inside its hue family window (the reference's families).
//   Objective: minimise the mean OKLCH chroma of the seven fills (tie-break: hue nearer the family centre).
//   Hard constraints (level "docs"): every fill pair >= 20 normal and >= 12 protan, deutan, tritan (CIEDE2000, repo math);
//     every banner of NATION_BANNERS (all 11) reads on every fill by the band rule with keylineFor; keyline contrast >= 3.
//   Level "states" adds the approved companions: the same pair rule across the Ownership states (raw, haze 4%, out of sight
//     10%, ash 10%, moss 6%; final.md H1 / R17 / R18), the band rule in every state, both wild grounds >= 20/12 from every fill
//     in every state (R15), and the wild edge (granite or rim) >= 3:1 WCAG against every fill.
// Method: an exhaustive grid per family, unary filters, then depth-first branch and bound with forward checking (domains
//   sorted by chroma, fail-first family order, bound = chroma so far + the cheapest survivor of every open domain).
// Run: cd /home/user/Fluid-Magic- && npx tsx <dir>/search.ts [level] [gridL] [gridC] [gridH] [seconds] [floors] [tag]
import { writeFileSync } from 'node:fs';
import { labAs, deltaE2000 } from './colorMath.ts';
import {
  TERRAINS, CURRENT, BANNERS, STATES, stOver, oklch, fromOklch, chroma, Ls, keylineFor, contrastRatio, dE, VISIONS, shadeL, over,
  GRANITE, MERE, RIM, wcag, f1, f3, type T, type St,
} from './lib.ts';

const level = (process.argv[2] ?? 'states') as 'docs' | 'states';
const dL = Number(process.argv[3] ?? 0.02), dCh = Number(process.argv[4] ?? 0.008), dH = Number(process.argv[5] ?? 6);
const SECONDS = Number(process.argv[6] ?? 120);
const floorMode = process.argv[7] ?? 'halfref'; // halfref | none
const tag = process.argv[8] ?? `${level}`;
const N = Number(process.env.MIN_N ?? 20), CV = Number(process.env.MIN_C ?? 12);
// Paper-friendly: a wash is darker than the paper it lies on. Every fill's L* stays at least PAPERGAP under the cloth's.
const PAPERGAP = Number(process.env.PAPERGAP ?? 6), LMAX = Ls('#E8DCC2') - PAPERGAP;
// A wash on this paper: every sRGB channel at or under the cloth's (#E8DCC2 = 232, 220, 194), so the fill is the cloth seen
// through a transparent pigment (cloth x pigment, pigment <= 1 per channel). The approved Farmland (red 238) is brighter than the paper.
const WASH = (process.env.WASH ?? '1') === '1';
// Objective: 'mean' minimises the mean OKLCH chroma; 'rms' minimises the mean of squared chroma, which spends loud outliers first.
const OBJ = process.env.OBJ ?? 'mean';
// 'rmshue': squared chroma where chroma off the reference hue counts double: C^2 (1 + sin^2 dh), dh from the reference image's median
// hue for the family clamped into the family window (plains 86, farmland 75.4, forest 100, hills 71.5, swamp 130, wasteland 74;
// mountains has no usable reference, the sample is brown, so the grey-blue window's centre 228).
const REF_H: Record<T, number> = { plains: 86, farmland: 75.4, forest: 100, hills: 71.5, mountains: 228, swamp: 130, wasteland: 74 };
const dhRef = (t: T, h: number) => Math.abs(((h - REF_H[t] + 540) % 360) - 180);
const washOK = (hex: string) => { const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)); return c[0]! <= 232 && c[1]! <= 220 && c[2]! <= 194; };

interface Fam { hue: [number, number][]; centre: number[]; L: [number, number]; Cmin: number; Cmax: number; Lstar?: [number, number] }
// Hue windows in OKLCH degrees (the task's families, leaning warm toward the reference): plains straw (~95) to sage (~130);
// farmland ochre-gold; forest olive green to deep green; hills umber; mountains grey-blue stone; swamp olive-teal; wasteland
// dusty rose-brown or khaki. Chroma floors (halfref): no family duller than half of the reference's own median chroma for it
// (refsample.json: plains 0.086, farmland 0.111, forest 0.062, hills 0.083, mountains 0.051, swamp 0.043, barrens 0.089).
const REF_C: Record<T, number> = { plains: 0.086, farmland: 0.111, forest: 0.062, hills: 0.083, mountains: 0.051, swamp: 0.043, wasteland: 0.089 };
const FAM: Record<T, Fam> = {
  plains: { hue: [[86, 136]], centre: [105], L: [0.55, 0.92], Cmin: 0, Cmax: 0.16 },
  farmland: { hue: [[Number(process.env.FARM_HMIN ?? 64), 92]], centre: [78], L: [0.5, 0.9], Cmin: 0, Cmax: 0.17 },
  forest: { hue: [[100, 160]], centre: [128], L: [0.26, 0.6], Cmin: 0, Cmax: 0.14 },
  hills: { hue: [[48, 86]], centre: [68], L: [0.32, 0.72], Cmin: 0, Cmax: 0.14 },
  mountains: { hue: [[196, 266]], centre: [228], L: [0.45, 0.9], Cmin: 0, Cmax: 0.12 },
  swamp: { hue: [[130, 206]], centre: [165], L: [0.28, 0.68], Cmin: 0, Cmax: 0.14 },
  wasteland: { hue: [[14, 56], [74, 100]], centre: [35, 88], L: [0.4, 0.82], Cmin: 0, Cmax: 0.14 },
};
for (const t of TERRAINS) FAM[t].Cmin = floorMode === 'halfref' ? REF_C[t] / 2 : 0.006;
// Identity windows in CIELAB L* (value follows the family's name): light sage or straw plains, mid-light ochre-gold farmland,
// deep green forest (lighter than the wild granite), umber hills, stone mountains, olive-teal swamp, dusty wasteland.
const LSTAR: Record<T, [number, number]> = { plains: [66, 83], farmland: [58, 78], forest: [24, 42], hills: [34, 56], mountains: [52, 76], swamp: [32, 55], wasteland: [48, 72] };
if ((process.env.IDENTITY ?? '1') === '1') for (const t of TERRAINS) FAM[t].Lstar = LSTAR[t];

interface Cand { t: T; hex: string; L: number; C: number; h: number; cost: number; st: string[]; labs: Float64Array; idx: number; vlabs?: Float64Array; nv?: number }
// H13 (final.md): with H13=1 the texture extremes also count. Each fill's paint variants at today's amplitudes (mottle ±0.55 M at the
// blotch peak; the Mountains relief wash #3A4466 at 0.08) against every other terrain's, in every approved state, >= 19.5 / 11.0.
const H13 = (process.env.H13 ?? '0') === '1';
const H13M: Record<T, number> = { plains: 3, farmland: 3, forest: 3, hills: 0, mountains: 1, swamp: 1, wasteland: 0 };
const STN = level === 'states' && (process.env.PAIRSTATES ?? '1') === '1' ? STATES.length : 1;
const GROUNDS = level === 'states' && (process.env.GROUNDS ?? '1') === '1';
const NV = 4;
function hueOff(f: Fam, h: number) { return Math.min(...f.centre.map((c) => Math.abs(((h - c + 540) % 360) - 180))); }
function inWin(f: Fam, h: number) { return f.hue.some(([a, b]) => h >= a - 1e-9 && h <= b + 1e-9); }

function unaryOK(hex: string): boolean {
  const k = keylineFor(hex);
  if (contrastRatio(k, hex) < 3) return false;
  const states: St[] = level === 'states' ? [...STATES] : ['raw'];
  for (const st of states) {
    const g = stOver(hex, st, hex);
    for (const b of BANNERS) {
      const direct = dE(b, g, 'normal') >= N && dE(b, g, 'protan') >= CV && dE(b, g, 'deutan') >= CV && dE(b, g, 'tritan') >= CV;
      if (direct) continue;
      const kOK = (x: string, y: string) => dE(x, y, 'normal') >= N && dE(x, y, 'protan') >= CV && dE(x, y, 'deutan') >= CV && dE(x, y, 'tritan') >= CV;
      if (!(kOK(k, g) && kOK(k, b))) return false;
    }
    if (GROUNDS) for (const gr of [GRANITE, MERE]) {
      if (dE(gr, g, 'normal') < N || dE(gr, g, 'protan') < CV || dE(gr, g, 'deutan') < CV || dE(gr, g, 'tritan') < CV) return false;
    }
  }
  if (level === 'states' && Math.max(wcag(GRANITE, hex), wcag(RIM, hex)) < 3) return false;
  return true;
}

// ---- candidates
const t0 = Date.now();
const cands: Record<T, Cand[]> = {} as Record<T, Cand[]>;
let idx = 0;
// Refinement: with CENTER (a palette json), each family's grid is a box around that palette's OKLCH (±BOX_L, ±BOX_C, ±BOX_H),
// still clipped to the family's windows, floors and the other filters.
const CENTER: Record<T, string> | null = process.env.CENTER ? JSON.parse(process.env.CENTER) : null;
const BOX = { L: Number(process.env.BOX_L ?? 0.045), C: Number(process.env.BOX_C ?? 0.03), H: Number(process.env.BOX_H ?? 15) };
for (const t of TERRAINS) {
  const f = FAM[t], seen = new Set<string>(), list: Cand[] = [];
  const cL = CENTER ? oklch(CENTER[t]) : null;
  const Lr: [number, number] = cL ? [Math.max(f.L[0], cL[0] - BOX.L), Math.min(f.L[1], cL[0] + BOX.L)] : f.L;
  const Cr: [number, number] = cL ? [Math.max(Math.max(0.004, f.Cmin), cL[1] - BOX.C), Math.min(f.Cmax, cL[1] + BOX.C)] : [Math.max(0.004, f.Cmin), f.Cmax];
  const Hr: [number, number][] = cL ? [[cL[2] - BOX.H, cL[2] + BOX.H]] : f.hue;
  for (let L = Lr[0]; L <= Lr[1] + 1e-9; L += dL) for (let C = Cr[0]; C <= Cr[1] + 1e-9; C += dCh) for (const [ha, hb] of Hr) for (let h0 = ha; h0 <= hb + 1e-9; h0 += dH) { const h = (h0 + 360) % 360;
    const hex = fromOklch(L, C, h); if (!hex || seen.has(hex)) continue; seen.add(hex);
    const [rl, rc, rh] = oklch(hex); if (rc < f.Cmin - 0.001 || (rc > 0.01 && !inWin(f, rh)) || Ls(hex) > LMAX || (WASH && !washOK(hex)) || (f.Lstar && (Ls(hex) < f.Lstar[0] || Ls(hex) > f.Lstar[1]))) continue;
    if (!unaryOK(hex)) continue;
    const st = (STN > 1 ? [...STATES] : ['raw']).map((s) => stOver(hex, s as St, hex));
    const labs = new Float64Array(STN * NV * 3);
    st.forEach((x, si) => VISIONS.forEach((v, vi) => { const l = labAs(x, v); labs.set(l as unknown as number[], (si * NV + vi) * 3); }));
    let vlabs: Float64Array | undefined, nv = 0;
    if (H13) { const m = H13M[t] * 0.55; const vars = [hex, ...(m ? [shadeL(hex, m), shadeL(hex, -m)] : []), ...(t === 'mountains' ? [over(hex, '#3A4466', 0.08)] : [])]; nv = vars.length;
      vlabs = new Float64Array(nv * STATES.length * NV * 3); vars.forEach((x0, vi) => STATES.forEach((sname, si) => { const x = stOver(x0, sname, hex); VISIONS.forEach((v, k) => vlabs!.set(labAs(x, v) as unknown as number[], ((vi * STATES.length + si) * NV + k) * 3)); })); }
    list.push({ t, hex, L: rl, C: rc, h: rh, vlabs, nv, cost: OBJ === 'rmshue' ? rc * rc * (1 + Math.sin((dhRef(t, rh) * Math.PI) / 180) ** 2) : OBJ === 'rms' ? rc * rc + 0.000002 * hueOff(f, rh) : rc + 0.00008 * hueOff(f, rh), st, labs, idx: idx++ });
  }
  list.sort((a, b) => a.cost - b.cost);
  cands[t] = list;
}
console.log(`[${tag}] level ${level}, pairs in ${STN} states, grounds ${GROUNDS}, wash ${WASH}, H13 ${H13}, objective ${OBJ}, floors ${floorMode}, min ${N}/${CV}, L* <= ${f1(LMAX)}; grid dL ${dL} dC ${dCh} dH ${dH}; candidates after unary filters: ${TERRAINS.map((t) => `${t} ${cands[t].length}`).join(', ')} (${((Date.now() - t0) / 1000).toFixed(1)} s)`);

// ---- pair compatibility (memoised)
const memo = new Map<number, boolean>();
const tmpA: [number, number, number] = [0, 0, 0], tmpB: [number, number, number] = [0, 0, 0];
function compat(a: Cand, b: Cand): boolean {
  const key = a.idx < b.idx ? a.idx * 200003 + b.idx : b.idx * 200003 + a.idx;
  const m = memo.get(key); if (m !== undefined) return m;
  let ok = true;
  outer: for (let sa = 0; sa < STN; sa++) for (let sb = 0; sb < STN; sb++) for (let v = 0; v < NV; v++) {
    const ia = (sa * NV + v) * 3, ib = (sb * NV + v) * 3;
    tmpA[0] = a.labs[ia]!; tmpA[1] = a.labs[ia + 1]!; tmpA[2] = a.labs[ia + 2]!; tmpB[0] = b.labs[ib]!; tmpB[1] = b.labs[ib + 1]!; tmpB[2] = b.labs[ib + 2]!;
    if (deltaE2000(tmpA, tmpB) < (v === 0 ? N : CV)) { ok = false; break outer; }
  }
  if (ok && H13 && a.vlabs && b.vlabs) {
    const S = STATES.length;
    outer2: for (let va = 0; va < a.nv!; va++) for (let vb = 0; vb < b.nv!; vb++) { if (va === 0 && vb === 0) continue; for (let sa = 0; sa < S; sa++) for (let sb = 0; sb < S; sb++) for (let v = 0; v < NV; v++) {
      const ia = ((va * S + sa) * NV + v) * 3, ib = ((vb * S + sb) * NV + v) * 3;
      tmpA[0] = a.vlabs[ia]!; tmpA[1] = a.vlabs[ia + 1]!; tmpA[2] = a.vlabs[ia + 2]!; tmpB[0] = b.vlabs[ib]!; tmpB[1] = b.vlabs[ib + 1]!; tmpB[2] = b.vlabs[ib + 2]!;
      if (deltaE2000(tmpA, tmpB) < (v === 0 ? 19.5 : 11.0)) { ok = false; break outer2; }
    } }
  }
  memo.set(key, ok); return ok;
}

// ---- branch and bound
let best = Infinity, bestSol: Cand[] | null = null, nodes = 0, timedOut = false;
const deadline = Date.now() + SECONDS * 1000;
const sols: { cost: number; sol: Cand[] }[] = [];
function dfs(assigned: Cand[], open: Map<T, Cand[]>, cost: number) {
  if (Date.now() > deadline) { timedOut = true; return; }
  nodes++;
  if (open.size === 0) {
    if (cost < best - 1e-12) { best = cost; bestSol = [...assigned]; sols.push({ cost, sol: [...assigned] }); console.log(`  [${tag}] ${((Date.now() - t0) / 1000).toFixed(1)} s, node ${nodes}: mean C ${f3(assigned.reduce((s, c) => s + c.C, 0) / 7)} ${assigned.map((c) => `${c.t} ${c.hex}`).join(' ')}`); }
    return;
  }
  // fail-first: the open family with the fewest survivors
  let pick: T | null = null, pickN = Infinity; for (const [t, d] of open) if (d.length < pickN) { pick = t; pickN = d.length; }
  const dom = open.get(pick!)!;
  let restMin = 0; for (const [t, d] of open) if (t !== pick) restMin += d[0]!.cost;
  for (const c of dom) {
    if (cost + c.cost + restMin >= best - 1e-12) break; // domains sorted by cost; the bound only grows
    const next = new Map<T, Cand[]>(); let dead = false, bound = cost + c.cost;
    for (const [t, d] of open) {
      if (t === pick) continue;
      const nd = d.filter((x) => compat(c, x));
      if (!nd.length) { dead = true; break; }
      bound += nd[0]!.cost; if (bound >= best - 1e-12) { dead = true; break; }
      next.set(t, nd);
    }
    if (dead) continue;
    // head support: drop each open domain's cheapest members until one has a compatible partner in every other open domain
    if (next.size > 1) {
      let b2 = cost + c.cost;
      for (const [t, d] of next) {
        let k = 0; while (k < d.length && ![...next].every(([u, e]) => u === t || e.some((z) => compat(d[k]!, z)))) k++;
        if (k === d.length) { dead = true; break; }
        if (k) next.set(t, d.slice(k));
        b2 += d[k]!.cost; if (b2 >= best - 1e-12) { dead = true; break; }
      }
      if (dead) continue;
    }
    assigned.push(c); dfs(assigned, next, cost + c.cost); assigned.pop();
    if (timedOut) return;
  }
}
// ---- phase 1: simulated annealing over the same candidate grid, for a strong incumbent (seeded, deterministic)
function mulberry(seed: number) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const SA_RESTARTS = Number(process.env.SA_RESTARTS ?? 24), SA_ITERS = Number(process.env.SA_ITERS ?? 60000);
{
  const rnd = mulberry(Number(process.env.SEED ?? 7));
  const fams = TERRAINS.filter((t) => cands[t].length > 0);
  if (fams.length === 7) for (let r = 0; r < SA_RESTARTS && Date.now() < deadline; r++) {
    const cur: Cand[] = TERRAINS.map((t) => cands[t][Math.floor(rnd() * cands[t].length)]!);
    const viol = (k: number, c: Cand) => { let v = 0; for (let j = 0; j < 7; j++) if (j !== k && !compat(c, cur[j]!)) v++; return v; };
    let V = 0; for (let i = 0; i < 7; i++) for (let j = i + 1; j < 7; j++) if (!compat(cur[i]!, cur[j]!)) V++;
    let cost = cur.reduce((s, c) => s + c.cost, 0);
    const lam = OBJ === 'mean' ? 0.08 : 0.01;
    for (let it = 0; it < SA_ITERS; it++) {
      const temp = (OBJ === 'mean' ? 0.03 : 0.004) * Math.pow(0.0004 / 0.03, it / SA_ITERS);
      const k = Math.floor(rnd() * 7), t = TERRAINS[k]!, list = cands[t], old = cur[k]!;
      let nc: Cand;
      if (rnd() < 0.35) nc = list[Math.floor(rnd() * list.length)]!;
      else { // a nearby candidate: the closest of 24 random draws to a jittered target
        const tl = old.L + (rnd() - 0.5) * 0.08, tc = old.C + (rnd() - 0.5) * 0.04, th = old.h + (rnd() - 0.5) * 20; let bd = Infinity; nc = old;
        for (let q = 0; q < 24; q++) { const c = list[Math.floor(rnd() * list.length)]!; const d = ((c.L - tl) / 0.04) ** 2 + ((c.C - tc) / 0.02) ** 2 + ((((c.h - th + 540) % 360) - 180) / 10) ** 2; if (d < bd) { bd = d; nc = c; } }
      }
      if (nc === old) continue;
      const dv = viol(k, nc) - viol(k, old), dc = nc.cost - old.cost, dE_ = dc + lam * dv;
      if (dE_ <= 0 || rnd() < Math.exp(-dE_ / temp)) { cur[k] = nc; V += dv; cost += dc; if (V === 0 && cost < best - 1e-12) { best = cost; bestSol = [...cur]; sols.push({ cost, sol: [...cur] }); } }
    }
    console.log(`  [${tag}] anneal ${r + 1}/${SA_RESTARTS}: best mean C ${best < Infinity ? f3(bestSol!.reduce((s, c) => s + c.C, 0) / 7) : '-'} (${((Date.now() - t0) / 1000).toFixed(0)} s, memo ${memo.size})`);
  }
  if (bestSol) console.log(`  [${tag}] incumbent from annealing: ${(bestSol as Cand[]).map((c) => `${c.t} ${c.hex}`).join(' ')}`);
}
// ---- phase 2: branch and bound from that incumbent (proves or improves it on this grid)
const open0 = new Map<T, Cand[]>(TERRAINS.map((t) => [t, cands[t]]));
dfs([], open0, 0);
const sol = bestSol as Cand[] | null;
console.log(`[${tag}] ${timedOut ? 'TIME LIMIT (best found; not proven optimal on this grid)' : 'search complete: optimal on this grid'}; nodes ${nodes}; pair checks memoised ${memo.size}; ${((Date.now() - t0) / 1000).toFixed(1)} s`);
if (sol) {
  const byT = Object.fromEntries(sol.map((c) => [c.t, c])) as Record<T, Cand>;
  const meanC = sol.reduce((s, c) => s + c.C, 0) / 7, meanCur = TERRAINS.reduce((s, t) => s + oklch(CURRENT[t])[1], 0) / 7;
  const meanCs = sol.reduce((s, c) => s + chroma(c.hex), 0) / 7, meanCurS = TERRAINS.reduce((s, t) => s + chroma(CURRENT[t]), 0) / 7;
  console.log(`[${tag}] mean OKLCH C ${f3(meanC)} vs current ${f3(meanCur)} (${f1(100 * (1 - meanC / meanCur))}% lower); mean C*ab ${f1(meanCs)} vs ${f1(meanCurS)} (${f1(100 * (1 - meanCs / meanCurS))}% lower)`);
  for (const t of TERRAINS) { const c = byT[t]; console.log(`  ${t.padEnd(10)} ${c.hex}  OKLCH ${f3(c.L)} ${f3(c.C)} ${f1(c.h)}  L* ${f1(Ls(c.hex))} C* ${f1(chroma(c.hex))}   (current ${CURRENT[t]} C* ${f1(chroma(CURRENT[t]))})`); }
  writeFileSync(new URL(`./result-${tag}.json`, import.meta.url), JSON.stringify({ tag, level, grid: { dL, dCh, dH }, floors: floorMode, minN: N, minC: CV, LMAX, timedOut, nodes, meanC, meanCur, meanCs, meanCurS, fills: Object.fromEntries(TERRAINS.map((t) => [t, byT[t].hex])), history: sols.map((s) => ({ meanC: s.cost / 7, fills: Object.fromEntries(s.sol.map((c) => [c.t, c.hex])) })) }, null, 1));
}
