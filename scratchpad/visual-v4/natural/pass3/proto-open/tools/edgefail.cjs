const { launch, open, ev, mev, PAGE } = require('./lib.cjs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, PAGE, { log, settle: 800 }); await p.mouse.move(720, 895);
  for (const v of (process.argv[2] || 'm.setScale(60 / m.ev("MED_DIAM"), 800, 500)|m.setScale(m.maxScale(), 600, 240)').split('|')) {
  await ev(p, v); await p.waitForTimeout(1500);
  const r = await mev(p, `(() => { const d = rlRedraw(['pieces', 'labels', 'badges', 'arrows']), W2 = canvas.width, H2 = canvas.height, vr = viewRect(), ok = (q) => q.normal >= 20 && q.cvd >= 12, out = [];
    const px = (sx, sy) => { const X = Math.floor(sx * dpr), Y = Math.floor(sy * dpr); if (X < 0 || Y < 0 || X >= W2 || Y >= H2) return null; const k = (Y * W2 + X) * 4; return [d[k], d[k + 1], d[k + 2]]; };
    const med = (a) => { const s2 = a.filter(Boolean).sort((p, q) => rlL(...p) - rlL(...q)); return s2[s2.length >> 1]; }; const map = RL_WRIM.map;
    for (const w of WILDS) for (const e of rlWildOutline(w)) { const [ax, ay] = toScreen(...e.a), [bx, by] = toScreen(...e.b), Lg = Math.hypot(bx - ax, by - ay); if (Lg < 12) continue; let nx = -(by - ay) / Lg, ny = (bx - ax) / Lg;
      const [mx, my] = [(ax + bx) / 2, (ay + by) / 2]; if (provinceAt(...toWorld(mx + nx * 8, my + ny * 8)) !== e.j) { nx = -nx; ny = -ny; }
      for (let s = 6; s < Lg - 6; s += 4) { const sx = ax + ((bx - ax) * s) / Lg, sy = ay + ((by - ay) * s) / Lg; if (sx < vr.l + 12 || sx > vr.r - 12 || sy < vr.t + 12 || sy > vr.b - 12) continue;
        if (!inModel(...toWorld(sx + nx * 10, sy + ny * 10)) || provinceAt(...toWorld(sx + nx * 8, sy + ny * 8)) !== e.j) continue;
        const Wg = med([6, 7, 8, 9].map((o) => px(sx - nx * o, sy - ny * o))), G = med([6, 7, 8, 9, 9.5].map((o) => px(sx + nx * o, sy + ny * o))); if (!Wg || !G) continue;
        if (ok(rlPairDE(Wg, G))) continue; let best = 0, bc = null; for (let o = -4; o <= 4; o += 0.5) { const c = px(sx + nx * o, sy + ny * o); if (!c) continue; const a = rlPairDE(c, Wg), bb = rlPairDE(c, G), m = Math.min(a.normal / 20, a.cvd / 12, bb.normal / 20, bb.cvd / 12); if (m > best) { best = m; bc = [o, rgb2hex(c), a.normal.toFixed(1), a.cvd.toFixed(1), bb.normal.toFixed(1), bb.cvd.toFixed(1)]; } }
        if (best >= 1) continue; const E = map && map.get(e.c + ':' + e.j), t = s / Lg, pc = E ? Math.floor(t * E.np) : -1; out.push({ wild: w.name, j: names[e.j], t: t.toFixed(3), piece: pc, np: E && E.np, bad: E && [...E.bad].join(''), runs: E && JSON.stringify(rlWildRimRuns(E).map((r) => r.map((x) => +x.toFixed(3)))), need: E && E.need, W: rgb2hex(Wg), G: rgb2hex(G), best: best.toFixed(3), bc }); } }
    return out; })()`);
  console.log(v, JSON.stringify(r, null, 1)); }
  await b.close(); })();
