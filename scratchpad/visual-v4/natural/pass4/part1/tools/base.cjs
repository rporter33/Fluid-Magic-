// the p4Off baselines: node base.cjs <pagefile> <tag> [query] [w h dpr] -> out/base-<tag>.json (the p4Off views, settled, reduced motion; 0 page errors expected)
const { launch, open, ev, mev, OUT, VIEWSRC } = require('./lib.cjs'); const fs = require('fs');
const [file, tag, q = '', w = '1440', h = '900', dpr = '1'] = process.argv.slice(2);
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] };
  const p = await open(b, file, { log, w: +w, h: +h, dpr: +dpr, q, settle: 2500, reducedMotion: 'reduce' });
  if (/look=v3/.test(q)) await p.waitForFunction(() => window.__mock && !window.__mock.relief(), null, { timeout: 60000 });
  await p.mouse.move(+w / 2, +h - 4); await p.waitForTimeout(500);
  const r = await mev(p, VIEWSRC); r.readyMs = p.__readyMs; r.pageErrors = log.pageErrors; r.p4 = await ev(p, 'm.p4 ? m.p4() : null');
  if (await ev(p, '!!m.p4Off')) r.p4Off = await ev(p, 'm.p4Off()');
  console.log(tag, JSON.stringify(r)); fs.writeFileSync(`${OUT}base-${tag}.json`, JSON.stringify(r, null, 1)); await b.close(); })();
