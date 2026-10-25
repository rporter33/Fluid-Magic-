// AD probes (read-only; review only). Loaded with addScriptTag into the mockup page.
window.__ad = (() => {
  const Lof = (d, k) => { const r = d[k] / 255, g = d[k + 1] / 255, b = d[k + 2] / 255; const f = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)); const Y = 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); return Y > 0.008856 ? 116 * Math.cbrt(Y) - 16 : 903.3 * Y; };
  const frame = (skip) => rlRedraw(skip);
  const landSkip = ['rails', 'pieces', 'labels', 'badges', 'arrows'];
  function lumArr(d) { const W2 = canvas.width, H2 = canvas.height, L = new Float32Array(W2 * H2); for (let k = 0, o = 0; k < L.length; k++, o += 4) L[k] = Lof(d, o); return L; }
  function blur(L, W2, H2, r) { const t = new Float32Array(L.length), o = new Float32Array(L.length); for (let y = 0; y < H2; y++) { let s = 0, n = 0; for (let x = -r; x < W2 + r; x++) { if (x + r < W2) { s += L[y * W2 + x + r]; n++; } if (x - r - 1 >= 0) { s -= L[y * W2 + x - r - 1]; n--; } if (x >= 0) t[y * W2 + x] = s / n; } }
    for (let x = 0; x < W2; x++) { let s = 0, n = 0; for (let y = -r; y < H2 + r; y++) { if (y + r < H2) { s += t[(y + r) * W2 + x]; n++; } if (y - r - 1 >= 0) { s -= t[(y - r - 1) * W2 + x]; n--; } if (y >= 0) o[y * W2 + x] = s / n; } } return o; }
  // masks: R channel = within `bw` CSS px of a passable province edge (any shared edge between two non-wild provinces); G channel = wild cells; B = model land
  function masks(bw) {
    const W2 = canvas.width, H2 = canvas.height, c = document.createElement('canvas'); c.width = W2; c.height = H2; const g = c.getContext('2d');
    g.setTransform(dpr * cam.s, 0, 0, dpr * cam.s, dpr * cam.x, dpr * cam.y);
    g.fillStyle = 'rgb(0,0,255)'; modelPath(g); g.fill();
    g.globalCompositeOperation = 'lighter';
    g.fillStyle = 'rgb(0,255,0)'; for (const w of WILDS) for (const ci of w.cells) { pathPoly(g, cells[ci]); g.fill(); }
    g.strokeStyle = 'rgb(255,0,0)'; g.lineWidth = (2 * bw) / cam.s; g.lineCap = 'round';
    for (const [, e] of EDGE) { if (isWild(e.i) || isWild(e.j)) continue; g.beginPath(); const P = e.wobble ?? [e.a, e.b]; P.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); }
    return g.getImageData(0, 0, W2, H2).data;
  }
  // how much of the land's lightness structure sits on province borders: gradient energy within bw px of a border over its area share
  function borderEnrich(skip, bw = 4, thr = 6) {
    const d = frame(skip), W2 = canvas.width, H2 = canvas.height, L = blur(lumArr(d), W2, H2, Math.round(1 * dpr)), M = masks(bw), v = viewRect(), s = Math.round(2 * dpr);
    let eB = 0, eA = 0, nB = 0, nA = 0, sB = 0, sA = 0;
    for (let y = Math.ceil((v.t + 6) * dpr); y < Math.floor((v.b - 6) * dpr); y++) for (let x = Math.ceil((v.l + 6) * dpr); x < Math.floor((v.r - 6) * dpr); x++) {
      const k = y * W2 + x, o = k * 4; if (M[o + 2] < 128 || M[o + 1] > 0) continue; // land only, not wilds
      const gx = L[k + s] - L[k - s], gy = L[k + s * W2] - L[k - s * W2], gm = Math.sqrt(gx * gx + gy * gy), b = M[o] > 0;
      nA++; eA += gm; if (gm > thr) sA++; if (b) { nB++; eB += gm; if (gm > thr) sB++; }
    }
    return { areaShare: +(nB / nA).toFixed(3), energyShare: +(eB / eA).toFixed(3), enrich: +((eB / eA) / (nB / nA)).toFixed(2), strongShare: +(sB / sA).toFixed(3), strongEnrich: +((sB / sA) / (nB / nA)).toFixed(2), px: nA };
  }
  // fine-detail energy (|L - box3(L)|) inside the wilds vs on the land around them (within 40 px), on the land frame
  function wildSharp() {
    const d = frame(landSkip), W2 = canvas.width, H2 = canvas.height, L = lumArr(d), B = blur(L, W2, H2, Math.round(2 * dpr)), M = masks(4), v = viewRect();
    const acc = { wild: [0, 0], land: [0, 0] };
    for (let y = Math.ceil((v.t + 6) * dpr); y < Math.floor((v.b - 6) * dpr); y++) for (let x = Math.ceil((v.l + 6) * dpr); x < Math.floor((v.r - 6) * dpr); x++) {
      const k = y * W2 + x, o = k * 4; if (M[o + 2] < 128) continue; const hf = Math.abs(L[k] - B[k]); const t = M[o + 1] > 0 ? acc.wild : acc.land; t[0] += hf; t[1]++;
    }
    return { wildHF: +(acc.wild[0] / acc.wild[1]).toFixed(2), landHF: +(acc.land[0] / acc.land[1]).toFixed(2), ratio: +((acc.wild[0] / acc.wild[1]) / (acc.land[0] / acc.land[1])).toFixed(2), wildPx: acc.wild[1], landPx: acc.land[1] };
  }
  // per faint edge: the visible change the line makes (WCAG of the line pixel against the same pixel without lines), the best over +-1.5 px, median per edge
  function faintEdges() {
    const land = frame(landSkip), lines = frame(['pieces', 'labels', 'badges', 'arrows']), W2 = canvas.width, H2 = canvas.height, v = viewRect(), out = [];
    const px = (d, sx, sy) => { const X = Math.floor(sx * dpr), Y = Math.floor(sy * dpr); if (X < 0 || Y < 0 || X >= W2 || Y >= H2) return null; const k = (Y * W2 + X) * 4; return [d[k], d[k + 1], d[k + 2]]; };
    for (const dr of RL_LINES.drawn) { if (!dr.faint || dr.fog) continue; const e = dr.e, [ax, ay] = toScreen(...e.a), [bx, by] = toScreen(...e.b), Lg = Math.hypot(bx - ax, by - ay); if (Lg < 16) continue; const nx = -(by - ay) / Lg, ny = (bx - ax) / Lg, S = [];
      for (let s = 4; s < Lg - 4; s += 3) { const sx = ax + ((bx - ax) * s) / Lg, sy = ay + ((by - ay) * s) / Lg; if (sx < v.l + 8 || sx > v.r - 8 || sy < v.t + 8 || sy > v.b - 8) continue; let b = 1; for (let o = -1.5; o <= 1.5; o += 0.5) { const a = px(lines, sx + nx * o, sy + ny * o), c = px(land, sx + nx * o, sy + ny * o); if (a && c) b = Math.max(b, rlWcag(a, c)); } S.push(b); }
      if (S.length < 3) continue; S.sort((p, q) => p - q); out.push({ e: names[e.i] + '/' + names[e.j], kind: dr.kind, a: +dr.alpha.toFixed(3), med: +S[S.length >> 1].toFixed(3), terr: terr[e.i] + '/' + terr[e.j] }); }
    const m = out.map((q) => q.med).sort((p, q) => p - q), q = (f) => m[Math.min(m.length - 1, Math.floor(f * m.length))];
    return { edges: out.length, p10: q(0.1), p50: q(0.5), p90: q(0.9), under110: out.filter((q) => q.med < 1.1).length, under115: out.filter((q) => q.med < 1.15).length, over15: out.filter((q) => q.med >= 1.5).length, lost: out.filter((q) => q.med < 1.1).map((q) => q.e + ' (' + q.terr + ', a ' + q.a + ', ' + q.med + ')').slice(0, 12), loud: out.filter((q) => q.med >= 1.5).map((q) => q.e + ' (' + q.terr + ', ' + q.med + ')').slice(0, 8) };
  }
  // the Far relief's per-province neutralisation: the mean offset each province had removed (grey levels, soft-light), and the step it makes across shared edges
  function farMeans() {
    const FP = RL_P.farRelief, { QW, QH, TX, hh, HW, HH, hid } = RB, N = RB.nw, src = N ? N.hX : hh, h4 = new Float32Array(QW * QH), id4 = new Uint8Array(QW * QH);
    for (let y = 0; y < QH; y++) for (let x = 0; x < QW; x++) { const k = (y * 2 + 1) * HW + x * 2 + 1; h4[y * QW + x] = src[k]; id4[y * QW + x] = hid[k]; }
    const hs = rlBoxBlur(h4, QW, QH, Math.max(1, Math.round((FP.blurD * RLD * TX) / 4)), 2), VS = RL_P.vScale * RLK * FP.ex, dxw = 4 / TX, [lx, ly, lz] = RL_LIGHT, at = (x, y) => hs[(y < 0 ? 0 : y >= QH ? QH - 1 : y) * QW + (x < 0 ? 0 : x >= QW ? QW - 1 : x)];
    const sum = new Float64Array(256), cnt = new Float64Array(256), stepW = (FP.castD * RLD) / FP.steps, stepT = stepW / dxw;
    for (let y = 0, k = 0; y < QH; y++) for (let x = 0; x < QW; x++, k++) { if (id4[k] === 255) continue;
      const dzdx = ((at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x - 1, y) - at(x - 1, y + 1)) * VS) / (8 * dxw), dzdy = ((at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x, y - 1) - at(x + 1, y - 1)) * VS) / (8 * dxw);
      const s = Math.max(0, (-dzdx * lx - dzdy * ly + lz) / Math.sqrt(dzdx * dzdx + dzdy * dzdy + 1)), v = rlTanh(FP.gain * (s - RL_SIN_EL)), z0 = hs[k] * VS; let occ = 0;
      for (let m = 1; m <= FP.steps; m++) { const sx = x + 0.5 - 0.70710678 * stepT * m, sy = y + 0.5 - 0.70710678 * stepT * m; if (sx < 0 || sy < 0) break; const zs = rlBilin(hs, QW, QH, sx, sy) * VS - (z0 + stepW * m * RL_TAN_EL); if (zs > occ) occ = zs; }
      const c = rlSmooth(0, 0.05 * RLD, occ), off = FP.lit * Math.max(0, v) + FP.shade * Math.min(0, v) - FP.cast * c; sum[id4[k]] += off; cnt[id4[k]]++; }
    const mean = (i) => (cnt[i] ? sum[i] / cnt[i] : 0), ms = provList.map(mean).sort((a, b) => a - b), steps = [];
    for (const [, e] of EDGE) { if (isWild(e.i) || isWild(e.j)) continue; steps.push(Math.abs(mean(e.i) - mean(e.j))); } steps.sort((a, b) => a - b);
    const q = (A, f) => +A[Math.min(A.length - 1, Math.floor(f * A.length))].toFixed(1);
    return { meanRemoved: { min: q(ms, 0), p10: q(ms, 0.1), p50: q(ms, 0.5), p90: q(ms, 0.9), max: q(ms, 1) }, edgeStep: { p50: q(steps, 0.5), p90: q(steps, 0.9), max: q(steps, 1), over8: steps.filter((x) => x > 8).length, edges: steps.length }, note: 'grey levels around 128 in the soft-light raster (the step each shared edge gets from the per-province mean removal)' };
  }
  // across each passable shared edge: the median |L(+r) - L(-r)| at r px on the land frame (r = 3 and r = 12), so a crisp polygon step shows as step3 close to step12
  function edgeSteps(skip) {
    const d = frame(skip ?? landSkip), W2 = canvas.width, H2 = canvas.height, v = viewRect(), out = [];
    const Lp = (sx, sy) => { const X = Math.floor(sx * dpr), Y = Math.floor(sy * dpr); if (X < 0 || Y < 0 || X >= W2 || Y >= H2) return null; return Lof(d, (Y * W2 + X) * 4); };
    for (const [, e] of EDGE) { if (isWild(e.i) || isWild(e.j)) continue; const [ax, ay] = toScreen(...e.a), [bx, by] = toScreen(...e.b), Lg = Math.hypot(bx - ax, by - ay); if (Lg < 20) continue; const nx = -(by - ay) / Lg, ny = (bx - ax) / Lg;
      const s3 = [], s12 = []; for (let s = 6; s < Lg - 6; s += 3) { const sx = ax + ((bx - ax) * s) / Lg, sy = ay + ((by - ay) * s) / Lg; if (sx < v.l + 16 || sx > v.r - 16 || sy < v.t + 16 || sy > v.b - 16) continue; const m = (r) => { let a = 0, b = 0, n = 0; for (let t = -1; t <= 1; t++) { const p = Lp(sx + nx * r + (bx - ax) / Lg * t * 2, sy + ny * r + (by - ay) / Lg * t * 2), q = Lp(sx - nx * r + (bx - ax) / Lg * t * 2, sy - ny * r + (by - ay) / Lg * t * 2); if (p != null && q != null) { a += p; b += q; n++; } } return n ? Math.abs(a - b) / n : null; }; const a3 = m(3), a12 = m(12); if (a3 != null && a12 != null) { s3.push(a3); s12.push(a12); } }
      if (s3.length < 3) continue; const med = (A) => A.sort((p, q) => p - q)[A.length >> 1]; out.push({ e: names[e.i] + '/' + names[e.j], same: terr[e.i] === terr[e.j], s3: med(s3), s12: med(s12) }); }
    const diff = out.filter((q) => !q.same), same = out.filter((q) => q.same), med = (A) => { const s = A.slice().sort((p, q) => p - q); return s.length ? +s[s.length >> 1].toFixed(1) : null; };
    return { edges: out.length, diffTerrain: { n: diff.length, step3: med(diff.map((q) => q.s3)), step12: med(diff.map((q) => q.s12)), crisp: diff.filter((q) => q.s3 >= 0.7 * q.s12 && q.s12 > 6).length }, sameTerrain: { n: same.length, step3: med(same.map((q) => q.s3)), step12: med(same.map((q) => q.s12)) } };
  }
  // the phone and other small views: wild names longer than their wild, labels and chips off the model, chips under DOM pieces
  function overflow() {
    const lay = RL_PIECE_CACHE.get('L'); if (!lay) return null; const sh = rlLiveBox(lay), cr = canvas.getBoundingClientRect(), [mx0, my0] = toScreen(0, 0), [mx1, my1] = toScreen(W, H), out = { wildNames: [], labelsOffModel: [], chips: [], piecesOverChips: 0 };
    for (const op of lay.wildOps) { const w = op.w; let bb = [Infinity, Infinity, -Infinity, -Infinity]; for (const c of w.cells) { const b = bboxOf(cells[c]); bb = [Math.min(bb[0], b[0]), Math.min(bb[1], b[1]), Math.max(bb[2], b[2]), Math.max(bb[3], b[3])]; } const [a, b] = toScreen(bb[0], bb[1]), [c, d] = toScreen(bb[2], bb[3]);
      const box = op.box ? sh(op.box) : op.gl ? null : null; out.wildNames.push({ wild: w.name, wildPx: [+(c - a).toFixed(0), +(d - b).toFixed(0)], nameBox: box ? box.map((v) => +v.toFixed(0)) : 'glyphs', overflow: box ? +(Math.max(0, a - box[0]) + Math.max(0, box[2] - c) + Math.max(0, b - box[1]) + Math.max(0, box[3] - d)).toFixed(0) : null }); }
    for (const l of lay.labels) { const b = sh(l.box); if (b[0] < mx0 || b[2] > mx1 || b[1] < my0 || b[3] > my1 + RL_FACE * cam.s) out.labelsOffModel.push(l.text); }
    const pieces = [...document.querySelectorAll('.army, .piece, [data-cmd]')].filter((e) => e.offsetParent).map((e) => { const q = e.getBoundingClientRect(); return [q.left - cr.left, q.top - cr.top, q.right - cr.left, q.bottom - cr.top]; });
    for (const c of RL_THREAD_CHIPS.list) { const b = c.box, hit = pieces.filter((q) => b[2] > q[0] && b[0] < q[2] && b[3] > q[1] && b[1] < q[3]).length, onModel = b[0] >= mx0 && b[2] <= mx1 && b[1] >= my0 && b[3] <= my1; out.chips.push({ text: c.text, box: b, onModel, underDomPieces: hit }); }
    out.domPieces = pieces.length; out.modelPx = [+(mx1 - mx0).toFixed(0), +(my1 - my0).toFixed(0)]; return out;
  }

  // fine detail (|L - box5(L)|) in cores (8 px in from the outline): the wilds' peaks and mere, the passable mountains, forest, the rest of the land; on the land frame
  function hfCores() {
    const d = frame(landSkip), W2 = canvas.width, H2 = canvas.height, L = lumArr(d), B = blur(L, W2, H2, Math.round(2 * dpr)), v = viewRect();
    const c = document.createElement('canvas'); c.width = W2; c.height = H2; const g = c.getContext('2d'); g.setTransform(dpr * cam.s, 0, 0, dpr * cam.s, dpr * cam.x, dpr * cam.y);
    const cls = (i) => (isWild(i) ? (WILDS.find((w) => w.cells.includes(i)).kind === 'peaks' ? 1 : 2) : terr[i] === 'mountains' ? 3 : terr[i] === 'forest' ? 4 : 5);
    for (let i = 0; i < cells.length; i++) { if (!cells[i]) continue; const k = (() => { try { return cls(i); } catch (e) { return 0; } })(); if (!k) continue; pathPoly(g, cells[i]); g.fillStyle = `rgb(${k * 40},0,0)`; g.fill(); }
    g.strokeStyle = 'rgb(0,0,0)'; g.lineWidth = 16 / cam.s; for (const [, e] of EDGE) { g.beginPath(); const P = e.wobble ?? [e.a, e.b]; P.forEach(([x, y], q) => (q ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); }
    for (const w of WILDS) for (const e of rlWildOutline(w)) { g.beginPath(); g.moveTo(...e.a); g.lineTo(...e.b); g.stroke(); }
    const M = g.getImageData(0, 0, W2, H2).data, acc = {};
    for (let y = Math.ceil((v.t + 6) * dpr); y < Math.floor((v.b - 6) * dpr); y++) for (let x = Math.ceil((v.l + 6) * dpr); x < Math.floor((v.r - 6) * dpr); x++) { const k = y * W2 + x, m = Math.round(M[k * 4] / 40); if (!m) continue; const a = (acc[m] ??= [0, 0, []]); const hf = Math.abs(L[k] - B[k]); a[0] += hf; a[1]++; if ((k & 7) === 0) a[2].push(L[k]); }
    const nm = { 1: 'peaksWild', 2: 'mereWild', 3: 'mountains', 4: 'forest', 5: 'otherLand' }, out = {};
    for (const [m, a] of Object.entries(acc)) { a[2].sort((p, q) => p - q); const q = (f) => +a[2][Math.min(a[2].length - 1, Math.floor(f * a[2].length))].toFixed(1); out[nm[m]] = { hf: +(a[0] / a[1]).toFixed(2), px: a[1], Lp5: q(0.05), Lp50: q(0.5), Lp95: q(0.95) }; }
    return out;
  }
  function farRaster() { const cv = rlFarRaster(); return cv.toDataURL('image/png'); }
  return { hfCores, farRaster, borderEnrich, wildSharp, faintEdges, farMeans, edgeSteps, overflow, landSkip };
})();
