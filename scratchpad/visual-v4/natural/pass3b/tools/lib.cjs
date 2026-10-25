// final verifier helpers (copied from the pass-3 rules verifier) (from the pass-2 verifier's lib): local d3 and pixi, every page error / console message / request recorded, nothing filtered here
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const SP = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad';
const D3 = SP + '/vendor-d3/package/dist/d3.min.js';
const PIXI = '/home/user/Fluid-Magic-/node_modules/pixi.js/dist/pixi.min.js';
const PAGE = SP + '/visual-v4/map/game-screen-v4.html';
const BEFORE = SP + '/visual-v4/natural/pass3b/before/game-screen-v4.html'; // the pass-3 final page (md5 7ef0ee6d...)
const PASS2 = SP + '/visual-v4/natural/pass3/before/game-screen-v4.html'; // pass 2's final page (md5 fed36962...)
const ME = SP + '/visual-v4/natural/pass3b/';
const OUT = ME + 'out/', SHOTS = ME + 'shots/';
async function launch() { return chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }); }
async function open(browser, file, { w = 1440, h = 900, q = '', dpr = 1, settle = 1200, log = { pageErrors: [], console: [], requests: [] }, reducedMotion, wait = true, fonts = 'allow', mobile = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, reducedMotion, isMobile: mobile, hasTouch: mobile });
  const page = await ctx.newPage(); const tag = `[${w}x${h}${q} dpr${dpr}]`;
  page.on('pageerror', (e) => log.pageErrors.push(`${tag} ${e.message} @ ${(e.stack || '').split('\n').slice(0, 3).join(' | ')}`));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') log.console.push(`${tag} ${m.type()}: ${m.text().slice(0, 200)}`); });
  page.on('request', (r) => { const u = r.url(); if (!/^(file|data|blob):/.test(u)) log.requests.push(u.slice(0, 120)); });
  await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: D3, contentType: 'application/javascript' }));
  await page.route(/cdn\.jsdelivr\.net\/npm\/pixi\.js@8\.22\.0\/dist\/pixi\.min\.js/, (r) => r.fulfill({ path: PIXI, contentType: 'application/javascript' }));
  if (fonts === 'abort') await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  const t0 = Date.now();
  await page.goto('file://' + file + q, { waitUntil: 'load', timeout: 90000 });
  if (wait && !/look=v3/.test(q)) await page.waitForFunction(() => window.__mock && window.__mock.reliefReady && window.__mock.reliefReady(), null, { timeout: 300000, polling: 250 });
  page.__readyMs = Date.now() - t0;
  await page.waitForTimeout(settle);
  return page;
}
const ev = (p, s) => p.evaluate((s) => { const m = window.__mock; return eval(s); }, s);
const mev = (p, s) => p.evaluate((s) => window.__mock.ev(s), s);
const HASH = `(() => { const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data; let h = 0x811c9dc5; for (let k = 0; k < d.length; k++) { h ^= d[k]; h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(16); })()`;
module.exports = { launch, open, ev, mev, PAGE, BEFORE, PASS2, ME, OUT, SHOTS, SP, HASH };
