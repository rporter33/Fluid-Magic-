// Shoots ../pilot-review.html full page at 1440 and 390 wide (Playwright), checks for page errors, outside loads and
// horizontal overflow, exercises the verdict form, and slices the long shots for viewing.
// Usage: node review_page_shoot.cjs OUTDIR
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');
const fs = require('fs');
const PAGE = path.resolve(__dirname, '..', 'pilot-review.html');
(async () => {
  const out = process.argv[2];
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const report = {};
  for (const [name, w, h, dpr] of [['desk', 1440, 900, 1], ['phone', 390, 844, 2]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, permissions: ['clipboard-read', 'clipboard-write'] });
    const page = await ctx.newPage();
    const errors = [], loads = [];
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
    page.on('request', (r) => { const u = r.url(); if (!u.startsWith('file:') && !u.startsWith('data:')) loads.push(u); });
    await page.goto('file://' + PAGE, { waitUntil: 'networkidle', timeout: 120000 });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => Promise.all([...document.images].filter((i) => i.src).map((i) => i.decode().catch(() => null))));
    const m = await page.evaluate(() => {
      const de = document.documentElement;
      const wide = [];
      for (const el of document.querySelectorAll('body *')) { const r = el.getBoundingClientRect(); if (r.right > window.innerWidth + 0.5 && r.width > 0) wide.push(el.tagName + '.' + el.className + ' ' + Math.round(r.right)); }
      const broken = [...document.images].filter((i) => i.closest('#lb') === null).filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.alt);
      return { scrollW: de.scrollWidth, innerW: window.innerWidth, height: de.scrollHeight, wide: wide.slice(0, 10), images: document.images.length, broken,
        fonts: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family + ' ' + f.weight) };
    });
    await page.screenshot({ path: path.join(out, `${name}-full.png`), fullPage: true });
    // the form: pick Keep on the first piece, Change with a note on the second, Go, a note, copy
    await page.click('#p-near .vbtn[data-v="Keep"]');
    await page.click('#p-far .vbtn[data-v="Change"]');
    await page.fill('#p-far .vrow input', 'more orange on the helm');
    await page.click('#overall .vbtn[data-v="Go"]');
    await page.fill('#general', 'looks great\nnext please');
    await page.click('#copy');
    await page.waitForTimeout(300);
    const copied = await page.evaluate(async () => { try { return await navigator.clipboard.readText(); } catch (e) { return 'read failed: ' + e.message; } });
    const btn = await page.textContent('#copy');
    await page.reload({ waitUntil: 'networkidle' });
    const persisted = await page.evaluate(() => document.getElementById('summary').textContent);
    await page.locator('#verdict').screenshot({ path: path.join(out, `${name}-verdict.png`) });
    // lightbox
    await page.click('#p-sal figure img');
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(out, `${name}-lightbox.png`) });
    const lbOpen = await page.evaluate(() => document.getElementById('lb').classList.contains('show'));
    await page.keyboard.press('Escape');
    // clear stored picks so the owner starts clean
    await page.evaluate(() => { try { localStorage.clear(); } catch { /* */ } });
    report[name] = { ...m, errors, loads, copied, btn, persisted, lbOpen };
    await ctx.close();
  }
  console.log(JSON.stringify(report, null, 1));
  await browser.close();
})();
