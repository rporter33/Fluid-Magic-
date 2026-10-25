// the verifier's own probes (vrprobe.js): wild edge, rails, distinct colours over many views, my own random cameras, months, and real-pointer hover/selection beside the wilds
// node vprobe.cjs <natural|clear|terrain|mode:<m>> <dpr> [pagefile tag]
const { launch, open, ev, mev, PAGE, OUT } = require('./lib.cjs'); const fs = require('fs');
const lookArg = process.argv[2] || 'natural', dpr = Number(process.argv[3] || 1), file = process.argv[4] || PAGE, ftag = process.argv[5] || 'main', W = Number(process.env.W || 1440), H = Number(process.env.H || 900);
const tag = `${ftag}${process.env.END ? "-end" + process.env.END : ""}-${lookArg.replace(':', '_')}-dpr${dpr}-${W}x${H}`, CODE = fs.readFileSync(__dirname + '/vrprobe.js', 'utf8');
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] }, out = { views: [] }, T0 = Date.now();
  const p = await open(b, file, { log, dpr, w: W, h: H, settle: 1500, q: lookArg === 'clear' ? '?terrain=clear' : '' }); await p.mouse.move(W / 2, H - 3);
  const mode = lookArg.startsWith('mode:') ? lookArg.slice(5) : lookArg === 'terrain' ? 'terrain' : null;
  if (mode) { await mev(p, `setMode('${mode}')`); if (mode === 'terrain') await p.waitForFunction(() => window.__mock.look().clear, null, { timeout: 300000, polling: 300 }); await p.waitForTimeout(1500); }
  await mev(p, CODE);
  const G = await mev(p, '({ D: MED_DIAM, min: minScale, max: maxScale, W, H, wilds: WILDS.map((w) => { let x = 0, y = 0; for (const c of w.cells) { x += cent[c][0]; y += cent[c][1]; } return [w.name, x / w.cells.length, y / w.cells.length]; }) })');
  let sd = 77031 + dpr; const rnd = () => { sd = (Math.imul(sd, 48271) + 12345) >>> 0; return sd / 4294967296; };
  const V = [['start', 'm.ev("fit(); RCK = null; draw()")'], ['far', `m.setScale(60 / ${G.D}, ${G.W / 2}, ${G.H / 2})`], ['min', `m.setScale(m.minScale(), ${G.W / 2}, ${G.H / 2})`], ['mid', 'm.setScale(1.0, 640, 480)'], ['ref', 'm.setScale(1.142, 700, 560)'], ['near1180', 'm.setScale(m.maxScale() * 0.8, 1180, 300)']];
  G.wilds.forEach(([nm, x, y], k) => { V.push([`w${k}mid`, `m.setScale(1.0, ${x}, ${y})`], [`w${k}near`, `m.setScale(m.maxScale() * 0.55, ${x}, ${y})`], [`w${k}max`, `m.setScale(m.maxScale(), ${x}, ${y})`]); });
  const NR = Number(process.env.NR || (lookArg === 'natural' ? 36 : 8));
  for (let k = 0; k < NR; k++) { const [nm, x, y] = G.wilds[k % G.wilds.length], f = rnd(), s = G.min * Math.pow(G.max / G.min, f), ox = (rnd() - 0.5) * 1.4 * G.D, oy = (rnd() - 0.5) * 1.4 * G.D, px = rnd() * 0.97, py = rnd() * 0.89; V.push([`r${k}-${nm.replace('The ', '')}`, `m.setScale(${s}, ${x + ox + px / s}, ${y + oy + py / s})`]); }
  V.push(['m40', 'm.ev("fit(); RCK = null; draw()"); m.setMonth(40)'], ['m40mid', 'm.setScale(1.0, 900, 500)'], ['m70', 'm.ev("fit(); RCK = null; draw()"); m.setMonth(70)'], ['m70w0', `m.setScale(m.maxScale() * 0.55, ${G.wilds[0][1]}, ${G.wilds[0][2]})`], ['back3', 'm.ev("fit(); RCK = null; draw()"); m.setMonth(3)']);
  const agg = { wild: { n: 0, fails: 0, minR: Infinity }, wildAlt: {}, rails: { n: 0, fails: 0, minR: Infinity }, distinct: { pairs: 0, under: 0, worst: Infinity } };
  const note = (r) => { const R = r.wild.rule; agg.wild.n += R.n; agg.wild.fails += R.fails; if (R.minR != null && R.minR < agg.wild.minR) { agg.wild.minR = R.minR; agg.wild.minAt = r.view + ' ' + R.minAt; } for (const k of ['near', 'deep', 'wide']) { const a = (agg.wildAlt[k] ??= { n: 0, fails: 0, minR: Infinity }); a.n += r.wild[k].n; a.fails += r.wild[k].fails; if (r.wild[k].minR != null && r.wild[k].minR < a.minR) { a.minR = r.wild[k].minR; a.minAt = r.view + ' ' + r.wild[k].minAt; } } };
  for (const [v, src] of V) {
    await ev(p, src); await p.waitForTimeout(v.startsWith('r') ? 700 : 1300);
    const r = { view: v, wild: await mev(p, `__vr.wild({ endClear: ${Number(process.env.END || 3)} })`) }; note(r);
    if (!v.startsWith('r') || lookArg !== 'natural') { r.rails = await mev(p, '__vr.rails()'); agg.rails.n += r.rails.samples; agg.rails.fails += r.rails.fails; if (r.rails.minR != null && r.rails.minR < agg.rails.minR) { agg.rails.minR = r.rails.minR; agg.rails.minAt = v + ' ' + r.rails.minAt; } }
    if (lookArg !== 'natural' && !v.startsWith('r')) { r.distinct = await mev(p, '__vr.distinct()'); agg.distinct.pairs += r.distinct.pairs; agg.distinct.under += r.distinct.under; if (r.distinct.worst.r < agg.distinct.worst) { agg.distinct.worst = r.distinct.worst.r; agg.distinct.worstAt = v + ' ' + JSON.stringify(r.distinct.worst); } }
    out.views.push(r);
    console.log(v, r.wild.band, r.wild.Dpx, 'wild', r.wild.samples, 'rule', r.wild.rule.fails + '/' + r.wild.rule.n, r.wild.rule.minR, 'alt', ['near', 'deep', 'wide'].map((k) => r.wild[k].fails + '/' + r.wild[k].n + '@' + r.wild[k].minR).join(' '), 'light', r.wild.lightElementShare, r.wild.rule.fails ? JSON.stringify(r.wild.rule.ex.slice(0, 3)) : '',
      r.rails ? `| rails ${r.rails.fails}/${r.rails.samples} min ${r.rails.minR} ${r.rails.fails ? JSON.stringify(r.rails.ex.slice(0, 3)) : ''}` : '', r.distinct ? `| distinct ${r.distinct.provinces} prov, ${r.distinct.under}/${r.distinct.pairs} under (adj ${r.distinct.adjacentUnder}/${r.distinct.adjacentPairs}) worst n ${r.distinct.worstNormal} cvd ${r.distinct.worstCvd} ${JSON.stringify(r.distinct.worst)}` : '');
  }
  // real pointer: hover every wild neighbour (a point 14 px from the outline, on the neighbour), then select it, at three zooms; the wild test and the rails while it is hovered / selected
  if (process.env.HOVER !== '0') {
    out.hovers = []; const hz = [['start', 'm.ev("fit(); RCK = null; draw()")'], ['mid', 'm.setScale(1.0, 640, 480)']]; G.wilds.forEach(([nm, x, y], k) => hz.push([`w${k}near`, `m.setScale(m.maxScale() * 0.55, ${x}, ${y})`]));
    for (const [v, src] of hz) { await ev(p, src); await p.mouse.move(W / 2, H - 3); await p.waitForTimeout(1200);
      const spots = await mev(p, `(() => { const r = canvas.getBoundingClientRect(), vv = viewRect(), out = [], seen = new Set(); for (const w of WILDS) for (const e of rlWildOutline(w)) { if (isWild(e.j) || seen.has(e.j)) continue; const [ax, ay] = toScreen(...e.a), [bx, by] = toScreen(...e.b), Lg = Math.hypot(bx - ax, by - ay); if (Lg < 20) continue; let nx = -(by - ay) / Lg, ny = (bx - ax) / Lg; const mx = (ax + bx) / 2, my = (ay + by) / 2; if (provinceAt(...toWorld(mx + nx * 8, my + ny * 8)) !== e.j) { nx = -nx; ny = -ny; } for (const o of [14, 20, 28]) { const x = mx + nx * o, y = my + ny * o; if (x < vv.l + 20 || x > vv.r - 20 || y < vv.t + 20 || y > vv.b - 20) continue; const el = document.elementFromPoint(r.left + x, r.top + y); if (el && el.id === 'map' && provinceAt(...toWorld(x, y)) === e.j) { out.push([e.j, names[e.j], r.left + x, r.top + y, w.name]); seen.add(e.j); break; } } } return out; })()`);
      for (const [j, nm, x, y, wn] of spots) {
        await p.mouse.move(x, y, { steps: 3 }); await p.waitForTimeout(450); const hv = await mev(p, 'hoverProv >= 0 ? names[hoverProv] : null');
        const rw = await mev(p, `__vr.wild({ endClear: ${Number(process.env.END || 3)} })`); const rr = await mev(p, '__vr.rails()');
        await p.mouse.click(x, y); await p.waitForTimeout(500); await p.mouse.move(W / 2, H - 3); await p.waitForTimeout(400); const sl = await mev(p, 'state.sel && state.sel.type === "prov" ? names[state.sel.id] : null');
        const sw = await mev(p, `__vr.wild({ endClear: ${Number(process.env.END || 3)} })`); const sr = await mev(p, '__vr.rails()');
        await p.keyboard.press('Escape'); await p.keyboard.press('Escape'); await p.waitForTimeout(200);
        const row = { view: v, wild: wn, prov: nm, hovered: hv, selected: sl, hover: [rw.rule.fails, rw.rule.n, rw.rule.minR, rw.rule.minAt], hoverRails: [rr.fails, rr.samples, rr.minR], select: [sw.rule.fails, sw.rule.n, sw.rule.minR, sw.rule.minAt], selectRails: [sr.fails, sr.samples, sr.minR], ex: [...rw.rule.ex, ...sw.rule.ex].slice(0, 3) };
        out.hovers.push(row); agg.wild.n += rw.rule.n + sw.rule.n; agg.wild.fails += rw.rule.fails + sw.rule.fails; agg.rails.n += rr.samples + sr.samples; agg.rails.fails += rr.fails + sr.fails;
        for (const q of [rw, sw]) if (q.rule.minR != null && q.rule.minR < agg.wild.minR) { agg.wild.minR = q.rule.minR; agg.wild.minAt = `${v} focus ${nm}: ${q.rule.minAt}`; }
        console.log('focus', v, wn, nm, 'hov', hv, 'sel', sl, 'wild hover', row.hover.slice(0, 3).join(' '), 'select', row.select.slice(0, 3).join(' '), '| rails', row.hoverRails.join(' '), row.selectRails.join(' '), (rw.rule.fails || sw.rule.fails) ? JSON.stringify(row.ex) : '');
      } }
  }
  out.agg = agg; out.pageErrors = log.pageErrors; out.min = +((Date.now() - T0) / 60000).toFixed(1); fs.writeFileSync(`${OUT}vprobe-${tag}.json`, JSON.stringify(out, null, 1));
  console.log('AGG', JSON.stringify(agg)); console.log('pageErrors', log.pageErrors.length, JSON.stringify(log.pageErrors.slice(0, 3)), 'min', out.min); await b.close();
})();
