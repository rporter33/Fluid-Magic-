// Fix 5: the neutral hairline's alpha per terrain. keylineFor(albedo) at alpha a over the ground, against the ground (WCAG), worst over the relief
// extremes (-A, 0, +0.6 A) and all five approved states (raw, unexplored haze 4%, out of sight 10%, ash 10%, moss 6%), as review-checks4.ts measures it.
// Run from the repo root: npx tsx <this file>
import * as L from '../../../mapwork/calc/lib.ts';
const { T, f2, mix, shadeL, wcag } = L;
const P: L.Pal = { plains: '#78894A', farmland: '#D5B16B', forest: '#1A3819', hills: '#6D5303', mountains: '#859BB8', swamp: '#38616D', wasteland: '#877773' };
const A = L.AMP;
const worst = (t: L.Terr, a: number, states: readonly L.BSt[] = L.BASE_STATES) => { const k = L.keylineFor(P[t]); let w = 1e9, at = ''; for (const [n, x] of [['-A', shadeL(P[t], -A[t])], ['0', P[t]], ['+0.6A', shadeL(P[t], 0.6 * A[t])]] as const) for (const s of states) { const g = L.baseState(x, s, P[t]); const c = wcag(mix(g, k, a), g); if (c < w) { w = c; at = `${n} ${s}`; } } return { w, at }; };
const crit = { plains: 0.62, farmland: 0.46, forest: 0.34, hills: 0.51, mountains: 0.67, swamp: 0.48, wasteland: 0.70 } as Record<L.Terr, number>;
const prev = { plains: 0.61, farmland: 0.48, forest: 0.33, hills: 0.46, mountains: 0.53, swamp: 0.48, wasteland: 0.65 } as Record<L.Terr, number>;
console.log('terrain | at 70% (all states) | critique text alpha: worst all states (raw+haze only) | critique preview alpha: worst all states | solved alpha for >= 2.40 all states');
for (const t of T) {
  const w70 = worst(t, 0.7), wc = worst(t, crit[t]), wch = worst(t, crit[t], ['raw', 'haze']), wp = worst(t, prev[t]);
  let lo = 0, hi = 0.7; for (let it = 0; it < 30; it++) { const m = (lo + hi) / 2; if (worst(t, m).w >= 2.4) hi = m; else lo = m; }
  const solved = Math.min(0.7, Math.ceil(hi * 100) / 100);
  console.log(`${t} | ${f2(w70.w)} (${w70.at}) | ${crit[t]}: ${f2(wc.w)} (${wc.at}) (${f2(wch.w)}) | ${prev[t]}: ${f2(wp.w)} (${wp.at}) | ${solved}: ${f2(worst(t, solved).w)} (${worst(t, solved).at})`);
}
