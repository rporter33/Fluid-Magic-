// Final staged duels for the revised roster, in the repository's own resolver (tests/sim/battle/fixtures).
// Approximations (each stated in final.md A.10):
// - trample (N2 strikes 2, size <= 2) = two extra melee weapon copies; fixtures are size 1 except the
//   mountain giant (size 4), which copies wrongly may strike, so mountain cells overstate trample a little;
// - battle-start summons (N1) = a squad present from round 1, staged leaderless: under N5 (a summoned squad
//   that breaks never drags its leader) a god leading only summons never routs, exactly as a god leading none;
// - monthly wolves (N7) are ordinary squads led by the god (leader 'god'), as addSquad makes them;
// - Fear 2 (N1 battle-start debuff) = enemy morale -2 baked into the foe's stats;
// - Iron Will (the fearless tag) = god morale 50 (no fixture debuffs the god, so this is exact here);
// - Avatar with an R4 bless = att +2, str +2 on the god.
import { commander, squad, side, statsOf, fightOnce } from '/home/user/Fluid-Magic-/tests/sim/battle/fixtures';
import type { CombatStats, BattleSideSetup } from '/home/user/Fluid-Magic-/src/sim/battle/types';
import type { WeaponDef } from '/home/user/Fluid-Magic-/src/content/types';
import type { UnitTypeId } from '/home/user/Fluid-Magic-/src/content';

type Army = { unit: UnitTypeId; count: number; led: boolean };
type Body = { id: string; base: UnitTypeId; stats: Partial<CombatStats>; army?: Army[]; fear?: number };
const T = (dmg: number, n: number): WeaponDef[] => Array.from({ length: n }, () => ({ name: 'Trample', dmg }));

const primA = { hp: 160, str: 22, att: 12, def: 6, prot: 15, mor: 30, mapSpeed: 1, tags: [] as const, weapons: [{ name: 'Crushing Blow', dmg: 12 }, ...T(2, 2)] };
const primB = { hp: 140, str: 21, att: 11, def: 6, prot: 14, mor: 30, mapSpeed: 1, tags: [] as const, weapons: [{ name: 'Crushing Blow', dmg: 10 }, ...T(2, 2)] };
const primC = { hp: 150, str: 22, att: 12, def: 6, prot: 14, mor: 30, mapSpeed: 1, tags: [] as const, weapons: [{ name: 'Crushing Blow', dmg: 11 }, ...T(2, 2)] };
const hero = { hp: 32, str: 15, att: 15, def: 15, prot: 8, mor: 20, mapSpeed: 3, tags: [] as const, weapons: [{ name: "Hero's Blade", dmg: 7 }] };
const mother = { hp: 70, str: 18, att: 12, def: 11, prot: 8, mor: 20, mapSpeed: 2, tags: [] as const, weapons: [{ name: 'Maul', dmg: 9 }] };
const hunter = { hp: 60, str: 18, att: 14, def: 13, prot: 6, mor: 18, mapSpeed: 3, tags: [] as const, weapons: [{ name: 'Hunting Spear', dmg: 7 }] };
const pyre = { hp: 55, str: 18, att: 13, def: 12, prot: 8, mor: 18, mapSpeed: 2, tags: [] as const, weapons: [{ name: 'Flaming Glaive', dmg: 7, element: 'fire' as const }] };
const phoenix = { hp: 50, str: 14, att: 15, def: 16, prot: 8, mor: 18, mapSpeed: 3, tags: ['flying'] as const, fireShield: 5, weapons: [{ name: 'Burning Talons', dmg: 8, element: 'fire' as const, armorPiercing: true }] };
const elder = { hp: 130, str: 21, att: 12, def: 8, prot: 12, mor: 22, mapSpeed: 1, tags: [] as const, regeneration: 0.1, weapons: [{ name: 'Bite', dmg: 10 }, ...T(2, 2)] };

const bodies: Body[] = [
  { id: 'Great Wyrm (today, 220)', base: 'greatWyrm', stats: {} },
  { id: 'Titan (today, 120)', base: 'titan', stats: {} },
  { id: 'Ash Colossus (today, 100)', base: 'ashColossus', stats: {} },
  { id: 'Primordial A (draft 160 stats)', base: 'greatWyrm', stats: primA, fear: 2 },
  { id: 'Primordial B (hp140 str21 att11 prot14 CB10)', base: 'greatWyrm', stats: primB, fear: 2 },
  { id: 'Primordial C (hp150 str22 att12 prot14 CB11)', base: 'greatWyrm', stats: primC, fear: 2 },
  { id: 'Elder Wyrm (170)', base: 'greatWyrm', stats: elder },
  { id: 'Ascended Hero alone', base: 'titan', stats: hero },
  { id: 'Ascended Hero alone, Avatar R4', base: 'titan', stats: { ...hero, att: 17, str: 17 } },
  { id: 'Ash Phoenix', base: 'titan', stats: phoenix },
  { id: 'Pyre Lord + 6 sprites (N1, N5)', base: 'titan', stats: pyre, army: [{ unit: 'fireSprite', count: 6, led: false }] },
  { id: 'Horned Hunter + 8 wolves (N1, N5)', base: 'titan', stats: hunter, army: [{ unit: 'wolf', count: 8, led: false }] },
  { id: 'Mother + 6 wolves led (month 3), no Iron Will', base: 'titan', stats: mother, army: [{ unit: 'wolf', count: 6, led: true }] },
  { id: 'Mother + 6 wolves led (month 3), Iron Will', base: 'titan', stats: { ...mother, mor: 50 }, army: [{ unit: 'wolf', count: 6, led: true }] },
  { id: 'Mother + 12 wolves led (month 6), no Iron Will', base: 'titan', stats: mother, army: [{ unit: 'wolf', count: 12, led: true }] },
  { id: 'Mother + 12 wolves led (month 6), Iron Will', base: 'titan', stats: { ...mother, mor: 50 }, army: [{ unit: 'wolf', count: 12, led: true }] },
  { id: 'Mother + 24 wolves led (cap), Iron Will', base: 'titan', stats: { ...mother, mor: 50 }, army: [{ unit: 'wolf', count: 24, led: true }] },
  { id: 'Titan + 20 Cinder Warriors led', base: 'titan', stats: {}, army: [{ unit: 'cinderWarrior', count: 20, led: true }] },
  { id: 'Titan + 20 Cinder Warriors led, Iron Will', base: 'titan', stats: { mor: 50 }, army: [{ unit: 'cinderWarrior', count: 20, led: true }] },
  { id: 'Hero + 20 Cinder Warriors led, Avatar R4', base: 'titan', stats: { ...hero, att: 17, str: 17 }, army: [{ unit: 'cinderWarrior', count: 20, led: true }] },
];

type Foe = { id: string; make: (fear: number) => BattleSideSetup };
const foeSquad = (ref: string, unit: UnitTypeId, n: number, fear: number) =>
  squad(ref, unit, n, { leader: 'cap', stats: fear ? { mor: statsOf(unit).mor - fear } : {} });
const cap = (fear: number) => commander('cap', 'independentCaptain', { stats: fear ? { mor: 10 - fear } : {} });
const foes: Foe[] = [
  { id: 'weak plains (11 LI, 5 archers)', make: (f) => side([foeSquad('s1', 'lightInfantry', 11, f), foeSquad('s2', 'archer', 5, f)], [cap(f)]) },
  { id: 'plains (16 LI, 8 archers)', make: (f) => side([foeSquad('s1', 'lightInfantry', 16, f), foeSquad('s2', 'archer', 8, f)], [cap(f)]) },
  { id: 'hills (20 HI)', make: (f) => side([foeSquad('s1', 'heavyInfantry', 20, f)], [cap(f)]) },
  { id: 'forest (12 wolves, 6 archers)', make: (f) => side([foeSquad('s1', 'wolf', 12, f), foeSquad('s2', 'archer', 6, f)], [cap(f)]) },
  { id: 'mountain (giant, 25 HI)', make: (f) => side([foeSquad('s0', 'giant', 1, f), foeSquad('s1', 'heavyInfantry', 25, f)], [cap(f)]) },
];

function god(b: Body): BattleSideSetup {
  const stats = statsOf(b.base, b.stats);
  const g = commander('god', b.base, { stats, script: Array.from({ length: 5 }, () => ({ kind: 'attack' as const })) });
  const squads = (b.army ?? []).map((a, i) => squad(`a${i}`, a.unit, a.count, { leader: a.led ? 'god' : null }));
  return side(squads, [g]);
}

const N = Number(process.argv[2] ?? 400);
console.log(`seeds 0..${N - 1}; cell = god side's win rate (god's HP left when it lives, share of max); "dies" = god killed`);
console.log(`| Body | ${foes.map((f) => f.id).join(' | ')} |`);
console.log(`|${'---|'.repeat(foes.length + 1)}`);
for (const b of bodies) {
  const cells: string[] = [];
  for (const f of foes) {
    let wins = 0, hpLeft = 0, alive = 0, dead = 0;
    for (let s = 0; s < N; s++) {
      const r = fightOnce(god(b), f.make(b.fear ?? 0), s);
      if (r.winner === 'attacker') wins++;
      const c = r.commanders.get('god');
      if (c && !c.dead) { alive++; hpLeft += c.hp; } else dead++;
    }
    const maxHp = statsOf(b.base, b.stats).hp;
    cells.push(`${Math.round((100 * wins) / N)}% (hp ${alive ? Math.round((100 * hpLeft) / alive / maxHp) : 0}%, dies ${Math.round((100 * dead) / N)}%)`);
  }
  console.log(`| ${b.id} | ${cells.join(' | ')} |`);
}
