const DIR = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/critique/shots/';
const page = await open(1920, 1080, '?paused=1');
const log = [];
for (const [k, t, combos] of [['a', 7.0, [['vivid', 'darkestC']]], ['c', 13.5, [['vivid', 'darkC']]], ['b', 6.0, [['darkC', 'lighter']]]]) {
  for (const [n, f] of combos) {
    await page.evaluate(([k, t, n, f]) => {
      PAINT_SIDE_SHIFT.cinderHorde.vivid = [0.15, 1.25]; PAINT_SIDE_SHIFT.thornwood.darkestC = [-0.12, 1.3]; PAINT_SIDE_SHIFT.cinderHorde.lightest2 = [0.2, 1.1];
      PAINT_SIDE_SHIFT.thornwood.darkC = [-0.05, 1.3]; PAINT_SIDE_SHIFT.thornwood.darkerC = [-0.08, 1.35];
      const B = DATA.find((b) => b.key === k); PAINT_SIDE_LOOK_TABLE[sideLookKey(B)] = { near: n, far: f };
      const G = window.__battle.game; G.load(k); G.playing = false; G.follow = true; G.user = null; G.seek(t); G.render(t); G.render(t);
    }, [k, t, n, f]);
    await page.screenshot({ path: `${DIR}side-${k}-${n}-${f}.png` });
    log.push(`side-${k}-${n}-${f}`);
  }
}
return log;
