// How long each commander stands under the card bar or off screen in the automatic camera (1920 x 1080, 1x).
const page = await open(1920, 1080, '?paused=1');
return await page.evaluate(() => {
  const G = window.__battle.game; const out = {};
  for (const b of DATA) {
    G.load(b.key); G.playing = false; G.follow = true; G.user = null;
    const st = G.stage, T = st.T, w = st.world, H = window.innerHeight, Wd = window.innerWidth;
    const R = safeRect(Wd, H);
    const res = {};
    for (const Gr of T.G) {
      if (!Gr.g.isCmd || Gr.g.size >= 3) continue;
      const f = T.F[Gr.figs[0]]; let alive = 0, under = 0, off = 0;
      for (let t = 2.6; t < T.duration; t += 0.25) {
        if (t < Gr.appear || (f.death && t >= f.death.t) || (Gr.leaveT !== null && t >= Gr.leaveT)) continue;
        G.applyCamera(t);
        const p = figPos(T, f, t, { x: 0, y: 0, h: 0 });
        const X = w.position.x + sx(p.x, p.y) * w.scale.x, Y = w.position.y + (sy(p.x, p.y, p.h) - 14) * w.scale.y;
        alive++;
        if (X < 0 || X > Wd || Y < 0 || Y > H) off++;
        else if (Y > R.y1 - 4) under++;
      }
      res[Gr.g.unit + '-' + Gr.idx + (st.paint.lookOf[Gr.idx] ? '' : ' (proc)')] = { aliveS: alive / 4, underCardBarPct: Math.round(100 * under / Math.max(1, alive)), offScreenPct: Math.round(100 * off / Math.max(1, alive)) };
    }
    out[b.key] = res;
  }
  return out;
});
