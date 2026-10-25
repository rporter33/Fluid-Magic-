// Final-design measurement for impassable regions (wartable-design/final.md section 1).
// A copy of src/mapgen/generate.ts's attempt() with the final model and order:
//   plan range sizes (rng) -> geometry on provinces + wild cells -> capitals on the full cell
//   graph -> noise -> wild ranges (peaks by elevation, then meres by wetness minus elevation)
//   -> terrain ranked over the province cells only (assignTerrain unchanged) -> Wellsprings,
//   steps, springs, names, populations, capital distance on the province graph -> the repo's
//   own validateMap plus the new wild checks -> the balance search (6 or 10 valid maps).
// Compared against today's generateMap on the same seeds. Reads the repo read-only.
//
// Run: TMPDIR=<scratch> /home/user/Fluid-Magic-/node_modules/.bin/tsx regions-final.ts
//      CONFIGS=medium:2:200,medium:3:100 (size:nations:seeds)
import { MAPGEN, type MapSizeId } from '/home/user/Fluid-Magic-/src/content/mapgen.ts';
import type { TerrainId } from '/home/user/Fluid-Magic-/src/content/terrain.ts';
import type { Color } from '/home/user/Fluid-Magic-/src/content/colors.ts';
import { createRng, weightedIndex, type RngState } from '/home/user/Fluid-Magic-/src/sim/rng.ts';
import { newId, type ProvinceId } from '/home/user/Fluid-Magic-/src/sim/ids.ts';
import { centroid, roundedRect } from '/home/user/Fluid-Magic-/src/mapgen/geometry.ts';
import { bfsDistances, isConnected } from '/home/user/Fluid-Magic-/src/mapgen/graph.ts';
import { createSimplex2D, fractal, type Noise2D } from '/home/user/Fluid-Magic-/src/mapgen/noise.ts';
import { nameProvinces } from '/home/user/Fluid-Magic-/src/mapgen/names.ts';
import {
  capitalBalance,
  independentStrength,
  placeCapitals,
  placeSprings,
  placeWellsprings,
  startPopulation,
  wellspringSteps,
  wellspringsToWin,
} from '/home/user/Fluid-Magic-/src/mapgen/placement.ts';
import { mapDimensions, provinceCount, wellspringCount } from '/home/user/Fluid-Magic-/src/mapgen/size.ts';
import { assignTerrain } from '/home/user/Fluid-Magic-/src/mapgen/terrain.ts';
import type { CapitalSpec, MapData, MapGenParams, MapProvince, Point } from '/home/user/Fluid-Magic-/src/mapgen/types.ts';
import { validateMap } from '/home/user/Fluid-Magic-/src/mapgen/validate.ts';
import { adjacency, adjustCount, lloydRelax, poissonDisc, voronoiCells } from '/home/user/Fluid-Magic-/src/mapgen/voronoi.ts';
import { generateMap } from '/home/user/Fluid-Magic-/src/mapgen/generate.ts';

// ---------------------------------------------------------------- the proposed content block
type Kind = 'peaks' | 'mere';
const IMPASSABLE = {
  provincesPerRange: 20, // ranges = round(provinces / 20)
  kindCycle: ['peaks', 'mere', 'peaks'] as Kind[], // range r has kindCycle[r % 3]
  cellWeights: { peaks: [25, 50, 25], mere: [60, 40] } as Record<Kind, number[]>, // 1, 2, 3 cells
  minCapitalCells: 3, // cell hops from every capital, on the full cell graph
  separation: 3, // cell hops between cells of two different ranges
  maxDetour: 6, // provinces bordering one range stay this close by passable paths
};

type Adj = number[][];
const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const LEG2: Record<TerrainId, number> = { plains: 4, farmland: 4, forest: 6, hills: 6, mountains: 9, swamp: 8, wasteland: 5 };
const FAILS = new Map<string, number>();
const SEED_TRIES = Number(process.env.SEED_TRIES ?? 12);
let WILD_MS = 0;
const fail = (p: string) => { FAILS.set(p, (FAILS.get(p) ?? 0) + 1); return null; };

/** Articulation points of the subgraph of `adj` without `removed` (Tarjan, iterative). */
function cutVertices(adj: Adj, removed: ReadonlySet<number>): number {
  const n = adj.length;
  const disc = new Int32Array(n).fill(-1), low = new Int32Array(n), parent = new Int32Array(n).fill(-1);
  const isAp = new Uint8Array(n);
  let t = 0;
  for (let root = 0; root < n; root++) {
    if (removed.has(root) || disc[root] !== -1) continue;
    let rootKids = 0;
    const stack: [number, number][] = [[root, 0]];
    disc[root] = low[root] = t++;
    while (stack.length) {
      const top = stack[stack.length - 1]!;
      const [u, k] = top;
      const nb = adj[u]!;
      if (k < nb.length) {
        top[1]++;
        const v = nb[k]!;
        if (removed.has(v)) continue;
        if (disc[v] === -1) {
          parent[v] = u; disc[v] = low[v] = t++;
          if (u === root) rootKids++;
          stack.push([v, 0]);
        } else if (v !== parent[u]) low[u] = Math.min(low[u]!, disc[v]!);
      } else {
        stack.pop();
        const p = parent[u]!;
        if (p !== -1) {
          low[p] = Math.min(low[p]!, low[u]!);
          if (p !== root && low[u]! >= disc[p]!) isAp[p] = 1;
        }
      }
    }
    if (rootKids > 1) isAp[root] = 1;
  }
  let c = 0;
  for (let i = 0; i < n; i++) if (isAp[i] && !removed.has(i)) c++;
  return c;
}
function bfsSkip(adj: Adj, from: number, removed: ReadonlySet<number>): number[] {
  const d = new Array<number>(adj.length).fill(Infinity);
  d[from] = 0;
  const q = [from];
  for (let h = 0; h < q.length; h++) {
    const v = q[h]!;
    for (const w of adj[v]!) if (!removed.has(w) && d[w] === Infinity) { d[w] = d[v]! + 1; q.push(w); }
  }
  return d;
}
function dijkstraDays(adj: Adj, terr: TerrainId[], from: number, to: number): number {
  const d = new Array(adj.length).fill(Infinity); d[from] = 0; const done = new Set<number>();
  for (;;) {
    let b = -1;
    for (let i = 0; i < adj.length; i++) if (!done.has(i) && d[i] < Infinity && (b < 0 || d[i] < d[b])) b = i;
    if (b < 0) return Infinity; if (b === to) return d[b]; done.add(b);
    for (const n of adj[b]!) d[n] = Math.min(d[n], d[b] + LEG2[terr[n]!]);
  }
}

interface Wild { kind: Kind; cells: number[] }
interface Result { map: MapData; balance: number; wilds: Wild[]; cellAdj: Adj; provinceCells: number[]; ringSame: boolean; detourMax: number; cuts: number }

function attempt(rng: RngState, params: MapGenParams, count: number): Result | null {
  const scale = Math.sqrt(MAPGEN.provinceArea);
  // 1. Plan the ranges (the only new draws before geometry).
  const R = Math.round(count / IMPASSABLE.provincesPerRange);
  const plan: Wild[] = range(R).map((r) => {
    const kind = IMPASSABLE.kindCycle[r % IMPASSABLE.kindCycle.length]!;
    return { kind, cells: new Array(1 + weightedIndex(rng, IMPASSABLE.cellWeights[kind])).fill(-1) };
  });
  const total = count + plan.reduce((s, w) => s + w.cells.length, 0);
  const bounds = mapDimensions(total);
  const outline = roundedRect(bounds.width, bounds.height, MAPGEN.cornerRadius * Math.min(bounds.width, bounds.height), MAPGEN.cornerSegments);

  // 2. Geometry on every cell, as today.
  const sampled = poissonDisc(rng, outline, bounds, MAPGEN.poissonRadius * scale, MAPGEN.poissonTries);
  const sites = lloydRelax(adjustCount(rng, sampled, total, outline, bounds, MAPGEN.fillCandidates), outline, bounds, MAPGEN.lloydRounds);
  const cells = voronoiCells(sites, outline, bounds);
  const cadj = adjacency(cells, MAPGEN.minSharedEdge * scale, 1e-6 * scale);
  if (cells.polygons.some((p) => p.length < 3)) return fail('empty cell');
  if (cadj.some((l) => l.length < MAPGEN.minNeighbors)) return fail('sparse cell');
  if (!isConnected(cadj)) return fail('not connected');

  // 3. Capitals on the full cell graph (today's call).
  const capCells = placeCapitals(rng, cadj, params.capitals.length);
  if (capCells === null) return fail('capitals too close');

  // 4. Noise (today's calls).
  const eN = createSimplex2D(rng), mN = createSimplex2D(rng);
  const freq = MAPGEN.noiseFeatures / Math.max(bounds.width, bounds.height);
  const sample = (n: Noise2D) => sites.map((p) => fractal(n, p.x * freq, p.y * freq, MAPGEN.noiseOctaves));
  const elev = sample(eN), wet = sample(mN);

  // 5. Wild ranges. Peaks first (highest ground), then meres (wettest low ground).
  const tw0 = performance.now();
  const segDist = (p: Point, a: Point, b: Point) => { const dx = b.x - a.x, dy = b.y - a.y; const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy))); return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy); };
  const onOutline = cells.polygons.map((poly) => poly.some((v) => outline.some((a, k) => segDist(v, a, outline[(k + 1) % outline.length]!) < 1e-6 * scale)));
  const capDist = bfsDistances(cadj, capCells);
  const removed = new Set<number>();
  const placed: Wild[] = [];
  const ownerOf = new Map<number, number>(); // cell -> placed range index
  const distToOthers = (cell: number, self: number) => {
    // hops from `cell` to the nearest cell of another range, over the full cell graph
    const others = [...ownerOf].filter(([, r]) => r !== self).map(([c]) => c);
    if (others.length === 0) return Infinity;
    return bfsDistances(cadj, others)[cell] ?? Infinity;
  };
  const detourOk = (trial: Set<number>) => {
    for (const w of placed) {
      const ring = new Set<number>();
      for (const c of w.cells) for (const n of cadj[c]!) if (!trial.has(n)) ring.add(n);
      const list = [...ring];
      for (const a of list) { const d = bfsSkip(cadj, a, trial); for (const b of list) if (b > a && d[b]! > IMPASSABLE.maxDetour) return false; }
    }
    return true;
  };
  const safe = (cell: number, self: number): boolean => {
    if (removed.has(cell) || onOutline[cell] || (capDist[cell] ?? 0) < IMPASSABLE.minCapitalCells) return false;
    if (distToOthers(cell, self) < IMPASSABLE.separation) return false;
    const trial = new Set([...removed, cell]);
    for (const n of cadj[cell]!) if (!trial.has(n) && cadj[n]!.filter((m) => !trial.has(m)).length < MAPGEN.minNeighbors) return false;
    const alive = range(cadj.length).find((i) => !trial.has(i))!;
    const d = bfsSkip(cadj, alive, trial);
    if (range(cadj.length).some((i) => !trial.has(i) && d[i] === Infinity)) return false;
    if (cutVertices(cadj, trial) > 0) return false;
    return true;
  };
  const order = [...plan].sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'peaks' ? -1 : 1));
  for (const want of order) {
    const score = (i: number) => (want.kind === 'peaks' ? elev[i]! : wet[i]! - elev[i]!);
    const self = placed.length;
    const w: Wild = { kind: want.kind, cells: [] };
    placed.push(w);
    const commit = (c: number) => { removed.add(c); w.cells.push(c); ownerOf.set(c, self); };
    const tryAdd = (c: number) => {
      if (!safe(c, self)) return false;
      removed.add(c); w.cells.push(c);
      const ok = detourOk(removed);
      removed.delete(c); w.cells.pop();
      if (!ok) return false;
      commit(c); return true;
    };
    // Seed at the best eligible cell and grow into the best eligible neighbors; if the range
    // cannot reach its size, release it and try the next seed (at most seedTries seeds).
    const seedOrder = range(total).sort((a, b) => score(b) - score(a) || a - b);
    let done = false, seeds = 0, sawSeed = false;
    for (const s0 of seedOrder) {
      if (seeds >= SEED_TRIES) break;
      if (!tryAdd(s0)) continue;
      seeds++; sawSeed = true;
      while (w.cells.length < want.cells.length) {
        const frontier = [...new Set(w.cells.flatMap((c) => cadj[c]!))].filter((c) => !removed.has(c)).sort((a, b) => score(b) - score(a) || a - b);
        let grown = false;
        for (const c of frontier) if (tryAdd(c)) { grown = true; break; }
        if (!grown) break;
      }
      if (w.cells.length === want.cells.length) { done = true; break; }
      for (const c of w.cells) { removed.delete(c); ownerOf.delete(c); }
      w.cells.length = 0;
    }
    if (!done) { WILD_MS += performance.now() - tw0; return fail(sawSeed ? `no room to grow ${want.kind}` : `no room for ${want.kind}`); }
  }

  WILD_MS += performance.now() - tw0;
  // 6. Provinces are the remaining cells, re-indexed in site order.
  const provinceCells = range(total).filter((i) => !removed.has(i));
  const pIx = new Map(provinceCells.map((c, p) => [c, p]));
  const adj: Adj = provinceCells.map((c) => cadj[c]!.filter((n) => !removed.has(n)).map((n) => pIx.get(n)!).sort((a, b) => a - b));
  const capitals = capCells.map((c) => pIx.get(c)!);
  const specs = params.capitals;
  const capitalTerrain = new Map<number, TerrainId>(capitals.map((p, s) => [p, specs[s]!.terrain]));

  // ring identity: each capital's 2-hop ring has the same members on both graphs
  let ringSame = true;
  for (let s = 0; s < capCells.length; s++) {
    const dc = bfsDistances(cadj, [capCells[s]!]); const dp = bfsDistances(adj, [capitals[s]!]);
    const a = range(total).filter((i) => (dc[i] ?? 9) <= 2).map((i) => pIx.get(i) ?? -1).sort((x, y) => x - y);
    const b = range(adj.length).filter((i) => (dp[i] ?? 9) <= 2).sort((x, y) => x - y);
    if (a.join() !== b.join()) ringSame = false;
  }

  // 7. Everything as today, on the province graph.
  const terrains = assignTerrain(provinceCells.map((c) => elev[c]!), provinceCells.map((c) => wet[c]!), capitalTerrain);
  const wells = placeWellsprings(rng, adj, capitals, wellspringCount(specs.length));
  if (wells === null) return fail('no room for Wellsprings');
  const steps = wellspringSteps(rng, wells.length);
  const springs = placeSprings(rng, terrains, capitals.map((index, slot) => ({ index, color: specs[slot]!.color })), wells);
  const names = nameProvinces(rng, terrains, capitals.map((index, slot) => [index, specs[slot]!.name] as const));
  const pops = terrains.map((t, i) => startPopulation(rng, t, capitals.includes(i)));
  const nearest = bfsDistances(adj, capitals);
  const counter = { nextId: 0 };
  const ids: ProvinceId[] = provinceCells.map(() => newId(counter, 'province'));
  const provinces = {} as Record<ProvinceId, MapProvince>;
  provinceCells.forEach((c, i) => {
    const id = ids[i]!; const slot = capitals.indexOf(i); const well = wells.indexOf(i);
    const polygon = cells.polygons[c] ?? [];
    const pr: MapProvince = { id, name: names[i] ?? id, terrain: terrains[i] ?? 'plains', site: sites[c]!, center: centroid(polygon), polygon,
      neighbors: (adj[i] ?? []).map((j) => ids[j]!), capitalDistance: nearest[i] ?? 0, startPop: pops[i] ?? 0, springs: springs[i] ?? [],
      independentStrength: independentStrength(nearest[i] ?? 0, slot >= 0, well >= 0) };
    if (slot >= 0) pr.capitalSlot = slot;
    const st = steps[well]; if (st !== undefined) pr.wellspring = st;
    provinces[id] = pr;
  });
  const map: MapData = { seed: params.seed, size: params.size, width: bounds.width, height: bounds.height, outline: [...outline], provinces,
    capitals: capitals.map((i) => ids[i]!), wellsprings: wells.map((i) => ids[i]!) };

  // 8. Today's validateMap plus the new checks.
  const problems = validateMap(map, params);
  const cuts = cutVertices(adj, new Set());
  if (cuts > 0) problems.push('cut vertex');
  let detourMax = 0;
  for (const w of placed) {
    const ring = [...new Set(w.cells.flatMap((c) => cadj[c]!).filter((n) => pIx.has(n)).map((n) => pIx.get(n)!))];
    for (const a of ring) { const d = bfsDistances(adj, [a]); for (const b of ring) detourMax = Math.max(detourMax, d[b]!); }
  }
  if (detourMax > IMPASSABLE.maxDetour) problems.push('detour');
  if (!ringSame) problems.push('ring changed');
  if (problems.length) { for (const p of problems) FAILS.set(`validate: ${p.replace(/p\d+/g, 'p#').replace(/\d+/g, '#')}`, (FAILS.get(p) ?? 0) + 1); return null; }
  return { map, balance: capitalBalance(adj, capitals, pops), wilds: placed, cellAdj: cadj, provinceCells, ringSame, detourMax, cuts };
}

function generate(params: MapGenParams, candidates: number): { best: Result | null; attempts: number } {
  const rng = createRng(params.seed);
  const count = provinceCount(params.size, params.capitals.length);
  let best: Result | null = null, valid = 0, i = 0;
  for (; i < MAPGEN.maxAttempts && valid < candidates; i++) {
    const r = attempt(rng, params, count);
    if (!r) continue;
    valid++;
    if (best === null || r.balance < best.balance) best = r;
    if (r.balance <= MAPGEN.capitalBalanceRatio) break;
  }
  return { best, attempts: Math.min(i + 1, MAPGEN.maxAttempts) };
}

// ---------------------------------------------------------------- graph metrics on a MapData
function graphOf(m: MapData) {
  const ids = Object.keys(m.provinces) as ProvinceId[];
  const ix = new Map(ids.map((id, i) => [id, i]));
  const adj = ids.map((id) => m.provinces[id]!.neighbors.map((n) => ix.get(n)!));
  const terr = ids.map((id) => m.provinces[id]!.terrain);
  const pops = ids.map((id) => m.provinces[id]!.startPop);
  const caps = m.capitals.map((c) => ix.get(c)!);
  const wells = m.wellsprings.map((w) => ix.get(w)!);
  const capDistMean = ids.reduce((s, id) => s + m.provinces[id]!.capitalDistance, 0) / ids.length;
  return { adj, terr, pops, caps, wells, capDistMean };
}
function unfairness(adj: Adj, caps: number[], wells: number[]) {
  const need = wellspringsToWin(wells.length);
  const reach = caps.map((c) => { const d = bfsDistances(adj, [c]); return wells.map((w) => d[w]!).sort((a, b) => a - b).slice(0, need).reduce((s, x) => s + x, 0); });
  return Math.max(...reach) - Math.min(...reach);
}
function capPair(adj: Adj, terr: TerrainId[], caps: number[]) {
  let h = Infinity, d = Infinity;
  for (const a of caps) for (const b of caps) if (a < b) { h = Math.min(h, bfsDistances(adj, [a])[b]!); d = Math.min(d, dijkstraDays(adj, terr, a, b)); }
  return { h, d };
}
const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / Math.max(1, xs.length);
const pct = (xs: number[], p: number) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))] ?? NaN; };
const NATION_SPECS: CapitalSpec[] = [
  { color: 'R' as Color, terrain: 'plains', name: 'Kharnath' },
  { color: 'G' as Color, terrain: 'forest', name: 'Deepmoss' },
  { color: 'R' as Color, terrain: 'plains', name: 'Kharnath' },
  { color: 'G' as Color, terrain: 'forest', name: 'Deepmoss' },
];

const configs = (process.env.CONFIGS ?? 'medium:2:200,medium:3:100,medium:4:100').split(',').map((c) => { const [s, n, k] = c.split(':'); return { size: s as MapSizeId, nations: Number(n), seeds: Number(k) }; });
for (const { size, nations, seeds } of configs) {
  const caps = NATION_SPECS.slice(0, nations);
  const B = { ms: [] as number[], within: 0, bal: [] as number[], unf: [] as number[], deg: [] as number[], h: [] as number[], d: [] as number[], cd: [] as number[] };
  const N = { ms: [] as number[], att: [] as number[], fail: 0, within: 0, bal: [] as number[], unf: [] as number[], deg: [] as number[], h: [] as number[], d: [] as number[], cd: [] as number[], cells: [] as number[], touch: [] as number[], detour: [] as number[], cuts: [] as number[], ringBad: 0, besidePeaks: new Map<string, number>(), besideMere: new Map<string, number>() };
  const T = { ms: [] as number[], att: [] as number[], fail: 0, within: 0, bal: [] as number[] };
  const WMS: number[] = [];
  for (let seed = 1; seed <= seeds; seed++) {
    const params: MapGenParams = { seed, size, capitals: caps };
    let t0 = performance.now();
    const bm = generateMap(params);
    B.ms.push(performance.now() - t0);
    const bg = graphOf(bm);
    const bb = capitalBalance(bg.adj, bg.caps, bg.pops); B.bal.push(bb); if (bb <= MAPGEN.capitalBalanceRatio) B.within++;
    B.unf.push(unfairness(bg.adj, bg.caps, bg.wells)); B.deg.push(mean(bg.adj.map((l) => l.length)));
    { const p = capPair(bg.adj, bg.terr, bg.caps); B.h.push(p.h); B.d.push(p.d); } B.cd.push(bg.capDistMean);

    for (const [cand, acc] of [[6, N], [10, T]] as const) {
      if (cand === 6) WILD_MS = 0;
      t0 = performance.now();
      const { best, attempts } = generate(params, cand);
      acc.ms.push(performance.now() - t0);
      if (cand === 6) WMS.push(WILD_MS);
      if (!best) { acc.fail++; continue; }
      acc.att.push(attempts);
      acc.bal.push(best.balance); if (best.balance <= MAPGEN.capitalBalanceRatio) acc.within++;
      if (acc !== N) continue;
      const g = graphOf(best.map);
      N.unf.push(unfairness(g.adj, g.caps, g.wells)); N.deg.push(mean(g.adj.map((l) => l.length)));
      { const p = capPair(g.adj, g.terr, g.caps); N.h.push(p.h); N.d.push(p.d); } N.cd.push(g.capDistMean);
      const wildCells = best.wilds.flatMap((w) => w.cells);
      N.cells.push(wildCells.length);
      const pIx = new Map(best.provinceCells.map((c, p) => [c, p]));
      const touching = new Set<number>();
      for (const w of best.wilds) for (const c of w.cells) for (const n of best.cellAdj[c]!) if (pIx.has(n)) {
        touching.add(pIx.get(n)!);
        const t = g.terr[pIx.get(n)!]!; const m = w.kind === 'peaks' ? N.besidePeaks : N.besideMere; m.set(t, (m.get(t) ?? 0) + 1);
      }
      N.touch.push(touching.size / g.adj.length);
      N.detour.push(best.detourMax); N.cuts.push(best.cuts); if (!best.ringSame) N.ringBad++;
    }
  }
  const n = provinceCount(size, nations);
  const share = (m: Map<string, number>) => { const t = [...m.values()].reduce((s, x) => s + x, 0); return [...m].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${(100 * v / t).toFixed(0)}%`).join(', '); };
  console.log(`\n== ${size}, ${nations} nations, ${seeds} seeds, ${n} provinces, ${Math.round(n / IMPASSABLE.provincesPerRange)} ranges`);
  console.log(`  no map: ${N.fail} (10 candidates: ${T.fail}); attempts mean ${mean(N.att).toFixed(2)} p95 ${pct(N.att, 0.95)} (10 candidates: ${mean(T.att).toFixed(2)} p95 ${pct(T.att, 0.95)})`);
  console.log(`  generation ms: today mean ${mean(B.ms).toFixed(0)} p95 ${pct(B.ms, 0.95).toFixed(0)} | wilds@6 mean ${mean(N.ms).toFixed(0)} p95 ${pct(N.ms, 0.95).toFixed(0)} | wilds@10 mean ${mean(T.ms).toFixed(0)} p95 ${pct(T.ms, 0.95).toFixed(0)}`);
  console.log(`  of which wild placement (all attempts, @6): mean ${mean(WMS).toFixed(0)} ms p95 ${pct(WMS, 0.95).toFixed(0)}`);
  console.log(`  wild cells mean ${mean(N.cells).toFixed(2)} (${(100 * mean(N.cells) / n).toFixed(1)}% of provinces); provinces bordering a wild ${(100 * mean(N.touch)).toFixed(0)}%`);
  console.log(`  balance within 1.5: today ${(100 * B.within / seeds).toFixed(0)}% (mean ${mean(B.bal).toFixed(3)}) | wilds@6 ${(100 * N.within / (seeds - N.fail)).toFixed(0)}% (mean ${mean(N.bal).toFixed(3)}) | wilds@10 ${(100 * T.within / (seeds - T.fail)).toFixed(0)}% (mean ${mean(T.bal).toFixed(3)})`);
  console.log(`  Wellspring unfairness max: today ${Math.max(...B.unf)} (mean ${mean(B.unf).toFixed(2)}) | wilds ${Math.max(...N.unf)} (mean ${mean(N.unf).toFixed(2)})`);
  console.log(`  mean passable neighbors: today ${mean(B.deg).toFixed(2)} | wilds ${mean(N.deg).toFixed(2)}`);
  console.log(`  closest capitals: hops ${mean(B.h).toFixed(2)} -> ${mean(N.h).toFixed(2)} (min ${Math.min(...N.h)}); days at speed 2 ${mean(B.d).toFixed(1)} -> ${mean(N.d).toFixed(1)}`);
  console.log(`  mean capitalDistance (independent guard 8 + 4d): ${mean(B.cd).toFixed(2)} -> ${mean(N.cd).toFixed(2)}`);
  console.log(`  max detour ${Math.max(...N.detour)} (p95 ${pct(N.detour, 0.95)}); cut vertices max ${Math.max(...N.cuts)}; ring members changed on ${N.ringBad} maps`);
  console.log(`  terrain beside peaks: ${share(N.besidePeaks)}`);
  console.log(`  terrain beside meres: ${share(N.besideMere)}`);
  console.log(`  attempt failures: ${[...FAILS].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join('; ')}`);
  FAILS.clear();
}
