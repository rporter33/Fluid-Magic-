const dir = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/integrate/shots-dev/';
const page = await open(1600, 900, '?b=c&paused=1');
const info = await page.evaluate(() => {
  const G = window.__battle.game, T = G.stage.T;
  const find = (u) => T.G.find((q) => q.g.unit === u);
  const fa = find('flameArcher'), lh = find('longbowHunter'), ea = find('emberAdept');
  const shotT = (Gq) => { for (const fi of Gq.figs) { const f = T.F[fi]; if (f.shots.length) return f.shots[0]; } return null; };
  const s1 = shotT(fa), s2 = shotT(lh), s3 = shotT(ea);
  const ac = T.G.find((q) => q.g.unit === 'ashChieftain');
  const st = G.stage;
  return { fa: fa.idx, lh: lh.idx, ea: ea.idx, ac: ac.idx, s1: s1 && [s1.t, s1.tRel], s2: s2 && [s2.t, s2.tRel], s3: s3 && [s3.t, s3.tRel], rally: st.paint.rally[ac.idx], cheer: st.paint.cheerT, dur: T.duration, rout: T.F.filter((f) => f.rout).slice(0, 3).map((f) => [f.rout.t, T.G[f.g].g.unit]) };
});
const zoomOn = (gi, t, z, dx, dy) => page.evaluate(([gi, t, z, dx, dy]) => {
  const G = window.__battle.game; G.playing = false; G.seek(t);
  const st = G.stage, f = st.T.F[st.T.G[gi].figs[0]];
  const p = figPos(st.T, f, t, { x: 0, y: 0, h: 0 });
  G.follow = false; G.user = { cx: sx(p.x, p.y) + (dx || 0), cy: sy(p.x, p.y, 0) + (dy || -14), z };
  G.render(t); G.render(t);
}, [gi, t, z, dx, dy]);
const poses = (gi, t) => page.evaluate(([gi, t]) => { const st = window.__battle.game.stage; return st.T.G[gi].figs.slice(0, 12).map((fi) => st.sprites[fi] && PPOSE[st.sprites[fi].pPose]); }, [gi, t]);
const out = { info };
let k = 0;
for (const [gi, s] of [[info.fa, info.s1], [info.lh, info.s2]]) {
  if (!s) continue;
  for (const t of [s[0] + 0.05, s[0] + 0.25, s[1] + 0.05, s[1] + 0.2]) { await zoomOn(gi, t, 3); out['p' + (++k)] = await poses(gi, t); await page.screenshot({ path: dir + `archer-${gi}-${t.toFixed(2)}.png`, clip: { x: 500, y: 250, width: 600, height: 400 } }); }
}
if (info.s3) for (const t of [info.s3[0] + 0.1, info.s3[1] + 0.05]) { await zoomOn(info.ea, t, 4); out['cast' + t.toFixed(2)] = await poses(info.ea, t); await page.screenshot({ path: dir + `cast-${t.toFixed(2)}.png`, clip: { x: 600, y: 250, width: 400, height: 400 } }); }
if (info.rally) for (const t of info.rally.slice(0, 2)) for (const d of [0.2, 0.8]) { await zoomOn(info.ac, t + d, 4); out['rally' + (t + d).toFixed(2)] = await poses(info.ac, t + d); await page.screenshot({ path: dir + `rally-${(t + d).toFixed(2)}.png`, clip: { x: 600, y: 250, width: 400, height: 400 } }); }
// the outro cheer (battle c's winner: Thornwood) and a rout with dropped gear
const W = await page.evaluate(() => { const T = window.__battle.game.stage.T; return T.G.find((q) => q.g.unit === 'warden').idx; });
await zoomOn(W, info.dur - 0.5, 2.6); out.cheer = await poses(W, info.dur - 0.5); await page.screenshot({ path: dir + `cheer.png` });
await zoomOn(info.fa, info.rout[0][0] + 1.0, 2.2); await page.screenshot({ path: dir + `rout-drop.png` });
return out;
