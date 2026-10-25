// Critique-resume: every commander at a man of 96 px through its battle (deploy, clash, act, strike, rout, fall, dead,
// outro cheer), clipped around the figure, with its pose, view, stand-in flag and tier. Writes shots/cmd-*.png.
const DIR = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/critique-resume/shots/';
const out = [];
const page = await open(1600, 900, '?paused=1');
await page.mouse.move(800, 20);
for (const k of ['a', 'b', 'c']) {
  const cmds = await page.evaluate((k) => {
    const G = window.__battle.game; G.speed = 1; G.load(k); G.playing = false;
    const st = G.stage, T = st.T, m = G.moments();
    return T.G.filter((q) => q.g.isCmd && q.g.size < 3).map((q) => {
      const fi = q.figs[0], f = T.F[fi], sp = st.sprites[fi];
      const ts = [['deploy', 2.7], ['clash', m.clash + 0.8]];
      const cast = (f.shots || []).find((s) => s.kind === 'cast');
      if (cast) { ts.push(['actA', cast.t + 0.25]); ts.push(['actB', cast.tRel + 0.08]); }
      const ra = sp && sp.paint && sp.paint.extra && sp.paint.extra.rally;
      if (ra && ra.length) { ts.push(['actA', ra[0] + 0.25]); ts.push(['actB', ra[0] + 0.75]); }
      if (f.strikes && f.strikes.length) { const s = f.strikes[0]; ts.push(['strike', s.t + (s.strike || 0.15) * 0.6]); }
      if (f.rout) ts.push(['rout', f.rout.t + 0.6]);
      if (f.death) { ts.push(['fall', f.death.t + f.death.fall * 0.3]); ts.push(['dead', f.death.t + f.death.fall + 0.4]); }
      if (st.paint && st.paint.cheerT !== null && (!f.death || f.death.t > st.paint.cheerT) && !f.rout) ts.push(['cheer', st.paint.cheerT + 0.3]);
      return { gi: q.idx, fi, unit: q.g.unit, side: q.side, near: q.side === st.B.nearSide, look: st.paint ? st.paint.lookOf[q.idx] : null, ts: ts.filter((x) => x[1] <= T.duration) };
    });
  }, k);
  for (const c of cmds) {
    for (const [tag, t] of c.ts) {
      const info = await page.evaluate(([t, fi]) => {
        const G = window.__battle.game; G.playing = false; G.seek(t);
        const T = G.stage.T, p = figPos(T, T.F[fi], t, { x: 0, y: 0, h: 0 });
        G.follow = false; G.user = { cx: sx(p.x, p.y), cy: sy(p.x, p.y, p.h) - 30, z: 96 / 28 };
        G.render(t); G.render(t);
        const st = G.stage, sp = st.sprites[fi], w = st.world;
        if (!sp) return null;
        const X = w.position.x + sp.x * w.scale.x, Y = w.position.y + sp.y * w.scale.y;
        const pn = Object.keys(PP).find((n) => PP[n] === sp.pPose);
        const V = sp.paint ? st.paint.tex[st.paint.tier].get(sp.paint.texKey) : null;
        const want = sp.curView === 'ne' ? 'back' : 'front';
        return { X, Y, vis: sp.visible, pose: pn, view: want, standIn: V ? !!V[want].standIn : null, tier: st.paint ? st.paint.tier : null, mirror: sp.scale.x < 0 };
      }, [t, c.fi]);
      if (!info) continue;
      const name = `cmd-${k}-${c.look || c.unit + c.gi}-${tag}`;
      const clip = { x: Math.max(0, Math.round(info.X - 150)), y: Math.max(0, Math.round(info.Y - 250)), width: 300, height: 320 };
      if (clip.x + 300 > 1600) clip.x = 1300; if (clip.y + 320 > 900) clip.y = 580;
      await page.screenshot({ path: DIR + name + '.png', clip });
      out.push({ name, k, gi: c.gi, look: c.look, near: c.near, tag, t: +t.toFixed(2), ...info, X: undefined, Y: undefined });
    }
  }
}
return out;
