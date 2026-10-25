// Shoots stage-c/review.html at 1440 and 390 wide (full page, sliced), measures sideways scroll and page errors, and
// exercises the picks: defaults pre-selected, picks and notes survive a reload, a cleared default stays cleared, and
// the page works with storage blocked. Usage: node shoot_page.cjs  (writes page-shots/ and a11y-out/shoot.json)
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const ROOT = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-c/';
const PAGE = ROOT + 'review.html';
const DIR = ROOT + 'review-build/page-shots/';
const KEY = 'fm-stage-c-review-v1';
fs.mkdirSync(DIR, { recursive: true });
fs.mkdirSync(ROOT + 'review-build/a11y-out', { recursive: true });
const eager = (page) => page.evaluate(async () => { for (const im of document.images) im.loading = 'eager'; await Promise.all([...document.images].map((im) => im.decode().catch(() => null))); await document.fonts.ready; });
const snap = (page) => page.evaluate((K) => ({ line: document.getElementById('summary').textContent, count: document.getElementById('count').textContent,
  pressed: [...document.querySelectorAll('.vbtn[aria-pressed="true"]')].map((b) => b.closest('.vrow').dataset.key + '=' + b.dataset.v),
  notes: [...document.querySelectorAll('.vrow input')].filter((i) => i.value).map((i) => i.closest('.vrow').dataset.key + '=' + i.value),
  general: document.getElementById('general').value, stored: (() => { try { return localStorage.getItem(K); } catch (e) { return 'ERR ' + e.message; } })() }), KEY);
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const out = {};
  for (const [w, h, tag, mobile] of [[1440, 900, 'w1440', false], [390, 844, 'w390', true]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200)); });
    page.on('requestfailed', (r) => errors.push('requestfailed: ' + r.url().slice(0, 120) + ' ' + (r.failure() || {}).errorText));
    await page.goto('file://' + PAGE, { waitUntil: 'load', timeout: 90000 });
    await page.evaluate(() => { try { localStorage.clear(); } catch { /* blocked */ } });
    await page.reload({ waitUntil: 'load' });
    await eager(page);
    const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, H: document.documentElement.scrollHeight,
      fonts: [...new Set([...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family))],
      rows: document.querySelectorAll('.vrow[data-key]').length, figs: document.querySelectorAll('article.fig').length, qs: document.querySelectorAll('article.q').length,
      imgs: document.images.length, broken: [...document.images].filter((i) => i.getAttribute('src') && !(i.naturalWidth > 0)).length,
      links: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).filter((x) => !x.startsWith('#')),
      wide: [...document.querySelectorAll('body *')].filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.right > document.documentElement.clientWidth + 1 && !el.closest('#lb'); }).slice(0, 8).map((el) => el.tagName + '.' + el.className + ' ' + Math.round(el.getBoundingClientRect().right)),
      viewH: (() => { const r = [...document.querySelectorAll('.views img')].map((i) => Math.round(i.getBoundingClientRect().height)); return [Math.min(...r), Math.max(...r)]; })(),
      porW: (() => { const r = [...document.querySelectorAll('.pics > figure.por img')].map((i) => Math.round(i.getBoundingClientRect().width)); return [Math.min(...r), Math.max(...r)]; })(),
      defaults: [...document.querySelectorAll('.vbtn[aria-pressed="true"]')].map((b) => b.closest('.vrow').dataset.key + '=' + b.dataset.v) }));
    const H = m.H, step = 2400;
    let i = 0;
    for (let y = 0; y < H; y += step) {
      await page.screenshot({ path: `${DIR}${tag}-${String(i).padStart(2, '0')}.png`, fullPage: true, clip: { x: 0, y, width: w, height: Math.min(step, H - y) } });
      i++;
    }
    m.slices = i;
    // picks: a creature, a god with a note, a question changed, a default cleared, the general note
    await page.click('.vrow[data-key="f:fireSprite"] .vbtn[data-v="Keep"]');
    await page.click('.vrow[data-key="f:oakheart"] .vbtn[data-v="Redo"]');
    await page.fill('.vrow[data-key="f:oakheart"] input', 'taller, like the portrait');
    await page.click('.vrow[data-key="g:titan"] .vbtn[data-v="Keep"]');
    await page.click('.vrow[data-key="q:hornetPortrait"] .vbtn[data-v="A"]');
    await page.click('.vrow[data-key="q:longBodies"] .vbtn[data-v="Keep"]'); // clears the pre-selected default
    await page.fill('#general', 'show me the animation next');
    const v1 = await snap(page);
    await page.reload({ waitUntil: 'load' });
    const v2 = await snap(page);
    out[tag] = { m, errors, v1, reload: { lineSame: v1.line === v2.line, pressedSame: JSON.stringify(v1.pressed) === JSON.stringify(v2.pressed), notesSame: JSON.stringify(v1.notes) === JSON.stringify(v2.notes), generalSame: v1.general === v2.general, clearedStaysCleared: !v2.pressed.includes('q:longBodies=Keep') } };
    // close-ups for review
    await eager(page);
    for (const [sel, name] of [['#verdict', 'verdict'], ['#f-wolfRider', 'wolfrider'], ['#f-hornetSwarm', 'hornet'], ['#g-greatWyrm', 'greatwyrm'], ['#q-departures', 'q-departures'], ['#q-godSize', 'q-godsize']]) {
      await page.locator(sel).scrollIntoViewIfNeeded();
      await page.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'start' }), sel);
      await page.screenshot({ path: `${DIR}${tag}-${name}.png` });
    }
    await page.locator('#f-oakheart .pics img.z').first().click();
    await page.waitForTimeout(250);
    await page.screenshot({ path: `${DIR}${tag}-lightbox.png` });
    await page.keyboard.press('Escape');
    await ctx.close();
  }
  // storage blocked: picks, the line, the gallery and copy still work, no page errors
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    await page.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } }); });
    await page.goto('file://' + PAGE, { waitUntil: 'load' });
    const before = await snap(page);
    await page.click('.vrow[data-key="f:wolf"] .vbtn[data-v="Keep"]');
    await page.click('.vrow[data-key="q:wolfFront"] .vbtn[data-v="Kept test"]');
    await page.fill('.vrow[data-key="g:primordial"] input', 'fine');
    const after = await snap(page);
    await page.locator('#f-wolf .zb').focus(); await page.keyboard.press('Enter');
    const lbOpen = await page.evaluate(() => document.getElementById('lb').classList.contains('show'));
    await page.keyboard.press('Escape');
    await page.click('#copy'); await page.waitForTimeout(150);
    out.blocked = { defaultsShown: before.pressed.length, line: after.line, stored: after.stored, lbOpen, copyLabel: await page.textContent('#copy'), errors };
    await ctx.close();
  }
  fs.writeFileSync(ROOT + 'review-build/a11y-out/shoot.json', JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
