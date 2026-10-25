// Final measurements for units-items-design/final.md (the judges' open cells).
// Run: cd final-measure && npx tsx final.ts [seeds]
import { unitDef, type UnitTypeId } from './src/content';
import type { WeaponDef } from './src/content/types';
import { setProto, type StartMod } from './src/sim/battle/proto';
import type { BattleSideSetup, CombatStats } from './src/sim/battle/types';
import { commander, fightOnce, side, squad, statsOf } from './tests/sim/battle/fixtures';

const N = Number(process.argv[2] ?? 400);
const U = (id: string) => id as UnitTypeId;
const REACH = new Set(['Spear', 'Halberd', 'Hunting Spear']);
const RESIST: Record<string, Record<string, number>> = {
  treant: { fire: -5 }, oakheart: { fire: -3 }, salamander: { fire: 10 }, fireSprite: { fire: 10 }, flamebrand: { fire: 3 },
};
let resistOver: Record<string, Record<string, number>> = {};
let sizeOver: Record<string, number> = {};
function st(unit: string, extra: Partial<CombatStats> = {}): CombatStats {
  const d = unitDef(U(unit));
  const weapons: WeaponDef[] = d.weapons.map((w) => (REACH.has(w.name) ? { ...w, reach: true } : { ...w }));
  const size = sizeOver[unit] ?? (d.tags.includes('mounted') ? 2 : d.size);
  return statsOf(U(unit), { weapons, size, shieldDef: 0, resist: resistOver[unit] ?? RESIST[unit] ?? {}, ...extra } as Partial<CombatStats>);
}
const sq = (ref: string, unit: string, n: number, leader: string | null = null, extra: Partial<CombatStats> = {}) =>
  squad(ref, U(unit), n, { leader, stats: st(unit, extra) });
const cmd = (ref: string, unit: string, attack = false, extra: Partial<CombatStats> = {}) =>
  commander(ref, U(unit), { stats: st(unit, extra), script: Array.from({ length: 5 }, () => ({ kind: attack ? ('attack' as const) : ('hold' as const) })) });
function rate(make: () => [BattleSideSetup, BattleSideSetup], n = N): number {
  let w = 0;
  for (let s = 0; s < n; s++) {
    const [a, d] = make();
    if (fightOnce(a, d, s).winner === 'attacker') w++;
  }
  return Math.round((1000 * w) / n) / 10;
}
const FINAL = { sizeMelee: true, sizeRanged: true, reach: true, resist: true };
const IVY = (s: 'attacker' | 'defender'): StartMod => ({ side: s, target: 'enemySquad', mods: [{ stat: 'def', delta: -3 }, { stat: 'att', delta: -1 }], untilRound: 5, source: 'entangle' });
const SEED = (s: 'attacker' | 'defender', n: number): StartMod => ({ side: s, target: 'friendlySquad', mods: [{ stat: 'prot', delta: n }], untilRound: null, source: 'barkSkin' });

const cinderStart = (t: string, mor = 0) => side([sq(`${t}w`, 'cinderWarrior', 20, `${t}c`, mor ? { mor: unitDef(U('cinderWarrior')).mor + mor } : {}), sq(`${t}a`, 'flameArcher', 10, `${t}c`, mor ? { mor: unitDef(U('flameArcher')).mor + mor } : {})], [cmd(`${t}c`, 'ashChieftain')]);
const thornStart = (t: string, mor = 0, capProt = 0) => side([sq(`${t}w`, 'warden', 20, `${t}c`, mor ? { mor: unitDef(U('warden')).mor + mor } : {}), sq(`${t}a`, 'longbowHunter', 10, `${t}c`, mor ? { mor: unitDef(U('longbowHunter')).mor + mor } : {})], [cmd(`${t}c`, 'wardenCaptain', false, capProt ? { prot: unitDef(U('wardenCaptain')).prot + capProt } : {})]);
const cinderElite = (t: string) => side([sq(`${t}w`, 'cinderWarrior', 20, `${t}c`), sq(`${t}a`, 'flameArcher', 10, `${t}c`), sq(`${t}f`, 'flamebrand', 10, `${t}c`)], [cmd(`${t}c`, 'ashChieftain')]);
const thornElite = (t: string, oak: Partial<CombatStats> = {}) => side([sq(`${t}w`, 'warden', 20, `${t}c`), sq(`${t}a`, 'longbowHunter', 10, `${t}c`), sq(`${t}o`, 'oakheart', 10, `${t}c`, oak)], [cmd(`${t}c`, 'wardenCaptain')]);

const gw = (o: Partial<CombatStats> = {}) => side([], [commander('god', U('greatWyrm'), { stats: st('greatWyrm', o), script: Array.from({ length: 5 }, () => ({ kind: 'attack' as const })) })]);
const gwBase = unitDef(U('greatWyrm'));
const TRAMPLE: WeaponDef = { name: 'Trample', dmg: 2, strikes: 2, maxTargetSize: 2 };
const elderStats = (o: Partial<CombatStats> = {}): Partial<CombatStats> => ({ hp: 130, str: 21, att: 12, def: 8, prot: 12, mor: 22, size: 6, mapSpeed: 1, tags: [], weapons: [{ name: 'Bite', dmg: 10 }, TRAMPLE], regeneration: 0.1, ...o });
const elder = (o: Partial<CombatStats> = {}) => side([], [commander('god', U('greatWyrm'), { stats: st('greatWyrm', elderStats(o)), script: Array.from({ length: 5 }, () => ({ kind: 'attack' as const })) })]);

function pair(label: string, god: () => BattleSideSetup, mods: StartMod[] = []): string {
  setProto({ ...FINAL, startMods: mods });
  const a = rate(() => [god(), cinderStart('d')]);
  const b = rate(() => [god(), thornStart('d')]);
  return `| ${label} | ${a} | ${b} |`;
}
console.log(`seeds ${N}; final unit rules (U1 melee and ranged, U3, U4, riders size 2)\n`);
console.log('## 1. Great Wyrm kits, alone (Attack)\n\n| Kit | vs Cinder start | vs Thornwood start |\n|---|---|---|');
console.log(pair('none', () => gw()));
console.log(pair('Ring 5% + Barkskin Amulet (draft)', () => gw({ regeneration: 0.05, prot: gwBase.prot + 1 })));
console.log(pair('Crown of the Ivy King, final (G+1, Ivy Grasp 5 rounds, no hp)', () => gw(), [IVY('attacker')]));
console.log(pair('Ring + Amulet + Crown, final (Ivy Grasp 5 rounds, no hp)', () => gw({ regeneration: 0.05, prot: gwBase.prot + 1 }), [IVY('attacker')]));
console.log(pair('Ring + Amulet + Crown, draft (hp +10, Ivy Grasp 5 rounds)', () => gw({ regeneration: 0.05, prot: gwBase.prot + 1, hp: gwBase.hp + 10 }), [IVY('attacker')]));
console.log(pair('Ring 4% + Amulet + Crown, final (knob)', () => gw({ regeneration: 0.04, prot: gwBase.prot + 1 }), [IVY('attacker')]));
console.log(pair('Amulet + Crown, final (no Ring)', () => gw({ prot: gwBase.prot + 1 }), [IVY('attacker')]));

console.log('\n## 2. Elder Wyrm (regeneration 10%), alone (Attack)\n\n| Kit | vs Cinder start | vs Thornwood start |\n|---|---|---|');
console.log(pair('none', () => elder()));
console.log(pair('Ring, regeneration adds (15%)', () => elder({ regeneration: 0.15 })));
console.log(pair('Ring, highest counts (10%) = none', () => elder()));
console.log(pair('Amulet', () => elder({ prot: 13 })));
console.log(pair('Ring + Amulet + Crown, adds (15%)', () => elder({ regeneration: 0.15, prot: 13 }), [IVY('attacker')]));
console.log(pair('Ring + Amulet + Crown, highest counts (10%)', () => elder({ prot: 13 }), [IVY('attacker')]));

console.log('\n## 3. Army items on one general (the general Holds)\n\n| Army and kit | attacker win |\n|---|---|');
const row = (label: string, make: () => [BattleSideSetup, BattleSideSetup], mods: StartMod[] = []) => {
  setProto({ ...FINAL, startMods: mods });
  console.log(`| ${label} | ${rate(make)} |`);
};
row('Warden Captain army attacks Cinder start, no items', () => [thornStart('a'), cinderStart('d')]);
row('... Seed of Barkskin +3 (draft)', () => [thornStart('a'), cinderStart('d')], [SEED('attacker', 3)]);
row('... Seed of Barkskin +2 (final)', () => [thornStart('a'), cinderStart('d')], [SEED('attacker', 2)]);
row('... Antler Crown (inspire 1, prot +1 on the Captain)', () => [thornStart('a', 1, 1), cinderStart('d')]);
row('... Seed +2 + Antler Crown', () => [thornStart('a', 1, 1), cinderStart('d')], [SEED('attacker', 2)]);
row('... Crown of the Ivy King (Ivy Grasp)', () => [thornStart('a'), cinderStart('d')], [IVY('attacker')]);
row('... Seed +2 + Crown of the Ivy King', () => [thornStart('a'), cinderStart('d')], [SEED('attacker', 2), IVY('attacker')]);
row('Ash Chieftain army attacks Thornwood start, no items', () => [cinderStart('a'), thornStart('d')]);
row('... Pendant of Fury (inspire 1)', () => [cinderStart('a', 1), thornStart('d')]);
row('... Horn of the Burning Host (inspire 2, final)', () => [cinderStart('a', 2), thornStart('d')]);
row('... Pendant + Horn (inspire 3)', () => [cinderStart('a', 3), thornStart('d')]);

console.log('\n## 4. Elite matchup: attribution and knobs\n\nThornwood share = mean of (100 − Cinder elite attacking) and (Thornwood elite attacking).\n\n| Rules | Cinder elite attacks | Thornwood elite attacks | Thornwood share |\n|---|---|---|---|');
function elite(label: string, proto: Partial<typeof FINAL>, oak: Partial<CombatStats> = {}, opts: { oakFire?: number | null; oakSize?: number } = {}) {
  resistOver = {};
  sizeOver = {};
  if (opts.oakFire !== undefined) resistOver.oakheart = opts.oakFire === null ? {} : { fire: opts.oakFire };
  if (opts.oakSize !== undefined) sizeOver.oakheart = opts.oakSize;
  setProto({ ...proto, startMods: [] });
  const a = rate(() => [cinderElite('a'), thornElite('d', oak)]);
  const b = rate(() => [thornElite('a', oak), cinderElite('d')]);
  console.log(`| ${label} | ${a} | ${b} | ${(Math.round(((100 - a + b) / 2) * 10) / 10).toFixed(1)} |`);
}
const oakHp = unitDef(U('oakheart')).hp;
const oakProt = unitDef(U('oakheart')).prot;
elite('today (no new rule)', {});
elite('U1 only', { sizeMelee: true, sizeRanged: true });
elite('U4 only (Oakheart fire −3)', { resist: true });
elite('U1 + U4', { sizeMelee: true, sizeRanged: true, resist: true });
elite('final (U1 + U3 + U4)', FINAL);
elite('final, Oakheart fire −2 (knob 1)', FINAL, {}, { oakFire: -2 });
elite('final, Oakheart fire −1', FINAL, {}, { oakFire: -1 });
elite('final, Oakheart no resistance', FINAL, {}, { oakFire: null });
elite(`final, Oakheart hp ${oakHp} → ${oakHp + 4}`, FINAL, { hp: oakHp + 4 });
elite(`final, Oakheart prot ${oakProt} → ${oakProt + 1}`, FINAL, { prot: oakProt + 1 });
elite('final, Oakheart size 1 (U1 off for it)', FINAL, {}, { oakSize: 1 });
resistOver = {};
sizeOver = {};

// 5. Pretender fixtures (pretender final A.10): regeneration from several sources.
const foes: [string, () => BattleSideSetup][] = [
  ['weak plains', () => side([sq('s1', 'lightInfantry', 11, 'cap'), sq('s2', 'archer', 5, 'cap')], [cmd('cap', 'independentCaptain')])],
  ['plains', () => side([sq('s1', 'lightInfantry', 16, 'cap'), sq('s2', 'archer', 8, 'cap')], [cmd('cap', 'independentCaptain')])],
  ['hills', () => side([sq('s1', 'heavyInfantry', 20, 'cap')], [cmd('cap', 'independentCaptain')])],
  ['forest', () => side([sq('s1', 'wolf', 12, 'cap'), sq('s2', 'archer', 6, 'cap')], [cmd('cap', 'independentCaptain')])],
  ['mountain', () => side([sq('s0', 'giant', 1, 'cap'), sq('s1', 'heavyInfantry', 25, 'cap')], [cmd('cap', 'independentCaptain')])],
];
const spirit = (o: Partial<CombatStats> = {}) => side([], [commander('god', U('greatWyrm'), { stats: st('greatWyrm', { hp: 30, str: 10, att: 10, def: 16, prot: 4, mor: 10, size: 2, mapSpeed: 2, tags: [], weapons: [{ name: 'Claws', dmg: 5 }], regeneration: 0.1, ...o }), script: Array.from({ length: 5 }, () => ({ kind: 'attack' as const })) })]);
console.log(`\n## 5. Regeneration from several sources, pretender fixtures (god alone, Attack)\n\n| God | ${foes.map((f) => f[0]).join(' | ')} |\n|${'---|'.repeat(foes.length + 1)}`);
setProto({ ...FINAL, startMods: [] });
const fx = (label: string, god: () => BattleSideSetup) => console.log(`| ${label} | ${foes.map(([, f]) => rate(() => [god(), f()])).join(' | ')} |`);
fx('Wild Spirit, Avatar Evergreen, adds (20%, prot +1)', () => spirit({ regeneration: 0.2, prot: 5 }));
fx('Wild Spirit, Avatar Evergreen, highest counts (10%, prot +1)', () => spirit({ regeneration: 0.1, prot: 5 }));
fx('Elder Wyrm, Avatar Greater Evergreen, adds (30%, prot +2)', () => elder({ regeneration: 0.3, prot: 14 }));
fx('Elder Wyrm, Avatar Greater Evergreen, highest counts (20%, prot +2)', () => elder({ regeneration: 0.2, prot: 14 }));
fx('Elder Wyrm, none', () => elder());
fx('Great Wyrm, none', () => gw());
fx('Great Wyrm, Ring + Amulet + Crown (final)', () => { setProto({ ...FINAL, startMods: [IVY('attacker')] }); return gw({ regeneration: 0.05, prot: gwBase.prot + 1 }); });
