const { launch, open, ev } = require('./lib.cjs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, process.env.PAGEFILE, { log, settle: 1500 }); await p.mouse.move(720, 895);
  for (const src of ['m.setScale(0.75, 800, 500)']) { await ev(p, src); await p.waitForTimeout(1600); const r = await ev(p, 'm.reliefNatural(true).readers'); console.log(r.normal.lightness.patchAcc, r.normal.lightness.provinceAcc, JSON.stringify(r.normal.lightness.missed), r.pass); }
  await b.close(); })();
