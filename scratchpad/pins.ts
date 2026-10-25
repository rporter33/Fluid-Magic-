import { DUEL_ROWS, DUEL_FOES, duelCell } from '/home/user/fm-6b3/tests/sim/battle/fixtures/duel';
const lines: string[] = [];
for (const row of DUEL_ROWS) {
  const cells = DUEL_FOES.map((f) => Math.round(duelCell(row, f, 400).win * 100));
  lines.push(`  ${row.id}: [${cells.join(', ')}],`);
}
console.log(lines.join('\n'));
