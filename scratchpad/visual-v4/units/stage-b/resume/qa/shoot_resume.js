// Resume pass shots (run by drv.cjs) beside the integration and fix sets: the card bar of each battle at deploy at 2x
// (the painted troop busts), each Thornwood commander at 72 px at deploy and at the clash in the view the battle uses,
// and battle b's outro with Sapling Druid 03 cheering (his aliased cheer frame). Writes units/stage-b/shots/resume-*.png.
const DIR = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/shots/';
const log = [];
const page = await open(1600, 900, '?paused=1', { dpr: 2 });
const snap = async (name, clip) => { await page.screenshot({ path: DIR + name + '.png', ...(clip ? { clip } : {}) }); log.push(name); };
const auto = (k, t) => page.evaluate(([k, t]) => { const G = window.__battle.game; if (G.key !== k) G.load(k); G.playing = false; G.follow = true; G.user = null; G.seek(t); G.render(t); G.render(t); }, [k, t]);
const atFig = (k, t, fi, px, dy) => page.evaluate(([k, t, fi, px, dy]) => {
  const G = window.__battle.game; if (G.key !== k) G.load(k); G.playing = false; G.seek(t);
  const T = G.stage.T, p = figPos(T, T.F[fi], t, { x: 0, y: 0, h: 0 });
  G.follow = false; G.user = { cx: sx(p.x, p.y), cy: sy(p.x, p.y, p.h) - (dy || 20), z: px / 28 * Math.max(window.innerWidth / 1920, 0.5) };
  G.render(t); G.render(t);
  const sp = G.stage.sprites[fi];
  return sp && sp.paint ? { look: sp.paint.key, tier: G.stage.paint.tier, visible: sp.visible, tex: PAINTLIB.texLook.get(sp.texture) } : null;
}, [k, t, fi, px, dy]);
const out = {};
for (const k of ['a', 'b', 'c']) {
  const m = await page.evaluate((k) => { const G = window.__battle.game; G.load(k); return G.moments(); }, k);
  await auto(k, m.deploy);
  const r = await page.evaluate(() => { const b = document.getElementById('bar').getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; });
  await snap(`resume-${k}-cardbar`, { x: Math.max(0, r.x - 4), y: Math.max(0, r.y - 4), width: Math.min(1600, r.w + 8), height: r.h + 8 });
  const cmds = await page.evaluate(() => { const st = window.__battle.game.stage, T = st.T; return T.G.filter((q) => q.g.isCmd && q.g.size < 3 && st.B.sides[q.side].def === 'thornwood').map((q) => ({ fig: q.figs[0], unit: q.g.unit, look: st.paint.lookOf[q.idx], name: q.g.personal })); });
  for (const c of cmds) {
    for (const [tag, t] of [['deploy', m.deploy + 0.5], ['clash', m.clash + 0.8]]) {
      const info = await atFig(k, t, c.fig, 72, 22);
      out[`${k}-${c.look}-${tag}`] = info;
      await snap(`resume-${k}-cmd-${c.look}-${tag}`, { x: 500, y: 200, width: 600, height: 460 });
    }
  }
}
// battle b's outro: the winner cheers; Sapling Druid 03 (near, back view) with his cheer frame aliased to the rally
{
  const r = await page.evaluate(() => { const G = window.__battle.game; G.load('b'); const st = G.stage, T = st.T; const q = T.G.find((x) => x.g.unit === 'saplingDruid'); const f = T.F[q.figs[0]]; return { fig: q.figs[0], cheer: st.paint.cheerT, dead: f.death ? f.death.t : null, look: st.paint.lookOf[q.idx] }; });
  out.sd03 = r;
  if (r.cheer !== null && (r.dead === null || r.dead > r.cheer)) {
    for (const dt of [0.1, 0.45]) { out['sd03-cheer-' + dt] = await atFig('b', r.cheer + dt, r.fig, 96, 26); await snap(`resume-b-sd03-cheer-${dt}`, { x: 550, y: 200, width: 500, height: 460 }); }
  }
}
return { log, out };
