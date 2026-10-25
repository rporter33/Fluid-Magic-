import { generateMap } from '../../../../../home/user/Fluid-Magic-/src/mapgen/generate';
const R = { color: 'R', terrain: 'plains', name: 'Kharnath' } as const, G = { color: 'G', terrain: 'forest', name: 'Deepmoss' } as const;
const HIGH = new Set(['mountains', 'hills']); const WET = new Set(['forest', 'swamp', 'farmland']);
for (const label of ['real']) {
  let hh = 0, ht = 0, ww = 0, wt = 0;
  for (let seed = 1; seed <= 20; seed++) {
    const m = generateMap({ seed, size: 'medium', capitals: [R, G] });
    for (const p of Object.values(m.provinces)) for (const n of p.neighbors) {
      const q = m.provinces[n]!;
      if (HIGH.has(p.terrain)) { ht++; if (HIGH.has(q.terrain)) hh++; }
      if (WET.has(p.terrain)) { wt++; if (WET.has(q.terrain)) ww++; }
    }
  }
  console.log(label, 'highland->highland', (hh / ht).toFixed(3), 'wet->wet', (ww / wt).toFixed(3));
}
