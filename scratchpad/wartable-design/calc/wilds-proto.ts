// Prototype of "wilds" (impassable regions that are not provinces) on top of the real Phase 1
// geometry. Read-only use of the repo's mapgen modules. Measures placement success and what the
// wilds do to the invariants: connectivity, min neighbors, articulation points, capital distance,
// the capital-ring balance, and how noticeable they are.
import { MAPGEN } from '/home/user/Fluid-Magic-/src/content/mapgen.ts';
import { roundedRect } from '/home/user/Fluid-Magic-/src/mapgen/geometry.ts';
import { bfsDistances, isConnected } from '/home/user/Fluid-Magic-/src/mapgen/graph.ts';
import { createSimplex2D, fractal } from '/home/user/Fluid-Magic-/src/mapgen/noise.ts';
import { mapDimensions, provinceCount } from '/home/user/Fluid-Magic-/src/mapgen/size.ts';
import { assignTerrain } from '/home/user/Fluid-Magic-/src/mapgen/terrain.ts';
import { startPopulation } from '/home/user/Fluid-Magic-/src/mapgen/placement.ts';
import { adjacency, adjustCount, lloydRelax, poissonDisc, voronoiCells } from '/home/user/Fluid-Magic-/src/mapgen/voronoi.ts';
import { createRng, shuffle, weightedIndex, randBelow, type RngState } from '/home/user/Fluid-Magic-/src/sim/rng.ts';

type Kind = 'peaks' | 'deadLake' | 'chasm';
const RANGE_CELL_WEIGHTS = [25, 50, 25]; // 1, 2, 3 cells
const rangesFor = (count: number) => Math.round(count / 20);
const SEPARATION = 3; // hops in the full cell graph between two ranges

function articulation(adj: number[][], alive: boolean[]): number {
  // count cut vertices among alive nodes (iterative Tarjan)
  const n = adj.length; const disc = new Array(n).fill(-1), low = new Array(n).fill(0); let time = 0, cuts = 0;
  const isCut = new Array(n).fill(false);
  const start = alive.findIndex(Boolean); if (start < 0) return 0;
  const stack: [number, number, number][] = [[start, -1, 0]]; disc[start] = low[start] = time++; let rootKids = 0;
  while (stack.length) {
    const top = stack[stack.length - 1]!; const [v, parent] = top; const nb = adj[v]!;
    if (top[2] < nb.length) {
      const w = nb[top[2]++]!; if (!alive[w] || w === parent) continue;
      if (disc[w] === -1) { disc[w] = low[w] = time++; stack.push([w, v, 0]); if (v === start) rootKids++; }
      else low[v] = Math.min(low[v], disc[w]);
    } else {
      stack.pop(); if (parent >= 0) { low[parent] = Math.min(low[parent], low[v]); if (parent !== start && low[v] >= disc[parent]) isCut[parent] = true; }
    }
  }
  if (rootKids > 1) isCut[start] = true;
  for (let i = 0; i < n; i++) if (isCut[i] && alive[i]) cuts++;
  return cuts;
}

function sub(adj: number[][], alive: boolean[]): number[][] { return adj.map((l, i) => (alive[i] ? l.filter((j) => alive[j]) : [])); }
function okRemoval(adj: number[][], alive: boolean[]): boolean {
  const s = sub(adj, alive);
  const idx = alive.map((a, i) => (a ? i : -1)).filter((i) => i >= 0);
  if (idx.some((i) => s[i]!.length < MAPGEN.minNeighbors)) return false;
  // connected among alive
  const d = bfsDistances(s, [idx[0]!]);
  if (idx.some((i) => !Number.isFinite(d[i]!))) return false;
  return articulation(s, alive) === 0;
}

function trial(seed: number, size: 'small' | 'medium' | 'large', nations: number, withWilds: boolean) {
  const rng = createRng(seed);
  const count = provinceCount(size, nations);
  const ranges = withWilds ? rangesFor(count) : 0;
  const reserve = ranges * 2; // expected cells: size the map for the mean
  const total = count + reserve;
  const bounds = mapDimensions(total);
  const outline = roundedRect(bounds.width, bounds.height, MAPGEN.cornerRadius * Math.min(bounds.width, bounds.height), MAPGEN.cornerSegments);
  const scale = Math.sqrt(MAPGEN.provinceArea);
  // Each range draws its cell count first so the site count is known before geometry.
  const targets = Array.from({ length: ranges }, () => 1 + weightedIndex(rng, RANGE_CELL_WEIGHTS));
  const cellsTotal = count + targets.reduce((a, b) => a + b, 0);
  const sampled = poissonDisc(rng, outline, bounds, MAPGEN.poissonRadius * scale, MAPGEN.poissonTries);
  const sites = lloydRelax(adjustCount(rng, sampled, cellsTotal, outline, bounds, MAPGEN.fillCandidates), outline, bounds, MAPGEN.lloydRounds);
  const cells = voronoiCells(sites, outline, bounds);
  const adj = adjacency(cells, MAPGEN.minSharedEdge * scale, 1e-6 * scale);
  if (cells.polygons.some((p) => p.length < 3) || !isConnected(adj)) return { fail: 'geometry' };
  const eN = createSimplex2D(rng), mN = createSimplex2D(rng);
  const f = MAPGEN.noiseFeatures / Math.max(bounds.width, bounds.height);
  const elev = sites.map((p) => fractal(eN, p.x * f, p.y * f, MAPGEN.noiseOctaves));
  const moist = sites.map((p) => fractal(mN, p.x * f, p.y * f, MAPGEN.noiseOctaves));
  const onOutline = cells.polygons.map((poly) => poly.some((v) => v.x < 1e-6 * scale || v.y < 1e-6 * scale || v.x > bounds.width - 1e-6 * scale || v.y > bounds.height - 1e-6 * scale || isOnOutline(v, outline, 1e-6 * scale)));
  const alive = sites.map(() => true);
  const kinds = shuffle(rng, ['peaks', 'deadLake', 'chasm'] as Kind[]);
  const score = (k: Kind, i: number) => (k === 'peaks' ? elev[i]! : k === 'deadLake' ? moist[i]! - elev[i]! : -moist[i]!);
  const placed: { kind: Kind; cells: number[] }[] = [];
  let shortfall = 0;
  for (let r = 0; r < ranges; r++) {
    const kind = kinds[r % kinds.length]!;
    const wild = alive.map((a) => !a);
    const distWild = wild.some(Boolean) ? bfsDistances(adj, wild.map((w, i) => (w ? i : -1)).filter((i) => i >= 0)) : sites.map(() => Infinity);
    const seedCands = sites.map((_, i) => i).filter((i) => alive[i] && !onOutline[i] && distWild[i]! >= SEPARATION).sort((a, b) => score(kind, b) - score(kind, a) || a - b);
    let seedCell = -1;
    for (const c of seedCands) { alive[c] = false; if (okRemoval(adj, alive)) { seedCell = c; break; } alive[c] = true; }
    if (seedCell < 0) { shortfall += targets[r]!; continue; }
    const range = [seedCell];
    while (range.length < targets[r]!) {
      const grow = [...new Set(range.flatMap((c) => adj[c]!))].filter((c) => alive[c] && distWild[c]! >= SEPARATION).sort((a, b) => score(kind, b) - score(kind, a) || a - b);
      let added = -1; for (const c of grow) { alive[c] = false; if (okRemoval(adj, alive)) { added = c; break; } alive[c] = true; }
      if (added < 0) break; range.push(added);
    }
    shortfall += targets[r]! - range.length;
    placed.push({ kind, cells: range });
  }
  // Shortfall: the generator would retry; here we count it.
  const provIdx = alive.map((a, i) => (a ? i : -1)).filter((i) => i >= 0);
  const provCount = provIdx.length;
  const s = sub(adj, alive);
  // capitals: farthest point on the province graph, never adjacent to a wild cell
  const nearWild = sites.map((_, i) => alive[i] && adj[i]!.some((j) => !alive[j]));
  const allowed = provIdx.filter((i) => !nearWild[i]);
  const startD = bfsDistances(s, [provIdx[randBelow(rng, provIdx.length)]!]);
  const caps = [allowed.reduce((b, i) => (startD[i]! > startD[b]! ? i : b), allowed[0]!)];
  while (caps.length < nations) { const d = bfsDistances(s, caps); caps.push(allowed.reduce((b, i) => (d[i]! > d[b]! ? i : b), allowed[0]!)); }
  const capDist = Math.min(...caps.flatMap((a, k) => caps.slice(k + 1).map((b) => bfsDistances(s, [a])[b]!)));
  // terrain + pops for the ring balance
  const fixed = new Map(caps.map((c, k) => [provIdx.indexOf(c), k === 0 ? 'plains' : 'forest'] as const));
  const terr = assignTerrain(provIdx.map((i) => elev[i]!), provIdx.map((i) => moist[i]!), fixed as any);
  const pops = new Array(sites.length).fill(0);
  provIdx.forEach((i, k) => (pops[i] = startPopulation(rng, terr[k]!, caps.includes(i))));
  const ring = caps.map((c) => { const d = bfsDistances(s, [c]); return provIdx.reduce((a, i) => (i !== c && d[i]! <= 2 ? a + pops[i] : a), 0); });
  const balance = Math.max(...ring) / Math.min(...ring);
  const bordering = provIdx.filter((i) => nearWild[i]).length;
  // terrain beside each kind
  const besides: Record<string, Record<string, number>> = {};
  for (const p of placed) for (const c of p.cells) for (const j of adj[c]!) if (alive[j]) { const t = terr[provIdx.indexOf(j)]!; (besides[p.kind] ??= {})[t] = ((besides[p.kind] ??= {})[t] ?? 0) + 1; }
  return { fail: shortfall > 0 ? 'shortfall' : null, provCount, count, wildCells: cellsTotal - provCount, ranges: placed.length, capDist, balance, bordering, cuts: articulation(s, alive), besides, baseCuts: 0 };
}
function isOnOutline(p: { x: number; y: number }, outline: { x: number; y: number }[], eps: number) {
  for (let k = 0; k < outline.length; k++) { const a = outline[k]!, b = outline[(k + 1) % outline.length]!; const dx = b.x - a.x, dy = b.y - a.y; const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy))); if (Math.hypot(a.x + t * dx - p.x, a.y + t * dy - p.y) < eps) return true; }
  return false;
}

const configs: [string, 'small' | 'medium' | 'large', number][] = [['small-2', 'small', 2], ['medium-2', 'medium', 2], ['large-2', 'large', 2], ['medium-3', 'medium', 3], ['large-4', 'large', 4]];
const N = Number(process.argv[2] ?? 100);
for (const [name, size, nations] of configs) {
  const stats = { n: 0, short: 0, geo: 0, cap6: 0, bal: 0, cells: 0, bordering: 0, prov: 0, ranges: 0, capDistSum: 0 };
  const base = { cap6: 0, bal: 0, cuts: 0, capDistSum: 0 };
  const near: Record<string, Record<string, number>> = {};
  for (let seed = 1; seed <= N; seed++) {
    const r: any = trial(seed, size, nations, true);
    const b: any = trial(seed, size, nations, false);
    stats.n++;
    if (r.fail === 'geometry') { stats.geo++; continue; }
    if (r.fail === 'shortfall') stats.short++;
    if (r.capDist >= 6) stats.cap6++; if (r.balance <= 1.5) stats.bal++;
    stats.cells += r.wildCells; stats.bordering += r.bordering; stats.prov += r.provCount; stats.ranges += r.ranges; stats.capDistSum += r.capDist;
    for (const [k, m] of Object.entries(r.besides)) for (const [t, c] of Object.entries(m as Record<string, number>)) (near[k] ??= {})[t] = (near[k]![t] ?? 0) + c;
    if (b.fail !== 'geometry') { if (b.capDist >= 6) base.cap6++; if (b.balance <= 1.5) base.bal++; base.capDistSum += b.capDist; }
  }
  const ok = stats.n - stats.geo;
  console.log(`${name}: provinces ${provinceCount(size, nations)}, ranges ${rangesFor(provinceCount(size, nations))}; seeds ${stats.n}`);
  console.log(`  wild cells mean ${(stats.cells / ok).toFixed(1)} (${(100 * stats.cells / ok / provinceCount(size, nations)).toFixed(1)}% of provinces); ranges placed mean ${(stats.ranges / ok).toFixed(2)}; shortfall seeds ${stats.short}`);
  console.log(`  provinces bordering a wild: mean ${(stats.bordering / ok).toFixed(1)} (${(100 * stats.bordering / stats.prov).toFixed(0)}%)`);
  console.log(`  first-attempt capitals >= 6 apart: wilds ${stats.cap6}/${ok}, no wilds ${base.cap6}/${ok}; mean capital distance ${(stats.capDistSum / ok).toFixed(2)} vs ${(base.capDistSum / ok).toFixed(2)}`);
  console.log(`  first-attempt ring balance <= 1.5: wilds ${stats.bal}/${ok}, no wilds ${base.bal}/${ok}`);
  console.log(`  terrain beside each kind (border counts):`, JSON.stringify(near));
}
