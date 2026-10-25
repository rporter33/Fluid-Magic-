// Judge 1: the dark grounds against the M2 banners the instrument's check left out (W, U, B primaries).
import { labAs, deltaE2000, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath.ts';
const M2 = { W: '#F3E6B8', U: '#3A7BD5', B: '#3D2B4F', Bsec: '#1A1024', Usec: '#1E3F7A' } as Record<string, string>;
for (const c of ['#24222A', '#302F32', '#343336', '#5E5953', '#182A36']) {
  console.log(c, Object.entries(M2).map(([n, h]) => `${n} ` + VISIONS.map((v) => deltaE2000(labAs(c, v), labAs(h, v)).toFixed(1)).join('/')).join(' | '));
}
