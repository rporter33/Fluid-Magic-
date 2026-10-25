// Pretender bodies, one per chassis (docs/05-pretender.md, Step 1). Stats the table leaves out
// take the baseline (docs/03 decisions); leadership, weapons, and the Wild Spirit's
// regeneration are this milestone's choices (docs/09-balance.md). A pretender's pips come from
// its design, so the bodies list none. None of them can be recruited or kept for gold, and only
// the Oracle researches.
import type { UnitDef } from '../types';
import { BASELINE, COMMANDER_WEAPONS } from './base';

const body = { ...BASELINE, cost: null, recruitDays: 0, requires: [] } as const;

export const PRETENDER_UNITS = {
  oracle: {
    ...body,
    id: 'oracle',
    name: 'Oracle of the Flux',
    hp: 12,
    prot: 2,
    mor: 14,
    size: 2,
    weapons: [COMMANDER_WEAPONS.staff],
    tags: [],
    commander: { leadership: 20, pips: {}, holy: 0 },
  },
  titan: {
    ...body,
    id: 'titan',
    name: 'Titan',
    hp: 60,
    str: 20,
    att: 14,
    def: 12,
    prot: 10,
    mor: 18,
    size: 4,
    weapons: [{ name: 'Great Sword', dmg: 8 }],
    tags: [],
    commander: { leadership: 100, pips: {}, holy: 0, research: false },
  },
  greatWyrm: {
    ...body,
    id: 'greatWyrm',
    name: 'Great Wyrm',
    hp: 120,
    str: 24,
    att: 15,
    def: 10,
    prot: 16,
    mor: 20,
    size: 6,
    // The breath is of the nation's element: display only in M1 (docs/05 decisions).
    weapons: [
      { name: 'Breath', dmg: 12, range: 3, ammo: 5 },
      { name: 'Bite', dmg: 10 },
    ],
    tags: ['flying'],
    commander: { leadership: 20, pips: {}, holy: 0, research: false },
  },
  livingMonolith: {
    ...body,
    id: 'livingMonolith',
    name: 'Living Monolith',
    hp: 200,
    prot: 25,
    mor: 50,
    mapSpeed: 0,
    weapons: [],
    tags: ['immobile'],
    commander: { leadership: 20, pips: {}, holy: 0, research: false },
  },
  wildSpirit: {
    ...body,
    id: 'wildSpirit',
    name: 'Wild Spirit',
    hp: 30,
    def: 16,
    prot: 4,
    size: 2,
    weapons: [{ name: 'Claws', dmg: 5 }],
    tags: ['stealthy'],
    regeneration: 0.1,
    commander: { leadership: 20, pips: {}, holy: 0, research: false },
  },
  ashColossus: {
    ...body,
    id: 'ashColossus',
    name: 'Ash Colossus',
    hp: 80,
    str: 22,
    prot: 14,
    size: 5,
    weapons: [{ name: 'Burning Fists', dmg: 6, element: 'fire' }],
    tags: [],
    fireShield: 5,
    commander: { leadership: 20, pips: {}, holy: 0, research: false },
  },
} satisfies Record<string, UnitDef>;
