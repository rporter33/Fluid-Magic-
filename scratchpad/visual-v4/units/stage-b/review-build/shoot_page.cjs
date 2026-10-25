// Shoots stage-b/review.html at 1440 and 390 wide (full page, sliced), and exercises the verdict controls.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const PAGE = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/review.html';
const DIR = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/review-build/page-shots/';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const out = {};
  for (const [w, h, tag, mobile] of [[1440, 900, 'w1440', false], [390, 844, 'w390', true]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200)); });
    if (process.env.NOFONTS) await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    await page.goto('file://' + PAGE, { waitUntil: 'load', timeout: 60000 });
    await page.evaluate(async () => { for (const im of document.images) { im.loading = 'eager'; } await Promise.all([...document.images].map((im) => im.decode().catch(() => null))); await document.fonts.ready; });
    const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, H: document.documentElement.scrollHeight,
      fonts: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family), rows: document.querySelectorAll('.vrow[data-key]').length, cand: (() => { const w = [...document.querySelectorAll('.slot .cand img')].map((i) => Math.round(i.getBoundingClientRect().width)); return [w.length, Math.min(...w), Math.max(...w)]; })(), tw: (() => { const w = [...document.querySelectorAll('.slot .tw img')].map((i) => Math.round(i.getBoundingClientRect().width)); return [w.length, Math.min(...w), Math.max(...w)]; })(), link: document.getElementById('mockup-link').href, badLinks: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).filter((h) => !h.startsWith('#') && !h.startsWith('https://claude.ai/artifact/')),
      wide: [...document.querySelectorAll('body *')].filter((el) => el.getBoundingClientRect().right > document.documentElement.clientWidth + 1 && !el.closest('.tablewrap')).slice(0, 8).map((el) => el.tagName + '.' + el.className + ' ' + Math.round(el.getBoundingClientRect().right)) }));
    // full page, sliced
    const H = m.H, step = 2400;
    let i = 0;
    for (let y = 0; y < H; y += step) {
      await page.screenshot({ path: `${DIR}${tag}-${String(i).padStart(2, '0')}.png`, fullPage: true, clip: { x: 0, y, width: w, height: Math.min(step, H - y) } });
      i++;
    }
    // interactions: a portrait pick, a disabled pick, a note, troops, a commander kind, mounts
    await page.click('.vrow[data-key="p:fireSprite"] .vbtn[data-v="A"]');
    await page.click('.vrow[data-key="p:giant01"] .vbtn[data-v="A"]', { force: true }).catch(() => null);
    await page.click('.vrow[data-key="p:oakheart"] .vbtn[data-v="Redo"]');
    await page.fill('.vrow[data-key="p:oakheart"] input', 'more thorns, less face');
    await page.click('.vrow[data-key="troops"] .vbtn[data-v="Keep"]');
    await page.click('.vrow[data-key="c:cinderScout"] .vbtn[data-v="Redo"]');
    await page.fill('.vrow[data-key="c:cinderScout"] input', 'fix the back view');
    await page.click('.vrow[data-key="mounts"] .vbtn[data-v="Later"]');
    await page.click('.vrow[data-key="c:ownKit"] .vbtn[data-v="Later"]');
    await page.fill('#general', 'paint the gods first');
    const v1 = await page.evaluate(() => ({ line: document.getElementById('summary').textContent, count: document.getElementById('count').textContent, stored: (() => { try { return localStorage.getItem('fm-stage-b-review-v1'); } catch (e) { return 'ERR ' + e.message; } })() }));
    await page.reload({ waitUntil: 'load' });
    const v2 = await page.evaluate(() => ({ line: document.getElementById('summary').textContent, pressed: [...document.querySelectorAll('.vbtn[aria-pressed="true"]')].map((b) => b.closest('.vrow').dataset.key + '=' + b.dataset.v) }));
    await page.locator('#verdict').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${DIR}${tag}-verdict.png` });
    await page.locator('#p-fireSprite').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${DIR}${tag}-subject.png` });
    await page.locator('#p-titan').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${DIR}${tag}-god.png` });
    await page.locator('#k-ownKit').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${DIR}${tag}-ownkit.png` });
    // lightbox
    await page.locator('#k-ashChieftain .face img.fig').first().click();
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${DIR}${tag}-lightbox.png` });
    await page.keyboard.press('Escape');
    // a11y pass: the keyboard states (skip link, a group's View full size button, the gallery, the ok and flaw marks)
    await page.reload({ waitUntil: 'load' });
    await page.evaluate(async () => { for (const im of document.images) im.loading = 'eager'; await Promise.all([...document.images].map((im) => im.decode().catch(() => null))); });
    await page.keyboard.press('Tab');
    await page.screenshot({ path: `${DIR}${tag}-a11y-skip.png` });
    await page.focus('#p-titan .vbtn[data-v="A"]'); await page.keyboard.press('Shift+Tab'); // the subject's View button, by keyboard
    await page.evaluate(() => document.activeElement.closest('.subj').scrollIntoView({ block: 'start' }));
    await page.screenshot({ path: `${DIR}${tag}-a11y-zb.png` });
    const zbFocused = await page.evaluate(() => document.activeElement.className + ' ' + document.activeElement.textContent);
    await page.keyboard.press('Enter'); await page.waitForTimeout(150);
    await page.keyboard.press('ArrowRight'); await page.waitForTimeout(150);
    await page.screenshot({ path: `${DIR}${tag}-a11y-gallery.png` });
    await page.keyboard.press('Escape');
    await page.locator('#troops .troop:has(li.flaw)').first().scrollIntoViewIfNeeded();
    await page.locator('#troops .troop:has(li.flaw)').first().screenshot({ path: `${DIR}${tag}-a11y-marks.png` });
    out[tag] = { m, v1, v2, zbFocused, errors };
    await ctx.close();
  }
  // storage blocked: page must still work
  {
    const ctx = await browser.newContext({ viewport: { width: 800, height: 600 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    await page.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } }); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    await page.goto('file://' + PAGE, { waitUntil: 'load' });
    await page.click('.vrow[data-key="p:wolf"] .vbtn[data-v="B"]');
    out.blocked = { line: await page.evaluate(() => document.getElementById('summary').textContent), errors };
    await ctx.close();
  }
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})();
