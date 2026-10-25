// Taking a province (docs/01-core-rules.md sections 9, 11, 13).
import { describe, expect, it } from 'vitest';
import { captureProvince } from '../../src/sim/capture';
import { redField } from './fixtures';

describe('captureProvince', () => {
  it('resets tax and PD, ends a siege, unclaims a Wellspring, and replaces the garrison', () => {
    const { state, red, green } = redField();
    const deepmoss = state.provinces[state.nations[green]!.capital]!;
    deepmoss.taxRate = 'high';
    deepmoss.pd = 7;
    deepmoss.siege = { attacker: red, wallHp: 0, storm: false };
    deepmoss.wellspringClaimedBy = green;
    const oldHolder = deepmoss.garrison!;
    state.commanders[oldHolder]!.squads.push({
      id: 'sq999' as never,
      unit: 'warden',
      count: 3,
      hp: 33,
      formation: 'front',
      starvedDays: 0,
    });
    captureProvince(state, deepmoss.id, red);
    expect(deepmoss).toMatchObject({
      owner: red,
      taxRate: 'normal',
      pd: 0,
      siege: null,
      wellspringClaimedBy: null,
    });
    expect(state.commanders[oldHolder]).toBeUndefined();
    expect(state.commanders[deepmoss.garrison!]).toMatchObject({ owner: red, squads: [] });
    expect(deepmoss.dominion.nation).toBe(green);
    expect(state.nations[red]!.stats.provincesTaken).toBe(1);
    const notes = state.messages.map((m) => [m.nation, m.kind]);
    expect(notes).toContainEqual([red, 'captured']);
    expect(notes).toContainEqual([green, 'lost']);
  });
});
