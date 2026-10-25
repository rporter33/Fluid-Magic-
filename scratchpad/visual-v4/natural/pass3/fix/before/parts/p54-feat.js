
// ------------------------------------------------------------------ v3 features, computed once per map (and per border mode) from public map data:
// tracks, brooks and ponds, bridges, landmarks, ruins, hero set pieces, camp and stone spots, vignette slots, named regions.
let FEATS = null;
function feats() { if (!FEATS) { const t0 = performance.now(); FEATS = buildFeats(); FEATS.fk = fontsReadyFlag(); PROF.init = +(performance.now() - t0).toFixed(1); } return FEATS; }
function resetFeats() { FEATS = null; TRACK_DOTS.clear(); }
const ELEV = { peaks: 6, mountains: 5, hills: 4, forest: 3, plains: 2, farmland: 2, wasteland: 2, swamp: 1, mere: 0 };
const BROOK_P = { hills: 0.6, mountains: 0.6, swamp: 0.6, forest: 0.5, plains: 0.4, farmland: 0.3, wasteland: 0 };
const POND_P = { plains: 0.25, forest: 0.2, mountains: 0.2, farmland: 0.15, hills: 0.15, swamp: 0, wasteland: 0 };
const decim = (P, k) => { const o = []; for (let m = 0; m < P.length; m += k) o.push(P[m]); if (o[o.length - 1] !== P[P.length - 1]) o.push(P[P.length - 1]); return o; };
const inBoxes = (bs, x, y, m = 0) => bs.some((b) => x > b[0] - m && x < b[2] + m && y > b[1] - m && y < b[3] + m);
function polyLen(P) { let L = 0; for (let k = 1; k < P.length; k++) L += Math.hypot(P[k][0] - P[k - 1][0], P[k][1] - P[k - 1][1]); return L; }
function distToPolyline(P, x, y) { let m = Infinity; for (let k = 0; k < P.length - 1; k++) { const [ax, ay] = P[k], [bx, by] = P[k + 1], dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1))); m = Math.min(m, Math.hypot(x - ax - t * dx, y - ay - t * dy)); } return m; }
function arcAt(P, Lc, d) { // the point at arc length d along P (cumulative lengths Lc)
  if (d <= 0) return P[0]; const tot = Lc[Lc.length - 1]; if (d >= tot) return P[P.length - 1];
  let lo = 0, hi = Lc.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (Lc[m] <= d) lo = m; else hi = m; }
  const t = (d - Lc[lo]) / (Lc[hi] - Lc[lo] || 1); return [P[lo][0] + (P[hi][0] - P[lo][0]) * t, P[lo][1] + (P[hi][1] - P[lo][1]) * t];
}
const cumLen = (P) => { const L = [0]; for (let k = 1; k < P.length; k++) L.push(L[k - 1] + Math.hypot(P[k][0] - P[k - 1][0], P[k][1] - P[k - 1][1])); return L; };
function featureZones(i) { return zonesAll(i); }
const seatEllipse = (i) => { const se = settleExtent(i); return { rx: 0.75 * se, ry: 0.5 * se }; };

function buildFeats() {
  const T0 = performance.now(), TT = {}; const tick = (k) => { TT[k] = +(performance.now() - T0).toFixed(1); };
  for (const i of provList) geo(i); tick('geo'); for (const i of provList) zonesAll(i); tick('zones');
  const F = { TT, tracks: [], halves: new Map(), water: new Map(), bridges: new Map(), land: new Map(), heroes: new Map(), vig: new Map(), block: new Map(), regions: [], regionOf: new Array(N).fill(null) };
  const ring = new Map(), grids = new Map(), CELL = 10 * U; // a decimated boundary for containment, a segment grid for distance tests
  for (const i of provList) {
    ring.set(i, decim(npoly[i], 3)); const rg = npoly[i], grid = new Map();
    for (let k = 0; k < rg.length - 1; k++) { const a = rg[k], b = rg[k + 1], x0 = Math.floor(Math.min(a[0], b[0]) / CELL), x1 = Math.floor(Math.max(a[0], b[0]) / CELL), y0 = Math.floor(Math.min(a[1], b[1]) / CELL), y1 = Math.floor(Math.max(a[1], b[1]) / CELL); for (let gx = x0; gx <= x1; gx++) for (let gy = y0; gy <= y1; gy++) { const kk = gx + ',' + gy; let l = grid.get(kk); if (!l) grid.set(kk, (l = [])); l.push(k); } }
    grids.set(i, grid);
  }
  const nearBorder = (i, x, y, r, skip) => { // is any border segment of province i within r of (x, y)? (skip: points of an edge to ignore)
    const rg = npoly[i], grid = grids.get(i), x0 = Math.floor((x - r) / CELL), x1 = Math.floor((x + r) / CELL), y0 = Math.floor((y - r) / CELL), y1 = Math.floor((y + r) / CELL);
    for (let gx = x0; gx <= x1; gx++) for (let gy = y0; gy <= y1; gy++) { const l = grid.get(gx + ',' + gy); if (!l) continue;
      for (const k of l) { const a = rg[k], b = rg[k + 1]; if (skip && skip.has(a) && skip.has(b)) continue; const dx = b[0] - a[0], dy = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy || 1))); if (Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy) < r) return true; } }
    return false;
  };
  const contains = (i, q) => d3.polygonContains(ring.get(i), q);
  const bdist = (i, x, y) => distToEdge(ring.get(i), x, y);
  const C = 10 * U, Z = 12 * U, J = 9 * U, S0 = 15 * U;
  const D = MED_DIAM;
  // ---- tracks: one per passable neighbor pair (wilds are not neighbors), seat to border to seat, crossing at a right angle
  for (const [key, e] of EDGE) {
    const { i, j } = e; if (isWild(i) || isWild(j)) continue;
    const P = edgePts(e), Lc = cumLen(P), tot = Lc[Lc.length - 1];
    const tryM = (f) => {
      const d = f * tot, M = arcAt(P, Lc, d), A = arcAt(P, Lc, d - 6 * U), B = arcAt(P, Lc, d + 6 * U), L = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1;
      const n = [-(B[1] - A[1]) / L, (B[0] - A[0]) / L], out = {};
      for (const s of [i, j]) {
        const sg = d3.polygonContains(npoly[s], [M[0] + n[0] * 2, M[1] + n[1] * 2]) ? 1 : -1; let Mi = null;
        for (let t = Z; t <= 0.3 * D; t += U) { const q = [M[0] + n[0] * sg * t, M[1] + n[1] * sg * t]; if (!contains(s, q)) break; if (!nearBorder(s, q[0], q[1], C)) { Mi = q; break; } }
        if (!Mi) return null; out[s] = Mi;
      }
      return { M, Mi: out };
    };
    let cross = null, slid = false;
    for (let k = 0; k <= 10 && !cross; k++) { const f = 0.5 + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.05; if (f < 0.25 || f > 0.75) continue; cross = tryM(f); if (k) slid = true; }
    const R = rngFor(`track:12:${key}`), off0 = (0.1 + 0.1 * R()) * (R() < 0.5 ? -1 : 1), amp0 = 0.03 + 0.03 * R(), halfs = R() < 0.5 ? 1 : 2;
    const shared = new Set(e.wobble);
    for (const s of [i, j]) {
      const G = geo(s), seat = G.seat, el = seatEllipse(s);
      const toward = cross ? cross.Mi[s] : arcAt(P, Lc, tot / 2);
      const dx = toward[0] - seat[0], dy = toward[1] - seat[1], tt = 1 / Math.sqrt((dx / el.rx) ** 2 + (dy / el.ry) ** 2), S = tt < 1 ? [seat[0] + dx * tt, seat[1] + dy * tt] : seat;
      const curve = (off, amp, viaLabel, A = S, B = toward) => {
        const len = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1, px = -(B[1] - A[1]) / len, py = (B[0] - A[0]) / len;
        const ctl = viaLabel ? [2 * G.c[0] - (A[0] + B[0]) / 2, 2 * G.c[1] - (A[1] + B[1]) / 2] : [(A[0] + B[0]) / 2 + px * off * len, (A[1] + B[1]) / 2 + py * off * len];
        const out = []; for (let k = 0; k <= 24; k++) { const u = k / 24, a = (1 - u) * (1 - u), b = 2 * u * (1 - u), c = u * u, m = amp * len * Math.sin(Math.PI * halfs * u); out.push([a * A[0] + b * ctl[0] + c * B[0] + px * m, a * A[1] + b * ctl[1] + c * B[1] + py * m]); }
        return out;
      };
      // v3 critique 7: a half keeps out of the label zone (the name and its second line, Mid and Near, plus 2 u), so no dot is dropped mid-run
      const zm = zones(s, 'mid'), zn = zones(s, 'near'), LZ = [zm[0], zm[1], zn[0], zn[1]], zb = [Math.min(...LZ.map((b) => b[0])) - 2 * U, Math.min(...LZ.map((b) => b[1])) - 2 * U, Math.max(...LZ.map((b) => b[2])) + 2 * U, Math.max(...LZ.map((b) => b[3])) + 2 * U];
      const okBorder = (c) => c.every((q) => Math.hypot(q[0] - S[0], q[1] - S[1]) <= S0 || (contains(s, q) && !nearBorder(s, q[0], q[1], C)));
      const zoneFree = (c) => c.every((q) => !inBoxes(LZ, q[0], q[1], 2 * U));
      const zonePrefix = (c) => { let out = false; for (const q of c) { if (!inBoxes(LZ, q[0], q[1], 2 * U)) out = true; else if (out) return false; } return true; }; // only the town end runs under the name
      const okCurve = (c) => zoneFree(c) && okBorder(c); // the cheap zone test first
      const bow = (side, B) => { // from the seat ellipse's east or west point, up the side of the label zone and round its corner
        const A = [seat[0] + side * el.rx, seat[1]], x = side > 0 ? zb[2] + 3 * U : zb[0] - 3 * U, way = [A, [x, Math.min(A[1], zb[3])]];
        if (B[1] < zb[1]) way.push([x, zb[1] - 2 * U]); way.push(B);
        const sm = chaikin(way, 3, false), Ls = cumLen(sm), T = Ls[Ls.length - 1], out = []; for (let k = 0; k <= 32; k++) out.push(arcAt(sm, Ls, (T * k) / 32)); return out;
      };
      const okBow = (c) => zonePrefix(c) && c.every((q, k) => k % 2 === 1 || (contains(s, q) && (Math.hypot(q[0] - seat[0], q[1] - seat[1]) <= S0 + el.rx || !nearBorder(s, q[0], q[1], C)))); // border tests at every other point
      const side0 = toward[0] >= seat[0] ? 1 : -1;
      let pts3 = null, fallback = 'curve', cornerRun = false;
      if (cross) {
        const CANDS = [[off0, amp0, false, 'curve'], [off0, amp0 / 2, false, 'curve'], [off0, 0, false, 'curve'], [off0 / 2, 0, false, 'half'], [0, 0, false, 'zero']];
        const CC = CANDS.map(([off, amp, via]) => curve(off, amp, via));
        for (let m = 0; m < CANDS.length; m++) if (okCurve(CC[m])) { pts3 = CC[m]; fallback = CANDS[m][3]; break; } // clear of the name zone
        if (!pts3) for (const sd of [side0, -side0]) { const c = bow(sd, toward); if (okBow(c)) { pts3 = c; fallback = 'bow'; break; } } // round the name zone
        if (!pts3) for (const c of CC) if (zonePrefix(c) && okBorder(c)) { pts3 = c; fallback = 'under'; break; } // into town under the name
        if (!pts3) { pts3 = curve(0, 0, true); fallback = 'label'; }
        pts3 = [...pts3, cross.M];
      } else { // a corner contact: v3 critique 7: run into the shared corner, the last 2 C along the corner's bisector (the J rule waived there)
        const V = arcAt(P, Lc, tot / 2), ring = npoly[s], Lr = cumLen(ring), totR = Lr[Lr.length - 1];
        let kv = 0, dv = Infinity; ring.forEach((q, k) => { const d = Math.hypot(q[0] - V[0], q[1] - V[1]); if (d < dv) { dv = d; kv = k; } });
        const at = (d) => arcAt(ring, Lr, ((d % totR) + totR) % totR), A1 = at(Lr[kv] - 2 * C), B1 = at(Lr[kv] + 2 * C), na = Math.hypot(A1[0] - V[0], A1[1] - V[1]) || 1, nb2 = Math.hypot(B1[0] - V[0], B1[1] - V[1]) || 1;
        let bis = [(A1[0] - V[0]) / na + (B1[0] - V[0]) / nb2, (A1[1] - V[1]) / na + (B1[1] - V[1]) / nb2], bl = Math.hypot(...bis);
        if (bl < 0.2) { bis = [seat[0] - V[0], seat[1] - V[1]]; bl = Math.hypot(...bis) || 1; } bis = [bis[0] / bl, bis[1] / bl];
        if (!contains(s, [V[0] + bis[0] * C, V[1] + bis[1] * C])) bis = [-bis[0], -bis[1]];
        const Q = [V[0] + bis[0] * 2 * C, V[1] + bis[1] * 2 * C];
        if (contains(s, Q)) for (const [off, amp] of [[off0, amp0], [off0, 0], [0, 0]]) { const c = curve(off, amp, false, S, Q); if (zonePrefix(c) && okBorder(c)) { pts3 = [...c, V]; cornerRun = true; break; } }
        if (!pts3) { const c = curve(0, 0, false), keep = [c[0]]; for (let k = 1; k < c.length; k++) { if (Math.hypot(c[k][0] - S[0], c[k][1] - S[1]) > S0 && nearBorder(s, c[k][0], c[k][1], C)) break; keep.push(c[k]); } pts3 = keep; }
        fallback = 'corner';
      }
      const fromM = [...pts3].reverse(), Lm = cumLen(fromM), lastLen = cross ? Math.hypot(cross.M[0] - cross.Mi[s][0], cross.M[1] - cross.Mi[s][1]) : cornerRun ? 2 * C : 0;
      // junction rule: on the last segment, no dot within J of a border other than the shared one (waived on a corner run)
      const lastOk = []; for (let d = 0; d <= lastLen; d += 0.5 * U) { const q = arcAt(fromM, Lm, d); lastOk.push(cornerRun || !nearBorder(s, q[0], q[1], J, shared)); }
      const half = { key: key + ':' + s, edge: key, s, pts: fromM, L: Lm, len: Lm[Lm.length - 1], lastLen, lastOk, ink: DARK_T.has(terr[s]) ? PAPER_INK : FEATURE_INK, fallback, slid, corner: !cross, cornerRun, bb: bboxOf(fromM) };
      F.halves.set(half.key, half); F.tracks.push(half);
    }
  }
  tick('tracks');
  // ---- brooks and ponds: scenery inside one province, inset B_u + 6 u, outside every zone; dark water is always a wild (H5)
  for (const i of provList) {
    const p = prov[i], G = geo(i), t = terr[i], R = rngFor(`brook:12:${i}`), Rp = rngFor(`pond:12:${i}`);
    const zs = [0, 1, 3].flatMap((k) => [zones(i, 'mid')[k], zones(i, 'near')[k]]), inset = B_U + 6 * U; // deviation: water may pass under the token zone (tokens are opaque)
    const ok = (x, y, extra = 0) => contains(i, [x, y]) && !nearBorder(i, x, y, inset + extra) && !inBoxes(zs, x, y, extra);
    const free = G.slots.filter((s) => ok(s.x, s.y));
    let up = null, best = -1; for (const w of NB[i]) { const e = isWild(w) ? ELEV[wildOf[w].kind] : ELEV[terr[w]]; if (e > best) { best = e; up = w; } }
    const dir = up != null ? [cent[up][0] - G.c[0], cent[up][1] - G.c[1]] : [0, -1], dl = Math.hypot(...dir) || 1; dir[0] /= dl; dir[1] /= dl;
    const along = (s) => (s.x - G.c[0]) * dir[0] + (s.y - G.c[1]) * dir[1];
    let pond = null;
    if (Rp() < POND_P[t] && free.length) {
      const frac = 0.015 + 0.025 * Rp(), r = Math.sqrt((frac * areaOf[i]) / (Math.PI * 0.75)), cand = [...free].sort((a, b) => along(a) - along(b));
      for (const s of cand) if (ok(s.x, s.y, r)) { pond = { x: s.x, y: s.y, r, ph1: Rp() * 6.28, ph2: Rp() * 6.28, reeds: 2 + Math.floor(Rp() * 2) }; break; }
    }
    let brook = null;
    if (p.well || R() < BROOK_P[t]) { // the source toward the uphill neighbor, the mouth downhill (the pond if any), at least half a diameter apart
      const route = (a, b, amp, Rr) => { let P = [a, b]; for (let lv = 0; lv < 3; lv++) { const o = [P[0]]; for (let k = 0; k < P.length - 1; k++) { const q0 = P[k], q1 = P[k + 1], L = Math.hypot(q1[0] - q0[0], q1[1] - q0[1]) || 1, d = (Rr() - 0.5) * 2 * amp * L; o.push([(q0[0] + q1[0]) / 2 - ((q1[1] - q0[1]) / L) * d, (q0[1] + q1[1]) / 2 + ((q1[0] - q0[0]) / L) * d], q1); } P = o; amp *= 0.6; }
        const M = [P[0]]; for (let k = 0; k < P.length - 1; k++) M.push(...ridge(P[k], P[k + 1], Rr, 0.06, 4).slice(1)); // v3 critique 8 asked ridge(0.2, 4): that drew a jagged bolt, so 0.06 here and the bends carry the meander
        const Q = M, Lq = cumLen(Q); return { Q, Lq, T: Lq[Lq.length - 1], lam: 0.12 + 0.06 * Rr(), ph: Rr() * 6.28, ph2: Rr() * 6.28, ph3: Rr() * 6.28, a, b }; };
      const bend = (r, mAmp) => { // the bends: a seeded lateral offset along the chord (two sines, wavelengths 0.12-0.18 and 0.53 x that of the course, the
        // amplitude swelling and easing along it), tapered to the ends, so the loops are uneven like a real brook's
        let Q = r.Q; if (mAmp > 0) { const { Lq, T, a, b } = r, ch = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, px = -(b[1] - a[1]) / ch, py = (b[0] - a[0]) / ch, lam = r.lam * T, A = mAmp * lam;
          Q = Q.map((q, k) => { const d = Lq[k], t = d / T, env = Math.sqrt(Math.sin(Math.PI * t)) * (0.7 + 0.3 * Math.sin(2 * Math.PI * t * 1.3 + r.ph3)), o = A * env * (Math.sin((2 * Math.PI * d) / lam + r.ph) + 0.25 * Math.sin((2 * Math.PI * d) / (0.53 * lam) + r.ph2)); return [q[0] + px * o, q[1] + py * o]; }); }
        const S2 = chaikin(Q, 3, false); return decim(S2, Math.max(1, Math.ceil(S2.length / 180))); }; // smoothed after the bends, so the loops stay round
      const sinu = (P) => polyLen(P) / (Math.hypot(P[P.length - 1][0] - P[0][0], P[P.length - 1][1] - P[0][1]) || 1);
      const okPt = (q, k, n) => (k === 0 && p.well) || (k === n - 1 && pond) || ok(q[0], q[1]);
      const valid = (P) => P.every((q, k) => ((k === 0 && p.well) || (k === P.length - 1 && pond) || !inBoxes(zs, q[0], q[1])) && ((k % 3 && k !== P.length - 1) || okPt(q, k, P.length))); // the zones at every point, the border tests at every third (they are about 1 u apart)
      const straightOK = (a, b) => { for (let k = 1; k < 8; k++) { const q = [a[0] + ((b[0] - a[0]) * k) / 8, a[1] + ((b[1] - a[1]) * k) / 8]; if (!ok(q[0], q[1], -2 * U)) return false; } return true; };
      const sources = p.well ? [wellBasinAt(i)] : [...free].sort((a, b) => along(b) - along(a)).slice(0, 4).map((q) => [q.x, q.y]);
      outer: for (const s0 of sources) {
        const mouths = [...(pond ? [[pond.x, pond.y]] : []), ...[...free].sort((a, b) => along(a) - along(b)).map((q) => [q.x, q.y])].filter((m) => Math.hypot(m[0] - s0[0], m[1] - s0[1]) >= 0.45 * D).slice(0, 6);
        for (const mouth of mouths) {
          if (!straightOK(s0, mouth)) continue;
          for (const amp of [0.25, 0.125, 0.06]) { let alt = null; const r = route(s0, mouth, amp, rngFor(`brook:12:${i}:${amp}:${mouth[0] | 0}`)); for (const mAmp of [0.2, 0.26, 0.32, 0.14, 0.08, 0]) { const P = bend(r, mAmp); if (!valid(P)) continue; if (sinu(P) >= 1.25) { brook = P; break outer; } if (!alt || sinu(P) > sinu(alt)) alt = P; } if (alt) { brook = alt; break outer; } } // the first course reaching 1.25 sinuosity, else the most sinuous valid one
        }
      }
    }
    F.water.set(i, { brook, pond });
  }
  tick('water');
  // ---- bridges: where a track crosses a brook
  const BBB = new Map(); for (const [i, wt] of F.water) if (wt.brook) BBB.set(i, bboxOf(wt.brook));
  for (const h of F.tracks) {
    const wt = F.water.get(h.s); if (!wt || !wt.brook) continue; const bb2 = BBB.get(h.s); if (h.bb[2] < bb2[0] || h.bb[0] > bb2[2] || h.bb[3] < bb2[1] || h.bb[1] > bb2[3]) continue;
    const B = wt.brook, BL = cumLen(B), out = [];
    for (let a = 0; a < h.pts.length - 1; a++) { const p0 = h.pts[a], p1 = h.pts[a + 1]; if (Math.max(p0[0], p1[0]) < bb2[0] || Math.min(p0[0], p1[0]) > bb2[2] || Math.max(p0[1], p1[1]) < bb2[1] || Math.min(p0[1], p1[1]) > bb2[3]) continue; for (let b = 0; b < B.length - 1; b++) {
      const u = segT(h.pts[a], h.pts[a + 1], B[b], B[b + 1]); if (u === null) continue;
      const x = h.pts[a][0] + (h.pts[a + 1][0] - h.pts[a][0]) * u, y = h.pts[a][1] + (h.pts[a + 1][1] - h.pts[a][1]) * u, ang = Math.atan2(h.pts[a + 1][1] - h.pts[a][1], h.pts[a + 1][0] - h.pts[a][0]);
      out.push({ x, y, ang, w: (0.9 + 1.5 * (BL[b] / BL[BL.length - 1])) * U, ink: h.ink });
    } }
    if (out.length) F.bridges.set(h.key, out);
  }
  // ---- what stamps keep off: tracks and brooks (plus the radius and 2 u), ponds
  const segsOf = (i) => { const o = []; for (const h of F.tracks) if (h.s === i) o.push(h.pts); const wt = F.water.get(i); if (wt && wt.brook) o.push(wt.brook); return o; };
  for (const i of provList) F.block.set(i, { lines: segsOf(i), pond: F.water.get(i).pond, marks: [] });
  // ---- named regions (H12): connected runs of 3 or more provinces of one terrain
  F.regions = buildRegions(); tick('regions');
  F.regions.forEach((r) => r.provs.forEach((i) => (F.regionOf[i] = r)));
  // ---- landmarks: a mine on every Hills and Mountains province, a windmill on every Farmland one, ruins on about a quarter
  for (const i of provList) {
    const G = geo(i), t = terr[i], R = rngFor('landmark:12:' + i), se = settleExtent(i), zs = featureZones(i), blk = F.block.get(i);
    const clear = (x, y, r) => !inBoxes(zs, x, y, r * 0.5) && bdist(i, x, y) >= B_U + 10 * U && blk.lines.every((L) => distToPolyline(L, x, y) > r + 2 * U) && !(blk.pond && Math.hypot(x - blk.pond.x, (y - blk.pond.y) / 0.75) < blk.pond.r + r);
    const byRank = [...G.slots].sort((a, b) => a.rank - b.rank), out = {};
    const always = t === 'hills' || t === 'mountains' ? 'mine' : t === 'farmland' ? 'windmill' : null;
    if (always) { const w = LM_W[always] * LMS() / 2; const s = byRank.find((q) => Math.hypot(q.x - G.seat[0], q.y - G.seat[1]) >= 1.2 * se && clear(q.x, q.y, w)); if (s) { out.always = { kind: always, x: s.x, y: s.y, w: w * 2, mirror: R() < 0.5 }; blk.marks.push([s.x, s.y, w]); } }
    if (R() < 0.25) { const kinds = RUIN_KINDS[t], kind = kinds[Math.floor(R() * kinds.length)], w = LM_W[kind] * LMS() / 2; const s = byRank.find((q) => Math.hypot(q.x - G.seat[0], q.y - G.seat[1]) >= 1.4 * se && clear(q.x, q.y, w) && !(out.always && Math.hypot(q.x - out.always.x, q.y - out.always.y) < w + out.always.w / 2 + 3 * U)); if (s) { out.ruin = { kind, x: s.x, y: s.y, w: w * 2, mirror: R() < 0.5 }; blk.marks.push([s.x, s.y, w]); } }
    F.land.set(i, out);
  }
  tick('landmarks');
  // ---- hero set pieces: one per named region, in its largest province where one fits; it replaces that province's ruin
  for (const rg of F.regions) {
    const R = rngFor('hero:12:' + rg.key), kind = HERO_KIND[rg.terrain], wU = (34 + 9 * R()) * U, mirror = R() < 0.5;
    const gridW = { heroFeet: 20, heroAqueduct: 24, heroStump: 18, heroHead: 22, heroArch: 21, heroPier: 18, heroStatue: 23 }[kind], scale = wU / gridW;
    for (const i of [...rg.provs].sort((a, b) => areaOf[b] - areaOf[a])) {
      const G = geo(i), se = settleExtent(i), zs = featureZones(i), blk = F.block.get(i), lm = F.land.get(i), hw = wU / 2;
      const s = [...G.slots].sort((a, b) => Math.hypot(b.x - G.seat[0], b.y - G.seat[1]) - Math.hypot(a.x - G.seat[0], a.y - G.seat[1])).find((q) => Math.hypot(q.x - G.seat[0], q.y - G.seat[1]) >= 1.6 * se && !inBoxes(zs, q.x, q.y, hw * 0.6) && bdist(i, q.x, q.y) >= B_U + 12 * U + hw * 0.5 && blk.lines.every((L) => distToPolyline(L, q.x, q.y) > hw * 0.6 + 2 * U) && !(lm.always && Math.hypot(q.x - lm.always.x, q.y - lm.always.y) < hw + lm.always.w / 2));
      if (!s) continue;
      F.heroes.set(i, { kind, x: s.x, y: s.y, scale, w: wU, mirror, region: rg }); lm.ruin = null; blk.marks.push([s.x, s.y, hw]); break;
    }
  }
  // ---- vignette slots (Near; 60%), clear of tracks and brooks by 3 u
  for (const i of provList) {
    const R = rngFor('vignette:12:' + i); if (R() >= 0.6) continue;
    const G = geo(i), zs = zones(i, 'near'), blk = F.block.get(i);
    const s = [...G.slots].sort((a, b) => a.rank - b.rank).find((q) => !inBoxes(zs, q.x, q.y, 6 * U) && bdist(i, q.x, q.y) >= B_U + 8 * U && blk.lines.every((L) => distToPolyline(L, q.x, q.y) > 9 * U) && blk.marks.every(([x, y, r]) => Math.hypot(q.x - x, q.y - y) > r + 8 * U) && !(blk.pond && Math.hypot(q.x - blk.pond.x, q.y - blk.pond.y) < blk.pond.r + 8 * U));
    if (s) { F.vig.set(i, { kind: VIG[terr[i]], x: s.x, y: s.y, seed: Math.floor(R() * 1e9) }); blk.marks.push([s.x, s.y, 6 * U]); }
  }
  tick('all');
  return F;
}
function wellBasinAt(i) { const G = geo(i), se = settleExtent(i); return [G.seat[0] - se - 12 * LS, G.seat[1] + 5]; } // fixed, so growth never moves it
function stampBlocked(i, x, y, r) {
  const blk = feats().block.get(i); if (!blk) return false;
  if (blk.lines.some((L) => distToPolyline(L, x, y) < r + 2 * U)) return true;
  if (blk.pond && Math.hypot(x - blk.pond.x, (y - blk.pond.y) / 0.75) < blk.pond.r + r) return true;
  return blk.marks.some(([mx, my, mr]) => Math.hypot(x - mx, y - my) < mr + r);
}
// palette-ab critique fix 1 (Painted only): the canopy's own blocking test. Tracks get half a crown (their dots are live over the bake);
// brooks, ponds and marks get more room than stampBlocked gives, because a dense canopy otherwise overlaps them (the pond is drawn up to 1.23 r).
function canopyBlocked(i, x, y, r) {
  const F = feats(), blk = F.block.get(i); if (!blk) return false; const wt = F.water.get(i);
  if (F.tracks.some((h) => h.s === i && distToPolyline(h.pts, x, y) < 0.5 * r + U)) return true;
  if (wt && wt.brook && distToPolyline(wt.brook, x, y) < r + 4 * U) return true;
  if (blk.pond && Math.hypot(x - blk.pond.x, (y - blk.pond.y) / 0.75) < 1.25 * blk.pond.r + r + 2 * U) return true;
  return blk.marks.some(([mx, my, mr]) => Math.hypot(x - mx, y - my) < mr + r + 3 * U);
}

// ---- named regions: names from terrain syllables, unique against every province and wild name
const REGION_SYL = {
  forest: [['Grey', 'Elder', 'Moss', 'Raven', 'Thorn', 'Deep', 'Old'], ['wold', 'weald', 'holt']],
  swamp: [['Black', 'Reed', 'Sallow', 'Sedge'], ['Fens', 'mire', 'Marsh']],
  hills: [['Red', 'Barrow', 'Wind', 'Long', 'High'], ['Downs', 'Tors', 'Knolls']],
  mountains: [['Iron', 'Cold', 'High', 'Grey'], ['Uplands', 'Heights', 'Scarps']],
  plains: [['Gold', 'Wide', 'Broad', 'Lark'], ['Meads', 'Leas', 'Plain']],
  farmland: [['Wheat', 'Barley', 'Honey', 'Mill'], ['Vale', 'lands', 'Furrows']],
  wasteland: [['Salt', 'Dust', 'Red', 'Scour'], ['Barrens', 'Waste', 'Flats']],
};
function buildRegions() {
  const seen = new Set(), comps = [];
  for (const i of provList) {
    if (seen.has(i)) continue; const t = terr[i], comp = [i]; seen.add(i);
    for (let h = 0; h < comp.length; h++) for (const w of nbrs(comp[h])) if (!seen.has(w) && terr[w] === t) { seen.add(w); comp.push(w); }
    if (comp.length >= 3) comps.push({ terrain: t, provs: comp.sort((a, b) => a - b) });
  }
  comps.sort((a, b) => b.provs.length - a.provs.length || b.provs.reduce((s, i) => s + areaOf[i], 0) - a.provs.reduce((s, i) => s + areaOf[i], 0));
  const out = [], usedNames = new Set([...names.filter(Boolean)]);
  for (const c of comps) {
    if (out.length >= Math.round(provList.length / 10)) break;
    const tot = c.provs.reduce((s, i) => s + areaOf[i], 0), cx = c.provs.reduce((s, i) => s + cent[i][0] * areaOf[i], 0) / tot, cy = c.provs.reduce((s, i) => s + cent[i][1] * areaOf[i], 0) / tot;
    if (out.some((r) => Math.hypot(r.c[0] - cx, r.c[1] - cy) < 1.5 * MED_DIAM)) continue; // each at least 1.5 name lengths from the next
    let sxx = 0, syy = 0, sxy = 0; for (const i of c.provs) for (const [x, y] of cells[i]) { sxx += (x - cx) ** 2; syy += (y - cy) ** 2; sxy += (x - cx) * (y - cy); }
    const ang = 0.5 * Math.atan2(2 * sxy, sxx - syy), ax = [Math.cos(ang), Math.sin(ang)];
    let lo = Infinity, hi = -Infinity; for (const i of c.provs) for (const [x, y] of cells[i]) { const d = (x - cx) * ax[0] + (y - cy) * ax[1]; lo = Math.min(lo, d); hi = Math.max(hi, d); }
    const key = c.provs[0], R = rngFor('region:12:' + key), [pre, suf] = REGION_SYL[c.terrain];
    let name = null;
    for (let tr = 0; tr < 40 && !name; tr++) { const a = pre[Math.floor(R() * pre.length)], b = suf[Math.floor(R() * suf.length)], nm = 'The ' + (b[0] === b[0].toLowerCase() ? a + b : a + ' ' + b); if (!usedNames.has(nm) && !usedNames.has(nm.slice(4))) name = nm; }
    if (!name) continue; usedNames.add(name);
    out.push({ key, terrain: c.terrain, provs: c.provs, set: new Set(c.provs), name, c: [cx, cy], ax, ext: [lo, hi], bow: R() < 0.5 ? 1 : -1 });
  }
  return out;
}

// ---- water in the bake (D4): ponds, then brooks (pale water between two bank lines), then bridge decks
function drawWater(g, i, band, PX) {
  const W2 = feats().water.get(i); if (!W2) return;
  const near = band === 'near';
  if (W2.pond) {
    const { x, y, r, ph1, ph2, reeds: nr } = W2.pond, P = [];
    for (let k = 0; k < 40; k++) { const a = (k / 40) * Math.PI * 2, rr = r * (1 + 0.15 * Math.sin(3 * a + ph1) + 0.08 * Math.sin(5 * a + ph2)); P.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.75]); }
    const path = polyPath(g, P); path(); g.fillStyle = '#A6C7CC'; g.fill();
    g.save(); path(); g.clip(); g.strokeStyle = 'rgba(220,234,234,.8)'; g.lineWidth = 1.2 * PX * 2; g.beginPath(); P.slice(16, 31).forEach(([px, py], k) => (k ? g.lineTo(px, py) : g.moveTo(px, py))); g.stroke(); g.restore();
    const onMtn = PAINTED_PAL() && terr[i] === 'mountains'; // palette-ab critique fix 5 (Painted only): on the pale Painted Mountains the pond keeps its bank
    inkPath(g, P, rngFor('pondink:12:' + i), true, onMtn ? 1.2 * PX : 0.8 * PX, onMtn ? 'rgba(53,83,90,.9)' : 'rgba(53,83,90,.7)'); // v3 critique 12: the bank in the hand's ink
    for (let k = 0; k < nr; k++) { const q = P[4 + k * 5]; reeds(g, q[0], q[1] + 0.5 * U, 3.2 * U, { lit: '#8E9A6E', shade: '#6E7A52', lw: PX * 0.8 }); }
    if (near) { g.strokeStyle = '#E9F2F2'; g.lineWidth = PX; for (const [dx, dy, w] of [[-0.3, -0.1, 0.35], [0.15, 0.2, 0.28]]) { g.beginPath(); g.moveTo(x + dx * r - w * r / 2, y + dy * r); g.quadraticCurveTo(x + dx * r, y + dy * r - 0.6 * U, x + dx * r + w * r / 2, y + dy * r); g.stroke(); } }
  }
  if (W2.brook) { // v3 critique 8: 0.9 to 2.4 u wide; 1.1 band px banks, the lower-right one #35535A at .8, the upper-left one paper ink at .55 on dark land
    const B = W2.brook, Lc = cumLen(B), tot = Lc[Lc.length - 1] || 1, left = [], right = [], nrm = [];
    for (let k = 0; k < B.length; k++) { const a = B[Math.max(0, k - 1)], b = B[Math.min(B.length - 1, k + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = -(b[1] - a[1]) / l, ny = (b[0] - a[0]) / l, w = (0.9 + 1.5 * (Lc[k] / tot)) * U / 2; left.push([B[k][0] + nx * w, B[k][1] + ny * w]); right.push([B[k][0] - nx * w, B[k][1] - ny * w]); nrm.push([nx, ny]); }
    g.beginPath(); left.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); for (let k = right.length - 1; k >= 0; k--) g.lineTo(...right[k]); g.closePath(); g.fillStyle = '#BCD6D9'; g.fill();
    const dark = DARK_T.has(terr[i]), lo = new Path2D(), hi = new Path2D();
    for (const [side, sg] of [[left, 1], [right, -1]]) for (let k = 0; k < side.length - 1; k++) { const n = nrm[k], lower = (n[0] + n[1]) * sg > 0, pth = lower ? lo : hi; pth.moveTo(...side[k]); pth.lineTo(...side[k + 1]); }
    g.lineJoin = 'round'; g.lineCap = 'round'; g.lineWidth = 1.1 * PX; g.strokeStyle = 'rgba(53,83,90,.8)'; g.stroke(lo);
    if (dark) { g.strokeStyle = 'rgba(232,220,194,.55)'; g.stroke(hi); } else if (PAINTED_PAL() && terr[i] === 'mountains') { g.strokeStyle = 'rgba(53,83,90,.8)'; g.stroke(hi); } // fix 5: both banks at 1.1 band px and .8
    else { g.lineWidth = 0.8 * PX; g.strokeStyle = 'rgba(53,83,90,.55)'; g.stroke(hi); }
    g.lineCap = 'butt'; g.lineWidth = 0.8 * PX; g.strokeStyle = 'rgba(53,83,90,.7)';
    g.fillStyle = '#BCD6D9'; g.beginPath(); g.arc(B[0][0], B[0][1], 1.4 * U, 0, Math.PI * 2); g.fill(); g.stroke();
  }
  for (const h of feats().tracks) { if (h.s !== i) continue; const br = feats().bridges.get(h.key); if (!br) continue; // v3 critique 8: the map sign for a bridge
    for (const b of br) { // two parapet lines 5 u long along the track, the brook's width + 2 u apart, each end flared outward by a 1.2 u tick at 30 degrees; no fill
      g.save(); g.translate(b.x, b.y); g.rotate(b.ang); const L = 2.5 * U, yp = (b.w + 2 * U) / 2, tx = 1.2 * U * Math.cos(Math.PI / 6), ty = 1.2 * U * Math.sin(Math.PI / 6);
      g.strokeStyle = b.ink ?? FEATURE_INK; g.lineWidth = 0.9 * PX; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath();
      for (const sy of [-1, 1]) { g.moveTo(-L - tx, sy * (yp + ty)); g.lineTo(-L, sy * yp); g.lineTo(L, sy * yp); g.lineTo(L + tx, sy * (yp + ty)); }
      g.stroke(); g.lineCap = 'butt'; g.restore(); } }
}

// ---- tracks, drawn live (H4): 1.8 px dots every 2.5 to 3 px at every zoom, from the border inward on both sides
const TRACK_DOTS = new Map();
function trackDots(h, sp) { // world positions of the dots along one half (stable between re-layouts: q steps by quarter octaves)
  const k = h.key + ':' + sp.toFixed(5); let v = TRACK_DOTS.get(k); if (v) return v;
  v = []; const n = Math.floor(h.len / sp);
  for (let m = 0; m <= n; m++) {
    const d = (m + 0.15 * ((h32(h.key + ':' + m) / 4294967296 - 0.5) * 2)) * sp; if (d < 0 || d > h.len) continue;
    if (d < h.lastLen) { const b = Math.min(h.lastOk.length - 1, Math.round(d / (0.5 * U))); if (!h.lastOk[b]) continue; }
    const q = arcAt(h.pts, h.L, d); v.push(q[0], q[1], d);
  }
  v = Float32Array.from(v); TRACK_DOTS.set(k, v); if (TRACK_DOTS.size > 4000) TRACK_DOTS.clear(); return v;
}
function drawTracks(g, band, labelBoxes) {
  if (band === 'far' || !PAINTED()) return;
  const sel = state.sel && state.sel.type === 'cmd';
  const alpha = view.pass || sel ? 1 : decoAlpha; if (alpha < 0.01) return;
  const s = cam.s, q = 2 ** (Math.floor(Math.log2(s) * 4) / 4), sp = 2.5 / q, r = 0.9 / s, gap = 3 / s;
  const cross = view.tracks === 'crossings' && band === 'mid';
  const byInk = { [FEATURE_INK]: [], [PAPER_INK]: [] };
  for (const h of feats().tracks) {
    if (h.bb[2] < VW[0] - 5 || h.bb[0] > VW[2] + 5 || h.bb[3] < VW[1] - 5 || h.bb[1] > VW[3] + 5) continue;
    const dots = trackDots(h, sp), lim = cross ? h.len / 3 : Infinity, list = byInk[h.ink], z = zones(h.s, band), lz = [z[0], z[1]], m2 = 2 / s;
    // v3 critique 7: a run shorter than 4 dots is dropped (a road that stops reads as a dead end), except the run at the border, which meets
    // the neighbor's; runs break at the label zone, at the live labels and at the junction rule's gaps
    let run = [], atBorder = true, prevD = -1;
    const flush = () => { if (run.length >= 8 || (atBorder && run.length)) list.push(...run); run = []; atBorder = false; };
    for (let m = 0; m < dots.length; m += 3) {
      const x = dots[m], y = dots[m + 1], d = dots[m + 2]; if (d < gap) continue; if (d > lim) break;
      if (prevD >= 0 && d - prevD > 1.6 * sp) flush(); prevD = d;
      if (inBoxes(lz, x, y, m2)) { flush(); continue; } // the fixed label zone (the name and its second line) plus 2 px
      const sx = x * s + cam.x, sy = y * s + cam.y; if (labelBoxes && inBoxes(labelBoxes, sx, sy, 2)) { flush(); continue; } // the live names and tokens
      run.push(x, y);
    }
    flush();
  }
  g.globalAlpha = alpha;
  for (const [ink, L] of Object.entries(byInk)) { if (!L.length) continue; g.fillStyle = ink; g.beginPath(); for (let m = 0; m < L.length; m += 2) { g.moveTo(L[m] + r, L[m + 1]); g.arc(L[m], L[m + 1], r, 0, Math.PI * 2); } g.fill(); }
  g.globalAlpha = 1;
}
