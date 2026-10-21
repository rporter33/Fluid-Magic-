// Terrain by rank: noise gives each province an elevation and a moisture, and terrains are
// handed out in order so every map gets the shares in content/mapgen.ts exactly (capitals
// included) while the noise keeps similar terrain clustered into ranges, forests, and marshes.
import { TERRAIN_SHARES } from '../content/mapgen';
import { TERRAIN_IDS, type TerrainId } from '../content/terrain';

/**
 * Splits `total` into integer counts proportional to `shares` (largest remainder; ties go
 * to the earlier key in TERRAIN_IDS).
 */
export function apportion(
  shares: Readonly<Record<TerrainId, number>>,
  total: number,
): Record<TerrainId, number> {
  const sum = TERRAIN_IDS.reduce((s, id) => s + shares[id], 0);
  const exact = TERRAIN_IDS.map((id) => (shares[id] / sum) * total);
  const counts = exact.map(Math.floor);
  let remaining = total - counts.reduce((s, c) => s + c, 0);
  const remainder = (i: number) => (exact[i] ?? 0) - (counts[i] ?? 0);
  const byRemainder = TERRAIN_IDS.map((_, i) => i).sort(
    (a, b) => remainder(b) - remainder(a) || a - b,
  );
  for (const i of byRemainder) {
    if (remaining <= 0) break;
    counts[i] = (counts[i] ?? 0) + 1;
    remaining--;
  }
  const result = {} as Record<TerrainId, number>;
  TERRAIN_IDS.forEach((id, i) => (result[id] = counts[i] ?? 0));
  return result;
}

/**
 * Assigns terrain from per-province elevation and moisture (any scale, higher is higher or
 * wetter). Provinces in `fixed` (capitals) keep their terrain and count against its share.
 * The rest go in order: mountains then hills by elevation; swamp by wetness minus
 * elevation; forest by moisture; wasteland by dryness; farmland by moisture; plains last.
 */
export function assignTerrain(
  elevation: readonly number[],
  moisture: readonly number[],
  fixed: ReadonlyMap<number, TerrainId> = new Map(),
): TerrainId[] {
  const n = elevation.length;
  const counts = apportion(TERRAIN_SHARES, n);
  const result = new Array<TerrainId | undefined>(n).fill(undefined);
  for (const [i, terrain] of fixed) {
    result[i] = terrain;
    counts[terrain] = Math.max(0, counts[terrain] - 1);
  }

  const take = (terrain: TerrainId, score: (i: number) => number) => {
    const open = result.flatMap((t, i) => (t === undefined ? [i] : []));
    // Highest score first; lower index wins ties so the order is fully determined.
    open.sort((a, b) => score(b) - score(a) || a - b);
    for (const i of open.slice(0, counts[terrain])) result[i] = terrain;
  };

  const elev = (i: number) => elevation[i] ?? 0;
  const wet = (i: number) => moisture[i] ?? 0;
  take('mountains', elev);
  take('hills', elev);
  take('swamp', (i) => wet(i) - elev(i));
  take('forest', wet);
  take('wasteland', (i) => -wet(i));
  take('farmland', wet);
  return result.map((t) => t ?? 'plains');
}
