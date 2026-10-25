// vdec.cjs <variant> <camera expr> <wild name> <neighbour name> <f0> <f1>: the decision's samples on one edge between f0 and f1 (fail flag, modelled W and G, pair and ink ratios)
const { launch, open, ev, mev } = require('./lib.cjs');
(async () => { const [V0, camx, wn, jn, f0, f1] = process.argv.slice(2), b = await launch(); const p = await open(b, `${__dirname}/../variants/${V0}/game-screen-v4.html`, { settle: 1500 }); await p.mouse.move(720, 896);
  await ev(p, camx); await p.waitForTimeout(1500);
  console.log(JSON.stringify(await mev(p, `(() => { RL_DBG.qeSamples = []; RL_WRIM.key = ''; rlQuietEdgeMap(); const smp = RL_DBG.qeSamples; RL_DBG.qeSamples = null; let q = 0, out = [];
    const rt = (a, b) => { const r = rlPairDE(a, b); return +Math.min(r.normal / 20, r.cvd / 12).toFixed(3); }, L = (c) => +rgb2lab(c)[0].toFixed(1);
    for (const w of WILDS) for (const e of rlWildOutline(w)) { const E = RL_WRIM.map.get(e.c + ':' + e.j); if (!E) continue; for (let k = 0; k < E.N; k++) { if (!E.seen[k]) continue; const s = smp[q++]; if (w.name !== ${JSON.stringify(wn)} || names[e.j] !== ${JSON.stringify(jn)}) continue; const f = (k + 0.5) / E.N; if (f < ${f0} || f > ${f1}) continue;
      out.push({ k, f: +f.toFixed(3), fail: E.fail[k], W: L(s[4]), G: L(s[5]), pair: rt(s[4], s[5]), inkW: rt(RL_QE_INK, s[4]), inkG: rt(RL_QE_INK, s[5]) }); } }
    return { used: q, total: smp.length, out }; })()`))); await b.close(); })();
