import { defaultPreset } from '/home/user/fm-p6/src/content/pretenders/presets';
import { unitDef, nationDef, type NationDefId } from '/home/user/fm-p6/src/content';
import { dummyPlayer } from '/home/user/fm-p6/src/ai/dummy';
import { createGame } from '/home/user/fm-p6/src/sim/createGame';
import type { GameSetup, GameState } from '/home/user/fm-p6/src/sim/types';
import type { NationId } from '/home/user/fm-p6/src/sim/ids';
const NATIONS: readonly NationDefId[] = ['cinderHorde', 'thornwood'];
const setup: GameSetup = { seed: 1, mapSize: 'medium', nations: NATIONS.map((nation) => ({ nation, pretender: defaultPreset(nation).design, ai: { difficulty: 'normal' } })) };
const s: GameState = createGame(setup);
for (const n of Object.values(s.nations)) {
  const def = nationDef(n.def);
  console.log(n.id, n.def, n.colors, n.research.color, n.gold, n.capital, JSON.stringify(s.provinces[n.capital]!.buildings), s.provinces[n.capital]!.recruitQueue.length, 'garrison', s.provinces[n.capital]!.garrison);
  console.log(' commanders def', def.commanders.map(u => [u, unitDef(u).commander?.leadership, unitDef(u).cost]), 'troops', def.troops.map(u=>[u, unitDef(u).cost]));
  for (const c of Object.values(s.commanders).filter(c => c.owner === n.id)) console.log('  ', c.id, c.unit, c.location, c.holy, JSON.stringify(c.pips), c.order.kind, c.transit, JSON.stringify(c.squads.map(q => [q.id, q.unit, q.count])));
  console.log(' dummy', JSON.stringify(dummyPlayer(s, n.id)));
}
console.log(s.map.wellsprings, s.day);
