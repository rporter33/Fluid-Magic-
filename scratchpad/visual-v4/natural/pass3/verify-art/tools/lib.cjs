// verify-art helpers (adapted from pass2/verify/tools/lib.cjs): local d3 and pixi, page errors recorded
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const SP = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad';
const D3 = SP + '/vendor-d3/package/dist/d3.min.js';
const PIXI = '/home/user/Fluid-Magic-/node_modules/pixi.js/dist/pixi.min.js';
const PAGE = SP + '/visual-v4/map/game-screen-v4.html';
const P2 = SP + '/visual-v4/natural/pass3/before/game-screen-v4.html'; // pass 2 final, md5 fed36962
const ME = SP + '/visual-v4/natural/pass3/verify-art/';
const OUT = ME + 'out/', SHOTS = ME + 'shots/';
async function launch() { return chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }); }
async function open(browser, file, { w = 1440, h = 900, q = '', dpr = 1, settle = 1200, log = { pageErrors: [] }, wait = true } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
  const page = await ctx.newPage(); const tag = `[${file.split('/').slice(-2).join('/')} ${w}x${h}${q} dpr${dpr}]`;
  page.on('pageerror', (e) => log.pageErrors.push(`${tag} ${e.message}`));
  await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: D3, contentType: 'application/javascript' }));
  await page.route(/cdn\.jsdelivr\.net\/npm\/pixi\.js@8\.22\.0\/dist\/pixi\.min\.js/, (r) => r.fulfill({ path: PIXI, contentType: 'application/javascript' }));
  await page.goto('file://' + file + q, { waitUntil: 'load', timeout: 90000 });
  if (wait && !/look=v3/.test(q)) await page.waitForFunction(() => window.__mock && window.__mock.reliefReady && window.__mock.reliefReady(), null, { timeout: 300000, polling: 250 });
  await page.waitForTimeout(settle);
  return page;
}
const ev = (p, s) => p.evaluate((s) => { const m = window.__mock; return eval(s); }, s);
const mev = (p, s) => p.evaluate((s) => window.__mock.ev(s), s);
module.exports = { launch, open, ev, mev, PAGE, P2, ME, OUT, SHOTS, SP };
module.exports.PAGES = { p3: module.exports.PAGE, p2: module.exports.P2 };
