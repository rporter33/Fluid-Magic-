// Holy spells: the priests' built-in Bless (docs/04-battle.md, "Commanders in battle"). Holy
// spells need holy pips instead of color pips, and no research. Bless's fx is docs/09's aura at
// scale 1 with docs/12 S2.10's full-form length.
import type { BattleSpellDef } from './types';

export const HOLY_SPELLS = {
  bless: {
    kind: 'battle',
    id: 'bless',
    name: 'Bless',
    color: null,
    level: 0,
    requirement: '',
    holy: 1,
    description: 'One friendly squad gains 1 morale for the battle.',
    fatigue: 10,
    carriedMana: {},
    effects: [
      {
        kind: 'buff',
        stat: 'mor',
        delta: 1,
        duration: { kind: 'battle' },
        targets: { kind: 'friendlySquad' },
      },
    ],
    fx: { family: 'aura', scale: 1, duration: 1000 },
  },
} satisfies Record<string, BattleSpellDef>;
