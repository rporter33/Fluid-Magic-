// Builds a BattleSetup from the game (docs/04-battle.md, "Province modifiers"). Every modifier
// is folded into each unit's stats here, so the resolver stays a pure function of its input.
import { nationDef, unitDef, type UnitTypeId } from '../../content';
import { COLORS, type Color } from '../../content/colors';
import { RESEARCH_LEVEL_POINTS, STORM } from '../../content/rules';
import { TERRAIN } from '../../content/terrain';
import { defaultFormation } from '../commanders';
import type { NationId, ProvinceId } from '../ids';
import { pdForce } from '../pd';
import { provinceScales, scaleEffect } from '../scales';
import { starvationMoralePenalty, unpaidMoralePenalty } from '../selectors';
import { activeEffects, getMapProvince, getNation, getProvince } from '../state';
import type { CommanderState, GameState } from '../types';
import type { BattleSide } from './events';
import type { BattleCommanderSetup, BattleSetup, BattleSideSetup, CombatStats } from './types';

/** Who fights on one side. */
export interface SideForces {
  nation: NationId | null;
  commanders: CommanderState[];
  /** The fort's garrison holder, whose squads fight without it. */
  garrison: CommanderState | null;
  /** Field the province's provincial defense. */
  pd: boolean;
}

/** The fort's state when the defenders are stormed. */
export interface StormState {
  wallsStanding: boolean;
}

interface Context {
  state: GameState;
  province: ProvinceId;
  side: BattleSide;
  nation: NationId | null;
  storm: StormState | null;
}

function statsFor(ctx: Context, unit: UnitTypeId, starvedDays: number): CombatStats {
  const { state, province, side, nation } = ctx;
  const def = unitDef(unit);
  const p = getProvince(state, province);
  const terrain = getMapProvince(state, province).terrain;
  const battle = TERRAIN[terrain].battle;
  const scales = provinceScales(state, province);
  const dominator = p.dominion.strength > 0 ? p.dominion.nation : null;
  const mine = dominator !== null && dominator === nation;
  const defending = side === 'defender';

  let att = def.att;
  let defense = def.def;
  let prot = def.prot;
  let mor = def.mor;
  let prec = def.prec;

  if (!defending && !def.tags.includes('swampwalker')) att += battle.attackerAtt;
  if (defending) defense += battle.defenderDef;
  if (nation !== null) {
    const home = nationDef(getNation(state, nation).def).homeTerrain;
    if (home?.terrain === terrain) defense += home.def;
    mor -= unpaidMoralePenalty(getNation(state, nation).unpaidDays);
  }
  mor -= starvationMoralePenalty(starvedDays);
  if (mine) {
    att += scaleEffect(scales, 'attack');
    mor += scaleEffect(scales, 'morale');
    prec += scaleEffect(scales, 'precision');
    if (def.tags.includes('sacred')) mor += scaleEffect(scales, 'sacredMorale');
  } else if (dominator !== null) {
    mor += scaleEffect(scales, 'enemyMoralePer3Dominion');
  }
  if (defending) {
    for (const e of activeEffects(state, province)) {
      if (e.kind === 'defense' && e.nation === nation) {
        prot += e.prot;
        defense += e.def;
      }
    }
    if (ctx.storm) {
      mor += STORM.morale;
      prot += ctx.storm.wallsStanding ? STORM.wallsProt : STORM.breachedProt;
    }
  }
  return {
    hp: def.hp,
    str: def.str,
    att,
    def: defense,
    prot,
    mor,
    prec,
    mapSpeed: def.mapSpeed,
    weapons: def.weapons,
    tags: def.tags,
    regeneration: def.regeneration ?? 0,
  };
}

function commanderSetup(ctx: Context, c: CommanderState): BattleCommanderSetup {
  return {
    ref: c.id,
    unit: c.unit,
    name: c.name,
    hp: c.hp,
    row: 'rear',
    stats: statsFor(ctx, c.unit, c.starvedDays),
    script: c.script.map((s) => ({ ...s })),
    pips: { ...c.pips },
    holy: c.holy,
    carriedMana: { ...c.carriedMana },
  };
}

/** Research level reached in each color (docs/02-magic.md section 4). */
function researchLevels(state: GameState, nation: NationId | null): Partial<Record<Color, number>> {
  if (nation === null) return {};
  const points = getNation(state, nation).research.points;
  const levels: Partial<Record<Color, number>> = {};
  for (const color of COLORS) {
    let level = 0;
    RESEARCH_LEVEL_POINTS.forEach((need, i) => {
      if (points[color] >= need) level = i;
    });
    levels[color] = level;
  }
  return levels;
}

function sideSetup(ctx: Context, forces: SideForces): BattleSideSetup {
  const side: BattleSideSetup = {
    nation: forces.nation,
    research: researchLevels(ctx.state, forces.nation),
    commanders: [],
    squads: [],
  };
  for (const c of forces.commanders) {
    side.commanders.push(commanderSetup(ctx, c));
    for (const s of c.squads) {
      side.squads.push({
        ref: s.id,
        commander: c.id,
        unit: s.unit,
        count: s.count,
        hp: s.hp,
        row: s.formation,
        stats: statsFor(ctx, s.unit, s.starvedDays),
      });
    }
  }
  for (const s of forces.garrison?.squads ?? []) {
    side.squads.push({
      ref: s.id,
      commander: null,
      unit: s.unit,
      count: s.count,
      hp: s.hp,
      row: s.formation,
      stats: statsFor(ctx, s.unit, s.starvedDays),
    });
  }
  if (forces.pd) {
    pdForce(ctx.state, ctx.province).forEach(({ unit, count }, i) => {
      side.squads.push({
        ref: `pd${i}`,
        commander: null,
        unit,
        count,
        hp: count * unitDef(unit).hp,
        row: defaultFormation(unitDef(unit)),
        stats: statsFor(ctx, unit, 0),
      });
    });
  }
  return side;
}

export function buildBattle(
  state: GameState,
  province: ProvinceId,
  attacker: SideForces,
  defender: SideForces,
  storm: StormState | null = null,
): BattleSetup {
  const base = { state, province, storm };
  return {
    province,
    attacker: sideSetup({ ...base, side: 'attacker', nation: attacker.nation }, attacker),
    defender: sideSetup({ ...base, side: 'defender', nation: defender.nation }, defender),
  };
}
