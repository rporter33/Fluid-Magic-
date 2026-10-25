import { labAs, deltaE2000, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath.ts';
import { readFileSync } from 'fs';
const r = JSON.parse(readFileSync('/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/qa2/colv.json', 'utf8'));
for (const [k, v] of Object.entries(r) as [string, { near: string; far: string }][]) console.log(k.padEnd(24), v.near, v.far, VISIONS.map((q) => q + ' ' + deltaE2000(labAs(v.near, q), labAs(v.far, q)).toFixed(1)).join(' | '), 'L*', labAs(v.near, 'normal')[0].toFixed(1), labAs(v.far, 'normal')[0].toFixed(1));
