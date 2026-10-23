// The golden pin of the named battles (docs/12-battle-presentation.md, S1.9): for each fixture
// and seed, a hash of the stored log as it was before the replay additions A1 to A5, the
// winner, the rounds, and the rng state after the battle, and a hash of the outcomes. The
// detail refactor had to leave every one of them unchanged; `npm run golden:battle` rewrites
// golden.json only for a deliberate rule or content change, named in its commit.
import type { BattleEvent } from '../../../../src/sim/battle/events';
import { resolveBattle } from '../../../../src/sim/battle/resolve';
import type { BattleSetup } from '../../../../src/sim/battle/types';
import { stateHash } from '../../../../src/sim/hash';
import { createRng } from '../../../../src/sim/rng';
import { NAMED } from './named';

export const GOLDEN_SEEDS: readonly number[] = [1, 2, 3, 4, 5];

export interface GoldenEntry {
  fixture: string;
  seed: number;
  /** Hash of { winner, rounds, replay (A1 to A5 stripped), rngAfter }. */
  log: string;
  /** Hash of { casualties, squads, commanders, roster }. */
  outcome: string;
}

/** An event read field by field, so this file compiles with or without A1 to A5. */
type Loose = { kind: string } & Record<string, unknown>;

/**
 * The stored log without the replay additions A1 to A5: no phase markers, the attack tallies
 * back to hits and kills, no killer on damage, no fatigue on casts. Objects are rebuilt with
 * their keys in the order they had before, so the JSON (and the hash) is the same.
 */
export function stripAdditions(replay: readonly BattleEvent[]): unknown[] {
  const out: unknown[] = [];
  for (const e of replay as unknown as readonly Loose[]) {
    switch (e.kind) {
      case 'phase':
        break;
      case 'cast':
        out.push({ kind: e.kind, caster: e.caster, spellId: e.spellId, targets: e.targets });
        break;
      case 'volley':
      case 'melee':
        out.push({ kind: e.kind, squad: e.squad, target: e.target, hits: e.hits, kills: e.kills });
        break;
      case 'damage':
        out.push({
          kind: e.kind,
          target: e.target,
          amount: e.amount,
          element: e.element,
          kills: e.kills,
        });
        break;
      default:
        out.push(e);
    }
  }
  return out;
}

export function goldenEntry(fixture: string, build: () => BattleSetup, seed: number): GoldenEntry {
  const rng = createRng(seed);
  const r = resolveBattle(build(), rng);
  return {
    fixture,
    seed,
    log: stateHash({
      winner: r.winner,
      rounds: r.rounds,
      replay: stripAdditions(r.replay),
      rngAfter: rng,
    }),
    outcome: stateHash({
      casualties: r.casualties,
      squads: [...r.squads],
      commanders: [...r.commanders],
      roster: r.roster,
    }),
  };
}

/** Every named fixture on every golden seed, in fixture order. */
export function goldenEntries(): GoldenEntry[] {
  return NAMED.flatMap((f) => GOLDEN_SEEDS.map((seed) => goldenEntry(f.name, f.build, seed)));
}
