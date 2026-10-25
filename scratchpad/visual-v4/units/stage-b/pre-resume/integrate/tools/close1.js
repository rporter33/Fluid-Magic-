const page = await open(1600, 900, '?b=c&paused=1');
const dir = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/integrate/shots-dev/';
const shot = async (name, t, gi, f) => {
  await page.evaluate(([t, gi, f]) => {
    const G = window.__battle.game; G.playing = false; G.seek(t);
    const h = G.stage.hull(G.stage.T.G[gi], t);
    G.follow = false; G.user = { cx: h.X, cy: h.Y - 10, z: f / 28 };
    G.render(t);
  }, [t, gi, f]);
  await page.screenshot({ path: dir + name + '.png' });
  return await page.evaluate(() => ({ tier: window.__battle.game.stage.paint.tier }));
};
const m = await page.evaluate(() => window.__battle.moments());
const out = {};
out.a = await shot('c-close-cw-deploy', 2.2, 4, 72);
out.b = await shot('c-close-wd-deploy', 2.2, 12, 72);
out.c = await shot('c-close-clash', m.clash + 1.0, 4, 72);
out.d = await shot('c-close-sal', m.monster, 0, 60);
return out;
