// Morale rules (docs/04-battle.md, round step 4), tested on a staged field.
import { describe, expect, it } from 'vitest';
import type { BattleEvent } from '../../../src/sim/battle/events';
import { buildField, troopsLost, type Field, type Group } from '../../../src/sim/battle/field';
import { commanderDeaths, moralePhase } from '../../../src/sim/battle/morale';
import { drn } from '../../../src/sim/drn';
import { cloneRng, createRng } from '../../../src/sim/rng';
import { commander, setup, side, squad } from './fixtures';

function kill(g: Group, n: number): void {
  let left = n;
  for (const m of g.members) {
    if (left === 0) break;
    if (!m.alive) continue;
    m.alive = false;
    m.hp = 0;
    g.deathsThisRound += 1;
    left -= 1;
  }
}

/** A side of one 20-troop squad (morale stat given) led by a commander, against an empty side. */
function staged(
  mor: number,
  tags: ('berserk' | 'mindless')[] = [],
): { field: Field; g: Group; c: Group } {
  const field = buildField(
    setup(
      side(
        [
          squad('s', 'ashMilitia', 20, { leader: 'c', stats: { mor, tags } }),
          squad('x', 'ashMilitia', 20),
        ],
        [commander('c', 'ashChieftain', { stats: { mor: 10 } })],
      ),
      side([squad('e', 'ashMilitia', 1)]),
    ),
  );
  const [g, , c] = field.sides.attacker as [Group, Group, Group];
  return { field, g, c };
}

/** How often a check routs over many rng seeds. */
function routRate(
  make: () => { field: Field; g: Group },
  act: (f: Field, g: Group) => void,
): number {
  let routs = 0;
  const n = 400;
  for (let seed = 0; seed < n; seed++) {
    const { field, g } = make();
    act(field, g);
    moralePhase(field, 1, createRng(seed), []);
    if (g.routingSince !== null) routs++;
  }
  return routs / n;
}

describe('squad morale checks', () => {
  it('happen only past 20% total or 10% this round', () => {
    // Two deaths of 20 is exactly 10%: no check, so a hopeless squad still stands.
    expect(
      routRate(
        () => staged(-100),
        (_, g) => {
          kill(g, 2);
        },
      ),
    ).toBe(0);
    // A third death passes 10% this round: the hopeless squad breaks every time.
    expect(
      routRate(
        () => staged(-100),
        (_, g) => {
          kill(g, 3);
        },
      ),
    ).toBe(1);
    // Exactly 20% in all and 10% this round is neither over: still no check.
    expect(
      routRate(
        () => staged(-100),
        (_, g) => {
          kill(g, 2);
          g.deathsThisRound = 0;
          kill(g, 2);
        },
      ),
    ).toBe(0);
    // Losses in earlier rounds alone bring no check.
    expect(
      routRate(
        () => staged(-100),
        (_, g) => {
          kill(g, 5);
          g.deathsThisRound = 0;
        },
      ),
    ).toBe(0);
    // Past 20% in all, even one more death this round brings a check.
    expect(
      routRate(
        () => staged(-100),
        (_, g) => {
          kill(g, 4);
          g.deathsThisRound = 0;
          kill(g, 1);
        },
      ),
    ).toBe(1);
  });

  it('never happen for morale 50 or berserkers', () => {
    expect(
      routRate(
        () => staged(50),
        (_, g) => {
          kill(g, 15);
        },
      ),
    ).toBe(0);
    expect(
      routRate(
        () => staged(-100, ['berserk']),
        (_, g) => {
          kill(g, 15);
        },
      ),
    ).toBe(0);
  });

  it('break exactly when mor + DRN < 10 + DRN + pressure', () => {
    for (let seed = 0; seed < 300; seed++) {
      const { field, g } = staged(10);
      kill(g, 5);
      const rng = createRng(seed);
      const replay = cloneRng(rng);
      const breaks = 10 + drn(replay) < 10 + drn(replay);
      moralePhase(field, 1, rng, []);
      expect(g.routingSince !== null, `seed ${String(seed)}`).toBe(breaks);
    }
  });

  it('count fled troops as lost, and add pressure only past half, not at it', () => {
    const { field, g } = staged(10);
    const other = field.sides.attacker[1]!;
    kill(g, 5);
    other.gone = true;
    expect(troopsLost(field, 'attacker')).toBe(25);
    // Exactly half lost (20 of 40) brings no pressure: the same rate as no losses elsewhere.
    const plain = routRate(
      () => staged(10),
      (_, sq) => {
        kill(sq, 5);
      },
    );
    const half = routRate(
      () => staged(10),
      (f, sq) => {
        kill(sq, 5);
        const x = f.sides.attacker[1]!;
        kill(x, 15);
        x.deathsThisRound = 0;
      },
    );
    expect(half).toBe(plain);
  });

  it('get harder once the side has lost over half its troops', () => {
    const plain = routRate(
      () => staged(10),
      (_, g) => {
        kill(g, 5);
      },
    );
    const pressed = routRate(
      () => staged(10),
      (f, g) => {
        kill(g, 5);
        const other = f.sides.attacker[1]!;
        kill(other, 16);
        other.deathsThisRound = 0;
      },
    );
    expect(pressed).toBeGreaterThan(plain + 0.1);
  });
});

describe('commander checks', () => {
  it('give a squad that rolled for its commander’s death no second roll that round', () => {
    for (let seed = 0; seed < 50; seed++) {
      const { field, g, c } = staged(14);
      kill(c, 1);
      kill(g, 5);
      const rng = createRng(seed);
      commanderDeaths(field, 1, rng, []);
      const after = cloneRng(rng);
      moralePhase(field, 1, rng, []);
      expect(rng).toEqual(after);
    }
  });

  it("roll a commander's squads at once, with pressure, when it dies", () => {
    let routs = 0;
    for (let seed = 0; seed < 400; seed++) {
      const { field, g, c } = staged(10);
      kill(c, 1);
      const log: BattleEvent[] = [];
      commanderDeaths(field, 1, createRng(seed), log);
      expect(log[0]).toEqual({ kind: 'death', commander: 'c' });
      if (g.routingSince !== null) routs++;
    }
    // mor 10 against 10 + 4: most break.
    expect(routs / 400).toBeGreaterThan(0.6);
  });

  it('take a commander along once, when its last standing squad breaks', () => {
    let routed = 0;
    for (let seed = 0; seed < 200; seed++) {
      const { field, g, c } = staged(-100);
      c.base = { ...c.base, mor: -100 };
      kill(g, 5);
      moralePhase(field, 1, createRng(seed), []);
      if (c.routingSince !== null) routed++;
      // Its squad is gone to rout; a later round brings no new check for the commander.
      c.routingSince = null;
      moralePhase(field, 2, createRng(seed), []);
      expect(c.routingSince).toBeNull();
    }
    expect(routed).toBe(200);
  });
});

describe('a commander whose line breaks', () => {
  it('stays when it is fearless or berserk', () => {
    for (const traits of [{ mor: 50 }, { mor: 10, tags: ['berserk' as const] }]) {
      for (let seed = 0; seed < 30; seed++) {
        const { field, g, c } = staged(-100);
        c.base = { ...c.base, ...traits };
        kill(g, 5);
        moralePhase(field, 1, createRng(seed), []);
        expect(g.routingSince).toBe(1);
        expect(c.routingSince).toBeNull();
      }
    }
  });

  it('goes with its troops, however brave', () => {
    for (let seed = 0; seed < 50; seed++) {
      const { field, g, c } = staged(-100);
      c.base = { ...c.base, mor: 30 };
      kill(g, 5);
      moralePhase(field, 1, createRng(seed), []);
      expect(c.routingSince).toBe(1);
    }
  });
});
