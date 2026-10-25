// Pictures of the keyboard states on the stage C review page: the skip link focused, a group's "View full size" button
// focused, the gallery after one arrow step, and a pick pressed by keyboard. Usage: node shoot_keys.cjs
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const ROOT = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-c/';
const DIR = ROOT + 'review-build/page-shots/';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  for (const [w, h, tag, mobile] of [[1440, 900, 'w1440', false], [390, 844, 'w390', true]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
    const page = await ctx.newPage();
    await page.goto('file://' + ROOT + 'review.html', { waitUntil: 'load' });
    await page.evaluate(() => { try { localStorage.clear(); } catch { /* blocked */ } });
    await page.reload({ waitUntil: 'load' });
    await page.keyboard.press('Tab');
    await page.screenshot({ path: `${DIR}${tag}-key-skip.png` });
    await page.focus('#g-ascendedHero .vbtn[data-v="Keep"]'); await page.keyboard.press('Shift+Tab');
    await page.evaluate(() => document.activeElement.closest('.fig').scrollIntoView({ block: 'start' }));
    await page.screenshot({ path: `${DIR}${tag}-key-zb.png` });
    await page.keyboard.press('Enter'); await page.waitForTimeout(150);
    await page.keyboard.press('ArrowRight'); await page.waitForTimeout(150);
    await page.screenshot({ path: `${DIR}${tag}-key-gallery.png` });
    await page.keyboard.press('Escape');
    await page.focus('#g-ascendedHero .vbtn[data-v="Keep"]'); await page.keyboard.press('Space');
    await page.evaluate(() => document.activeElement.closest('.vrow').scrollIntoView({ block: 'center' }));
    await page.screenshot({ path: `${DIR}${tag}-key-pick.png` });
    await ctx.close();
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
