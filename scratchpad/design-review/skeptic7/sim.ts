function run(n: number, supply: number, unitHp: number) {
  let count = n, hp = n * unitHp, cmdr = 1;
  let firstDeath = -1, settle = -1;
  for (let day = 0; day < 365; day++) {
    const eat = count + cmdr;
    if (eat > supply) {
      hp -= 0.02 * count * unitHp;
      const c = Math.max(0, Math.ceil(hp / unitHp - 1e-9));
      if (c < count && firstDeath < 0) firstDeath = day;
      count = c; hp = Math.min(hp, count * unitHp);
    } else {
      if (settle < 0) settle = day;
      hp = Math.min(count * unitHp, hp + 0.02 * count * unitHp);
    }
  }
  return { n, supply, finalCount: count, firstDeath, fedFromDay: settle };
}
for (const [n, s] of [[30, 30], [30, 20], [30, 14], [32, 25], [40, 20]]) console.log(run(n, s, 10));
