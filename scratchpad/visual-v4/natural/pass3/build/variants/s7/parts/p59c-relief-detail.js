
// ------------------------------------------------------------------ v4 relief: the Near detail pass (AD critique fix 7; natural design §1 "Near: crowns of 5 to 9 px", map-relief §3.5)
// At Near a bake texel is 1.4 to 3 CSS px, so the land was a soft smear under crisp pieces. Once a texel passes 1.4 CSS px (full at 2.0) the Natural land gets a lightness-only
// detail layer: small seeded crowns (2 to 4 px at the closest zoom, the §4 crown recipe: a dome lit from the upper left, darker gaps) on the canopy, weighted by its
// feathered coverage (p58n cmar), and a fine grain of about +-3 L* per cover class on open land. It is drawn soft-light over the bake, under the fog, the water and every line,
// from seeded world-anchored tiles (no Math.random), so it pans with the land and is the same on every load. Clear, the Terrain mode and Map detail: Reduced never draw it.
// Pass-2 critique fix 4: the natural wilds' peaks take the rock grain too (p58n's cls stays 255 there, so the N4 cover test is untouched); the mere stays smooth.
const RL_ND = { tiles: null, tkey: '', cv: null, key: '', ms: 0, n: 0, px: 0 };
const rlNearK = () => (RB.ready ? rlSmooth(RL_P.nearDetail.tpp0, RL_P.nearDetail.tpp1, cam.s * RB.TX) : 0); // the pass's strength at this zoom
function rlNearTiles(Tpx) { // one Int8 tile per group (soft-light offsets x 255): 0 crowns, 1 grass, 2 crop, 3 heath, 4 rock, 5 reed, 6 grit
  const P = RL_P.nearDetail, U = P.tileU, N2 = Tpx * Tpx, out = [];
  const pvn = (salt, Px, Py, fx, fy) => { const ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty), h = (a, b) => rlH2a(rlH2(((a % Px) + Px) % Px, ((b % Py) + Py) % Py, salt)) * 2 - 1;
    const a = h(ix, iy), b = h(ix + 1, iy), c = h(ix, iy + 1), d = h(ix + 1, iy + 1); return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy; }; // periodic value noise on a Px x Py lattice
  const all = new Int8Array(7 * N2); let slot = 0; // the seven tiles in one array (tile g at g x N2)
  const fill = (f) => { const T = new Float32Array(N2); let m = 0; for (let j = 0, q = 0; j < Tpx; j++) for (let i = 0; i < Tpx; i++, q++) { T[q] = f((i + 0.5) / Tpx, (j + 0.5) / Tpx); m += T[q]; } m /= N2; const o = all.subarray(slot * N2, ++slot * N2); for (let q = 0; q < N2; q++) { const v = Math.round((T[q] - m) * 255); o[q] = v > 127 ? 127 : v < -127 ? -127 : v; } return o; }; // mean-neutral
  const nc = Math.max(4, Math.round(U / P.crownU)), CA = P.crownA, GA = P.grainA, iso = (salt, f) => (x, y) => pvn(salt, Math.round(U / f), Math.round(U / f), x * Math.round(U / f), y * Math.round(U / f));
  out.push(fill((x, y) => { // crowns: a jittered lattice nc x nc per tile; each a dome lit from the upper left, the gaps between them in shade
    const gx = x * nc, gy = y * nc, ix = Math.floor(gx), iy = Math.floor(gy); let best = 9, bx = 0, by = 0;
    for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) { const cx = ix + ox, cy = iy + oy, h = rlH2(((cx % nc) + nc) % nc, ((cy % nc) + nc) % nc, 71), rr = 0.34 + 0.18 * rlH2c(h), dx = (gx - (cx + 0.2 + 0.6 * rlH2a(h))) / rr, dy = (gy - (cy + 0.2 + 0.6 * rlH2b(h))) / rr, dd = Math.sqrt(dx * dx + dy * dy); if (dd < best) { best = dd; bx = dx; by = dy; } }
    if (best >= 1) return -0.55 * CA; const z = Math.sqrt(1 - best * best), lit = -(bx + by) * 0.7071; return CA * (0.35 * z + 0.75 * lit * z - 0.1); }));
  const gr = (x, y) => GA * (0.75 * pvn(73, Math.round(U / 1.6), Math.round(U / 0.32), x * Math.round(U / 1.6), y * Math.round(U / 0.32)) + 0.4 * iso(74, 0.5)(x, y)); // grass: wind-laid streaks
  out.push(fill(gr));
  out.push(fill((x, y) => GA * (0.7 * iso(75, 0.32)(x, y) + 0.35 * iso(76, 0.9)(x, y)))); // crop: a fine stipple
  out.push(fill((x, y) => GA * (0.7 * iso(77, 0.6)(x, y) + 0.45 * iso(78, 0.25)(x, y)))); // heath: tufts and blotches
  out.push(fill((x, y) => GA * 1.2 * (Math.abs(iso(79, 0.45)(x, y)) * 1.6 - 0.55 + 0.35 * iso(80, 0.2)(x, y)))); // rock: crisp speckle
  out.push(fill((x, y) => GA * (0.85 * pvn(81, Math.round(U / 0.22), Math.round(U / 1.1), x * Math.round(U / 0.22), y * Math.round(U / 1.1)) + 0.3 * iso(82, 0.6)(x, y)))); // reed: short upright strokes
  out.push(fill((x, y) => GA * (0.8 * iso(83, 0.22)(x, y) + 0.3 * iso(84, 0.8)(x, y)))); // grit: a fine dry speckle
  return { all, N2 };
}
const RL_NDG = (() => { const g = new Uint8Array(256).fill(1); g[1] = 2; g[3] = 3; g[4] = 4; g[5] = 5; g[6] = 6; return g; })(); // a non-canopy class's grain (0 plains and the canopy's own ground: grass)
function rlNearDetail(g, alpha) {
  const k = rlNearK() * alpha; if (!RB.ready || !RB.nat || k < 0.05 || rlShownLook() !== 'natural' || state.mode === 'terrain' || view.detail === 'reduced' || SKIP.has('detail')) { if (k < 0.05) { RL_ND.cv = null; RL_ND.key = ''; } return; }
  const t0 = performance.now(), P = RL_P.nearDetail, s = cam.s, x0 = Math.max(0, VW[0]), y0 = Math.max(0, VW[1]), x1 = Math.min(W, VW[2]), y1 = Math.min(H, VW[3]); if (x1 <= x0 || y1 <= y0) return;
  const pw = Math.ceil((x1 - x0) * s), ph = Math.ceil((y1 - y0) * s), ppu = s * RLK, Tpx = Math.max(8, Math.round(P.tileU * ppu)), key = [x0.toFixed(2), y0.toFixed(2), pw, ph, s.toFixed(5), RB.ver, RB.lookVer].join('|');
  if (RL_ND.tkey !== String(Tpx)) { RL_ND.tiles = rlNearTiles(Tpx); RL_ND.tkey = String(Tpx); }
  if (RL_ND.key !== key || !RL_ND.cv) {
    const { BW, TX, LT } = RB, { cls, cmar } = RB.nat, { all: TL, N2 } = RL_ND.tiles, img = new ImageData(pw, ph), u32 = new Uint32Array(img.data.buffer), colT = new Int32Array(pw), colQ = new Int32Array(pw), tU = P.tileU * RLK, GO = new Int32Array(256); for (let c = 0; c < 256; c++) GO[c] = RL_NDG[c] * N2;
    for (let i = 0; i < pw; i++) { const x = x0 + (i + 0.5) / s; colT[i] = Math.min(BW - 1, Math.floor(x * TX)); const f = x / tU; colQ[i] = Math.min(Tpx - 1, Math.floor((f - Math.floor(f)) * Tpx)); }
    for (let j = 0, o = 0; j < ph; j++) {
      const y = y0 + (j + 0.5) / s, rb = Math.min(RB.BH - 1, Math.floor(y * TX)) * BW, f = y / tU, rq = Math.min(Tpx - 1, Math.floor((f - Math.floor(f)) * Tpx)) * Tpx;
      for (let i = 0; i < pw; i++, o++) {
        const t = rb + colT[i], wl = LT[t] >= 7 && RB.mw, c0 = wl ? RB.mw.cls[t] : cls[t], c = c0 !== 255 ? c0 : LT[t] === 7 ? 4 : 255; if (c === 255) { u32[o] = 0; continue; } // pass 3: a wild texel's class is its own (p58y: rock, or the continued land's) // pass-2 critique fix 4: the ranges take the rock grain (they were a smear beside crisp land); the mere's open water stays smooth
        const a = c0 === 255 ? 0 : wl ? RB.mw.cm[t] : cmar[t], q = rq + colQ[i], gv = TL[GO[c] + q], gg = (128.5 + (a ? gv + (a * (TL[q] - gv)) * 0.0039215686 : gv)) | 0;
        u32[o] = 0xff000000 | (gg << 16) | (gg << 8) | gg;
      }
    }
    const cv = RL_ND.cv && RL_ND.cv.width === pw && RL_ND.cv.height === ph ? RL_ND.cv : makeCanvas(pw, ph); cv.getContext('2d').putImageData(img, 0, 0); RL_ND.cv = cv; RL_ND.key = key; RL_ND.n++; RL_ND.px = pw * ph;
  }
  g.save(); modelPath(g); g.clip(); g.globalCompositeOperation = 'soft-light'; g.globalAlpha = k; g.imageSmoothingEnabled = true; g.drawImage(RL_ND.cv, x0, y0, pw / s, ph / s); g.restore();
  RL_ND.ms = +(performance.now() - t0).toFixed(1);
}
// ---- pass 2: the Far relief (Natural). Zoomed out the bake is shown at its quarter mip and its relief averages away, so the model read as a flat board. Under 85 px a
// province (full at 58) a broad relief is laid over the natural land, soft-light and lightness only: a hillshade of the heights (the natural wilds' included) smoothed to
// 0.03 D and lifted RL_P.farRelief.ex times, with long cast shadows (to 0.6 D) from the ranges and hills. Seeded rasters, made once per bake; never in Clear or the Terrain mode.
// Pass-2 critique fix 1: the per-province mean was removed as a constant, which left a step at every border (the board read as a quilt; p90 23 grey levels across shared
// edges, and the Far readers fell under their floors). Now the mean field is blurred over the land (FP.muD, masked so the wilds and the void do not pull it) before it is
// removed, and the light and shade (not the cast shadow) are weighted by each texel's terrain relief (the natural caps over the mountains', floored at FP.wMin; the ranges 1),
// so hills, mountains and the ranges stand up while farmland and swamp lie flat.
const RL_FR = { cv: null, ver: -1, ms: 0 };
const rlFarK = () => (RB.ready ? rlSmooth(RL_P.farRelief.dpx0, RL_P.farRelief.dpx1, cam.s * MED_DIAM) : 0);
function rlFarRaster() {
  if (RL_FR.cv && RL_FR.ver === RB.lookVer + RB.ver * 1000) return RL_FR.cv; const t0 = performance.now(), FP = RL_P.farRelief;
  const { QW, QH, TX, hh, HW, HH, hid } = RB, N = RB.nw, src = N ? N.hX : hh, h4 = new Float32Array(QW * QH), id4 = new Uint8Array(QW * QH);
  for (let y = 0; y < QH; y++) for (let x = 0; x < QW; x++) { const k = (y * 2 + 1) * HW + x * 2 + 1; h4[y * QW + x] = src[k]; id4[y * QW + x] = hid[k]; }
  const hs = rlBoxBlur(h4, QW, QH, Math.max(1, Math.round((FP.blurD * RLD * TX) / 4)), 2), VS = RL_P.vScale * RLK * FP.ex, dxw = 4 / TX, [lx, ly, lz] = RL_LIGHT;
  const at = (x, y) => hs[(y < 0 ? 0 : y >= QH ? QH - 1 : y) * QW + (x < 0 ? 0 : x >= QW ? QW - 1 : x)], img = new ImageData(QW, QH), d = img.data, off = new Float32Array(QW * QH), sum = new Float64Array(256), cnt = new Float64Array(256), stepW = (FP.castD * RLD) / FP.steps, stepT = stepW / dxw;
  const { wch } = RB, CAP = RL_NAT.cap, cMax = CAP[RL_TI.mountains], rw = (k) => { let s = 0; for (let t = 0; t < 7; t++) s += wch[t][k] * CAP[t]; return Math.max(FP.wMin, Math.min(1, s / cMax)); }; // the texel's relief weight
  for (let y = 0, k = 0; y < QH; y++) for (let x = 0; x < QW; x++, k++) {
    if (id4[k] === 255) continue;
    const dzdx = ((at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x - 1, y) - at(x - 1, y + 1)) * VS) / (8 * dxw), dzdy = ((at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x, y - 1) - at(x + 1, y - 1)) * VS) / (8 * dxw);
    const s = Math.max(0, (-dzdx * lx - dzdy * ly + lz) / Math.sqrt(dzdx * dzdx + dzdy * dzdy + 1)), v = rlTanh(FP.gain * (s - RL_SIN_EL)), z0 = hs[k] * VS; let occ = 0;
    for (let m = 1; m <= FP.steps; m++) { const sx = x + 0.5 - 0.70710678 * stepT * m, sy = y + 0.5 - 0.70710678 * stepT * m; if (sx < 0 || sy < 0) break; const zs = rlBilin(hs, QW, QH, sx, sy) * VS - (z0 + stepW * m * RL_TAN_EL); if (zs > occ) occ = zs; }
    const c = rlSmooth(0, 0.05 * RLD, occ), o = id4[k], wk = RL_WILDK[o] === 7 ? 1 : rw(k); off[k] = wk * (FP.lit * Math.max(0, v) + FP.shade * Math.min(0, v)) - FP.cast * c; sum[o] += off[k]; cnt[o]++;
  }
  // mean-neutral per province, smoothly (the terrain's value code stays: a lightness-only reader read 0.955 of Far patches before, 0.785 with an uncentred relief); the wilds keep theirs
  const mu = new Float32Array(QW * QH), mk = new Float32Array(QW * QH); for (let k = 0; k < QW * QH; k++) { const o = id4[k]; if (o === 255 || RL_WILDK[o]) continue; mu[k] = sum[o] / cnt[o]; mk[k] = 1; }
  const muB = rlBoxBlur(mu, QW, QH, Math.max(1, Math.round((FP.muD * RLD * TX) / 4)), 2, mk); RL_FR.mu = muB; RL_FR.id4 = id4;
  for (let k = 0; k < QW * QH; k++) { const o = id4[k]; if (o === 255) continue; const g = Math.max(0, Math.min(255, Math.round(128 + off[k] - (RL_WILDK[o] ? 0 : FP.neutral * muB[k])))); d[k * 4] = g; d[k * 4 + 1] = g; d[k * 4 + 2] = g; d[k * 4 + 3] = 255; }
  const cv = RL_FR.cv && RL_FR.cv.width === QW ? RL_FR.cv : makeCanvas(QW, QH); cv.getContext('2d').putImageData(img, 0, 0); RL_FR.cv = cv; RL_FR.img = img; RL_FR.ver = RB.lookVer + RB.ver * 1000; /* img: pass 3, the wild edge decision soft-lights with it (p59x) */ RL_FR.ms = +(performance.now() - t0).toFixed(1); return cv;
}
function rlFarRelief(g, alpha) {
  const k = rlFarK() * alpha; if (k < 0.02 || rlShownLook() !== 'natural' || state.mode === 'terrain' || SKIP.has('farRelief') || !RB.nw) return;
  const cv = rlFarRaster(), FP = RL_P.farRelief, fog = provs.filter((p) => rlFogAt(p.i) === 'unexplored'); // unexplored land takes (1 - fogK) of it
  const pass = (a, clip) => { g.save(); modelPath(g); g.clip(); if (clip) { g.beginPath(); clip(); g.clip('evenodd'); } g.globalCompositeOperation = 'soft-light'; g.globalAlpha = a; g.imageSmoothingEnabled = true; g.drawImage(cv, 0, 0, W, H); g.restore(); };
  const fogPath = () => { for (const p of fog) cells[p.i].forEach(([x, y], q) => (q ? g.lineTo(x, y) : g.moveTo(x, y))); };
  if (!fog.length) { pass(k); return; } pass(k, () => { g.rect(-10, -10, W + 20, H + 20); fogPath(); }); pass(k * (1 - FP.fogK), fogPath);
}
