const page = await open(960, 540);
return await page.evaluate(() => {
  const out = {};
  for (const u of ['greatWyrm', 'treant', 'salamander']) {
    const b = makeBigBody(u, PALETTES.thornwood);
    b.pose({ t: 0.6, h: 0, act: null, k: 0, moving: false });
    const r = b.root.getLocalBounds();
    out[u] = { H: b.H, footR: b.footR, drawnW: +(r.maxX - r.minX).toFixed(0), drawnH: +(r.maxY - r.minY).toFixed(0), inSoldierHeights: +((r.maxY - r.minY) / (28 * 0.766)).toFixed(2), inSoldierWidths: +((r.maxX - r.minX) / 12).toFixed(1) };
  }
  // the soldier sprite: drawn height in world units on screen
  const G = window.__battle.game; G.load('a');
  const sp = G.stage.sprites.find((s) => s);
  out.soldierScreenH_wu = +(sp.texture.frame.height * sp.scale.y).toFixed(1);
  return out;
});
