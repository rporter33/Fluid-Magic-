const { launch, open, ev, PAGE, SHOTS } = require('./lib.cjs');
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] }, p = await open(b, PAGE, { log, settle: 1500 }); await p.mouse.move(720, 894);
  await ev(p, 'm.zoomTo(1.142, "Ashmoor")'); await p.waitForTimeout(1500);
  const r = await ev(p, `m.ev("(() => { const lay = RL_PIECE_CACHE.get('L'); const sh = rlLiveBox(lay); const i = names.indexOf('Deepmoss'); const lb = lay.labels.find(l => l.i === i); const cr = canvas.getBoundingClientRect(); const ctl = [...document.querySelectorAll('#modes .modebtn, #modes .fitrow')].filter(e => e.offsetParent).map(e => { const q = e.getBoundingClientRect(); return [q.left - cr.left, q.top - cr.top, q.right - cr.left, q.bottom - cr.top].map(v => Math.round(v)); }); return { box: sh(lb.box).map(v => Math.round(v)), text: lb.text, ctl, canvasTop: cr.top, v: viewRect() }; })()")`);
  console.log(JSON.stringify(r));
  await p.screenshot({ path: SHOTS + 'x-deepmoss-ref.png', clip: { x: 1180, y: 300, width: 260, height: 200 } });
  await b.close();
})();
