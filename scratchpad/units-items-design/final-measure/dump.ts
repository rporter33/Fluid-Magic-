import { UNITS } from './src/content/units';
const w = (x: { name: string; dmg: number; range?: number; ammo?: number; element?: string; armorPiercing?: boolean; armorNegating?: boolean; firstRoundBonus?: number }) =>
  `${x.name} ${x.dmg}${x.range ? ` (range ${x.range}, ammo ${x.ammo})` : ''}${x.element ? ` ${x.element}` : ''}${x.armorPiercing ? ' AP' : ''}${x.armorNegating ? ' AN' : ''}${x.firstRoundBonus ? ` (first round +${x.firstRoundBonus})` : ''}`;
for (const [id, u] of Object.entries(UNITS)) {
  const c = u.commander;
  console.log([id, u.name, u.hp, u.str, u.att, u.def, u.prot, u.mr, u.mor, u.prec, u.size, u.mapSpeed, u.weapons.map(w).join(', '), u.tags.join(' '), u.regeneration ?? '', u.fireShield ?? '', u.cost ? `${u.cost.gold}/${u.cost.materials}/${u.cost.pop}` : '', u.recruitDays, u.requires.join(' '), c ? `lead ${c.leadership} pips ${JSON.stringify(c.pips)} holy ${c.holy}${c.sight ? ' sight ' + c.sight : ''}` : ''].join(' | '));
}
