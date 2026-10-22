// Behavior pins for the six presets of Phase 6, computed on the code before Phase 6b.1 and
// checked by presets.test.ts after it: every battle setup the bless reaches, and whole games
// played by the Phase 7 AI. Fields Phase 6b.1 and Phase 1b added to the state (and the save
// version) are stripped first, and battle setups are put back in the Phase 6 shape (Phase 6b.2 changed the
// shield field and added others), so equal pins mean equal behavior.
import { runAi } from '../../src/ai/ai';
import { runMatch } from '../../src/ai/match';
import { nationDef, type NationDefId, type UnitTypeId } from '../../src/content';
import { defaultPreset, PRESETS } from '../../src/content/pretenders/presets';
import { buildBattle } from '../../src/sim/battle/setup';
import { createCommander, createSquad } from '../../src/sim/commanders';
import { createGame } from '../../src/sim/createGame';
import { cyrb53 } from '../../src/sim/hash';
import type { NationId, ProvinceId } from '../../src/sim/ids';
import type { CommanderState, GameSetup, GameState, PretenderDesign } from '../../src/sim/types';

/**
 * Removes what Phase 6b.1 and Phase 1b added to the saved shape, so older and newer states
 * compare. The pinned games have no wilds; a map with any would not compare.
 */
export function stripped(state: GameState): string {
  if (state.map.wilds.length > 0) throw new Error('a pinned game has wilds');
  const copy = JSON.parse(JSON.stringify(state)) as Record<string, unknown>;
  delete copy.version;
  delete (copy.map as Record<string, unknown>).wilds;
  const nations = copy.nations as Record<string, Record<string, unknown>>;
  for (const n of Object.values(nations)) {
    delete n.pretenderName;
    delete n.pretenderReturnDay;
  }
  const provinces = copy.provinces as Record<string, Record<string, unknown>>;
  for (const p of Object.values(provinces)) delete p.extraSprings;
  return JSON.stringify(copy);
}

/**
 * Battle setups in the shape the pins were computed on: Phase 6b.2's shields list back to the
 * single fire shield, and the fields it added (size, spell power, abilities, bound) dropped. It
 * throws on anything Phase 6 could not have held: a shield of another element, an ability, a
 * bound squad, a spell power.
 */
function inPhase6Shape(value: unknown): string {
  return JSON.stringify(value, (_key, v: unknown) => {
    if (typeof v !== 'object' || v === null || Array.isArray(v)) return v;
    const o = v as Record<string, unknown>;
    if ('bound' in o) throw new Error('a preset setup has a bound squad');
    if (Array.isArray(o.abilities)) {
      if (o.abilities.length > 0) throw new Error('a preset setup has an ability');
      const rest = { ...o };
      delete rest.abilities;
      return rest;
    }
    if (!Array.isArray(o.shields) || !('lifeDrain' in o)) return v;
    const list = o.shields as { element: string; amount: number }[];
    if (o.spellPower !== 0 || list.some((sh) => sh.element !== 'fire')) {
      throw new Error('a preset setup has stats Phase 6 could not hold');
    }
    const rest = { ...o };
    delete rest.shields;
    delete rest.size;
    delete rest.spellPower;
    return { ...rest, fireShield: list.reduce((sum, sh) => sum + sh.amount, 0) };
  });
}

function setupWith(nation: NationDefId, design: PretenderDesign, seed: number): GameSetup {
  const red = nation === 'cinderHorde' ? design : defaultPreset('cinderHorde').design;
  const green = nation === 'thornwood' ? design : defaultPreset('thornwood').design;
  return {
    seed,
    mapSize: 'medium',
    nations: [
      { nation: 'cinderHorde', pretender: red, ai: null },
      { nation: 'thornwood', pretender: green, ai: null },
    ],
  };
}

/** Every unit of the nation (troops in squads, commanders), its prophet and its pretender. */
function armyOf(state: GameState, nation: NationId, at: ProvinceId): CommanderState[] {
  const def = nationDef(state.nations[nation]!.def);
  const out: CommanderState[] = [];
  def.troops.forEach((unit: UnitTypeId) => {
    const c = createCommander(state, def.commanders[0]!, nation, at);
    c.squads.push(createSquad(state, unit, 5));
    out.push(c);
  });
  for (const unit of def.commanders) out.push(createCommander(state, unit, nation, at));
  const prophet = out[out.length - 1]!;
  state.nations[nation]!.prophetId = prophet.id;
  const god = state.nations[nation]!.pretenderId;
  if (god !== null) {
    const c = state.commanders[god]!;
    c.location = at;
    out.push(c);
  }
  return out;
}

/**
 * The battle setups of a preset's nation fighting Independents in its capital (its own
 * dominion) and in an undominated province, hashed.
 */
export function setupPin(presetId: string): string {
  const preset = PRESETS.find((p) => p.id === presetId);
  if (!preset) throw new Error(`no preset ${presetId}`);
  const state = createGame(setupWith(preset.nation, preset.design, 5));
  const ids = Object.keys(state.nations) as NationId[];
  const nation = ids.find((id) => state.nations[id]!.def === preset.nation)!;
  const capital = state.nations[nation]!.capital;
  const wild = Object.values(state.provinces).find(
    (p) => p.owner === null && p.dominion.nation === null,
  )!.id;
  const setups = [capital, wild].map((at) => {
    const army = armyOf(state, nation, at);
    return buildBattle(
      state,
      at,
      { nation: null, commanders: [], garrison: null, pd: false },
      { nation, commanders: army, garrison: null, pd: false },
    );
  });
  return cyrb53(inPhase6Shape(setups));
}

/** A game of the AI for both nations, the preset against the other nation's default. */
export function gamePin(presetId: string, days: number): string {
  const preset = PRESETS.find((p) => p.id === presetId);
  if (!preset) throw new Error(`no preset ${presetId}`);
  const setup = setupWith(preset.nation, preset.design, 11);
  for (const n of setup.nations) n.ai = { difficulty: 'normal' };
  return cyrb53(stripped(runMatch(setup, runAi, days).state));
}
