// the wild-edge check's failing samples at a view: rendered W / G medians against the bake (with the land's state) at the same world points, and the rim decision there
const { launch, open, ev, mev, PAGE } = require('./lib.cjs');
const SRC = String.raw`(() => { const d = rlRedraw(['pieces', 'labels', 'badges', 'arrows']), W2 = canvas.width, H2 = canvas.height, v = viewRect(), Lk = RB.L.natural.img.data, { BW, TX, id } = RB, out = [];
  const px = (sx, sy) => { const X = Math.floor(sx * dpr), Y = Math.floor(sy * dpr); if (X < 0 || Y < 0 || X >= W2 || Y >= H2) return null; const k = (Y * W2 + X) * 4; return [d[k], d[k + 1], d[k + 2]]; };
  const bk = (sx, sy) => { const [wx, wy] = toWorld(sx, sy), kk = Math.floor(wy * TX) * BW + Math.floor(wx * TX), k = kk * 4, i = id[kk]; const c = [Lk[k], Lk[k + 1], Lk[k + 2]]; return i === 255 || isWild(i) ? c : rlApplyState(c, rlStateOf(i, 'natural', false)); };
  const med = (a) => { const s2 = a.filter(Boolean).sort((p, q) => rlL(...p) - rlL(...q)); return s2[s2.length >> 1]; }, L = (c) => c ? rgb2lab(c).map((q) => +q.toFixed(0)).join('/') : '-';
  for (const w of WILDS) for (const e of rlWildOutline(w)) {
    const [ax, ay] = toScreen(...e.a), [bx, by] = toScreen(...e.b), Lg = Math.hypot(bx - ax, by - ay); if (Lg < 12) continue; let nx = -(by - ay) / Lg, ny = (bx - ax) / Lg;
    const [mx, my] = [(ax + bx) / 2, (ay + by) / 2]; if (provinceAt(...toWorld(mx + nx * 8, my + ny * 8)) !== e.j) { nx = -nx; ny = -ny; }
    const E = RL_WRIM.map && RL_WRIM.map.get(e.c + ':' + e.j), runs = E ? rlWildRimRuns(E, cam.s) : null;
    for (let s = 6; s < Lg - 6; s += 4) { const sx = ax + ((bx - ax) * s) / Lg, sy = ay + ((by - ay) * s) / Lg; if (sx < v.l + 12 || sx > v.r - 12 || sy < v.t + 12 || sy > v.b - 12) continue;
      if (!inModel(...toWorld(sx + nx * 10, sy + ny * 10)) || provinceAt(...toWorld(sx + nx * 8, sy + ny * 8)) !== e.j) continue;
      const Wg = med([6, 7, 8, 9].map((o) => px(sx - nx * o, sy - ny * o))), G = med([6, 7, 8, 9, 9.5].map((o) => px(sx + nx * o, sy + ny * o))), q = rlPairDE(Wg, G); if (q.normal >= 20 && q.cvd >= 12) continue;
      const Wb = med([6, 7, 8, 9].map((o) => bk(sx - nx * o, sy - ny * o))), Gb = med([6, 7, 8, 9, 9.5].map((o) => bk(sx + nx * o, sy + ny * o))), qb = rlPairDE(Wb, Gb), t = s / Lg;
      out.push({ e: w.name + '/' + names[e.j], t: +t.toFixed(3), W: L(Wg), G: L(G), n: +q.normal.toFixed(1), c: +q.cvd.toFixed(1), Wb: L(Wb), Gb: L(Gb), nb: +qb.normal.toFixed(1), cb: +qb.cvd.toFixed(1), rimHere: runs ? runs.some(([p, r]) => t >= p && t <= r) : 'all', runs }); } }
  return out; })()`;
const view = process.argv[2] || 'm.zoomTo(1.142, "Ashmoor")';
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }, p = await open(b, PAGE, { log, settle: 800 }); await p.mouse.move(720, 894); await ev(p, view); await p.waitForTimeout(1200); const r = await mev(p, SRC); console.log(r.length, 'samples under 20/12 directly'); for (const q of r.filter((x) => x.rimHere !== true)) console.log(JSON.stringify(q)); await b.close(); })();
