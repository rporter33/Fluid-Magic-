const { launch, openPage } = require('./lib.cjs');
(async () => {
  const browser = await launch();
  const { page } = await openPage(browser, process.argv[2], '?paused=1');
  const r = await page.evaluate(() => {
    const G = window.__battle.game; G.load('c'); const T = G.stage.T, f = T.F[2], Gr = T.G[2], p = { x: 0, y: 0, h: 0 };
    const pos = [44.5, 45.0, 45.5, 45.9, 46.2, 46.6, 47.0, 48, 49, 50].map((t) => { figPos(T, f, t, p); return [t, +p.x.toFixed(1), +p.y.toFixed(1)]; });
    return { rout: f.rout, leaveT: Gr.leaveT, routT: Gr.routT, death: f.death, pos, segs: T.segments.filter((s) => s.t0 > 40).map((s) => [s.label, +s.t0.toFixed(2), +s.t1.toFixed(2)]) };
  });
  console.log(JSON.stringify(r, null, 1));
  await browser.close();
})();
