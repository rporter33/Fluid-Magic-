const page = await open(1920, 1080);
return await page.evaluate(async () => {
  const G = window.__battle.game; const res = {};
  for (const key of ['a']) for (const pass of [0, 1]) {
    G.load(key); G.speed = 1; G.playing = false;
    const T = G.stage.T; let t = 0; const rows = [];
    let i = 0;
    while (t < T.duration) {
      t = Math.min(T.duration, t + (1 / 60) * storyRate(T, t, 1));
      const a = performance.now(); G.stage.frame(t, 1, G.view); const b = performance.now(); G.applyCamera(t); const c = performance.now(); G.hud.update(t); const d = performance.now();
      if (d - a > 8) rows.push([+t.toFixed(2), +(b - a).toFixed(1), +(c - b).toFixed(1), +(d - c).toFixed(1)]);
      if (++i % 60 === 0) await new Promise((r) => setTimeout(r, 0));
    }
    res[key + pass] = rows.sort((x, y) => (y[1] + y[2] + y[3]) - (x[1] + x[2] + x[3])).slice(0, 10);
  }
  return res;
});
