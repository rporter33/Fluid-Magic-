// timing: the same cameras right after load (rung decided live) and after an idle wait (rung decided by the idle prefetch); fresh browser each
const { launch, open, ev, mev, PAGE, OUT, SHOTS } = require('./lib.cjs'); const fs = require('fs');
const dpr = Number(process.argv[2] || 1);
const V = [['min', 'm.setScale(m.minScale(), 800, 500)'], ['mid', 'm.setScale(1.0, 640, 480)'], ['closest', 'm.setScale(m.maxScale(), 800, 500)'], ['zoomOut1', 'm.setScale(m.ev("cam.s") / 1.25, 800, 500)']];
const FR = `(() => { const was = new Set(SKIP); SKIP.clear(); for (const k of ['pieces', 'labels', 'badges', 'arrows']) SKIP.add(k); RCK = null; draw(); const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data; SKIP.clear(); for (const k of was) SKIP.add(k); RCK = null; draw(); let h = 0x811c9dc5; for (let k = 0; k < d.length; k++) { h ^= d[k]; h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(16); })()`;
(async () => { const res = {};
  for (const [nm, settle] of [['live1', 0], ['idle1', 4000], ['live2', 0], ['idle2', 4000]]) for (const [v, src] of V) {
    const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, PAGE, { log, dpr, settle, reducedMotion: 'reduce' }); await p.mouse.move(720, 897);
    const pre = await mev(p, 'RL_QE.pre.n'); if (v === 'zoomOut1') await ev(p, 'm.ev("fit(); RCK = null; draw()")'); await ev(p, src); await p.waitForTimeout(300); const h = await mev(p, FR); const E = await ev(p, 'm.reliefWildEdge()');
    (res[v] ??= {})[nm] = [h, pre, E.rim && E.rim.quietEdgeShare, E.fails]; console.log(nm, v, JSON.stringify(res[v][nm])); await b.close(); }
  for (const v of Object.keys(res)) { const r = res[v]; console.log(v, 'live==live', r.live1[0] === r.live2[0], 'idle==idle', r.idle1[0] === r.idle2[0], 'live==idle', r.live1[0] === r.idle1[0]); }
  fs.writeFileSync(`${OUT}histdiag3-dpr${dpr}.json`, JSON.stringify(res, null, 1)); })();
