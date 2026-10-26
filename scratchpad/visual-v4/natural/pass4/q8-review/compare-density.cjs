// Review-only proxy: mip 1 versus full bake, NOT an implementation of Option B.
// Build ../vast/build.sh first. Uses the existing debug mip hook, no source edits.
// node compare-density.cjs <vast.html> <d3-7.8.5.min.js> <output-dir>
// Resolve Playwright through NODE_PATH or the installed local package.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const [html, d3, output] = process.argv.slice(2);
if (!html || !d3 || !output) throw new Error('Expected html, d3, output directory');
fs.mkdirSync(output, { recursive: true });
(async () => {
  const browser = await chromium.launch({ headless: true,
    executablePath: process.env.CHROMIUM_PATH || chromium.executablePath() });
  const rows = [];
  try {
    for (const [name, width, height, dpr] of [['desktop',1440,900,1], ['phone',390,844,2]]) {
      const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: dpr });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.route('https://**/*', route => {
        if (route.request().url().includes('/d3/7.8.5/d3.min.js'))
          return route.fulfill({ path: path.resolve(d3), contentType: 'application/javascript' });
        return route.abort(); // Offline fonts: same fallback fonts in both shots.
      });
      await page.goto(pathToFileURL(path.resolve(html)).href, { timeout: 120000 });
      await page.waitForFunction(() => window.__mock?.reliefReady?.(), null, {timeout: 180000});
      const ev = source => page.evaluate(source => window.__mock.ev(source), source);
      await ev("setPaused(true); setTerrainColours('natural'); true");
      await page.waitForFunction(() => window.__mock.look().shown === 'natural', null, {timeout: 180000});
      const base = await ev('({provinces:provs.length,cells:N,bake:[RB.BW,RB.BH],W,H,MED_DIAM})');
      for (const diameter of [250,400]) {
        await ev(`window.__mock.setScale(${diameter}/MED_DIAM,...cent[redCap]); true`);
        for (const [label,mip] of [['A-density-proxy',1],['B-density-ceiling',0]]) {
          await ev(`RL_DBG.mip=${mip}; RCK=null; draw(); true`);
          const actual = await ev('({mip:rlMipLevel(),dpx:cam.s*MED_DIAM,look:rlShownLook()})');
          if (actual.mip !== mip || Math.abs(actual.dpx-diameter)>0.01)
            throw new Error('Camera or mip did not match requested comparison');
          await page.screenshot({ path:path.join(output,`${name}-${diameter}-${label}.png`), animations:'disabled' });
          rows.push({name,width,height,dpr,diameter,label,...actual,...base,errors:[...errors]});
        }
      }
      await context.close();
    }
    if (rows.some(r=>r.errors.length)) throw new Error(JSON.stringify(rows));
    fs.writeFileSync(path.join(output,'comparison.json'),JSON.stringify({
      method:'Existing 236-province bake forced to mip1 versus mip0; no tiles, no timing or GPU-memory claims; fallback fonts; phone is emulation.',
      browser:browser.version(),rows
    },null,2)+'\n');
    console.log(`Captured ${rows.length} density-proxy screenshots; zero page errors.`);
  } finally { await browser.close(); }
})().catch(e=>{ console.error(e); process.exitCode=1; });
