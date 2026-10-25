(() => { const A = names.indexOf(EA), B = names.indexOf(EB), e = [...EDGE.values()].find((q) => (q.i === A && q.j === B) || (q.i === B && q.j === A));
  const land = rlRedraw(['rails', 'pieces', 'labels', 'badges', 'arrows']), lines = rlRedraw(['pieces', 'labels', 'badges', 'arrows']), W2 = canvas.width;
  const px = (d, sx, sy) => { const X = Math.floor(sx * dpr), Y = Math.floor(sy * dpr), k = (Y * W2 + X) * 4; return rgb2hex([d[k], d[k + 1], d[k + 2]]); };
  const kind = rlEdgeKind(e, bandOf(cam.s)), st = rlSegStyles(e, kind, rlLineCtx()), { nx, ny } = st, [ax, ay] = toScreen(...e.a), [bx, by] = toScreen(...e.b), Lg = Math.hypot(bx - ax, by - ay), out = [];
  for (const s of SS) { const sx = ax + ((bx - ax) * s) / Lg, sy = ay + ((by - ay) * s) / Lg, row = []; for (let o = -2; o <= 7; o += 1) row.push(o + ':' + px(land, sx + nx * o, sy + ny * o) + '>' + px(lines, sx + nx * o, sy + ny * o)); out.push([s, row.join(' ')]); }
  const segAt = (s) => st.segs[Math.min(st.segs.length - 1, Math.floor((s / Lg) * st.segs.length))];
  return { n: [nx, ny], ul_is: names[provinceAt(...toWorld(ax + (bx - ax) * 0.5 - nx * 6, ay + (by - ay) * 0.5 - ny * 6))], out, seg: SS.map((s) => { const q = segAt(s); return [q.key, q.alpha, q.partner]; }) };
})()
