// Terrain types and base values (docs/01-core-rules.md section 2, fills from
// docs/09-art-direction.md). Current values live here; changes go in docs/09-balance.md.

export const TERRAIN_IDS = [
  'plains',
  'farmland',
  'forest',
  'hills',
  'mountains',
  'swamp',
  'wasteland',
] as const;
export type TerrainId = (typeof TERRAIN_IDS)[number];

export interface TerrainDef {
  id: TerrainId;
  name: string;
  /** Materials produced per month before population and scales. */
  materialsBase: number;
  /** Supply provided before population and scales. */
  supplyBase: number;
  /** Days to enter a province of this terrain at map speed 2. */
  moveDays: number;
  /** Starting population range for non-capital provinces, inclusive. */
  startPop: { min: number; max: number };
  /** Battle modifiers: defense added to defenders, attack added to attackers. */
  battle: { defenderDef: number; attackerAtt: number };
  /** Map fill color. */
  fill: string;
}

export const TERRAIN: Readonly<Record<TerrainId, TerrainDef>> = {
  plains: {
    id: 'plains',
    name: 'Plains',
    materialsBase: 10,
    supplyBase: 60,
    moveDays: 4,
    startPop: { min: 6000, max: 12000 },
    battle: { defenderDef: 0, attackerAtt: 0 },
    fill: '#B9B069',
  },
  farmland: {
    id: 'farmland',
    name: 'Farmland',
    materialsBase: 8,
    supplyBase: 120,
    moveDays: 4,
    startPop: { min: 10000, max: 18000 },
    battle: { defenderDef: 0, attackerAtt: 0 },
    fill: '#C9BE5A',
  },
  forest: {
    id: 'forest',
    name: 'Forest',
    materialsBase: 20,
    supplyBase: 50,
    moveDays: 6,
    startPop: { min: 3000, max: 7000 },
    battle: { defenderDef: 1, attackerAtt: 0 },
    fill: '#4E7B3B',
  },
  hills: {
    id: 'hills',
    name: 'Hills',
    materialsBase: 30,
    supplyBase: 40,
    moveDays: 6,
    startPop: { min: 3000, max: 6000 },
    battle: { defenderDef: 1, attackerAtt: 0 },
    fill: '#9C8A5C',
  },
  mountains: {
    id: 'mountains',
    name: 'Mountains',
    materialsBase: 40,
    supplyBase: 20,
    moveDays: 9,
    startPop: { min: 1000, max: 3000 },
    battle: { defenderDef: 2, attackerAtt: 0 },
    fill: '#7B7B7B',
  },
  swamp: {
    id: 'swamp',
    name: 'Swamp',
    materialsBase: 5,
    supplyBase: 30,
    moveDays: 8,
    startPop: { min: 1000, max: 3000 },
    battle: { defenderDef: 0, attackerAtt: -1 },
    fill: '#4F6B4A',
  },
  wasteland: {
    id: 'wasteland',
    name: 'Wasteland',
    materialsBase: 15,
    supplyBase: 10,
    moveDays: 5,
    startPop: { min: 500, max: 2000 },
    battle: { defenderDef: 0, attackerAtt: 0 },
    fill: '#A58C6B',
  },
};

export function isTerrainId(value: unknown): value is TerrainId {
  return typeof value === 'string' && (TERRAIN_IDS as readonly string[]).includes(value);
}
