// every window.__mock relief check (p87-p91), re-run by the verifier across views: node checksx.cjs <natural|clear|terrain> <dpr> [w] [h]
// per view: lines, rest floor lines (p90), wild edge + margins (p89/p89b), rails, means, seats, layout, hit, chips, cliff, near detail, stable, names in view, wild names (p91);
// readers (natural, every view); then hover-line checks, focus checks (p90) at 3 views, wild look, sweep, footprint, interact, start-clear, quiet cost, snow, design, rebake
const { launch, open, ev, mev, PAGE, OUT } = require('./lib.cjs'); const fs = require('fs');
const look = process.argv[2] || 'natural', dpr = Number(process.argv[3] || 1), W = Number(process.argv[4] || 1440), H = Number(process.argv[5] || 900);
const tag = `${look}${process.env.MODE ? '-' + process.env.MODE : ''}-dpr${dpr}-${W}x${H}`, phone = W < 720;
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] }, rows = {}, T0 = Date.now(); const fails = [];
  const p = await open(b, '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/fix/before/game-screen-v4.html', { log, dpr, w: W, h: H, settle: 1500, q: look === 'clear' ? '?terrain=clear' : '' });
  await p.mouse.move(W / 2, H - 4);
  if (look === 'terrain') { await mev(p, "setMode('terrain')"); await p.waitForFunction(() => window.__mock.look().clear, null, { timeout: 300000, polling: 300 }); await p.waitForTimeout(1500); }
  if (process.env.MODE) { await mev(p, `setMode('${process.env.MODE}')`); await p.waitForTimeout(1500); }
  const geo = await mev(p, '({ W, H, D: MED_DIAM, max: maxScale, min: minScale, fit: fitScale, s: cam.s, look: rlShownLook(), mode: state.mode, phone: app.classList.contains("phone") })');
  rows.geo = geo; rows.readyMs = p.__readyMs; console.log(tag, JSON.stringify(geo), 'ready', p.__readyMs);
  const byT = await mev(p, '(() => { const o = {}; for (const i of provList) { const t = terr[i]; if (!o[t] && !fogOf(i)) o[t] = [names[i], cent[i][0], cent[i][1]]; } return o; })()');
  const cx = phone ? geo.W / 2 : null;
  const VIEWS = [['start', null], ['far', `m.setScale(60 / ${geo.D}, ${geo.W / 2}, ${geo.H / 2})`], ['min', `m.setScale(m.minScale(), ${geo.W / 2}, ${geo.H / 2})`], ['mid75', 'm.setScale(0.75, 800, 500)'], ['mid', 'm.setScale(1.0, 640, 480)'], ['ref', 'm.setScale(1.142, 700, 560)'], ['refW', 'm.setScale(1.142, 300, 470)'],
    ...Object.entries(byT).map(([t, [n, x, y]]) => ['near-' + t, `m.setScale(m.maxScale() * 0.8, ${x}, ${y})`]), ['near1180', 'm.setScale(m.maxScale() * 0.8, 1180, 300)'], ['nearMax', 'm.zoomTo(m.maxScale(), "Wyrford")'], ['m40', 'm.ev("fit(); draw()"); m.setMonth(40)'], ['m40mid', 'm.setScale(1.0, 900, 500)'], ['m70', 'm.ev("fit(); draw()"); m.setMonth(70)'], ['back3', 'm.ev("fit(); draw()"); m.setMonth(3)']];
  const sel = process.env.VIEWS ? process.env.VIEWS.split(',') : null;
  const short = ['start', 'far', 'min', 'mid', 'ref', 'near-forest', 'near-swamp', 'near1180', 'nearMax', 'back3'];
  for (const [v, src] of VIEWS) {
    if (sel && !sel.includes(v)) continue;
    if ((dpr !== 1 || phone) && !short.includes(v)) continue;
    if (src) await ev(p, src); await p.waitForTimeout(1800);
    const t0 = Date.now();
    const r = await ev(p, `(() => { const o = { band: m.band(), s: +m.scale().toFixed(3), Dpx: +(m.scale() * m.ev('MED_DIAM')).toFixed(1), look: m.look().shown }; const T = (k, f) => { try { o[k] = f(); } catch (e) { o[k] = { ERR: e.message }; } };
      T('lines', () => { const L = m.reliefLines({ step: 1 }); return { hair: L.hairline, internal: L.internal, faint: L.faint, worst: L.worst, under: L.underExamples, partners: L.partners, flips: L.keylineFlipsAlongEdges, maxW: L.maxHairWidthPx, pass: L.pass }; });
      T('rest', () => m.reliefLinesRest());
      T('wildEdge', () => m.reliefWildEdge()); T('wildMargins', () => m.reliefWildMargins());
      T('rails', () => { const R = m.reliefRails(); return { samples: R.samples, fails: R.fails, worst: R.worstContrast, worstAt: R.worstAt, failList: R.failList }; });
      T('means', () => { const M = m.reliefMeans(); return M.applicable === false ? 'n/a' : { provinces: M.provinces, worstDE: M.worstDE, overBudget: M.overBudget, budget: M.budget, pairs: M.pairs }; });
      T('seats', () => m.reliefSeats()); T('layout', () => m.reliefLayout()); T('hit', () => m.reliefHit());
      T('hoverChips', () => { const HC = m.reliefHoverChips(); return { hovered: HC.hovered, namesOverAChip: HC.namesOverAChip, dayChipsOverNames: HC.dayChipsOverNames, pass: HC.pass }; });
      T('dayChips', () => m.reliefDayChips()); T('cliff', () => m.reliefCliff()); T('nearDetail', () => m.reliefNearDetail()); T('stable', () => m.reliefStable(false));
      T('namesInView', () => m.reliefNamesInView()); T('wildNames', () => m.reliefWildNames());
      return o; })()`);
    if (look === 'natural') r.readers = await ev(p, `(() => { try { const R = m.reliefNatural(true).readers; const s = (k) => R[k] ? [R[k].lightness.patchAcc, R[k].lightness.provinceAcc, R[k].texture.patchAcc, R[k].texture.provinceAcc] : null; return { Dpx: R.Dpx, views: R.views, provinces: R.provinces, pass: R.pass, farPass: R.farPass, normal: s('normal'), unexplored: [R.normal.unexplored.patchAcc, R.normal.unexplored.provinceAcc], deutan: s('deutan'), protan: s('protan'), tritan: s('tritan'), missed: R.normal.lightness.missed, missedU: R.normal.unexplored.missed, verifier: R.verifier }; } catch (e) { return { ERR: e.message }; } })()`);
    r.ms = Date.now() - t0; rows[v] = r;
    const bad = [];
    if (!r.lines.pass) bad.push('lines'); if (r.rest && r.rest.pass === false) bad.push('rest'); if (r.wildEdge.fails) bad.push('wildEdge'); if (r.wildMargins && r.wildMargins.fails) bad.push('wildMargins'); if (r.rails.fails) bad.push('rails');
    if (r.means !== 'n/a' && r.means.pairs && r.means.pairs.under2012) bad.push('meansPairs'); if (r.seats.pass === false) bad.push('seats'); if (r.hit.wrong || r.hit.cornerWrong) bad.push('hit'); if (r.hoverChips.pass === false) bad.push('hoverChips');
    if (r.dayChips.pass === false || r.dayChips.overlaps) bad.push('dayChips'); if (r.cliff.pass === false) bad.push('cliff'); if (r.stable.identical === false) bad.push('stable'); if (r.namesInView.pass === false) bad.push('namesInView'); if (r.wildNames.pass === false) bad.push('wildNames');
    if (r.layout.labelOverlaps || r.layout.labelPieceOverlaps || r.layout.pieceOverlaps) bad.push('layout');
    if (r.readers && !r.readers.ERR && r.readers.pass === false) bad.push('readers'); if (r.readers && r.readers.farPass === false) bad.push('readersFar');
    for (const k of Object.keys(r)) if (r[k] && r[k].ERR) bad.push(k + ':ERR ' + r[k].ERR);
    if (bad.length) fails.push([v, bad]);
    console.log(v, r.band, r.Dpx, bad.length ? 'FAIL ' + bad.join(',') : 'ok', '| edge', r.wildEdge.samples, r.wildEdge.fails, JSON.stringify(r.wildEdge.rim), 'marg', r.wildMargins.samples, r.wildMargins.fails, r.wildMargins.min && r.wildMargins.min.r, '| hair', r.lines.hair.min, r.lines.hair.under + '/' + r.lines.hair.samples, 'int', r.lines.internal.min, r.lines.internal.under + '/' + r.lines.internal.samples, 'faint', r.lines.faint.median, r.lines.faint.p90, r.lines.faint.max, 'rest', r.rest.samples, r.rest.min, r.rest.under,
      '| rails', r.rails.samples, r.rails.fails, r.rails.worst, '| means', JSON.stringify(r.means === 'n/a' ? 'n/a' : [r.means.provinces, r.means.worstDE, r.means.pairs.under2012, r.means.pairs.worstNormal.v, r.means.pairs.worstCvd.v, r.means.overBudget.length]),
      '| seats', r.seats.pass, '| layout', r.layout.labelOverlaps, r.layout.labelPieceOverlaps, r.layout.pieceOverlaps, 'names', r.layout.names, '| hit', r.hit.wrong, r.hit.cornerWrong, '| chips', r.hoverChips.namesOverAChip, r.dayChips.overlaps, r.dayChips.pass, '| cliff', r.cliff.visible ? [r.cliff.stripeIndex, r.cliff.lightStreaksPer100px, r.cliff.faceL && r.cliff.faceL.spread].join('/') : '-',
      '| inview', r.namesInView.pass, r.namesInView.cut && r.namesInView.cut.length, '| wnames', r.wildNames.pass, JSON.stringify(r.wildNames.unnamed), '| stable', r.stable.identical, r.readers ? '| readers ' + JSON.stringify([r.readers.pass, r.readers.farPass, r.readers.normal, r.readers.unexplored, r.readers.views]) : '', r.ms + 'ms');
  }
  if (!sel || sel.includes('hover')) {
    for (const [hv, src] of [['start', 'm.ev("fit(); draw()")'], ['mid', 'm.setScale(1.0, 640, 480)'], ['near', 'm.setScale(m.maxScale() * 0.8, 700, 500)'], ['near1180', 'm.setScale(m.maxScale() * 0.8, 1180, 300)']]) { await ev(p, src); await p.waitForTimeout(1500);
      rows['hover_' + hv] = await ev(p, 'm.reliefLinesHover({ max: 200 })'); const H1 = rows['hover_' + hv];
      rows['focus_' + hv] = await ev(p, 'm.reliefLinesFocus()'); const F = rows['focus_' + hv];
      if (H1.applicable !== false && !H1.pass) fails.push(['hover_' + hv, H1.hairMin, H1.intMin]); if (!F.pass) fails.push(['focus_' + hv, F.hover.failing, F.select.failing]);
      console.log('hover', hv, H1.applicable === false ? 'n/a' : [H1.provinces, H1.pass, H1.hairMin, H1.intMin].join(' '), '| focus', F.provinces, 'hover', JSON.stringify([F.hover.samples, F.hover.min, F.hover.under]), 'select', JSON.stringify([F.select.samples, F.select.min, F.select.under]), F.pass, F.ms + 'ms'); }
    await ev(p, 'm.ev("fit(); draw()")'); await p.waitForTimeout(800); rows.wildLook = await ev(p, 'm.reliefWildLook()'); console.log('wildLook', JSON.stringify(rows.wildLook).slice(0, 900)); if (rows.wildLook.pass === false) fails.push(['wildLook']);
  }
  if (!sel || sel.includes('extra')) {
    rows.startClear = await ev(p, 'm.reliefStartClear()'); console.log('startClear', JSON.stringify(rows.startClear)); if (!rows.startClear.pass) fails.push(['startClear']);
    rows.footprint = await ev(p, 'm.reliefWildFootprint()'); rows.interact = await ev(p, 'm.reliefWildInteract()'); console.log('footprint', JSON.stringify(rows.footprint), 'interact', JSON.stringify(rows.interact));
    if (rows.footprint.pass === false) fails.push(['footprint']); if (!rows.interact.pass) fails.push(['interact']);
    const t1 = Date.now(); rows.sweep = await ev(p, 'm.reliefWildSweep()'); rows.sweepMs = Date.now() - t1; const S = rows.sweep;
    console.log('sweep', JSON.stringify({ applicable: S.applicable, views: S.views, samples: S.samples, fails: S.fails, under110: S.samplesUnder110, min: S.minRatio, worst: S.worst, pans: S.pans, pass: S.pass }), rows.sweepMs + 'ms'); if (!S.pass) fails.push(['sweep']);
    rows.quietCost = await ev(p, 'm.reliefQuietCost()'); console.log('quietCost', JSON.stringify(rows.quietCost));
    await ev(p, 'm.ev("fit(); draw()"); m.setMonth(70)'); await p.waitForTimeout(1200);
    rows.snowNatural = await ev(p, 'm.reliefSnow("natural")'); if (look !== 'natural') rows.snowClear = await ev(p, 'm.reliefSnow("clear")');
    rows.design = await ev(p, 'm.reliefDesign()');
    if (look === 'natural') { rows.naturalStart = await ev(p, 'm.reliefNatural(false)'); console.log('natural@m70', JSON.stringify({ chroma: rows.naturalStart.chroma.pass, chromaMax: rows.naturalStart.chroma.max, cover: rows.naturalStart.cover.pass, snow: rows.naturalStart.snow.pass })); if (rows.naturalStart.chroma.pass === false || rows.naturalStart.snow.pass === false) fails.push(['natural@m70']); }
    console.log('snow', JSON.stringify(rows.snowNatural.pass), rows.snowClear ? JSON.stringify(rows.snowClear.pass) : '', 'design', JSON.stringify(rows.design.reliefRulesPass));
    await ev(p, 'm.ev("fit(); draw()"); m.setMonth(3)'); await p.waitForTimeout(1000);
    rows.rebake = await ev(p, 'm.reliefStable(true)'); console.log('rebake', JSON.stringify(rows.rebake)); if (rows.rebake.identical === false || (rows.rebake.bake && rows.rebake.bake.identical === false)) fails.push(['rebake']);
    rows.memory = await ev(p, 'm.reliefMemory()'); rows.times = await ev(p, 'm.reliefTimes()'); console.log('times', JSON.stringify({ bakeCpu: rows.times.bakeCpuMs, bakeWall: rows.times.bakeWallMs, nat: rows.times.naturalStepsMs, clear: rows.times.clearStepsMs, staticMsMean: rows.times.staticMsMean }));
  }
  rows.log = log; rows.fails = fails; rows.totalMin = +((Date.now() - T0) / 60000).toFixed(1); fs.writeFileSync(`${OUT}checksx-${tag}.json`, JSON.stringify(rows, null, 1));
  console.log('FAILS', JSON.stringify(fails)); console.log('pageErrors', log.pageErrors.length, JSON.stringify(log.pageErrors.slice(0, 5)), 'console', JSON.stringify(log.console.filter((x) => !/software WebGL|willReadFrequently/.test(x)).slice(0, 8)), 'min', rows.totalMin);
  await b.close();
})();
