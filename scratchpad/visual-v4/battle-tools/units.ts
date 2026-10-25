import { UNITS } from '/home/user/Fluid-Magic-/src/content/units/index';
for (const [id, u] of Object.entries(UNITS)) {
  const x = u as unknown as Record<string, unknown>;
  const w = (x.weapons as { name: string; range?: number; ammo?: number }[]).map((w) => w.name + (w.range ? `(r${w.range},a${w.ammo})` : '')).join('+');
  console.log([id, x.name, 'sz' + (x.size ?? 1), 'spd' + (x.mapSpeed ?? 2), 'hp' + x.hp, (x.tags as string[]).join('/'), w, x.commander ? 'CMD' : '', x.recruitCount ?? x.squadSize ?? ''].join(' | '));
}
