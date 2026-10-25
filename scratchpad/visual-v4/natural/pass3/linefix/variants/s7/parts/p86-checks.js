
// ------------------------------------------------------------------ v3 step 14 and 15 review aids: the paint check (?paintcheck), the track check and the
// silhouette sheet (?silhouettes). Read-only helpers for automated review; the game UI never calls them.
function dE2000(l1, l2) {
  const [L1, a1, b1] = l1, [L2, a2, b2] = l2, rad = Math.PI / 180;
  const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2), Cm = (C1 + C2) / 2, G = 0.5 * (1 - Math.sqrt(Cm ** 7 / (Cm ** 7 + 25 ** 7)));
  const a1p = (1 + G) * a1, a2p = (1 + G) * a2, C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);
  const h1p = (Math.atan2(b1, a1p) / rad + 360) % 360, h2p = (Math.atan2(b2, a2p) / rad + 360) % 360;
  const dLp = L2 - L1, dCp = C2p - C1p; let dhp = h2p - h1p; if (C1p * C2p === 0) dhp = 0; else if (dhp > 180) dhp -= 360; else if (dhp < -180) dhp += 360;
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp / 2) * rad), Lpm = (L1 + L2) / 2, Cpm = (C1p + C2p) / 2;
  let hpm = h1p + h2p; if (C1p * C2p !== 0) { if (Math.abs(h1p - h2p) > 180) hpm += h1p + h2p < 360 ? 360 : -360; hpm /= 2; }
  const T = 1 - 0.17 * Math.cos((hpm - 30) * rad) + 0.24 * Math.cos(2 * hpm * rad) + 0.32 * Math.cos((3 * hpm + 6) * rad) - 0.2 * Math.cos((4 * hpm - 63) * rad);
  const dTh = 30 * Math.exp(-(((hpm - 275) / 25) ** 2)), Rc = 2 * Math.sqrt(Cpm ** 7 / (Cpm ** 7 + 25 ** 7)), Sl = 1 + (0.015 * (Lpm - 50) ** 2) / Math.sqrt(20 + (Lpm - 50) ** 2), Sc = 1 + 0.045 * Cpm, Sh = 1 + 0.015 * Cpm * T, Rt = -Math.sin(2 * dTh * rad) * Rc;
  return Math.sqrt((dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh));
}
const CVD = { protan: [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998], deutan: [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182, 0.04294, 0.968881], tritan: [1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.3039] };
function cvdRgb(rgb, m) { const l = rgb.map(s2l), o = [0, 1, 2].map((r) => m[r * 3] * l[0] + m[r * 3 + 1] * l[1] + m[r * 3 + 2] * l[2]); return o.map((v) => l2s(Math.max(0, Math.min(1, v)))); }
function meanRgbIn(i, band, opt) { // bake a province and average its polygon's pixels (linear light), returned as sRGB
  const G = geo(i), bb = [G.bb[0] - 2, G.bb[1] - 2, G.bb[2] + 2, G.bb[3] + 2], res = BAND_RES[band];
  const B = bakeWorld(bb, res, (g) => drawProvinceDeco(g, i, band, opt)), c = B.canvas, w = c.width, h = c.height;
  const m = makeCanvas(w, h), mg = m.getContext('2d', { willReadFrequently: true }); mg.setTransform(res, 0, 0, res, -bb[0] * res, -bb[1] * res); pathPoly(mg, G.poly); mg.fillStyle = '#000'; mg.fill();
  const rd = makeCanvas(w, h), rg = rd.getContext('2d', { willReadFrequently: true }); rg.drawImage(c, 0, 0);
  const md = mg.getImageData(0, 0, w, h).data, d = rg.getImageData(0, 0, w, h).data; const acc = [0, 0, 0]; let n = 0;
  for (let k = 0; k < w * h; k++) { if (md[k * 4 + 3] < 255 || d[k * 4 + 3] < 250) continue; acc[0] += s2l(d[k * 4]); acc[1] += s2l(d[k * 4 + 1]); acc[2] += s2l(d[k * 4 + 2]); n++; }
  return acc.map((v) => l2s(v / Math.max(1, n)));
}
function paintCheck() {
  const t0 = performance.now(), per = {}, lines = [];
  for (const i of provList) {
    if (fogOf(i) === 'unexplored') continue; const t = terr[i], f = TERRAIN[t].fill, rgb = meanRgbIn(i, 'mid', { paintOnly: true }), lab = rgb2lab(rgb), fl = rgb2lab(hex2rgb(f)), d = dE2000(lab, fl);
    (per[t] ??= []).push({ d, dL: lab[0] - fl[0] });
  }
  const table = Object.entries(per).map(([t, a]) => ({ terrain: t, fill: TERRAIN[t].fill, n: a.length, meanDE: +(a.reduce((s, q) => s + q.d, 0) / a.length).toFixed(2), worstDE: +Math.max(...a.map((q) => q.d)).toFixed(2), meanDL: +(a.reduce((s, q) => s + q.dL, 0) / a.length).toFixed(2), lift: PAINT[t].lift, pass: Math.max(...a.map((q) => q.d)) <= 2.0 }));
  // (2) at Far with the full decoration: terrain pairs between the provinces' full means, normal and under each deficiency
  const means = {};
  for (const i of provList) { if (fogOf(i) === 'unexplored') continue; const rgb = meanRgbIn(i, 'far', {}); (means[terr[i]] ??= []).push(rgb); }
  const tm = Object.fromEntries(Object.entries(means).map(([t, a]) => [t, [0, 1, 2].map((c) => l2s(a.reduce((s, q) => s + s2l(q[c]), 0) / a.length))]));
  const pairs = [], ts = Object.keys(tm);
  for (let a = 0; a < ts.length; a++) for (let b = a + 1; b < ts.length; b++) {
    const A = tm[ts[a]], B2 = tm[ts[b]], row = { pair: ts[a] + '/' + ts[b], normal: +dE2000(rgb2lab(A), rgb2lab(B2)).toFixed(1) };
    for (const [k, m] of Object.entries(CVD)) row[k] = +dE2000(rgb2lab(cvdRgb(A, m)), rgb2lab(cvdRgb(B2, m))).toFixed(1);
    row.under = row.normal < 20 || row.protan < 12 || row.deutan < 12 || row.tritan < 12; pairs.push(row);
  }
  const out = { ms: Math.round(performance.now() - t0), palette: view.palette, paint: table, farPairsUnder: pairs.filter((r) => r.under), farPairs: pairs };
  console.log('PAINTCHECK ' + JSON.stringify(out)); return out;
}
const wcag = (a, b) => { const la = 0.2126 * s2l(a[0]) + 0.7152 * s2l(a[1]) + 0.0722 * s2l(a[2]), lb = 0.2126 * s2l(b[0]) + 0.7152 * s2l(b[1]) + 0.0722 * s2l(b[2]); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); };
function trackCheck() { // on Mountains track halves at the current zoom: the dot peak and the line average against the ground beside them
  const sample = () => { draw(); const W2 = canvas.width, H2 = canvas.height, cp = makeCanvas(W2, H2), g = cp.getContext('2d', { willReadFrequently: true }); g.drawImage(canvas, 0, 0); const all = g.getImageData(0, 0, W2, H2).data; return (x, y) => { const X = Math.max(0, Math.min(W2 - 1, Math.round(x * dpr))), Y = Math.max(0, Math.min(H2 - 1, Math.round(y * dpr))), k = (Y * W2 + X) * 4; return [all[k], all[k + 1], all[k + 2]]; }; };
  const L = (c) => 0.2126 * s2l(c[0]) + 0.7152 * s2l(c[1]) + 0.0722 * s2l(c[2]), med = (a) => { const b = [...a].sort((x, y) => x - y); return b.length ? b[b.length >> 1] : null; };
  const groundAt = (px, x, y, nx, ny) => { const c = [4, -4, 5, -5, 6, -6].map((d) => px(x + nx * d, y + ny * d)); c.sort((p, q) => L(p) - L(q)); return c[c.length >> 1]; };
  const measure = (px, P, darkInk, drop) => { // P: screen points along the line, about 1 px apart; drop(x, y): where the dots are left out by design
    const peaks = [], avgs = [];
    for (let m = 2; m < P.length - 6; m += 5) {
      const [x, y] = P[m], [x2, y2] = P[m + 4], dx = x2 - x, dy = y2 - y, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l; if (x < 5 || y < 90 || x > cw - 5 || y > ch - 5) continue;
      if (drop && P.slice(m, m + 5).some((q) => drop(q[0], q[1]))) continue;
      const ground = groundAt(px, x, y, nx, ny); let best = null;
      for (let q = m; q < m + 4; q++) for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const c = px(P[q][0] + a * 0.5, P[q][1] + b * 0.5); if (!best || (darkInk ? L(c) < L(best) : L(c) > L(best))) best = c; }
      peaks.push(wcag(best, ground)); const acc = [0, 0, 0]; for (let q = m; q < m + 5; q++) { const c = px(...P[q]); for (let k = 0; k < 3; k++) acc[k] += s2l(c[k]); } avgs.push(wcag(acc.map((v) => l2s(v / 5)), ground));
    }
    return { peak: med(peaks), avg: med(avgs), n: peaks.length };
  };
  const along = (W3) => { const out = []; for (let k = 0; k < W3.length - 1; k++) { const [x0, y0] = toScreen(...W3[k]), [x1, y1] = toScreen(...W3[k + 1]), n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0))); for (let t = 0; t < n; t++) out.push([x0 + ((x1 - x0) * t) / n, y0 + ((y1 - y0) * t) / n]); } return out; };
  let px = sample(); const res = { tracks: [], footpath: [] };
  const band = bandOf(cam.s), placed = layoutLabels(band).placed;
  for (const h of feats().tracks.filter((q) => terr[q.s] === 'mountains' && fogOf(q.s) !== 'unexplored').slice(0, 20)) {
    const z = zones(h.s, band), lz = [z[0], z[1]], drop = (sx, sy) => { const [x, y] = toWorld(sx, sy); return inBoxes(lz, x, y, 4 / cam.s) || inBoxes(placed, sx, sy, 4); };
    const r = measure(px, along(h.pts.filter((q, k) => h.L[k] > 3 / cam.s)), h.ink === FEATURE_INK, drop); if (r.n) res.tracks.push({ prov: names[h.s], ...r });
  }
  view.footpath = true; invalidateBakes(); firstPaint = true; px = sample();
  for (const i of provList.filter((q) => terr[q] === 'mountains' && fogOf(q) !== 'unexplored')) { // the R34 footpath, for comparison
    const G = geo(i), poly = G.poly, edges = []; for (let k = 0; k < cells[i].length - 1; k++) edges.push([cells[i][k], cells[i][k + 1], Math.hypot(cells[i][k + 1][0] - cells[i][k][0], cells[i][k + 1][1] - cells[i][k][1])]);
    edges.sort((a, b) => b[2] - a[2]); const mid = (e) => [(e[0][0] + e[1][0]) / 2, (e[0][1] + e[1][1]) / 2], ins = (q) => [q[0] + (G.c[0] - q[0]) * 0.12, q[1] + (G.c[1] - q[1]) * 0.12], A0 = ins(mid(edges[0])), B0 = ins(mid(edges[1])), ctl = [G.seat[0], G.seat[1] + 6];
    const Wq = []; for (let k = 0; k <= 40; k++) { const u = k / 40; Wq.push([(1 - u) ** 2 * A0[0] + 2 * u * (1 - u) * ctl[0] + u * u * B0[0], (1 - u) ** 2 * A0[1] + 2 * u * (1 - u) * ctl[1] + u * u * B0[1]]); }
    const r = measure(px, along(Wq), true); if (r.n) res.footpath.push({ prov: names[i], ...r }); void poly;
  }
  view.footpath = false; invalidateBakes(); firstPaint = true; draw();
  const summ = (a) => ({ medianPeak: med(a.map((t) => t.peak)), medianAvg: med(a.map((t) => t.avg)), minPeak: Math.min(...a.map((t) => t.peak)), minAvg: Math.min(...a.map((t) => t.avg)), n: a.length });
  res.trackSummary = summ(res.tracks); res.footpathSummary = summ(res.footpath); res.scale = +cam.s.toFixed(3);
  console.log('TRACKCHECK ' + JSON.stringify({ tracks: res.trackSummary, footpath: res.footpathSummary, scale: res.scale })); return res;
}
// ---- the silhouette sheet: every scenery shape beside every reserved shape, greyscale, filled and as fog line art
function silhouetteSheet() {
  const P0 = (line) => ({ lit: '#B8B8B8', shade: '#6A6A6A', ink: '#222', lw: 1, PX: 1, line, fill: '#909090', trunk: '#444', painted: true });
  const R = () => rngFor('sil');
  const sc = []; const rs = [];
  const add = (list, name, fn) => list.push({ name, fn });
  add(sc, 'clump', (g, P) => drawClump(g, makeClump(0, 0, 5, R(), 0, [4.5, 6.5]), P)); add(sc, 'conifer', (g, P) => drawClump(g, makeClump(0, 0, 3, R(), 1), P)); for (const n of [2, 3, 4]) add(sc, 'hills ' + n, (g, P) => { const Rq = R(); hillRange(g, hillRangeGeom(0, 0, 24, Rq, n), P, Rq); }); // v3 critique 4: ranges, never a lone dome
  for (const n of [3, 5]) add(sc, 'peaks ' + n, (g, P) => { const Rq = R(); for (const q of peakRangeGeom(0, 0, 16, Rq, n)) peakPaint(g, peakGeom(q.x, q.y, q.h, q.w, Rq, false), { lit: '#B4C1C6', shade: '#6E7F86', ink: INK, lw: 1 }, P, P.line); }); add(sc, 'sheaves', (g, P) => sheafRow(g, 0, 0, P, 3, 0, P.line)); add(sc, 'outcrop', (g, P) => stampShape(g, { terrain: 'wasteland' }, { x: 0, y: 0, v: 0.3 }, false, 1, R(), { ...P, painted: true }, {})); add(sc, 'reed bed', (g, P) => stampShape(g, { terrain: 'swamp' }, { x: 0, y: 0, v: 0.3 }, false, 1, R(), { ...P, painted: true }, {})); add(sc, 'tufts', (g, P) => stampShape(g, { terrain: 'plains' }, { x: 0, y: 0, v: 0.5 }, false, 1, R(), { ...P, painted: true }, {})); sc.push({ name: 'grass tuft', noLine: true, fn: (g, P) => { const L = 2.9 * U; g.strokeStyle = P.shade; g.lineWidth = 0.9; g.lineCap = 'round'; g.beginPath(); for (const da of [-0.3, 0, 0.3]) { const l = da ? 0.75 * L : L; g.moveTo(0, 0); g.lineTo(Math.cos(-Math.PI / 2 + da) * l, Math.sin(-Math.PI / 2 + da) * l); } g.stroke(); g.lineCap = 'butt'; } }); // palette-ab fix 3: Painted's grass, one tuft, filled only (ground marks are never drawn as fog line art)
  for (const k of Object.keys(LANDMARKS)) add(sc, k, (g, P) => drawLandmark(g, k, 0, 0, 1, P, P.line, false, false));
  for (const k of Object.keys(HEROES)) add(sc, k, (g, P) => drawLandmark(g, k, 0, 0, 1, P, P.line, false, true, 0.9));
  for (const k of ['sheep', 'deer', 'heron', 'goats', 'cows', 'hare']) add(sc, k, (g) => vignette(g, k, 0, 0, 1, R()));
  add(rs, 'camp dome', (g, P) => campTent(g, 0, 0, 1, P.line)); add(rs, 'beast den', (g) => beastDen(g, 0, 0, 1)); add(rs, 'siege tent', (g) => { g.fillStyle = '#888'; g.beginPath(); g.moveTo(-4, 0); g.lineTo(0, -6); g.lineTo(4, 0); g.closePath(); g.fill(); });
  add(rs, 'standing stone', (g) => mossStone(g, 0, 0, 1)); add(rs, 'shard', (g) => shard(g, 0, 0, 1)); add(rs, 'cairn', (g) => cairn(g, 0, 0, 1.4, 1, false)); add(rs, 'house', (g) => house(g, { x: 0, y: 0 }, null, 1, {}));
  add(rs, 'shrine', (g) => landmark(g, 'temple', null, 0, 0, 1)); add(rs, 'smoke', (g) => smokeWisp(g, 0, 0, 1)); add(rs, 'cart', (g) => toppledCart(g, 0, 0, 1)); add(rs, 'skull', (g, P) => skull(g, 0, 0, P)); add(rs, 'pennant', (g) => pennant(g, 0, 0, '#888', 1));
  add(rs, 'bare tree', (g, P) => snag(g, 0, 0, 7, P)); add(rs, 'brazier', (g) => brazier(g, 0, 0, 1)); add(rs, 'blossom', (g) => blossomBush(g, 0, 0, 1, R()));
  const cellPx = 72, k = 3.2, host = document.createElement('div'); host.className = 'silsheet';
  const CS = 240; // each shape on a large card (no clipping), shown at 72 px
  const mk = (list, line) => list.map((it) => { const c = makeCanvas(CS, CS), g = c.getContext('2d', { willReadFrequently: true }); g.fillStyle = '#E8E4DA'; g.fillRect(0, 0, CS, CS); g.filter = 'grayscale(1)'; g.translate(CS / 2, CS * 0.7); g.scale(k, k); try { it.fn(g, P0(line ? '#3E3428' : null)); } catch (e) { void e; } c.style.width = cellPx + 'px'; c.style.height = cellPx + 'px'; return { c, name: it.name }; });
  const iou = (a, b) => { const A = mask48(a), B2 = mask48(b); let i2 = 0, u = 0; for (let m = 0; m < A.length; m++) { if (A[m] || B2[m]) u++; if (A[m] && B2[m]) i2++; } return u ? i2 / u : 0; };
  const sec = (title, list) => `<h3>${title}</h3><div class="silrow">${list.map((q, j) => `<figure data-k="${title}${j}"><figcaption>${q.name}</figcaption></figure>`).join('')}</div>`;
  const scF = mk(sc, false), scL = mk(sc.filter((q) => !q.noLine), true), rsF = mk(rs, false), rsL = mk(rs, true);
  let worst = { f: 0, l: 0, fp: '', lp: '' };
  const over = [];
  for (const a of scF) for (const b of rsF) { const v = iou(a.c, b.c); if (v >= 0.7) over.push(`${a.name}/${b.name} ${v.toFixed(2)}`); if (v > worst.f) worst = { ...worst, f: v, fp: a.name + ' / ' + b.name }; }
  for (const a of scL) for (const b of rsL) { const v = iou(a.c, b.c); if (v >= 0.6) over.push(`line ${a.name}/${b.name} ${v.toFixed(2)}`); if (v > worst.l) worst = { ...worst, l: v, lp: a.name + ' / ' + b.name }; }
  worst.over = over;
  host.innerHTML = `<header><b>Silhouettes</b> · scenery against reserved shapes, greyscale, at 3.2x Mid size. Highest IoU filled ${worst.f.toFixed(2)} (${worst.fp}, limit 0.70); line art ${worst.l.toFixed(2)} (${worst.lp}, limit 0.60). Masks fitted to their bounding box with the aspect kept, so size and color, which also tell these apart, do not count. Over the limit: ${over.join('; ') || 'none'}.</header>` + sec('Scenery, filled', scF) + sec('Scenery, fog line art', scL) + sec('Reserved, filled', rsF) + sec('Reserved, fog line art', rsL);
  document.body.appendChild(host);
  const shown = (c) => { // the card cropped to its shape and fitted to the cell
    const g = c.getContext('2d', { willReadFrequently: true }), d = g.getImageData(0, 0, c.width, c.height).data; let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
    for (let q = 0; q < c.width * c.height; q++) if (d[q * 4] < 200 || d[q * 4 + 1] < 200) { const x = q % c.width, y = (q / c.width) | 0; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    const o = makeCanvas(cellPx * 2, cellPx * 2), og = o.getContext('2d'); og.fillStyle = '#E8E4DA'; og.fillRect(0, 0, o.width, o.height); if (x1 >= x0) { const side = Math.max(x1 - x0, y1 - y0) + 8, sc = (o.width - 12) / side; og.drawImage(c, x0 - 4, y0 - 4, side, side, 6 + ((side - (x1 - x0 + 8)) / 2) * sc, 6 + ((side - (y1 - y0 + 8)) / 2) * sc, side * sc, side * sc); }
    o.style.width = cellPx + 'px'; o.style.height = cellPx + 'px'; return o;
  };
  for (const [title, list] of [['Scenery, filled', scF], ['Scenery, fog line art', scL], ['Reserved, filled', rsF], ['Reserved, fog line art', rsL]]) list.forEach((q, j) => host.querySelector(`[data-k="${title}${j}"]`).prepend(shown(q.c)));
  return worst;
}
function mask48(c) { // the shape's mask normalized to its bounding box on a 48 square
  const g = c.getContext('2d'), d = g.getImageData(0, 0, c.width, c.height).data; let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
  const on = (k) => d[k * 4] < 200 || d[k * 4 + 1] < 200; // not the light card
  for (let k = 0; k < c.width * c.height; k++) if (on(k)) { const x = k % c.width, y = (k / c.width) | 0; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  const out = new Uint8Array(48 * 48); if (x1 < x0) return out;
  const side = Math.max(x1 - x0 + 1, y1 - y0 + 1), ox = x0 - (side - (x1 - x0 + 1)) / 2, oy = y0 - (side - (y1 - y0 + 1)) / 2; // normalized to the bounding box, aspect kept
  for (let y = 0; y < 48; y++) for (let x = 0; x < 48; x++) { const sx = Math.floor(ox + ((x + 0.5) / 48) * side), sy = Math.floor(oy + ((y + 0.5) / 48) * side); out[y * 48 + x] = sx >= 0 && sy >= 0 && sx < c.width && sy < c.height && on(sy * c.width + sx) ? 1 : 0; }
  return out;
}
window.__mock.silhouettes = () => silhouetteSheet();
{
  const qs = new URLSearchParams(location.search);
  if (qs.has('paintcheck')) setTimeout(() => paintCheck(), 1500);
  if (qs.has('silhouettes')) setTimeout(() => silhouetteSheet(), 800);
  if (qs.has('footpath')) { view.footpath = true; invalidateBakes(); requestDraw(); } // the R34 footpath on Mountains (tracks replace it; see the track check)
}

// ---- step 15 checks: hit tests on wobbling borders, the label test, the bake counter while an army moves, a stable redraw
function hitCheck() {
  const R = rngFor('hitcheck'), keys = [...EDGE.keys()].filter((k) => { const e = EDGE.get(k); return !isWild(e.i) && !isWild(e.j); }); let bad = 0, n = 0;
  for (let t = 0; t < 200; t++) {
    const e = EDGE.get(keys[Math.floor(R() * keys.length)]), P = edgePts(e), Lc = cumLen(P), d = (0.1 + 0.8 * R()) * Lc[Lc.length - 1], q = arcAt(P, Lc, d), a = arcAt(P, Lc, d - 1), b = arcAt(P, Lc, d + 1), l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, off = (R() < 0.5 ? -1 : 1) * (0.6 + 1.8 * R());
    const x = q[0] - ((b[1] - a[1]) / l) * off, y = q[1] + ((b[0] - a[0]) / l) * off, truth = [...Array(N).keys()].find((i) => d3.polygonContains(npoly[i], [x, y]));
    if (truth == null) continue; n++; if (provinceAt(x, y) !== truth) bad++;
  }
  return { samples: n, wrong: bad };
}
function labelCheck() {
  const band = bandOf(cam.s), lay = layoutLabels(band), shown = new Set(lay.ops.filter((o) => o.t === 'p').map((o) => o.p.i));
  const vis = provs.filter((p) => { const [sx, sy] = toScreen(...cent[p.i]); return sx > 0 && sy > 90 && sx < cw && sy < ch; });
  const over = lay.ops.filter((o) => o.t === 'p').filter((o) => lay.tokenBoxes.some((b) => o.sx > b[0] && o.sx < b[2] && o.sy - 6 > b[1] && o.sy - 6 < b[3])).length;
  return { band, scale: +cam.s.toFixed(3), visible: vis.length, named: vis.filter((p) => shown.has(p.i)).length, pct: +((100 * vis.filter((p) => shown.has(p.i)).length) / Math.max(1, vis.length)).toFixed(1), namesOverTokens: over };
}
function stableCheck() { // render the static layers twice from scratch and compare
  const snap = () => { invalidateBakes(); firstPaint = true; CK = null; draw(); const cp = makeCanvas(canvas.width, canvas.height), cg = cp.getContext('2d', { willReadFrequently: true }); cg.drawImage(canvas, 0, 0); const d = cg.getImageData(0, 0, canvas.width, canvas.height).data; let h = 0x811c9dc5; for (let k = 0; k < d.length; k += 7) { h ^= d[k]; h = Math.imul(h, 0x01000193); } return h >>> 0; };
  const a = snap(), b = snap(); return { first: a, second: b, identical: a === b };
}
function zoneCheck() { // stamps, water and track dots against the fixed zones; track clearance from the borders outside the crossing zone
  const F = feats(), inZ = (z, x, y) => x > z[0] && x < z[2] && y > z[1] && y < z[3], out = { stamps: { label: 0, second: 0, seat: 0, token: 0, n: 0 }, water: { label: 0, second: 0, seat: 0, token: 0, n: 0 }, dots: { label: 0, second: 0, token: 0, n: 0 }, clearance: { n: 0, under: 0, min: Infinity, fallbacks: {} } };
  const tally = (o, i, band, x, y, seat = true) => { const z = zones(i, band); o.n++; if (inZ(z[0], x, y)) o.label++; if (inZ(z[1], x, y)) o.second++; if (z[2] && inZ(z[2], x, y)) o.token++; if (seat && inZ(z[3], x, y)) o.seat++; };
  for (const i of provList) {
    for (const band of ['mid', 'near']) { for (const s of stampSlotsFor(i, band)) if (!(terr[i] === 'forest' && PAINTED() && fogOf(i) !== 'unexplored')) tally(out.stamps, i, band, s.x, s.y);
      if (terr[i] === 'forest' && PAINTED() && fogOf(i) !== 'unexplored') for (const q of canopyFor(i, band)) tally(out.stamps, i, band, q.x, q.y); // the canopy's crowns
      const w = F.water.get(i); if (w) { if (w.pond) tally(out.water, i, band, w.pond.x, w.pond.y); if (w.brook) w.brook.forEach((q, k) => { if (!(k === 0 && prov[i].well)) tally(out.water, i, band, q[0], q[1]); }); } }
  }
  const sp = 2.5 / DESIGN.mid, C = 10 * U, S0 = 15 * U;
  for (const h of F.tracks) {
    out.clearance.fallbacks[h.fallback] = (out.clearance.fallbacks[h.fallback] ?? 0) + 1;
    const d = trackDots(h, sp), seat = geo(h.s).seat, el = seatEllipse(h.s);
    const z = zones(h.s, 'mid'), lz = [z[0], z[1]];
    for (let m = 0; m < d.length; m += 3) { const x = d[m], y = d[m + 1], dd = d[m + 2]; if (!inBoxes(lz, x, y, 2 / DESIGN.mid)) tally(out.dots, h.s, 'mid', x, y, false);
      if (dd <= h.lastLen || h.corner || Math.hypot(x - seat[0], y - seat[1]) <= S0 + Math.max(el.rx, el.ry)) continue;
      const b = distToEdge(npoly[h.s], x, y); out.clearance.n++; if (b < C - 0.5 * U) out.clearance.under++; if (b < out.clearance.min) out.clearance.min = b; }
  }
  out.clearance.min = +(out.clearance.min / U).toFixed(2); out.clearance.unit = 'u (C = 10 u)'; return out;
}
window.__mock.checks = () => ({ hit: hitCheck(), labels: labelCheck(), zones: zoneCheck(), stable: stableCheck(), bakes: BAKECOUNT });
// v3 critique re-run: the §5.4 density counts (standing items per average province, coverage of items and ponds) per terrain and band,
// the canopy's crown coverage of its free area, and each province's Mid and Near bake time (§7.2: 16 ms and 25 ms)
function densityCheck() {
  const out = { bands: {}, bake: {} };
  for (const band of ['mid', 'near']) {
    const per = {}, times = [];
    for (const i of provList) {
      if (fogOf(i) === 'unexplored') continue;
      const G = geo(i), bb = [G.bb[0] - 2, G.bb[1] - 30, G.bb[2] + 2, G.bb[3] + 8], res = Math.min(1.2, BAND_RES[band]), st = {}, k = areaOf[i] / MEAN_AREA;
      const B = bakeWorld(bb, res, (g) => drawProvinceDeco(g, i, band, { itemsOnly: true, stats: st }), true), c = B.canvas, w = c.width, h = c.height;
      const m = makeCanvas(w, h), mg = m.getContext('2d', { willReadFrequently: true }); mg.setTransform(res, 0, 0, res, -bb[0] * res, -bb[1] * res); pathPoly(mg, G.poly); mg.fillStyle = '#000'; mg.fill();
      const rd = makeCanvas(w, h), rg = rd.getContext('2d', { willReadFrequently: true }); rg.drawImage(c, 0, 0);
      const md = mg.getImageData(0, 0, w, h).data, d = rg.getImageData(0, 0, w, h).data; let inP = 0, on = 0;
      for (let q = 0; q < w * h; q++) { if (md[q * 4 + 3] < 128) continue; inP++; if (d[q * 4 + 3] > 64) on++; }
      const pond = feats().water.get(i)?.pond, pondA = pond ? Math.PI * pond.r * pond.r * 0.75 : 0, cov = (on / Math.max(1, inP)) + pondA / areaOf[i];
      let crownCov = null; if (terr[i] === 'forest') { // the canopy's coverage of its free area: free points (the sampler's own tests on a crown's visual center) under a crown pixel
        const zb = zones(i, band), zS = [zb[0], zb[1], zb[3]], se = settleExtent(i), gl = CANOPY.get(i)?.glades ?? [], Rq = rngFor('freecheck'), r = 5.5 * U; let f = 0, c = 0;
        const freeInset = (PAINTED_PAL() && !prov[i].owner ? 0 : B_U) + 2 * U, freeBlocked = PAINTED_PAL() ? canopyBlocked : stampBlocked; // the sampler's own free area (fix 1 under Painted)
        for (let t = 0; t < 6000; t++) { const x = G.bb[0] + Rq() * (G.bb[2] - G.bb[0]), y = G.bb[1] + Rq() * (G.bb[3] - G.bb[1]); if (!inPoly(G.poly, x, y)) continue; const cy = y + 0.95 * r;
          if (Math.hypot(x - G.seat[0], (cy - G.seat[1]) * 1.3) < 1.3 * se || gl.some(([gx, gy, gr]) => Math.hypot(x - gx, cy - gy) < gr) || !inPoly(cells[i], x, y) || distToEdge(cells[i], x, y) - 6 < freeInset || freeBlocked(i, x, y, r) || boxHit(zS, x - r, cy - 2 * r, x + r, cy)) continue;
          f++; const px = Math.floor((x - bb[0]) * res), py = Math.floor((y - bb[1]) * res); if (px >= 0 && py >= 0 && px < w && py < h && d[(py * w + px) * 4 + 3] > 64) c++; }
        crownCov = c / Math.max(1, f); }
      (per[terr[i]] ??= []).push({ items: st.items / k, cov, crownCov, clumps: st.clumps, crowns: st.crowns, ranges: st.ranges, parts: st.rangeParts, k });
      const t0 = performance.now(); bakeWorld(bb, spriteRes(band), (g) => drawProvinceDeco(g, i, band), band !== 'near'); times.push(performance.now() - t0);
    }
    const r1 = (v) => +v.toFixed(2), avg = (a) => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
    out.bands[band] = Object.fromEntries(Object.entries(per).map(([t, a]) => [t, { n: a.length, itemsPerAvg: r1(avg(a.map((q) => q.items))), itemsMax: r1(Math.max(...a.map((q) => q.items))), covMean: r1(avg(a.map((q) => q.cov))), covMax: r1(Math.max(...a.map((q) => q.cov))), ...(t === 'forest' ? { crownCovOfFree: r1(avg(a.map((q) => q.crownCov))), crownCovMin: r1(Math.min(...a.map((q) => q.crownCov))), crownCovMax: r1(Math.max(...a.map((q) => q.crownCov))), clumpsMax: Math.max(...a.map((q) => q.clumps)), crowns: Math.round(avg(a.map((q) => q.crowns))) } : {}), ...(t === 'hills' || t === 'mountains' ? { ranges: r1(avg(a.map((q) => q.ranges / q.k))), partsPerRange: r1(avg(a.map((q) => q.parts / Math.max(1, q.ranges)))) } : {}) }]));
    times.sort((a, b) => a - b); out.bake[band] = { mean: r1(avg(times)), p95: r1(times[Math.floor(times.length * 0.95)]), max: r1(times[times.length - 1]) };
  }
  return out;
}
window.__mock.density = () => densityCheck();
window.__mock.bakes = () => BAKECOUNT;

// spring stones are baked only once their symbol image has loaded; a late image invalidates those provinces' Near bakes
for (const c of 'WUBRG') if (!manaImg[c].complete) manaImg[c].addEventListener('load', () => { for (const p of provs) if (p.springs.includes(c)) SPR.delete('near:' + p.i); requestDraw(); });

// frame times: per-frame draw cost and the rAF interval while panning (p95), as perf.cjs's panFps but with percentiles
window.__mock.panStats = (dx = 3, n = 90) => new Promise((res) => { const iv = [], dc = []; let k = 0, last = 0; const step = (now) => { if (last) iv.push(now - last); last = now; if (k >= n) { const q = (a, p) => { const b = [...a].sort((x, y) => x - y); return +b[Math.min(b.length - 1, Math.floor(p * b.length))].toFixed(2); }; res({ intervalP50: q(iv, 0.5), intervalP95: q(iv, 0.95), drawP50: q(dc, 0.5), drawP95: q(dc, 0.95), drawMax: +Math.max(...dc).toFixed(2) }); return; } cam.x += k % 40 < 20 ? dx : -dx; clampCam(); const t0 = performance.now(); draw(); dc.push(performance.now() - t0); k++; requestAnimationFrame(step); }; requestAnimationFrame(step); });
