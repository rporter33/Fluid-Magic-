// Save and load (docs/06-architecture.md, "Save and load"): a save loads into the same game; an
// older save is lifted and checked, hashing like the same game made on this version; a save
// from a newer version, an unknown version, a damaged older save, a missing key, an id naming
// nothing and a color outside W U B R G are each refused with their reason, leaving the
// caller's game as it was; and a malformed re-run still loads as null.
import { describe, expect, it } from 'vitest';
import { matchesRecord, rerunBattle } from '../../src/sim/battle/rerun';
import { stateHash } from '../../src/sim/hash';
import { LOAD_FAILURES, LoadError, type LoadFailure } from '../../src/sim/loadError';
import { deserialize, serialize } from '../../src/sim/serialize';
import { advance } from '../../src/sim/tick';
import type { ProvinceId } from '../../src/sim/ids';
import { STATE_VERSION, type GameState, type NationState } from '../../src/sim/types';
import { asVersion, savedWithBattle } from './saveFixtures';

/** The LoadError deserialize throws for `json`. */
function refusal(json: string): LoadError {
  try {
    deserialize(json);
  } catch (e) {
    if (e instanceof LoadError) return e;
    throw e;
  }
  throw new Error('the save loaded');
}

/** The save's first nation (n0). */
function first(save: GameState): NationState {
  return Object.values(save.nations)[0]!;
}

/** A current save with one change made to it. */
function edited(change: (save: GameState) => void, wilds = true): string {
  const save = savedWithBattle(wilds);
  change(save);
  return serialize(save);
}

describe('deserialize', () => {
  it('loads a save into the same game, which plays on identically', () => {
    const saved = savedWithBattle(true);
    expect(saved.map.wilds.length).toBeGreaterThan(0);
    const loaded = deserialize(serialize(saved));
    expect(loaded).toEqual(saved);
    expect(stateHash(loaded)).toBe(stateHash(saved));
    const b = loaded.battles[0]!;
    expect(matchesRecord(rerunBattle(b.rerun!), b)).toBe(true);
    for (let day = 0; day < 30; day++) {
      advance(loaded);
      advance(saved);
    }
    expect(stateHash(loaded)).toBe(stateHash(saved));
  });

  it('lifts a save of each older version, checks it, and hashes like the game made now', () => {
    const current = savedWithBattle();
    for (const version of [2, 3] as const) {
      const lifted = deserialize(JSON.stringify(asVersion(current, version)));
      expect(lifted.version, String(version)).toBe(STATE_VERSION);
      expect(JSON.stringify(lifted), String(version)).toBe(JSON.stringify(current));
      expect(stateHash(lifted), String(version)).toBe(stateHash(current));
    }
    // Version 1 never had re-runs: the same game, its record replaying from the log alone.
    const expected = structuredClone(current);
    for (const b of expected.battles) b.rerun = null;
    const lifted = deserialize(JSON.stringify(asVersion(current, 1)));
    expect(stateHash(lifted)).toBe(stateHash(expected));
  });

  it('refuses a save from a newer version as saved by a newer version, never guessing', () => {
    const error = refusal(edited((s) => (s.version = STATE_VERSION + 1)));
    expect(error.kind).toBe('newer');
    expect(error.message).toMatch(/saved by a newer version/);
    expect(error.message).toContain(`save version ${String(STATE_VERSION + 1)}`);
  });

  it('refuses a version it has no migration from', () => {
    for (const version of [0, -1, 2.5, '4', null]) {
      const error = refusal(edited((s) => ((s as { version: unknown }).version = version)));
      expect(error.kind, String(version)).toBe('version');
      expect(error.message).toMatch(/no migration from save version/);
    }
    const unversioned = savedWithBattle() as Partial<GameState>;
    delete unversioned.version;
    expect(refusal(JSON.stringify(unversioned)).kind).toBe('version');
  });

  it('refuses what holds no saved game', () => {
    for (const text of ['', 'not a save', '[]', 'null', '42', '"save"', '{"version":']) {
      const error = refusal(text);
      expect(error.kind, text).toBe('unreadable');
      expect(error.message).toBe('This save cannot be read: it holds no saved game.');
    }
  });

  it('refuses an older save whose migration fails, naming the step', () => {
    const old = asVersion(savedWithBattle(), 1);
    old.battles[0]!.province = 'p999' as ProvinceId;
    const error = refusal(JSON.stringify(old));
    expect(error.kind).toBe('migration');
    expect(error.message).toMatch(/from version 1 to 2 failed \(no map province p999\)/);
  });

  it('refuses a save without what the migrations walk before running them', () => {
    const old = asVersion(savedWithBattle(), 2) as Partial<GameState>;
    delete old.nations;
    const error = refusal(JSON.stringify(old));
    expect(error.kind).toBe('shape');
    expect(error.message).toBe('This save is damaged: it has no nations.');
  });

  it('refuses a missing key, an id naming nothing and a color outside W U B R G', () => {
    const cases: [LoadFailure, string, (s: GameState) => void][] = [
      ['shape', 'nations.n0 has no mana', (s) => Reflect.deleteProperty(first(s), 'mana')],
      [
        'reference',
        'nations.n0.capital "p999" names nothing in the save',
        (s) => {
          first(s).capital = 'p999' as ProvinceId;
        },
      ],
      [
        'color',
        'nations.n0.research.color "X" is not one of W U B R G',
        (s) => {
          (first(s).research as { color: string }).color = 'X';
        },
      ],
    ];
    for (const [kind, text, change] of cases) {
      const error = refusal(edited(change));
      expect(error.kind, text).toBe(kind);
      expect(error.problems, text).toEqual([text]);
      expect(error.message).toBe(`This save is damaged: ${text}.`);
    }
  });

  it('names three problems in its message and keeps every one', () => {
    const error = refusal(
      edited((s) => {
        for (const n of Object.values(s.nations)) n.capital = 'p999' as ProvinceId;
        for (const n of Object.values(s.nations)) (n.research as { color: string }).color = 'X';
      }),
    );
    expect(error.kind).toBe('reference');
    expect(error.problems).toHaveLength(4);
    expect(error.message).toMatch(/: .+; .+; .+ \(and 1 more\)\.$/);
  });

  it('loads a malformed re-run as null: replays are lenient, and the check comes after', () => {
    const save = savedWithBattle(true);
    (save.battles[0] as { rerun: unknown }).rerun = { setup: 'junk', rng: 5 };
    const loaded = deserialize(serialize(save));
    expect(loaded.battles[0]!.rerun).toBeNull();
    expect(loaded.battles[0]!.replay).toEqual(save.battles[0]!.replay);
  });

  it('leaves the caller’s game as it was when a load fails', () => {
    const current = savedWithBattle(true);
    const before = stateHash(current);
    let game = current;
    const failing = [
      '',
      edited((s) => (s.version = 99)),
      edited((s) => Reflect.deleteProperty(s, 'commanders')),
    ];
    for (const text of failing) {
      try {
        game = deserialize(text);
      } catch (e) {
        expect(e).toBeInstanceOf(LoadError);
      }
    }
    expect(game).toBe(current);
    expect(stateHash(current)).toBe(before);
  });

  it('reports only the kinds it names', () => {
    expect(LOAD_FAILURES).toEqual([
      'unreadable',
      'newer',
      'version',
      'migration',
      'shape',
      'reference',
      'color',
    ]);
    const error = new LoadError('color', 'a reason', ['one']);
    expect([error.name, error.kind, error.message, error.problems]).toEqual([
      'LoadError',
      'color',
      'a reason',
      ['one'],
    ]);
    expect(error).toBeInstanceOf(Error);
  });
});
