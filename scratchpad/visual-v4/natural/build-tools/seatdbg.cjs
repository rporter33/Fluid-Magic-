const { launch, open, PAGE, SHOTS } = require('./nlib.cjs');
(async () => {
  const b = await launch(), errors = []; const p = await open(b, PAGE, { errors, settle: 1200 });
  for (const [v, src] of [['mid100', 'm.setScale(110 / m.ev("MED_DIAM"), 800, 500)'], ['nearC', 'm.setScale(m.maxScale() * 0.9, 260, 640)'], ['m40mid', 'm.ev("fitToCloth()"); m.setMonth(40); m.setScale(1.0, 900, 500)']]) {
    await p.evaluate((s) => { const m = window.__mock; return eval(s); }, src); await p.waitForTimeout(1500);
    const S = await p.evaluate(() => window.__mock.reliefSeats()); console.log(v, JSON.stringify({ hamlet: S.hamlet, hut: S.hut }));
    const names = [...(S.hamlet ? S.hamlet.over : []), ...(S.hut ? S.hut.over : [])].map((s) => s.split(' ')[0]);
    for (const n of names) { const info = await p.evaluate((n) => window.__mock.ev(`(() => { const i = names.indexOf('${n}'), p = prov[i], lay = RL_PIECE_CACHE.get('L'), st = lay.seats.get(i); return { terrain: p.terrain, fog: fogOf(i), well: !!p.well, springs: p.springs, fx: (p.fx||[]).map(f=>f.kind), scar: p.scar, seat: st.kind, scen: lay.scen.filter(q=>q.i===i).length, stones: lay.stones.filter(q=>q.i===i).length, wells: lay.wells.filter(q=>q.i===i).length, events: lay.events.some(e=>e.p.i===i) }; })()`), n); console.log('  ', n, JSON.stringify(info));
      const [x, y] = await p.evaluate((n) => window.__mock.at(n), n); await p.screenshot({ path: `${SHOTS}../out/seat-${v}-${n}.png`, clip: { x: Math.max(0, x - 90), y: Math.max(0, y - 90), width: 180, height: 150 } }); }
  }
  await b.close();
})();
