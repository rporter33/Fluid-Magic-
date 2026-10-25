// the wild edge test and the quiet edge's share at several views: node edge.cjs [views]
const { launch, open, ev, mev, PAGE } = require('./lib.cjs');
const V = { start: null, far: 'm.setScale(m.minScale(), 800, 500)', mid: 'm.setScale(1.0, 640, 480)', ref: 'm.setScale(1.142, 700, 560)', nearA: 'm.setScale(m.maxScale() * 0.55, 490, 237)', nearG: 'm.setScale(m.maxScale() * 0.6, 640, 673)', nearM: 'm.setScale(m.maxScale() * 0.6, 920, 585)', maxA: 'm.setScale(m.maxScale(), 520, 230)', fit: 'm.ev("fit(); draw()")' };
(async () => {
  const want = (process.argv[2] || 'start,far,mid,ref,nearA,nearG,nearM,maxA').split(','), b = await launch(), log = { pageErrors: [], console: [], requests: [] };
  const p = await open(b, process.env.PAGEFILE || PAGE, { log, settle: 800, q: process.env.Q || '', dpr: Number(process.env.DPR || 1) }); await p.mouse.move(720, 895);
  for (const v of want) { if (V[v]) await ev(p, V[v]); await p.waitForTimeout(1200);
    const r = await mev(p, `(() => { const E = rlWildEdgeCheck(); const m = RL_WRIM.map, Ls = []; let need = 0, n = 0; if (m) for (const e of m.values()) for (let k = 0; k < e.np; k++) { n++; if (e.bad[k]) { need++; if (e.Ls) Ls.push(e.Ls[k]); } } Ls.sort((a, b) => a - b);
      return { band: E.band, samples: E.samples, fails: E.fails, direct: E.directShare, rim: E.rim, worst: E.worstFailRatio, ex: E.examples.slice(0, 3), pieces: n, need, L: Ls.length ? [Ls[0], Ls[Ls.length >> 1], Ls[Ls.length - 1]] : null }; })()`);
    console.log(v, JSON.stringify(r)); }
  console.log('pageErrors', log.pageErrors.length, log.pageErrors.slice(0, 2)); await b.close();
})();
