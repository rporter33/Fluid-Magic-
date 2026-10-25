// Share of the automatic camera's play time on tier H (1920 x 1080, DPR 1), with the page's thresholds and with 56/53.
const page = await open(1920, 1080, '?paused=1');
return await page.evaluate(() => {
  const G = window.__battle.game; const out = {};
  for (const b of DATA) for (const speed of [1, 4]) {
    G.load(b.key); G.playing = false; G.follow = true; G.user = null; G.speed = speed;
    const C = buildCameraKeys(G.stage.T, 1920, 1080, speed);
    const run = (up, down) => { let tier = 'S', h = 0, n = 0, sw = 0, first = null;
      for (let t = 0; t < G.stage.T.duration; t += 0.05) { const px = 28 * cameraAt(C, t, false).z; const nt = tier === 'S' ? (px > up ? 'H' : 'S') : (px < down ? 'S' : 'H'); if (nt !== tier) { sw++; if (first === null && nt === 'H') first = +t.toFixed(1); } tier = nt; n++; if (tier === 'H') h++; }
      return { hPct: Math.round(100 * h / n), switches: sw, firstH: first }; };
    out[b.key + '@' + speed + 'x'] = { now: run(PAINT_TIER_UP, PAINT_TIER_DOWN), proposed: run(56, 53), maxPx: +(28 * Math.max(...C.keys.map((k) => k.z))).toFixed(1) };
  }
  return out;
});
