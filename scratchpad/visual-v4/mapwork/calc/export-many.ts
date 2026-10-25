// Export many mapgen maps (polygons and terrain only) for the terrain-share measurement. Read-only use of mapgen.
import { writeFileSync } from 'node:fs';
import { generateMap } from '/home/user/Fluid-Magic-/src/mapgen/generate.ts';
import { FOUR_CAPITALS, TWO_CAPITALS } from '/home/user/Fluid-Magic-/tests/mapgen/fixtures.ts';
const out: unknown[] = [];
for (const size of ['small', 'medium', 'large'] as const) for (const caps of [TWO_CAPITALS, FOUR_CAPITALS]) for (let seed = 1; seed <= 10; seed++) {
  const m = generateMap({ seed, size, capitals: caps, wilds: true });
  out.push({ seed, size, nations: caps.length, width: m.width, height: m.height, provinces: Object.values(m.provinces).map((p) => ({ terrain: p.terrain, polygon: p.polygon.map((q) => [q.x, q.y]) })), wilds: m.wilds.map((w) => w.cells.map((c) => c.map((q) => [q.x, q.y]))) });
}
writeFileSync(process.argv[2]!, JSON.stringify(out)); console.log(out.length, 'maps');
