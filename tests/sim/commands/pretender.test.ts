// The makeProphet command (docs/05-pretender.md "Prophet"; docs/01-core-rules.md section 12 and
// implementation decisions): who may be named, the 24-month wait after a prophet dies, the
// prophet's dominion check, and its holy pips, morale, and bless in battle.
import { describe, expect, it } from 'vitest';
import { unitDef } from '../../../src/content';
import { PROPHET } from '../../../src/content/rules';
import { buildBattle, type SideForces } from '../../../src/sim/battle/setup';
import { commanderDies } from '../../../src/sim/commanders';
import { applyCommand, validateCommand } from '../../../src/sim/commands';
import { dominionChecks } from '../../../src/sim/dominion';
import type { CommanderId, NationId } from '../../../src/sim/ids';
import type { CommanderState, GameState, NationSetup } from '../../../src/sim/types';
import {
  addArmy,
  annex,
  capitalOf,
  commandersIn,
  independentProvince,
  nationIds,
  pretender,
  twoNationGame,
} from '../fixtures';

function setup(red: Partial<NationSetup> = {}) {
  const state = twoNationGame(1, red);
  const [redId, greenId] = nationIds(state) as [NationId, NationId];
  const find = (nation: NationId, unit: string) =>
    commandersIn(state, capitalOf(state, nation).id).find(
      (c) => c.owner === nation && c.unit === unit,
    )!;
  return {
    state,
    red: redId,
    green: greenId,
    priest: find(redId, 'pyrePriest'),
    chieftain: find(redId, 'ashChieftain'),
    garrison: find(redId, 'garrison'),
    greenCaptain: find(greenId, 'wardenCaptain'),
    greenPriest: find(greenId, 'grovePriest'),
  };
}

function makeProphet(state: GameState, nation: NationId, c: CommanderState | CommanderId) {
  const commander = typeof c === 'string' ? c : c.id;
  return applyCommand(state, { type: 'makeProphet', nation, commander });
}

function checksFrom(state: GameState, nation: NationId, province: string): number {
  return dominionChecks(state, nation).filter((c) => c.from === province).length;
}

describe('makeProphet', () => {
  it('names the prophet and raises its holy pips to 3', () => {
    const { state, red, priest } = setup();
    expect(priest.holy).toBe(2);
    expect(state.nations[red]!.prophetId).toBeNull();
    expect(makeProphet(state, red, priest)).toEqual({ ok: true });
    expect(state.nations[red]!.prophetId).toBe(priest.id);
    expect(priest.holy).toBe(PROPHET.holy);
    expect(PROPHET.holy).toBe(3);
  });

  it('gives a commander without holy pips 3 of them', () => {
    const { state, red, chieftain } = setup();
    expect(chieftain.holy).toBe(0);
    expect(makeProphet(state, red, chieftain)).toEqual({ ok: true });
    expect(state.nations[red]!.prophetId).toBe(chieftain.id);
    expect(chieftain.holy).toBe(3);
  });

  it('refuses another nation’s commander, or one that does not exist', () => {
    const { state, red, greenCaptain } = setup();
    expect(makeProphet(state, red, greenCaptain)).toEqual({
      ok: false,
      error: 'That commander is not yours',
    });
    expect(makeProphet(state, red, 'c9999' as CommanderId)).toEqual({
      ok: false,
      error: 'That commander is not yours',
    });
    expect(state.nations[red]!.prophetId).toBeNull();
    expect(greenCaptain.holy).toBe(0);
  });

  it('refuses the garrison holder', () => {
    const { state, red, garrison } = setup();
    expect(makeProphet(state, red, garrison)).toEqual({
      ok: false,
      error: 'The garrison cannot be a prophet',
    });
    expect(state.nations[red]!.prophetId).toBeNull();
  });

  it('refuses the pretender', () => {
    const { state, red } = setup({ pretender: pretender({ awakening: 'awake' }) });
    const god = state.nations[red]!.pretenderId!;
    expect(makeProphet(state, red, god)).toEqual({
      ok: false,
      error: 'The pretender cannot be its own prophet',
    });
    expect(state.nations[red]!.prophetId).toBeNull();
    expect(state.commanders[god]!.holy).toBe(0);
  });

  it('allows one prophet per nation at a time', () => {
    const { state, red, green, priest, chieftain, greenPriest } = setup();
    expect(makeProphet(state, red, priest).ok).toBe(true);
    expect(makeProphet(state, red, chieftain)).toEqual({
      ok: false,
      error: `${state.nations[red]!.name} already has a prophet`,
    });
    expect(makeProphet(state, red, priest).ok).toBe(false);
    expect(state.nations[red]!.prophetId).toBe(priest.id);
    expect(chieftain.holy).toBe(0);
    // Green names its own.
    expect(makeProphet(state, green, greenPriest)).toEqual({ ok: true });
    expect(state.nations[green]!.prophetId).toBe(greenPriest.id);
  });

  it('waits 24 months after the prophet dies, and allows a new one on that day', () => {
    const { state, red, priest, chieftain } = setup();
    expect(makeProphet(state, red, priest).ok).toBe(true);
    state.day = 100;
    commanderDies(state, priest.id);
    const nation = state.nations[red]!;
    expect(nation.prophetId).toBeNull();
    expect(nation.prophetAvailableDay).toBe(100 + PROPHET.cooldownDays);
    expect(PROPHET.cooldownDays).toBe(720);

    state.day = 819;
    const cmd = { type: 'makeProphet', nation: red, commander: chieftain.id } as const;
    expect(validateCommand(state, cmd)).toBe('A new prophet may be named on day 820');
    expect(makeProphet(state, red, chieftain).ok).toBe(false);
    expect(nation.prophetId).toBeNull();
    expect(chieftain.holy).toBe(0);
    state.day = 820;
    expect(validateCommand(state, cmd)).toBeNull();
    expect(makeProphet(state, red, chieftain)).toEqual({ ok: true });
    expect(nation.prophetId).toBe(chieftain.id);
  });

  it('starts no wait when some other commander dies', () => {
    const { state, red, priest, chieftain } = setup();
    expect(makeProphet(state, red, priest).ok).toBe(true);
    state.day = 100;
    commanderDies(state, chieftain.id);
    expect(state.nations[red]!.prophetId).toBe(priest.id);
    expect(state.nations[red]!.prophetAvailableDay).toBe(0);
  });

  it('adds one dominion check where the prophet stands', () => {
    const { state, red, chieftain } = setup();
    const p = annex(state, red, independentProvince(state).id);
    chieftain.location = p.id;
    expect(checksFrom(state, red, p.id)).toBe(0);
    const before = dominionChecks(state, red).length;
    expect(makeProphet(state, red, chieftain).ok).toBe(true);
    expect(checksFrom(state, red, p.id)).toBe(1);
    expect(dominionChecks(state, red)).toHaveLength(before + 1);
    // A dead prophet makes no check.
    commanderDies(state, chieftain.id);
    expect(dominionChecks(state, red)).toHaveLength(before);
  });
});

describe('the prophet in battle', () => {
  function forces(nation: NationId | null, commanders: CommanderState[]): SideForces {
    return { nation, commanders, garrison: null, pd: false };
  }

  /** Two Red Ash Chieftains with equal squads, the first the prophet, against Green. */
  function stage(pips: Record<string, number>) {
    const s = setup({ pretender: pretender({ pips }) });
    const p = independentProvince(s.state, 'plains');
    const prophet = addArmy(s.state, s.red, p.id, 'cinderWarrior', 5);
    const other = addArmy(s.state, s.red, p.id, 'cinderWarrior', 5);
    const foe = addArmy(s.state, s.green, p.id, 'warden', 5, 'wardenCaptain');
    expect(makeProphet(s.state, s.red, prophet)).toEqual({ ok: true });
    const battle = buildBattle(
      s.state,
      p.id,
      forces(s.red, [prophet, other]),
      forces(s.green, [foe]),
    );
    const [a, b] = battle.attacker.commanders;
    return { a: a!, b: b!, battle, prophet, other };
  }

  it('fights with 1 more morale and the nation’s bless (R4: +2 att, +2 str)', () => {
    const { a, b, prophet, other } = stage({ R: 4 });
    expect(a.ref).toBe(prophet.id);
    expect(b.ref).toBe(other.id);
    expect(a.stats).toEqual({
      ...b.stats,
      att: b.stats.att + 2,
      str: b.stats.str + 2,
      mor: b.stats.mor + PROPHET.morale,
    });
    expect(a.stats).toMatchObject({ att: 12, str: 12, mor: 14 });
    expect(b.stats).toMatchObject({ att: 10, str: 10, mor: 13 });
  });

  it('gets only the morale without a bless (R3)', () => {
    const { a, b } = stage({ R: 3 });
    expect(a.stats).toEqual({ ...b.stats, mor: b.stats.mor + 1 });
  });

  it('brings its holy pips and the holy spells they allow; its troops are not blessed', () => {
    const { a, b, battle, prophet, other } = stage({ R: 4 });
    expect(a.holy).toBe(3);
    expect(b.holy).toBe(0);
    expect(a.spells.map((s) => s.id)).toContain('bless');
    expect(b.spells).toEqual([]);
    const squadOf = (c: CommanderState) =>
      battle.attacker.squads.find((s) => s.commander === c.id)!;
    expect(squadOf(prophet).stats).toEqual(squadOf(other).stats);
    // The enemy's commander is untouched by Red's prophet.
    expect(battle.defender.commanders[0]!.stats.mor).toBe(unitDef('wardenCaptain').mor);
  });
});
