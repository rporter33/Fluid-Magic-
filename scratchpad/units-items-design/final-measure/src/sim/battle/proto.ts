// Prototype toggles for the units-and-items final measurements (scratch copy only).
import type { BattleSide, StatKey } from './events';
/** A battle-start stat change from an item trigger (Ivy Grasp, Seed of Barkskin), landed in round 1 before scripts. */
export interface StartMod {
  /** The side of the item's bearer. */
  side: BattleSide;
  /** enemySquad: the largest present enemy group, front row first (Entangle's target); friendlySquad: the bearer's largest active squad. */
  target: 'enemySquad' | 'friendlySquad';
  mods: { stat: StatKey; delta: number }[];
  /** Last round it holds; null for the battle. */
  untilRound: number | null;
  source: string;
}
export const PROTO = {
  sizeMelee: false,
  sizeRanged: false,
  reach: false,
  shieldArrows: false,
  resist: false,
  startMods: [] as StartMod[],
};
export function setProto(p: Partial<typeof PROTO>): void {
  Object.assign(PROTO, { sizeMelee: false, sizeRanged: false, reach: false, shieldArrows: false, resist: false, startMods: [] }, p);
}
