const page = await open(1920, 1080);
const res = {};
for (const k of ['a', 'b', 'c']) {
  await page.evaluate((k) => window.__battle.load(k), k);
  const info = await page.evaluate(() => {
    const G = window.__battle.game, T = G.stage.T;
    return { m: window.__battle.moments(), groups: window.__battle.groups(), nearSide: G.stage.S.nearSide, winner: G.B.winner,
      camKeys: G.cam.keys.length, zAll: G.cam.zAll, beats: T.beats.map((b) => [+b.t.toFixed(2), b.weight, b.text]),
      slow: T.slow, terrain: G.B.terrain, month: G.B.month, storm: G.B.storm, field: G.stage.L.field };
  });
  res[k] = info;
  for (const sp of [1, 4]) {
    await page.evaluate((s) => window.__battle.setSpeed(s), sp);
    for (const [name, t] of Object.entries(info.m)) {
      if (t === null || name === 'duration') continue;
      await page.evaluate((t) => window.__battle.seek(t), t);
      await page.waitForTimeout(60);
      await page.screenshot({ path: `shots/${k}-${sp}x-${name}.png` });
    }
  }
  await page.evaluate((s) => window.__battle.setSpeed(1), 1);
}
return res;
