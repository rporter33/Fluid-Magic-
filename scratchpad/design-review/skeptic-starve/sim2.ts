const u = 11;
for (const prop of [false, true]) {
  let c = 200, hp = 2200; const out: number[] = [];
  for (let d = 1; d <= 30; d++) {
    const nh = Math.max(0, hp - c * u * 0.02);
    c = prop ? (hp > 0 ? Math.min(c, Math.ceil(c * nh / hp)) : 0) : Math.ceil(nh / u);
    hp = nh; if (d === 1 || d === 10 || d === 30) out.push(c);
  }
  console.log(prop ? 'prop' : 'ceil', out.join(','));
}
