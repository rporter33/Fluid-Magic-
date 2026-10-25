// three fresh loads: the bake, the map canvas at four zooms, every piece canvas, the full screenshot; under Relief and Painted (v3)
const { launch, open, PAGE, HASH } = require('./vlib.cjs'); const fs = require('fs'); const crypto = require('crypto');
const look = process.argv[2] || 'relief', RM = process.argv[3] === 'rm';
(async () => {
  const b = await launch(), runs = [], errors = [];
  for (let n = 0; n < 3; n++) {
    const p = await open(b, PAGE, { errors, q: look === 'v3' ? '?look=v3' : '', v3: look === 'v3', settle: 2500, reducedMotion: RM ? 'reduce' : undefined });
    const settle = async () => { for (let it = 0; it < 120; it++) { const pend = await p.evaluate(() => window.__mock.ev(window.__mock.relief() ? 'RCK = null; draw(); false' : 'CK = null; draw(); !!(CK && CK.pending)')); if (!pend) break; await p.waitForTimeout(60); } };
    const r = { readyMs: p.__readyMs };
    await p.evaluate(() => document.fonts.ready); await settle();
    r.fontsLoaded = await p.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').length);
    if (look === 'relief') r.bake = await p.evaluate(() => window.__mock.ev('(() => { const d = RB.img.data; let h = 0x811c9dc5; for (let k = 0; k < d.length; k++) { h ^= d[k]; h = Math.imul(h, 0x01000193); } return h >>> 0; })()'));
    const pieceHash = () => p.evaluate(() => { let h = 0x811c9dc5; const cs = [...document.querySelectorAll('#layer canvas')]; for (const c of cs) { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; for (let k = 0; k < d.length; k += 2) { h ^= d[k]; h = Math.imul(h, 0x01000193); } h ^= c.width * 7 + c.height; } const pos = [...document.querySelectorAll('#layer .mini')].map((e) => e.style.left + ',' + e.style.top + ',' + e.style.display).join(';'); return { n: cs.length, h: h >>> 0, pos: pos.length, posH: [...pos].reduce((a, c) => (Math.imul(a ^ c.charCodeAt(0), 16777619)) >>> 0, 2166136261) }; });
    r.start = await p.evaluate((H) => window.__mock.ev(H), HASH); r.startPieces = await pieceHash();
    r.shot = crypto.createHash('md5').update(await p.screenshot()).digest('hex').slice(0, 10);
    const views = look === 'relief' ? [['far', 'm.setScale(m.minScale(), 800, 520)'], ['mid', 'm.setScale(1.0, 640, 480)'], ['near', 'm.setScale(m.maxScale() * 0.9, 620, 470)'], ['m40', 'm.ev("fitToCloth()"); m.setMonth(40)']] : [['mid', 'm.zoomTo(1.0, "Kharnath")'], ['near', 'm.zoomTo(m.maxScale() * 0.9, "Kharnath")'], ['m40', 'm.ev("fitToCloth()"); m.setMonth(40)']];
    for (const [k, src] of views) { await p.evaluate((s) => { const m = window.__mock; eval(s); }, src); await p.waitForTimeout(1500); await settle(); r[k] = await p.evaluate((H) => window.__mock.ev(H), HASH); r[k + 'Pieces'] = await pieceHash(); }
    runs.push(r); await p.context().close();
  }
  const keys = Object.keys(runs[0]).filter((k) => k !== 'readyMs');
  const same = Object.fromEntries(keys.map((k) => [k, runs.every((r) => JSON.stringify(r[k]) === JSON.stringify(runs[0][k]))]));
  const out = { look, RM, runs, same, errors: errors.filter((x) => !/software WebGL|willReadFrequently/.test(x)) };
  fs.writeFileSync(`${__dirname}/out/det-${look}${RM ? '-rm' : ''}.json`, JSON.stringify(out, null, 1));
  console.log(look, RM ? 'rm' : '', JSON.stringify(same), 'errors', out.errors.length, 'ready', runs.map((r) => r.readyMs).join(','));
  await b.close();
})();
