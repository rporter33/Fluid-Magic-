// resolveBattle(setup, rng, opts?): BattleResult (docs/04-battle.md). Pure: it reads only the
// setup, never changes it, and draws only from the rng it is given, so the same setup and rng
// state always give the same result and log. An optional detail sink receives every blow and
// roll (detail.ts); it only watches, so the result is the same with or without it.
import { BATTLE, CASTING } from '../../content/rules';
import { abilityPhase } from './abilities';
import { meleePhase, rangedPhase } from './attacks';
import type { DetailEvent } from './detail';
import { dropMods } from './effects';
import type { BattleEvent, BattlePhase, BattleRoster, BattleSide } from './events';
import {
  active,
  anyActive,
  buildField,
  exhausted,
  frontRow,
  interleaved,
  living,
  present,
  SIDES,
  type Field,
  type Group,
} from './field';
import { commanderDeaths, moralePhase, rout } from './morale';
import { cast, chooseSpell } from './spells';
import type {
  BattleResult,
  BattleSetup,
  BattleSideSetup,
  CommanderOutcome,
  SquadOutcome,
} from './types';
import type { RngState } from '../rng';

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

/**
 * Round step 1: each commander follows its script slot for the round (slot 5 repeats, unless it
 * is Retreat: then the commander takes its default action), one after another in caster order. Cast casts the named spell, or the best castable one, and
 * the effects land before the next commander acts. Attack moves the commander into its side's
 * front row. Retreat takes it and its squads off the field this round; berserkers stay. A
 * commander too tired to act does nothing.
 */
function scriptsPhase(field: Field, round: number, rng: RngState, log: BattleEvent[]): void {
  for (const c of interleaved(field)) {
    if (!active(c) || exhausted(c)) continue;
    const slot =
      round > c.script.length && c.script.at(-1)?.kind === 'retreat'
        ? c.fallback
        : c.script[Math.min(round, c.script.length) - 1];
    if (slot?.kind === 'cast') {
      const spell = chooseSpell(field, c, slot.spellId);
      if (spell) cast(field, c, spell, round, rng, log);
    }
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

/**
 * Round step 5: routing groups leave after their exit round; timed effects end; casters
 * recover; regeneration.
 */
function endOfRound(field: Field, round: number, log: BattleEvent[]): void {
  for (const e of field.effects.filter((f) => f.untilRound <= round)) {
    log.push({ kind: 'fieldEnd', effect: e.kind });
  }
  field.effects = field.effects.filter((f) => f.untilRound > round);
  for (const side of SIDES) {
    for (const g of field.sides[side]) {
      if (g.routingSince !== null && g.routingSince < round) leave(g, log);
      g.deathsThisRound = 0;
      g.checked = false;
      g.shock = 0;
      g.fatigue = Math.max(0, g.fatigue - CASTING.recoveryPerRound);
      dropMods(g, (m) => m.untilRound !== null && m.untilRound <= round, log);
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

function outcomes(field: Field) {
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
          carriedMana: { ...g.carriedMana },
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

/**
 * Round step 5 and the battle's end: the end of round, then the winner if a side has no active
 * units left. Undecided at round 50, the attacker leaves the field safely and the defender
 * wins. Null while the battle goes on.
 */
function endStep(field: Field, round: number, log: BattleEvent[]): BattleSide | null {
  endOfRound(field, round, log);
  if (!anyActive(field, 'attacker') || !anyActive(field, 'defender')) return decide(field);
  if (round !== BATTLE.attackerRetreatRound) return null;
  for (const g of field.sides.attacker) if (present(g)) leave(g, log);
  return 'defender';
}

/**
 * Runs one round step; inserts its phase marker (A1) before what it logged, if it logged
 * anything. Detail events of the step sit after the marker.
 */
function span<T>(field: Field, phase: BattlePhase, log: BattleEvent[], step: () => T): T {
  const at = log.length;
  const from = field.detail?.length ?? 0;
  field.phase = phase;
  const out = step();
  if (log.length === at) return out;
  log.splice(at, 0, { kind: 'phase', phase });
  // Every detail event of this span sits at or after `at`, so after the marker.
  const d = field.detail;
  if (d) {
    for (let i = from; i < d.length; i++) {
      const e = d[i];
      if (e) e.at += 1;
    }
  }
  return out;
}

export interface ResolveOptions {
  /** Receives every blow, spell hit, burn, drain, and morale roll (never saved). */
  detail?: DetailEvent[];
}

export function resolveBattle(
  setup: BattleSetup,
  rng: RngState,
  opts: ResolveOptions = {},
): BattleResult {
  const field = buildField(setup, opts.detail ?? null);
  const replay: BattleEvent[] = [];
  let rounds = 0;
  let winner: BattleSide = 'defender';
  for (let round = 1; round <= BATTLE.maxRounds; round++) {
    rounds = round;
    field.round = round;
    replay.push({ kind: 'roundStart', round });
    span(field, 'scripts', replay, () => {
      // N1: battle-start abilities fire once, before the first scripts.
      if (round === 1) abilityPhase(field, round, rng, replay);
      scriptsPhase(field, round, rng, replay);
      commanderDeaths(field, round, rng, replay);
    });
    span(field, 'ranged', replay, () => {
      rangedPhase(field, round, rng, replay);
      commanderDeaths(field, round, rng, replay);
    });
    span(field, 'melee', replay, () => {
      meleePhase(field, round, rng, replay);
      commanderDeaths(field, round, rng, replay);
    });
    span(field, 'morale', replay, () => {
      moralePhase(field, round, rng, replay);
    });
    const decided = span(field, 'end', replay, () => endStep(field, round, replay));
    if (decided !== null) {
      winner = decided;
      break;
    }
  }
  replay.push({ kind: 'battleEnd', winner, rounds });
  const { squads, commanders, casualties } = outcomes(field);
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
