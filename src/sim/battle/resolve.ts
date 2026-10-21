// resolveBattle(setup, rng): BattleResult (docs/04-battle.md). Pure: it reads only the setup,
// never changes it, and draws only from the rng it is given, so the same setup and rng state
// always give the same result and log.
import { BATTLE } from '../../content/rules';
import type { RngState } from '../rng';
import { meleePhase, rangedPhase } from './attacks';
import type { BattleEvent, BattleRoster, BattleSide } from './events';
import {
  active,
  anyActive,
  buildField,
  frontRow,
  living,
  present,
  SIDES,
  type Field,
  type Group,
} from './field';
import { commanderDeaths, moralePhase, rout } from './morale';
import type {
  BattleCommanderSetup,
  BattleResult,
  BattleSetup,
  BattleSideSetup,
  CommanderOutcome,
  SquadOutcome,
} from './types';

function roster(side: BattleSideSetup): BattleRoster {
  return {
    nation: side.nation,
    commanders: side.commanders.map((c) => ({
      ref: c.ref,
      unit: c.unit,
      name: c.name,
      row: c.row,
      hp: c.hp,
    })),
    squads: side.squads.map((s) => ({
      ref: s.ref,
      commander: s.commander,
      unit: s.unit,
      count: s.count,
      hp: s.hp,
      row: s.row,
    })),
  };
}

/** Commanders in casting order: attacker 0, defender 0, attacker 1, ... */
function interleaved(field: Field): Group[] {
  const a = field.sides.attacker.filter((g) => g.isCommander);
  const d = field.sides.defender.filter((g) => g.isCommander);
  const out: Group[] = [];
  for (let i = 0; i < Math.max(a.length, d.length); i++) {
    const x = a[i];
    const y = d[i];
    if (x) out.push(x);
    if (y) out.push(y);
  }
  return out;
}

/**
 * Round step 1: each commander follows its script slot for the round (slot 5 repeats). Cast
 * slots hold until Phase 5 brings battle spells. Attack moves the commander into its side's
 * front row. Retreat takes it and its squads off the field this round; berserkers stay.
 */
function scriptsPhase(field: Field, round: number, log: BattleEvent[]): void {
  for (const c of interleaved(field)) {
    if (!active(c)) continue;
    const slot = c.script[Math.min(round, c.script.length) - 1];
    if (slot?.kind === 'attack') {
      const row = frontRow(field, c.side) ?? 'front';
      if (c.row !== row) {
        c.row = row;
        log.push({ kind: 'advance', unit: c.ref, row });
      }
    }
    if (slot?.kind === 'retreat') {
      // Begun "last round", so this round is its exit round.
      rout(c, round - 1, log);
      for (const g of field.sides[c.side]) {
        if (g.leader === c.ref && !g.base.tags.includes('berserk')) rout(g, round - 1, log);
      }
    }
  }
}

function leave(g: Group, log: BattleEvent[]): void {
  if (g.gone) return;
  g.gone = true;
  if (living(g) > 0) log.push({ kind: 'leave', unit: g.ref });
}

/** Round step 5: routing groups leave after their exit round; effects end; regeneration. */
function endOfRound(field: Field, round: number, log: BattleEvent[]): void {
  for (const side of SIDES) {
    for (const g of field.sides[side]) {
      if (g.routingSince !== null && g.routingSince < round) leave(g, log);
      g.deathsThisRound = 0;
      g.checked = false;
      const ending = g.mods.filter((m) => m.untilRound !== null && m.untilRound <= round);
      if (ending.length > 0) {
        g.mods = g.mods.filter((m) => !ending.includes(m));
        for (const m of ending) log.push({ kind: 'expire', target: g.ref, source: m.source });
      }
      if (g.gone || g.base.regeneration <= 0) continue;
      let healed = 0;
      for (const m of g.members) {
        if (!m.alive || m.hp >= m.maxHp) continue;
        const amount = Math.min(m.maxHp - m.hp, m.maxHp * g.base.regeneration);
        m.hp += amount;
        healed += amount;
      }
      if (healed > 0) log.push({ kind: 'heal', target: g.ref, amount: healed });
    }
  }
}

function outcomes(field: Field, commanders: readonly BattleCommanderSetup[]) {
  const mana = new Map(commanders.map((c) => [c.ref, c.carriedMana]));
  const squads = new Map<string, SquadOutcome>();
  const leaders = new Map<string, CommanderOutcome>();
  let casualties = 0;
  for (const side of SIDES) {
    for (const g of field.sides[side]) {
      const alive = living(g);
      if (!g.summoned) casualties += g.startCount - alive;
      const routed = g.routingSince !== null || (g.gone && alive > 0);
      if (g.isCommander) {
        leaders.set(g.ref, {
          hp: g.members[0]?.hp ?? 0,
          dead: alive === 0,
          routed,
          carriedMana: { ...(mana.get(g.ref) ?? {}) },
        });
      } else {
        const hp = g.members.reduce((sum, m) => sum + (m.alive ? m.hp : 0), 0);
        squads.set(g.ref, { count: alive, hp, routed });
      }
    }
  }
  return { squads, commanders: leaders, casualties };
}

/** Living units still on the field, routing ones included. */
function onField(field: Field, side: BattleSide): number {
  let n = 0;
  for (const g of field.sides[side]) if (!g.gone) n += living(g);
  return n;
}

/**
 * The side with active units wins. When both broke in the same round, the side with more of
 * its people still on the field holds it; a tie goes to the defender.
 */
function decide(field: Field): BattleSide {
  const attacker = anyActive(field, 'attacker');
  const defender = anyActive(field, 'defender');
  if (attacker !== defender) return attacker ? 'attacker' : 'defender';
  return onField(field, 'attacker') > onField(field, 'defender') ? 'attacker' : 'defender';
}

export function resolveBattle(setup: BattleSetup, rng: RngState): BattleResult {
  const field = buildField(setup);
  const replay: BattleEvent[] = [];
  let rounds = 0;
  let winner: BattleSide = 'defender';
  for (let round = 1; round <= BATTLE.maxRounds; round++) {
    rounds = round;
    replay.push({ kind: 'roundStart', round });
    scriptsPhase(field, round, replay);
    rangedPhase(field, round, rng, replay);
    commanderDeaths(field, round, rng, replay);
    meleePhase(field, round, rng, replay);
    commanderDeaths(field, round, rng, replay);
    moralePhase(field, round, rng, replay);
    endOfRound(field, round, replay);
    if (!anyActive(field, 'attacker') || !anyActive(field, 'defender')) {
      winner = decide(field);
      break;
    }
    if (round === BATTLE.attackerRetreatRound) {
      // Undecided at round 50: the attacker leaves the field safely.
      for (const g of field.sides.attacker) if (present(g)) leave(g, replay);
      winner = 'defender';
      break;
    }
  }
  replay.push({ kind: 'battleEnd', winner, rounds });
  const all = [...setup.attacker.commanders, ...setup.defender.commanders];
  const { squads, commanders, casualties } = outcomes(field, all);
  return {
    winner,
    rounds,
    casualties,
    squads,
    commanders,
    roster: { attacker: roster(setup.attacker), defender: roster(setup.defender) },
    replay,
  };
}
