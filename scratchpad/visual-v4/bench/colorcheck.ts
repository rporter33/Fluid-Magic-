// The docs/09 distinct-colors rule (20 normal / 12 under each deficiency, CIEDE2000) checked on the relief bake:
// per terrain, the colors at the 10th, 50th and 90th lightness percentile of its ground (before trees and tint).
import { readFileSync } from 'node:fs';
import { labAs, deltaE2000, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath.ts';
const C = JSON.parse(readFileSync(process.argv[2]!, 'utf8')) as Record<string, { p10: string; p50: string; p90: string }>;
const FILL: Record<string, string> = { plains: '#D4DCC0', farmland: '#CEA265', forest: '#243F1B', hills: '#7D6542', mountains: '#9FB8D0', swamp: '#58696E', wasteland: '#9E8A91' };
const names = Object.keys(C);
const res: Record<string, unknown> = {};
for (const v of VISIONS) {
  let flatMin = 1e9, medMin = 1e9, worst = 1e9, worstPair = '', medPair = '';
  for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
    const a = names[i]!, b = names[j]!;
    flatMin = Math.min(flatMin, deltaE2000(labAs(FILL[a]!, v), labAs(FILL[b]!, v)));
    const m = deltaE2000(labAs(C[a]!.p50, v), labAs(C[b]!.p50, v)); if (m < medMin) { medMin = m; medPair = `${a}/${b}`; }
    for (const qa of ['p10', 'p50', 'p90'] as const) for (const qb of ['p10', 'p50', 'p90'] as const) {
      const d = deltaE2000(labAs(C[a]![qa], v), labAs(C[b]![qb], v)); if (d < worst) { worst = d; worstPair = `${a}.${qa}/${b}.${qb}`; }
    }
  }
  res[v] = { flatFillsMin: +flatMin.toFixed(1), reliefMedianMin: +medMin.toFixed(1), medPair, reliefAnyPercentileMin: +worst.toFixed(1), worstPair };
}
const spread: Record<string, number> = {};
for (const n of names) spread[n] = +deltaE2000(labAs(C[n]!.p10, 'normal'), labAs(C[n]!.p90, 'normal')).toFixed(1);
console.log(JSON.stringify({ res, withinTerrainSpreadP10toP90: spread }, null, 1));
