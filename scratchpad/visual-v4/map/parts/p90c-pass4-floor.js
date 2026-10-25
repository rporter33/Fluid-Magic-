
// ------------------------------------------------------------------ pass 4 (natural/pass4/design-final.md §5.5): the inherited floor-line samplers on a map with rivers
// p88 reliefLines, p89 reliefLinesHover and p90 (reliefLinesRest, reliefLinesFocus, reliefLinesSweep) sample each edge along its straight line. With rivers drawn, a river edge's line runs
// along its banks (p65 rlRiverEdgeLines) and no line is drawn on the water (rlWaterErase, rlWaterOut: a line meeting a river stops at its bank). So a sample point on the
// water or within p4Meet() px of it is skipped (p90's 4 px clearance at an edge's ends, counted from where the line meets the bank lines' outer edge), and a river edge is sampled along each bank line drawn at the floor (the focus province's own bank, else every bank that is
// not a wild's and not under a realm's rails), every 1 px and p4Meet() px clear of its course portion's ends (the joints, where the next edge's lines meet it), +-3 px across, at the bank floor (2.3:1, §5.5), but not under a
// bridge's span (drawn over the bank line at Mid and Near, p65 rlBridgeFeet). With the rivers
// off (?p4=off, SKIP 'p4waters', before the bake) the samplers run exactly as before.
const p4Meet = () => { const w = rlW(); return 0.5 + w.h + w.hp + 4; }; // where a line meets a river: its bank lines' outer edge (0.5 + both slots past the water), plus p90's 4 px
const p4OnWater = (sx, sy, m = p4Meet()) => p4W() && RB.ready && rlWaterDist(...toWorld(sx, sy)) < m / cam.s;
function p4BankPts(e, focus) { // river edge e: [sx, sy, nx, ny, at] along each bank line drawn at the floor; null when e is not a river edge
  if (!p4W() || !RB.ready) return null; const k = ekey(e.i, e.j); if (!rlWorld4().riverOf.has(k)) return null; const ent = RL_WAT.edge.get(k), R = rlRiverGeo()[ent.r], lw = rlW().h, out = [], F = rlBridgeFeet();
  const under = (sx, sy) => { const [x, y] = toWorld(sx, sy); return F.some((f) => Math.abs((x - f.x) * f.tx + (y - f.y) * f.ty) < f.t1 + 0.9 * RLK + 4 / cam.s && Math.abs(-(x - f.x) * f.ty + (y - f.y) * f.tx) < f.s1 + 3 / cam.s); }; // a bank line passes under a bridge's span (p65); 4 px clear of it, as p90 clears an edge's ends
  for (const side of [e.i, e.j]) {
    if ((focus != null && side !== focus) || isWild(side) || (prov[side].owner && isRealmEdge(side, RL_EDGES[side].find((x) => x.j === (side === e.i ? e.j : e.i)) ?? { j: -1 }))) continue;
    const sg = rlBankSign(e, side), P = ent.idx.filter((q) => q >= rlQ0(R)).map((q) => { const a = R.S[Math.max(0, q - 1)], b = R.S[Math.min(R.S.length - 1, q + 1)], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = (-(b[1] - a[1]) / L) * sg, ny = ((b[0] - a[0]) / L) * sg, o = R.hw[q] + (0.5 + lw / 2) / cam.s; return [...toScreen(R.S[q][0] + nx * o, R.S[q][1] + ny * o), nx, ny]; });
    const cum = [0]; for (let m = 1; m < P.length; m++) cum.push(cum[m - 1] + Math.hypot(P[m][0] - P[m - 1][0], P[m][1] - P[m - 1][1])); const tot = cum[cum.length - 1];
    for (let s = p4Meet(), m = 0; s <= tot - p4Meet(); s += 1) { while (m < P.length - 2 && cum[m + 1] < s) m++; const f = (s - cum[m]) / (cum[m + 1] - cum[m] || 1), A = P[m], B = P[m + 1]; const sx = A[0] + (B[0] - A[0]) * f, sy = A[1] + (B[1] - A[1]) * f; if (!under(sx, sy)) out.push([sx, sy, A[2] + (B[2] - A[2]) * f, A[3] + (B[3] - A[3]) * f, +(s / tot).toFixed(2)]); }
  }
  return out;
}
const p4FloorEdges0 = rlFloorEdgesOf, p4FloorPlan0 = rlFloorPlan;
rlFloorEdgesOf = function (i, band) { const L = p4FloorEdges0(i, band); for (const o of L) o.focus = i; return L; }; // the province whose floor is checked (null: every line at rest)
rlFloorPlan = function (list) { // p90's plan (the same points and pixels on every edge without a river), with the banks and the water
  if (!p4W() || !RB.ready) return p4FloorPlan0(list);
  const v = viewRect(), W2 = canvas.width, H2 = canvas.height, pts = [], idx = [], sel = rlFaintOn() && state.sel && state.sel.type === 'prov' ? state.sel.id : null; let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const add = (e, kind, sx, sy, nx, ny, o0, o1, at) => { if (sx < v.l + 8 || sx > v.r - 8 || sy < v.t + 8 || sy > v.b - 8) return; const k0 = idx.length;
    for (let o = o0; o <= o1; o += 0.5) { const X = Math.floor((sx + nx * o) * dpr), Y = Math.floor((sy + ny * o) * dpr); if (X < 0 || Y < 0 || X >= W2 || Y >= H2) continue; idx.push(X, Y); x0 = Math.min(x0, X); y0 = Math.min(y0, Y); x1 = Math.max(x1, X); y1 = Math.max(y1, Y); }
    if (idx.length > k0) pts.push({ e, kind, k0, k1: idx.length, at }); };
  for (const { e, kind, focus } of list) {
    const B = p4BankPts(e, focus ?? sel); if (B) { for (const [sx, sy, nx, ny, at] of B) add(e, 'hair', sx, sy, nx, ny, -3, 3, at); continue; } // in the rest check with faint lines, the list is the selection's edges
    const [ax, ay] = toScreen(...e.a), [bx, by] = toScreen(...e.b), Lg = Math.hypot(bx - ax, by - ay); let nx = -(e.b[1] - e.a[1]), ny = e.b[0] - e.a[0]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l; if (nx + ny < 0) { nx = -nx; ny = -ny; }
    const [o0, o1] = kind === 'hair' ? [-3, 3] : [0, 6];
    for (let s = 4; s <= Lg - 4; s += 1) { const sx = ax + ((bx - ax) * s) / Lg, sy = ay + ((by - ay) * s) / Lg; if (!p4OnWater(sx, sy)) add(e, kind, sx, sy, nx, ny, o0, o1, +(s / Lg).toFixed(2)); }
  }
  return { pts, idx, rect: pts.length ? [x0, y0, x1 - x0 + 1, y1 - y0 + 1] : null };
};
const p4ProvLines0 = rlProvLinesSample;
rlProvLinesSample = function (i, land, lines) { // p89 reliefLinesHover: the hovered or selected province's own lines, every 2 px; with rivers, along its own bank and none on the water (as above)
  if (!p4W() || !RB.ready) return p4ProvLines0(i, land, lines);
  const W2 = canvas.width, H2 = canvas.height, v = viewRect(), band = bandOf(cam.s), ctx = rlLineCtx(), out = { hair: [], int: [], under: [] }, inV = (sx, sy) => sx >= v.l + 8 && sx <= v.r - 8 && sy >= v.t + 8 && sy <= v.b - 8;
  const px = (d, sx, sy) => { const X = Math.floor(sx * dpr), Y = Math.floor(sy * dpr); if (X < 0 || Y < 0 || X >= W2 || Y >= H2) return null; const k = (Y * W2 + X) * 4; return [d[k], d[k + 1], d[k + 2]]; };
  const best = (sx, sy, nx, ny, o0, o1) => { let b = 0; for (let o = o0; o <= o1; o += 0.5) { const a = px(lines, sx + nx * o, sy + ny * o), c = px(land, sx + nx * o, sy + ny * o); if (a && c) b = Math.max(b, rlWcag(a, c)); } return b; };
  const push = (e, kind, b) => { out[kind].push(b); if (b < (kind === 'hair' ? 2.3 : 3.2) && out.under.length < 4) out.under.push(`${kind} ${names[e.i]}/${names[e.j]} ${b.toFixed(2)}`); };
  for (const [, e] of EDGE) {
    if (e.i !== i && e.j !== i) continue; const kind = rlEdgeKind(e, band); if (!kind || (fogOf(e.i) && fogOf(e.j))) continue;
    const B = p4BankPts(e, i); if (B) { B.forEach(([sx, sy, nx, ny], n) => { if (n % 2 === 0 && inV(sx, sy)) push(e, 'hair', best(sx, sy, nx, ny, -3, 3)); }); continue; }
    const { nx, ny } = rlSegStyles(e, kind, ctx), [ax, ay] = toScreen(...e.a), [bx, by] = toScreen(...e.b), Lg = Math.hypot(bx - ax, by - ay), offs = kind === 'hair' ? [-3, 3] : [0, 6];
    for (let s = 4; s < Lg - 4; s += 2) { const sx = ax + ((bx - ax) * s) / Lg, sy = ay + ((by - ay) * s) / Lg; if (inV(sx, sy) && !p4OnWater(sx, sy)) push(e, kind, best(sx, sy, nx, ny, offs[0], offs[1])); }
  }
  return out;
};
