// v3 history: the p4Off views twice in one load (node twice.cjs <pagefile> <query>)
const { launch, open, ev, mev, VIEWSRC } = require('./lib.cjs');
const [file, q = '?look=v3'] = process.argv.slice(2);
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] };
  const p = await open(b, file, { log, q, settle: 2500, reducedMotion: 'reduce' }); await p.waitForFunction(() => window.__mock && !window.__mock.relief(), null, { timeout: 60000 }).catch(() => null);
  await p.mouse.move(720, 896); const a = await mev(p, VIEWSRC), c = await mev(p, VIEWSRC); console.log(JSON.stringify(a.views), JSON.stringify(c.views), 'perr', log.pageErrors.length); await b.close(); })();
