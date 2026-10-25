// A commander item that inspires: +N morale (or +N attack) to every squad the commander leads.
import { commander, squad, side, statsOf, fightOnce } from '/home/user/Fluid-Magic-/tests/sim/battle/fixtures';
import type { BattleSideSetup } from '/home/user/Fluid-Magic-/src/sim/battle/types';
import type { UnitTypeId } from '/home/user/Fluid-Magic-/src/content';
const U = (s: string) => s as UnitTypeId;
function army(mor: number, att: number): BattleSideSetup {
  const st = (u: string) => { const b = statsOf(U(u)); return { mor: b.mor + mor, att: b.att + att }; };
  return side([
    squad('w', U('cinderWarrior'), 20, { leader: 'c', stats: st('cinderWarrior') }),
    squad('a', U('flameArcher'), 10, { leader: 'c', stats: st('flameArcher') }),
  ], [commander('c', U('ashChieftain'))]);
}
const foes: { id: string; make: () => BattleSideSetup }[] = [
  { id: 'hills 20 HI', make: () => side([squad('s1', U('heavyInfantry'), 20, { leader: 'cap' })], [commander('cap', U('independentCaptain'))]) },
  { id: 'Thornwood start army (20 Wardens, 10 Longbows)', make: () => side([squad('s1', U('warden'), 20, { leader: 'cap' }), squad('s2', U('longbowHunter'), 10, { leader: 'cap' })], [commander('cap', U('wardenCaptain'))]) },
];
const N = Number(process.argv[2] ?? 400);
const variants: [string, number, number][] = [['none', 0, 0], ['mor +1', 1, 0], ['mor +2', 2, 0], ['mor +3', 3, 0], ['att +1', 0, 1], ['att +2', 0, 2]];
console.log(`| squads led | ${foes.map((f) => f.id).join(' | ')} |`);
console.log(`|${'---|'.repeat(foes.length + 1)}`);
for (const [id, m, a] of variants) {
  const cells = foes.map((f) => {
    let w = 0;
    for (let s = 0; s < N; s++) if (fightOnce(army(m, a), f.make(), s).winner === 'attacker') w++;
    return `${Math.round((100 * w) / N)}%`;
  });
  console.log(`| ${id} | ${cells.join(' | ')} |`);
}
