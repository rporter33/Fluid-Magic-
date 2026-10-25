const { launch, open, PAGE } = require('./nlib.cjs');
(async () => {
  const b = await launch(), errors = []; const p = await open(b, PAGE, { errors, settle: 1200, q: process.env.Q || '', dpr: Number(process.env.DPR || 1) }); if (process.env.PRE) { await p.evaluate((s) => { const m = window.__mock; return eval(s); }, process.env.PRE); await p.waitForTimeout(1500); }
  const r = await p.evaluate((PAIR) => window.__mock.ev(`(() => { const PAIR = '${PAIR}';
    const dr = RL_LINES.drawn.find((q) => [names[q.i], names[q.j]].sort().join('/') === PAIR);
    const ctx = rlLineCtx(), st = rlSegStyles(dr.e, dr.kind, ctx), land = rlRedraw(['rails','pieces','labels','badges','arrows']), lines = rlRedraw(['pieces','labels','badges','arrows']), W2 = canvas.width;
    const px = (d, sx, sy) => { const X = Math.floor(sx * dpr), Y = Math.floor(sy * dpr); const k = (Y * W2 + X) * 4; return [d[k], d[k + 1], d[k + 2]]; };
    return st.segs.map((sg) => { const [sx, sy] = toScreen((sg.x0 + sg.x1) / 2, (sg.y0 + sg.y1) / 2); const prof = []; for (let o = -3; o <= 3; o += 0.5 / dpr) { const a = px(lines, sx + st.nx * o, sy + st.ny * o), g = px(land, sx + st.nx * o, sy + st.ny * o); prof.push([o, rgb2hex(a), rgb2hex(g), +rlWcag(a, g).toFixed(2)]); }
      const [lr, ul] = rlGroundSides(sg.x0, sg.y0, sg.x1, sg.y1, st.nx, st.ny, ctx.look, ctx.lvl, new Map()); const q = (a) => a.length ? [rgb2hex(rlQ(a,0).slice(1)), rgb2hex(rlQ(a,0.1).slice(1)), rgb2hex(rlQ(a,0.5).slice(1)), rgb2hex(rlQ(a,0.9).slice(1)), rgb2hex(a[a.length-1].slice(1))] : null;
      return { key: sg.key, alpha: sg.alpha, partner: sg.partner, lr: q(lr), ul: q(ul), nlr: lr.length, best: Math.max(...prof.map((x) => x[3])), prof: prof.filter((x,k)=>k%2===0).map(x=>x.join(' ')) }; });
  })()`), process.env.PAIR || 'Coldmere/Karford');
  console.log(JSON.stringify(r, null, 1)); await b.close();
})();
