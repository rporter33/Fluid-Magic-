// Staged duels: candidate pretender bodies (alone or with signature summons) against
// independent forces, using the repo's real resolver. Approximations: trample = extra melee
// weapon copies (no size filter; targets are size 1); battle-start summon = squad present
// from round 1; fear = enemy morale -2; heat aura = a cast every round (fatigue ~0).
import { commander, squad, side, statsOf, fightOnce } from '/home/user/Fluid-Magic-/tests/sim/battle/fixtures';
import type { CombatStats, BattleSideSetup } from '/home/user/Fluid-Magic-/src/sim/battle/types';
import type { BattleSpellDef } from '/home/user/Fluid-Magic-/src/content/spells/types';
import type { WeaponDef } from '/home/user/Fluid-Magic-/src/content/types';
import type { UnitTypeId } from '/home/user/Fluid-Magic-/src/content';

type Body = { id: string; base: UnitTypeId; stats: Partial<CombatStats>; summon?: { unit: UnitTypeId; count: number }; fear?: number; heat?: boolean };
const T = (dmg: number, n: number): WeaponDef[] => Array.from({ length: n }, () => ({ name: 'Trample', dmg }));

const bodies: Body[] = [
  { id: 'greatWyrm (today)', base: 'greatWyrm', stats: {} },
  { id: 'greatWyrm +trample3x2', base: 'greatWyrm', stats: { weapons: [{ name: 'Breath', dmg: 12, range: 3, ammo: 5 }, { name: 'Bite', dmg: 10 }, ...T(3, 2)] } },
  { id: 'ashColossus +trample2x2', base: 'ashColossus', stats: { weapons: [{ name: 'Burning Fists', dmg: 6, element: 'fire' }, ...T(2, 2)] } },
  { id: 'ashColossus +trample3x2', base: 'ashColossus', stats: { weapons: [{ name: 'Burning Fists', dmg: 6, element: 'fire' }, ...T(3, 2)] } },
  { id: 'primordial v2', base: 'greatWyrm', stats: { hp: 180, str: 24, att: 12, def: 6, prot: 16, mor: 30, mapSpeed: 1, tags: [], weapons: [{ name: 'Crushing Blow', dmg: 12 }, ...T(3, 2)] }, fear: 2 },
  { id: 'primordial v3', base: 'greatWyrm', stats: { hp: 160, str: 22, att: 12, def: 6, prot: 15, mor: 30, mapSpeed: 1, tags: [], weapons: [{ name: 'Crushing Blow', dmg: 12 }, ...T(2, 2)] }, fear: 2 },
  { id: 'elderWyrm v2', base: 'greatWyrm', stats: { hp: 140, str: 22, att: 12, def: 8, prot: 13, mor: 22, mapSpeed: 1, tags: [], regeneration: 0.1, weapons: [{ name: 'Bite', dmg: 10 }, ...T(3, 2)] } },
  { id: 'elderWyrm v3', base: 'greatWyrm', stats: { hp: 130, str: 21, att: 12, def: 8, prot: 12, mor: 22, mapSpeed: 1, tags: [], regeneration: 0.1, weapons: [{ name: 'Bite', dmg: 10 }, ...T(2, 2)] } },
  { id: 'ashPhoenix v2', base: 'titan', stats: { hp: 48, str: 14, att: 14, def: 15, prot: 6, mor: 18, mapSpeed: 3, tags: ['flying'], fireShield: 4, weapons: [{ name: 'Burning Talons', dmg: 7, element: 'fire', armorPiercing: true }] } },
  { id: 'livingFlame v2 (heat 5x5)', base: 'titan', stats: { hp: 60, str: 14, att: 13, def: 14, prot: 3, mor: 30, mapSpeed: 3, tags: ['flying'], fireShield: 6, weapons: [{ name: 'Flame Lash', dmg: 6, element: 'fire', armorPiercing: true }] }, heat: true },
  { id: 'hornedHunter +8 wolves (summons cannot drag)', base: 'titan', stats: { hp: 60, str: 18, att: 14, def: 13, prot: 6, mor: 18, mapSpeed: 3, weapons: [{ name: 'Hunting Spear', dmg: 7 }] }, summon: { unit: 'wolf', count: 8 } },
  { id: 'pyreLord +6 sprites', base: 'titan', stats: { hp: 55, str: 18, att: 13, def: 12, prot: 8, mor: 18, weapons: [{ name: 'Flaming Glaive', dmg: 7, element: 'fire' }] }, summon: { unit: 'fireSprite', count: 6 } },
  { id: 'briarKing v2', base: 'titan', stats: { hp: 80, str: 17, att: 12, def: 10, prot: 15, mor: 22, mapSpeed: 1, fireShield: 3, weapons: [{ name: 'Thorned Maul', dmg: 8 }] } },
  { id: 'motherOfBeasts +12 wolves (month 6)', base: 'titan', stats: { hp: 70, str: 18, att: 12, def: 11, prot: 8, mor: 20, mapSpeed: 2, weapons: [{ name: 'Maul', dmg: 9 }] }, summon: { unit: 'wolf', count: 12 } },
];

type Foe = { id: string; make: (fear: number) => BattleSideSetup };
const foeSquad = (ref: string, unit: UnitTypeId, n: number, fear: number) =>
  squad(ref, unit, n, { leader: 'cap', stats: fear ? { mor: statsOf(unit).mor - fear } : {} });
const cap = (fear: number) => commander('cap', 'independentCaptain', { stats: fear ? { mor: 10 - fear } : {} });
const foes: Foe[] = [
  { id: 'plains 16 (11 LI, 5 archers)', make: (f) => side([foeSquad('s1', 'lightInfantry', 11, f), foeSquad('s2', 'archer', 5, f)], [cap(f)]) },
  { id: 'plains 24 (16 LI, 8 archers)', make: (f) => side([foeSquad('s1', 'lightInfantry', 16, f), foeSquad('s2', 'archer', 8, f)], [cap(f)]) },
  { id: 'hills 20 HI', make: (f) => side([foeSquad('s1', 'heavyInfantry', 20, f)], [cap(f)]) },
  { id: 'forest 18 (12 wolves, 6 archers)', make: (f) => side([foeSquad('s1', 'wolf', 12, f), foeSquad('s2', 'archer', 6, f)], [cap(f)]) },
  { id: 'mountain 26 (giant + 25 HI)', make: (f) => side([foeSquad('s0', 'giant', 1, f), foeSquad('s1', 'heavyInfantry', 25, f)], [cap(f)]) },
];

const heat: BattleSpellDef = { kind: 'battle', id: 'heatAura', name: 'Heat', color: 'R', level: 1, requirement: '', holy: 0, description: '', fatigue: 0.0001, carriedMana: {},
  effects: [{ kind: 'damage', amount: 5, element: 'fire', targets: { kind: 'area', count: 5 } }] };

function god(b: Body): BattleSideSetup {
  const stats = statsOf(b.base, b.stats);
  const script = b.heat
    ? [{ kind: 'attack' as const }, ...Array.from({ length: 4 }, () => ({ kind: 'cast' as const, spellId: 'heatAura' }))]
    : Array.from({ length: 5 }, () => ({ kind: 'attack' as const }));
  const g = commander('god', b.base, { stats, script, pips: b.heat ? { R: 1 } : {}, spells: b.heat ? [heat] : [] });
  const squads = b.summon ? [squad('sum', b.summon.unit, b.summon.count, { leader: b.id.includes('cannot drag') || b.id.includes('month') ? null : 'god' })] : [];
  return side(squads, [g]);
}

const N = Number(process.argv[2] ?? 400);
const rows: string[] = [];
for (const b of bodies) {
  const cells: string[] = [];
  for (const f of foes) {
    let wins = 0, hpLeft = 0, rounds = 0, alive = 0;
    for (let s = 0; s < N; s++) {
      const r = fightOnce(god(b), f.make(b.fear ?? 0), s);
      if (r.winner === 'attacker') wins++;
      const c = r.commanders.get('god');
      if (c && !c.dead) { alive++; hpLeft += c.hp; }
      rounds += r.rounds;
    }
    const maxHp = statsOf(b.base, b.stats).hp;
    cells.push(`${Math.round((100 * wins) / N)}% win, ${Math.round((100 * alive) / N)}% lives, hp ${alive ? Math.round((100 * hpLeft) / alive / maxHp) : 0}%, ${(rounds / N).toFixed(1)}r`);
  }
  rows.push(`| ${b.id} | ${cells.join(' | ')} |`);
}
console.log(`| body | ${foes.map((f) => f.id).join(' | ')} |`);
console.log(`|${'---|'.repeat(foes.length + 1)}`);
console.log(rows.join('\n'));
