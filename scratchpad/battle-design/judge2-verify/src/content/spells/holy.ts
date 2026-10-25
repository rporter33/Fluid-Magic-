// Holy spells: the priests' built-in Bless (docs/04-battle.md, "Commanders in battle"). Holy
// spells need holy pips instead of color pips, and no research.
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
  },
} satisfies Record<string, BattleSpellDef>;
