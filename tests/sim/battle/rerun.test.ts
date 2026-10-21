// Re-runnable battle records (docs/04-battle.md, "Replay detail"; docs/12-battle-presentation.md,
// S1.5 and S1.6): a player battle's record fights again to the same log, also after a save and
// load; tampering is noticed; and records stay small.
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { runAi } from '../../../src/ai/ai';
import type { DetailEvent } from '../../../src/sim/battle/detail';
import { resolveBattle } from '../../../src/sim/battle/resolve';
import {
  battleRulesHash,
  fromSetupRecord,
  matchesRecord,
  rerunBattle,
  toSetupRecord,
} from '../../../src/sim/battle/rerun';
import type { BattleSetup } from '../../../src/sim/battle/types';
import { applyCommand } from '../../../src/sim/commands';
import { attackersAt, fight, ownerForces } from '../../../src/sim/conflict';
import { createGame } from '../../../src/sim/createGame';
import { cloneRng, createRng } from '../../../src/sim/rng';
import { advance } from '../../../src/sim/tick';
import type { BattleRecord, GameState } from '../../../src/sim/types';
import { besiege, nation, neighbors, redField, twoNationGame } from '../fixtures';
import { NAMED, namedFixture } from './fixtures/named';

/** Red's starting army, made strong, fights the independents next door through fight(). */
function redBattle(seed = 1) {
  const { state, red, capital, army } = redField(seed);
  army.squads[0]!.count = 60;
  army.squads[0]!.hp = 60 * 11;
  const target = neighbors(state, capital)[0]!;
  army.location = target;
  const before = cloneRng(state.rng);
  fight(state, target, attackersAt(state, target, red), ownerForces(state, target));
  return { state, red, target, before, record: state.battles.at(-1)! };
}

/** Every record of the state re-runs to its own log. */
function allMatch(state: GameState): boolean {
  return state.battles.every((b) => b.rerun !== null && matchesRecord(rerunBattle(b.rerun), b));
}

describe('a recorded battle', () => {
  it('keeps the setup and the rng state from just before the battle', () => {
    const { record, before, target } = redBattle();
    expect(record.rerun?.rng).toEqual(before);
    expect(record.rerun?.setup.province).toBe(target);
    expect(record.rerun?.rules).toBe(battleRulesHash());
    expect(record.scene).toEqual({ terrain: expect.any(String) as unknown, storm: null });
  });

  it('re-runs to the same log, in the same session and after a save and load', () => {
    const { state, record } = redBattle();
    const detail: DetailEvent[] = [];
    const again = rerunBattle(record.rerun!, detail);
    expect(matchesRecord(again, record)).toBe(true);
    expect(detail.some((e) => e.kind === 'strike')).toBe(true);
    const loaded = JSON.parse(JSON.stringify(state)) as GameState;
    const saved = loaded.battles.at(-1)!;
    expect(matchesRecord(rerunBattle(saved.rerun!), saved)).toBe(true);
  });

  it('is never changed by a re-run', () => {
    const { record } = redBattle();
    const before = structuredClone(record);
    rerunBattle(record.rerun!, []);
    rerunBattle(record.rerun!);
    expect(record).toEqual(before);
  });

  it('records the storm of a fort in its scene, and re-runs it', () => {
    const { state, red, green } = redField();
    const deepmoss = state.nations[green]!.capital;
    const army = besiege(state, red, deepmoss);
    army.squads[0]!.count = 60;
    army.squads[0]!.hp = 60 * 11;
    applyCommand(state, { type: 'storm', nation: red, province: deepmoss });
    advance(state);
    const record = state.battles.at(-1)!;
    expect(record.province).toBe(deepmoss);
    expect(record.scene.storm).toEqual({ wallsStanding: true });
    expect(matchesRecord(rerunBattle(record.rerun!), record)).toBe(true);
  });

  it('is not kept when no player fought', () => {
    const state = twoNationGame(1, { ai: { difficulty: 'normal' } });
    const ai = Object.keys(state.nations)[0] as keyof GameState['nations'];
    const capital = state.nations[ai]!.capital;
    const target = neighbors(state, capital)[0]!;
    const army = Object.values(state.commanders).find(
      (c) => c.owner === ai && c.location === capital && c.squads.length > 0,
    )!;
    army.location = target;
    fight(state, target, attackersAt(state, target, ai), ownerForces(state, target));
    expect(state.battles).toEqual([]);
    expect(state.messages.some((m) => m.kind === 'battle' && m.battle === null)).toBe(true);
  });

  it('fails to re-run with an unknown spell, and notices a tampered setup', () => {
    const { record } = redBattle();
    const rerun = record.rerun!;
    const unknown = structuredClone(rerun);
    unknown.setup.attacker.commanders[0]!.spells = ['noSuchSpell'];
    expect(() => rerunBattle(unknown)).toThrow(/noSuchSpell/);
    const ritual = structuredClone(rerun);
    ritual.setup.attacker.commanders[0]!.spells = ['callFireSprites'];
    expect(() => fromSetupRecord(ritual.setup)).toThrow(/callFireSprites/);
    const tampered = structuredClone(rerun);
    tampered.setup.defender.squads[0]!.stats.prot += 1;
    expect(matchesRecord(rerunBattle(tampered), record)).toBe(false);
    expect(matchesRecord(rerunBattle(rerun), { ...record, winner: 'defender' })).toBe(
      record.winner === 'defender',
    );
  });
});

describe('setup records of the named battles', () => {
  /** A named battle fought plainly, and as a record of it would re-run. */
  const contentOnly = NAMED.filter((f) =>
    [f.build().attacker, f.build().defender].every((s) =>
      s.commanders.every((c) => c.spells.every((spell) => !spell.id.startsWith('test:'))),
    ),
  );

  it('hold only finite numbers', () => {
    const numbers = (value: unknown): number[] => {
      if (typeof value === 'number') return [value];
      if (typeof value !== 'object' || value === null) return [];
      return Object.values(value).flatMap(numbers);
    };
    for (const f of NAMED) {
      const all = numbers(f.build());
      expect(all.length).toBeGreaterThan(0);
      expect(all.every(Number.isFinite), f.name).toBe(true);
    }
  });

  it.each(contentOnly.map((f) => [f.name, f.build] as const))(
    '%s: survive the round trip and re-run to the same battle',
    (_, build) => {
      const setup: BattleSetup = build();
      expect(fromSetupRecord(toSetupRecord(setup))).toEqual(setup);
      for (const seed of [1, 2, 3]) {
        const rng = createRng(seed);
        const result = resolveBattle(build(), rng);
        const record = { winner: result.winner, rounds: result.rounds, replay: result.replay };
        const rerun = { setup: toSetupRecord(build()), rng: createRng(seed), rules: '' };
        expect(matchesRecord(rerunBattle(rerun), record as BattleRecord)).toBe(true);
      }
    },
  );
});

describe('a played year', () => {
  it('records every player battle so that it re-runs and matches, also after a load', () => {
    // Thornwood is a player here, Cinder Horde an AI; the AI plays both sides.
    const state = createGame({
      seed: 7,
      mapSize: 'medium',
      nations: [nation('cinderHorde', { ai: { difficulty: 'normal' } }), nation('thornwood')],
    });
    while (state.day < 365) {
      advance(state);
      if (state.day % 5 !== 0) continue;
      for (const n of Object.values(state.nations)) {
        if (n.eliminated) continue;
        for (const command of runAi(state, n.id)) applyCommand(state, command);
      }
    }
    expect(state.battles.length).toBeGreaterThanOrEqual(10);
    expect(allMatch(state)).toBe(true);
    expect(allMatch(JSON.parse(JSON.stringify(state)) as GameState)).toBe(true);
  });
});

describe('record sizes (docs/12, S1.6)', () => {
  /** A full record of a named battle, as a save would hold it. */
  function fullRecord(name: string, seed: number) {
    const setup = namedFixture(name).build();
    const rng = createRng(seed);
    const before = cloneRng(rng);
    const r = resolveBattle(setup, rng);
    const rerun = { setup: toSetupRecord(setup), rng: before };
    const record = {
      id: 'b123',
      day: 400,
      province: 'p17',
      attacker: 'n0',
      defender: 'n1',
      winner: r.winner,
      rounds: r.rounds,
      roster: r.roster,
      replay: r.replay,
      scene: { terrain: 'hills', storm: null },
      rerun,
    };
    return { rerun: JSON.stringify(rerun).length, json: JSON.stringify(record) };
  }

  it('keeps clash300 under 14 KB of setup, 56 KB raw, and 7 KB gzipped', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const { rerun, json } = fullRecord('clash300', seed);
      expect(rerun).toBeLessThanOrEqual(14 * 1024);
      expect(json.length).toBeLessThanOrEqual(56 * 1024);
      expect(gzipSync(json).length).toBeLessThanOrEqual(7 * 1024);
    }
  });

  it('keeps the starting armies under 16 KB raw', () => {
    for (let seed = 1; seed <= 50; seed++) {
      expect(fullRecord('starting', seed).json.length).toBeLessThanOrEqual(16 * 1024);
    }
  });

  it('keeps twenty clash300 records under 200 KB gzipped', () => {
    const all = Array.from({ length: 20 }, (_, i) => fullRecord('clash300', i + 1).json);
    expect(gzipSync(`[${all.join(',')}]`).length).toBeLessThanOrEqual(200 * 1024);
  });

  it('re-runs the worst battle (300 against 300 for 50 rounds) with detail in under 45 ms', () => {
    const setup = toSetupRecord(namedFixture('immortal').build());
    const rerun = { setup, rng: createRng(1), rules: battleRulesHash() };
    rerunBattle(rerun, []);
    // The best of five, with x2 slack for loaded CI machines (docs/12, S1.6).
    let best = Infinity;
    for (let i = 0; i < 5; i++) {
      const start = performance.now();
      rerunBattle(rerun, []);
      best = Math.min(best, performance.now() - start);
    }
    expect(best).toBeLessThan(2 * 45);
  });
});
