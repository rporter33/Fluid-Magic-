// The firelight question's before/after pair (critique, owner question 3): Fireball 1 just after its impact, at the 2x
// camera on the struck block, with the light on the troops off (light.add = 0: what the old multiply tint showed) and on
// (0.5 at the peak). node qstills.cjs PAGE OUTDIR
const { launch, openPage } = require('./lib.cjs');
(async () => {
  const [PAGE, OUT] = process.argv.slice(2);
  const b = await launch();
  const { page } = await openPage(b, PAGE, '?b=a&paused=1', { w: 1440, h: 900 });
  await page.addStyleTag({ content: '#hud > *:not(#ticker), #transport, #picker, #camctl, #menu, #loading { display: none !important; }' });
  for (const [tag, k] of [['off', 0], ['on', 0.5]]) {
    const r = await page.evaluate(([k]) => {
      const G = window.__battle.game; G.playing = false; FX_LOOKS.fireball.light.add = k;
      const fx = G.stage.fx.spells[0], I = fx.clusters[0], t = fx.beats.impact[0] + 0.07;
      G.follow = true; G.user = null; G.render(t); const z = G.curCam.z * 2; // the automatic camera's zoom each time: the pair matches
      G.user = { cx: sx(I.x, I.y), cy: sy(I.x, I.y, 10), z }; G.follow = false; G.t = t; G.render(t);
      const w = G.stage.world; return { X: w.position.x + sx(I.x, I.y) * w.scale.x, Y: w.position.y + sy(I.x, I.y, 10) * w.scale.y, man: 28 * w.scale.x };
    }, [k]);
    await page.screenshot({ path: `${OUT}/light-${tag}.png`, clip: { x: Math.round(r.X - 280), y: Math.round(r.Y - 170), width: 560, height: 340 } });
    console.log(tag, Math.round(r.man));
  }
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
