// dumps rendered pixels with geometry for an independent colour check (computed in colors.ts with the repo's colorMath.ts)
const { launch, open, PAGE } = require('./vlib.cjs'); const fs = require('fs');
const IN_PAGE = String.raw`(() => {
  const OUT = {};
  const redraw = (skip) => { const was = new Set(SKIP); for (const k of skip) SKIP.add(k); RCK = null; draw(); const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data.slice(); SKIP.clear(); for (const k of was) SKIP.add(k); RCK = null; draw(); return d; };
  const W2 = canvas.width, H2 = canvas.height, px = (d, sx, sy) => { const X = Math.floor(sx * dpr), Y = Math.floor(sy * dpr); if (X < 0 || Y < 0 || X >= W2 || Y >= H2) return null; const k = (Y * W2 + X) * 4; return [d[k], d[k + 1], d[k + 2]]; };
  const ui = (sx, sy) => { const r = canvas.getBoundingClientRect(); const e = document.elementFromPoint(r.left + sx, r.top + sy); return !(e === canvas || (e && e.closest && e.closest('.mini'))); }; // under a panel
  const info = (i) => ({ i, name: names[i], terrain: terr[i], fog: fogOf(i) || '', owner: prov[i].owner || '', domN: prov[i].dom ? prov[i].dom.n || '' : '', domS: prov[i].dom ? prov[i].dom.s || 0 : 0, wild: !!isWild(i) });
  // 1. province cores (rails, pieces, labels, badges, arrows off), water excluded by its geometry
  const land = redraw(['rails', 'pieces', 'labels', 'badges', 'arrows']);
  const wm = makeCanvas(W2, H2), wg = wm.getContext('2d', { willReadFrequently: true }); worldT(wg); wg.fillStyle = '#fff'; wg.strokeStyle = '#fff'; wg.lineCap = 'round';
  for (const L of [...RB.water.lakes, ...RB.water.ponds]) { wg.beginPath(); L.P.forEach(([x, y], k) => (k ? wg.lineTo(x, y) : wg.moveTo(x, y))); wg.closePath(); wg.fill(); wg.lineWidth = 8 * RLK + 8 / cam.s; wg.stroke(); }
  for (const s of RB.water.streams) { wg.lineWidth = 2 * (s.w1 + 4 * RLK) + 8 / cam.s; wg.beginPath(); s.pts.forEach(([x, y], k) => (k ? wg.lineTo(x, y) : wg.moveTo(x, y))); wg.stroke(); }
  const wd = wg.getImageData(0, 0, W2, H2).data;
  const full = new Set(provList.filter((i) => { const b = geo(i).bb, [a0, b0] = toScreen(b[0], b[1]), [a1, b1] = toScreen(b[2], b[3]); return a0 >= 0 && b0 >= 0 && a1 <= cw && b1 <= ch; }));
  const P = new Map(); const step = Math.max(1, Math.round(dpr));
  for (let Y = 0; Y < H2; Y += step) for (let X = 0; X < W2; X += step) {
    const k4 = (Y * W2 + X) * 4; if (wd[k4 + 3] > 0) continue; const [x, y] = toWorld((X + 0.5) / dpr, (Y + 0.5) / dpr); if (!inModel(x, y)) continue;
    const i = provinceAt(x, y); if (i == null || i < 0 || isWild(i) || !full.has(i)) continue; if (!d3.polygonContains(cells[i], [x, y])) continue;
    const de = distToEdge(cells[i], x, y) / RLD; if (de < 0.06) continue;
    let q = P.get(i); if (!q) P.set(i, (q = { ...info(i), inner: [], outer: [] }));
    (de >= 0.12 ? q.inner : q.outer).push(land[k4], land[k4 + 1], land[k4 + 2]);
  }
  OUT.cores = [...P.values()];
  { const { BW, TX, id, pure } = RB, edgeK = 0.06 * RLD, Q = new Map();
    for (let Y = 0; Y < H2; Y++) for (let X = 0; X < W2; X++) { const k4 = (Y * W2 + X) * 4; if (wd[k4 + 3] > 0) continue; const [x, y] = toWorld((X + 0.5) / dpr, (Y + 0.5) / dpr); if (!inModel(x, y)) continue; const t = Math.floor(y * TX) * BW + Math.floor(x * TX), i = id[t]; if (i === 255 || isWild(i) || !pure[t] || !full.has(i)) continue; if (distToEdge(cells[i], x, y) < edgeK) continue; let q = Q.get(i); if (!q) Q.set(i, (q = { ...info(i), px: [] })); q.px.push(land[k4], land[k4 + 1], land[k4 + 2]); }
    OUT.pureCores = [...Q.values()]; }
  // 2. all land pixels by terrain (unique colours with counts), for the snow and chroma checks
  const U = {}; const edgeBand = 6 / cam.s; for (let Y = 0; Y < H2; Y += step) for (let X = 0; X < W2; X += step) { const k4 = (Y * W2 + X) * 4; if (wd[k4 + 3] > 0) continue; const [x, y] = toWorld((X + 0.5) / dpr, (Y + 0.5) / dpr); if (!inModel(x, y) || !inModel(x - edgeBand, y - edgeBand) || !inModel(x + edgeBand, y + edgeBand) || !inModel(x - edgeBand, y + edgeBand) || !inModel(x + edgeBand, y - edgeBand)) continue; const i = provinceAt(x, y); if (i == null || i < 0) continue; const t = isWild(i) ? 'wild:' + (wildOf[i] && wildOf[i].kind || 'w') : terr[i]; const key = (land[k4] << 16) | (land[k4 + 1] << 8) | land[k4 + 2]; const m = (U[t] ??= {}); m[key] = (m[key] || 0) + 1; }
  OUT.landColours = U;
  // 3. edge profiles with the rails on (pieces, labels, badges, arrows off)
  const lines = redraw(['pieces', 'labels', 'badges', 'arrows']); const E = [];
  for (const [, e] of EDGE) {
    const i = e.i, j = e.j; if (isWild(i) || isWild(j)) continue; const oi = prov[i].owner, oj = prov[j].owner;
    const [ax, ay] = e.a, [bx, by] = e.b, L = Math.hypot(bx - ax, by - ay) || 1; let nx = -(by - ay) / L, ny = (bx - ax) / L; if (nx + ny < 0) { nx = -nx; ny = -ny; }
    const lr = (cent[j][0] - ax) * nx + (cent[j][1] - ay) * ny > 0 ? j : i, ul = lr === i ? j : i;
    const type = oi && oj && oi !== oj ? 'realm2' : (oi && !oj) || (!oi && oj) ? 'realm1' : oi && oi === oj ? 'internal' : 'neutral';
    if (L * cam.s < 30) continue;
    for (const t of [0.3, 0.5, 0.7]) {
      const wx = ax + (bx - ax) * t, wy = ay + (by - ay) * t, [sx, sy] = toScreen(wx, wy); if (sx < 12 || sy < 12 || sx > cw - 12 || sy > ch - 12) continue;
      let blocked = false; const prof = [], lprof = []; for (let o = -12; o <= 12; o += 0.5) { const qx = sx + nx * o, qy = sy + ny * o; if (ui(qx, qy)) blocked = true; prof.push(px(lines, qx, qy)); lprof.push(px(land, qx, qy)); }
      if (blocked || prof.some((q) => !q)) continue;
      const gw = (o) => toWorld(sx + nx * o, sy + ny * o), inP = (o, k) => provinceAt(...gw(o)) === k;
      E.push({ type, i, j, lr, ul, lrT: terr[lr], ulT: terr[ul], owners: [prov[lr].owner || '', prov[ul].owner || ''], fog: !!(fogOf(i) && fogOf(j)), fogLr: fogOf(lr) || '', fogUl: fogOf(ul) || '', okSides: inP(10, lr) && inP(-10, ul), prof, lprof, landLr: px(land, sx + nx * 1, sy + ny * 1), landUl: px(land, sx - nx * 1, sy - ny * 1) });
    }
  }
  OUT.edges = E;
  // 4. hamlets, huts and towns: pixels that the pieces layer changed, against the same pixel without it
  const on = redraw(['rails', 'labels', 'badges', 'arrows']), off = redraw(['rails', 'labels', 'badges', 'arrows', 'pieces']);
  const L = RL_PIECE_CACHE.get('L'), k = cam.s / L.s, S = [];
  for (const [i, st] of L.seats) {
    if (!st.kind || st.kind === 'none') continue; const cx = st.x * k + cam.x, cy = st.y * k + cam.y, R = (st.r || st.T || 10) * k * 1.3 + 6;
    const pairs = []; for (let y = cy - R * 1.4; y <= cy + R * 0.7; y += 1 / dpr) for (let x = cx - R; x <= cx + R; x += 1 / dpr) { if (ui(x, y)) continue; const a = px(on, x, y), b = px(off, x, y); if (!a || !b) continue; if (a[0] !== b[0] || a[1] !== b[1] || a[2] !== b[2]) pairs.push(a[0], a[1], a[2], b[0], b[1], b[2]); }
    S.push({ ...info(i), kind: st.kind, T: +(st.T * k).toFixed(1), n: pairs.length / 6, pairs });
  }
  OUT.seats = S; OUT.Dpx = L.Dpx * k; OUT.band = bandOf(cam.s); OUT.scale = cam.s; OUT.dpr = dpr; OUT.mode = state.mode; OUT.month = typeof month !== 'undefined' ? month : null;
  // 5. the south face: columns down from the model's edge
  const full2 = redraw([]); const [x0s, yE] = toScreen(0, H), [x1s] = toScreen(W, H), cols = [];
  for (let f = 0.12; f <= 0.88; f += 0.02) { const x = x0s + (x1s - x0s) * f; const col = []; for (let o = -10; o <= RL_FACE * cam.s + 40; o += 1) col.push(px(full2, x, yE + o)); if (!col.some((q) => !q)) cols.push(col); }
  OUT.face = { cols, faceShownPx: RL_FACE * cam.s, plinthPx: RL_PLINTH * cam.s, edgeY: yE };
  return OUT;
})()`;
(async () => {
  const b = await launch(), errors = [];
  const FILE = process.argv[2] || PAGE, PFX = process.argv[3] || 'colors', ONLY = (process.argv[4] || '').split(',').filter(Boolean);
  const views = [['start', null], ['mid', 'm.setScale(1.0, 640, 480)'], ['nearW', 'm.setScale(m.maxScale() * 0.9, 300, 470)'], ['nearC', 'm.setScale(m.maxScale() * 0.9, 260, 640)'], ['nearE', 'm.setScale(m.maxScale() * 0.9, 1300, 400)'], ['m40', 'm.ev("fitToCloth()"); m.setMonth(40)'], ['m40mid', 'm.setScale(1.0, 900, 500)'], ['m64', 'm.ev("fitToCloth()"); m.setMonth(64)']];
  for (const dpr of [1, 2]) {
    if (ONLY.length && dpr === 2) continue; const p = await open(b, FILE, { errors, dpr, settle: 1500 });
    for (const [tag, src] of views) {
      if (dpr === 2 && !['start', 'mid', 'nearW'].includes(tag)) continue; if (ONLY.length && !ONLY.includes(tag)) { if (src) { await p.evaluate((s) => { const m = window.__mock; eval(s); }, src); await p.waitForTimeout(800); } continue; }
      if (src) { await p.evaluate((s) => { const m = window.__mock; eval(s); }, src); await p.waitForTimeout(1200); }
      const data = await p.evaluate((s) => window.__mock.ev(s), IN_PAGE);
      fs.writeFileSync(`${__dirname}/out/${PFX}-${tag}-dpr${dpr}.json`, JSON.stringify(data));
      console.log(tag, dpr, 'cores', data.cores.length, 'edges', data.edges.length, 'seats', data.seats.length, 'Dpx', data.Dpx.toFixed(1), data.band);
    }
    await p.context().close();
  }
  console.log('errors', JSON.stringify(errors.filter((x) => !/software WebGL|willReadFrequently/.test(x))));
  await b.close();
})();
