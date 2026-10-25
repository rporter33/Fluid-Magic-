// pass 4 part 1 harness helpers (from pass 3b's verifier lib): local d3 and pixi, every page error / console message / request recorded
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const SP = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad';
const D3 = SP + '/vendor-d3/package/dist/d3.min.js';
const PIXI = '/home/user/Fluid-Magic-/node_modules/pixi.js/dist/pixi.min.js';
const PAGE = SP + '/visual-v4/map/game-screen-v4.html';
const BEFORE = SP + '/visual-v4/natural/pass4/part1/before/game-screen-v4.html'; // the pass-3b page (md5 0ca3a196...)
const ME = SP + '/visual-v4/natural/pass4/part1/';
const OUT = ME + 'out/', SHOTS = SP + '/visual-v4/natural/pass4/shots/part1/';
async function launch() { return chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--js-flags=--max-old-space-size=4096'] }); }
async function open(browser, file, { w = 1440, h = 900, q = '', dpr = 1, settle = 1200, log = { pageErrors: [], console: [], requests: [] }, reducedMotion, wait = true, mobile = false, timeout = 600000 } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, reducedMotion, isMobile: mobile, hasTouch: mobile });
  const page = await ctx.newPage(); const tag = `[${w}x${h}${q} dpr${dpr}]`;
  page.on('pageerror', (e) => log.pageErrors.push(`${tag} ${e.message} @ ${(e.stack || '').split('\n').slice(0, 3).join(' | ')}`));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') log.console.push(`${tag} ${m.type()}: ${m.text().slice(0, 200)}`); });
  page.on('request', (r) => { const u = r.url(); if (!/^(file|data|blob):/.test(u)) log.requests.push(u.slice(0, 120)); });
  await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: D3, contentType: 'application/javascript' }));
  await page.route(/cdn\.jsdelivr\.net\/npm\/pixi\.js@8\.22\.0\/dist\/pixi\.min\.js/, (r) => r.fulfill({ path: PIXI, contentType: 'application/javascript' }));
  const t0 = Date.now();
  await page.goto('file://' + file + q, { waitUntil: 'load', timeout: 120000 });
  if (wait && !/look=v3/.test(q)) await page.waitForFunction(() => window.__mock && window.__mock.reliefReady && window.__mock.reliefReady(), null, { timeout, polling: 250 });
  else await page.waitForFunction(() => window.__mock, null, { timeout: 120000, polling: 250 });
  page.__readyMs = Date.now() - t0;
  await page.waitForTimeout(settle);
  return page;
}
const ev = (p, s) => p.evaluate((s) => { const m = window.__mock; return eval(s); }, s);
const mev = (p, s) => p.evaluate((s) => window.__mock.ev(s), s);
const HASH = `(() => { const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data; let h = 0x811c9dc5; for (let k = 0; k < d.length; k++) { h ^= d[k]; h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(16); })()`;
// the p4Off views, settled (two equal frames 600 ms apart), as p90a/p90b compute them: injected so they run on the pass-3b page too
const VIEWSRC = `(async () => { const H = () => { const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data; let v = 0x811c9dc5; for (let k = 0; k < d.length; k++) { v ^= d[k]; v = Math.imul(v, 0x01000193); } return (v >>> 0).toString(16); };
  const sl = (ms) => new Promise((r) => setTimeout(r, ms)), settled = async (f) => { f(); let last = null; for (let k = 0; k < 15; k++) { await sl(600); draw(); const h = H(); if (h === last) return h; last = h; } return last; };
  const V = { start: () => { hoverProv = -1; RL_LINK.prov = -1; fit(); RCK = null; draw(); }, far: () => window.__mock.setScale(minScale, 800, 500), mid: () => window.__mock.setScale(1.0, 640, 480), near: () => window.__mock.setScale(maxScale * 0.85, 420, 520) };
  const names = app.classList.contains('phone') ? ['fit'] : ['start', 'far', 'mid', 'near'], out = {}; V.fit = V.start;
  for (const v of names) out[v] = await settled(V[v]); await settled(V.start);
  return { key: (RELIEF() ? 'relief-' + view.terrain : 'v3') + '|' + innerWidth + 'x' + innerHeight + '@' + devicePixelRatio, views: out }; })()`;
module.exports = { launch, open, ev, mev, PAGE, BEFORE, ME, OUT, SHOTS, SP, HASH, VIEWSRC };
