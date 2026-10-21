// Buildings (docs/01-core-rules.md section 7). Forts exist only at capitals in M1.
import type { BuildingDef } from './types';

export const BUILDING_IDS = ['temple', 'lab', 'fort'] as const;
export type BuildingId = (typeof BUILDING_IDS)[number];

export const BUILDINGS: Readonly<Record<BuildingId, BuildingDef>> = {
  temple: { id: 'temple', name: 'Temple', gold: 200, materials: 0, days: 30, buildable: true },
  lab: { id: 'lab', name: 'Lab', gold: 300, materials: 0, days: 30, buildable: true },
  fort: { id: 'fort', name: 'Fort', gold: 600, materials: 300, days: 150, buildable: false },
};

export function isBuildingId(value: unknown): value is BuildingId {
  return typeof value === 'string' && Object.hasOwn(BUILDINGS, value);
}

/** Buildings every capital starts with. */
export const CAPITAL_BUILDINGS: readonly BuildingId[] = ['fort', 'temple', 'lab'];
