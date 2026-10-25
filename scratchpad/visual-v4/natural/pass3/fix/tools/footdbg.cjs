const { launch, open, ev, mev, PAGE } = require('./lib.cjs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, process.argv[2] || PAGE, { log, settle: 1200 });
  await ev(p, process.argv[3] || 'm.setScale(1.0, 640, 480)'); await p.waitForTimeout(1200);
  console.log(JSON.stringify(await mev(p, `(() => { RL_WRIM.lru.clear(); RL_DBG.qeSamples = []; RCK = null; draw(); const S = RL_DBG.qeSamples; RL_DBG.qeSamples = null; const ok = (a, b, m) => { const q = rlPairDE(a, b); return q.normal >= 20 * m && q.cvd >= 12 * m; };
    const rows = []; for (const [x, y, nx, ny, W, G] of S) { const pass = ok(W, G, 1.2) || (ok(RL_QE_INK, W, 1.1) && ok(RL_QE_INK, G, 1.1)); if (pass) continue; const wx = x - nx * 7.5 / cam.s, wy = y - ny * 7.5 / cam.s, c = provinceAt(wx, wy), B = RB.ms.boxes.find((q) => q.G.set.has(c)); if (!B) continue; const N = rlMftNear(B.mft, wx, wy), at = N ? rlMftAt(N, 0) : null;
      rows.push([B.w.name.slice(4, 8), names[provinceAt(x + nx * 8 / cam.s, y + ny * 8 / cam.s)], +rgb2lab(W)[0].toFixed(0), +rgb2lab(G)[0].toFixed(0), at && +at[0].toFixed(2), at && at[1], N && +N.d.toFixed(1), ok(RL_QE_INK, G, 1.1)]); }
    const by = {}; for (const r of rows) { const k = r[0] + '/' + r[1]; (by[k] ??= []).push(r.slice(2)); } const o = {}; for (const k in by) o[k] = [by[k].length, by[k].slice(0, 4)]; return o; })()`), null, 0).replace(/\],"/g, '],\n"'));
  await b.close(); })();
