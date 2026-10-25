// verifier helpers: local d3 and pixi routes, every page error, console error and failed request recorded
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const D3 = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/vendor-d3/package/dist/d3.min.js';
const PIXI = '/home/user/Fluid-Magic-/node_modules/pixi.js/dist/pixi.min.js';
const PAGE = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/map/game-screen-v4.html';
const ORIG = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/ui-mockup/game-screen.html';
async function launch() { return chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }); }
async function open(browser, file, { w = 1440, h = 900, q = '', dpr = 1, v3 = false, settle = 1200, errors = [], reqs = [], touch = false, reducedMotion } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, hasTouch: touch, reducedMotion });
  const page = await ctx.newPage(); const tag = `[${file.split('/').pop()} ${w}x${h}${q} dpr${dpr}]`;
  page.on('pageerror', (e) => errors.push(`${tag} pageerror: ${e.message} @ ${(e.stack || '').split('\n').slice(0, 3).join(' | ')}`));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`${tag} console.${m.type()}: ${m.text()}`); });
  page.on('requestfailed', (r) => reqs.push(`${tag} failed ${r.url().slice(0, 100)} ${r.failure() && r.failure().errorText}`));
  page.on('request', (r) => { const u = r.url(); if (!u.startsWith('file:') && !u.startsWith('data:') && !u.startsWith('blob:')) reqs.push(`${tag} request ${u.slice(0, 110)}`); });
  await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: D3, contentType: 'application/javascript' }));
  await page.route(/cdn\.jsdelivr\.net\/npm\/pixi\.js@8\.22\.0\/dist\/pixi\.min\.js/, (r) => r.fulfill({ path: PIXI, contentType: 'application/javascript' }));
  const t0 = Date.now();
  await page.goto('file://' + file + q, { waitUntil: 'networkidle', timeout: 60000 });
  if (!v3 && !/look=v3/.test(q)) await page.waitForFunction(() => window.__mock && window.__mock.ev('RB.ready && (FIGS.ready || !!FIGS.err)'), null, { timeout: 120000, polling: 200 });
  page.__readyMs = Date.now() - t0;
  await page.waitForTimeout(settle);
  return page;
}
const HASH = `(() => { const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data; let h = 0x811c9dc5; for (let k = 0; k < d.length; k++) { h ^= d[k]; h = Math.imul(h, 0x01000193); } return h >>> 0; })()`;
module.exports = { launch, open, PAGE, ORIG, HASH };
