// How wide may the terrain blend band and the owner's rim glow be? For every province of real mapgen maps, the share
// of its area farther than w from every border shared with another province (the core: pure sim terrain, untinted).
// Wild edges and the map outline do not blend (cliffs and shores), so only province-province edges are inset.
// Seeds 1 to 30 x Small, Medium, Large x 2 and 4 nations, wilds on. Run from the repo root: npx tsx coverage.ts
import { generateMap } from '/home/user/Fluid-Magic-/src/mapgen/generate.ts';
import { FOUR_CAPITALS, TWO_CAPITALS } from '/home/user/Fluid-Magic-/tests/mapgen/fixtures.ts';
import type { Point } from '/home/user/Fluid-Magic-/src/mapgen/types.ts';
const area = (p: Point[]) => { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i]!, b = p[(i + 1) % p.length]!; s += a.x * b.y - b.x * a.y; } return Math.abs(s) / 2; };
function clipHalf(poly: Point[], a: Point, n: { x: number; y: number }, w: number): Point[] {
  const out: Point[] = []; const side = (p: Point) => n.x * (p.x - a.x) + n.y * (p.y - a.y) - w;
  for (let i = 0; i < poly.length; i++) { const p = poly[i]!, q = poly[(i + 1) % poly.length]!; const sp = side(p), sq = side(q);
    if (sp >= 0) out.push(p); if ((sp >= 0) !== (sq >= 0)) { const t = sp / (sp - sq); out.push({ x: p.x + t * (q.x - p.x), y: p.y + t * (q.y - p.y) }); } }
  return out;
}
const onSeg = (p: Point, a: Point, b: Point) => { const dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy; const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / L2; const cx = a.x + t * dx - p.x, cy = a.y + t * dy - p.y; return t > -1e-6 && t < 1 + 1e-6 && cx * cx + cy * cy < 1e-6; };
const FRACS = [0.05, 0.06, 0.07, 0.08, 0.1];
const res: Record<string, number[]> = Object.fromEntries(FRACS.map((f) => [f, []]));
const diam: number[] = []; let maps = 0, provs = 0;
for (const size of ['small', 'medium', 'large'] as const) for (const caps of [TWO_CAPITALS, FOUR_CAPITALS]) for (let seed = 1; seed <= 30; seed++) {
  const map = generateMap({ seed, size, capitals: caps, wilds: true }); maps++;
  const ps = Object.values(map.provinces);
  const Ds = ps.map((p) => 2 * Math.sqrt(area(p.polygon) / Math.PI)).sort((a, b) => a - b);
  const Dmed = Ds[Ds.length >> 1]!; diam.push(Dmed);
  for (const p of ps) { provs++;
    const A = area(p.polygon);
    // an edge blends when a neighbor's polygon contains both of its endpoints on its own boundary
    const edges = p.polygon.map((a, i) => [a, p.polygon[(i + 1) % p.polygon.length]!] as const);
    const shared = edges.map(([a, b]) => p.neighbors.some((nid) => { const q = map.provinces[nid]!.polygon; const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      return q.some((c, j) => onSeg(m, c, q[(j + 1) % q.length]!)); }));
    for (const f of FRACS) { let poly = p.polygon.slice(); const w = f * Dmed;
      edges.forEach(([a, b], i) => { if (!shared[i]) return; const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy); poly = clipHalf(poly, a, { x: -dy / l, y: dx / l }, w); });
      res[f]!.push(poly.length >= 3 ? area(poly) / A : 0); }
  }
}
const q = (xs: number[], k: number) => { const s = xs.slice().sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(k * (s.length - 1)))]!; };
console.log(`maps ${maps}, provinces ${provs}; median diameter D per map: min ${q(diam, 0).toFixed(1)} median ${q(diam, 0.5).toFixed(1)} max ${q(diam, 1).toFixed(1)} units`);
console.log('w (x D) | core share: min / p1 / p5 / median | provinces under 0.70 | under 0.60');
for (const f of FRACS) { const xs = res[f]!; console.log(`${f} | ${q(xs, 0).toFixed(3)} / ${q(xs, 0.01).toFixed(3)} / ${q(xs, 0.05).toFixed(3)} / ${q(xs, 0.5).toFixed(3)} | ${xs.filter((x) => x < 0.7).length} | ${xs.filter((x) => x < 0.6).length}`); }
