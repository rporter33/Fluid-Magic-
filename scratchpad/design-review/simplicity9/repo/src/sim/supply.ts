// Starvation and healing (docs/01-core-rules.md section 4, Supply). Where commanders and troops
// eat more than a province supplies, every unit that eats loses part of its max HP each day
// and its starvation counter rises; where they are fed they heal at the same rate and the
// counter falls. Troops die as their squad's HP pool stops covering them.
import { unitDef } from '../content';
import { SUPPLY } from '../content/rules';
import { commanderMaxHp, troopSupply } from './commanders';
import type { NationId, ProvinceId } from './ids';
import { postMessage } from './messages';
import { getMapProvince } from './state';
import { commandersByProvince, type ProvinceEconomy } from './selectors';
import type { CommanderState, GameState, Squad } from './types';

/** Starves or feeds one squad; returns true if it began starving today. */
function feedSquad(squad: Squad, starving: boolean): boolean {
  const def = unitDef(squad.unit);
  if (troopSupply(def) === 0) return false;
  const max = squad.count * def.hp;
  if (starving) {
    squad.hp = Math.max(0, squad.hp - max * SUPPLY.starvationHpPerDay);
    squad.count = Math.ceil(squad.hp / def.hp);
    squad.starvedDays += 1;
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
    commander.starvedDays += 1;
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
      let began = feedCommander(commander, starving);
      for (const squad of commander.squads) began = feedSquad(squad, starving) || began;
      commander.squads = commander.squads.filter((s) => s.count > 0);
      if (began && commander.owner !== null) newlyStarving.add(commander.owner);
    }
    const where = getMapProvince(state, provinceId).name;
    for (const nation of newlyStarving) {
      postMessage(state, nation, 'starvation', `Troops are starving in ${where}.`, provinceId);
    }
  }
}
