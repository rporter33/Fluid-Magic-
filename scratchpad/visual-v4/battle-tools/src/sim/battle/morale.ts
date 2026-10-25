// Morale (docs/04-battle.md, round step 4, and "Commanders in battle"). Both loss shares are
// measured against the squad's starting count; a squad rolls at most once a round. The rules
// are exported as pure helpers (mustCheck, breakThreshold, fearless) that the resolver uses
// and the replay viewer shares, so they live in one place.
import { BATTLE } from '../../content/rules';
import type { UnitTag } from '../../content/types';
import { drn } from '../drn';
import type { RngState } from '../rng';
import type { MoraleRoll } from './detail';
import type { BattleEvent } from './events';
import {
  detailAt,
  groupStat,
  living,
  present,
  SIDES,
  troopsLost,
  type Field,
  type Group,
} from './field';

/** Never rolls morale: mor at BATTLE.morale.fearless or more, or berserk; neverChecks() uses it. */
export function fearless(mor: number, tags: readonly UnitTag[]): boolean {
  return mor >= BATTLE.morale.fearless || tags.includes('berserk');
}

export function neverChecks(g: Group): boolean {
  return fearless(groupStat(g, 'mor'), g.base.tags);
}

/** It breaks when moraleDrn - targetDrn < breakThreshold(mor, pressure); breaks() uses it. */
export function breakThreshold(mor: number, pressure: number): number {
  return BATTLE.morale.base + pressure - mor;
}

/**
 * A squad must roll this round (docs/04, round step 4): a shock spell is on it, or it lost
 * troops this round and its losses since the start, or this round's, pass their shares of its
 * starting count. shaken() calls it.
 */
export function mustCheck(
  startCount: number,
  lostTotal: number,
  lostThisRound: number,
  shock: number,
): boolean {
  if (shock > 0) return true;
  if (lostThisRound <= 0) return false;
  return (
    lostTotal > startCount * BATTLE.morale.totalLossShare ||
    lostThisRound > startCount * BATTLE.morale.roundLossShare
  );
}

/** Rolls a morale check, the morale DRN first; reports the roll to the detail sink. */
function breaks(
  field: Field,
  rng: RngState,
  g: Group,
  pressure: number,
  cause: 'losses' | 'shock' | 'commanderDeath',
  log: BattleEvent[],
): MoraleRoll {
  const morale = groupStat(g, 'mor');
  const moraleDrn = drn(rng);
  const targetDrn = drn(rng);
  const roll: MoraleRoll = {
    morale,
    moraleDrn,
    target: BATTLE.morale.base,
    targetDrn,
    pressure,
    broke: moraleDrn - targetDrn < breakThreshold(morale, pressure),
  };
  field.detail?.push({ kind: 'morale', ...detailAt(field, log), group: g.ref, cause, roll });
  return roll;
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
        if (breaks(field, rng, g, pressure + g.shock, 'commanderDeath', log).broke) {
          rout(g, round, log);
        }
      }
    }
  }
}

/** This round's losses, or a shock of this size, are enough to make a squad check. */
function shaken(g: Group, shock: number): boolean {
  return mustCheck(g.startCount, g.startCount - living(g), g.deathsThisRound, shock);
}

/**
 * Round step 4: squads shaken by this round's losses or by a shock spell (which also makes the
 * roll harder), then commanders left without a line.
 */
export function moralePhase(field: Field, round: number, rng: RngState, log: BattleEvent[]): void {
  for (const side of SIDES) {
    const groups = field.sides[side];
    const pressure = sidePressure(field, side);
    const brokeNow = new Set<string>();
    for (const g of groups) {
      if (g.isCommander || !present(g) || g.routingSince !== null || g.checked) continue;
      if (neverChecks(g) || !shaken(g, g.shock)) continue;
      g.checked = true;
      const cause = shaken(g, 0) ? 'losses' : 'shock';
      if (breaks(field, rng, g, pressure + g.shock, cause, log).broke) {
        rout(g, round, log);
        // N5: a bound squad (a battle summon, a pretender's monthly kin) never drags its leader.
        if (g.leader !== null && !g.bound) brokeNow.add(g.leader);
      }
    }
    // A commander whose last standing squad broke this round goes with its troops. One that
    // led no squads, or whose squads all died, fights on. Its bound squads keep it there too
    // while they stand.
    for (const c of groups) {
      if (!c.isCommander || !brokeNow.has(c.ref) || !present(c) || c.routingSince !== null)
        continue;
      const squads = groups.filter((g) => g.leader === c.ref && present(g));
      if (squads.some((g) => g.routingSince === null) || neverChecks(c)) continue;
      rout(c, round, log);
    }
  }
}
