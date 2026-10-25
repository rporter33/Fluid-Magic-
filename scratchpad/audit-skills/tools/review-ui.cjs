// Read-only UI checks on a snapshot of units/stage-b/review.html. Usage: node review-ui.cjs <out.json>
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs'), path = require('path');
const SNAP = path.join(__dirname, '..', 'snap', 'units', 'stage-b', 'review.html');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const out = {};
  for (const [name, vp, mobile] of [['w390', { width: 390, height: 844 }, true], ['w1440', { width: 1440, height: 900 }, false]]) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: mobile ? 3 : 1, hasTouch: mobile, isMobile: mobile });
    const page = await ctx.newPage();
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    await page.goto('file://' + SNAP, { waitUntil: 'load', timeout: 120000 });
    await page.waitForTimeout(500);
    const r = await page.evaluate(() => {
      const sel = 'button, a[href], input, select, textarea, summary, [tabindex]:not([tabindex="-1"]), [role="button"]';
      const all = [...document.querySelectorAll(sel)].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 && getComputedStyle(e).visibility !== 'hidden' && !e.closest('#lb'); });
      const desc = (e) => e.tagName.toLowerCase() + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : '') + (e.getAttribute('role') ? `[role=${e.getAttribute('role')}]` : '');
      const m = new Map();
      for (const e of all) { const b = e.getBoundingClientRect(); const k = desc(e); const v = m.get(k) || { n: 0, minH: 1e9, minW: 1e9, maxH: 0 }; v.n++; v.minH = Math.min(v.minH, Math.round(b.height)); v.minW = Math.min(v.minW, Math.round(b.width)); v.maxH = Math.max(v.maxH, Math.round(b.height)); m.set(k, v); }
      const groups = [...m.entries()].map(([k, v]) => ({ sel: k, ...v })).sort((a, b) => b.n - a.n);
      const tabStops = all.filter((e) => e.tabIndex >= 0).length;
      const imgStops = all.filter((e) => e.tagName === 'IMG').length;
      const firstVerdictIdx = all.findIndex((e) => e.closest('.verdict'));
      const flaw = getComputedStyle(document.querySelector('ul.stat li.flaw') || document.body, '::before');
      const ok = getComputedStyle(document.querySelector('ul.stat li:not(.flaw)') || document.body, '::before');
      const vb = document.querySelector('.vbtn'); const vbr = vb.getBoundingClientRect();
      const lbBtn = getComputedStyle(document.querySelector('#lb button'));
      return { tabStops, imgStops, verdictFirstStop: firstVerdictIdx, groups: groups.slice(0, 16), statMarker: { ok: ok.content + ' ' + ok.backgroundColor, flaw: flaw.content + ' ' + flaw.backgroundColor },
        vbtn: [Math.round(vbr.width), Math.round(vbr.height)], lbButtonTop: lbBtn.top, docScrollW: document.documentElement.scrollWidth, vw: innerWidth };
    });
    // lightbox: open from the first zoomable picture, then Tab: does focus stay in the dialog?
    await page.evaluate(() => { const im = document.querySelector('img.z'); im.scrollIntoView(); im.focus(); });
    await page.keyboard.press('Enter'); await page.waitForTimeout(150);
    const lb = { open: await page.evaluate(() => document.getElementById('lb').classList.contains('show')), focus: await page.evaluate(() => document.activeElement.closest('#lb') ? 'inside' : 'outside') };
    let outside = 0; for (let k = 0; k < 5; k++) { await page.keyboard.press('Tab'); if (await page.evaluate(() => !document.activeElement.closest('#lb'))) outside++; }
    lb.tabsOutsideOf5 = outside;
    await page.keyboard.press('Escape'); await page.waitForTimeout(100);
    lb.closed = await page.evaluate(() => !document.getElementById('lb').classList.contains('show'));
    r.lightbox = lb;
    // focus ring vs hover on a pick button
    r.focusVsHover = await page.evaluate(() => { const b = document.querySelector('.vbtn'); b.focus(); const f = getComputedStyle(b); return { focusOutline: f.outlineStyle + ' ' + f.outlineWidth + ' ' + f.outlineColor }; });
    out[name] = r;
    await ctx.close();
  }
  fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
