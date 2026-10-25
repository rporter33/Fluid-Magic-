const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const PAGE = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/battle-mockup.html';
const PIXI = '/home/user/Fluid-Magic-/node_modules/pixi.js/dist/pixi.min.js';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const [w, h] of [[640, 360], [1920, 1080]]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.route(/cdn\.jsdelivr\.net\/npm\/pixi\.js@8\.22\.0\/dist\/pixi\.min\.js/, (r) => r.fulfill({ path: PIXI, contentType: 'application/javascript' }));
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    await page.addInitScript(() => {
      window.__raf = [];
      const orig = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = (cb) => orig((ts) => { const g = window.__battle && window.__battle.game; if (window.__raf.length < 8) window.__raf.push({ ts: +ts.toFixed(1), now: +performance.now().toFixed(1), lastNow: g && g.lastNow !== undefined ? +g.lastNow.toFixed(1) : null, tBefore: g && g.t !== undefined ? +g.t.toFixed(3) : null }); cb(ts); });
    });
    await page.goto('file://' + PAGE, { waitUntil: 'load' });
    await page.evaluate(() => window.__battle.ready);
    await page.waitForTimeout(2500);
    const r = await page.evaluate(() => ({ raf: window.__raf, t: window.__battle.game.t }));
    console.log(w + 'x' + h, JSON.stringify(r));
    await page.close();
  }
  await browser.close();
})();
