import { COLOR_DEFS } from '/home/user/Fluid-Magic-/src/content/colors';
import { TERRAIN, TERRAIN_IDS } from '/home/user/Fluid-Magic-/tests/../src/content/terrain';
import { deltaE2000, labAs, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath';
const minDE = (a: string, b: string) => Math.min(...VISIONS.map((v, i) => deltaE2000(labAs(a, v), labAs(b, v)) * (i === 0 ? 12 / 20 : 1)));
const steps = (c: 'R' | 'G') => Object.entries(COLOR_DEFS[c].palette);
for (const t of TERRAIN_IDS) {
  const fill = TERRAIN[t].fill;
  const pick = (c: 'R' | 'G') => steps(c).map(([k, h]) => ({ k, h, s: minDE(h, fill) })).sort((x, y) => y.s - x.s)[0]!;
  const r = pick('R'), g = pick('G');
  console.log(t.padEnd(10), 'R', r.k, r.s.toFixed(1), ' G', g.k, g.s.toFixed(1), ' R-vs-G', minDE(r.h, g.h).toFixed(1));
}
