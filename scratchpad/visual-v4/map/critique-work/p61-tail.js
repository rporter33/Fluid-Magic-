// the layout's boxes in the live frame (they were laid out at lay.s; during a wheel zoom the frame is already at cam.s)
const rlLiveBox = (lay) => { const k = rlLayK(lay); return (q) => [q[0] * k + cam.x, q[1] * k + cam.y, q[2] * k + cam.x, q[3] * k + cam.y]; };
// where a chip may stand: inside the model's screen box (inset 4 px) and clear of the floating alerts ribbon (canvas px)
function rlChipRoom() {
  const [mx0, my0] = toScreen(0, 0), [mx1, my1] = toScreen(W, H), cr = canvas.getBoundingClientRect(), rbEl = document.getElementById('ribbon'), rb = rbEl && rbEl.offsetParent ? rbEl.getBoundingClientRect() : null;
  const rib = rb && rb.width > 0 && rb.height > 0 ? [rb.left - cr.left, rb.top - cr.top, rb.right - cr.left, rb.bottom - cr.top] : null;
  return { inModel: (r) => r[0] >= mx0 + 4 && r[1] >= my0 + 4 && r[2] <= mx1 - 4 && r[3] <= my1 - 4, clearOfRibbon: (r) => !rib || !(r[2] > rib[0] && r[0] < rib[2] && r[3] > rib[1] && r[1] < rib[3]) };
}
function rlThread(g, ml) { // the planned path (relief): the line from the army's piece, waypoint diamonds, day chips clear of names and pieces and on the model, the path's names on top
  const lay = RL_PIECE_CACHE.get('L'), sh = rlLiveBox(lay), avoid = lay ? [...lay.boxes.map(sh), ...lay.labels.map((l) => sh(l.box))] : [], room = rlChipRoom();
  const sel = state.sel && state.sel.type === 'cmd' ? rlPieceAt(state.sel.id) : null, pts = [sel ?? cent[ml.from], ...ml.path.map((v) => cent[v])].map((q) => toScreen(...q));
  g.save(); g.lineJoin = 'round'; g.setLineDash([8, 6]); g.strokeStyle = '#1C1A17'; g.lineWidth = 5; g.beginPath(); pts.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); g.strokeStyle = '#F4EEDF'; g.lineWidth = 3; g.stroke(); g.setLineDash([]);
  g.font = "600 11.5px 'IBM Plex Sans Condensed', sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle';
  let days = 0; const chips = [];
  ml.path.forEach((v, k) => {
    days += DAYS[prov[v].terrain]; const [x, y] = pts[k + 1], last = k === ml.path.length - 1;
    g.save(); g.translate(x, y); g.rotate(Math.PI / 4); g.fillStyle = '#B8914A'; g.fillRect(-3.5, -3.5, 7, 7); g.strokeStyle = '#1C1A17'; g.lineWidth = 1; g.strokeRect(-3.5, -3.5, 7, 7); g.restore();
    const lbl = last ? `${days}d${ml.around ? ' · around ' + ml.around : ''}` : `${days}d`, lines1 = [lbl], lines2 = last && ml.around ? [`${days}d`, `around ${ml.around}`] : null;
    const chipOf = (lines) => { const tw = Math.max(...lines.map((t) => g.measureText(t).width)) + 10, h = 17 + (lines.length - 1) * 13; return { lines, tw, h, cands: [[8, -h - 6], [-tw - 8, -h - 6], [8, 6], [-tw - 8, 6], [-tw / 2, -h - 14], [-tw / 2, 12], [14, -h / 2], [-tw - 14, -h / 2], [8, h + 10], [-tw / 2, h + 26], [-tw / 2, -2 * h - 16]].map(([ox, oy]) => [x + ox, y + oy]) }; };
    const rectOf = (c, [cx, cy]) => [cx - 1, cy - 1, cx + c.tw + 1, cy + c.h + 1];
    const free = (c, at) => { const r = rectOf(c, at); return room.inModel(r) && room.clearOfRibbon(r) && ![...avoid, ...chips].some((q) => r[2] > q[0] && r[0] < q[2] && r[3] > q[1] && r[1] < q[3]); };
    let C = chipOf(lines1), at = C.cands.find((q) => free(C, q));
    if (!at && lines2) { const C2 = chipOf(lines2), a2 = C2.cands.find((q) => free(C2, q)); if (a2) { C = C2; at = a2; } } // the decision number keeps its chip on the model: on two lines where one does not fit
    if (!at) { if (lines2) C = chipOf(lines2); at = C.cands.find((q) => room.inModel(rectOf(C, q))) ?? C.cands[0]; } // nothing free: the first spot on the model
    const [cx, cy] = at; chips.push([cx, cy, cx + C.tw, cy + C.h]);
    g.fillStyle = last ? 'rgba(20,18,15,.95)' : 'rgba(20,18,15,.82)'; roundRect(g, cx, cy, C.tw, C.h, 3); g.fill(); if (last) { g.strokeStyle = '#B8914A'; g.lineWidth = 1; g.stroke(); }
    g.fillStyle = '#F4EEDF'; C.lines.forEach((t, j) => g.fillText(t, cx + C.tw / 2, cy + 9 + j * 13));
  });
  if (lay) for (const lb of lay.labels) if (ml.path.includes(lb.i) || lb.i === ml.from) { const [x, y] = rlToScr(lb.x, lb.y, lay.s); rlLabel(g, lb.text, x, y, lb.font); } // names stay readable over the line
  g.restore();
}
function rlArrow(g, a, b, to, color, label) { // a planned move: it stops short of the target's seat, and its day chip keeps off the pieces and names
  const lay = RL_PIECE_CACHE.get('L'), sh = rlLiveBox(lay), avoid = lay ? [...lay.boxes.map(sh), ...lay.labels.map((l) => sh(l.box))] : [];
  const [ax, ay] = toScreen(...a), [tx, ty] = toScreen(...b), st = lay && lay.seats.get(to), L = Math.hypot(tx - ax, ty - ay), cut = Math.min(L * 0.45, (st ? st.r * rlLayK(lay) : 0) + 8), bx = tx - ((tx - ax) / L) * cut, by = ty - ((ty - ay) / L) * cut;
  g.save(); g.strokeStyle = 'rgba(20,18,15,.75)'; g.lineWidth = 5; g.setLineDash([8, 6]); g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke(); g.strokeStyle = color; g.lineWidth = 3; g.stroke(); g.setLineDash([]);
  const ang = Math.atan2(by - ay, bx - ax), head = () => { g.beginPath(); g.moveTo(bx + 2 * Math.cos(ang), by + 2 * Math.sin(ang)); g.lineTo(bx - 12 * Math.cos(ang - 0.4), by - 12 * Math.sin(ang - 0.4)); g.lineTo(bx - 12 * Math.cos(ang + 0.4), by - 12 * Math.sin(ang + 0.4)); g.closePath(); };
  head(); g.strokeStyle = 'rgba(20,18,15,.75)'; g.lineWidth = 2; g.stroke(); g.fillStyle = color; g.fill();
  if (label) {
    const La = Math.hypot(bx - ax, by - ay) || 1, nx = -(by - ay) / La, ny = (bx - ax) / La, up = ny < 0 ? 1 : -1; // a short arrow keeps its chip beside the line, so the line still shows
    const cands = []; for (const t of [0.5, 0.4, 0.6, 0.3, 0.7, 0.2, 0.8]) { if (La >= 90) cands.push([t, 0]); cands.push([t, 20 * up], [t, -20 * up]); }
    const at = ([t, o]) => [ax + (bx - ax) * t + nx * o, ay + (by - ay) * t + ny * o], free = (c) => { const [mx, my] = at(c), r = [mx - 17, my - 11, mx + 17, my + 11]; return !avoid.some((q) => r[2] > q[0] && r[0] < q[2] && r[3] > q[1] && r[1] < q[3]); };
    const [mx, my] = at(cands.find(free) ?? cands[0]);
    g.fillStyle = 'rgba(20,18,15,.9)'; roundRect(g, mx - 16, my - 10, 32, 20, 4); g.fill(); g.fillStyle = '#F4EEDF'; g.font = `600 12px 'IBM Plex Sans Condensed', sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, mx, my + 1);
  }
  g.restore();
}
function rlLiveLabels(g, band) { // the hovered province's and a hovered link's name on the land, when the band does not show it already
  const lay = RL_PIECE_CACHE.get('L'); if (!lay) return;
  for (const i of [hoverProv, RL_LINK.prov]) {
    if (i < 0 || isWild(i) || lay.labels.some((q) => q.i === i)) continue; const c = lay.cand.get(i); if (!c) continue;
    const [x, y] = rlToScr(c.x, c.y, lay.s); rlLabel(g, prov[i].name, x, y, c.font, true);
  }
}

// ---- army pieces: DOM elements in the layer (click selects, the tooltip is the army card, focusable); stacks fan out on hover.
// Only a piece's own silhouette (its .hit: base plus figure) takes the pointer; the map's wheel, drag, right-click and touch pass through it to the canvas.
const RL_PIECE_DOM = new Map(); let rlPieceSigLast = ''; const RL_LAYER_TOP = 44; // .layer { inset: 44px 0 0 0 }
const RL_PRESS = { prov: -1 }; // a touch that starts on a piece: a long-press there marches to the piece's province
const RL_STATUS = (c) => (c.side === 'red' && c.order === 'Pillage' && c.squads.length ? 'fire' : c.order === 'Besiege' ? 'blades' : c.crown ? 'crown' : c.prophet ? 'halo' : null);
function rlDrawPiece(cv, pc, hovered, fanK) { // one piece into its own canvas; the ground point at (ox, oy) in the canvas
  const c0 = cmd[pc.ids[0]], sel = state.sel && state.sel.type === 'cmd' && pc.ids.includes(state.sel.id), lift = sel || hovered ? 2 : 0, notched = c0.side !== VIEWER && c0.side !== 'indep', rim = c0.side === 'indep' ? RL_C.pewter : BAN[c0.side];
  const w = Math.ceil(pc.rx * 2 + pc.B * 1.6 + 16), h = Math.ceil(pc.figH + pc.B * 1.4 + 22), d = Math.min(2, dpr), g = cv.getContext('2d');
  if (cv.width !== Math.round(w * d) || cv.height !== Math.round(h * d)) { cv.width = Math.round(w * d); cv.height = Math.round(h * d); cv.style.width = w + 'px'; cv.style.height = h + 'px'; }
  g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, w, h);
  const ox = w / 2, oy = h - pc.ry - 0.12 * pc.B * 2 - 8; cv.dataset.ox = ox; cv.dataset.oy = oy;
  if (sel) { g.strokeStyle = '#F4EEDF'; g.lineWidth = 2; g.beginPath(); g.ellipse(ox, oy + 0.06 * pc.B, pc.rx + 4, pc.ry + 3, 0, 0, Math.PI * 2); g.stroke(); }
  const top = rlBase(g, ox, oy, pc.rx, pc.ry, rim, { notched, lift, shadowA: lift ? 0.34 : 0.25, brass: pc.kind === 'pretender', rimW: 2.4 });
  const figs = pc.kind === 'stack' ? pc.ids.slice(0, 3) : [pc.ids[0]];
  if (pc.kind === 'army') rlPennant(g, ox - pc.rx * 0.55, top - pc.ry * 0.5, pc.B * 1.25, rim); // the pennant at the base's rear
  figs.forEach((id, k) => { const c = cmd[id], fx = ox + (figs.length > 1 ? (k - (figs.length - 1) / 2) * pc.rx * 0.62 : 0), fy = top - (figs.length > 1 ? (k % 2 ? 0.5 : -0.5) * pc.ry * 0.3 : 0.1 * pc.ry), fh = pc.kind === 'stack' ? (c.crown ? 1.3 : 1) * pc.B * 0.92 : pc.figH;
    rlFigure(g, c.crown ? 'titan' : c.ptype in RL_FIGLOOK ? c.ptype : 'ashChieftain', fx, fy, fh, c.side); });
  const st = pc.kind === 'stack' ? null : RL_STATUS(c0); // one plaque on the front of the base, by exception
  if (st) { const ps = pc.B < 20 ? 10 : 12, px0 = ox - ps / 2, py0 = top + pc.ry * 0.55 - ps * 0.2; g.fillStyle = '#2B2620'; roundRect(g, px0, py0, ps, ps * 0.8, 2); g.fill(); g.strokeStyle = RL_C.brass; g.lineWidth = 1; g.stroke();
    g.strokeStyle = '#F4EEDF'; g.fillStyle = st === 'fire' ? '#FF8A3A' : '#F4EEDF'; g.lineWidth = 1; const cx = ox, cy = py0 + ps * 0.4, u = ps * 0.28;
    if (st === 'crown') { g.fillStyle = '#E2C98E'; g.beginPath(); g.moveTo(cx - u, cy + u * 0.6); g.lineTo(cx - u, cy - u * 0.4); g.lineTo(cx - u * 0.5, cy); g.lineTo(cx, cy - u * 0.7); g.lineTo(cx + u * 0.5, cy); g.lineTo(cx + u, cy - u * 0.4); g.lineTo(cx + u, cy + u * 0.6); g.closePath(); g.fill(); }
    else if (st === 'halo') { g.strokeStyle = '#F3E6B8'; g.beginPath(); g.ellipse(cx, cy, u, u * 0.55, 0, 0, Math.PI * 2); g.stroke(); }
    else if (st === 'fire') { g.beginPath(); g.moveTo(cx, cy - u); g.quadraticCurveTo(cx + u, cy, cx, cy + u * 0.8); g.quadraticCurveTo(cx - u, cy, cx, cy - u); g.fill(); }
    else { g.beginPath(); g.moveTo(cx - u, cy - u); g.lineTo(cx + u, cy + u); g.moveTo(cx + u, cy - u); g.lineTo(cx - u, cy + u); g.stroke(); } }
  if (fanK != null && pc.kind === 'stack') { g.font = "600 11px 'IBM Plex Sans Condensed', sans-serif"; g.textAlign = 'center'; g.fillStyle = 'rgba(20,18,15,.9)'; roundRect(g, ox + pc.rx - 4, top - pc.figH - 2, 18, 14, 3); g.fill(); g.fillStyle = '#F4EEDF'; g.fillText('×' + pc.ids.length, ox + pc.rx + 5, top - pc.figH + 5.5); }
}
// the hit box: the union of the piece's silhouettes (rlArmySh: the base swept down by its side band, and the upright figure with its pennant), plus the 2 px lift
function rlSizeHit(hit, cv, pc) {
  const ox = Number(cv.dataset.ox), oy = Number(cv.dataset.oy), top = oy - pc.figH - (pc.kind === 'army' ? 0.25 * pc.B : 0) - 3, bot = oy + pc.ry + 0.24 * pc.B + 1;
  hit.style.left = (ox - pc.rx - 2).toFixed(1) + 'px'; hit.style.top = top.toFixed(1) + 'px'; hit.style.width = (2 * pc.rx + 4).toFixed(1) + 'px'; hit.style.height = (bot - top).toFixed(1) + 'px';
}
// the map's gestures through a piece: the wheel zooms, a drag pans, a right-click orders the selected army to the piece's province (an attack on an enemy), touch pans, pinches and long-presses
function rlWireHit(hit, provOf, onClick) {
  hit.addEventListener('wheel', (e) => { e.preventDefault(); canvas.dispatchEvent(new WheelEvent('wheel', e)); }, { passive: false });
  hit.addEventListener('contextmenu', (e) => { e.preventDefault(); if (e.pointerType === 'touch') return; orderMove(e.clientX, e.clientY, provOf()); });
  hit.addEventListener('mousedown', (e) => { if (e.button === 0) { drag = true; dragMoved = 0; } });
  for (const t of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) hit.addEventListener(t, (e) => { if (e.pointerType !== 'touch') return; if (t === 'pointerdown') RL_PRESS.prov = provOf(); canvas.dispatchEvent(new PointerEvent(t, e)); });
  hit.addEventListener('click', (e) => { e.stopPropagation(); if (dragMoved > 6) return; onClick(); });
  hit.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } });
}
function rlPlacePieces(band) {
  const lay = RL_PIECE_CACHE.get('L'); if (!lay) return;
  const sigNow = lay.key + '|' + FIGS.ver + '|' + (state.sel ? state.sel.id : '') + '|' + RL_NUMBERS.on + RL_NUMBERS.shift;
  if (sigNow !== rlPieceSigLast) {
    rlPieceSigLast = sigNow; const keep = new Set();
    for (const pc of lay.armies) {
      keep.add(pc.key); let ent = RL_PIECE_DOM.get(pc.key);
      if (!ent) {
        const el = document.createElement('div'); el.className = 'mini'; const cv = document.createElement('canvas'); el.appendChild(cv); const hit = document.createElement('div'); hit.className = 'hit'; el.appendChild(hit); layer.appendChild(el);
        ent = { el, cv, hit, hovered: false, subOver: 0, fan: [], fanT: 0 }; RL_PIECE_DOM.set(pc.key, ent);
        hit.addEventListener('mouseenter', () => { ent.hovered = true; clearTimeout(ent.fanT); if (ent.pc.kind === 'stack') { if (!ent.fanned) rlFan(ent, true); } else rlDrawPiece(ent.cv, ent.pc, true); });
        hit.addEventListener('mouseleave', () => { ent.hovered = false; if (ent.pc.kind === 'stack') rlFanRelease(ent); else rlDrawPiece(ent.cv, ent.pc, false); });
        rlWireHit(hit, () => ent.pc.prov, () => { if (ent.pc.kind !== 'stack') selectCmd(ent.pc.ids[0]); else if (!ent.fanned) rlFan(ent, true); });
      }
      ent.pc = pc; const c0 = cmd[pc.ids[0]], troops = pc.ids.reduce((n, id) => n + cmd[id].squads.reduce((m, q) => m + q[1], 0), 0), hit = ent.hit;
      if (pc.kind === 'stack') delete hit.dataset.tip; else hit.dataset.tip = 'cmd:' + c0.id;
      hit.tabIndex = 0; hit.setAttribute('role', 'button'); hit.setAttribute('aria-label', pc.kind === 'stack' ? `${pc.ids.length} commanders of ${ownerName(pc.side)} in ${names[pc.prov]}` : `${cname(c0)}, ${troops} troops`);
      ent.el.classList.toggle('sel', !!(state.sel && pc.ids.includes(state.sel.id)));
      rlDrawPiece(ent.cv, pc, ent.hovered); rlSizeHit(hit, ent.cv, pc); if (ent.fanned) rlFan(ent, true, true);
      // the numbers layer's count plate under the piece (troops; the strength word where the view is fogged)
      let plate = ent.el.querySelector('.cplate'); if (RL_NUMBERS.on || RL_NUMBERS.shift) { if (!plate) { plate = document.createElement('span'); plate.className = 'cplate'; ent.el.appendChild(plate); } plate.textContent = pc.kind === 'stack' ? '×' + pc.ids.length : String(troops || (c0.crown ? '♛' : '1')); } else if (plate) plate.remove();
    }
    for (const [k, ent] of RL_PIECE_DOM) if (!keep.has(k)) { clearTimeout(ent.fanT); ent.el.remove(); RL_PIECE_DOM.delete(k); }
  }
  for (const [, ent] of RL_PIECE_DOM) {
    const pc = ent.pc, [sx, sy] = rlToScr(pc.x, pc.y, lay.s), off = sx < -60 || sx > cw + 60 || sy < -60 || sy > ch + 80; ent.el.style.display = off ? 'none' : '';
    if (!off) { ent.el.style.left = sx - Number(ent.cv.dataset.ox) + 'px'; ent.el.style.top = sy - RL_LAYER_TOP - Number(ent.cv.dataset.oy) + 'px'; } // the layer starts under the top bar
  }
}
// a fanned stack closes a moment after the pointer has left both the stack and its fanned pieces (the gap between them is crossed in time)
function rlFanRelease(ent) { clearTimeout(ent.fanT); ent.fanT = setTimeout(() => { if (!ent.hovered && ent.subOver <= 0 && ent.fanned) rlFan(ent, false); }, 160); }
function rlFan(ent, on, keepOpen) { // a stack fans out into its pieces on hover; each is clickable with its own card
  ent.fanned = on; for (const f of ent.fan) f.remove(); ent.fan = []; ent.subOver = 0;
  ent.cv.style.opacity = on ? '0.35' : '1';
  if (!on) return; const pc = ent.pc, n = pc.ids.length, Ba = rlBa(rlDpx());
  pc.ids.forEach((id, k) => {
    const c = cmd[id], kind = c.crown ? 'pretender' : c.squads.length ? 'army' : 'lone', B = kind === 'pretender' ? 1.15 * Ba : kind === 'lone' ? 0.8 * Ba : Ba;
    const sub = { ...pc, ids: [id], kind, B, rx: B / 2, ry: (B / 2) * 0.64, figH: B * 1.15 * (kind === 'pretender' ? 1.3 : 1) };
    const el = document.createElement('div'); el.className = 'mini fanned'; const cv = document.createElement('canvas'); el.appendChild(cv); const hit = document.createElement('div'); hit.className = 'hit'; el.appendChild(hit); ent.el.appendChild(el); rlDrawPiece(cv, sub, false); rlSizeHit(hit, cv, sub);
    const a = Math.PI + (Math.PI * (k + 1)) / (n + 1), dx = Math.cos(a) * Ba * 1.15, dy = Math.sin(a) * Ba * 0.95 - Ba * 0.25;
    el.style.left = Number(ent.cv.dataset.ox) + dx - Number(cv.dataset.ox) + 'px'; el.style.top = Number(ent.cv.dataset.oy) + dy - Number(cv.dataset.oy) + 'px';
    hit.dataset.tip = 'cmd:' + id; hit.tabIndex = 0; hit.setAttribute('role', 'button'); hit.setAttribute('aria-label', cname(c));
    rlWireHit(hit, () => ent.pc.prov, () => selectCmd(id));
    hit.addEventListener('mouseenter', () => { ent.subOver++; clearTimeout(ent.fanT); rlDrawPiece(cv, sub, true); });
    hit.addEventListener('mouseleave', () => { ent.subOver = Math.max(0, ent.subOver - 1); rlDrawPiece(cv, sub, false); rlFanRelease(ent); });
    ent.fan.push(el);
  });
  void keepOpen;
}
