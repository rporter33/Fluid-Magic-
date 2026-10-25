// Median automatic-camera key zoom with the commander box growth (critique fix 7) against without it (1920 x 1080, 1x).
const page = await open(1920, 1080, '?paused=1');
return await page.evaluate(() => {
  const G = window.__battle.game; const out = {};
  const keep = window.commandersInBox;
  const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[s.length >> 1]; };
  for (const b of DATA) {
    G.load(b.key); G.playing = false;
    const T = G.stage.T;
    const withC = buildCameraKeys(T, 1920, 1080, 1);
    window.commandersInBox = (T2, k) => ({ ...k.box });
    const without = buildCameraKeys(T, 1920, 1080, 1);
    window.commandersInBox = keep;
    const zw = med(withC.keys.slice(1).map((k) => k.z)), zo = med(without.keys.slice(1).map((k) => k.z));
    out[b.key] = { keysWith: withC.keys.length, keysWithout: without.keys.length, medianZoomWith: +zw.toFixed(4), medianZoomWithout: +zo.toFixed(4), dropPct: +(100 * (1 - zw / zo)).toFixed(1) };
  }
  return out;
});
