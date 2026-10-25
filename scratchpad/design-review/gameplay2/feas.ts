import { labAs, deltaE2000, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath.ts';
const minDE = (x: string, y: string) => Math.min(...VISIONS.map(v => deltaE2000(labAs(x, v), labAs(y, v)) / (v === 'normal' ? 20 : 12)));
// identical primaries
console.log('R vs R', deltaE2000(labAs('#FD6533','deutan'), labAs('#FD6533','deutan')));
// greedy: fixed R0, G0, independent; add 3 more R-slot and 3 more G-slot banners where all may co-occur (conservative)
const fixed = ['#FD6533', '#00674B', '#8C8A80'];
const cands: string[] = [];
for (let r = 0; r < 256; r += 17) for (let g = 0; g < 256; g += 17) for (let b = 0; b < 256; b += 17)
  cands.push('#' + [r, g, b].map(n => n.toString(16).padStart(2, '0')).join('').toUpperCase());
const set = [...fixed];
for (let k = 0; k < 6; k++) {
  let best = '', bestScore = -1;
  for (const c of cands) { const s = Math.min(...set.map(x => minDE(c, x))); if (s > bestScore) { bestScore = s; best = c; } }
  set.push(best); console.log(best, bestScore.toFixed(2));
}
