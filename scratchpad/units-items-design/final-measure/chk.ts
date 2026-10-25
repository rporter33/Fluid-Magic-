import { unitDef, type UnitTypeId } from './src/content';
import { setProto } from './src/sim/battle/proto';
import type { BattleSideSetup, CombatStats } from './src/sim/battle/types';
import { commander, fightOnce, side, squad, statsOf } from './tests/sim/battle/fixtures';
const U = (id: string) => id as UnitTypeId;
const st = (u: string, x: Partial<CombatStats> = {}) => statsOf(U(u), { size: unitDef(U(u)).size, resist: {}, ...x } as Partial<CombatStats>);
const cinder = () => side([squad('dw', U('cinderWarrior'), 20, { leader: 'dk', stats: st('cinderWarrior') }), squad('da', U('flameArcher'), 10, { leader: 'dk', stats: st('flameArcher') })], [commander('dk', U('ashChieftain'), { stats: st('ashChieftain') })]);
const god = (x: Partial<CombatStats>) => side([squad('a0', U('warden'), 20, { leader: 'god', stats: st('warden') })], [commander('god', U('greatWyrm'), { stats: st('greatWyrm', x), script: Array.from({ length: 5 }, () => ({ kind: 'attack' as const })) })]);
setProto({ sizeMelee: true, sizeRanged: true, reach: true, resist: true, startMods: [] });
for (const [n, x] of [['base', {}], ['prot+10', { prot: unitDef(U('greatWyrm')).prot + 10 }], ['regen 0.5', { regeneration: 0.5 }]] as [string, Partial<CombatStats>][]) {
  let w = 0, godDead = 0, rounds = 0;
  for (let s = 0; s < 400; s++) { const r = fightOnce(god(x), cinder(), s); if (r.winner === 'attacker') w++; if (r.commanders.get('god')?.dead) godDead++; rounds += r.rounds; }
  console.log(n, w / 4, 'god dead', godDead / 4, 'mean rounds', rounds / 400);
}
