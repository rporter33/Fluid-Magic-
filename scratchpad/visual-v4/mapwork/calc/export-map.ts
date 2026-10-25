// Export one real mapgen map (with wilds) as JSON for the preview renderer. Read-only use of the repo's mapgen.
// Run from the repo root: npx tsx export-map.ts <seed> <size> <out.json>
import { writeFileSync } from 'node:fs';
import { generateMap } from '/home/user/Fluid-Magic-/src/mapgen/generate.ts';
import { TWO_CAPITALS } from '/home/user/Fluid-Magic-/tests/mapgen/fixtures.ts';
const [seedS = '3', size = 'medium', out = 'map.json'] = process.argv.slice(2);
const map = generateMap({ seed: Number(seedS), size: size as 'medium', capitals: TWO_CAPITALS, wilds: true });
writeFileSync(out, JSON.stringify({ seed: map.seed, width: map.width, height: map.height, outline: map.outline, capitals: map.capitals, wellsprings: map.wellsprings,
  provinces: Object.values(map.provinces).map((p) => ({ id: p.id, name: p.name, terrain: p.terrain, center: p.center, polygon: p.polygon, neighbors: p.neighbors, startPop: p.startPop, capitalSlot: p.capitalSlot ?? null, wellspring: p.wellspring ?? null })),
  wilds: map.wilds.map((w) => ({ id: w.id, kind: w.kind, name: w.name, cells: w.cells, center: w.center, borders: w.borders })) }));
console.log(`${Object.keys(map.provinces).length} provinces, ${map.wilds.length} wilds, ${map.width.toFixed(0)} x ${map.height.toFixed(0)}; capitals ${map.capitals.join(' ')}; outline x ${Math.min(...map.outline.map((p) => p.x)).toFixed(0)}..${Math.max(...map.outline.map((p) => p.x)).toFixed(0)} y ${Math.min(...map.outline.map((p) => p.y)).toFixed(0)}..${Math.max(...map.outline.map((p) => p.y)).toFixed(0)}`);
