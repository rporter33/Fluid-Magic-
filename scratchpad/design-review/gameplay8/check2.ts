import { COLOR_DEFS, COLORS } from '/home/user/Fluid-Magic-/src/content/colors';
import { TERRAIN, TERRAIN_IDS } from '/home/user/Fluid-Magic-/src/content/terrain';
import { deltaE2000, labAs, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath';
for (const key of ['accent', 'secondary'] as const) {
  for (const c of COLORS) {
    const p = COLOR_DEFS[c].palette[key];
    let worst = { v: 999, t: '', vis: '' };
    for (const t of TERRAIN_IDS) for (const vis of VISIONS) {
      const d = deltaE2000(labAs(p, vis), labAs(TERRAIN[t].fill, vis));
      const margin = d - (vis === 'normal' ? 20 : 12);
      if (margin < worst.v) worst = { v: margin, t, vis };
    }
    console.log(key, c, p, 'worst margin', worst.v.toFixed(1), worst.t, worst.vis);
  }
}
