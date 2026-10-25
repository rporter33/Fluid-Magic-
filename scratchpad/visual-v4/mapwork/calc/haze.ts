// The strongest unexplored haze (gesso #E8DCC2) that keeps every terrain pair 20 / 12 against every other state.
import { readFileSync } from 'node:fs';
import * as L from './lib.ts';
const P: L.Pal = JSON.parse(readFileSync(process.argv[2]!, 'utf8'));
for (const h of [0.04, 0.06, 0.08, 0.1, 0.12]) {
  const st = (t: L.Terr, f: string) => [f, L.mix(f, L.GESSO, h), L.mix(f, L.greyEqL(f), 0.1), L.mix(f, L.ASH, 0.1), L.mix(f, L.MOSS, 0.06)];
  const r = L.pairs(P, st);
  const g = Math.min(...L.T.map((t) => Math.min(L.dN(L.GRANITE, L.mix(P[t], L.GESSO, h)), L.dN(L.MERE, L.mix(P[t], L.GESSO, h)))));
  console.log(`haze ${h}: worst ${L.f1(r.wN.v)} / ${L.f1(r.wC.v)}, under ${r.under} of ${r.tot}; nearest wild ground ${L.f1(g)}`);
}
