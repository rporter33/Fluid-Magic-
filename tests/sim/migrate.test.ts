// Lifting older saves (docs/06-architecture.md, "Save and load"): version 1 battle records gain
// their scene and a null re-run; a malformed re-run loads as null instead of failing the save.
import { describe, expect, it } from 'vitest';
import { attackersAt, fight, ownerForces } from '../../src/sim/conflict';
import { matchesRecord, rerunBattle } from '../../src/sim/battle/rerun';
import { MIGRATIONS, migrateState } from '../../src/sim/migrate';
import { STATE_VERSION, type GameState } from '../../src/sim/types';
import { neighbors, redField } from './fixtures';

/** A saved game with one recorded battle, as JSON would bring it back. */
function savedWithBattle(): GameState {
  const { state, red, capital, army } = redField();
  army.squads[0]!.count = 60;
  army.squads[0]!.hp = 60 * 11;
  const target = neighbors(state, capital)[0]!;
  army.location = target;
  fight(state, target, attackersAt(state, target, red), ownerForces(state, target));
  return JSON.parse(JSON.stringify(state)) as GameState;
}

describe('migrateState', () => {
  it('has a step for every older version', () => {
    expect(STATE_VERSION).toBe(2);
    for (let v = 1; v < STATE_VERSION; v++) expect(MIGRATIONS[v]).toBeDefined();
  });

  it('lifts a version 1 save: records gain the scene from their province, and no re-run', () => {
    const v1 = savedWithBattle();
    v1.version = 1;
    // Several records, as a save keeps up to BATTLE.keep: none may be lost, reordered, or changed.
    const first = v1.battles[0]!;
    v1.battles = [0, 1, 2].map((i) => ({
      ...structuredClone(first),
      id: `${first.id}x${String(i)}` as typeof first.id,
    }));
    for (const b of v1.battles) {
      const old = b as Partial<typeof b>;
      delete old.scene;
      delete old.rerun;
    }
    const before = structuredClone(v1.battles);
    const state = migrateState(v1);
    expect(state.version).toBe(STATE_VERSION);
    const terrain = state.map.provinces[first.province]!.terrain;
    expect(state.battles).toEqual(
      before.map((b) => ({ ...b, scene: { terrain, storm: null }, rerun: null })),
    );
  });

  it('leaves a current save as it is, re-runs and all', () => {
    const saved = savedWithBattle();
    const copy = structuredClone(saved);
    expect(migrateState(saved)).toEqual(copy);
    const b = saved.battles[0]!;
    expect(matchesRecord(rerunBattle(b.rerun!), b)).toBe(true);
  });

  it('loads a malformed re-run as null rather than failing, and keeps a sound one', () => {
    const saved = savedWithBattle();
    const good = saved.battles[0]!.rerun;
    expect(migrateState(structuredClone(saved)).battles[0]!.rerun).toEqual(good);
    const withRerun = (rerun: unknown): GameState => {
      const state = structuredClone(saved);
      (state.battles[0] as { rerun: unknown }).rerun = rerun;
      return state;
    };
    const rng = { a: 1, b: 2, c: 3, d: 4 };
    const bad: unknown[] = [
      5,
      'setup',
      {},
      { setup: null, rng },
      { setup: { province: 'p1', attacker: {}, defender: {} }, rng },
      { ...good, rng: { a: 0, b: 0, c: 0, d: 0 } },
    ];
    for (const rerun of bad) expect(migrateState(withRerun(rerun)).battles[0]!.rerun).toBeNull();
    // Recorded under other battle rules, or before rules were recorded.
    expect(
      migrateState(withRerun({ ...good, rules: '0'.repeat(14) })).battles[0]!.rerun,
    ).toBeNull();
    const noRules: Partial<NonNullable<typeof good>> = structuredClone(good)!;
    delete noRules.rules;
    expect(migrateState(withRerun(noRules)).battles[0]!.rerun).toBeNull();
    // Spells stored as objects instead of ids.
    const objects = structuredClone(good)!;
    (objects.setup.attacker.commanders[0] as { spells: unknown }).spells = [{ id: 'emberDart' }];
    expect(migrateState(withRerun(objects)).battles[0]!.rerun).toBeNull();
  });
});
