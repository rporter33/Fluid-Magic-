// quick load probe: page errors and ready state after N s: node probe.cjs [query] [seconds] [pagefile]
const L = require('./lib.cjs');
const [q = '', secs = '30', file = L.PAGE] = process.argv.slice(2);
(async () => { const b = await L.launch(), ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }), p = await ctx.newPage(), errs = [];
  p.on('pageerror', (e) => errs.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' | ')));
  await p.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: L.SP + '/vendor-d3/package/dist/d3.min.js', contentType: 'application/javascript' }));
  await p.route(/cdn\.jsdelivr\.net\/npm\/pixi\.js@8\.22\.0\/dist\/pixi\.min\.js/, (r) => r.fulfill({ path: '/home/user/Fluid-Magic-/node_modules/pixi.js/dist/pixi.min.js', contentType: 'application/javascript' }));
  await p.goto('file://' + file + q, { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(+secs * 1000);
  const st = await p.evaluate(() => { const m = window.__mock; return m ? { ready: m.reliefReady ? m.reliefReady() : null } : 'no __mock'; }).catch((e) => 'ERR ' + e.message);
  console.log(JSON.stringify(st), JSON.stringify(errs.slice(0, 5), null, 1)); await b.close(); })();
