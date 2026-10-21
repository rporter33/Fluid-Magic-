// How big a map is: province count from size and nation count, and the map rectangle.
import { MAP_SIZES, MAPGEN, type MapSizeId } from '../content/mapgen';

/** Provinces for `nations` nations: the size's two-nation count plus 25 per extra nation. */
export function provinceCount(size: MapSizeId, nations: number): number {
  return MAP_SIZES[size].provinces + MAPGEN.provincesPerExtraNation * Math.max(0, nations - 2);
}

/** Wellsprings: 3 for two nations, 5 for three or four. */
export function wellspringCount(nations: number): number {
  return nations <= 2 ? MAPGEN.wellspringsTwoNations : MAPGEN.wellspringsMoreNations;
}

/** Map rectangle with the configured aspect, sized to `provinceArea` per province. */
export function mapDimensions(provinces: number): { width: number; height: number } {
  const height = Math.sqrt((provinces * MAPGEN.provinceArea) / MAPGEN.aspect);
  return { width: height * MAPGEN.aspect, height };
}
