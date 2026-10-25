// The a11y rebuild must keep working exactly as before for the owner. Usage: node compat_check.cjs <old.html> <new.html>
// Same storage key and verdict line; old saved picks load; same visible text; works with storage blocked; mouse paths.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const [OLD, NEW] = process.argv.slice(2);
const KEY = 'fm-stage-b-review-v1';
const out = {};
const act = async (page) => { // the owner's kind of session: picks, a toggle-off, notes, the general note
  await page.click('.vrow[data-key="p:fireSprite"] .vbtn[data-v="B"]');
  await page.click('.vrow[data-key="p:titan"] .vbtn[data-v="A"]');
  await page.click('.vrow[data-key="p:titan"] .vbtn[data-v="A"]'); // toggles off
  await page.click('.vrow[data-key="p:elderWyrm"] .vbtn[data-v="Redo"]');
  await page.fill('.vrow[data-key="p:elderWyrm"] input', 'lower, longer tail; "quotes" & ampersand');
  await page.click('.vrow[data-key="troops"] .vbtn[data-v="Change"]');
  await page.fill('.vrow[data-key="troops"] input', 'more variety');
  await page.click('.vrow[data-key="c:wardenCaptain"] .vbtn[data-v="Keep"]');
  await page.fill('.vrow[data-key="c:pyrePriest"] input', 'note only, no pick');
  await page.click('.vrow[data-key="mounts"] .vbtn[data-v="Now"]');
  await page.fill('#general', 'two\nlines');
};
const snap = (page) => page.evaluate((K) => ({ line: document.getElementById('summary').textContent, count: document.getElementById('count').textContent,
  pressed: [...document.querySelectorAll('.vbtn[aria-pressed="true"]')].map((b) => b.closest('.vrow').dataset.key + '=' + b.dataset.v),
  notes: [...document.querySelectorAll('.vrow input')].filter((i) => i.value).map((i) => i.closest('.vrow').dataset.key + '=' + i.value), general: document.getElementById('general').value,
  answers: [...document.querySelectorAll('#answers > div')].map((d) => d.textContent), stored: (() => { try { return localStorage.getItem(K); } catch (e) { return 'ERR'; } })() }), KEY);
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const errors = [];
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  // 1. the same session on the old and on the new page gives the same line and the same stored JSON
  await page.goto('file://' + OLD, { waitUntil: 'load' }); await page.evaluate(() => localStorage.clear()); await page.reload({ waitUntil: 'load' });
  await act(page); const a = await snap(page);
  await page.goto('file://' + NEW, { waitUntil: 'load' });
  const loadedFromOld = await snap(page); // 2. what the old page saved, loaded by the new one
  await page.evaluate(() => localStorage.clear()); await page.reload({ waitUntil: 'load' });
  await act(page); const b = await snap(page);
  out.sameSession = { lineEqual: a.line === b.line, storedEqual: a.stored === b.stored, pressedEqual: JSON.stringify(a.pressed) === JSON.stringify(b.pressed), answersEqual: JSON.stringify(a.answers) === JSON.stringify(b.answers), line: b.line };
  out.oldSavedLoads = { lineEqual: loadedFromOld.line === a.line, pressedEqual: JSON.stringify(loadedFromOld.pressed) === JSON.stringify(a.pressed), notesEqual: JSON.stringify(loadedFromOld.notes) === JSON.stringify(a.notes), generalEqual: loadedFromOld.general === a.general };
  // 3. reload keeps picks and notes
  await page.reload({ waitUntil: 'load' }); const c = await snap(page);
  out.reload = { lineEqual: c.line === b.line, pressedEqual: JSON.stringify(c.pressed) === JSON.stringify(b.pressed), notesEqual: JSON.stringify(c.notes) === JSON.stringify(b.notes), general: c.general === b.general };
  // 4. an earlier page's state: picks only (the description-only version), plus an unknown key it may have left
  await page.evaluate((K) => localStorage.setItem(K, JSON.stringify({ picks: { 'p:wolf': 'A', 'p:oracle': 'Redo', 'p:goneSubject': 'B', 'c:ashChieftain': 'Keep' } })), KEY);
  await page.reload({ waitUntil: 'load' });
  out.earlierState = await snap(page);
  delete out.earlierState.stored;
  // 5. visible text is the same (the new buttons are hidden until focused and named in aria-label)
  const text = async (f) => { await page.goto('file://' + f, { waitUntil: 'load' }); await page.evaluate(() => localStorage.clear()); await page.reload({ waitUntil: 'load' });
    return page.evaluate(() => { const c = document.querySelector('.wrap').cloneNode(true); for (const e of c.querySelectorAll('.zb, .skip')) e.remove(); return c.textContent.replace(/\s+/g, ' ').trim(); }); };
  const ta = await text(OLD), tb = await text(NEW);
  out.visibleText = { equal: ta === tb, oldLen: ta.length, newLen: tb.length };
  // 6. mouse and touch paths on the new page: tap a picture, step with the buttons, close by tapping
  await page.locator('#p-titan .cand img').first().scrollIntoViewIfNeeded();
  await page.locator('#p-titan .cand img').first().click();
  const m = { opened: await page.evaluate(() => document.querySelector('#lb').classList.contains('show')), cap: await page.textContent('#lb .lbcap') };
  await page.click('#lb .lbn'); m.afterNext = await page.textContent('#lb .lbcap'); m.stillOpen = await page.evaluate(() => document.querySelector('#lb').classList.contains('show'));
  await page.click('#lb .lbp'); m.afterPrev = await page.textContent('#lb .lbcap');
  await page.mouse.click(195, 820); // the backdrop
  m.closedByBackdrop = await page.evaluate(() => !document.querySelector('#lb').classList.contains('show'));
  m.focusBackOn = await page.evaluate(() => document.activeElement.tagName + '.' + document.activeElement.className);
  await page.locator('.troop .cardf img').first().click(); m.cardDark = await page.evaluate(() => document.querySelector('#lb').classList.contains('dark'));
  await page.click('#lb .lbx'); m.closedByClose = await page.evaluate(() => !document.querySelector('#lb').classList.contains('show'));
  // a single picture: no step buttons
  await page.locator('#p-fireSprite .zb').focus(); await page.keyboard.press('Enter'); m.zbFirst = await page.textContent('#lb .lbcap'); await page.keyboard.press('Escape');
  out.mouse = m;
  // 7. the answers recap: one Tab stop, arrows move, Tab leaves to the notes, then Copy verdict
  await page.click('.vrow[data-key="p:wolf"] .vbtn[data-v="A"]');
  await page.focus('#answers a');
  const r = { first: await page.evaluate(() => document.activeElement.textContent) };
  await page.keyboard.press('ArrowDown'); r.down = await page.evaluate(() => document.activeElement.textContent);
  await page.keyboard.press('End'); r.end = await page.evaluate(() => document.activeElement.textContent);
  await page.keyboard.press('Tab'); r.tab1 = await page.evaluate(() => document.activeElement.id);
  await page.keyboard.press('Tab'); r.tab2 = await page.evaluate(() => document.activeElement.id);
  await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Shift+Tab'); r.backTo = await page.evaluate(() => document.activeElement.textContent);
  r.tabStopsInAnswers = await page.evaluate(() => [...document.querySelectorAll('#answers a')].filter((a) => a.tabIndex === 0).length);
  await page.keyboard.press('Enter'); await page.waitForTimeout(200); r.enterFollows = await page.evaluate(() => location.hash);
  out.answers = r;
  out.errors = [...errors];
  await ctx.close();
  // 8. storage blocked: picks, notes, the line, copy and the gallery still work, with no page errors
  {
    const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const p = await ctx2.newPage(); const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    await p.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } }); });
    await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    await p.goto('file://' + NEW, { waitUntil: 'load' });
    await act(p);
    const s = await snap(p);
    await p.locator('#p-fireSprite .zb').focus(); await p.keyboard.press('Enter');
    const lbOpen = await p.evaluate(() => document.querySelector('#lb').classList.contains('show'));
    await p.keyboard.press('Escape');
    await p.click('#copy'); await p.waitForTimeout(200);
    out.blocked = { lineEqual: s.line === b.line, stored: s.stored, lbOpen, copyLabel: await p.textContent('#copy'), errors: errs };
    await ctx2.close();
  }
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
