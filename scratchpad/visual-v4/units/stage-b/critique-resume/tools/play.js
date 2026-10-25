// Critique-resume: play each battle on the automatic camera at 1x and 4x, 14 shots across the battle plus its moments.
const DIR = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/critique-resume/shots/';
const log = [];
const page = await open(1920, 1080, '?paused=1');
await page.mouse.move(960, 20);
for (const k of ['a', 'b', 'c']) {
  for (const s of [1, 4]) {
    const m = await page.evaluate(([k, s]) => { const G = window.__battle.game; G.speed = s; G.load(k); G.playing = false; G.camSpeed = s; G.cam = G.camFor(s); G.camFade = null; return G.moments(); }, [k, s]);
    const ts = [];
    for (let i = 0; i < 14; i++) ts.push(+(1 + (m.duration - 1.2) * i / 13).toFixed(2));
    for (const n of ['volley', 'clash', 'monster', 'breath', 'rout', 'death']) if (m[n] !== null) ts.push(+m[n].toFixed(2));
    ts.sort((a, b) => a - b);
    for (const t of ts) {
      const info = await page.evaluate(([t]) => { const G = window.__battle.game; G.playing = false; G.follow = true; G.user = null; G.camFade = null; G.seek(t); G.render(t); G.render(t);
        const st = G.stage; return { t, z: +G.curCam.z.toFixed(3), manPx: +(G.curCam.z * 28).toFixed(1), tier: st.paint ? st.paint.tier : null, drawn: st.stats.drawn }; }, [t]);
      const name = `play-${k}-${s}x-${String(Math.round(t * 10)).padStart(4, '0')}`;
      await page.screenshot({ path: DIR + name + '.png' });
      log.push({ name, ...info });
    }
  }
}
return { log, m: null };
