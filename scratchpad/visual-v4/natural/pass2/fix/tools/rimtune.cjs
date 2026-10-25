// the rim decision's margin and jitter against the rendered wild-edge check: node rimtune.cjs '[[m, jit], ...]'
const { launch, open, ev, mev, PAGE } = require('./lib.cjs');
const V = [['start', 'm.ev("fit(); draw()")'], ['min', 'm.setScale(m.minScale(), 800, 500)'], ['mid', 'm.setScale(1.0, 640, 480)'], ['ref', 'm.setScale(1.142, 700, 560)'], ['refAsh', 'm.zoomTo(1.142, "Ashmoor")'], ['near', 'm.setScale(m.maxScale() * 0.8, 600, 300)'], ['nearMere', 'm.setScale(m.maxScale() * 0.8, 900, 490)'], ['max', 'm.setScale(m.maxScale(), 560, 230)'], ['m40', 'm.ev("fit(); draw()"); m.setMonth(40)'], ['m40mid', 'm.setScale(1.0, 900, 500)']];
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }, p = await open(b, PAGE, { log, settle: 800 }); await p.mouse.move(720, 894);
  for (const [m, jit] of JSON.parse(process.argv[2])) { await mev(p, `RL_P.wildRim.m = ${m}; RL_P.wildRim.jit = ${jit}; RL_WRIM.key = ''; RCK = null; draw()`); const row = [];
    for (const [v, src] of V) { await ev(p, src); await p.waitForTimeout(500); const e = await ev(p, 'm.reliefWildEdge()'); row.push(`${v} ${e.fails}f ${e.directShare} rim ${e.rim.share}`); if (e.fails) row.push(JSON.stringify(e.examples.slice(0, 2))); }
    console.log('m', m, 'jit', jit, '|', row.join(' | ')); await ev(p, 'm.setMonth(3)'); }
  console.log('pageErrors', log.pageErrors.length); await b.close(); })();
