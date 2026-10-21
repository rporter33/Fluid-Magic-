// How big a map is: province count from size and nation count, and the map rectangle.
import { MAP_SIZES, MAPGEN, type MapSizeId } from '../content/mapgen';

/** MAP_SIZES[size].provinces plus MAPGEN.provincesPerExtraNation per nation beyond baseNations. */
export function provinceCount(size: MapSizeId, nations: number): number {
  const extra = Math.max(0, nations - MAPGEN.baseNations);
  return MAP_SIZES[size].provinces + MAPGEN.provincesPerExtraNation * extra;
}

/** MAPGEN.wellspringsBase up to baseNations nations, wellspringsAboveBase beyond. */
export function wellspringCount(nations: number): number {
  return nations <= MAPGEN.baseNations ? MAPGEN.wellspringsBase : MAPGEN.wellspringsAboveBase;
}

/** Map rectangle with MAPGEN.aspect, sized to MAPGEN.provinceArea per province. */
export function mapDimensions(provinces: number): { width: number; height: number } {
  const height = Math.sqrt((provinces * MAPGEN.provinceArea) / MAPGEN.aspect);
  return { width: height * MAPGEN.aspect, height };
}
