// Battle spells (docs/02-magic.md sections 3 and 5; docs/04-battle.md round step 1): every Red
// and Green battle spell, fatigue, script choice, and every battle primitive.
import { describe, expect, it } from 'vitest';
import { BATTLE_SPELLS, SPELLS } from '../../../src/content/spells';
import type { BattleEffect, BattleSpellDef } from '../../../src/content/spells/types';
import type { BattleEvent } from '../../../src/sim/battle/events';
import { group } from '../../../src/sim/battle/field';
import { resolveBattle } from '../../../src/sim/battle/resolve';
import { fatigueCost } from '../../../src/sim/battle/spells';
import type { BattleCommanderSetup, BattleSideSetup } from '../../../src/sim/battle/types';
import { createRng } from '../../../src/sim/rng';
import type { Pips, ScriptSlot } from '../../../src/sim/types';
import { byRound, commander, fightOnce, setup, side, squad, statsOf } from './fixtures';

const IMMORTAL = { mor: 50, prot: 99, hp: 50 };

function casting(spellId: string | null): ScriptSlot[] {
  return Array.from({ length: 5 }, () => ({ kind: 'cast' as const, spellId }));
}

/** A mage that casts the named spell (or its best one) every round. */
function mage(
  ref: string,
  spells: readonly BattleSpellDef[],
  opts: {
    named?: string | null;
    pips?: Pips;
    carried?: Pips;
    holy?: number;
    immortal?: boolean;
  } = {},
): BattleCommanderSetup {
  return commander(ref, 'cinderMagus', {
    spells,
    script: casting(opts.named === undefined ? (spells[0]?.id ?? null) : opts.named),
    pips: opts.pips ?? { R: 3, G: 3 },
    holy: opts.holy ?? 1,
    carriedMana: opts.carried ?? {},
    ...(opts.immortal ? { stats: IMMORTAL, hp: 50 } : {}),
  });
}

function casts(replay: readonly BattleEvent[]) {
  return replay.flatMap((e) => (e.kind === 'cast' ? [e] : []));
}

/** Events from a cast up to the next cast or phase event, i.e. the cast's own effects. */
function afterCast(replay: readonly BattleEvent[], spellId: string): BattleEvent[] {
  const i = replay.findIndex((e) => e.kind === 'cast' && e.spellId === spellId);
  if (i < 0) return [];
  const out: BattleEvent[] = [];
  for (const e of replay.slice(i + 1)) {
    if (['cast', 'volley', 'melee', 'roundStart'].includes(e.kind)) break;
    out.push(e);
  }
  return out;
}

const RED_GREEN = BATTLE_SPELLS.filter((s) => s.color === 'R' || s.color === 'G');

describe('every Red and Green battle spell', () => {
  it('has ten of them', () => {
    expect(RED_GREEN.map((s) => s.id)).toEqual([
      'emberDart',
      'fireball',
      'warcry',
      'bloodFury',
      'pyreStorm',
      'thornSpray',
      'barkSkin',
      'entangle',
      'swarm',
      'regrowth',
    ]);
  });

  it.each(RED_GREEN.map((s) => [s.id, s] as const))('%s casts in round 1 and works', (_, spell) => {
    const result = fightOnce(
      side(
        // A wounded friendly squad gives heals and buffs a target.
        [squad('w', 'cinderWarrior', 10, { leader: 'm', hp: 80 })],
        [mage('m', [spell], { carried: { R: 1, G: 1 } })],
      ),
      side([squad('d', 'ashMilitia', 30)]),
      3,
    );
    const first = casts(result.replay)[0];
    expect(first).toMatchObject({ caster: 'm', spellId: spell.id });
    const effects = afterCast(result.replay, spell.id);
    const kinds = new Set(spell.effects.map((e: BattleEffect) => e.kind));
    if (kinds.has('damage')) expect(effects.some((e) => e.kind === 'damage')).toBe(true);
    if (kinds.has('buff')) {
      expect(effects.some((e) => e.kind === 'buff' && e.source === spell.id && !e.debuff)).toBe(
        true,
      );
    }
    if (kinds.has('debuff')) {
      expect(effects.some((e) => e.kind === 'buff' && e.debuff && e.target === 'd')).toBe(true);
    }
    if (kinds.has('summon')) {
      expect(effects).toContainEqual(
        expect.objectContaining({ kind: 'summon', unit: 'hornetSwarm', count: 20, commander: 'm' }),
      );
    }
    if (kinds.has('heal')) expect(effects.some((e) => e.kind === 'heal')).toBe(true);
    // Carried mana is used up and written back.
    if (Object.keys(spell.carriedMana).length > 0) {
      const left = result.commanders.get('m')?.carriedMana ?? {};
      for (const [c, n] of Object.entries(spell.carriedMana)) {
        expect(left[c as 'R'], c).toBe(1 - n);
      }
    }
  });

  it('Pyre Storm on a 30-militia front row kills at least 8 on average (docs/04)', () => {
    let kills = 0;
    const seeds = 200;
    for (let s = 0; s < seeds; s++) {
      const result = fightOnce(
        side([], [mage('m', [SPELLS.pyreStorm], { carried: { R: 1 } })]),
        side([squad('d', 'ashMilitia', 30, { row: 'front' })]),
        s,
      );
      for (const e of afterCast(result.replay, 'pyreStorm')) {
        if (e.kind === 'damage') kills += e.kills;
      }
    }
    expect(kills / seeds).toBeGreaterThanOrEqual(8);
  });

  it('cannot be cast without the carried mana it needs, so the mage holds', () => {
    const result = fightOnce(
      side([], [mage('m', [SPELLS.pyreStorm])]),
      side([squad('d', 'ashMilitia', 30)]),
    );
    expect(casts(result.replay)).toEqual([]);
  });
});

describe('fatigue', () => {
  const caster = (pips: Pips, holy = 0) =>
    group('attacker', 'm', null, statsOf('cinderMagus'), 'rear', 1, 11, {
      script: [],
      pips,
      holy,
      spells: [],
      carriedMana: {},
    });

  it('costs the listed fatigue, 5 less per extra pip, never under 20%', () => {
    expect(fatigueCost(caster({ R: 1 }), SPELLS.emberDart)).toBe(10);
    expect(fatigueCost(caster({ R: 2 }), SPELLS.emberDart)).toBe(5);
    expect(fatigueCost(caster({ R: 3 }), SPELLS.emberDart)).toBe(2);
    expect(fatigueCost(caster({ R: 3 }), SPELLS.pyreStorm)).toBe(60);
    expect(fatigueCost(caster({ R: 4 }), SPELLS.pyreStorm)).toBe(55);
    // Pips of other colors do not help; holy pips help holy spells only.
    expect(fatigueCost(caster({ R: 1, G: 3 }), SPELLS.emberDart)).toBe(10);
    expect(fatigueCost(caster({}, 3), SPELLS.bless)).toBe(2);
  });

  it('recovers 5 a round and stops the mage at 100 until it is below again', () => {
    const result = fightOnce(
      side(
        [squad('a', 'ashMilitia', 1, { stats: IMMORTAL })],
        [mage('m', [SPELLS.pyreStorm], { pips: { R: 3 }, carried: { R: 9 }, immortal: true })],
      ),
      side([squad('d', 'ashMilitia', 30, { stats: IMMORTAL })]),
    );
    const rounds = byRound(result)
      .filter(({ event }) => event.kind === 'cast')
      .map(({ round }) => round);
    // 60 then 115: exhausted from 110 down to 100, casts at 95 (155), then waits to 95 again.
    expect(rounds.slice(0, 4)).toEqual([1, 2, 6, 18]);
  });

  it('takes no action at 100: an exhausted commander in contact makes no attack', () => {
    const tired: BattleSpellDef = {
      ...SPELLS.warcry,
      id: 'test:tiring',
      fatigue: 200,
      carriedMana: {},
      effects: [
        {
          kind: 'buff',
          stat: 'mor',
          delta: 1,
          duration: { kind: 'battle' },
          targets: { kind: 'self' },
        },
      ],
    };
    const result = fightOnce(
      side([], [{ ...mage('m', [tired], { pips: { R: 1 }, immortal: true }), row: 'front' }]),
      side([squad('d', 'cinderWarrior', 5, { stats: IMMORTAL })]),
    );
    const struck = byRound(result).filter(
      ({ event }) => event.kind === 'melee' && event.squad === 'm',
    );
    // 200 fatigue lasts until round 21: no strike before it falls below 100.
    expect(struck.every(({ round }) => round > 20)).toBe(true);
    expect(casts(result.replay)).toHaveLength(1);
  });
});

describe('choosing a spell', () => {
  const book = [SPELLS.emberDart, SPELLS.bloodFury];

  it('casts damage first against 10 or more enemy troops, support first against fewer', () => {
    const vs = (n: number) =>
      casts(
        fightOnce(
          side(
            [squad('w', 'cinderWarrior', 10, { leader: 'm' })],
            [mage('m', book, { named: null })],
          ),
          side([squad('d', 'ashMilitia', n)]),
        ).replay,
      )[0]?.spellId;
    expect(vs(30)).toBe('emberDart');
    expect(vs(5)).toBe('bloodFury');
  });

  it('casts a named spell, and the best castable one when the named one has no target', () => {
    const named = fightOnce(
      side(
        [squad('w', 'cinderWarrior', 10, { leader: 'm' })],
        [mage('m', book, { named: 'bloodFury' })],
      ),
      side([squad('d', 'ashMilitia', 30)]),
    );
    const spells = casts(named.replay).map((c) => c.spellId);
    // Round 1 Blood Fury; then the squad already has it, so Ember Dart instead.
    expect(spells.slice(0, 2)).toEqual(['bloodFury', 'emberDart']);
  });

  it('falls back from a spell it does not know', () => {
    const result = fightOnce(
      side([], [mage('m', [SPELLS.emberDart], { named: 'fireball' })]),
      side([squad('d', 'ashMilitia', 30)]),
    );
    expect(casts(result.replay)[0]?.spellId).toBe('emberDart');
  });

  it('casts in turn, so a caster killed by an earlier cast does not cast that round', () => {
    const deathRay: BattleSpellDef = {
      ...SPELLS.emberDart,
      id: 'test:deathRay',
      effects: [{ kind: 'damage', amount: 500, element: 'fire', targets: { kind: 'single' } }],
    };
    const result = fightOnce(
      side([squad('a', 'ashMilitia', 1, { stats: IMMORTAL })], [mage('am', [deathRay])]),
      side([], [mage('dm', [SPELLS.emberDart])]),
    );
    expect(casts(result.replay).map((c) => c.caster)).toEqual(['am']);
    expect(result.commanders.get('dm')?.dead).toBe(true);
  });

  it('gives a priest Bless on one squad at a time', () => {
    const result = fightOnce(
      side(
        [
          squad('w', 'cinderWarrior', 10, { leader: 'p' }),
          squad('x', 'ashMilitia', 20, { leader: 'p' }),
        ],
        [mage('p', [SPELLS.bless, SPELLS.emberDart], { named: 'bless', pips: { R: 1 }, holy: 2 })],
      ),
      side([squad('d', 'ashMilitia', 30)]),
    );
    const order = casts(result.replay).map((c) => [c.spellId, c.targets]);
    expect(order.slice(0, 3)).toEqual([
      ['bless', ['x']],
      ['bless', ['w']],
      ['emberDart', ['d']],
    ]);
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
    expect(() =>
      resolveBattle(
        setup({ ...attacker, summons: {} }, side([squad('d', 'ashMilitia', 5)])),
        createRng(1),
      ),
    ).toThrow(/no stats for summoned hornetSwarm/);
  });
});

describe('primitives no M1 spell uses', () => {
  /** A test-only spell; a huge fatigue makes it a once-a-battle cast. */
  const test = (id: string, effects: BattleEffect[], fatigue = 10): BattleSpellDef => ({
    ...SPELLS.emberDart,
    id,
    fatigue,
    effects,
  });

  it('damage on a whole squad hits every troop of it', () => {
    const blast = test('test:blast', [
      { kind: 'damage', amount: 500, element: 'fire', targets: { kind: 'squad' } },
    ]);
    const result = fightOnce(side([], [mage('m', [blast])]), side([squad('d', 'ashMilitia', 30)]));
    expect(afterCast(result.replay, 'test:blast')).toContainEqual(
      expect.objectContaining({ kind: 'damage', target: 'd', kills: 30 }),
    );
  });

  it('moraleShock makes a squad check at once, harder by its amount', () => {
    const fear = test('test:fear', [
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

  it('fatigueDrain tires the enemy caster with the most pips', () => {
    const drain = test(
      'test:drain',
      [{ kind: 'fatigueDrain', amount: 100, targets: { kind: 'enemySquad' } }],
      300,
    );
    const result = fightOnce(
      side(
        [squad('a', 'ashMilitia', 1, { stats: IMMORTAL })],
        [mage('am', [drain], { immortal: true })],
      ),
      side(
        [squad('d', 'ashMilitia', 1, { stats: IMMORTAL })],
        [mage('dm', [SPELLS.emberDart], { immortal: true })],
      ),
    );
    expect(result.replay).toContainEqual({ kind: 'fatigue', unit: 'dm', amount: 100 });
    // Drained to 100 before its turn in round 1, it cannot cast until it recovers.
    const first = byRound(result).find(
      ({ event }) => event.kind === 'cast' && event.caster === 'dm',
    );
    expect(first?.round).toBe(2);
  });

  it('a storm grounds every shot while it lasts; a wall keeps the fronts apart', () => {
    const storm = test('test:storm', [{ kind: 'fieldEffect', effect: 'storm', rounds: 3 }], 300);
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

    const wall = test('test:wall', [{ kind: 'fieldEffect', effect: 'wall', rounds: 4 }], 300);
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

  it('fog lowers everyone’s precision while it lasts', () => {
    const fog = test('test:fog', [{ kind: 'fieldEffect', effect: 'fog', rounds: 75 }]);
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

  it('an area curse lands on every group its troops belong to', () => {
    const hex = test('test:hex', [
      {
        kind: 'debuff',
        stat: 'def',
        delta: -1,
        duration: { kind: 'battle' },
        targets: { kind: 'area', count: 60 },
      },
    ]);
    const result = fightOnce(
      side([], [mage('m', [hex])]),
      side([
        squad('d1', 'ashMilitia', 10, { row: 'front' }),
        squad('d2', 'ashMilitia', 10, { row: 'front' }),
      ]),
    );
    const cursed = afterCast(result.replay, 'test:hex').flatMap((e) =>
      e.kind === 'buff' ? [e.target] : [],
    );
    expect(cursed.sort()).toEqual(['d1', 'd2']);
  });

  it('a self heal mends only the caster', () => {
    const mend = test('test:mend', [{ kind: 'heal', amount: 5, targets: { kind: 'self' } }]);
    const result = fightOnce(
      side([squad('a', 'ashMilitia', 1, { stats: IMMORTAL })], [{ ...mage('m', [mend]), hp: 3 }]),
      side([squad('d', 'ashMilitia', 30)]),
    );
    expect(afterCast(result.replay, 'test:mend')).toEqual([
      { kind: 'heal', target: 'm', amount: 5 },
    ]);
  });
});

describe('life drain', () => {
  it('heals strikers still alive once the phase has landed', () => {
    const result = fightOnce(
      side([squad('a', 'cinderWarrior', 10, { hp: 50, stats: { lifeDrain: 2, mor: 50 } })]),
      side([squad('d', 'ashMilitia', 10, { stats: { mor: 50 } })]),
    );
    const heals = result.replay.filter((e) => e.kind === 'heal' && e.target === 'a');
    expect(heals.length).toBeGreaterThan(0);
    for (const h of heals) if (h.kind === 'heal') expect(h.amount % 2).toBe(0);
  });
});

describe('casting stays deterministic', () => {
  it('gives the same battle for the same setup and seed', () => {
    const make = () =>
      setup(
        side(
          [squad('w', 'cinderWarrior', 15, { leader: 'm' })],
          [mage('m', [SPELLS.fireball, SPELLS.bloodFury, SPELLS.warcry], { carried: { R: 2 } })],
        ),
        side(
          [squad('d', 'warden', 15, { leader: 'g' })],
          [
            mage('g', [SPELLS.thornSpray, SPELLS.entangle, SPELLS.swarm, SPELLS.regrowth], {
              carried: { G: 3 },
            }),
          ],
        ),
      );
    const a = resolveBattle(make(), createRng(4));
    expect(resolveBattle(make(), createRng(4))).toEqual(a);
    expect(casts(a.replay).length).toBeGreaterThan(2);
  });
});
