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
import { triggerDef, type UnitAbility } from '../../../src/content/abilities';
import type { BattleEffect, BattleSpellDef } from '../../../src/content/spells/types';
import type { Element } from '../../../src/content/types';
import type { Formation, Pips, ScriptSlot } from '../../../src/sim/types';

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
    lifeDrain: 0,
    shields: d.fireShield === undefined ? [] : [{ element: 'fire', amount: d.fireShield }],
    size: d.size,
    spellPower: d.spellPower ?? 0,
    ...overrides,
  };
}

/** Fire, nature or any element's retaliation shield, as a stats override (N4). */
export function shield(amount: number, element: Element = 'fire'): Partial<CombatStats> {
  return { shields: [{ element, amount }] };
}

export function squad(
  ref: string,
  unit: UnitTypeId,
  count: number,
  opts: {
    row?: Formation;
    leader?: string | null;
    stats?: Partial<CombatStats>;
    hp?: number;
    /** N5: it never drags its leader into a rout. */
    bound?: true;
  } = {},
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
    ...(opts.bound ? { bound: true as const } : {}),
  };
}

export function commander(
  ref: string,
  unit: UnitTypeId,
  opts: {
    script?: ScriptSlot[];
    stats?: Partial<CombatStats>;
    hp?: number;
    row?: Formation;
    /** Spells it knows; its pips default to the unit's. */
    spells?: readonly BattleSpellDef[];
    /** Battle-start abilities (N1); its unit's by default. */
    abilities?: readonly UnitAbility[];
    pips?: Pips;
    holy?: number;
    carriedMana?: Pips;
  } = {},
): BattleCommanderSetup {
  const stats = statsOf(unit, opts.stats);
  const traits = unitDef(unit).commander;
  return {
    ref,
    unit,
    name: unitDef(unit).name,
    hp: opts.hp ?? stats.hp,
    row: opts.row ?? 'rear',
    stats,
    script: opts.script ?? Array.from({ length: 5 }, () => ({ kind: 'hold' as const })),
    pips: opts.pips ?? { ...(traits?.pips ?? {}) },
    holy: opts.holy ?? traits?.holy ?? 0,
    carriedMana: opts.carriedMana ?? {},
    spells: opts.spells ?? [],
    abilities: opts.abilities ?? (unitDef(unit).abilities ?? []).map(triggerDef),
  };
}

/** A side; units its spells and abilities summon get their plain unit stats. */
export function side(
  squads: BattleSquadSetup[],
  commanders: BattleCommanderSetup[] = [],
): BattleSideSetup {
  const summons: BattleSideSetup['summons'] = {};
  for (const c of commanders) {
    for (const source of [...c.spells, ...c.abilities]) {
      for (const e of source.effects) if (e.kind === 'summon') summons[e.unit] = statsOf(e.unit);
    }
  }
  return { nation: null, commanders, squads, summons };
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

/** The round each event happened in; phase markers are left out. */
export function byRound(result: BattleResult) {
  let round = 0;
  return result.replay.flatMap((e) => {
    if (e.kind === 'roundStart') round = e.round;
    return e.kind === 'phase' ? [] : [{ round, event: e }];
  });
}

/**
 * A test-only battle-start ability (N1). Its id starts with `test:`, so no record of a battle
 * with it re-runs (the registry does not know it).
 */
export function testAbility(
  id: string,
  effects: BattleEffect[],
  extra: Partial<UnitAbility> = {},
): UnitAbility {
  return {
    kind: 'trigger',
    id: `test:${id}`,
    name: id,
    glyph: 'test',
    oneLine: `${id}: a test ability.`,
    trigger: 'battleStart',
    color: null,
    effects,
    ...extra,
  };
}

/** Stats that keep a squad or commander standing and steady through a whole battle. */
export const IMMORTAL = { mor: 50, prot: 99, hp: 50 } satisfies Partial<CombatStats>;
