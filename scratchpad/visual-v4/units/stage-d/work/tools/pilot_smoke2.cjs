// Smoke test and shots of the pilot review page after the art director's fixes: node pilot_smoke2.cjs PAGE OUTDIR
// Desktop 1440 x 900: each player (play, frame steps with the readout against the frame on screen, the 2x camera, clip
// tabs, the magnifier, the keyboard), the gallery (side by side, toggles, steps), the questions' recommended answers
// (pre-selected, labelled, changed, cleared, kept over a reload) and the copied line. Phone 390 x 844: no sideways
// scroll, the player edge to edge on the 2x camera, the magnifier, the gallery stacked, touch targets. Reduced motion:
// nothing plays by itself. Page errors throughout.
const fs = require('fs'), path = require('path');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const PIXI = '/home/user/Fluid-Magic-/node_modules/pixi.js/dist/pixi.min.js';
(async () => {
  const [PAGE, OUT] = process.argv.slice(2);
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--autoplay-policy=no-user-gesture-required', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
  const res = { steps: [], errors: [] };
  const open = async (tag, vp, extra = {}) => {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, hasTouch: !!extra.touch, isMobile: !!extra.touch, reducedMotion: extra.rm || 'no-preference' });
    await ctx.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
    const page = await ctx.newPage();
    page.on('pageerror', (e) => res.errors.push(tag + ' pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g|ERR_FAILED|net::/.test(m.text())) res.errors.push(tag + ' console: ' + m.text()); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    await page.route(/cdn\.jsdelivr\.net\/npm\/pixi\.js@8\.22\.0\/dist\/pixi\.min\.js/, (r) => r.fulfill({ path: PIXI, contentType: 'application/javascript' }));
    await page.goto('file://' + PAGE, { waitUntil: 'load', timeout: 300000 });
    await page.waitForTimeout(1500);
    return { ctx, page };
  };
  const readout = (page, P) => page.evaluate((P) => { const v = document.querySelector(P + ' video'), z = document.querySelector(P + ' .zm').textContent, m = /frame (\d+) of/.exec(z);
    return { t: +v.currentTime.toFixed(4), shown: m ? +m[1] : null, fps: +/\((\d+) a second\)/.exec(z)[1], tm: document.querySelector(P + ' .tm').textContent, zm: z, beat: document.querySelector(P + ' .bt').textContent }; }, P);
  // ---------------------------------------------------------------- desktop
  {
    const { ctx, page } = await open('desktop', { width: 1440, height: 900 });
    res.steps.push({ tag: 'desktop', overflow: await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth) });
    await page.screenshot({ path: path.join(OUT, 'desktop-top.png') });
    for (const spell of ['fireball', 'entangle']) {
      const P = `.player[data-spell="${spell}"]`, st = { spell };
      await page.locator(P).scrollIntoViewIfNeeded();
      await page.click(P + ' .pp'); await page.waitForTimeout(1200); await page.click(P + ' .pp');
      st.played = await readout(page, P);
      // frame steps: the readout must name the frame on screen (critique fix 6: it lagged six frames)
      st.stepsOk = true; st.steps = [];
      for (let i = 0; i < 5; i++) {
        await page.click(P + ' .ffw'); await page.waitForTimeout(350);
        const r = await readout(page, P); st.steps.push([r.shown, Math.round(r.t * r.fps)]);
        if (Math.abs(r.shown - Math.round(r.t * r.fps)) > 1) st.stepsOk = false;
      }
      await page.click(P + ' [data-zoom="2"]'); await page.waitForTimeout(1200);
      st.zoom2 = await readout(page, P);
      await page.click(`${P} .board li:nth-child(4) button`); await page.waitForTimeout(700);
      st.impact = await readout(page, P);
      await page.screenshot({ path: path.join(OUT, `desktop-${spell}-impact-2x.png`) });
      await page.click(P + ' .magb'); await page.waitForTimeout(500);
      st.mag = await page.evaluate((P) => { const b = document.querySelector(P + ' .vbox'), v = b.querySelector('video'); return { on: b.classList.contains('mag'), videoW: v.getBoundingClientRect().width, boxW: b.getBoundingClientRect().width, hint: !b.querySelector('.maghint').hidden }; }, P);
      await page.screenshot({ path: path.join(OUT, `desktop-${spell}-magnified.png`) });
      await page.click(P + ' .magb');
      await page.focus(P); await page.keyboard.press('4'); await page.keyboard.press(' '); await page.waitForTimeout(800); await page.keyboard.press(' ');
      await page.keyboard.press('z'); await page.keyboard.press('m'); await page.waitForTimeout(400);
      st.keys = await page.evaluate((P) => ({ rate: document.querySelector(P + ' video').playbackRate, slow: document.querySelector(P + ' [data-rate="0.25"]').getAttribute('aria-pressed'), zoom1: document.querySelector(P + ' [data-zoom="1"]').getAttribute('aria-pressed'), mag: document.querySelector(P + ' .vbox').classList.contains('mag') }), P);
      await page.keyboard.press('m');
      const tabs = await page.evaluate((P) => [...document.querySelectorAll(P + ' .cliptabs .seg')].map((b) => b.textContent), P);
      st.tabs = tabs;
      await page.click(`${P} .cliptabs .seg:nth-child(2)`); await page.waitForTimeout(1200);
      st.clip2 = await page.evaluate((P) => ({ label: document.querySelector(P + ' .cliptabs [aria-pressed="true"]').textContent, beats: document.querySelectorAll(P + ' .board li').length, note: document.querySelector(P + ' .cnote').textContent }), P);
      await page.click(P + ' .pp'); await page.waitForTimeout(1500); await page.click(P + ' .pp');
      await page.screenshot({ path: path.join(OUT, `desktop-${spell}-clip2.png`) });
      res.steps.push(st);
    }
    // the gallery
    await page.locator('#gallery').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => typeof GALLERY !== 'undefined' && GALLERY.S.ready, null, { timeout: 180000 });
    await page.click('#gPlay'); await page.waitForTimeout(1500);
    const g0 = await page.evaluate(() => ({ t: GALLERY.S.t, playing: GALLERY.S.playing, scenes: GALLERY.scenes().map((s) => ({ spell: s.spell, x: s.root.x, y: s.root.y, z: +s.z.toFixed(2) })), canvas: [document.querySelector('.gcanvas canvas').width, document.querySelector('.gcanvas canvas').height] }));
    await page.click('#gPlay');
    await page.evaluate(() => { GALLERY.S.t = 1.42; GALLERY.render(); });
    await page.locator('#gallery').screenshot({ path: path.join(OUT, 'desktop-gallery.png') });
    for (const k of ['hidden', 'grey']) { await page.click(`[data-gt="${k}"]`); await page.waitForTimeout(300); }
    await page.locator('#gallery').screenshot({ path: path.join(OUT, 'desktop-gallery-hidden-grey.png') });
    for (const k of ['hidden', 'grey']) await page.click(`[data-gt="${k}"]`);
    await page.evaluate(() => { GALLERY.S.t = 2.1; GALLERY.render(); });
    await page.locator('#gallery').screenshot({ path: path.join(OUT, 'desktop-gallery-hold.png') });
    res.steps.push({ gallery: g0 });
    // the questions: recommended answers pre-selected and labelled; change one, clear one, reload
    const q0 = await page.evaluate(() => [...document.querySelectorAll('.vrow[data-key]')].map((r) => ({ key: r.dataset.key, rec: r.dataset.rec, pressed: (r.querySelector('.vbtn[aria-pressed="true"]') || {}).dataset?.v || '', label: !!r.querySelector('.vbtn .rec') })));
    await page.click('.vrow[data-key="q:light"] .vbtn[data-v="Subtler"]');
    await page.click('.vrow[data-key="q:flash"] .vclr');
    await page.fill('.vrow[data-key="s:entangle"] input', 'tendrils could be darker');
    await page.click('#copy'); await page.waitForTimeout(300);
    const line1 = await page.evaluate(() => document.getElementById('summary').textContent);
    const clip = await page.evaluate(() => navigator.clipboard.readText().catch((e) => 'clipboard: ' + e.message));
    await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(1500);
    const q1 = await page.evaluate(() => ({ light: (document.querySelector('.vrow[data-key="q:light"] .vbtn[aria-pressed="true"]') || {}).dataset?.v || '', flash: (document.querySelector('.vrow[data-key="q:flash"] .vbtn[aria-pressed="true"]') || {}).dataset?.v || '', glyph: (document.querySelector('.vrow[data-key="q:glyph"] .vbtn[aria-pressed="true"]') || {}).dataset?.v || '', count: document.getElementById('count').textContent, stored: (() => { try { return localStorage.getItem('fm-stage-d-pilot-v1'); } catch (e) { return 'blocked'; } })() }));
    res.steps.push({ questions: q0, afterChange: line1, clipboard: clip, afterReload: q1 });
    await page.locator('#questions').scrollIntoViewIfNeeded(); await page.screenshot({ path: path.join(OUT, 'desktop-questions.png') });
    await page.locator('#verdict').scrollIntoViewIfNeeded(); await page.screenshot({ path: path.join(OUT, 'desktop-verdict.png') });
    await page.locator('#sheets').scrollIntoViewIfNeeded(); await page.screenshot({ path: path.join(OUT, 'desktop-sheets.png') });
    await page.screenshot({ path: path.join(OUT, 'desktop-full.png'), fullPage: true });
    await ctx.close();
  }
  // ---------------------------------------------------------------- phone
  {
    const { ctx, page } = await open('phone', { width: 390, height: 844 }, { touch: true });
    const P = '.player[data-spell="fireball"]';
    const ph = await page.evaluate((P) => { const b = document.querySelector(P + ' .vbox').getBoundingClientRect(); return { overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, boxLeft: Math.round(b.left), boxW: Math.round(b.width), zoom2: document.querySelector(P + ' [data-zoom="2"]').getAttribute('aria-pressed'), src: document.querySelector(P + ' video').currentSrc.slice(0, 12) }; }, P);
    await page.screenshot({ path: path.join(OUT, 'phone-top.png') });
    await page.locator(P + ' .vbox').evaluate((e) => e.scrollIntoView({ block: 'start' }));
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, 'phone-fireball.png') });
    await page.tap(P + ' .magb'); await page.waitForTimeout(600);
    ph.mag = await page.evaluate((P) => { const b = document.querySelector(P + ' .vbox'); return { on: b.classList.contains('mag'), videoW: Math.round(b.querySelector('video').getBoundingClientRect().width), scroll: b.querySelector('.vscroll').scrollLeft, readout: document.querySelector(P + ' .zm').textContent }; }, P);
    await page.locator(P + ' .vbox').evaluate((e) => e.scrollIntoView({ block: 'start' }));
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, 'phone-fireball-magnified.png') });
    await page.locator('#gallery').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => typeof GALLERY !== 'undefined' && GALLERY.S.ready, null, { timeout: 180000 });
    await page.evaluate(() => { GALLERY.S.playing = false; GALLERY.S.t = 1.42; GALLERY.render(); document.querySelector('.glabels').scrollIntoView({ block: 'start' }); });
    await page.waitForTimeout(400);
    ph.gallery = await page.evaluate(() => { const g = document.querySelector('.glabels'), sp = [...g.children].map((e) => e.getBoundingClientRect()); return { scenes: GALLERY.scenes().map((s) => [s.root.x, s.root.y]), canvas: [document.querySelector('.gcanvas canvas').width, document.querySelector('.gcanvas canvas').height], canvasCss: Math.round(document.querySelector('.gcanvas canvas').getBoundingClientRect().width), labelsOverlap: sp.length > 1 && sp[0].right > sp[1].left && sp[0].bottom > sp[1].top }; });
    await page.screenshot({ path: path.join(OUT, 'phone-gallery.png') });
    await page.locator('#questions').scrollIntoViewIfNeeded(); await page.screenshot({ path: path.join(OUT, 'phone-questions.png') });
    ph.smallTargets = await page.evaluate(() => [...document.querySelectorAll('button, a, input, summary')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.height < 44 || r.width < 44); }).map((e) => (e.className || e.tagName) + ':' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height)).slice(0, 12));
    res.steps.push({ phone: ph });
    await ctx.close();
  }
  // ---------------------------------------------------------------- reduced motion
  {
    const { ctx, page } = await open('reduced', { width: 1280, height: 900 }, { rm: 'reduce' });
    await page.waitForFunction(() => typeof GALLERY !== 'undefined' && GALLERY.S.ready, null, { timeout: 180000 });
    await page.waitForTimeout(1200);
    res.steps.push({ reduced: await page.evaluate(() => ({ galleryPlaying: GALLERY.S.playing, galleryT: GALLERY.S.t, status: document.getElementById('gStatus').textContent, videosPaused: [...document.querySelectorAll('video')].map((v) => v.paused) })) });
    await ctx.close();
  }
  fs.writeFileSync(path.join(OUT, 'smoke.json'), JSON.stringify(res, null, 1));
  console.log(JSON.stringify(res, null, 1).slice(0, 7000));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
