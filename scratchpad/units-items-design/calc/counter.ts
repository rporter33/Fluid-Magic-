// Does Fluid Magic's M1 magic answer an item-kitted super combatant? A Great Wyrm with
// +2 prot and 5% regeneration attacks Thornwood's starting army, with and without an Elder
// Druid casting Swarm (armor-negating hornets), and Cinder Horde's army with and without a
// Cinder Magus casting Ember Dart (armor piercing).
import { commander, squad, side, statsOf, fightOnce } from '/home/user/Fluid-Magic-/tests/sim/battle/fixtures';
import type { BattleSideSetup } from '/home/user/Fluid-Magic-/src/sim/battle/types';
import type { UnitTypeId } from '/home/user/Fluid-Magic-/src/content';
import { BATTLE_SPELLS } from '/home/user/Fluid-Magic-/src/content/spells';
const U = (s: string) => s as UnitTypeId;
const spell = (id: string) => { const s = BATTLE_SPELLS.find((x) => x.id === id); if (!s) throw new Error(id); return s; };
function wyrm(prot: number, regen: number): BattleSideSetup {
  const b = statsOf(U('greatWyrm'));
  return side([], [commander('god', U('greatWyrm'), { stats: statsOf(U('greatWyrm'), { prot: b.prot + prot, regeneration: b.regeneration + regen }), script: Array.from({ length: 5 }, () => ({ kind: 'attack' as const })) })]);
}
const cast = Array.from({ length: 5 }, () => ({ kind: 'cast' as const }));
const foes: { id: string; make: () => BattleSideSetup }[] = [
  { id: 'Thornwood army', make: () => side([squad('s1', U('warden'), 20, { leader: 'cap' }), squad('s2', U('longbowHunter'), 10, { leader: 'cap' })], [commander('cap', U('wardenCaptain'))]) },
  { id: 'same + Elder Druid (Swarm, 3 G carried)', make: () => side([squad('s1', U('warden'), 20, { leader: 'cap' }), squad('s2', U('longbowHunter'), 10, { leader: 'cap' })], [commander('cap', U('wardenCaptain')), commander('dru', U('elderDruid'), { spells: [spell('swarm')], carriedMana: { G: 3 }, script: cast })]) },
  { id: 'Cinder army', make: () => side([squad('s1', U('cinderWarrior'), 20, { leader: 'cap' }), squad('s2', U('flameArcher'), 10, { leader: 'cap' })], [commander('cap', U('ashChieftain'))]) },
  { id: 'same + Cinder Magus (Ember Dart)', make: () => side([squad('s1', U('cinderWarrior'), 20, { leader: 'cap' }), squad('s2', U('flameArcher'), 10, { leader: 'cap' })], [commander('cap', U('ashChieftain')), commander('mag', U('cinderMagus'), { spells: [spell('emberDart')], script: cast })]) },
];
const N = Number(process.argv[2] ?? 300);
console.log(`| Great Wyrm | ${foes.map((f) => f.id).join(' | ')} |`);
console.log(`|${'---|'.repeat(foes.length + 1)}`);
for (const [id, p, r] of [['no items', 0, 0], ['+2 prot, regen 5%', 2, 0.05]] as [string, number, number][]) {
  const cells = foes.map((f) => { let w = 0; for (let s = 0; s < N; s++) if (fightOnce(wyrm(p, r), f.make(), s).winner === 'attacker') w++; return `${Math.round((100 * w) / N)}%`; });
  console.log(`| ${id} | ${cells.join(' | ')} |`);
}
