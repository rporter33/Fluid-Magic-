// merepool.cjs <page> <tag>: the mere's open water against the swamp's peat pools (passable water) as drawn, start view and Near on the mere: RGB samples -> out/final/merepool-<tag>.json
const { launch, open, ev, mev, OUT } = require('./lib.cjs'); const fs = require('fs');
(async () => { const PAGE = process.argv[2], tag = process.argv[3], b = await launch(), log = { pageErrors: [], console: [], requests: [] };
  const p = await open(b, PAGE, { log, settle: 1500 }); await p.mouse.move(720, 896); const out = {};
  for (const [v, src] of [['start', 'm.ev("fit(); draw()")'], ['nearMere', 'm.setScale(m.maxScale() * 0.6, 920, 585)']]) { await ev(p, src); await p.waitForTimeout(1500);
    out[v] = await mev(p, `(() => { const d = rlRedraw(['pieces', 'labels', 'badges', 'arrows']), W2 = canvas.width, H2 = canvas.height, v = viewRect(), Tp = rlNatT('pool'), mere = [], pool = [], D = RLD;
      const mw = WILDS.find((w) => w.kind === 'mere'), Bm = typeof RL_MS !== 'undefined' && RB.ms && RB.ms.boxOf ? RB.ms.boxOf.get(mw.cells[0]) : null, F = typeof RL_MS !== 'undefined' ? RL_MS.F : 2;
      for (let sy = v.t + 4; sy < v.b - 4; sy += 2) for (let sx = v.l + 4; sx < v.r - 4; sx += 2) { const [wx, wy] = toWorld(sx, sy), j = provinceAt(wx, wy); if (j == null || j < 0 || j === 255) continue;
        const k = (Math.floor(sy * dpr) * W2 + Math.floor(sx * dpr)) * 4, c = [d[k], d[k + 1], d[k + 2]];
        if (isWild(j)) { if (!mw.cells.includes(j)) continue; let water = false;
          if (Bm && Bm.rk8) { const fx = Math.floor(wx * RB.TX * F) - Bm.X0, fy = Math.floor(wy * RB.TX * F) - Bm.Y0; water = fx >= 0 && fy >= 0 && fx < Bm.nw && fy < Bm.nh && Bm.rk8[fy * Bm.nw + fx] >= 250; }
          else { water = rgb2lab(c)[1] < -10; } // other builds: the cyan water by its hue
          if (water) mere.push(c); continue; }
        if (terr[j] !== 'swamp') continue; let inner = true; for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (provinceAt(wx + ox * 0.12 * D, wy + oy * 0.12 * D) !== j) inner = false; if (!inner) continue;
        if (rlFbm(Tp, wx / RLK / 9, wy / RLK / 9, 3) > 0.49) pool.push(c); }
      return { mere, pool }; })()`); console.log(tag, v, 'mere', out[v].mere.length, 'pool', out[v].pool.length); }
  fs.writeFileSync(`${OUT}final/merepool-${tag}.json`, JSON.stringify(out)); console.log('errors', log.pageErrors.length); await b.close(); })();
