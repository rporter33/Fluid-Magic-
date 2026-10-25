// Where the Lean-back static time goes, inside rlRenderCache at the least zoom: the same pass as leanreal.js with one layer group switched on at a time
(() => {
  const med = (a) => { const q = [...a].sort((x, y) => x - y); return +q[q.length >> 1].toFixed(1); };
  layout(); const v = viewRect(), s = minScale, [kx, ky] = cent[redCap]; cam.s = s; cam.x = (v.l + v.r) / 2 - kx * s; cam.y = (v.t + v.b) / 2 - ky * s; clampCam(); RCK = null; draw();
  const Lk = RB.L.natural, m2 = Lk.mip2, OW = m2.width, OH = m2.height, k = OW / W, OV = makeCanvas(OW, OH), og = OV.getContext('2d'); og.drawImage(m2, 0, 0);
  const owned = provList.filter((i) => prov[i].owner);
  const parts = {
    clear: (gU, gO) => {},
    room: (g) => { const covers = (r) => r[0] <= VW[0] && r[1] <= VW[1] && r[2] >= VW[2] && r[3] >= VW[3]; if (!covers(TABLE)) { if (!covers(ROOM)) { g.fillStyle = '#0E0905'; g.fillRect(0, 0, g.canvas.width, g.canvas.height); } worldT(g); if (view.table === 'full') blitRing(g, bakeRoom(), ROOM, TABLE); } },
    vignette: (g) => { screenT(g); const vg = g.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.35, cw / 2, ch / 2, Math.hypot(cw, ch) * 0.6); vg.addColorStop(0, 'rgba(14,9,5,0)'); vg.addColorStop(1, 'rgba(14,9,5,.5)'); g.fillStyle = vg; g.save(); g.beginPath(); g.rect(0, 0, cw, ch); const [a, b] = toScreen(MODEL_BOX[0], MODEL_BOX[1]), [c, d] = toScreen(MODEL_BOX[2], MODEL_BOX[3]); g.rect(a, b, c - a, d - b); g.clip('evenodd'); g.fillRect(0, 0, cw, ch); g.restore(); },
    table: (g) => { worldT(g); const T = bakeTable(); blitRegion(g, T, T.x0, T.y0, T.x0 + T.w, T.y0 + T.h); },
    rim: (g) => { worldT(g); const RM = rlRim(); blitRegion(g, RM, RM.x0, RM.y0, RM.x0 + RM.w, RM.y0 + RM.h); },
    overview: (g) => { worldT(g); g.save(); modelPath(g); g.clip(); g.imageSmoothingQuality = 'low'; g.drawImage(OV, 0, 0, W, H); g.restore(); },
    rails: (g, gO) => { worldT(gO); gO.save(); modelPath(gO); gO.clip(); for (const i of owned) rlDrawRails(gO, 'far', 1 / cam.s, { only: i }); gO.restore(); },
    contours: (g, gO) => { worldT(gO); rlDrawWildContours(gO, 1 / cam.s); rlDrawLip(gO, 1 / cam.s); },
  };
  const out = { dpx: +(cam.s * MED_DIAM).toFixed(1), cache: [rlU.width, rlU.height] }, orig = rlRenderStatic;
  try {
    for (const [name, f] of Object.entries(parts)) {
      rlRenderStatic = (gU, gO) => { gU.setTransform(1, 0, 0, 1, 0, 0); gO.setTransform(1, 0, 0, 1, 0, 0); gO.clearRect(0, 0, gO.canvas.width, gO.canvas.height); f(gU, gO); gO.setTransform(1, 0, 0, 1, 0, 0); gU.setTransform(1, 0, 0, 1, 0, 0); };
      const a = []; for (let j = 0; j < 6; j++) { RCK = null; const t = performance.now(); draw(); ctx.getImageData(0, 0, 1, 1); a.push(performance.now() - t); } out[name] = med(a);
    }
  } finally { rlRenderStatic = orig; RCK = null; draw(); }
  return JSON.stringify(out);
})()
