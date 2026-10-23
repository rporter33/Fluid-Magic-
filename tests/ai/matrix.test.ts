// The headless runner's chosen presets and its preset matrix (the 2026-10-21 pretender build
// spec, A.10, Phase 6b.3): `--presets` reads nation:preset pairs and refuses anything else;
// chosen presets replace only their nation's default, so the default runner is unchanged; the
// matrix plays each preset against the opposing default, every seed in both orders, and its
// table reports each preset's share against the 35% to 65% band.
import { describe, expect, it } from 'vitest';
import { runAi } from '../../src/ai/ai';
import type { Refusal } from '../../src/ai/driver';
import { runMatch, runnerSetup, runnerSetups, type MatchResult } from '../../src/ai/match';
import {
  MATRIX_BAND,
  matrixPairings,
  matrixSetups,
  matrixTable,
  pairingLabel,
  pairingResult,
  parsePresets,
  type Pairing,
} from '../../src/ai/matrix';
import { defaultPreset, findPreset, PRESETS } from '../../src/content/pretenders/presets';
import type { CommanderId, NationId } from '../../src/sim/ids';

function preset(id: string) {
  const p = findPreset(id);
  if (!p) throw new Error(`no preset ${id}`);
  return p;
}

describe('--presets', () => {
  it('reads nation:preset pairs, in any order, one nation or both', () => {
    expect(parsePresets('cinderHorde:pyreHost,thornwood:huntLord')).toEqual([
      preset('pyreHost'),
      preset('huntLord'),
    ]);
    expect(parsePresets(' thornwood : motherOfThePack ')).toEqual([preset('motherOfThePack')]);
    expect(parsePresets('thornwood:heartwood,cinderHorde:dreadIdol')).toEqual([
      preset('heartwood'),
      preset('dreadIdol'),
    ]);
  });

  it('refuses a malformed pair, an unknown nation or preset, a foreign preset, or a repeat', () => {
    const refusal = (arg: string) => {
      try {
        parsePresets(arg);
      } catch (e) {
        return e instanceof Error ? e.message : String(e);
      }
      return null;
    };
    expect(refusal('pyreHost')).toBe('"pyreHost" is not nation:preset');
    expect(refusal('cinderHorde:pyreHost:x')).toBe('"cinderHorde:pyreHost:x" is not nation:preset');
    expect(refusal('cinderHorde:')).toBe('"cinderHorde:" is not nation:preset');
    expect(refusal('atlantis:warlord')).toBe(
      'atlantis is not a runner nation (cinderHorde, thornwood)',
    );
    expect(refusal('cinderHorde:nope')).toBe('no preset nope');
    // Only a whole id names a preset: a prefix of one does not.
    expect(refusal('cinderHorde:pyre')).toBe('no preset pyre');
    expect(findPreset('pyre')).toBeUndefined();
    expect(refusal('thornwood:pyreHost')).toBe('Pyre Host is a preset of Cinder Horde');
    expect(refusal('cinderHorde:warlord,cinderHorde:pyreHost')).toBe('cinderHorde has two presets');
  });

  it('replace only their own nation’s default, the order still alternating by game', () => {
    const chosen = [preset('undyingFlame')];
    const setups = runnerSetups(3, 4, chosen);
    expect(setups.map((s) => s.seed)).toEqual([3, 4, 5, 6]);
    for (const [game, setup] of setups.entries()) {
      const plain = runnerSetup(3, game);
      expect(setup.nations.map((n) => n.nation)).toEqual(plain.nations.map((n) => n.nation));
      for (const n of setup.nations) {
        const expected =
          n.nation === 'cinderHorde' ? preset('undyingFlame') : defaultPreset(n.nation);
        expect(n.pretender, `${String(game)} ${n.nation}`).toBe(expected.design);
        expect(n.ai).toEqual({ difficulty: 'normal' });
      }
    }
  });

  it('leave the default runner exactly as it was without them', () => {
    // The Phase 7 runner's setup, written out: what `npm run sim:aivai` played before 6b.3, on
    // maps without wilds (Phase 1b's switch rides in every runner setup; off, createGame makes
    // the map it made without it, and `--wilds off` plays these games).
    const before = (seed: number, game: number) => {
      const order = game % 2 === 0 ? ['cinderHorde', 'thornwood'] : ['thornwood', 'cinderHorde'];
      return {
        seed: seed + game,
        mapSize: 'medium',
        nations: order.map((nation) => ({
          nation,
          pretender: defaultPreset(nation as 'cinderHorde' | 'thornwood').design,
          ai: { difficulty: 'normal' },
        })),
        wilds: false,
      };
    };
    expect(runnerSetups(1, 20, [], false)).toEqual(
      Array.from({ length: 20 }, (_, g) => before(1, g)),
    );
    // The default runner differs from it only by the switch, on since the owner's decision.
    expect(runnerSetups(1, 20)).toEqual(
      Array.from({ length: 20 }, (_, g) => ({ ...before(1, g), wilds: true })),
    );
    // Naming the defaults is the same as naming nothing.
    expect(runnerSetups(1, 20, parsePresets('cinderHorde:warlord,thornwood:elderOak'))).toEqual(
      runnerSetups(1, 20),
    );
  });
});

describe('--matrix', () => {
  it('pairs the defaults first, then every other preset against the opposing default', () => {
    const pairings = matrixPairings();
    expect(pairings.map(pairingLabel)).toEqual([
      'Warlord (Cinder Horde) vs Elder Oak (Thornwood)',
      'Ember Oracle (Cinder Horde) vs Elder Oak',
      'Wildfire (Cinder Horde) vs Elder Oak',
      'Deep Root (Thornwood) vs Warlord',
      'Wyrm of the Loam (Thornwood) vs Warlord',
      'Undying Flame (Cinder Horde) vs Elder Oak',
      'Pyre Host (Cinder Horde) vs Elder Oak',
      'Dread Idol (Cinder Horde) vs Elder Oak',
      'Heartwood (Thornwood) vs Warlord',
      'Hunt Lord (Thornwood) vs Warlord',
      'Mother of the Pack (Thornwood) vs Warlord',
    ]);
    expect(pairings[0]!.challenger).toBeNull();
    for (const p of pairings.slice(1)) {
      const challenger = p.challenger!;
      expect(PRESETS).toContain(challenger);
      expect(p.presets).toContain(challenger);
      for (const other of p.presets.filter((x) => x !== challenger)) {
        expect(other).toBe(defaultPreset(other.nation));
        expect(other.nation).not.toBe(challenger.nation);
      }
    }
  });

  it('plays every seed in both nation orders', () => {
    const pairing = matrixPairings().find((p) => p.challenger?.id === 'pyreHost')!;
    const setups = matrixSetups(pairing, 1, 20);
    expect(setups).toHaveLength(40);
    expect(setups.map((s) => s.seed)).toEqual(
      Array.from({ length: 20 }, (_, i) => [i + 1, i + 1]).flat(),
    );
    expect(setups.slice(0, 2).map((s) => s.nations.map((n) => n.nation))).toEqual([
      ['cinderHorde', 'thornwood'],
      ['thornwood', 'cinderHorde'],
    ]);
    for (const s of setups) {
      const red = s.nations.find((n) => n.nation === 'cinderHorde')!;
      const green = s.nations.find((n) => n.nation === 'thornwood')!;
      expect(red.pretender).toBe(preset('pyreHost').design);
      expect(green.pretender).toBe(defaultPreset('thornwood').design);
    }
  });

  it('tallies a pairing: wins by nation, the preset’s share, and the 35% to 65% band', () => {
    expect(MATRIX_BAND).toEqual({ min: 0.35, max: 0.65 });
    const pairing: Pairing = matrixPairings().find((p) => p.challenger?.id === 'huntLord')!;
    const timeout = runMatch(runnerSetup(1, 0), () => [], 30);
    const ids = Object.keys(timeout.state.nations) as NationId[];
    const red = ids.find((id) => timeout.state.nations[id]!.def === 'cinderHorde')!;
    const green = ids.find((id) => timeout.state.nations[id]!.def === 'thornwood')!;
    const won = (winner: NationId): MatchResult => ({
      ...timeout,
      result: { day: 30, winner, reason: 'wellsprings' },
    });
    const games = [won(green), won(green), won(red), timeout];
    const row = pairingResult(pairing, games);
    expect(row).toMatchObject({
      games: 4,
      wins: { 'Cinder Horde': 1, Thornwood: 2 },
      noWinner: 1,
      share: 0.5,
      inBand: true,
      meanMonths: 1,
      refused: 0,
    });
    expect(pairingResult(pairing, [won(green), won(green), timeout]).inBand).toBe(false);
    expect(pairingResult(pairing, [won(red), won(green), timeout]).share).toBeCloseTo(1 / 3);
    // The band's edges are in it: with 40 games a row, 14 and 26 wins are 35% and 65%.
    const split = (challenger: number, opponent: number) => [
      ...Array.from({ length: challenger }, () => won(green)),
      ...Array.from({ length: opponent }, () => won(red)),
    ];
    expect(pairingResult(pairing, split(14, 26))).toMatchObject({ share: 0.35, inBand: true });
    expect(pairingResult(pairing, split(26, 14))).toMatchObject({ share: 0.65, inBand: true });
    expect(pairingResult(pairing, split(13, 27)).inBand).toBe(false);
    expect(pairingResult(pairing, split(27, 13)).inBand).toBe(false);
    // Refused commands add up over the row's games.
    const [commander] = Object.keys(timeout.state.commanders) as CommanderId[];
    const refusal: Refusal = {
      day: 3,
      command: { type: 'reverse', nation: red, commander: commander! },
      error: 'Not moving',
    };
    const refusing = (n: number): MatchResult => ({
      ...won(red),
      refused: Array.from({ length: n }, () => refusal),
    });
    const refusedRow = pairingResult(pairing, [refusing(2), won(green), refusing(3)]);
    expect(refusedRow.refused).toBe(5);
    const baseline = pairingResult(matrixPairings()[0]!, games);
    expect([baseline.share, baseline.inBand]).toEqual([null, null]);
    const missed = pairingResult(pairing, split(1, 9));
    expect(matrixTable([baseline, row, missed, refusedRow])).toEqual([
      "| Pairing | Games | Cinder Horde wins | Thornwood wins | No winner | Preset's share | In 35% to 65% | Mean months | Refused |",
      '|---|---|---|---|---|---|---|---|---|',
      '| Warlord (Cinder Horde) vs Elder Oak (Thornwood) | 4 | 1 | 2 | 1 | baseline |  | 1.0 | 0 |',
      '| Hunt Lord (Thornwood) vs Warlord | 4 | 1 | 2 | 1 | 50% | yes | 1.0 | 0 |',
      '| Hunt Lord (Thornwood) vs Warlord | 10 | 9 | 1 | 0 | 10% | NO | 1.0 | 0 |',
      '| Hunt Lord (Thornwood) vs Warlord | 3 | 2 | 1 | 0 | 33% | NO | 1.0 | 5 |',
    ]);
  });

  it('plays each Phase 6b.3 preset’s first matrix games for a year with no refused command', () => {
    const fresh = matrixPairings().filter(
      (p) => p.challenger !== null && p.challenger.design.blessings !== undefined,
    );
    expect(fresh.map((p) => p.challenger!.id)).toEqual([
      'undyingFlame',
      'pyreHost',
      'dreadIdol',
      'heartwood',
      'huntLord',
      'motherOfThePack',
    ]);
    // On seed 1's maps without wilds, where every one of these games lasts the year. With wilds
    // (the matrix's default since Phase 1b) four of the twelve end by Wellsprings on days 300 to
    // 350, so the year is played there in the next test, up to a win.
    for (const pairing of fresh) {
      for (const setup of matrixSetups(pairing, 1, 1, false)) {
        const match = runMatch(setup, runAi, 360);
        expect(match.refused, pairingLabel(pairing)).toEqual([]);
        expect(match.days, pairingLabel(pairing)).toBe(360);
      }
    }
  }, 240_000);

  it('plays the same games on the default maps, with wilds, with no refused command', () => {
    const fresh = matrixPairings().filter(
      (p) => p.challenger !== null && p.challenger.design.blessings !== undefined,
    );
    for (const pairing of fresh) {
      for (const setup of matrixSetups(pairing, 1, 1)) {
        const match = runMatch(setup, runAi, 360);
        expect(match.state.map.wilds.length, pairingLabel(pairing)).toBeGreaterThan(0);
        expect(match.refused, pairingLabel(pairing)).toEqual([]);
        if (match.result === null) expect(match.days, pairingLabel(pairing)).toBe(360);
        else expect(match.result.winner, pairingLabel(pairing)).not.toBeNull();
      }
    }
  }, 240_000);
});
