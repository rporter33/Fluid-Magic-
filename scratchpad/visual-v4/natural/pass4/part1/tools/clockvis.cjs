// the clock's glyph and date visible without scrolling at five widths: node clockvis.cjs [query]
const { launch, open, ev, mev, PAGE, OUT, SHOTS } = require('./lib.cjs'); const fs = require('fs');
const q = process.argv[2] || '';
(async () => { const b = await launch(), rows = [];
  for (const [w, h, dpr] of [[390, 844, 3], [1024, 768, 1], [1280, 720, 1], [1440, 900, 1], [1920, 1080, 1]]) { const log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, PAGE, { log, q, w, h, dpr, settle: 1200 });
    const r = await p.evaluate(() => { const bar = document.getElementById('topbar').getBoundingClientRect(), vis = (el) => { if (!el) return null; const q = el.getBoundingClientRect(); if (!q.width) return { shown: false }; const cx = q.left + q.width / 2, cy = q.top + q.height / 2, top = document.elementFromPoint(cx, cy); return { shown: true, inBar: q.left >= bar.left - 0.5 && q.right <= bar.right + 0.5, onTop: !!top && (el === top || el.contains(top) || top.closest('#clock') === el.closest('#clock')), box: [q.left, q.top, q.right, q.bottom].map(Math.round) }; };
      const de = document.getElementById('date'), gl = document.getElementById('sglyph'), sp = document.getElementById('speed'), tb = document.getElementById('topbar'); return { date: vis(de), glyph: vis(gl), speed: vis(sp), scrollW: tb.scrollWidth, clientW: tb.clientWidth, text: de.textContent }; });
    r.view = `${w}x${h}`; r.pass = r.date.shown && r.date.inBar && r.date.onTop && r.glyph && r.glyph.shown && r.glyph.inBar && r.glyph.onTop; r.pageErrors = log.pageErrors.length; rows.push(r); console.log(JSON.stringify(r));
    await p.screenshot({ path: `${SHOTS}../part1-wip-clock-${w}.png`, clip: { x: 0, y: 0, width: w, height: Math.min(h, 140) } }).catch(() => null); await p.context().close(); }
  fs.writeFileSync(`${OUT}clockvis${q.replace(/[^a-z0-9]/gi, '')}.json`, JSON.stringify(rows, null, 1)); console.log('ALL', rows.every((r) => r.pass)); await b.close(); })();
