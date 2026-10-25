import { createCommander, createSquad, commanderSupply } from '/home/user/Fluid-Magic-/src/sim/commanders';
import { applySupply } from '/home/user/Fluid-Magic-/src/sim/supply';
import type { ProvinceEconomy } from '/home/user/Fluid-Magic-/src/sim/selectors';
import { twoNationGame, nationIds, independentProvince } from '/home/user/Fluid-Magic-/tests/sim/fixtures';

function run(squadSizes: number[], commanders: number, supply: number, days: number, leaveDay: number | null) {
  const state = twoNationGame();
  const [red] = nationIds(state);
  const p = independentProvince(state);
  const cs = [] as ReturnType<typeof createCommander>[];
  for (let i = 0; i < commanders; i++) cs.push(createCommander(state, 'ashChieftain', red!, p.id));
  squadSizes.forEach((n, i) => cs[i % commanders]!.squads.push(createSquad(state, 'cinderWarrior', n)));
  const log: string[] = [];
  for (let d = 1; d <= days; d++) {
    const s = leaveDay !== null && d > leaveDay ? 10000 : supply;
    const used = cs.reduce((a, c) => a + commanderSupply(c), 0);
    const e = { supply: s, supplyUsed: used } as unknown as ProvinceEconomy;
    applySupply(state, new Map([[p.id, e]]));
    const count = cs.reduce((a, c) => a + c.squads.reduce((b, q) => b + q.count, 0), 0);
    const hp = cs.reduce((a, c) => a + c.squads.reduce((b, q) => b + q.hp, 0), 0);
    if ([2, 5, 10, 20, 30, 45, 49, 50, 51, 60, 80].includes(d)) log.push(`d${d}:${count}/${hp.toFixed(0)}`);
  }
  return log.join(' ');
}
console.log('1x29, 1 cmdr        ', run([29], 1, 24, 80, null));
console.log('29x1, 1 cmdr        ', run(Array(29).fill(1), 1, 24, 80, null));
console.log('1x29 leave d30      ', run([29], 1, 24, 80, 30));
console.log('29x1 leave d30      ', run(Array(29).fill(1), 1, 24, 80, 30));
console.log('2x(1 cmdr each)? 15+14 two cmdrs', run([15, 14], 2, 24, 80, null));
console.log('1x60 2 cmdrs [30,30] supply 50', run([30, 30], 2, 50, 80, null));
console.log('1x60 supply 50', run([60], 1, 50, 80, null));
