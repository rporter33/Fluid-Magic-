// Judge 2: shared-edge lengths of neighbor pairs (tracks are promised on every pair).
// Run: cd /home/user/Fluid-Magic- && npx tsx <this file>
import { generateMap } from '/home/user/Fluid-Magic-/src/mapgen/generate.ts';
import type { CapitalSpec, Point } from '/home/user/Fluid-Magic-/src/mapgen/types.ts';

const caps = (n: number): CapitalSpec[] => [
  { color: 'R', terrain: 'plains', name: 'Kharnath' },
  { color: 'G', terrain: 'forest', name: 'Deepmoss' },
  { color: 'U', terrain: 'swamp', name: 'Tidecourt' },
  { color: 'W', terrain: 'hills', name: 'Lumen' },
].slice(0, n) as CapitalSpec[];
const SQ = Math.sqrt(6400), MED = 2 * Math.sqrt(6400 / Math.PI); // units; median diameter about 90
const key = (p: Point) => `${p.x.toFixed(6)},${p.y.toFixed(6)}`;
function shared(a: Point[], b: Point[]): number {
  const kb = new Set(b.map(key));
  let len = 0;
  for (let i = 0; i < a.length; i++) {
    const p = a[i]!, q = a[(i + 1) % a.length]!;
    if (kb.has(key(p)) && kb.has(key(q))) len += Math.hypot(q.x - p.x, q.y - p.y);
  }
  return len;
}
const TH = [0.02, 0.05, 0.1, 0.15]; // fractions of sqrt(area)
let pairs = 0, unmatched = 0; const cnt = TH.map(() => 0); const provHit = TH.map(() => 0); let provs = 0;
let minL = 1e9;
for (const size of ['small', 'medium', 'large'] as const) for (const n of [2, 4]) for (let seed = 1; seed <= 30; seed++) {
  let m; try { m = generateMap({ seed, size, capitals: caps(n) }); } catch { continue; }
  const P = Object.values(m.provinces);
  for (const p of P) {
    provs++; const hit = TH.map(() => false);
    for (const nid of p.neighbors) {
      const q = m.provinces[nid]!; const L = shared(p.polygon, q.polygon);
      if (L === 0) unmatched++;
      if (p.id < q.id) { pairs++; minL = Math.min(minL, L); TH.forEach((t, k) => { if (L < t * SQ) cnt[k]!++; }); }
      TH.forEach((t, k) => { if (L < t * SQ) hit[k] = true; });
    }
    hit.forEach((h, k) => { if (h) provHit[k]!++; });
  }
}
console.log(`neighbor pairs: ${pairs}; provinces: ${provs}; pairs with no exactly-shared vertices: ${unmatched / 2}`);
console.log(`shortest shared edge: ${minL.toFixed(2)} units (${(minL / SQ).toFixed(4)} of sqrt(area))`);
for (let k = 0; k < TH.length; k++) {
  const u = TH[k]! * SQ;
  console.log(`shared edge < ${TH[k]} sqrt(A) = ${u.toFixed(1)} units (${(u * 70 / MED).toFixed(1)} px at the Mid bottom, ${(u * 180 / MED).toFixed(1)} px at the Mid top): ` +
    `${cnt[k]} pairs (${(100 * cnt[k]! / pairs).toFixed(1)}%), ${(100 * provHit[k]! / provs).toFixed(1)}% of provinces have one`);
}
