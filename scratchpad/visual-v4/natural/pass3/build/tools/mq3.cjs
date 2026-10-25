// share of the quiet edge at standard views; env Q for query; argv[2] optional pre-eval
const { launch, open, mev, ev, PAGE } = require('./lib.cjs');
const S = (s, x, y) => `m.setScale(${s}, ${x}, ${y})`, MAX = (k, x, y) => `m.setScale(m.maxScale() * ${k}, ${x}, ${y})`;
const V = [['start', null], ['far', S('m.minScale()', 800, 500)], ['mid', S(1.0, 640, 480)], ['ref', S(1.142, 700, 560)], ['nearAsh', MAX(0.55, 490, 237)], ['maxAsh', MAX(1.0, 520, 230)]];
(async () => { const b = await launch(); const log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, PAGE, { settle: 300, log, q: process.env.Q || '' });
  if (process.argv[2]) await mev(p, process.argv[2]);
  for (const [n, st] of V) { if (st) { await ev(p, st); await p.waitForTimeout(900); } const r = await mev(p, `(() => { RL_WRIM.key = ""; RL_QE.memo = new Map(); RCK = null; draw(); const c = window.__mock.reliefWildEdge(); return { share: c.rim.quietEdgeShare, fails: c.fails, n: c.samples, direct: c.directShare, worst: c.worstFailRatio, ms: RL_QE.ms }; })()`); console.log(n, JSON.stringify(r)); }
  console.log('pageErrors', log.pageErrors.length, log.pageErrors.slice(0, 2).join(' | ')); await b.close(); })();
