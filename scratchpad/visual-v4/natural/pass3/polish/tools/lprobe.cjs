// diagnose line-floor failures: node lprobe.cjs <natural|clear> <dpr> <view> <mode> [hover:Name|select:Name]
// prints the page's reliefLines summary and, for each failing sample, the pixel profile across the line (lines / land) and the solved style of its segment
const { launch, open, ev, mev, PAGE } = require('./lib.cjs');
const look = process.argv[2] || 'natural', dpr = Number(process.argv[3] || 1), view = process.argv[4] || 'near', mode = process.argv[5] || 'ownership', focus = process.argv[6] || '';
const VIEWS = { start: null, far: 'm.setScale(m.minScale(), 800, 500)', mid: 'm.setScale(1.0, 640, 480)', near: 'm.setScale(m.maxScale() * 0.8, 1180, 300)', near7: 'm.setScale(m.maxScale() * 0.8, 700, 500)', ref: 'm.setScale(1.142, 700, 560)' };
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] };
  const p = await open(b, process.env.PAGEFILE || PAGE, { log, dpr, settle: 1500, q: look === 'clear' ? '?terrain=clear' : '' }); await p.mouse.move(720, 895);
  if (VIEWS[view]) await ev(p, VIEWS[view]);
  if (mode !== 'ownership') { await mev(p, `setMode('${mode}')`); if (mode === 'terrain') await p.waitForFunction(() => window.__mock.look().clear, null, { timeout: 240000, polling: 300 }); }
  await p.waitForTimeout(1500);
  if (focus) { const [how, nm] = focus.split(':'); await mev(p, how === 'hover' ? `(hoverProv = names.indexOf(${JSON.stringify(nm)}), RCK = null, draw())` : `(state.sel = { type: 'prov', id: names.indexOf(${JSON.stringify(nm)}) }, RCK = null, draw())`); }
  const r = await mev(p, String.raw`(() => {
    const land = rlRedraw(['rails', 'pieces', 'labels', 'badges', 'arrows']), lines = rlRedraw(['pieces', 'labels', 'badges', 'arrows']), W2 = canvas.width, H2 = canvas.height, v = viewRect();
    const at = (d, sx, sy) => { const X = Math.floor(sx * dpr), Y = Math.floor(sy * dpr); if (X < 0 || Y < 0 || X >= W2 || Y >= H2) return null; const k = (Y * W2 + X) * 4; return [d[k], d[k + 1], d[k + 2]]; };
    const ctxL = rlLineCtx(), band = bandOf(cam.s), fails = [], hp = hoverProv, sp = state.sel && state.sel.type === 'prov' ? state.sel.id : -1, foc = new Set([hp, sp].filter((x) => x >= 0)); let n = 0;
    for (const [, e] of EDGE) {
      const kind = rlEdgeKind(e, band); if (!kind || (fogOf(e.i) && fogOf(e.j))) continue; if (foc.size && !foc.has(e.i) && !foc.has(e.j)) continue;
      const faint = rlFaintOn() && !foc.has(e.i) && !foc.has(e.j); if (faint) continue;
      const cx = foc.size ? rlCtxTinted(ctxL, sp >= 0 ? sp : hp, sp >= 0) : ctxL, st = rlSegStyles(e, kind, cx), { nx, ny } = st, offs = kind === 'hair' ? [-3, 3] : [0, 6], lim = kind === 'hair' ? 2.3 : 3.2;
      const [ea, eb] = [toScreen(...e.a), toScreen(...e.b)];
      const Lg = Math.hypot(eb[0] - ea[0], eb[1] - ea[1]);
      for (let q = 4; q <= Lg - 4; q += 1) { const t = q / Lg, sx = ea[0] + (eb[0] - ea[0]) * t, sy = ea[1] + (eb[1] - ea[1]) * t; if (sx < v.l + 8 || sx > v.r - 8 || sy < v.t + 8 || sy > v.b - 8) continue;
        const si = Math.min(st.segs.length - 1, Math.floor(t * st.segs.length)), sg = st.segs[si];
        let bst = 0; const prof = []; for (let o = offs[0]; o <= offs[1]; o += 0.5) { const a = at(lines, sx + nx * o, sy + ny * o), c = at(land, sx + nx * o, sy + ny * o); if (a && c) { const w = rlWcag(a, c); bst = Math.max(bst, w); prof.push(o + ':' + rgb2hex(a) + '/' + rgb2hex(c) + '=' + w.toFixed(2)); } }
        n++; if (bst < lim) fails.push({ e: names[e.i] + '/' + names[e.j], kind, own: prov[e.i].owner ?? '', si, nseg: st.segs.length, t: +t.toFixed(3), sx: +sx.toFixed(1), sy: +sy.toFixed(1), best: +bst.toFixed(3), key: sg.key, alpha: sg.alpha, partner: sg.partner, bevel: sg.bevel, order: st.order, nx: +nx.toFixed(2), ny: +ny.toFixed(2), prof: prof.join(' ') }); }
    }
    return { look: rlShownLook(), mode: state.mode, band, dpr, s: cam.s, n, nFail: fails.length, fails: fails.slice(0, Number(${JSON.stringify(process.env.MAXF || '12')})), byEdge: Object.entries(fails.reduce((a, f) => ((a[f.e] = (a[f.e] || 0) + 1), a), {})) };
  })()`);
  console.log(JSON.stringify({ look: r.look, mode: r.mode, band: r.band, dpr: r.dpr, s: r.s, n: r.n, nFail: r.nFail, byEdge: r.byEdge }));
  for (const f of r.fails) console.log(JSON.stringify(f));
  console.log('pageErrors', log.pageErrors.length, log.pageErrors.slice(0, 3)); await b.close();
})();
