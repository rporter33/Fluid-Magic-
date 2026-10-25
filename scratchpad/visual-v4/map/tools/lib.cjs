// shared Playwright helpers for the relief mockup: local d3 and pixi.js routes, page errors, waiting for the bake and the figure atlas
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const D3 = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/vendor-d3/package/dist/d3.min.js';
const PIXI = '/home/user/Fluid-Magic-/node_modules/pixi.js/dist/pixi.min.js';
async function launch() { return chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }); }
async function open(browser, file, w, h, q = '', errors = [], opts = {}) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: opts.dpr || 1 });
  page.on('pageerror', (e) => errors.push(`[${w}x${h}${q}] pageerror: ` + e.message + ' @ ' + (e.stack || '').split('\n').slice(0, 3).join(' | ')));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`[${w}x${h}${q}] console: ` + m.text()); });
  await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: D3, contentType: 'application/javascript' }));
  await page.route(/cdn\.jsdelivr\.net\/npm\/pixi\.js@8\.22\.0\/dist\/pixi\.min\.js/, (r) => r.fulfill({ path: PIXI, contentType: 'application/javascript' }));
  await page.goto('file://' + file + q, { waitUntil: 'networkidle' });
  if (!/look=v3/.test(q) && !opts.v3) await page.waitForFunction(() => window.__mock && window.__mock.ev('RB.ready && (FIGS.ready || !!FIGS.err)'), null, { timeout: opts.timeout ?? 90000, polling: 250 }).catch((e) => { console.log('TIMEOUT; errors so far:', JSON.stringify(errors)); throw e; });
  await page.waitForTimeout(opts.settle ?? 900);
  return page;
}
module.exports = { launch, open };
