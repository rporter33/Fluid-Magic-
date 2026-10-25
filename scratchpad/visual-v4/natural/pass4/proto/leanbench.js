// Pass 4 prototype: the cost of a cheap Lean-back static pass against the current static re-render, at the least zoom, on whatever map is loaded.
// Draws into an offscreen canvas of the view's size: table and rim (cached bakes), the natural bake's quarter mip as the overview, one wash canvas
// (realm banners at 0.28, made once), the realm rails only (rlDrawRails with opts.only), and about one name per region. Read-only; nothing on screen changes.
(() => {
  const v = viewRect(), s = minScale, [kx, ky] = cent[redCap]; cam.s = s; cam.x = (v.l + v.r) / 2 - kx * s; cam.y = (v.t + v.b) / 2 - ky * s; clampCam(); RCK = null; draw();
  const Lk = RB.L.natural, ov = Lk.mip2, OW = ov.width, OH = ov.height, k = OW / W;
  const T0 = performance.now(), wash = makeCanvas(OW, OH), wg = wash.getContext('2d');
  for (const p of provs) { if (!p.owner) continue; wg.beginPath(); cells[p.i].forEach(([x, y], j) => (j ? wg.lineTo(x * k, y * k) : wg.moveTo(x * k, y * k))); wg.closePath(); wg.fillStyle = rgba(BAN[p.owner], 0.28); wg.fill(); }
  const washMs = performance.now() - T0;
  const cv = makeCanvas(Math.round(cw * dpr), Math.round(ch * dpr)), g = cv.getContext('2d'), px = 1 / cam.s;
  const nReg = Math.max(2, Math.round(provList.length / 7)), owned = provList.filter((i) => prov[i].owner);
  const run = () => {
    const t = performance.now(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#0E0905'; g.fillRect(0, 0, cv.width, cv.height);
    worldT(g); const T = bakeTable(); blitRegion(g, T, T.x0, T.y0, T.x0 + T.w, T.y0 + T.h); const RM = rlRim(); blitRegion(g, RM, RM.x0, RM.y0, RM.x0 + RM.w, RM.y0 + RM.h);
    g.save(); modelPath(g); g.clip(); g.imageSmoothingQuality = 'low'; g.drawImage(ov, 0, 0, W, H); g.drawImage(wash, 0, 0, W, H); for (const i of owned) rlDrawRails(g, 'far', px, { only: i }); g.restore();
    rlDrawWildContours(g, px);
    screenT(g); g.font = "500 15px 'Marcellus SC', serif"; g.textAlign = 'center'; g.lineWidth = 3; g.strokeStyle = 'rgba(20,18,15,.5)'; g.fillStyle = '#E9E4D8';
    for (let r = 0; r < nReg; r++) { const i = provList[(r * 7) % provList.length], [x, y] = toScreen(...cent[i]); g.strokeText('THE REGION ' + r, x, y); g.fillText('THE REGION ' + r, x, y); }
    g.getImageData(0, 0, 1, 1); return performance.now() - t;
  };
  const lean = []; for (let j = 0; j < 6; j++) lean.push(run());
  const full = []; for (let j = 0; j < 4; j++) { RCK = null; const t = performance.now(); draw(); ctx.getImageData(0, 0, 1, 1); full.push(performance.now() - t); }
  const med = (a) => { const q = [...a].sort((x, y) => x - y); return +q[q.length >> 1].toFixed(1); };
  return JSON.stringify({ provinces: provList.length, dpx: +(cam.s * MED_DIAM).toFixed(1), overview: [OW, OH], washBuildMs: +washMs.toFixed(1), leanStaticMs: med(lean), leanAll: lean.map((x) => +x.toFixed(1)), currentStaticMs: med(full), currentAll: full.map((x) => +x.toFixed(1)), regions: nReg, ownedRails: owned.length });
})()
