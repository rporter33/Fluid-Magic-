// Every color check of the v4 map design (map-design.md §4), for one albedo palette.
// Run from the repo root: npx tsx report.ts <palette.json> [name]
import { readFileSync } from 'node:fs';
import * as L from './lib.ts';
const { T, dN, dC, ok, f1, f2 } = L;
type Terr = L.Terr;
const [palPath, name = 'v4'] = process.argv.slice(2);
const P: L.Pal = JSON.parse(readFileSync(palPath!, 'utf8'));
const T0 = 0.35, HOVER = 0.25, SELECT = 0.3;
const out: string[] = []; const say = (s = '') => out.push(s);
say(`# ${name}: ${T.map((t) => `${t} ${P[t]}`).join(', ')}`);

// ---- 0. the palette's key and chroma, against the references (refs-analysis §1.1, §2.1)
say('\n## 0. Key and chroma');
for (const t of T) { const o = L.oklch(P[t]); say(`${t.padEnd(10)} ${P[t]} L* ${f1(L.Ls(P[t]))} OKLCH C ${o[1].toFixed(3)} h ${o[2].toFixed(0)} keyline ${L.keylineFor(P[t])} WCAG ${f2(L.wcag(L.keylineFor(P[t]), P[t]))}`); }
const Lr = T.map((t) => L.Ls(P[t])), Cr = T.map((t) => L.oklch(P[t])[1]);
const share: Record<Terr, number> = { mountains: 0.08, hills: 0.14, swamp: 0.08, forest: 0.22, wasteland: 0.1, farmland: 0.14, plains: 0.24 };
const Lw = T.reduce((s, t, i) => s + share[t] * Lr[i]!, 0), Cw = T.reduce((s, t, i) => s + share[t] * Cr[i]!, 0);
say(`L* ${f1(Math.min(...Lr))} to ${f1(Math.max(...Lr))}, area-weighted mean ${f1(Lw)}; OKLCH C max ${Math.max(...Cr).toFixed(3)}, area-weighted mean ${Cw.toFixed(3)}`);

// ---- 1. docs/09 on raw albedos
say('\n## 1. Raw albedos (palette.test.ts, 20 / 12)');
for (const v of L.VISIONS) { const c = L.closestPair(P, v); say(`${v}: ${f1(c.deltaE)} (${c.a} / ${c.b})`); }

// ---- 2. approved untinted states, any two
say('\n## 2. Every pair of different terrains in any two untinted states (raw, haze, out of sight, ash 10%, moss 6%)');
const st = (t: Terr, f: string) => L.BASE_STATES.map((s) => L.baseState(f, s, f));
{ const r = L.pairs(P, st); say(`worst ${f1(r.wN.v)} / ${f1(r.wC.v)}; under 20 / 12: ${r.under} of ${r.tot}  [${r.wC.s}]`); }

// ---- 3. relief: the albedo +- a share of the terrain's relief amplitude, in every untinted state
say('\n## 3. Relief texture floor (albedo +- k x amplitude, every untinted state)');
for (const k of [0.25, 0.4, 0.5, 1]) { const r = L.pairs(P, (t, f) => L.BASE_STATES.flatMap((s) => L.reliefVars(t, f, k).map((x) => L.baseState(x, s, f)))); say(`k ${k}: worst ${f1(r.wN.v)} / ${f1(r.wC.v)}; pairs under 20 / 12 ${r.under} of ${r.tot}  [${r.wN.s}] [${r.wC.s}]`); }

// ---- 4. whole-province owner tints (why the tint is a rim glow): same owner and any owner
say('\n## 4. A whole-province owner tint at t (over), every pair of different terrains, raw');
for (const t of [0.04, 0.08, 0.12, 0.2]) {
  let sN = 1e9, sC = 1e9; for (const b of L.BANNERS) { const r = L.pairs(P, (_t, f) => [L.tint(f, b, t, 'over')]); sN = Math.min(sN, r.wN.v); sC = Math.min(sC, r.wC.v); }
  const r2 = L.pairs(P, (_t, f) => [null, ...L.BANNERS].map((b) => L.tint(f, b, t, 'over')));
  say(`t ${t}: same owner ${f1(sN)} / ${f1(sC)}; any two owners or none ${f1(r2.wN.v)} / ${f1(r2.wC.v)} (${r2.under} of ${r2.tot} under)`);
}

// ---- 5. wild grounds against every albedo in every state, and the relief extremes
say('\n## 5. Wild grounds against every albedo state (20 / 12)');
for (const [nm, g] of [['granite', L.GRANITE], ['mere', L.MERE]] as const) {
  let wN = 1e9, wC = 1e9, s = ''; for (const t of T) for (const x of st(t, P[t])) { const a = dN(g, x), b = dC(g, x); if (a < wN) wN = a; if (b < wC) { wC = b; s = t; } }
  let rN = 1e9, rC = 1e9; for (const t of T) for (const x of L.reliefVars(t, P[t], 1)) { rN = Math.min(rN, dN(g, x)); rC = Math.min(rC, dC(g, x)); }
  say(`${nm} ${g}: states ${f1(wN)} / ${f1(wC)} (${s}); relief extremes ${f1(rN)} / ${f1(rC)}`);
}

// ---- 6. the rail rule
say('\n## 6. Rails: every banner on its own province ground (albedo +- relief, untinted and under its rim glow at 0.35, half');
say('blended with each neighbor terrain), in every untinted state. Passes if the banner differs from the ground, or the keyline');
say('differs from both, at 20 / 12. Two keyline policies: keylineFor(albedo) (docs/09 today) and the better of the two per banner.');
function rail(policy: 'fill' | 'best', banners: string[]) {
  let tot = 0, direct = 0, key = 0, fail = 0; const fails = new Map<string, number>();
  for (const t of T) { const f = P[t];
    for (const b of banners) {
      const grounds: string[] = [];
      for (const o of T) for (const m of o === t ? [0] : [0.5]) for (const g0 of L.reliefVars(t, f, 1)) for (const tt of [0, T0]) for (const s of L.BASE_STATES) {
        const g1 = m ? L.mix(g0, P[o], m) : g0; grounds.push(L.baseState(L.tint(g1, b, tt, 'over'), s, f)); }
      const keys = policy === 'fill' ? [L.keylineFor(f)] : [L.MAP_KEYLINES.light, L.MAP_KEYLINES.dark];
      // 'best': one keyline per (banner, terrain), the one with the fewest failures over all grounds
      let bestK = keys[0]!, bestF = 1e9;
      for (const k of keys) { let fl = 0; for (const g of grounds) if (!ok(b, g) && !(ok(k, g) && ok(k, b))) fl++; if (fl < bestF) { bestF = fl; bestK = k; } }
      for (const g of grounds) { tot++; if (ok(b, g)) direct++; else if (ok(bestK, g) && ok(bestK, b)) key++; else { fail++; const kk = `${b} on ${t}`; fails.set(kk, (fails.get(kk) ?? 0) + 1); } }
    } }
  return { tot, direct, key, fail, fails: [...fails.entries()].map(([k, v]) => `${k} (${v})`).join('; ') };
}
for (const [bn, bs] of [['M1 banners (8)', L.M1_BANNERS], ['all 11 banners', L.BANNERS]] as const) for (const pol of ['fill', 'best'] as const) {
  const r = rail(pol, bs); say(`${bn}, keyline ${pol}: ${r.tot} grounds: direct ${r.direct}, by keyline ${r.key}, fail ${r.fail}${r.fail ? ': ' + r.fails : ''}`);
}

// ---- 7. luminance channel of a thin rail: WCAG of the better of banner and keyline against the ground (non-text 3:1),
// with the keyline railKeyline() picks: the one of the two with fewer 20 / 12 failures over the province's grounds
say('\n## 7. Thin-line contrast: max(WCAG banner/ground, WCAG railKeyline/ground) over the same grounds');
const railGrounds = (t: Terr, b: string) => { const f = P[t]; const gs: string[] = []; for (const o of T) for (const m of o === t ? [0] : [0.5]) for (const g0 of L.reliefVars(t, f, 1)) for (const tt of [0, T0]) for (const sx of L.BASE_STATES) gs.push(L.baseState(L.tint(m ? L.mix(g0, P[o], m) : g0, b, tt, 'over'), sx, f)); return gs; };
// fewest 20 / 12 failures first, then the highest worst-case luminance contrast of the rail (banner or keyline) on its grounds
const railKey = (t: Terr, b: string) => { let best = L.keylineFor(P[t]), bf = 1e9, bw = -1; for (const k of [L.keylineFor(P[t]), L.keylineFor(P[t]) === L.MAP_KEYLINES.light ? L.MAP_KEYLINES.dark : L.MAP_KEYLINES.light]) { let fl = 0, w = 1e9; for (const g of railGrounds(t, b)) { if (!ok(b, g) && !(ok(k, g) && ok(k, b))) fl++; w = Math.min(w, Math.max(L.wcag(b, g), L.wcag(k, g))); } if (fl < bf || (fl === bf && w > bw)) { bf = fl; bw = w; best = k; } } return best; };
{ let worst = 1e9, s = '', under3 = 0, tot = 0; const flips: string[] = [];
  for (const t of T) for (const b of L.BANNERS) { const k = railKey(t, b); if (k !== L.keylineFor(P[t])) flips.push(`${b} on ${t}`);
    for (const g of railGrounds(t, b)) { tot++; const c = Math.max(L.wcag(b, g), L.wcag(k, g)); if (c < 3) under3++; if (c < worst) { worst = c; s = `${b} on ${t} ${g}, keyline ${k}`; } } }
  say(`worst ${f2(worst)} (${s}); grounds under 3:1: ${under3} of ${tot}`);
  say(`railKeyline differs from keylineFor(albedo) for: ${flips.join('; ') || 'none'}`); }

// ---- 7b. two-tone rails: where railKeyline leaves a ground under 3:1, the rail takes both keylines (dark outside, light inside)
{ let worst = 1e9, s = '', pairs = 0; const list: string[] = [];
  for (const t of T) for (const b of L.BANNERS) { const k = railKey(t, b); const gs = railGrounds(t, b);
    const w1 = Math.min(...gs.map((g) => Math.max(L.wcag(b, g), L.wcag(k, g))));
    if (w1 >= 3) continue; pairs++; list.push(`${b} on ${t}`);
    for (const g of gs) { const c = Math.max(L.wcag(b, g), L.wcag(L.MAP_KEYLINES.light, g), L.wcag(L.MAP_KEYLINES.dark, g)); if (c < worst) { worst = c; s = `${b} on ${t} ${g}`; } } }
  say(`two-tone rails needed for ${pairs} (banner, terrain) pairs; with both keylines the worst ground is ${f2(worst)} (${s})`);
  say(`  pairs: ${list.join('; ')}`); }

// ---- 7c. lit-bead rails: every rail carries both keylines (light on the side facing the light, dark on the other)
{ let worst = 1e9, s = '', fail = 0, tot = 0;
  for (const t of T) for (const b of L.BANNERS) for (const g of railGrounds(t, b)) { tot++;
    const pass = ok(b, g) || [L.MAP_KEYLINES.light, L.MAP_KEYLINES.dark].some((k) => ok(k, g) && ok(k, b)); if (!pass) fail++;
    const c = Math.max(L.wcag(b, g), L.wcag(L.MAP_KEYLINES.light, g), L.wcag(L.MAP_KEYLINES.dark, g)); if (c < worst) { worst = c; s = `${b} on ${t} ${g}`; } }
  say(`lit-bead rails (both keylines): band rule ${tot - fail} of ${tot} grounds pass, ${fail} fail; worst luminance contrast ${f2(worst)} (${s})`); }

// ---- 8. neutral hairline between unowned provinces: 1.25 px ink #1C1A17 at 55% or #F4EEDF at 50% (by keylineFor)
say('\n## 8. Neutral hairline (unowned borders), WCAG of the line over the ground against the ground, worst relief extreme');
for (const t of T) { const f = P[t]; const k = L.keylineFor(f); const a = k === L.MAP_KEYLINES.dark ? 0.55 : 0.5; let w = 1e9; for (const g of L.reliefVars(t, f, 1)) w = Math.min(w, L.wcag(L.mix(g, k, a), g)); say(`${t}: ${k} at ${a}: ${f2(w)}`); }

// ---- 9. water inside provinces, snow, and the selection tint
say('\n## 9. Water, snow');
const WATER = process.env.WATER ?? '#2F6B66', SNOW = '#F2EEE6';
say(`water ${WATER} (L* ${f1(L.Ls(WATER))}): vs mere ${f1(dN(WATER, L.MERE))} / ${f1(dC(WATER, L.MERE))}; vs granite ${f1(dN(WATER, L.GRANITE))} / ${f1(dC(WATER, L.GRANITE))}`);
for (const t of T) say(`  water vs ${t}: ${f1(dN(WATER, P[t]))} / ${f1(dC(WATER, P[t]))}`);
{ let w = 1e9, wc = 1e9, s = ''; for (const t of T) for (const x of L.reliefVars(t, P[t], 1)) { if (dN(SNOW, x) < w) { w = dN(SNOW, x); s = t; } wc = Math.min(wc, dC(SNOW, x)); } say(`snow ${SNOW} vs every albedo's lit relief: ${f1(w)} / ${f1(wc)} (${s}): no passable ground reads as snow`); }

// ---- 10. miniature bases: the rim on the dark base, and the base on the ground
say('\n## 10. Miniature bases');
const BASE = '#1E1B18', LIP = '#B8B1A4';
{ let direct = 0, key = 0, fail = 0; const f: string[] = []; for (const b of [...L.BANNERS, '#91A092']) { if (ok(b, BASE)) direct++; else if (ok('#F4EEDF', BASE) && ok('#F4EEDF', b)) key++; else { fail++; f.push(b); } }
  say(`rim (banner) on base ${BASE}: direct ${direct}, by a light #F4EEDF keyline ${key}, fail ${fail} ${f.join(' ')}`); }
for (const t of T) { let w = 1e9; for (const g of L.reliefVars(t, P[t], 1)) w = Math.min(w, Math.max(L.wcag(BASE, g), L.wcag(LIP, g))); say(`  base ${BASE} with lip ${LIP} on ${t}: worst ${f2(w)}`); }

// ---- 11. the model on the table
say('\n## 11. Cliff skirt and plinth against the oak');
const OAK = { lit: '#B08A5E', body: '#8F7459', grain: '#715636' }, SKIRT = { top: '#4A4246', base: '#2A2527' }, PLINTH = '#2B231C';
for (const [k, v] of Object.entries(SKIRT)) say(`skirt ${k} ${v}: vs oak body ${f2(L.wcag(v, OAK.body))}, vs lit oak ${f2(L.wcag(v, OAK.lit))}, ΔE ${f1(dN(v, OAK.body))} / ${f1(dC(v, OAK.body))}`);
say(`plinth ${PLINTH}: vs oak body ${f2(L.wcag(PLINTH, OAK.body))}`);
say(`plaque: ink #1C1A17 on brass #B8914A ${f2(L.wcag('#1C1A17', '#B8914A'))}; lit lip #E9E4D8 at 40% over oak body ${f2(L.wcag(L.mix(OAK.body, '#E9E4D8', 0.4), OAK.body))}`);

// ---- 12. data modes: the frozen approved bases and ramp against the albedos (never on screen together)
say('\n## 12. Albedos against data-mode colors (frozen MODE_BASE and the approved ramp, 21 steps)');
{ const HEAT = ['#4C5E96', '#8170AC', '#C4808E', '#E6AC6E', '#F8E6A6'];
  const heat = (x: number) => { const y = Math.max(0, Math.min(0.9999, x)) * 4, k = Math.floor(y), fr = y - k; return L.mix(HEAT[k]!, HEAT[k + 1]!, fr); };
  const BASES = ['#C1D29F', '#EEBA3A', '#374C2B', '#856824', '#8DA4AD', '#1A727A', '#AE897F'].map((h) => L.desat(h, 0.8));
  const modes = [...BASES, '#79786B', '#7E7767', '#6F7A77', ...Array.from({ length: 21 }, (_, k) => heat(k / 20))];
  let wN = 1e9, wC = 1e9, s = ''; for (const t of T) for (const m of modes) { if (dN(P[t], m) < wN) { wN = dN(P[t], m); s = `${t} vs ${m}`; } wC = Math.min(wC, dC(P[t], m)); }
  say(`closest ${f1(wN)} / ${f1(wC)} (${s})`); }
console.log(out.join('\n'));
