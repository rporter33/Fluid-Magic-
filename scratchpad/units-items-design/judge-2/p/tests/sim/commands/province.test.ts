// Commands to provinces: provincial defense and tax. Recruitment has its own file.
import { describe, expect, it } from 'vitest';
import { applyCommand } from '../../../src/sim/commands';
import { capitalOf, nationIds, twoNationGame } from '../fixtures';

describe('buyPd', () => {
  it('raises PD for (level + 1) * 15 gold per level, up to 30', () => {
    const state = twoNationGame();
    const [red, green] = nationIds(state);
    const capital = capitalOf(state, red!);
    state.nations[red!]!.gold = 10_000;
    const buy = (levels: number) =>
      applyCommand(state, { type: 'buyPd', nation: red!, province: capital.id, levels });
    expect(buy(3)).toEqual({ ok: true });
    expect(capital.pd).toBe(3);
    expect(state.nations[red!]!.gold).toBe(10_000 - 90);
    expect(buy(1)).toEqual({ ok: true });
    expect(state.nations[red!]!.gold).toBe(10_000 - 90 - 60);
    for (const levels of [0, -1, 1.5, 27]) expect(buy(levels).ok).toBe(false);
    expect(buy(26)).toEqual({ ok: true });
    expect(capital.pd).toBe(30);
    expect(buy(1).ok).toBe(false);
    capital.pd = 0;
    capital.siege = { attacker: green!, wallHp: 300, storm: false };
    expect(buy(1).ok).toBe(false);
  });

  it('needs the gold', () => {
    const state = twoNationGame();
    const red = nationIds(state)[0]!;
    const capital = capitalOf(state, red);
    state.nations[red]!.gold = 44;
    expect(
      applyCommand(state, { type: 'buyPd', nation: red, province: capital.id, levels: 2 }).ok,
    ).toBe(false);
    state.nations[red]!.gold = 45;
    expect(
      applyCommand(state, { type: 'buyPd', nation: red, province: capital.id, levels: 2 }).ok,
    ).toBe(true);
  });
});

describe('setTax', () => {
  it('sets a known rate on an owned province', () => {
    const state = twoNationGame();
    const red = nationIds(state)[0]!;
    const capital = capitalOf(state, red);
    for (const rate of ['low', 'high', 'normal'] as const) {
      expect(
        applyCommand(state, { type: 'setTax', nation: red, province: capital.id, rate }),
      ).toEqual({ ok: true });
      expect(capital.taxRate).toBe(rate);
    }
    expect(
      applyCommand(state, {
        type: 'setTax',
        nation: red,
        province: capital.id,
        rate: 'crushing' as 'low',
      }).ok,
    ).toBe(false);
  });
});
