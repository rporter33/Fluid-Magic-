const S = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/shots/';
const out = {};
{
  const page = await open(390, 844, '?paused=1', { dpr: 2, touch: true, mobile: true });
  const m = await page.evaluate(() => { window.__battle.load('a'); return window.__battle.moments(); });
  await page.evaluate((t) => window.__battle.seek(t), m.clash + 0.6); await page.waitForTimeout(150);
  await page.screenshot({ path: S + 'phone-a-clash.png' });
  const pt = await page.evaluate(() => window.__battle.screenOf(window.__battle.groups().find((g) => g.unit === 'cinderWarrior').idx));
  await page.touchscreen.tap(pt.x, pt.y); await page.waitForTimeout(200);
  out.portraitTap = await page.evaluate(() => { const r = document.getElementById('hover').getBoundingClientRect(); return { selected: window.__battle.game.view.selected, shown: document.getElementById('hover').classList.contains('show'), rect: [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)] }; });
  await page.screenshot({ path: S + 'phone-portrait-tap.png' });
  await page.evaluate(() => window.__battle.load('b')); await page.waitForTimeout(50);
  const m2 = await page.evaluate(() => window.__battle.moments());
  await page.evaluate((t) => window.__battle.seek(t), m2.monster); await page.waitForTimeout(150);
  await page.screenshot({ path: S + 'phone-b-monster.png' });
  await page.evaluate(() => window.__battle.load('c'));
  const m3 = await page.evaluate(() => window.__battle.moments());
  await page.evaluate((t) => window.__battle.seek(t), m3.result); await page.waitForTimeout(250);
  await page.screenshot({ path: S + 'phone-c-result.png' });
  await page.click('#bMenu'); await page.waitForTimeout(150);
  await page.screenshot({ path: S + 'phone-menu-picker.png' });
  out.menu = await page.$$eval('#menu button', (bs) => bs.filter((b) => getComputedStyle(b).display !== 'none').map((b) => b.innerText.split('\n')[0]));
}
{
  const page = await open(844, 390, '?paused=1', { dpr: 2, touch: true, mobile: true });
  const m = await page.evaluate(() => { window.__battle.load('a'); return window.__battle.moments(); });
  await page.evaluate((t) => window.__battle.seek(t), m.clash + 0.6); await page.waitForTimeout(150);
  await page.screenshot({ path: S + 'phone-landscape-a-clash.png' });
  out.landscape = await page.evaluate(() => { const ids = ['enemy', 'picker', 'transport', 'ticker', 'camctl', 'scrub', 'bar']; const R = {}; for (const id of ids) { const e = document.getElementById(id); const r = e.getBoundingClientRect(); if (r.width && r.height && getComputedStyle(e).display !== 'none') R[id] = [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)]; }
    const ov = []; const k = Object.keys(R); for (let i = 0; i < k.length; i++) for (let j = i + 1; j < k.length; j++) { const a = R[k[i]], b = R[k[j]]; const ix = Math.min(a[2], b[2]) - Math.max(a[0], b[0]), iy = Math.min(a[3], b[3]) - Math.max(a[1], b[1]); if (ix > 2 && iy > 2) ov.push(k[i] + '/' + k[j]); }
    const G = window.__battle.game; return { overlaps: ov, figurePx: +(28 * G.curCam.z).toFixed(1), safe: G.cam.R }; });
}
return out;
