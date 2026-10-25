// Prototype toggles for the units-and-items design measurements (scratch copy only).
export const PROTO = {
  sizeMelee: true,
  sizeRanged: true,
  reach: true,
  shieldArrows: false,
  resist: true,
};
export function setProto(p: Partial<typeof PROTO>): void {
  Object.assign(PROTO, { sizeMelee: false, sizeRanged: false, reach: false, shieldArrows: false, resist: false }, p);
}
