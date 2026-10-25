// The six motion strips of stage-b/shots that the integration made by hand, re-shot frame by frame (battle c):
// rally, cast, Flame Archer and Longbow Hunter nock-draw-loose, the outro cheer, a rout with dropped gear.
const D = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/fix/qa/strips/';
const page = await open(1600, 900, '?b=c&paused=1');
const info = await page.evaluate(() => {
  const G = window.__battle.game, T = G.stage.T, st = G.stage;
  const find = (u) => T.G.find((q) => q.g.unit === u);
  const shotT = (Gq) => { for (const fi of Gq.figs) { const f = T.F[fi]; if (f.shots.length) return [fi, f.shots[0].t, f.shots[0].tRel]; } return null; };
  const ac = find('ashChieftain'), ea = find('emberAdept');
  const rf = T.F.find((f) => f.rout && st.sprites[f.id] && st.sprites[f.id].paint && st.sprites[f.id].paint.look.kind === 'troop' && !f.death);
  return { fa: shotT(find('flameArcher')), lh: shotT(find('longbowHunter')), ea: shotT(ea), ac: ac.figs[0], rally: st.paint.rally[ac.idx], cheer: st.paint.cheerT, lhG: find('longbowHunter').idx, rout: rf ? [rf.id, rf.rout.t] : null };
});
const zoom = (fi, t, z, dy) => page.evaluate(([fi, t, z, dy]) => {
  const G = window.__battle.game; G.playing = false; G.seek(t);
  const st = G.stage, p = figPos(st.T, st.T.F[fi], t, { x: 0, y: 0, h: 0 });
  G.follow = false; G.user = { cx: sx(p.x, p.y), cy: sy(p.x, p.y, 0) + (dy || -16), z }; G.render(t); G.render(t);
}, [fi, t, z, dy]);
const out = {};
const strip = async (name, fi, times, z, clip) => { out[name] = []; let i = 0; for (const t of times) { await zoom(fi, t, z); const f = `${D}${name}.${i++}.png`; await page.screenshot({ path: f, clip }); out[name].push(f); } };
const C = { x: 600, y: 250, width: 400, height: 400 };
if (info.rally) await strip('c-motion-ashChieftain-rally', info.ac, [info.rally[1] - 0.2, info.rally[1] + 0.2, info.rally[1] + 0.6, info.rally[1] + 0.9, info.rally[1] + 1.3], 4, C);
if (info.ea) await strip('c-motion-emberAdept-cast', info.ea[0], [info.ea[1] - 0.2, info.ea[1] + 0.1, (info.ea[1] + info.ea[2]) / 2, info.ea[2] + 0.05, info.ea[2] + 0.4], 4, C);
if (info.fa) await strip('c-motion-flamearcher-nock-draw-loose', info.fa[0], [info.fa[1] + 0.05, info.fa[1] + 0.25, info.fa[2] + 0.05, info.fa[2] + 0.2], 3, { x: 500, y: 250, width: 600, height: 400 });
if (info.lh) await strip('c-motion-longbow-nock-draw-loose', info.lh[0], [info.lh[1] + 0.05, info.lh[1] + 0.25, info.lh[2] + 0.05, info.lh[2] + 0.2], 3, { x: 500, y: 250, width: 600, height: 400 });
if (info.cheer !== null) {
  const fi = await page.evaluate((g) => window.__battle.game.stage.T.G[g].figs.find((i) => { const f = window.__battle.game.stage.T.F[i]; return !f.death && !f.rout; }), info.lhG);
  if (fi !== undefined) await strip('c-motion-outro-cheer', fi, [info.cheer + 0.1, info.cheer + 0.45, info.cheer + 0.8, info.cheer + 1.15], 2.4, { x: 300, y: 150, width: 1000, height: 600 });
}
if (info.rout) await strip('c-rout-dropped-gear', info.rout[0], [info.rout[1] + 0.05, info.rout[1] + 0.4, info.rout[1] + 0.9, info.rout[1] + 1.6], 3, { x: 450, y: 200, width: 700, height: 500 });
return out;
