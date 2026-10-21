// Shared setups for the army pass's tests (defense*.test.ts, war*.test.ts), all on seed 1, where
// Red's capital is p48 with the neighbors p17, p50, and p57.
import { expect } from 'vitest';
import { adjacencyRoute } from '../../src/ai/army';
import { createCommander } from '../../src/sim/commanders';
import { applyCommand, type Command } from '../../src/sim/commands';
import type { NationId, ProvinceId } from '../../src/sim/ids';
import type { CommanderState, GameState } from '../../src/sim/types';
import { addArmy, annex, commandersIn, redField } from '../sim/fixtures';

export const P = (id: string) => id as ProvinceId;

export function moveCmd(
  red: NationId,
  members: readonly CommanderState[],
  path: ProvinceId[],
): Command {
  return { type: 'move', nation: red, commanders: members.map((m) => m.id), path };
}

/** Troops of Cinder Warriors (8.5 each) that bring an Ash Chieftain (9.5) to at least `power`. */
export function warriorsFor(power: number): number {
  return Math.max(0, Math.ceil((power - 9.5) / 8.5));
}

/** Sets a commander's first squad to this many troops at full HP (11 each for Cinder Warriors). */
export function setTroops(commander: CommanderState, count: number, hp = 11): void {
  const squad = commander.squads[0]!;
  squad.count = count;
  squad.hp = count * hp;
}

/** Red's capital p48 with its neighbors p17, p50, and p57 annexed; p50 and p57 are apart. */
export function home() {
  const f = redField();
  for (const p of ['p17', 'p50', 'p57']) annex(f.state, f.red, P(p));
  expect(f.capital).toBe('p48');
  return f;
}

/** Green lays siege to Red's capital with these besiegers (a lone captain with no troops). */
export function besiegeCapital(
  state: GameState,
  green: NationId,
  capital: ProvinceId,
  troops: number,
): CommanderState {
  const besieger =
    troops > 0
      ? addArmy(state, green, capital, 'cinderWarrior', troops, 'wardenCaptain')
      : createCommander(state, 'wardenCaptain', green, capital);
  state.provinces[capital]!.siege = { attacker: green, wallHp: 300, storm: false };
  return besieger;
}

/**
 * Red owns the Wellspring p51, its neighbor p42, and the land between p42 and the capital; Red's
 * priest walks from p42 to claim p51, and Red's army stands at home.
 */
export function springField() {
  const f = redField();
  const spring = annex(f.state, f.red, P('p51')).id;
  const next = annex(f.state, f.red, P('p42')).id;
  for (const p of adjacencyRoute(f.state, [f.capital], next)) annex(f.state, f.red, p);
  const priest = commandersIn(f.state, f.capital).find((c) => c.unit === 'pyrePriest')!;
  priest.location = next;
  expect(applyCommand(f.state, moveCmd(f.red, [priest], [spring]))).toEqual({ ok: true });
  return { ...f, spring, next, priest };
}

/**
 * Red owns p45 next to Green's p3, where a Green army of 40 Cinder Warriors stands, and p50 and
 * p17 next to p45; p3 touches no other Red province, so only p45 is threatened. Red has no gold.
 */
export function frontier() {
  const f = redField();
  for (const p of ['p17', 'p50', 'p45']) annex(f.state, f.red, P(p));
  annex(f.state, f.green, P('p3'));
  const enemy = addArmy(f.state, f.green, P('p3'), 'cinderWarrior', 40, 'wardenCaptain');
  f.state.nations[f.red]!.gold = 0;
  return { ...f, enemy, front: P('p45') };
}
