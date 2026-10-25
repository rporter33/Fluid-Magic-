// Builds a gallery-only test page from the pilot template's gallery parts and shoots it with each toggle:
//   node gallery_test.cjs OUTDIR
const fs = require('fs'), path = require('path');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const PIXI = '/home/user/Fluid-Magic-/node_modules/pixi.js/dist/pixi.min.js';
const OUT = process.argv[2];
const STAGE = path.resolve(__dirname, '..', '..');
const V4 = path.resolve(STAGE, '..', '..');
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const tpl = fs.readFileSync(path.join(__dirname, 'pilot_template.html'), 'utf8');
  const style = tpl.slice(tpl.indexOf('<style>'), tpl.indexOf('</style>') + 8);
  const sec = tpl.slice(tpl.indexOf('<section class="piece" id="gallery"'), tpl.indexOf('<section class="piece" id="sheets"'));
  const scripts = tpl.slice(tpl.indexOf('<script type="application/json" id="fx-data">'), tpl.indexOf("<script>\n'use strict';\nconst CLIPS"));
  const fxdata = fs.readFileSync(path.join(STAGE, 'atlas', 'fx', 'fx-data.json'), 'utf8').replace(/<\//g, '<\\/');
  const code = ['00-util.js', '33-fx-timeline.js', '45-fx-looks.js', '46-fx.js', '47-spells-pilot.js', '48-entangle.js', '49-fx-decals.js'].map((f) => fs.readFileSync(path.join(process.env.SRC || path.join(V4, 'src'), f), 'utf8')).join('\n') + '\n' + fs.readFileSync(path.join(__dirname, 'gallery.js'), 'utf8');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Gallery test</title>${style}</head><body><div class="wrap">${sec}</div>${scripts.replace('/*FXDATA*/', () => fxdata).replace('/*FXCODE*/', () => code)}</body></html>`;
  const page0 = path.join(OUT, 'gallery-test.html');
  fs.writeFileSync(page0, html);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 1240, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.route(/cdn\.jsdelivr\.net\/npm\/pixi\.js@8\.22\.0\/dist\/pixi\.min\.js/, (r) => r.fulfill({ path: PIXI, contentType: 'application/javascript' }));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto('file://' + page0, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => typeof GALLERY !== 'undefined' && GALLERY.S.ready, null, { timeout: 120000 });
  const shots = [];
  const at = async (name, t, set) => {
    await page.evaluate(([t, set]) => { for (const [k, v] of Object.entries(set || {})) if (GALLERY.S[k] !== v) GALLERY.set(k, v); GALLERY.S.playing = false; GALLERY.S.t = t; GALLERY.render(); }, [t, set]);
    const f = path.join(OUT, name + '.png');
    await page.locator('.gcanvas').screenshot({ path: f });
    shots.push(name);
  };
  await at('g-charge', 0.6); await at('g-travel', 1.15); await at('g-impact', 1.36); await at('g-linger', 1.75); await at('g-hold', 2.6);
  await at('g-hidden', 1.36, { hidden: true }); await at('g-grey', 1.36, { hidden: false, grey: true }); await at('g-grey-hidden', 1.36, { hidden: true, grey: true });
  await at('g-short', 0.9, { hidden: false, grey: false, short: true }); await at('g-nocrowd', 1.36, { short: false, crowd: false });
  const info = await page.evaluate(() => ({ S: GALLERY.S, ends: null }));
  console.log(JSON.stringify({ shots, errors, info }, null, 1));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
