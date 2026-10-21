// Construction (docs/01-core-rules.md section 7).
import { describe, expect, it } from 'vitest';
import { constructionCost, constructionDays, startConstruction } from '../../src/sim/buildings';
import type { NationId } from '../../src/sim/ids';
import {
  capitalOf,
  independentProvince,
  nationIds,
  redGame,
  runDays,
  twoNationGame,
} from './fixtures';

describe('construction', () => {
  it('takes the building days, scaled by Wild and Artifice', () => {
    const state = twoNationGame();
    const capital = capitalOf(state, nationIds(state)[0]!);
    expect(constructionDays(state, capital.id, 'temple')).toBe(30);
    const wild = redGame(10, { wild: 3 });
    expect(constructionDays(wild, capitalOf(wild, nationIds(wild)[0]!).id, 'lab')).toBe(44);
    const artifice = redGame(10, { wild: -3 });
    expect(constructionDays(artifice, capitalOf(artifice, nationIds(artifice)[0]!).id, 'lab')).toBe(
      17,
    );
  });

  it('makes temples cheaper with Sanctity', () => {
    const state = redGame(10, { sanctity: 2 });
    const capital = capitalOf(state, nationIds(state)[0]!);
    expect(constructionCost(state, capital.id, 'temple')).toBe(100);
    expect(constructionCost(state, capital.id, 'lab')).toBe(300);
  });

  it('pays on start, completes after its days, and posts a message', () => {
    const state = twoNationGame();
    const red = nationIds(state)[0]!;
    const p = independentProvince(state);
    p.owner = red;
    const gold = state.nations[red]!.gold;
    startConstruction(state, p.id, 'lab', red);
    expect(state.nations[red]!.gold).toBe(gold - 300);
    runDays(state, 29);
    expect(p.buildings).toEqual([]);
    runDays(state, 1);
    expect(p.buildings).toEqual(['lab']);
    expect(p.construction).toBeNull();
    expect(state.messages.some((m) => m.kind === 'built' && m.province === p.id)).toBe(true);
  });

  it('is abandoned when the province changes hands', () => {
    const state = twoNationGame();
    const [red, green] = nationIds(state) as [NationId, NationId];
    const p = independentProvince(state);
    p.owner = red;
    startConstruction(state, p.id, 'temple', red);
    runDays(state, 10);
    p.owner = green;
    runDays(state, 30);
    expect(p.construction).toBeNull();
    expect(p.buildings).toEqual([]);
  });
});
