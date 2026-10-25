// the solver's ground against the rendered land for one edge segment: node gprobe.cjs <natural|clear> <dpr> <view> <mode> <A/B> <seg> [hover:Name|select:Name]
const { launch, open, ev, mev, PAGE } = require('./lib.cjs');
const look = process.argv[2] || 'natural', dpr = Number(process.argv[3] || 1), view = process.argv[4] || 'mid', mode = process.argv[5] || 'ownership', pair = (process.argv[6] || 'Ashmoor/Elmwick').split('/'), seg = Number(process.argv[7] || 0), focus = process.argv[8] || '';
const VIEWS = { start: null, far: 'm.setScale(m.minScale(), 800, 500)', mid: 'm.setScale(1.0, 640, 480)', near: 'm.setScale(m.maxScale() * 0.8, 1180, 300)', near7: 'm.setScale(m.maxScale() * 0.8, 700, 500)' };
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] };
  const p = await open(b, process.env.PAGEFILE || PAGE, { log, dpr, settle: 1500, q: look === 'clear' ? '?terrain=clear' : '' }); await p.mouse.move(720, 895);
  if (VIEWS[view]) await ev(p, VIEWS[view]);
  if (mode !== 'ownership') { await mev(p, `setMode('${mode}')`); if (mode === 'terrain') await p.waitForFunction(() => window.__mock.look().clear, null, { timeout: 240000, polling: 300 }); }
  await p.waitForTimeout(1500);
  if (focus) { const [how, nm] = focus.split(':'); await mev(p, how === 'hover' ? `(hoverProv = names.indexOf(${JSON.stringify(nm)}), RCK = null, draw())` : `(state.sel = { type: 'prov', id: names.indexOf(${JSON.stringify(nm)}) }, RCK = null, draw())`); }
  const r = await mev(p, String.raw`(() => {
    const A = names.indexOf(${JSON.stringify(pair[0])}), B = names.indexOf(${JSON.stringify(pair[1])}), e = [...EDGE.values()].find((q) => (q.i === A && q.j === B) || (q.i === B && q.j === A));
    const land = rlRedraw(['rails', 'pieces', 'labels', 'badges', 'arrows']), W2 = canvas.width, H2 = canvas.height, at = (sx, sy) => { const X = Math.floor(sx * dpr), Y = Math.floor(sy * dpr); const k = (Y * W2 + X) * 4; return [land[k], land[k + 1], land[k + 2]]; };
    const hp = hoverProv, sp = state.sel && state.sel.type === 'prov' ? state.sel.id : -1, base = rlLineCtx(), cx = sp >= 0 ? rlCtxTinted(base, sp, true) : hp >= 0 && rlFaintOn() ? rlCtxTinted(base, hp, false) : base;
    const kind = rlEdgeKind(e, bandOf(cam.s)), st = rlSegStyles(e, kind, cx), sg = st.segs[${seg}], { nx, ny } = st;
    const [lr, ul, on] = rlGroundSides(sg.x0, sg.y0, sg.x1, sg.y1, nx, ny, cx.look, cx.lvl, cx.states), hx = (q) => q ? rgb2hex(q.slice(1).map(Math.round)) + '(' + q[0].toFixed(3) + ')' : '-';
    const qs = (a) => [0, 0.05, 0.08, 0.25, 0.5, 0.75, 0.92, 0.95, 1].map((f) => hx(rlQ(a, f)));
    const prof = []; for (const t of [0.25, 0.5, 0.75]) { const [sx, sy] = toScreen(sg.x0 + (sg.x1 - sg.x0) * t, sg.y0 + (sg.y1 - sg.y0) * t); const row = []; for (let o = -4; o <= 4; o += 0.5) row.push(o + ':' + hx([rlLumOf(...at(sx + nx * o, sy + ny * o)), ...at(sx + nx * o, sy + ny * o)])); prof.push(row.join(' ')); }
    const w = rlW(), band = (a, b2) => [0, 1, 2, 3, 4].map((k) => a + ((b2 - a) * (k + 0.5)) / 5), GB = (offs) => qs(rlGroundSides(sg.x0, sg.y0, sg.x1, sg.y1, nx, ny, cx.look, cx.lvl, cx.states, offs)[0]);
    const bands = kind === 'int' ? { kF: GB(band(0, w.ik)), pF: GB(band(w.ik, w.ik + w.ip)) } : null;
    return { bands, e: names[e.i] + '/' + names[e.j], kind, lvl: cx.lvl, tpp: RB.TX / (cam.s * dpr), TX: RB.TX, W, nseg: st.segs.length, seg: sg, lrQ: qs(lr), ulQ: qs(ul), onQ: qs(on), nLR: lr.length, nUL: ul.length, prof };
  })()`);
  console.log(JSON.stringify(r, null, 1)); console.log('pageErrors', log.pageErrors.length); await b.close();
})();
