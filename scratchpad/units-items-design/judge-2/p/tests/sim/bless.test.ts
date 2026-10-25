// Blessings of sacred units (docs/02-magic.md section 8).
import { describe, expect, it } from 'vitest';
import { blessOf, NO_BLESS } from '../../src/sim/bless';

describe('blessOf', () => {
  it('gives nothing below 4 pips', () => {
    expect(blessOf({ R: 3, G: 3 })).toEqual(NO_BLESS);
  });

  it('gives each color’s bless at 4 pips and doubles it at 6', () => {
    expect(blessOf({ W: 4 })).toMatchObject({ mor: 2, prot: 1 });
    expect(blessOf({ U: 4 })).toMatchObject({ def: 2, prec: 2 });
    expect(blessOf({ B: 4 })).toMatchObject({ lifeDrain: 2, att: 1 });
    expect(blessOf({ R: 4 })).toMatchObject({ att: 2, str: 2 });
    expect(blessOf({ G: 4 })).toMatchObject({ regeneration: 0.1, prot: 1 });
    expect(blessOf({ R: 6 })).toMatchObject({ att: 4, str: 4 });
    expect(blessOf({ G: 6 })).toMatchObject({ regeneration: 0.2, prot: 2 });
  });

  it('adds up the blesses of several colors', () => {
    expect(blessOf({ R: 4, G: 5 })).toEqual({
      ...NO_BLESS,
      att: 2,
      str: 2,
      regeneration: 0.1,
      prot: 1,
    });
  });
});
