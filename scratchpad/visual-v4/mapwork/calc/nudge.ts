// Nudge one albedo (forest) by the smallest CIELAB step that makes every hard check pass without rounding:
// raw 20/12, states 20/12, both wild grounds 20/12 in every state, the relief floor 17/10 at k 0.4, lit-bead rails, snow.
import { readFileSync, writeFileSync } from 'node:fs';
import * as L from './lib.ts';
const P0: L.Pal = JSON.parse(readFileSync(process.argv[2]!, 'utf8')); const T0 = 0.35;
function checks(P: L.Pal) {
  const v = L.VISIONS.map((x) => L.closestPair(P, x).deltaE); if (v[0]! < 20 || Math.min(v[1]!, v[2]!, v[3]!) < 12) return false;
  const s = L.pairs(P, (t, f) => L.BASE_STATES.map((st) => L.baseState(f, st, f))); if (s.under) return false;
  for (const g of [L.GRANITE, L.MERE]) for (const t of L.T) for (const st of L.BASE_STATES) if (!L.ok(g, L.baseState(P[t], st, P[t]))) return false;
  const r = L.pairs(P, (t, f) => L.BASE_STATES.flatMap((st) => L.reliefVars(t, f, 0.4).map((x) => L.baseState(x, st, f)))); if (r.wN.v < 17 || r.wC.v < 10) return false;
  for (const t of L.T) { if (!L.ok('#F2EEE6', L.shadeL(P[t], L.AMP[t]))) return false; if (L.wcag(L.keylineFor(P[t]), P[t]) < 4) return false; }
  for (const t of L.T) for (const b of L.BANNERS) for (const o of L.T) for (const m of o === t ? [0] : [0.5]) for (const g0 of L.reliefVars(t, P[t], 1)) for (const tt of [0, T0]) for (const st of L.BASE_STATES) {
    const g = L.baseState(L.tint(m ? L.mix(g0, P[o], m) : g0, b, tt, 'over'), st, P[t]);
    if (!(L.ok(b, g) || [L.MAP_KEYLINES.light, L.MAP_KEYLINES.dark].some((k) => L.ok(k, g) && L.ok(k, b)))) return false; }
  return true;
}
const t = (process.argv[3] ?? 'forest') as L.Terr; const base = L.rgb2lab(L.hex2rgb(P0[t]));
const cands: { h: string; d: number }[] = [];
for (let dl = -2; dl <= 2; dl += 0.5) for (let da = -2; da <= 2; da += 0.5) for (let db = -2; db <= 2; db += 0.5) {
  const h = L.rgb2hex(L.lab2rgb([base[0]! + dl, base[1]! + da, base[2]! + db])); cands.push({ h, d: Math.hypot(dl, da, db) }); }
cands.sort((a, b) => a.d - b.d);
for (const c of cands) { const P = { ...P0, [t]: c.h }; if (checks(P)) { console.log(`${t} ${P0[t]} -> ${c.h} (CIELAB step ${c.d.toFixed(2)}, ΔE ${L.f2(L.dN(P0[t], c.h))})`); writeFileSync(process.argv[4]!, JSON.stringify(P, null, 1)); process.exit(0); } }
console.log('none');
