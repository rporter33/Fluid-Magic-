// The dummy AI of Phase 6 (docs/10-milestone-1.md): random choices in random order, through the
// same commands as the player, so the headless runner can play whole games before the real AI
// of Phase 7 (docs/08-ai.md). It reads the state and never changes it. Its numbers are its own
// stand-ins, not game rules, and go away with it.
import { nationDef, unitDef } from '../content';
import { validateCommand, type Command } from '../sim/commands';
import { isGarrisonHolder, troopCount } from '../sim/commanders';
import type { NationId } from '../sim/ids';
import { canResearch } from '../sim/research';
import { pick, shuffle } from '../sim/rng';
import { getMapProvince, getNation, getProvince } from '../sim/state';
import { findPathFor } from '../sim/movement';
import type { CommanderState, GameState } from '../sim/types';
import { claimBlocker } from '../sim/wellsprings';
import { aiRng } from './rng';

/** Field armies need this many troops before the dummy marches them out. */
const MARCH_AT = 10;
/** Troops per recruit order. */
const BATCH = 10;
/** Commanders that lead at least this many troops are the dummy's generals. */
const GENERAL_LEADERSHIP = 40;
/** It wants this many generals, plus one per this many provinces. */
const GENERALS = { base: 2, perProvinces: 6 };

export function dummyPlayer(state: GameState, nationId: NationId): Command[] {
  const rng = aiRng(state, nationId);
  const nation = getNation(state, nationId);
  const def = nationDef(nation.def);
  const out: Command[] = [];
  const offer = (cmd: Command): boolean => {
    if (validateCommand(state, cmd) !== null) return false;
    out.push(cmd);
    return true;
  };

  const primary = nation.colors[0];
  if (nation.research.color !== primary) {
    offer({ type: 'setResearchColor', nation: nationId, color: primary });
  }

  const own = Object.values(state.commanders).filter((c) => c.owner === nationId);
  const leadership = (c: CommanderState) => unitDef(c.unit).commander?.leadership ?? 0;
  const isGeneral = (c: CommanderState) =>
    !isGarrisonHolder(c) && leadership(c) >= GENERAL_LEADERSHIP;
  const capital = getProvince(state, nation.capital);
  if (capital.owner === nationId && capital.recruitQueue.length < 2) {
    const provinces = Object.values(state.provinces).filter((p) => p.owner === nationId).length;
    const wanted = GENERALS.base + Math.floor(provinces / GENERALS.perProvinces);
    const general = def.commanders.find(
      (u) => (unitDef(u).commander?.leadership ?? 0) >= GENERAL_LEADERSHIP,
    );
    // One recruit per call: each is checked against the treasury as it stands.
    const hired =
      general !== undefined &&
      own.filter(isGeneral).length < wanted &&
      offer({ type: 'recruit', nation: nationId, province: capital.id, unit: general, count: 1 });
    for (const unit of hired ? [] : shuffle(rng, [...def.troops])) {
      if (offer({ type: 'recruit', nation: nationId, province: capital.id, unit, count: BATCH })) {
        break;
      }
    }
  }

  // The capital's garrison troops go to the generals standing there, as many as each can lead.
  const holder = own.find((c) => isGarrisonHolder(c) && c.location === capital.id);
  if (holder) {
    const left = new Map(holder.squads.map((s) => [s.id, s.count] as const));
    for (const general of own.filter(
      (c) => isGeneral(c) && c.location === capital.id && !c.transit,
    )) {
      let room = leadership(general) - troopCount(general);
      for (const squad of holder.squads) {
        const count = Math.min(room, left.get(squad.id) ?? 0);
        if (count <= 0) continue;
        const cmd: Command = {
          type: 'transferSquad',
          nation: nationId,
          from: holder.id,
          to: general.id,
          squad: squad.id,
          count,
        };
        if (!offer(cmd)) continue;
        left.set(squad.id, (left.get(squad.id) ?? 0) - count);
        room -= count;
      }
    }
  }

  const unclaimed = state.map.wellsprings.filter((id) => {
    const p = getProvince(state, id);
    return p.owner === nationId && p.wellspringClaimedBy !== nationId;
  });
  for (const c of shuffle(
    rng,
    own.filter((x) => !isGarrisonHolder(x)),
  )) {
    if (c.transit) continue;
    if (c.holy > 0 && (c.order.kind === 'idle' || c.order.kind === 'preach')) {
      // Priests claim the Wellspring they stand in, else walk to one the nation owns, else preach.
      if (claimBlocker(state, c) === null) {
        offer({ type: 'claimWellspring', nation: nationId, commander: c.id });
        continue;
      }
      const spring = unclaimed.find((id) => id !== c.location);
      const path = spring === undefined ? null : findPathFor(state, [c], spring);
      if (path && offer({ type: 'move', nation: nationId, commanders: [c.id], path })) continue;
      if (c.order.kind === 'idle') {
        offer({ type: 'setOrder', nation: nationId, commander: c.id, order: 'preach' });
      }
      continue;
    }
    if (c.order.kind !== 'idle') continue;
    if (canResearch(c) && getProvince(state, c.location).buildings.includes('lab')) {
      if (offer({ type: 'setOrder', nation: nationId, commander: c.id, order: 'research' }))
        continue;
    }
    if (troopCount(c) >= MARCH_AT) {
      const to = pick(rng, getMapProvince(state, c.location).neighbors);
      offer({ type: 'move', nation: nationId, commanders: [c.id], path: [to] });
    } else if (isGeneral(c) && c.location !== capital.id) {
      // A spent army goes home for fresh troops.
      const path = findPathFor(state, [c], capital.id);
      if (path) offer({ type: 'move', nation: nationId, commanders: [c.id], path });
    }
  }
  return out;
}
