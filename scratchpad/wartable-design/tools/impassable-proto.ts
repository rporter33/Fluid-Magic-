// Prototype of impassable terrain for the war-table design (proposal-immersion.md section 1).
// Reads the repo's mapgen modules (read only), re-implements generate.ts's attempt() with
// impassable regions (peaks, meres) and ridges, and measures every mapgen invariant against
// the current generator on the same seeds. Writes a few SVG maps for a visual check.
//
// Run: TMPDIR=<scratch> /home/user/Fluid-Magic-/node_modules/.bin/tsx impassable-proto.ts [seeds] [svgDir]
import { writeFileSync } from 'node:fs';
import { MAPGEN, type MapSizeId } from '/home/user/Fluid-Magic-/src/content/mapgen.ts';
import { TERRAIN, type TerrainId } from '/home/user/Fluid-Magic-/src/content/terrain.ts';
import { createRng, type RngState } from '/home/user/Fluid-Magic-/src/sim/rng.ts';
import { centroid, roundedRect, distance } from '/home/user/Fluid-Magic-/src/mapgen/geometry.ts';
import { bfsDistances, isConnected } from '/home/user/Fluid-Magic-/src/mapgen/graph.ts';
import { createSimplex2D, fractal, type Noise2D } from '/home/user/Fluid-Magic-/src/mapgen/noise.ts';
import {
  capitalBalance,
  placeCapitals,
  placeWellsprings,
  startPopulation,
  wellspringsToWin,
} from '/home/user/Fluid-Magic-/src/mapgen/placement.ts';
import { mapDimensions, provinceCount, wellspringCount } from '/home/user/Fluid-Magic-/src/mapgen/size.ts';
import { apportion, assignTerrain } from '/home/user/Fluid-Magic-/src/mapgen/terrain.ts';
import { TERRAIN_SHARES } from '/home/user/Fluid-Magic-/src/content/mapgen.ts';

/** assignTerrain with explicit counts (the real change: an optional counts argument). */
function assignTerrainCounts(elevation: number[], moisture: number[], counts: Record<TerrainId, number>, fixed: Map<number, TerrainId>): TerrainId[] {
  const n = elevation.length;
  const c = { ...counts };
  const result = new Array<TerrainId | undefined>(n).fill(undefined);
  for (const [i, t] of fixed) { result[i] = t; c[t] = Math.max(0, c[t] - 1); }
  const take = (t: TerrainId, score: (i: number) => number) => {
    const open = result.flatMap((x, i) => (x === undefined ? [i] : []));
    open.sort((a, b) => score(b) - score(a) || a - b);
    for (const i of open.slice(0, c[t])) result[i] = t;
  };
  const el = (i: number) => elevation[i] ?? 0, w = (i: number) => moisture[i] ?? 0;
  take('mountains', el); take('hills', el); take('swamp', (i) => w(i) - el(i)); take('forest', w);
  take('wasteland', (i) => -w(i)); take('farmland', w);
  return result.map((t) => t ?? 'plains');
}
import {
  adjacency,
  adjustCount,
  lloydRelax,
  poissonDisc,
  voronoiCells,
} from '/home/user/Fluid-Magic-/src/mapgen/voronoi.ts';
import { generateMap } from '/home/user/Fluid-Magic-/src/mapgen/generate.ts';
import type { Point } from '/home/user/Fluid-Magic-/src/mapgen/types.ts';

// ---------------------------------------------------------------- proposed content numbers
const IMP = {
  peakShare: Number(process.env.PEAK ?? 0.05), // peak cells per province
  mereShare: Number(process.env.MERE ?? 0.03), // mere cells per province
  minCapitalDistance: 3, // cell hops from every capital
  maxRangeCells: 3, // peak cells that may touch to form one range
  regionMaxDetour: 6, // two provinces that bordered one region cell stay this close
  ridgeShare: Number(process.env.RIDGE ?? 0.05), // ridged borders per border between provinces
  ridgeMinCapitalDistance: 2, // both provinces of a ridge at least this far from every capital
  ridgeMaxDetour: 4, // the two provinces of a ridge stay this close by passable paths
  ridgeChainMax: 4, // borders per chain
  ridgeTerrains: ['mountains', 'hills'] as TerrainId[],
  noCutProvince: true, // no single province may become the only way into part of the map
  interiorOnly: process.env.INTERIOR !== '0', // regions never touch the map edge (a mere there reads as sea)
  ridgesPerRegion: Number(process.env.RPR ?? 2), // ridge borders that may start at one region
  ridgeMinLength: Number(process.env.RML ?? 0.25), // shortest ridged border, as a fraction of sqrt(provinceArea)
};

type Adj = number[][];
const FAILS = new Map<string, number>();
const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const LEG2: Record<TerrainId, number> = { plains: 4, farmland: 4, forest: 6, hills: 6, mountains: 9, swamp: 8, wasteland: 5 };

function connectedWithout(adj: Adj, removed: Set<number>): boolean {
  const alive = range(adj.length).filter((i) => !removed.has(i));
  if (alive.length === 0) return true;
  const seen = new Set([alive[0]!]);
  const q = [alive[0]!];
  for (let h = 0; h < q.length; h++) for (const n of adj[q[h]!]!) if (!removed.has(n) && !seen.has(n)) { seen.add(n); q.push(n); }
  return seen.size === alive.length;
}
function bfsWithout(adj: Adj, from: number, removed: Set<number>, cut?: Set<string>): number[] {
  const d = new Array(adj.length).fill(Infinity);
  d[from] = 0;
  const q = [from];
  for (let h = 0; h < q.length; h++) {
    const v = q[h]!;
    for (const n of adj[v]!) {
      if (removed.has(n) || d[n] !== Infinity) continue;
      if (cut && cut.has(key(v, n))) continue;
      d[n] = d[v] + 1;
      q.push(n);
    }
  }
  return d;
}
const key = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);

/** Articulation points (cut vertices) of an index graph. */
function articulation(adj: Adj): number {
  const n = adj.length;
  const disc = new Array(n).fill(-1), low = new Array(n).fill(0);
  let t = 0, count = 0;
  const isAp = new Array(n).fill(false);
  const dfs = (u: number, p: number) => {
    disc[u] = low[u] = t++;
    let kids = 0;
    for (const v of adj[u]!) {
      if (disc[v] === -1) {
        kids++;
        dfs(v, u);
        low[u] = Math.min(low[u], low[v]);
        if (p !== -1 && low[v] >= disc[u]) isAp[u] = true;
      } else if (v !== p) low[u] = Math.min(low[u], disc[v]);
    }
    if (p === -1 && kids > 1) isAp[u] = true;
  };
  for (let i = 0; i < n; i++) if (disc[i] === -1) dfs(i, -1);
  for (const a of isAp) if (a) count++;
  return count;
}

function cutCount(adj: Adj, removed: Set<number>): number {
  const alive = range(adj.length).filter((i) => !removed.has(i));
  const ix = new Map(alive.map((c, k) => [c, k]));
  return articulation(alive.map((c) => adj[c]!.filter((n) => !removed.has(n)).map((n) => ix.get(n)!)));
}

function dijkstraDays(adj: Adj, terr: TerrainId[], from: number, to: number): number {
  const d = new Array(adj.length).fill(Infinity);
  d[from] = 0;
  const done = new Set<number>();
  for (;;) {
    let b = -1;
    for (let i = 0; i < adj.length; i++) if (!done.has(i) && d[i] < Infinity && (b < 0 || d[i] < d[b])) b = i;
    if (b < 0) return Infinity;
    if (b === to) return d[b];
    done.add(b);
    for (const n of adj[b]!) d[n] = Math.min(d[n], d[b] + LEG2[terr[n]!]);
  }
}

/** The segment(s) two cells share, for drawing ridges. */
function sharedSegment(poly: Point[], si: Point, sj: Point, tol: number): [Point, Point] | null {
  const on = (p: Point) => Math.abs(distance(p, si) - distance(p, sj)) <= tol;
  for (let k = 0; k < poly.length; k++) {
    const p = poly[k]!, q = poly[(k + 1) % poly.length]!;
    if (on(p) && on(q)) return [p, q];
  }
  return null;
}

export interface ProtoMap {
  ok: boolean;
  problems: string[];
  width: number; height: number; outline: Point[];
  polygons: Point[][]; sites: Point[];
  provinceCells: number[]; // cell index per province
  regionCells: { cell: number; kind: 'peak' | 'mere' }[];
  terrain: TerrainId[]; // per province
  adj: Adj; // passable province adjacency
  ridges: [number, number][]; // province index pairs
  cellAdj: Adj;
  capitals: number[]; // province indices
  wells: number[];
  balance: number;
  ridgeDetourMax: number;
  regionDetourMax: number;
}

function attempt(rng: RngState, size: MapSizeId, nations: number, withImpassable: boolean): ProtoMap {
  const count = provinceCount(size, nations);
  const peaksWanted = withImpassable ? Math.round(count * IMP.peakShare) : 0;
  const meresWanted = withImpassable ? Math.round(count * IMP.mereShare) : 0;
  const total = count + peaksWanted + meresWanted;
  const bounds = mapDimensions(total);
  const outline = roundedRect(bounds.width, bounds.height, MAPGEN.cornerRadius * Math.min(bounds.width, bounds.height), MAPGEN.cornerSegments);
  const scale = Math.sqrt(MAPGEN.provinceArea);
  const fail = (p: string): ProtoMap => { FAILS.set(p, (FAILS.get(p) ?? 0) + 1); return { ok: false, problems: [p] } as unknown as ProtoMap; };

  const sampled = poissonDisc(rng, outline, bounds, MAPGEN.poissonRadius * scale, MAPGEN.poissonTries);
  const sites = lloydRelax(adjustCount(rng, sampled, total, outline, bounds, MAPGEN.fillCandidates), outline, bounds, MAPGEN.lloydRounds);
  const cells = voronoiCells(sites, outline, bounds);
  const cadj = adjacency(cells, MAPGEN.minSharedEdge * scale, 1e-6 * scale);
  if (cells.polygons.some((p) => p.length < 3)) return fail('empty cell');
  if (cadj.some((l) => l.length < MAPGEN.minNeighbors)) return fail('sparse cell');
  if (!isConnected(cadj)) return fail('not connected');

  const capCells = placeCapitals(rng, cadj, nations);
  if (capCells === null) return fail('capitals too close');

  const eN = createSimplex2D(rng), mN = createSimplex2D(rng);
  const freq = MAPGEN.noiseFeatures / Math.max(bounds.width, bounds.height);
  const sample = (n: Noise2D) => sites.map((p) => fractal(n, p.x * freq, p.y * freq, MAPGEN.noiseOctaves));
  const elev = sample(eN), wet = sample(mN);

  // ---- impassable regions
  const segDist = (p: Point, a: Point, b: Point) => { const dx = b.x - a.x, dy = b.y - a.y; const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy))); return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy); };
  const onOutline = cells.polygons.map((poly) => poly.some((v) => outline.some((a, k) => segDist(v, a, outline[(k + 1) % outline.length]!) < 1e-6 * scale)));
  const cellTerrainRef: { t: TerrainId[] | null } = { t: null };
  const removed = new Set<number>();
  const regions: { cell: number; kind: 'peak' | 'mere' }[] = [];
  const capDist = capCells.map((c) => bfsDistances(cadj, [c]));
  const farFromCapitals = (i: number) => capDist.every((d) => (d[i] ?? 0) >= IMP.minCapitalDistance);
  const rangeSize = (i: number): number => {
    // size of the peak cluster i would join
    const seen = new Set([i]); const q = [i];
    for (let h = 0; h < q.length; h++) for (const n of cadj[q[h]!]!) if (!seen.has(n) && regions.some((r) => r.cell === n && r.kind === 'peak')) { seen.add(n); q.push(n); }
    return seen.size;
  };
  const okToRemove = (i: number, kind: 'peak' | 'mere'): boolean => {
    if (capCells.includes(i) || removed.has(i) || !farFromCapitals(i)) return false;
    if (IMP.interiorOnly && onOutline[i]) return false;
    const touches = cadj[i]!.filter((n) => removed.has(n));
    if (kind === 'mere' && touches.length > 0) return false; // meres stand alone
    if (kind === 'peak' && touches.some((n) => regions.find((r) => r.cell === n)?.kind === 'mere')) return false;
    if (kind === 'peak' && rangeSize(i) > IMP.maxRangeCells) return false;
    const trial = new Set([...removed, i]);
    for (const n of cadj[i]!) if (!trial.has(n) && cadj[n]!.filter((m) => !trial.has(m)).length < MAPGEN.minNeighbors) return false;
    if (!connectedWithout(cadj, trial)) return false;
    // detour: the provinces around every region placed so far stay close
    for (const r of [...regions.map((x) => x.cell), i]) {
      const nb = cadj[r]!.filter((n) => !trial.has(n));
      for (const a of nb) {
        const d = bfsWithout(cadj, a, trial);
        for (const b of nb) if (b > a && d[b]! > IMP.regionMaxDetour) return false;
      }
    }
    if (IMP.noCutProvince && cutCount(cadj, trial) > 0) return false;
    return true;
  };
  const place = (kind: 'peak' | 'mere', wanted: number, score: (i: number) => number) => {
    const order = range(total).sort((a, b) => score(b) - score(a) || a - b);
    let placed = 0;
    for (const i of order) {
      if (placed >= wanted) break;
      if (okToRemove(i, kind)) { removed.add(i); regions.push({ cell: i, kind }); placed++; }
    }
  };
  // Regions first (by elevation and wetness among eligible cells), then terrain over every cell
  // with the regions fixed as mountains and swamp, so provinces keep the exact shares.
  const terrainMode = process.env.MODE === 'terrain';
  if (terrainMode) {
    const counts0 = apportion(TERRAIN_SHARES, count);
    counts0.mountains += peaksWanted;
    counts0.swamp += meresWanted;
    const pre = assignTerrainCounts(elev, wet, counts0, new Map<number, TerrainId>(capCells.map((c, s) => [c, s % 2 === 0 ? 'plains' : 'forest'])));
    place('peak', peaksWanted, (i) => (pre[i] === 'mountains' ? elev[i]! : -1e9 + elev[i]!));
    place('mere', meresWanted, (i) => (pre[i] === 'swamp' ? wet[i]! - elev[i]! : -1e9 + wet[i]! - elev[i]!));
  } else {
    place('peak', peaksWanted, (i) => elev[i]!);
    place('mere', meresWanted, (i) => wet[i]! - elev[i]!);
  }
  let cellTerrain: TerrainId[] | null = null;
  {
    const counts = apportion(TERRAIN_SHARES, count);
    counts.mountains += regions.filter((r) => r.kind === 'peak').length;
    counts.swamp += regions.filter((r) => r.kind === 'mere').length;
    const fixed = new Map<number, TerrainId>(capCells.map((c, s) => [c, s % 2 === 0 ? 'plains' : 'forest']));
    for (const r of regions) fixed.set(r.cell, r.kind === 'peak' ? 'mountains' : 'swamp');
    cellTerrain = assignTerrainCounts(elev, wet, counts, fixed);
  }
  if (regions.filter((r) => r.kind === 'peak').length < peaksWanted) return fail('no room for peaks');
  if (regions.filter((r) => r.kind === 'mere').length < meresWanted) return fail('no room for meres');

  // ---- province graph
  const provinceCells = range(total).filter((i) => !removed.has(i));
  const pIndex = new Map(provinceCells.map((c, p) => [c, p]));
  let adj: Adj = provinceCells.map((c) => cadj[c]!.filter((n) => !removed.has(n)).map((n) => pIndex.get(n)!).sort((a, b) => a - b));
  const capitals = capCells.map((c) => pIndex.get(c)!);
  const capitalTerrain = new Map<number, TerrainId>(capitals.map((p, s) => [p, s % 2 === 0 ? 'plains' : 'forest']));
  const terrain = cellTerrain ? provinceCells.map((c) => cellTerrain![c]!) : assignTerrain(provinceCells.map((c) => elev[c]!), provinceCells.map((c) => wet[c]!), capitalTerrain);
  if (cellTerrain) { const want = apportion(TERRAIN_SHARES, count); for (const t of Object.keys(want) as TerrainId[]) if (terrain.filter((x) => x === t).length !== want[t]) return fail(`terrain share ${t}`); }

  // ---- ridges
  const ridges: [number, number][] = [];
  const cut = new Set<string>();
  let ridgeDetourMax = 0;
  if (withImpassable) {
    const pCapDist = capitals.map((c) => bfsDistances(adj, [c]));
    const far = (p: number) => pCapDist.every((d) => (d[p] ?? 0) >= IMP.ridgeMinCapitalDistance);
    const high = (p: number) => IMP.ridgeTerrains.includes(terrain[p]!);
    const borders: [number, number][] = [];
    let shortBorders = 0;
    for (let a = 0; a < adj.length; a++) for (const b of adj[a]!) if (a < b) {
      const ca = provinceCells[a]!, cb = provinceCells[b]!;
      const seg = sharedSegment(cells.polygons[ca]!, sites[ca]!, sites[cb]!, 1e-6 * scale);
      const longEnough = seg !== null && distance(seg[0], seg[1]) >= IMP.ridgeMinLength * scale;
      if (longEnough) borders.push([a, b]); else shortBorders++;
    }
    const wanted = Math.round((borders.length + shortBorders) * IMP.ridgeShare);
    const peakCells = new Set(regions.filter((r) => r.kind === 'peak').map((r) => r.cell));
    const touchesPeak = (a: number, b: number) => cadj[provinceCells[a]!]!.some((n) => peakCells.has(n) && cadj[provinceCells[b]!]!.includes(n));
    const peakSpurs = (a: number, b: number): number => {
      // the most ridges already touching any peak that this border touches
      let most = 0;
      for (const n of cadj[provinceCells[a]!]!) {
        if (!peakCells.has(n) || !cadj[provinceCells[b]!]!.includes(n)) continue;
        const touching = ridges.filter(([x, y]) => cadj[provinceCells[x]!]!.includes(n) && cadj[provinceCells[y]!]!.includes(n)).length;
        most = Math.max(most, touching);
      }
      return most;
    };
    const chainOf = new Map<string, number>();
    const chainLen: number[] = [];
    const touchesRidge = (a: number, b: number): number | null => {
      // a border continues a ridge when the three cells meet at one vertex
      for (const [x, y] of ridges) {
        const shared = [x, y].filter((v) => v === a || v === b);
        if (shared.length !== 1) continue;
        const other = x === shared[0] ? y : x;
        const third = a === shared[0] ? b : a;
        if (adj[other]!.includes(third) || cut.has(key(other, third))) return chainOf.get(key(x, y)) ?? null;
      }
      return null;
    };
    const valid = (a: number, b: number): boolean => {
      if (!far(a) || !far(b)) return false;
      const live = (p: number) => adj[p]!.filter((n) => !cut.has(key(p, n)) && !(p === a && n === b) && !(p === b && n === a)).length;
      if (live(a) < MAPGEN.minNeighbors || live(b) < MAPGEN.minNeighbors) return false;
      const trial = new Set([...cut, key(a, b)]);
      const d = bfsWithout(adj, a, new Set(), trial);
      if (!d.every((x) => x < Infinity)) return false;
      for (const [x, y] of [...ridges, [a, b] as [number, number]]) if (bfsWithout(adj, x, new Set(), trial)[y]! > IMP.ridgeMaxDetour) return false;
      for (const r of regions) {
        const nb = cadj[r.cell]!.filter((n) => pIndex.has(n)).map((n) => pIndex.get(n)!);
        for (const u of nb) { const du = bfsWithout(adj, u, new Set(), trial); for (const v of nb) if (v > u && du[v]! > IMP.regionMaxDetour) return false; }
      }
      if (IMP.noCutProvince && articulation(adj.map((l, p) => l.filter((n) => !trial.has(key(p, n))))) > 0) return false;
      return true;
    };
    let guard = 0;
    while (ridges.length < wanted && guard++ < 500) {
      const scored: { a: number; b: number; score: number; chain: number | null }[] = [];
      for (const [a, b] of borders) {
        if (cut.has(key(a, b))) continue;
        const peak = touchesPeak(a, b);
        if (peak && peakSpurs(a, b) >= IMP.ridgesPerRegion) continue;
        const chain = touchesRidge(a, b);
        if (chain !== null && (chainLen[chain] ?? 0) >= IMP.ridgeChainMax) continue;
        const bothHigh = high(a) && high(b);
        if (!peak && chain === null && !bothHigh) continue;
        const score = (elev[provinceCells[a]!]! + elev[provinceCells[b]!]!) / 2 + (peak ? 2 : 0) + (chain !== null ? 1 : 0) + (bothHigh ? 0.5 : 0);
        scored.push({ a, b, score, chain });
      }
      scored.sort((x, y) => y.score - x.score || x.a - y.a || x.b - y.b);
      const best = scored.find((c) => valid(c.a, c.b));
      if (!best) break;
      const { a, b } = best;
      cut.add(key(a, b));
      ridges.push([a, b]);
      const id = best.chain ?? chainLen.length;
      if (best.chain === null) chainLen.push(0);
      chainLen[id] = (chainLen[id] ?? 0) + 1;
      chainOf.set(key(a, b), id);
    }
    adj = adj.map((l, p) => l.filter((n) => !cut.has(key(p, n))));
    for (const [a, b] of ridges) ridgeDetourMax = Math.max(ridgeDetourMax, bfsDistances(adj, [a])[b]!);
  }

  // region detour on the final graph
  let regionDetourMax = 0;
  for (const r of regions) {
    const nb = cadj[r.cell]!.filter((n) => pIndex.has(n)).map((n) => pIndex.get(n)!);
    for (const a of nb) { const d = bfsDistances(adj, [a]); for (const b of nb) regionDetourMax = Math.max(regionDetourMax, d[b]!); }
  }

  const problems: string[] = [];
  if (!isConnected(adj)) problems.push('final graph not connected');
  if (adj.some((l) => l.length < MAPGEN.minNeighbors)) problems.push('province below min neighbors');
  for (const c of capitals) { const d = bfsDistances(adj, [c]); for (const o of capitals) if (o !== c && d[o]! < MAPGEN.capitalMinDistance) problems.push('capitals too close'); }
  const wells = placeWellsprings(rng, adj, capitals, wellspringCount(nations));
  if (wells === null) problems.push('no room for Wellsprings');
  for (const p of problems) FAILS.set(p, (FAILS.get(p) ?? 0) + 1);
  const pops = terrain.map((t, i) => startPopulation(rng, t, capitals.includes(i)));
  const balance = capitalBalance(adj, capitals, pops);
  return {
    ok: problems.length === 0, problems,
    width: bounds.width, height: bounds.height, outline: [...outline],
    polygons: cells.polygons, sites, provinceCells, regionCells: regions, terrain, adj, ridges, cellAdj: cadj,
    capitals, wells: wells ?? [], balance, ridgeDetourMax, regionDetourMax,
  };
}

function generate(seed: number, size: MapSizeId, nations: number, withImpassable: boolean): { map: ProtoMap | null; attempts: number } {
  const rng = createRng(seed);
  let best: ProtoMap | null = null, valid = 0, i = 0;
  const candidates = Number(process.env.BALCAND ?? MAPGEN.balanceCandidates);
  for (; i < MAPGEN.maxAttempts && valid < candidates; i++) {
    const m = attempt(rng, size, nations, withImpassable);
    if (!m.ok) continue;
    valid++;
    if (best === null || m.balance < best.balance) best = m;
    if (m.balance <= MAPGEN.capitalBalanceRatio) break;
  }
  return { map: best, attempts: i + 1 };
}

function ringStats(adj: Adj, caps: number[], terr: TerrainId[]) {
  const mid = (t: TerrainId) => (TERRAIN[t].startPop.min + TERRAIN[t].startPop.max) / 2;
  const sums = caps.map((c) => { const d = bfsDistances(adj, [c]); let s = 0, n = 0; d.forEach((x, i) => { if (i !== c && x <= 2) { s += mid(terr[i]!); n++; } }); return [s, n] as const; });
  const ss = sums.map((x) => x[0]), ns = sums.map((x) => x[1]);
  return { spread: Math.max(...ss) / Math.min(...ss) * 1000, nSpread: Math.max(...ns) - Math.min(...ns) };
}

function unfairness(adj: Adj, capitals: number[], wells: number[]): number {
  const need = wellspringsToWin(wells.length);
  const reach = capitals.map((c) => { const d = bfsDistances(adj, [c]); return wells.map((w) => d[w]!).sort((a, b) => a - b).slice(0, need).reduce((s, x) => s + x, 0); });
  return Math.max(...reach) - Math.min(...reach);
}

// ---------------------------------------------------------------- measure
const seeds = Number(process.argv[2] ?? 100);
const svgDir = process.argv[3];
const configs: [MapSizeId, number][] = (process.env.CONFIGS ?? 'small:2,medium:2,large:2,medium:3,medium:4').split(',').map((c) => { const [a, b] = c.split(':'); return [a as MapSizeId, Number(b)]; });
const pct = (xs: number[], p: number) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))]!; };
const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / Math.max(1, xs.length);

for (const [size, nations] of configs) {
  const rows = { touch: [] as number[], ranges: [] as number[], ringSpread: [] as number[], ringN: [] as number[], fail: 0, attempts: [] as number[], peaks: [] as number[], meres: [] as number[], ridges: [] as number[], ridgeWanted: [] as number[],
    bal: [] as number[], capHops: [] as number[], capDays: [] as number[], cut: [] as number[], within: 0, unfair: [] as number[], deg: [] as number[], rDet: [] as number[], gDet: [] as number[], ms: [] as number[] };
  const base = { ringSpread: [] as number[], ringN: [] as number[], bal: [] as number[], capHops: [] as number[], capDays: [] as number[], cut: [] as number[], within: 0, unfair: [] as number[], deg: [] as number[], ms: [] as number[] };
  for (let seed = 1; seed <= seeds; seed++) {
    const caps = range(nations).map((k) => ({ color: (k % 2 ? 'G' : 'R') as 'R' | 'G', terrain: (k % 2 ? 'forest' : 'plains') as TerrainId, name: `Cap${k}` }));
    let t0 = performance.now();
    const bm = generateMap({ seed, size, capitals: caps });
    base.ms.push(performance.now() - t0);
    const ids = Object.keys(bm.provinces);
    const ix = new Map(ids.map((id, i) => [id, i]));
    const badj = ids.map((id) => bm.provinces[id as keyof typeof bm.provinces]!.neighbors.map((n) => ix.get(n)!));
    const bterr = ids.map((id) => bm.provinces[id as keyof typeof bm.provinces]!.terrain);
    const bcap = bm.capitals.map((c) => ix.get(c)!);
    const bpops = ids.map((id) => bm.provinces[id as keyof typeof bm.provinces]!.startPop);
    let minH = Infinity, minD = Infinity;
    for (const a of bcap) for (const b of bcap) if (a < b) { minH = Math.min(minH, bfsDistances(badj, [a])[b]!); minD = Math.min(minD, dijkstraDays(badj, bterr, a, b)); }
    base.capHops.push(minH); base.capDays.push(minD); base.cut.push(articulation(badj));
    { const r = ringStats(badj, bcap, bterr); base.ringSpread.push(r.spread); base.ringN.push(r.nSpread); }
    const bb = capitalBalance(badj, bcap, bpops); base.bal.push(bb); if (bb <= MAPGEN.capitalBalanceRatio) base.within++;
    base.unfair.push(unfairness(badj, bcap, bm.wellsprings.map((w) => ix.get(w)!)));
    base.deg.push(mean(badj.map((l) => l.length)));

    t0 = performance.now();
    const { map: m, attempts } = generate(seed, size, nations, true);
    rows.ms.push(performance.now() - t0);
    if (!m) { rows.fail++; continue; }
    rows.attempts.push(attempts);
    rows.peaks.push(m.regionCells.filter((r) => r.kind === 'peak').length);
    rows.meres.push(m.regionCells.filter((r) => r.kind === 'mere').length);
    rows.ridges.push(m.ridges.length);
    { const t = new Set<number>(); const pi = new Map(m.provinceCells.map((c, p) => [c, p]));
      for (const r of m.regionCells) for (const p of m.provinceCells) { /* adjacency via polygons */ }
      for (const [a, b] of m.ridges) { t.add(a); t.add(b); }
      for (const r of m.regionCells) for (let p = 0; p < m.provinceCells.length; p++) if (m.cellAdj[r.cell]!.includes(m.provinceCells[p]!)) t.add(p);
      rows.touch.push(t.size / m.provinceCells.length);
      const peaks = m.regionCells.filter((r) => r.kind === 'peak').map((r) => r.cell); const seen = new Set<number>(); let ranges = 0;
      for (const c of peaks) { if (seen.has(c)) continue; ranges++; const q = [c]; seen.add(c); for (let h = 0; h < q.length; h++) for (const n of m.cellAdj[q[h]!]!) if (peaks.includes(n) && !seen.has(n)) { seen.add(n); q.push(n); } }
      rows.ranges.push(ranges); void pi; }
    let bh = 0; for (let a = 0; a < m.adj.length; a++) bh += m.adj[a]!.length; rows.ridgeWanted.push(Math.round((bh / 2 + m.ridges.length) * IMP.ridgeShare));
    let mh = Infinity, md = Infinity;
    for (const a of m.capitals) for (const b of m.capitals) if (a < b) { mh = Math.min(mh, bfsDistances(m.adj, [a])[b]!); md = Math.min(md, dijkstraDays(m.adj, m.terrain, a, b)); }
    rows.capHops.push(mh); rows.capDays.push(md); rows.cut.push(articulation(m.adj));
    { const r = ringStats(m.adj, m.capitals, m.terrain); rows.ringSpread.push(r.spread); rows.ringN.push(r.nSpread); }
    rows.bal.push(m.balance); if (m.balance <= MAPGEN.capitalBalanceRatio) rows.within++;
    rows.unfair.push(unfairness(m.adj, m.capitals, m.wells));
    rows.deg.push(mean(m.adj.map((l) => l.length)));
    rows.rDet.push(m.ridgeDetourMax); rows.gDet.push(m.regionDetourMax);
    if (svgDir && size === 'medium' && nations === 2 && seed <= 4) writeSvg(m, `${svgDir}/proto-medium-s${seed}.svg`);
    if (svgDir && size === 'medium' && nations === 2 && seed <= 4) writeFileSync(`${svgDir}/proto-medium-s${seed}.json`, JSON.stringify({
      width: m.width, height: m.height, outline: m.outline,
      provinces: m.provinceCells.map((c, p) => ({ i: p, polygon: m.polygons[c], site: m.sites[c], center: centroid(m.polygons[c]!), terrain: m.terrain[p], neighbors: m.adj[p], cap: m.capitals.indexOf(p), well: m.wells.includes(p) })),
      regions: m.regionCells.map((r) => ({ kind: r.kind, polygon: m.polygons[r.cell], center: centroid(m.polygons[r.cell]!), borders: m.cellAdj[r.cell]!.filter((n) => m.provinceCells.includes(n)).map((n) => m.provinceCells.indexOf(n)) })),
      ridges: m.ridges.map(([a, b]) => { const ca = m.provinceCells[a]!, cb = m.provinceCells[b]!; return { a, b, seg: sharedSegment(m.polygons[ca]!, m.sites[ca]!, m.sites[cb]!, 1e-6 * Math.sqrt(MAPGEN.provinceArea)) }; }),
    }));
  }
  const n = seeds - rows.fail;
  console.log(`\n== ${size}, ${nations} nations, ${seeds} seeds (provinces ${provinceCount(size, nations)})`);
  console.log(`  new: failed ${rows.fail}; attempts mean ${mean(rows.attempts).toFixed(2)}, p95 ${pct(rows.attempts, 0.95)}; gen ms mean ${mean(rows.ms).toFixed(0)} (baseline ${mean(base.ms).toFixed(0)})`);
  console.log(`  regions: peaks mean ${mean(rows.peaks).toFixed(2)}, meres mean ${mean(rows.meres).toFixed(2)}; ridges mean ${mean(rows.ridges).toFixed(2)} of wanted ${mean(rows.ridgeWanted).toFixed(2)} (min ${Math.min(...rows.ridges)})`);
  console.log(`  capital-capital hops min: baseline mean ${mean(base.capHops).toFixed(2)} | new ${mean(rows.capHops).toFixed(2)}; days at speed 2: ${mean(base.capDays).toFixed(1)} | ${mean(rows.capDays).toFixed(1)}`);
  console.log(`  cut provinces (articulation points): baseline mean ${mean(base.cut).toFixed(2)} | new ${mean(rows.cut).toFixed(2)}`);
  console.log(`  balance within 1.5: baseline ${(100 * base.within / seeds).toFixed(0)}% (mean ratio ${mean(base.bal).toFixed(3)}, p95 ${pct(base.bal, 0.95).toFixed(2)}) | new ${(100 * rows.within / n).toFixed(0)}% (mean ${mean(rows.bal).toFixed(3)}, p95 ${pct(rows.bal, 0.95).toFixed(2)})`);
  console.log(`  Wellspring unfairness (hops): baseline mean ${mean(base.unfair).toFixed(2)} max ${Math.max(...base.unfair)} | new mean ${mean(rows.unfair).toFixed(2)} max ${Math.max(...rows.unfair)}`);
  console.log(`  mean passable neighbors: baseline ${mean(base.deg).toFixed(2)} | new ${mean(rows.deg).toFixed(2)}`);
  console.log(`  ring mean pop-weight (sum of terrain mid-pop in 2-hop rings): baseline spread ${mean(base.ringSpread).toFixed(0)} | new ${mean(rows.ringSpread).toFixed(0)}; ring sizes spread baseline ${mean(base.ringN).toFixed(2)} | new ${mean(rows.ringN).toFixed(2)}`);
  console.log(`  provinces touching impassable terrain: ${(100 * mean(rows.touch)).toFixed(0)}%; peak ranges (connected peak groups) mean ${mean(rows.ranges).toFixed(2)}`);
  console.log(`  attempt failures: ${[...FAILS].map(([k, v]) => `${k} ${v}`).join(', ')}`); FAILS.clear();
  console.log(`  max ridge detour p95 ${pct(rows.rDet, 0.95)} max ${Math.max(...rows.rDet)}; max region detour p95 ${pct(rows.gDet, 0.95)} max ${Math.max(...rows.gDet)}`);
}

function writeSvg(m: ProtoMap, path: string) {
  const W = m.width, H = m.height;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 ${W + 20} ${H + 20}" width="${(W + 20) * 1.4}" height="${(H + 20) * 1.4}">`;
  s += `<rect x="-10" y="-10" width="${W + 20}" height="${H + 20}" fill="#6B5034"/>`;
  s += `<polygon points="${m.outline.map((p) => `${p.x},${p.y}`).join(' ')}" fill="#E8DCC2"/>`;
  const pts = (poly: Point[]) => poly.map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(' ');
  m.provinceCells.forEach((c, p) => { s += `<polygon points="${pts(m.polygons[c]!)}" fill="${TERRAIN[m.terrain[p]!].fill}" stroke="#2B2620" stroke-width="1"/>`; });
  for (const r of m.regionCells) {
    const poly = m.polygons[r.cell]!;
    s += `<polygon points="${pts(poly)}" fill="${r.kind === 'peak' ? '#E9E4DA' : '#16303A'}" stroke="#1C1A17" stroke-width="2.5"/>`;
    const c = centroid(poly);
    if (r.kind === 'peak') for (let k = -1; k <= 1; k++) s += `<path d="M${c.x + k * 18 - 12},${c.y + 10} L${c.x + k * 18},${c.y - 14 + Math.abs(k) * 6} L${c.x + k * 18 + 12},${c.y + 10} Z" fill="#9AA3A8" stroke="#1C1A17" stroke-width="1.5"/>`;
    else s += `<path d="M${c.x - 20},${c.y} q10,-5 20,0 t20,0 M${c.x - 14},${c.y + 9} q7,-4 14,0 t14,0" stroke="#7FB0C0" stroke-width="1.5" fill="none"/>`;
  }
  const scale = Math.sqrt(MAPGEN.provinceArea);
  for (const [a, b] of m.ridges) {
    const ca = m.provinceCells[a]!, cb = m.provinceCells[b]!;
    const seg = sharedSegment(m.polygons[ca]!, m.sites[ca]!, m.sites[cb]!, 1e-6 * scale);
    if (!seg) continue;
    const [p, q] = seg;
    const len = distance(p, q), n = Math.max(2, Math.round(len / 9));
    const nx = -(q.y - p.y) / len, ny = (q.x - p.x) / len;
    s += `<line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}" stroke="#1C1A17" stroke-width="6" stroke-linecap="round"/>`;
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / n, x = p.x + (q.x - p.x) * t, y = p.y + (q.y - p.y) * t;
      s += `<path d="M${x - 5},${y + 3} L${x + nx * 0 },${y - 9} L${x + 5},${y + 3} Z" fill="#B8BFC4" stroke="#1C1A17" stroke-width="1.2"/>`;
    }
  }
  for (let a = 0; a < m.adj.length; a++) for (const b of m.adj[a]!) if (a < b) {
    const pa = centroid(m.polygons[m.provinceCells[a]!]!), pb = centroid(m.polygons[m.provinceCells[b]!]!);
    s += `<line x1="${pa.x}" y1="${pa.y}" x2="${pb.x}" y2="${pb.y}" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="0.8"/>`;
  }
  for (const c of m.capitals) { const p = centroid(m.polygons[m.provinceCells[c]!]!); s += `<circle cx="${p.x}" cy="${p.y}" r="9" fill="#FD6533" stroke="#1C1A17" stroke-width="2"/>`; }
  for (const w of m.wells) { const p = centroid(m.polygons[m.provinceCells[w]!]!); s += `<circle cx="${p.x}" cy="${p.y}" r="12" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-dasharray="4 3"/>`; }
  s += '</svg>';
  writeFileSync(path, s);
}
