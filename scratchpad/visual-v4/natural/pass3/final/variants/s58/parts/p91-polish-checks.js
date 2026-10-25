
// ------------------------------------------------------------------ polish checks (window.__mock): the layout and cost items of the pass-2 verifier, measured in the page
// (1) wild names: label pixels (the frame with labels minus without) outside the wild's own cells, or within 2 px of its outline (the verifier's wildnames.cjs)
function rlWildNamesCheck() {
  const A = rlRedraw([]), B = rlRedraw(['labels']), W2 = canvas.width, H2 = canvas.height, lay = RL_PIECE_CACHE.get('L'), k = cam.s / lay.s, rows = [];
  for (const o of lay.wildOps) { const boxes = (o.gl ? glyphBoxes(o.gl, 0) : o.box ? [o.box] : []).map((b) => b.map((q, j) => q * k + (j % 2 ? cam.y : cam.x))); let n = 0, out = 0, edge = 0;
    for (const b of boxes) for (let Y = Math.max(0, Math.floor(b[1] * dpr)); Y < Math.min(H2, b[3] * dpr); Y++) for (let X = Math.max(0, Math.floor(b[0] * dpr)); X < Math.min(W2, b[2] * dpr); X++) { const q = (Y * W2 + X) * 4; if (A[q] === B[q] && A[q + 1] === B[q + 1] && A[q + 2] === B[q + 2]) continue; n++;
      if (!o.w.cells.includes(provinceAt(...toWorld(X / dpr, Y / dpr)))) out++; else if ([[2, 0], [-2, 0], [0, 2], [0, -2]].some(([dx, dy]) => !o.w.cells.includes(provinceAt(...toWorld(X / dpr + dx, Y / dpr + dy))))) edge++; }
    rows.push({ wild: o.w.name, px: n, outsideWild: out, onOutlineBand: edge, tracking: o.ls ?? 0.14 }); }
  const shown = new Set(lay.wildOps.map((o) => o.w.name)); return { named: rows, unnamed: WILDS.map((w) => w.name).filter((nm) => !shown.has(nm)), pass: rows.every((r) => !r.outsideWild && !r.onOutlineBand) };
}
// (2) names whose seat is in view sit wholly in the view band (the right rail and a docked panel excluded) and clear of the mode column
function rlNamesInViewCheck() {
  draw(); const lay = RL_PIECE_CACHE.get('L'), sh = rlLiveBox(lay), v = viewRect(), vf = viewRect(true), r = Math.min(cw, vf.r), cut = [];
  for (const l of lay.labels) { const st = lay.seats.get(l.i), [sx, sy] = st ? rlToScr(st.x, st.y, lay.s) : [NaN, NaN]; if (!(sx >= v.l && sx <= r && sy >= v.t && sy <= v.b)) continue; const b = sh(l.box);
    if (b[0] < v.l || b[2] > r || b[1] < v.t || b[3] > v.b) cut.push(`${l.text} past the view (${b.map(Math.round).join(',')})`); }
  return { names: lay.labels.length, viewRight: Math.round(r), cut, pass: !cut.length };
}
// (3) the start view keeps the alerts ribbon (6 px of air) off every wild and seat
function rlStartClearCheck() {
  const keep = { s: cam.s, x: cam.x, y: cam.y }; fit(); RCK = null; draw(); const rb = document.getElementById('ribbon'), cr = canvas.getBoundingClientRect(), r = rb && rb.offsetParent ? rb.getBoundingClientRect() : null; let wild = 0, seats = []; const D = MED_DIAM * cam.s;
  if (r && r.width > 0) { const box = [r.left - cr.left - 6, r.top - cr.top - 6, r.right - cr.left + 6, r.bottom - cr.top + 6]; for (let y = box[1]; y <= box[3]; y += 2) for (let x = box[0]; x <= box[2]; x += 2) { const [wx, wy] = toWorld(x, y); if (wx >= 0 && wy >= 0 && wx <= W && wy <= H && isWild(provinceAt(wx, wy))) wild++; }
    for (const i of provList) { const [sx, sy] = toScreen(...cent[i]); if (sx > box[0] - 0.3 * D && sx < box[2] + 0.3 * D && sy > box[1] - 0.3 * D && sy < box[3] + 0.3 * D) seats.push(names[i]); } }
  const out = { Dpx: +D.toFixed(1), ribbon: !!r, wildSamplesUnderRibbon: wild, seatsUnderRibbon: seats, focus: toScreen(...(app.classList.contains('phone') ? cent[cmd.varo.at] : cent[redCap])).map(Math.round), viewBottom: Math.round(viewRect().b), pass: !wild && !seats.length };
  cam.s = keep.s; cam.x = keep.x; cam.y = keep.y; clampCam(); RCK = null; draw(); return out;
}
// (4) the wild edge decision's cost: the last live decision, how many were made live, the idle prefetch, the rungs kept
const rlQuietCost = () => ({ lastLiveMs: RL_WRIM.ms, liveDecisions: RL_QE.n, prefetchSlices: RL_QE.pre.n, prefetchMs: Math.round(RL_QE.pre.ms), rungsKept: RL_WRIM.lru.size, edgesDecidedHere: RL_WRIM.map ? RL_WRIM.map.size : 0, rung: RL_QE.rung });
Object.assign(window.__mock, { reliefWildNames: () => rlWildNamesCheck(), reliefNamesInView: () => rlNamesInViewCheck(), reliefStartClear: () => rlStartClearCheck(), reliefQuietCost: () => rlQuietCost() });
