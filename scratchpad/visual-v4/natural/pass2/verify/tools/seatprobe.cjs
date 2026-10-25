const { launch, open, ev, mev, PAGE, SHOTS } = require('./lib.cjs');
(async () => {
  const b = await launch();
  for (const [look, dpr, v] of [['natural', 1, 'm.setScale(m.maxScale() * 0.9, 300, 470)'], ['clear', 1, 'm.setScale(m.maxScale() * 0.9, 300, 470)'], ['clear', 2, 'm.setScale(m.maxScale() * 0.9, 260, 640)']]) {
    const log = { pageErrors: [], console: [], requests: [] };
    const p = await open(b, PAGE, { log, dpr, settle: 1200, q: look === 'clear' ? '?terrain=clear' : '' }); await p.mouse.move(720, 894);
    await ev(p, v); await p.waitForTimeout(1500);
    const r = await ev(p, 'm.reliefSeats()'); console.log(look, dpr, JSON.stringify(r));
    const box = await mev(p, `(() => { const lay = RL_PIECE_CACHE.get('L'), k = cam.s / lay.s; const o = {}; for (const n of ['Tormere', 'Ashstead']) { const st = lay.seats.get(names.indexOf(n)); if (st && st.box) o[n] = [st.kind, st.box.map((q, j) => Math.round(q * k + (j % 2 ? cam.y : cam.x)))]; } const cr = canvas.getBoundingClientRect(); o.cr = [cr.left, cr.top]; return o; })()`);
    console.log(JSON.stringify(box));
    for (const [n, [kind, bb]] of Object.entries(box).filter(([k]) => k !== 'cr')) await p.screenshot({ path: `${SHOTS}seat-${look}-dpr${dpr}-${n}.png`, clip: { x: box.cr[0] + bb[0] - 40, y: box.cr[1] + bb[1] - 40, width: bb[2] - bb[0] + 80, height: bb[3] - bb[1] + 80 } });
    await p.context().close();
  }
  await b.close();
})();
