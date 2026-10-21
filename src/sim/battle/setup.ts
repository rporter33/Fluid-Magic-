// Builds a BattleSetup from the game (docs/04-battle.md, "Province modifiers"). Every modifier,
// blessings included, is folded into each unit's stats here, so the resolver stays a pure
// function of its input.
import { nationDef, unitDef, type UnitTypeId } from '../../content';
import { PROPHET, STORM } from '../../content/rules';
import { BATTLE_SPELLS } from '../../content/spells';
import type { BattleSpellDef } from '../../content/spells/types';
import { TERRAIN } from '../../content/terrain';
import type { WeaponDef } from '../../content/types';
import { nationBless, NO_BLESS, type Bless } from '../bless';
import { defaultFormation } from '../commanders';
import { pdForce } from '../pd';
import { meetsRequirement } from '../pips';
import { researchLevels } from '../research';
import { provinceScales, scaleEffect } from '../scales';
import { hasAvatar } from '../pretender';
import { isPretender, isProphet, starvationMoralePenalty, unpaidMoralePenalty } from '../selectors';
import { activeEffects, getMapProvince, getNation, getProvince } from '../state';
import type { CommanderId, NationId, ProvinceId } from '../ids';
import type { CommanderState, GameState, Pips, Squad } from '../types';
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

/**
 * Battle refs of provincial defense, in pdForce order: militia first (`pd0`), then archers.
 * After a battle, PD is set from the militia that held.
 */
export function pdRef(i: number): string {
  return `pd${String(i)}`;
}
export const PD_MILITIA_REF = pdRef(0);

/** The fort's state when the defenders are stormed. */
export interface StormState {
  wallsStanding: boolean;
}

interface Context {
  state: GameState;
  province: ProvinceId;
  side: BattleSide;
  nation: NationId | null;
  /** The nation on the other side, or null for Independents. */
  opponent: NationId | null;
  storm: StormState | null;
}

/**
 * Melee weapons with the bless's weapon effects (docs/02 decisions, "Blessing folds"): more
 * damage, an element, armor piercing, a first-round bonus. The same list when it has none.
 */
function blessedWeapons(weapons: readonly WeaponDef[], bless: Bless): readonly WeaponDef[] {
  const { meleeDmg, meleeElement, meleeArmorPiercing, firstRoundBonus } = bless;
  if (meleeDmg === 0 && meleeElement === null && !meleeArmorPiercing && firstRoundBonus === 0) {
    return weapons;
  }
  return weapons.map((w) => {
    if (w.range !== undefined) return w;
    const out: WeaponDef = { ...w, dmg: w.dmg + meleeDmg };
    if (meleeElement !== null) out.element = meleeElement;
    if (meleeArmorPiercing) out.armorPiercing = true;
    if (firstRoundBonus !== 0) out.firstRoundBonus = (w.firstRoundBonus ?? 0) + firstRoundBonus;
    return out;
  });
}

/** Who a commander is to its nation: the prophet and the pretender may fight blessed. */
type Role = 'prophet' | 'pretender' | null;

/**
 * A unit's stats with every modifier. `upkeep` is false for units that draw no pay (PD,
 * summons). The nation's prophet fights blessed and braver; its pretender fights blessed with
 * Avatar in a province its nation dominates.
 */
function statsFor(
  ctx: Context,
  unit: UnitTypeId,
  starvedDays: number,
  upkeep = true,
  role: Role = null,
): CombatStats {
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
    if (upkeep) mor -= unpaidMoralePenalty(getNation(state, nation).unpaidDays);
  }
  mor -= starvationMoralePenalty(starvedDays);
  // docs/02 section 8: sacred units carry their nation's bless, and so do the prophet and an
  // Avatar in its own dominion (the owner's decision: only through Avatar).
  const blessed =
    nation !== null &&
    (def.tags.includes('sacred') ||
      role === 'prophet' ||
      (role === 'pretender' && mine && hasAvatar(getNation(state, nation).pretender)));
  const bless = blessed ? nationBless(state, nation) : NO_BLESS;
  if (role === 'prophet') mor += PROPHET.morale;
  att += bless.att;
  defense += bless.def;
  prot += bless.prot;
  mor += bless.mor;
  prec += bless.prec;
  if (mine) {
    att += scaleEffect(scales, 'attack');
    mor += scaleEffect(scales, 'morale');
    prec += scaleEffect(scales, 'precision');
    if (def.tags.includes('sacred')) mor += scaleEffect(scales, 'sacredMorale');
  } else if (dominator !== null && dominator === ctx.opponent) {
    // Dread unsettles those fighting the dominating nation, Independents included.
    mor += scaleEffect(scales, 'enemyMorale');
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
    str: def.str + bless.str,
    att,
    def: defense,
    prot,
    mor,
    prec,
    mapSpeed: def.mapSpeed,
    weapons: blessedWeapons(def.weapons, bless),
    tags: bless.berserk && !def.tags.includes('berserk') ? [...def.tags, 'berserk'] : def.tags,
    regeneration: (def.regeneration ?? 0) + bless.regeneration,
    lifeDrain: bless.lifeDrain,
    // Only fire shields fold until shields by element land (Phase 6b.2); content allows no other.
    fireShield:
      (def.fireShield ?? 0) +
      bless.shields.reduce((sum, sh) => sum + (sh.element === 'fire' ? sh.amount : 0), 0),
  };
}

/**
 * The battle spells a commander knows: its pips meet them and its nation has researched their
 * level in their color. Holy spells need no research.
 */
export function knownSpells(
  state: GameState,
  nation: NationId | null,
  pips: Pips,
  holy: number,
): BattleSpellDef[] {
  const levels = nation === null ? null : researchLevels(state, nation);
  return BATTLE_SPELLS.filter(
    (s) =>
      meetsRequirement(pips, holy, s) &&
      (s.color === null || (levels !== null && levels[s.color] >= s.level)),
  );
}

function roleOf(state: GameState, c: CommanderState): Role {
  if (isProphet(state, c)) return 'prophet';
  return isPretender(state, c) ? 'pretender' : null;
}

function commanderSetup(ctx: Context, c: CommanderState): BattleCommanderSetup {
  return {
    ref: c.id,
    unit: c.unit,
    name: c.name,
    hp: c.hp,
    row: 'rear',
    stats: statsFor(ctx, c.unit, c.starvedDays, true, roleOf(ctx.state, c)),
    script: c.script.map((s) => ({ ...s })),
    pips: { ...c.pips },
    holy: c.holy,
    carriedMana: { ...c.carriedMana },
    spells: knownSpells(ctx.state, ctx.nation, c.pips, c.holy),
  };
}

function sideSetup(ctx: Context, forces: SideForces): BattleSideSetup {
  const side: BattleSideSetup = {
    nation: forces.nation,
    commanders: [],
    squads: [],
    summons: {},
  };
  const squad = (s: Squad, leader: CommanderId | null) => {
    side.squads.push({
      ref: s.id,
      commander: leader,
      unit: s.unit,
      count: s.count,
      hp: s.hp,
      row: s.formation,
      stats: statsFor(ctx, s.unit, s.starvedDays),
    });
  };
  for (const c of forces.commanders) {
    const commander = commanderSetup(ctx, c);
    side.commanders.push(commander);
    // Summoned troops fight with this side's modifiers, worked out here; they draw no pay.
    for (const spell of commander.spells) {
      for (const e of spell.effects) {
        if (e.kind === 'summon') side.summons[e.unit] ??= statsFor(ctx, e.unit, 0, false);
      }
    }
    for (const s of c.squads) squad(s, c.id);
  }
  for (const s of forces.garrison?.squads ?? []) squad(s, null);
  if (forces.pd) {
    pdForce(ctx.state, ctx.province).forEach(({ unit, count }, i) => {
      side.squads.push({
        ref: pdRef(i),
        commander: null,
        unit,
        count,
        hp: count * unitDef(unit).hp,
        row: defaultFormation(unitDef(unit)),
        stats: statsFor(ctx, unit, 0, false),
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
    attacker: sideSetup(
      { ...base, side: 'attacker', nation: attacker.nation, opponent: defender.nation },
      attacker,
    ),
    defender: sideSetup(
      { ...base, side: 'defender', nation: defender.nation, opponent: attacker.nation },
      defender,
    ),
  };
}
