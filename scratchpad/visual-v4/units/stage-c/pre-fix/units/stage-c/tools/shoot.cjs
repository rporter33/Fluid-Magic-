// Stage C integration shots: each battle at deploy and clash (automatic camera, full page and canvas only), close zooms
// of each painted creature, mount and god (their card art saved beside them for the contact sheets), and the Wolf Rider
// front both ways.   PAGE=<html> node shoot.cjs <outdir> [--only a,b,c] [--w 1920 --h 1080]
const fs = require('fs'), path = require('path');
const { launch, openPage } = require('/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/perfqw/tools/lib.cjs');
const a = process.argv.slice(2);
const opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
const OUT = a[0]; fs.mkdirSync(OUT, { recursive: true });
const W = +opt('w', 1920), H = +opt('h', 1080);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const saveUrl = (url, file) => fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
(async () => {
  const browser = await launch();
  const { page, errors } = await openPage(browser, process.env.PAGE, '?paused=1', { w: W, h: H });
  await page.addStyleTag({ content: 'body.nohud #hud { visibility: hidden !important; } * { transition: none !important; animation: none !important; }' });
  const log = { shots: [], close: [] };
  const only = (opt('only', 'a,b,c')).split(',');
  for (const key of only) {
    const M = await page.evaluate((k) => { const G = window.__battle.game; G.speed = 1; G.load(k); G.playing = false; return G.moments(); }, key);
    for (const [n, t] of [['deploy', M.deploy], ['clash', M.clash], ['monster', M.monster]]) {
      if (t === null) continue;
      await page.evaluate((tt) => { const G = window.__battle.game; G.follow = true; G.user = null; window.__battle.seek(tt); }, t);
      await wait(700);
      await page.screenshot({ path: path.join(OUT, `${key}-${n}.full.png`) });
      await page.evaluate(() => document.body.classList.add('nohud')); await wait(120);
      await page.screenshot({ path: path.join(OUT, `${key}-${n}.canvas.png`) });
      await page.evaluate(() => document.body.classList.remove('nohud'));
      log.shots.push({ key, n, t });
    }
    // the big body's moments, framed on it: its breath from the mouth point, a hit, the fall (tilt and darken), dead
    const bigM = await page.evaluate(() => {
      const G = window.__battle.game, T = G.stage.T, out = {};
      const big = T.F.find((f) => T.G[f.g].g.size >= 3);
      if (!big) return out;
      const br = T.spellFx.find((x) => x.spell === 'breath' && x.caster === big.id); if (br) out.breath = br.release + 0.25;
      const hit = big.reacts.find((r) => r.kind !== 'dodge'); if (hit) out.bigHit = hit.t + 0.06;
      if (big.death) { out.bigFall = big.death.t + big.death.fall * 0.5; out.bigDead = big.death.t + big.death.fall + 0.6; }
      return out;
    });
    for (const [n, t] of Object.entries(bigM)) {
      await page.evaluate((tt) => {
        const G = window.__battle.game, st = G.stage; G.seek(tt); G.render(tt);
        const bb = st.bigs[0]; G.follow = false; G.user = { cx: bb.body.root.x, cy: bb.body.root.y - bb.body.H * 0.4, z: Math.min(2, 0.7 * window.innerHeight / bb.body.H) }; G.render(tt);
      }, t);
      await wait(500);
      await page.evaluate(() => document.body.classList.add('nohud')); await wait(120);
      await page.screenshot({ path: path.join(OUT, `${key}-big-${n}.png`) });
      await page.evaluate(() => document.body.classList.remove('nohud'));
      log.shots.push({ key, n, t });
    }
    if (process.env.NOCLOSE) continue;
    // close zooms: every creature, mount and god group at deploy (standing), its card art beside it
    const targets = await page.evaluate(() => {
      const G = window.__battle.game, st = G.stage;
      const set = new Set(['fireSprite', 'hornetSwarm', 'ashRider', 'wolfRider']);
      return st.S.groups.filter((g) => g.size >= 3 || (set.has(g.unit) && !g.isCmd)).map((g) => ({ idx: g.idx, unit: g.unit, big: g.size >= 3 }));
    });
    for (const tg of targets) {
      for (const [n, tt] of [['deploy', M.deploy], ['clash', M.clash]]) {
        const info = await page.evaluate(([gi, t]) => {
          const G = window.__battle.game, st = G.stage, T = st.T;
          G.seek(t); G.render(t);
          let X, Y, h = 40;
          const bb = st.bigs.find((b) => b.G.idx === gi);
          if (bb) { X = bb.body.root.x; Y = bb.body.root.y - bb.body.H * 0.45; h = bb.body.H; }
          else { const hl = st.hull(T.G[gi], t); if (!hl) return null; X = hl.X; Y = hl.Y - 20; h = 60; }
          const z = Math.min(72 / 28, 0.8 * window.innerHeight / (h * 1.25));
          G.follow = false; G.user = { cx: X, cy: Y, z };
          G.render(t);
          return { art: G.hud.art[gi], z, tier: st.paint ? st.paint.tier : null };
        }, [tg.idx, tt]);
        if (!info) continue;
        await wait(500);
        await page.evaluate(() => document.body.classList.add('nohud')); await wait(120);
        const base = `${key}-close-${tg.unit}-${n}`;
        await page.screenshot({ path: path.join(OUT, base + '.png') });
        await page.evaluate(() => document.body.classList.remove('nohud'));
        if (n === 'deploy') saveUrl(info.art, path.join(OUT, `${key}-card-${tg.unit}.${info.art.startsWith('data:image/png') ? 'png' : 'webp'}`));
        log.close.push({ key, unit: tg.unit, n, z: +info.z.toFixed(2), tier: info.tier });
      }
    }
    // the Wolf Rider front both ways (battle c: the far side shows its front)
    const wr = targets.find((x) => x.unit === 'wolfRider');
    if (wr && key === 'c') {
      for (const which of ['harness', 'kept']) {
        await page.evaluate(([gi, t, w]) => {
          const G = window.__battle.game, st = G.stage, T = st.T;
          G.setWolfFront(w); G.seek(t); G.render(t);
          const hl = st.hull(T.G[gi], t);
          G.follow = false; G.user = { cx: hl.X, cy: hl.Y - 18, z: 72 / 28 }; G.render(t);
        }, [wr.idx, M.deploy, which]);
        await wait(500);
        await page.screenshot({ path: path.join(OUT, `c-wolfrider-front-${which}.full.png`) });
        await page.evaluate(() => document.body.classList.add('nohud')); await wait(120);
        await page.screenshot({ path: path.join(OUT, `c-wolfrider-front-${which}.png`) });
        await page.evaluate(() => document.body.classList.remove('nohud'));
      }
      await page.evaluate(() => window.__battle.game.setWolfFront('harness'));
    }
  }
  log.errors = errors.concat(await page.evaluate(() => window.__errors.slice()));
  fs.writeFileSync(path.join(OUT, 'shots.json'), JSON.stringify(log, null, 1));
  console.log(JSON.stringify(log.errors));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
