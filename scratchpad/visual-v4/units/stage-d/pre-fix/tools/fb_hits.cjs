// Where the struck troops of each Fireball (battle a) and the Entangle target (battle c) stand at impact.
const { launch, openPage } = require('./lib.cjs');
(async () => {
  const browser = await launch();
  const { page } = await openPage(browser, process.argv[2], '?paused=1');
  const r = await page.evaluate(() => {
    const G = window.__battle.game, out = [];
    for (const k of ['a', 'c']) {
      G.load(k); const T = G.stage.T, p = { x: 0, y: 0, h: 0 };
      for (const fx of T.spellFx) {
        if (fx.spell !== 'fireball' && fx.spell !== 'entangle') continue;
        const cf = T.F[fx.caster]; figPos(T, cf, fx.t0, p); const c = { x: +p.x.toFixed(1), y: +p.y.toFixed(1), h: +p.h.toFixed(1) };
        const hits = fx.hitFigs.map((fi) => { const f = T.F[fi]; figPos(T, f, fx.impact, p); return { fi, g: T.G[f.g].g.unit, x: +p.x.toFixed(1), y: +p.y.toFixed(1), died: f.death ? +f.death.t.toFixed(2) : null, wounds: f.wounds.filter((w) => Math.abs(w.t - fx.impact) < 0.3).length }; });
        const tg = fx.targets.map((gi) => { const Gq = T.G[gi]; const h = G.stage.hull(Gq, fx.impact); return { g: Gq.g.unit, n: Gq.figs.length, hull: h && { X: +h.X.toFixed(0), Y: +h.Y.toFixed(0), rx: +h.rx.toFixed(0), ry: +h.ry.toFixed(0) } }; });
        out.push({ k, spell: fx.spell, form: fx.form, t0: fx.t0, impact: fx.impact, caster: c, hits, targets: tg });
      }
    }
    return out;
  });
  for (const x of r) console.log(JSON.stringify(x));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
