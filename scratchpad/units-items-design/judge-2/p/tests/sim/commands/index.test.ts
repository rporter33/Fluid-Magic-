// Command validation (docs/06-architecture.md, "Commands"): every command is checked before it
// is applied, an invalid one changes nothing, and no nation can command what it does not own.
import { describe, expect, it } from 'vitest';
import { applyCommand, validateCommand, type Command } from '../../../src/sim/commands';
import type { NationId, RecruitId } from '../../../src/sim/ids';
import { stateHash } from '../../../src/sim/hash';
import { advance } from '../../../src/sim/tick';
import type { GameState } from '../../../src/sim/types';
import { addArmy, capitalOf, commandersIn, nationIds, twoNationGame } from '../fixtures';

/** One of each command, issued by `nation` against `target`'s commanders and capital. */
function commandsAgainst(state: GameState, nation: NationId, target: NationId): Command[] {
  const capital = capitalOf(state, target);
  const army = commandersIn(state, capital.id).find(
    (c) => c.squads.length > 0 && c.unit !== 'garrison',
  )!;
  const other = commandersIn(state, capital.id).find((c) => c !== army && c.unit !== 'garrison')!;
  const squad = army.squads[0]!.id;
  const next = state.map.provinces[capital.id]!.neighbors[0]!;
  return [
    { type: 'move', nation, commanders: [army.id], path: [next] },
    { type: 'reverse', nation, commander: army.id },
    { type: 'setOrder', nation, commander: army.id, order: 'patrol' },
    { type: 'setScript', nation, commander: army.id, slots: army.script },
    { type: 'setFormation', nation, commander: army.id, squad, formation: 'rear' },
    { type: 'transferSquad', nation, from: army.id, to: other.id, squad },
    { type: 'build', nation, province: capital.id, commander: army.id, building: 'temple' },
    { type: 'recruit', nation, province: capital.id, unit: 'ashMilitia', count: 1 },
    { type: 'cancelRecruit', nation, province: capital.id, recruit: 'rq0' as RecruitId },
    { type: 'buyPd', nation, province: capital.id, levels: 1 },
    { type: 'setTax', nation, province: capital.id, rate: 'high' },
  ];
}

describe('validateCommand', () => {
  it("rejects every command against another nation's commanders and provinces", () => {
    const state = twoNationGame();
    const [red, green] = nationIds(state) as [NationId, NationId];
    const before = JSON.stringify(state);
    const commands = commandsAgainst(state, red, green);
    expect(new Set(commands.map((c) => c.type)).size).toBe(11);
    for (const cmd of commands) {
      const result = applyCommand(state, cmd);
      expect(result.ok, cmd.type).toBe(false);
      if (!result.ok) expect(result.error, cmd.type).toMatch(/not yours$/);
      expect(JSON.stringify(state)).toBe(before);
    }
  });

  it('checks every commander and province named, not just the first', () => {
    const state = twoNationGame();
    const [red, green] = nationIds(state) as [NationId, NationId];
    const capital = capitalOf(state, red).id;
    const own = commandersIn(state, capital).find((c) => c.unit === 'ashChieftain')!;
    const adept = commandersIn(state, capital).find((c) => c.unit === 'emberAdept')!;
    const visitor = addArmy(state, green, capital, 'warden', 5, 'wardenCaptain');
    const next = state.map.provinces[capital]!.neighbors[0]!;
    const before = JSON.stringify(state);
    const tries: Command[] = [
      { type: 'move', nation: red, commanders: [own.id, visitor.id], path: [next] },
      {
        type: 'transferSquad',
        nation: red,
        from: own.id,
        to: visitor.id,
        squad: own.squads[0]!.id,
        count: 1,
      },
    ];
    for (const cmd of tries) {
      expect(applyCommand(state, cmd)).toEqual({ ok: false, error: 'That commander is not yours' });
    }
    expect(JSON.stringify(state)).toBe(before);
    // A Thornwood province with no temple, with Red's commanders standing in it.
    const theirs = state.provinces[next]!;
    theirs.owner = green;
    theirs.buildings = ['lab'];
    own.location = theirs.id;
    adept.location = theirs.id;
    expect(
      applyCommand(state, {
        type: 'build',
        nation: red,
        province: theirs.id,
        commander: own.id,
        building: 'temple',
      }),
    ).toEqual({ ok: false, error: 'That province is not yours' });
    expect(
      applyCommand(state, {
        type: 'setOrder',
        nation: red,
        commander: adept.id,
        order: 'research',
      }),
    ).toEqual({ ok: false, error: 'Research needs a lab in a province you own' });
  });

  it('rejects independents as targets too', () => {
    const state = twoNationGame();
    const red = nationIds(state)[0]!;
    const guard = Object.values(state.commanders).find((c) => c.owner === null)!;
    const result = applyCommand(state, {
      type: 'setOrder',
      nation: red,
      commander: guard.id,
      order: 'pillage',
    });
    expect(result).toEqual({ ok: false, error: 'That commander is not yours' });
    expect(
      applyCommand(state, { type: 'setTax', nation: red, province: guard.location, rate: 'low' })
        .ok,
    ).toBe(false);
  });

  it('rejects unknown ids, unknown nations, and anything after the game ends', () => {
    const state = twoNationGame();
    const red = nationIds(state)[0]!;
    const capital = capitalOf(state, red).id;
    expect(
      validateCommand(state, { type: 'reverse', nation: red, commander: 'c9999' as never }),
    ).not.toBeNull();
    expect(
      validateCommand(state, {
        type: 'setTax',
        nation: 'n9' as NationId,
        province: capital,
        rate: 'low',
      }),
    ).toBe('No such nation');
    state.nations[red]!.eliminated = true;
    expect(
      validateCommand(state, { type: 'setTax', nation: red, province: capital, rate: 'low' }),
    ).toBe('No such nation');
    state.nations[red]!.eliminated = false;
    state.result = { day: 0, winner: null, reason: 'playerDefeated' };
    expect(
      validateCommand(state, { type: 'setTax', nation: red, province: capital, rate: 'low' }),
    ).toBe('The game is over');
  });

  it('accepts a valid command and reports ok', () => {
    const state = twoNationGame();
    const red = nationIds(state)[0]!;
    const capital = capitalOf(state, red);
    const cmd: Command = { type: 'setTax', nation: red, province: capital.id, rate: 'high' };
    expect(validateCommand(state, cmd)).toBeNull();
    expect(applyCommand(state, cmd)).toEqual({ ok: true });
    expect(capital.taxRate).toBe('high');
  });
});

describe('applyCommand', () => {
  it('copies what it stores, so changing a command afterwards changes nothing', () => {
    const state = twoNationGame();
    const red = nationIds(state)[0]!;
    const capital = capitalOf(state, red);
    const army = commandersIn(state, capital.id).find((c) => c.unit === 'ashChieftain')!;
    const a = state.map.provinces[capital.id]!.neighbors[0]!;
    const b = state.map.provinces[a]!.neighbors.find((n) => n !== capital.id)!;
    state.provinces[a]!.owner = red;
    for (const c of Object.values(state.commanders)) {
      if (c.owner === null && c.location === a) c.location = b;
    }
    const move: Command = { type: 'move', nation: red, commanders: [army.id], path: [a, b] };
    const slots = army.script.map((slot) => ({ ...slot }));
    const script: Command = { type: 'setScript', nation: red, commander: army.id, slots };
    expect(applyCommand(state, move)).toEqual({ ok: true });
    expect(applyCommand(state, script)).toEqual({ ok: true });
    // A second move given on the march keeps its whole path: it must be a copy too.
    advance(state);
    const onTheWay: Command = { type: 'move', nation: red, commanders: [army.id], path: [b] };
    expect(applyCommand(state, onTheWay)).toEqual({ ok: true });
    const hash = stateHash(state);
    move.path.push(a);
    move.commanders.length = 0;
    onTheWay.path.push(a);
    slots[0] = { kind: 'retreat' };
    slots.pop();
    expect(stateHash(state)).toBe(hash);
  });
});
