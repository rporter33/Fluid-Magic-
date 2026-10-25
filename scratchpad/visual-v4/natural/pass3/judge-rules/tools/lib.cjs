// judge-rules helpers: copied from pass2/verify/tools/lib.cjs; the page is chosen by name (p2 = the live pass-2 build, relief, massif, open = the prototypes, rebuilt here from their parts)
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const SP = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad';
const D3 = SP + '/vendor-d3/package/dist/d3.min.js';
const PIXI = '/home/user/Fluid-Magic-/node_modules/pixi.js/dist/pixi.min.js';
const ME = SP + '/visual-v4/natural/pass3/judge-rules/';
const PAGES = { p2: ME + 'rebuild/live/game-screen-v4.html', relief: ME + 'rebuild/relief/game-screen-v4.html', massif: ME + 'rebuild/massif/game-screen-v4.html', open: ME + 'rebuild/open/game-screen-v4.html',
  p2s7: ME + 'rebuild/live-s7/game-screen-v4.html', reliefs7: ME + 'rebuild/relief-s7/game-screen-v4.html', massifs7: ME + 'rebuild/massif-s7/game-screen-v4.html', opens7: ME + 'rebuild/open-s7/game-screen-v4.html',
  p2s31: ME + 'rebuild/live-s31/game-screen-v4.html', reliefs31: ME + 'rebuild/relief-s31/game-screen-v4.html', massifs31: ME + 'rebuild/massif-s31/game-screen-v4.html', opens31: ME + 'rebuild/open-s31/game-screen-v4.html',
  p2alt: ME + 'rebuild/live-alt/game-screen-v4.html', reliefalt: ME + 'rebuild/relief-alt/game-screen-v4.html', massifalt: ME + 'rebuild/massif-alt/game-screen-v4.html', openalt: ME + 'rebuild/open-alt/game-screen-v4.html',
  beforeNatural: SP + '/visual-v4/natural/game-screen-v4.before-natural.html' };
const OUT = ME + 'out/', SHOTS = ME + 'shots/';
async function launch() { return chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }); }
async function open(browser, file, { w = 1440, h = 900, q = '', dpr = 1, settle = 1200, log = { pageErrors: [], console: [], requests: [] }, reducedMotion, wait = true } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, reducedMotion });
  const page = await ctx.newPage(); const tag = `[${w}x${h}${q} dpr${dpr}]`;
  page.on('pageerror', (e) => log.pageErrors.push(`${tag} ${e.message} @ ${(e.stack || '').split('\n').slice(0, 3).join(' | ')}`));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') log.console.push(`${tag} ${m.type()}: ${m.text().slice(0, 200)}`); });
  page.on('request', (r) => { const u = r.url(); if (!/^(file|data|blob):/.test(u)) log.requests.push(u.slice(0, 120)); });
  await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: D3, contentType: 'application/javascript' }));
  await page.route(/cdn\.jsdelivr\.net\/npm\/pixi\.js@8\.22\.0\/dist\/pixi\.min\.js/, (r) => r.fulfill({ path: PIXI, contentType: 'application/javascript' }));
  const t0 = Date.now();
  await page.goto('file://' + file + q, { waitUntil: 'load', timeout: 120000 });
  if (wait && !/look=v3/.test(q)) await page.waitForFunction(() => window.__mock && window.__mock.reliefReady && window.__mock.reliefReady(), null, { timeout: 400000, polling: 250 });
  page.__readyMs = Date.now() - t0;
  await page.waitForTimeout(settle);
  return page;
}
const ev = (p, s) => p.evaluate((s) => { const m = window.__mock; return eval(s); }, s);
const mev = (p, s) => p.evaluate((s) => window.__mock.ev(s), s);
const HASH = `(() => { const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data; let h = 0x811c9dc5; for (let k = 0; k < d.length; k++) { h ^= d[k]; h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(16); })()`;
const page = (n) => { if (!PAGES[n]) throw new Error('page? ' + n); return PAGES[n]; };
module.exports = { launch, open, ev, mev, PAGES, page, ME, OUT, SHOTS, SP, HASH };
