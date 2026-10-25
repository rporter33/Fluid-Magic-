// The rail rule at the DPR-1 worst offsets (keyline coverage 0.75, banner 1 or 0.75) for glow peaks 0.35, 0.33, 0.30.
import * as L from '../mapwork/calc/lib.ts';
const { T, mix, shadeL, wcag, f2 } = L;
type Terr = L.Terr;
const P: L.Pal = { plains: '#78894A', farmland: '#D5B16B', forest: '#1A3819', hills: '#6D5303', mountains: '#859BB8', swamp: '#38616D', wasteland: '#877773' };
const A = L.AMP; const LIGHT = '#F4EEDF', DARK = '#1C1A17';
for (const G of [0.35, 0.33, 0.3]) {
  let fail = 0, tot = 0, wc = 1e9;
  for (const b of L.BANNERS) for (const t of T) for (const x of [P[t], shadeL(P[t], 0.6 * A[t]), shadeL(P[t], -A[t])]) for (const g0 of [x, mix(x, b, G)])
    for (const nb of [null, ...T.filter((u) => u !== t)]) for (const s of L.BASE_STATES) for (const [kc, bc] of [[1, 1], [0.75, 1], [0.75, 0.75]] as const) {
      let g = nb ? mix(g0, P[nb as Terr], 0.5) : g0; g = L.baseState(g, s, P[t]); tot++;
      const bb = mix(b, g, 1 - bc), kd = mix(DARK, g, 1 - kc), kl = mix(LIGHT, bb, 1 - kc);
      if (!(L.ok(bb, g) || (L.ok(kd, g) && L.ok(kd, bb)) || (L.ok(kl, g) && L.ok(kl, bb)))) fail++;
      wc = Math.min(wc, Math.max(wcag(bb, g), wcag(kd, g), wcag(kl, g)));
    }
  console.log(`glow peak ${G}: ${tot} cases (11 banners x 7 terrains x 210 grounds x 3 coverages), fails ${fail}; worst contrast ${f2(wc)}`);
}
