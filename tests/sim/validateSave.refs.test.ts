// Each fault the save check reports (src/sim/validateSave.ts; docs/06-architecture.md, "Save and
// load"): every required key of every record a save holds, every id reference into the save and
// into this build's content, and every color key and value. Each case breaks one thing in a save
// holding every kind of record and expects exactly that problem.
import { describe, expect, it } from 'vitest';
import type { CommanderId, NationId, ProvinceId } from '../../src/sim/ids';
import { EFFECT_KEYS, KEYS, ORDER_KEYS, SLOT_KEYS } from '../../src/sim/saveKeys';
import type { GameState } from '../../src/sim/types';
import { saveProblems, type SaveProblem } from '../../src/sim/validateSave';
import { richSave, type RichIds } from './saveFixtures';

type Rec = Record<string, unknown>;
const rec = (value: object): Rec => value as Rec;

const BASE = richSave();
const I: RichIds = BASE.ids;

/** A copy of the rich save, as JSON brings it back. */
function fresh(): GameState {
  return structuredClone(BASE.save);
}

/** The problems with `change` made to a fresh save. */
function problemsWith(change: (s: GameState) => void): SaveProblem[] {
  const save = fresh();
  change(save);
  return saveProblems(JSON.parse(JSON.stringify(save)));
}

const order = (s: GameState, id: CommanderId) => rec(s.commanders[id]!.order);
const queue = (s: GameState) => s.provinces[I.capital]!.recruitQueue;
const last = queue(BASE.save).length - 1;
const well = BASE.save.map.wellsprings[0]!;
const P = 'p999' as ProvinceId;
const N = 'n9' as NationId;
const C = 'c99999' as CommanderId;

/** Every record kind: its keys, where it is, whether a `kind` picks its keys. */
const RECORDS: [readonly string[], (s: GameState) => [string, Rec], boolean][] = [
  [KEYS.game, (s) => ['the save', rec(s)], false],
  [KEYS.rng, (s) => ['rng', rec(s.rng)], false],
  [KEYS.map, (s) => ['map', rec(s.map)], false],
  [
    KEYS.mapProvince,
    (s) => [`map.provinces.${I.capital}`, rec(s.map.provinces[I.capital]!)],
    false,
  ],
  [
    KEYS.step,
    (s) => [`map.provinces.${well}.wellspring`, rec(s.map.provinces[well]!.wellspring!)],
    false,
  ],
  [KEYS.wild, (s) => ['map.wilds[0]', rec(s.map.wilds[0]!)], false],
  [KEYS.province, (s) => [`provinces.${I.capital}`, rec(s.provinces[I.capital]!)], false],
  [
    KEYS.construction,
    (s) => [`provinces.${I.capital}.construction`, rec(s.provinces[I.capital]!.construction!)],
    false,
  ],
  [
    KEYS.recruit,
    (s) => [`provinces.${I.capital}.recruitQueue[${String(last)}]`, rec(queue(s)[last]!)],
    false,
  ],
  [
    KEYS.dominion,
    (s) => [`provinces.${I.capital}.dominion`, rec(s.provinces[I.capital]!.dominion)],
    false,
  ],
  [KEYS.siege, (s) => [`provinces.${I.far}.siege`, rec(s.provinces[I.far]!.siege!)], false],
  [KEYS.nation, (s) => [`nations.${I.red}`, rec(s.nations[I.red]!)], false],
  [KEYS.ai, (s) => [`nations.${I.green}.ai`, rec(s.nations[I.green]!.ai!)], false],
  [
    KEYS.aiMemory,
    (s) => [`nations.${I.green}.ai.memory`, rec(s.nations[I.green]!.ai!.memory)],
    false,
  ],
  [KEYS.research, (s) => [`nations.${I.red}.research`, rec(s.nations[I.red]!.research)], false],
  [KEYS.stats, (s) => [`nations.${I.red}.stats`, rec(s.nations[I.red]!.stats)], false],
  [KEYS.design, (s) => [`nations.${I.red}.pretender`, rec(s.nations[I.red]!.pretender)], false],
  [KEYS.commander, (s) => [`commanders.${I.army}`, rec(s.commanders[I.army]!)], false],
  [
    KEYS.squad,
    (s) => [`commanders.${I.army}.squads[0]`, rec(s.commanders[I.army]!.squads[0]!)],
    false,
  ],
  [
    KEYS.transit,
    (s) => [`commanders.${I.army}.transit`, rec(s.commanders[I.army]!.transit!)],
    false,
  ],
  [ORDER_KEYS.move, (s) => [`commanders.${I.army}.order`, order(s, I.army)], true],
  [ORDER_KEYS.castRitual, (s) => [`commanders.${I.mage}.order`, order(s, I.mage)], true],
  [ORDER_KEYS.build, (s) => [`commanders.${I.priest}.order`, order(s, I.priest)], true],
  [
    SLOT_KEYS.cast,
    (s) => [`commanders.${I.mage}.script[0]`, rec(s.commanders[I.mage]!.script[0]!)],
    true,
  ],
  [KEYS.battle, (s) => ['battles[0]', rec(s.battles[0]!)], false],
  [KEYS.sides, (s) => ['battles[0].roster', rec(s.battles[0]!.roster)], false],
  [KEYS.roster, (s) => ['battles[0].roster.attacker', rec(s.battles[0]!.roster.attacker)], false],
  [KEYS.scene, (s) => ['battles[0].scene', rec(s.battles[0]!.scene)], false],
  [KEYS.message, (s) => ['messages[0]', rec(s.messages[0]!)], false],
  [
    [...new Set([...KEYS.effect, ...EFFECT_KEYS.growth])],
    (s) => ['provinceEffects[0]', rec(s.provinceEffects[0]!)],
    true,
  ],
  [KEYS.result, (s) => ['result', rec(s.result!)], false],
];

describe('the save check', () => {
  it('starts from a save with every kind of record and nothing wrong', () => {
    expect(saveProblems(fresh())).toEqual([]);
    expect(RECORDS.reduce((n, [keys]) => n + keys.length, 0)).toBeGreaterThan(150);
  });

  it('names every missing required key of every record', () => {
    for (const [keys, locate, kinded] of RECORDS) {
      for (const key of keys) {
        let where = '';
        const found = problemsWith((s) => {
          const [at, record] = locate(s);
          where = at;
          Reflect.deleteProperty(record, key);
        });
        const text =
          kinded && key === 'kind'
            ? `${where} has no known kind (undefined)`
            : `${where} has no ${key}`;
        expect(found, text).toContainEqual({ kind: 'shape', text });
      }
    }
  });

  it('names a record or a list that is something else', () => {
    expect(problemsWith((s) => ((s.nations[I.red] as unknown as Rec).stats = 5))).toEqual([
      { kind: 'shape', text: `nations.${I.red}.stats is not a record` },
    ]);
    expect(problemsWith((s) => ((s.commanders[I.army] as unknown as Rec).squads = {}))).toEqual([
      { kind: 'shape', text: `commanders.${I.army}.squads is not a list` },
    ]);
    expect(
      problemsWith((s) => ((s.commanders[I.army] as unknown as Rec).order = { kind: 'fly' })),
    ).toEqual([{ kind: 'shape', text: `commanders.${I.army}.order has no known kind ("fly")` }]);
  });
});

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

/** [what breaks, the change, the one problem it makes]. */
const COLOR_CASES: [string, (s: GameState) => void, SaveProblem][] = [
  [
    'mana key',
    (s) => (rec(s.nations[I.red]!.mana).X = 1),
    { kind: 'color', text: `nations.${I.red}.mana has the key "X", not one of W U B R G` },
  ],
  [
    'mana without W',
    (s) => Reflect.deleteProperty(s.nations[I.red]!.mana, 'W'),
    { kind: 'shape', text: `nations.${I.red}.mana has no W` },
  ],
  [
    'research color',
    (s) => (rec(s.nations[I.red]!.research).color = 'X'),
    { kind: 'color', text: `nations.${I.red}.research.color "X" is not one of W U B R G` },
  ],
  [
    'research points',
    (s) => (rec(s.nations[I.red]!.research.points).X = 5),
    {
      kind: 'color',
      text: `nations.${I.red}.research.points has the key "X", not one of W U B R G`,
    },
  ],
  [
    'mana spent',
    (s) => (rec(s.nations[I.red]!.stats.manaSpent).X = 5),
    {
      kind: 'color',
      text: `nations.${I.red}.stats.manaSpent has the key "X", not one of W U B R G`,
    },
  ],
  [
    'nation colors',
    (s) => ((s.nations[I.red]!.colors as unknown as unknown[])[0] = 'X'),
    { kind: 'color', text: `nations.${I.red}.colors[0] "X" is not one of W U B R G` },
  ],
  [
    'design pips',
    (s) => (rec(s.nations[I.red]!.pretender.pips).X = 1),
    {
      kind: 'color',
      text: `nations.${I.red}.pretender.pips has the key "X", not one of W U B R G`,
    },
  ],
  [
    'boon color',
    (s) => (rec(s.nations[I.red]!.pretender.boons![0]!).color = 'X'),
    {
      kind: 'color',
      text: `nations.${I.red}.pretender.boons[0].color "X" is not one of W U B R G`,
    },
  ],
  [
    'springs',
    (s) => ((s.map.provinces[I.capital]!.springs as unknown[])[0] = 'X'),
    { kind: 'color', text: `map.provinces.${I.capital}.springs[0] "X" is not one of W U B R G` },
  ],
  [
    'added springs',
    (s) => ((s.provinces[I.capital]!.extraSprings as unknown[])[0] = 'X'),
    { kind: 'color', text: `provinces.${I.capital}.extraSprings[0] "X" is not one of W U B R G` },
  ],
  [
    'commander pips',
    (s) => (rec(s.commanders[I.mage]!.pips).X = 1),
    { kind: 'color', text: `commanders.${I.mage}.pips has the key "X", not one of W U B R G` },
  ],
  [
    'carried mana',
    (s) => (rec(s.commanders[I.mage]!.carriedMana).X = 1),
    {
      kind: 'color',
      text: `commanders.${I.mage}.carriedMana has the key "X", not one of W U B R G`,
    },
  ],
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

describe('every color key and value', () => {
  it.each(COLOR_CASES)('%s', (_, change, problem) => {
    expect(problemsWith(change)).toEqual([problem]);
  });
});
