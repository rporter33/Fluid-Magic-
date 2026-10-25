import { COLOR_DEFS } from '/home/user/Fluid-Magic-/src/content/colors';
import { TERRAIN, TERRAIN_IDS } from '/home/user/Fluid-Magic-/src/content/terrain';
import { deltaE2000, labAs, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath';
const m = (x: string, y: string) => Math.min(...VISIONS.map((v, i) => deltaE2000(labAs(x, v), labAs(y, v)) - (i === 0 ? 20 : 12)));
for (const tone of ['#FFFFFF', '#F5F0E1', '#1C1A17', '#000000']) {
  console.log(tone, TERRAIN_IDS.map(t => `${t}:${m(tone, TERRAIN[t].fill).toFixed(0)}`).join(' '),
    '| R', m(tone, COLOR_DEFS.R.palette.primary).toFixed(0), 'G', m(tone, COLOR_DEFS.G.palette.primary).toFixed(0));
}
