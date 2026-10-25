// Judge 1: Living Monolith sim size 1 (today) vs 6 (its drawn size) under U1, defending with Thornwood's start.
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
const cinderStart = () => side([sq('aw', 'cinderWarrior', 20, 'ac'), sq('aa', 'flameArcher', 10, 'ac')], [commander('ac', U('ashChieftain'), { stats: st('ashChieftain') })]);
const mono = (size: number, withTroops: boolean) => side(withTroops ? [sq('dw', 'warden', 20, 'dm'), sq('da', 'longbowHunter', 10, 'dm')] : [], [commander('dm', U('livingMonolith'), { stats: st('livingMonolith', { size }) })]);
function rate(make: () => [BattleSideSetup, BattleSideSetup]): number { let w = 0; for (let s = 0; s < N; s++) { const [a, d] = make(); if (fightOnce(a, d, s).winner === 'attacker') w++; } return Math.round((1000 * w) / N) / 10; }
console.log(`seeds ${N}\n\n| Defender | Monolith size 1 | Monolith size 6 |\n|---|---|---|`);
console.log(`| Monolith + 20 Wardens + 10 Longbows vs Cinder start (attacker win %) | ${rate(() => [cinderStart(), mono(1, true)])} | ${rate(() => [cinderStart(), mono(6, true)])} |`);
console.log(`| Monolith alone vs Cinder start (attacker win %) | ${rate(() => [cinderStart(), mono(1, false)])} | ${rate(() => [cinderStart(), mono(6, false)])} |`);
