// Ritual effect primitives (docs/02-magic.md section 5), each applied to the ritual's province
// when the ritual completes.
import { SCRY, TIME, UNREST } from '../content/rules';
import type { RitualEffect, RitualSpellDef } from '../content/spells/types';
import { addSquad, createCommander, createSquad } from './commanders';
import { pushDominion } from './dominion';
import { newId, type NationId, type ProvinceId } from './ids';
import { randInt } from './rng';
import { getNation, getProvince } from './state';
import type { CommanderState, GameState, ProvinceEffectBody } from './types';

export interface RitualContext {
  nation: NationId;
  caster: CommanderState;
  spell: RitualSpellDef;
  province: ProvinceId;
}

function addEffect(
  state: GameState,
  ctx: RitualContext,
  days: number,
  body: ProvinceEffectBody,
): void {
  state.provinceEffects.push({
    id: newId(state, 'effect'),
    province: ctx.province,
    nation: ctx.nation,
    source: ctx.spell.id,
    untilDay: state.day + days,
    ...body,
  });
}

/**
 * Every troop in the province, of any owner, takes `dice` plain d6 (no protection). Squads are
 * taken in state order and troops one by one; wounds are spread evenly as in battle, the dead
 * leave, and survivors keep their wounds. Commanders and PD are untouched.
 */
function remoteDamage(state: GameState, province: ProvinceId, dice: number): void {
  for (const c of Object.values(state.commanders)) {
    if (c.location !== province) continue;
    for (const s of c.squads) {
      const each = s.hp / s.count;
      let alive = 0;
      let hp = 0;
      for (let i = 0; i < s.count; i++) {
        let hit = 0;
        for (let d = 0; d < dice; d++) hit += randInt(state.rng, 1, 6);
        if (hit < each) {
          alive += 1;
          hp += each - hit;
        }
      }
      s.count = alive;
      s.hp = hp;
    }
    c.squads = c.squads.filter((s) => s.count > 0);
  }
}

export function applyRitualEffect(state: GameState, ctx: RitualContext, e: RitualEffect): void {
  const p = getProvince(state, ctx.province);
  switch (e.kind) {
    case 'summonToProvince':
      if (e.commander) {
        createCommander(state, e.unit, ctx.nation, ctx.province);
      } else {
        // Leadership is checked when the ritual begins; troops arriving now join regardless.
        addSquad(ctx.caster, createSquad(state, e.unit, e.count));
      }
      return;
    case 'provincePop':
      p.pop = Math.max(0, p.pop * (1 + e.deltaPct));
      return;
    case 'provinceUnrest':
      p.unrest = Math.min(UNREST.max, Math.max(0, p.unrest + e.delta));
      return;
    case 'provinceGrowth':
      addEffect(state, ctx, e.months * TIME.daysPerMonth, {
        kind: 'growth',
        deltaScale: e.deltaScale,
      });
      return;
    case 'provinceSupply':
      addEffect(state, ctx, e.months * TIME.daysPerMonth, { kind: 'supply', deltaPct: e.deltaPct });
      return;
    case 'provinceMaterials':
      addEffect(state, ctx, e.months * TIME.daysPerMonth, { kind: 'materials', delta: e.delta });
      return;
    case 'provinceDefenseBuff':
      addEffect(state, ctx, e.months * TIME.daysPerMonth, {
        kind: 'defense',
        prot: e.prot,
        def: e.def,
      });
      return;
    case 'remoteDamage':
      remoteDamage(state, ctx.province, e.dice);
      return;
    case 'scry': {
      addEffect(state, ctx, SCRY.days, { kind: 'scry' });
      const explored = getNation(state, ctx.nation).explored;
      if (!explored.includes(ctx.province)) explored.push(ctx.province);
      return;
    }
    case 'dominionPush':
      pushDominion(state, ctx.province, ctx.nation, e.strength);
      return;
    case 'manaConvert': {
      const mana = getNation(state, ctx.nation).mana;
      mana[e.to] += mana[e.from] / e.ratio;
      mana[e.from] = 0;
      return;
    }
  }
}
