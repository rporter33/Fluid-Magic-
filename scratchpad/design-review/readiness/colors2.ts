import { COLOR_DEFS, INDEPENDENT_PALETTE } from '/home/user/Fluid-Magic-/src/content/colors';
import { TERRAIN, TERRAIN_IDS } from '/home/user/Fluid-Magic-/src/content/terrain';
import { deltaE2000, labAs, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath';
const cands: Record<string, string> = {
  Gaccent: COLOR_DEFS.G.palette.accent, Raccent: COLOR_DEFS.R.palette.accent,
  Gsecondary: COLOR_DEFS.G.palette.secondary, Rsecondary: COLOR_DEFS.R.palette.secondary,
  indepAccent: INDEPENDENT_PALETTE.accent,
};
for (const [o, hex] of Object.entries(cands)) {
  let worst = { v: '', t: '', d: 1e9 };
  for (const t of TERRAIN_IDS) for (const v of VISIONS) {
    const d = deltaE2000(labAs(hex, v), labAs(TERRAIN[t].fill, v));
    if (d < worst.d) worst = { v, t, d };
  }
  console.log(o, hex, worst.t, worst.v, worst.d.toFixed(1));
}
// R vs G primaries in each vision (already tested), and R primary vs R accent (variant spread)
