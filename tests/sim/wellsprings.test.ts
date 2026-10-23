// Wellspring claims (docs/01-core-rules.md section 13 and its implementation decision
// "Claiming a Wellspring"): who may claim, the 10-day claim through advance and its
// announcement, what interrupts a claim, and which claims count toward victory.
import { describe, expect, it } from 'vitest';
import { WELLSPRING } from '../../src/content/rules';
import { captureProvince } from '../../src/sim/capture';
import { createCommander } from '../../src/sim/commanders';
import { applyCommand, validateCommand } from '../../src/sim/commands';
import { createGame } from '../../src/sim/createGame';
import type { NationId, ProvinceId } from '../../src/sim/ids';
import { legDays } from '../../src/sim/movement';
import { advance } from '../../src/sim/tick';
import type { CommanderState, GameState } from '../../src/sim/types';
import { claimBlocker, claimedBy } from '../../src/sim/wellsprings';
import {
  addArmy,
  annex,
  capitalOf,
  commandersIn,
  move,
  nation,
  nationIds,
  neighbors,
  runDays,
  twoNationGame,
} from './fixtures';

/** Red owns the map's first Wellspring, and a Pyre Priest (holy 2) stands in it. */
function wellField(state: GameState = twoNationGame()) {
  const [red, green] = nationIds(state) as [NationId, NationId];
  const well = state.map.wellsprings[0]!;
  annex(state, red, well);
  const priest = createCommander(state, 'pyrePriest', red, well);
  return { state, red, green, well, priest };
}

function claim(state: GameState, nation: NationId, c: CommanderState) {
  return applyCommand(state, { type: 'claimWellspring', nation, commander: c.id });
}

function refusal(state: GameState, nation: NationId, c: CommanderState): string | null {
  return validateCommand(state, { type: 'claimWellspring', nation, commander: c.id });
}

/** The 'wellspring' messages, as [nation, text] pairs. */
function announcements(state: GameState): [NationId, string][] {
  return state.messages.filter((m) => m.kind === 'wellspring').map((m) => [m.nation, m.text]);
}

describe('who may claim a Wellspring', () => {
  it('a priest standing in an unclaimed Wellspring its nation owns', () => {
    const { state, red, priest } = wellField();
    expect(claimBlocker(state, priest)).toBeNull();
    expect(refusal(state, red, priest)).toBeNull();
  });

  it('any commander with holy pips, priest or not; none without', () => {
    const { state, red, well } = wellField();
    const chieftain = createCommander(state, 'ashChieftain', red, well);
    expect(chieftain.holy).toBe(0);
    expect(refusal(state, red, chieftain)).toBe('Ash Chieftain is not a priest');
    chieftain.holy = 3;
    expect(refusal(state, red, chieftain)).toBeNull();
  });

  it('not another nation’s commander', () => {
    const { state, red, green, well } = wellField();
    const stranger = createCommander(state, 'grovePriest', green, well);
    expect(refusal(state, red, stranger)).toBe('That commander is not yours');
    // Its own nation may not claim either: the province is Red's.
    expect(refusal(state, green, stranger)).toBe('Claim a Wellspring in a province you own');
  });

  it('not an independent or a garrison holder, even one with holy pips', () => {
    const { state, red, well } = wellField();
    const local = createCommander(state, 'pyrePriest', null, well);
    expect(claimBlocker(state, local)).toBe('Pyre Priest cannot claim a Wellspring');
    const holder = createCommander(state, 'garrison', red, well);
    holder.holy = 2;
    expect(claimBlocker(state, holder)).toBe(`${holder.name} cannot claim a Wellspring`);
    expect(refusal(state, red, holder)).toBe(`${holder.name} cannot claim a Wellspring`);
  });

  it('not a priest in transit', () => {
    const { state, red, well, priest } = wellField();
    priest.transit = { from: well, to: neighbors(state, well)[0]!, progress: 1, totalDays: 3 };
    expect(refusal(state, red, priest)).toBe('Pyre Priest is on the move');
  });

  it('not where there is no Wellspring', () => {
    const { state, red } = wellField();
    const home = capitalOf(state, red).id;
    const priest = commandersIn(state, home).find((c) => c.unit === 'pyrePriest')!;
    expect(state.map.provinces[home]!.wellspring).toBeUndefined();
    expect(refusal(state, red, priest)).toBe('There is no Wellspring here');
  });

  it('not in a Wellspring the nation does not own', () => {
    const { state, red, green, priest } = wellField();
    const other = state.map.wellsprings[1]!;
    priest.location = other;
    expect(state.provinces[other]!.owner).toBeNull();
    expect(refusal(state, red, priest)).toBe('Claim a Wellspring in a province you own');
    annex(state, green, other);
    expect(refusal(state, red, priest)).toBe('Claim a Wellspring in a province you own');
  });

  it('not a Wellspring already the nation’s', () => {
    const { state, red, well, priest } = wellField();
    state.provinces[well]!.wellspringClaimedBy = red;
    expect(refusal(state, red, priest)).toBe('This Wellspring is already yours');
  });
});

describe('the claimWellspring command', () => {
  it('gives the priest a 10-day claim order', () => {
    const { state, red, priest } = wellField();
    expect(WELLSPRING.claimDays).toBe(10);
    expect(claim(state, red, priest)).toEqual({ ok: true });
    expect(priest.order).toEqual({ kind: 'claimWellspring', daysLeft: 10 });
  });

  it('changes nothing when refused', () => {
    const { state, red, well, priest } = wellField();
    state.provinces[well]!.wellspringClaimedBy = red;
    priest.order = { kind: 'preach' };
    expect(claim(state, red, priest)).toEqual({
      ok: false,
      error: 'This Wellspring is already yours',
    });
    expect(priest.order).toEqual({ kind: 'preach' });
  });
});

describe('a claim through advance', () => {
  it('takes 10 uninterrupted days, then the Wellspring is the nation’s and everyone hears', () => {
    const { state, red, green, well, priest } = wellField();
    expect(claim(state, red, priest)).toEqual({ ok: true });
    runDays(state, 9);
    expect(state.provinces[well]!.wellspringClaimedBy).toBeNull();
    expect(priest.order).toEqual({ kind: 'claimWellspring', daysLeft: 1 });
    expect(announcements(state)).toEqual([]);
    advance(state);
    expect(state.provinces[well]!.wellspringClaimedBy).toBe(red);
    expect(priest.order).toEqual({ kind: 'idle' });
    expect(claimedBy(state, red)).toBe(1);
    expect(claimedBy(state, green)).toBe(0);
    const text = `Cinder Horde has claimed the Wellspring of ${state.map.provinces[well]!.name}.`;
    expect(announcements(state)).toEqual([
      [red, text],
      [green, text],
    ]);
    const note = state.messages.find((m) => m.kind === 'wellspring')!;
    expect(note).toMatchObject({ day: 9, province: well });
    // The game goes on: one of three is not a majority.
    expect(state.result).toBeNull();
  });

  it('is announced to every nation still playing, not to one already eliminated', () => {
    const three = createGame({
      seed: 2,
      mapSize: 'medium',
      nations: [
        nation('cinderHorde'),
        nation('thornwood', { ai: { difficulty: 'normal' } }),
        nation('cinderHorde', { ai: { difficulty: 'normal' } }),
      ],
    });
    const { state, red, green, priest } = wellField(three);
    const third = nationIds(state)[2]!;
    captureProvince(state, capitalOf(state, third).id, null);
    advance(state);
    expect(state.nations[third]!.eliminated).toBe(true);
    expect(state.result).toBeNull();
    expect(claim(state, red, priest)).toEqual({ ok: true });
    runDays(state, 10);
    expect(announcements(state).map(([n]) => n)).toEqual([red, green]);
  });
});

describe('an interrupted claim', () => {
  it('ends when another order replaces it', () => {
    const { state, red, well, priest } = wellField();
    expect(claim(state, red, priest)).toEqual({ ok: true });
    runDays(state, 5);
    expect(
      applyCommand(state, { type: 'setOrder', nation: red, commander: priest.id, order: 'preach' }),
    ).toEqual({ ok: true });
    runDays(state, 10);
    expect(state.provinces[well]!.wellspringClaimedBy).toBeNull();
    expect(priest.order).toEqual({ kind: 'preach' });
    expect(announcements(state)).toEqual([]);
  });

  it('restarts from 10 days when ordered again', () => {
    const { state, red, well, priest } = wellField();
    expect(claim(state, red, priest)).toEqual({ ok: true });
    runDays(state, 6);
    expect(claim(state, red, priest)).toEqual({ ok: true });
    runDays(state, 9);
    expect(state.provinces[well]!.wellspringClaimedBy).toBeNull();
    advance(state);
    expect(state.provinces[well]!.wellspringClaimedBy).toBe(red);
  });

  it('ends when the province is lost, and does not resume when it is won back', () => {
    const { state, red, green, well, priest } = wellField();
    expect(claim(state, red, priest)).toEqual({ ok: true });
    runDays(state, 4);
    captureProvince(state, well, green);
    advance(state);
    expect(priest.order).toEqual({ kind: 'idle' });
    annex(state, red, well);
    runDays(state, 10);
    expect(state.provinces[well]!.wellspringClaimedBy).toBeNull();
    expect(announcements(state)).toEqual([]);
  });

  it('ends when the priest fights a battle, even one its side wins', () => {
    const { state, red, green, well, priest } = wellField();
    addArmy(state, red, well, 'cinderWarrior', 150);
    const from = neighbors(state, well)[0]!;
    annex(state, green, from);
    const raider = addArmy(state, green, from, 'thornMilitia', 2, 'wardenCaptain');
    expect(claim(state, red, priest)).toEqual({ ok: true });
    expect(move(state, green, [raider], [well])).toEqual({ ok: true });
    const days = legDays(state, well, 2);
    expect(days).toBeLessThan(WELLSPRING.claimDays);
    runDays(state, days);
    expect(state.battles.at(-1)).toMatchObject({
      province: well,
      attacker: green,
      defender: red,
      winner: 'defender',
    });
    expect(state.commanders[priest.id]).toBe(priest);
    expect(priest.location).toBe(well);
    expect(priest.order).toEqual({ kind: 'idle' });
    expect(state.provinces[well]!.owner).toBe(red);
    runDays(state, WELLSPRING.claimDays);
    expect(state.provinces[well]!.wellspringClaimedBy).toBeNull();
  });
});

describe('claimedBy', () => {
  it('counts claimed Wellsprings in provinces the nation still owns, and nothing else', () => {
    const { state, red, green, well } = wellField();
    const [, second, third] = state.map.wellsprings as [ProvinceId, ProvinceId, ProvinceId];
    expect(claimedBy(state, red)).toBe(0);
    state.provinces[well]!.wellspringClaimedBy = red;
    expect(claimedBy(state, red)).toBe(1);
    // Owned but unclaimed does not count.
    annex(state, red, second);
    expect(claimedBy(state, red)).toBe(1);
    state.provinces[second]!.wellspringClaimedBy = red;
    expect(claimedBy(state, red)).toBe(2);
    // Claimed but owned by another nation counts for neither.
    annex(state, green, third);
    state.provinces[third]!.wellspringClaimedBy = red;
    expect(claimedBy(state, red)).toBe(2);
    expect(claimedBy(state, green)).toBe(0);
    // A claim mark outside a Wellspring province is not a Wellspring.
    const home = capitalOf(state, red);
    home.wellspringClaimedBy = red;
    expect(claimedBy(state, red)).toBe(2);
  });

  it('drops a Wellspring when its province is captured, and the claim stays lost', () => {
    const { state, red, green, well } = wellField();
    state.provinces[well]!.wellspringClaimedBy = red;
    captureProvince(state, well, green);
    expect(state.provinces[well]!.wellspringClaimedBy).toBeNull();
    expect(claimedBy(state, red)).toBe(0);
    expect(claimedBy(state, green)).toBe(0);
    captureProvince(state, well, red);
    expect(claimedBy(state, red)).toBe(0);
  });
});
