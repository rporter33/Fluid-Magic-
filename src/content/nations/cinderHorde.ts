// Cinder Horde (R): "The fire that walks" (docs/03-nations.md).
import type { NationDef } from '../types';

export const CINDER_HORDE: NationDef = {
  id: 'cinderHorde',
  name: 'Cinder Horde',
  colors: ['R'],
  motto: 'The fire that walks',
  description:
    'A confederation of ash-born clans that worship a god of flame. Fast, aggressive, cheap ' +
    'troops with poor armor and high morale. Fire mages and salamanders. Weak defense; wins ' +
    'by striking first and burning the enemy economy.',
  capitalName: 'Kharnath',
  capitalTerrain: 'plains',
  troops: [
    'ashMilitia',
    'cinderWarrior',
    'emberSkirmisher',
    'flameArcher',
    'berserker',
    'ashRider',
    'flamebrand',
  ],
  commanders: ['cinderScout', 'ashChieftain', 'pyrePriest', 'emberAdept', 'cinderMagus'],
  pd: { militia: 'ashMilitia', archer: 'flameArcher' },
  homeTerrain: null,
  startingArmy: [
    {
      commander: 'ashChieftain',
      squads: [
        { unit: 'cinderWarrior', count: 20 },
        { unit: 'flameArcher', count: 10 },
      ],
    },
    { commander: 'cinderScout', squads: [] },
    { commander: 'emberAdept', squads: [] },
    { commander: 'pyrePriest', squads: [] },
  ],
  startingResearch: { color: 'R', level: 1 },
  ai: { aggression: 0.8, expansion: 0.8, research: 0.4, pillage: 0.6 },
};
