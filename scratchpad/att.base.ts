// Ranged fire and melee phases on a staged field (docs/04-battle.md round steps 2 and 3).
import { describe, expect, it } from 'vitest';
import { meleePhase, rangedPhase } from '../../../src/sim/battle/attacks';
import type { BattleEvent } from '../../../src/sim/battle/events';
import { buildField, type Group } from '../../../src/sim/battle/field';
import { drn } from '../../../src/sim/drn';
import { cloneRng, createRng, randBelow } from '../../../src/sim/rng';
import { setup, side, squad } from './fixtures';

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
