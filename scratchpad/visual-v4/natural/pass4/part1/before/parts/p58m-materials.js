
// ------------------------------------------------------------------ natural view: the materials (natural §2, §3.3, §4), the colour of the natural look
// The ground blends wide (S3's height weights, sigma 0.12 D), the covers of p58n decide what is drawn; every recipe is CIELAB on the ground, weighted by each terrain's
// presence p_t = clamp((w_t - 0.35) / 0.3, 0, 1). No province-mean budget, no mean-neutral pass, no gamut correction (N5): the readability checks hold this look.
const rlRamp = (x, a, b) => { const t = (x - a) / (b - a); return t <= 0 ? 0 : t >= 1 ? 1 : t; }; // a linear ramp in [0, 1] (AD fix 4: soft thresholds)
function* rlNaturalGen(out) {
  const tm = {}; let t0 = performance.now(); const lap = (k) => { const n = performance.now(); tm[k] = +((tm[k] ?? 0) + n - t0).toFixed(1); t0 = n; };
  yield* rlMsGen(out); lap('wilds'); // pass 3 (p58x): the wilds' own rasters (heights), first: the covers read their climb; the land reads its shadows, recomputed with the wilds at the land's height, from out.nw.shd
  yield* rlNatCoverGen(out, lap);
  const { BW, BH, TX, HW, HH, QW, QH, LT, id, wch } = out, { fS, ao, shd } = out.nw, NP = BW * BH, NAT = RL_NAT, M = NAT.mat, CAP = NAT.cap; // pass 3b: the natural land's relief with every wild holding the land continued (p58x, p58z): no lit strip or valley band along an outline, and the land continued inside a wild lit as the land is
  const { cls, ftone, fhedge, fph, cmar, fseam, wc8 } = out.nat, G = RL_T.map((t) => M[t].ground);
  // the canopy's own shadow on the ground to the lower right (1.2 units), softened, 9 L* (the dark fringe of the references' forest masses); AD fix 4: cast by the
  // presentation canopy (the feathered coverage), so a thinned wood edge casts a thinner shadow
  const ks = Math.max(1, Math.round(NAT.shadowU * RLK * TX)), sh = new Float32Array(HW * HH), shW = new Float32Array(HW * HH); // at half resolution (the mask's 2 x 2 share), offset and softened
  for (let y = ks; y < BH; y++) for (let x = ks; x < BW; x++) { const kq = (y - ks) * BW + x - ks, a = cmar[kq]; if (a) { const v = 0.25 * (a / 255), kh = (y >> 1) * HW + (x >> 1); shW[kh] += v; if (LT[kq] < 7) sh[kh] += v; } } // pass 3: the land's canopy shadow is cast by the land's crowns only (unchanged); the wilds' continued woods shade the wilds (shW)
  const shb = rlBoxBlur(sh, HW, HH, 1, 2), shbW = rlBoxBlur(shW, HW, HH, 1, 2), fSb = rlBoxBlur(fS, HW, HH, NAT.mtnSoft.r, 2); yield; lap('canopyShadow'); // fSb: pass 2, the mountains' softened shading (their cores read busy: crests flipped light to shade cell by cell)
  const T = (k) => rlNatT(k), Tm = T('mottle'), Ts = T('streak'), Td = T('dust'), Th = T('heath'), Tr = T('rock'), Tmi = T('micro'), Tp = T('pool'), Tre = T('reed'), Tsc = T('scrub'), Tf = T('field'), Tco = T('conifer');
  const img = new ImageData(BW, BH), d8 = img.data, KU = 1 / RLK, w = new Float64Array(7), wg = new Float64Array(7), pz = new Float64Array(7), TWO_PI = 2 * Math.PI;
  const Q = new Float64Array(3), mixc = (c, f) => { if (f <= 0) return; Q[0] += f * (c[0] - Q[0]); Q[1] += f * (c[1] - Q[1]); Q[2] += f * (c[2] - Q[2]); }; // the texel's colour in CIELAB
  const mh = new Uint32Array(1000), core = new Float64Array(N * 4), OWN = new Uint8Array(N).fill(255); for (const i of provList) OWN[i] = RL_TI[terr[i]]; // the natural core mean per province (own-terrain texels), for the independents' hover keyline (§8.4)
  for (let ty = 0, k = 0; ty < BH; ty++) {
    let hy = (ty + 0.5) / 2 - 0.5; if (hy < 0) hy = 0; if (hy > HH - 1) hy = HH - 1; const iy = hy | 0, fy = hy - iy, iy1 = iy + 1 < HH ? iy + 1 : iy, r0 = iy * HW, r1 = iy1 * HW;
    let qy = (ty + 0.5) / 4 - 0.5; if (qy < 0) qy = 0; if (qy > QH - 1) qy = QH - 1; const jy = qy | 0, gy = qy - jy, jy1 = jy + 1 < QH ? jy + 1 : jy, q0 = jy * QW, q1 = jy1 * QW;
    const v = ((ty + 0.5) / TX) * KU;
    for (let tx = 0; tx < BW; tx++, k++) {
      const lt = LT[k], o4 = k * 4; if (lt === 255) { d8[o4 + 3] = 0; continue; }
      const wl = lt >= 7; if (wl && !(out.msCov && out.msCov[k])) continue; // pass 3 (graft 2): a wild texel within reach is the land's own recipe continued (its covers from p58n), kept as the land under the range (p58x U); its relief comes from the range's heights (p58y)
      let hx = (tx + 0.5) / 2 - 0.5; if (hx < 0) hx = 0; if (hx > HW - 1) hx = HW - 1; const ix = hx | 0, fx = hx - ix, ix1 = ix + 1 < HW ? ix + 1 : ix;
      const a00 = r0 + ix, a01 = r0 + ix1, a10 = r1 + ix, a11 = r1 + ix1, w00 = (1 - fx) * (1 - fy), w01 = fx * (1 - fy), w10 = (1 - fx) * fy, w11 = fx * fy;
      for (let t = 0; t < 7; t++) { const P = wc8[t]; w[t] = (P[a00] * w00 + P[a01] * w01 + P[a10] * w10 + P[a11] * w11) / 255; }
      const fsV = fS[a00] * w00 + fS[a01] * w01 + fS[a10] * w10 + fS[a11] * w11, shdV = shd[a00] * w00 + shd[a01] * w01 + shd[a10] * w10 + shd[a11] * w11, aoV = ao[a00] * w00 + ao[a01] * w01 + ao[a10] * w10 + ao[a11] * w11, SB = wl ? shbW : shb, shbV = SB[a00] * w00 + SB[a01] * w01 + SB[a10] * w10 + SB[a11] * w11; // pass 3b: the land continued inside a wild takes the land's relief too (pass 3 drew it flat and lit it from the range's heights: a seam at the outline)
      let qx = (tx + 0.5) / 4 - 0.5; if (qx < 0) qx = 0; if (qx > QW - 1) qx = QW - 1; const jx = qx | 0, gx = qx - jx, jx1 = jx + 1 < QW ? jx + 1 : jx;
      const b00 = q0 + jx, b01 = q0 + jx1, b10 = q1 + jx, b11 = q1 + jx1, v00 = (1 - gx) * (1 - gy), v01 = gx * (1 - gy), v10 = (1 - gx) * gy, v11 = gx * gy;
      let ws = 0; for (let t = 0; t < 7; t++) { const P = wch[t]; wg[t] = P[b00] * v00 + P[b01] * v01 + P[b10] * v10 + P[b11] * v11; ws += wg[t]; }
      if (ws < 1e-4) { wg.fill(0); wg[wl ? 3 : lt] = 1; ws = 1; } // no land weight reaches: the wild's texel takes the hills' ground
      // the ground: the wide blend of each terrain's ground colour, and a broad mottle (fBm, 26 units)
      Q[0] = 0; Q[1] = 0; Q[2] = 0; for (let t = 0; t < 7; t++) { const f = wg[t] / ws; if (f > 0) { Q[0] += f * G[t][0]; Q[1] += f * G[t][1]; Q[2] += f * G[t][2]; } }
      const u = ((tx + 0.5) / TX) * KU; Q[0] += NAT.mottle * rlFbm(Tm, u / 26, v / 26, 3);
      for (let t = 0; t < 7; t++) { const q = (w[t] - NAT.pres0) / NAT.presW; pz[t] = q < 0 ? 0 : q > 1 ? 1 : q; } const pp = pz[0], ph = pz[3], pm = pz[4], ps = pz[5], pw = pz[6];
      if (pp > 0) { // plains: wind streaks (14 x 3.2 units), light-grass patches (fBm 11), dry patches (fBm 18)
        Q[0] += pp * 1.6 * rlVN(Ts, u / 14 + (0.6 * v) / 14, v / 3.2);
        mixc(M.plains.light, pp * Math.max(0, Math.min(1, rlFbm(Tm, u / 11 + 40, v / 11, 2) - 0.2)) * 0.6);
        mixc(M.plains.dry, pp * Math.max(0, Math.min(1, rlFbm(Td, u / 18 + 70, v / 18, 2) - 0.3)) * 0.8);
      }
      if (ph > 0) { // hills: heath blotches of turf and bracken (fBm 9), rock specks
        const hb = rlFbm(Th, u / 9, v / 9, 3);
        mixc(M.hills.turf, ph * Math.max(0, Math.min(1, hb * 1.4)) * 0.75); mixc(M.hills.bracken, ph * Math.max(0, Math.min(1, -hb * 1.4 - 0.2)) * 0.6);
        mixc(M.hills.rock, ph * 0.35 * rlRamp(rlVN(Tr, u / 1.6, v / 1.6), 0.72, 0.9)); // AD fix 4: a soft ramp (the hard > 0.78 speck drew pale blocks at Near)
      }
      if (pm > 0) { // mountains: scree where the ground is concave or noisy, turf in deep valleys, rock micro-relief
        mixc(M.mountains.scree, pm * Math.max(0, Math.min(1, aoV * 1.2 + 0.4 * rlFbm(Tr, u / 5 + 9, v / 5, 2) - 0.1)) * 0.6);
        mixc(M.mountains.turf, pm * Math.max(0, Math.min(1, (aoV - 0.5) * 2)) * 0.5); Q[0] += pm * NAT.mtnSoft.micro * rlFbm(Tmi, u / 3.5, v / 3.5, 3);
      }
      let pool = 0;
      if (ps > 0) { // swamp: dark peat pools (fBm 9 > 0.40, drawn last), reed beds as short strokes, shrubs
        pool = Math.max(0, Math.min(1, (rlFbm(Tp, u / 9, v / 9, 3) - 0.40) / 0.08)) * ps;
        const reed = Math.max(0, Math.min(1, (rlVN(Tre, u / 0.9, v / 4.5) * 0.6 + rlFbm(Tre, u / 12 + 7, v / 12, 2) - 0.25) * 2)) * ps * (1 - pool);
        mixc(M.swamp.reed, reed * 0.7); mixc(M.swamp.shrub, ps * (1 - pool) * 0.6 * rlRamp(rlVN(Tsc, u / 1.3 + 3, v / 1.3), 0.66, 0.84));
      }
      if (pw > 0) { // wasteland: pale drifts, a crack network (cells 6 units), ripples and streaks, scrub dots
        const cu = u / 6, cv = v / 6, iu = Math.floor(cu), iv = Math.floor(cv); let d1 = 9, d2 = 9;
        for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) { const h = rlH2(iu + ox, iv + oy, 11), dx = cu - (iu + ox + rlH2a(h)), dy = cv - (iv + oy + rlH2b(h)), dd = dx * dx + dy * dy; if (dd < d1) { d2 = d1; d1 = dd; } else if (dd < d2) d2 = dd; }
        const crack = Math.max(0, Math.min(1, 1 - (Math.sqrt(d2) - Math.sqrt(d1)) / 0.05)) * rlRamp(rlVN(Td, u / 7, v / 7), -0.41, -0.29); // the crack network's gaps ramped
        mixc(M.wasteland.pale, pw * Math.max(0, Math.min(1, rlFbm(Td, u / 16 + 5, v / 16, 2))) * 0.7 * 0.6); mixc(M.wasteland.crack, pw * crack * 0.8);
        Q[0] += pw * (1.2 * Math.sin((u * 0.8 + v * 0.6) / 1.3 + 3 * rlVN(Td, u / 20, v / 20)) + 2.5 * rlFbm(Td, u / 8 + 3, v / 3, 2));
        mixc(M.wasteland.scrub, pw * 0.5 * rlRamp(rlVN(Tsc, u / 1.4, v / 1.4), 0.72, 0.9));
      }
      const c = cls[k], tone = ftone[k];
      if (tone) { // a field: its crop's tone, uneven, with furrows along the strip (the green crop excepted), and its hedgerow
        const fc = M.farmland[NAT.tones[tone - 1]]; Q[0] = fc[0] + 1.2 * rlVN(Tf, u / 3, v / 3) + (tone !== 3 ? NAT.field.furrowL * Math.sin((fph[k] / 256) * TWO_PI) : 0); Q[1] = fc[1]; Q[2] = fc[2];
        const se = 1 - fseam[k] / 64; if (se > 0) mixc(M.farmland.ground, NAT.field.seamMix * se); // AD fix 4: the parcel's edge eased toward the farmland ground over one texel (no tone step)
        mixc(M.farmland.hedge, (fhedge[k] / 255) * NAT.field.hedgeA);
      }
      // relief: the shared hillshade with the natural caps, blended by the cover weights; cast shadow and valleys; a canopy damps the ground's shading
      let cap = 0; for (let t = 0; t < 7; t++) cap += CAP[t] * w[t];
      const fsM = pz[4] > 0 ? fsV + (fSb[a00] * w00 + fSb[a01] * w01 + fSb[a10] * w10 + fSb[a11] * w11 - fsV) * NAT.mtnSoft.k * pz[4] : fsV; // pass 2: the mountains' crests softened
      const rel = cap * (fsM < -1 ? -1 : fsM > NAT.lit ? NAT.lit : fsM) - NAT.castL * shdV - NAT.valleyL * aoV;
      // AD fix 4: the presentation canopy. al, the feathered coverage from the canopy score margin: 1 inside a wood, 0 in the open, between them at its edge, where a crown
      // stands only if its own hash is under al, so the edge breaks into single crowns over the ground (the class raster cls, which N4 reads, is not changed)
      const al = cmar[k] / 255, canopy = c === 2 || c === 9 || c === 10;
      if (al <= 0) { Q[0] -= NAT.shadowL * shbV; Q[0] += rel; }
      else { // crowns: a jittered grid 2.3 units apart, each a dome lit from the upper left; gaps darker; conifer stands darker and bluer; a broad stand mottle
        const gu = u / NAT.crown, gv = v / NAT.crown, iu = Math.floor(gu), iv = Math.floor(gv); let best = 9, bdx = 0, bdy = 0, bi = 0, bj = 0;
        for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) { const h = rlH2(iu + ox, iv + oy, 37), rr = 0.55 + 0.35 * rlH2c(h), ddx = (gu - (iu + ox + rlH2a(h))) / rr, ddy = (gv - (iv + oy + rlH2b(h))) / rr, dd = Math.sqrt(ddx * ddx + ddy * ddy); if (dd < best) { best = dd; bdx = ddx; bdy = ddy; bi = iu + ox; bj = iv + oy; } }
        const crown = Math.max(0, 1 - best * best), lit = -(bdx + bdy) * 0.7071, cl = best < 1 ? 3.5 * crown + 5.0 * lit * Math.sqrt(crown) - 1.0 : -6.0;
        const cc = rlFbm(Tco, u / 22, v / 22, 2) > 0.25 ? M.forest.conifer : M.forest.canopy, sm = 2.0 * rlFbm(Tm, u / 30 + 11, v / 30, 2) + rel * NAT.damp, cL = cc[0] + cl + sm;
        if (al >= 1 && canopy) { Q[0] = cL; Q[1] = cc[1]; Q[2] = cc[2]; }
        else { // the edge: the ground (its shadow and relief) closing toward the wood's dark understorey as al nears 1, and over it the kept crowns, each with a soft rim
          Q[0] -= NAT.shadowL * shbV; Q[0] += rel;
          const gw = rlRamp(al, 0.55, 1); if (gw > 0) { Q[0] += gw * (cc[0] - 6 + sm - Q[0]); Q[1] += gw * (cc[1] - Q[1]); Q[2] += gw * (cc[2] - Q[2]); }
          const keep = rlH2c(rlH2(bi, bj, 53)) < al, cov = keep ? rlRamp(1 - best, 0, 0.3) : 0;
          if (cov > 0) { Q[0] += cov * (cL - Q[0]); Q[1] += cov * (cc[1] - Q[1]); Q[2] += cov * (cc[2] - Q[2]); }
        }
      }
      if (pool > 0) { mixc(M.swamp.pool, pool); Q[0] += pool * 1.2 * rlVN(Tp, u / 2, v / 2); } // pools last: flat dark peat-water
      if (wl) { rlMsUnderSet(out, k, Q[0], Q[1], Q[2]); continue; } // the wild's continued land (never written to the bake: the wild's own pass does that)
      rlLabTo(Q[0], Q[1], Q[2], d8, o4); d8[o4 + 3] = 255; if (lt === 4) mh[Q[0] <= 0 ? 0 : Q[0] >= 99.9 ? 999 : (Q[0] * 10) | 0]++;
      if ((k & 3) === 0 && lt === OWN[id[k]]) { const q = id[k] * 4; core[q] += Q[0]; core[q + 1] += Q[1]; core[q + 2] += Q[2]; core[q + 3]++; }
    }
    if ((ty & 63) === 63) yield;
  }
  lap('materials');
  { let n = 0, tot = 0; for (const c of mh) tot += c; let q = 999; for (let b = 0; b < 1000; b++) { n += mh[b]; if (n >= tot * 0.999) { q = b; break; } } // the passable mountains' brightest lit rock (p99.9)
    const Lcap = (tot ? (q + 0.5) / 10 : 55) + RL_NW.margin; out.nwCap = { rockP999: tot ? (q + 0.5) / 10 : null, cap: Lcap };
    out.msImg = img; const foot = () => { let h = 0x811c9dc5; for (let k = 0; k < NP; k++) { if (LT[k] >= 7) continue; const o = k * 4; h = Math.imul(h ^ (d8[o] | (d8[o + 1] << 8) | (d8[o + 2] << 16) | (d8[o + 3] << 24)), 0x01000193); } return (h >>> 0).toString(16); }, fb = foot(); yield* rlMsColour(out, Lcap); rlMsLandformCanvas(out); { let mv = 0; for (let k = 0; k < out.shd.length; k++) if (Math.abs(out.nw.shd[k] - out.shd[k]) > 0.01) mv++; out.msFoot = { before: fb, after: foot(), shadowMoved: mv }; } if (!RL_DBG.keepMs && !location.search.includes('keepms')) rlMsFree(out); lap('wildTexels'); } // pass 3 (p58y): the wilds' fine rasters and the bake's wild texels (their F x F means); the working planes freed (p58x) // review: ?keepms keeps the planes
  for (let ty = 0; ty < BH; ty++) for (let tx = 0; tx < BW; tx++) { // antialias the rounded corners (the nearest province's natural ground)
    const x = (tx + 0.5) / TX, y = (ty + 0.5) / TX; if (!((x < RL_RC || x > W - RL_RC) && (y < RL_RC || y > H - RL_RC))) continue;
    const cx = x < RL_RC ? RL_RC : W - RL_RC, cy = y < RL_RC ? RL_RC : H - RL_RC, dd = Math.hypot(x - cx, y - cy) - RL_RC, cov = Math.max(0, Math.min(1, 0.5 - dd * TX)), o4 = (ty * BW + tx) * 4;
    if (cov > 0 && d8[o4 + 3] === 0) { const nb = nearest(x, y), c = RL_WILDK[nb] ? rgb2lab(hex2rgb(RL_C.granite)) : M[terr[nb]].ground; rlLabTo(c[0], c[1], c[2], d8, o4); }
    d8[o4 + 3] = Math.round(255 * cov);
  }
  const coreKey = new Array(N).fill(null), coreHex = new Array(N).fill(null);
  for (const i of provList) { const q = i * 4; if (!core[q + 3]) continue; const rgb = [0, 0, 0]; rlLabTo(core[q] / core[q + 3], core[q + 1] / core[q + 3], core[q + 2] / core[q + 3], rgb, 0); coreHex[i] = rgb2hex(rgb); coreKey[i] = rlKeyFor(rgb); }
  yield; lap('corners');
  yield* rlFinishLook(out, 'natural', img, tm, lap);
  out.L.natural.coreKey = coreKey; out.L.natural.coreHex = coreHex;
}
