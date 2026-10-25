// Shared Playwright setup for the stage D pilot (same flags, Pixi routing and font blocking as the audit harness and
// perfqw/tools/lib.cjs).
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const PIXI = '/home/user/Fluid-Magic-/node_modules/pixi.js/dist/pixi.min.js';
async function launch() {
  return chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--enable-precise-memory-info', '--js-flags=--expose-gc'] });
}
async function openPage(browser, file, q, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: opts.w || 1920, height: opts.h || 1080 }, deviceScaleFactor: opts.dpr || 1,
    hasTouch: !!opts.touch, isMobile: !!opts.touch, reducedMotion: opts.reducedMotion || 'no-preference' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.googleapis|ERR_FAILED/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.route(/cdn\.jsdelivr\.net\/npm\/pixi\.js@8\.22\.0\/dist\/pixi\.min\.js/, (r) => r.fulfill({ path: PIXI, contentType: 'application/javascript' }));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto('file://' + file + (q || ''), { waitUntil: 'load', timeout: 240000 });
  if (opts.noReady !== true) await page.evaluate(() => window.__battle && window.__battle.ready);
  return { ctx, page, errors };
}
module.exports = { launch, openPage };
