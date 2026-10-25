// A CPU cost estimate of the natural material pass in JS (V8, as in the mockup's main-thread bake): per texel of a 2048 x 1280 bake,
// the noise lookups and cell searches natural.py spends, with each terrain's work done only where its cover weight is above 0.02.
// The weights come from the exported cover raster so the work per texel matches the real map. Shared machine: timings are noisy.
const fs = require('fs');
const D = __dirname + '/../proto/data/';
const BW = 2048, BH = 1280;
const cover = new Uint8Array(fs.readFileSync(D + 'cover.bin'));
const T = new Float32Array(65536); let s = 12345; for (let k = 0; k < 65536; k++) { s = (s * 1103515245 + 12345) >>> 0; T[k] = (s / 4294967296) * 2 - 1; }
const vn = (x, y) => { const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy), x0 = ix & 255, x1 = (ix + 1) & 255, y0 = (iy & 255) << 8, y1 = ((iy + 1) & 255) << 8; const a = T[y0 | x0], b = T[y0 | x1], c = T[y1 | x0], d = T[y1 | x1]; return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy; };
const fbm = (x, y, o) => { let v = 0, a = 1, f = 1, n = 0; for (let k = 0; k < o; k++) { v += a * vn(x * f + k * 37.31, y * f + k * 91.17); n += a; a *= 0.5; f *= 2.03; } return v / n; };
const h32 = (x, y, salt) => { let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(salt, 2246822519)) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; return (h ^ (h >>> 16)) >>> 0; };
const cells = (u, v, salt) => { const iu = Math.floor(u), iv = Math.floor(v); let b = 9, b2 = 9; for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) { const h = h32(iu + ox, iv + oy, salt), du = u - (iu + ox + (h & 1023) / 1023), dv = v - (iv + oy + ((h >>> 10) & 1023) / 1023), dd = du * du + dv * dv; if (dd < b) { b2 = b; b = dd; } else if (dd < b2) b2 = dd; } return Math.sqrt(b2) - Math.sqrt(b); };
function pass() {
  const out = new Float32Array(BW * BH * 3); let acc = 0;
  for (let ty = 0, k = 0; ty < BH; ty++) for (let tx = 0; tx < BW; tx++, k++) {
    const c = cover[k]; if (c === 255) continue; const U = (tx + 0.5) / 2.49, V = (ty + 0.5) / 2.49;
    let L = 40 + 2.2 * fbm(U / 26, V / 26, 3);                 // the ground and its broad mottle (all land)
    L += fbm(U / 10, V / 10, 3);                              // the forest edge noise (all land, it decides the canopy)
    if (c === 0 || c === 3) L += vn(U / 14, V / 3.2) + fbm(U / 11, V / 11, 2) + fbm(U / 18, V / 18, 2) + fbm(U / 15, V / 15, 3); // grass, copses
    if (c === 3) L += fbm(U / 9, V / 9, 3) + vn(U / 1.6, V / 1.6);
    if (c === 4) L += fbm(U / 5, V / 5, 2) + fbm(U / 3.5, V / 3.5, 3);
    if (c === 5) L += fbm(U / 9, V / 9, 3) + vn(U / 0.9, V / 4.5) + fbm(U / 12, V / 12, 2) + vn(U / 1.3, V / 1.3);
    if (c === 6) L += cells(U / 6, V / 6, 11) + vn(U / 7, V / 7) + fbm(U / 16, V / 16, 2) + fbm(U / 8, V / 3, 2) + vn(U / 1.4, V / 1.4);
    if (c === 1) L += cells(U / 11, V / 7.5, 23) + vn(U / 3, V / 3) + vn(U / 6, V / 6) + vn(U / 28, V / 28) + vn(U / 9, V / 61) + Math.sin(V * 5);
    if (c === 2) L += cells(U / 2.3, V / 2.3, 37) + fbm(U / 22, V / 22, 2) + fbm(U / 30, V / 30, 2) + fbm(U / 9, V / 9, 2);
    out[k * 3] = L; acc += L;
  }
  return acc;
}
for (let r = 0; r < 3; r++) { const t0 = process.hrtime.bigint(); pass(); console.log('natural material pass, run', r + 1, Number(process.hrtime.bigint() - t0) / 1e6, 'ms'); }
