// Population growth (docs/01-core-rules.md section 3).
import { describe, expect, it } from 'vitest';
import { provinceEconomy } from '../../src/sim/selectors';
import {
  capitalOf,
  independentProvince,
  nationIds,
  redGame,
  runDays,
  twoNationGame,
} from './fixtures';

describe('population growth', () => {
  it('is pop * (0.002 + 0.003 * growth scale) a month', () => {
    const neutral = twoNationGame();
    const red = nationIds(neutral)[0]!;
    expect(provinceEconomy(neutral, capitalOf(neutral, red).id).growth).toBeCloseTo(
      25000 * 0.002,
      9,
    );
    const growth = redGame(10, { growth: 3 });
    expect(provinceEconomy(growth, capitalOf(growth, red).id).growth).toBeCloseTo(25000 * 0.011, 9);
    const rot = redGame(10, { growth: -3 });
    expect(provinceEconomy(rot, capitalOf(rot, red).id).growth).toBeCloseTo(25000 * -0.007, 9);
  });

  it('compounds daily and never goes below zero', () => {
    const state = redGame(10, { growth: -3 });
    const capital = capitalOf(state, nationIds(state)[0]!);
    let pop = 25000;
    for (let d = 0; d < 30; d++) pop += (pop * -0.007) / 30;
    runDays(state, 30);
    expect(capital.pop).toBeCloseTo(pop, 6);
    capital.pop = 0.001;
    runDays(state, 1);
    expect(capital.pop).toBeGreaterThanOrEqual(0);
  });

  it('grows independent provinces at the base rate', () => {
    const state = twoNationGame();
    const p = independentProvince(state);
    const start = p.pop;
    runDays(state, 30);
    expect(p.pop).toBeGreaterThan(start);
    expect(p.pop).toBeCloseTo(start * (1 + 0.002 / 30) ** 30, 6);
  });
});
