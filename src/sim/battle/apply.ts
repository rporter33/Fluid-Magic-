// Writes a battle's result back into the game (docs/04-battle.md; docs/01-core-rules.md
// sections 3 and 5): survivors and wounds, deaths, PD losses, the province's population and
// unrest, the battle record, messages, and nation stats.
import { COLORS } from '../../content/colors';
import { BATTLE, PD, UNREST } from '../../content/rules';
import { addSquad, commanderDies } from '../commanders';
import { newId, type BattleId, type ProvinceId } from '../ids';
import { postMessage } from '../messages';
import { getMapProvince, getProvince } from '../state';
import type { CommanderState, GameState } from '../types';
import type { BattleSide } from './events';
import { PD_MILITIA_REF, type SideForces } from './setup';
import type { BattleResult } from './types';

function writeSquads(commander: CommanderState, result: BattleResult): void {
  for (const s of commander.squads) {
    const o = result.squads.get(s.id);
    if (!o) continue;
    s.count = o.count;
    s.hp = o.hp;
  }
  commander.squads = commander.squads.filter((s) => s.count > 0);
}

/**
 * Writes one side back. Survivors keep their wounds; a battle ends any march through the
 * province, move order included. A dead commander's surviving squads join the first living
 * commander of the side (leadership notwithstanding), else the fort's garrison, else are lost.
 */
function writeSide(state: GameState, forces: SideForces, result: BattleResult): void {
  for (const c of forces.commanders) writeSquads(c, result);
  if (forces.garrison) writeSquads(forces.garrison, result);
  const dead = forces.commanders.filter((c) => result.commanders.get(c.id)?.dead === true);
  const living = forces.commanders.filter((c) => !dead.includes(c));
  const heir = living[0] ?? forces.garrison;
  for (const c of dead) {
    if (heir) for (const s of c.squads) addSquad(heir, s);
    commanderDies(state, c.id);
  }
  for (const c of living) {
    const o = result.commanders.get(c.id);
    // Fighting ends a march through the province; the player orders it again.
    c.transit = null;
    if (c.order.kind === 'move') c.order = { kind: 'idle' };
    if (!o) continue;
    c.hp = o.hp;
    // Mana the battle's spells used up counts as spent.
    const spent = forces.nation === null ? null : state.nations[forces.nation]?.stats.manaSpent;
    for (const color of COLORS) {
      const used = (c.carriedMana[color] ?? 0) - (o.carriedMana[color] ?? 0);
      if (spent && used > 0) spent[color] += used;
    }
    c.carriedMana = { ...o.carriedMana };
  }
}

/**
 * Applies a battle's consequences and records it (a record is kept only when a player's nation
 * fought, the last BATTLE.keep of them); returns the battle's id.
 */
export function applyBattle(
  state: GameState,
  provinceId: ProvinceId,
  attacker: SideForces,
  defender: SideForces,
  result: BattleResult,
): BattleId {
  writeSide(state, attacker, result);
  writeSide(state, defender, result);
  const p = getProvince(state, provinceId);
  if (defender.pd) {
    const militia = result.squads.get(PD_MILITIA_REF);
    if (militia) p.pd = Math.min(p.pd, Math.ceil(militia.count / PD.militiaPerLevel));
  }
  p.pop = Math.max(0, p.pop * (1 - (BATTLE.popLossPer100 * result.casualties) / 100));
  // The owner lost a battle in its own province, whichever side it fought on.
  const loser = result.winner === 'attacker' ? defender : attacker;
  if (loser.nation !== null && loser.nation === p.owner) {
    p.unrest = Math.min(UNREST.max, p.unrest + BATTLE.lostBattleUnrest);
  }

  // Replays are kept for battles a player fought in; the AI never reads them.
  const human = [attacker.nation, defender.nation].some(
    (n) => n !== null && state.nations[n]?.ai === null,
  );
  const id = newId(state, 'battle');
  if (human)
    state.battles.push({
      id,
      day: state.day,
      province: provinceId,
      attacker: attacker.nation,
      defender: defender.nation,
      winner: result.winner,
      rounds: result.rounds,
      roster: result.roster,
      replay: result.replay,
    });
  if (state.battles.length > BATTLE.keep)
    state.battles.splice(0, state.battles.length - BATTLE.keep);

  const where = getMapProvince(state, provinceId).name;
  const sides: [BattleSide, SideForces][] = [
    ['attacker', attacker],
    ['defender', defender],
  ];
  for (const [side, forces] of sides) {
    if (forces.nation === null) continue;
    const nation = state.nations[forces.nation];
    if (!nation) continue;
    const won = result.winner === side;
    if (won) nation.stats.battlesWon += 1;
    else nation.stats.battlesLost += 1;
    const text = `Battle ${won ? 'won' : 'lost'} at ${where}.`;
    postMessage(state, forces.nation, 'battle', text, provinceId, human ? id : null);
  }
  return id;
}
