const { launch, PAGE, SP } = require('./lib.cjs');
(async () => { const b = await launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(0, 3).join(' | ')));
  await p.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: SP + '/vendor-d3/package/dist/d3.min.js', contentType: 'application/javascript' }));
  await p.route(/cdn\.jsdelivr\.net\/npm\/pixi\.js@8\.22\.0\/dist\/pixi\.min\.js/, (r) => r.fulfill({ path: '/home/user/Fluid-Magic-/node_modules/pixi.js/dist/pixi.min.js', contentType: 'application/javascript' }));
  await p.goto('file://' + PAGE); await p.waitForTimeout(25000); console.log(JSON.stringify(errs.slice(0, 5), null, 1), await p.evaluate(() => window.__mock && window.__mock.reliefReady && window.__mock.reliefReady())); await b.close(); })();
