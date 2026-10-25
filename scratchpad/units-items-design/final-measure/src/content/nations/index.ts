// Every nation, keyed by id.
import type { NationDef } from '../types';
import { CINDER_HORDE } from './cinderHorde';
import { THORNWOOD } from './thornwood';

export const NATIONS = {
  cinderHorde: CINDER_HORDE,
  thornwood: THORNWOOD,
} satisfies Record<string, NationDef>;

export type NationDefId = keyof typeof NATIONS;

export function isNationDefId(value: unknown): value is NationDefId {
  return typeof value === 'string' && Object.hasOwn(NATIONS, value);
}
