// ChassisDef.aiPower calibration (final.md A.11): the largest number n of Independent Light Infantry
// (led by an Independent Captain) that the body, with its battle-start summons and Fear, beats in at
// least 50% of 200 seeds; aiPower = n x the Light Infantry troop term of docs/08's armyPower.
import { commander, squad, side, statsOf, fightOnce } from '/home/user/Fluid-Magic-/tests/sim/battle/fixtures';
import type { CombatStats, BattleSideSetup } from '/home/user/Fluid-Magic-/src/sim/battle/types';
import type { WeaponDef } from '/home/user/Fluid-Magic-/src/content/types';
import { unitDef, type UnitTypeId } from '/home/user/Fluid-Magic-/src/content';
const T = (dmg: number, n: number): WeaponDef[] => Array.from({ length: n }, () => ({ name: 'Trample', dmg }));
type Body = { id: string; base: UnitTypeId; stats: Partial<CombatStats>; summon?: [UnitTypeId, number]; fear?: number };
const bodies: Body[] = [
  { id: 'oracle', base: 'oracle', stats: {} },
  { id: 'titan', base: 'titan', stats: {} },
  { id: 'greatWyrm', base: 'greatWyrm', stats: {} },
  { id: 'livingMonolith', base: 'livingMonolith', stats: {} },
  { id: 'ascendedHero', base: 'titan', stats: { hp: 32, str: 15, att: 15, def: 15, prot: 8, mor: 20, mapSpeed: 3, weapons: [{ name: "Hero's Blade", dmg: 7 }] } },
  { id: 'primordial', base: 'greatWyrm', stats: { hp: 150, str: 22, att: 12, def: 6, prot: 14, mor: 30, mapSpeed: 1, tags: [], weapons: [{ name: 'Crushing Blow', dmg: 11 }, ...T(2, 2)] }, fear: 2 },
  { id: 'ashColossus', base: 'ashColossus', stats: {} },
  { id: 'ashPhoenix', base: 'titan', stats: { hp: 50, str: 14, att: 15, def: 16, prot: 8, mor: 18, mapSpeed: 3, tags: ['flying'], fireShield: 5, weapons: [{ name: 'Burning Talons', dmg: 8, element: 'fire', armorPiercing: true }] } },
  { id: 'pyreLord', base: 'titan', stats: { hp: 55, str: 18, att: 13, def: 12, prot: 8, mor: 18, weapons: [{ name: 'Flaming Glaive', dmg: 7, element: 'fire' }] }, summon: ['fireSprite', 6] },
  { id: 'cinderIdol', base: 'livingMonolith', stats: { hp: 180, str: 14, def: 6, prot: 22 } },
  { id: 'emberHierophant', base: 'oracle', stats: { hp: 14, def: 11 } },
  { id: 'wildSpirit', base: 'wildSpirit', stats: {} },
  { id: 'worldTree', base: 'livingMonolith', stats: { hp: 250, str: 20, def: 4, prot: 20, regeneration: 0.1, weapons: [{ name: 'Lashing Boughs', dmg: 8 }] } },
  { id: 'hornedHunter', base: 'titan', stats: { hp: 60, str: 18, att: 14, def: 13, prot: 6, mor: 18, mapSpeed: 3, weapons: [{ name: 'Hunting Spear', dmg: 7 }] }, summon: ['wolf', 8] },
  { id: 'elderWyrm', base: 'greatWyrm', stats: { hp: 130, str: 21, att: 12, def: 8, prot: 12, mor: 22, mapSpeed: 1, tags: [], regeneration: 0.1, weapons: [{ name: 'Bite', dmg: 10 }, ...T(2, 2)] } },
  { id: 'motherOfBeasts', base: 'titan', stats: { hp: 70, str: 18, att: 12, def: 11, prot: 8, mor: 20, mapSpeed: 2, weapons: [{ name: 'Maul', dmg: 9 }] } },
];
const li = unitDef('lightInfantry');
const term = (li.hp + li.att + li.def + li.prot) / 4;
function rate(b: Body, n: number, seeds: number): number {
  let wins = 0;
  for (let s = 0; s < seeds; s++) {
    const stats = statsOf(b.base, b.stats);
    const immobile = stats.tags.includes('immobile');
    const g = commander('god', b.base, { stats, script: Array.from({ length: 5 }, () => ({ kind: immobile ? 'hold' as const : 'attack' as const })) });
    const sq = b.summon ? [squad('sum', b.summon[0], b.summon[1], { leader: null })] : [];
    const godSide = side(sq, [g]);
    const f = b.fear ?? 0;
    const foe = side([squad('s1', 'lightInfantry', n, { leader: 'cap', stats: f ? { mor: li.mor - f } : {} })], [commander('cap', 'independentCaptain', { stats: f ? { mor: 10 - f } : {} })]);
    // Immobile gods are fought where they stand: they defend; the rest attack.
    const r = immobile ? fightOnce(foe, godSide, s) : fightOnce(godSide, foe, s);
    if ((immobile ? r.winner === 'defender' : r.winner === 'attacker')) wins++;
  }
  return wins / seeds;
}
console.log(`Light Infantry troop term (docs/08): ${term}`);
console.log('| Chassis | n (LI beaten in >= 50% of 200 seeds) | aiPower = n x term |');
console.log('|---|---|---|');
for (const b of bodies) {
  let lo = 0, hi = 1;
  while (rate(b, hi, 200) >= 0.5 && hi < 512) { lo = hi; hi *= 2; }
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (rate(b, mid, 200) >= 0.5) lo = mid; else hi = mid; }
  console.log(`| ${b.id} | ${lo} | ${Math.round(lo * term)} |`);
}
