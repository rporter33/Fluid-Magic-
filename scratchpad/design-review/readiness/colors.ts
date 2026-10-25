import { COLOR_DEFS, INDEPENDENT_PALETTE } from '/home/user/Fluid-Magic-/src/content/colors';
import { TERRAIN, TERRAIN_IDS } from '/home/user/Fluid-Magic-/src/content/terrain';
import { deltaE2000, labAs, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath';
const owners = { R: COLOR_DEFS.R.palette.primary, G: COLOR_DEFS.G.palette.primary, indep: INDEPENDENT_PALETTE.primary };
for (const [o, hex] of Object.entries(owners)) {
  for (const t of TERRAIN_IDS) {
    const row = VISIONS.map((v) => deltaE2000(labAs(hex, v), labAs(TERRAIN[t].fill, v)).toFixed(1));
    console.log(o, t, row.join(' '));
  }
}
console.log(VISIONS);
