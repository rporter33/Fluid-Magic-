// Pilot smoke test: page errors, the fx layer, the pilot casts' beats.
const { launch, openPage } = require('./lib.cjs');
(async () => {
  const browser = await launch();
  const { page, errors } = await openPage(browser, process.argv[2], '?paused=1');
  const r = await page.evaluate(() => {
    const G = window.__battle.game, out = { fxReady: FXLIB.ready, frames: Object.keys(FXLIB.frames).length, reduced: G.reduced };
    for (const k of ['a', 'c']) {
      G.load(k); const st = G.stage;
      out[k] = { fx: !!st.fx, spells: st.fx ? st.fx.spells.map((fx) => ({ spell: fx.spell, form: fx.beats.form, beats: Object.fromEntries(Object.entries(fx.beats).filter(([kk]) => kk !== 'form').map(([kk, v]) => [kk, v.map((x) => +x.toFixed(3))])), clusters: (fx.clusters || []).map((c) => [c.figs.length, Math.round(c.x), Math.round(c.y), +(c.tLand || 0).toFixed(2), c.main ? 'main' : 'frag']), held: (fx.held || []).map((h) => [h.f.id, +h.t1.toFixed(2), h.why]), fxEnd: +fx.fxEnd.toFixed(2), kills: (fx.kills || []).length })) : null, decals: st.fx ? st.fx.decals.count : 0, duration: +st.T.duration.toFixed(2) };
      // draw a few frames through each pilot cast
      if (st.fx) for (const fx of st.fx.spells.slice(0, 2)) for (const tt of [fx.t0 + 0.3, fx.beats.travel[0] + 0.2, fx.beats.impact[0] + 0.05, fx.beats.impact[0] + 0.5]) { G.seek(tt); G.render(tt); }
    }
    return out;
  });
  console.log(JSON.stringify(r, null, 1));
  console.log('errors', errors, await page.evaluate(() => window.__errors));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
