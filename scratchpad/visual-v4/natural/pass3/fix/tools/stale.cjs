// the start frame as first shown (the page's cached static layer) against a from-scratch redraw: where they differ. node stale.cjs [pagefile] [tag]
const { launch, open, ev, mev, PAGE, OUT, SHOTS, HASH } = require('./lib.cjs'); const fs = require('fs');
const file = process.argv[2] || PAGE, tag = process.argv[3] || 'now';
(async () => { const b = await launch(), out = [];
  for (let L = 0; L < 3; L++) { const log = { pageErrors: [], console: [], requests: [] };
    const p = await open(b, file, { log, settle: 3000, reducedMotion: 'reduce' }); await p.mouse.move(720, 895); await p.waitForTimeout(1500);
    const r = await mev(p, String.raw`(() => { draw(); const A = ctx.getImageData(0, 0, canvas.width, canvas.height).data.slice(); const ha = ${HASH}; const WR = typeof RL_WRIM !== 'undefined' ? RL_WRIM : { key: '', ms: null }; const key0 = WR.key; const ms0 = WR.ms; const dA = canvas.toDataURL('image/png'); RCK = null; draw(); const B = ctx.getImageData(0, 0, canvas.width, canvas.height).data; const hb = ${HASH};
      let n = 0, big8 = 0, big24 = 0, mx = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1; const W2 = canvas.width; const where = {}; for (let k = 0; k < A.length; k += 4) if (A[k] !== B[k] || A[k + 1] !== B[k + 1] || A[k + 2] !== B[k + 2]) { n++; const dd = Math.max(Math.abs(A[k] - B[k]), Math.abs(A[k + 1] - B[k + 1]), Math.abs(A[k + 2] - B[k + 2])); mx = Math.max(mx, dd); if (dd > 8) big8++; if (dd > 24) big24++; const q = k / 4, x = q % W2, y = Math.floor(q / W2); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); const [wx, wy] = toWorld(x / dpr, y / dpr); const i = provinceAt(wx, wy); const nm = i >= 0 && i < names.length ? (isWild(i) ? 'wild:' + (WILDS.find((w) => w.cells.includes(i)) || {}).name : names[i]) : 'off'; where[nm] = (where[nm] || 0) + 1; }
      return { dA, dB: canvas.toDataURL('image/png'), ha, hb, diffPx: n, over8: big8, over24: big24, maxDiff: mx, bbox: [x0, y0, x1, y1], where: Object.entries(where).sort((a, b) => b[1] - a[1]).slice(0, 8), wrimKeyChanged: key0 !== WR.key, ms0, ms1: WR.ms }; })()`);
    if (L === 0) { fs.writeFileSync(`${SHOTS}stale-${tag}-cached.png`, Buffer.from(r.dA.split(',')[1], 'base64')); fs.writeFileSync(`${SHOTS}stale-${tag}-fresh.png`, Buffer.from(r.dB.split(',')[1], 'base64')); } delete r.dA; delete r.dB; console.log(tag, 'load', L, JSON.stringify(r)); out.push(r);
    if (r.diffPx && L === 0) { await mev(p, 'RCK = null; draw()'); }
    await p.context().close(); }
  fs.writeFileSync(`${OUT}stale-${tag}.json`, JSON.stringify(out, null, 1)); await b.close(); })();
