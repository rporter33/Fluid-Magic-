// The Phase 6b.2 named battles (fixtures/named6b.ts) each show the rule they are named for, on
// the detail seeds, so the equivalence and re-run tests they join cover that rule.
import { describe, expect, it } from 'vitest';
import { SPELLS } from '../../../src/content/spells';
import type { DetailEvent } from '../../../src/sim/battle/detail';
import { resolveBattle } from '../../../src/sim/battle/resolve';
import { createRng } from '../../../src/sim/rng';
import { byRound } from './fixtures';
import { NAMED_6B2 } from './fixtures/named6b';

const SEEDS = [1, 2, 3, 4, 5];

function fights(name: string) {
  const f = NAMED_6B2.find((x) => x.name === name);
  if (!f) throw new Error(`no fixture ${name}`);
  return SEEDS.map((seed) => {
    const detail: DetailEvent[] = [];
    return { result: resolveBattle(f.build(), createRng(seed), { detail }), detail };
  });
}

/** The round a group began to rout, or null. */
function routRound(result: ReturnType<typeof resolveBattle>, ref: string): number | null {
  return (
    byRound(result).find(({ event }) => event.kind === 'rout' && event.squad === ref)?.round ?? null
  );
}

describe('the Phase 6b.2 named battles', () => {
  it('primordialFear: Fear fires, and the morale-50 hornets roll under it', () => {
    for (const { result, detail } of fights('primordialFear')) {
      expect(result.replay.filter((e) => e.kind === 'ability')).toHaveLength(1);
      expect(detail.some((e) => e.kind === 'morale' && e.group === 'd1')).toBe(true);
    }
  });

  it('pyreLordKindle and hunterCall: their summons join at battle start', () => {
    for (const [name, unit, count] of [
      ['pyreLordKindle', 'fireSprite', 6],
      ['hunterCall', 'wolf', 8],
    ] as const) {
      for (const { result } of fights(name)) {
        const summon = byRound(result).find(({ event }) => event.kind === 'summon');
        expect(summon).toMatchObject({ round: 1, event: { unit, count } });
      }
    }
  });

  it('hunterCall and boundWolves: bound squads break while their commander stays', () => {
    const stayed = (name: string, squad: string, leader: string) =>
      fights(name).some(({ result }) => {
        const broke = routRound(result, squad);
        const went = routRound(result, leader);
        return broke !== null && (went === null || went > broke);
      });
    expect(stayed('hunterCall', 'su0', 'h')).toBe(true);
    expect(stayed('boundWolves', 'a0', 'mo')).toBe(true);
  });

  it('trample: its swings land only on the size-1 militia', () => {
    for (const { detail } of fights('trample')) {
      const trampled = detail.flatMap((e) =>
        e.kind === 'strike' && e.attacker === 'w' && e.weapon === 1 ? [e.target] : [],
      );
      expect(trampled.length).toBeGreaterThan(0);
      expect(new Set(trampled)).toEqual(new Set(['d0']));
    }
  });

  it('twoShields: strikers burn in fire and nature, fire first for each group and phase', () => {
    for (const { result } of fights('twoShields')) {
      const rounds = byRound(result);
      const burns = rounds.flatMap(({ round, event }) =>
        event.kind === 'damage' && event.by !== undefined && event.element !== 'physical'
          ? [{ round, target: event.target, element: event.element }]
          : [],
      );
      expect(burns.some((b) => b.element === 'nature')).toBe(true);
      for (const [i, b] of burns.entries()) {
        if (b.element !== 'nature') continue;
        const fire = burns.findIndex(
          (x) => x.round === b.round && x.target === b.target && x.element === 'fire',
        );
        if (fire >= 0) expect(fire).toBeLessThan(i);
      }
    }
  });

  it('spellPower: every spell hit rolls its effect’s amount plus 3', () => {
    const amount = (spell: string, effect: number) => {
      const e = Object.values(SPELLS).find((s) => s.id === spell)?.effects[effect];
      return e && 'amount' in e ? e.amount : NaN;
    };
    for (const { detail } of fights('spellPower')) {
      const hits = detail.flatMap((e) => (e.kind === 'spellHit' ? [e] : []));
      expect(hits.length).toBeGreaterThan(0);
      for (const h of hits) expect(h.damage.base).toBe(amount(h.spell, h.effect) + 3);
    }
  });
});
