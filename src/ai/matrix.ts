// The headless runner's chosen presets and its preset matrix (the 2026-10-21 pretender build
// spec, A.10, Phase 6b.3): `sim:aivai --presets cinderHorde:<id>,thornwood:<id>` plays chosen
// presets, and `--matrix` plays each preset against the opposing nation's default, every seed in
// both nation orders, with the two defaults as the baseline. Acceptance (docs/09-balance.md):
// each preset wins 35% to 65% of its games against the opposing default.
import { nationDef, type NationDefId } from '../content';
import { defaultPreset, findPreset, PRESETS, type PresetDef } from '../content/pretenders/presets';
import { TIME } from '../content/rules';
import type { GameSetup } from '../sim/types';
import { playedSetup, RUNNER_NATIONS, tallyWins, type MatchResult } from './match';

/** The share of games a preset must win against the opposing default (A.10). */
export const MATRIX_BAND = { min: 0.35, max: 0.65 } as const;

/**
 * Reads `--presets`: a comma-separated list of `nation:presetId`, at most one per runner nation,
 * each preset of its own nation. Nations it leaves out play their default. Throws with a message
 * the runner prints.
 */
export function parsePresets(arg: string): PresetDef[] {
  const chosen: PresetDef[] = [];
  for (const item of arg.split(',')) {
    const [nation, id, extra] = item.split(':').map((s) => s.trim());
    if (!nation || !id || extra !== undefined) {
      throw new Error(`"${item}" is not nation:preset`);
    }
    if (!(RUNNER_NATIONS as readonly string[]).includes(nation)) {
      throw new Error(`${nation} is not a runner nation (${RUNNER_NATIONS.join(', ')})`);
    }
    const preset = findPreset(id);
    if (!preset) throw new Error(`no preset ${id}`);
    if (preset.nation !== nation) {
      throw new Error(`${preset.name} is a preset of ${nationDef(preset.nation).name}`);
    }
    if (chosen.some((p) => p.nation === preset.nation)) {
      throw new Error(`${nation} has two presets`);
    }
    chosen.push(preset);
  }
  return chosen;
}

/** One row of the matrix: the presets both nations play, and which of them is under test. */
export interface Pairing {
  /** The preset measured against the opposing default; null for the defaults' baseline row. */
  challenger: PresetDef | null;
  /** The presets played, by nation (an absent nation plays its default). */
  presets: readonly PresetDef[];
}

/**
 * The matrix rows: the two defaults first, then every other preset of a runner nation in content
 * order, each against the opposing nation's default.
 */
export function matrixPairings(): Pairing[] {
  const challengers = PRESETS.filter(
    (p) => RUNNER_NATIONS.includes(p.nation) && p !== defaultPreset(p.nation),
  );
  return [
    { challenger: null, presets: RUNNER_NATIONS.map(defaultPreset) },
    ...challengers.map((p) => ({
      challenger: p,
      presets: RUNNER_NATIONS.map((n) => (n === p.nation ? p : defaultPreset(n))),
    })),
  ];
}

/** A pairing's name in the table: "Pyre Host (Cinder Horde) vs Elder Oak". */
export function pairingLabel(pairing: Pairing): string {
  const { challenger } = pairing;
  if (!challenger) {
    return pairing.presets.map((p) => `${p.name} (${nationDef(p.nation).name})`).join(' vs ');
  }
  const opponents = pairing.presets.filter((p) => p !== challenger).map((p) => p.name);
  return `${challenger.name} (${nationDef(challenger.nation).name}) vs ${opponents.join(', ')}`;
}

/** A pairing's games: seeds `seed` to `seed + seeds - 1`, each in both nation orders. */
export function matrixSetups(pairing: Pairing, seed: number, seeds: number): GameSetup[] {
  const orders: readonly (readonly NationDefId[])[] = [
    RUNNER_NATIONS,
    [...RUNNER_NATIONS].reverse(),
  ];
  return Array.from({ length: seeds }, (_, i) =>
    orders.map((order) => playedSetup(seed + i, order, pairing.presets)),
  ).flat();
}

export interface PairingResult {
  pairing: Pairing;
  games: number;
  /** Wins per runner nation, by name, every nation listed. */
  wins: Record<string, number>;
  noWinner: number;
  /** The challenger's share of the games won, 0 to 1; null for the baseline row. */
  share: number | null;
  /** The share lies in MATRIX_BAND; null for the baseline row. */
  inBand: boolean | null;
  meanMonths: number;
  refused: number;
}

/** Tallies a pairing's games. */
export function pairingResult(pairing: Pairing, results: readonly MatchResult[]): PairingResult {
  const { wins, noWinner } = tallyWins(results);
  const games = results.length;
  const challenger = pairing.challenger;
  const share =
    challenger === null || games === 0
      ? null
      : (wins[nationDef(challenger.nation).name] ?? 0) / games;
  return {
    pairing,
    games,
    wins,
    noWinner,
    share,
    inBand: share === null ? null : share >= MATRIX_BAND.min && share <= MATRIX_BAND.max,
    meanMonths:
      results.reduce((sum, m) => sum + m.days, 0) / Math.max(games, 1) / TIME.daysPerMonth,
    refused: results.reduce((sum, m) => sum + m.refused.length, 0),
  };
}

/** The matrix as a Markdown table, one row per pairing. */
export function matrixTable(rows: readonly PairingResult[]): string[] {
  const nations = RUNNER_NATIONS.map((n) => nationDef(n).name);
  const pct = (x: number) => `${String(Math.round(100 * x))}%`;
  const lines = [
    `| Pairing | Games | ${nations.map((n) => `${n} wins`).join(' | ')} | No winner | Preset's share | In 35% to 65% | Mean months | Refused |`,
    `|---|---|${nations.map(() => '---|').join('')}---|---|---|---|---|`,
  ];
  for (const r of rows) {
    const wins = nations.map((n) => String(r.wins[n] ?? 0)).join(' | ');
    const share = r.share === null ? 'baseline' : pct(r.share);
    const band = r.inBand === null ? '' : r.inBand ? 'yes' : 'NO';
    lines.push(
      `| ${pairingLabel(r.pairing)} | ${String(r.games)} | ${wins} | ${String(r.noWinner)} | ` +
        `${share} | ${band} | ${r.meanMonths.toFixed(1)} | ${String(r.refused)} |`,
    );
  }
  return lines;
}
