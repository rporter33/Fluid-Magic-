// Close zooms of every painted creature, mount and god in the battles at DPR 2 (tier H, a man about 72 css px, the
// player's top zoom on a retina screen), standing, with what compose.py needs to set its card beside it; and the
// Wolf Rider front both ways in battle c.   PAGE=<html> node close.cjs <outdir>
const fs = require('fs'), path = require('path');
const { launch, openPage } = require('/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/perfqw/tools/lib.cjs');
const OUT = process.argv[2]; fs.mkdirSync(OUT, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const browser = await launch();
  const { page, errors } = await openPage(browser, process.env.PAGE, '?paused=1', { w: 1280, h: 720, dpr: 2 });
  await page.addStyleTag({ content: '#hud { visibility: hidden !important; } * { transition: none !important; animation: none !important; }' });
  const meta = [];
  for (const key of ['a', 'b', 'c']) {
    const targets = await page.evaluate((k) => {
      const G = window.__battle.game; G.speed = 1; G.load(k); G.playing = false;
      const st = G.stage, T = st.T, set = new Set(['fireSprite', 'hornetSwarm', 'ashRider', 'wolfRider']);
      return st.S.groups.filter((g) => g.size >= 3 || (set.has(g.unit) && !g.isCmd)).map((g) => ({ idx: g.idx, unit: g.unit, big: g.size >= 3, t: Math.max(2.2, T.G[g.idx].appear + 1.4) }));
    }, key);
    for (const tg of targets) {
      const fronts = key === 'c' && tg.unit === 'wolfRider' ? ['harness', 'kept'] : [null];
      for (const fr of fronts) {
        const info = await page.evaluate(([gi, t, fr]) => {
          const G = window.__battle.game, st = G.stage, T = st.T;
          if (fr) G.setWolfFront(fr);
          G.follow = true; G.user = null; G.seek(t); G.render(t);
          let X, Y, look = null, view = null, fig = null, status = null;
          const bb = st.bigs.find((b) => b.G.idx === gi);
          const zTop = 2.5; // device px per tier H px stays <= 1.25 at DPR 2
          let z = zTop;
          if (bb) { X = bb.body.root.x; Y = bb.body.root.y - bb.body.H * 0.42; z = Math.min(zTop, 0.78 * window.innerHeight / bb.body.H); fig = bb.fig; view = bb.body.view; const v = PAINT.bigs[fig].views[view]; status = v.status + (v.failed.length ? ' (' + v.failed.join(', ') + ')' : ''); }
          else {
            const hl = st.hull(T.G[gi], t); X = hl.X; Y = hl.Y - 22; look = st.paint.lookOf[gi];
            const L = PAINT.looks[look]; view = T.G[gi].s < 0 ? 'back' : 'front';
            const vv = L.alt && L.alt[view] && PAINT_ALT[look] === 'kept' ? L.altViews.frontKept : (L.views[view] || L.views.back);
            status = vv.status + (vv.failed.length ? ' (' + vv.failed.join(', ') + ')' : '');
          }
          G.follow = false; G.user = { cx: X, cy: Y, z }; G.render(t);
          const card = G.hud.art[gi];
          return { card, z, tier: st.paint.tier, fig, look, view, status, name: T.G[gi].g.unitName, t };
        }, [tg.idx, tg.t, fr]);
        await wait(500);
        const base = `${key}-close-${tg.unit}${fr ? '-front-' + fr : ''}`;
        await page.screenshot({ path: path.join(OUT, base + '.raw.png') });
        const ext = info.card.startsWith('data:image/png') ? 'png' : 'webp';
        fs.writeFileSync(path.join(OUT, base + '.card.' + ext), Buffer.from(info.card.split(',')[1], 'base64'));
        delete info.card;
        meta.push({ key, unit: tg.unit, base, card: base + '.card.' + ext, front: fr, ...info });
      }
    }
    await page.evaluate(() => window.__battle.game.setWolfFront('harness'));
  }
  const cardKinds = await page.evaluate(() => Object.fromEntries(Object.entries(PAINT.cards).map(([k, c]) => [k, c.kind])));
  fs.writeFileSync(path.join(OUT, 'close.json'), JSON.stringify({ shots: meta, cardKinds, errors: errors.concat(await page.evaluate(() => window.__errors.slice())) }, null, 1));
  console.log(JSON.stringify(meta.map((m) => [m.base, m.tier, +m.z.toFixed(2), m.status])));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
