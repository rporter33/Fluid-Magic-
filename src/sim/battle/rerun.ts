// Fighting a recorded battle again (docs/04-battle.md, "Replay detail"). A player battle's
// record keeps its setup, spells by id, and the rng state from just before the battle; the
// replay viewer re-runs the same pure resolver with a detail sink and trusts the detail only
// if the re-run reproduces the stored log, winner, and rounds.
import { BATTLE, FIELD_EFFECTS } from '../../content/rules';
import { BATTLE_SPELLS, isSpellId, spellDef } from '../../content/spells';
import type { BattleSpellDef } from '../../content/spells/types';
import { UNITS } from '../../content/units';
import { UNARMED } from '../../content/units/base';
import { cyrb53 } from '../hash';
import { cloneRng, isRngState } from '../rng';
import type { BattleRecord } from '../types';
import type { DetailEvent } from './detail';
import type { BattleRerun, BattleSetupRecord, SideSetupRecord } from './record';
import { resolveBattle } from './resolve';
import type { BattleResult, BattleSetup, BattleSideSetup } from './types';

/** A JSON round trip: what a save and load would make of the value. */
function viaJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

let rulesHash: string | null = null;

/**
 * A fingerprint of everything the resolver reads besides the setup and the rng: the battle
 * rules, the battle spells, and the unit types (summons are built from content). Computed
 * once; content never changes while the game runs.
 */
export function battleRulesHash(): string {
  rulesHash ??= cyrb53(
    JSON.stringify({ BATTLE, FIELD_EFFECTS, UNARMED, spells: BATTLE_SPELLS, units: UNITS }),
  );
  return rulesHash;
}

/** A re-run recorded under the battle rules of this build. */
export function rerunCurrent(rerun: BattleRerun): boolean {
  return rerun.rules === battleRulesHash();
}

/** JSON round trip, spells replaced by ids, so the same session equals a loaded save. */
export function toSetupRecord(setup: BattleSetup): BattleSetupRecord {
  const side = (s: BattleSideSetup): SideSetupRecord => ({
    ...s,
    commanders: s.commanders.map((c) => ({ ...c, spells: c.spells.map((spell) => spell.id) })),
  });
  return viaJson({
    province: setup.province,
    attacker: side(setup.attacker),
    defender: side(setup.defender),
  });
}

function battleSpell(id: string): BattleSpellDef {
  const spell = isSpellId(id) ? spellDef(id) : null;
  if (spell?.kind !== 'battle') throw new Error(`unknown battle spell ${id} in a battle record`);
  return spell;
}

/**
 * Resolves spell ids through the content registry; throws on an unknown id. The setup is a
 * copy, so nothing done with it reaches the record.
 */
export function fromSetupRecord(record: BattleSetupRecord): BattleSetup {
  const copy = viaJson(record);
  const side = (s: SideSetupRecord): BattleSideSetup => ({
    ...s,
    commanders: s.commanders.map((c) => ({ ...c, spells: c.spells.map(battleSpell) })),
  });
  return { province: copy.province, attacker: side(copy.attacker), defender: side(copy.defender) };
}

/** Fights again from a copy of the stored rng; never mutates the record. */
export function rerunBattle(rerun: BattleRerun, detail?: DetailEvent[]): BattleResult {
  const setup = fromSetupRecord(rerun.setup);
  return resolveBattle(setup, cloneRng(rerun.rng), detail ? { detail } : {});
}

/**
 * Equal as JSON: the same arrays and the same keys with equal values, in any key order. A key
 * holding undefined counts as absent, as it does in a save.
 */
function jsonEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((x, i) => jsonEqual(x, b[i]));
  }
  const x = a as Record<string, unknown>;
  const y = b as Record<string, unknown>;
  const keys = (o: Record<string, unknown>) => Object.keys(o).filter((k) => o[k] !== undefined);
  const kx = keys(x);
  return kx.length === keys(y).length && kx.every((k) => jsonEqual(x[k], y[k]));
}

/** The re-run reproduced the record: winner, rounds, and the whole stored log deep-equal. */
export function matchesRecord(result: BattleResult, record: BattleRecord): boolean {
  return (
    result.winner === record.winner &&
    result.rounds === record.rounds &&
    jsonEqual(result.replay, record.replay)
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validSide(value: unknown): boolean {
  if (!isObject(value)) return false;
  const { commanders, squads, summons } = value;
  return (
    Array.isArray(squads) &&
    squads.every(isObject) &&
    isObject(summons) &&
    Array.isArray(commanders) &&
    commanders.every(
      (c) =>
        isObject(c) &&
        Array.isArray(c.spells) &&
        c.spells.every((s: unknown) => typeof s === 'string'),
    )
  );
}

/** Shape check for loads: an object with both sides' arrays, an RngState, and a rules hash. */
export function validRerun(value: unknown): value is BattleRerun {
  if (!isObject(value) || !isRngState(value.rng) || typeof value.rules !== 'string') return false;
  const setup = value.setup;
  return (
    isObject(setup) &&
    typeof setup.province === 'string' &&
    validSide(setup.attacker) &&
    validSide(setup.defender)
  );
}
