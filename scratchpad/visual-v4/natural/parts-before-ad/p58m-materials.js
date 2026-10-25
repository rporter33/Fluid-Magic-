
// ------------------------------------------------------------------ natural view: the materials (natural §2, §3.3, §4), the colour of the natural look
// The ground blends wide (S3's height weights, sigma 0.12 D), the covers of p58n decide what is drawn; every recipe is CIELAB on the ground, weighted by each terrain's
// presence p_t = clamp((w_t - 0.35) / 0.3, 0, 1). No province-mean budget, no mean-neutral pass, no gamut correction (N5): the readability checks hold this look.
function* rlNaturalGen(out) {
  const tm = {}; let t0 = performance.now(); const lap = (k) => { const n = performance.now(); tm[k] = +((tm[k] ?? 0) + n - t0).toFixed(1); t0 = n; };
  yield* rlNatCoverGen(out, lap);
  const { BW, BH, TX, HW, HH, QW, QH, LT, id, fS, shd, ao, wch } = out, NP = BW * BH, NAT = RL_NAT, M = NAT.mat, CAP = NAT.cap;
  const { cls, ftone, fhedge, fph, wc8 } = out.nat, G = RL_T.map((t) => M[t].ground);
  // the canopy's own shadow on the ground to the lower right (1.2 units), softened, 9 L* (the dark fringe of the references' forest masses)
  const ks = Math.max(1, Math.round(NAT.shadowU * RLK * TX)), sh = new Float32Array(HW * HH); // at half resolution (the mask's 2 x 2 share), offset and softened
  for (let y = ks; y < BH; y++) for (let x = ks; x < BW; x++) { const c = cls[(y - ks) * BW + x - ks]; if (c === 2 || c === 9 || c === 10) sh[(y >> 1) * HW + (x >> 1)] += 0.25; }
  const shb = rlBoxBlur(sh, HW, HH, 1, 2); yield; lap('canopyShadow');
  const T = (k) => rlNatT(k), Tm = T('mottle'), Ts = T('streak'), Td = T('dust'), Th = T('heath'), Tr = T('rock'), Tmi = T('micro'), Tp = T('pool'), Tre = T('reed'), Tsc = T('scrub'), Tf = T('field'), Tco = T('conifer');
  const img = new ImageData(BW, BH), d8 = img.data, KU = 1 / RLK, w = new Float64Array(7), wg = new Float64Array(7), pz = new Float64Array(7), TWO_PI = 2 * Math.PI;
  const Q = new Float64Array(3), mixc = (c, f) => { if (f <= 0) return; Q[0] += f * (c[0] - Q[0]); Q[1] += f * (c[1] - Q[1]); Q[2] += f * (c[2] - Q[2]); }; // the texel's colour in CIELAB
  const core = new Float64Array(N * 4), OWN = new Uint8Array(N).fill(255); for (const i of provList) OWN[i] = RL_TI[terr[i]]; // the natural core mean per province (own-terrain texels), for the independents' hover keyline (§8.4)
  for (let ty = 0, k = 0; ty < BH; ty++) {
    let hy = (ty + 0.5) / 2 - 0.5; if (hy < 0) hy = 0; if (hy > HH - 1) hy = HH - 1; const iy = hy | 0, fy = hy - iy, iy1 = iy + 1 < HH ? iy + 1 : iy, r0 = iy * HW, r1 = iy1 * HW;
    let qy = (ty + 0.5) / 4 - 0.5; if (qy < 0) qy = 0; if (qy > QH - 1) qy = QH - 1; const jy = qy | 0, gy = qy - jy, jy1 = jy + 1 < QH ? jy + 1 : jy, q0 = jy * QW, q1 = jy1 * QW;
    const v = ((ty + 0.5) / TX) * KU;
    for (let tx = 0; tx < BW; tx++, k++) {
      const lt = LT[k], o4 = k * 4; if (lt === 255) { d8[o4 + 3] = 0; continue; }
      if (lt >= 7) { rlWildTexel(out, lt, tx, ty, d8, o4); continue; }
      let hx = (tx + 0.5) / 2 - 0.5; if (hx < 0) hx = 0; if (hx > HW - 1) hx = HW - 1; const ix = hx | 0, fx = hx - ix, ix1 = ix + 1 < HW ? ix + 1 : ix;
      const a00 = r0 + ix, a01 = r0 + ix1, a10 = r1 + ix, a11 = r1 + ix1, w00 = (1 - fx) * (1 - fy), w01 = fx * (1 - fy), w10 = (1 - fx) * fy, w11 = fx * fy;
      for (let t = 0; t < 7; t++) { const P = wc8[t]; w[t] = (P[a00] * w00 + P[a01] * w01 + P[a10] * w10 + P[a11] * w11) / 255; }
      const fsV = fS[a00] * w00 + fS[a01] * w01 + fS[a10] * w10 + fS[a11] * w11, shdV = shd[a00] * w00 + shd[a01] * w01 + shd[a10] * w10 + shd[a11] * w11, aoV = ao[a00] * w00 + ao[a01] * w01 + ao[a10] * w10 + ao[a11] * w11, shbV = shb[a00] * w00 + shb[a01] * w01 + shb[a10] * w10 + shb[a11] * w11;
      let qx = (tx + 0.5) / 4 - 0.5; if (qx < 0) qx = 0; if (qx > QW - 1) qx = QW - 1; const jx = qx | 0, gx = qx - jx, jx1 = jx + 1 < QW ? jx + 1 : jx;
      const b00 = q0 + jx, b01 = q0 + jx1, b10 = q1 + jx, b11 = q1 + jx1, v00 = (1 - gx) * (1 - gy), v01 = gx * (1 - gy), v10 = (1 - gx) * gy, v11 = gx * gy;
      let ws = 0; for (let t = 0; t < 7; t++) { const P = wch[t]; wg[t] = P[b00] * v00 + P[b01] * v01 + P[b10] * v10 + P[b11] * v11; ws += wg[t]; }
      if (ws < 1e-4) { wg.fill(0); wg[lt] = 1; ws = 1; }
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
        if (rlVN(Tr, u / 1.6, v / 1.6) > 0.78) mixc(M.hills.rock, ph * 0.7);
      }
      if (pm > 0) { // mountains: scree where the ground is concave or noisy, turf in deep valleys, rock micro-relief
        mixc(M.mountains.scree, pm * Math.max(0, Math.min(1, aoV * 1.2 + 0.4 * rlFbm(Tr, u / 5 + 9, v / 5, 2) - 0.1)) * 0.6);
        mixc(M.mountains.turf, pm * Math.max(0, Math.min(1, (aoV - 0.5) * 2)) * 0.5); Q[0] += pm * 2.0 * rlFbm(Tmi, u / 3.5, v / 3.5, 3);
      }
      let pool = 0;
      if (ps > 0) { // swamp: dark peat pools (fBm 9 > 0.40, drawn last), reed beds as short strokes, shrubs
        pool = Math.max(0, Math.min(1, (rlFbm(Tp, u / 9, v / 9, 3) - 0.40) / 0.08)) * ps;
        const reed = Math.max(0, Math.min(1, (rlVN(Tre, u / 0.9, v / 4.5) * 0.6 + rlFbm(Tre, u / 12 + 7, v / 12, 2) - 0.25) * 2)) * ps * (1 - pool);
        mixc(M.swamp.reed, reed * 0.7); if (rlVN(Tsc, u / 1.3 + 3, v / 1.3) > 0.72) mixc(M.swamp.shrub, ps * (1 - pool) * 0.8);
      }
      if (pw > 0) { // wasteland: pale drifts, a crack network (cells 6 units), ripples and streaks, scrub dots
        const cu = u / 6, cv = v / 6, iu = Math.floor(cu), iv = Math.floor(cv); let d1 = 9, d2 = 9;
        for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) { const h = rlH2(iu + ox, iv + oy, 11), dx = cu - (iu + ox + rlH2a(h)), dy = cv - (iv + oy + rlH2b(h)), dd = dx * dx + dy * dy; if (dd < d1) { d2 = d1; d1 = dd; } else if (dd < d2) d2 = dd; }
        const crack = Math.max(0, Math.min(1, 1 - (Math.sqrt(d2) - Math.sqrt(d1)) / 0.05)) * (rlVN(Td, u / 7, v / 7) > -0.35 ? 1 : 0);
        mixc(M.wasteland.pale, pw * Math.max(0, Math.min(1, rlFbm(Td, u / 16 + 5, v / 16, 2))) * 0.7 * 0.6); mixc(M.wasteland.crack, pw * crack * 0.8);
        Q[0] += pw * (1.2 * Math.sin((u * 0.8 + v * 0.6) / 1.3 + 3 * rlVN(Td, u / 20, v / 20)) + 2.5 * rlFbm(Td, u / 8 + 3, v / 3, 2));
        if (rlVN(Tsc, u / 1.4, v / 1.4) > 0.78) mixc(M.wasteland.scrub, pw * 0.85);
      }
      const c = cls[k], tone = ftone[k];
      if (tone) { // a field: its crop's tone, uneven, with furrows along the strip (the green crop excepted), and its hedgerow
        const fc = M.farmland[NAT.tones[tone - 1]]; Q[0] = fc[0] + 1.2 * rlVN(Tf, u / 3, v / 3) + (tone !== 3 ? 1.6 * Math.sin((fph[k] / 256) * TWO_PI) : 0); Q[1] = fc[1]; Q[2] = fc[2];
        mixc(M.farmland.hedge, (fhedge[k] / 255) * NAT.field.hedgeA);
      }
      const canopy = c === 2 || c === 9 || c === 10;
      if (!canopy) Q[0] -= NAT.shadowL * shbV;
      else { // crowns: a jittered grid 2.3 units apart, each a dome lit from the upper left; gaps darker; conifer stands darker and bluer; a broad stand mottle
        const gu = u / NAT.crown, gv = v / NAT.crown, iu = Math.floor(gu), iv = Math.floor(gv); let best = 9, bdx = 0, bdy = 0;
        for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) { const h = rlH2(iu + ox, iv + oy, 37), rr = 0.55 + 0.35 * rlH2c(h), ddx = (gu - (iu + ox + rlH2a(h))) / rr, ddy = (gv - (iv + oy + rlH2b(h))) / rr, dd = Math.sqrt(ddx * ddx + ddy * ddy); if (dd < best) { best = dd; bdx = ddx; bdy = ddy; } }
        const crown = Math.max(0, 1 - best * best), lit = -(bdx + bdy) * 0.7071, cl = best < 1 ? 3.5 * crown + 5.0 * lit * Math.sqrt(crown) - 1.0 : -6.0;
        const cc = rlFbm(Tco, u / 22, v / 22, 2) > 0.25 ? M.forest.conifer : M.forest.canopy; Q[0] = cc[0] + cl + 2.0 * rlFbm(Tm, u / 30 + 11, v / 30, 2); Q[1] = cc[1]; Q[2] = cc[2];
      }
      // relief: the shared hillshade with the natural caps, blended by the cover weights; cast shadow and valleys; a canopy damps the ground's shading
      let cap = 0; for (let t = 0; t < 7; t++) cap += CAP[t] * w[t];
      const rel = cap * (fsV < -1 ? -1 : fsV > NAT.lit ? NAT.lit : fsV) - NAT.castL * shdV - NAT.valleyL * aoV;
      Q[0] += canopy ? rel * NAT.damp : rel;
      if (pool > 0) { mixc(M.swamp.pool, pool); Q[0] += pool * 1.2 * rlVN(Tp, u / 2, v / 2); } // pools last: flat dark peat-water
      rlLabTo(Q[0], Q[1], Q[2], d8, o4); d8[o4 + 3] = 255;
      if ((k & 3) === 0 && lt === OWN[id[k]]) { const q = id[k] * 4; core[q] += Q[0]; core[q + 1] += Q[1]; core[q + 2] += Q[2]; core[q + 3]++; }
    }
    if ((ty & 63) === 63) yield;
  }
  lap('materials');
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
