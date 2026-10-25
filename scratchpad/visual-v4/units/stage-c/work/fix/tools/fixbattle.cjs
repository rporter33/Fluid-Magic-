// Stage C fix pass: the critique's battle views of each fixed subject, for one page (run once on the pre-fix page and once
// on the rebuilt one): each painted creature, mount and big body at play zoom (a man 28 css px, tier S) and at the top zoom
// (72 css px a man, tier H), standing, HUD hidden; the deploy with the HUD (the Wolf Rider front control's visibility);
// the hover card of each big body. 1920 x 1080 at DPR 1, and the top zooms again at DPR 2 (1280 x 720).
//   node fixbattle.cjs <page.html> <outdir> <prefix>
const fs = require('fs'), path = require('path');
const { launch, openPage } = require('/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/perfqw/tools/lib.cjs');
const [PAGE, OUT, PRE] = process.argv.slice(2);
fs.mkdirSync(OUT, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await launch();
  const log = { control: {}, shots: [], errors: [] };
  for (const dpr of [1, 2]) {
    const { page, errors, ctx } = await openPage(b, PAGE, '?paused=1', { w: dpr === 1 ? 1920 : 1280, h: dpr === 1 ? 1080 : 720, dpr });
    for (const key of ['a', 'b', 'c']) {
      const T = await page.evaluate((k) => {
        const G = window.__battle.game; G.speed = 1; G.load(k); G.playing = false;
        const st = G.stage, T = st.T, set = new Set(['fireSprite', 'hornetSwarm', 'ashRider', 'wolfRider']);
        return { M: G.moments(), subj: st.S.groups.filter((g) => g.size >= 3 || (set.has(g.unit) && !g.isCmd)).map((g) => ({ idx: g.idx, unit: g.unit, s: T.G[g.idx].s, appear: T.G[g.idx].appear })) };
      }, key);
      if (dpr === 1) {
        await page.evaluate((t) => { const G = window.__battle.game; G.follow = true; G.user = null; window.__battle.seek(t); }, T.M.deploy);
        await wait(600);
        log.control[key] = await page.evaluate(() => { const e = document.getElementById('wrfront'); return { exists: !!e, hidden: e ? e.hidden : null }; });
        await page.screenshot({ path: path.join(OUT, `${PRE}-${key}-deploy.png`), timeout: 240000 });
      }
      for (const tg of T.subj) {
        const t = Math.max(T.M.deploy, tg.appear + 1.4);
        for (const [zn, zz] of (dpr === 1 ? [['play', 1.0], ['top', 72 / 28]] : [['top', 2.5]])) {
          await page.evaluate(([gi, t, z]) => {
            const G = window.__battle.game, st = G.stage, T = st.T;
            G.follow = true; G.user = null; G.seek(t); G.render(t);
            let X, Y;
            const bb = st.bigs.find((q) => q.G.idx === gi);
            if (bb) { X = bb.body.root.x; Y = bb.body.root.y - bb.body.H * 0.42; z = Math.min(z, 0.8 * window.innerHeight / bb.body.H); }
            else { const hl = st.hull(T.G[gi], t); X = hl.X; Y = hl.Y - 20; }
            G.follow = false; G.user = { cx: X, cy: Y, z }; G.render(t);
            document.getElementById('hud').style.visibility = 'hidden';
          }, [tg.idx, t, zz]);
          await wait(450);
          const name = `${PRE}-${key}-${tg.unit}-${zn}-dpr${dpr}`;
          await page.screenshot({ path: path.join(OUT, name + '.png'), timeout: 240000 });
          await page.evaluate(() => { document.getElementById('hud').style.visibility = ''; });
          log.shots.push(name);
        }
        if (dpr === 1 && T.subj.length && (tg.unit === 'treant' || tg.unit === 'salamander' || tg.unit === 'greatWyrm' || tg.unit === 'hornetSwarm' || tg.unit === 'wolfRider')) {
          await page.evaluate((t) => { const G = window.__battle.game; G.follow = true; G.user = null; G.seek(t); G.render(t); }, t);
          const box = await page.evaluate((gi) => { const h = window.__battle.game.hud; const el = h.cardEls.get(gi) || h.miniEls.get(gi); if (!el) return null; el.scrollIntoView({ block: 'nearest', inline: 'center' }); const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; }, tg.idx);
          if (box) {
            await page.mouse.move(box.x + box.w / 2, box.y + box.h / 2); await wait(450);
            await page.screenshot({ path: path.join(OUT, `${PRE}-${key}-hover-${tg.unit}.png`), timeout: 240000 });
            await page.mouse.move(5, 300); await wait(150);
          }
        }
      }
    }
    log.errors = log.errors.concat(errors, await page.evaluate(() => (window.__errors || []).slice()));
    await ctx.close();
  }
  fs.writeFileSync(path.join(OUT, `${PRE}-log.json`), JSON.stringify(log, null, 1));
  console.log(JSON.stringify({ control: log.control, errors: log.errors, n: log.shots.length }));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
