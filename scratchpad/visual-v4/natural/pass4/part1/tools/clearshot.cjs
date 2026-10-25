const { launch, open, ev } = require('./lib.cjs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, process.env.PAGEFILE, { log, q: process.argv[2] || '', settle: 2500 }); await p.mouse.move(720, 896); await p.waitForTimeout(1000);
  await p.screenshot({ path: process.argv[3], clip: { x: 200, y: 150, width: 500, height: 350 } }); console.log(log.pageErrors); await b.close(); })();
