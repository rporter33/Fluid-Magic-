// Close crops of varied painted blocks for the stage B review page (reads the mockup, edits nothing).
const DIR = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/review-build/shots/';
const W = 1600, H = 900;
const log = [];
const page = await open(W, H, '?paused=1');
const aim = (k, t, X, Y, f) => page.evaluate(([k, t, X, Y, f]) => {
  const G = window.__battle.game; if (G.key !== k) G.load(k); G.playing = false; G.seek(t);
  G.follow = false; G.user = { cx: X, cy: Y, z: f / 28 * Math.max(window.innerWidth / 1920, 0.5) }; G.render(t); G.render(t); return true;
}, [k, t, X, Y, f]);
const find = (k, fn) => page.evaluate(([k, src]) => { const G = window.__battle.game; if (G.key !== k) G.load(k); const st = G.stage, T = st.T; return (new Function('st', 'T', 'G', src))(st, T, G); }, [k, fn]);
const jobs = (process.env.JOBS || 'c:cinderWarrior,c:warden,a:flameArcher,b:thornMilitia,a:ashMilitia,b:warden').split(',').map((s) => s.split(':'));
const T0 = Number(process.env.T0 || 2.2);
for (const [k, unit] of jobs) {
  const g = await find(k, `const q = T.G.filter((x) => x.g.unit === '${unit}' && st.paint.lookOf[x.idx]).sort((a, b) => b.figs.length - a.figs.length)[0]; return q ? q.idx : null;`);
  if (g === null) { log.push('none ' + k + unit); continue; }
  const c = await page.evaluate(([gi, t]) => { const G = window.__battle.game; G.seek(t); const T = G.stage.T; let X = 0, Y = 0, n = 0; const q = { x: 0, y: 0, h: 0 }; for (const fi of T.G[gi].figs) { figPos(T, T.F[fi], t, q); X += sx(q.x, q.y); Y += sy(q.x, q.y, q.h); n++; } return { X: X / n, Y: Y / n }; }, [g, T0]);
  for (const [f, cw, ch] of (process.env.ZOOMS ? JSON.parse(process.env.ZOOMS) : [[72, 900, 560], [28, 420, 260]])) {
    await aim(k, T0, c.X, c.Y - 10, f);
    await page.screenshot({ path: DIR + `blk-${k}-${unit}-${f}.png`, clip: { x: (W - cw) / 2, y: (H - ch) / 2, width: cw, height: ch } });
  }
  log.push(`blk-${k}-${unit}`);
}
return log;
