// Acceptance criterion 4 (docs/10-milestone-1.md): the same seed and the same command log give
// the same state hash after 365 days, also across a save and load.
import { describe, expect, it } from 'vitest';
import { applyCommand, type Command } from '../../src/sim/commands';
import { stateHash } from '../../src/sim/hash';
import { advance } from '../../src/sim/tick';
import type { GameState } from '../../src/sim/types';
import { capitalOf, commandersIn, nationIds, twoNationGame } from './fixtures';

interface LoggedCommand {
  day: number;
  command: Command;
}

/** A scripted player for both nations: it reads the state and issues ordinary commands. */
function scriptedCommands(state: GameState): Command[] {
  const out: Command[] = [];
  for (const nation of nationIds(state)) {
    const capital = capitalOf(state, nation);
    const here = commandersIn(state, capital.id).filter((c) => c.owner === nation);
    const leader = here.find((c) => c.unit === 'ashChieftain' || c.unit === 'wardenCaptain');
    const scout = Object.values(state.commanders).find(
      (c) => c.owner === nation && (c.unit === 'cinderScout' || c.unit === 'thornScout'),
    );
    const neighbors = state.map.provinces[capital.id]!.neighbors;
    const day = state.day;
    if (day === 0) {
      out.push({ type: 'setTax', nation, province: capital.id, rate: 'high' });
      out.push({ type: 'buyPd', nation, province: capital.id, levels: 4 });
    }
    if (day % 20 === 3) {
      const unit = state.nations[nation]!.def === 'cinderHorde' ? 'ashMilitia' : 'thornMilitia';
      out.push({ type: 'recruit', nation, province: capital.id, unit, count: 10 });
    }
    if (day % 45 === 10 && leader && !leader.transit) {
      const target = neighbors[((day / 45) % neighbors.length) | 0]!;
      out.push({ type: 'move', nation, commanders: [leader.id], path: [target] });
    }
    if (day % 45 === 12 && leader?.transit) {
      out.push({ type: 'reverse', nation, commander: leader.id });
    }
    if (day % 30 === 15 && scout && !scout.transit) {
      const from = scout.location;
      const options = state.map.provinces[from]!.neighbors;
      out.push({
        type: 'move',
        nation,
        commanders: [scout.id],
        path: [options[day % options.length]!],
      });
    }
    if (day === 200 && leader) {
      out.push({ type: 'setOrder', nation, commander: leader.id, order: 'pillage' });
    }
  }
  return out;
}

/** Plays 365 days, issuing commands on each day before it runs; returns the log it applied. */
function play(state: GameState, log: LoggedCommand[] | null, until = 365): LoggedCommand[] {
  const applied: LoggedCommand[] = [];
  while (state.day < until) {
    const today = log
      ? log.filter((l) => l.day === state.day).map((l) => l.command)
      : scriptedCommands(state);
    for (const command of today) {
      if (applyCommand(state, command).ok) applied.push({ day: state.day, command });
    }
    advance(state);
    for (const c of Object.values(state.commanders)) {
      // Invariants: a move order always has a leg under way; one squad per unit and row.
      if (c.order.kind === 'move' && !c.transit) throw new Error(`${c.id} stalled`);
      const rows = new Set(c.squads.map((q) => `${q.unit} ${q.formation}`));
      if (rows.size !== c.squads.length) throw new Error(`${c.id} has duplicate squads`);
    }
  }
  return applied;
}

describe('determinism with commands', () => {
  it('replays a command log to the same hash after 365 days, through a save and load', () => {
    const original = twoNationGame(31);
    const log = play(original, null);
    expect(log.length).toBeGreaterThan(30);
    expect(new Set(log.map((l) => l.command.type)).size).toBeGreaterThanOrEqual(6);
    const replay = twoNationGame(31);
    play(replay, JSON.parse(JSON.stringify(log)) as LoggedCommand[]);
    expect(stateHash(replay)).toBe(stateHash(original));

    const saved = twoNationGame(31);
    play(saved, log, 180);
    const loaded = JSON.parse(JSON.stringify(saved)) as GameState;
    play(loaded, log);
    expect(stateHash(loaded)).toBe(stateHash(original));
    // 0.9 to 1.1 s alone, yet it has timed out at vitest's 5 s default in full runs at load
    // averages of 6 to 9; 4x its time alone would be under that default, so 10 s, as for the
    // other slow sweeps (QA sweep H1).
  }, 10_000);

  it('hashes different states differently', () => {
    const a = twoNationGame(31);
    const b = twoNationGame(31);
    expect(stateHash(a)).toBe(stateHash(b));
    b.nations[nationIds(b)[0]!]!.gold += 1e-9;
    expect(stateHash(a)).not.toBe(stateHash(b));
    expect(stateHash(twoNationGame(32))).not.toBe(stateHash(a));
  });
});
