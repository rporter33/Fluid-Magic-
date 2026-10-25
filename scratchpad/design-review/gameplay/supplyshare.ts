import { createGame } from '/home/user/Fluid-Magic-/src/sim/createGame';
import { TERRAIN } from '/home/user/Fluid-Magic-/src/content/terrain';
import { NEUTRAL_SCALES } from '/home/user/Fluid-Magic-/src/content/pretenders/scales';
const pre = { chassis: 'titan', pips: {}, dominion: 5, scales: { ...NEUTRAL_SCALES }, awakening: 'awake' as const };
const res: Record<string, number[]> = {};
let total = 0;
const wsSupply: string[] = [];
for (const seed of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
  const s = createGame({ seed, mapSize: 'medium', nations: [
    { nation: 'cinderHorde', pretender: pre, ai: null },
    { nation: 'thornwood', pretender: pre, ai: null },
  ] });
  for (const mp of Object.values(s.map.provinces)) {
    total++;
    const pop = s.provinces[mp.id]!.pop;
    for (const div of [50, 250, 500]) {
      const sup = TERRAIN[mp.terrain].supplyBase + pop / div;
      for (const army of [31, 61, 81, 161]) {
        const k = `div ${div} army ${army}`;
        res[k] ??= [0];
        if (sup < army) res[k]![0]! += 1;
      }
    }
    if (mp.wellspring) wsSupply.push(`${mp.terrain}:${(TERRAIN[mp.terrain].supplyBase + pop / 50).toFixed(0)}`);
  }
}
for (const [k, [v]] of Object.entries(res)) console.log(k.padEnd(22), 'starves in', ((v! / total) * 100).toFixed(0) + '% of provinces');
console.log('wellspring supply (pop/50):', wsSupply.join(' '));
