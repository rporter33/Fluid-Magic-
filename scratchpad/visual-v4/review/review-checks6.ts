// Sixth round: the relief floor and wild grounds with the lit cap (lit faces +0.6 A, shade faces -A), every state.
import * as L from '../mapwork/calc/lib.ts';
const { T, dN, dC, f1, shadeL } = L;
const P: L.Pal = { plains: '#78894A', farmland: '#D5B16B', forest: '#1A3819', hills: '#6D5303', mountains: '#859BB8', swamp: '#38616D', wasteland: '#877773' };
const A = L.AMP; const LIT = 0.6;
for (const k of [0.25, 0.4, 0.5, 1]) {
  const r = L.pairs(P, (t, f) => L.BASE_STATES.flatMap((st) => [f, shadeL(f, k * LIT * A[t]), shadeL(f, -k * A[t])].map((x) => L.baseState(x, st, f))));
  console.log(`floor at ${k} of the swing (lit cap ${LIT}): ${f1(r.wN.v)} / ${f1(r.wC.v)}; pairs under 20/12 ${r.under} of ${r.tot}  [${r.wN.s}] [${r.wC.s}]`);
}
for (const [nm, g] of [['granite', L.GRANITE], ['mere', L.MERE]] as const) {
  let n = 1e9, c = 1e9;
  for (const t of T) for (const x of [P[t], shadeL(P[t], LIT * A[t]), shadeL(P[t], -A[t])]) for (const st of L.BASE_STATES) { const y = L.baseState(x, st, P[t]); n = Math.min(n, dN(y, g)); c = Math.min(c, dC(y, g)); }
  console.log(`${nm} vs every albedo's relief extremes in every state: ${f1(n)} / ${f1(c)}`);
}
