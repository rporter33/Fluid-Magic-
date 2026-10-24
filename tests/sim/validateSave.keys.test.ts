// The save check's shape and color faults (src/sim/validateSave.ts; docs/06-architecture.md,
// "Save and load"): every required key of every record a save holds, a record or a list where
// one belongs, and every color key and value W U B R G only. Each case breaks one thing in a save
// holding every kind of record and expects exactly that problem; references are in
// validateSave.refs.test.ts.
import { describe, expect, it } from 'vitest';
import { EFFECT_KEYS, KEYS, ORDER_KEYS, SLOT_KEYS } from '../../src/sim/saveKeys';
import type { GameState } from '../../src/sim/types';
import { saveProblems, type SaveProblem } from '../../src/sim/validateSave';
import { fresh, I, last, order, problemsWith, queue, rec, well, type Rec } from './saveCases';

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

  // About 200 copies of a whole game, one per key: 0.7 s at a load average of 14 with another file
  // in parallel. It timed out at vitest's 5 s default in one full run at a load average near 17,
  // before each copy lost a redundant JSON round trip, so it gets 20 s.
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
  }, 20_000);

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

describe('every color key and value', () => {
  it.each(COLOR_CASES)('%s', (_, change, problem) => {
    expect(problemsWith(change)).toEqual([problem]);
  });
});
