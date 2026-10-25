const { launch, open, ev, PAGE, SHOTS } = require('./lib.cjs');
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] }, p = await open(b, PAGE, { log, w: 390, h: 844, settle: 1500 }); await p.mouse.move(195, 838);
  const out = {};
  for (const [tag, s] of [['start', null], ['fit', 'fitScale'], ['min', 'minScale']]) {
    if (s) await ev(p, `m.ev("cam.s = ${s}; clampCam(); RCK = null; draw()")`); await p.waitForTimeout(1200);
    out[tag] = await ev(p, `m.ev("(() => { const cr = canvas.getBoundingClientRect(); const minis = [...document.querySelectorAll('.mini')].filter(e => e.offsetParent).map(e => { const q = e.getBoundingClientRect(); return [q.left - cr.left, q.top - cr.top, q.right - cr.left, q.bottom - cr.top].map(v => Math.round(v)); }); const ch = RL_CHIPS.map(c => ({ text: c.text, box: c.box.map(v => Math.round(v)), under: minis.filter(q => c.box[2] > q[0] && c.box[0] < q[2] && c.box[3] > q[1] && c.box[1] < q[3]).length })); const [mx0, my0] = toScreen(0, 0), [mx1, my1] = toScreen(W, H); return { scale: +cam.s.toFixed(3), dpx: +(cam.s * MED_DIAM).toFixed(1), model: [mx0, my0, mx1, my1].map(Math.round), minis: minis.length, chips: ch }; })()")`);
  }
  await p.screenshot({ path: SHOTS + 'x-phone-min-now.png' });
  console.log(JSON.stringify(out, null, 1)); await b.close();
})();
