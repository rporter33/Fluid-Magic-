import { UNITS } from '/home/user/Fluid-Magic-/src/content/units';
import { BATTLE_SPELLS } from '/home/user/Fluid-Magic-/src/content/spells';
for (const u of Object.values(UNITS) as any[]) console.log([u.id, u.size, u.prot, (u.tags ?? []).join('+'), (u.weapons ?? []).map((w: any) => `${w.name}${w.range ? '(r' + w.range + ',a' + w.ammo + ')' : ''}${w.element ? '[' + w.element + ']' : ''}${w.firstRoundBonus ? '{fr' + w.firstRoundBonus + '}' : ''}`).join(', ')].join(' | '));
console.log(BATTLE_SPELLS.map((s: any) => `${s.id}:${s.color}${s.level}`).join(' '));
