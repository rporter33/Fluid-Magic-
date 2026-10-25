// Keyboard and accessibility pass on the stage C review page. Usage: node a11y_check.cjs <page.html> <out.json>
// A real Tab walk from the top; the skip link; a pick made with the keyboard (Space and Enter) and read back; the
// lightbox opened from a "View full size" button (focus moves in, Tab stays in, arrows step, Escape closes, focus comes
// back); 44 px targets on the phone; state glyphs on ok/flaw notes and pressed picks; sideways scroll.
// The checks follow the stage B page's a11y_check.cjs (stage-b/review-build), adapted to this page's markup.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const path = require('path');
const PAGE = path.resolve(process.argv[2]), OUT = path.resolve(process.argv[3]);
const DESC = `(e) => { if (!e || e === document.body) return 'body'; const c = typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\\s+/).slice(0, 2).join('.') : '';
  const row = e.closest('.vrow'); return e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + c + (row ? '@' + row.dataset.key : '') + (e.dataset && e.dataset.v ? '=' + e.dataset.v : ''); }`;
const active = (page) => page.evaluate(`(${DESC})(document.activeElement)`);

async function tabWalk(page, max) {
  await page.reload({ waitUntil: 'load' });
  const seq = [];
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab');
    const d = await page.evaluate(`(() => { const e = document.activeElement; if (!e || e === document.body) return 'body'; if (e.dataset.walked) return 'CYCLE'; e.dataset.walked = '1';
      return (${DESC})(e) + ' "' + (e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 28) + '"'; })()`);
    if (d === 'body' || d === 'CYCLE') break;
    seq.push(d);
  }
  await page.evaluate(() => { for (const e of document.querySelectorAll('[data-walked]')) delete e.dataset.walked; });
  return { stops: seq.length, first: seq[0], imgStops: seq.filter((s) => s.startsWith('img')).length, zbStops: seq.filter((s) => s.startsWith('button.zb')).length,
    pickStops: seq.filter((s) => s.startsWith('button.vbtn')).length, last: seq.slice(-3), head: seq.slice(0, 14) };
}

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const out = { page: PAGE };
  for (const [tag, vp, mobile] of [['w390', { width: 390, height: 844 }, true], ['w1440', { width: 1440, height: 900 }, false]]) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, hasTouch: mobile, isMobile: mobile });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    await page.goto('file://' + PAGE, { waitUntil: 'load', timeout: 120000 });
    await page.evaluate(() => { try { localStorage.clear(); } catch { /* blocked */ } });
    const r = { errors };
    r.walk = await tabWalk(page, 400);
    // skip link: the first Tab shows it, Enter lands on the verdict, a few Tabs reach Copy verdict
    {
      await page.reload({ waitUntil: 'load' });
      await page.keyboard.press('Tab');
      const skip = { first: await active(page) };
      skip.visible = await page.evaluate(() => { const b = document.activeElement.getBoundingClientRect(); return [Math.round(b.width), Math.round(b.height), Math.round(b.top)]; });
      await page.keyboard.press('Enter'); await page.waitForTimeout(200);
      skip.after = await active(page);
      skip.verdictTop = await page.evaluate(() => Math.round(document.getElementById('verdict').getBoundingClientRect().top));
      let n = 0, d = '';
      for (; n < 30; ) { await page.keyboard.press('Tab'); n++; d = await active(page); if (d.includes('#copy')) break; }
      skip.tabsToCopy = d.includes('#copy') ? n : null;
      r.skip = skip;
    }
    // a pick by keyboard: Tab to the Fire Sprite's Keep from its View button, Space presses it, Enter on Redo moves it
    {
      await page.reload({ waitUntil: 'load' });
      await page.focus('#f-fireSprite .zb');
      const seq = [];
      for (let i = 0; i < 3; i++) { await page.keyboard.press('Tab'); seq.push(await active(page)); }
      const keep = seq.findIndex((s) => s.includes('@f:fireSprite=Keep'));
      await page.focus('#f-fireSprite .vbtn[data-v="Keep"]');
      await page.keyboard.press('Space'); await page.waitForTimeout(50);
      const p1 = await page.evaluate(() => [...document.querySelectorAll('#f-fireSprite .vbtn')].map((b) => b.dataset.v + ':' + b.getAttribute('aria-pressed')));
      const glyph = await page.evaluate(() => getComputedStyle(document.querySelector('#f-fireSprite .vbtn[aria-pressed="true"]'), '::before').content);
      await page.keyboard.press('Tab'); await page.keyboard.press('Enter'); await page.waitForTimeout(50);
      const p2 = await page.evaluate(() => [...document.querySelectorAll('#f-fireSprite .vbtn')].map((b) => b.dataset.v + ':' + b.getAttribute('aria-pressed')));
      await page.keyboard.press('Enter'); await page.waitForTimeout(50); // pressing the picked answer again clears it
      const p3 = await page.evaluate(() => [...document.querySelectorAll('#f-fireSprite .vbtn')].map((b) => b.dataset.v + ':' + b.getAttribute('aria-pressed')));
      // a question: the suggested answer is pressed on load and named as recommended
      const q = await page.evaluate(() => { const b = document.querySelector('.vrow[data-key="q:wolfSize"] .vbtn[aria-pressed="true"]'); return b ? b.textContent.trim() : null; });
      r.pick = { tabOrderAfterView: seq, keepReachedByTab: keep >= 0, afterSpace: p1, pressedGlyph: glyph, afterEnterOnRedo: p2, afterEnterAgain: p3, questionDefault: q,
        line: await page.evaluate(() => document.getElementById('summary').textContent.slice(0, 120)) };
    }
    // lightbox from the keyboard
    {
      await page.reload({ waitUntil: 'load' });
      await page.evaluate(() => { const e = document.querySelector('#g-titan .zb'); e.scrollIntoView({ block: 'center' }); e.focus(); });
      const opener = await active(page);
      const zbBox = await page.evaluate(() => { const b = document.activeElement.getBoundingClientRect(); return [Math.round(b.width), Math.round(b.height)]; });
      await page.keyboard.press('Enter'); await page.waitForTimeout(150);
      const lb = { opener, zbBox, open: await page.evaluate(() => document.getElementById('lb').classList.contains('show')),
        focusOnOpen: await page.evaluate(`(${DESC})(document.activeElement) + (document.activeElement.closest('#lb') ? ' (inside)' : ' (outside)')`) };
      const cap0 = await page.textContent('#lb .lbcap');
      let outside = 0; const seen = [];
      for (let k = 0; k < 8; k++) { await page.keyboard.press(k % 3 === 2 ? 'Shift+Tab' : 'Tab'); const d = await page.evaluate(`(document.activeElement.closest('#lb') ? '' : 'OUT ') + (${DESC})(document.activeElement)`); seen.push(d); if (d.startsWith('OUT')) outside++; }
      lb.tabsOutsideOf8 = outside; lb.tabSeen = [...new Set(seen)];
      await page.keyboard.press('ArrowRight'); await page.waitForTimeout(80);
      const cap1 = await page.textContent('#lb .lbcap');
      lb.captions = [cap0, cap1]; lb.arrowSteps = cap0 !== cap1;
      lb.inert = await page.evaluate(() => document.querySelector('.wrap').inert === true);
      lb.buttons = await page.evaluate(() => [...document.querySelectorAll('#lb button')].filter((b) => b.offsetParent).map((b) => { const q = b.getBoundingClientRect(); return [b.className, Math.round(q.width), Math.round(q.height)]; }));
      await page.keyboard.press('Escape'); await page.waitForTimeout(100);
      lb.closedOnEscape = await page.evaluate(() => !document.getElementById('lb').classList.contains('show'));
      lb.focusAfter = await active(page);
      lb.focusReturned = lb.focusAfter === opener;
      lb.inertAfter = await page.evaluate(() => document.querySelector('.wrap').inert === true);
      r.lightbox = lb;
    }
    // target sizes (hidden-until-focus controls measured while focused)
    r.targets = await page.evaluate(() => {
      const m = new Map();
      for (const e of document.querySelectorAll('button, a[href], input, textarea')) {
        if (e.closest('#lb')) continue;
        let b = e.getBoundingClientRect();
        if (b.width <= 2 || b.height <= 2) { e.focus(); b = e.getBoundingClientRect(); e.blur(); }
        if (!(b.width > 0 && b.height > 0)) continue;
        const k = e.tagName.toLowerCase() + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/)[0] : '') + (e.closest('nav.toc') ? ' (toc)' : e.closest('.answers') ? ' (answers)' : e.closest('.links') ? ' (links)' : '');
        const v = m.get(k) || { n: 0, minH: 1e9, minW: 1e9 }; v.n++; v.minH = Math.min(v.minH, Math.round(b.height)); v.minW = Math.min(v.minW, Math.round(b.width)); m.set(k, v);
      }
      return [...m.entries()].map(([k, v]) => ({ sel: k, ...v })).sort((a, b) => a.minH - b.minH);
    });
    // state not by colour alone
    r.markers = await page.evaluate(() => {
      const pe = (el, p) => getComputedStyle(el, p).content;
      return { ok: pe(document.querySelector('ul.stat li.ok'), '::before'), flaw: pe(document.querySelector('ul.stat li.flaw'), '::before'),
        okHidden: document.querySelector('ul.stat li.ok .sr').textContent, flawHidden: document.querySelector('ul.stat li.flaw .sr').textContent,
        recommendedTags: document.querySelectorAll('.vbtn .rtag').length, defaultsPressed: document.querySelectorAll('.vbtn[aria-pressed="true"]').length };
    });
    r.scroll = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    r.focusables = await page.evaluate(() => ({ imgTabbable: [...document.querySelectorAll('img')].filter((i) => i.tabIndex >= 0).length, imgs: document.querySelectorAll('img.z').length,
      zb: document.querySelectorAll('.zb').length, groupsWithoutZb: [...document.querySelectorAll('[data-zg]')].filter((g) => !g.querySelector('.zb')).length,
      imgsOutsideGroups: [...document.querySelectorAll('img.z')].filter((i) => !i.closest('[data-zg]')).length, missingAlt: [...document.querySelectorAll('img.z')].filter((i) => !i.alt).length }));
    out[tag] = r;
    await ctx.close();
  }
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
