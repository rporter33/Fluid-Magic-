// Shared Playwright setup for the stage D animation part: the pilot's flags, Pixi routed to the repo's copy, fonts
// blocked. Pages open from file:// (the old inlined build) or from a local static server (the asset-split build).
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const PIXI = '/home/user/Fluid-Magic-/node_modules/pixi.js/dist/pixi.min.js';
async function launch() {
  return chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--enable-precise-memory-info', '--js-flags=--expose-gc'] });
}
const TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.css': 'text/css' };
/** A tiny static server over a directory (what "a local static server" means for the split build). */
function serve(root, port) {
  return new Promise((ok) => {
    const srv = http.createServer((req, res) => {
      const u = decodeURIComponent(req.url.split('?')[0]);
      const f = path.join(root, u);
      if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(res);
    });
    srv.listen(port || 0, '127.0.0.1', () => ok(srv));
  });
}
async function openPage(browser, url, q, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: opts.w || 1920, height: opts.h || 1080 }, deviceScaleFactor: opts.dpr || 1,
    hasTouch: !!opts.touch, isMobile: !!opts.touch, reducedMotion: opts.reducedMotion || 'no-preference' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.googleapis|ERR_FAILED/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.route(/cdn\.jsdelivr\.net\/npm\/pixi\.js@8\.22\.0\/dist\/pixi\.min\.js/, (r) => r.fulfill({ path: PIXI, contentType: 'application/javascript' }));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  const full = /^https?:/.test(url) ? url : 'file://' + url;
  await page.goto(full + (q || ''), { waitUntil: 'load', timeout: 300000 });
  if (opts.noReady !== true) await page.evaluate(() => (window.__mock && window.__mock.ready) || (window.__battle && window.__battle.ready));
  return { ctx, page, errors };
}
module.exports = { launch, openPage, serve };
