// targeted probes of the AD fixes: the Ownership caption, link hover names, names and hamlets by zoom, the Near detail gate, Space, window sizes
const { launch, open, ev, mev, PAGE, OUT, SHOTS } = require('./lib.cjs'); const fs = require('fs');
(async () => {
  const b = await launch(), R = {};
  { const log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, PAGE, { log, settle: 1500 }); const mk = (f, a) => p.evaluate(f, a);
    const cap = () => mk(() => { const el = document.querySelector('#modes .legend'); if (!el) return null; const cs = getComputedStyle(el); return { cls: el.className, op: cs.opacity, vis: cs.visibility, disp: cs.display, text: el.textContent.slice(0, 60) }; });
    // (a) the Ownership caption: after a mode change, 4 s later, on hover of the button
    await p.click('.modebtn[data-m="supply"]'); await p.mouse.move(700, 60); await p.waitForTimeout(300); await p.click('.modebtn[data-m="ownership"]'); await p.mouse.move(700, 60);
    const c = {}; for (const t of [300, 3500, 4600, 6000]) { await p.waitForTimeout(t - (Object.keys(c).length ? [300, 3500, 4600, 6000][Object.keys(c).length - 1] : 0)); c['t' + t] = await cap(); }
    const ob = await p.$('.modebtn[data-m="ownership"]'); await ob.hover(); await p.waitForTimeout(400); c.hover = await cap(); await p.mouse.move(700, 60); await p.waitForTimeout(600); c.afterLeave = await cap(); R.caption = c;
    await p.screenshot({ path: SHOTS + 'probe-caption-after-6s.png' });
    // (d, e) names and hamlets by province size on screen
    const z = []; for (const dpx of [150, 179, 181, 200, 219, 221, 250, 279, 281, 300, 319, 321, 360]) { await ev(p, `m.setScale(${dpx} / m.ev('MED_DIAM'), 800, 520)`); await p.waitForTimeout(500);
      z.push(await mev(p, `(() => { RCK = null; draw(); const lay = RL_PIECE_CACHE.get('L'); const kinds = {}; for (const [, st] of lay.seats) if (st.kind) kinds[st.kind] = (kinds[st.kind] || 0) + 1; const v = viewRect(); const inView = provList.filter((i) => { const [x, y] = toScreen(...cent[i]); return x > v.l && x < v.r && y > v.t && y < v.b; }); const named = new Set(lay.labels.map((l) => l.i)); const why = inView.filter((i) => named.has(i)).map((i) => (prov[i].cap ? 'cap' : prov[i].well ? 'well' : rlIsTown(i) ? 'town' : 'other')); const unnamedTowns = inView.filter((i) => !named.has(i) && (prov[i].cap || prov[i].well || rlIsTown(i))).map((i) => names[i]);
        return { Dpx: ${dpx}, band: bandOf(cam.s), inView: inView.length, named: inView.filter((i) => named.has(i)).length, namedKinds: why.reduce((o, k) => ((o[k] = (o[k] || 0) + 1), o), {}), unnamedCapsTownsWells: unnamedTowns, seats: kinds, nearDetail: +rlNearK().toFixed(3), texelCss: +(cam.s * RB.TX).toFixed(2) }; })()`)); }
    R.byZoom = z; z.forEach((q) => console.log('zoom', JSON.stringify(q)));
    // (b) a link's province is named on the land while hovered
    await ev(p, 'm.ev("fit(); draw()")'); await p.waitForTimeout(400);
    R.link = await (async () => { await mk(() => { const f = document.getElementById('railFeed'); f && f.click(); }); await p.waitForTimeout(400); const L = await mk(() => [...document.querySelectorAll('[data-go]')].filter((e) => e.getBoundingClientRect().width > 0).slice(0, 4).map((e) => { const r = e.getBoundingClientRect(); return [r.left + Math.min(8, r.width / 2), r.top + r.height / 2, e.textContent.trim().slice(0, 24), Number(e.dataset.go)]; })); const out = [];
      for (const [x, y, t, go] of L) { await p.mouse.move(x, y); await p.waitForTimeout(450); out.push({ text: t, link: await mev(p, 'RL_LINK.prov'), want: go, namedOnLand: await mev(p, `RL_PIECE_CACHE.get('L').labels.some((l) => l.i === ${go}) || (RL_LIVE.list || []).some((q) => q.i === ${go})`) }); } return { links: L.length, out }; })();
    console.log('link', JSON.stringify(R.link));
    // (h) Space with nothing focused toggles pause; on a focused piece it selects
    await p.mouse.move(700, 60); await p.keyboard.press('Escape'); await mk(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    const s0 = await mev(p, 'state.paused'); await p.keyboard.press('Space'); await p.waitForTimeout(200); const s1 = await mev(p, 'state.paused'); await p.keyboard.press('Space'); await p.waitForTimeout(200); const s2 = await mev(p, 'state.paused');
    R.space = { before: s0, afterOne: s1, afterTwo: s2 }; console.log('space', JSON.stringify(R.space));
    R.consts = await mev(p, '({ hamletDpx: RL_P.hamletDpx, hamletFadePx: RL_P.hamletFadePx, allNamesDpx: RL_P.allNamesDpx, cap: RL_NAT.cap, bevel: RL_P.bevel, nearDetail: RL_P.nearDetail, startDpx: RL_P.startDpx, field: RL_NAT.field })'); console.log('consts', JSON.stringify(R.consts));
    R.pageErrors = log.pageErrors; await p.context().close(); }
  // (g) the start view at window sizes, a move planned and the view leaned back to Far: chips and names against the ribbon
  R.sizes = [];
  for (const [w, h] of [[1024, 768], [1280, 720], [1366, 768], [1440, 900], [1920, 1080], [390, 844]]) {
    const log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, PAGE, { log, w, h, settle: 1500 }); await p.mouse.move(w / 2, h - 4);
    const s = await mev(p, '({ band: bandOf(cam.s), Dpx: +(cam.s * MED_DIAM).toFixed(1), s: +cam.s.toFixed(3), fit: +fitScale.toFixed(3), capOnScreen: (() => { const [x, y] = toScreen(...cent[redCap]); const v = viewRect(); return x > v.l && x < v.r && y > v.t && y < v.b; })(), phone: app.classList.contains("phone") })');
    const lay = await ev(p, '(() => { const y = m.reliefLayout(); return { names: y.names, under: y.namesUnderRibbon, ll: y.labelOverlaps, lp: y.labelPieceOverlaps, pp: y.pieceOverlaps }; })()');
    await p.screenshot({ path: `${SHOTS}size-${w}x${h}-start.png` });
    await mev(p, "selectCmd('varo')"); const t = await ev(p, 'm.across()'); const [x, y] = await ev(p, `m.at(${JSON.stringify(t)})`); await p.mouse.click(x, y + 8, { button: 'right' }); await p.waitForTimeout(600);
    const chipsStart = await ev(p, 'm.reliefDayChips()'); await p.mouse.move(w / 2, h / 2); for (let k = 0; k < 12; k++) { await p.mouse.wheel(0, 240); await p.waitForTimeout(60); } await p.waitForTimeout(500);
    const chipsFar = await ev(p, 'm.reliefDayChips()'), layFar = await ev(p, '(() => { const y = m.reliefLayout(); return { band: y.band, names: y.names, under: y.namesUnderRibbon, ll: y.labelOverlaps, lp: y.labelPieceOverlaps }; })()');
    await p.screenshot({ path: `${SHOTS}size-${w}x${h}-far-move.png` });
    const row = { size: `${w}x${h}`, ...s, layout: lay, chipsStart: [chipsStart.chips, chipsStart.overlaps, chipsStart.examples], chipsFar: [chipsFar.chips, chipsFar.overlaps, chipsFar.examples], layFar, pageErrors: log.pageErrors.length };
    R.sizes.push(row); console.log('size', JSON.stringify(row)); await p.context().close();
  }
  fs.writeFileSync(OUT + 'probes.json', JSON.stringify(R, null, 1)); console.log('caption', JSON.stringify(R.caption)); await b.close();
})();
