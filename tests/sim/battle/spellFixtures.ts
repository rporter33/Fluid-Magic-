// Mages, test spells, staged fields, and replay readers shared by the spell, effect, and target
// tests.
import { SPELLS } from '../../../src/content/spells';
import type { BattleEffect, BattleSpellDef } from '../../../src/content/spells/types';
import type { BattleEvent } from '../../../src/sim/battle/events';
import { buildField, type Group } from '../../../src/sim/battle/field';
import { cast } from '../../../src/sim/battle/spells';
import type { BattleCommanderSetup, BattleSideSetup } from '../../../src/sim/battle/types';
import { createRng, type RngState } from '../../../src/sim/rng';
import type { Pips, ScriptSlot } from '../../../src/sim/types';
import { commander, IMMORTAL, setup } from './fixtures';

function casting(spellId: string | null): ScriptSlot[] {
  return Array.from({ length: 5 }, () => ({ kind: 'cast' as const, spellId }));
}

/** A mage that casts the named spell (or its best one) every round. */
export function mage(
  ref: string,
  spells: readonly BattleSpellDef[],
  opts: {
    named?: string | null;
    pips?: Pips;
    carried?: Pips;
    holy?: number;
    immortal?: boolean;
  } = {},
): BattleCommanderSetup {
  return commander(ref, 'cinderMagus', {
    spells,
    script: casting(opts.named === undefined ? (spells[0]?.id ?? null) : opts.named),
    pips: opts.pips ?? { R: 3, G: 3 },
    holy: opts.holy ?? 1,
    carriedMana: opts.carried ?? {},
    ...(opts.immortal ? { stats: IMMORTAL, hp: 50 } : {}),
  });
}

/** A test-only spell; a huge fatigue makes it a once-a-battle cast. */
export function testSpell(id: string, effects: BattleEffect[], fatigue = 10): BattleSpellDef {
  return { ...SPELLS.emberDart, id, fatigue, effects };
}

export function casts(replay: readonly BattleEvent[]) {
  return replay.flatMap((e) => (e.kind === 'cast' ? [e] : []));
}

/** Events from a cast up to the next cast or round step, i.e. the cast's own effects. */
export function afterCast(replay: readonly BattleEvent[], spellId: string): BattleEvent[] {
  const i = replay.findIndex((e) => e.kind === 'cast' && e.spellId === spellId);
  if (i < 0) return [];
  const out: BattleEvent[] = [];
  for (const e of replay.slice(i + 1)) {
    if (['cast', 'volley', 'melee', 'roundStart', 'phase'].includes(e.kind)) break;
    out.push(e);
  }
  return out;
}

/**
 * A field built from two sides for casting by hand: find a group by ref, or have a commander
 * cast a spell in round 1 and get the events it logs.
 */
export function staged(attacker: BattleSideSetup, defender: BattleSideSetup) {
  const field = buildField(setup(attacker, defender));
  const find = (ref: string): Group => {
    const g = [...field.sides.attacker, ...field.sides.defender].find((x) => x.ref === ref);
    if (!g) throw new Error(`no group ${ref} on the field`);
    return g;
  };
  const castBy = (ref: string, spell: BattleSpellDef, rng: RngState = createRng(1)) => {
    const log: BattleEvent[] = [];
    cast(field, find(ref), spell, 1, rng, log);
    return log;
  };
  return { field, find, castBy };
}
