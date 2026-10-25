// every window.__mock relief check, re-run by the verifier, across views: node checks.cjs <natural|clear|terrain> <dpr> [w] [h]
const { launch, open, ev, mev, page, OUT } = require('./lib.cjs'); const PN = process.argv[2], PAGE = page(PN); process.argv.splice(2, 1); const fs = require('fs');
const look = process.argv[2] || 'natural', dpr = Number(process.argv[3] || 1), W = Number(process.argv[4] || 1440), H = Number(process.argv[5] || 900);
const tag = `${PN}-${look}-dpr${dpr}-${W}x${H}`;
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] }, rows = {};
  const p = await open(b, PAGE, { log, dpr, w: W, h: H, settle: 1500, q: look === 'clear' ? '?terrain=clear' : '' });
  await p.mouse.move(W / 2, H - 20);
  if (look === 'terrain') { await mev(p, "setMode('terrain')"); await p.waitForFunction(() => window.__mock.look().clear, null, { timeout: 240000, polling: 300 }); await p.waitForTimeout(1500); }
  const geo = await mev(p, '({ W, H, D: MED_DIAM, max: maxScale, min: minScale, fit: fitScale, s: cam.s, look: rlShownLook(), mode: state.mode })');
  rows.geo = geo; console.log(tag, JSON.stringify(geo));
  // one province of each terrain, chosen by the verifier (first fully explored province of the terrain, by index)
  const byT = await mev(p, '(() => { const o = {}; for (const i of provList) { const t = terr[i]; if (!o[t] && !fogOf(i)) o[t] = [names[i], cent[i][0], cent[i][1]]; } return o; })()');
  const VIEWS = [['start', null], ['far', `m.setScale(60 / ${geo.D}, ${geo.W / 2}, ${geo.H / 2})`], ['min', `m.setScale(m.minScale(), ${geo.W / 2}, ${geo.H / 2})`], ['mid75', 'm.setScale(0.75, 800, 500)'], ['mid', 'm.setScale(1.0, 640, 480)'], ['ref', 'm.setScale(1.142, 700, 560)'], ['refW', 'm.setScale(1.142, 300, 470)'],
    ...Object.entries(byT).map(([t, [n, x, y]]) => ['near-' + t, `m.setScale(m.maxScale() * 0.8, ${x}, ${y})`]), ['nearMax', 'm.zoomTo(m.maxScale(), "Wyrford")'], ['m40', 'm.ev("fit(); draw()"); m.setMonth(40)'], ['m40mid', 'm.setScale(1.0, 900, 500)'], ['m70', 'm.ev("fit(); draw()"); m.setMonth(70)']];
  const sel = process.env.VIEWS ? process.env.VIEWS.split(',') : null;
  for (const [v, src] of VIEWS) {
    if (sel && !sel.includes(v)) continue;
    if (dpr === 2 && !['start', 'mid', 'ref', 'near-forest', 'near-swamp', 'nearMax', 'far'].includes(v)) continue;
    if (src) await ev(p, src); await p.waitForTimeout(1800);
    const t0 = Date.now();
    const r = await ev(p, `(() => { const o = { band: m.band(), s: +m.scale().toFixed(3), Dpx: +(m.scale() * m.ev('MED_DIAM')).toFixed(1), look: m.look().shown };
      const L = m.reliefLines({ step: 1 }); o.lines = { hair: L.hairline, internal: L.internal, faint: L.faint, worst: L.worst, under: L.underExamples, bevel: L.bevel, partners: L.partners, flips: L.keylineFlipsAlongEdges, maxW: L.maxHairWidthPx, pass: L.pass };
      o.wildEdge = m.reliefWildEdge();
      const R = m.reliefRails(); o.rails = { samples: R.samples, fails: R.fails, worst: R.worstContrast, worstAt: R.worstAt, failList: R.failList };
      const M = m.reliefMeans(); o.means = M.applicable === false ? 'n/a' : { provinces: M.provinces, worstDE: M.worstDE, overBudget: M.overBudget, budget: M.budget, pairs: M.pairs };
      const S = m.reliefSeats(); o.seats = S;
      const Y = m.reliefLayout(); o.layout = Y;
      o.hit = m.reliefHit();
      const HC = m.reliefHoverChips(); o.hoverChips = { hovered: HC.hovered, namesOverAChip: HC.namesOverAChip, dayChipsOverNames: HC.dayChipsOverNames, chips: HC.chips, pass: HC.pass };
      o.dayChips = m.reliefDayChips(); o.cliff = m.reliefCliff(); o.nearDetail = m.reliefNearDetail(); o.stable = m.reliefStable(false);
      return o; })()`);
    r.ms = Date.now() - t0; rows[v] = r;
    console.log(v, r.band, r.Dpx, 'wildEdge', r.wildEdge.samples, r.wildEdge.fails, JSON.stringify(r.wildEdge.rim), 'faint', r.lines.faint.edges, r.lines.faint.median, r.lines.faint.p90, r.lines.faint.max, 'lines', r.lines.pass, r.lines.hair.min, r.lines.hair.median, r.lines.hair.under, '/', r.lines.hair.samples, 'int', r.lines.internal.min, r.lines.internal.under, '/', r.lines.internal.samples, 'flips', r.lines.flips, 'w', r.lines.maxW, '| rails', r.rails.samples, r.rails.fails, r.rails.worst, '| means', JSON.stringify(r.means === 'n/a' ? 'n/a' : [r.means.provinces, r.means.worstDE, r.means.pairs.under2012, r.means.pairs.worstNormal.v, r.means.pairs.worstCvd.v]),
      '| seats', r.seats.pass, JSON.stringify(Object.fromEntries(['hamlet', 'hut', 'town'].filter((k) => r.seats[k]).map((k) => [k, [r.seats[k].seats, r.seats[k].p95Worst]]))), '| layout', r.layout.labelOverlaps, r.layout.labelPieceOverlaps, r.layout.pieceOverlaps, r.layout.armiesOutsideInset, 'names', r.layout.names, r.layout.pctNamed + '%', 'rib', r.layout.namesUnderRibbon.length,
      '| hit', r.hit.wrong, r.hit.cornerWrong, '| chips', r.hoverChips.namesOverAChip, r.dayChips.overlaps, '| cliff', r.cliff.visible ? [r.cliff.stripeIndex, r.cliff.lightStreaksPer100px].join('/') : '-', '| nd', r.nearDetail.strength, '| stable', r.stable.identical, r.ms + 'ms');
  }
  if (!sel || sel.includes('hover')) { for (const [hv, src] of [['start', 'm.ev("fit(); draw()")'], ['mid', 'm.setScale(1.0, 640, 480)'], ['near', 'm.setScale(m.maxScale() * 0.8, 700, 500)']]) { await ev(p, src); await p.waitForTimeout(1500);
      rows['hover_' + hv] = await ev(p, 'm.reliefLinesHover({ max: 40 })'); rows['hoverOwned_' + hv] = await ev(p, 'm.reliefLinesHover({ only: m.ev("provList.filter((i) => prov[i].owner)") })');
      const H1 = rows['hover_' + hv], H2 = rows['hoverOwned_' + hv]; console.log('hover', hv, H1.faintOn, H1.applicable === false ? 'n/a' : [H1.provinces, H1.pass, H1.hairMin, H1.intMin, JSON.stringify(H1.rows ? H1.rows.filter((q) => !q.pass).slice(0, 3) : [])].join(' '), 'owned', H2.applicable === false ? 'n/a' : [H2.provinces, H2.pass, H2.hairMin, H2.intMin].join(' ')); }
    await ev(p, 'm.ev("fit(); draw()")'); await p.waitForTimeout(800); rows.wildLook = await ev(p, 'm.reliefWildLook()'); console.log('wildLook', JSON.stringify(rows.wildLook)); }
  // snow, chroma, cover, design, readers at the start and at Mid, the rebake
  if (!sel || sel.includes('extra')) {
    await ev(p, 'm.ev("fit(); draw()"); m.setMonth(70)'); await p.waitForTimeout(1200);
    rows.snowNatural = await ev(p, 'm.reliefSnow("natural")'); if (look !== 'natural') rows.snowClear = await ev(p, 'm.reliefSnow("clear")');
    rows.design = await ev(p, 'm.reliefDesign()');
    if (look === 'natural') {
      rows.naturalStart = await ev(p, 'm.reliefNatural(true)'); console.log('natural@start', JSON.stringify({ chroma: rows.naturalStart.chroma.pass, chromaMax: rows.naturalStart.chroma.max, cover: [rows.naturalStart.cover.wholeMin, rows.naturalStart.cover.coreMin, rows.naturalStart.cover.copseCoreMax], snow: rows.naturalStart.snow.pass, readers: rows.naturalStart.readers.pass, N: rows.naturalStart.readers.normal, D: rows.naturalStart.readers.deutan.texture, T: rows.naturalStart.readers.tritan.texture, P: rows.naturalStart.readers.protan.texture }));
      await ev(p, 'm.setScale(1.0, 640, 480)'); await p.waitForTimeout(1500);
      rows.readersMid = await ev(p, 'm.reliefNatural(true).readers'); console.log('readers@mid', JSON.stringify({ pass: rows.readersMid.pass, N: rows.readersMid.normal, D: rows.readersMid.deutan.texture }));
      await ev(p, 'm.setScale(1.142, 700, 560)'); await p.waitForTimeout(1500);
      rows.readersRef = await ev(p, 'm.reliefNatural(true).readers'); console.log('readers@ref', JSON.stringify({ pass: rows.readersRef.pass, N: rows.readersRef.normal }));
      await ev(p, 'm.ev("fit(); draw()")'); await p.waitForTimeout(1000);
    }
    console.log('snow', JSON.stringify(rows.snowNatural.pass), rows.snowClear ? JSON.stringify(rows.snowClear.pass) : '', 'design', JSON.stringify(rows.design.reliefRulesPass));
    rows.rebake = await ev(p, 'm.reliefStable(true)'); console.log('rebake', JSON.stringify(rows.rebake));
    rows.memory = await ev(p, 'm.reliefMemory()'); rows.times = await ev(p, 'm.reliefTimes()'); if (look === 'natural') { rows.oldCap = await mev(p, "(() => { const Lk = RB.L.natural, d = Lk.img.data, LT = RB.LT, cap = RB.nwCap.cap; let n = 0, over = 0, mx = 0; for (let k = 0; k < LT.length; k += 1) { if (LT[k] !== 7) continue; const o = k * 4; if (d[o + 3] < 255) continue; n++; const L = rgb2lab([d[o], d[o + 1], d[o + 2]])[0]; if (L > cap + 0.5) over++; if (L > mx) mx = L; } return { cap, n, over, share: over / n, max: mx }; })()"); console.log('oldCap', JSON.stringify(rows.oldCap)); rows.spill = await ev(p, 'm.reliefWildSpill ? m.reliefWildSpill() : null'); console.log('spill', JSON.stringify(rows.spill)); console.log('times', JSON.stringify(rows.times)); }
  }
  rows.log = log; fs.writeFileSync(`${OUT}checks-${tag}.json`, JSON.stringify(rows, null, 1));
  console.log('pageErrors', log.pageErrors.length, JSON.stringify(log.pageErrors.slice(0, 5)), 'console', JSON.stringify(log.console.filter((x) => !/software WebGL/.test(x)).slice(0, 8)));
  await b.close();
})();
