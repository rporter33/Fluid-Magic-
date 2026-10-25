// Third round: which banners fail the rail rule when keylines are antialiased, and a cliff top that separates.
// Run from the repo root: npx tsx <this dir>/review-checks3.ts
import * as L from '../mapwork/calc/lib.ts';
const { T, dN, dC, f1, f2, mix, shadeL, wcag } = L;
type Terr = L.Terr;
const P: L.Pal = { plains: '#78894A', farmland: '#D5B16B', forest: '#1A3819', hills: '#6D5303', mountains: '#859BB8', swamp: '#38616D', wasteland: '#877773' };
const A = L.AMP; const LIGHT = '#F4EEDF', DARK = '#1C1A17';
const say = (s = '') => console.log(s);
function railGrounds(t: Terr, b: string) {
  const out: string[] = [];
  for (const x of [P[t], shadeL(P[t], A[t]), shadeL(P[t], -A[t])]) for (const g0 of [x, mix(x, b, 0.35)])
    for (const nb of [null, ...T.filter((u) => u !== t)]) { const g = nb ? mix(g0, P[nb], 0.5) : g0; for (const s of L.BASE_STATES) out.push(L.baseState(g, s, P[t])); }
  return out;
}
for (const [kc, bc] of [[0.5, 1], [0.5, 0.75], [0.75, 1], [0.75, 0.75]] as const) {
  const per: Record<string, number> = {}; let worst: Record<string, number> = {};
  for (const b of L.BANNERS) for (const t of T) for (const g of railGrounds(t, b)) {
    const bb = mix(b, g, 1 - bc), kd = mix(DARK, g, 1 - kc), kl = mix(LIGHT, bb, 1 - kc);
    if (!(L.ok(bb, g) || (L.ok(kd, g) && L.ok(kd, bb)) || (L.ok(kl, g) && L.ok(kl, bb)))) per[b] = (per[b] ?? 0) + 1;
    const c = Math.max(wcag(bb, g), wcag(kd, g), wcag(kl, g)); worst[b] = Math.min(worst[b] ?? 1e9, c);
  }
  say(`keyline coverage ${kc}, banner coverage ${bc}: fails by banner ${JSON.stringify(per)}`);
  say(`   worst contrast by banner ${Object.entries(worst).map(([b, c]) => `${b} ${f2(c)}`).join(', ')}`);
}
// cliff: the face is drawn below the land's edge; what separates the land from it is a worn lip line.
for (const lip of ['#E9E4D8', '#F4EEDF']) for (const a of [0.5, 0.7]) for (const top of ['#4A4246', '#2E2A2C']) {
  let w = 1e9, ws = ''; for (const t of T) for (const x of [shadeL(P[t], -A[t]), P[t], shadeL(P[t], A[t] * 0.6)]) { const e = mix(x, lip, a); const c = Math.min(wcag(e, top), wcag(e, x)); if (c < w) { w = c; ws = `${t} ${x}`; } }
  say(`lip ${lip} at ${a} over the land's edge, cliff top ${top}: worst of (lip vs cliff top, lip vs land) ${f2(w)}:1 (${ws})`);
}
