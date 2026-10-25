const u = 11;
function run(c0: number, hp0: number, prop: boolean) {
  let c = c0, hp = hp0, d = 0; const marks: string[] = [];
  while (c > 0 && d < 400) {
    const max = c * u; const nh = Math.max(0, hp - max * 0.02);
    c = prop ? (hp > 0 ? Math.min(c, Math.ceil(c * nh / hp)) : 0) : Math.ceil(nh / u);
    hp = nh; d++;
    if ([1, 10, 25, 50, 75, 100].includes(d)) marks.push(`d${d}:${c}`);
  }
  return `dead at day ${d}; ${marks.join(' ')}`;
}
for (const [c, hp] of [[10, 110], [10, 60], [20, 220]] as const) {
  console.log(`c=${c} hp=${hp} ceil: ${run(c, hp, false)}`);
  console.log(`c=${c} hp=${hp} prop: ${run(c, hp, true)}`);
}
