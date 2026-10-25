// Fourth round: hairline strength, the independents' hover, the cliff lip. Run from the repo root.
import * as L from '../mapwork/calc/lib.ts';
const { T, dN, f1, f2, mix, shadeL, wcag } = L;
const P: L.Pal = { plains: '#78894A', farmland: '#D5B16B', forest: '#1A3819', hills: '#6D5303', mountains: '#859BB8', swamp: '#38616D', wasteland: '#877773' };
const A = L.AMP; const LIGHT = '#F4EEDF', DARK = '#1C1A17';
const say = (s = '') => console.log(s);
// hairline: keylineFor(albedo) at alpha a over the ground, against the ground; worst over relief extremes (lit cap 0.6A) and states
for (const a of [0.55, 0.7, 0.8]) {
  const row: string[] = [];
  for (const t of T) { const k = L.keylineFor(P[t]); let w = 1e9; for (const x of [P[t], shadeL(P[t], 0.6 * A[t]), shadeL(P[t], -A[t])]) for (const s of L.BASE_STATES) { const g = L.baseState(x, s, P[t]); w = Math.min(w, wcag(mix(g, k, a), g)); } row.push(`${t} ${f2(w)}`); }
  say(`hairline at ${a}: ${row.join(', ')}`);
}
// independents' hover: keylineFor's opposite pull. Dark grounds lighten toward #F4EEDF, light grounds darken toward #1C1A17.
for (const a of [0.15, 0.2]) { const row: string[] = []; for (const t of T) { const k = L.keylineFor(P[t]); const h = mix(P[t], k, a); row.push(`${t} dE ${f1(dN(h, P[t]))}`); } say(`independents' hover toward keylineFor at ${a}: ${row.join(', ')}`); }
// owned hover at 0.25 toward the banner: smallest change over banners and terrains
{ let w = 1e9, ws = ''; for (const b of L.BANNERS) for (const t of T) { const d = dN(mix(P[t], b, 0.25), P[t]); if (d < w) { w = d; ws = `${b} on ${t}`; } } say(`owned hover 0.25: smallest change dE ${f1(w)} (${ws})`); }
// cliff: separation of the land's edge from the cliff top = max(land vs top, lip vs top), lip = #E9E4D8 at a over the land
for (const top of ['#4A4246', '#3A3436']) for (const a of [0.4, 0.5]) {
  let w = 1e9, ws = ''; for (const t of T) for (const x of [shadeL(P[t], -A[t]), P[t], shadeL(P[t], 0.6 * A[t])]) { const c = Math.max(wcag(x, top), wcag(mix(x, '#E9E4D8', a), top)); if (c < w) { w = c; ws = `${t} ${x}`; } }
  say(`cliff top ${top}, lip #E9E4D8 at ${a}: worst separation ${f2(w)}:1 (${ws})`);
}
