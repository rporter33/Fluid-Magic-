// The AI's required behavior (docs/08-ai.md, "Required behavior tests"; Phase 7 design "Tests"):
// one shared run of the headless runner's 20 games (runnerSetup(1, 0..19), Medium, Normal AI on
// both sides) to day 720 or the game's end, recorded day by day. (a) Each nation owns at least 8
// provinces at month 12 in at least 16 of the 20 games; a nation eliminated by then fails that
// game, and a game that ends before day 360 is counted on its last day. (b) The capital's queue is
// never empty for more than 60 days in a row, counting only days with the capital owned, the
// nation in the game, gold above 200 and recruitment not blocked; any other day ends the run.
// (c) The capital's garrison has troops on every day from month 6 while the capital is owned.
// (d) No AI command is ever refused. (e) Review finding cor-3: on a Large map with three nations,
// no field army stands in its capital without a task for more than 120 days while an enemy
// province its paths reach passes the per-target War odds and AI.warRatio times its defenders.
import { beforeAll, describe, expect, it } from 'vitest';
import { AI } from '../../src/content/ai';
import { defaultPreset } from '../../src/content/pretenders/presets';
import { TIME } from '../../src/content/rules';
import { planAi, runAi } from '../../src/ai/ai';
import { fixedDefense, isAssigned } from '../../src/ai/army';
import {
  armyPower,
  commanderPower,
  defenderPower,
  groups,
  isEnemyProvince,
  isMoving,
} from '../../src/ai/assess';
import { playDay, type Player, type Refusal } from '../../src/ai/driver';
import { RUNNER_NATIONS, runnerSetup } from '../../src/ai/match';
import type { Plan } from '../../src/ai/plan';
import type { NationDefId } from '../../src/content';
import { takesPart, troopCount } from '../../src/sim/commanders';
import { createGame } from '../../src/sim/createGame';
import type { CommanderId, NationId, ProvinceId } from '../../src/sim/ids';
import { garrisonOf, recruitBlock } from '../../src/sim/recruitment';
import { withinHops } from '../../src/sim/rituals';
import { nationDefOf } from '../../src/sim/state';
import type { GameSetup, GameState } from '../../src/sim/types';
import { capitalOf, nationIds } from '../sim/fixtures';

const SEED = 1;
const GAMES = 20;
/** The run's horizon (docs/08 decisions): two years, or the game's end if sooner. */
const HORIZON = 24 * TIME.daysPerMonth;
/** (a): provinces are counted on this day, month 12. */
const COUNT_DAY = 12 * TIME.daysPerMonth;
const MIN_PROVINCES = 8;
const MIN_GAMES = 16;
/** (b): the longest allowed run of empty-queue days with gold above QUEUE_GOLD. */
const MAX_EMPTY_RUN = 60;
const QUEUE_GOLD = 200;
/** (c): the garrison is checked from this day, month 6. */
const GARRISON_FROM = 6 * TIME.daysPerMonth;

/** One nation's state at the end of one day, after the AI planned. */
interface DayRecord {
  day: number;
  capitalOwned: boolean;
  eliminated: boolean;
  /** The nation's own items in its capital's queue. */
  queue: number;
  gold: number;
  /** Troops of the capital's garrison holder; 0 while another nation owns the capital. */
  garrison: number;
  block: string | null;
}

interface NationRun {
  id: NationId;
  def: NationDefId;
  days: DayRecord[];
  /** Provinces owned on day min(COUNT_DAY, end). */
  provinces: number;
  /** Eliminated on or before that day. */
  eliminatedByCount: boolean;
}

interface GameRun {
  game: number;
  days: number;
  reason: string;
  nations: NationRun[];
  refused: Refusal[];
}

function record(state: GameState, id: NationId): DayRecord {
  const nation = state.nations[id]!;
  const capital = capitalOf(state, id);
  const capitalOwned = capital.owner === id;
  return {
    day: state.day,
    capitalOwned,
    eliminated: nation.eliminated,
    queue: capital.recruitQueue.filter((item) => item.nation === id).length,
    gold: nation.gold,
    garrison: capitalOwned ? troopCount(garrisonOf(state, capital.id)) : 0,
    block: recruitBlock(capital),
  };
}

function provincesOf(state: GameState, id: NationId): number {
  return Object.values(state.provinces).filter((p) => p.owner === id).length;
}

/** Plays runner game `game` to the horizon or its end, recording every day. */
function playGame(game: number): GameRun {
  const state = createGame(runnerSetup(SEED, game));
  const ids = nationIds(state);
  const nations: NationRun[] = ids.map((id) => ({
    id,
    def: state.nations[id]!.def,
    days: [],
    provinces: 0,
    eliminatedByCount: false,
  }));
  const refused: Refusal[] = [];
  while (!state.result && state.day < HORIZON) {
    refused.push(...playDay(state, runAi).refused);
    for (const run of nations) {
      run.days.push(record(state, run.id));
      if (state.day <= COUNT_DAY) {
        run.provinces = provincesOf(state, run.id);
        run.eliminatedByCount = state.nations[run.id]!.eliminated;
      }
    }
  }
  return { game, days: state.day, reason: state.result?.reason ?? 'timeout', nations, refused };
}

/** The longest run of days counted by (b). */
function longestEmptyQueueRun(days: readonly DayRecord[]): number {
  let run = 0;
  let longest = 0;
  for (const d of days) {
    const counts =
      d.capitalOwned && !d.eliminated && d.queue === 0 && d.gold > QUEUE_GOLD && d.block === null;
    run = counts ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  return longest;
}

let runs: GameRun[] = [];
beforeAll(() => {
  runs = Array.from({ length: GAMES }, (_, game) => playGame(game));
}, 120_000);

describe('the AI over the headless runner games', () => {
  it('plays every game past month 12 or to its end, never past the horizon', () => {
    expect(runs).toHaveLength(GAMES);
    for (const run of runs) {
      expect(run.days).toBeLessThanOrEqual(HORIZON);
      if (run.reason === 'timeout') expect(run.days).toBe(HORIZON);
      for (const nation of run.nations) expect(nation.days).toHaveLength(run.days);
    }
  });

  it.each(RUNNER_NATIONS)(
    `(a) %s owns ${String(MIN_PROVINCES)} provinces at month 12 in ${String(MIN_GAMES)} of 20 games`,
    (def) => {
      const counts = runs.map((run) => {
        const nation = run.nations.find((n) => n.def === def)!;
        return nation.eliminatedByCount ? 0 : nation.provinces;
      });
      const passed = counts.filter((n) => n >= MIN_PROVINCES).length;
      expect(passed, `provinces per game: ${counts.join(', ')}`).toBeGreaterThanOrEqual(MIN_GAMES);
    },
  );

  it(`(b) never leaves the capital's queue empty more than ${String(MAX_EMPTY_RUN)} days with gold`, () => {
    const long = runs.flatMap((run) =>
      run.nations
        .map((n) => ({ game: run.game, nation: n.def, days: longestEmptyQueueRun(n.days) }))
        .filter((r) => r.days > MAX_EMPTY_RUN),
    );
    expect(long).toEqual([]);
  });

  it('(c) keeps troops in the capital garrison from month 6 while it holds the capital', () => {
    const empty = runs.flatMap((run) =>
      run.nations.flatMap((n) =>
        n.days
          .filter((d) => d.day >= GARRISON_FROM && d.capitalOwned && d.garrison === 0)
          .map((d) => ({ game: run.game, nation: n.def, day: d.day })),
      ),
    );
    expect(empty).toEqual([]);
  });

  it('(d) issues no command that is refused', () => {
    expect(runs.flatMap((run) => run.refused)).toEqual([]);
  });
});

/**
 * (e): seed 8, Large, Thornwood, Cinder Horde, and Thornwood with their default presets, all
 * Normal. Under Phase 7's first War gate, one sum over the whole border, a Thornwood army stood
 * idle in its capital from day 835 to the end of the game with takeable enemy provinces in reach.
 */
const LARGE_SETUP: GameSetup = {
  seed: 8,
  mapSize: 'large',
  nations: (['thornwood', 'cinderHorde', 'thornwood'] as const).map((nation) => ({
    nation,
    pretender: defaultPreset(nation).design,
    ai: { difficulty: 'normal' },
  })),
};
/** (e): three years, or the game's end if sooner. */
const LARGE_HORIZON = 36 * TIME.daysPerMonth;
/** (e): the longest a field army may stand idle at home while a War target passes. */
const MAX_IDLE_DAYS = 120;

/**
 * The enemy power a new War target in the province would meet (docs/08 decisions, War), worked
 * out apart from war.ts: its garrison troops and PD, and other nations' non-hidden commanders
 * within AI.warHops of it.
 */
function enemyPowerNear(plan: Plan, province: ProvinceId): number {
  const near = withinHops(plan.copy, province, AI.warHops);
  let power = fixedDefense(plan.copy, province);
  for (const c of Object.values(plan.copy.commanders)) {
    const other = c.owner !== null && c.owner !== plan.nation;
    if (other && takesPart(c) && near.has(c.location)) power += commanderPower(c);
  }
  return power;
}

/**
 * The leaders of field armies standing in the capital with no task after the call while an
 * enemy province their paths reach passes the per-target odds and they could take it.
 */
function idleWithTarget(plan: Plan): CommanderId[] {
  const armies = groups(plan).filter((g) => !g.lone);
  const field = armies.reduce((sum, g) => sum + armyPower(g.members), 0);
  const odds = nationDefOf(plan.copy, plan.nation).ai.aggression * field;
  return armies
    .filter(
      (g) =>
        !isAssigned(plan, g) &&
        !isMoving(g.leader) &&
        g.province === plan.capital.id &&
        troopCount(g.leader) >= AI.fieldArmyTroops,
    )
    .filter((g) => {
      const strength = armyPower(g.members);
      return plan
        .paths(g.members)
        .reached.some(
          (p) =>
            isEnemyProvince(plan.copy, plan.nation, p) &&
            strength >= AI.warRatio * defenderPower(plan.copy, p) &&
            odds > AI.warRatio * enemyPowerNear(plan, p),
        );
    })
    .map((g) => g.leader.id);
}

describe('the AI on a Large map with three nations', () => {
  it(`(e) leaves no field army idle at home over ${String(MAX_IDLE_DAYS)} days with a War target`, () => {
    const state = createGame(LARGE_SETUP);
    /** The first planning day of each leader's current idle run. */
    const since = new Map<CommanderId, number>();
    let longest = { days: 0, at: '' };
    const player: Player = (s, nation) => {
      const plan = planAi(s, nation);
      if (!plan) return [];
      const idle = new Set(idleWithTarget(plan));
      for (const c of plan.own()) {
        if (!idle.has(c.id)) {
          since.delete(c.id);
          continue;
        }
        const start = since.get(c.id) ?? s.day;
        since.set(c.id, start);
        if (s.day - start > longest.days) {
          longest = { days: s.day - start, at: `${nation} ${c.id} from day ${String(start)}` };
        }
      }
      return plan.out;
    };
    const refused: Refusal[] = [];
    while (!state.result && state.day < LARGE_HORIZON) {
      refused.push(...playDay(state, player).refused);
    }
    expect(longest.days, longest.at).toBeLessThanOrEqual(MAX_IDLE_DAYS);
    expect(refused).toEqual([]);
    // One Large game of up to three years: past vitest's 5 s default on a loaded machine.
  }, 60_000);
});
