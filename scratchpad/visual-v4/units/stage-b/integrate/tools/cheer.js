const dir = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/integrate/shots-dev/';
const page = await open(1600, 900, '?b=c&paused=1');
const out = [];
for (const t of [53.5, 53.85]) {
  out.push(await page.evaluate((t) => {
    const G = window.__battle.game; G.playing = false; G.seek(t);
    const st = G.stage, T = st.T;
    const W = T.G.find((q) => q.g.unit === 'longbowHunter');
    const h = st.hull(W, t);
    G.follow = false; G.user = { cx: h.X, cy: h.Y - 20, z: 2.4 };
    G.render(t); G.render(t);
    return W.figs.map((fi) => st.sprites[fi]).filter((s) => s.visible).map((s) => PPOSE[s.pPose]).join(',');
  }, t));
  await page.screenshot({ path: dir + `cheer-${t}.png`, clip: { x: 300, y: 150, width: 1000, height: 600 } });
}
return out;
