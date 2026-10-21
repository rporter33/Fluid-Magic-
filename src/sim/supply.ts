// Starvation and healing (docs/01-core-rules.md section 4, Supply). Where commanders and troops
// eat more than a province supplies, every unit that eats loses part of its max HP each day
// and its starvation counter rises; where they are fed they heal at the same rate and the
// counter falls. A starving squad loses troops in proportion to the HP it loses.
// Independents never eat and are always fed.
import { unitDef } from '../content';
import { SUPPLY } from '../content/rules';
import { commanderMaxHp, troopSupply } from './commanders';
import type { NationId, ProvinceId } from './ids';
import { postMessage } from './messages';
import { getMapProvince } from './state';
import { commandersByProvince, type ProvinceEconomy } from './selectors';
import type { CommanderState, GameState, Squad } from './types';

/** Highest starvedDays: one below the next penalty point, so recovery runs at the loss rate. */
export const STARVED_DAYS_CAP =
  (SUPPLY.starvationMoraleCap + 1) * SUPPLY.starvationDaysPerMorale - 1;

/** Rounds a troop count up, ignoring floating-point noise. */
function wholeCount(x: number): number {
  return Math.max(0, Math.ceil(x - 1e-9));
}

/** Starves or feeds one squad; returns true if it began starving today. */
function feedSquad(squad: Squad, starving: boolean): boolean {
  const def = unitDef(squad.unit);
  if (troopSupply(def) === 0) return false;
  const max = squad.count * def.hp;
  if (starving) {
    const before = squad.hp;
    squad.hp = Math.max(0, squad.hp - max * SUPPLY.starvationHpPerDay);
    // Troops die in proportion to the pool lost, wounds spread evenly as in battle; for a
    // healthy squad this is the pool rounded up to whole troops.
    squad.count = before > 0 ? wholeCount((squad.count * squad.hp) / before) : 0;
    squad.starvedDays = Math.min(STARVED_DAYS_CAP, squad.starvedDays + 1);
    return squad.starvedDays === 1;
  }
  squad.hp = Math.min(max, squad.hp + max * SUPPLY.healHpPerDay);
  squad.starvedDays = Math.max(0, squad.starvedDays - 1);
  return false;
}

/** Starves or feeds a commander (never below 1 HP from hunger); true if it began starving. */
function feedCommander(commander: CommanderState, starving: boolean): boolean {
  const def = unitDef(commander.unit);
  if (def.commander?.garrison) return false;
  const max = commanderMaxHp(commander);
  if (starving) {
    commander.hp = Math.max(1, commander.hp - max * SUPPLY.starvationHpPerDay);
    commander.starvedDays = Math.min(STARVED_DAYS_CAP, commander.starvedDays + 1);
    return commander.starvedDays === 1;
  }
  commander.hp = Math.min(max, commander.hp + max * SUPPLY.healHpPerDay);
  commander.starvedDays = Math.max(0, commander.starvedDays - 1);
  return false;
}

export function applySupply(
  state: GameState,
  economies: ReadonlyMap<ProvinceId, ProvinceEconomy>,
): void {
  for (const [provinceId, present] of commandersByProvince(state)) {
    const e = economies.get(provinceId);
    if (!e) continue;
    const starving = e.supplyUsed > e.supply;
    const newlyStarving = new Set<NationId>();
    for (const commander of present) {
      const hungry = starving && commander.owner !== null;
      let began = feedCommander(commander, hungry);
      for (const squad of commander.squads) began = feedSquad(squad, hungry) || began;
      commander.squads = commander.squads.filter((s) => s.count > 0);
      if (began && commander.owner !== null) newlyStarving.add(commander.owner);
    }
    const where = getMapProvince(state, provinceId).name;
    for (const nation of newlyStarving) {
      postMessage(state, nation, 'starvation', `Troops are starving in ${where}.`, provinceId);
    }
  }
}
