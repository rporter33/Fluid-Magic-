// The AI on maps with impassable wild ranges (Phase 1b; war-table design 1.7 and 1.9): the AI
// reads adjacency only through MapProvince.neighbors, so it needs no code for wilds. The
// headless runner's games on wild maps play for three years without a refused command, the
// same setup plays the same game, and the runner passes the switch through to the map, beside
// the presets it was asked for (Phase 6b.3's --presets and --matrix).
import { describe, expect, it } from 'vitest';
import { runAi } from '../../src/ai/ai';
import { RUNNER_DEFAULTS, runMatch, runnerSetup, runnerSetups } from '../../src/ai/match';
import { matrixPairings, matrixSetups } from '../../src/ai/matrix';
import { defaultPreset, findPreset } from '../../src/content/pretenders/presets';
import { createGame } from '../../src/sim/createGame';

describe('the headless runner with wilds', () => {
  it('passes the switch to the map, off by default until the owner turns it on', () => {
    expect(RUNNER_DEFAULTS.wilds).toBe(false);
    expect(runnerSetup(1, 0).wilds).toBe(false);
    expect(runnerSetups(1, 2, [], true).map((s) => s.wilds)).toEqual([true, true]);
    expect(createGame(runnerSetup(1, 0)).map.wilds).toEqual([]);
    const map = createGame(runnerSetup(1, 0, [], true)).map;
    expect(map.wilds.length).toBeGreaterThan(0);
    const wildIds = new Set<string>(map.wilds.map((w) => w.id));
    for (const p of Object.values(map.provinces)) {
      expect(p.neighbors.some((n) => wildIds.has(n))).toBe(false);
    }
  });

  it('carries the chosen presets and the switch together, in the runner and the matrix', () => {
    const huntLord = findPreset('huntLord');
    if (!huntLord) throw new Error('no preset huntLord');
    for (const wilds of [false, true]) {
      const setups = runnerSetups(1, 2, [huntLord], wilds);
      expect(setups.map((s) => s.wilds)).toEqual([wilds, wilds]);
      for (const s of setups) {
        for (const n of s.nations) {
          const expected = n.nation === 'thornwood' ? huntLord : defaultPreset(n.nation);
          expect(n.pretender).toBe(expected.design);
        }
      }
      const pairing = matrixPairings().find((p) => p.challenger === huntLord);
      if (!pairing) throw new Error('no Hunt Lord pairing');
      const games = matrixSetups(pairing, 1, 2, wilds);
      expect(games.map((s) => s.wilds)).toEqual([wilds, wilds, wilds, wilds]);
      for (const s of games) {
        const green = s.nations.find((n) => n.nation === 'thornwood');
        expect(green?.pretender).toBe(huntLord.design);
      }
    }
    expect(matrixSetups(matrixPairings()[0]!, 1, 1).map((s) => s.wilds)).toEqual([
      RUNNER_DEFAULTS.wilds,
      RUNNER_DEFAULTS.wilds,
    ]);
  });

  it('plays the same game from the same setup', () => {
    const a = runMatch(runnerSetup(1, 0, [], true), runAi, 240);
    const b = runMatch(runnerSetup(1, 0, [], true), runAi, 240);
    expect(a.finalHash).toBe(b.finalHash);
    expect(a.log).toEqual(b.log);
    expect(a.finalHash).not.toBe(runMatch(runnerSetup(1, 0), runAi, 240).finalHash);
  }, 60_000);

  it('plays the runner games on wild maps for three years without a refusal', () => {
    const maxDays = 1080;
    for (const game of [0, 1]) {
      const match = runMatch(runnerSetup(1, game, [], true), runAi, maxDays);
      expect(match.state.map.wilds.length).toBeGreaterThan(0);
      expect(match.refused).toEqual([]);
      expect(match.reason).not.toBe('playerDefeated');
      expect(match.days).toBeLessThanOrEqual(maxDays);
      if (match.result === null) expect(match.days).toBe(maxDays);
      else expect(match.result.winner).not.toBeNull();
      const provinces = new Set(Object.keys(match.state.map.provinces));
      for (const c of Object.values(match.state.commanders)) {
        expect(provinces.has(c.location)).toBe(true);
      }
    }
  }, 120_000);
});
