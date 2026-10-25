const page = await open(1920, 1080, '?paused=1');
return await page.evaluate(() => {
  const G0 = window.__battle.game; G0.load('c'); G0.playing = false;
  const st = G0.stage, T = st.T, tmp = { x: 0, y: 0, h: 0 }; const rows = [];
  for (let i = 0; i < T.F.length; i++) {
    if (!st.sprites[i] || !st.sprites[i].paint) continue;
    const f = T.F[i], G = T.G[f.g]; let last = null; const ev = [];
    for (let t = 0; t < T.duration; t += 1 / 30) {
      if (f.death && t >= f.death.t) break;
      const s = evalFigure(T, f, G, t, 1, tmp); if (!s.vis) continue;
      const v = s.view + (s.flip ? 'f' : '');
      if (last !== null && v !== last) { const seg = activeSeg(G.path, t); const inS = f.strikes.some((k) => t >= k.t - k.wind - 0.05 && t < k.t + k.strike + k.rec + 0.05); ev.push(`${t.toFixed(1)}:${last}>${v}${inS ? ' S' : ''}${seg ? ' M(' + (seg.x1 - seg.x0).toFixed(0) + ',' + (seg.y1 - seg.y0).toFixed(0) + ')' : ''}${f.rout && t >= f.rout.t - 0.05 ? ' R' : ''}`); }
      last = v;
    }
    if (ev.length >= 5) rows.push(G.g.unit + ' #' + i + ': ' + ev.join(' | '));
  }
  return rows.slice(0, 14);
});
