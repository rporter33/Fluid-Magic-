// The save check's reference faults (src/sim/validateSave.ts; docs/06-architecture.md, "Save and
// load"): every id reference into the save and into this build's content, and the provinces
// paired with the map. Each case breaks one thing in a save holding every kind of record and
// expects exactly that problem; required keys and colors are in validateSave.keys.test.ts.
import { describe, expect, it } from 'vitest';
import type { GameState } from '../../src/sim/types';
import { C, I, last, N, order, P, problemsWith, queue, rec, well } from './saveCases';

/** [what breaks, the change, the one problem it makes]. */
const REFERENCES: [string, (s: GameState) => void, string][] = [
  [
    'owner',
    (s) => (s.provinces[I.capital]!.owner = N),
    `provinces.${I.capital}.owner "n9" names nothing in the save`,
  ],
  [
    'garrison',
    (s) => (s.provinces[I.capital]!.garrison = C),
    `provinces.${I.capital}.garrison "c99999" names nothing in the save`,
  ],
  [
    'building',
    (s) => ((s.provinces[I.capital]!.buildings as unknown[])[0] = 'castle'),
    `provinces.${I.capital}.buildings[0] "castle" is no building of this build`,
  ],
  [
    'construction building',
    (s) => (rec(s.provinces[I.capital]!.construction!).building = 'castle'),
    `provinces.${I.capital}.construction.building "castle" is no building of this build`,
  ],
  [
    'construction nation',
    (s) => (s.provinces[I.capital]!.construction!.nation = N),
    `provinces.${I.capital}.construction.nation "n9" names nothing in the save`,
  ],
  [
    'recruit unit',
    (s) => (rec(queue(s)[last]!).unit = 'dragon'),
    `provinces.${I.capital}.recruitQueue[${String(last)}].unit "dragon" is no unit of this build`,
  ],
  [
    'recruit nation',
    (s) => (queue(s)[last]!.nation = N),
    `provinces.${I.capital}.recruitQueue[${String(last)}].nation "n9" names nothing in the save`,
  ],
  [
    'recruit id',
    (s) => (rec(queue(s)[last]!).id = 'q1'),
    `provinces.${I.capital}.recruitQueue[${String(last)}].id "q1" is no recruit id`,
  ],
  [
    'dominion',
    (s) => (s.provinces[I.capital]!.dominion.nation = N),
    `provinces.${I.capital}.dominion.nation "n9" names nothing in the save`,
  ],
  [
    'siege',
    (s) => (s.provinces[I.far]!.siege!.attacker = N),
    `provinces.${I.far}.siege.attacker "n9" names nothing in the save`,
  ],
  [
    'claim',
    (s) => (s.provinces[I.capital]!.wellspringClaimedBy = N),
    `provinces.${I.capital}.wellspringClaimedBy "n9" names nothing in the save`,
  ],
  [
    'terrain',
    (s) => (rec(s.map.provinces[I.capital]!).terrain = 'lava'),
    `map.provinces.${I.capital}.terrain "lava" is no terrain of this build`,
  ],
  [
    'neighbor',
    (s) => (s.map.provinces[I.capital]!.neighbors[0] = P),
    `map.provinces.${I.capital}.neighbors[0] "p999" names nothing in the save`,
  ],
  [
    'map capital',
    (s) => (s.map.capitals[0] = P),
    'map.capitals[0] "p999" names nothing in the save',
  ],
  [
    'map Wellspring',
    (s) => (s.map.wellsprings[0] = P),
    'map.wellsprings[0] "p999" names nothing in the save',
  ],
  [
    'scale axis',
    (s) => (rec(s.map.provinces[well]!.wellspring!).axis = 'chaos'),
    `map.provinces.${well}.wellspring.axis "chaos" is no scale axis of this build`,
  ],
  [
    'wild border',
    (s) => (s.map.wilds[0]!.borders[0] = P),
    'map.wilds[0].borders[0] "p999" names nothing in the save',
  ],
  ['wild id', (s) => (rec(s.map.wilds[0]!).id = 'x'), 'map.wilds[0].id "x" is no wild id'],
  [
    'map province id',
    (s) => (s.map.provinces[I.capital]!.id = P),
    `map.provinces.${I.capital} holds the id "p999"`,
  ],
  [
    'nation id',
    (s) => (s.nations[I.red]!.id = I.green),
    `nations.${I.red} holds the id "${I.green}"`,
  ],
  [
    'nation',
    (s) => (rec(s.nations[I.red]!).def = 'atlantis'),
    `nations.${I.red}.def "atlantis" is no nation of this build`,
  ],
  [
    'capital',
    (s) => (s.nations[I.red]!.capital = P),
    `nations.${I.red}.capital "p999" names nothing in the save`,
  ],
  [
    'pretender',
    (s) => (s.nations[I.red]!.pretenderId = C),
    `nations.${I.red}.pretenderId "c99999" names nothing in the save`,
  ],
  [
    'prophet',
    (s) => (s.nations[I.red]!.prophetId = C),
    `nations.${I.red}.prophetId "c99999" names nothing in the save`,
  ],
  [
    'explored',
    (s) => (s.nations[I.red]!.explored[0] = P),
    `nations.${I.red}.explored[0] "p999" names nothing in the save`,
  ],
  [
    'chassis',
    (s) => (s.nations[I.red]!.pretender.chassis = 'dragonGod'),
    `nations.${I.red}.pretender.chassis "dragonGod" is no chassis of this build`,
  ],
  [
    'blessing',
    (s) => (s.nations[I.red]!.pretender.blessings = ['nope']),
    `nations.${I.red}.pretender.blessings[0] "nope" is no blessing of this build`,
  ],
  [
    'boon',
    (s) => (rec(s.nations[I.red]!.pretender.boons![0]!).id = 'nope'),
    `nations.${I.red}.pretender.boons[0].id "nope" is no boon of this build`,
  ],
  [
    'difficulty',
    (s) => (rec(s.nations[I.green]!.ai!).difficulty = 'brutal'),
    `nations.${I.green}.ai.difficulty "brutal" is no difficulty of this build`,
  ],
  [
    'AI target',
    (s) => (s.nations[I.green]!.ai!.memory.target = P),
    `nations.${I.green}.ai.memory.target "p999" names nothing in the save`,
  ],
  [
    'commander unit',
    (s) => (rec(s.commanders[I.army]!).unit = 'dragon'),
    `commanders.${I.army}.unit "dragon" is no unit of this build`,
  ],
  [
    'commander owner',
    (s) => (s.commanders[I.army]!.owner = N),
    `commanders.${I.army}.owner "n9" names nothing in the save`,
  ],
  [
    'location',
    (s) => (s.commanders[I.army]!.location = P),
    `commanders.${I.army}.location "p999" names nothing in the save`,
  ],
  [
    'transit from',
    (s) => (s.commanders[I.army]!.transit!.from = P),
    `commanders.${I.army}.transit.from "p999" names nothing in the save`,
  ],
  [
    'transit to',
    (s) => (s.commanders[I.army]!.transit!.to = P),
    `commanders.${I.army}.transit.to "p999" names nothing in the save`,
  ],
  [
    'came from',
    (s) => (s.commanders[I.army]!.cameFrom = P),
    `commanders.${I.army}.cameFrom "p999" names nothing in the save`,
  ],
  [
    'squad unit',
    (s) => (rec(s.commanders[I.army]!.squads[0]!).unit = 'dragon'),
    `commanders.${I.army}.squads[0].unit "dragon" is no unit of this build`,
  ],
  [
    'squad id',
    (s) => (rec(s.commanders[I.army]!.squads[0]!).id = 'x'),
    `commanders.${I.army}.squads[0].id "x" is no squad id`,
  ],
  [
    'march',
    (s) => (rec(order(s, I.army)).path = [P]),
    `commanders.${I.army}.order.path[0] "p999" names nothing in the save`,
  ],
  [
    'ritual',
    (s) => (order(s, I.mage).spellId = 'nope'),
    `commanders.${I.mage}.order.spellId "nope" is no spell of this build`,
  ],
  [
    'ritual target',
    (s) => (order(s, I.mage).target = P),
    `commanders.${I.mage}.order.target "p999" names nothing in the save`,
  ],
  [
    'build',
    (s) => (order(s, I.priest).building = 'castle'),
    `commanders.${I.priest}.order.building "castle" is no building of this build`,
  ],
  [
    'build where',
    (s) => (order(s, I.priest).province = P),
    `commanders.${I.priest}.order.province "p999" names nothing in the save`,
  ],
  [
    'script',
    (s) => (rec(s.commanders[I.mage]!.script[0]!).spellId = 'nope'),
    `commanders.${I.mage}.script[0].spellId "nope" is no spell of this build`,
  ],
  [
    'battle province',
    (s) => (s.battles[0]!.province = P),
    'battles[0].province "p999" names nothing in the save',
  ],
  [
    'battle attacker',
    (s) => (s.battles[0]!.attacker = N),
    'battles[0].attacker "n9" names nothing in the save',
  ],
  [
    'battle defender',
    (s) => (s.battles[0]!.defender = N),
    'battles[0].defender "n9" names nothing in the save',
  ],
  ['battle id', (s) => (rec(s.battles[0]!).id = 'x'), 'battles[0].id "x" is no battle id'],
  [
    'scene',
    (s) => (rec(s.battles[0]!.scene).terrain = 'lava'),
    'battles[0].scene.terrain "lava" is no terrain of this build',
  ],
  [
    'roster',
    (s) => (s.battles[0]!.roster.attacker.nation = N),
    'battles[0].roster.attacker.nation "n9" names nothing in the save',
  ],
  [
    'message nation',
    (s) => (s.messages[0]!.nation = N),
    'messages[0].nation "n9" names nothing in the save',
  ],
  [
    'message province',
    (s) => (s.messages[0]!.province = P),
    'messages[0].province "p999" names nothing in the save',
  ],
  ['message id', (s) => (rec(s.messages[0]!).id = 'x'), 'messages[0].id "x" is no message id'],
  [
    'effect province',
    (s) => (s.provinceEffects[0]!.province = P),
    'provinceEffects[0].province "p999" names nothing in the save',
  ],
  [
    'effect nation',
    (s) => (s.provinceEffects[0]!.nation = N),
    'provinceEffects[0].nation "n9" names nothing in the save',
  ],
  [
    'effect source',
    (s) => (s.provinceEffects[0]!.source = 'nope'),
    'provinceEffects[0].source "nope" is no spell of this build',
  ],
  [
    'effect id',
    (s) => (rec(s.provinceEffects[0]!).id = 'x'),
    'provinceEffects[0].id "x" is no effect id',
  ],
  ['winner', (s) => (s.result!.winner = N), 'result.winner "n9" names nothing in the save'],
];

describe('every id reference', () => {
  it.each(REFERENCES)('%s', (_, change, text) => {
    expect(problemsWith(change)).toEqual([{ kind: 'reference', text }]);
  });

  it('pairs the provinces with the map: none missing, none extra', () => {
    expect(problemsWith((s) => Reflect.deleteProperty(s.provinces, I.near))).toContainEqual({
      kind: 'reference',
      text: `provinces has no ${I.near}, a province of the map`,
    });
    expect(
      problemsWith((s) => {
        s.provinces[P] = { ...s.provinces[I.near]!, id: P };
      }),
    ).toEqual([{ kind: 'reference', text: 'provinces.p999 is no province of the map' }]);
  });
});
