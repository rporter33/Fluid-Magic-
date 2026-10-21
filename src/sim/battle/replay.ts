// Folds a battle's log into the state of every unit, for the replay viewer (docs/07-ui.md,
// "Battle replay"). The roster and the events are enough: a viewer steps through the same
// fold one event at a time.
import type { Formation } from '../types';
import type { BattleEvent, BattleRoster, BattleSide, BattleUnitRef } from './events';

export interface ReplayUnit {
  side: BattleSide;
  isCommander: boolean;
  /** Troops left (1 or 0 for a commander). */
  count: number;
  /** A commander's HP; for squads, the starting pool (squad HP is not logged). */
  hp: number;
  row: Formation;
  routing: boolean;
  /** Left the field alive. */
  gone: boolean;
}

export type ReplayState = Map<BattleUnitRef, ReplayUnit>;

export function startReplay(roster: Record<BattleSide, BattleRoster>): ReplayState {
  const state: ReplayState = new Map();
  for (const side of ['attacker', 'defender'] as const) {
    for (const s of roster[side].squads) {
      state.set(s.ref, {
        side,
        isCommander: false,
        count: s.count,
        hp: s.hp,
        row: s.row,
        routing: false,
        gone: false,
      });
    }
    for (const c of roster[side].commanders) {
      state.set(c.ref, {
        side,
        isCommander: true,
        count: 1,
        hp: c.hp,
        row: c.row,
        routing: false,
        gone: false,
      });
    }
  }
  return state;
}

/** Applies one event. */
export function stepReplay(state: ReplayState, e: BattleEvent): void {
  switch (e.kind) {
    case 'volley':
    case 'melee': {
      const t = state.get(e.target);
      if (t && !t.isCommander) t.count = Math.max(0, t.count - e.kills);
      break;
    }
    case 'damage': {
      const t = state.get(e.target);
      if (!t) break;
      if (t.isCommander) t.hp = Math.max(0, t.hp - e.amount);
      t.count = Math.max(0, t.count - e.kills);
      break;
    }
    case 'heal': {
      const t = state.get(e.target);
      if (t?.isCommander) t.hp += e.amount;
      break;
    }
    case 'rout': {
      const t = state.get(e.squad);
      if (t) t.routing = true;
      break;
    }
    case 'leave': {
      const t = state.get(e.unit);
      if (t) t.gone = true;
      break;
    }
    case 'advance': {
      const t = state.get(e.unit);
      if (t) t.row = e.row;
      break;
    }
    case 'death': {
      const t = state.get(e.commander);
      if (t) t.count = 0;
      break;
    }
    case 'summon':
      state.set(e.squad, {
        side: e.side,
        isCommander: false,
        count: e.count,
        hp: e.hp,
        row: e.row,
        routing: false,
        gone: false,
      });
      break;
    // Markers, casts, and changes the viewer's unit state does not show.
    case 'phase':
    case 'roundStart':
    case 'cast':
    case 'buff':
    case 'expire':
    case 'field':
    case 'fieldEnd':
    case 'fatigue':
    case 'battleEnd':
      break;
    default: {
      const never: never = e;
      throw new Error(`unknown battle event ${JSON.stringify(never)}`);
    }
  }
}

/** The state after every event. */
export function foldReplay(
  roster: Record<BattleSide, BattleRoster>,
  events: readonly BattleEvent[],
): ReplayState {
  const state = startReplay(roster);
  for (const e of events) stepReplay(state, e);
  return state;
}
