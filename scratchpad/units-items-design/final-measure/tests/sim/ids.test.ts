import { describe, expect, it } from 'vitest';
import { ID_PREFIXES, isId, newId, type IdCounter, type IdKind } from '../../src/sim/ids';

describe('newId', () => {
  it('takes sequential numbers from the counter with the kind prefix', () => {
    const counter: IdCounter = { nextId: 0 };
    expect(newId(counter, 'commander')).toBe('c0');
    expect(newId(counter, 'squad')).toBe('sq1');
    expect(newId(counter, 'province')).toBe('p2');
    expect(counter.nextId).toBe(3);
  });

  it('never repeats an id', () => {
    const counter: IdCounter = { nextId: 0 };
    const kinds = Object.keys(ID_PREFIXES) as IdKind[];
    const ids = new Set<string>();
    for (let i = 0; i < 1000; i++) ids.add(newId(counter, kinds[i % kinds.length]!));
    expect(ids.size).toBe(1000);
  });

  it('is deterministic for the same sequence of calls', () => {
    const run = () => {
      const counter: IdCounter = { nextId: 10 };
      return [newId(counter, 'nation'), newId(counter, 'commander'), newId(counter, 'battle')];
    };
    expect(run()).toEqual(run());
    expect(run()).toEqual(['n10', 'c11', 'b12']);
  });

  it('rejects a corrupt counter', () => {
    expect(() => newId({ nextId: -1 }, 'squad')).toThrow(RangeError);
    expect(() => newId({ nextId: 1.5 }, 'squad')).toThrow(RangeError);
    expect(() => newId({ nextId: Number.NaN }, 'squad')).toThrow(RangeError);
  });

  it('has a distinct prefix per kind', () => {
    const prefixes = Object.values(ID_PREFIXES);
    expect(new Set(prefixes).size).toBe(prefixes.length);
  });
});

describe('serialization', () => {
  it('continues without collisions after a JSON round trip of the counter', () => {
    const state = { nextId: 0, ids: [] as string[] };
    for (let i = 0; i < 5; i++) state.ids.push(newId(state, 'commander'));
    const restored = JSON.parse(JSON.stringify(state)) as typeof state;
    const next = newId(restored, 'commander');
    expect(restored.ids).toEqual(state.ids);
    expect(state.ids).not.toContain(next);
    expect(next).toBe(newId(state, 'commander'));
  });

  it('isId recognizes ids of the right kind only', () => {
    expect(isId('c12', 'commander')).toBe(true);
    expect(isId('sq3', 'squad')).toBe(true);
    expect(isId('c12', 'squad')).toBe(false);
    expect(isId('sq3', 'commander')).toBe(false);
    expect(isId('c', 'commander')).toBe(false);
    expect(isId('c01', 'commander')).toBe(false);
    expect(isId('c-1', 'commander')).toBe(false);
    expect(isId(12, 'commander')).toBe(false);
    expect(isId(undefined, 'commander')).toBe(false);
  });
});
