const { launch, open, mev, ev, PAGE } = require('./lib.cjs');
const S = (s, x, y) => `m.setScale(${s}, ${x}, ${y})`, MAX = (k, x, y) => `m.setScale(m.maxScale() * ${k}, ${x}, ${y})`;
const V = [['start', null], ['far', S('m.minScale()', 800, 500)], ['mid', S(1.0, 640, 480)], ['maxAsh', MAX(1.0, 520, 230)]];
(async () => { const b = await launch(); const p = await open(b, PAGE, { settle: 300 });
  for (const [n, st] of V) { if (st) { await ev(p, st); await p.waitForTimeout(900); }
    for (const cfg of (process.argv[2] || 'base').split(';')) {
      console.log(n, cfg, JSON.stringify(await mev(p, `(() => { ${cfg === 'base' ? '' : cfg}; RL_QE.ns = 0; RL_QE.nf = 0; RL_WRIM.key = ''; RL_QE.memo = new Map(); rlQuietEdgeMap(); return { pieceShare: +rlQuietShare().toFixed(3), sampleFail: +(RL_QE.nf / RL_QE.ns).toFixed(3), ns: RL_QE.ns }; })()`))); }
  }
  await b.close(); })();
