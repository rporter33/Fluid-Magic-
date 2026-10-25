// Battle effect primitives (docs/02-magic.md sections 5 and 8): what each one does, timed changes
// and their removal, summons, and how the replay log reports them.
import { describe, expect, it } from 'vitest';
import { SPELLS } from '../../../src/content/spells';
import type { BattleSpellDef } from '../../../src/content/spells/types';
import { dropMods, untilRound } from '../../../src/sim/battle/effects';
import type { BattleEvent } from '../../../src/sim/battle/events';
import { group, type StatMod } from '../../../src/sim/battle/field';
import { resolveBattle } from '../../../src/sim/battle/resolve';
import type { BattleSideSetup } from '../../../src/sim/battle/types';
import { createRng } from '../../../src/sim/rng';
import type { ScriptSlot } from '../../../src/sim/types';
import { byRound, commander, fightOnce, IMMORTAL, setup, side, squad, statsOf } from './fixtures';
import { afterCast, mage, testSpell } from './spellFixtures';

describe('untilRound', () => {
  it('gives the last round a change holds, or null for the battle', () => {
    expect(untilRound({ kind: 'rounds', rounds: 5 }, 3)).toBe(7);
    expect(untilRound({ kind: 'rounds', rounds: 1 }, 3)).toBe(3);
    expect(untilRound({ kind: 'battle' }, 3)).toBeNull();
  });
});

describe('dropMods', () => {
  it('drops every change passing the test and logs one expire per logged source', () => {
    const g = group('attacker', 'a', null, statsOf('ashMilitia'), 'front', 1, 10, null);
    const mod = (source: string, untilRound: number | null, logged: boolean): StatMod => ({
      stat: 'att',
      delta: 1,
      source,
      untilRound,
      debuff: false,
      logged,
    });
    g.mods = [mod('b', 2, true), mod('fog', 2, false), mod('b', 2, true), mod('c', null, true)];
    const log: BattleEvent[] = [];
    dropMods(g, (m) => m.untilRound !== null && m.untilRound <= 2, log);
    expect(g.mods.map((m) => m.source)).toEqual(['c']);
    expect(log).toEqual([{ kind: 'expire', target: 'a', source: 'b' }]);
    // Nothing passes: nothing is logged.
    dropMods(g, (m) => m.source === 'b', log);
    expect(log).toHaveLength(1);
  });
});

describe('field effects in the log', () => {
  it('report their stat changes by field and fieldEnd alone: every expire answers a buff', () => {
    // Fog for 3 rounds, plus a 2-round buff on the caster from the same spell, cast once.
    const hold = { kind: 'hold' } as const;
    const fogSpell: BattleSpellDef = {
      ...SPELLS.emberDart,
      id: 'test:fog',
      effects: [
        { kind: 'fieldEffect', effect: 'fog', rounds: 3 },
        {
          kind: 'buff',
          stat: 'mor',
          delta: 1,
          duration: { kind: 'rounds', rounds: 2 },
          targets: { kind: 'self' },
        },
      ],
    };
    const result = fightOnce(
      side(
        [
          squad('a', 'flameArcher', 10, { stats: IMMORTAL }),
          squad('a2', 'cinderWarrior', 10, { stats: IMMORTAL }),
        ],
        [
          commander('m', 'cinderMagus', {
            spells: [fogSpell],
            script: [
              { kind: 'cast', spellId: 'test:fog' },
              ...Array.from({ length: 4 }, () => hold),
            ],
            pips: { R: 3 },
            stats: IMMORTAL,
            hp: 50,
          }),
        ],
      ),
      side([squad('d', 'ashMilitia', 30, { stats: IMMORTAL })]),
    );
    const events = byRound(result);
    expect(events).toContainEqual({
      round: 1,
      event: { kind: 'field', effect: 'fog', caster: 'm', untilRound: 3 },
    });
    expect(events).toContainEqual({ round: 3, event: { kind: 'fieldEnd', effect: 'fog' } });
    const changes = events.flatMap(({ round, event }) =>
      event.kind === 'buff' || event.kind === 'expire' ? [{ round, event }] : [],
    );
    // Only the caster's own buff is logged, at either end; the fog's changes are not.
    expect(changes.map(({ round, event }) => [round, event.kind, event.target])).toEqual([
      [1, 'buff', 'm'],
      [2, 'expire', 'm'],
    ]);
    changes.forEach(({ event }, i) => {
      if (event.kind !== 'expire') return;
      const announced = changes
        .slice(0, i)
        .some(
          ({ event: e }) =>
            e.kind === 'buff' && e.target === event.target && e.source === event.source,
        );
      expect(announced, `${event.target} ${event.source}`).toBe(true);
    });
  });
});

describe('spell effects', () => {
  it('Blood Fury lands all three changes on one squad, and a recast replaces them', () => {
    const result = fightOnce(
      side([squad('w', 'cinderWarrior', 10, { leader: 'm' })], [mage('m', [SPELLS.bloodFury])]),
      side([squad('d', 'ashMilitia', 3, { stats: IMMORTAL })]),
    );
    const buffs = afterCast(result.replay, 'bloodFury').flatMap((e) =>
      e.kind === 'buff' ? [[e.target, e.stat, e.delta]] : [],
    );
    expect(buffs).toEqual([
      ['w', 'att', 2],
      ['w', 'str', 3],
      ['w', 'def', -2],
    ]);

    // Warcry, Swarm, Warcry: the second Warcry replaces the first instead of stacking.
    const script: ScriptSlot[] = ['warcry', 'swarm', 'warcry', 'warcry', 'warcry'].map(
      (spellId) => ({ kind: 'cast', spellId }),
    );
    const recast = fightOnce(
      side(
        [squad('w', 'cinderWarrior', 10, { leader: 'm', stats: IMMORTAL })],
        [
          {
            ...mage('m', [SPELLS.warcry, SPELLS.swarm], {
              carried: { R: 2, G: 1 },
              immortal: true,
            }),
            script,
          },
        ],
      ),
      side([squad('d', 'ashMilitia', 3, { stats: IMMORTAL })]),
    );
    const third = byRound(recast)
      .filter(({ round }) => round === 3)
      .flatMap(({ event }) =>
        event.kind === 'expire' || event.kind === 'buff' ? [[event.kind, event.target]] : [],
      );
    expect(third).toEqual([
      ['expire', 'w'],
      ['expire', 'm'],
      ['buff', 'w'],
      ['buff', 'm'],
      ['buff', 'su0'],
    ]);
  });

  it('Entangle holds 5 rounds, then lapses; Regrowth lifts it whole', () => {
    const entangled = fightOnce(
      side(
        [squad('a', 'ashMilitia', 1, { stats: IMMORTAL })],
        [mage('m', [SPELLS.entangle], { immortal: true })],
      ),
      side([squad('d', 'ashMilitia', 3, { stats: IMMORTAL })]),
    );
    const timeline = byRound(entangled).filter(
      ({ event }) => (event.kind === 'buff' || event.kind === 'expire') && event.target === 'd',
    );
    expect(timeline.slice(0, 3).map(({ round, event }) => [round, event.kind])).toEqual([
      [1, 'buff'],
      [1, 'buff'],
      [5, 'expire'],
    ]);

    // Cast in round 3, it logs its last round, 7, and lapses at the end of it.
    const hold = { kind: 'hold' } as const;
    const late = fightOnce(
      side(
        [squad('a', 'ashMilitia', 1, { stats: IMMORTAL })],
        [
          {
            ...mage('m', [SPELLS.entangle], { immortal: true }),
            script: [hold, hold, { kind: 'cast', spellId: 'entangle' }, hold, hold],
          },
        ],
      ),
      side([squad('d', 'ashMilitia', 3, { stats: IMMORTAL })]),
    );
    const lateTimeline = byRound(late).filter(
      ({ event }) => (event.kind === 'buff' || event.kind === 'expire') && event.target === 'd',
    );
    expect(lateTimeline.map(({ round, event }) => [round, event])).toEqual([
      [3, expect.objectContaining({ kind: 'buff', stat: 'def', untilRound: 7 })],
      [3, expect.objectContaining({ kind: 'buff', stat: 'att', untilRound: 7 })],
      [7, { kind: 'expire', target: 'd', source: 'entangle' }],
    ]);

    const curse: BattleSpellDef = { ...SPELLS.entangle, id: 'test:curse' };
    const healed = fightOnce(
      side(
        [squad('a', 'ashMilitia', 1, { stats: IMMORTAL })],
        [mage('m', [SPELLS.regrowth], { carried: { G: 2 }, immortal: true })],
      ),
      side([], [mage('e', [curse], { immortal: true })]),
    );
    const lifted = byRound(healed).find(
      ({ event }) =>
        event.kind === 'expire' && event.target === 'a' && event.source === 'test:curse',
    );
    expect(lifted?.round).toBe(2);
    // The whole curse goes: no other expire for it follows in round 5 or 6.
    const later = byRound(healed).filter(
      ({ round, event }) =>
        event.kind === 'expire' &&
        event.source === 'test:curse' &&
        event.target === 'a' &&
        round === 6,
    );
    expect(later).toEqual([]);
  });

  it('summons fight with the stats the side was given', () => {
    const swarm = mage('m', [SPELLS.swarm], { carried: { G: 1 } });
    const attacker: BattleSideSetup = {
      ...side([], [swarm]),
      summons: { hornetSwarm: statsOf('hornetSwarm', { att: 99 }) },
    };
    const result = resolveBattle(
      setup(attacker, side([squad('d', 'ashMilitia', 5)])),
      createRng(1),
    );
    expect(result.replay).toContainEqual(
      expect.objectContaining({ kind: 'summon', squad: 'su0', row: 'front' }),
    );
    // Summons leave with the battle and are not casualties.
    expect(result.squads.get('su0')).toBeDefined();
    const frail = resolveBattle(
      setup(
        {
          ...side([], [mage('m', [SPELLS.swarm], { carried: { G: 1 }, immortal: true })]),
          summons: { hornetSwarm: statsOf('hornetSwarm', { hp: 1 }) },
        },
        side([squad('d', 'cinderWarrior', 5, { stats: { ...IMMORTAL, def: 99 } })]),
      ),
      createRng(1),
    );
    // Hornets fall to warriors nothing can hurt, and still nobody is a casualty.
    expect(frail.squads.get('su0')?.count).toBeLessThan(20);
    expect(frail.casualties).toBe(0);
    expect(() =>
      resolveBattle(
        setup({ ...attacker, summons: {} }, side([squad('d', 'ashMilitia', 5)])),
        createRng(1),
      ),
    ).toThrow(/no stats for summoned hornetSwarm/);
  });
});

describe('primitives no M1 spell uses', () => {
  it('moraleShock makes a squad check at once, harder by its amount', () => {
    const fear = testSpell('test:fear', [
      { kind: 'moraleShock', amount: -10, targets: { kind: 'enemySquad' } },
    ]);
    let routs = 0;
    for (let s = 0; s < 100; s++) {
      const result = fightOnce(
        side([], [mage('m', [fear], { immortal: true })]),
        side([squad('d', 'ashMilitia', 10)]),
        s,
      );
      if (byRound(result).some(({ round, event }) => round === 1 && event.kind === 'rout')) routs++;
    }
    expect(routs).toBeGreaterThan(80);
  });

  it('a storm grounds every shot while it lasts; a wall keeps the fronts apart', () => {
    const storm = testSpell(
      'test:storm',
      [{ kind: 'fieldEffect', effect: 'storm', rounds: 3 }],
      300,
    );
    const stormy = fightOnce(
      side(
        // Infantry holds the front, so the archers behind would shoot every round.
        [
          squad('w', 'cinderWarrior', 10, { stats: IMMORTAL }),
          squad('a', 'flameArcher', 10, { stats: IMMORTAL }),
        ],
        [mage('m', [storm], { immortal: true })],
      ),
      side([squad('d', 'ashMilitia', 30, { stats: IMMORTAL })]),
    );
    const volleys = byRound(stormy)
      .filter(({ event }) => event.kind === 'volley')
      .map(({ round }) => round);
    expect(Math.min(...volleys)).toBe(4);
    expect(stormy.replay).toContainEqual({
      kind: 'field',
      effect: 'storm',
      caster: 'm',
      untilRound: 3,
    });
    expect(byRound(stormy).find(({ event }) => event.kind === 'fieldEnd')?.round).toBe(3);

    const wall = testSpell('test:wall', [{ kind: 'fieldEffect', effect: 'wall', rounds: 4 }], 300);
    const walled = fightOnce(
      side(
        [squad('a', 'ashRider', 10, { stats: IMMORTAL })],
        [mage('m', [wall], { immortal: true })],
      ),
      side([squad('d', 'ashMilitia', 30, { stats: IMMORTAL })]),
    );
    const melee = byRound(walled)
      .filter(({ event }) => event.kind === 'melee')
      .map(({ round }) => round);
    expect(Math.min(...melee)).toBe(5);
  });

  it('in a storm archers in the front row cannot shoot, so they close from their closing round', () => {
    const storm = testSpell(
      'test:storm',
      [{ kind: 'fieldEffect', effect: 'storm', rounds: 10 }],
      300,
    );
    const result = fightOnce(
      side(
        [squad('a', 'flameArcher', 10, { stats: IMMORTAL })],
        [mage('m', [storm], { immortal: true })],
      ),
      side([squad('d', 'longbowHunter', 10, { stats: IMMORTAL })]),
    );
    const melee = byRound(result)
      .filter(({ event }) => event.kind === 'melee')
      .map(({ round }) => round);
    const volleys = byRound(result).filter(({ event }) => event.kind === 'volley');
    expect(volleys.filter(({ round }) => round <= 10)).toEqual([]);
    // Both are speed 2 (closing round 3), well inside the storm's 10 rounds.
    expect(Math.min(...melee)).toBe(3);
  });

  it('fog lowers everyone’s precision while it lasts', () => {
    const fog = testSpell('test:fog', [{ kind: 'fieldEffect', effect: 'fog', rounds: 75 }]);
    let clear = 0;
    let foggy = 0;
    for (let s = 0; s < 40; s++) {
      for (const [spells, count] of [
        [[], 'clear'],
        [[fog], 'foggy'],
      ] as const) {
        const result = fightOnce(
          side(
            [squad('a', 'flameArcher', 20, { stats: IMMORTAL })],
            [mage('m', spells, { immortal: true })],
          ),
          side([squad('d', 'ashMilitia', 30, { stats: IMMORTAL })]),
          s,
        );
        const hits = result.replay.reduce((n, e) => n + (e.kind === 'volley' ? e.hits : 0), 0);
        if (count === 'clear') clear += hits;
        else foggy += hits;
      }
    }
    expect(foggy).toBeLessThan(clear * 0.8);
  });
});
