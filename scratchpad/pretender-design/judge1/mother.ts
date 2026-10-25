// Judge check: Mother of Beasts with 12 monthly wolves. N7 wolves join via addSquad, so they are
// ordinary led squads (not summoned): N5 does not cover them. Compare leader 'god' with null.
import { commander, squad, side, statsOf, fightOnce } from '/home/user/Fluid-Magic-/tests/sim/battle/fixtures';
import type { UnitTypeId } from '/home/user/Fluid-Magic-/src/content';
const base: UnitTypeId = 'titan';
const stats = statsOf(base, { hp: 70, str: 18, att: 12, def: 11, prot: 8, mor: 20, mapSpeed: 2, weapons: [{ name: 'Maul', dmg: 9 }] });
const foes = {
  weak: () => side([squad('s1', 'lightInfantry', 11, { leader: 'cap' }), squad('s2', 'archer', 5, { leader: 'cap' })], [commander('cap', 'independentCaptain')]),
  plains: () => side([squad('s1', 'lightInfantry', 16, { leader: 'cap' }), squad('s2', 'archer', 8, { leader: 'cap' })], [commander('cap', 'independentCaptain')]),
  forest: () => side([squad('s1', 'wolf', 12, { leader: 'cap' }), squad('s2', 'archer', 6, { leader: 'cap' })], [commander('cap', 'independentCaptain')]),
};
const N = 300;
for (const [label, leader, mor] of [['led (real N7)', 'god', 20], ['leaderless (draft model)', null, 20], ['led + Iron Will', 'god', 50]] as const) {
  const out: string[] = [];
  for (const [fname, mk] of Object.entries(foes)) {
    let wins = 0;
    for (let s = 0; s < N; s++) {
      const g = commander('god', base, { stats: { ...stats, mor }, script: Array.from({ length: 5 }, () => ({ kind: 'attack' as const })) });
      const r = fightOnce(side([squad('w', 'wolf', 12, { leader })], [g]), mk(), s);
      if (r.winner === 'attacker') wins++;
    }
    out.push(`${fname} ${Math.round((100 * wins) / N)}%`);
  }
  console.log(label, out.join(' | '));
}
