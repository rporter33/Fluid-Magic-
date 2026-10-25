import { COLOR_DEFS, COLORS } from '/home/user/Fluid-Magic-/src/content/colors';
import { TERRAIN, TERRAIN_IDS } from '/home/user/Fluid-Magic-/src/content/terrain';
import { deltaE2000, labAs, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath';
const border = '#2B2620';
for (const c of COLORS) {
  const p = COLOR_DEFS[c].palette.primary;
  const rows: string[] = [];
  for (const t of [...TERRAIN_IDS]) {
    const f = TERRAIN[t].fill;
    const d = VISIONS.map(v => deltaE2000(labAs(p, v), labAs(f, v)));
    const fail = d.some((x, i) => x < (i === 0 ? 20 : 12));
    rows.push(`${t.padEnd(10)} ${d.map(x => x.toFixed(1).padStart(5)).join(' ')}${fail ? '  FAIL' : ''}`);
  }
  const db = VISIONS.map(v => deltaE2000(labAs(p, v), labAs(border, v)));
  rows.push(`border     ${db.map(x => x.toFixed(1).padStart(5)).join(' ')}`);
  console.log(`== ${c} ${p}  (normal protan deutan tritan)\n` + rows.join('\n'));
}
