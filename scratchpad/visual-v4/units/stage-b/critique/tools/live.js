// Live playback at 1x and 4x (real rAF loop), screenshots at story-time marks; records the clock and errors.
const DIR = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/critique/shots/';
const ONLY = (process.env.ONLY || 'a,b,c').split(',');
const SPEEDS = (process.env.SPEEDS || '1,4').split(',').map(Number);
const log = [];
const page = await open(1920, 1080, '');
for (const k of ONLY) for (const sp of SPEEDS) {
  await page.evaluate(([k, sp]) => { const G = window.__battle.game; G.load(k); G.speed = sp; G.playing = true; }, [k, sp]);
  const dur = await page.evaluate(() => window.__battle.game.stage.T.duration);
  const marks = []; for (let t = 3; t < dur; t += (sp === 1 ? 6 : 9)) marks.push(t); marks.push(dur - 0.05);
  const t0 = Date.now(); const clock = [];
  for (const m of marks) {
    while (true) {
      const s = await page.evaluate(() => ({ t: window.__battle.game.t, p: window.__battle.game.playing }));
      if (s.t >= m || !s.p) break;
      await new Promise((r) => setTimeout(r, 60));
    }
    const s = await page.evaluate(() => ({ t: +window.__battle.game.t.toFixed(2), tier: window.__battle.game.stage.paint && window.__battle.game.stage.paint.tier, z: +window.__battle.game.stage.world.scale.x.toFixed(3) }));
    clock.push({ real: (Date.now() - t0) / 1000, ...s });
    await page.screenshot({ path: `${DIR}live-${k}-${sp}x-${String(Math.round(m)).padStart(2, '0')}.png` });
  }
  log.push({ k, sp, clock });
}
return log;
