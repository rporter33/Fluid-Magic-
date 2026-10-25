// Fifth round: the tray option's floor with the corrected cliff top and lip; the cliff on the open oak.
import * as L from '../mapwork/calc/lib.ts';
const { T, f2, mix, shadeL, wcag } = L;
const P: L.Pal = { plains: '#78894A', farmland: '#D5B16B', forest: '#1A3819', hills: '#6D5303', mountains: '#859BB8', swamp: '#38616D', wasteland: '#877773' };
const A = L.AMP; const FLOOR = '#1E1915', TOP = '#3A3436', FOOT = '#221E20', BODY = '#8F7459', LIT = '#B08A5E';
let w = 1e9, ws = '';
for (const t of T) for (const x of [shadeL(P[t], -A[t]), P[t]]) { const c = Math.max(wcag(x, FLOOR), wcag(mix(x, '#E9E4D8', 0.5), FLOOR)); if (c < w) { w = c; ws = t; } }
console.log(`tray floor ${FLOOR}: land edge with the 50% lip, worst ${f2(w)}:1 (${ws}); land alone, forest -A ${f2(wcag(shadeL(P.forest, -A.forest), FLOOR))}:1`);
console.log(`cliff top ${TOP} vs floor ${f2(wcag(TOP, FLOOR))}:1; foot ${FOOT} vs floor ${f2(wcag(FOOT, FLOOR))}:1; top vs oak body ${f2(wcag(TOP, BODY))}:1, vs lit oak ${f2(wcag(TOP, LIT))}:1; foot vs oak body ${f2(wcag(FOOT, BODY))}:1`);
console.log(`dE cliff top vs oak body ${L.dN(TOP, BODY).toFixed(1)} / ${L.dC(TOP, BODY).toFixed(1)}`);
