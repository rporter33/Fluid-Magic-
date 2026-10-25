// Boons (docs/05-pretender.md Step 7): options bought with design points, each at most once.
// Iron Will, Undying, Chosen Host and Deep Lore are M2.
import type { Color } from '../colors';

export const BOON_IDS = ['sacredSpring', 'avatar'] as const;
export type BoonId = (typeof BOON_IDS)[number];

/** A boon in a design. The Sacred Spring names the color of its spring. */
export type BoonChoice = { id: 'sacredSpring'; color: Color } | { id: 'avatar' };

export interface BoonDef {
  id: BoonId;
  name: string;
  /** Design points. */
  cost: number;
  description: string;
}

export const BOONS: Readonly<Record<BoonId, BoonDef>> = {
  sacredSpring: {
    id: 'sacredSpring',
    name: 'Sacred Spring',
    cost: 40,
    description: 'One more spring of a color you hold, at your capital.',
  },
  avatar: {
    id: 'avatar',
    name: 'Avatar',
    cost: 40,
    description: 'Your god fights blessed in your own dominion.',
  },
};

export function isBoonId(value: unknown): value is BoonId {
  return typeof value === 'string' && (BOON_IDS as readonly string[]).includes(value);
}
