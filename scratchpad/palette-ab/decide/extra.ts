// Extra checks for the decision: flecks and stamp faces against the fills, how visible the out-of-sight overlay stays,
// the mockup's per-nation keyline against keylineFor, the cloth, and the ground marks this palette derives.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as E from './ev.ts';
const here = dirname(fileURLToPath(import.meta.url));
const PALS: Record<string, E.Pal> = JSON.parse(readFileSync(join(here, 'palettes.json'), 'utf8'));
const FLECK: Partial<Record<E.Terr, string>> = { plains: '#9A6446', mountains: '#B59A55', wasteland: '#8E5A3E', swamp: '#A99C70' };
const lit = (f: string) => E.mix(E.shadeL(f, 12), '#F6D9A0', 0.12), shade = (f: string) => E.mix(E.shadeL(f, -18), E.RELIEF, 0.14);
const G = { stipple: 8, hedge: -37, farmHedge: -42, scallop: 8, scree: -14, swampLine: 10, swampPool: 10, ripple: 36, crack: -11 };
for (const n of process.argv.slice(2)) {
  const P = PALS[n]!; console.log(`== ${n}`);
  console.log('flecks, ΔE from the fill (normal / deficient): ' + Object.entries(FLECK).map(([t, c]) => `${t} ${E.f1(E.dN(c!, P[t as E.Terr]))}/${E.f1(E.dC(c!, P[t as E.Terr]))}`).join(', '));
  console.log('stamp faces lit / shade, ΔE from the fill: ' + E.T.map((t) => `${t} ${lit(P[t])} ${E.f1(E.dN(lit(P[t]), P[t]))} / ${shade(P[t])} ${E.f1(E.dN(shade(P[t]), P[t]))}`).join(', '));
  console.log('out of sight (equal-L* grey at 10%) moves each fill by ΔE: ' + E.T.map((t) => `${t} ${E.f2(E.dN(P[t], E.stOver(P[t], 'outOfSight', P[t])))}`).join(', '));
  console.log('haze moves each fill by ΔE: ' + E.T.map((t) => `${t} ${E.f2(E.dN(P[t], E.stOver(P[t], 'haze', P[t])))}`).join(', ') + '; ash 10%: ' + E.T.map((t) => `${t} ${E.f2(E.dN(P[t], E.stOver(P[t], 'ash10', P[t])))}`).join(', ') + '; moss 6%: ' + E.T.map((t) => `${t} ${E.f2(E.dN(P[t], E.stOver(P[t], 'moss6', P[t])))}`).join(', '));
  console.log('cloth #E8DCC2 to each fill (normal): ' + E.T.map((t) => `${t} ${E.f1(E.dN(E.CLOTH, P[t]))}`).join(', '));
  console.log('Ember #FD6533 and Thornwood #00674B on each fill, normal/deficient: ' + E.T.map((t) => `${t} ${E.f1(E.dN('#FD6533', P[t]))}/${E.f1(E.dC('#FD6533', P[t]))}, ${E.f1(E.dN('#00674B', P[t]))}/${E.f1(E.dC('#00674B', P[t]))}`).join('; '));
  // the mockup draws the keyline by nation (red: dark #1C1A17, green: light #F4EEDF); the rule uses keylineFor(fill)
  const rows: string[] = [];
  for (const [nat, b, mk] of [['red', '#FD6533', E.MAP_KEYLINES.dark], ['green', '#00674B', E.MAP_KEYLINES.light]] as const) for (const t of E.T) {
    if (E.ok(b, P[t])) continue; const kf = E.keylineFor(P[t]); const okRule = E.ok(kf, P[t]) && E.ok(kf, b), okMock = E.ok(mk, P[t]) && E.ok(mk, b);
    rows.push(`${nat} on ${t}: needs the keyline; keylineFor ${kf === E.MAP_KEYLINES.dark ? 'dark' : 'light'} ${okRule ? 'passes' : 'FAILS'}, mockup's ${nat === 'red' ? 'dark' : 'light'} ${okMock ? 'passes' : 'FAILS'}`);
  }
  console.log('bands, M1 primaries: ' + rows.join('; '));
  const g = (t: E.Terr, dl: number) => E.shadeL(P[t], dl);
  console.log(`ground marks from the fill: plains stipple ${g('plains', 8)}/${g('plains', -8)}, hedge ${g('plains', -37)}; farmland hedge ${g('farmland', -42)}; forest scallops ${g('forest', -8)}/${g('forest', 8)}; mountains scree ${g('mountains', -14)}; swamp streaks and pools ${g('swamp', 10)}, ripples ${g('swamp', 36)}; wasteland cracks ${g('wasteland', -11)}`);
}
