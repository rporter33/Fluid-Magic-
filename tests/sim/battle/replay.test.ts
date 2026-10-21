// The replay log is self-sufficient: folding it over the roster gives the battle's outcome.
import { describe, expect, it } from 'vitest';
import { foldReplay } from '../../../src/sim/battle/replay';
import type { ScriptSlot } from '../../../src/sim/types';
import { commander, fightOnce, side, squad } from './fixtures';

const attackFirst: ScriptSlot[] = [
  { kind: 'attack' },
  { kind: 'attack' },
  { kind: 'hold' },
  { kind: 'hold' },
  { kind: 'retreat' },
];

describe('foldReplay', () => {
  it('ends where the result ends, for every unit, over many battles', () => {
    for (let seed = 0; seed < 150; seed++) {
      const result = fightOnce(
        side(
          [
            squad('aw', 'cinderWarrior', 15, { leader: 'ac' }),
            squad('aa', 'flameArcher', 8, { leader: 'ac' }),
            squad('ab', 'berserker', 5, { leader: 'ac2' }),
          ],
          [
            commander('ac', 'ashChieftain'),
            commander('ac2', 'ashChieftain', { script: attackFirst }),
          ],
        ),
        side(
          [
            squad('dw', 'warden', 12, { leader: 'dc' }),
            squad('dl', 'longbowHunter', 8, { leader: 'dc' }),
            squad('dm', 'thornMilitia', 10),
          ],
          [commander('dc', 'wardenCaptain', { script: attackFirst })],
        ),
        seed,
      );
      const folded = foldReplay(result.roster, result.replay);
      for (const [ref, o] of result.squads) {
        const u = folded.get(ref);
        expect(u?.count, `seed ${seed} ${ref}`).toBe(o.count);
        expect((u?.routing ?? false) || (u?.gone ?? false), `seed ${seed} ${ref}`).toBe(o.routed);
      }
      for (const [ref, o] of result.commanders) {
        const u = folded.get(ref);
        expect(u?.count === 0, `seed ${seed} ${ref}`).toBe(o.dead);
        if (!o.dead) expect(u?.hp ?? 0).toBeCloseTo(o.hp, 9);
        expect((u?.routing ?? false) || (u?.gone ?? false), `seed ${seed} ${ref}`).toBe(o.routed);
      }
    }
  });

  it('logs a commander moving up to its front and units leaving the field', () => {
    const result = fightOnce(
      side(
        [squad('s', 'cinderWarrior', 5, { leader: 'c', stats: { prot: 99, mor: 50 } })],
        [commander('c', 'ashChieftain', { script: attackFirst, stats: { prot: 99 } })],
      ),
      side([squad('d', 'ashMilitia', 3, { row: 'rear', stats: { prot: 99, mor: 50 } })]),
    );
    expect(result.replay).toContainEqual({ kind: 'advance', unit: 'c', row: 'front' });
    expect(result.replay).toContainEqual({ kind: 'leave', unit: 'c' });
    expect(foldReplay(result.roster, result.replay).get('c')).toMatchObject({
      row: 'front',
      gone: true,
    });
  });
});
