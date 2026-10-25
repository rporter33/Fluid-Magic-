const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  for (const f of process.argv.slice(2)) {
    for (const [w, mob] of [[390, true], [1440, false]]) {
      const ctx = await b.newContext({ viewport: { width: w, height: 844 }, deviceScaleFactor: 1, isMobile: mob, hasTouch: mob });
      const p = await ctx.newPage();
      await p.goto('file://' + f, { waitUntil: 'load' });
      await p.evaluate(async () => { for (const im of document.images) im.loading = 'eager'; await Promise.all([...document.images].map((im) => im.decode().catch(() => null))); await document.fonts.ready; });
      const r = await p.evaluate(() => ({ H: document.documentElement.scrollHeight, coarse: matchMedia('(pointer: coarse)').matches, sec: [...document.querySelectorAll('.wrap > *')].map((e) => (e.id || e.className) + ':' + Math.round(e.getBoundingClientRect().height)) }));
      console.log(f.split('/').slice(-2).join('/'), w, JSON.stringify(r));
      await ctx.close();
    }
  }
  await b.close();
})();
