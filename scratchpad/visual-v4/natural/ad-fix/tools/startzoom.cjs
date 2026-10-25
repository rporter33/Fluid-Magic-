// the start view per window size (natural §10 defect 6) and the hover names against day chips (defect 4)
const { launch, open, PAGE, SHOTS, OUT, realErrors } = require('./nlib2.cjs'); const fs = require('fs');
(async () => {
  const b = await launch(), errors = [], rows = [];
  for (const [w, h] of [[1024, 768], [1280, 720], [1366, 768], [1440, 900], [1920, 1080], [390, 844]]) {
    const p = await open(b, PAGE, { errors, w, h, settle: 1500 });
    const r = await p.evaluate(() => window.__mock.ev(`(() => { const [sx, sy] = toScreen(...cent[redCap]), v = viewRect(), [vx, vy] = toScreen(...cent[cmd.varo.at]); return { s: +cam.s.toFixed(3), fit: +fitScale.toFixed(3), Dpx: +(cam.s * MED_DIAM).toFixed(1), band: bandOf(cam.s), capitalOnScreen: sx > v.l + 20 && sx < v.r - 20 && sy > v.t + 20 && sy < v.b - 20, varoOnScreen: vx > v.l && vx < v.r && vy > v.t && vy < v.b, phone: app.classList.contains('phone') }; })()`));
    // Z returns to the start view after a zoom
    await p.evaluate(() => window.__mock.setScale(0.3, 800, 500)); await p.keyboard.press('z'); await p.waitForTimeout(700);
    r.afterZ = await p.evaluate(() => window.__mock.ev('+(cam.s * MED_DIAM).toFixed(1)'));
    await p.evaluate(() => window.__mock.ev('fit(); draw()')); await p.waitForTimeout(800);
    await p.screenshot({ path: `${SHOTS}size-${w}x${h}.png` }); rows.push({ size: `${w}x${h}`, ...r }); console.log(w, h, JSON.stringify(r));
    await p.context().close();
  }
  const p = await open(b, PAGE, { errors, settle: 1500 }); const hc = {};
  await p.evaluate(() => window.__mock.ev("orderMove(0, 0, acrossTarget)")); await p.waitForTimeout(600);
  hc.start = await p.evaluate(() => window.__mock.reliefHoverChips()); await p.evaluate(() => window.__mock.setScale(1.0, 640, 480)); await p.waitForTimeout(1200); hc.mid = await p.evaluate(() => window.__mock.reliefHoverChips());
  console.log('hover chips', JSON.stringify(hc));
  fs.writeFileSync(OUT + 'startzoom.json', JSON.stringify({ rows, hoverChips: hc }, null, 1));
  console.log('errors', JSON.stringify(realErrors(errors))); await b.close();
})();
