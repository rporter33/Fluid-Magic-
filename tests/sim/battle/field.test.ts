// The battlefield's rows, targets, and per-troop stats (docs/04-battle.md and its decisions).
import { describe, expect, it } from 'vitest';
import {
  buildField,
  frontRow,
  statOf,
  targetsUpTo,
  type Group,
} from '../../../src/sim/battle/field';
import { setup, side, squad } from './fixtures';

/** A defender with a squad in front and another in the middle. */
function twoRows() {
  const field = buildField(
    setup(
      side([squad('a', 'cinderWarrior', 10)]),
      side([
        squad('r', 'ashMilitia', 5, { row: 'front' }),
        squad('m', 'ashMilitia', 5, { row: 'middle' }),
      ]),
    ),
  );
  const [r, m] = field.sides.defender as [Group, Group];
  return { field, r, m };
}

describe('the front and its targets', () => {
  it('is the first row with an active unit: a routing front squad no longer holds it', () => {
    const { field, r } = twoRows();
    expect(frontRow(field, 'defender')).toBe('front');
    r.routingSince = 2;
    expect(frontRow(field, 'defender')).toBe('middle');
  });

  it('still offers routing stragglers in front of the new front as targets', () => {
    const { field, r, m } = twoRows();
    r.routingSince = 2;
    const targets = targetsUpTo(field, 'defender', 'middle');
    expect(targets.filter((t) => t.group === r)).toHaveLength(5);
    expect(targets.filter((t) => t.group === m)).toHaveLength(5);
  });
});

describe('berserk troops', () => {
  it('gain attack and strength only below half their HP', () => {
    const field = buildField(
      setup(side([squad('b', 'berserker', 2)]), side([squad('d', 'ashMilitia', 1)])),
    );
    const [low, half] = (field.sides.attacker[0] as Group).members as [
      Group['members'][0],
      Group['members'][0],
    ];
    low.hp = 6.4;
    half.hp = 6.5;
    expect([statOf(low, 'att'), statOf(low, 'str')]).toEqual([14, 15]);
    expect([statOf(half, 'att'), statOf(half, 'str')]).toEqual([12, 13]);
  });
});
