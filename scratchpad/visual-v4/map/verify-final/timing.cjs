// fix 12: the static re-render at Near and a fast pan at Near (draw time per frame and frame intervals), page and pre-fix page, alternating rounds. Noisy: shared machine, software raster.
const { launch, open, PAGE } = require('./vlib.cjs');
const BEFORE = PAGE.replace('game-screen-v4.html', 'critique-work/game-screen-v4.before.html');
(async () => {
  const b = await launch();
  for (let round = 0; round < 3; round++) for (const [tag, file] of [['after', PAGE], ['before', BEFORE]]) {
    const p = await open(b, file, { settle: 1200 });
    await p.evaluate(() => { const m = window.__mock; m.setScale(m.maxScale() * 0.9, 800, 500); }); await p.mouse.move(5, 890); await p.waitForTimeout(500);
    const med = await p.evaluate(() => { const m = window.__mock; const r = []; for (let k = 0; k < 7; k++) { const t0 = performance.now(); m.ev('RCK = null; draw()'); r.push(performance.now() - t0); } r.sort((a, b) => a - b); return +r[3].toFixed(1); });
    const pan = await p.evaluate(() => window.__mock.panStats(25, 90));
    const iv = await p.evaluate(() => new Promise((res) => { const m = window.__mock, fr = []; let k = 0, last = 0; const step = (now) => { if (last) fr.push(now - last); last = now; if (k++ > 90) { fr.sort((a, b) => a - b); res({ p50: +fr[fr.length >> 1].toFixed(1), p95: +fr[Math.floor(fr.length * 0.95)].toFixed(1), max: +fr[fr.length - 1].toFixed(1), over100: fr.filter((x) => x > 100).length }); return; } const dx = k % 40 < 20 ? 25 : -25; m.ev('cam.x += ' + dx + '; clampCam(); draw()'); requestAnimationFrame(step); }; requestAnimationFrame(step); }));
    console.log(`round ${round} ${tag}: rerender median ${med} ms | panStats ${JSON.stringify(pan)} | frame intervals ${JSON.stringify(iv)}`);
    await p.context().close();
  }
  await b.close();
})();
