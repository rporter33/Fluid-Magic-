// Second round of review checks (see review-checks.ts). Run from the repo root: npx tsx <this dir>/review-checks2.ts
import * as L from '../mapwork/calc/lib.ts';
const { T, dN, dC, f1, f2, mix, shadeL, wcag } = L;
type Terr = L.Terr;
const P: L.Pal = { plains: '#78894A', farmland: '#D5B16B', forest: '#1A3819', hills: '#6D5303', mountains: '#859BB8', swamp: '#38616D', wasteland: '#877773' };
const A = L.AMP; const LIGHT = '#F4EEDF', DARK = '#1C1A17', SNOW = '#F2EEE6';
const say = (s = '') => console.log(s);
const st = (x: string, t: Terr) => L.BASE_STATES.map((s) => L.baseState(x, s, P[t]));

// A. The design's full rail grounds (albedo and +-A; untinted and under the 0.35 glow; alone or half-blended with each
// other terrain; every state = 210 per terrain and banner), with keylines at a given pixel coverage.
function railGrounds(t: Terr, b: string, kLit = 1) {
  const out: string[] = [];
  for (const x of [P[t], shadeL(P[t], A[t] * kLit), shadeL(P[t], -A[t])]) for (const g0 of [x, mix(x, b, 0.35)])
    for (const nb of [null, ...T.filter((u) => u !== t)]) { const g = nb ? mix(g0, P[nb], 0.5) : g0; for (const s of L.BASE_STATES) out.push(L.baseState(g, s, P[t])); }
  return out;
}
for (const cov of [1, 0.75, 0.5]) for (const kLit of [1, 0.6]) {
  let fail = 0, tot = 0, wc = 1e9, ws = '';
  for (const b of L.BANNERS) for (const t of T) for (const g of railGrounds(t, b, kLit)) {
    tot++; const kd = mix(DARK, g, 1 - cov), kl = mix(LIGHT, b, 1 - cov);
    if (!(L.ok(b, g) || (L.ok(kd, g) && L.ok(kd, b)) || (L.ok(kl, g) && L.ok(kl, b)))) fail++;
    const c = Math.max(wcag(b, g), wcag(kd, g), wcag(kl, g)); if (c < wc) { wc = c; ws = `${b} on ${t} ${g}`; }
  }
  say(`A. lit bead, keyline coverage ${cov}, lit relief +${kLit}A: ${tot} grounds, band rule fails ${fail}; worst contrast ${f2(wc)} (${ws})`);
}

// B. Water across states: water in any state against every albedo in any state, mere, granite, snow.
function waterWorst(w: string) {
  let n = 1e9, c = 1e9, s = '';
  for (const t of T) for (const ws of st(w, t)) for (const u of T) for (const g of st(P[u], u)) { const x = dN(ws, g), y = dC(ws, g); if (y < c) { c = y; s = `${u}`; } n = Math.min(n, x); }
  for (const t of T) for (const ws of st(w, t)) for (const g of [L.MERE, L.GRANITE, SNOW]) { n = Math.min(n, dN(ws, g)); c = Math.min(c, dC(ws, g)); }
  return { n, c, s };
}
{ const r = waterWorst('#50AF9B'); say(`B. water #50AF9B across states: ${f1(r.n)} / ${f1(r.c)} (worst deficiency against ${r.s})`); }
// small search near the design's water, in CIELAB, for a color that passes across states
{
  const base = L.rgb2lab(L.hex2rgb('#50AF9B')); let best: { h: string; d: number; n: number; c: number } | null = null;
  for (let dl = -6; dl <= 6; dl += 1) for (let da = -12; da <= 12; da += 2) for (let db = -12; db <= 12; db += 2) {
    const h = L.rgb2hex(L.lab2rgb([base[0]! + dl, base[1]! + da, base[2]! + db])); const r = waterWorst(h);
    if (r.n >= 20.15 && r.c >= 12.15) { const d = dN(h, '#50AF9B'); if (!best || d < best.d) best = { h, d, n: r.n, c: r.c }; }
  }
  say(`B. nearest water passing 20/12 across states (+0.15 margin): ${best ? `${best.h} (dE ${f1(best.d)} from #50AF9B): ${f1(best.n)} / ${f1(best.c)}, L* ${f1(L.Ls(best.h))}` : 'none in the window'}`);
}

// C. Cliff top against the land's darkest relief and its lightest albedo; candidate tops.
for (const top of ['#4A4246', '#6A6064', '#736A6D']) {
  let w = 1e9, ws = ''; for (const t of T) for (const x of [P[t], shadeL(P[t], -A[t]), shadeL(P[t], A[t] * 0.6)]) { const c = wcag(top, x); if (c < w) { w = c; ws = `${t} ${x}`; } }
  say(`C. cliff top ${top} (L* ${f1(L.Ls(top))}): worst against the land's relief ${f2(w)}:1 (${ws}); vs oak body ${f2(wcag(top, '#8F7459'))}:1; vs tray floor #16130F ${f2(wcag(top, '#16130F'))}:1`);
}
// worn edge: #E9E4D8 at 30% over the land's edge pixel, against the cliff top
for (const top of ['#4A4246', '#6A6064']) { let w = 1e9, ws = ''; for (const t of T) for (const x of [shadeL(P[t], -A[t]), P[t]]) { const e = mix(x, '#E9E4D8', 0.3); const c = wcag(e, top); if (c < w) { w = c; ws = `${t}`; } } say(`C. 1 px worn edge (#E9E4D8 at 30% over the land) vs cliff top ${top}: worst ${f2(w)}:1 (${ws})`); }

// D. Hover tint on an independent province (#E9E4D8 at 0.20) and selection (0.30): the tinted province against its own
// untinted neighbors of the same terrain (the hover must show), min over terrains, as WCAG and dE.
for (const t of T) { const h = mix(P[t], '#E9E4D8', 0.2); say(`D. independents' hover on ${t}: dE ${f1(dN(h, P[t]))}, WCAG ${f2(wcag(h, P[t]))}`); }
