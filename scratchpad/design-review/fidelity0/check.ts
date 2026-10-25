import { deltaE2000, labAs, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath.ts';
import { COLOR_DEFS } from '/home/user/Fluid-Magic-/src/content/colors.ts';
const pairs: [string, string, string][] = [
  ['R prim vs R acc', COLOR_DEFS.R.palette.primary, COLOR_DEFS.R.palette.accent],
  ['R prim vs R sec', COLOR_DEFS.R.palette.primary, COLOR_DEFS.R.palette.secondary],
  ['G prim vs G sec', COLOR_DEFS.G.palette.primary, COLOR_DEFS.G.palette.secondary],
  ['G prim vs G acc', COLOR_DEFS.G.palette.primary, COLOR_DEFS.G.palette.accent],
];
for (const [n, a, b] of pairs) {
  console.log(n, (['normal', ...VISIONS.filter(v=>v!=='normal')] as const).map(v => `${v}=${deltaE2000(labAs(a, v as never), labAs(b, v as never)).toFixed(1)}`).join(' '));
}
