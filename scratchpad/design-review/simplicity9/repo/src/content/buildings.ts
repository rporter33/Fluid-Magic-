// Buildings (docs/01-core-rules.md section 7). Forts exist only at capitals in M1.
import type { BuildingDef, BuildingId } from './types';

export const BUILDINGS: Readonly<Record<BuildingId, BuildingDef>> = {
  temple: { id: 'temple', name: 'Temple', gold: 200, materials: 0, days: 30, buildable: true },
  lab: { id: 'lab', name: 'Lab', gold: 300, materials: 0, days: 30, buildable: true },
  fort: { id: 'fort', name: 'Fort', gold: 600, materials: 300, days: 150, buildable: false },
};

export const BUILDING_IDS: readonly BuildingId[] = ['temple', 'lab', 'fort'];

/** Buildings every capital starts with. */
export const CAPITAL_BUILDINGS: readonly BuildingId[] = ['fort', 'temple', 'lab'];
