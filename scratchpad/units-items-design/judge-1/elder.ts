// Judge 1: Elder Wyrm, World Tree-like and Wild Spirit bodies with Ring of Regrowth (natural regen + item regen).
// Imports the units-items proto copy read-only; run from the proto dir: npx tsx ../judge-1/elder.ts 400
import { unitDef, type UnitTypeId } from '../proto/src/content';
import type { WeaponDef } from '../proto/src/content/types';
import { setProto } from '../proto/src/sim/battle/proto';
import type { BattleSideSetup, CombatStats } from '../proto/src/sim/battle/types';
import { commander, fightOnce, side, squad, statsOf } from '../proto/tests/sim/battle/fixtures';
const N = Number(process.argv[2] ?? 400);
const U = (id: string) => id as UnitTypeId;
setProto({ sizeMelee: true, sizeRanged: true, reach: true, resist: true });
const REACH = new Set(['Spear', 'Halberd']);
function st(unit: string, extra: Partial<CombatStats> = {}): CombatStats {
  const d = unitDef(U(unit));
  const weapons: WeaponDef[] = d.weapons.map((w) => (REACH.has(w.name) ? { ...w, reach: true } : { ...w }));
  return statsOf(U(unit), { weapons, size: d.tags.includes('mounted') ? 2 : d.size, resist: {}, ...extra });
}
const sq = (ref: string, unit: string, n: number, leader: string | null = null) => squad(ref, U(unit), n, { leader, stats: st(unit) });
const god = (stats: CombatStats) => side([], [commander('god', U('greatWyrm'), { stats, script: Array.from({ length: 5 }, () => ({ kind: 'attack' as const })) })]);
const cinderStart = () => side([sq('dw', 'cinderWarrior', 20, 'dc'), sq('da', 'flameArcher', 10, 'dc')], [commander('dc', U('ashChieftain'), { stats: st('ashChieftain') })]);
const thornStart = () => side([sq('dw', 'warden', 20, 'dc'), sq('da', 'longbowHunter', 10, 'dc')], [commander('dc', U('wardenCaptain'), { stats: st('wardenCaptain') })]);
const TRAMPLE: WeaponDef = { name: 'Trample', dmg: 2, strikes: 2, maxTargetSize: 2 };
const elder = (o: Partial<CombatStats> = {}): CombatStats => st('greatWyrm', { hp: 130, str: 21, att: 12, def: 8, prot: 12, mor: 22, size: 6, mapSpeed: 1, tags: [], weapons: [{ name: 'Bite', dmg: 10 }, TRAMPLE], regeneration: 0.1, ...o });
const spirit = (o: Partial<CombatStats> = {}): CombatStats => st('greatWyrm', { hp: 30, str: 10, att: 10, def: 16, prot: 4, mor: 10, size: 2, mapSpeed: 2, tags: [], weapons: [{ name: 'Claws', dmg: 5 }], regeneration: 0.1, ...o });
function rate(make: () => [BattleSideSetup, BattleSideSetup]): number { let w = 0; for (let s = 0; s < N; s++) { const [a, d] = make(); if (fightOnce(a, d, s).winner === 'attacker') w++; } return Math.round((1000 * w) / N) / 10; }
const rows: [string, CombatStats][] = [
  ['Elder Wyrm, no items', elder()],
  ['Elder Wyrm + Barkskin Amulet (prot +1)', elder({ prot: 13 })],
  ['Elder Wyrm + Ring of Regrowth (regen 10% + 5%)', elder({ regeneration: 0.15 })],
  ['Elder Wyrm + Ring + Barkskin Amulet', elder({ regeneration: 0.15, prot: 13 })],
  ['Elder Wyrm + Ring + Crown of the Ivy King hp+10 (no Ivy Grasp modeled) + Amulet? (head+2 charms: Crown, Ring, Amulet)', elder({ regeneration: 0.15, prot: 13, hp: 140 })],
  ['Wild Spirit, no items', spirit()],
  ['Wild Spirit + Ring + Amulet', spirit({ regeneration: 0.15, prot: 5 })],
];
console.log(`seeds ${N}\n\n| God alone (Attack) | vs Cinder start | vs Thornwood start |\n|---|---|---|`);
for (const [name, s] of rows) console.log(`| ${name} | ${rate(() => [god(s), cinderStart()])} | ${rate(() => [god(s), thornStart()])} |`);
