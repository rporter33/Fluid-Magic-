// Multi-strike weapons and trample (pretender build spec N2; docs/04-battle.md decisions,
// "Multi-strike weapons"), on a staged field: each swing is a full attack, a weapon's swings
// come one after another, and a size-limited weapon strikes only bodies up to its limit.
import { describe, expect, it } from 'vitest';
import type { WeaponDef } from '../../../src/content/types';
import { meleePhase } from '../../../src/sim/battle/attacks';
import type { DetailEvent } from '../../../src/sim/battle/detail';
import type { BattleEvent } from '../../../src/sim/battle/events';
import { buildField, groupStat } from '../../../src/sim/battle/field';
import type { BattleSideSetup } from '../../../src/sim/battle/types';
import { createRng } from '../../../src/sim/rng';
import { commander, IMMORTAL, setup, side, squad } from './fixtures';

const BITE: WeaponDef = { name: 'Bite', dmg: 10 };
const TRAMPLE: WeaponDef = { name: 'Trample', dmg: 2, strikes: 2, maxTargetSize: 2 };

/** One melee phase in round 3 between two staged sides, the defenders too tired to swing back. */
function melee(attacker: BattleSideSetup, defender: BattleSideSetup, seed = 1) {
  const field = buildField(setup(attacker, defender));
  for (const g of field.sides.defender) g.fatigue = 1000;
  const detail: DetailEvent[] = [];
  field.detail = detail;
  field.phase = 'melee';
  const log: BattleEvent[] = [];
  const rng = createRng(seed);
  meleePhase(field, 3, rng, log);
  const strikes = detail.flatMap((e) => (e.kind === 'strike' ? [e] : []));
  return { log, strikes, rng, field };
}

/** A lone front-row beast commander with these weapons. */
function beast(weapons: readonly WeaponDef[]) {
  return side([], [commander('w', 'greatWyrm', { row: 'front', stats: { ...IMMORTAL, weapons } })]);
}

describe('a multi-strike weapon', () => {
  it('logs twice the attacks of the same pair with strikes 2', () => {
    const attacks = (weapon: WeaponDef) => {
      const { log } = melee(
        side([squad('a', 'cinderWarrior', 5, { stats: { weapons: [weapon] } })]),
        side([squad('d', 'warden', 20, { stats: IMMORTAL, hp: 1000 })]),
      );
      const tally = log.find((e) => e.kind === 'melee' && e.squad === 'a');
      return tally?.kind === 'melee' ? tally.attacks : -1;
    };
    expect(attacks({ name: 'Axe', dmg: 5 })).toBe(5);
    expect(attacks({ name: 'Axe', dmg: 5, strikes: 2 })).toBe(10);
    expect(attacks({ name: 'Axe', dmg: 5, strikes: 4 })).toBe(20);
  });

  it('swings each weapon’s strikes in a row, each a full attack with its own target draw', () => {
    const { strikes } = melee(
      beast([BITE, TRAMPLE]),
      side([squad('d', 'thornMilitia', 30, { stats: IMMORTAL, hp: 1500 })]),
    );
    expect(strikes.map((s) => s.weapon)).toEqual([0, 1, 1]);
    // Each swing rolls its own attack and defense DRNs.
    expect(strikes.every((s) => s.attackDrn >= 2 && s.defenseDrn >= 2)).toBe(true);
  });

  it('swings all its strikes before the next weapon when it is listed first', () => {
    const { strikes } = melee(
      beast([TRAMPLE, BITE]),
      side([squad('d', 'thornMilitia', 30, { stats: IMMORTAL, hp: 1500 })]),
    );
    expect(strikes.map((s) => s.weapon)).toEqual([0, 0, 1]);
  });

  it('gives every swing the first-round bonus in the group’s first melee round', () => {
    const lance: WeaponDef = { name: 'Lance', dmg: 6, firstRoundBonus: 3, strikes: 2 };
    let hits = 0;
    for (let seed = 1; seed <= 10; seed++) {
      const { strikes, field } = melee(
        beast([lance]),
        side([squad('d', 'thornMilitia', 30, { stats: IMMORTAL, hp: 1500 })]),
        seed,
      );
      const str = groupStat(field.sides.attacker[0]!, 'str');
      expect(
        strikes.map((s) => s.firstRound),
        `seed ${String(seed)}`,
      ).toEqual([true, true]);
      for (const s of strikes) {
        if (!s.damage) continue;
        hits += 1;
        expect(s.damage.base, `seed ${String(seed)}`).toBe(str + 6 + 3);
      }
    }
    expect(hits).toBeGreaterThan(1);
  });
});

describe('trample', () => {
  it('never strikes a size-4 body while size-1 troops stand beside it', () => {
    let small = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const { strikes } = melee(
        beast([BITE, TRAMPLE]),
        side([
          squad('g', 'giant', 6, { row: 'front', stats: IMMORTAL, hp: 300 }),
          squad('m', 'thornMilitia', 6, { row: 'front', stats: IMMORTAL, hp: 300 }),
        ]),
        seed,
      );
      const trampled = strikes.filter((s) => s.weapon === 1);
      expect(trampled).toHaveLength(2);
      expect(
        trampled.every((s) => s.target === 'm'),
        `seed ${String(seed)}`,
      ).toBe(true);
      small += strikes.filter((s) => s.weapon === 0 && s.target === 'm').length;
    }
    // The Bite still picks among every body: both squads are bitten over the seeds.
    expect(small).toBeGreaterThan(0);
    expect(small).toBeLessThan(30);
  });

  it('draws nothing against bodies over its limit: the rng and log are those of no Trample', () => {
    const wyrms = () => side([squad('d', 'giant', 4, { stats: { ...IMMORTAL, size: 6 } })]);
    for (let seed = 1; seed <= 10; seed++) {
      const without = melee(beast([BITE]), wyrms(), seed);
      const withTrample = melee(beast([BITE, TRAMPLE]), wyrms(), seed);
      expect(withTrample.rng).toEqual(without.rng);
      expect(withTrample.log).toEqual(without.log);
      expect(withTrample.strikes.some((s) => s.weapon === 1)).toBe(false);
    }
  });

  it('reaches a body exactly at its limit: size 2 is trampled, size 3 beside it never', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const { strikes } = melee(
        beast([TRAMPLE]),
        side([
          squad('m', 'thornMilitia', 6, { row: 'front', stats: { ...IMMORTAL, size: 2 }, hp: 300 }),
          squad('g', 'thornMilitia', 6, { row: 'front', stats: { ...IMMORTAL, size: 3 }, hp: 300 }),
        ]),
        seed,
      );
      expect(
        strikes.map((s) => s.target),
        `seed ${String(seed)}`,
      ).toEqual(['m', 'm']);
    }
  });

  it('reads the target’s size from its stats, the body’s size by default', () => {
    // Militia at size 3 is out of Trample's reach.
    const { strikes } = melee(
      beast([TRAMPLE]),
      side([squad('m', 'thornMilitia', 6, { stats: { ...IMMORTAL, size: 3 }, hp: 300 })]),
    );
    expect(strikes).toEqual([]);
  });
});
