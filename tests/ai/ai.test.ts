// The AI player and its random streams (docs/08-ai.md decisions, "The AI contract"; Phase 7
// design "Contract and entry point", the pillage draw): runAi reads the state and never changes
// it, state.rng included; it gives the same commands for the same state; every command it
// returns applies in order. aiRng is fixed by the seed, the day, and the slot; keyedRng by the
// seed, the slot, and its keys alone.
import { beforeAll, describe, expect, it } from 'vitest';
import type { NationDefId } from '../../src/content';
import { defaultPreset } from '../../src/content/pretenders/presets';
import { runAi } from '../../src/ai/ai';
import { playDay } from '../../src/ai/driver';
import { aiRng, keyedRng } from '../../src/ai/rng';
import { applyCommand, type Command } from '../../src/sim/commands';
import { createGame } from '../../src/sim/createGame';
import { stateHash } from '../../src/sim/hash';
import type { NationId } from '../../src/sim/ids';
import { chance, cloneRng, nextU32 } from '../../src/sim/rng';
import type { GameSetup, GameState } from '../../src/sim/types';
import { nationIds } from '../sim/fixtures';

/** A runner-style game (src/ai/match.ts runnerSetup) with the nation order given. */
function runnerSetup(seed: number, order: readonly NationDefId[]): GameSetup {
  return {
    seed,
    mapSize: 'medium',
    nations: order.map((nation) => ({
      nation,
      pretender: defaultPreset(nation).design,
      ai: { difficulty: 'normal' },
    })),
  };
}

function runnerGame(seed = 1): GameState {
  return createGame(runnerSetup(seed, ['cinderHorde', 'thornwood']));
}

describe('aiRng', () => {
  it('depends on the seed, the day, and the slot, not on state.rng or anything else', () => {
    const state = runnerGame();
    const [first] = nationIds(state) as [NationId];
    const before = cloneRng(state.rng);
    const stream = aiRng(state, first);
    expect(stream).not.toBe(state.rng);
    expect(state.rng).toEqual(before);
    nextU32(state.rng);
    state.nations[first]!.gold += 1000;
    state.provinces[state.nations[first]!.capital]!.pop += 5000;
    expect(aiRng(state, first)).toEqual(stream);
  });

  it('gives each nation, day, and seed its own stream', () => {
    const state = runnerGame();
    const [a, b] = nationIds(state) as [NationId, NationId];
    const draw = (s: GameState, n: NationId) => nextU32(aiRng(s, n));
    const today = draw(state, a);
    expect(draw(state, b)).not.toBe(today);
    state.day += 1;
    expect(draw(state, a)).not.toBe(today);
    state.day -= 1;
    expect(draw(state, a)).toBe(today);
    expect(draw(runnerGame(2), a)).not.toBe(today);
  });

  it('follows the slot, not the nation definition in it', () => {
    const forward = createGame(runnerSetup(5, ['cinderHorde', 'thornwood']));
    const reverse = createGame(runnerSetup(5, ['thornwood', 'cinderHorde']));
    const [slot0, slot1] = nationIds(forward) as [NationId, NationId];
    expect(reverse.nations[slot0]!.def).toBe('thornwood');
    expect(aiRng(reverse, slot0)).toEqual(aiRng(forward, slot0));
    expect(aiRng(reverse, slot1)).toEqual(aiRng(forward, slot1));
  });
});

describe('keyedRng', () => {
  it('depends on the seed, the slot, and the keys alone, whatever the day or state.rng', () => {
    const state = runnerGame();
    const [a] = nationIds(state) as [NationId];
    const before = cloneRng(state.rng);
    const stream = keyedRng(state, a, 'c12', 'p7');
    expect(state.rng).toEqual(before);
    state.day += 35;
    nextU32(state.rng);
    state.nations[a]!.gold += 1000;
    expect(keyedRng(state, a, 'c12', 'p7')).toEqual(stream);
    // Drawing from one stream leaves the next one made from the same keys untouched.
    nextU32(stream);
    expect(keyedRng(state, a, 'c12', 'p7')).not.toEqual(stream);
    expect(keyedRng(state, a, 'c12', 'p7')).toEqual(keyedRng(runnerGame(), a, 'c12', 'p7'));
  });

  it('gives every seed, slot, and list of keys its own stream', () => {
    const state = runnerGame();
    const [a, b] = nationIds(state) as [NationId, NationId];
    const draw = (s: GameState, n: NationId, ...keys: string[]) => nextU32(keyedRng(s, n, ...keys));
    const draws = [
      draw(state, a, 'c12', 'p7'),
      draw(state, b, 'c12', 'p7'),
      draw(runnerGame(2), a, 'c12', 'p7'),
      draw(state, a, 'c12', 'p8'),
      draw(state, a, 'c13', 'p7'),
      draw(state, a, 'p7', 'c12'),
      draw(state, a, 'c1', '2p7'),
      draw(state, a, 'c12p7'),
      draw(state, a, 'c12'),
      draw(state, a),
      nextU32(aiRng(state, a)),
    ];
    expect(new Set(draws).size).toBe(draws.length);
  });

  it('follows the slot, not the nation definition in it', () => {
    const forward = createGame(runnerSetup(5, ['cinderHorde', 'thornwood']));
    const reverse = createGame(runnerSetup(5, ['thornwood', 'cinderHorde']));
    const [slot0] = nationIds(forward) as [NationId];
    expect(keyedRng(reverse, slot0, 'c3', 'p1')).toEqual(keyedRng(forward, slot0, 'c3', 'p1'));
  });

  it('draws once per key pair at the asked odds across many pairs', () => {
    const state = runnerGame();
    const [a] = nationIds(state) as [NationId];
    for (const p of [0.1, 0.6]) {
      let hits = 0;
      const pairs = 4000;
      for (let i = 0; i < pairs; i++) {
        const keys = [`c${String(i % 200)}`, `p${String(Math.floor(i / 200))}`];
        const once = chance(keyedRng(state, a, ...keys), p);
        // The same pair always draws the same.
        expect(chance(keyedRng(state, a, ...keys), p)).toBe(once);
        if (once) hits++;
      }
      expect(hits / pairs).toBeGreaterThan(p - 0.03);
      expect(hits / pairs).toBeLessThan(p + 0.03);
    }
  });
});

describe('runAi contract', () => {
  /** Snapshots of a runner game every 3 days of its first five months of runAi play. */
  const snapshots: GameState[] = [];
  beforeAll(() => {
    const state = runnerGame(3);
    while (state.day <= 150) {
      if (state.day % 3 === 0) snapshots.push(structuredClone(state));
      playDay(state, runAi);
    }
  });

  /** Every snapshot with each of its nations. */
  function cases(): [GameState, NationId][] {
    return snapshots.flatMap((s) => nationIds(s).map((n): [GameState, NationId] => [s, n]));
  }

  it('reads the state and never changes it, state.rng included', () => {
    expect(snapshots).toHaveLength(51);
    for (const [state, nation] of cases()) {
      const hash = stateHash(state);
      const rng = cloneRng(state.rng);
      runAi(state, nation);
      expect(stateHash(state)).toBe(hash);
      expect(state.rng).toEqual(rng);
    }
  });

  it('gives the same commands for the same state, whatever state.rng holds', () => {
    for (const [state, nation] of cases()) {
      const commands = runAi(state, nation);
      expect(runAi(state, nation)).toEqual(commands);
      const copy = structuredClone(state);
      nextU32(copy.rng);
      expect(runAi(copy, nation)).toEqual(commands);
    }
  });

  it('returns only commands that apply in the order given, for its own nation', () => {
    for (const [state, nation] of cases()) {
      const copy = structuredClone(state);
      const commands = runAi(copy, nation);
      for (const [i, command] of commands.entries()) {
        expect(command.nation).toBe(nation);
        const where = `day ${String(state.day)} ${nation} command ${String(i)}`;
        expect(applyCommand(copy, command), where).toEqual({ ok: true });
      }
    }
  });

  it('returns nothing once the game is over or for a nation out of it', () => {
    const state = structuredClone(snapshots.at(-1)!);
    const [a, b] = nationIds(state) as [NationId, NationId];
    const commands: Command[] = [];
    state.nations[a]!.eliminated = true;
    commands.push(...runAi(state, a));
    state.result = { day: state.day, winner: b, reason: 'lastCapital' };
    commands.push(...runAi(state, b));
    expect(commands).toEqual([]);
  });
});
