// Provincial defense (docs/01-core-rules.md section 8).
import { describe, expect, it } from 'vitest';
import { pdCost, pdForce } from '../../src/sim/pd';
import { capitalOf, independentProvince, nationIds, twoNationGame } from './fixtures';

describe('pdCost', () => {
  it('charges (level + 1) * 15 for each level raised', () => {
    expect(pdCost(0, 1)).toBe(15);
    expect(pdCost(1, 1)).toBe(30);
    expect(pdCost(0, 3)).toBe(15 + 30 + 45);
    expect(pdCost(4, 2)).toBe(75 + 90);
    expect(pdCost(0, 30)).toBe(6975);
    expect(pdCost(29, 1)).toBe(450);
  });
});

describe('pdForce', () => {
  it("fields 2 of the owner's militia per level and 1 archer per 5 levels", () => {
    const state = twoNationGame();
    const [red, green] = nationIds(state);
    const kharnath = capitalOf(state, red!);
    const deepmoss = capitalOf(state, green!);
    expect(pdForce(state, kharnath.id)).toEqual([]);
    kharnath.pd = 4;
    expect(pdForce(state, kharnath.id)).toEqual([{ unit: 'ashMilitia', count: 8 }]);
    kharnath.pd = 11;
    expect(pdForce(state, kharnath.id)).toEqual([
      { unit: 'ashMilitia', count: 22 },
      { unit: 'flameArcher', count: 2 },
    ]);
    deepmoss.pd = 30;
    expect(pdForce(state, deepmoss.id)).toEqual([
      { unit: 'thornMilitia', count: 60 },
      { unit: 'longbowHunter', count: 6 },
    ]);
  });

  it('is empty for independents', () => {
    const state = twoNationGame();
    const p = independentProvince(state);
    p.pd = 10;
    expect(pdForce(state, p.id)).toEqual([]);
  });
});
