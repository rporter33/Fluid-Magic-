import { MAPGEN } from '../../../../../home/user/Fluid-Magic-/src/content/mapgen';
import { generateMap } from '../../../../../home/user/Fluid-Magic-/src/mapgen/generate';
const R = { color: 'R', terrain: 'plains', name: 'Kharnath' } as const, G = { color: 'G', terrain: 'forest', name: 'Deepmoss' } as const;
for (const f of [2.5, 2, 1.5, 1.2]) {
  (MAPGEN as any).noiseFeatures = f;
  for (const oct of [3, 2]) {
    (MAPGEN as any).noiseOctaves = oct;
    let tot = 0, same = 0, comps = 0, n = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const m = generateMap({ seed, size: 'medium', capitals: [R, G] });
      const ps = Object.values(m.provinces);
      ps.forEach(p => p.neighbors.forEach(nb => { tot++; if (m.provinces[nb]!.terrain === p.terrain) same++; }));
      // count connected components of same terrain (fewer = more clustered)
      const seen = new Set<string>();
      for (const p of ps) { if (seen.has(p.id)) continue; comps++; const st = [p.id]; seen.add(p.id); while (st.length) { const q = m.provinces[st.pop()!]!; for (const nb of q.neighbors) if (!seen.has(nb) && m.provinces[nb]!.terrain === q.terrain) { seen.add(nb); st.push(nb); } } }
      n++;
    }
    console.log(`features=${f} octaves=${oct}: sameNeighbor=${(same / tot).toFixed(3)} terrainRegions/map=${(comps / n).toFixed(1)}`);
  }
}
