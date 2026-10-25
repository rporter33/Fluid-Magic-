// Review checks for map-design-final.md. Uses the design's lib.ts, which imports the repo's colorMath.ts and colors.ts
// (copied verbatim; diff-checked against the repo's working tree on 2026-10-22). Run from the repo root:
//   npx tsx <this dir>/review-checks.ts
import * as L from '../mapwork/calc/lib.ts';
const { T, dN, dC, f1, f2, mix, shadeL, wcag } = L;
type Terr = L.Terr;
const P: L.Pal = { plains: '#78894A', farmland: '#D5B16B', forest: '#1A3819', hills: '#6D5303', mountains: '#859BB8', swamp: '#38616D', wasteland: '#877773' };
const A = L.AMP; const LIGHT = '#F4EEDF', DARK = '#1C1A17', SNOW = '#F2EEE6', WATER = '#50AF9B';
const say = (s = '') => console.log(s);
const states = (t: Terr, x: string) => L.BASE_STATES.map((st) => L.baseState(x, st, P[t]));

// 1. Asymmetric relief: lit faces at most +kLit*A, shade faces -A. Snow against every albedo's lit relief, every state.
for (const kLit of [1, 0.6]) {
  let w = { n: 1e9, c: 1e9, s: '' };
  for (const t of T) for (const g of states(t, shadeL(P[t], A[t] * kLit))) { const n = dN(g, SNOW), c = dC(g, SNOW); if (n < w.n) w = { n, c: Math.min(w.c, c), s: `${t} ${g}` }; w.c = Math.min(w.c, c); }
  say(`1. snow vs lit relief at +${kLit}A: ${f1(w.n)} / ${f1(w.c)} (${w.s}); mountains lit L* ${f1(L.Ls(shadeL(P.mountains, A.mountains * kLit)))}`);
}
// Relief floor with asymmetric relief (+0.6A lit cap), at +-0.4 of the swing: lit side 0.4*0.6A, shade side 0.4A
{
  const r = L.pairs(P, (t, f) => L.BASE_STATES.flatMap((st) => [f, shadeL(f, 0.4 * 0.6 * A[t]), shadeL(f, -0.4 * A[t])].map((x) => L.baseState(x, st, f))));
  say(`1b. relief floor, lit cap 0.6A, at 0.4 of the swing: ${f1(r.wN.v)} / ${f1(r.wC.v)}; under 20/12 ${r.under} of ${r.tot}`);
}

// 2. Rails with antialiased keylines: on an oblique edge a 1 px keyline covers about half of each of two pixels, so its
// visible color is the keyline mixed 50% with what lies beside it (ground on the outer side, banner on the inner).
{
  let fail = 0, tot = 0, worstC = 1e9, ws = '';
  const grounds = (t: Terr, b: string) => { const f = P[t]; const out: string[] = []; for (const x of [f, shadeL(f, A[t]), shadeL(f, -A[t])]) for (const g of [x, mix(x, b, 0.35)]) for (const st of L.BASE_STATES) out.push(L.baseState(g, st, f)); return out; };
  for (const b of L.BANNERS) for (const t of T) for (const g of grounds(t, b)) {
    tot++;
    const kd = mix(DARK, g, 0.5), kl = mix(LIGHT, b, 0.5);
    const direct = L.ok(b, g);
    const viaD = L.ok(kd, g) && L.ok(kd, b), viaL = L.ok(kl, g) && L.ok(kl, b);
    if (!(direct || viaD || viaL)) fail++;
    const c = Math.max(wcag(b, g), wcag(kd, g), wcag(kl, g)); if (c < worstC) { worstC = c; ws = `${b} on ${t} ${g}`; }
  }
  say(`2. lit bead with keylines at 50% coverage: band rule fails ${fail} of ${tot}; worst thin-line contrast ${f2(worstC)} (${ws})`);
  // the same with 1.5 px keylines at 75% coverage
  fail = 0; worstC = 1e9;
  for (const b of L.BANNERS) for (const t of T) for (const g of grounds(t, b)) {
    const kd = mix(DARK, g, 0.25), kl = mix(LIGHT, b, 0.25);
    if (!(L.ok(b, g) || (L.ok(kd, g) && L.ok(kd, b)) || (L.ok(kl, g) && L.ok(kl, b)))) fail++;
    const c = Math.max(wcag(b, g), wcag(kd, g), wcag(kl, g)); if (c < worstC) { worstC = c; ws = `${b} on ${t} ${g}`; }
  }
  say(`2b. keylines at 75% coverage: band rule fails ${fail}; worst thin-line contrast ${f2(worstC)} (${ws})`);
  // keylines at full coverage (device-pixel snapped, or DPR >= 2 with 1 CSS px = 2 device px)
  fail = 0; worstC = 1e9;
  for (const b of L.BANNERS) for (const t of T) for (const g of grounds(t, b)) {
    if (!(L.ok(b, g) || (L.ok(DARK, g) && L.ok(DARK, b)) || (L.ok(LIGHT, g) && L.ok(LIGHT, b)))) fail++;
    const c = Math.max(wcag(b, g), wcag(DARK, g), wcag(LIGHT, g)); if (c < worstC) { worstC = c; ws = `${b} on ${t} ${g}`; }
  }
  say(`2c. keylines solid (no blend; these grounds omit the half-blend with neighbors): band rule fails ${fail}; worst contrast ${f2(worstC)} (${ws})`);
}

// 3. Internal border inside a realm: 1 px banner + 1 px keyline chosen by keylineFor(albedo) on the lower-right side.
// It separates provinces; the realm edge carries ownership. WCAG of the keyline against the ground's relief extremes.
for (const t of T) {
  const k = L.keylineFor(P[t]); let w = 1e9;
  for (const x of [P[t], shadeL(P[t], A[t]), shadeL(P[t], -A[t])]) for (const st of L.BASE_STATES) w = Math.min(w, wcag(k, L.baseState(x, st, P[t])));
  say(`3. internal border keyline ${k} on ${t}: worst ${f2(w)}:1`);
}

// 4. The sand-table tray: the model's cliff and lit lip against the tray floor; the frame against the oak.
{
  const FLOOR = '#16130F', TOP = '#4A4246', FOOT = '#2A2527', LIP = mix('#2A2527', '#E9E4D8', 0.4), BODY = '#8F7459', OAK0 = '#2B231C', LIT = '#B08A5E';
  say(`4. tray floor ${FLOOR}: cliff top ${f2(wcag(TOP, FLOOR))}:1, cliff foot ${f2(wcag(FOOT, FLOOR))}:1 (merges, as intended)`);
  for (const t of T) { const lo = shadeL(P[t], -A[t]); say(`   ${t}: darkest relief ${lo} vs floor ${f2(wcag(lo, FLOOR))}:1, vs cliff top ${f2(wcag(lo, TOP))}:1; lit lip #E9E4D8 at 40% over the albedo vs floor ${f2(wcag(mix(P[t], '#E9E4D8', 0.4), FLOOR))}:1`); }
  say(`   frame: oak lit ${LIT} on the floor ${f2(wcag(LIT, FLOOR))}:1; inner frame edge --oak-0 ${OAK0} vs table body ${f2(wcag(OAK0, BODY))}:1; LIP sample ${LIP}`);
}

// 5. Passable mountains against the impassable massif's own colors (lit rock, granite, snow), every state.
{
  for (const c of ['#8A857E', '#2A292C', SNOW]) { let n = 1e9, d = 1e9; for (const x of [P.mountains, shadeL(P.mountains, A.mountains * 0.6), shadeL(P.mountains, -A.mountains)]) for (const g of states('mountains', x)) { n = Math.min(n, dN(g, c)); d = Math.min(d, dC(g, c)); } say(`5. passable mountains (relief, states) vs massif ${c}: ${f1(n)} / ${f1(d)}`); }
}

// 6. Forest canopy at its darkest against the mere and granite: is the wild still the darkest ground?
{
  const lo = shadeL(P.forest, -A.forest); say(`6. forest at -A ${lo} L* ${f1(L.Ls(lo))}; granite L* ${f1(L.Ls(L.GRANITE))}; mere L* ${f1(L.Ls(L.MERE))}; forest -A vs mere ${f1(dN(lo, L.MERE))} / ${f1(dC(lo, L.MERE))}; vs granite ${f1(dN(lo, L.GRANITE))} / ${f1(dC(lo, L.GRANITE))}`);
}

// 7. Water: the design's #50AF9B (the shipped report.ts defaults to #2F6B66, an earlier candidate).
{ let n = 1e9, c = 1e9, s = ''; for (const t of T) for (const g of states(t, P[t])) { if (dN(WATER, g) < n) { n = dN(WATER, g); s = t; } c = Math.min(c, dC(WATER, g)); } say(`7. water ${WATER} vs every albedo in every state: ${f1(n)} / ${f1(c)} (closest normal: ${s}); vs mere ${f1(dN(WATER, L.MERE))} / ${f1(dC(WATER, L.MERE))}; vs granite ${f1(dN(WATER, L.GRANITE))} / ${f1(dC(WATER, L.GRANITE))}`); }

// 8. Province means: if each province's mean may sit up to b from its albedo (the stated 2.0 budget), how close can two
// provinces of different terrains come? Worst case moves both toward each other along L*.
for (const b of [2.0, 0.5]) {
  let n = 1e9, c = 1e9; for (let i = 0; i < T.length; i++) for (let j = i + 1; j < T.length; j++) { const a = P[T[i]!], q = P[T[j]!];
    for (const sa of [-1, 1]) for (const sb of [-1, 1]) { const x = shadeL(a, sa * b), y = shadeL(q, sb * b); n = Math.min(n, dN(x, y)); c = Math.min(c, dC(x, y)); } }
  say(`8. province means within ${b} L* of the albedo: worst pair ${f1(n)} / ${f1(c)}`);
}
