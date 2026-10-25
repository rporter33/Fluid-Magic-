// one edge's lines as drawn: the page's segments, their keys and alphas, and contrast along the edge every 2 px: node edgeprobe.cjs <A> <B> [look] [dpr]
const { launch, open, ev, mev, PAGE, OUT } = require('./lib.cjs'); const fs = require('fs');
const [A, B, look = 'natural', dprS = '1'] = process.argv.slice(2), dpr = Number(dprS);
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] };
  const p = await open(b, PAGE, { log, dpr, settle: 1500, q: look === 'clear' ? '?terrain=clear' : '' }); await p.mouse.move(720, 894);
  if (process.env.VIEW) await ev(p, process.env.VIEW); await p.waitForTimeout(1500);
  const r = await mev(p, `(() => {
    const i = names.indexOf(${JSON.stringify(A)}), j = names.indexOf(${JSON.stringify(B)}); const e = [...EDGE.values()].find((q) => (q.i === i && q.j === j) || (q.i === j && q.j === i));
    const internal = prov[i].owner && prov[i].owner === prov[j].owner; const st = rlSegStyles(e, internal ? 'int' : 'hair', rlLineCtx());
    const land = rlRedraw(['rails', 'pieces', 'labels', 'badges', 'arrows']), lines = rlRedraw(['pieces', 'labels', 'badges', 'arrows']), W2 = canvas.width;
    const px = (d, sx, sy) => { const X = Math.floor(sx * dpr), Y = Math.floor(sy * dpr); const k = (Y * W2 + X) * 4; return [d[k], d[k + 1], d[k + 2]]; };
    const segs = st.segs.map((sg) => ({ key: sg.key, alpha: sg.alpha, partner: sg.partner ? sg.partner.key : null, len: +(Math.hypot(sg.x1 - sg.x0, sg.y1 - sg.y0) * cam.s).toFixed(1) }));
    const [ax, ay] = toScreen(...e.a), [bx, by] = toScreen(...e.b), Lg = Math.hypot(bx - ax, by - ay), prof = [];
    for (let s = 3; s < Lg - 3; s += 2) { const t = s / Lg, sx = ax + (bx - ax) * t, sy = ay + (by - ay) * t; let best = 0; for (let o = 0; o <= 6; o += 0.5) best = Math.max(best, rlWcag(px(lines, sx + st.nx * o, sy + st.ny * o), px(land, sx + st.nx * o, sy + st.ny * o))); prof.push(+best.toFixed(2)); }
    const L = rlLinesCheck(); return { internal, fog: [fogOf(i), fogOf(j)], owners: [prov[i].owner, prov[j].owner], n: [st.nx, st.ny], edgePx: +Lg.toFixed(1), segs, along2px: prof, minAlong: Math.min(...prof), checkInternalMin: L.internal.min, checkWorst: L.worst };
  })()`);
  console.log(JSON.stringify(r)); await p.screenshot({ path: OUT + `edge-${A}-${B}.png` }); await b.close();
})();
