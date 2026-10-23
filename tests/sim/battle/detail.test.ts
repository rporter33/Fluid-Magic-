// The detail sink (docs/04-battle.md, "Replay detail"; docs/12-battle-presentation.md, S1.3,
// S1.4, S1.9): it only watches, so a battle fought with it equals one fought without, rng
// included; and what it reports adds up to the stored log, phase by phase and pair by pair.
import { afterAll, describe, expect, it } from 'vitest';
import type { DetailEvent } from '../../../src/sim/battle/detail';
import type { BattleEvent } from '../../../src/sim/battle/events';
import { foldReplay } from '../../../src/sim/battle/replay';
import { resolveBattle } from '../../../src/sim/battle/resolve';
import type { BattleResult, BattleSetup } from '../../../src/sim/battle/types';
import type { WeaponDef } from '../../../src/content/types';
import { createRng } from '../../../src/sim/rng';
import { ending, groups, landings, merge, PHASES, spans } from './fixtures/detail';
import { NAMED } from './fixtures/named';
import { NAMED_6B2 } from './fixtures/named6b';

const EQUIVALENCE_SEEDS = Array.from({ length: 20 }, (_, i) => i + 1);
const DETAIL_SEEDS = [1, 2, 3, 4, 5];

type Strike = Extract<DetailEvent, { kind: 'strike' }>;

function fight(build: () => Parameters<typeof resolveBattle>[0], seed: number) {
  const detail: DetailEvent[] = [];
  return { result: resolveBattle(build(), createRng(seed), { detail }), detail };
}

/** Invariants every stored log keeps, detail or not. */
function checkStoredLog(result: BattleResult, label: string): void {
  let previous: BattleEvent['kind'] | null = null;
  let step = -1;
  for (const e of result.replay) {
    if (e.kind === 'roundStart') step = -1;
    if (e.kind === 'phase') {
      expect(previous, `${label}: two markers in a row`).not.toBe('phase');
      expect(PHASES.indexOf(e.phase), `${label}: ${e.phase} out of order`).toBeGreaterThan(step);
      step = PHASES.indexOf(e.phase);
    }
    if (e.kind === 'volley' || e.kind === 'melee') {
      expect(e.blocked + e.onFallen + e.kills, label).toBeLessThanOrEqual(e.hits);
      expect(e.hits, label).toBeLessThanOrEqual(e.attacks);
      expect(Math.min(e.blocked, e.onFallen, e.kills, e.dmg), label).toBeGreaterThanOrEqual(0);
    }
    previous = e.kind;
  }
  const folded = foldReplay(result.roster, result.replay);
  for (const [ref, o] of result.squads) expect(folded.get(ref)?.count, label).toBe(o.count);
  for (const [ref, o] of result.commanders) {
    expect(folded.get(ref)?.count === 0, label).toBe(o.dead);
  }
}

describe.each([...NAMED, ...NAMED_6B2].map((f) => [f.name, f] as const))('%s', (name, f) => {
  it('gives the same result, log, and rng state with a sink as without, on 20 seeds', () => {
    for (const seed of EQUIVALENCE_SEEDS) {
      const plainRng = createRng(seed);
      const plain = resolveBattle(f.build(), plainRng);
      const sinkRng = createRng(seed);
      const detail: DetailEvent[] = [];
      const watched = resolveBattle(f.build(), sinkRng, { detail });
      expect(watched, `${name} seed ${String(seed)}`).toStrictEqual(plain);
      expect(sinkRng).toEqual(plainRng);
      expect(detail.length).toBeGreaterThan(0);
      checkStoredLog(plain, `${name} seed ${String(seed)}`);
    }
  });

  // Fought once per seed and shared by the checks below.
  const cache = new Map<number, ReturnType<typeof fight>>();
  const run = (seed: number) => {
    let r = cache.get(seed);
    if (!r) {
      r = fight(f.build, seed);
      cache.set(seed, r);
    }
    return r;
  };
  afterAll(() => {
    cache.clear();
  });

  it('adds up to every attack tally, phase by phase and pair by pair', () => {
    for (const seed of DETAIL_SEEDS) {
      const { result, detail } = run(seed);
      const at = spans(result.replay);
      const sums = new Map<
        string,
        {
          attacks: number;
          hits: number;
          blocked: number;
          onFallen: number;
          kills: number;
          dmg: number;
        }
      >();
      for (const s of detail) {
        if (s.kind !== 'strike') continue;
        const kind = s.phase === 'ranged' ? 'volley' : 'melee';
        const key = `${String(s.round)}/${kind}/${s.attacker}>${s.target}`;
        const t = sums.get(key) ?? {
          attacks: 0,
          hits: 0,
          blocked: 0,
          onFallen: 0,
          kills: 0,
          dmg: 0,
        };
        t.attacks += 1;
        if (s.hit) t.hits += 1;
        if (s.landing?.hpBefore === 0) t.onFallen += 1;
        if (s.damage?.rolled === 0 && (s.landing?.hpBefore ?? 0) > 0) t.blocked += 1;
        if (s.landing?.killed) t.kills += 1;
        t.dmg += s.landing?.dealt ?? 0;
        sums.set(key, t);
      }
      let tallies = 0;
      result.replay.forEach((e, i) => {
        if (e.kind !== 'volley' && e.kind !== 'melee') return;
        tallies++;
        const key = `${String(at[i]?.round)}/${e.kind}/${e.squad}>${e.target}`;
        const t = sums.get(key);
        expect(t, `${name} seed ${String(seed)} ${key}`).toBeDefined();
        const { dmg, ...counts } = t!;
        expect(counts, key).toEqual({
          attacks: e.attacks,
          hits: e.hits,
          blocked: e.blocked,
          onFallen: e.onFallen,
          kills: e.kills,
        });
        expect(dmg, key).toBeCloseTo(e.dmg, 6);
      });
      expect(sums.size).toBe(tallies);
    }
  });

  it('reports rolls that agree with their own rules', () => {
    const weapons = weaponsOf(f.build());
    for (const seed of DETAIL_SEEDS) {
      const { result, detail } = run(seed);
      for (const e of result.replay) {
        if (e.kind !== 'summon') continue;
        weapons.set(e.squad, f.build()[e.side].summons[e.unit]?.weapons ?? []);
      }
      const bad: DetailEvent[] = [];
      for (const e of detail) {
        const roll = e.kind === 'strike' || e.kind === 'spellHit' ? e.damage : null;
        if (roll) {
          const expected = roll.base + roll.attackDrn - roll.armor - roll.armorDrn;
          if (roll.rolled !== Math.max(0, expected)) bad.push(e);
        }
        if (e.kind === 'strike') {
          const sum = e.attack + e.attackDrn - (e.defense + e.defenseDrn);
          const hit = e.phase === 'ranged' ? sum >= 0 : sum > 0;
          if (e.hit !== hit || (e.damage !== null) !== hit || (e.landing !== null) !== hit) {
            bad.push(e);
          }
          // The weapon slot: a shot's base is its weapon's damage; unarmed only without a
          // melee weapon.
          const own = weapons.get(e.attacker) ?? [];
          const w = own[e.weapon];
          const melee = own.filter((x) => x.range === undefined);
          if (
            e.phase === 'ranged' &&
            (w?.range === undefined || (e.damage && e.damage.base !== w.dmg))
          ) {
            bad.push(e);
          }
          if (
            e.phase === 'melee' &&
            (e.weapon === -1 ? melee.length > 0 : w?.range !== undefined)
          ) {
            bad.push(e);
          }
        }
        if (e.kind === 'morale') {
          const r = e.roll;
          if (r.broke !== r.morale + r.moraleDrn < r.target + r.targetDrn + r.pressure) bad.push(e);
          // A break is logged at once as the group's rout.
          const next = result.replay[e.at];
          if (r.broke && (next?.kind !== 'rout' || next.squad !== e.group)) bad.push(e);
        }
      }
      expect(bad.slice(0, 3), `${name} seed ${String(seed)}`).toEqual([]);
    }
  });

  it('kills each troop once, and the dead strike no more', () => {
    for (const seed of DETAIL_SEEDS) {
      const { result, detail } = run(seed);
      const info = groups(result);
      const died = new Map<string, number>();
      const deaths = new Map<string, number>();
      const step = (e: DetailEvent) => e.round * PHASES.length + PHASES.indexOf(e.phase);
      const twice: string[] = [];
      for (const { e, group, member, landing } of landings(detail)) {
        if (!landing.killed) continue;
        const key = `${group}#${String(member)}`;
        if (died.has(key)) twice.push(key);
        died.set(key, step(e));
        deaths.set(group, (deaths.get(group) ?? 0) + 1);
      }
      expect(twice, `${name} seed ${String(seed)}: died twice`).toEqual([]);
      for (const [ref, g] of info) {
        expect(deaths.get(ref) ?? 0, `${ref} deaths`).toBe(
          g.startCount - ending(result, ref).count,
        );
      }
      const late = detail.filter((s) => {
        if (s.kind !== 'strike') return false;
        const death = died.get(`${s.attacker}#${String(s.attackerMember)}`);
        return death !== undefined && step(s) > death;
      });
      expect(late.slice(0, 3), `${name} seed ${String(seed)}: struck after death`).toEqual([]);
    }
  });

  it('accounts for every HP: start minus end is damage dealt minus healing', () => {
    for (const seed of DETAIL_SEEDS) {
      const { result, detail } = run(seed);
      const net = new Map<string, number>();
      for (const { group, landing } of landings(detail)) {
        net.set(group, (net.get(group) ?? 0) + landing.dealt);
      }
      for (const e of result.replay) {
        if (e.kind === 'heal') net.set(e.target, (net.get(e.target) ?? 0) - e.amount);
      }
      for (const [ref, g] of groups(result)) {
        expect(g.startHp - ending(result, ref).hp, ref).toBeCloseTo(net.get(ref) ?? 0, 6);
      }
      // Spell hits add up to the spell damage the log reports (damage events without a striker).
      const spell = { kills: 0, dealt: 0 };
      for (const e of detail) {
        if (e.kind !== 'spellHit') continue;
        spell.kills += e.landing.killed ? 1 : 0;
        spell.dealt += e.landing.dealt;
      }
      const logged = { kills: 0, dealt: 0 };
      for (const e of result.replay) {
        if (e.kind !== 'damage' || e.by !== undefined) continue;
        logged.kills += e.kills;
        logged.dealt += e.amount;
      }
      expect(spell.kills).toBe(logged.kills);
      expect(spell.dealt).toBeCloseTo(logged.dealt, 6);
      // Life drain: a ranged or melee step's drains add up to the heals it logged.
      const step = spans(result.replay);
      const add = (m: Map<string, number>, key: string, x: number) =>
        m.set(key, (m.get(key) ?? 0) + x);
      const drained = new Map<string, number>();
      for (const e of detail) {
        if (e.kind === 'drain') add(drained, `${String(e.round)}/${e.phase}/${e.unit}`, e.gained);
      }
      const healed = new Map<string, number>();
      result.replay.forEach((e, i) => {
        const s = step[i];
        if (e.kind !== 'heal' || (s?.phase !== 'ranged' && s?.phase !== 'melee')) return;
        add(healed, `${String(s.round)}/${s.phase}/${e.target}`, e.amount);
      });
      expect(drained).toEqual(healed);
      if (name === 'lifeDrain') expect(drained.size).toBeGreaterThan(0);
    }
  });

  it('puts every melee striker in contact', () => {
    for (const seed of DETAIL_SEEDS) {
      const { detail } = run(seed);
      const contact = new Map<number, Set<string>>();
      const outside = new Set<string>();
      for (const e of detail) {
        if (e.kind === 'engage' && e.phase === 'melee') contact.set(e.round, new Set(e.contact));
        if (e.kind === 'strike' && e.phase === 'melee' && !contact.get(e.round)?.has(e.attacker)) {
          outside.add(`${e.attacker} in round ${String(e.round)}`);
        }
      }
      expect([...outside]).toEqual([]);
    }
  });

  it('keeps its order: roll order, at never falling, each blow before the damage it caused', () => {
    const weapons = weaponsOf(f.build());
    // A multi-strike weapon's swings share member and weapon, one after another (N2).
    const multi = (s: Strike) => (weapons.get(s.attacker)?.[s.weapon]?.strikes ?? 1) > 1;
    for (const seed of DETAIL_SEEDS) {
      const { result, detail } = run(seed);
      const info = groups(result);
      expect(detail.every((e, i) => i === 0 || e.at >= detail[i - 1]!.at)).toBe(true);
      // Strikes of a phase: attacker side first, setup order; melee by member then weapon,
      // ranged by weapon then member.
      let last: number[] | null = null;
      let lastStep = '';
      const outOfOrder: Strike[] = [];
      for (const s of detail) {
        if (s.kind !== 'strike') continue;
        const g = info.get(s.attacker)!;
        const side = g.side === 'attacker' ? 0 : 1;
        const inner =
          s.phase === 'melee' ? [s.attackerMember, s.weapon] : [s.weapon, s.attackerMember];
        const order = [side, g.order, ...inner];
        const stepKey = `${String(s.round)}/${s.phase}`;
        const step = stepKey === lastStep && last ? compare(order, last) : 1;
        if (step < 0 || (step === 0 && !multi(s))) outOfOrder.push(s);
        last = order;
        lastStep = stepKey;
      }
      expect(outOfOrder.slice(0, 3)).toEqual([]);
      // A strike that wounded a commander is followed at once by its damage event.
      const merged = merge(result.replay, detail);
      const at = spans(result.replay);
      merged.forEach((m, i) => {
        if (!('detail' in m) || m.detail.kind !== 'strike') return;
        const s: Strike = m.detail;
        const hurt = s.landing !== null && s.landing.hpBefore > 0 && (s.damage?.rolled ?? 0) > 0;
        if (!info.get(s.target)?.isCommander || !hurt) return;
        const next = merged[i + 1];
        expect(next && 'stored' in next ? next.stored : null).toEqual({
          kind: 'damage',
          target: s.target,
          amount: s.damage?.rolled,
          element: expect.any(String) as unknown,
          kills: s.landing?.killed ? 1 : 0,
          by: s.attacker,
        });
      });
      // Any other damage with a striker is a shield burn in its element (N4), after the burns
      // it sums up.
      merged.forEach((m, i) => {
        if (!('stored' in m) || m.stored.kind !== 'damage' || m.stored.by === undefined) return;
        const e = m.stored;
        const prev = merged[i - 1];
        const blow = prev && 'detail' in prev && prev.detail.kind === 'strike' ? prev.detail : null;
        if (blow?.target === e.target && blow.attacker === e.by) return;
        const round = at[m.at]?.round;
        const burns = detail.flatMap((b) =>
          b.kind === 'burn' &&
          b.unit === e.target &&
          b.element === e.element &&
          b.round === round &&
          b.at <= m.at
            ? [b]
            : [],
        );
        expect(burns.length).toBeGreaterThan(0);
        expect(burns.map((b) => b.shield)).toContain(e.by);
      });
    }
  });

  it('labels each detail event with the step whose span holds it', () => {
    for (const seed of DETAIL_SEEDS) {
      const { result, detail } = run(seed);
      const at = spans(result.replay);
      const marked = new Set(
        result.replay.flatMap((e, i) =>
          e.kind === 'phase' ? [`${String(at[i]?.round)}/${e.phase}`] : [],
        ),
      );
      const mislabelled = detail.filter((e) => {
        const before = at[e.at - 1];
        if (before?.round !== e.round) return true;
        if (before.phase === e.phase) return false;
        // Its step logged nothing (a morale check that held): it sits after the step before.
        const previous = before.phase ? PHASES.indexOf(before.phase) : -1;
        return marked.has(`${String(e.round)}/${e.phase}`) || PHASES.indexOf(e.phase) <= previous;
      });
      expect(mislabelled.slice(0, 3), `${name} seed ${String(seed)}`).toEqual([]);
    }
  });
});

/** Each squad's and commander's weapons, by ref. */
function weaponsOf(setup: BattleSetup): Map<string, readonly WeaponDef[]> {
  const out = new Map<string, readonly WeaponDef[]>();
  for (const side of [setup.attacker, setup.defender]) {
    for (const u of [...side.squads, ...side.commanders]) out.set(u.ref, u.stats.weapons);
  }
  return out;
}

/** Lexicographic comparison of two number lists. */
function compare(a: readonly number[], b: readonly number[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}
