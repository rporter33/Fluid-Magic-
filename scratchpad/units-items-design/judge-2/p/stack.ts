// Judge 2: item stacks the draft did not measure. Final unit rules on (U1, U3, U4, riders 2).
// Run: npx tsx stack.ts [seeds]
import { unitDef, type UnitTypeId } from './src/content';
import type { WeaponDef } from './src/content/types';
import { setProto } from './src/sim/battle/proto';
import type { BattleSideSetup, CombatStats } from './src/sim/battle/types';
import { commander, fightOnce, side, squad, statsOf } from './tests/sim/battle/fixtures';

const N = Number(process.argv[2] ?? 400);
const U = (id: string) => id as UnitTypeId;
setProto({ sizeMelee: true, sizeRanged: true, reach: true, resist: true });

type Mods = Partial<Record<'hp' | 'str' | 'att' | 'def' | 'prot' | 'mor' | 'prec' | 'regeneration' | 'fireShield', number>>;
function st(unit: string, add: Mods = {}, set: Partial<CombatStats> = {}): CombatStats {
  const b = statsOf(U(unit));
  const o = { ...b } as unknown as Record<string, number>;
  for (const [k, v] of Object.entries(add)) o[k] = (o[k] ?? 0) + (v ?? 0);
  return { ...(o as unknown as CombatStats), ...set };
}
const sq = (ref: string, unit: string, n: number, leader: string | null, add: Mods = {}) =>
  squad(ref, U(unit), n, { leader, stats: st(unit, add) });
const cmdS = (ref: string, unit: string, attack: boolean, stats: CombatStats) =>
  commander(ref, U(unit), { stats, script: Array.from({ length: 5 }, () => ({ kind: attack ? ('attack' as const) : ('hold' as const) })) });
function rate(make: () => [BattleSideSetup, BattleSideSetup]): string {
  let w = 0;
  for (let s = 0; s < N; s++) {
    const [a, d] = make();
    if (fightOnce(a, d, s).winner === 'attacker') w++;
  }
  return (Math.round((1000 * w) / N) / 10).toFixed(1);
}
// Enemy armies; `cw` adds to the 20 Cinder Warriors (Ivy Grasp upper bound: def -3, att -1 all battle).
const cinderStart = (cw: Mods = {}) => () =>
  side([sq('dw', 'cinderWarrior', 20, 'dc', cw), sq('da', 'flameArcher', 10, 'dc')], [cmdS('dc', 'ashChieftain', false, st('ashChieftain'))]);
const thornStart = (w: Mods = {}) => () =>
  side([sq('dw', 'warden', 20, 'dc', w), sq('da', 'longbowHunter', 10, 'dc')], [cmdS('dc', 'wardenCaptain', false, st('wardenCaptain'))]);

// Pretender bodies from the pretender final (Great Wyrm in the repo; Elder Wyrm by its A.4 row).
const wyrm = (add: Mods) => st('greatWyrm', add);
const TRAMPLE: WeaponDef = { name: 'Trample', dmg: 2, strikes: 2, maxTargetSize: 2 };
const elder = (add: Mods) =>
  st('greatWyrm', { ...add }, {}) && {
    ...st('greatWyrm'),
    hp: 130 + (add.hp ?? 0), str: 21, att: 12, def: 8 + (add.def ?? 0), prot: 12 + (add.prot ?? 0), mor: 22, mapSpeed: 1,
    tags: [], weapons: [{ name: 'Bite', dmg: 10 }, TRAMPLE], regeneration: 0.1 + (add.regeneration ?? 0),
  } as CombatStats;
const alone = (unit: string, stats: CombatStats) => () => side([], [cmdS('god', unit, true, stats)]);

const IVY = { def: -3, att: -1 };
const rows: [string, () => string, () => string][] = [
  ['Great Wyrm, none', () => rate(() => [alone('greatWyrm', wyrm({}))(), cinderStart()()]), () => rate(() => [alone('greatWyrm', wyrm({}))(), thornStart()()])],
  ['GW + Ring 5% + Barkskin +1 (draft: 69.3)', () => rate(() => [alone('greatWyrm', wyrm({ regeneration: 0.05, prot: 1 }))(), cinderStart()()]), () => rate(() => [alone('greatWyrm', wyrm({ regeneration: 0.05, prot: 1 }))(), thornStart()()])],
  ['GW + Ring + Barkskin + Ivy Crown hp+10, no Ivy Grasp', () => rate(() => [alone('greatWyrm', wyrm({ regeneration: 0.05, prot: 1, hp: 10 }))(), cinderStart()()]), () => rate(() => [alone('greatWyrm', wyrm({ regeneration: 0.05, prot: 1, hp: 10 }))(), thornStart()()])],
  ['GW + Ring + Barkskin + Ivy Crown, Ivy Grasp all battle (upper bound)', () => rate(() => [alone('greatWyrm', wyrm({ regeneration: 0.05, prot: 1, hp: 10 }))(), cinderStart(IVY)()]), () => rate(() => [alone('greatWyrm', wyrm({ regeneration: 0.05, prot: 1, hp: 10 }))(), thornStart(IVY)()])],
  ['GW + Avatar Evergreen (regen 10%, prot +1), no items', () => rate(() => [alone('greatWyrm', wyrm({ regeneration: 0.1, prot: 1 }))(), cinderStart()()]), () => rate(() => [alone('greatWyrm', wyrm({ regeneration: 0.1, prot: 1 }))(), thornStart()()])],
  ['GW + Avatar Evergreen + Ring + Barkskin + Crown hp+10', () => rate(() => [alone('greatWyrm', wyrm({ regeneration: 0.15, prot: 2, hp: 10 }))(), cinderStart()()]), () => rate(() => [alone('greatWyrm', wyrm({ regeneration: 0.15, prot: 2, hp: 10 }))(), thornStart()()])],
  ['GW + Avatar Greater Evergreen (20%, prot +2), no items', () => rate(() => [alone('greatWyrm', wyrm({ regeneration: 0.2, prot: 2 }))(), cinderStart()()]), () => rate(() => [alone('greatWyrm', wyrm({ regeneration: 0.2, prot: 2 }))(), thornStart()()])],
  ['GW + Avatar Greater Evergreen + Ring + Barkskin + Crown', () => rate(() => [alone('greatWyrm', wyrm({ regeneration: 0.25, prot: 3, hp: 10 }))(), cinderStart()()]), () => rate(() => [alone('greatWyrm', wyrm({ regeneration: 0.25, prot: 3, hp: 10 }))(), thornStart()()])],
  ['Elder Wyrm, none', () => rate(() => [alone('greatWyrm', elder({}))(), cinderStart()()]), () => rate(() => [alone('greatWyrm', elder({}))(), thornStart()()])],
  ['Elder Wyrm + Ring + Barkskin + Crown hp+10', () => rate(() => [alone('greatWyrm', elder({ regeneration: 0.05, prot: 1, hp: 10 }))(), cinderStart()()]), () => rate(() => [alone('greatWyrm', elder({ regeneration: 0.05, prot: 1, hp: 10 }))(), thornStart()()])],
];
console.log(`seeds ${N}; final unit rules on\n`);
console.log('| Kit (alone, Attack) | vs Cinder start | vs Thornwood start |\n|---|---|---|');
for (const [n, a, b] of rows) console.log(`| ${n} | ${a()} | ${b()} |`);

// Army items that stack on one commander.
const chiefArmy = (mor: number) => () =>
  side([sq('aw', 'cinderWarrior', 20, 'ac', { mor }), sq('aa', 'flameArcher', 10, 'ac', { mor })], [cmdS('ac', 'ashChieftain', false, st('ashChieftain', { mor: 0 }))]);
const capArmy = (mor: number, prot: number) => () =>
  side([sq('aw', 'warden', 20, 'ac', { mor, prot }), sq('aa', 'longbowHunter', 10, 'ac', { mor })], [cmdS('ac', 'wardenCaptain', false, st('wardenCaptain', { prot: prot > 0 ? 1 : 0 }))]);
console.log('\n| Army kit | win |\n|---|---|');
console.log(`| Chieftain army vs Thornwood start, none | ${rate(() => [chiefArmy(0)(), thornStart()()])} |`);
console.log(`| ... Pendant (inspire 1) | ${rate(() => [chiefArmy(1)(), thornStart()()])} |`);
console.log(`| ... Horn of the Burning Host (+2) | ${rate(() => [chiefArmy(2)(), thornStart()()])} |`);
console.log(`| ... Pendant + Horn (+3, two charms) | ${rate(() => [chiefArmy(3)(), thornStart()()])} |`);
console.log(`| Warden Captain army vs Cinder start, none | ${rate(() => [capArmy(0, 0)(), cinderStart()()])} |`);
console.log(`| ... Seed of Barkskin (+3 prot on Wardens) | ${rate(() => [capArmy(0, 3)(), cinderStart()()])} |`);
console.log(`| ... Seed + Antler Crown (inspire 1) | ${rate(() => [capArmy(1, 3)(), cinderStart()()])} |`);
console.log(`| ... Seed at +2 + Antler Crown | ${rate(() => [capArmy(1, 2)(), cinderStart()()])} |`);
