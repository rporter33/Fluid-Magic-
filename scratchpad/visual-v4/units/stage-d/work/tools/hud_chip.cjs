// Reads the Entangle debuff where the player sees it: the ticker line at the impact and the held commander's card chip
// with its rounds left. node hud_chip.cjs PAGE
const { launch, openPage } = require('./lib.cjs');
(async () => {
  const browser = await launch();
  const { page, errors } = await openPage(browser, process.argv[2], '?paused=1', { w: 1600, h: 900 });
  const r = await page.evaluate(async () => {
    const G = window.__battle.game; G.load('c'); G.playing = false;
    const fx = G.stage.fx.spells.find((x) => x.spell === 'entangle');
    const gi = G.stage.T.F[fx.held[0].f.id].g;
    const out = {};
    for (const t of [46.0, 47.5, 50.0]) {
      G.seek(t); G.select(gi); G.render(t); G.hud.update(t);
      await new Promise((ok) => setTimeout(ok, 50));
      out[t] = { ticker: document.getElementById('ticker').textContent.trim(), chips: [...document.querySelectorAll('#hover .chips span')].map((s) => s.textContent), round: document.querySelector('#round .rn') && document.querySelector('#round .rn').textContent };
    }
    out.sound = fx.sound.map((c) => [c.id, +c.t.toFixed(3)]);
    return out;
  });
  console.log(JSON.stringify({ r, errors }, null, 1));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
