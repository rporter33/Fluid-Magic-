// Smoke test and shots of the pilot review page: node pilot_smoke.cjs PAGE OUTDIR
// Plays each player, steps frames, switches zoom and clip, drives it from the keyboard, answers the verdict and reads
// the copied line; shoots the page at desktop and phone widths. Reports page errors and what each step saw.
const fs = require('fs'), path = require('path');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const [PAGE, OUT] = process.argv.slice(2);
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
  const res = { steps: [], errors: [] };
  for (const [tag, vp] of [['desktop', { width: 1440, height: 900 }], ['phone', { width: 390, height: 844 }]]) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, hasTouch: tag === 'phone', isMobile: tag === 'phone' });
    await ctx.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
    const page = await ctx.newPage();
    page.on('pageerror', (e) => res.errors.push(tag + ' pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g/.test(m.text())) res.errors.push(tag + ' console: ' + m.text()); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    await page.route(/cdn\.jsdelivr\.net\/npm\/pixi\.js@8\.22\.0\/dist\/pixi\.min\.js/, (r) => r.fulfill({ path: '/home/user/Fluid-Magic-/node_modules/pixi.js/dist/pixi.min.js', contentType: 'application/javascript' }));
    await page.goto('file://' + PAGE, { waitUntil: 'load', timeout: 120000 });
    await page.waitForTimeout(1500);
    const ov = await page.evaluate(() => ({ scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth }));
    res.steps.push({ tag, overflow: ov });
    await page.screenshot({ path: path.join(OUT, `${tag}-top.png`) });
    if (tag === 'desktop') {
      for (const spell of ['fireball', 'entangle']) {
        const P = `.player[data-spell="${spell}"]`;
        await page.locator(P).scrollIntoViewIfNeeded();
        const s0 = await page.evaluate((P) => { const v = document.querySelector(P + ' video'); return { ready: v.readyState, dur: v.duration, src: v.currentSrc.slice(0, 20), canVP9: v.canPlayType('video/webm; codecs="vp9"') }; }, P);
        await page.click(P + ' .pp'); await page.waitForTimeout(1200);
        const s1 = await page.evaluate((P) => { const v = document.querySelector(P + ' video'); return { t: v.currentTime, paused: v.paused, beat: document.querySelector(P + ' .bt').textContent, tm: document.querySelector(P + ' .tm').textContent }; }, P);
        await page.click(P + ' .pp');
        await page.click(P + ' .ffw'); await page.click(P + ' .ffw'); await page.waitForTimeout(300);
        const s2 = await page.evaluate((P) => { const v = document.querySelector(P + ' video'); return { t: +v.currentTime.toFixed(4), zm: document.querySelector(P + ' .zm').textContent }; }, P);
        await page.click(P + ' [data-zoom="2"]'); await page.waitForTimeout(1200);
        const s3 = await page.evaluate((P) => { const v = document.querySelector(P + ' video'); return { t: +v.currentTime.toFixed(4), zm: document.querySelector(P + ' .zm').textContent }; }, P);
        // the storyboard: go to the impact beat
        await page.click(`${P} .board li:nth-child(4) button`); await page.waitForTimeout(700);
        const s4 = await page.evaluate((P) => ({ cur: [...document.querySelectorAll(P + ' .board button')].findIndex((b) => b.getAttribute('aria-current') === 'step'), beat: document.querySelector(P + ' .bt').textContent, tm: document.querySelector(P + ' .tm').textContent }), P);
        await page.screenshot({ path: path.join(OUT, `desktop-${spell}-impact-2x.png`) });
        // keyboard: focus the player, Space plays, comma steps back, 4 sets 0.25x, Z the zoom
        await page.focus(P); await page.keyboard.press('4'); await page.keyboard.press(' '); await page.waitForTimeout(800); await page.keyboard.press(' ');
        const s5 = await page.evaluate((P) => { const v = document.querySelector(P + ' video'); return { rate: v.playbackRate, paused: v.paused, slow: document.querySelector(P + ' [data-rate="0.25"]').getAttribute('aria-pressed') }; }, P);
        await page.keyboard.press('z'); await page.waitForTimeout(800);
        const s6 = await page.evaluate((P) => document.querySelector(P + ' [data-zoom="1"]').getAttribute('aria-pressed'), P);
        await page.click(`${P} .cliptabs .seg:nth-child(2)`); await page.waitForTimeout(1200);
        const s7 = await page.evaluate((P) => ({ label: document.querySelector(P + ' .cliptabs [aria-pressed="true"]').textContent, beats: document.querySelectorAll(P + ' .board li').length, note: document.querySelector(P + ' .cnote').textContent }), P);
        await page.click(P + ' .pp'); await page.waitForTimeout(1500); await page.click(P + ' .pp');
        await page.screenshot({ path: path.join(OUT, `desktop-${spell}-clip2.png`) });
        res.steps.push({ spell, s0, s1, s2, s3, s4, s5, s6, s7 });
      }
      // the gallery: live, its toggles, frame steps
      await page.locator('#gallery').scrollIntoViewIfNeeded();
      await page.waitForFunction(() => typeof GALLERY !== 'undefined' && GALLERY.S.ready, null, { timeout: 120000 });
      await page.click('#gPlay'); await page.waitForTimeout(1500);
      const g0 = await page.evaluate(() => ({ t: GALLERY.S.t, playing: GALLERY.S.playing }));
      await page.click('#gPlay');
      for (const k of ['hidden', 'grey', 'short']) { await page.click(`[data-gt="${k}"]`); await page.waitForTimeout(300); }
      const g1 = await page.evaluate(() => ({ S: Object.assign({}, GALLERY.S), pressed: [...document.querySelectorAll('[data-gt]')].map((b) => b.dataset.gt + ':' + b.getAttribute('aria-pressed')), filter: document.querySelector('.gcanvas canvas').style.filter }));
      await page.click('#gFwd'); await page.click('#gFwd');
      await page.locator('#gallery').screenshot({ path: path.join(OUT, 'desktop-gallery-tests.png') });
      for (const k of ['hidden', 'grey', 'short']) await page.click(`[data-gt="${k}"]`);
      await page.evaluate(() => { GALLERY.S.t = 1.36; GALLERY.render(); });
      await page.locator('#gallery').screenshot({ path: path.join(OUT, 'desktop-gallery.png') });
      res.steps.push({ gallery: { g0, g1 } });
      // the verdict
      await page.click('.vrow[data-key="s:fireball"] .vbtn[data-v="Keep"]');
      await page.click('.vrow[data-key="s:entangle"] .vbtn[data-v="Redo"]');
      await page.fill('.vrow[data-key="s:entangle"] input', 'roots too small at play zoom');
      await page.click('.vrow[data-key="q:fb-time"] .vbtn[data-v="Right"]');
      await page.click('#copy'); await page.waitForTimeout(300);
      const line = await page.evaluate(() => document.getElementById('summary').textContent);
      const clip = await page.evaluate(() => navigator.clipboard.readText().catch((e) => 'clipboard: ' + e.message));
      const stored = await page.evaluate(() => { try { return localStorage.getItem('fm-stage-d-pilot-v1'); } catch (e) { return 'blocked'; } });
      res.steps.push({ verdict: line, clipboard: clip, stored: stored && stored.slice(0, 200) });
      await page.locator('#verdict').scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(OUT, 'desktop-verdict.png') });
      await page.locator('#sheets').scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(OUT, 'desktop-sheets.png') });
      await page.screenshot({ path: path.join(OUT, 'desktop-full.png'), fullPage: true });
    } else {
      await page.locator('.player[data-spell="fireball"]').scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(OUT, 'phone-fireball.png') });
      const small = await page.evaluate(() => [...document.querySelectorAll('button, a, input, summary')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.height < 44 || r.width < 44); }).map((e) => (e.className || e.tagName) + ':' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height)).slice(0, 12));
      res.steps.push({ phoneSmallTargets: small });
    }
    await ctx.close();
  }
  fs.writeFileSync(path.join(OUT, 'smoke.json'), JSON.stringify(res, null, 1));
  console.log(JSON.stringify(res, null, 1).slice(0, 6000));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
