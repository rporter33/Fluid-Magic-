// Full-page slices of a page at a width, for a pixel diff. Usage: node pixshot.cjs <page> <outPrefix> <width>
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const [f, pre, w] = process.argv.slice(2); const W = +w, mob = W < 600;
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await b.newContext({ viewport: { width: W, height: 900 }, deviceScaleFactor: 1, isMobile: mob, hasTouch: mob });
  const p = await ctx.newPage();
  await p.goto('file://' + f, { waitUntil: 'load' });
  await p.evaluate(async () => { try { localStorage.clear(); } catch {} });
  await p.reload({ waitUntil: 'load' });
  await p.evaluate(async () => { for (const im of document.images) im.loading = 'eager'; await Promise.all([...document.images].map((im) => im.decode().catch(() => null))); await document.fonts.ready; });
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  let i = 0; for (let y = 0; y < H; y += 3000) { await p.screenshot({ path: `${pre}-${String(i++).padStart(2, '0')}.png`, fullPage: true, clip: { x: 0, y, width: W, height: Math.min(3000, H - y) } }); }
  console.log(H, i); await b.close();
})();
