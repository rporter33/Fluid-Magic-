// per outline edge of a wild, the distance to its landform (raster, every 0.01 D): node footedges.cjs <pagefile> <wild index>
const { launch, open, ev, mev } = require('./lib.cjs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, process.argv[2], { log, settle: 300 });
  const r = await mev(p, `(() => { const w = WILDS[${process.argv[3] || 2}], B = RB.ms.boxOf.get(w.cells[0]), FT = RB.TX * RL_MS.F, D = MED_DIAM, mine = new Set(w.cells), lfAt = (x, y) => (mine.has(provinceAt(x, y)) ? rlBilin(B.rk8, B.nw, B.nh, x * FT - B.X0, y * FT - B.Y0) / 255 : 0), out = [];
    for (const e of rlWildOutline(w)) { if (e.j < 0 || isWild(e.j)) continue; const [ax, ay] = e.a, [bx, by] = e.b, Lg = Math.hypot(bx - ax, by - ay); let nx = -(by - ay) / Lg, ny = (bx - ax) / Lg; if (provinceAt((ax + bx) / 2 + nx * 2, (ay + by) / 2 + ny * 2) !== e.j) { nx = -nx; ny = -ny; } const ds = [];
      for (let t = 0.01 * D; t < Lg - 0.01 * D; t += 0.01 * D) { const sx = ax + ((bx - ax) * t) / Lg, sy = ay + ((by - ay) * t) / Lg; if (provinceAt(sx - nx, sy - ny) !== e.c) continue; let dd = 0.2; for (let o = 0.0025 * D; o <= 0.2 * D; o += 0.0025 * D) { const qx = sx - nx * o, qy = sy - ny * o; if (!mine.has(provinceAt(qx, qy))) break; if (lfAt(qx, qy) >= 0.5) { dd = o / D; break; } } ds.push(+dd.toFixed(3)); }
      out.push({ j: names[e.j], L: +(Lg / D).toFixed(2), n: ds.length, prof: ds.join(' ') }); }
    return { shifts: B.insetShift, out }; })()`);
  console.log(JSON.stringify(r.shifts)); for (const o of r.out) console.log(o.j, o.L, o.n, o.prof); await b.close(); })();
