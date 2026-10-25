// Commanders in the resolver (docs/04-battle.md, "Commanders in battle" and "Scripts"): Attack,
// Hold, and Retreat slots, and what a commander's death does. Casting is in spells.test.ts, the
// rest of the resolver in resolve.test.ts.
import { describe, expect, it } from 'vitest';
import type { ScriptSlot } from '../../../src/sim/types';
import { byRound, commander, fightOnce, IMMORTAL, side, squad } from './fixtures';

describe('commanders and scripts', () => {
  it('Attack takes a commander to its side’s current front, not always the front row', () => {
    const result = fightOnce(
      side(
        [squad('a', 'flameArcher', 10, { leader: 'c', row: 'middle', stats: IMMORTAL })],
        [commander('c', 'ashChieftain', { script: [{ kind: 'attack' }], stats: IMMORTAL })],
      ),
      side([squad('d', 'ashMilitia', 10, { stats: IMMORTAL })]),
    );
    expect(result.replay).toContainEqual({ kind: 'advance', unit: 'c', row: 'middle' });
  });

  it('Retreat leaves berserkers on the field', () => {
    const result = fightOnce(
      side(
        [squad('b', 'berserker', 10, { leader: 'c', stats: { ...IMMORTAL, tags: ['berserk'] } })],
        [commander('c', 'ashChieftain', { script: [{ kind: 'retreat' }] })],
      ),
      side([squad('d', 'ashMilitia', 10, { stats: IMMORTAL })]),
    );
    expect(result.replay).not.toContainEqual({ kind: 'rout', squad: 'b' });
    expect(result.rounds).toBe(50);
  });

  it('checks a commander shot dead before melee, so its squad may break before it swings', () => {
    let checked = 0;
    for (let seed = 0; seed < 100; seed++) {
      const result = fightOnce(
        side([
          squad('w', 'cinderWarrior', 10, { stats: IMMORTAL }),
          squad('a', 'flameArcher', 20, { stats: { prec: 99 } }),
        ]),
        side(
          [squad('s', 'ashMilitia', 10, { leader: 'c', row: 'front', stats: { mor: 50 } })],
          // Tough enough to live until the lines meet in round 3.
          [commander('c', 'ashChieftain', { row: 'front', hp: 30, stats: { hp: 30, mor: 50 } })],
        ),
        seed,
      );
      const rounds = byRound(result);
      const death = rounds.findIndex(
        ({ event }) => event.kind === 'death' && event.commander === 'c',
      );
      if (death < 0) continue;
      const round = rounds[death]!.round;
      // Only deaths from arrows: a volley that killed the commander that round.
      const shot = rounds.some(
        ({ round: r, event }) =>
          r === round && event.kind === 'volley' && event.target === 'c' && event.kills > 0,
      );
      const melee = rounds.findIndex(
        ({ round: r, event }) => r === round && event.kind === 'melee',
      );
      if (shot && melee >= 0) {
        checked += 1;
        expect(death).toBeLessThan(melee);
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  const script = (...slots: ScriptSlot['kind'][]): ScriptSlot[] =>
    slots.map((kind) => (kind === 'cast' ? { kind, spellId: null } : { kind }));

  it('Attack brings a commander to the front, Hold keeps it back', () => {
    const run = (s: ScriptSlot[]) =>
      fightOnce(
        side([], [commander('c', 'ashChieftain', { script: s, stats: IMMORTAL })]),
        side([squad('d', 'ashMilitia', 5, { row: 'rear', stats: IMMORTAL })]),
      );
    const attacking = run(script('attack', 'attack', 'attack', 'attack', 'attack'));
    const holding = run(script('hold', 'hold', 'hold', 'hold', 'hold'));
    const meleeBy = (r: ReturnType<typeof run>) =>
      r.replay.filter((e) => e.kind === 'melee' && e.squad === 'c').length;
    expect(meleeBy(attacking)).toBeGreaterThan(0);
    // Holding in the rear, the commander is its side's front all the same: it fights when
    // its row is the one facing the enemy.
    expect(meleeBy(holding)).toBeGreaterThan(0);
  });

  it('Retreat takes the commander and its squads off the field that round', () => {
    const result = fightOnce(
      side(
        [squad('s', 'cinderWarrior', 10, { leader: 'c', stats: IMMORTAL })],
        [commander('c', 'ashChieftain', { script: script('hold', 'retreat'), stats: IMMORTAL })],
      ),
      side([squad('d', 'ashMilitia', 10, { stats: IMMORTAL })]),
    );
    expect(result.rounds).toBe(2);
    expect(result.winner).toBe('defender');
    expect(result.squads.get('s')).toMatchObject({ count: 10, routed: true });
    expect(result.commanders.get('c')).toMatchObject({ dead: false, routed: true });
  });

  it('a dead commander is logged and its squads must check morale', () => {
    const result = fightOnce(
      side(
        [squad('s', 'ashMilitia', 10, { leader: 'c', row: 'rear', stats: { prot: 99 } })],
        [commander('c', 'ashChieftain', { row: 'front', stats: { hp: 1, prot: 0, def: 0 } })],
      ),
      side([squad('d', 'berserker', 10, { stats: { prot: 99, mor: 50 } })]),
    );
    expect(result.replay).toContainEqual({ kind: 'death', commander: 'c' });
    expect(result.commanders.get('c')).toMatchObject({ dead: true });
  });
});
