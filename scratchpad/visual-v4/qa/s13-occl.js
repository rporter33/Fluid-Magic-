const page = await open(1920, 1080);
return await page.evaluate(() => {
  const G = window.__battle.game; const res = {};
  for (const key of ['a', 'b', 'c']) {
    G.load(key); const st = G.stage, T = st.T;
    let worst = null; let framesBuried = 0, frames = 0;
    for (let t = 3; t < T.duration; t += 0.25) {
      st.frame(t, 1, G.view); G.applyCamera(t);
      for (const bb of st.bigs) {
        const r = bb.body.root; if (!r.visible || (bb.f.death && t >= bb.f.death.t)) continue;
        const b = r.getLocalBounds(); // in the root's local space
        const X0 = r.x + Math.min(b.minX * r.scale.x, b.maxX * r.scale.x), X1 = r.x + Math.max(b.minX * r.scale.x, b.maxX * r.scale.x), Y0 = r.y + b.minY, Y1 = r.y + b.maxY;
        let front = 0, own = 0;
        for (const sp of st.sprites) { if (!sp || !sp.visible || sp.layer !== st.units) continue; if (sp.zIndex <= r.zIndex) continue; const cy = sp.y - 14; if (sp.x > X0 && sp.x < X1 && cy > Y0 && cy < Y1) { front++; const f = T.F[st.sprites.indexOf(sp)]; if (f && T.G[f.g].side === bb.G.side) own++; } }
        frames++;
        if (front >= 15) framesBuried++;
        if (!worst || front > worst.front) worst = { t: +t.toFixed(2), unit: bb.G.g.unit, front, own, ghosts: st.stats.seeThrough };
      }
    }
    res[key] = { worst, framesWith15PlusFiguresInFront: framesBuried, frames };
  }
  return res;
});
