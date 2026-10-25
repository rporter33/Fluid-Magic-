// Final measurements, part 2: Titan kits, size-6 army band, Monolith size.
// Run: cd final-measure && npx tsx final2.ts [seeds]
import { unitDef, type UnitTypeId } from './src/content';
import type { WeaponDef } from './src/content/types';
import { setProto, type StartMod } from './src/sim/battle/proto';
import type { BattleSideSetup, CombatStats } from './src/sim/battle/types';
import { commander, fightOnce, side, squad, statsOf } from './tests/sim/battle/fixtures';

const N = Number(process.argv[2] ?? 400);
const U = (id: string) => id as UnitTypeId;
const REACH = new Set(['Spear', 'Halberd', 'Hunting Spear']);
const RESIST: Record<string, Record<string, number>> = { treant: { fire: -5 }, oakheart: { fire: -3 }, salamander: { fire: 10 }, fireSprite: { fire: 10 }, flamebrand: { fire: 3 } };
function st(unit: string, extra: Partial<CombatStats> = {}): CombatStats {
  const d = unitDef(U(unit));
  const weapons: WeaponDef[] = d.weapons.map((w) => (REACH.has(w.name) ? { ...w, reach: true } : { ...w }));
  return statsOf(U(unit), { weapons, size: d.tags.includes('mounted') ? 2 : d.size, shieldDef: 0, resist: RESIST[unit] ?? {}, ...extra } as Partial<CombatStats>);
}
const plus = (unit: string, add: Partial<Record<'hp' | 'str' | 'att' | 'def' | 'prot', number>>, extra: Partial<CombatStats> = {}): Partial<CombatStats> => {
  const d = unitDef(U(unit));
  const o: Record<string, number> = {};
  for (const [k, v] of Object.entries(add)) o[k] = (d as unknown as Record<string, number>)[k] + (v ?? 0);
  return { ...o, ...extra } as Partial<CombatStats>;
};
const sq = (ref: string, unit: string, n: number, leader: string | null = null, extra: Partial<CombatStats> = {}) => squad(ref, U(unit), n, { leader, stats: st(unit, extra) });
const cap = () => commander('dc', U('independentCaptain'), { stats: st('independentCaptain') });
const hold = (ref: string, unit: string) => commander(ref, U(unit), { stats: st(unit), script: Array.from({ length: 5 }, () => ({ kind: 'hold' as const })) });
const indeps = () => side([sq('dl', 'lightInfantry', 11, 'dc'), sq('dr', 'archer', 5, 'dc')], [cap()]);
const hi = () => side([sq('dh', 'heavyInfantry', 20, 'dc')], [cap()]);
const cinderStart = () => side([sq('dw', 'cinderWarrior', 20, 'dk'), sq('da', 'flameArcher', 10, 'dk')], [hold('dk', 'ashChieftain')]);
const god = (unit: string, x: Partial<CombatStats>, army: [string, number][] = []) =>
  side(army.map(([u, n], i) => sq(`a${i}`, u, n, 'god')), [commander('god', U(unit), { stats: st(unit, x), script: Array.from({ length: 5 }, () => ({ kind: 'attack' as const })) })]);
function rate(make: () => [BattleSideSetup, BattleSideSetup]): number {
  let w = 0;
  for (let s = 0; s < N; s++) { const [a, d] = make(); if (fightOnce(a, d, s).winner === 'attacker') w++; }
  return Math.round((1000 * w) / N) / 10;
}
const FINAL = { sizeMelee: true, sizeRanged: true, reach: true, resist: true };
const IVY: StartMod = { side: 'attacker', target: 'enemySquad', mods: [{ stat: 'def', delta: -3 }, { stat: 'att', delta: -1 }], untilRound: 5, source: 'entangle' };
const unq: WeaponDef = { name: 'The Unquenched', dmg: 9, element: 'fire', armorPiercing: true, strikes: 2 };
const brand: WeaponDef = { name: 'Brand of Ash', dmg: 6, element: 'fire', strikes: 2 };
console.log(`seeds ${N}; final unit rules\n\n| Titan kit (alone, Attack) | 16 indeps | 20 Heavy Infantry | Cinder start |\n|---|---|---|---|`);
const kits: [string, Partial<CombatStats>, StartMod[]][] = [
  ['none', {}, []],
  ['Brand of Ash + Cinder Mantle (hp +6, fire shield 3)', { ...plus('titan', { hp: 6 }), fireShield: 3, weapons: [brand] }, []],
  ['Red full: The Unquenched + Cinder Mantle + Burning Pearl', { ...plus('titan', { hp: 6, att: 2 }), fireShield: 3, weapons: [unq] }, []],
  ['Heartwood Aegis (prot +3, hp +10, thorns 3)', { ...plus('titan', { prot: 3, hp: 10 }), fireShield: 3 }, []],
  ['Green full: Aegis + Ring + Barkskin + Crown of the Ivy King', { ...plus('titan', { prot: 4, hp: 10 }), fireShield: 3, regeneration: 0.05 }, [IVY]],
];
for (const [n, x, m] of kits) {
  setProto({ ...FINAL, startMods: m });
  console.log(`| ${n} | ${rate(() => [god('titan', x), indeps()])} | ${rate(() => [god('titan', x), hi()])} | ${rate(() => [god('titan', x), cinderStart()])} |`);
}
console.log('\n| Size-6 god leading troops (Attack) vs Cinder start | today | U1 (final) |\n|---|---|---|');
const row = (label: string, make: () => [BattleSideSetup, BattleSideSetup]) => {
  setProto({ startMods: [] });
  const a = rate(make);
  setProto({ ...FINAL, startMods: [] });
  console.log(`| ${label} | ${a} | ${rate(make)} |`);
};
row('Great Wyrm + 20 Wardens', () => [god('greatWyrm', {}, [['warden', 20]]), cinderStart()]);
row('Great Wyrm + Ring + Amulet + 20 Wardens', () => [god('greatWyrm', { ...plus('greatWyrm', { prot: 1 }), regeneration: 0.05 }, [['warden', 20]]), cinderStart()]);
row('Titan + 20 Cinder Warriors vs 20 Heavy Infantry', () => [god('titan', {}, [['cinderWarrior', 20]]), hi()]);
