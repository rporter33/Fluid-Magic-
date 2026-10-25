// Seeded 2D Perlin (gradient) noise, about -0.7..0.7. Same output on every machine for the same seed.
import { rng } from './harness.js';
export function perlin(seed) {
  const R = rng(seed), perm = new Uint8Array(512), base = new Uint8Array(256);
  for (let i = 0; i < 256; i++) base[i] = i;
  for (let i = 255; i > 0; i--) { const j = Math.floor(R() * (i + 1)); const t = base[i]; base[i] = base[j]; base[j] = t; }
  for (let i = 0; i < 512; i++) perm[i] = base[i & 255];
  const GX = new Float32Array(8), GY = new Float32Array(8);
  for (let i = 0; i < 8; i++) { GX[i] = Math.cos((i * Math.PI) / 4); GY[i] = Math.sin((i * Math.PI) / 4); }
  return function (x, y) {
    const xf0 = Math.floor(x), yf0 = Math.floor(y), xf = x - xf0, yf = y - yf0, X = xf0 & 255, Y = yf0 & 255;
    const aa = perm[perm[X] + Y] & 7, ab = perm[perm[X] + Y + 1] & 7, ba = perm[perm[X + 1] + Y] & 7, bb = perm[perm[X + 1] + Y + 1] & 7;
    const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10), v = yf * yf * yf * (yf * (yf * 6 - 15) + 10);
    const n00 = GX[aa] * xf + GY[aa] * yf, n10 = GX[ba] * (xf - 1) + GY[ba] * yf, n01 = GX[ab] * xf + GY[ab] * (yf - 1), n11 = GX[bb] * (xf - 1) + GY[bb] * (yf - 1);
    const nx0 = n00 + u * (n10 - n00), nx1 = n01 + u * (n11 - n01);
    return nx0 + v * (nx1 - nx0);
  };
}
