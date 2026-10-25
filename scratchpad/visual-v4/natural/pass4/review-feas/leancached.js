// The Lean-back pass with its two mitigations: the chrome (room, table, vignette, rim) drawn once per zoom and size into its own canvas and blitted 1:1,
// and the region names laid out once per zoom bucket (here: once), so a month, fog or selection change re-renders only the map layer
(() => {
  const med = (a) => { const q = [...a].sort((x, y) => x - y); return +q[q.length >> 1].toFixed(1); };
  layout(); const v = viewRect(), s = minScale, [kx, ky] = cent[redCap]; cam.s = s; cam.x = (v.l + v.r) / 2 - kx * s; cam.y = (v.t + v.b) / 2 - ky * s; clampCam(); RCK = null; draw();
  const Lk = RB.L.natural, m2 = Lk.mip2, OW = m2.width, OH = m2.height, k = OW / W, OV = makeCanvas(OW, OH), og = OV.getContext('2d'); og.drawImage(m2, 0, 0);
  og.save(); og.globalCompositeOperation = 'soft-light'; og.drawImage(rlFarRaster(), 0, 0, OW, OH); og.restore(); og.save(); og.scale(k, k); for (const p of provs) { if (!p.owner) continue; pathPoly(og, cells[p.i]); og.fillStyle = rgba(BAN[p.owner], 0.28); og.fill(); } og.restore();
  const owned = provList.filter((i) => prov[i].owner); let CH = null, OPS = null; const res = { dpx: +(cam.s * MED_DIAM).toFixed(1) };
  const lean = (gU, gO) => {
    const px = 1 / cam.s, covers = (r) => r[0] <= VW[0] && r[1] <= VW[1] && r[2] >= VW[2] && r[3] >= VW[3];
    gU.setTransform(1, 0, 0, 1, 0, 0); gO.setTransform(1, 0, 0, 1, 0, 0); gO.clearRect(0, 0, gO.canvas.width, gO.canvas.height);
    if (!CH) { CH = makeCanvas(gU.canvas.width, gU.canvas.height); const g = CH.getContext('2d'); const roomShows = !covers(TABLE);
      if (roomShows) { if (!covers(ROOM)) { g.fillStyle = '#0E0905'; g.fillRect(0, 0, CH.width, CH.height); } worldT(g); if (view.table === 'full') blitRing(g, bakeRoom(), ROOM, TABLE); }
      worldT(g); const T = bakeTable(); blitRegion(g, T, T.x0, T.y0, T.x0 + T.w, T.y0 + T.h);
      if (view.table === 'full' && roomShows) { screenT(g); const vg = g.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.35, cw / 2, ch / 2, Math.hypot(cw, ch) * 0.6); vg.addColorStop(0, 'rgba(14,9,5,0)'); vg.addColorStop(1, 'rgba(14,9,5,.5)'); g.fillStyle = vg; g.save(); g.beginPath(); g.rect(0, 0, cw, ch); const [a, b] = toScreen(MODEL_BOX[0], MODEL_BOX[1]), [c, d] = toScreen(MODEL_BOX[2], MODEL_BOX[3]); g.rect(a, b, c - a, d - b); g.clip('evenodd'); g.fillRect(0, 0, cw, ch); g.restore(); }
      worldT(g); const RM = rlRim(); blitRegion(g, RM, RM.x0, RM.y0, RM.x0 + RM.w, RM.y0 + RM.h); g.setTransform(1, 0, 0, 1, 0, 0); }
    gU.drawImage(CH, 0, 0);
    worldT(gU); gU.save(); modelPath(gU); gU.clip(); gU.imageSmoothingQuality = 'low'; gU.drawImage(OV, 0, 0, W, H); gU.restore();
    worldT(gO); gO.save(); modelPath(gO); gO.clip(); for (const i of owned) rlDrawRails(gO, 'far', px, { only: i }); gO.restore(); rlDrawWildContours(gO, px); rlDrawLip(gO, px);
    screenT(gO); if (!OPS) { OPS = []; for (const c of [redCap, greenCap]) { const [x, y] = toScreen(...cent[c]); OPS.push([names[c], x, y]); } }
    for (const [t, x, y] of OPS) rlLabel(gO, t, x, y, "700 12px 'Alegreya Sans', sans-serif", true);
    gO.setTransform(1, 0, 0, 1, 0, 0); gU.setTransform(1, 0, 0, 1, 0, 0);
  };
  const orig = rlRenderStatic; rlRenderStatic = (gU, gO) => lean(gU, gO);
  try { const A = []; for (let j = 0; j < 8; j++) { RCK = null; const t = performance.now(); draw(); ctx.getImageData(0, 0, 1, 1); A.push(performance.now() - t); } res.firstWithChromeMs = +A[0].toFixed(1); res.leanStaticFlushMsChromeCached = med(A.slice(1)); res.all = A.map((x) => +x.toFixed(1)); }
  finally { rlRenderStatic = orig; RCK = null; draw(); }
  return JSON.stringify(res);
})()
