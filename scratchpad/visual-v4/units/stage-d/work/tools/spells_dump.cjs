// Dumps the Fireball and Entangle casts of battles a and c from a mockup page: timing, caster, targets, hits.
const { launch, openPage } = require('./lib.cjs');
(async () => {
  const browser = await launch();
  const { page, errors } = await openPage(browser, process.argv[2], '?paused=1');
  const r = await page.evaluate(() => {
    const G = window.__battle.game, out = {};
    for (const k of ['a', 'b', 'c']) {
      G.load(k); const T = G.stage.T;
      out[k] = { duration: T.duration, moments: G.moments(), spells: T.spellFx.map((fx) => ({ spell: fx.spell, form: fx.form, t0: +fx.t0.toFixed(3), release: +fx.release.toFixed(3), impact: +fx.impact.toFixed(3), t1: +fx.t1.toFixed(3),
        caster: fx.caster, cg: fx.cg, casterUnit: T.G[fx.cg] && T.G[fx.cg].g.unit, casterName: T.G[fx.cg] && T.G[fx.cg].g.personal, targets: (fx.targets || []).map((gi) => T.G[gi].g.unit + '#' + gi + '(' + T.G[gi].figs.length + ')'), hits: (fx.hitFigs || []).length,
        kills: (fx.hitFigs || []).filter((fi) => T.F[fi].death && Math.abs(T.F[fi].death.t - fx.impact) < 0.5).length })),
        rings: T.rings.filter((r) => r.source === 'entangle' || r.debuff).map((r) => ({ g: r.g, unit: T.G[r.g].g.unit, t0: r.t0, t1: r.t1, stat: r.stat, delta: r.delta, source: r.source })) };
    }
    return out;
  });
  console.log(JSON.stringify(r, null, 1));
  console.error(errors);
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
