const page = await open(1920, 1080);
return await page.evaluate(() => {
  const G = window.__battle.game; const res = {};
  for (const key of ['a', 'b', 'c']) {
    G.load(key); const T = G.stage.T;
    for (const speed of [1, 4]) {
      const C = G.camFor(speed);
      let t = 0, prev = cameraAt(C, 0), maxPan = 0, over = 0, n = 0, maxZoomRate = 0;
      while (t < T.duration) { t = Math.min(T.duration, t + (1 / 60) * speed * storyRate(T, t, speed)); const c = cameraAt(C, t); const pan = Math.hypot(c.cx - prev.cx, c.cy - prev.cy) * c.z * 60; maxPan = Math.max(maxPan, pan); if (pan > 1500) over++; maxZoomRate = Math.max(maxZoomRate, Math.abs(Math.log(c.z / prev.z)) * 60); prev = c; n++; }
      res[key + speed] = { maxPanPxPerSec: Math.round(maxPan), framesOver1500: over, frames: n, maxZoomLogPerSec: +maxZoomRate.toFixed(2), keys: C.keys.length };
    }
  }
  return res;
});
