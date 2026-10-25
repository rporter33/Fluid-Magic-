
// ------------------------------------------------------------------ v4 relief: the wild sculpture, the water placement, and the bake scheduler (both looks, lazily)
function rlSculptWilds(g) { // world units on the bake: crags on the peaks' south faces, the meres' north banks, ripples, reeds, snags (§3.8)
  for (const w of WILDS) {
    const R = rngFor(`relief:${MAP_SEED}:wild:${w.id}`), ol = rlWildOutline(w);
    g.save(); g.beginPath(); for (const c of w.cells) { const P = cells[c]; P.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); } g.clip();
    if (w.kind === 'peaks') {
      const hs = RL_P.cragShown * RLK;
      for (const e of ol) {
        const [ax, ay] = e.a, [bx, by] = e.b, mx = (ax + bx) / 2, my = (ay + by) / 2, inside = d3.polygonContains(cells[e.c], [mx, my - 2]); // the face shows where the land lies to the south
        if (!inside) continue; const L = Math.hypot(bx - ax, by - ay), n = Math.max(2, Math.round(L / (6 * RLK)));
        // the face as a parallelogram above the outline; its top edge broken into crags, strata, darker at the foot
        const top = []; for (let m = 0; m <= n; m++) { const t = m / n, x = ax + (bx - ax) * t, y = ay + (by - ay) * t, e = m === 0 || m === n ? 0.5 : 1; top.push([x, y - hs * e * (0.8 + 0.35 * R())]); }
        const gr = g.createLinearGradient(0, my - hs, 0, my); gr.addColorStop(0, '#4A4648'); gr.addColorStop(0.55, '#2E2B2E'); gr.addColorStop(1, '#1A181B');
        g.fillStyle = gr; g.beginPath(); g.moveTo(ax, ay); top.forEach(([x, y]) => g.lineTo(x, y)); g.lineTo(bx, by); g.closePath(); g.fill();
        g.strokeStyle = 'rgba(14,12,14,.45)'; g.lineWidth = 0.7; for (let m = 1; m < n; m += 2 + Math.floor(R() * 2)) { const [x, y] = top[m], t = m / n; g.beginPath(); g.moveTo(x, y + 1.5); g.lineTo(ax + (bx - ax) * t + (R() - 0.5) * 2, ay + (by - ay) * t - hs * 0.25 * R()); g.stroke(); }
        g.strokeStyle = 'rgba(160,152,145,.45)'; g.lineWidth = 0.7; g.beginPath(); top.forEach(([x, y], m) => (m ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); // the lit lip of the crags
      }
    } else {
      const hb = RL_P.bank * RLK * 0.77;
      for (const e of ol) {
        const [ax, ay] = e.a, [bx, by] = e.b, mx = (ax + bx) / 2, my = (ay + by) / 2; if (!d3.polygonContains(cells[e.c], [mx, my + 2])) continue; // the north bank: water to the south of the outline
        g.fillStyle = RL_C.mereBank; g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.lineTo(bx, by + hb); g.lineTo(ax, ay + hb); g.closePath(); g.fill();
        g.strokeStyle = 'rgba(20,18,24,.6)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(ax, ay + hb); g.lineTo(bx, by + hb); g.stroke();
      }
      let bb = [Infinity, Infinity, -Infinity, -Infinity]; for (const c of w.cells) { const b = bboxOf(cells[c]); bb = [Math.min(bb[0], b[0]), Math.min(bb[1], b[1]), Math.max(bb[2], b[2]), Math.max(bb[3], b[3])]; }
      g.lineCap = 'round';
      for (let k = 0; k < 26; k++) { const x = bb[0] + R() * (bb[2] - bb[0]), y = bb[1] + R() * (bb[3] - bb[1]); if (!w.cells.some((c) => d3.polygonContains(cells[c], [x, y]))) continue; const L = (4 + R() * 7) * RLK; g.strokeStyle = `rgba(143,195,211,${0.18 + 0.2 * R()})`; g.lineWidth = 0.9; g.beginPath(); g.ellipse(x, y, L, L * 0.22, 0, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
      for (const e of ol) { const L = Math.hypot(e.b[0] - e.a[0], e.b[1] - e.a[1]); for (let m = 0; m < L / (6 * RLK); m++) { const t = R(), x = e.a[0] + (e.b[0] - e.a[0]) * t, y = e.a[1] + (e.b[1] - e.a[1]) * t; const [cx, cy] = cent[e.c], dx = cx - x, dy = cy - y, dl = Math.hypot(dx, dy) || 1, ix = x + (dx / dl) * (2 + 4 * R()) * RLK, iy = y + (dy / dl) * (2 + 4 * R()) * RLK;
        g.strokeStyle = R() < 0.5 ? '#3E4A34' : '#55603F'; g.lineWidth = 0.9; for (let q = 0; q < 3; q++) { g.beginPath(); g.moveTo(ix + q * 1.2, iy); g.lineTo(ix + q * 1.2 + (R() - 0.5) * 2, iy - (2.5 + 2 * R()) * RLK); g.stroke(); } } }
      for (let k = 0; k < 5; k++) { const x = bb[0] + R() * (bb[2] - bb[0]), y = bb[1] + R() * (bb[3] - bb[1]); if (!w.cells.some((c) => d3.polygonContains(cells[c], [x, y]) && distToEdge(cells[c], x, y) > 14 * RLK)) continue; // bone-white snags
        g.strokeStyle = '#E2DCCD'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 1, y - 7 * RLK); g.moveTo(x + 0.6, y - 4 * RLK); g.lineTo(x + 3.4 * RLK, y - 6.5 * RLK); g.moveTo(x + 0.8, y - 5.5 * RLK); g.lineTo(x - 2.4 * RLK, y - 7.6 * RLK); g.stroke();
        g.strokeStyle = 'rgba(143,195,211,.35)'; g.beginPath(); g.ellipse(x, y + 0.5, 3 * RLK, 0.8 * RLK, 0, 0, Math.PI * 2); g.stroke(); }
    }
    g.restore();
  }
}
// ---- water inside one province (§3.6): lakes at a local low of the CPU heightfield, ponds, streams traced downhill (biased toward their sink)
function rlPlaceWater(out) {
  const { QW, QH, TX, hq } = out, res = { lakes: [], ponds: [], streams: [], falls: [] }, clear = RL_P.waterClearD * RLD + 2;
  const H4 = (x, y) => rlBilin(hq, QW, QH, (x * TX) / 4, (y * TX) / 4);
  const zoneOK = (i, x, y, r) => { // the seat, the army slots east of it, the label under it and the Wellspring west of it stay clear (world units at the start zoom)
    const [sx, sy] = cent[i], dx = x - sx, dy = y - sy;
    if (Math.hypot(dx, dy * 1.2) < 0.17 * RLD + r) return false; // the seat piece
    if (dx > 0 && Math.hypot(dx, dy) < 0.36 * RLD + r && Math.abs(dy) < 0.22 * RLD + r) return false; // the first army slots, east of the seat
    if (Math.abs(dx) < 0.24 * RLD + r && dy > 0 && dy < 0.18 * RLD + r) return false; // the label
    return true;
  };
  const seatOK = (i, x, y) => Math.hypot(x - cent[i][0], (y - cent[i][1]) * 1.2) > 0.15 * RLD;
  const blob = (x, y, r, R) => { const k1 = R() * 6.28, k2 = R() * 6.28, a1 = 0.10 + 0.08 * R(), a2 = 0.06 + 0.05 * R(), rot = R() * 3.14, P = []; for (let m = 0; m < 40; m++) { const t = (m / 40) * Math.PI * 2, rr = r * (1 + a1 * Math.cos(2 * t + k1) + a2 * Math.cos(3 * t + k2)); P.push([x + Math.cos(t + rot) * rr * 1.25, y + Math.sin(t + rot) * rr * 0.8]); } return P; };
  const polyArea = (P) => Math.abs(d3.polygonArea(P));
  const fits = (i, P) => P.every(([x, y]) => d3.polygonContains(cells[i], [x, y]) && distToEdge(cells[i], x, y) >= clear && inModel(x, y));
  for (const i of provList) {
    const tn = terr[i], R = rngFor(`relief:${MAP_SEED}:water:${i}`), roll = R();
    const kind = ['plains', 'farmland', 'forest', 'hills'].includes(tn) && roll < 0.2 ? 'lake' : roll > 0.2 && roll < 0.34 && tn !== 'swamp' ? 'pond' : null; if (!kind) continue;
    const maxShare = kind === 'lake' ? RL_P.lakeMax * 0.55 : RL_P.pondMax * 0.9, r = Math.sqrt((maxShare * areaOf[i]) / Math.PI / 1.0);
    let best = null; const bb = bboxOf(cells[i]);
    for (let t = 0; t < 140; t++) { // candidates; the lowest valid one wins
      const x = bb[0] + R() * (bb[2] - bb[0]), y = bb[1] + R() * (bb[3] - bb[1]); if (!zoneOK(i, x, y, r * 1.25)) continue;
      const P = blob(x, y, r, rngFor(`relief:${MAP_SEED}:blob:${i}:${t}`)); if (!fits(i, P) || polyArea(P) > (kind === 'lake' ? RL_P.lakeMax : RL_P.pondMax) * areaOf[i]) continue;
      const hgt = H4(x, y); if (!best || hgt < best.h) best = { x, y, P, h: hgt };
    }
    if (!best) continue; const wb = { i, kind, P: best.P, x: best.x, y: best.y, share: polyArea(best.P) / areaOf[i] };
    (kind === 'lake' ? res.lakes : res.ponds).push(wb);
    // a stream from a seeded high source in the core, downhill on the quarter-resolution field and drawn toward its lake or pond
    if (R() < 0.75) for (let t = 0; t < 18; t++) {
      const x0 = bb[0] + R() * (bb[2] - bb[0]), y0 = bb[1] + R() * (bb[3] - bb[1]); if (!d3.polygonContains(cells[i], [x0, y0]) || distToEdge(cells[i], x0, y0) < clear + 4 || !seatOK(i, x0, y0) || Math.hypot(x0 - wb.x, y0 - wb.y) < 0.3 * RLD) continue;
      const pts = [[x0, y0]]; let [x, y] = [x0, y0], ok = false; const st = 2.2 * RLK;
      for (let m = 0; m < 260; m++) {
        const e = 1.2, gx = (H4(x + e, y) - H4(x - e, y)) / (2 * e), gy = (H4(x, y + e) - H4(x, y - e)) / (2 * e), gl = Math.hypot(gx, gy) || 1, tx = wb.x - x, ty = wb.y - y, tl = Math.hypot(tx, ty) || 1;
        const k = Math.min(1, 0.35 + m / 80); let vx = (-gx / gl) * (1 - k) + (tx / tl) * k, vy = (-gy / gl) * (1 - k) + (ty / tl) * k; const vl = Math.hypot(vx, vy) || 1; vx /= vl; vy /= vl;
        x += vx * st; y += vy * st; pts.push([x, y]);
        if (d3.polygonContains(wb.P, [x, y])) { ok = true; break; }
        if (distToEdge(cells[i], x, y) < clear || !seatOK(i, x, y)) break;
      }
      if (!ok || pts.length < 8) continue;
      res.streams.push({ i, pts: chaikin(pts, 2, false), w0: 1.5 * RLK, w1: (kind === 'lake' ? 3 : 2.2) * RLK, sink: kind }); break;
    }
  }
  // streams that fall off the model's south edge (a waterfall down the cliff): provinces with a long south edge
  for (const i of provList) {
    const P = cells[i], south = []; for (let k = 0; k < P.length - 1; k++) if (Math.abs(P[k][1] - H) < 0.5 && Math.abs(P[k + 1][1] - H) < 0.5) south.push([Math.min(P[k][0], P[k + 1][0]), Math.max(P[k][0], P[k + 1][0])]);
    const R = rngFor(`relief:${MAP_SEED}:fall:${i}`); if (!south.length || R() > 0.7 || res.streams.some((s) => s.i === i)) continue;
    const [sa, sb] = south[0]; if (sb - sa < 2 * clear + 0.3 * RLD) continue;
    const ex = sa + clear + R() * (sb - sa - 2 * clear); if (ex < RL_RC + 6 || ex > W - RL_RC - 6) continue;
    for (let t = 0; t < 14; t++) {
      const bb = bboxOf(P), x0 = bb[0] + R() * (bb[2] - bb[0]), y0 = bb[1] + R() * (bb[3] - bb[1]) * 0.6; if (!d3.polygonContains(P, [x0, y0]) || distToEdge(P, x0, y0) < clear + 4 || !seatOK(i, x0, y0) || H - y0 < 0.3 * RLD) continue;
      const pts = [[x0, y0]]; let [x, y] = [x0, y0], ok = false; const st = 2.2 * RLK;
      for (let m = 0; m < 300; m++) {
        const e = 1.2, gx = (H4(x + e, y) - H4(x - e, y)) / (2 * e), gy = (H4(x, y + e) - H4(x, y - e)) / (2 * e), gl = Math.hypot(gx, gy) || 1, tx = ex - x, ty = H + 2 - y, tl = Math.hypot(tx, ty) || 1;
        const k = Math.min(1, 0.4 + m / 70); let vx = (-gx / gl) * (1 - k) + (tx / tl) * k, vy = (-gy / gl) * (1 - k) + (ty / tl) * k; const vl = Math.hypot(vx, vy) || 1; vx /= vl; vy /= vl;
        x += vx * st; y += vy * st; if (y >= H) { pts.push([x, H]); ok = true; break; } pts.push([x, y]);
        const dEdge = Math.min(...(() => { const ds = []; for (let k2 = 0; k2 < P.length - 1; k2++) { const a = P[k2], b = P[k2 + 1]; if (Math.abs(a[1] - H) < 0.5 && Math.abs(b[1] - H) < 0.5) continue; ds.push(rlSegDist(x, y, a[0], a[1], b[0], b[1])); } return ds; })());
        if (dEdge < clear || !seatOK(i, x, y)) break;
      }
      if (!ok || pts.length < 8) continue;
      const sm = chaikin(pts, 2, false); res.streams.push({ i, pts: sm, w0: 1.5 * RLK, w1: 2.6 * RLK, sink: 'edge' }); res.falls.push({ i, x: sm[sm.length - 1][0], w: 2.6 * RLK }); break;
    }
  }
  return res;
}
// ---- the scheduler: the shared rasters and the first look at load (Natural, or Clear for ?terrain=clear and the setting); the other look the first time it is needed
// (natural §6: "Preparing terrain colours…" on the Terrain mode button until it is ready). Time-sliced on the main thread, 28 ms a slice.
function rlRunGen(gen, acc, done) {
  const t0 = performance.now();
  const step = () => { const s0 = performance.now(); let r; do { r = gen.next(); } while (!r.done && performance.now() - s0 < 28); acc.slices = (acc.slices ?? 0) + 1; acc.total = (acc.total ?? 0) + performance.now() - s0;
    if (!r.done) { setTimeout(step, 0); return; } acc.wall = performance.now() - t0; done(); };
  setTimeout(step, 0);
}
const rlLookGen = (out, look) => (look === 'natural' ? rlNaturalGen(out) : rlClearGen(out));
const rlLookReady = (look) => !!(RB.L[look] && RB.L[look].ready);
function rlStartBake() {
  if (RB.running || RB.ready) return; RB.running = true; const look = rlLandLook(), acc = RB;
  rlRunGen((function* () { yield* rlSharedGen(RB); yield* rlLookGen(RB, look); })(), acc, () => {
    RB.firstLook = look; RB.L[look].cpu = { total: Math.round(RB.total), wall: Math.round(RB.wall), slices: RB.slices };
    RB.running = false; RB.ready = true; RB.ver++; RIM = null; rlAfterBake(); renderModes(); requestDraw(); });
}
function rlEnsureLook(look) { // true when the look's bake is ready; otherwise starts it (once) and returns false
  if (rlLookReady(look)) return true; if (!RB.ready || RB.lookRunning) return false;
  RB.lookRunning = look; const acc = { total: 0, slices: 0, wall: 0 };
  rlRunGen(rlLookGen(RB, look), acc, () => { RB.L[look].cpu = { total: Math.round(acc.total), wall: Math.round(acc.wall), slices: acc.slices }; RB.lookRunning = null; RB.lookVer++; renderModes(); requestDraw(); });
  renderModes(); return false;
}
