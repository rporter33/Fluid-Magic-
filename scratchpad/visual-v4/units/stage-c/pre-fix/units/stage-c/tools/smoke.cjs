// Stage C integration smoke: loads the mockup, reports errors, the painted looks and bodies per battle.
const { launch, openPage } = require('/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/perfqw/tools/lib.cjs');
(async () => {
  const browser = await launch();
  const { page, errors } = await openPage(browser, process.env.PAGE, '?paused=1');
  const r = await page.evaluate(() => {
    const G = window.__battle.game, out = [];
    for (const k of ['a', 'b', 'c']) {
      G.load(k); const st = G.stage;
      out.push({ k, bigs: st.bigs.map((b) => [b.G.g.unit, b.fig, b.body.painted, b.body.view]), looks: st.S.groups.map((g) => [g.unit, st.paint.lookOf[g.idx] || st.paint.why[g.idx]]).filter((x) => ['ashRider', 'wolfRider', 'fireSprite', 'hornetSwarm', 'salamander', 'treant', 'greatWyrm'].includes(x[0])), toned: st.standInToned || 0,
        cre: G.checkCreatures(), h: G.checkBigHeights(), wf: G.checkWolfFront() });
    }
    return { out, errs: window.__errors.slice(), tex: G.app.renderer.texture.managedTextures.filter(Boolean).length };
  });
  console.log(JSON.stringify(r, null, 1), errors);
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
