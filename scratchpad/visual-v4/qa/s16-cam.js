const page = await open(1920, 1080);
return await page.evaluate(() => {
  const G = window.__battle.game; const res = {};
  // proposed: ease and key spacing measured in real seconds, i.e. scaled by speed
  const build = (T, W, H, speed) => {
    const R = safeRect(W, H); const fScale = W / 1920; const fMax = 48 * fScale;
    const zAll = clamp(fitZoom(T.allBox, R), 18 * fScale / 28, fMax / 28);
    const keys = [{ t: 0, cx: (T.allBox.x0 + T.allBox.x1) / 2, cy: (T.allBox.y0 + T.allBox.y1) / 2, z: zAll }]; let last = keys[0];
    const gap = 1.4 * Math.max(1, speed / 1.5), ease = 0.8 * Math.max(1, speed / 1.5);
    for (const k of T.camera) { if (k.t < 2.6) continue; let z = Math.min(clamp(fitZoom(k.box, R), zAll, 1.6 * zAll), fMax / 28); if (k.hold) z = Math.min(z * 1.25, fMax / 28 * 1.1, 2 * zAll);
      const c = { t: k.t, cx: (k.box.x0 + k.box.x1) / 2, cy: (k.box.y0 + k.box.y1) / 2, z, hold: k.hold };
      if (!k.hold && k.t - last.t < gap) continue; const moved = Math.hypot(c.cx - last.cx, c.cy - last.cy) / ((R.x1 - R.x0) / last.z); if (!k.hold && moved < 0.08 && Math.abs(c.z / last.z - 1) < 0.08) continue; keys.push(c); last = c; }
    const at = (i, t) => { const k = keys[i]; if (!k.from || i === 0) return k; const q = smooth((t - k.t) / ease); return { cx: lerp(k.from.cx, k.cx, q), cy: lerp(k.from.cy, k.cy, q), z: lerp(k.from.z, k.z, q) }; };
    for (let i = 1; i < keys.length; i++) keys[i].from = at(i - 1, keys[i].t);
    return (t) => { let i = 0; for (let j = keys.length - 1; j >= 0; j--) if (keys[j].t <= t) { i = j; break; } return at(i, t); };
  };
  for (const key of ['a', 'b', 'c']) {
    G.load(key); const T = G.stage.T;
    for (const speed of [1, 4]) {
      const cam = build(T, 1920, 1080, speed);
      let t = 0, prev = cam(0), maxPan = 0, over = 0;
      while (t < T.duration) { t = Math.min(T.duration, t + (1 / 60) * speed * storyRate(T, t, speed)); const c = cam(t); const pan = Math.hypot(c.cx - prev.cx, c.cy - prev.cy) * c.z * 60; maxPan = Math.max(maxPan, pan); if (pan > 1500) over++; prev = c; }
      res[key + speed] = { maxPanPxPerSec: Math.round(maxPan), framesOver1500: over };
    }
  }
  return res;
});
