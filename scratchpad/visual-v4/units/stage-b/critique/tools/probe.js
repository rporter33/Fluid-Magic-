const page = await open(1920, 1080, '?paused=1');
return await page.evaluate(() => {
  const G = window.__battle.game; const out = {};
  for (const b of DATA) {
    G.load(b.key); G.playing = false;
    const st = G.stage, T = st.T;
    out[b.key] = { title: b.title, dur: T.duration, m: G.moments(), near: st.B.nearSide, sideLooks: st.paint && st.paint.sideLooks, tier: st.paint && st.paint.tier,
      groups: st.S.groups.map((g) => [g.idx, g.unit, g.side, g.isCmd ? 'cmd' : '', g.size, st.paint ? st.paint.lookOf[g.idx] : null, st.paint ? st.paint.why[g.idx] : null, T.G[g.idx].figs.length].join(' | ')) };
  }
  return out;
});
