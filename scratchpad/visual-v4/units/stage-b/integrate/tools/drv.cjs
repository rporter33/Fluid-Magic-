// QA driver: opens the battle mockup with Pixi routed to the local copy, runs an eval script file
// (async function body receiving page, helpers) and prints JSON.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const PAGE = process.env.PAGE || '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/battle-mockup.html';
const PIXI = '/home/user/Fluid-Magic-/node_modules/pixi.js/dist/pixi.min.js';
(async () => {
  const body = fs.readFileSync(process.argv[2], 'utf8');
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errors = [];
  const open = async (w, h, q, opts) => {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: (opts && opts.dpr) || 1, hasTouch: !!(opts && opts.touch), isMobile: !!(opts && opts.mobile) });
    const page = await ctx.newPage();
    await page.route(/cdn\.jsdelivr\.net\/npm\/pixi\.js@8\.22\.0\/dist\/pixi\.min\.js/, (r) => r.fulfill({ path: PIXI, contentType: 'application/javascript' }));
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.googleapis|ERR_FAILED/.test(m.text())) errors.push('console: ' + m.text()); if (m.type() === 'warning') errors.push('warn: ' + m.text().slice(0, 200)); });
    await page.goto('file://' + PAGE + (q || ''), { waitUntil: 'load', timeout: 60000 });
    await page.evaluate(() => window.__battle.ready);
    return page;
  };
  const fn = new (Object.getPrototypeOf(async function () {}).constructor)('open', 'browser', 'fs', 'errors', body);
  let out;
  try { out = await fn(open, browser, fs, errors); } catch (e) { out = { fatal: e.message, stack: e.stack }; }
  console.log(JSON.stringify({ out, errors }, null, 1));
  await browser.close();
})();
