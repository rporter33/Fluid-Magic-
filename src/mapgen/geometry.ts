// Plane geometry for map cells. Polygons are open point lists (last != first) with
// positive shoelace area, which is counterclockwise with y up (clockwise on screen).
import type { Point } from './types';

/** Shoelace area; positive for the orientation used throughout mapgen. */
export function signedArea(polygon: readonly Point[]): number {
  let sum = 0;
  for (let i = 0; i < polygon.length; i++) {
    const p = polygon[i] as Point;
    const q = polygon[(i + 1) % polygon.length] as Point;
    sum += p.x * q.y - q.x * p.y;
  }
  return sum / 2;
}

/** Returns the polygon with positive signed area, reversing a copy if needed. */
export function orientPositive(polygon: readonly Point[]): Point[] {
  return signedArea(polygon) < 0 ? [...polygon].reverse() : [...polygon];
}

/** Area centroid. Falls back to the vertex mean for degenerate polygons. */
export function centroid(polygon: readonly Point[]): Point {
  const area = signedArea(polygon);
  if (Math.abs(area) < 1e-9) {
    const n = Math.max(polygon.length, 1);
    return {
      x: polygon.reduce((s, p) => s + p.x, 0) / n,
      y: polygon.reduce((s, p) => s + p.y, 0) / n,
    };
  }
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < polygon.length; i++) {
    const p = polygon[i] as Point;
    const q = polygon[(i + 1) % polygon.length] as Point;
    const cross = p.x * q.y - q.x * p.y;
    cx += (p.x + q.x) * cross;
    cy += (p.y + q.y) * cross;
  }
  return { x: cx / (6 * area), y: cy / (6 * area) };
}

/** A rectangle from (0, 0) to (width, height) with corners rounded by `radius`. */
export function roundedRect(
  width: number,
  height: number,
  radius: number,
  segmentsPerCorner: number,
): Point[] {
  const r = Math.min(radius, width / 2, height / 2);
  // Corner centers and the angle each arc starts at, walking with positive area.
  const corners: readonly [number, number, number][] = [
    [width - r, r, -Math.PI / 2],
    [width - r, height - r, 0],
    [r, height - r, Math.PI / 2],
    [r, r, Math.PI],
  ];
  const points: Point[] = [];
  for (const [cx, cy, start] of corners) {
    for (let s = 0; s <= segmentsPerCorner; s++) {
      const angle = start + (s / segmentsPerCorner) * (Math.PI / 2);
      points.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
    }
  }
  return points;
}

/** Cross product of (b - a) and (p - a); positive when p is left of a->b. */
function cross(a: Point, b: Point, p: Point): number {
  return (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
}

/** True when `p` is inside or on the convex polygon `clip` (positive orientation). */
export function insideConvex(clip: readonly Point[], p: Point): boolean {
  for (let i = 0; i < clip.length; i++) {
    if (cross(clip[i] as Point, clip[(i + 1) % clip.length] as Point, p) < 0) return false;
  }
  return true;
}

/**
 * Sutherland-Hodgman: intersection of `subject` with the convex polygon `clip`. Both must
 * have positive orientation. Returns an empty list when they do not overlap.
 */
export function clipConvex(subject: readonly Point[], clip: readonly Point[]): Point[] {
  let output: Point[] = [...subject];
  for (let i = 0; i < clip.length && output.length > 0; i++) {
    const a = clip[i] as Point;
    const b = clip[(i + 1) % clip.length] as Point;
    const input = output;
    output = [];
    for (let j = 0; j < input.length; j++) {
      const p = input[j] as Point;
      const q = input[(j + 1) % input.length] as Point;
      const cp = cross(a, b, p);
      const cq = cross(a, b, q);
      if (cp >= 0) output.push(p);
      if (cp >= 0 !== cq >= 0) {
        const t = cp / (cp - cq);
        output.push({ x: p.x + t * (q.x - p.x), y: p.y + t * (q.y - p.y) });
      }
    }
  }
  return dedupeVertices(output);
}

/** Drops consecutive vertices closer than `eps`, including the wrap-around pair. */
export function dedupeVertices(polygon: readonly Point[], eps = 1e-9): Point[] {
  const out: Point[] = [];
  for (const p of polygon) {
    const last = out[out.length - 1];
    if (last === undefined || Math.hypot(p.x - last.x, p.y - last.y) > eps) out.push(p);
  }
  while (out.length > 1) {
    const first = out[0] as Point;
    const last = out[out.length - 1] as Point;
    if (Math.hypot(first.x - last.x, first.y - last.y) > eps) break;
    out.pop();
  }
  return out;
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Distance from `p` to the segment a-b. */
export function segmentDistance(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length2 = dx * dx + dy * dy;
  const t = length2 === 0 ? 0 : ((p.x - a.x) * dx + (p.y - a.y) * dy) / length2;
  const clamped = Math.min(1, Math.max(0, t));
  return Math.hypot(p.x - (a.x + clamped * dx), p.y - (a.y + clamped * dy));
}

/** True when a vertex of `polygon` lies within `tolerance` of the closed `outline`. */
export function touchesOutline(
  polygon: readonly Point[],
  outline: readonly Point[],
  tolerance: number,
): boolean {
  return polygon.some((p) =>
    outline.some(
      (a, k) => segmentDistance(p, a, outline[(k + 1) % outline.length] as Point) <= tolerance,
    ),
  );
}

/**
 * Length of boundary two polygons share: the overlap of their collinear edges, within
 * `tolerance`. Measures the drawn border, so it needs no Voronoi sites.
 */
export function sharedEdgeLength(
  a: readonly Point[],
  b: readonly Point[],
  tolerance: number,
): number {
  let total = 0;
  a.forEach((p, i) => {
    const q = a[(i + 1) % a.length] as Point;
    const length = distance(p, q);
    if (length === 0) return;
    const ux = (q.x - p.x) / length;
    const uy = (q.y - p.y) / length;
    const offLine = (r: Point) => Math.abs((r.x - p.x) * uy - (r.y - p.y) * ux);
    const along = (r: Point) => (r.x - p.x) * ux + (r.y - p.y) * uy;
    b.forEach((r, j) => {
      const s = b[(j + 1) % b.length] as Point;
      if (offLine(r) > tolerance || offLine(s) > tolerance) return;
      const lo = Math.max(0, Math.min(along(r), along(s)));
      const hi = Math.min(length, Math.max(along(r), along(s)));
      if (hi > lo) total += hi - lo;
    });
  });
  return total;
}

/** Points closer than this, in map units, are one point to wildOutline. */
const OUTLINE_EPS = 1e-6;

/**
 * The boundary loops of a wild range (Phase 1b): its cells' edges that no other cell of the
 * same range shares, chained end to start. Each loop is open (last != first) and runs with
 * positive area, like the cells. The renderer draws the contour and hit-tests along them.
 */
export function wildOutline(wild: { readonly cells: readonly (readonly Point[])[] }): Point[][] {
  const same = (p: Point, q: Point) => distance(p, q) <= OUTLINE_EPS;
  const edges: { from: Point; to: Point; cell: number }[] = [];
  wild.cells.forEach((polygon, cell) => {
    polygon.forEach((from, k) => {
      edges.push({ from, to: polygon[(k + 1) % polygon.length] as Point, cell });
    });
  });
  // An edge two cells of the range share runs once each way.
  const outer = edges.filter(
    (e) => !edges.some((f) => f.cell !== e.cell && same(e.from, f.to) && same(e.to, f.from)),
  );
  const used = new Array<boolean>(outer.length).fill(false);
  const loops: Point[][] = [];
  for (let first = 0; first < outer.length; first++) {
    const loop: Point[] = [];
    for (let at = first; at >= 0 && !used[at];) {
      used[at] = true;
      const edge = outer[at] as (typeof outer)[number];
      loop.push(edge.from);
      at = outer.findIndex((f, k) => !used[k] && same(edge.to, f.from));
    }
    if (loop.length > 0) loops.push(loop);
  }
  return loops;
}
