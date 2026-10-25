// Every unit type, keyed by id.
import type { UnitDef } from '../types';
import { CINDER_HORDE_UNITS } from './cinderHorde';
import { COMMON_UNITS } from './common';
import { PRETENDER_UNITS } from './pretenders';
import { THORNWOOD_UNITS } from './thornwood';

export const UNITS = {
  ...COMMON_UNITS,
  ...CINDER_HORDE_UNITS,
  ...THORNWOOD_UNITS,
  ...PRETENDER_UNITS,
} satisfies Record<string, UnitDef>;

export type UnitTypeId = keyof typeof UNITS;

export function isUnitTypeId(value: unknown): value is UnitTypeId {
  return typeof value === 'string' && Object.hasOwn(UNITS, value);
}
