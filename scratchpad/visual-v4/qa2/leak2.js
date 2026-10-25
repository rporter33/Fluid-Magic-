const page = await open(1280, 720);
return await page.evaluate(() => {
  const G = window.__battle.game; const r = G.app.renderer;
  const snap = () => r.texture.managedTextures.filter(Boolean).map((t) => [t.constructor.name, t.pixelWidth + 'x' + t.pixelHeight, t.label || '', t.uid]);
  G.load('a'); G.render(1);
  const a = new Set(snap().map((x) => x[3]));
  G.load('b'); G.render(1); G.load('a'); G.render(1);
  const b = snap().filter((x) => !a.has(x[3]));
  const counts = {}; for (const x of b) { const k = x[0] + ' ' + x[1]; counts[k] = (counts[k] || 0) + 1; }
  return { total: snap().length, newAfter2: b.length, counts };
});
