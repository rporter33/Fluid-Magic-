const page = await open(1920, 1080);
const out = {};
const zoomAt = async (t, gi, z) => page.evaluate(([t, gi, z]) => {
  const G = window.__battle.game; G.playing = false; G.follow = true; G.user = null; G.seek(t);
  const h = G.stage.hull(G.stage.T.G[gi], t);
  G.userFromCurrent(); G.user.z = G.curCam.z * z; if (h) { G.user.cx = h.X; G.user.cy = h.Y; } G.render(t);
  return { z: G.user.z, figPx: 28 * G.user.z };
}, [t, gi, z]);
// battle a: the seam at clash, the wyrm at its first strike, a volley
await page.evaluate(() => window.__battle.load('a'));
let m = await page.evaluate(() => window.__battle.moments());
out.a_clash = await zoomAt(m.clash + 1.5, 5, 2.2); await page.waitForTimeout(50); await page.screenshot({ path: 'shots/z-a-clash.png' });
out.a_monster = await zoomAt(m.monster, 11, 1.6); await page.waitForTimeout(50); await page.screenshot({ path: 'shots/z-a-monster.png' });
out.a_volley = await zoomAt(m.volley, 14, 2.2); await page.waitForTimeout(50); await page.screenshot({ path: 'shots/z-a-volley.png' });
out.a_late = await zoomAt(30, 5, 1.8); await page.waitForTimeout(50); await page.screenshot({ path: 'shots/z-a-30s.png' });
// battle b: the wall
await page.evaluate(() => window.__battle.load('b'));
m = await page.evaluate(() => window.__battle.moments());
out.b_clash = await zoomAt(m.clash + 2, 13, 2.0); await page.waitForTimeout(50); await page.screenshot({ path: 'shots/z-b-clash.png' });
out.b_monster = await zoomAt(m.monster, 0, 1.8); await page.waitForTimeout(50); await page.screenshot({ path: 'shots/z-b-monster.png' });
// battle c
await page.evaluate(() => window.__battle.load('c'));
m = await page.evaluate(() => window.__battle.moments());
out.c_clash = await zoomAt(m.clash + 1.0, 0, 2.0); await page.waitForTimeout(50); await page.screenshot({ path: 'shots/z-c-clash.png' });
out.c_late = await zoomAt(35, 12, 1.6); await page.waitForTimeout(50); await page.screenshot({ path: 'shots/z-c-35s.png' });
return out;
