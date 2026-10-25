// Pass 4 prototype: the cost of a season variant derived per texel from the natural bake and its cover classes (a timing probe, not the look):
// winter = frost toward a grey-blue on hills and mountains where the half-resolution hillshade faces away from the light, deciduous canopy lifted toward
// grey-brown, fields toward ploughed; then the two mips by canvas downscale. Nothing on screen changes.
(() => {
  const Lk = RB.L.natural, src = Lk.img.data, n = src.length / 4, BW = RB.BW, { cls, ftone } = RB.nat, fS = RB.fS, HW = RB.HW;
  const t0 = performance.now(), out = new ImageData(Lk.img.width, Lk.img.height), d = out.data;
  const frost = [157, 163, 168], bark = [92, 84, 72], plough = [120, 98, 70]; let nf = 0;
  for (let k = 0; k < n; k++) {
    const o = k * 4, c = cls[k]; let r = src[o], g = src[o + 1], b = src[o + 2], a = 0, T = null;
    if (c === 3 || c === 4) { const x = k % BW, y = (k / BW) | 0, s = fS ? fS[(y >> 1) * HW + (x >> 1)] : 0; if (s < -0.1) { a = Math.min(0.55, (-0.1 - s) * (c === 4 ? 1.6 : 0.9)); T = frost; nf++; } }
    else if (c === 2 || c === 9) { a = 0.18; T = bark; } else if (c === 1 && ftone[k] !== 4) { a = 0.35; T = plough; }
    if (T) { r += (T[0] - r) * a; g += (T[1] - g) * a; b += (T[2] - b) * a; }
    d[o] = r; d[o + 1] = g; d[o + 2] = b; d[o + 3] = src[o + 3];
  }
  const t1 = performance.now(), cv = makeCanvas(out.width, out.height); cv.getContext('2d').putImageData(out, 0, 0);
  const m1 = makeCanvas(out.width >> 1, out.height >> 1), m2 = makeCanvas(out.width >> 2, out.height >> 2); m1.getContext('2d').drawImage(cv, 0, 0, m1.width, m1.height); m2.getContext('2d').drawImage(m1, 0, 0, m2.width, m2.height); m2.getContext('2d').getImageData(0, 0, 1, 1);
  const t2 = performance.now();
  return JSON.stringify({ texels: n, texelPassMs: +(t1 - t0).toFixed(1), canvasAndMipsMs: +(t2 - t1).toFixed(1), totalMs: +(t2 - t0).toFixed(1), frostTexelShare: +(nf / n).toFixed(4), haveFS: !!fS });
})()
