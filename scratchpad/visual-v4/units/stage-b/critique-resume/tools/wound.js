// Critique-resume: the wound tint on painted figures. Share of living painted figures carrying the red wound cast over
// each battle, and a before/after shot of the worst block at a man of 72 px with the proposed neutral darkening.
const DIR = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/critique-resume/shots/';
const out = {};
const page = await open(1600, 900, '?paused=1');
await page.mouse.move(800, 10);
for (const k of ['a', 'b', 'c']) {
  const r = await page.evaluate((k) => {
    const G = window.__battle.game; G.speed = 1; G.load(k); G.playing = false;
    const st = G.stage, T = st.T, dur = T.duration, samples = [];
    for (let i = 1; i <= 10; i++) {
      const t = dur * i / 11;
      G.follow = true; G.user = null; G.applyCamera(t); st.frame(t, 1, G.view);
      let n = 0, wounded = 0, wsum = 0, wmax = 0; const perG = {};
      for (let fi = 0; fi < T.F.length; fi++) {
        const sp = st.sprites[fi]; if (!sp || !sp.paint || !sp.visible) continue;
        const f = T.F[fi]; if (f.death && t >= f.death.t) continue;
        n++;
        const R = (sp.tint >> 16) & 255, Gc = (sp.tint >> 8) & 255;
        if (R > 0 && Gc < R - 2) { const w = (1 - Gc / R) / 0.35; wounded++; wsum += w; wmax = Math.max(wmax, w); perG[f.g] = (perG[f.g] || 0) + 1; }
      }
      const worst = Object.entries(perG).sort((a, b) => b[1] - a[1])[0];
      samples.push({ t: +t.toFixed(1), n, wounded, share: +(wounded / Math.max(1, n)).toFixed(3), meanW: +(wsum / Math.max(1, wounded)).toFixed(2), maxW: +wmax.toFixed(2), worstG: worst ? +worst[0] : null, worstN: worst ? worst[1] : 0, worstUnit: worst ? T.G[+worst[0]].g.unit : null });
    }
    return samples;
  }, k);
  out[k] = r;
  // before/after at the sample with the most wounded figures
  const s = r.slice().sort((a, b) => b.wounded - a.wounded)[0];
  if (s && s.worstG !== null) {
    await page.evaluate(([t, gi]) => {
      const G = window.__battle.game; G.playing = false; G.seek(t);
      const h = G.stage.hull(G.stage.T.G[gi], t);
      G.follow = false; G.user = { cx: h.X, cy: h.Y - 14, z: 72 / 28 }; G.render(t); G.render(t);
    }, [s.t, s.worstG]);
    await page.screenshot({ path: DIR + `wound-${k}-now.png`, clip: { x: 450, y: 200, width: 700, height: 460 } });
    await page.evaluate(() => {
      const G = window.__battle.game, st = G.stage;
      for (const sp of st.sprites) {
        if (!sp || !sp.paint || !sp.visible) continue;
        const R = (sp.tint >> 16) & 255, Gc = (sp.tint >> 8) & 255;
        if (R > 0 && Gc < R - 2) { const w = (1 - Gc / R) / 0.35, c = Math.round(R * (1 - 0.12 * w)); sp.tint = (c << 16) | (c << 8) | c; }
      }
      G.app.renderer.render(G.app.stage);
    });
    await page.screenshot({ path: DIR + `wound-${k}-neutral.png`, clip: { x: 450, y: 200, width: 700, height: 460 } });
  }
}
return out;
