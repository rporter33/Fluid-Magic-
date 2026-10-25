
// ------------------------------------------------------------------ v4 relief: labels, live names, the numbers chips, the path thread and arrows (screen px)
function rlPaintLabels(g, lay) {
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  for (const op of lay.wildOps) {
    if (op.gl) { paintGlyphs(g, op.gl.map((q) => ({ ...q, x: q.x + cam.x, y: q.y + cam.y })), op.font, '#E9E4D8', 'rgba(20,18,15,.55)', 2.5); continue; }
    const [x, y] = rlToScr(op.x, op.y); g.save(); g.translate(x, y); if (op.vertical) g.rotate(-Math.PI / 2); g.font = op.font; if ('letterSpacing' in g) g.letterSpacing = '0.12em';
    g.lineWidth = 2.5; g.strokeStyle = 'rgba(20,18,15,.55)'; g.strokeText(op.w.name, 0, 0); g.fillStyle = '#E9E4D8'; g.fillText(op.w.name, 0, 0); if ('letterSpacing' in g) g.letterSpacing = '0px'; g.restore();
  }
  for (const lb of lay.labels) { const [x, y] = rlToScr(lb.x, lb.y); if (lb.sw) { const tw = lb.box[2] - lb.box[0] - 4; rlSwatch(g, prov[lb.i].terrain, x - tw / 2 + 5, y, 10); rlLabel(g, lb.text, x + 6.5, y, lb.font); } else rlLabel(g, lb.text, x, y, lb.font); }
  for (const c of lay.chips) { const [x, y] = rlToScr(c.x, c.y), w2 = c.box[2] - c.box[0]; g.fillStyle = 'rgba(20,18,15,.88)'; roundRect(g, x - w2 / 2, y - 8, w2, 16, 3); g.fill(); g.font = "600 11px 'IBM Plex Sans Condensed', sans-serif"; g.fillStyle = '#F4EEDF';
    if (c.tg) { rlGlyph(g, c.tg, x - w2 / 2 + 4, y - 5.5, 11, '#F4EEDF'); g.fillText(c.text, x + 6.5, y + 0.5); } else g.fillText(c.text, x, y + 0.5); } // the Terrain mode: the glyph and the word
}
function rlLabel(g, text, x, y, font, strong) { g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.lineWidth = strong ? 4 : 3; g.strokeStyle = strong ? 'rgba(20,18,15,.95)' : 'rgba(20,18,15,.85)'; g.strokeText(text, x, y); g.fillStyle = '#F4EEDF'; g.fillText(text, x, y); }
// the layout's boxes in the live frame (they were laid out at lay.s; during a wheel zoom the frame is already at cam.s)
const rlLiveBox = (lay) => { const k = rlLayK(lay); return (q) => [q[0] * k + cam.x, q[1] * k + cam.y, q[2] * k + cam.x, q[3] * k + cam.y]; };
// where a chip may stand: inside the model's screen box (inset 4 px) and clear of the floating alerts ribbon (canvas px)
function rlChipRoom() {
  const [mx0, my0] = toScreen(0, 0), [mx1, my1] = toScreen(W, H), cr = canvas.getBoundingClientRect(), rbEl = document.getElementById('ribbon'), rb = rbEl && rbEl.offsetParent ? rbEl.getBoundingClientRect() : null;
  const rib = rb && rb.width > 0 && rb.height > 0 ? [rb.left - cr.left, rb.top - cr.top, rb.right - cr.left, rb.bottom - cr.top] : null;
  const ctl = RELIEF() ? [...document.querySelectorAll('#modes .modebtn, #modes .fitrow')].filter((e) => e.offsetParent).map((e) => { const q = e.getBoundingClientRect(); return [q.left - cr.left - 3, q.top - cr.top - 3, q.right - cr.left + 3, q.bottom - cr.top + 3]; }) : []; // pass 2: chips keep off the mode column too
  const v = viewRect();
  return { inView: (r) => r[0] >= v.l + 2 && r[1] >= v.t + 2 && r[2] <= v.r - 2 && r[3] <= v.b - 2, inModel: (r) => r[0] >= mx0 + 4 && r[1] >= my0 + 4 && r[2] <= mx1 - 4 && r[3] <= my1 - 4, clearOfRibbon: (r) => !ctl.some((q) => r[2] > q[0] && r[0] < q[2] && r[3] > q[1] && r[1] < q[3]) && (!rib || !(r[2] > rib[0] && r[0] < rib[2] && r[3] > rib[1] && r[1] < rib[3])) };
}
// pass 2: candidate spots on rings 2 to 6 chip heights from the waypoint, 16 directions each, nearest first; the first that passes ok (a chip on the oak beside a small model is clearer than one over a name)
function rlChipRing(x, y, C, ok) { const D16 = [[1, 0], [0.92, 0.38], [0.71, 0.71], [0.38, 0.92], [0, 1], [-0.38, 0.92], [-0.71, 0.71], [-0.92, 0.38], [-1, 0], [-0.92, -0.38], [-0.71, -0.71], [-0.38, -0.92], [0, -1], [0.38, -0.92], [0.71, -0.71], [0.92, -0.38]];
  for (let ring = 2; ring <= 6; ring++) for (const [dx, dy] of D16) { const q = [x + dx * ring * C.h - C.tw / 2, y + dy * ring * C.h - C.h / 2]; if (ok(q)) return q; } return null; }
const RL_THREAD_CHIPS = { list: [] }; // review only: the day chips as last drawn (canvas px)
// what a day chip keeps off (canvas px): the pieces, the placed names and the wild names, straight or along the massif (AD fix 11: the Far chip covered "Halevale")
const rlNameBoxes = (lay) => { if (!lay) return []; const sh = rlLiveBox(lay); return [...lay.labels.map((l) => sh(l.box)), ...lay.wildOps.flatMap((o) => (o.gl ? glyphBoxes(o.gl, 1) : o.box ? [o.box] : [])).map(sh)]; };
function rlThread(g, ml) { // the planned path (relief): the line from the army's piece, waypoint diamonds, day chips clear of names and pieces and on the model, the path's names on top
  const lay = RL_PIECE_CACHE.get('L'), sh = rlLiveBox(lay), nameB = rlNameBoxes(lay), avoid = lay ? [...lay.boxes.map(sh), ...nameB] : [], room = rlChipRoom(), far = bandOf(cam.s) === 'far';
  const hitAny = (r, L) => L.some((q) => r[2] > q[0] && r[0] < q[2] && r[3] > q[1] && r[1] < q[3]);
  const sel = state.sel && state.sel.type === 'cmd' ? rlPieceAt(state.sel.id) : null, pts = [sel ?? cent[ml.from], ...ml.path.map((v) => cent[v])].map((q) => toScreen(...q));
  g.save(); g.lineJoin = 'round'; g.setLineDash([8, 6]); g.strokeStyle = '#1C1A17'; g.lineWidth = 5; g.beginPath(); pts.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); g.strokeStyle = '#F4EEDF'; g.lineWidth = 3; g.stroke(); g.setLineDash([]);
  g.font = "600 11.5px 'IBM Plex Sans Condensed', sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle';
  let days = 0; const chips = [];
  ml.path.forEach((v, k) => {
    days += DAYS[prov[v].terrain]; const [x, y] = pts[k + 1], last = k === ml.path.length - 1;
    g.save(); g.translate(x, y); g.rotate(Math.PI / 4); g.fillStyle = '#B8914A'; g.fillRect(-3.5, -3.5, 7, 7); g.strokeStyle = '#1C1A17'; g.lineWidth = 1; g.strokeRect(-3.5, -3.5, 7, 7); g.restore();
    const lbl = last ? `${days}d${ml.around ? ' · around ' + ml.around : ''}` : `${days}d`, lines1 = [lbl], lines2 = last && ml.around ? [`${days}d`, `around ${ml.around}`] : null;
    const chipOf = (lines) => { const tw = Math.max(...lines.map((t) => g.measureText(t).width)) + 10, h = 17 + (lines.length - 1) * 13, base = [[8, -h - 6], [-tw - 8, -h - 6], [8, 6], [-tw - 8, 6], [-tw / 2, -h - 14], [-tw / 2, 12], [14, -h / 2], [-tw - 14, -h / 2], [8, h + 10], [-tw / 2, h + 26], [-tw / 2, -2 * h - 16]];
      if (far) base.push([8, -2 * h - 12], [-tw - 8, -2 * h - 12], [8, 2 * h + 6], [-tw - 8, 2 * h + 6], [2 * h + 8, -h / 2], [-tw - 2 * h - 8, -h / 2], [-tw / 2, -3 * h - 14], [-tw / 2, 3 * h + 8]); // AD fix 11: at Far, spots two and three chip heights away
      return { lines, tw, h, cands: base.map(([ox, oy]) => [x + ox, y + oy]) }; };
    const rectOf = (c, [cx, cy]) => [cx - 1, cy - 1, cx + c.tw + 1, cy + c.h + 1];
    const free = (c, at) => { const r = rectOf(c, at); return room.inModel(r) && room.clearOfRibbon(r) && ![...avoid, ...chips].some((q) => r[2] > q[0] && r[0] < q[2] && r[3] > q[1] && r[1] < q[3]); };
    let C = chipOf(lines1), at = C.cands.find((q) => free(C, q));
    if (!at && lines2) { const C2 = chipOf(lines2), a2 = C2.cands.find((q) => free(C2, q)); if (a2) { C = C2; at = a2; } } // the decision number keeps its chip on the model: on two lines where one does not fit
    if (!at && lines2) { const C3 = chipOf([`${days}d`]), a3 = C3.cands.find((q) => free(C3, q)); if (a3) { C = C3; at = a3; } } // AD fix 11: then the short chip ("around ..." is in the move toast)
    if (!at) { if (lines2) C = chipOf([`${days}d`]); const ok = (q) => room.inModel(rectOf(C, q)) && room.clearOfRibbon(rectOf(C, q)); // nothing free: a spot on the model clear of every name (a piece may be under it), else the first on the model
      at = C.cands.find((q) => ok(q) && !hitAny(rectOf(C, q), [...nameB, ...chips])) ?? rlChipRing(x, y, C, (q) => room.inView(rectOf(C, q)) && room.clearOfRibbon(rectOf(C, q)) && !hitAny(rectOf(C, q), [...nameB, ...chips])) ?? C.cands.find(ok) ?? C.cands.find((q) => room.inModel(rectOf(C, q))) ?? C.cands[0]; } // pass 2: a wider ring before a chip covers a name (the phone at its least zoom)
    const [cx, cy] = at; chips.push([cx, cy, cx + C.tw, cy + C.h]); RL_THREAD_CHIPS.list = chips.map((q, j) => ({ box: q.map((v) => +v.toFixed(1)), text: j === chips.length - 1 ? C.lines.join(' / ') : '' }));
    const drawChip = () => { g.save(); g.font = "600 11.5px 'IBM Plex Sans Condensed', sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = last ? 'rgba(20,18,15,.95)' : 'rgba(20,18,15,.82)'; roundRect(g, cx, cy, C.tw, C.h, 3); g.fill(); if (last) { g.strokeStyle = '#B8914A'; g.lineWidth = 1; g.stroke(); }
      g.fillStyle = '#F4EEDF'; C.lines.forEach((t, j) => g.fillText(t, cx + C.tw / 2, cy + 9 + j * 13)); g.restore(); };
    drawChip(); RL_CHIPS.push({ box: [cx - 1, cy - 1, cx + C.tw + 1, cy + C.h + 1], draw: drawChip, text: C.lines.join(' / ') });
  });
  if (lay) for (const lb of lay.labels) if (ml.path.includes(lb.i) || lb.i === ml.from) { const [x, y] = rlToScr(lb.x, lb.y, lay.s); rlLabel(g, lb.text, x, y, lb.font); } // names stay readable over the line
  g.restore();
}
function rlArrow(g, a, b, to, color, label) { // a planned move: it stops short of the target's seat, and its day chip keeps off the pieces and names
  const lay = RL_PIECE_CACHE.get('L'), sh = rlLiveBox(lay), avoid = lay ? [...lay.boxes.map(sh), ...rlNameBoxes(lay)] : [];
  const [ax, ay] = toScreen(...a), [tx, ty] = toScreen(...b), st = lay && lay.seats.get(to), L = Math.hypot(tx - ax, ty - ay), cut = Math.min(L * 0.45, (st ? st.r * rlLayK(lay) : 0) + 8), bx = tx - ((tx - ax) / L) * cut, by = ty - ((ty - ay) / L) * cut;
  g.save(); g.strokeStyle = 'rgba(20,18,15,.75)'; g.lineWidth = 5; g.setLineDash([8, 6]); g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke(); g.strokeStyle = color; g.lineWidth = 3; g.stroke(); g.setLineDash([]);
  const ang = Math.atan2(by - ay, bx - ax), head = () => { g.beginPath(); g.moveTo(bx + 2 * Math.cos(ang), by + 2 * Math.sin(ang)); g.lineTo(bx - 12 * Math.cos(ang - 0.4), by - 12 * Math.sin(ang - 0.4)); g.lineTo(bx - 12 * Math.cos(ang + 0.4), by - 12 * Math.sin(ang + 0.4)); g.closePath(); };
  head(); g.strokeStyle = 'rgba(20,18,15,.75)'; g.lineWidth = 2; g.stroke(); g.fillStyle = color; g.fill();
  if (label) {
    const La = Math.hypot(bx - ax, by - ay) || 1, nx = -(by - ay) / La, ny = (bx - ax) / La, up = ny < 0 ? 1 : -1; // a short arrow keeps its chip beside the line, so the line still shows
    const cands = []; for (const t of [0.5, 0.4, 0.6, 0.3, 0.7, 0.2, 0.8]) { if (La >= 90) cands.push([t, 0]); cands.push([t, 20 * up], [t, -20 * up]); } for (const t of [0.5, 0.3, 0.7]) cands.push([t, 34 * up], [t, -34 * up]); // AD fix 11: two rings
    const names = rlNameBoxes(lay), room = rlChipRoom(), at = ([t, o]) => [ax + (bx - ax) * t + nx * o, ay + (by - ay) * t + ny * o], rOf = (c) => { const [mx, my] = at(c); return [mx - 17, my - 11, mx + 17, my + 11]; }, hit = (r, L) => L.some((q) => r[2] > q[0] && r[0] < q[2] && r[3] > q[1] && r[1] < q[3]);
    const rib = (c) => room.clearOfRibbon(rOf(c)); // AD fix 11: off the alerts ribbon too
    const far = [0.5, 0.3, 0.7].flatMap((t) => [48, 64, 82].flatMap((o) => [[t, o * up], [t, -o * up]])); // pass 2: further rings before a chip covers a name
    const [mx, my] = at(cands.find((c) => rib(c) && !hit(rOf(c), avoid)) ?? cands.find((c) => rib(c) && !hit(rOf(c), names)) ?? far.find((c) => rib(c) && room.inView(rOf(c)) && !hit(rOf(c), names)) ?? cands.find((c) => !hit(rOf(c), names)) ?? cands[0]); // clear of pieces and names, else at least of names
    const drawChip = () => { g.save(); g.fillStyle = 'rgba(20,18,15,.9)'; roundRect(g, mx - 16, my - 10, 32, 20, 4); g.fill(); g.fillStyle = '#F4EEDF'; g.font = `600 12px 'IBM Plex Sans Condensed', sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, mx, my + 1); g.restore(); };
    drawChip(); RL_CHIPS.push({ box: [mx - 17, my - 11, mx + 17, my + 11], draw: drawChip, text: label }); // recorded: a live name keeps off it (natural §10 defect 4)
  }
  g.restore();
}
// the hovered province's and a hovered link's name on the land, when the band does not show it already (natural §10 defect 4: never over a day chip). The name tries six spots
// (its own; below; above the seat; right; left; lower); if none is free the chip is drawn again on top, since the number is the decision. A link's name carries the terrain (§7).
const RL_CHIPS = [], RL_LIVE = { list: [] }; // this frame's day chips (canvas px, with their draw) and the live names (review)
function rlLiveLabels(g, band) {
  const lay = RL_PIECE_CACHE.get('L'); RL_LIVE.list = []; if (!lay) return;
  for (const i of [hoverProv, RL_LINK.prov]) {
    if (i < 0 || isWild(i) || lay.labels.some((q) => q.i === i) || RL_LIVE.list.some((q) => q.i === i)) continue; const c = lay.cand.get(i); if (!c) continue;
    const link = i === RL_LINK.prov && i !== hoverProv, text = link ? `${prov[i].name} · ${TERRAIN[prov[i].terrain].name.toLowerCase()}` : prov[i].name;
    g.font = c.font; const tw = g.measureText(text).width + 8, th = 16, k = rlLayK(lay), [x0, y0] = rlToScr(c.x, c.y, lay.s), st = lay.seats.get(i), sr = st ? (st.r || st.T || 10) * k : 12;
    const spots = [[x0, y0], [x0, y0 + th + 4], [x0, y0 - sr * 2 - th], [x0 + tw / 2 + sr + 6, y0 - sr], [x0 - tw / 2 - sr - 6, y0 - sr], [x0, y0 + 2 * th + 8]];
    const boxAt = ([x, y]) => [x - tw / 2, y - th / 2, x + tw / 2, y + th / 2], hits = (r) => RL_CHIPS.filter((q) => r[2] > q.box[0] && r[0] < q.box[2] && r[3] > q.box[1] && r[1] < q.box[3]);
    const at = spots.find((sp) => !hits(boxAt(sp)).length) ?? spots[0], box = boxAt(at), over = hits(box);
    rlLabel(g, text, at[0], at[1], c.font, true); for (const q of over) q.draw();
    RL_LIVE.list.push({ i, text, box: box.map((v) => +v.toFixed(1)), moved: at !== spots[0], chipsOnTop: over.length });
  }
}
// the terrain glyph on the map (a 24-unit path drawn at size px) and the terrain swatch: the Clear fill with the glyph in its keyline (natural §7)
function rlGlyph(g, t, x, y, size, col) { g.save(); g.translate(x, y); g.scale(size / 24, size / 24); g.strokeStyle = col; g.lineWidth = 2.2; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(tGlyphPath(t)); g.restore(); }
function rlSwatch(g, t, cx, cy, s) { g.fillStyle = 'rgba(20,18,15,.85)'; g.fillRect(cx - s / 2 - 1, cy - s / 2 - 1, s + 2, s + 2); g.fillStyle = RL_ALB[t]; g.fillRect(cx - s / 2, cy - s / 2, s, s); rlGlyph(g, t, cx - s / 2 + 1, cy - s / 2 + 1, s - 2, RL_KEYFOR[t]); }
