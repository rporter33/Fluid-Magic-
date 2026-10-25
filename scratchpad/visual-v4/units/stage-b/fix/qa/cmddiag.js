const page = await open(1920, 1080, '?paused=1');
return await page.evaluate(() => {
  const G = window.__battle.game; G.load('b'); G.playing = false; G.follow = true; G.user = null;
  const st = G.stage, T = st.T, w = st.world, H = window.innerHeight, R = safeRect(window.innerWidth, H);
  const C = buildCameraKeys(T, window.innerWidth, H, 1);
  const out = [];
  for (const Gr of T.G) {
    if (!Gr.g.isCmd || Gr.g.size >= 3 || !['saplingDruid', 'grovePriest'].includes(Gr.g.unit)) continue;
    const f = T.F[Gr.figs[0]]; const runs = []; let cur = null;
    for (let t = 2.6; t < T.duration; t += 0.25) {
      if ((f.death && t >= f.death.t) || (Gr.leaveT !== null && t >= Gr.leaveT)) continue;
      G.applyCamera(t);
      const p = figPos(T, f, t, { x: 0, y: 0, h: 0 });
      const Y = w.position.y + (sy(p.x, p.y, p.h) - 14) * w.scale.y;
      const under = Y > R.y1 - 4;
      if (under) { if (!cur) cur = { t0: t, t1: t }; cur.t1 = t; } else if (cur) { runs.push(cur); cur = null; }
    }
    if (cur) runs.push(cur);
    const keys = C.keys.map((k) => ({ t: +k.t.toFixed(1), hold: k.hold || 0, z: +k.z.toFixed(2) }));
    out.push({ unit: Gr.g.unit, idx: Gr.idx, rout: f.rout && +f.rout.t.toFixed(1), runs: runs.map((r) => [r.t0, r.t1]), keys });
  }
  // the raw key boxes vs the commander at those key times
  const kk = T.camera.filter((k) => k.t >= 2.6).map((k) => { const q = { x: 0, y: 0, h: 0 }; const rows = []; for (const Gr of T.G) { if (!Gr.g.isCmd || Gr.g.size >= 3 || !['saplingDruid', 'grovePriest'].includes(Gr.g.unit)) continue; figPos(T, T.F[Gr.figs[0]], k.t, q); rows.push(Gr.g.unit[0] + ':' + (sy(q.x, q.y, q.h) - k.box.y1).toFixed(0)); } return k.t.toFixed(1) + ' boxH ' + (k.box.y1 - k.box.y0).toFixed(0) + ' ' + rows.join(' '); });
  return { out, kk: kk.slice(0, 40) };
});
