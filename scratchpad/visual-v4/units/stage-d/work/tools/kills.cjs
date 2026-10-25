// Shoots a Fireball's blast kills close up (thrown, burning out, charred): node kills.cjs PAGE OUTDIR n [zoomMul]
const fs = require('fs'), path = require('path');
const { launch, openPage } = require('./lib.cjs');
(async () => {
  const [PAGE, OUT, nStr, zStr] = process.argv.slice(2);
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await launch();
  const { page, errors } = await openPage(browser, PAGE, '?paused=1', { w: 1200, h: 800 });
  const plan = await page.evaluate(([n]) => {
    const G = window.__battle.game; G.load('a'); G.playing = false;
    const fx = G.stage.fx.spells.filter((x) => x.spell === 'fireball')[n];
    return { kills: fx.kills.map((f) => ({ id: f.id, t: f.death.t, fall: f.death.fall, from: f.death.from, at: f.death.at, hop: f.death.hop })), impact: fx.beats.impact[0] };
  }, [+nStr]);
  const k = plan.kills[0];
  const shots = [];
  for (const dt of [-0.05, 0.12, 0.3, 0.55, 0.9, 1.6, 3.2]) {
    const t = k.t + dt;
    await page.evaluate(([t, k, zm]) => {
      const G = window.__battle.game; G.follow = true; G.user = null; G.t = t; G.render(t);
      const c = G.curCam, p = k.at || k.from;
      G.user = { cx: sx(p.x, p.y), cy: sy(p.x, p.y, 8), z: c.z * zm }; G.follow = false; G.render(t);
    }, [t, k, +(zStr || 3)]);
    const file = path.join(OUT, `kill-${nStr}-${dt.toFixed(2)}.png`);
    await page.screenshot({ path: file, clip: { x: 300, y: 200, width: 600, height: 400 } });
    shots.push(file);
  }
  console.log(JSON.stringify({ plan, shots: shots.map((s) => path.basename(s)), errors }, null, 1));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
