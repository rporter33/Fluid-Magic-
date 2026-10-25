import { DUEL_ROWS, DUEL_FOES, duelCell } from '/home/user/fm-6b3/tests/sim/battle/fixtures/duel';
const N = Number(process.argv[2] ?? 400);
const t0 = performance.now();
for (const row of DUEL_ROWS) {
  const cells = DUEL_FOES.map((f) => { const c = duelCell(row, f, N); return `${Math.round(c.win*100)}%${c.hpLeft===null?'':` (${Math.round(c.hpLeft*100)}%)`}`; });
  console.log(`| ${row.label} | ${cells.join(' | ')} |`);
}
console.log(`${((performance.now()-t0)/1000).toFixed(1)} s`);
