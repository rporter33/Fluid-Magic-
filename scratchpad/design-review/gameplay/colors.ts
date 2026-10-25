import { COLOR_DEFS } from '/home/user/Fluid-Magic-/src/content/colors';
import { TERRAIN, TERRAIN_IDS } from '/home/user/Fluid-Magic-/src/content/terrain';
import { deltaE2000, labAs, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath';
for (const c of ['R', 'G'] as const) {
  for (const t of TERRAIN_IDS) {
    const row = VISIONS.map((v) => `${v}:${deltaE2000(labAs(COLOR_DEFS[c].palette.primary, v), labAs(TERRAIN[t].fill, v)).toFixed(1)}`);
    console.log(c, t.padEnd(10), row.join(' '));
  }
}
