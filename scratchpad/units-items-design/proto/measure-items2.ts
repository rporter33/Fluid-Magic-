// Final-list kits on the Titan and the Great Wyrm (final unit rules on). Run: npx tsx measure-items2.ts [seeds]
import { unitDef, type UnitTypeId } from './src/content';
import type { WeaponDef } from './src/content/types';
import { setProto } from './src/sim/battle/proto';
import type { BattleSideSetup, CombatStats } from './src/sim/battle/types';
import { commander, fightOnce, side, squad, statsOf } from './tests/sim/battle/fixtures';
const N = Number(process.argv[2] ?? 400);
const U = (id: string) => id as UnitTypeId;
setProto({ sizeMelee: true, sizeRanged: true, reach: true, resist: true });
const st = (u: string, x: Partial<CombatStats> = {}) => statsOf(U(u), { size: unitDef(U(u)).tags.includes('mounted') ? 2 : unitDef(U(u)).size, ...x });
const plus = (u: string, d: Record<string, number>): Partial<CombatStats> => { const b = st(u) as unknown as Record<string, number>; const o: Record<string, number> = {}; for (const [k, v] of Object.entries(d)) o[k] = (b[k] ?? 0) + v; return o as Partial<CombatStats>; };
const god = (u: string, x: Partial<CombatStats>) => side([], [commander('god', U(u), { stats: st(u, x), script: Array.from({ length: 5 }, () => ({ kind: 'attack' as const })) })]);
const cap = () => commander('dc', U('independentCaptain'), { stats: st('independentCaptain') });
const indeps = (li: number, ar: number) => side([squad('dl', U('lightInfantry'), li, { leader: 'dc', stats: st('lightInfantry') }), squad('dr', U('archer'), ar, { leader: 'dc', stats: st('archer') })], [cap()]);
const hi = () => side([squad('dh', U('heavyInfantry'), 20, { leader: 'dc', stats: st('heavyInfantry') })], [cap()]);
const cinder = () => side([squad('dw', U('cinderWarrior'), 20, { leader: 'dc2', stats: st('cinderWarrior') }), squad('da', U('flameArcher'), 10, { leader: 'dc2', stats: st('flameArcher') })], [commander('dc2', U('ashChieftain'), { stats: st('ashChieftain') })]);
const rate = (a: () => BattleSideSetup, d: () => BattleSideSetup) => { let w = 0; for (let s = 0; s < N; s++) if (fightOnce(a(), d(), s).winner === 'attacker') w++; return Math.round((1000 * w) / N) / 10; };
const unq: WeaponDef = { name: 'The Unquenched', dmg: 9, element: 'fire', armorPiercing: true, strikes: 2 };
const titanKits: [string, Partial<CombatStats>][] = [
  ['none', {}],
  ['Charm of Warding (def +1)', plus('titan', { def: 1 })],
  ['Barkskin Amulet (prot +1)', plus('titan', { prot: 1 })],
  ['Heartwood Aegis (prot +3, hp +10, thorns 3)', { ...plus('titan', { prot: 3, hp: 10 }), fireShield: 3 }],
  ['Aegis + Ring of Regrowth + The Unquenched', { ...plus('titan', { prot: 3, hp: 10 }), fireShield: 3, regeneration: 0.05, weapons: [unq] }],
];
console.log(`seeds ${N}\n\n| Titan kit | 16 indeps | 20 Heavy Infantry | Cinder start |\n|---|---|---|---|`);
for (const [n, x] of titanKits) console.log(`| ${n} | ${rate(() => god('titan', x), () => indeps(11, 5))} | ${rate(() => god('titan', x), hi)} | ${rate(() => god('titan', x), cinder)} |`);
const wyrmKits: [string, Partial<CombatStats>][] = [
  ['none', {}],
  ['Crown of the Ivy King (regen 5%; booster and Ivy Grasp not modeled)', { regeneration: 0.05 }],
  ['Ivy Crown + Ring of Regrowth + Barkskin Amulet (regen 10%, prot +1)', { ...plus('greatWyrm', { prot: 1 }), regeneration: 0.1 }],
];
console.log(`\n| Great Wyrm kit | 16 indeps | 20 Heavy Infantry | Cinder start |\n|---|---|---|---|`);
for (const [n, x] of wyrmKits) console.log(`| ${n} | ${rate(() => god('greatWyrm', x), () => indeps(11, 5))} | ${rate(() => god('greatWyrm', x), hi)} | ${rate(() => god('greatWyrm', x), cinder)} |`);
