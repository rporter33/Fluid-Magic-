const { launch, open, ev, PAGES, SHOTS } = require('./lib.cjs'); const fs = require('fs');
(async () => { const b = await launch(); fs.mkdirSync(SHOTS + 'phone', { recursive: true });
  for (const k of ['p2', 'relief', 'massif', 'open']) { const log = { pageErrors: [], console: [], requests: [] };
    const p = await open(b, PAGES[k], { w: 390, h: 844, dpr: 2, settle: 1500, log }); await p.mouse.move(195, 840);
    await p.waitForTimeout(1500); await p.screenshot({ path: `${SHOTS}phone/${k}-start.png` });
    await ev(p, 'm.setScale(m.minScale(), 640, 500)'); await p.waitForTimeout(2000); await p.screenshot({ path: `${SHOTS}phone/${k}-least.png` });
    console.log(k, 'pageErrors', log.pageErrors.length); await p.context().close(); }
  await b.close(); })();
