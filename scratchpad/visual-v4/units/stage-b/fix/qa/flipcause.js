// Which motion causes the remaining view/mirror flips: strike windows, sideways moves, rout, other.
const page = await open(1920, 1080, '?paused=1');
return await page.evaluate(() => {
  const G0 = window.__battle.game; const out = {};
  for (const b of DATA) {
    G0.load(b.key); G0.playing = false;
    const st = G0.stage, T = st.T, tmp = { x: 0, y: 0, h: 0 };
    const cause = { strike: 0, strikeMirrorOnly: 0, strikeView: 0, sideways: 0, rout: 0, other: 0 };
    const per = [];
    for (let i = 0; i < T.F.length; i++) {
      if (!st.sprites[i] || !st.sprites[i].paint) continue;
      const f = T.F[i], G = T.G[f.g];
      let last = null, n = 0;
      for (let t = 0; t < T.duration; t += 1 / 30) {
        if (f.death && t >= f.death.t) break;
        const s = evalFigure(T, f, G, t, 1, tmp); if (!s.vis) continue;
        const v = s.view + (s.flip ? 'f' : '');
        if (last !== null && v !== last) {
          n++;
          const inStrike = f.strikes.some((k) => t >= k.t - k.wind - 0.05 && t < k.t + k.strike + k.rec + 0.05);
          const seg = activeSeg(G.path, t);
          if (f.rout && t >= f.rout.t - 0.05) cause.rout++;
          else if (inStrike) { cause.strike++; if (v[0] + v[1] === last[0] + last[1]) cause.strikeMirrorOnly++; else cause.strikeView++; }
          else if (seg) cause.sideways++;
          else cause.other++;
        }
        last = v;
      }
      per.push(n);
    }
    out[b.key] = cause;
  }
  return out;
});
