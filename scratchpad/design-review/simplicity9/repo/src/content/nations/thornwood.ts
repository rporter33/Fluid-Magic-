// Thornwood (G): "The forest that remembers" (docs/03-nations.md).
import type { NationDef } from '../types';

export const THORNWOOD: NationDef = {
  id: 'thornwood',
  name: 'Thornwood',
  color: 'G',
  motto: 'The forest that remembers',
  description:
    'Druidic clans living inside a continent-spanning forest, allied with beasts and ' +
    'treants. Tough, well-armored, slow troops; strong population growth and supply; big ' +
    'summons. Wins by out-growing the enemy and fielding monsters late.',
  capitalName: 'Deepmoss',
  capitalTerrain: 'forest',
  troops: ['thornMilitia', 'warden', 'longbowHunter', 'briarGuard', 'wolfRider', 'oakheart'],
  commanders: ['thornScout', 'wardenCaptain', 'grovePriest', 'saplingDruid', 'elderDruid'],
  pd: { militia: 'thornMilitia', archer: 'longbowHunter' },
  startingArmy: [
    {
      commander: 'wardenCaptain',
      squads: [
        { unit: 'warden', count: 20 },
        { unit: 'longbowHunter', count: 10 },
      ],
    },
    { commander: 'thornScout', squads: [] },
    { commander: 'saplingDruid', squads: [] },
    { commander: 'grovePriest', squads: [] },
  ],
  startingResearch: { color: 'G', level: 1 },
  ai: { aggression: 0.4, expansion: 0.6, research: 0.7, pillage: 0.1 },
};
