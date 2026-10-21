// The generated map: static geometry and adjacency plus the starting values each province
// begins the game with. createGame (Phase 2) copies the starting values into ProvinceState.
import type { Color } from '../content/colors';
import type { MapSizeId } from '../content/mapgen';
import type { ScaleStep } from '../content/pretenders/scales';
import type { TerrainId } from '../content/terrain';
import type { ProvinceId } from '../sim/ids';

export interface Point {
  x: number;
  y: number;
}

/** What the generator needs to know about each nation's capital, in nation order. */
export interface CapitalSpec {
  /** The nation's color; the capital holds springs of it. */
  color: Color;
  /** The capital province's terrain (Kharnath is Plains, Deepmoss is Forest). */
  terrain: TerrainId;
  /** The capital's name, reserved so no generated province shares it. */
  name: string;
}

export interface MapGenParams {
  seed: number;
  size: MapSizeId;
  /** One entry per nation, 2 to 4. */
  capitals: readonly CapitalSpec[];
}

export interface MapProvince {
  id: ProvinceId;
  name: string;
  terrain: TerrainId;
  /** Voronoi site of the cell. */
  site: Point;
  /** Area centroid of the polygon; where the label and army markers go. */
  center: Point;
  /** Convex cell outline, counterclockwise in y-up terms, not closed (last != first). */
  polygon: Point[];
  /** Adjacent provinces, sorted by id number. */
  neighbors: ProvinceId[];
  /** Graph distance to the nearest capital; 0 for capitals. */
  capitalDistance: number;
  /** Index into MapData.capitals when this province is a capital. */
  capitalSlot?: number;
  /** Present when the province holds a Wellspring: the scale step it grants. */
  wellspring?: ScaleStep;
  startPop: number;
  /** One entry per spring, by color. */
  springs: Color[];
  /** Independent defender troop count at game start; 0 for capitals. */
  independentStrength: number;
}

export interface MapData {
  seed: number;
  size: MapSizeId;
  width: number;
  height: number;
  /** The rounded-rectangle map border, counterclockwise in y-up terms. */
  outline: Point[];
  /** Keyed by id; insertion order is p0, p1, ... */
  provinces: Record<ProvinceId, MapProvince>;
  /** Capital province per nation slot, in the order of MapGenParams.capitals. */
  capitals: ProvinceId[];
  wellsprings: ProvinceId[];
}
