// Runtime-only preview of the critique's drawing fixes (evaluated in the page closure through __mock.ev; no part file is edited).
// window.__FIX lists which to apply: F1 canopy lit, F2 plains trees, F3 peak faces, F4 water banks on light ground, F5 paint strength, F6 grass.
(() => {
  const on = (k) => (window.__FIX || []).includes(k);
  const swap = (fnSrc, pairs) => { let s = fnSrc; for (const [a, b] of pairs) { if (!s.includes(a)) throw new Error('missing: ' + a); s = s.split(a).join(b); } return s; };
  if (on('F1')) { // forest crowns: lit face +22 L* (was +12) at Mid and Near; Far keeps today's masses
    const _pP = paletteP; paletteP = function (i, band, line) { const P = _pP(i, band, line); return terr[i] === 'forest' && band !== 'far' && !line ? { ...P, lit: mix(shadeL(P.fill, 22), '#F6D9A0', 0.12) } : P; };
  }
  if (on('F2')) { // trees on Plains (copses, hedgerow crowns) in tree faces: the faces of the Forest fill + 20 L*, trunk Forest - 6
    const _dc = drawClump; drawClump = function (g, crowns, P, o) { if (P && !P.line && P.fill === TERRAIN.plains.fill) { const tf = shadeL(TERRAIN.forest.fill, 20); P = { ...P, ...faces(tf), trunk: shadeL(TERRAIN.forest.fill, -6), dark: false }; } return _dc(g, crowns, P, o); };
  }
  if (on('F3')) { // passable peaks: faces from the Mountains fill (lit = faces().lit, shade = fill - 26 L* toward the cool shadow), not the literal #B4C1C6 / #6E7F86
    const _pk = peakPaint; peakPaint = function (g, q, cols, P, line) { if (cols && cols.lit === '#B4C1C6' && P && P.fill) cols = { ...cols, lit: faces(P.fill).lit, shade: mix(shadeL(P.fill, -26), '#3A4466', 0.14) }; return _pk(g, q, cols, P, line); };
  }
  if (on('F4')) { // water on light ground: on Mountains both brook banks at .8 and 1.1 band px, the pond bank 1.2 band px at .9
    drawWater = eval('(' + swap(drawWater.toString(), [
      ["if (dark) { g.strokeStyle = 'rgba(232,220,194,.55)'; g.stroke(hi); } else { g.lineWidth = 0.8 * PX; g.strokeStyle = 'rgba(53,83,90,.55)'; g.stroke(hi); }", "if (dark) { g.strokeStyle = 'rgba(232,220,194,.55)'; g.stroke(hi); } else if (terr[i] === 'mountains') { g.strokeStyle = 'rgba(53,83,90,.8)'; g.stroke(hi); } else { g.lineWidth = 0.8 * PX; g.strokeStyle = 'rgba(53,83,90,.55)'; g.stroke(hi); }"],
      ["true, 0.8 * PX, 'rgba(53,83,90,.7)')", "true, terr[i] === 'mountains' ? 1.2 * PX : 0.8 * PX, terr[i] === 'mountains' ? 'rgba(53,83,90,.9)' : 'rgba(53,83,90,.7)')"],
    ]) + ')');
  }
  if (on('F5')) { // paint strength: paper tooth 128 +-20 -> +-28 (fine 12 -> 17, coarse 8 -> 11); granulation plains .25 -> .5, farmland .2 -> .45
    paperTile = eval('(' + swap(paperTile.toString(), [['vnoiseTile(S, R, 170, 12)', 'vnoiseTile(S, R, 170, 17)'], ['vnoiseTile(S, R, 6, 8)', 'vnoiseTile(S, R, 6, 11)']]) + ')');
    PAPER = null; PAINT.plains.G = 0.5; PAINT.farmland.G = 0.45;
  }
  if (on('F6')) { // grass: Plains stipple -> tufts of three strokes (Mid, Near); Hills and Swamp get light tufts (they had none / streaks only)
    const tuft = "{ const tc = (dl, a) => rgba(shadeL(f, dl), a); const tufts = (n, dl, a) => { g.strokeStyle = tc(dl, a); g.lineWidth = 0.7 * PX; g.lineCap = 'round'; g.beginPath(); for (let m = 0; m < n; m++) { const x = rx(), y = ry(), L = (2.2 + 1.4 * R()) * U, a0 = -Math.PI / 2 + (R() - 0.5) * 0.3; for (const da of [-0.3, 0, 0.3]) { const l = da ? 0.75 * L : L; g.moveTo(x, y); g.lineTo(x + Math.cos(a0 + da) * l, y + Math.sin(a0 + da) * l); } } g.stroke(); g.lineCap = 'butt'; };";
    groundP = eval('(' + swap(groundP.toString(), [
      ["for (let n = 0; n < 120 * k; n++) { g.fillStyle = rgba(shadeL(f, R() < 0.5 ? -8 : 8), 0.55); ellipse(g, rx(), ry(), 1.1, 1.1); g.fill(); }", tuft + " if (band === 'far') { for (let n = 0; n < 120 * k; n++) { g.fillStyle = rgba(shadeL(f, R() < 0.5 ? -8 : 8), 0.55); ellipse(g, rx(), ry(), 1.1, 1.1); g.fill(); } } else tufts(Math.round(160 * k), -22, 0.5); }"],
      ["case 'hills': break;", "case 'hills': " + tuft + " if (band !== 'far') tufts(Math.round(120 * k), 12, 0.45); } break;"],
      ["case 'swamp': {", "case 'swamp': { " + tuft + " if (band !== 'far') tufts(Math.round(90 * k), 14, 0.45); }"],
    ]) + ')');
  }

  if (on('F5b')) { // stronger paint: tooth fine 12 -> 24, coarse 8 -> 11, paper soft-light .5 -> .6; granulation x1.6 (cap .9)
    paperTile = eval('(' + swap(paperTile.toString(), [['vnoiseTile(S, R, 170, 12)', 'vnoiseTile(S, R, 170, 24)'], ['vnoiseTile(S, R, 6, 8)', 'vnoiseTile(S, R, 6, 11)']]) + ')');
    paintGround = eval('(' + swap(paintGround.toString(), [["g.globalCompositeOperation = 'soft-light'; g.globalAlpha = 0.5; g.fillStyle = worldPattern(g, paperTile(), band)", "g.globalCompositeOperation = 'soft-light'; g.globalAlpha = 0.6; g.fillStyle = worldPattern(g, paperTile(), band)"]]) + ')');
    PAPER = null; for (const t of Object.keys(PAINT)) PAINT[t].G = Math.min(0.9, PAINT[t].G * 1.6);
  }
  if (on('F6b')) { // dense grass: Plains 600 k tufts at -20 / .5, Hills 400 k at +12 / .45, Swamp 300 k at +14 / .45; 0.9 band px strokes (Mid, Near)
    const tuft = "{ const tc = (dl, a) => rgba(shadeL(f, dl), a); const tufts = (n, dl, a) => { g.strokeStyle = tc(dl, a); g.lineWidth = 0.9 * PX; g.lineCap = 'round'; g.beginPath(); for (let m = 0; m < n; m++) { const x = rx(), y = ry(), L = (2.2 + 1.4 * R()) * U, a0 = -Math.PI / 2 + (R() - 0.5) * 0.3; for (const da of [-0.3, 0, 0.3]) { const l = da ? 0.75 * L : L; g.moveTo(x, y); g.lineTo(x + Math.cos(a0 + da) * l, y + Math.sin(a0 + da) * l); } } g.stroke(); g.lineCap = 'butt'; };";
    groundP = eval('(' + swap(groundP.toString(), [
      ["for (let n = 0; n < 120 * k; n++) { g.fillStyle = rgba(shadeL(f, R() < 0.5 ? -8 : 8), 0.55); ellipse(g, rx(), ry(), 1.1, 1.1); g.fill(); }", tuft + " if (band === 'far') { for (let n = 0; n < 120 * k; n++) { g.fillStyle = rgba(shadeL(f, R() < 0.5 ? -8 : 8), 0.55); ellipse(g, rx(), ry(), 1.1, 1.1); g.fill(); } } else tufts(Math.round(600 * k), -20, 0.5); }"],
      ["case 'hills': break;", "case 'hills': " + tuft + " if (band !== 'far') tufts(Math.round(400 * k), 12, 0.45); } break;"],
      ["case 'swamp': {", "case 'swamp': { " + tuft + " if (band !== 'far') tufts(Math.round(300 * k), 14, 0.45); }"],
    ]) + ')');
  }

  if (on('F7')) { // Mid only: each forest clump modelled as one mass lit from the upper left (a linear wash clipped to its crowns: fill + 28 L* at .55
    // on the upper-left third, nothing in the middle, fill - 10 L* at .30 on the lower-right), so a clump reads at the start zoom where single crowns average out
    const _dc2 = drawClump; drawClump = function (g, crowns, P, o) { const r = _dc2(g, crowns, P, o);
      if (P && !P.line && P.fill === TERRAIN.forest.fill && P.PX === 1 / BAND_RES.mid && crowns.length > 1) {
        let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const c of crowns) { x0 = Math.min(x0, c.x - c.r); x1 = Math.max(x1, c.x + c.r); y0 = Math.min(y0, c.y - 1.95 * c.r); y1 = Math.max(y1, c.y + 0.05 * c.r); }
        g.save(); g.beginPath(); for (const c of crowns) { g.moveTo(c.x + c.r, c.y - 0.95 * c.r); g.arc(c.x, c.y - 0.95 * c.r, c.r, 0, Math.PI * 2); } g.clip();
        const lg = g.createLinearGradient(x0, y0, x1, y1); lg.addColorStop(0, rgba(shadeL(P.fill, 28), 0.55)); lg.addColorStop(0.45, rgba(shadeL(P.fill, 28), 0)); lg.addColorStop(0.6, rgba(shadeL(P.fill, -10), 0)); lg.addColorStop(1, rgba(shadeL(P.fill, -10), 0.3));
        g.fillStyle = lg; g.fillRect(x0, y0, x1 - x0, y1 - y0); g.restore(); }
      return r; };
  }

  if (on('F8')) { // canopy density: every crown at Mid (CANOPY_KEEP.mid .55 -> 1), crowns closer (crowd 0.75 -> 0.6 of r + r'), more tries (14 -> 24)
    CANOPY_KEEP.mid = 1; if (on('F8n')) CANOPY_KEEP.near = 1;
    canopyAll = eval('(' + swap(canopyAll.toString(), [['Math.hypot(q.x - x, q.y - y) < 0.75 * (q.r + r)', 'Math.hypot(q.x - x, q.y - y) < 0.6 * (q.r + r)'], ['(3.6 * U) ** 2)) * 14)', '(3.6 * U) ** 2)) * 24)']]) + ')');
    CANOPY.clear();
  }

  if (on('F9')) { // canopy room: border inset B_u only on owned land (2 u + 6 elsewhere), crowns may stand half a crown from a track or brook,
    // one or two glades of 0.06 to 0.09 D (was two to four of 0.08 to 0.12 D); with F8's density changes
    canopyAll = eval('(' + swap(canopyAll.toString(), [['ng = 2 + Math.floor(R() * 3)', 'ng = 1 + Math.floor(R() * 2)'], ['r = (0.08 + 0.04 * R()) * D', 'r = (0.06 + 0.03 * R()) * D'], ['distToEdge(cv, x, vy) - 6 < B_U + 2 * U', 'distToEdge(cv, x, vy) - 6 < (prov[i].owner ? B_U : 0) + 2 * U'], ['stampBlocked(i, x, vy, r)', 'stampBlocked(i, x, vy, 0.5 * r)']]) + ')');
    CANOPY.clear();
  }

  window.__M = on('F9m');
  if (on('F9b')) { // as F9, but only tracks get the half-crown allowance (0.5 r + 1 u); brooks, ponds and marks keep the full r clearance
    window.canopyBlocked = function (i, x, y, r) { const F = feats(), blk = F.block.get(i); if (!blk) return false; const wt = F.water.get(i);
      if (F.tracks.some((h) => h.s === i && distToPolyline(h.pts, x, y) < 0.5 * r + U)) return true;
      if (wt && wt.brook && distToPolyline(wt.brook, x, y) < r + (window.__M ? 4 : 2) * U) return true;
      if (blk.pond && Math.hypot(x - blk.pond.x, (y - blk.pond.y) / 0.75) < (window.__M ? 1.25 : 1) * blk.pond.r + r + (window.__M ? 2 * U : 0)) return true;
      return blk.marks.some(([mx, my, mr]) => Math.hypot(x - mx, y - my) < mr + r + (window.__M ? 3 * U : 0)); };
    canopyAll = eval('(' + swap(canopyAll.toString(), [['ng = 2 + Math.floor(R() * 3)', 'ng = 1 + Math.floor(R() * 2)'], ['r = (0.08 + 0.04 * R()) * D', 'r = (0.06 + 0.03 * R()) * D'], ['distToEdge(cv, x, vy) - 6 < B_U + 2 * U', 'distToEdge(cv, x, vy) - 6 < (prov[i].owner ? B_U : 0) + 2 * U'], ['stampBlocked(i, x, vy, r)', 'window.canopyBlocked(i, x, vy, r)']]) + ')');
    CANOPY.clear();
  }
  FILLMEMO.clear(); FACEMEMO.clear(); resetGeometryCaches(false); invalidateBakes(); refreshKeys(); firstPaint = true; draw();
  return window.__FIX;
})()
