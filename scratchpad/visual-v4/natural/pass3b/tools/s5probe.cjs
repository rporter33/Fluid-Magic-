// a sweep failure on a map plan, reproduced: node s5probe.cjs <variant> <sweep view index> ; every edge in focus at that sweep camera, the failing samples, a crop around the worst
const { launch, open, ev, mev, ME, SHOTS } = require('./lib.cjs'); const fs = require('fs');
const V0 = process.argv[2] || 's5', K = Number(process.argv[3] || 15), PAGE = ME + 'variants/' + V0 + '/game-screen-v4.html';
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, PAGE, { log, settle: 1500 }); await p.mouse.move(720, 896);
  const r = await mev(p, `(() => { const V = rlWildSweepViews()[${K}]; window.__mock.setScale(V[1], V[2], V[3]); RL_DBG.focusAll = true; RCK = null; draw();
    const d = rlRedraw(['pieces', 'labels', 'badges', 'arrows']), W2 = canvas.width, v = viewRect(), out = []; const px = (sx, sy) => { const X = Math.floor(sx * dpr), Y = Math.floor(sy * dpr), k = (Y * W2 + X) * 4; return [d[k], d[k + 1], d[k + 2]]; };
    const med = (a) => { const s2 = a.filter(Boolean).sort((p, q) => rlL(...p) - rlL(...q)); return s2[s2.length >> 1]; }, rt = (q) => Math.min(q.normal / 20, q.cvd / 12);
    for (const w of WILDS) for (const e of rlWildOutline(w)) { const [ax, ay] = toScreen(...e.a), [bx, by] = toScreen(...e.b), Lg = Math.hypot(bx - ax, by - ay); if (Lg < 12) continue; let nx = -(by - ay) / Lg, ny = (bx - ax) / Lg;
      if (provinceAt(...toWorld((ax + bx) / 2 + nx * 8, (ay + by) / 2 + ny * 8)) !== e.j) { nx = -nx; ny = -ny; }
      for (let s = 6; s < Lg - 6; s += 4) { const sx = ax + ((bx - ax) * s) / Lg, sy = ay + ((by - ay) * s) / Lg; if (sx < v.l + 12 || sx > v.r - 12 || sy < v.t + 12 || sy > v.b - 12) continue;
        if (!inModel(...toWorld(sx + nx * 10, sy + ny * 10)) || provinceAt(...toWorld(sx + nx * 8, sy + ny * 8)) !== e.j) continue;
        const Wg = med([6, 7, 8, 9].map((o) => px(sx - nx * o, sy - ny * o))), G = med([6, 7, 8, 9, 9.5].map((o) => px(sx + nx * o, sy + ny * o)));
        let best = rt(rlPairDE(Wg, G)), via = 'pair'; const prof = []; for (let o = -4; o <= 4; o += 0.5) { const c = px(sx + nx * o, sy + ny * o); prof.push(Math.round(rgb2lab(c)[0])); const q = Math.min(rt(rlPairDE(c, Wg)), rt(rlPairDE(c, G))); if (q > best) { best = q; via = o + ' px'; } }
        if (best < 1.05) out.push({ r: +best.toFixed(3), at: w.name + '/' + names[e.j], via, W: rgb2lab(Wg).map(Math.round), G: rgb2lab(G).map(Math.round), sx: Math.round(sx), sy: Math.round(sy), n: [+nx.toFixed(2), +ny.toFixed(2)], prof, inner: [6, 7, 8, 9].map((o) => Math.round(rgb2lab(px(sx - nx * o, sy - ny * o))[0])), outer: [6, 7, 8, 9, 9.5].map((o) => Math.round(rgb2lab(px(sx + nx * o, sy + ny * o))[0])) }); } }
    const cr = canvas.getBoundingClientRect(); RL_DBG.focusAll = false; return { view: V, Dpx: +(cam.s * MED_DIAM).toFixed(1), src: rlMsSource(), canvas: [cr.left, cr.top], low: out.sort((a, b) => a.r - b.r).slice(0, 12) }; })()`);
  console.log(JSON.stringify(r, null, 0).slice(0, 4000));
  if (r.low.length) { await mev(p, 'RL_DBG.focusAll = true; RCK = null; draw()'); await p.waitForTimeout(400); const w0 = r.low[0]; await p.screenshot({ path: `${SHOTS}wip/s5-fail-${V0}-${K}.png`, clip: { x: Math.max(0, r.canvas[0] + w0.sx - 60), y: Math.max(0, r.canvas[1] + w0.sy - 60), width: 120, height: 120 } }); }
  console.log('pageErrors', log.pageErrors.length); await b.close(); })();
