// Staged duels: a lone commander with and without candidate item kits against independent
// forces, using the repo's real resolver. Item effects are folded into CombatStats the way
// setup.ts would fold them (stat deltas, a replacement weapon, regeneration, fire shield).
import { commander, squad, side, statsOf, fightOnce } from '/home/user/Fluid-Magic-/tests/sim/battle/fixtures';
import type { CombatStats, BattleSideSetup } from '/home/user/Fluid-Magic-/src/sim/battle/types';
import type { WeaponDef } from '/home/user/Fluid-Magic-/src/content/types';
import type { UnitTypeId } from '/home/user/Fluid-Magic-/src/content';

type Kit = { id: string; d?: Partial<Record<'hp' | 'str' | 'att' | 'def' | 'prot' | 'mor', number>>; weapon?: WeaponDef; regen?: number; fireShield?: number };
const flameBlade: WeaponDef = { name: 'Flame Blade', dmg: 8, element: 'fire', armorPiercing: true };
const kits: Kit[] = [
  { id: 'no items' },
  { id: 'Flame Blade (dmg 8 fire AP)', weapon: flameBlade },
  { id: 'Ember Mail (prot +4, def -1, mor +2)', d: { prot: 4, def: -1, mor: 2 } },
  { id: 'Ring of Regrowth (regen 10%)', regen: 0.1 },
  { id: 'blade + mail + regen', weapon: flameBlade, d: { prot: 4, def: -1, mor: 2 }, regen: 0.1 },
  { id: 'thug kit (blade, mail, helm +2 prot, regen, pearl att +3)', weapon: flameBlade, d: { prot: 6, def: -1, mor: 2, att: 3 }, regen: 0.1 },
];
const bases: UnitTypeId[] = ['ashChieftain', 'wardenCaptain', 'titan'] as UnitTypeId[];

type Foe = { id: string; make: () => BattleSideSetup };
const cap = () => commander('cap', 'independentCaptain' as UnitTypeId);
const foes: Foe[] = [
  { id: 'plains 12 (8 LI, 4 archers)', make: () => side([squad('s1', 'lightInfantry' as UnitTypeId, 8, { leader: 'cap' }), squad('s2', 'archer' as UnitTypeId, 4, { leader: 'cap' })], [cap()]) },
  { id: 'plains 16 (11 LI, 5 archers)', make: () => side([squad('s1', 'lightInfantry' as UnitTypeId, 11, { leader: 'cap' }), squad('s2', 'archer' as UnitTypeId, 5, { leader: 'cap' })], [cap()]) },
  { id: 'hills 20 HI', make: () => side([squad('s1', 'heavyInfantry' as UnitTypeId, 20, { leader: 'cap' })], [cap()]) },
];

function lone(base: UnitTypeId, k: Kit): BattleSideSetup {
  const b = statsOf(base);
  const over: Partial<CombatStats> = {};
  for (const [key, v] of Object.entries(k.d ?? {})) (over as Record<string, number>)[key] = (b as unknown as Record<string, number>)[key] + v;
  if (k.weapon) over.weapons = [k.weapon, ...b.weapons.filter((w) => w.range !== undefined)];
  if (k.regen) over.regeneration = b.regeneration + k.regen;
  if (k.fireShield) over.fireShield = b.fireShield + k.fireShield;
  const g = commander('god', base, { stats: statsOf(base, over), script: Array.from({ length: 5 }, () => ({ kind: 'attack' as const })) });
  return side([], [g]);
}

const N = Number(process.argv[2] ?? 300);
for (const base of bases) {
  console.log(`\n### ${base}`);
  console.log(`| kit | ${foes.map((f) => f.id).join(' | ')} |`);
  console.log(`|${'---|'.repeat(foes.length + 1)}`);
  for (const k of kits) {
    const cells: string[] = [];
    for (const f of foes) {
      let wins = 0, alive = 0;
      for (let s = 0; s < N; s++) {
        const r = fightOnce(lone(base, k), f.make(), s);
        if (r.winner === 'attacker') wins++;
        const c = r.commanders.get('god');
        if (c && !c.dead) alive++;
      }
      cells.push(`${Math.round((100 * wins) / N)}% win, ${Math.round((100 * alive) / N)}% lives`);
    }
    console.log(`| ${k.id} | ${cells.join(' | ')} |`);
  }
}
