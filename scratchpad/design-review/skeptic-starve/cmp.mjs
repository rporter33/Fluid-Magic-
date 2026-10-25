const U = 11, d = 0.02;
function run(rule, count, hp, days) {
  const out = [];
  for (let t = 1; t <= days; t++) {
    if (count <= 0) { out.push([t, 0, 0]); break; }
    const max = count * U;
    const avg = hp / count;
    hp = Math.max(0, hp - max * d);
    if (rule === 'current') count = Math.ceil(hp / U);
    else count = Math.min(count, Math.ceil(hp / avg));
    if (t === 1 || t % 5 === 0) out.push([t, count, +hp.toFixed(1)]);
  }
  return out.map(([t,c,h]) => `d${t}:${c}/${h}`).join(' ');
}
for (const [c, h] of [[10, 110], [10, 60], [80, 880], [80, 480]]) {
  console.log(`start ${c} troops ${h}hp`);
  console.log('  current     ', run('current', c, h, 60));
  console.log('  proportional', run('prop', c, h, 60));
}
