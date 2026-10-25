const page = await open(1920, 1080);
return await page.evaluate(() => {
  const G = window.__battle.game; const out = {};
  for (const [k, u] of [['a', 'greatWyrm'], ['b', 'treant'], ['c', 'salamander']]) {
    G.load(k); const m = window.__battle.moments(); const T = G.stage.T;
    const res = [];
    for (const t of [m.clash + 1, m.monster, m.clash + 3]) {
      G.seek(t); G.follow = true; G.user = null; G.render(t);
      const bb = G.stage.bigs.find((b) => b.G.g.unit === u); const b = bb.body.root.getBounds();
      let n = 0, me = 0, other = {};
      for (let i = 0; i < 20; i++) for (let j = 0; j < 20; j++) { const x = b.minX + (i + 0.5) / 20 * (b.maxX - b.minX), y = b.minY + (j + 0.5) / 20 * (b.maxY - b.minY); const gi = G.pick(x, y); n++; if (gi === bb.G.idx) me++; else if (gi !== null) other[T.G[gi].g.unit] = (other[T.G[gi].g.unit] || 0) + 1; }
      res.push({ t: +t.toFixed(1), selfShare: +(me / n).toFixed(2), other });
    }
    out[k] = res;
  }
  return out;
});
