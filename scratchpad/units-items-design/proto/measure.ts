// Measures the proposed unit-depth rules in the scratch copy of the resolver.
// Run: cd proto && npx tsx measure.ts [seeds]
import { unitDef, type UnitTypeId } from './src/content';
import type { WeaponDef } from './src/content/types';
import { PROTO, setProto } from './src/sim/battle/proto';
import type { BattleSideSetup, CombatStats } from './src/sim/battle/types';
import { byRound, commander, fightOnce, side, squad, statsOf } from './tests/sim/battle/fixtures';

const N = Number(process.argv[2] ?? 400);
const U = (id: string) => id as UnitTypeId;

/** Proposed M1 content changes, as stat overrides (sizes, reach, shields, resistances). */
interface Proposal {
  mountedSize2: boolean;
  resist: Record<string, Partial<Record<string, number>>>;
  giantTrample: boolean;
}
let P: Proposal = { mountedSize2: false, resist: {}, giantTrample: false };

const REACH = new Set(['Spear', 'Halberd', 'Hunting Spear']);
const SHIELD: Record<string, number> = { warden: 2, wardenCaptain: 2, independentCaptain: 2 };

function st(unit: string, extra: Partial<CombatStats> = {}): CombatStats {
  const d = unitDef(U(unit));
  const weapons: WeaponDef[] = d.weapons.map((w) => (REACH.has(w.name) ? { ...w, reach: true } : { ...w }));
  if (unit === 'giant' && P.giantTrample) weapons.push({ name: 'Trample', dmg: 2, strikes: 2, maxTargetSize: 2 });
  const mounted = d.tags.includes('mounted');
  return statsOf(U(unit), {
    weapons,
    size: mounted && P.mountedSize2 ? 2 : d.size,
    shieldDef: SHIELD[unit] ?? 0,
    resist: P.resist[unit] ?? {},
    ...extra,
  });
}
const sq = (ref: string, unit: string, n: number, leader: string | null = null, extra: Partial<CombatStats> = {}) =>
  squad(ref, U(unit), n, { leader, stats: st(unit, extra) });
const cmd = (ref: string, unit: string, attack = false, extra: Partial<CombatStats> = {}) =>
  commander(ref, U(unit), {
    stats: st(unit, extra),
    script: Array.from({ length: 5 }, () => ({ kind: attack ? ('attack' as const) : ('hold' as const) })),
  });

function rate(make: () => [BattleSideSetup, BattleSideSetup], n = N): number {
  let w = 0;
  for (let s = 0; s < n; s++) {
    const [a, d] = make();
    if (fightOnce(a, d, s).winner === 'attacker') w++;
  }
  return Math.round((1000 * w) / n) / 10;
}

const cinderStart = (t: string) =>
  side([sq(`${t}w`, 'cinderWarrior', 20, `${t}c`), sq(`${t}a`, 'flameArcher', 10, `${t}c`)], [cmd(`${t}c`, 'ashChieftain')]);
const thornStart = (t: string) =>
  side([sq(`${t}w`, 'warden', 20, `${t}c`), sq(`${t}a`, 'longbowHunter', 10, `${t}c`)], [cmd(`${t}c`, 'wardenCaptain')]);

const cinderMid = (t: string) =>
  side([sq(`${t}w`, 'cinderWarrior', 20, `${t}c`), sq(`${t}a`, 'flameArcher', 10, `${t}c`), sq(`${t}b`, 'berserker', 10, `${t}c`), sq(`${t}r`, 'ashRider', 10, `${t}c`)], [cmd(`${t}c`, 'ashChieftain')]);
const thornMid = (t: string) =>
  side([sq(`${t}w`, 'warden', 20, `${t}c`), sq(`${t}a`, 'longbowHunter', 10, `${t}c`), sq(`${t}b`, 'briarGuard', 10, `${t}c`), sq(`${t}r`, 'wolfRider', 10, `${t}c`)], [cmd(`${t}c`, 'wardenCaptain')]);
const cinderElite = (t: string) =>
  side([sq(`${t}w`, 'cinderWarrior', 20, `${t}c`), sq(`${t}a`, 'flameArcher', 10, `${t}c`), sq(`${t}f`, 'flamebrand', 10, `${t}c`)], [cmd(`${t}c`, 'ashChieftain')]);
const thornElite = (t: string) =>
  side([sq(`${t}w`, 'warden', 20, `${t}c`), sq(`${t}a`, 'longbowHunter', 10, `${t}c`), sq(`${t}o`, 'oakheart', 10, `${t}c`)], [cmd(`${t}c`, 'wardenCaptain')]);

type Row = [string, () => number | string];
const rows: Row[] = [
  ['R1 20 Cinder Warriors beat 10 Ash Militia (need >= 95)', () => rate(() => [side([sq('a', 'cinderWarrior', 20)]), side([sq('d', 'ashMilitia', 10)])], 200)],
  ['R2 equal armies, attacker win (need 35 to 65)', () => rate(() => [cinderStart('a'), cinderStart('d')], 500)],
  [
    'R3 archer kills in rounds 1-3 vs 20 militia (need >= 2)',
    () => {
      let k = 0;
      for (let s = 0; s < 200; s++) {
        const r = fightOnce(side([sq('w', 'cinderWarrior', 10), sq('a', 'flameArcher', 10)]), side([sq('m', 'ashMilitia', 20)]), s);
        for (const { round, event } of byRound(r)) if (event.kind === 'volley' && event.squad === 'a' && round <= 3) k += event.kills;
      }
      return Math.round((k / 200) * 100) / 100;
    },
  ],
  ['M1 Cinder start attacks Thornwood start', () => rate(() => [cinderStart('a'), thornStart('d')])],
  ['M2 Thornwood start attacks Cinder start', () => rate(() => [thornStart('a'), cinderStart('d')])],
  ['M3 10 Ash Riders attack 10 Briar Guard', () => rate(() => [side([sq('a', 'ashRider', 10)]), side([sq('d', 'briarGuard', 10)])])],
  ['M4 10 Ash Riders attack 15 Thorn Militia', () => rate(() => [side([sq('a', 'ashRider', 10)]), side([sq('d', 'thornMilitia', 15)])])],
  ['M5 10 Ash Riders attack 10 Wardens', () => rate(() => [side([sq('a', 'ashRider', 10)]), side([sq('d', 'warden', 10)])])],
  [
    'M6 Flame Archer kills on 20 Wardens, rounds 1-3 (10 FA behind 10 CW)',
    () => {
      let k = 0;
      for (let s = 0; s < N; s++) {
        const r = fightOnce(side([sq('w', 'cinderWarrior', 10), sq('a', 'flameArcher', 10)]), side([sq('m', 'warden', 20)]), s);
        for (const { round, event } of byRound(r)) if (event.kind === 'volley' && event.squad === 'a' && round <= 3) k += event.kills;
      }
      return Math.round((k / N) * 100) / 100;
    },
  ],
  ['M7 Cinder start attacks Giant + 25 Heavy Infantry (mountain champion)', () => rate(() => [cinderStart('a'), side([sq('dg', 'giant', 1, 'dc'), sq('dh', 'heavyInfantry', 25, 'dc')], [cmd('dc', 'independentCaptain')])])],
  ['M8 Cinder start attacks Giant + 12 Light Infantry', () => rate(() => [cinderStart('a'), side([sq('dg', 'giant', 1, 'dc'), sq('dh', 'lightInfantry', 12, 'dc')], [cmd('dc', 'independentCaptain')])])],
  ['M9 Titan (Attack) + 20 Cinder Warriors attack Thornwood start', () => rate(() => [side([sq('aw', 'cinderWarrior', 20, 'ag')], [cmd('ag', 'titan', true)]), thornStart('d')])],
  ['M10 Titan (Attack) + 20 Cinder Warriors attack 20 Heavy Infantry', () => rate(() => [side([sq('aw', 'cinderWarrior', 20, 'ag')], [cmd('ag', 'titan', true)]), side([sq('dh', 'heavyInfantry', 20, 'dc')], [cmd('dc', 'independentCaptain')])])],
  ['M11 10 Flamebrands attack 10 Oakhearts', () => rate(() => [side([sq('a', 'flamebrand', 10)]), side([sq('d', 'oakheart', 10)])])],
  ['M12 10 CW + 10 FA attack 10 Oakhearts', () => rate(() => [side([sq('w', 'cinderWarrior', 10), sq('a', 'flameArcher', 10)]), side([sq('d', 'oakheart', 10)])])],
  ['M13 Cinder start attacks Treant (Attack) + 20 Wardens', () => rate(() => [cinderStart('a'), side([sq('dw', 'warden', 20, 'dt')], [cmd('dt', 'treant', true)])])],
  ['M14 Cinder start attacks Warden Captain + 20 Wardens + 10 Wolf Riders', () => rate(() => [cinderStart('a'), side([sq('dw', 'warden', 20, 'dc'), sq('dr', 'wolfRider', 10, 'dc')], [cmd('dc', 'wardenCaptain')])])],
  ['G1 Cinder mid (20 CW, 10 FA, 10 Berserker, 10 Ash Rider) attacks Thornwood mid (20 Warden, 10 LH, 10 Briar Guard, 10 Wolf Rider)', () => rate(() => [cinderMid('a'), thornMid('d')])],
  ['G2 Thornwood mid attacks Cinder mid', () => rate(() => [thornMid('a'), cinderMid('d')])],
  ['G3 Cinder elite (20 CW, 10 FA, 10 Flamebrand) attacks Thornwood elite (20 Warden, 10 LH, 10 Oakheart)', () => rate(() => [cinderElite('a'), thornElite('d')])],
  ['G4 Thornwood elite attacks Cinder elite', () => rate(() => [thornElite('a'), cinderElite('d')])],
  ['M15 10 Ash Riders + 10 FA attack 20 Thorn Militia', () => rate(() => [side([sq('r', 'ashRider', 10), sq('a', 'flameArcher', 10)]), side([sq('d', 'thornMilitia', 20)])])],
];

type Config = { name: string; proto: Partial<typeof PROTO>; prop: Proposal };
const base: Proposal = { mountedSize2: false, resist: {}, giantTrample: false };
const RES = { treant: { fire: -5 }, oakheart: { fire: -3 }, salamander: { fire: 10 }, fireSprite: { fire: 10 }, flamebrand: { fire: 3 } };
const configs: Config[] = [
  { name: 'today', proto: {}, prop: base },
  { name: 'size: mounted 2, draws in melee+ranged', proto: { sizeMelee: true, sizeRanged: true }, prop: { ...base, mountedSize2: true } },
  { name: 'size: mounted 2, draws in ranged only', proto: { sizeRanged: true }, prop: { ...base, mountedSize2: true } },
  { name: 'reach cancels charge', proto: { reach: true }, prop: base },
  { name: 'shield vs arrows', proto: { shieldArrows: true }, prop: base },
  { name: 'resist (treant -5, oakheart -3, ...)', proto: { resist: true }, prop: { ...base, resist: RES } },
  { name: 'giant trample (2 x dmg 2, size <= 2)', proto: {}, prop: { ...base, giantTrample: true } },
  {
    name: 'FINAL (size melee+ranged, mounted 2, reach, resist oak -3)',
    proto: { sizeMelee: true, sizeRanged: true, reach: true, resist: true },
    prop: { ...base, mountedSize2: true, resist: RES },
  },
  {
    name: 'FINAL with oak -2',
    proto: { sizeMelee: true, sizeRanged: true, reach: true, resist: true },
    prop: { ...base, mountedSize2: true, resist: { ...RES, oakheart: { fire: -2 } } },
  },
  {
    name: 'ALL (size ranged only, reach, shield, resist, no trample)',
    proto: { sizeRanged: true, reach: true, shieldArrows: true, resist: true },
    prop: { ...base, mountedSize2: true, resist: RES },
  },
];

const which = process.argv[3]?.split(',');
const picked = which ? configs.filter((_, i) => which.includes(String(i))) : configs;
const results: Record<string, (number | string)[]> = {};
for (const c of picked) {
  setProto(c.proto);
  P = c.prop;
  results[c.name] = rows.map(([, f]) => f());
  console.error(`done: ${c.name}`);
}
console.log(`seeds ${N} (R1/R3 200, R2 500)\n`);
console.log(`| Fight | ${picked.map((c) => c.name).join(' | ')} |`);
console.log(`|---|${picked.map(() => '---').join('|')}|`);
rows.forEach(([label], i) => console.log(`| ${label} | ${picked.map((c) => String(results[c.name]?.[i])).join(' | ')} |`));
