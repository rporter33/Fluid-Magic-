// Battle-start abilities (pretender build spec N1; docs/04-battle.md decisions, "Pretender
// abilities and new battle rules"). The real abilities ride on test bodies here: the chassis
// that carry them arrive in Phase 6b.3.
import { describe, expect, it } from 'vitest';
import { unitDef } from '../../../src/content';
import { ABILITIES, type AbilityDef, type UnitAbility } from '../../../src/content/abilities';
import { SPELLS } from '../../../src/content/spells';
import type { BattleEffect } from '../../../src/content/spells/types';
import { abilityPhase } from '../../../src/sim/battle/abilities';
import type { DetailEvent } from '../../../src/sim/battle/detail';
import type { BattleEvent } from '../../../src/sim/battle/events';
import { buildField, groupStat, type Group } from '../../../src/sim/battle/field';
import { resolveBattle } from '../../../src/sim/battle/resolve';
import {
  battleRulesHash,
  battleRulesInput,
  fromSetupRecord,
  matchesRecord,
  rerunBattle,
  toSetupRecord,
  validRerun,
} from '../../../src/sim/battle/rerun';
import type { BattleRecord } from '../../../src/sim/types';
import type { BattleCommanderSetup, BattleSetup } from '../../../src/sim/battle/types';
import { defaultFormation } from '../../../src/sim/commanders';
import { createRng } from '../../../src/sim/rng';
import { casting } from './fixtures/armies';
import { NAMED } from './fixtures/named';
import { byRound, commander, fightOnce, setup, side, squad, testAbility } from './fixtures';
import { staged, testSpell } from './spellFixtures';
import { patched } from '../../content/patched';

/** A god-sized test body carrying abilities: a Titan, since the new bodies come in 6b.3. */
function god(
  ref: string,
  abilities: readonly UnitAbility[],
  opts: Parameters<typeof commander>[2] = {},
) {
  return commander(ref, 'titan', { abilities, ...opts });
}

/** Index of round 1's marker for a step, or -1. */
function marker(replay: readonly BattleEvent[], phase: string): number {
  const end = replay.findIndex((e) => e.kind === 'roundStart' && e.round === 2);
  const r1 = end < 0 ? replay : replay.slice(0, end);
  return r1.findIndex((e) => e.kind === 'phase' && e.phase === phase);
}

function abilityEvents(replay: readonly BattleEvent[]) {
  return replay.flatMap((e) => (e.kind === 'ability' ? [e] : []));
}

/** Fires the battle-start abilities of a staged field once, as round 1 does. */
function fire(field: ReturnType<typeof buildField>, seed = 1): BattleEvent[] {
  const log: BattleEvent[] = [];
  abilityPhase(field, 1, createRng(seed), log);
  return log;
}

describe('a summoning ability', () => {
  it.each([
    ['Kindle the Host', ABILITIES.kindleTheHost, 'fireSprite', 6],
    ['Call the Hunt', ABILITIES.callTheHunt, 'wolf', 8],
  ] as const)('%s summons at battle start, before round 1’s ranged step', (_, ability, unit, n) => {
    const result = fightOnce(
      side([squad('a', 'cinderWarrior', 10, { leader: 'p' })], [god('p', [ability])]),
      side([squad('d', 'warden', 20), squad('e', 'longbowHunter', 10)]),
    );
    const r = result.replay;
    expect(r.slice(0, 4)).toEqual([
      { kind: 'roundStart', round: 1 },
      { kind: 'phase', phase: 'scripts' },
      { kind: 'ability', unit: 'p', ability: ability.id, targets: [] },
      {
        kind: 'summon',
        side: 'attacker',
        unit,
        count: n,
        hp: n * unitDef(unit).hp,
        squad: 'su0',
        row: defaultFormation(unitDef(unit)),
        commander: 'p',
      },
    ]);
    expect(marker(r, 'ranged')).toBeGreaterThan(3);
    // It fires once: no second ability or summon in any later round.
    expect(abilityEvents(r)).toHaveLength(1);
    expect(r.filter((e) => e.kind === 'summon')).toHaveLength(1);
  });
});

describe('Fear', () => {
  const fearOf = (result: ReturnType<typeof fightOnce>) =>
    byRound(result).filter(
      ({ event }) => event.kind === 'buff' && event.source === 'primordialFear',
    );

  it.each(['attacker', 'defender'] as const)(
    'as %s, lowers every present enemy group’s morale by 2 for the battle, commanders too',
    (where) => {
      const fearful = side(
        [squad('a', 'cinderWarrior', 10, { leader: 'p' })],
        [god('p', [ABILITIES.primordialFear])],
      );
      const enemy = side(
        [squad('d0', 'warden', 20, { leader: 'dc' }), squad('d1', 'longbowHunter', 10)],
        [commander('dc', 'wardenCaptain')],
      );
      const result = where === 'attacker' ? fightOnce(fearful, enemy) : fightOnce(enemy, fearful);
      const buffs = fearOf(result);
      expect(buffs.map(({ round, event }) => [round, event])).toEqual(
        ['d0', 'd1', 'dc'].map((target) => [
          1,
          {
            kind: 'buff',
            target,
            stat: 'mor',
            delta: -2,
            source: 'primordialFear',
            untilRound: null,
            debuff: true,
          },
        ]),
      );
      expect(abilityEvents(result.replay)).toEqual([
        { kind: 'ability', unit: 'p', ability: 'primordialFear', targets: ['d0', 'd1', 'dc'] },
      ]);
      // Never on its own side, and never expired.
      expect(result.replay.some((e) => e.kind === 'expire' && e.source === 'primordialFear')).toBe(
        false,
      );
    },
  );

  it('changes the morale the enemy groups fight at, and nothing on its own side', () => {
    const field = buildField(
      setup(
        side([squad('a', 'cinderWarrior', 10)], [god('p', [ABILITIES.primordialFear])]),
        side([squad('d', 'warden', 20)], [commander('dc', 'wardenCaptain')]),
      ),
    );
    fire(field);
    const all = [...field.sides.attacker, ...field.sides.defender];
    for (const g of all) {
      const shift = g.side === 'defender' ? -2 : 0;
      expect(groupStat(g, 'mor'), g.ref).toBe(g.base.mor + shift);
    }
  });
});

describe('the ability step', () => {
  it('fires in caster order across the sides, and a unit’s abilities in list order', () => {
    const result = fightOnce(
      side(
        [squad('a', 'cinderWarrior', 10, { leader: 'p1' })],
        [
          god('p1', [ABILITIES.kindleTheHost, ABILITIES.callTheHunt]),
          god('p2', [ABILITIES.primordialFear]),
        ],
      ),
      side([squad('d', 'warden', 20, { leader: 'q1' })], [god('q1', [ABILITIES.callTheHunt])]),
    );
    expect(abilityEvents(result.replay).map((e) => [e.unit, e.ability])).toEqual([
      ['p1', 'kindleTheHost'],
      ['p1', 'callTheHunt'],
      ['q1', 'callTheHunt'],
      ['p2', 'primordialFear'],
    ]);
    const summons = result.replay.flatMap((e) => (e.kind === 'summon' ? [e] : []));
    expect(summons.map((e) => [e.squad, e.commander, e.unit])).toEqual([
      ['su0', 'p1', 'fireSprite'],
      ['su1', 'p1', 'wolf'],
      ['su2', 'q1', 'wolf'],
    ]);
    // The defender's wolves joined before Fear fired, so it frightens them too.
    const feared = abilityEvents(result.replay).at(-1)?.targets;
    expect(feared).toEqual(['d', 'q1', 'su2']);
  });

  it('fires all or nothing: every effect needs a target, as a spell’s do', () => {
    const rally = testAbility('rally', [
      { kind: 'summon', unit: 'wolf', count: 4, side: 'friendly' },
      {
        kind: 'buff',
        stat: 'mor',
        delta: 1,
        duration: { kind: 'battle' },
        targets: { kind: 'friendlySquad' },
      },
    ]);
    // No friendly squad: neither the buff nor the summon happens.
    const alone = buildField(setup(side([], [god('p', [rally])]), side([squad('d', 'warden', 5)])));
    expect(fire(alone)).toEqual([]);
    expect(alone.sides.attacker).toHaveLength(1);
    // With a squad, both land, the buff on the squad that stood when it was planned.
    const led = buildField(
      setup(side([squad('a', 'warden', 5)], [god('p', [rally])]), side([squad('d', 'warden', 5)])),
    );
    expect(fire(led).map((e) => e.kind)).toEqual(['ability', 'summon', 'buff']);
  });

  it('skips a commander that is not active, and costs no fatigue or carried mana', () => {
    const field = buildField(
      setup(
        side(
          [squad('a', 'warden', 5)],
          [
            god('dead', [ABILITIES.callTheHunt], { hp: 0 }),
            god('p', [ABILITIES.callTheHunt], { carriedMana: { R: 2 } }),
          ],
        ),
        side([squad('d', 'warden', 5)]),
      ),
    );
    const log = fire(field);
    expect(abilityEvents(log).map((e) => e.unit)).toEqual(['p']);
    const p = field.sides.attacker.find((g) => g.ref === 'p') as Group;
    expect(p.fatigue).toBe(0);
    expect(p.carriedMana).toEqual({ R: 2 });
  });

  it('never adds spell power: a damage ability rolls its listed amount, a spell its own plus 3', () => {
    const spark = testAbility('spark', [
      { kind: 'damage', amount: 10, element: 'fire', targets: { kind: 'single' } },
    ]);
    const detail: DetailEvent[] = [];
    const mage = commander('p', 'cinderMagus', {
      abilities: [spark],
      spells: [SPELLS.emberDart],
      script: casting('emberDart'),
      stats: { spellPower: 3 },
    });
    resolveBattle(setup(side([], [mage]), side([squad('d', 'ashMilitia', 30)])), createRng(1), {
      detail,
    });
    const hits = detail.flatMap((e) => (e.kind === 'spellHit' && e.round === 1 ? [e] : []));
    expect(hits.map((h) => [h.spell, h.damage.base])).toEqual([
      ['test:spark', 10],
      ['emberDart', 12 + 3],
    ]);
  });

  it('draws its targets and damage from the battle rng, in sequence, as a cast of its effects', () => {
    const effects: BattleEffect[] = [
      { kind: 'damage', amount: 10, element: 'fire', targets: { kind: 'single' } },
    ];
    const sides = () =>
      [
        side([], [god('p', [testAbility('spark', effects)])]),
        side([squad('d', 'ashMilitia', 30)]),
      ] as const;
    const rng = createRng(1);
    abilityPhase(buildField(setup(...sides())), 1, rng, []);
    expect(rng).not.toEqual(createRng(1));
    const { castBy } = staged(...sides());
    const cast = createRng(1);
    castBy('p', testSpell('test:spark', effects), cast);
    expect(rng).toEqual(cast);
  });

  it('copies a spell under its id with sourceId: the copy and the spell never share a squad', () => {
    const seed = testAbility(
      'seed',
      [
        {
          kind: 'buff',
          stat: 'prot',
          delta: 2,
          duration: { kind: 'battle' },
          targets: { kind: 'friendlySquad' },
        },
      ],
      { sourceId: 'barkSkin' },
    );
    const druid = commander('m', 'elderDruid', { spells: [SPELLS.barkSkin] });
    const { field, castBy } = staged(
      side([squad('a', 'warden', 20), squad('b', 'warden', 10)], [god('p', [seed]), druid]),
      side([squad('d', 'warden', 5)]),
    );
    const log = fire(field);
    expect(log).toContainEqual({
      kind: 'ability',
      unit: 'p',
      ability: 'test:seed',
      targets: ['a'],
    });
    expect(log).toContainEqual(
      expect.objectContaining({ kind: 'buff', target: 'a', delta: 2, source: 'barkSkin' }),
    );
    // Bark Skin skips the squad the seed already barked.
    expect(castBy('m', SPELLS.barkSkin).find((e) => e.kind === 'buff')).toMatchObject({
      target: 'b',
      source: 'barkSkin',
    });
  });

  describe('two copies of one spell', () => {
    const seed = testAbility(
      'seed',
      [
        {
          kind: 'buff',
          stat: 'prot',
          delta: 2,
          duration: { kind: 'battle' },
          targets: { kind: 'friendlySquad' },
        },
      ],
      { sourceId: 'barkSkin' },
    );
    const twoGods = (squads: Parameters<typeof side>[0]) =>
      buildField(
        setup(
          side(squads, [god('p1', [seed]), god('p2', [seed])]),
          side([squad('d', 'warden', 5)]),
        ),
      );

    it('plan under the spell’s id: the second skips the squad the first barked', () => {
      const log = fire(twoGods([squad('a', 'warden', 20), squad('b', 'warden', 10)]));
      expect(log.flatMap((e) => (e.kind === 'buff' ? [[e.target, e.source]] : []))).toEqual([
        ['a', 'barkSkin'],
        ['b', 'barkSkin'],
      ]);
    });

    it('check targets under the spell’s id: with one squad barked, the second does not fire', () => {
      const log = fire(twoGods([squad('a', 'warden', 20)]));
      expect(abilityEvents(log).map((e) => [e.unit, e.targets])).toEqual([['p1', ['a']]]);
      expect(log.filter((e) => e.kind === 'buff')).toHaveLength(1);
    });
  });
});

/** A battle with an ability on each side, from fresh setups. */
function withAbilities(): BattleSetup {
  return setup(
    side([squad('a', 'cinderWarrior', 15, { leader: 'p' })], [god('p', [ABILITIES.kindleTheHost])]),
    side(
      [squad('d', 'warden', 20, { leader: 'q' }), squad('e', 'longbowHunter', 10)],
      [god('q', [ABILITIES.primordialFear])],
    ),
  );
}

describe('abilities and determinism', () => {
  it('give one log for one setup and rng state, with or without a detail sink', () => {
    for (const seed of [1, 2, 3]) {
      const plain = resolveBattle(withAbilities(), createRng(seed));
      expect(resolveBattle(withAbilities(), createRng(seed))).toStrictEqual(plain);
      const rng = createRng(seed);
      const watched = resolveBattle(withAbilities(), rng, { detail: [] });
      expect(watched).toStrictEqual(plain);
    }
  });

  it('are in none of the golden fixtures, so the goldens cannot move', () => {
    const commanders = (s: BattleSetup): BattleCommanderSetup[] => [
      ...s.attacker.commanders,
      ...s.defender.commanders,
    ];
    for (const f of NAMED) {
      for (const c of commanders(f.build())) expect(c.abilities, f.name).toEqual([]);
    }
  });
});

describe('a recorded battle with abilities', () => {
  it('stores them by id and re-runs to the same log', () => {
    const record = toSetupRecord(withAbilities());
    expect(record.attacker.commanders[0]!.abilities).toEqual(['kindleTheHost']);
    expect(record.defender.commanders[0]!.abilities).toEqual(['primordialFear']);
    expect(fromSetupRecord(record)).toEqual(withAbilities());
    for (const seed of [1, 2, 3]) {
      const result = resolveBattle(withAbilities(), createRng(seed));
      expect(abilityEvents(result.replay)).toHaveLength(2);
      const rerun = { setup: record, rng: createRng(seed), rules: battleRulesHash() };
      const stored = { winner: result.winner, rounds: result.rounds, replay: result.replay };
      expect(matchesRecord(rerunBattle(rerun), stored as BattleRecord)).toBe(true);
    }
  });

  it('is fingerprinted with the abilities: changing one changes the battle rules', () => {
    const before = battleRulesInput();
    expect(before).toContain(JSON.stringify(ABILITIES));
    const fear = ABILITIES.primordialFear as AbilityDef;
    patched(fear, 'effects', [{ ...fear.effects[0]!, delta: -3 } as BattleEffect], () => {
      expect(battleRulesInput()).not.toBe(before);
    });
    expect(battleRulesInput()).toBe(before);
  });

  it('throws on an unknown ability id, and a record without abilities is no valid re-run', () => {
    const record = toSetupRecord(withAbilities());
    const unknown = structuredClone(record);
    unknown.attacker.commanders[0]!.abilities = ['noSuchAbility'];
    expect(() => fromSetupRecord(unknown)).toThrow(/noSuchAbility/);
    const testOnly = toSetupRecord(
      setup(side([], [god('p', [testAbility('x', [])])]), side([squad('d', 'warden', 1)])),
    );
    expect(() => fromSetupRecord(testOnly)).toThrow(/test:x/);
    // A 6b.1 record had no abilities field: it loads as a log-only replay.
    const old = structuredClone(record) as unknown as {
      attacker: { commanders: Record<string, unknown>[] };
    };
    delete old.attacker.commanders[0]!.abilities;
    const rerun = { setup: old, rng: createRng(1), rules: battleRulesHash() };
    expect(validRerun(rerun)).toBe(false);
    expect(validRerun({ ...rerun, setup: record })).toBe(true);
  });
});
