// Who battle spells land on (docs/02-magic.md section 5): each target kind, one choice of
// targets per cast, support spells with no one to help, and the rows and routing groups that
// decide where a spell lands.
import { describe, expect, it } from 'vitest';
import { SPELLS } from '../../../src/content/spells';
import { byRound, commander, fightOnce, IMMORTAL, side, squad } from './fixtures';
import { afterCast, mage, staged, testSpell } from './spellFixtures';

describe('choosing targets', () => {
  it('Regrowth heals squads only, and is not cast when only a commander is hurt', () => {
    const regrowth = (hurtSquad: boolean) =>
      fightOnce(
        side(
          [squad('a', 'ashMilitia', 3, { stats: IMMORTAL, hp: hurtSquad ? 100 : 150 })],
          [
            mage('m', [SPELLS.regrowth], { carried: { G: 1 }, immortal: true }),
            commander('c', 'ashChieftain', { stats: IMMORTAL, hp: 4 }),
          ],
        ),
        side([squad('d', 'ashMilitia', 3)]),
      );
    const castIn = (result: ReturnType<typeof regrowth>) =>
      byRound(result).filter(({ event }) => event.kind === 'cast' && event.spellId === 'regrowth');
    // Round 1, before any blow: only the commander is hurt, so Regrowth has nothing to mend.
    expect(castIn(regrowth(false)).filter(({ round }) => round === 1)).toEqual([]);
    const cast = regrowth(true);
    expect(castIn(cast)[0]?.round).toBe(1);
    const healed = afterCast(cast.replay, 'regrowth').flatMap((e) =>
      e.kind === 'heal' ? [e.target] : [],
    );
    expect(healed).toEqual(['a']);
  });

  it('damage on a whole squad hits every troop of it', () => {
    const blast = testSpell('test:blast', [
      { kind: 'damage', amount: 500, element: 'fire', targets: { kind: 'squad' } },
    ]);
    const result = fightOnce(side([], [mage('m', [blast])]), side([squad('d', 'ashMilitia', 30)]));
    expect(afterCast(result.replay, 'test:blast')).toContainEqual(
      expect.objectContaining({ kind: 'damage', target: 'd', kills: 30 }),
    );
  });

  it('fatigueDrain tires the enemy caster with the most pips', () => {
    const drain = testSpell(
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
        [
          // First in setup order but with fewer pips: the drain passes it over.
          mage('dw', [SPELLS.emberDart], { pips: { R: 1 }, immortal: true }),
          mage('dm', [SPELLS.emberDart], { immortal: true }),
        ],
      ),
    );
    expect(result.replay).toContainEqual({ kind: 'fatigue', unit: 'dm', amount: 100 });
    expect(result.replay).not.toContainEqual(
      expect.objectContaining({ kind: 'fatigue', unit: 'dw' }),
    );
    // Drained to 100 before its turn in round 1, it cannot cast until it recovers.
    const first = byRound(result).find(
      ({ event }) => event.kind === 'cast' && event.caster === 'dm',
    );
    expect(first?.round).toBe(2);
  });

  it('an area curse lands on every group its troops belong to', () => {
    const hex = testSpell('test:hex', [
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

  it('area effects of one cast share their troops: the curse falls where the damage fell', () => {
    const scorch = testSpell('test:scorch', [
      { kind: 'damage', amount: 0, element: 'fire', targets: { kind: 'area', count: 2 } },
      {
        kind: 'debuff',
        stat: 'def',
        delta: -1,
        duration: { kind: 'battle' },
        targets: { kind: 'area', count: 2 },
      },
    ]);
    for (let seed = 0; seed < 30; seed++) {
      const result = fightOnce(
        side([], [mage('m', [scorch])]),
        side([
          squad('d1', 'ashMilitia', 3, { row: 'front' }),
          squad('d2', 'ashMilitia', 3, { row: 'front' }),
          squad('d3', 'ashMilitia', 3, { row: 'front' }),
        ]),
        seed,
      );
      const events = afterCast(result.replay, 'test:scorch');
      const hit = events.flatMap((e) => (e.kind === 'damage' ? [e.target] : []));
      const cursed = events.flatMap((e) => (e.kind === 'buff' ? [e.target] : []));
      expect(cursed.sort(), `seed ${seed}`).toEqual([...new Set(hit)].sort());
    }
  });

  it('a self heal mends only the caster', () => {
    const mend = testSpell('test:mend', [{ kind: 'heal', amount: 5, targets: { kind: 'self' } }]);
    const result = fightOnce(
      side([squad('a', 'ashMilitia', 1, { stats: IMMORTAL })], [{ ...mage('m', [mend]), hp: 3 }]),
      side([squad('d', 'ashMilitia', 30)]),
    );
    expect(afterCast(result.replay, 'test:mend')).toEqual([
      { kind: 'heal', target: 'm', amount: 5 },
    ]);
  });
});

describe('rows and routing groups', () => {
  it('aims at the enemy’s current front: past a routing front squad to the archers behind', () => {
    const { find, castBy } = staged(
      side([], [mage('m', [SPELLS.emberDart])]),
      side([squad('a', 'ashMilitia', 20, { row: 'front' }), squad('b', 'flameArcher', 5)]),
    );
    find('a').routingSince = 1;
    expect(castBy('m', SPELLS.emberDart)[0]).toMatchObject({ kind: 'cast', targets: ['b'] });
  });

  it('draws area troops from every present group in the target’s row, routing ones too', () => {
    // No one stands in front: the enemy front is the archers' middle row, which a routing squad
    // shares. Twenty picks take every troop there.
    const sweep = testSpell('test:sweep', [
      { kind: 'damage', amount: 0, element: 'fire', targets: { kind: 'area', count: 20 } },
    ]);
    const { find, castBy } = staged(
      side([], [mage('m', [sweep])]),
      side([squad('a', 'flameArcher', 10), squad('b', 'ashMilitia', 10, { row: 'middle' })]),
    );
    find('b').routingSince = 1;
    const hit = castBy('m', sweep).flatMap((e) => (e.kind === 'damage' ? [e.target] : []));
    expect(hit.sort()).toEqual(['a', 'b']);
  });

  it('gives a one-squad buff to the largest active squad, passing over a routing one', () => {
    const { find, castBy } = staged(
      side(
        [
          squad('big', 'ashMilitia', 20, { leader: 'm' }),
          squad('small', 'cinderWarrior', 5, { leader: 'm' }),
        ],
        [mage('m', [SPELLS.barkSkin])],
      ),
      side([squad('d', 'ashMilitia', 10)]),
    );
    find('big').routingSince = 1;
    expect(castBy('m', SPELLS.barkSkin)[0]).toMatchObject({ kind: 'cast', targets: ['small'] });
  });
});
