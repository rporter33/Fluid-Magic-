// the quiet-edge decision's samples at a few views: per failing sample the land G and wild W medians, and the least rock L* (neutral warm) whose pair with G passes x1.2
const { launch, open, ev, mev, PAGE, OUT } = require('./lib.cjs'); const fs = require('fs');
const dpr = Number(process.argv[2] || 1), file = process.argv[3] || PAGE, tag = process.argv[4] || 'now';
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, file, { log, dpr, settle: 1500 }); await p.mouse.move(720, 897);
  const geo = await mev(p, '({ D: MED_DIAM, min: minScale, max: maxScale, s: cam.s })'); console.log('ready', p.__readyMs, JSON.stringify(geo));
  const V = [['start', null], ['far', `m.setScale(60 / ${geo.D}, 720, 450)`], ['min', 'm.setScale(m.minScale(), 720, 450)'], ['mid', 'm.setScale(1.0, 640, 480)'], ['near', 'm.setScale(m.maxScale() * 0.8, 700, 500)']];
  const res = {};
  for (const [v, src] of V) { if (src) await ev(p, src); await p.waitForTimeout(1200);
    res[v] = await mev(p, `(() => { RL_WRIM.lru.clear(); RL_QE.hov.clear(); RL_DBG.qeSamples = []; RCK = null; draw(); const S = RL_DBG.qeSamples; RL_DBG.qeSamples = null;
      const ok = (a, b, m) => { const q = rlPairDE(a, b); return q.normal >= 20 * m && q.cvd >= 12 * m; }; const ink = RL_QE_INK; const o = [0,0,0];
      const leastRock = (G) => { for (let L = 30; L <= 80; L++) { rlLabTo(L, 0.8, 3, o, 0); if (ok(o, G, 1.2)) return L; } return 99; };
      const rows = S.map(([x, y, nx, ny, W, G]) => { const pair = ok(W, G, 1.2), inkOk = ok(ink, W, 1.1) && ok(ink, G, 1.1), inkG = ok(ink, G, 1.1); return { pair, inkOk, WL: +rgb2lab(W)[0].toFixed(1), GL: +rgb2lab(G)[0].toFixed(1), need: pair || inkOk ? 0 : leastRock(G), inkG, j: names[provinceAt(x + nx * 8 / cam.s, y + ny * 8 / cam.s)] }; });
      const f = rows.filter((r) => r.need); const hist = {}; for (const r of f) { const k = r.need >= 99 ? '99' : String(Math.floor(r.need / 5) * 5); hist[k] = (hist[k] || 0) + 1; }
      const gl = {}; for (const r of f) { const k = String(Math.floor(r.GL / 5) * 5); gl[k] = (gl[k] || 0) + 1; } const wl = {}; for (const r of f) { const k = String(Math.floor(r.WL / 5) * 5); wl[k] = (wl[k] || 0) + 1; } const inkG = f.filter((r) => r.inkG).length;
      return { samples: rows.length, failing: f.length, share: rlQuietShare(), needHist: hist, failGL: gl, failWL: wl, failInkG: inkG, inkOkShare: +(rows.filter((r) => r.inkOk).length / rows.length).toFixed(3), pairShare: +(rows.filter((r) => r.pair).length / rows.length).toFixed(3) }; })()`);
    console.log(v, JSON.stringify(res[v])); }
  fs.writeFileSync(`${OUT}qestat-${tag}-dpr${dpr}.json`, JSON.stringify(res, null, 1)); console.log('errors', log.pageErrors.length); await b.close(); })();
