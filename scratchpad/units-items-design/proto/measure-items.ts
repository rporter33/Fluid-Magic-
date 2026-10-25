// Measures candidate M1 items, folded into CombatStats as setup would fold them. Uses the
// final unit rules (size draws, reach, resistances on).
// Run: cd proto && npx tsx measure-items.ts [seeds]
import { unitDef, type UnitTypeId } from './src/content';
import type { WeaponDef } from './src/content/types';
import { setProto } from './src/sim/battle/proto';
import type { BattleSideSetup, CombatStats } from './src/sim/battle/types';
import { commander, fightOnce, side, squad, statsOf } from './tests/sim/battle/fixtures';

const N = Number(process.argv[2] ?? 400);
const U = (id: string) => id as UnitTypeId;
setProto({ sizeMelee: true, sizeRanged: true, reach: true, resist: true });
const REACH = new Set(['Spear', 'Halberd']);
const RES: Record<string, Record<string, number>> = { treant: { fire: -5 }, oakheart: { fire: -3 }, salamander: { fire: 10 }, fireSprite: { fire: 10 }, flamebrand: { fire: 3 } };

function st(unit: string, extra: Partial<CombatStats> = {}): CombatStats {
  const d = unitDef(U(unit));
  const weapons: WeaponDef[] = d.weapons.map((w) => (REACH.has(w.name) ? { ...w, reach: true } : { ...w }));
  return statsOf(U(unit), { weapons, size: d.tags.includes('mounted') ? 2 : d.size, resist: RES[unit] ?? {}, ...extra });
}
const plus = (unit: string, d: Partial<Record<'hp' | 'str' | 'att' | 'def' | 'prot' | 'mor' | 'prec', number>>): Partial<CombatStats> => {
  const b = st(unit) as unknown as Record<string, number>;
  const o: Record<string, number> = {};
  for (const [k, v] of Object.entries(d)) o[k] = (b[k] ?? 0) + (v ?? 0);
  return o as Partial<CombatStats>;
};
const sq = (ref: string, unit: string, n: number, leader: string | null = null, extra: Partial<CombatStats> = {}, row?: 'front' | 'middle' | 'rear') =>
  squad(ref, U(unit), n, { leader, stats: st(unit, extra), ...(row ? { row } : {}) });
const cmd = (ref: string, unit: string, attack: boolean, extra: Partial<CombatStats> = {}) =>
  commander(ref, U(unit), { stats: st(unit, extra), script: Array.from({ length: 5 }, () => ({ kind: attack ? ('attack' as const) : ('hold' as const) })) });

function rate(make: () => [BattleSideSetup, BattleSideSetup]): string {
  let w = 0;
  for (let s = 0; s < N; s++) {
    const [a, d] = make();
    if (fightOnce(a, d, s).winner === 'attacker') w++;
  }
  return `${Math.round((1000 * w) / N) / 10}`;
}
const thornStart = () => side([sq('dw', 'warden', 20, 'dc'), sq('da', 'longbowHunter', 10, 'dc')], [cmd('dc', 'wardenCaptain', false)]);
const cinderStart = () => side([sq('dw', 'cinderWarrior', 20, 'dc'), sq('da', 'flameArcher', 10, 'dc')], [cmd('dc', 'ashChieftain', false)]);
const hills20 = () => side([sq('dh', 'heavyInfantry', 20, 'dc')], [cmd('dc', 'independentCaptain', false)]);
const indeps = (li: number, ar: number) => () => side([sq('dl', 'lightInfantry', li, 'dc'), sq('dr', 'archer', ar, 'dc')], [cmd('dc', 'independentCaptain', false)]);

console.log(`seeds ${N}; final unit rules on\n`);
console.log('### Army items: Ash Chieftain leading 20 Cinder Warriors and 10 Flame Archers (attacker)\n');
console.log('| Item | vs Thornwood start | vs 20 Heavy Infantry |\n|---|---|---|');
const chief = (mor = 0, cw: Partial<CombatStats> = {}, wolves = 0) => () =>
  side(
    [sq('aw', 'cinderWarrior', 20, 'ac', { ...plus('cinderWarrior', { mor }), ...cw }), sq('aa', 'flameArcher', 10, 'ac', plus('flameArcher', { mor })), ...(wolves ? [sq('ah', 'wolf', wolves, 'ac')] : [])],
    [cmd('ac', 'ashChieftain', false)],
  );
for (const [name, make] of [
  ['none', chief()],
  ['Pendant of Fury (inspire 1)', chief(1)],
  ['Standard of Kharnath (inspire 2)', chief(2)],
  ['Horn of the Burning Host (Blood Fury on the warriors: att +2, str +3, def -2)', chief(0, plus('cinderWarrior', { att: 2, str: 3, def: -2 }))],
  ['Horn of the Wild Hunt (4 Wolves join)', chief(0, {}, 4)],
] as const) {
  console.log(`| ${name} | ${rate(() => [make(), thornStart()])} | ${rate(() => [make(), hills20()])} |`);
}

console.log('\n### Titan alone (Attack script), attacker\n');
console.log('| Kit | 12 indeps (8 LI, 4 Archer) | 16 indeps (11 LI, 5 Archer) | 20 Heavy Infantry |\n|---|---|---|---|');
const titan = (extra: Partial<CombatStats>) => () => side([], [cmd('god', 'titan', true, extra)]);
const brand: WeaponDef = { name: 'Brand of Ash', dmg: 6, element: 'fire', strikes: 2 };
const unq: WeaponDef = { name: 'The Unquenched', dmg: 9, element: 'fire', armorPiercing: true, strikes: 2 };
for (const [name, extra] of [
  ['none (Great Sword 8)', {}],
  ['Flame Blade (dmg 7, fire)', { weapons: [{ name: 'Flame Blade', dmg: 7, element: 'fire' }] }],
  ['Brand of Ash (dmg 6 fire, strikes 2)', { weapons: [brand] }],
  ['Cinder Mail (hp +6, fire shield 3)', { ...plus('titan', { hp: 6 }), fireShield: 3 }],
  ['Brand of Ash + Cinder Mail', { ...plus('titan', { hp: 6 }), fireShield: 3, weapons: [brand] }],
  ['The Unquenched (dmg 9 fire AP strikes 2)', { weapons: [unq] }],
  ['The Unquenched + Cinder Mail + Burning Pearl (att +2)', { ...plus('titan', { hp: 6, att: 2 }), fireShield: 3, weapons: [unq] }],
] as const) {
  console.log(`| ${name} | ${rate(() => [titan(extra)(), indeps(8, 4)()])} | ${rate(() => [titan(extra)(), indeps(11, 5)()])} | ${rate(() => [titan(extra)(), hills20()])} |`);
}

console.log('\n### Great Wyrm alone (Attack script), attacker\n');
console.log('| Kit | vs Cinder start | vs Thornwood start | vs 20 Heavy Infantry |\n|---|---|---|---|');
const wyrm = (extra: Partial<CombatStats>) => () => side([], [cmd('god', 'greatWyrm', true, extra)]);
for (const [name, extra] of [
  ['none', {}],
  ['Barkskin Amulet (prot +1)', plus('greatWyrm', { prot: 1 })],
  ['Ring of Regrowth (regen 5%)', { regeneration: 0.05 }],
  ['Barkhide Mail (prot +2, hp +6, def -1)', plus('greatWyrm', { prot: 2, hp: 6, def: -1 })],
  ['Ring of Regrowth + Barkskin Amulet', { ...plus('greatWyrm', { prot: 1 }), regeneration: 0.05 }],
  ['Heartwood Bulwark kit (prot +2, regen 10%, Ivy Crown)', { ...plus('greatWyrm', { prot: 2 }), regeneration: 0.1 }],
] as const) {
  console.log(`| ${name} | ${rate(() => [wyrm(extra)(), cinderStart()])} | ${rate(() => [wyrm(extra)(), thornStart()])} | ${rate(() => [wyrm(extra)(), hills20()])} |`);
}

console.log('\n### Warden Captain leading 20 Wardens and 10 Longbow Hunters (attacker) vs Cinder start\n');
console.log('| Item | win |\n|---|---|');
const capt = (mor = 0, capExtra: Partial<CombatStats> = {}) => () =>
  side([sq('aw', 'warden', 20, 'ac', plus('warden', { mor })), sq('aa', 'longbowHunter', 10, 'ac', plus('longbowHunter', { mor }))], [cmd('ac', 'wardenCaptain', false, capExtra)]);
for (const [name, make] of [
  ['none', capt()],
  ['Antler Crown of the Wilds (inspire 1)', capt(1)],
] as const) console.log(`| ${name} | ${rate(() => [make(), cinderStart()])} |`);

console.log('\n### More candidates\n');
console.log('| Setup | win |\n|---|---|');
const captW = (wardenExtra: Partial<CombatStats>) => () =>
  side([sq('aw', 'warden', 20, 'ac', wardenExtra), sq('aa', 'longbowHunter', 10, 'ac')], [cmd('ac', 'wardenCaptain', false)]);
console.log(`| Warden Captain army vs Cinder start, no item | ${rate(() => [captW({})(), cinderStart()])} |`);
console.log(`| ... Seed of the Barkskin (Bark Skin +3 prot on the 20 Wardens) | ${rate(() => [captW(plus('warden', { prot: 3 }))(), cinderStart()])} |`);
console.log(`| Titan alone vs 16 indeps, Heartwood Bulwark (def +2, prot +2, thorns 3 as fire-shield stand-in) | ${rate(() => [titan({ ...plus('titan', { def: 2, prot: 2 }), fireShield: 3 })(), indeps(11, 5)()])} |`);
console.log(`| Titan alone vs 16 indeps, Giant's Girdle (str +3) | ${rate(() => [titan(plus('titan', { str: 3 }))(), indeps(11, 5)()])} |`);
console.log(`| Titan alone vs 16 indeps, Warded Shield (def +2) | ${rate(() => [titan(plus('titan', { def: 2 }))(), indeps(11, 5)()])} |`);
console.log(`| Titan alone vs 16 indeps, Barkhide Mail (prot +2, hp +6, def -1) | ${rate(() => [titan(plus('titan', { prot: 2, hp: 6, def: -1 }))(), indeps(11, 5)()])} |`);
console.log(`| Titan alone vs 16 indeps, Barkskin Amulet + Ring of Regrowth | ${rate(() => [titan({ ...plus('titan', { prot: 1 }), regeneration: 0.05 })(), indeps(11, 5)()])} |`);
console.log(`| Ash Chieftain alone vs 12 indeps, Fine Blade + Warded Shield + Barkskin | ${rate(() => [side([], [cmd('god', 'ashChieftain', true, { ...plus('ashChieftain', { att: 1, def: 2, prot: 1 }), weapons: [{ name: 'Fine Blade', dmg: 6 }] })]), indeps(8, 4)()])} |`);
