const page = await open(960, 540);
return await page.evaluate(() => {
  const G = window.__battle.game; const res = {};
  for (const key of ['a', 'b', 'c']) {
    G.load(key); const T = G.stage.T;
    const info = (gi, t) => { const Q = T.G[gi]; const o = pathAt(Q.path, t, { x: 0, y: 0, h: 0 }); return [Q.g.unit, 'x', +o.x.toFixed(0), 'y', +o.y.toFixed(0), 'u', +Q.ext.u0.toFixed(0), +Q.ext.u1.toFixed(0), 'd', +Q.ext.d.toFixed(0), 'c', Q.inContactAt ? Q.inContactAt(t) : false, Q.contactT]; };
    const hits = [];
    for (let t = 0; t <= T.duration; t += 0.25) {
      const pts = [];
      for (const f of T.F) { const Q = T.G[f.g]; if (t < Q.appear || (f.death && t >= f.death.t) || (Q.leaveT !== null && t >= Q.leaveT) || Q.g.size >= 3 || Q.kind === 'cloud') continue; const p = figPos(T, f, t, { x: 0, y: 0, h: 0 }); pts.push({ f, g: f.g, side: Q.side, x: p.x, y: p.y, h: p.h, rout: f.rout && t >= f.rout.t }); }
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) { const a = pts[i], b = pts[j]; if (a.g === b.g || a.side !== b.side || a.rout || b.rout || Math.abs(a.h - b.h) > 10) continue; if (Math.hypot(a.x - b.x, a.y - b.y) < 9) { hits.push({ t, a: a.g, b: b.g, pa: [+a.x.toFixed(0), +a.y.toFixed(0), a.f.rank, a.f.file], pb: [+b.x.toFixed(0), +b.y.toFixed(0), b.f.rank, b.f.file] }); } }
    }
    const first = hits[0];
    res[key] = { n: hits.length, first, ga: first ? info(first.a, first.t) : null, gb: first ? info(first.b, first.t) : null, times: [...new Set(hits.map((h) => h.t))].slice(0, 30), seam: T.seamY,
      sample: hits.filter((h, i) => i % Math.max(1, Math.floor(hits.length / 8)) === 0).slice(0, 8) };
  }
  return res;
});
