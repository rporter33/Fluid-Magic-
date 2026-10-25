// Shared unit building blocks. docs/03-nations.md: "Baseline human infantry: hp 10, str 10,
// att 10, def 10, prot 0, mr 10, mor 10, prec 10." Stats a table leaves out take these values;
// size defaults to 1 and map speed to 2.
import type { WeaponDef } from '../types';

export const BASELINE = {
  hp: 10,
  str: 10,
  att: 10,
  def: 10,
  prot: 0,
  mr: 10,
  mor: 10,
  prec: 10,
  size: 1,
  mapSpeed: 2,
} as const;

/** Commander weapons; the commander tables list none (values in docs/09-balance.md). */
export const COMMANDER_WEAPONS = {
  dagger: { name: 'Dagger', dmg: 2 },
  staff: { name: 'Staff', dmg: 2 },
  sword: { name: 'Sword', dmg: 4 },
  axe: { name: 'Axe', dmg: 5 },
} as const satisfies Record<string, WeaponDef>;
