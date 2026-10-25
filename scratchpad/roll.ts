import { createCommander } from '/home/user/fm-p6/src/sim/commanders';
import { spreadDominion } from '/home/user/fm-p6/src/sim/dominion';
import { capitalOf, nationIds, neighbors, redGame } from '/home/user/fm-p6/tests/sim/fixtures';
import type { NationId } from '/home/user/fm-p6/src/sim/ids';

for (const seed of [1, 2, 3]) {
  for (const score of [1, 2, 10]) {
    const state = redGame(score, {}, seed);
    const [red] = nationIds(state) as [NationId, NationId];
    const capital = capitalOf(state, red).id;
    for (let i = 0; i < 10; i++) createCommander(state, 'pyrePriest', red, capital).order = { kind: 'preach' };
    state.day = 29;
    spreadDominion(state);
    const ns = neighbors(state, capital);
    const dominated = ns.filter((n) => state.provinces[n]!.dominion.nation === red).length;
    const sum = ns.reduce((s, n) => s + (state.provinces[n]!.dominion.nation === red ? state.provinces[n]!.dominion.strength : 0), 0);
    console.log({ seed, score, n: ns.length, dominated, sum });
  }
}
