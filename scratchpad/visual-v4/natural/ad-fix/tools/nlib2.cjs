// natural-view build helpers: local d3 and pixi routes, every page error, console error and failed request recorded
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const SP = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad';
const D3 = SP + '/vendor-d3/package/dist/d3.min.js';
const PIXI = '/home/user/Fluid-Magic-/node_modules/pixi.js/dist/pixi.min.js';
const PAGE = SP + '/visual-v4/map/game-screen-v4.html';
const BEFORE = process.env.BEFORE || (SP + '/visual-v4/natural/game-screen-v4.before-natural.html');
const OUT = SP + '/visual-v4/natural/ad-fix/out/';
const SHOTS = SP + '/visual-v4/natural/shots/';
async function launch() { return chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }); }
async function open(browser, file, { w = 1440, h = 900, q = '', dpr = 1, settle = 1200, errors = [], touch = false, reducedMotion, wait = true } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, hasTouch: touch, reducedMotion });
  const page = await ctx.newPage(); const tag = `[${file.split('/').pop()} ${w}x${h}${q} dpr${dpr}]`;
  page.on('pageerror', (e) => errors.push(`${tag} pageerror: ${e.message} @ ${(e.stack || '').split('\n').slice(0, 3).join(' | ')}`));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`${tag} console.${m.type()}: ${m.text()}`); });
  await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: D3, contentType: 'application/javascript' }));
  await page.route(/cdn\.jsdelivr\.net\/npm\/pixi\.js@8\.22\.0\/dist\/pixi\.min\.js/, (r) => r.fulfill({ path: PIXI, contentType: 'application/javascript' }));
  const t0 = Date.now();
  await page.goto('file://' + file + q, { waitUntil: 'load', timeout: 60000 });
  if (wait && !/look=v3/.test(q)) await page.waitForFunction(() => window.__mock && window.__mock.reliefReady && window.__mock.reliefReady(), null, { timeout: 180000, polling: 200 });
  page.__readyMs = Date.now() - t0;
  await page.waitForTimeout(settle);
  return page;
}
const realErrors = (errors) => errors.filter((x) => !/software WebGL|willReadFrequently|GPU stall|fonts\.g|ERR_FAILED|net::/.test(x));
module.exports = { launch, open, PAGE, BEFORE, OUT, SHOTS, SP, realErrors };
