// Landing a phase's blows (docs/04-battle.md decisions, "Replay detail" and "Retaliation
// shields"): a strike marks the rage bonus; when strikers of one group are burned by several fire
// shields, the log names the shield that owed them the most; and shields burn by element (N4).
import { describe, expect, it } from 'vitest';
import { BATTLE } from '../../../src/content/rules';
import { meleePhase } from '../../../src/sim/battle/attacks';
import type { DetailEvent } from '../../../src/sim/battle/detail';
import type { BattleEvent } from '../../../src/sim/battle/events';
import { buildField, groupStat } from '../../../src/sim/battle/field';
import type { BattleSquadSetup, CombatStats } from '../../../src/sim/battle/types';
import { createRng } from '../../../src/sim/rng';
import { IMMORTAL, setup, shield, side, squad, statsOf } from './fixtures';

/** Sure-hit warriors, one blow each, on two lone shielded troops that never strike back. */
function twoShields(seed: number) {
  const shielded = (ref: string, fireShield: number) =>
    squad(ref, 'warden', 1, {
      hp: 1000,
      row: 'front',
      stats: { hp: 1000, prot: 0, ...shield(fireShield) },
    });
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

/**
 * Sure-hit warrior squads, one blow per troop, on shielded defenders that never strike back;
 * one melee phase.
 */
function burned(strikers: BattleSquadSetup[], defenders: BattleSquadSetup[], seed = 1) {
  const field = buildField(setup(side(strikers), side(defenders)));
  for (const g of field.sides.defender) g.fatigue = 1000;
  const detail: DetailEvent[] = [];
  field.detail = detail;
  field.phase = 'melee';
  const log: BattleEvent[] = [];
  meleePhase(field, 3, createRng(seed), log);
  const burns = log.flatMap((e) => (e.kind === 'damage' && e.by !== undefined ? [e] : []));
  return { log, detail, burns, field };
}

const sure = (ref: string, n: number, hp = 100) =>
  squad(ref, 'cinderWarrior', n, { stats: { att: 50, str: 30, hp }, hp: n * hp });
const target = (ref: string, shields: CombatStats['shields']) =>
  squad(ref, 'warden', 1, { hp: 1000, row: 'front', stats: { hp: 1000, prot: 0, shields } });

describe('shields by element (N4)', () => {
  it('burn in their own element: a nature shield logs nature damage by its group', () => {
    const { burns, detail } = burned(
      [sure('a', 3)],
      [target('d', [{ element: 'nature', amount: 4 }])],
    );
    expect(burns).toEqual([
      { kind: 'damage', target: 'a', amount: 12, element: 'nature', kills: 0, by: 'd' },
    ]);
    const elements = detail.flatMap((e) => (e.kind === 'burn' ? [[e.element, e.owed]] : []));
    expect(elements).toEqual([
      ['nature', 4],
      ['nature', 4],
      ['nature', 4],
    ]);
  });

  it('log one damage per striker group and element: groups in first-hit order, fire first', () => {
    const both = [
      { element: 'fire', amount: 3 },
      { element: 'nature', amount: 4 },
    ] as const;
    const { burns } = burned([sure('a', 3), sure('b', 2)], [target('d', both)]);
    expect(burns.map((e) => [e.target, e.element, e.amount, e.by])).toEqual([
      ['a', 'fire', 9, 'd'],
      ['a', 'nature', 12, 'd'],
      ['b', 'fire', 6, 'd'],
      ['b', 'nature', 8, 'd'],
    ]);
  });

  it('add shields of one element: fire 5 and fire 3 burn 8 in one event', () => {
    const fires = [
      { element: 'fire', amount: 5 },
      { element: 'fire', amount: 3 },
    ] as const;
    const { burns } = burned([sure('a', 2)], [target('d', fires)]);
    expect(burns).toEqual([
      { kind: 'damage', target: 'a', amount: 16, element: 'fire', kills: 0, by: 'd' },
    ]);
  });

  it('stop at a striker’s death: one killed by its fire debt takes no nature damage', () => {
    const both = [
      { element: 'fire', amount: 5 },
      { element: 'nature', amount: 4 },
    ] as const;
    const { burns, detail, field } = burned([sure('a', 1, 5)], [target('d', both)]);
    expect(burns).toEqual([
      { kind: 'damage', target: 'a', amount: 5, element: 'fire', kills: 1, by: 'd' },
    ]);
    expect(detail.flatMap((e) => (e.kind === 'burn' ? [e.element] : []))).toEqual(['fire']);
    expect(field.sides.attacker[0]!.members[0]!.alive).toBe(false);
  });

  it('pay a troop’s debts to two shield groups in element order: fire first, though nature struck first', () => {
    // One 5-HP troop, two sure-hit blows a phase: owed nature 4 by n and fire 5 by f.
    const striker = squad('a', 'cinderWarrior', 1, {
      stats: {
        att: 50,
        str: 30,
        hp: 5,
        weapons: [
          { name: 'A', dmg: 5 },
          { name: 'B', dmg: 5 },
        ],
      },
      hp: 5,
    });
    let natureFirst = 0;
    for (let seed = 1; seed <= 80; seed++) {
      const { burns, detail } = burned(
        [striker],
        [
          target('n', [{ element: 'nature', amount: 4 }]),
          target('f', [{ element: 'fire', amount: 5 }]),
        ],
        seed,
      );
      const struck = detail.flatMap((e) => (e.kind === 'strike' && e.hit ? [e.target] : []));
      if (struck.join() !== 'n,f') continue;
      natureFirst += 1;
      expect(
        detail.flatMap((e) => (e.kind === 'burn' ? [e.element] : [])),
        `seed ${String(seed)}`,
      ).toEqual(['fire']);
      expect(burns, `seed ${String(seed)}`).toEqual([
        { kind: 'damage', target: 'a', amount: 5, element: 'fire', kills: 1, by: 'f' },
      ]);
    }
    expect(natureFirst).toBeGreaterThan(0);
  });

  it('name the largest shield of each element: fire by the fire group, nature by the nature one', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const { burns, detail } = burned(
        [sure('a', 8)],
        [
          target('f', [{ element: 'fire', amount: 3 }]),
          target('n', [{ element: 'nature', amount: 4 }]),
        ],
        seed,
      );
      const hit = (ref: string) =>
        detail.filter((e) => e.kind === 'strike' && e.hit && e.target === ref).length;
      const expected = [
        ...(hit('f') > 0 ? [['fire', 3 * hit('f'), 'f']] : []),
        ...(hit('n') > 0 ? [['nature', 4 * hit('n'), 'n']] : []),
      ];
      expect(
        burns.map((e) => [e.element, e.amount, e.by]),
        `seed ${String(seed)}`,
      ).toEqual(expected);
    }
  });

  it('keep the Ash Colossus’s fire shield as fire 5', () => {
    expect(statsOf('ashColossus').shields).toEqual([{ element: 'fire', amount: 5 }]);
    const colossus = squad('c', 'ashColossus', 1, {
      hp: 1000,
      row: 'front',
      stats: { hp: 1000, prot: 0 },
    });
    const { burns } = burned([sure('a', 2)], [colossus]);
    expect(burns).toEqual([
      { kind: 'damage', target: 'a', amount: 10, element: 'fire', kills: 0, by: 'c' },
    ]);
  });
});

// QA sweep BM-2: a hit on a troop already fallen this phase deals no damage, so it neither
// burns its striker (docs/05: "each melee hit that deals damage to a shielded unit") nor feeds
// life drain (docs/02: "per damaging hit"). Before the fix every striker that rolled damage paid.
describe('blows on a troop already fallen this phase', () => {
  const frail = (stats: Partial<CombatStats> = {}) =>
    squad('d', 'warden', 1, { hp: 1, row: 'front', stats: { hp: 1, prot: 0, def: 0, ...stats } });

  it('are not burned by its shield: one blow killed it, so one striker pays', () => {
    const { log, burns, detail } = burned([sure('a', 10)], [frail(shield(5))]);
    expect(log.find((e) => e.kind === 'melee')).toMatchObject({
      hits: 10,
      onFallen: 9,
      kills: 1,
      dmg: 1,
    });
    expect(burns).toEqual([
      { kind: 'damage', target: 'a', amount: 5, element: 'fire', kills: 0, by: 'd' },
    ]);
    const burnedMembers = detail.flatMap((e) => (e.kind === 'burn' ? [e.member] : []));
    const killer = detail.find(
      (e) => e.kind === 'strike' && e.landing !== null && e.landing.killed,
    );
    expect(burnedMembers).toEqual([killer?.kind === 'strike' ? killer.attackerMember : -1]);
  });

  it('feed no life drain: only the blow that dealt damage heals its striker', () => {
    const drainers = squad('a', 'cinderWarrior', 10, {
      stats: { att: 50, str: 30, hp: 100, lifeDrain: 2 },
      hp: 500,
    });
    const { log, detail } = burned([drainers], [frail()]);
    expect(log.find((e) => e.kind === 'melee')).toMatchObject({ onFallen: 9, kills: 1 });
    expect(log.filter((e) => e.kind === 'heal')).toEqual([
      { kind: 'heal', target: 'a', amount: 2 },
    ]);
    expect(detail.filter((e) => e.kind === 'drain')).toHaveLength(1);
  });
});
