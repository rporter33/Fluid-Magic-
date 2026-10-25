// Which ground fails the rail rule at keyline coverage 0.75 and a solid banner (DPR 1, 1.5 px keylines at the worst offset)?
import * as L from '../mapwork/calc/lib.ts';
const { T, mix, shadeL, f1 } = L;
type Terr = L.Terr;
const P: L.Pal = { plains: '#78894A', farmland: '#D5B16B', forest: '#1A3819', hills: '#6D5303', mountains: '#859BB8', swamp: '#38616D', wasteland: '#877773' };
const A = L.AMP; const LIGHT = '#F4EEDF', DARK = '#1C1A17';
for (const kLit of [1, 0.6]) for (const t of T) for (const x of [['albedo', P[t]], ['+A', shadeL(P[t], A[t] * kLit)], ['-A', shadeL(P[t], -A[t])]] as const) for (const glow of [0, 0.35])
  for (const nb of [null, ...T.filter((u) => u !== t)]) for (const s of L.BASE_STATES) {
    const b = '#00674B'; let g = glow ? mix(x[1], b, glow) : x[1]; if (nb) g = mix(g, P[nb as Terr], 0.5); g = L.baseState(g, s, P[t]);
    const kd = mix(DARK, g, 0.25), kl = mix(LIGHT, b, 0.25);
    if (!(L.ok(b, g) || (L.ok(kd, g) && L.ok(kd, b)) || (L.ok(kl, g) && L.ok(kl, b))))
      console.log(`lit ${kLit}: Thornwood on ${t} ${x[0]} glow ${glow} neighbor ${nb} state ${s}: ground ${g}; banner ${f1(L.dN(b, g))}/${f1(L.dC(b, g))}, dark keyline ${f1(L.dN(kd, g))}/${f1(L.dC(kd, g))} vs banner ${f1(L.dN(kd, b))}/${f1(L.dC(kd, b))}, light ${f1(L.dN(kl, g))}/${f1(L.dC(kl, g))} vs banner ${f1(L.dN(kl, b))}/${f1(L.dC(kl, b))}`);
  }
