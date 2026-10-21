// Battles staged straight from unit stats, for testing the pure resolver.
import { unitDef, type UnitTypeId } from '../../../src/content';
import { resolveBattle } from '../../../src/sim/battle/resolve';
import type {
  BattleCommanderSetup,
  BattleResult,
  BattleSetup,
  BattleSideSetup,
  BattleSquadSetup,
  CombatStats,
} from '../../../src/sim/battle/types';
import { defaultFormation } from '../../../src/sim/commanders';
import type { ProvinceId } from '../../../src/sim/ids';
import { createRng } from '../../../src/sim/rng';
import type { Formation, ScriptSlot } from '../../../src/sim/types';

export function statsOf(unit: UnitTypeId, overrides: Partial<CombatStats> = {}): CombatStats {
  const d = unitDef(unit);
  return {
    hp: d.hp,
    str: d.str,
    att: d.att,
    def: d.def,
    prot: d.prot,
    mor: d.mor,
    prec: d.prec,
    mapSpeed: d.mapSpeed,
    weapons: d.weapons,
    tags: d.tags,
    regeneration: d.regeneration ?? 0,
    ...overrides,
  };
}

export function squad(
  ref: string,
  unit: UnitTypeId,
  count: number,
  opts: { row?: Formation; leader?: string | null; stats?: Partial<CombatStats>; hp?: number } = {},
): BattleSquadSetup {
  const stats = statsOf(unit, opts.stats);
  return {
    ref,
    commander: opts.leader ?? null,
    unit,
    count,
    hp: opts.hp ?? count * stats.hp,
    row: opts.row ?? defaultFormation(unitDef(unit)),
    stats,
  };
}

export function commander(
  ref: string,
  unit: UnitTypeId,
  opts: { script?: ScriptSlot[]; stats?: Partial<CombatStats>; hp?: number; row?: Formation } = {},
): BattleCommanderSetup {
  const stats = statsOf(unit, opts.stats);
  return {
    ref,
    unit,
    name: unitDef(unit).name,
    hp: opts.hp ?? stats.hp,
    row: opts.row ?? 'rear',
    stats,
    script: opts.script ?? Array.from({ length: 5 }, () => ({ kind: 'hold' as const })),
    pips: {},
    holy: 0,
    carriedMana: {},
  };
}

export function side(
  squads: BattleSquadSetup[],
  commanders: BattleCommanderSetup[] = [],
): BattleSideSetup {
  return { nation: null, research: {}, commanders, squads };
}

export function setup(attacker: BattleSideSetup, defender: BattleSideSetup): BattleSetup {
  return { province: 'p0' as ProvinceId, attacker, defender };
}

export function fightOnce(
  attacker: BattleSideSetup,
  defender: BattleSideSetup,
  seed = 1,
): BattleResult {
  return resolveBattle(setup(attacker, defender), createRng(seed));
}

/** Share of seeds 0..n-1 the attacker wins. */
export function attackerWinRate(
  make: () => [BattleSideSetup, BattleSideSetup],
  seeds: number,
): number {
  let wins = 0;
  for (let s = 0; s < seeds; s++) {
    const [a, d] = make();
    if (fightOnce(a, d, s).winner === 'attacker') wins++;
  }
  return wins / seeds;
}

/** The round each event happened in. */
export function byRound(result: BattleResult) {
  let round = 0;
  return result.replay.map((e) => {
    if (e.kind === 'roundStart') round = e.round;
    return { round, event: e };
  });
}
