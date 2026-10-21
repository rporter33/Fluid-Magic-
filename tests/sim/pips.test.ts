// Pips against spell requirements (docs/02-magic.md section 2), hybrids included.
import { describe, expect, it } from 'vitest';
import { SPELLS } from '../../src/content/spells';
import type { BattleSpellDef } from '../../src/content/spells/types';
import { extraPips, meetsRequirement } from '../../src/sim/pips';

const spell = (requirement: string, holy = 0): BattleSpellDef => ({
  ...SPELLS.emberDart,
  id: `test:${requirement}`,
  requirement,
  holy,
});

describe('meetsRequirement', () => {
  it('needs one pip per slot of the slot’s color', () => {
    expect(meetsRequirement({ R: 1 }, 0, SPELLS.emberDart)).toBe(true);
    expect(meetsRequirement({ R: 1 }, 0, SPELLS.fireball)).toBe(false);
    expect(meetsRequirement({ G: 3 }, 0, SPELLS.fireball)).toBe(false);
    expect(meetsRequirement({ R: 3 }, 0, SPELLS.pyreStorm)).toBe(true);
  });

  it('fills a hybrid slot with either color, never one pip twice', () => {
    expect(meetsRequirement({ G: 1 }, 0, spell('R/G'))).toBe(true);
    expect(meetsRequirement({ R: 1 }, 0, spell('RR/G'))).toBe(false);
    expect(meetsRequirement({ R: 1, G: 1 }, 0, spell('RR/G'))).toBe(true);
    expect(meetsRequirement({ R: 1, G: 1 }, 0, spell('R/GR'))).toBe(true);
    expect(meetsRequirement({ R: 2 }, 0, spell('R/GG/R'))).toBe(true);
    expect(meetsRequirement({ R: 1 }, 0, spell('R/GG/R'))).toBe(false);
  });

  it('checks holy pips for holy spells', () => {
    expect(meetsRequirement({}, 1, SPELLS.bless)).toBe(true);
    expect(meetsRequirement({ R: 6 }, 0, SPELLS.bless)).toBe(false);
  });
});

describe('extraPips', () => {
  it('counts pips in the requirement’s colors beyond its slots', () => {
    expect(extraPips({ R: 3, G: 2 }, 0, SPELLS.emberDart)).toBe(2);
    expect(extraPips({ R: 1, G: 2 }, 0, spell('R/G'))).toBe(2);
    expect(extraPips({ R: 2 }, 0, SPELLS.pyreStorm)).toBe(0);
    expect(extraPips({}, 3, SPELLS.bless)).toBe(2);
  });
});
