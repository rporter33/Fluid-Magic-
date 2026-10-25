import * as L from './lib.ts';
const m = '#859BB8', s = '#4A666E';
for (const a of L.reliefVars('mountains', m, 0.4)) for (const b of L.reliefVars('swamp', s, 0.4)) console.log(a, b, L.f1(L.dN(a, b)), L.f1(L.dC(a, b)));
console.log(L.shadeL(m, -6.4), L.Ls(L.shadeL(m, -6.4)));
