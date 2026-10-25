// probe: rails at M40 (natural) and the rest/lines floor examples in Clear: node railprobe.cjs [query]
const { launch, open, ev } = require('./lib.cjs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, process.env.PAGEFILE, { log, q: process.argv[2] || '', settle: 1500 }); await p.mouse.move(720, 896);
  const out = {};
  out.restStart = await ev(p, `(() => { const R = m.reliefLinesRest(); return [R.samples, R.min, R.under, R.examples]; })()`);
  await ev(p, `m.ev("fit(); draw()"); m.setMonth(40)`); await p.waitForTimeout(1800);
  out.railsM40 = await ev(p, `(() => { const R = m.reliefRails(); return [R.samples, R.fails, R.worstContrast, R.worstAt, R.failList]; })()`);
  out.restM40 = await ev(p, `(() => { const R = m.reliefLinesRest(); return [R.samples, R.min, R.under, R.examples]; })()`);
  await ev(p, `m.setScale(1.0, 900, 500)`); await p.waitForTimeout(1800);
  out.railsM40mid = await ev(p, `(() => { const R = m.reliefRails(); return [R.samples, R.fails, R.worstContrast, R.worstAt, R.failList]; })()`);
  console.log(JSON.stringify(out, null, 1), log.pageErrors); await b.close(); })();
