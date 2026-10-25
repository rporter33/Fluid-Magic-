// Compare decision 17 (all-or-nothing) with the coded partial-payment rule under a chronic 20% deficit.
const inc = 8, due = 10;
let gA = 0, uA = 0, maxA = 0, gB = 0, uB = 0;
for (let d = 0; d < 300; d++) {
  gA += inc; if (gA >= due) { gA -= due; uA = 0; } else uA += 1; maxA = Math.max(maxA, uA);
  gB += inc; const paid = Math.max(0, Math.min(gB, due)); gB -= paid; uB = paid >= due ? 0 : uB + (due - paid) / due;
}
console.log('decision17: max unpaidDays', maxA, 'penalty', Math.floor(maxA / 30));
console.log('coded rule: unpaidDays', uB.toFixed(1), 'penalty', Math.floor(uB / 30));
