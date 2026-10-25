// The Lean-back static pass measured where it will run: inside rlRenderCache (the 35% margin, both cache layers, the room, table, vignette and rim,
// the composite blit and the live layer), at the least zoom. The pass draws: an overview (quarter mip + Far relief + fog + 0.28 washes, made once),
// full lit-bead rails on owned provinces, wild contours, the lip, region names on spines (regionSpines + layoutOnPath + paintGlyphs with a 3 px halo,
// a box grid, up to 5 spines x 3 sizes x 5 offsets), and capital names. Nothing is kept: rlRenderStatic is restored at the end.
(() => {
  const med = (a) => { const q = [...a].sort((x, y) => x - y); return +q[q.length >> 1].toFixed(1); };
  layout(); const v = viewRect(), s = minScale, [kx, ky] = cent[redCap]; cam.s = s; cam.x = (v.l + v.r) / 2 - kx * s; cam.y = (v.t + v.b) / 2 - ky * s; clampCam(); RCK = null; draw();
  const res = { provinces: provList.length, dpx: +(cam.s * MED_DIAM).toFixed(1), view: [cw, ch, dpr], phone: app.classList.contains('phone'), cacheCanvas: [rlU.width, rlU.height] };
  // today's static re-render at this zoom (the cache dropped), with a flush
  const base = []; for (let j = 0; j < 4; j++) { RCK = null; const t = performance.now(); draw(); ctx.getImageData(0, 0, 1, 1); base.push(performance.now() - t); } res.todayStaticFlushMs = med(base);
  const cached = []; for (let j = 0; j < 20; j++) { cam.x += j % 2 ? -1 : 1; const t = performance.now(); draw(); ctx.getImageData(0, 0, 1, 1); cached.push(performance.now() - t); } res.todayCachedFlushMs = med(cached);
  // the overview, made once
  const Lk = RB.L.natural, m2 = Lk.mip2, OW = m2.width, OH = m2.height, k = OW / W, t0 = performance.now();
  const OV = makeCanvas(OW, OH), og = OV.getContext('2d'); og.drawImage(m2, 0, 0); og.save(); og.globalCompositeOperation = 'soft-light'; og.drawImage(rlFarRaster(), 0, 0, OW, OH); og.restore();
  const F = RL_FOG(); og.save(); og.scale(k, k);
  for (const p of provs) { if (fogOf(p.i) !== 'unexplored') continue; pathPoly(og, cells[p.i]); og.fillStyle = rgba(RL_C.gesso, F.haze); og.fill(); }
  og.globalCompositeOperation = 'saturation'; for (const p of provs) { const f = fogOf(p.i), sat = f === 'outofsight' ? F.outSat : f === 'unexplored' ? F.unexSat : 0; if (!sat) continue; pathPoly(og, cells[p.i]); og.fillStyle = `rgba(128,128,128,${sat})`; og.fill(); }
  og.globalCompositeOperation = 'source-over'; for (const p of provs) { if (!p.owner) continue; pathPoly(og, cells[p.i]); og.fillStyle = rgba(BAN[p.owner], 0.28); og.fill(); } og.restore();
  og.getImageData(0, 0, 1, 1); res.overviewMakeMs = +(performance.now() - t0).toFixed(1); res.overview = [OW, OH];
  // pseudo-regions of about 7 provinces (BFS chunks from the lowest id), named like the record's
  const K = Math.max(2, Math.round(provList.length / 7)), left = new Set(provList), regs = [];
  while (left.size) { const s0 = Math.min(...left), q = [s0], got = [s0]; left.delete(s0); for (let h = 0; h < q.length && got.length < 7; h++) for (const w of nbrs(q[h])) if (left.has(w) && got.length < 7) { left.delete(w); got.push(w); q.push(w); } regs.push({ provs: got, name: 'The ' + ['Broad Plain', 'Wind Knolls', 'Sedge Fens', 'Lark Leas', 'Long Downs', 'Mosswold', 'Elderholt', 'Gold Leas'][regs.length % 8] }); }
  res.regions = regs.length;
  const owned = provList.filter((i) => prov[i].owner), caps = [redCap, greenCap];
  let layMs = 0, placed = 0, glyphs = 0;
  const lean = (gU, gO) => {
    const px = 1 / cam.s, covers = (r) => r[0] <= VW[0] && r[1] <= VW[1] && r[2] >= VW[2] && r[3] >= VW[3];
    gU.setTransform(1, 0, 0, 1, 0, 0); gO.setTransform(1, 0, 0, 1, 0, 0); gO.clearRect(0, 0, gO.canvas.width, gO.canvas.height); const g = gU;
    const roomShows = !covers(TABLE);
    if (roomShows) { if (!covers(ROOM)) { g.fillStyle = '#0E0905'; g.fillRect(0, 0, g.canvas.width, g.canvas.height); } worldT(g); if (view.table === 'full') blitRing(g, bakeRoom(), ROOM, TABLE); }
    worldT(g); const T = bakeTable(); blitRegion(g, T, T.x0, T.y0, T.x0 + T.w, T.y0 + T.h);
    if (view.table === 'full' && roomShows) { screenT(g); const vg = g.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.35, cw / 2, ch / 2, Math.hypot(cw, ch) * 0.6); vg.addColorStop(0, 'rgba(14,9,5,0)'); vg.addColorStop(1, 'rgba(14,9,5,.5)'); g.fillStyle = vg; g.save(); g.beginPath(); g.rect(0, 0, cw, ch); const [a, b] = toScreen(MODEL_BOX[0], MODEL_BOX[1]), [c, d] = toScreen(MODEL_BOX[2], MODEL_BOX[3]); g.rect(a, b, c - a, d - b); g.clip('evenodd'); g.fillRect(0, 0, cw, ch); g.restore(); }
    worldT(g); const RM = rlRim(); blitRegion(g, RM, RM.x0, RM.y0, RM.x0 + RM.w, RM.y0 + RM.h);
    g.save(); modelPath(g); g.clip(); g.imageSmoothingQuality = 'low'; g.drawImage(OV, 0, 0, W, H); g.restore();
    worldT(gO); gO.save(); modelPath(gO); gO.clip(); for (const i of owned) rlDrawRails(gO, 'far', px, { only: i }); gO.restore();
    rlDrawWildContours(gO, px); rlDrawLip(gO, px);
    screenT(gO); const tl = performance.now(), grid = new Map(), ops = [];
    for (const c of caps) { const [x, y] = toScreen(...cent[c]), f = "700 12px 'Alegreya Sans', sans-serif", w2 = textW(names[c], f) / 2 + 3; const b = [x - w2, y - 9, x + w2, y + 9]; gridAdd(grid, b); ops.push(['cap', c, x, y, f]); }
    for (const rg of regs) { const sp = regionSpines(rg, 0.3).slice(0, 5); let ok = false;
      for (const S of sp) { if (ok) break; const P = S.pts.map((q) => toScreen(...q)); P.Lc = cumLen(P); P.len = P.Lc[P.Lc.length - 1];
        for (const fs of [18, 16.5, 15]) { if (ok) break; const font = `${fs}px 'Marcellus SC', Georgia, serif`;
          for (const off of [0, 0.15, -0.15, 0.3, -0.3]) { const Q = P.map((q, m) => [q[0] + S.nrm[m][0] * off * MED_DIAM * cam.s, q[1] + S.nrm[m][1] * off * MED_DIAM * cam.s]); Q.Lc = P.Lc; const gl = layoutOnPath(rg.name.toUpperCase(), Q, font, 0.28 * fs, fs); if (!gl) continue; const bs = glyphBoxes(gl, 2); if (gridHit(grid, bs)) continue; for (const b of bs) gridAdd(grid, b); ops.push(['reg', gl, font]); ok = true; placed++; glyphs += gl.length; break; } } } }
    layMs += performance.now() - tl;
    for (const op of ops) { if (op[0] === 'cap') rlLabel(gO, names[op[1]], op[2], op[3], op[4], true); else { const R = rngFor('rv:' + op[2]); paintGlyphs(gO, op[1].map((q) => ({ ...q, a: q.a + (R() - 0.5) * 0.042, y: q.y + (R() - 0.5) * 1.2 })), op[2], 'rgba(233,228,216,.92)', 'rgba(20,18,15,.5)', 3); } }
    gO.setTransform(1, 0, 0, 1, 0, 0); gU.setTransform(1, 0, 0, 1, 0, 0);
  };
  const orig = rlRenderStatic; rlRenderStatic = (gU, gO) => lean(gU, gO);
  try {
    const L = [], LJ = []; layMs = 0; placed = 0; glyphs = 0;
    for (let j = 0; j < 6; j++) { RCK = null; const t = performance.now(); draw(); LJ.push(performance.now() - t); ctx.getImageData(0, 0, 1, 1); L.push(performance.now() - t); }
    res.leanStaticFlushMs = med(L); res.leanStaticJsMs = med(LJ); res.leanAll = L.map((x) => +x.toFixed(1)); res.regionLayoutMsPerRender = +(layMs / 6).toFixed(1); res.regionNamesPlaced = placed / 6; res.glyphsPerRender = glyphs / 6;
    const C2 = []; for (let j = 0; j < 20; j++) { cam.x += j % 2 ? -1 : 1; const t = performance.now(); draw(); ctx.getImageData(0, 0, 1, 1); C2.push(performance.now() - t); } res.leanCachedFlushMs = med(C2);
    // a hover at Lean-back: the hovered province's floor lines and rails drawn live
    const pick = provList.filter((i) => { const [x, y] = toScreen(...cent[i]); return x > 60 && x < cw - 60 && y > 60 && y < ch - 60; }), H = [];
    for (let j = 0; j < 12; j++) { hoverProv = pick[j % pick.length] ?? -1; const t = performance.now(); draw(); ctx.getImageData(0, 0, 1, 1); H.push(performance.now() - t); } hoverProv = -1; res.leanHoverFlushMs = med(H);
  } finally { rlRenderStatic = orig; RCK = null; draw(); }
  // the line styles solved cold (a season change or a reveal re-solves them): today's static at this zoom and at the start view, cache cleared
  const cold = (sc) => { cam.s = sc; clampCam(); RCK = null; draw(); const a = []; for (let j = 0; j < 3; j++) { RL_LINES.cache.clear(); RCK = null; const t = performance.now(); draw(); ctx.getImageData(0, 0, 1, 1); a.push(performance.now() - t); } const w = []; for (let j = 0; j < 3; j++) { RCK = null; const t = performance.now(); draw(); ctx.getImageData(0, 0, 1, 1); w.push(performance.now() - t); } return { coldMs: med(a), warmMs: med(w) }; };
  res.lineSolveLeast = cold(minScale); res.lineSolveStart = cold(startScale());
  // a full wash composite on a new look variant (every province dirty), as a season change would need
  { const L2 = RB.L.natural; const t = performance.now(); L2.washKeys = null; rlWashSync('natural'); res.washFullMs = +(performance.now() - t).toFixed(1); }
  return JSON.stringify(res);
})()
