const page = await open(1920, 1080);
return await page.evaluate(() => {
  const G = window.__battle.game; const res = {};
  for (const key of ['a', 'b', 'c']) {
    G.load(key); const T = G.stage.T, S = G.stage.S;
    const R = G.cam.R; const rows = [];
    // subjects: routs (group), deaths (commander), charges, monster strikes, spells
    const subj = [];
    for (const Gq of T.G) if (Gq.routT !== null && Gq.leaveT === null || (Gq.routT !== null)) subj.push({ kind: 'rout', t: Gq.routT + 0.8, g: Gq.idx });
    for (const nc of T.nameCards) subj.push({ kind: 'death', t: nc.t0 - 0.9, g: nc.g });
    for (const ch of T.charges) subj.push({ kind: 'charge', t: ch.t, g: ch.g });
    for (const fx of T.spellFx) subj.push({ kind: 'spell:' + fx.spell, t: fx.impact, g: fx.targets[0] ?? fx.cg });
    for (const s of subj) {
      if (s.g === undefined || s.g === null) continue;
      G.view.hover = null; G.follow = true; G.user = null;
      G.stage.frame(s.t, 1, G.view); G.applyCamera(s.t);
      const w = G.stage.world; const Gq = T.G[s.g];
      let n = 0, inside = 0;
      for (const fi of Gq.figs) { const f = T.F[fi]; if (f.death && f.death.t < s.t - 0.5) continue; const p = figPos(T, f, s.t, { x: 0, y: 0, h: 0 }); const X = w.position.x + sx(p.x, p.y) * w.scale.x, Y = w.position.y + sy(p.x, p.y, p.h) * w.scale.y; n++; if (X >= R.x0 && X <= R.x1 && Y >= R.y0 && Y <= R.y1) inside++; }
      rows.push([s.kind, +s.t.toFixed(1), Gq.g.unit, n ? +(inside / n).toFixed(2) : null]);
    }
    res[key] = { offscreen: rows.filter((r) => r[3] !== null && r[3] < 0.5), all: rows.length };
  }
  return res;
});
