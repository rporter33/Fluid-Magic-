// Landing a phase's blows (docs/04-battle.md decisions, "Replay detail"): a strike marks the
// rage bonus, and when strikers of one group are burned by several fire shields, the log names
// the shield that owed them the most.
import { describe, expect, it } from 'vitest';
import { BATTLE } from '../../../src/content/rules';
import { meleePhase } from '../../../src/sim/battle/attacks';
import type { DetailEvent } from '../../../src/sim/battle/detail';
import type { BattleEvent } from '../../../src/sim/battle/events';
import { buildField, groupStat } from '../../../src/sim/battle/field';
import { createRng } from '../../../src/sim/rng';
import { IMMORTAL, setup, side, squad } from './fixtures';

/** Sure-hit warriors, one blow each, on two lone shielded troops that never strike back. */
function twoShields(seed: number) {
  const shielded = (ref: string, fireShield: number) =>
    squad(ref, 'warden', 1, { hp: 1000, row: 'front', stats: { hp: 1000, prot: 0, fireShield } });
  const field = buildField(
    setup(
      side([squad('a', 'cinderWarrior', 6, { stats: { att: 50, str: 30, hp: 100 }, hp: 600 })]),
      side([shielded('weak', 3), shielded('strong', 7)]),
    ),
  );
  for (const g of field.sides.defender) g.fatigue = 1000;
  const detail: DetailEvent[] = [];
  field.detail = detail;
  field.phase = 'melee';
  const log: BattleEvent[] = [];
  meleePhase(field, 3, createRng(seed), log);
  return { log, detail };
}

describe('a strike', () => {
  it('marks a raging berserker’s blows, which carry the rage bonus', () => {
    const field = buildField(
      setup(
        side([squad('a', 'berserker', 4)]),
        side([squad('d', 'warden', 4, { stats: IMMORTAL, hp: 200 })]),
      ),
    );
    const [rager, calm] = [field.sides.attacker[0]!, field.sides.defender[0]!];
    calm.fatigue = 1000;
    // The first two are below half their HP.
    for (const m of rager.members.slice(0, 2)) m.hp = Math.floor(m.maxHp / 2) - 1;
    const detail: DetailEvent[] = [];
    field.detail = detail;
    field.phase = 'melee';
    meleePhase(field, 3, createRng(1), []);
    const strikes = detail.flatMap((e) => (e.kind === 'strike' ? [e] : []));
    expect(strikes.map((s) => [s.attackerMember, s.berserk, s.attack])).toEqual(
      [0, 1, 2, 3].map((i) => {
        const raging = i < 2;
        return [i, raging, groupStat(rager, 'att') + (raging ? BATTLE.berserk.att : 0)];
      }),
    );
  });
});

describe('a burn from several fire shields', () => {
  it('names the shield that owed the burned group the most fire, not the most hits or the first', () => {
    let fewerHitsWon = false;
    let laterWon = false;
    for (let seed = 1; seed <= 40; seed++) {
      const { log, detail } = twoShields(seed);
      const struck = detail.flatMap((e) => (e.kind === 'strike' && e.hit ? [e.target] : []));
      const hits = (ref: string) => struck.filter((t) => t === ref).length;
      const owed = { weak: 3 * hits('weak'), strong: 7 * hits('strong') };
      const burn = log.find((e) => e.kind === 'damage' && e.target === 'a');
      expect(burn, `seed ${String(seed)}`).toMatchObject({ element: 'fire' });
      const first = struck[0];
      const expected =
        owed.weak === owed.strong ? first : owed.weak > owed.strong ? 'weak' : 'strong';
      expect(burn?.kind === 'damage' ? burn.by : null, `seed ${String(seed)}`).toBe(expected);
      if (hits(expected ?? '') < hits(expected === 'weak' ? 'strong' : 'weak')) fewerHitsWon = true;
      if (expected !== first) laterWon = true;
      // Each striker's own burn names the shield it hit.
      for (const b of detail) {
        if (b.kind !== 'burn') continue;
        const blow = detail.find(
          (s) => s.kind === 'strike' && s.attackerMember === b.member && s.hit,
        );
        expect(blow?.kind === 'strike' ? blow.target : null).toBe(b.shield);
      }
    }
    // The seeds cover both ways a wrong rule would pass.
    expect(fewerHitsWon).toBe(true);
    expect(laterWon).toBe(true);
  });
});
