import { readFileSync } from 'node:fs';
import * as L from './lib.ts';
const P: L.Pal = JSON.parse(readFileSync(process.argv[2]!, 'utf8'));
const r = L.pairs(P, (t, f) => L.BASE_STATES.flatMap((s) => L.reliefVars(t, f, 0.4).map((x) => L.baseState(x, s, f))));
console.log('floor k0.4 all states', r.wN.v.toFixed(3), r.wC.v.toFixed(3));
const s2 = L.pairs(P, (t, f) => L.BASE_STATES.map((s) => L.baseState(f, s, f)));
console.log('states', s2.wN.v.toFixed(3), s2.wC.v.toFixed(3));
let g = 1e9, gc = 1e9; for (const t of L.T) for (const s of L.BASE_STATES) { const x = L.baseState(P[t], s, P[t]); g = Math.min(g, L.dN(L.GRANITE, x)); gc = Math.min(gc, L.dC(L.GRANITE, x)); }
console.log('granite', g.toFixed(3), gc.toFixed(3));
for (const v of L.VISIONS) console.log(v, L.closestPair(P, v).deltaE.toFixed(3));
let sn = 1e9, snc = 1e9; for (const t of L.T) { const x = L.shadeL(P[t], L.AMP[t]); sn = Math.min(sn, L.dN('#F2EEE6', x)); snc = Math.min(snc, L.dC('#F2EEE6', x)); } console.log('snow', sn.toFixed(3), snc.toFixed(3));
