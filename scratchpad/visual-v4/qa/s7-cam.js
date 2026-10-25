const page = await open(1920, 1080);
return await page.evaluate(() => {
  const G = window.__battle.game; const res = {};
  for (const key of ['a', 'b', 'c']) {
    G.load(key); const T = G.stage.T, C = G.cam;
    const out = { keys: C.keys.length, zAll: +C.zAll.toFixed(3) };
    for (const speed of [1, 4]) {
      // real-time playback at 60 fps; pan speed in screen px per real second, zoom change per real second
      let t = 0, prev = cameraAt(C, 0, false), maxPan = 0, maxZoom = 0, fast = 0, frames = 0; const spikes = [];
      while (t < T.duration) {
        t = Math.min(T.duration, t + (1 / 60) * speed * storyRate(T, t, speed));
        const c = cameraAt(C, t, false);
        const pan = Math.hypot(c.cx - prev.cx, c.cy - prev.cy) * c.z * 60;
        const zr = Math.abs(Math.log(c.z / prev.z)) * 60;
        if (pan > maxPan) maxPan = pan; if (zr > maxZoom) maxZoom = zr;
        if (pan > 1500) { fast++; if (spikes.length < 6) spikes.push(+t.toFixed(2)); }
        frames++; prev = c;
      }
      out['x' + speed] = { maxPanPxPerSec: Math.round(maxPan), maxZoomLogPerSec: +maxZoom.toFixed(2), framesOver1500pxs: fast, of: frames, at: spikes };
    }
    res[key] = out;
  }
  return res;
});
