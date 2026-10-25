// Judge 2: how often a god leading from the front dies, today vs U1 (size-weighted draws).
import { type UnitTypeId } from './src/content';
import { setProto } from './src/sim/battle/proto';
import type { BattleSideSetup } from './src/sim/battle/types';
import { commander, fightOnce, side, squad } from './tests/sim/battle/fixtures';
const N = Number(process.argv[2] ?? 400);
const U = (id: string) => id as UnitTypeId;
const atk = (unit: string) => commander('god', U(unit), { script: Array.from({ length: 5 }, () => ({ kind: 'attack' as const })) });
const hold = (ref: string, unit: string) => commander(ref, U(unit));
const armies: [string, () => [BattleSideSetup, BattleSideSetup]][] = [
  ['Titan (Attack) + 20 CW vs Thornwood start', () => [side([squad('aw', U('cinderWarrior'), 20, { leader: 'god' })], [atk('titan')]), side([squad('dw', U('warden'), 20, { leader: 'dc' }), squad('da', U('longbowHunter'), 10, { leader: 'dc' })], [hold('dc', 'wardenCaptain')])]],
  ['Titan (Attack) + 20 CW vs 20 Heavy Infantry', () => [side([squad('aw', U('cinderWarrior'), 20, { leader: 'god' })], [atk('titan')]), side([squad('dh', U('heavyInfantry'), 20, { leader: 'dc' })], [hold('dc', 'independentCaptain')])]],
  ['Titan (Attack) + 20 CW vs 30 Light Infantry', () => [side([squad('aw', U('cinderWarrior'), 20, { leader: 'god' })], [atk('titan')]), side([squad('dh', U('lightInfantry'), 30, { leader: 'dc' })], [hold('dc', 'independentCaptain')])]],
  ['Great Wyrm (Attack) + 20 Wardens vs Cinder start', () => [side([squad('aw', U('warden'), 20, { leader: 'god' })], [atk('greatWyrm')]), side([squad('dw', U('cinderWarrior'), 20, { leader: 'dc' }), squad('da', U('flameArcher'), 10, { leader: 'dc' })], [hold('dc', 'ashChieftain')])]],
];
console.log(`seeds ${N}\n\n| Fight | win today | god dies today | win U1 | god dies U1 | god dies in a won battle, today / U1 |\n|---|---|---|---|---|---|`);
for (const [name, make] of armies) {
  const res: number[] = [];
  for (const on of [false, true]) {
    setProto({ sizeMelee: on, sizeRanged: on });
    let w = 0, d = 0, dw = 0;
    for (let s = 0; s < N; s++) {
      const [a, b] = make();
      const r = fightOnce(a, b, s);
      const dead = r.commanders.get('god')?.dead === true;
      if (r.winner === 'attacker') w++;
      if (dead) d++;
      if (dead && r.winner === 'attacker') dw++;
    }
    res.push(w, d, dw);
  }
  const p = (x: number | undefined) => ((100 * (x ?? 0)) / N).toFixed(1);
  console.log(`| ${name} | ${p(res[0])} | ${p(res[1])} | ${p(res[3])} | ${p(res[4])} | ${p(res[2])} / ${p(res[5])} |`);
}
