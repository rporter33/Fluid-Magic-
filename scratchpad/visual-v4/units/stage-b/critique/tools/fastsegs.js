const page = await open(1600, 900, '?paused=1');
return await page.evaluate(() => {
  const G0 = window.__battle.game; const out = {};
  for (const b of DATA) {
    G0.load(b.key); G0.playing = false;
    const st = G0.stage, T = st.T, P = st.paint;
    const rows = [];
    for (const G of T.G) {
      if (!P.lookOf[G.idx] || G.g.isCmd) continue;
      G.path.forEach((s, i) => {
        const d = Math.hypot(s.x1 - s.x0, s.y1 - s.y0), dt = s.t1 - s.t0;
        if (d > 2 && dt > 0 && d / dt > 45) rows.push(`${G.g.unit} seg${i} t ${s.t0.toFixed(2)}-${s.t1.toFixed(2)} d ${d.toFixed(0)} wu v ${(d / dt).toFixed(0)} wu/s kind ${s.kind || ''}`);
      });
    }
    // total time painted figures spend marching at > 45 wu/s, figure-seconds
    let fs = 0, ftot = 0;
    for (const G of T.G) { if (!P.lookOf[G.idx] || G.g.isCmd) continue; for (const s of G.path) { const d = Math.hypot(s.x1 - s.x0, s.y1 - s.y0), dt = s.t1 - s.t0; if (d > 2 && dt > 0) { ftot += dt * G.figs.length; if (d / dt > 45) fs += dt * G.figs.length; } } }
    out[b.key] = { rows, fastShare: +(fs / ftot).toFixed(2), keys: Object.keys(T.G[5].path[0] || {}) };
  }
  return out;
});
