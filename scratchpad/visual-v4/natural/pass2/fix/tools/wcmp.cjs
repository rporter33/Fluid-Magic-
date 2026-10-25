// at the reference zoom: for the wild-edge samples on Greyteeth/Fenvale, the rendered W and G against the bake at the same world points
const { launch, open, ev, mev, PAGE } = require('./lib.cjs');
const SRC = String.raw`(() => { const d = rlRedraw(['pieces', 'labels', 'badges', 'arrows']), W2 = canvas.width, out = [], Lk = RB.L.natural.img.data, { BW, TX } = RB;
  const px = (sx, sy) => { const X = Math.floor(sx * dpr), Y = Math.floor(sy * dpr), k = (Y * W2 + X) * 4; return [d[k], d[k + 1], d[k + 2]]; };
  const bk = (wx, wy) => { const k = (Math.floor(wy * TX) * BW + Math.floor(wx * TX)) * 4; return [Lk[k], Lk[k + 1], Lk[k + 2]]; };
  const L = (c) => rgb2lab(c).map((v) => +v.toFixed(0)).join('/');
  for (const w of WILDS) for (const e of rlWildOutline(w)) { if (names[e.j] !== 'Fenvale') continue; const [ax, ay] = toScreen(...e.a), [bx, by] = toScreen(...e.b), Lg = Math.hypot(bx - ax, by - ay); if (Lg < 12) continue; let nx = -(by - ay) / Lg, ny = (bx - ax) / Lg;
    const [mx, my] = [(ax + bx) / 2, (ay + by) / 2]; if (provinceAt(...toWorld(mx + nx * 8, my + ny * 8)) !== e.j) { nx = -nx; ny = -ny; }
    for (let s = 6; s < Lg - 6; s += 24) { const sx = ax + ((bx - ax) * s) / Lg, sy = ay + ((by - ay) * s) / Lg; out.push({ s, Wr: L(px(sx - nx * 7.5, sy - ny * 7.5)), Wb: L(bk(...toWorld(sx - nx * 7.5, sy - ny * 7.5))), Gr: L(px(sx + nx * 7.5, sy + ny * 7.5)), Gb: L(bk(...toWorld(sx + nx * 7.5, sy + ny * 7.5))) }); } }
  return out; })()`;
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }, p = await open(b, PAGE, { log, settle: 800 }); await p.mouse.move(720, 894); await ev(p, 'm.zoomTo(1.142, "Ashmoor")'); await p.waitForTimeout(1200); const r = await mev(p, SRC); for (const q of r) console.log(JSON.stringify(q)); await b.close(); })();
