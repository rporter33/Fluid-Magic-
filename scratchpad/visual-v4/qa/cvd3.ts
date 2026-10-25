import { labAs, deltaE2000, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath.ts';
const pairs: [string, string, string][] = [
  ['Cinder cloth #C4532C vs Thornwood clothDark #113F2F', '#c4532c', '#113f2f'],
  ['Thornwood cloth #2F8A68 (L 51.6) vs Cinder clothDark #6A2810', '#2f8a68', '#6a2810'],
];
for (const [name, a, b] of pairs) console.log(name, VISIONS.map((v) => v + ' ' + deltaE2000(labAs(a, v), labAs(b, v)).toFixed(1)).join(' | '), 'L*', labAs(a,'normal')[0].toFixed(1), labAs(b,'normal')[0].toFixed(1));
