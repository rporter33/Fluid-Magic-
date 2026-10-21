// Morale (docs/04-battle.md, round step 4, and "Commanders in battle"). Both loss shares are
// measured against the squad's starting count; a squad rolls at most once a round.
import { BATTLE } from '../../content/rules';
import { drn } from '../drn';
import type { RngState } from '../rng';
import type { BattleEvent } from './events';
import { groupStat, living, present, SIDES, troopsLost, type Field, type Group } from './field';

function neverChecks(g: Group): boolean {
  return groupStat(g, 'mor') >= BATTLE.morale.fearless || g.base.tags.includes('berserk');
}

/** Rolls a morale check: true if the group breaks. */
function breaks(rng: RngState, g: Group, pressure: number): boolean {
  return groupStat(g, 'mor') + drn(rng) < BATTLE.morale.base + drn(rng) + pressure;
}

/** Starts a rout; it leaves the field at the end of the following round. */
export function rout(g: Group, since: number, log: BattleEvent[]): void {
  if (g.routingSince !== null || g.gone) return;
  g.routingSince = since;
  log.push({ kind: 'rout', squad: g.ref });
}

/** Pressure on a side: more when it has lost over half its starting troops. */
function sidePressure(field: Field, side: Group['side']): number {
  const start = field.startTroops[side];
  return start > 0 && troopsLost(field, side) > start * BATTLE.morale.halfLostShare
    ? BATTLE.morale.halfLostPressure
    : 0;
}

/**
 * Right after the damage that kills a commander: its squads roll at once, with extra
 * pressure, and the death is logged.
 */
export function commanderDeaths(
  field: Field,
  round: number,
  rng: RngState,
  log: BattleEvent[],
): void {
  for (const side of SIDES) {
    for (const c of field.sides[side]) {
      if (!c.isCommander || c.deathsThisRound === 0 || c.checked) continue;
      c.checked = true;
      log.push({ kind: 'death', commander: c.ref });
      const pressure = sidePressure(field, side) + BATTLE.morale.commanderDeathPressure;
      for (const g of field.sides[side]) {
        if (g.leader !== c.ref || !present(g) || g.routingSince !== null || g.checked) continue;
        if (neverChecks(g)) continue;
        g.checked = true;
        if (breaks(rng, g, pressure)) rout(g, round, log);
      }
    }
  }
}

/** Round step 4: squads shaken by this round's losses, then commanders left without a line. */
export function moralePhase(field: Field, round: number, rng: RngState, log: BattleEvent[]): void {
  for (const side of SIDES) {
    const groups = field.sides[side];
    const pressure = sidePressure(field, side);
    const brokeNow = new Set<string>();
    for (const g of groups) {
      if (g.isCommander || !present(g) || g.routingSince !== null || g.checked) continue;
      if (neverChecks(g) || g.deathsThisRound === 0) continue;
      const total = g.startCount - living(g);
      if (
        total <= g.startCount * BATTLE.morale.totalLossShare &&
        g.deathsThisRound <= g.startCount * BATTLE.morale.roundLossShare
      ) {
        continue;
      }
      g.checked = true;
      if (breaks(rng, g, pressure)) {
        rout(g, round, log);
        if (g.leader !== null) brokeNow.add(g.leader);
      }
    }
    // A commander checks once: in the round its last standing squad breaks.
    for (const c of groups) {
      if (!c.isCommander || !brokeNow.has(c.ref) || !present(c) || c.routingSince !== null)
        continue;
      const squads = groups.filter((g) => g.leader === c.ref && present(g));
      if (squads.some((g) => g.routingSince === null) || neverChecks(c)) continue;
      if (breaks(rng, c, pressure)) rout(c, round, log);
    }
  }
}
