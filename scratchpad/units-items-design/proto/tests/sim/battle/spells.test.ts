// Battle spellcasting (docs/02-magic.md sections 3 and 6; docs/04-battle.md round step 1): every
// Red and Green battle spell, fatigue, which spell a commander casts, and determinism.
import { describe, expect, it } from 'vitest';
import { BATTLE_SPELLS, SPELLS } from '../../../src/content/spells';
import type { BattleEffect, BattleSpellDef } from '../../../src/content/spells/types';
import { group } from '../../../src/sim/battle/field';
import { resolveBattle } from '../../../src/sim/battle/resolve';
import { chooseSpell, fatigueCost } from '../../../src/sim/battle/spells';
import type { BattleSideSetup } from '../../../src/sim/battle/types';
import { createRng } from '../../../src/sim/rng';
import type { Pips } from '../../../src/sim/types';
import { byRound, commander, fightOnce, IMMORTAL, setup, side, squad, statsOf } from './fixtures';
import { afterCast, casts, mage, staged, testSpell } from './spellFixtures';

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

  /** A once-a-battle self buff: its 200 fatigue lasts until round 21. */
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

  it('takes no action at 100: an exhausted commander in contact makes no attack', () => {
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

  it('takes no Attack slot while exhausted: it advances once fatigue is below 100', () => {
    const attack = { kind: 'attack' } as const;
    const result = fightOnce(
      side(
        [squad('w', 'cinderWarrior', 5, { stats: IMMORTAL })],
        [
          {
            ...mage('m', [tired], { pips: { R: 1 }, immortal: true }),
            script: [{ kind: 'cast', spellId: 'test:tiring' }, attack, attack, attack, attack],
          },
        ],
      ),
      side([squad('d', 'cinderWarrior', 5, { stats: IMMORTAL })]),
    );
    // Fatigue 200 - 5 a round is 95 when round 22 begins.
    expect(byRound(result).find(({ event }) => event.kind === 'advance')).toEqual({
      round: 22,
      event: { kind: 'advance', unit: 'm', row: 'front' },
    });
  });
});

describe('choosing a spell', () => {
  const book = [SPELLS.emberDart, SPELLS.bloodFury];

  /** The first spell a best-spell caster picks against an enemy side, some of it routing. */
  const pick = (
    spells: readonly BattleSpellDef[],
    enemy: BattleSideSetup,
    routing: string[] = [],
  ) => {
    const { field, find } = staged(
      side(
        [squad('w', 'cinderWarrior', 10, { leader: 'm' })],
        [mage('m', spells, { named: null })],
      ),
      enemy,
    );
    for (const ref of routing) find(ref).routingSince = 1;
    return chooseSpell(field, find('m'), null)?.id;
  };
  const militia = (n: number) => side([squad('d', 'ashMilitia', n)]);

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

  it('counts only active enemy troops, from 10 up: commanders and routing squads aside', () => {
    expect(pick(book, militia(10))).toBe('emberDart');
    expect(pick(book, militia(9))).toBe('bloodFury');
    const chief = commander('c', 'ashChieftain');
    expect(pick(book, side([squad('d', 'ashMilitia', 9)], [chief]))).toBe('bloodFury');
    const fleeing = side([squad('d', 'ashMilitia', 5), squad('r', 'ashMilitia', 8)]);
    expect(pick(book, fleeing, ['r'])).toBe('bloodFury');
  });

  it('takes the highest level among spells of the kind it puts first', () => {
    expect(pick([SPELLS.emberDart, SPELLS.fireball], militia(30))).toBe('fireball');
    expect(pick([SPELLS.barkSkin, SPELLS.bloodFury], militia(5))).toBe('bloodFury');
  });

  it('casts a field effect only while none of its kind is in force', () => {
    const storm = testSpell('test:storm', [{ kind: 'fieldEffect', effect: 'storm', rounds: 3 }]);
    const result = fightOnce(
      side(
        [squad('w', 'cinderWarrior', 5, { stats: IMMORTAL })],
        [mage('m', [storm], { immortal: true })],
      ),
      side([squad('d', 'ashMilitia', 10, { stats: IMMORTAL })]),
    );
    const rounds = byRound(result)
      .filter(({ event }) => event.kind === 'cast')
      .map(({ round }) => round);
    // Each storm lasts through its third round; the next one comes the round after.
    expect(rounds.slice(0, 3)).toEqual([1, 4, 7]);
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

  const deathRay = testSpell('test:deathRay', [
    { kind: 'damage', amount: 500, element: 'fire', targets: { kind: 'single' } },
  ]);

  it('casts in turn, so a caster killed by an earlier cast does not cast that round', () => {
    const result = fightOnce(
      side([squad('a', 'ashMilitia', 1, { stats: IMMORTAL })], [mage('am', [deathRay])]),
      side([], [mage('dm', [SPELLS.emberDart])]),
    );
    expect(casts(result.replay).map((c) => c.caster)).toEqual(['am']);
    expect(result.commanders.get('dm')?.dead).toBe(true);
  });

  it('checks a commander a spell killed right after step 1, before any volley', () => {
    const result = fightOnce(
      side([squad('a', 'flameArcher', 10, { stats: IMMORTAL })], [mage('am', [deathRay])]),
      side(
        // The commander stands alone in front, so the spell finds it there.
        [squad('s', 'ashMilitia', 10, { leader: 'dm', row: 'middle', stats: { mor: 50 } })],
        [commander('dm', 'ashChieftain', { row: 'front' })],
      ),
    );
    const round1 = byRound(result).flatMap(({ round, event }) =>
      round === 1 && (event.kind === 'death' || event.kind === 'volley') ? [event.kind] : [],
    );
    expect(round1).toEqual(['death', 'volley']);
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
