// judge-art helpers: copied from pass2/verify/tools/lib.cjs, pages keyed by prototype
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const SP = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad';
const D3 = SP + '/vendor-d3/package/dist/d3.min.js';
const PIXI = '/home/user/Fluid-Magic-/node_modules/pixi.js/dist/pixi.min.js';
const P3 = SP + '/visual-v4/natural/pass3/';
const PAGES = { p3: SP + '/visual-v4/map/game-screen-v4.html', p2: P3 + 'before/game-screen-v4.html', relief: P3 + 'proto-relief/game-screen-v4.html', massif: P3 + 'proto-massif/game-screen-v4.html', open: P3 + 'proto-open/game-screen-v4.html' };
const ME = P3 + 'build/', OUT = ME + 'jout/', SHOTS = ME + 'jout/shots/';
async function launch() { return chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }); }
async function open(browser, file, { w = 1440, h = 900, q = '', dpr = 1, settle = 1200, log = { pageErrors: [], console: [], requests: [] }, wait = true } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
  const page = await ctx.newPage(); const tag = `[${w}x${h}${q} dpr${dpr}]`;
  page.on('pageerror', (e) => log.pageErrors.push(`${tag} ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') log.console.push(`${tag} ${m.type()}: ${m.text().slice(0, 200)}`); });
  page.on('request', (r) => { const u = r.url(); if (!/^(file|data|blob):/.test(u)) log.requests.push(u.slice(0, 120)); });
  await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: D3, contentType: 'application/javascript' }));
  await page.route(/cdn\.jsdelivr\.net\/npm\/pixi\.js@8\.22\.0\/dist\/pixi\.min\.js/, (r) => r.fulfill({ path: PIXI, contentType: 'application/javascript' }));
  const t0 = Date.now();
  await page.goto('file://' + file + q, { waitUntil: 'load', timeout: 90000 });
  if (wait && !/look=v3/.test(q)) await page.waitForFunction(() => window.__mock && window.__mock.reliefReady && window.__mock.reliefReady(), null, { timeout: 300000, polling: 250 });
  page.__readyMs = Date.now() - t0;
  await page.waitForTimeout(settle);
  return page;
}
const ev = (p, s) => p.evaluate((s) => { const m = window.__mock; return eval(s); }, s);
const mev = (p, s) => p.evaluate((s) => window.__mock.ev(s), s);
module.exports = { launch, open, ev, mev, PAGES, ME, OUT, SHOTS, SP };
