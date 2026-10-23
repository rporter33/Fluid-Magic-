// The end of a nation and of the game (docs/01-core-rules.md section 13), tick step 7: capitals
// move to another fort, nations without a fort or a province are eliminated, and the game is
// won by Wellsprings, by being the last nation standing, or lost by the player.
import { wellspringsToWin } from '../mapgen/placement';
import { captureProvince } from './capture';
import { commanderDies } from './commanders';
import type { NationId, ProvinceId } from './ids';
import { postMessage } from './messages';
import { godName } from './pretender';
import { getNation, getProvince } from './state';
import type { GameResult, GameState } from './types';
import { claimedBy } from './wellsprings';

/** A nation that lost its capital but holds another fort rules from the first such fort. */
function relocateCapitals(state: GameState): void {
  const provinces = Object.keys(state.map.provinces) as ProvinceId[];
  for (const nation of Object.values(state.nations)) {
    if (nation.eliminated || getProvince(state, nation.capital).owner === nation.id) continue;
    const fort = provinces.find((id) => {
      const p = getProvince(state, id);
      return p.owner === nation.id && p.buildings.includes('fort');
    });
    if (fort !== undefined) nation.capital = fort;
  }
}

/**
 * Eliminates a nation: every commander of it dies, the sieges it lays end, every province it
 * owns passes to no one, and every nation still playing hears of it.
 */
function eliminate(state: GameState, nationId: NationId): void {
  const nation = getNation(state, nationId);
  // The god dies with its nation, for good: a reform (N8) promised earlier, in this same tick
  // included (a Phoenix falling in the storm of its last fort), is cancelled with a message,
  // and a god still standing dies here without any promise.
  const promised = nation.pretenderReturnDay !== null;
  nation.pretenderId = null;
  nation.pretenderDead = true;
  nation.pretenderReturnDay = null;
  for (const c of Object.values(state.commanders)) {
    if (c.owner === nationId) commanderDies(state, c.id);
  }
  for (const p of Object.values(state.provinces)) {
    if (p.owner === nationId) captureProvince(state, p.id, null);
    // Its sieges elsewhere end with its besiegers.
    else if (p.siege?.attacker === nationId) p.siege = null;
  }
  nation.eliminated = true;
  if (promised) {
    postMessage(state, nationId, 'info', `${godName(state, nationId)} will not rise again.`);
  }
  for (const n of Object.values(state.nations)) {
    if (!n.eliminated || n.id === nationId) {
      postMessage(state, n.id, 'info', `${nation.name} has fallen.`);
    }
  }
}

/** Nations with no province, or no fort (M1 forts are capitals), are out of the game. */
function eliminations(state: GameState): void {
  for (const nation of Object.values(state.nations)) {
    if (nation.eliminated) continue;
    const owned = Object.values(state.provinces).filter((p) => p.owner === nation.id);
    if (owned.length === 0 || !owned.some((p) => p.buildings.includes('fort'))) {
      eliminate(state, nation.id);
    }
  }
}

/** The game's result if it ended today, else null. */
function victory(state: GameState): GameResult | null {
  const alive = Object.values(state.nations).filter((n) => !n.eliminated);
  const need = wellspringsToWin(state.map.wellsprings.length);
  const claimer = alive.find((n) => claimedBy(state, n.id) >= need);
  if (claimer) return { day: state.day, winner: claimer.id, reason: 'wellsprings' };
  if (alive.length <= 1) {
    return { day: state.day, winner: alive[0]?.id ?? null, reason: 'lastCapital' };
  }
  const humans = Object.values(state.nations).filter((n) => n.ai === null);
  if (humans.length > 0 && humans.every((n) => n.eliminated)) {
    return { day: state.day, winner: null, reason: 'playerDefeated' };
  }
  return null;
}

/** Tick step 7: capitals move, nations fall, and the game may end. */
export function settleVictory(state: GameState): void {
  relocateCapitals(state);
  eliminations(state);
  const result = victory(state);
  if (!result) return;
  state.result = result;
  const winner = result.winner === null ? null : getNation(state, result.winner).name;
  for (const n of Object.values(state.nations)) {
    postMessage(
      state,
      n.id,
      'info',
      winner === null ? 'The game is over.' : `${winner} has won the game.`,
    );
  }
}
