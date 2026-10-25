import { labAs, deltaE2000, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath.ts';
import { readFileSync } from 'fs';
const s = JSON.parse(readFileSync('/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/qa/sidecolors.json', 'utf8'));
const hex = (c: number[]) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
const pairs: [string, string, string][] = [
  ['rendered near (Cinder) vs far (Thornwood), battle a', hex(s.near), hex(s.far)],
  ['cloth #C4532C vs #1F6A50', '#c4532c', '#1f6a50'],
  ['clothDark #7E3118 vs #113F2F', '#7e3118', '#113f2f'],
  ['clothLight #D9744A vs #2F8A68', '#d9744a', '#2f8a68'],
];
for (const [name, a, b] of pairs) {
  console.log(name, VISIONS.map((v) => v + ' ' + deltaE2000(labAs(a, v), labAs(b, v)).toFixed(1)).join(' | '), 'L*', labAs(a, 'normal')[0].toFixed(1), labAs(b, 'normal')[0].toFixed(1));
}
