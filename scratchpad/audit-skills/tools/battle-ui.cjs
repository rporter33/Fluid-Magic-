// Battle HUD UI scan on the snapshot: targets at 390 px, keyboard reach of the cards, OS reduced motion. node battle-ui.cjs <out.json>
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs'), path = require('path');
const SNAP = path.join(__dirname, '..', 'snap', 'battle-mockup.html');
const PIXI = '/home/user/Fluid-Magic-/node_modules/pixi.js/dist/pixi.min.js';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
  const out = {};
  for (const [name, vp, mobile] of [['w390', { width: 390, height: 844 }, true], ['w1920', { width: 1920, height: 1080 }, false]]) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: mobile ? 3 : 1, hasTouch: mobile, isMobile: mobile, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.route('https://cdn.jsdelivr.net/npm/pixi.js@8.22.0/dist/pixi.min.js', (r) => r.fulfill({ path: PIXI, contentType: 'application/javascript' }));
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    await page.goto('file://' + SNAP, { waitUntil: 'load', timeout: 180000 });
    await page.evaluate(() => window.__battle.ready);
    await page.waitForTimeout(500);
    const r = await page.evaluate(() => {
      const G = window.__battle.game;
      const vis = (e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden'; };
      const items = [...document.querySelectorAll('#hud button, #hud .card, #hud .mini, #scrub, #hud [tabindex]')].filter(vis);
      const m = new Map();
      for (const e of items) { const b = e.getBoundingClientRect(); const k = e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className ? '.' + e.className.split(' ')[0] : ''); const kk = k.replace(/#b[A-Z]\w+/, '#b*'); const v = m.get(kk) || { n: 0, w: Math.round(b.width), h: Math.round(b.height), focusable: e.tabIndex >= 0 }; v.n++; m.set(kk, v); }
      return { osReducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches, gameReduced: G.reduced, appResolution: G.app.renderer.resolution, targets: [...m.entries()].map(([k, v]) => ({ k, ...v })),
        cardsFocusable: [...document.querySelectorAll('.card')].filter((c) => c.tabIndex >= 0).length, cards: document.querySelectorAll('.card').length,
        iconButtonsNamed: [...document.querySelectorAll('#hud button')].filter((b) => !b.textContent.trim()).map((b) => b.getAttribute('aria-label') || b.title || null) };
    });
    // the menu: does opening it move focus into it, does Tab stay, does Escape give focus back
    await page.evaluate(() => document.getElementById('bMenu').focus());
    await page.keyboard.press('Enter'); await page.waitForTimeout(100);
    r.menu = { open: await page.evaluate(() => document.getElementById('menu').classList.contains('show')), focusInside: await page.evaluate(() => !!document.activeElement.closest('#menu')) };
    out[name] = r;
    await ctx.close();
  }
  fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
