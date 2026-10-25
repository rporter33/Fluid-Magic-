// Judge 1: each proposal's brass against Radiance (W) primary and secondary, all visions.
import { labAs, deltaE2000, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath.ts';
const W = { Wprim: '#F3E6B8', Wsec: '#D9B85C', Raccent: '#FFB347' } as Record<string, string>;
for (const c of ['#DBBD76', '#B8914A', '#D4B26A', '#F2D27A', '#B58735']) {
  console.log(c, Object.entries(W).map(([n, h]) => `${n} ` + VISIONS.map((v) => deltaE2000(labAs(c, v), labAs(h, v)).toFixed(1)).join('/')).join(' | '));
}
