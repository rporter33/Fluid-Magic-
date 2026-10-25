// Playwright driver for the battle mockup: routes the Pixi CDN URL to the repo's local copy (the CDN
// is blocked in this container) and runs a list of steps from a JSON file.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const PAGE = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/battle-mockup.html';
const PIXI = '/home/user/Fluid-Magic-/node_modules/pixi.js/dist/pixi.min.js';
(async () => {
  const steps = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] }).catch(() => chromium.launch());
  let page = null;
  const errors = [];
  const open = async (w, h, q) => {
    if (page) await page.close();
    page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    await page.route(/cdn\.jsdelivr\.net\/npm\/pixi\.js@8\.22\.0\/dist\/pixi\.min\.js/, (r) => r.fulfill({ path: PIXI, contentType: 'application/javascript' }));
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.googleapis|ERR_FAILED/.test(m.text())) errors.push('console: ' + m.text()); });
    await page.goto('file://' + PAGE + (q || ''), { waitUntil: 'load', timeout: 60000 });
    await page.evaluate(() => window.__battle.ready);
  };
  const out = {};
  for (const s of steps) {
    try {
      if (s.open) await open(s.open[0], s.open[1], s.query);
      if (s.load) await page.evaluate((k) => window.__battle.load(k), s.load);
      if (s.eval) out[s.name || 'eval'] = await page.evaluate(s.eval);
      if (s.seek !== undefined) await page.evaluate((t) => { window.__battle.seek(t); }, s.seek);
      if (s.moment) out[(s.name || s.moment) + '_t'] = await page.evaluate(([m, d]) => { const t = window.__battle.moments()[m]; if (t === null || t === undefined) return null; window.__battle.seek(t + (d || 0)); return t; }, [s.moment, s.dt || 0]);
      if (s.zoom) await page.evaluate((z) => { const G = window.__battle.game; G.userFromCurrent(); G.user.z *= z; G.render(G.t); }, s.zoom);
      if (s.follow) await page.evaluate(() => { const G = window.__battle.game; G.follow = true; G.user = null; G.render(G.t); });
      if (s.wait) await page.waitForTimeout(s.wait);
      if (s.mouse) await page.mouse.move(s.mouse[0], s.mouse[1]);
      if (s.hoverUnit) {
        const pt = await page.evaluate((u) => { const g = window.__battle.groups().find((x) => x.unit === u); return g ? window.__battle.screenOf(g.idx) : null; }, s.hoverUnit);
        if (pt) { await page.mouse.move(pt.x + (s.dx || 0), pt.y + (s.dy || 0)); await page.waitForTimeout(100); }
        out['hover_' + s.hoverUnit] = pt;
      }
      if (s.shot) await page.screenshot({ path: s.shot });
    } catch (e) { errors.push('step: ' + JSON.stringify(s).slice(0, 80) + ' ' + e.message); }
  }
  out.errors = errors;
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})();
