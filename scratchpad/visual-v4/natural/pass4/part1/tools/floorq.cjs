// quick floor-line suite: node floorq.cjs <natural|clear|terrain> [dpr] [views,...] -> rest, focus (hover/select), rails, lines per view
const { launch, open, ev, mev } = require('./lib.cjs');
const look = process.argv[2] || 'natural', dpr = +(process.argv[3] || 1);
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, process.env.PAGEFILE, { log, dpr, q: look === 'clear' ? '?terrain=clear' : '', settle: 1500 }); await p.mouse.move(720, 896);
  if (look === 'terrain') { await mev(p, "setMode('terrain')"); await p.waitForFunction(() => window.__mock.look().clear, null, { timeout: 300000, polling: 300 }); await p.waitForTimeout(1500); }
  const geo = await mev(p, '({ W, H, D: MED_DIAM })');
  const V = { start: null, far: `m.setScale(60 / ${geo.D}, ${geo.W / 2}, ${geo.H / 2})`, mid: 'm.setScale(1.0, 640, 480)', ref: 'm.setScale(1.142, 700, 560)', near1180: 'm.setScale(m.maxScale() * 0.8, 1180, 300)', nearW: 'm.setScale(m.maxScale() * 0.8, 300, 300)', m40: 'm.ev("fit(); draw()"); m.setMonth(40)', m40mid: 'm.setScale(1.0, 900, 500)', back3: 'm.ev("fit(); draw()"); m.setMonth(3)' };
  const views = (process.argv[4] || Object.keys(V).join(',')).split(',');
  for (const v of views) { if (V[v]) await ev(p, V[v]); await p.waitForTimeout(1800);
    const r = await ev(p, `(() => { const R = m.reliefLinesRest(), F = m.reliefLinesFocus(), K = m.reliefRails(), L = m.reliefLines({ step: 1 }); return { rest: [R.samples, R.min, R.under, R.examples], hover: [F.hover.samples, F.hover.min, F.hover.under, F.hover.failing, F.hover.examples], select: [F.select.samples, F.select.min, F.select.under, F.select.failing, F.select.examples], rails: [K.samples, K.fails, K.worstContrast, K.failList], lines: [L.hairline.samples, L.hairline.under, L.internal.samples, L.internal.under, L.underExamples, L.pass] }; })()`);
    const bad = []; if (r.rest[2]) bad.push('rest'); if (r.hover[2]) bad.push('hover'); if (r.select[2]) bad.push('select'); if (r.rails[1]) bad.push('rails'); if (!r.lines[5]) bad.push('lines');
    console.log(look, v, bad.length ? 'FAIL ' + bad.join(',') : 'ok', JSON.stringify(r)); }
  console.log('pageErrors', log.pageErrors.length, log.pageErrors.slice(0, 3)); await b.close(); })();
