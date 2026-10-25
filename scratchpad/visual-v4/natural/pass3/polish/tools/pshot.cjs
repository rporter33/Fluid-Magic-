// a shot at a size, look and camera after optional setup snippets: node pshot.cjs <out.png> <w> <h> <dpr> <setupJS> [clip x,y,w,h]
const { launch, open, ev, mev, PAGE } = require('./lib.cjs');
const [out, w, h, dpr, setup, clip] = process.argv.slice(2);
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] };
  const p = await open(b, process.env.PAGEFILE || PAGE, { log, w: +w, h: +h, dpr: +dpr, settle: 1500, q: process.env.Q || '' }); await p.mouse.move(+w / 2, 3);
  for (const s of (setup || '').split(';;')) if (s.trim()) { await ev(p, s); await p.waitForTimeout(700); }
  if (process.env.HOVER) { const [x, y] = await ev(p, `m.at(${JSON.stringify(process.env.HOVER)})`); await p.mouse.move(x, y); await p.waitForTimeout(600); }
  await p.waitForTimeout(900); const o = { path: out }; if (clip) { const [x, y, cw, ch] = clip.split(',').map(Number); o.clip = { x, y, width: cw, height: ch }; } await p.screenshot(o);
  console.log(out, 'pageErrors', log.pageErrors.length, JSON.stringify(log.pageErrors.slice(0, 2))); await b.close(); })();
