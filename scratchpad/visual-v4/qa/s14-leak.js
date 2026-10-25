const page = await open(1280, 720);
return await page.evaluate(() => {
  const G = window.__battle.game; const r = G.app.renderer;
  const managed = () => (r.texture && r.texture.managedTextures ? r.texture.managedTextures.filter(Boolean).length : null);
  const gpuBytes = () => { let s = 0; if (r.texture && r.texture.managedTextures) for (const t of r.texture.managedTextures) if (t) s += (t.pixelWidth || t.width || 0) * (t.pixelHeight || t.height || 0) * 4; return Math.round(s / 1e6); };
  const out = { start: { managed: managed(), mb: gpuBytes() }, ground: {} };
  for (const k of ['a', 'b', 'c']) { G.load(k); G.render(1); out.ground[k] = [G.stage.groundInfo.canvas.width, G.stage.groundInfo.canvas.height, Math.round(G.stage.groundInfo.canvas.width * G.stage.groundInfo.canvas.height * 4 / 1e6) + ' MB']; }
  out.after3 = { managed: managed(), mb: gpuBytes() };
  for (let i = 0; i < 12; i++) { G.load(['a', 'b', 'c'][i % 3]); G.render(1); }
  out.after15 = { managed: managed(), mb: gpuBytes() };
  return out;
});
