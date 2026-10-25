import { COLOR_DEFS, COLORS, INDEPENDENT_PALETTE } from '/home/user/Fluid-Magic-/src/content/colors';
import { deltaE2000, labAs, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath';
// Duplicate nations today: same color identity => same chrome. Check what a naive fallback
// (secondary/accent of the same color) would give against the primaries.
const prim: Record<string,string> = { ...Object.fromEntries(COLORS.map(c=>[c,COLOR_DEFS[c].palette.primary])), I: INDEPENDENT_PALETTE.primary };
for (const c of ['R','G'] as const) {
  for (const k of ['secondary','accent'] as const) {
    const hex = COLOR_DEFS[c].palette[k];
    const worst = VISIONS.map(v => {
      let m = Infinity, who='';
      for (const [n,h] of Object.entries(prim)) { const d = deltaE2000(labAs(hex,v),labAs(h,v)); if (d<m){m=d;who=n;} }
      return `${v}:${m.toFixed(1)}(${who})`;
    });
    console.log(c, k, hex, worst.join(' '));
  }
}
console.log('R vs R primary', deltaE2000(labAs(prim.R,'normal'),labAs(prim.R,'normal')));
