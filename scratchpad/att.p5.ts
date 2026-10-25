// Ranged fire and melee phases on a staged field (docs/04-battle.md round steps 2 and 3; life
// drain and fatigue from the docs/02-magic.md decisions).
import { describe, expect, it } from 'vitest';
import { meleePhase, rangedPhase } from '../../../src/sim/battle/attacks';
import type { BattleEvent } from '../../../src/sim/battle/events';
import { buildField, type Group } from '../../../src/sim/battle/field';
import { drn } from '../../../src/sim/drn';
import { cloneRng, createRng, randBelow } from '../../../src/sim/rng';
import { commander, fightOnce, IMMORTAL, setup, side, squad } from './fixtures';

describe('routing units', () => {
  it('neither swing nor shoot in their exit round', () => {
    const field = buildField(
      setup(
        side([squad('w', 'ashRider', 10)]),
        side([
          squad('r', 'ashMilitia', 10, { row: 'front' }),
          squad('s', 'ashMilitia', 10, { row: 'front' }),
          squad('ra', 'flameArcher', 10, { row: 'middle' }),
        ]),
      ),
    );
    const [r, , ra] = field.sides.defender as [Group, Group, Group];
    r.routingSince = 1;
    ra.routingSince = 1;
    const log: BattleEvent[] = [];
    rangedPhase(field, 2, createRng(1), log);
    meleePhase(field, 2, createRng(1), log);
    expect(log.some((e) => (e.kind === 'melee' || e.kind === 'volley') && e.squad === 'r')).toBe(
      false,
    );
    expect(log.some((e) => e.kind === 'volley' && e.squad === 'ra')).toBe(false);
    expect(ra.ammo).toEqual([10]);
    expect(log.some((e) => e.kind === 'melee' && e.squad === 's')).toBe(true);
  });
});

describe('a ranged shot', () => {
  it('hits exactly when prec + DRN >= 10 + DRN (a tie hits)', () => {
    for (let seed = 0; seed < 300; seed++) {
      const field = buildField(
        setup(
          side([squad('a', 'flameArcher', 1, { stats: { prec: 10 } })]),
          side([squad('d', 'ashMilitia', 1)]),
        ),
      );
      const rng = createRng(seed);
      const replay = cloneRng(rng);
      randBelow(replay, 1);
      const hit = 10 + drn(replay) >= 10 + drn(replay);
      const log: BattleEvent[] = [];
      rangedPhase(field, 1, rng, log);
      const volley = log.find((e) => e.kind === 'volley');
      expect(volley?.kind === 'volley' && volley.hits, `seed ${String(seed)}`).toBe(hit ? 1 : 0);
    }
  });
});

describe('an exhausted commander', () => {
  /** Volleys and melee strikes, by squad, in a round where a commander this tired faces 10. */
  function blows(
    fatigue: number,
    attacker: ReturnType<typeof commander>,
    defender: 'ashMilitia' | 'flameArcher',
    round: number,
  ) {
    const field = buildField(setup(side([], [attacker]), side([squad('d', defender, 10)])));
    (field.sides.attacker[0] as Group).fatigue = fatigue;
    const log: BattleEvent[] = [];
    rangedPhase(field, round, createRng(1), log);
    meleePhase(field, round, createRng(2), log);
    return log.flatMap((e) =>
      e.kind === 'volley' || e.kind === 'melee' ? [[e.kind, e.squad]] : [],
    );
  }

  it('shoots no more at fatigue 100', () => {
    // In round 1, before the lines meet, a Salamander's Fire Breath reaches the militia.
    const salamander = commander('sal', 'salamander', { stats: IMMORTAL });
    expect(blows(99, salamander, 'ashMilitia', 1)).toEqual([['volley', 'sal']]);
    expect(blows(100, salamander, 'ashMilitia', 1)).toEqual([]);
  });

  it('does not close on the enemy, so archers facing it keep shooting', () => {
    const magus = commander('m', 'cinderMagus', { row: 'front', stats: IMMORTAL });
    // Rested, it closes and the archers must fight back hand to hand.
    expect(blows(99, magus, 'flameArcher', 5)).toEqual([
      ['melee', 'm'],
      ['melee', 'd'],
    ]);
    expect(blows(100, magus, 'flameArcher', 5)).toEqual([['volley', 'd']]);
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

  it('is paid once every blow of the phase has landed, and only to strikers still alive', () => {
    // A drainer on 2 HP strikes first (attacker side first) and is struck back in the same
    // phase: its own drain neither saves it nor heals it once dead.
    let wouldSave = 0;
    for (let seed = 0; seed < 300; seed++) {
      const field = buildField(
        setup(
          side(
            [],
            [
              commander('c', 'ashChieftain', {
                row: 'front',
                hp: 2,
                stats: { lifeDrain: 2, att: 99, str: 30, prot: 0 },
              }),
            ],
          ),
          side([squad('d', 'ashMilitia', 1, { hp: 999, stats: { hp: 999, att: 99, str: 0 } })]),
        ),
      );
      const c = field.sides.attacker[0] as Group;
      const log: BattleEvent[] = [];
      meleePhase(field, 5, createRng(seed), log);
      const taken = log.reduce(
        (n, e) => n + (e.kind === 'damage' && e.target === 'c' ? e.amount : 0),
        0,
      );
      const healed = log.some((e) => e.kind === 'heal' && e.target === 'c');
      expect(c.members[0]?.alive, `seed ${String(seed)}`).toBe(taken < 2);
      if (taken >= 2) expect(healed, `seed ${String(seed)}`).toBe(false);
      // Paid as its own blow landed, the drain (+2) would have outlasted this blow.
      if (taken >= 2 && taken < 4) wouldSave++;
    }
    expect(wouldSave).toBeGreaterThan(0);
  });
});
