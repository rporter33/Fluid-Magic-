import { labAs, deltaE2000, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath.ts';
const pairs: [string, string, string][] = [
  ['Cinder clothLight vs Thornwood clothDark', '#d9744a', '#113f2f'],
  ['Cinder #E08A5A vs Thornwood #16503C', '#e08a5a', '#16503c'],
  ['Thornwood clothLight vs Cinder clothDark', '#2f8a68', '#7e3118'],
  ['Thornwood #5FAE8C vs Cinder #6A2810', '#5fae8c', '#6a2810'],
];
for (const [name, a, b] of pairs) console.log(name, VISIONS.map((v) => v + ' ' + deltaE2000(labAs(a, v), labAs(b, v)).toFixed(1)).join(' | '));
