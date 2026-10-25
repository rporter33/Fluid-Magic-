// Renders the hooked mockup (mock-pal.html, built by gen-hook.py from the untouched parts) at its start view for each
// palette, with v3's paint recipe unchanged and the ground marks (groundP) taken from the fill by v3's own lightness steps.
// Also runs the page's paint check, __mock.checks() and the CVD filters. Nothing in the parts or the repo is edited.
// Usage: D3_LOCAL=... node render.cjs <mock-pal.html> <outDir> <palettes.json> <name>[,<name>...] [vision,...]
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
// v3's paint stack expressed in the hook's config (so only the fills and the ground-mark colors change)
const V3PC = {
  mottle: { n: 6, nMin: 2, r0: 0.1, r1: 0.08, tries: 1, keep: 0.5, plateau: 0.0909, zones: 'all' },
  bloom: { dl: 4, a: 0.35, rimDL: -9, rimA: 0.3, lw: 1.2 },
  pool: { dl: -28, a: 0.45, blur: { far: 5, mid: 11, near: 14 }, rim: 3 },
  line: { dl: -14, a: 0.35 },
  paper: { alpha: { plains: 0.5, farmland: 0.5, forest: 0.5, hills: 0.5, mountains: 0.5, swamp: 0.5, wasteland: 0.5 }, fine: 12, coarse: 8 },
  // v3's hard-coded mark colors, as the lightness step each one has on its approved fill (measured), now in the fill's own hue
  g: { stipple: 8, hedge: -37, field: 10, furrowDL: -12, furrowA: 0.35, farmHedge: -42, scallop: 8, scree: -14, swampLine: 10, swampPool: 10, ripple: 36, crack: -11, crackA: 0.45 },
};
(async () => {
  const [file, outDir, palPath, namesArg, visArg] = process.argv.slice(2);
  const PALS = JSON.parse(fs.readFileSync(palPath, 'utf8')), names = namesArg.split(','), visions = visArg ? visArg.split(',') : [];
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: process.env.D3_LOCAL, contentType: 'application/javascript' }));
  await page.goto('file://' + file, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  const ev = (src) => page.evaluate((s) => window.__mock.ev(s), src);
  const settle = async () => { for (let k = 0; k < 60; k++) { await page.waitForTimeout(250); const p = await ev('bakesPending || !!(CK && CK.pending)'); if (!p) break; await ev('draw()'); } await page.waitForTimeout(500); };
  await settle();
  const out = { errors, runs: {} };
  for (const n of names) {
    const cfg = n === 'approved-v3' ? null : { ...V3PC, fills: PALS[n], paint: {} };
    await page.evaluate((c) => window.__pal.apply(c), cfg); await ev('invalidateBakes(); refreshKeys(); requestDraw()'); await settle();
    await page.screenshot({ path: `${outDir}/start-${n}.png` });
    for (const v of visions) { await page.selectOption('#vision', v); await settle(); await page.screenshot({ path: `${outDir}/start-${n}-${v}.png` }); }
    if (visions.length) { await page.selectOption('#vision', 'normal'); await settle(); }
    const pc = await ev('paintCheck()');
    const ck = await page.evaluate(() => window.__mock.checks());
    out.runs[n] = { paint: pc.paint, farPairsUnder: pc.farPairsUnder, farPairs: pc.farPairs, checks: { hit: ck.hit, labels: ck.labels, zones: ck.zones, stable: ck.stable } };
    await settle();
  }
  fs.writeFileSync(`${outDir}/render.json`, JSON.stringify(out, null, 1));
  console.log(JSON.stringify({ errors, names }));
  await browser.close();
})();
