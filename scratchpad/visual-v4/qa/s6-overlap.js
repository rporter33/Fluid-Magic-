const page = await open(960, 540);
return await page.evaluate(() => {
  const G = window.__battle.game; const res = {};
  for (const key of ['a', 'b', 'c']) {
    G.load(key); const st = G.stage, T = st.T;
    const series = []; const pairsByGroups = new Map();
    for (let t = 0; t <= T.duration; t += 0.25) {
      const pts = [];
      for (const f of T.F) {
        const Gq = T.G[f.g];
        if (t < Gq.appear || (f.death && t >= f.death.t) || (Gq.leaveT !== null && t >= Gq.leaveT) || Gq.g.size >= 3) continue;
        const p = figPos(T, f, t, { x: 0, y: 0, h: 0 });
        if (Gq.kind === 'cloud') continue;
        pts.push({ g: f.g, side: Gq.side, x: p.x, y: p.y, h: p.h, rout: f.rout && t >= f.rout.t });
      }
      let n = 0;
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i], b = pts[j];
        if (a.g === b.g || a.side !== b.side || a.rout || b.rout) continue;
        if (Math.abs(a.h - b.h) > 10) continue;
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 9) { n++; const k = T.G[a.g].g.unit + '+' + T.G[b.g].g.unit; pairsByGroups.set(k, (pairsByGroups.get(k) || 0) + 1); }
      }
      series.push([+t.toFixed(2), n]);
    }
    const bad = series.filter((x) => x[1] > 0);
    res[key] = { framesWithOverlap: bad.length, of: series.length, max: Math.max(...series.map((x) => x[1])), firstT: bad.length ? bad[0][0] : null, worst: series.slice().sort((a, b) => b[1] - a[1]).slice(0, 5), pairs: Object.fromEntries([...pairsByGroups.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)) };
  }
  return res;
});
