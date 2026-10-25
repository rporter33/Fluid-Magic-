const page = await open(960, 540);
return await page.evaluate(() => { const G = window.__battle.game; G.load('c'); const T = G.stage.T; const r = G.checkOverlap();
  const out = []; const p = { x: 0, y: 0, h: 0 }, q = { x: 0, y: 0, h: 0 };
  for (const t of [20.2, 20.25, 20.3]) { const pts = T.F.filter((f) => !(f.death && t >= f.death.t) && !(f.rout && t >= f.rout.t) && T.G[f.g].g.size < 3).map((f) => { figPos(T, f, t, p); return { f, x: p.x, y: p.y, h: p.h }; });
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) { const a = pts[i], b = pts[j]; if (T.G[a.f.g].side !== T.G[b.f.g].side || Math.abs(a.h - b.h) > 10) continue; const d = Math.hypot(a.x - b.x, a.y - b.y); if (d < 5) out.push([t, T.G[a.f.g].g.unit, a.f.rank, T.G[b.f.g].g.unit, b.f.rank, a.f.g === b.f.g, +d.toFixed(1), !!a.f.climb, !!b.f.climb]); } }
  return { r, out: out.slice(0, 12), dur: T.duration }; });
