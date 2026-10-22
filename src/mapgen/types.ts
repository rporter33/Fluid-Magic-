// The generated map: static geometry and adjacency plus the starting values each province
// begins the game with. createGame (Phase 2) copies the starting values into ProvinceState.
import type { Color } from '../content/colors';
import type { MapSizeId, WildKind } from '../content/mapgen';
import type { ScaleStep } from '../content/pretenders/scales';
import type { TerrainId } from '../content/terrain';
import type { ProvinceId, WildId } from '../sim/ids';

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
  /**
   * Impassable wild ranges (Phase 1b). Absent or false: none, and every step and draw is the
   * generator's from before wilds existed. New Game turns them on (GameSetup.wilds).
   */
  wilds?: boolean;
}

export interface MapProvince {
  id: ProvinceId;
  name: string;
  terrain: TerrainId;
  /** Voronoi site of the cell. */
  site: Point;
  /** Area centroid of the polygon; where the label and army markers go. */
  center: Point;
  /**
   * Convex cell outline with positive shoelace area (counterclockwise with y up), open
   * (last != first), at full coordinate precision.
   */
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

/**
 * An impassable wild range (Phase 1b): map cells that are not provinces. No one owns, enters,
 * crosses or targets it; it is never in MapProvince.neighbors.
 */
export interface MapWild {
  id: WildId;
  kind: WildKind;
  /** The bare name ("Ashspine"); text gives it "the". Unique against every province name. */
  name: string;
  /** The range's cells, each convex and positively oriented like MapProvince.polygon. */
  cells: Point[][];
  /** Label anchor: the centroid of the largest cell. */
  center: Point;
  /** Provinces that share a border segment with any of its cells, sorted by id number. */
  borders: ProvinceId[];
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
  /** Impassable wild ranges, w0, w1, ...; [] when MapGenParams.wilds is off. Always last. */
  wilds: MapWild[];
}
