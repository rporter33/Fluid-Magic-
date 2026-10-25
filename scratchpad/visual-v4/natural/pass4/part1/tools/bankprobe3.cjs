const { launch, open, ev, mev } = require('./lib.cjs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, process.env.PAGEFILE, { log, q: process.argv[2] || '', settle: 1500 }); await p.mouse.move(720, 896); await p.waitForTimeout(800);
  const rect = await mev(p, `(() => { const r = canvas.getBoundingClientRect(); return [r.left, r.top]; })()`); const x = +process.argv[4], y = +process.argv[5];
  console.log('canvas at', rect); await p.screenshot({ path: process.argv[3], clip: { x: rect[0] + x - 40, y: rect[1] + y - 30, width: 80, height: 60 } });
  const px = await mev(p, `(() => { const d = ctx.getImageData(${x} * dpr, ${y - 4} * dpr, 1, 9).data; const o = []; for (let k = 0; k < 9; k++) o.push(rgb2hex([d[k * 4], d[k * 4 + 1], d[k * 4 + 2]])); return o; })()`); console.log('column at x', x, 'y', y - 4, '..', y + 4, px);
  await b.close(); })();
