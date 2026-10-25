// vfail.cjs <variant> <camera expr>: at a camera on a variant map, every wild edge sample under ratio 1.1 as drawn, against the decision's modelled W and G at that spot
const { launch, open, ev, mev } = require('./lib.cjs');
(async () => { const V0 = process.argv[2], PAGE = `${__dirname}/../variants/${V0}/game-screen-v4.html`, b = await launch(), log = { pageErrors: [], console: [], requests: [] };
  const p = await open(b, PAGE, { log, settle: 1500, dpr: +(process.env.DPR || 1) }); await p.mouse.move(720, 896);
  await ev(p, process.argv[3]); await p.waitForTimeout(1500);
  const r = await mev(p, `(() => { RL_DBG.qeSamples = []; RL_WRIM.key = ''; RCK = null; draw(); const smp = RL_DBG.qeSamples; RL_DBG.qeSamples = null;
    const d = rlRedraw(['pieces', 'labels', 'badges', 'arrows']), W2 = canvas.width, H2 = canvas.height, v = viewRect(), out = [];
    const px = (sx, sy) => { const X = Math.floor(sx * dpr), Y = Math.floor(sy * dpr); if (X < 0 || Y < 0 || X >= W2 || Y >= H2) return null; const k = (Y * W2 + X) * 4; return [d[k], d[k + 1], d[k + 2]]; };
    const med = (a) => { const s2 = a.filter(Boolean).sort((p, q) => rlL(...p) - rlL(...q)); return s2[s2.length >> 1]; }, rt = (q) => Math.min(q.normal / 20, q.cvd / 12), L = (c) => Math.round(rgb2lab(c)[0] * 10) / 10;
    for (const w of WILDS) for (const e of rlWildOutline(w)) { const [ax, ay] = toScreen(...e.a), [bx, by] = toScreen(...e.b), Lg = Math.hypot(bx - ax, by - ay); if (Lg < 12) continue; let nx = -(by - ay) / Lg, ny = (bx - ax) / Lg;
      if (provinceAt(...toWorld((ax + bx) / 2 + nx * 8, (ay + by) / 2 + ny * 8)) !== e.j) { nx = -nx; ny = -ny; } const E = RL_WRIM.map && RL_WRIM.map.get(e.c + ':' + e.j);
      for (let s = 6; s < Lg - 6; s += 4) { const sx = ax + ((bx - ax) * s) / Lg, sy = ay + ((by - ay) * s) / Lg; if (sx < v.l + 12 || sx > v.r - 12 || sy < v.t + 12 || sy > v.b - 12) continue;
        if (!inModel(...toWorld(sx + nx * 10, sy + ny * 10)) || provinceAt(...toWorld(sx + nx * 8, sy + ny * 8)) !== e.j) continue;
        const Wg = med([6, 7, 8, 9].map((o) => px(sx - nx * o, sy - ny * o))), G = med([6, 7, 8, 9, 9.5].map((o) => px(sx + nx * o, sy + ny * o))); if (!Wg || !G) continue;
        let best = rt(rlPairDE(Wg, G)), via = 'pair', line = []; for (let o = -4; o <= 4; o += 0.5) { const c = px(sx + nx * o, sy + ny * o); if (!c) continue; line.push(L(c)); const q = Math.min(rt(rlPairDE(c, Wg)), rt(rlPairDE(c, G))); if (q > best) { best = q; via = o + ' px'; } }
        if (best >= 1.1) continue; let nm = null, nd = 1e9; for (const q of smp) { const [qx, qy] = toScreen(q[0], q[1]), dd = Math.hypot(qx - sx, qy - sy); if (dd < nd) { nd = dd; nm = q; } }
        let dec = null; if (E) { const f = (s / Lg), k = Math.min(E.N - 1, Math.floor(f * E.N)); dec = { failK: E.fail[k], seenK: E.seen[k], runs: rlQuietRuns(E).map((r) => r.map((x) => +x.toFixed(3))), f: +f.toFixed(3) }; }
        out.push({ at: w.name + '/' + names[e.j] + ' (' + terr[e.j] + ')', r: +best.toFixed(3), via, sx: Math.round(sx), sy: Math.round(sy), W: L(Wg), G: L(G), pairR: +rt(rlPairDE(Wg, G)).toFixed(3), line, model: nm && { d: +nd.toFixed(1), W: L(nm[4]), G: L(nm[5]), pairR: +rt(rlPairDE(nm[4], nm[5])).toFixed(3), Wrgb: nm[4].map(Math.round), Grgb: nm[5].map(Math.round) }, Wrgb: Wg, Grgb: G, dec }); } }
    return { s: cam.s, src: rlMsSource(), nearK: rlNearK(), jit: RL_QE.jit0 + (RL_QE.jit - RL_QE.jit0) * rlNearK(), out }; })()`);
  console.log(JSON.stringify({ s: r.s, src: r.src, nearK: r.nearK, jit: r.jit })); for (const o of r.out) console.log(JSON.stringify(o));
  console.log('pageErrors', log.pageErrors.length); await b.close(); })();
