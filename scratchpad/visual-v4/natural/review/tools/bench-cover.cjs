// Review: CPU cost of the cover raster alone (what the N4 test and the GPU colour pass read): per texel the canopy edge noise (fBm 3 octaves),
// glade and copse noise (fBm 2 to 3 octaves) and the field parcel geometry (rotation by exact constants, rows, parcels, a hash), at 2048 x 1280.
const BW = 2048, BH = 1280;
const T = new Float32Array(65536); let s = 12345; for (let k = 0; k < 65536; k++) { s = (s * 1103515245 + 12345) >>> 0; T[k] = (s / 4294967296) * 2 - 1; }
const vn = (x, y) => { const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy), x0 = ix & 255, x1 = (ix + 1) & 255, y0 = (iy & 255) << 8, y1 = ((iy + 1) & 255) << 8; const a = T[y0 | x0], b = T[y0 | x1], c = T[y1 | x0], d = T[y1 | x1]; return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy; };
const fbm = (x, y, o) => { let v = 0, a = 1, f = 1, n = 0; for (let k = 0; k < o; k++) { v += a * vn(x * f + k * 37.31, y * f + k * 91.17); n += a; a *= 0.5; f *= 2.03; } return v / n; };
const h32 = (x, y, salt) => { let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(salt, 2246822519)) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; return (h ^ (h >>> 16)) >>> 0; };
const C30 = Math.sqrt(3) / 2;
for (let r = 0; r < 3; r++) { const t0 = process.hrtime.bigint(); const out = new Uint8Array(BW * BH); let acc = 0;
  for (let ty = 0, k = 0; ty < BH; ty++) for (let tx = 0; tx < BW; tx++, k++) { const U = (tx + 0.5) / 2.49, V = (ty + 0.5) / 2.49;
    const e = fbm(U / 10, V / 10, 3), gl = fbm(U / 9, V / 9, 2), cp = fbm(U / 15, V / 15, 3);
    const ca = (k & 3) === 0 ? 1 : (k & 3) === 1 ? 0 : C30, sa = (k & 3) === 0 ? 0 : (k & 3) === 1 ? 1 : 0.5;
    let pu = U * ca + V * sa, pv = -U * sa + V * ca; pv += 1.6 * vn(pu / 28 + 90, pv / 28) + 2.5 * vn(pu / 9 + 17, pv / 61);
    const row = Math.floor(pv / 8.5), hr = h32(row, 3, 41) / 4294967296, L = 13 + 19 * hr, col = Math.floor(pu / L), bid = h32(row, col, 47);
    out[k] = (e > 0.1 ? 2 : 0) + (gl < -0.6 ? 1 : 0) + (cp > 0.8 ? 3 : 0) + (bid & 1); acc += out[k]; }
  console.log('cover classes', r + 1, (Number(process.hrtime.bigint() - t0) / 1e6).toFixed(0), 'ms'); }
