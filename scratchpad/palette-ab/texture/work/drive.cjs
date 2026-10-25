// Drives the hooked variant page: apply v3 or the painted config, wait for the bakes, shoot, measure.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const [file, cmd, outDir, cfgPath] = process.argv.slice(2);
const cfg = cfgPath ? JSON.parse(fs.readFileSync(cfgPath, 'utf8')) : null;
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: process.env.D3_LOCAL, contentType: 'application/javascript' }));
  await page.goto('file://' + file, { waitUntil: 'networkidle', timeout: 60000 }).catch((e) => errors.push('goto: ' + e.message));
  await page.waitForTimeout(1500);
  const idle = async () => { for (let k = 0; k < 150; k++) { await page.waitForTimeout(200); if (!(await page.evaluate(() => window.__pal.pending()))) break; } await page.waitForTimeout(500); };
  const apply = async (c) => { await page.evaluate((c) => window.__pal.apply(c), c); await idle(); };
  const log = {};
  if (cmd === 'paintcheck') {
    await apply(cfg);
    log.paintcheck = await page.evaluate(() => window.__mock.paintcheck());
  }
  if (cmd === 'clean') { // quick tuning: the start view and Far, no labels, no tokens
    await apply(cfg); const tag = process.argv[6] || 'tune';
    await page.evaluate(() => window.__pal.skip(['labels'], true)); await page.addStyleTag({ content: '#layer{visibility:hidden !important}' });
    for (const [vn, k] of [['start', 1], ['far', 0.62]]) { const info = await page.evaluate(() => window.__pal.fit()); if (k !== 1) await page.evaluate(([s, k]) => window.__pal.setCam(s * k, 520, 470), [info.s, k]); await idle();
      await page.screenshot({ path: `${outDir}/${tag}-${vn}-clean.png` }); fs.writeFileSync(`${outDir}/${tag}-${vn}-provs.json`, JSON.stringify(await page.evaluate(() => window.__pal.provs()))); }
    log.stats = await page.evaluate(() => window.__pal.stats()); if (process.argv[8] === 'zc') log.zoneCover = await page.evaluate(() => window.__pal.zoneCover());
    if (process.argv[7] === 'pc') log.paintcheck = await page.evaluate(() => window.__mock.paintcheck());
  }
  if (cmd === 'bake') {
    for (const [nm, c] of [['v3', null], ['cfg', cfg]]) { await apply(c);
      log[nm] = await page.evaluate(() => { const out = {}; for (const t of ['hills', 'plains', 'wasteland', 'swamp', 'mountains', 'forest', 'farmland']) { const ids = window.__pal.provsOf(t); out[t] = ids.map((i) => { const a = window.__pal.bakeStats(i, 'mid'); return [+a.sd.toFixed(2), +a.p01.toFixed(1), +a.p05.toFixed(1), +a.p99.toFixed(1)]; }); } return out; }); }
  }
  if (cmd === 'shots') {
    // start view, both looks; then Far and Near
    const views = [['start', null], ['far', 0.62], ['near', 3.5]];
    for (const [look, c] of [['v3', null], ['painted', cfg]]) {
      await apply(c);
      for (const [vn, k] of views) {
        if (vn === 'start') await page.evaluate(() => window.__pal.fit()); else { const info = await page.evaluate(() => window.__pal.fit()); await page.evaluate(([s, k]) => { const cx = 520, cy = 470; return window.__pal.setCam(s * k, cx, cy); }, [info.s, k]); }
        await idle();
        await page.screenshot({ path: `${outDir}/${look}-${vn}.png` });
        log[`${look}-${vn}`] = await page.evaluate(() => window.__pal.info());
        if (vn === 'start') {
          fs.writeFileSync(`${outDir}/${look}-start-provs.json`, JSON.stringify(await page.evaluate(() => window.__pal.provs())));
          for (const v of ['protan', 'deutan', 'tritan']) { await page.selectOption('#vision', v); await page.waitForTimeout(400); await page.screenshot({ path: `${outDir}/${look}-start-${v}.png` }); }
          await page.selectOption('#vision', 'normal'); await page.waitForTimeout(300);
          // clean view for texture measurement and swatches: no labels, no tokens
          await page.evaluate(() => window.__pal.skip(['labels'], true)); await page.addStyleTag({ content: '#layer{visibility:hidden !important}' }).catch(() => {});
          await idle(); await page.screenshot({ path: `${outDir}/${look}-start-clean.png` });
          for (const v of ['protan', 'deutan', 'tritan']) { await page.selectOption('#vision', v); await page.waitForTimeout(400); await page.screenshot({ path: `${outDir}/${look}-start-clean-${v}.png` }); }
          await page.selectOption('#vision', 'normal'); await page.waitForTimeout(300);
          await page.evaluate(() => window.__pal.skip(['labels'], false)); await page.evaluate(() => { for (const s of document.querySelectorAll('style')) if (s.textContent.includes('#layer{visibility:hidden')) s.remove(); });
          await idle();
        }
        if (vn === 'far') {
          await page.evaluate(() => window.__pal.skip(['labels'], true)); await page.addStyleTag({ content: '#layer{visibility:hidden !important}' }); await idle();
          await page.screenshot({ path: `${outDir}/${look}-far-clean.png` }); fs.writeFileSync(`${outDir}/${look}-far-provs.json`, JSON.stringify(await page.evaluate(() => window.__pal.provs())));
          await page.evaluate(() => window.__pal.skip(['labels'], false)); await page.evaluate(() => { for (const s of document.querySelectorAll('style')) if (s.textContent.includes('#layer{visibility:hidden')) s.remove(); }); await idle();
        }
        if (vn === 'near') {
          await page.evaluate(() => window.__pal.skip(['labels'], true)); await page.addStyleTag({ content: '#layer{visibility:hidden !important}' }); await idle();
          await page.screenshot({ path: `${outDir}/${look}-near-clean.png` }); fs.writeFileSync(`${outDir}/${look}-near-provs.json`, JSON.stringify(await page.evaluate(() => window.__pal.provs())));
          await page.evaluate(() => window.__pal.skip(['labels'], false)); await page.evaluate(() => { for (const s of document.querySelectorAll('style')) if (s.textContent.includes('#layer{visibility:hidden')) s.remove(); }); await idle();
        }
      }
      await page.evaluate(() => window.__pal.fit()); await idle();
      log[`${look}-checks`] = await page.evaluate(() => window.__mock.checks());
      for (const m of ['supply', 'springs']) { await page.evaluate((m) => window.__pal.mode(m), m); await idle(); await page.screenshot({ path: `${outDir}/${look}-mode-${m}.png` }); }
      await page.evaluate(() => window.__pal.mode('ownership')); await idle();
    }
  }
  console.log(JSON.stringify(log, null, 1));
  console.log('ERRORS ' + JSON.stringify(errors));
  await browser.close();
})();
