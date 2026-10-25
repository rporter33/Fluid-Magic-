// the owner's line decision (2026-10-23) on rendered pixels, with real pointer hover and click: node lines.cjs <natural|clear|terrain> <dpr> [w h]
// per view: at rest (no hover, no province selected), one unowned province hovered, one owned province selected, both at once
const { launch, open, ev, mev, PAGE, OUT } = require('./lib.cjs'); const { LP } = require('./lp.cjs'); const fs = require('fs');
const look = process.argv[2] || 'natural', dpr = Number(process.argv[3] || 1), W = Number(process.argv[4] || 1440), H = Number(process.argv[5] || 900);
const tag = `${look}-dpr${dpr}-${W}x${H}`;
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] }, out = {};
  const p = await open(b, PAGE, { log, dpr, w: W, h: H, settle: 1500, q: look === 'clear' ? '?terrain=clear' : '' });
  const mk = (f, a) => p.evaluate(f, a);
  const away = async () => { await p.mouse.move(W / 2, 30); await p.waitForTimeout(350); };
  if (look === 'terrain') { await mev(p, "setMode('terrain')"); await p.waitForFunction(() => window.__mock.look().clear, null, { timeout: 240000, polling: 300 }); await p.waitForTimeout(1500); }
  await away(); await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
  const VIEWS = [['start', null], ['far', 'm.setScale(m.minScale(), 800, 500)'], ['mid', 'm.setScale(1.0, 640, 480)'], ['ref', 'm.setScale(1.142, 700, 560)'], ['near', 'm.setScale(m.maxScale() * 0.8, 700, 500)']];
  // the province to hover: unowned, most neutral edges in view; to select: owned, most internal edges in view; a point on it that the map receives
  const PICK = String.raw`(() => { const v = viewRect(), r = canvas.getBoundingClientRect(); const inV = (i) => { const [x, y] = toScreen(...cent[i]); return x > v.l + 60 && x < v.r - 60 && y > v.t + 60 && y < v.b - 60; };
    const cnt = (i, k) => { let n = 0; for (const [, e] of EDGE) { if (e.i !== i && e.j !== i) continue; const j = e.i === i ? e.j : e.i; if (isWild(j)) continue; const oi = prov[i].owner, oj = prov[j] ? prov[j].owner : null; if (k === 'neutral' ? !oi && !oj : oi && oi === oj) n++; } return n; };
    const spot = (i) => { const [cx, cy] = toScreen(...cent[i]); for (const [dx, dy] of [[0, 14], [0, -14], [14, 0], [-14, 0], [10, 20], [-10, 20], [0, 26]]) { const x = cx + dx, y = cy + dy; const el = document.elementFromPoint(r.left + x, r.top + y); if (el && el.id === 'map' && provinceAt(...toWorld(x, y)) === i) return [r.left + x, r.top + y]; } return null; };
    const un = provList.filter((i) => inV(i) && !prov[i].owner && !fogOf(i) && !isWild(i)).sort((a, b) => cnt(b, 'neutral') - cnt(a, 'neutral')).filter((i) => spot(i));
    const ow = provList.filter((i) => inV(i) && prov[i].owner && !isWild(i)).sort((a, b) => cnt(b, 'internal') - cnt(a, 'internal')).filter((i) => spot(i));
    return { hov: un.length ? [un[0], names[un[0]], cnt(un[0], 'neutral'), spot(un[0])] : null, sel: ow.length ? [ow[0], names[ow[0]], cnt(ow[0], 'internal'), spot(ow[0])] : null }; })()`;
  const brief = (r) => ({ hover: r.hover, sel: r.sel, focusNeutral: r.focusNeutral, focusInternal: r.focusInternal, otherNeutral: r.otherNeutral, otherInternal: r.otherInternal, realm: r.realm, focusUnder: r.focusUnder.slice(0, 6), otherBright: r.otherBright.slice(0, 6) });
  const line = (k, r) => console.log(tag, k, r.band, r.Dpx, 'hov', r.hover, 'sel', r.sel, '| focusN', JSON.stringify([r.focusNeutral.edges, r.focusNeutral.minOfMins, r.focusNeutral.medianOfMedians, r.focusNeutral.samplesUnderFloor + '/' + r.focusNeutral.samples]), 'focusI', JSON.stringify([r.focusInternal.edges, r.focusInternal.minOfMins, r.focusInternal.medianOfMedians, r.focusInternal.samplesUnderFloor + '/' + r.focusInternal.samples]),
    '| otherN', JSON.stringify([r.otherNeutral.edges, r.otherNeutral.medianOfMedians, r.otherNeutral.p90OfMedians, r.otherNeutral.maxOfMax, 'under', r.otherNeutral.samplesUnderFloor + '/' + r.otherNeutral.samples]), 'otherI', JSON.stringify([r.otherInternal.edges, r.otherInternal.medianOfMedians, r.otherInternal.p90OfMedians, r.otherInternal.maxOfMax, 'under', r.otherInternal.samplesUnderFloor + '/' + r.otherInternal.samples]),
    '| realm', JSON.stringify([r.realm.edges, r.realm.minOfMins, r.realm.medianOfMedians]), r.focusUnder.length ? 'FOCUS-UNDER ' + r.focusUnder.slice(0, 4).join('; ') : '', r.otherBright.length ? 'OTHER-BRIGHT ' + r.otherBright.slice(0, 4).join('; ') : '');
  for (const [v, src] of VIEWS) {
    if (src) await ev(p, src); await away(); await p.keyboard.press('Escape'); await p.keyboard.press('Escape'); await p.waitForTimeout(1500);
    const pk = await mev(p, PICK); const o = { pick: pk };
    const rest = await mev(p, LP([])); o.rest = brief(rest); line(v + ':rest', rest);
    if (pk.hov) { await p.mouse.move(pk.hov[3][0], pk.hov[3][1], { steps: 4 }); await p.waitForTimeout(700); const hv = await mev(p, 'hoverProv'); const r = await mev(p, LP([hv])); o.hover = { want: pk.hov[1], got: r.hover, ...brief(r) }; line(v + ':hover', r); await away(); }
    if (pk.sel) { await p.mouse.click(pk.sel[3][0], pk.sel[3][1]); await p.waitForTimeout(500); await away(); const sid = await mev(p, 'state.sel && state.sel.type === "prov" ? state.sel.id : -1'); const r = await mev(p, LP([sid])); o.select = { want: pk.sel[1], ...brief(r) }; line(v + ':select', r);
      if (pk.hov) { await p.mouse.move(pk.hov[3][0], pk.hov[3][1], { steps: 4 }); await p.waitForTimeout(700); const hv = await mev(p, 'hoverProv'); const r2 = await mev(p, LP([hv, sid])); o.both = brief(r2); line(v + ':both', r2); await away(); }
      await p.keyboard.press('Escape'); await p.keyboard.press('Escape'); await p.waitForTimeout(300); }
    out[v] = o;
  }
  out.log = log; fs.writeFileSync(`${OUT}lines-${tag}.json`, JSON.stringify(out, null, 1));
  console.log('pageErrors', log.pageErrors.length, JSON.stringify(log.pageErrors.slice(0, 3)));
  await b.close();
})();
