// Readers for a battle's stored log and its detail stream, for the detail and re-run tests:
// which round and step each stored event belongs to, the two streams merged, and every
// group's starting numbers.
import type { DetailEvent, Landing } from '../../../../src/sim/battle/detail';
import type {
  BattleEvent,
  BattlePhase,
  BattleSide,
  BattleUnitRef,
} from '../../../../src/sim/battle/events';
import type { BattleResult } from '../../../../src/sim/battle/types';

export const PHASES: readonly BattlePhase[] = ['scripts', 'ranged', 'melee', 'morale', 'end'];

/** The round and the step of every stored event (null before the first marker of a round). */
export function spans(
  replay: readonly BattleEvent[],
): { round: number; phase: BattlePhase | null }[] {
  let round = 0;
  let phase: BattlePhase | null = null;
  return replay.map((e) => {
    if (e.kind === 'roundStart') {
      round = e.round;
      phase = null;
    }
    if (e.kind === 'phase') phase = e.phase;
    return { round, phase };
  });
}

export type Merged = { stored: BattleEvent; at: number } | { detail: DetailEvent };

/** Both streams in one order: detail events with at = k come right before replay[k]. */
export function merge(replay: readonly BattleEvent[], detail: readonly DetailEvent[]): Merged[] {
  const out: Merged[] = [];
  let d = 0;
  for (let i = 0; i <= replay.length; i++) {
    while (d < detail.length && (detail[d]?.at ?? Infinity) <= i)
      out.push({ detail: detail[d++]! });
    const e = replay[i];
    if (e) out.push({ stored: e, at: i });
  }
  return out;
}

export interface GroupInfo {
  side: BattleSide;
  /** Setup order on its side: squads, then commanders, then summons as they arrive. */
  order: number;
  isCommander: boolean;
  startCount: number;
  startHp: number;
}

export function groups(result: BattleResult): Map<BattleUnitRef, GroupInfo> {
  const out = new Map<BattleUnitRef, GroupInfo>();
  const next = { attacker: 0, defender: 0 };
  const add = (ref: string, side: BattleSide, isCommander: boolean, count: number, hp: number) =>
    out.set(ref, { side, order: next[side]++, isCommander, startCount: count, startHp: hp });
  for (const side of ['attacker', 'defender'] as const) {
    for (const s of result.roster[side].squads) add(s.ref, side, false, s.count, s.hp);
    for (const c of result.roster[side].commanders) add(c.ref, side, true, 1, c.hp);
  }
  for (const e of result.replay) {
    if (e.kind === 'summon') add(e.squad, e.side, false, e.count, e.hp);
  }
  return out;
}

/** The troops a group ended with, alive (1 or 0 for a commander), and their HP. */
export function ending(result: BattleResult, ref: BattleUnitRef): { count: number; hp: number } {
  const s = result.squads.get(ref);
  if (s) return { count: s.count, hp: s.hp };
  const c = result.commanders.get(ref);
  if (!c) throw new Error(`no outcome for ${ref}`);
  return { count: c.dead ? 0 : 1, hp: c.hp };
}

/** Where a strike, spell hit, or burn landed on a troop. */
export interface Landed {
  e: DetailEvent;
  group: BattleUnitRef;
  member: number;
  landing: Landing;
}

/** The strikes, spell hits, and burns that landed on a troop, alive or already fallen. */
export function landings(detail: readonly DetailEvent[]): Landed[] {
  const out: Landed[] = [];
  for (const e of detail) {
    if (e.kind === 'strike' && e.landing) {
      out.push({ e, group: e.target, member: e.targetMember, landing: e.landing });
    }
    if (e.kind === 'spellHit') {
      out.push({ e, group: e.target, member: e.targetMember, landing: e.landing });
    }
    if (e.kind === 'burn') out.push({ e, group: e.unit, member: e.member, landing: e.landing });
  }
  return out;
}
