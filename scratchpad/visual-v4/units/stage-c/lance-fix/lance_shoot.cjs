// Stage C lance fix: the Ash Riders in battle a and the Wolf Riders' front (harness) in battle c, standing and in the
// charge, at the top zoom on a retina screen (DPR 2, tier H) and at play zoom (DPR 1, tier S).
//   PAGE=<html> TAG=before|after node lance_shoot.cjs <outdir>
const fs = require('fs'), path = require('path');
const { launch, openPage } = require('/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/perfqw/tools/lib.cjs');
const OUT = process.argv[2]; fs.mkdirSync(OUT, { recursive: true });
const TAG = process.env.TAG || 'shot';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// battle seconds: standing at deploy, on the move, and in the charge (from the group hull's track, probe_time)
const MOMENTS = { a: [['stand', 6], ['move', 10], ['charge', 22]], c: [['stand', 6], ['move', 14], ['charge', 34]] };
(async () => {
  const browser = await launch();
  const meta = [];
  for (const [dpr, zoom, label] of [[2, 2.5, 'H'], [1, 1.1, 'S']]) {
    const { page, errors, ctx } = await openPage(browser, process.env.PAGE, '?paused=1', { w: 1280, h: 720, dpr });
    await page.addStyleTag({ content: '#hud { visibility: hidden !important; } * { transition: none !important; animation: none !important; }' });
    for (const [key, unit] of [['a', 'ashRider'], ['c', 'wolfRider']]) {
      const targets = await page.evaluate(([k, u]) => {
        const G = window.__battle.game; G.speed = 1; G.load(k); G.playing = false;
        if (G.setWolfFront) G.setWolfFront('harness');
        const st = G.stage, T = st.T;
        return st.S.groups.filter((g) => g.unit === u && !g.isCmd).map((g) => ({ idx: g.idx, appear: T.G[g.idx].appear }));
      }, [key, unit]);
      for (const tg of targets) {
        for (const [moment, t] of MOMENTS[key]) {
          const info = await page.evaluate(([gi, t, z]) => {
            const G = window.__battle.game, st = G.stage, T = st.T;
            G.follow = true; G.user = null; G.seek(t); G.render(t);
            const hl = st.hull(T.G[gi], t);
            const view = T.G[gi].s < 0 ? 'back' : 'front';
            G.follow = false; G.user = { cx: hl.X, cy: hl.Y - 22, z }; G.render(t);
            return { view, tier: st.paint.tier, t, look: st.paint.lookOf[gi] };
          }, [tg.idx, t, zoom]);
          await wait(400);
          const base = `${TAG}-battle-${key}-${unit}-g${tg.idx}-${moment}-${label}`;
          await page.screenshot({ path: path.join(OUT, base + '.png'), timeout: 240000 });
          meta.push({ base, key, unit, group: tg.idx, moment, dpr, zoom, ...info });
        }
      }
    }
    const errs = errors.concat(await page.evaluate(() => (window.__errors || []).slice()));
    meta.push({ dpr, errors: errs });
    await ctx.close();
  }
  fs.writeFileSync(path.join(OUT, `${TAG}-battle.json`), JSON.stringify(meta, null, 1));
  console.log(JSON.stringify(meta.filter((m) => m.base).map((m) => [m.base, m.view, m.tier])));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
