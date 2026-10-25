for (const ratio of [0.9, 0.67, 0.5, 0.2, 0.05, 0.03, 0.02]) {
  const upkeep = 300; const income = upkeep * ratio; // monthly
  let g = 0, u = 0, maxU = 0, paidDays = 0;
  let g2 = 0, u2 = 0;
  for (let d = 0; d < 360; d++) {
    g += income / 30; const due = upkeep / 30;
    if (g >= due) { g -= due; u = 0; paidDays++; } else { u += 1; }
    maxU = Math.max(maxU, u);
    g2 += income / 30; const paid = Math.min(g2, due); g2 -= paid;
    u2 = paid >= due ? 0 : u2 + (due - paid) / due;
  }
  console.log(`ratio ${ratio}: decision17 maxUnpaid=${maxU} penalty=${Math.floor(maxU/30)} paidDays=${paidDays}/360 | code unpaidDays after 360d=${u2.toFixed(1)} penalty=${Math.floor(u2/30)}`);
}
