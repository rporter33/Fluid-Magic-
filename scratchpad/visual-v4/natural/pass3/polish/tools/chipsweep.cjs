// day chips against army pieces (the page's reliefDayChips: piece pixels from the DOM canvases) over zooms x camera positions x planned moves: node chipsweep.cjs <w> <h> [dpr] [look]
const { launch, open, ev, mev, PAGE, OUT, SHOTS } = require('./lib.cjs'); const fs = require('fs');
const W = Number(process.argv[2] || 1440), H = Number(process.argv[3] || 900), dpr = Number(process.argv[4] || 1), look = process.argv[5] || 'natural', tag = `${look}-${W}x${H}-dpr${dpr}`;
const PROBE = String.raw`(() => { draw(); const cr = canvas.getBoundingClientRect(), pcs = [...document.querySelectorAll('#layer .mini')].filter((e) => e.offsetParent && e.style.display !== 'none').map((e) => { const cv = e.querySelector('canvas'), q = cv.getBoundingClientRect(); return { cv, x: q.left - cr.left, y: q.top - cr.top, w: q.width, h: q.height }; });
  const v = viewRect(); let under = 0, worst = 0, offView = 0; const ex = [];
  for (const c of RL_CHIPS) { const r = c.box; if (r[0] < v.l || r[2] > v.r || r[1] < v.t || r[3] > v.b) offView++; let px = 0, tot = 0; for (let y = r[1] + 1.5; y < r[3] - 1; y += 1) for (let x = r[0] + 1.5; x < r[2] - 1; x += 1) { tot++; for (const q of pcs) { if (x < q.x || y < q.y || x >= q.x + q.w || y >= q.y + q.h) continue; const k = q.cv.width / q.w, X = Math.floor((x - q.x) * k), Y = Math.floor((y - q.y) * k), a = (q.d ??= q.cv.getContext('2d').getImageData(0, 0, q.cv.width, q.cv.height).data)[(Y * q.cv.width + X) * 4 + 3]; if (a > 24) { px++; break; } } }
    const sh = tot ? px / tot : 0; if (px) { under++; if (ex.length < 4) ex.push(c.text + ' ' + (100 * sh).toFixed(1) + '%'); } worst = Math.max(worst, sh); }
  return { chips: RL_CHIPS.length, underPieces: under, underPiecesWorstShare: +worst.toFixed(3), underExamples: ex, offView, overlaps: window.__mock.reliefDayChips().overlaps, examples: [] }; })()`;
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }, rows = [];
  const p = await open(b, process.env.PAGEFILE || PAGE, { log, w: W, h: H, dpr, settle: 1500, q: look === 'clear' ? '?terrain=clear' : '' }); await p.mouse.move(W / 2, 5);
  const geo = await mev(p, '({ fit: fitScale, min: minScale, max: maxScale, start: startScale(), W, H, phone: app.classList.contains("phone"), D: MED_DIAM })');
  const targets = await mev(p, `(() => { const a = cmd.varo.at, out = [null]; const acr = typeof acrossTarget !== 'undefined' && acrossTarget != null ? acrossTarget : null; if (acr != null) out.push(acr); const nb = NB[a].find((j) => !isWild(j) && pathTo(a, j)); if (nb != null) out.push(nb); const far = provList.filter((j) => j !== a && pathTo(a, j) && pathTo(a, j).path.length >= 5).sort((x, y) => x - y)[0]; if (far != null) out.push(far); return out; })()`);
  const Z = [['fit', geo.fit], ['min', geo.min], ['start', geo.start], ['mid', 1.0], ['ref', 1.142], ['near', geo.max * 0.8]];
  for (const t of targets) {
    await ev(p, 'm.ev("fit(); draw()")'); await mev(p, "selectCmd('varo')"); if (t != null) await mev(p, `orderMove(0, 0, ${t})`); else await mev(p, 'moveLine = null; draw()'); await p.mouse.move(W / 2, 5);
    const path = await mev(p, 'moveLine ? moveLine.path.map((i) => names[i]).join(">") : "-"');
    for (const [zn, s] of Z) { const va = await mev(p, 'cent[cmd.varo.at]'); const pos = [[va[0], va[1]], [va[0] + 0.6 * geo.D, va[1]], [va[0], va[1] + 0.6 * geo.D], [va[0] - 0.6 * geo.D, va[1] - 0.4 * geo.D]];
      for (const [x, y] of zn === 'fit' || zn === 'min' ? [pos[0], [geo.W / 2, geo.H / 2]] : pos) { await ev(p, `m.setScale(${s}, ${x}, ${y})`); await p.waitForTimeout(450);
        const r = await mev(p, PROBE); rows.push({ path, zn, at: [Math.round(x), Math.round(y)], ...r });
        if (r.underPieces || r.overlaps) console.log('FAIL', tag, path, zn, Math.round(x), Math.round(y), JSON.stringify({ chips: r.chips, under: r.underPieces, worst: r.underPiecesWorstShare, ex: r.underExamples, overlaps: r.overlaps, oex: r.examples })); } } }
  const S = { views: rows.length, chips: rows.reduce((a, r) => a + r.chips, 0), chipsUnderPieces: rows.reduce((a, r) => a + r.underPieces, 0), worstShare: Math.max(0, ...rows.map((r) => r.underPiecesWorstShare || 0)), overNamesOrRibbon: rows.reduce((a, r) => a + r.overlaps, 0), chipsOffView: rows.reduce((a, r) => a + r.offView, 0) };
  console.log('SUMMARY', tag, JSON.stringify(S), 'pageErrors', log.pageErrors.length, JSON.stringify(log.pageErrors.slice(0, 2)));
  fs.writeFileSync(`${OUT}chipsweep-${process.env.TAG || 'now'}-${tag}.json`, JSON.stringify({ geo, S, rows }, null, 1)); await b.close(); })();
