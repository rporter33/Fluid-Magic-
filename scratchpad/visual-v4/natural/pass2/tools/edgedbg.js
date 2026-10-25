(() => { const A = names.indexOf(EA), B = names.indexOf(EB), e = [...EDGE.values()].find((q) => (q.i === A && q.j === B) || (q.i === B && q.j === A));
  if (HOV) hoverProv = names.indexOf(HOV); if (SEL) state.sel = { type: 'prov', id: names.indexOf(SEL) };
  const land = rlRedraw(['rails', 'pieces', 'labels', 'badges', 'arrows']), lines = rlRedraw(['pieces', 'labels', 'badges', 'arrows']), W2 = canvas.width;
  const px = (d, sx, sy) => { const X = Math.floor(sx * dpr), Y = Math.floor(sy * dpr), k = (Y * W2 + X) * 4; return [d[k], d[k + 1], d[k + 2]]; };
  const kind = rlEdgeKind(e, bandOf(cam.s)), st = rlSegStyles(e, kind, rlLineCtx()), { nx, ny } = st, [ax, ay] = toScreen(...e.a), [bx, by] = toScreen(...e.b), Lg = Math.hypot(bx - ax, by - ay), out = [];
  for (let s = 4; s < Lg - 4; s += 0.5) { const sx = ax + ((bx - ax) * s) / Lg, sy = ay + ((by - ay) * s) / Lg; let b = 0, prof = []; for (let o = -3; o <= 6; o += 0.5) { const a = px(lines, sx + nx * o, sy + ny * o), c = px(land, sx + nx * o, sy + ny * o), r = rlWcag(a, c); b = Math.max(b, (kind === 'hair' ? o <= 3 : o >= 0) ? r : 0); prof.push(+r.toFixed(2)); } out.push([s, +b.toFixed(2), +sx.toFixed(1), +sy.toFixed(1), prof.join(' ')]); }
  return { kind, Lg, ei: names[e.i], n: [nx, ny], segs: st.segs.map((q) => [q.key, +(q.alpha ?? 0).toFixed(2), q.partner ? q.partner.key + q.partner.side + (q.partner.extended ? 'x' : '') : '-']), worst: out.filter((q) => q[1] < (kind === 'hair' ? 2.3 : 3.2)) };
})()
