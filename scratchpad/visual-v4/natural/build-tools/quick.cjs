// quick load: report page errors within N seconds without waiting for the bake
const { launch, PAGE, SHOTS, realErrors } = require('./nlib.cjs');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const b = await launch(), errors = [];
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push('pageerror: ' + e.message + ' @ ' + (e.stack || '').split('\n').slice(0, 4).join(' | ')));
  p.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await p.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: require('./nlib.cjs').SP + '/vendor-d3/package/dist/d3.min.js', contentType: 'application/javascript' }));
  await p.route(/cdn\.jsdelivr\.net\/npm\/pixi\.js@8\.22\.0\/dist\/pixi\.min\.js/, (r) => r.fulfill({ path: '/home/user/Fluid-Magic-/node_modules/pixi.js/dist/pixi.min.js', contentType: 'application/javascript' }));
  await p.goto('file://' + PAGE + (process.argv[2] || ''), { waitUntil: 'load' });
  const until = Date.now() + Number(process.argv[3] || 60) * 1000; let st = null;
  while (Date.now() < until) { await p.waitForTimeout(1000); st = await p.evaluate(() => { try { return window.__mock ? window.__mock.ev('({ ready: RB.ready, running: RB.running, look: RB.L && Object.keys(RB.L).filter(k => RB.L[k]), t: RB.t })') : 'no mock'; } catch (e) { return 'err ' + e.message; } }); if (errors.length || (st && st.ready)) break; }
  console.log(JSON.stringify(st)); console.log(JSON.stringify(realErrors(errors), null, 1));
  if (st && st.ready) await p.screenshot({ path: SHOTS + 'quick.png' });
  await b.close();
})();
