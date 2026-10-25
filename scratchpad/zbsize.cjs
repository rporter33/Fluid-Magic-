const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  for (const [w, mob] of [[390, true], [1440, false]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 844 }, isMobile: mob, hasTouch: mob });
    const p = await ctx.newPage();
    await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    await p.goto('file://' + process.argv[2], { waitUntil: 'load' });
    const zbs = await p.$$('.zb');
    const sizes = [];
    for (const z of zbs) {
      await z.focus();
      sizes.push(await z.evaluate((e) => { const r = e.getBoundingClientRect(), h = e.closest('[data-zg]').getBoundingClientRect(); return [e === document.activeElement, Math.round(r.width), Math.round(r.height), Math.round(r.left - h.left), Math.round(r.top - h.top), e.closest('details') ? (e.closest('details').open ? 'open' : 'closed') : '', e.textContent]; }));
    }
    const bad = sizes.filter((s) => s[2] < 44);
    console.log(w, 'n', sizes.length, 'min h', Math.min(...sizes.filter((s) => s[0]).map((s) => s[2])), 'max w', Math.max(...sizes.map((s) => s[1])), 'bad', JSON.stringify(bad));
    await ctx.close();
  }
  await b.close();
})();
