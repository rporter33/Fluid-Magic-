const { launch, open, mev, PAGE } = require('./lib.cjs');
(async () => { const b = await launch(); const p = await open(b, PAGE, { settle: 500 });
  console.log(JSON.stringify(await mev(p, `(() => { const s = cam.s, [wx, wy] = toWorld((viewRect().l + viewRect().r) / 2, (viewRect().t + viewRect().b) / 2); window.__mock.setScale(s, wx + 2.5 / s, wy - 1.5 / s);
    const d = rlRedraw(['pieces', 'labels', 'badges', 'arrows']), W2 = canvas.width, H2 = canvas.height, v = viewRect(), R = [];
    const px = (sx, sy) => { const X = Math.floor(sx * dpr), Y = Math.floor(sy * dpr); if (X < 0 || Y < 0 || X >= W2 || Y >= H2) return null; const k = (Y * W2 + X) * 4; return [d[k], d[k + 1], d[k + 2]]; };
    const med = (a) => { const s2 = a.filter(Boolean).sort((p, q) => rlL(...p) - rlL(...q)); return s2[s2.length >> 1]; }, rt = (q) => Math.min(q.normal / 20, q.cvd / 12);
    for (const w of WILDS) for (const e of rlWildOutline(w)) { const [ax, ay] = toScreen(...e.a), [bx, by] = toScreen(...e.b), Lg = Math.hypot(bx - ax, by - ay); if (Lg < 12) continue; let nx = -(by - ay) / Lg, ny = (bx - ax) / Lg;
      if (provinceAt(...toWorld((ax + bx) / 2 + nx * 8, (ay + by) / 2 + ny * 8)) !== e.j) { nx = -nx; ny = -ny; }
      for (let t = 6; t < Lg - 6; t += 4) { const sx = ax + ((bx - ax) * t) / Lg, sy = ay + ((by - ay) * t) / Lg; if (sx < v.l + 12 || sx > v.r - 12 || sy < v.t + 12 || sy > v.b - 12) continue; if (!inModel(...toWorld(sx + nx * 10, sy + ny * 10)) || provinceAt(...toWorld(sx + nx * 8, sy + ny * 8)) !== e.j) continue;
        const Ws = [6, 7, 8, 9].map((o) => px(sx - nx * o, sy - ny * o)), Gs = [6, 7, 8, 9, 9.5].map((o) => px(sx + nx * o, sy + ny * o)), Wg = med(Ws), G = med(Gs); if (!Wg || !G) continue;
        const pr = rt(rlPairDE(Wg, G)); let best = pr, bo = 'pair'; for (let o = -4; o <= 4; o += 0.5) { const c = px(sx + nx * o, sy + ny * o); if (!c) continue; const r = Math.min(rt(rlPairDE(c, Wg)), rt(rlPairDE(c, G))); if (r > best) { best = r; bo = o + ':' + rgb2lab(c).map(Math.round).join(','); } }
        R.push({ best: +best.toFixed(3), via: bo, at: w.name + '/' + names[e.j], t: Math.round(t), Lg: Math.round(Lg), W: rgb2lab(Wg).map(Math.round), G: rgb2lab(G).map(Math.round), Gs: Gs.map((c) => c && Math.round(rgb2lab(c)[0])), sx: Math.round(sx), sy: Math.round(sy) }); } }
    R.sort((a, b) => a.best - b.best); const E = RL_WRIM.map; return R.slice(0, 6); })()`)));
  await b.close(); })();
