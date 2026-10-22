// Lifting older saves (docs/06-architecture.md, "Save and load"): version 1 battle records gain
// their scene and a null re-run; version 2 nations gain a null god's name and reform day and
// provinces no added springs; version 3 maps gain no wilds; a malformed re-run loads as null
// instead of failing the save.
import { describe, expect, it } from 'vitest';
import { attackersAt, fight, ownerForces } from '../../src/sim/conflict';
import { matchesRecord, rerunBattle } from '../../src/sim/battle/rerun';
import { stateHash } from '../../src/sim/hash';
import { MIGRATIONS, migrateState } from '../../src/sim/migrate';
import { advance } from '../../src/sim/tick';
import { STATE_VERSION, type GameState, type NationState } from '../../src/sim/types';
import { neighbors, redField } from './fixtures';

/** Removes from a save what the given version and later ones added, as an older save lacks it. */
function asVersion(saved: GameState, version: 1 | 2 | 3): GameState {
  const old = structuredClone(saved);
  old.version = version;
  const map: Partial<typeof old.map> = old.map;
  delete map.wilds;
  if (version === 3) return old;
  for (const n of Object.values(old.nations)) {
    const o: Partial<NationState> = n;
    delete o.pretenderName;
    delete o.pretenderReturnDay;
  }
  for (const p of Object.values(old.provinces)) {
    const o: Partial<typeof p> = p;
    delete o.extraSprings;
  }
  if (version === 1) {
    for (const b of old.battles) {
      const o: Partial<typeof b> = b;
      delete o.scene;
      delete o.rerun;
    }
  }
  return old;
}

/**
 * A saved game with one recorded battle, as JSON would bring it back. Its map has no wilds unless
 * `wilds`: the saves of versions 1 to 3 it stands for were made before wilds existed.
 */
function savedWithBattle(wilds = false): GameState {
  const { state, red, capital, army } = redField(1, wilds);
  army.squads[0]!.count = 60;
  army.squads[0]!.hp = 60 * 11;
  const target = neighbors(state, capital)[0]!;
  army.location = target;
  fight(state, target, attackersAt(state, target, red), ownerForces(state, target));
  return JSON.parse(JSON.stringify(state)) as GameState;
}

describe('migrateState', () => {
  it('has a step for every older version', () => {
    expect(STATE_VERSION).toBe(4);
    for (let v = 1; v < STATE_VERSION; v++) expect(MIGRATIONS[v]).toBeDefined();
  });

  it('lifts a version 2 save: no god named or reforming, no springs added in play', () => {
    const current = savedWithBattle();
    expect(current.battles).toHaveLength(1);
    const v2 = asVersion(current, 2);
    expect(Object.keys(Object.values(v2.nations)[0]!)).not.toContain('pretenderName');
    const state = migrateState(v2);
    expect(state).toEqual(current);
    // Key for key in the same order too: stateHash hashes the JSON text, and a lifted save must
    // hash like the same game created on this version.
    expect(JSON.stringify(state)).toBe(JSON.stringify(current));
    expect(stateHash(state)).toBe(stateHash(current));
    expect(state.version).toBe(STATE_VERSION);
    expect(state.map.wilds).toEqual([]);
    for (const n of Object.values(state.nations)) {
      expect([n.pretenderName, n.pretenderReturnDay]).toEqual([null, null]);
    }
    for (const p of Object.values(state.provinces)) expect(p.extraSprings).toEqual([]);
    // Its battle still re-runs to its log after the lift.
    const b = state.battles[0]!;
    expect(matchesRecord(rerunBattle(b.rerun!), b)).toBe(true);
  });

  it('lifts a version 3 save: the map has no wilds, and the game plays on identically', () => {
    const current = savedWithBattle();
    const v3 = asVersion(current, 3);
    expect(Object.keys(v3.map)).not.toContain('wilds');
    const state = migrateState(v3);
    expect(state.version).toBe(STATE_VERSION);
    expect(state.map.wilds).toEqual([]);
    expect(Object.keys(state.map).at(-1)).toBe('wilds');
    expect(JSON.stringify(state)).toBe(JSON.stringify(current));
    expect(stateHash(state)).toBe(stateHash(current));
    // The lifted save and the save it came from play the same days to the same hash.
    const fresh = JSON.parse(JSON.stringify(current)) as GameState;
    for (let day = 0; day < 40; day++) {
      advance(state);
      advance(fresh);
    }
    expect(stateHash(state)).toBe(stateHash(fresh));
  });

  it('chains the steps: a version 1 save gains the version 2, 3 and 4 fields alike', () => {
    const current = savedWithBattle();
    const state = migrateState(asVersion(current, 1));
    expect(state.version).toBe(STATE_VERSION);
    expect(Object.values(state.nations)[0]!.pretenderName).toBeNull();
    expect(state.battles[0]!.rerun).toBeNull();
    // The same game created on this version, but with its record's re-run lost, as version 1
    // never had one: equal key for key, so equal hashes.
    const expected = structuredClone(current);
    for (const b of expected.battles) b.rerun = null;
    expect(JSON.stringify(state)).toBe(JSON.stringify(expected));
    expect(stateHash(state)).toBe(stateHash(expected));
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

  it('leaves a current save as it is, wilds, re-runs and all', () => {
    const saved = savedWithBattle(true);
    expect(saved.map.wilds.length).toBeGreaterThan(0);
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
