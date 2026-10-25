// node measure.cjs <html> <outjson> [w h dpr]: the bake times, memory and the per-frame costs of the relief map by zoom, with a per-function breakdown
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const SP = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad';
const D3 = SP + '/vendor-d3/package/dist/d3.min.js';
const PIXI = '/home/user/Fluid-Magic-/node_modules/pixi.js/dist/pixi.min.js';
const [html, outPath, w = '1440', h = '900', dpr = '1'] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--js-flags=--max-old-space-size=4096'] });
  const ctx = await b.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: +dpr });
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: D3, contentType: 'application/javascript' }));
  await page.route(/cdn\.jsdelivr\.net\/npm\/pixi\.js@8\.22\.0\/dist\/pixi\.min\.js/, (r) => r.fulfill({ path: PIXI, contentType: 'application/javascript' }));
  const t0 = Date.now();
  await page.goto('file://' + html, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.__mock && window.__mock.reliefReady && window.__mock.reliefReady(), null, { timeout: 900000, polling: 250 });
  const readyMs = Date.now() - t0; await page.waitForTimeout(1500);
  const ev = (s) => page.evaluate((s) => window.__mock.ev(s), s);
  const base = await ev(`({ provinces: provs.length, cells: N, edges: EDGE.size, W, H, MED_DIAM, bake: [RB.BW, RB.BH], times: window.__mock.reliefTimes(), memory: window.__mock.reliefMemory(), fit: fitScale, min: minScale, max: maxScale, start: startScale() })`);
  // wrap the draw's parts to time them
  await ev(`(() => { window.__T = {}; window.__C = {}; const names = ['rlDrawRails','rlLayout','rlDrawPieces','rlPaintLabels','rlFarRelief','rlNearDetail','rlDrawWater','rlGlow','rlDrawWildContours','rlDrawLip','rlPlacePieces','rlWashSync','rlRim','rlThread','rlLiveLabels','rlDrawProvFloor','rlInnerLine','rlModeRaster','rlRenderStatic','present'];
    for (const n of names) { const f = eval(n); if (typeof f !== 'function') continue; const wr = function (...a) { const t = performance.now(); try { return f.apply(this, a); } finally { const d = performance.now() - t; window.__T[n] = (window.__T[n] || 0) + d; window.__C[n] = (window.__C[n] || 0) + 1; } }; try { eval(n + ' = wr'); } catch (e) { window.__C['x_' + n] = String(e).slice(0, 60); } }
    return true; })()`);
  const dpxList = [['leanBack', 'min'], ['far58', 58], ['far66', 66], ['start', 'start'], ['mid140', 140], ['near250', 250], ['near400', 400]];
  const rows = [];
  for (const [tag, d] of dpxList) {
    const s = d === 'min' ? base.min : d === 'start' ? base.start : d / base.MED_DIAM;
    const r = await ev(`(() => { const s = ${s}; const [kx, ky] = cent[redCap]; window.__mock.setScale(s, kx, ky); draw(); const med = (a) => { const q = [...a].sort((x, y) => x - y); return +q[q.length >> 1].toFixed(2); };
      const st = []; let br = null; for (let k = 0; k < 4; k++) { window.__T = {}; window.__C = {}; RCK = null; const t = performance.now(); draw(); st.push(performance.now() - t); if (k === 3) br = Object.fromEntries(Object.entries(window.__T).map(([n, v]) => [n, +v.toFixed(2)])); }
      const sf = []; for (let k = 0; k < 3; k++) { RCK = null; const t = performance.now(); draw(); ctx.getImageData(0, 0, 1, 1); sf.push(performance.now() - t); } const fr = []; for (let k = 0; k < 30; k++) { cam.x += (k % 2 ? -1 : 1); const t = performance.now(); draw(); fr.push(performance.now() - t); } const ff = []; for (let k = 0; k < 20; k++) { cam.x += (k % 2 ? -1 : 1); const t = performance.now(); draw(); ctx.getImageData(0, 0, 1, 1); ff.push(performance.now() - t); }
      const hv = []; const pick = provList.filter((i) => { const [x, y] = toScreen(...cent[i]); return x > 200 && x < cw - 200 && y > 120 && y < ch - 120; }); for (let k = 0; k < 12; k++) { hoverProv = pick[k % pick.length] ?? -1; const t = performance.now(); draw(); hv.push(performance.now() - t); } hoverProv = -1; draw();
      const lay = RL_PIECE_CACHE.get('L'); const inView = provList.filter((i) => { const [x, y] = toScreen(...cent[i]); return x > 0 && x < cw && y > 0 && y < ch; }).length;
      return { scale: +cam.s.toFixed(4), dpx: +(cam.s * MED_DIAM).toFixed(1), band: bandOf(cam.s), staticMs: med(st), staticAll: st.map((v) => +v.toFixed(1)), breakdown: br, cachedFrameMs: med(fr), staticFlushMs: med(sf), cachedFlushMs: med(ff), hoverFrameMs: med(hv), provincesInView: inView, labels: lay ? lay.labels.length : null, armies: lay ? lay.armies.length : null, seats: lay ? [...lay.seats.values()].filter((q) => q.kind).length : null, linesDrawn: RL_LINES.drawn.length, lineStats: RL_LINES.stats, mip: rlMipLevel() }; })()`);
    rows.push({ tag, ...r }); console.log(tag, JSON.stringify(r));
  }
  // a zoom change while inside the cache (the wheel: no re-layout until it settles)
  const out = { html, readyMs, viewport: [+w, +h, +dpr], base, rows, errors: errs };
  fs.writeFileSync(outPath, JSON.stringify(out, null, 1)); console.log('ready', readyMs, 'errors', errs.length, JSON.stringify(base.times).slice(0, 1200));
  await b.close();
})();
