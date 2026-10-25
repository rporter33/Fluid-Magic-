import { labAs, deltaE2000, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath.ts';
const pairs: [string, string, string][] = [
  ['before a: rendered #623726 vs #375B44', '#623726', '#375b44'],
  ['after a: rendered #633220 vs #304732', '#633220', '#304732'],
  ['after b: rendered #204e37 vs #703721', '#204e37', '#703721'],
  ['after c: rendered #71321e vs #324a34', '#71321e', '#324a34'],
];
for (const [name, a, b] of pairs) console.log(name, VISIONS.map((v) => v + ' ' + deltaE2000(labAs(a, v), labAs(b, v)).toFixed(1)).join(' | '));
