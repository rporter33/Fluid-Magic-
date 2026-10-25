
// ------------------------------------------------------------------ v4 relief: the lit-bead rails, internal keylines and neutral hairlines (map-relief §5.1, natural §8.2), water, wild contours
// natural §8.2 (both looks): each shared edge keeps ONE keyline (light #F4EEDF or dark #1C1A17) along its whole length, the one that reaches the target on the most of its
// 0.1 D segments; per segment its alpha is the smallest that brings the antialiased pixel to the target against the p10 and p90 of the ground on both sides (in each
// province's fog state, at the drawn mip), raised to its neighbours' (a running maximum); where it cannot serve one side, a 1.5 px partner of the other keyline runs on
// that side. Lines never dash unless fog says so (N10). Below device pixel ratio 1.5 the rail's banner is 2 px and the internal keyline 2.5 px (a fully covered pixel).
// AD critique fix 1: the neutral hairline is now a lit bevel (RL_P.bevel): the near-white anchor drew a white cell grid over the landscape; a light upper-left lip and a dark
// lower-right lip read as a seam in the model, each half solved against its own side. The internal keyline keeps the anchor-and-partner rule above.
const rlW = () => (dpr < 1.5 ? { d: 1.5, b: 2, l: 1.5, ib: 1.5, ik: RL_P.line.intW1, h: RL_P.line.hairW1, hp: RL_P.line.partnerW1, ip: RL_P.line.intPartnerW1, ph: RL_P.line.pairW1[0], pp: RL_P.line.pairW1[1] } : { d: 1, b: 1.5, l: 1, ib: 1.5, ik: 1, h: 1.5, hp: 1.5, ip: 1.5, ph: 1.5, pp: 1.5 });
function rlInset(i, delta) { // the convex cell inset by delta world units: one vertex per ring vertex (between edge k-1 and edge k)
  const E = RL_EDGES[i], n = E.length, out = new Array(n);
  for (let k = 0; k < n; k++) {
    const e0 = E[(k - 1 + n) % n], e1 = E[k];
    const p0 = [e0.a[0] + e0.nx * delta, e0.a[1] + e0.ny * delta], d0 = [e0.b[0] - e0.a[0], e0.b[1] - e0.a[1]], p1 = [e1.a[0] + e1.nx * delta, e1.a[1] + e1.ny * delta], d1 = [e1.b[0] - e1.a[0], e1.b[1] - e1.a[1]];
    const den = d0[0] * d1[1] - d0[1] * d1[0]; let v;
    if (Math.abs(den) > 1e-9) { const t = ((p1[0] - p0[0]) * d1[1] - (p1[1] - p0[1]) * d1[0]) / den; v = [p0[0] + d0[0] * t, p0[1] + d0[1] * t]; }
    if (!v || Math.hypot(v[0] - e1.a[0], v[1] - e1.a[1]) > 6 * delta) { const mx = e0.nx + e1.nx, my = e0.ny + e1.ny, ml = Math.hypot(mx, my) || 1; v = [e1.a[0] + (mx / ml) * delta, e1.a[1] + (my / ml) * delta]; }
    out[k] = v;
  }
  return out;
}
function rlRuns(i, pred) { // runs of consecutive edges (cyclic) for which pred holds: [[k0, k1], ...] inclusive
  const E = RL_EDGES[i], n = E.length, on = E.map((e) => pred(e)); if (on.every(Boolean)) return [[0, n - 1, true]];
  let s = on.findIndex((v) => !v); const runs = [];
  for (let c = 1; c <= n; c++) { const k = (s + c) % n; if (on[k] && !on[(k - 1 + n) % n]) { let m = k; while (on[(m + 1) % n] && (m + 1) % n !== k) m = (m + 1) % n; runs.push([k, m]); } }
  return runs;
}
function rlStrokeRun(g, V, k0, k1, n, closed) { g.beginPath(); if (closed) { V.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); return; } let k = k0; g.moveTo(...V[k]); for (;;) { k = (k + 1) % n; g.lineTo(...V[k]); if (k === (k1 + 1) % n) break; } }
// ---- the ground under a line: the drawn mip of the shown look's unwashed bake, each texel in its province's state (wash, realm tint, fog), on each side of the line
const RL_LINES = { cache: new Map(), key: '', drawn: [], stats: { edges: 0, segs: 0, partners: 0, flips: 0 } };
const rlMipLevel = () => { const tpp = RB.TX / (cam.s * dpr); return RL_DBG.mip != null ? RL_DBG.mip : tpp > 2.4 ? 2 : tpp > 1.2 ? 1 : 0; };
const rlLumOf = (r, g, b) => 0.2126 * s2l(r) + 0.7152 * s2l(g) + 0.0722 * s2l(b);
const rlCR = (l1, l2) => (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
function rlStateOf(i, look, interior) { // how a province's texels are changed on screen: wash, realm tint, haze (the hem's peak at a line; the interior haze under a seat), desaturation
  const F = RL_P.fog[look], f = fogOf(i), p = prov[i], wash = state.mode === 'ownership' && decoTo >= 0.5 ? rlWashOf(i, true) : 0;
  return { wc: wash ? hex2rgb(RL_WASH[p.dom.n][0]) : null, wa: wash, tint: view.tint && p.owner && state.mode === 'ownership' ? hex2rgb(BAN[p.owner]) : null, haze: f === 'unexplored' ? (interior ? F.haze : F.hemPeak) : 0, sat: f === 'unexplored' ? F.unexSat : f === 'outofsight' ? F.outSat : 0 };
}
function rlApplyState(c, S) { // the composite's order: wash (in the bake), realm tint, haze, then the saturation blend toward grey of the same 0.3/0.59/0.11 luma
  let [r, g, b] = c; if (S.wc) { r = r * (1 - S.wa) + S.wc[0] * S.wa; g = g * (1 - S.wa) + S.wc[1] * S.wa; b = b * (1 - S.wa) + S.wc[2] * S.wa; }
  if (S.tint) { const a = RL_P.realmTint; r += (S.tint[0] - r) * a; g += (S.tint[1] - g) * a; b += (S.tint[2] - b) * a; }
  if (S.haze) { const G0 = RL_GESSO; r += (G0[0] - r) * S.haze; g += (G0[1] - g) * S.haze; b += (G0[2] - b) * S.haze; }
  if (S.sat) { const Y = 0.3 * r + 0.59 * g + 0.11 * b; r += (Y - r) * S.sat; g += (Y - g) * S.sat; b += (Y - b) * S.sat; }
  if (S.hov) { const [H, a] = S.hov; r += (H[0] - r) * a; g += (H[1] - g) * a; b += (H[2] - b) * a; } // pass 2: the live hover or selection tint, drawn over the composite
  return [r, g, b];
}
const RL_GESSO = hex2rgb(RL_C.gesso);
// in a data mode the land on screen is the mode raster (flat fills under the gentle relief, no fog), so the lines are solved against it
const rlDataGround = () => (state.mode !== 'ownership' && state.mode !== 'terrain' && decoTo < 0.5 ? rlModeRaster() : null);
function rlGroundSides(x0, y0, x1, y1, nx, ny, look, lvl, states, offs) { // [lower-right side, upper-left side]: sorted luminance samples with colours (offs: the lower-right side only, at these px)
  const Lk = RB.L[look], src = lvl === 2 ? Lk.mb2 : lvl === 1 ? Lk.mb1 : Lk.img, w = src.width, h = src.height, f = (RB.TX * w) / RB.BW, d = src.data, { BW, TX, HW, id, LT } = RB, MR = rlDataGround(), md = MR && MR.img.data;
  const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(2, Math.ceil(L * f) + 1), px = 1 / cam.s, out = [[], [], []]; // lower-right, upper-left, and directly under the line
  for (let s = 0; s < (offs ? 1 : 2); s++) for (const o of offs ?? [0, 0.75, 1.5, 2.25, 3]) for (let t = 0; t < n; t++) { // from under the line (thin hedges and shores on the border) to 3 px out
    const q = (t + 0.5) / n, sg = s ? -1 : 1, x = x0 + (x1 - x0) * q + nx * o * px * sg, y = y0 + (y1 - y0) * q + ny * o * px * sg, tx = Math.floor(x * f), ty = Math.floor(y * f);
    if (tx < 0 || ty < 0 || tx >= w || ty >= h) continue; const kk = (ty * w + tx) * 4; if (d[kk + 3] < 255) continue;
    const fk = Math.floor(y * TX) * BW + Math.floor(x * TX), pid = id[fk]; if (pid === 255 || LT[fk] >= 7) continue;
    let c; if (md) { const hk = (Math.floor((y * TX) / 2) * HW + Math.floor((x * TX) / 2)) * 4; if (md[hk + 3] < 255) continue; c = [md[hk], md[hk + 1], md[hk + 2]]; }
    else { let S = states.get(pid); if (!S) { S = rlStateOf(pid, look); states.set(pid, S); } c = rlApplyState([d[kk], d[kk + 1], d[kk + 2]], S); }
    const qq = [rlLumOf(...c), ...c]; out[s].push(qq); if (o === 0 && s === 0) out[2].push(qq);
  }
  for (const a of out) a.sort((p, q) => p[0] - q[0]);
  return out;
}
const rlQ = (a, f) => a[Math.min(a.length - 1, Math.floor(f * a.length))];
const RL_KEYS = { light: hex2rgb(RL_C.keyLight), dark: hex2rgb(RL_C.keyDark) };
function rlWorst(G, K, a, cov) { let m = Infinity; for (const g of G) { const e = a * cov, c = [g[1] * (1 - e) + K[0] * e, g[2] * (1 - e) + K[1] * e, g[3] * (1 - e) + K[2] * e]; m = Math.min(m, rlCR(rlLumOf(...c), g[0])); } return m; }
function rlAlphaFor(G, K, target, cov, cap) { // the smallest alpha (<= cap) that reaches the target against every ground quantile in G; null if the cap does not
  if (!G.length) return 0.7; if (rlWorst(G, K, cap, cov) < target) return null;
  let lo = 0, hi = cap; for (let it = 0; it < 14; it++) { const m = (lo + hi) / 2; if (rlWorst(G, K, m, cov) >= target) hi = m; else lo = m; } return hi;
}
const rlPQ = (a) => (a.length ? [rlQ(a, RL_P.line.q), rlQ(a, 1 - RL_P.line.q)] : []);
function rlSegStyles(e, kind, ctx) { // kind 'hair' or 'int'; ctx: { look, lvl, states, key }
  const ck = ctx.key + '|' + kind + '|' + e.i + '-' + e.j; let v = RL_LINES.cache.get(ck); if (v) return v;
  const LP = RL_P.line, [ax, ay] = e.a, [bx, by] = e.b, Lw = Math.hypot(bx - ax, by - ay) || 1, n = Math.max(1, Math.ceil(Lw / (LP.segD * RLD)));
  let nx = -(by - ay) / Lw, ny = (bx - ax) / Lw; if (nx + ny < 0) { nx = -nx; ny = -ny; }
  const BV = RL_P.bevel, pq = kind === 'hair' ? (a) => (a.length ? [rlQ(a, BV.q), rlQ(a, 1 - BV.q)] : []) : rlPQ;
  const S = []; for (let s = 0; s < n; s++) { const x0 = ax + ((bx - ax) * s) / n, y0 = ay + ((by - ay) * s) / n, x1 = ax + ((bx - ax) * (s + 1)) / n, y1 = ay + ((by - ay) * (s + 1)) / n, [lr, ul, on] = rlGroundSides(x0, y0, x1, y1, nx, ny, ctx.look, ctx.lvl, ctx.states); S.push({ x0, y0, x1, y1, lr: pq(lr), ul: pq(ul), on: on.length ? [on[0], on[on.length - 1]] : [] }); } // the ground the line covers: its extremes too (a hedge or a shore along the border)
  if (kind === 'hair' && BV.looks.includes(ctx.look)) { // AD fix 1: the lit bevel. Each half is solved on its own side only; its key holds along the whole edge (no flips, no partner, no running maximum)
    const solve = (side, kn, cov = BV.cov) => S.map((sg) => rlAlphaFor([...sg[side], ...sg.on], RL_KEYS[kn], BV.T, cov, BV.cap)), okN = (al) => al.filter((a) => a != null).length, fill = (al) => al.map((a) => a ?? BV.cap), need = S.length * BV.keep;
    const U1 = solve('ul', 'light'), L1 = solve('lr', 'dark'), uOK = okN(U1) >= need, lOK = okN(L1) >= need; // the model's light comes from the upper left: the upper-left lip is lit, the lower-right lip in shade
    let U = uOK ? { key: 'light', al: fill(U1) } : null, Lr = lOK ? { key: 'dark', al: fill(L1) } : null;
    // a lip whose key cannot reach the floor on its own side on two-thirds of the edge: the critique's rule gives it the other key for the whole edge. On the natural grounds
    // that doubled the light lip on 63 of 73 edges (the dark key fails against dark ground), a 3 px light line. So where the other lip's key serves this side as well, the lip
    // stays a soft shade of its own key (BV.shade, BV.lit) and the other lip is solved against both sides; only where neither serves does it take the other key, solved
    // per segment, where the solved lip cannot serve (its key misses on either side there), the soft lip steps up: solved in its own key, at full width (keys never change along an edge)
    if (!Lr) { const L2 = solve('lr', 'light'); if (BV.soft && uOK && okN(L2) >= need) { const up = S.map((_, s) => U1[s] == null || L2[s] == null); Lr = { key: 'dark', al: S.map((_, s) => (up[s] ? L1[s] ?? BV.cap : BV.shade)), soft: true, up }; U.al = U.al.map((a, s) => Math.max(a, L2[s] ?? BV.cap)); } else Lr = okN(L2) > okN(L1) ? { key: 'light', al: fill(L2) } : { key: 'dark', al: fill(L1) }; }
    if (!U) { const U2 = solve('ul', 'dark'); if (BV.soft && lOK && okN(U2) >= need) { const up = S.map((_, s) => L1[s] == null || U2[s] == null); U = { key: 'light', al: S.map((_, s) => (up[s] ? U1[s] ?? BV.cap : BV.lit)), soft: true, up }; Lr.al = Lr.al.map((a, s) => Math.max(a, U2[s] ?? BV.cap)); } else U = okN(U2) > okN(U1) ? { key: 'dark', al: fill(U2) } : { key: 'light', al: fill(U1) }; }
    // two solved lips of opposite keys share their antialiased pixel below ratio 1.5 (each 1.5 px wide leaves no fully covered pixel, and each spills into the other): solved at coverage BV.cov1
    if (!U.soft && !Lr.soft && U.key !== Lr.key && dpr < 1.5) { U.al = fill(solve('ul', U.key, BV.cov1)); Lr.al = fill(solve('lr', Lr.key, BV.cov1)); }
    const soft = U.soft ? 'ul' : Lr.soft ? 'lr' : null, wLit = dpr < 1.5 ? BV.wLit1 : BV.w, up = (U.up ?? Lr.up ?? []), wUL = (s) => (up[s] || !soft ? BV.w : soft === 'lr' ? wLit : 2 * BV.w - wLit); // the solved lip of a soft pair is 2 px below ratio 1.5 (a fully covered pixel)
    v = { segs: S.map((sg, s) => ({ x0: sg.x0, y0: sg.y0, x1: sg.x1, y1: sg.y1, key: U.key, alpha: U.al[s], partner: null, bevel: { ul: { key: U.key, a: U.al[s], w: wUL(s) }, lr: { key: Lr.key, a: Lr.al[s], w: 2 * BV.w - wUL(s) }, soft: up[s] ? null : soft } })), key: U.key, keyLR: Lr.key, soft, stepUps: up.filter(Boolean).length, nx, ny };
    RL_LINES.cache.set(ck, v); if (RL_LINES.cache.size > 4000) RL_LINES.cache.clear(); return v;
  }
  if (kind === 'int') return rlIntStyles(e, S, ctx, nx, ny, ck);
  const hair = kind === 'hair', T = hair ? LP.hair : LP.internal, cov = hair ? LP.hairCov : 1, cap = hair ? LP.hairCap : 1, both = (sg) => (hair ? [...sg.lr, ...sg.ul, ...sg.on] : sg.lr);
  let best = null; // the anchor: the keyline that reaches the target on the most segments (ties: the lower mean alpha)
  for (const kn of ['light', 'dark']) { const al = S.map((sg) => rlAlphaFor(both(sg), RL_KEYS[kn], T, cov, cap)), ok = al.filter((a) => a != null), score = ok.length - 0.001 * ok.reduce((p, q) => p + q, 0); if (!best || score > best.score) best = { kn, al, score }; }
  const other = best.kn === 'dark' ? 'light' : 'dark';
  v = S.map((sg, s) => {
    let a = best.al[s], partner = null;
    if (a == null) {
      if (hair) { // the anchor serves the side it can; the other keyline goes beside it on the side it cannot
        const aL = rlAlphaFor(sg.lr, RL_KEYS[best.kn], T, cov, cap), aU = rlAlphaFor(sg.ul, RL_KEYS[best.kn], T, cov, cap);
        a = Math.max(aL ?? 0, aU ?? 0) || cap; let side = aL == null ? 1 : -1;
        if (aL == null && aU == null) { const lk = rlLumOf(...RL_KEYS[best.kn]), m = (q) => (q.length ? (q[0][0] + q[1][0]) / 2 : lk); side = Math.abs(m(sg.lr) - lk) < Math.abs(m(sg.ul) - lk) ? 1 : -1; }
        partner = { key: other, side, both: aL == null && aU == null }; // both: the anchor fails on both sides, so either side serves
      } else { a = 1; partner = { key: other, side: 1 }; }
    }
    return { x0: sg.x0, y0: sg.y0, x1: sg.x1, y1: sg.y1, key: best.kn, alpha0: hair ? a : 1, partner };
  });
  for (let s = 0; s < v.length; s++) v[s].alpha = hair ? Math.min(cap, Math.max(v[s].alpha0, s > 0 ? v[s - 1].alpha0 : 0, s < v.length - 1 ? v[s + 1].alpha0 : 0)) : 1;
  // a partner that came and went per 0.1 D segment read as dashes at Near (and dashes mean fog, N10): it runs on along the whole edge where a third of it needs one,
  // and elsewhere it is widened by a segment either side, with gaps of up to two segments closed, so it reads as a second line, not a dashed one
  const n1 = v.filter((x) => x.partner && x.partner.side === 1).length, n2 = v.filter((x) => x.partner && x.partner.side === -1).length, major = n1 >= n2 ? 1 : -1;
  for (const x of v) if (x.partner && x.partner.both) x.partner.side = major; // where either side serves, the edge's majority side (a partner that swapped sides read as a twisted line)
  { const sd = major; // a solved partner keeps the side its anchor fails on; the extension runs on the edge's majority side only
    const has = v.map((x) => !!(x.partner && x.partner.side === sd)), nh = has.filter(Boolean).length;
    const fill = !nh ? has : nh / v.length >= 1 / 3 ? v.map(() => true) : has.map((h, s) => h || !!has[s - 1] || !!has[s + 1]);
    if (nh) for (let s = 0; s < fill.length; s++) if (!fill[s]) { let e = s; while (e < fill.length && !fill[e]) e++; if (s > 0 && e < fill.length && e - s <= 2) for (let q = s; q < e; q++) fill[q] = true; s = e; }
    v.forEach((x, s) => { if (fill[s] && !x.partner) x.partner = { key: other, side: sd, extended: true }; });
  }
  const out = { segs: v, key: best.kn, nx, ny }; RL_LINES.cache.set(ck, out); if (RL_LINES.cache.size > 4000) RL_LINES.cache.clear(); return out;
}
// pass 2 (the Clear internal keyline stayed open, natural §8.2): the internal line is the banner half, then the keyline and, where it cannot serve, a partner of the other key,
// on the lower-right side. The keyline (0 to 2.5 px) and the partner (2.5 to 5 px) each lie on their own band of ground. Where the warp fringe puts a light ground at the border
// and a dark one beyond (Kharnath/Briarmoor), a partner beyond the keyline served nothing (3.09:1). So the order is chosen per edge with the anchor: keyline at the border and
// partner beyond (as before), or partner at the border and keyline beyond, whichever serves the most segments (the near order only when it serves more). Keys never change along an edge.
function rlIntStyles(e, S, ctx, nx, ny, ck) {
  const T = RL_P.line.internal, near = [0.25, 0.75, 1.25, 1.75, 2.25], far = [2.75, 3.25, 3.75, 4.25, 4.75], pq = rlPQ;
  const B = S.map((sg) => ({ n: pq(rlGroundSides(sg.x0, sg.y0, sg.x1, sg.y1, nx, ny, ctx.look, ctx.lvl, ctx.states, near)[0]), f: pq(rlGroundSides(sg.x0, sg.y0, sg.x1, sg.y1, nx, ny, ctx.look, ctx.lvl, ctx.states, far)[0]) }));
  const ok = (G, kn) => rlAlphaFor(G, RL_KEYS[kn], T, 1, 1) != null; let best = null;
  for (const kn of ['light', 'dark']) for (const ord of ['far', 'near']) {
    const other = kn === 'dark' ? 'light' : 'dark', aOK = B.map((b) => ok(ord === 'far' ? b.n : b.f, kn)), pOK = B.map((b) => ok(ord === 'far' ? b.f : b.n, other)), pass = aOK.filter((a, k) => a || pOK[k]).length;
    const score = pass * 10 + aOK.filter(Boolean).length - (ord === 'near' ? 5 : 0); if (!best || score > best.score) best = { kn, ord, other, aOK, score };
  }
  const v = S.map((sg, k) => ({ x0: sg.x0, y0: sg.y0, x1: sg.x1, y1: sg.y1, key: best.kn, alpha0: 1, alpha: 1, partner: best.aOK[k] ? null : { key: best.other, side: 1 } }));
  { const has = v.map((x) => !!x.partner), nh = has.filter(Boolean).length; // the partner's runs: the whole edge where a third needs one; else widened a segment and gaps of two closed
    const fill = !nh ? has : nh / v.length >= 1 / 3 ? v.map(() => true) : has.map((h, k) => h || !!has[k - 1] || !!has[k + 1]);
    if (nh) for (let k = 0; k < fill.length; k++) if (!fill[k]) { let q = k; while (q < fill.length && !fill[q]) q++; if (k > 0 && q < fill.length && q - k <= 2) for (let r = k; r < q; r++) fill[r] = true; k = q; }
    v.forEach((x, k) => { if (fill[k] && !x.partner) x.partner = { key: best.other, side: 1, extended: true }; }); }
  const out = { segs: v, key: best.kn, order: best.ord, nx, ny }; RL_LINES.cache.set(ck, out); if (RL_LINES.cache.size > 4000) RL_LINES.cache.clear(); return out;
}
function rlLineCtx() { // the cache key: the map, the look, the drawn mip, a zoom step (the side width), the provinces' states, the device pixel class
  const look = rlShownLook(), lvl = rlMipLevel(), st = provList.map((i) => (fogOf(i) ?? '-')[0] + (state.mode === 'ownership' && decoTo >= 0.5 ? rlWashOf(i, true).toFixed(3) : '0')).join(',');
  const MR = rlDataGround();
  return { look, lvl, states: new Map(), key: [RB.ver, RB.lookVer, look, lvl, MR ? 'm' + MR.ver : '', Math.round(Math.log2(cam.s) * 4), st, view.tint && state.mode === 'ownership', dpr < 1.5 ? 1 : 2].join('|') };
}
function rlCtxTinted(ctx, i, sel) { // pass 2: the line ground of a hovered or selected province carries its tint (Ownership), so its floor lines are solved on what is drawn
  if (state.mode !== 'ownership' || i < 0) return ctx; const [c, a] = rlTintOf(i, sel), states = new Map(ctx.states); states.set(i, { ...rlStateOf(i, ctx.look), hov: [hex2rgb(c), a] });
  return { ...ctx, states, key: ctx.key + '|t' + i + (sel ? 's' : 'h') };
}
function rlDrawRails(g, band, px, opts = {}) {
  const w = rlW(), gap = 1, D1 = gap + w.d / 2, D2 = gap + w.d + w.b / 2, D3 = gap + w.d + w.b + w.l / 2, vw = VW, extra = opts.extra ?? 0;
  const seen = (bb) => bb[2] > vw[0] - 5 && bb[0] < vw[2] + 5 && bb[3] > vw[1] - 5 && bb[1] < vw[3] + 5;
  g.lineCap = 'butt'; g.lineJoin = 'miter'; g.miterLimit = 4;
  const list = opts.only != null ? [opts.only] : provList;
  for (const i of list) {
    const p = prov[i]; if (!p.owner) continue; const bb = geo(i).bb; if (!seen(bb)) continue; const E = RL_EDGES[i], n = E.length;
    const runs = rlRuns(i, (e) => isRealmEdge(i, e)); if (!runs.length) continue;
    for (const [col, delta, lw] of [[RL_C.keyDark, D1, w.d], [BAN[p.owner], D2 + extra / 2, w.b + extra], [RL_C.keyLight, D3 + extra, w.l]]) {
      const V = rlInset(i, delta * px); g.strokeStyle = col; g.lineWidth = lw * px;
      for (const [k0, k1, all] of runs) {
        const fogged = (() => { for (let k = k0; ; k = (k + 1) % n) { const e = E[k]; if (!(fogOf(i) && fogOf(e.j))) return false; if (k === k1) return true; } })();
        if (fogged) g.setLineDash([2 * px, 3 * px]);
        rlStrokeRun(g, V, k0, k1, n, all); g.stroke(); if (fogged) g.setLineDash([]);
      }
    }
  }
  if (opts.only != null || !RB.ready) return;
  const ctx = rlLineCtx(), drawn = [], faintOn = rlFaintOn(), sp = state.sel && state.sel.type === 'prov' ? state.sel.id : -1; RL_LINES.stats = { edges: 0, segs: 0, partners: 0, flips: 0, maxWidthPx: 0, faint: 0 };
  for (const [, e] of EDGE) { // internal keylines and neutral hairlines, once per shared edge
    const i = e.i, j = e.j, kind = rlEdgeKind(e, band); if (!kind) continue;
    const b = e.bb ?? (e.bb = bboxOf(e.wobble)); if (!seen(b)) continue;
    const fog = !!(fogOf(i) && fogOf(j)), faint = faintOn && i !== sp && j !== sp; // pass 2: faint in the natural view, at the floor around the selected province (the hovered one is live, rlDraw)
    if (faint) { const f = rlFaintStyle(e, kind, ctx); rlStrokeFaint(g, e, f, px, fog); RL_LINES.stats.faint++; drawn.push({ e, i, j, kind, faint: true, alpha: f.a, col: f.col, fog }); continue; }
    const st = rlEdgeFloor(g, e, kind, faintOn ? rlCtxTinted(ctx, sp, true) : ctx, px, fog, w, RL_LINES.stats);
    drawn.push({ e, i, j, kind, key: st.key, keyLR: st.keyLR ?? null, soft: st.soft ?? null, segs: st.segs.length, partners: st.segs.filter((s) => s.partner).length, fog });
  }
  RL_LINES.drawn = drawn;
}
// pass 2: which line a shared edge carries: 'int' (one owner, Mid and Near), 'hair' (neutral, or one owner at Far), or null (a realm edge, which has its rails, or a wild)
function rlEdgeKind(e, band) { const i = e.i, j = e.j; if (isWild(i) || isWild(j)) return null; const oi = prov[i].owner, oj = prov[j].owner; if (oi && oi === oj && band !== 'far') return 'int'; return (!oi && !oj) || (oi && oi === oj) ? 'hair' : null; }
const rlFaintOn = () => rlShownLook() === 'natural' && state.mode === 'ownership' && !RL_DBG.noFaint; // the natural view (Clear, the Terrain mode and the data modes keep every line at the floor)
function rlFaintStyle(e, kind, ctx) { // the faint line's colour and the smallest alpha (in [minA, capA]) that lifts it to T against the median ground of each side, at coverage 1
  const ck = ctx.key + '|faint|' + kind + '|' + e.i + '-' + e.j; let v = RL_LINES.cache.get(ck); if (v) return v;
  const FP = RL_P.faint, [ax, ay] = e.a, [bx, by] = e.b, Lw = Math.hypot(bx - ax, by - ay) || 1; let nx = -(by - ay) / Lw, ny = (bx - ax) / Lw; if (nx + ny < 0) { nx = -nx; ny = -ny; }
  const [lr, ul, on] = rlGroundSides(ax, ay, bx, by, nx, ny, ctx.look, ctx.lvl, ctx.states), med = (a) => (a.length ? [rlQ(a, 0.5)] : []);
  const ban = kind === 'int' ? hex2rgb(BAN[prov[e.i].owner]) : null, K = ban ? ban.map((c, q) => c + (RL_KEYS.light[q] - c) * FP.intMix) : RL_KEYS.light;
  const G = [...med(lr), ...med(ul), ...med(on)], a0 = rlAlphaFor(G, K, FP.T, 1, FP.capA);
  v = { a: Math.max(FP.minA, a0 ?? FP.capA), col: rgb2hex(K.map((c) => Math.round(c))), nx, ny }; RL_LINES.cache.set(ck, v); if (RL_LINES.cache.size > 4000) RL_LINES.cache.clear(); return v;
}
function rlStrokeFaint(g, e, f, px, fog) { // one stroke along the whole edge (no joints), dashed only in fog
  g.strokeStyle = rgba(f.col, +f.a.toFixed(3)); g.lineWidth = RL_P.faint.w * px; if (fog) g.setLineDash([2 * px, 3 * px]);
  g.beginPath(); g.moveTo(...e.a); g.lineTo(...e.b); g.stroke(); if (fog) g.setLineDash([]);
}
// the floor style of one edge (both looks; natural §8.2 and the AD bevel), drawn in runs: a constant colour along the edge is one path, so its antialiased
// segment ends never meet at a joint (pass 2: the internal keyline dipped under 3.2:1 where two 0.1 D segments abutted, two partial coverages composited short of one)
function rlEdgeFloor(g, e, kind, ctx, px, fog, w, stats) {
  const internal = kind === 'int', st = rlSegStyles(e, kind, ctx), { nx, ny } = st, key = (k) => (k === 'light' ? RL_C.keyLight : RL_C.keyDark), S = st.segs; let run = 0;
  if (fog) g.setLineDash([2 * px, 3 * px]);
  const ex = (sg) => { const L = Math.hypot(sg.x1 - sg.x0, sg.y1 - sg.y0) || 1, ux = (sg.x1 - sg.x0) / L, uy = (sg.y1 - sg.y0) / L, e0 = sg.x0 === S[0].x0 && sg.y0 === S[0].y0 ? 0 : 0.5 * px, e1 = sg.x1 === S[S.length - 1].x1 && sg.y1 === S[S.length - 1].y1 ? 0 : 0.5 * px; return [sg.x0 - ux * e0, sg.y0 - uy * e0, sg.x1 + ux * e1, sg.y1 + uy * e1]; }; // pass 2: inner joints overlap by 1 px (two partial coverages composited short of one: Redbarrow/Ashmoor 2.28:1 at a joint)
  const stroke = (sg, off, lw, col) => { const [x0, y0, x1, y1] = ex(sg); g.strokeStyle = col; g.lineWidth = lw * px; if (fog) g.lineDashOffset = -run; g.beginPath(); g.moveTo(x0 + nx * off * px, y0 + ny * off * px); g.lineTo(x1 + nx * off * px, y1 + ny * off * px); g.stroke(); };
  const span = (a, b) => ({ x0: S[a].x0, y0: S[a].y0, x1: S[b].x1, y1: S[b].y1 }), runs = (f) => { const out = []; for (let s = 0; s < S.length; s++) { const v = f(S[s]); if (v == null) continue; let t = s; while (t + 1 < S.length && f(S[t + 1]) === v) t++; out.push([s, t, v]); s = t; } return out; };
  if (internal) { // the banner half on the upper-left side, the anchored keyline on the lower-right, the partner beyond it: each colour one path per run
    const oi = prov[e.i].owner, nearO = st.order === 'near', ko = nearO ? w.ip + w.ik / 2 : w.ik / 2, po = nearO ? w.ip / 2 : w.ik + w.ip / 2; // the near order: partner at the border, keyline beyond
    stroke(span(0, S.length - 1), -w.ib / 2, w.ib, BAN[oi]); for (const [a, b, k] of runs((sg) => sg.key)) stroke(span(a, b), ko, w.ik, key(k));
    for (const [a, b, k] of runs((sg) => (sg.partner ? sg.partner.key : null))) stroke(span(a, b), po, w.ip, key(k));
  } else for (const sg of S) {
    run = 0; if (fog) for (const q of S) { if (q === sg) break; run += Math.hypot(q.x1 - q.x0, q.y1 - q.y0); }
    if (sg.bevel) { // AD fix 1: the lit bevel, two lips either side of the border (the upper-left lip on the -normal side), 3 px in all; a soft lip is drawn first
      const B = sg.bevel, ul = () => stroke(sg, -B.ul.w / 2, B.ul.w, rgba(key(B.ul.key), +B.ul.a.toFixed(3))), lr = () => stroke(sg, B.lr.w / 2, B.lr.w, rgba(key(B.lr.key), +B.lr.a.toFixed(3)));
      if (B.soft === 'ul') { ul(); lr(); } else { lr(); ul(); }
      stats.maxWidthPx = Math.max(stats.maxWidthPx, B.ul.w + B.lr.w);
    } else { // a partnered segment is 1.5 + 1.5 px at every ratio (RL_P.line.pairW1; no hairline wider than 3 px, natural §13); alone, the hairline is 2 px below ratio 1.5
      const diag = dpr < 1.5 && Math.abs(nx) > 0.34 && Math.abs(ny) > 0.34, hw = sg.partner ? (diag ? RL_P.line.pairDiagW1[0] : w.ph) : w.h, pw = sg.partner ? (diag ? RL_P.line.pairDiagW1[1] : w.pp) : 0, al = Math.min(1, (sg.alpha * w.h) / hw); stroke(sg, 0, hw, rgba(key(sg.key), +al.toFixed(3))); // narrowed, the anchor keeps its weight (alpha x width)
      if (sg.partner) stroke(sg, sg.partner.side * (hw + pw) / 2, pw, rgba(key(sg.partner.key), RL_P.line.partnerA));
      stats.maxWidthPx = Math.max(stats.maxWidthPx, sg.partner ? hw + pw : hw);
    }
  }
  for (const sg of S) { stats.segs++; if (sg.partner) stats.partners++; if (sg.key !== S[0].key || (sg.bevel && sg.bevel.lr.key !== S[0].bevel.lr.key)) stats.flips++; }
  if (fog) { g.setLineDash([]); g.lineDashOffset = 0; }
  stats.edges++; return st;
}
// pass 2: the hovered or linked province's own lines at the floor, drawn live over the faint ones (the natural view only; Clear and the Terrain mode draw every line at the floor)
function rlDrawProvFloor(g, i, px) {
  if (!RB.ready || !rlFaintOn() || i < 0 || isWild(i) || SKIP.has('rails')) return; const band = bandOf(cam.s), ctx = rlCtxTinted(rlLineCtx(), i, false), w = rlW(), stats = { edges: 0, segs: 0, partners: 0, flips: 0, maxWidthPx: 0 };
  g.save(); modelPath(g); g.clip(); g.lineCap = 'butt';
  for (const [, e] of EDGE) { if (e.i !== i && e.j !== i) continue; const kind = rlEdgeKind(e, band); if (!kind) continue; rlEdgeFloor(g, e, kind, ctx, px, !!(fogOf(e.i) && fogOf(e.j)), w, stats); }
  g.restore(); RL_LINES.live = { prov: i, ...stats };
}
// the hover and selection inner line, inside the rail (or at the border where there is none)
function rlInnerLine(g, i, px, width, alpha) { if (SKIP.has('rails')) return; // a line layer: off with the rails (the line checks' ground frame)
  const w = rlW(), hasRail = !!prov[i].owner && RL_EDGES[i].some((e) => isRealmEdge(i, e)), d = (hasRail ? 1 + w.d + w.b + w.l + 0.5 : rlFaintOn() ? 3 : 1) + width / 2; // pass 2: beyond the floor line's inner half (3 px) in the natural view, so the two never cancel
  const V = rlInset(i, d * px); g.save(); modelPath(g); g.clip(); g.strokeStyle = `rgba(244,238,223,${alpha})`; g.lineWidth = width * px; g.lineJoin = 'miter'; g.beginPath(); V.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.stroke(); g.restore();
}
function rlTintOf(i, sel) { // an independent is pulled toward the keyline of its own ground: the natural core's in Natural (§8.4), the Clear albedo's in Clear
  const p = prov[i]; if (p.owner) return [BAN[p.owner], sel ? RL_P.select : RL_P.hover];
  const nk = rlShownLook() === 'natural' && RB.L.natural && RB.L.natural.coreKey ? RB.L.natural.coreKey[i] : null;
  return [nk ?? RL_KEYFOR[p.terrain], sel ? RL_P.indepSelect : RL_P.indepHover];
}

// ---- water: lakes and ponds as smoothed polygons, streams as width-varying lines (vectors over the composite, §3.6); Natural water is the references' dark teal
const rlWaterCol = () => (rlShownLook() === 'natural' ? RL_C.waterNat : RL_C.water);
function rlDrawWater(g, px, alpha) {
  if (!RB.ready || alpha < 0.01 || SKIP.has('water')) return; const Wt = RB.water, wc = rlWaterCol(), shore = shadeL(wc, -3);
  // AD fix 9 (Natural; Clear and the Terrain mode as in v4): a quieter bank, so a pond is not a sticker (the lit bank drew a light ring; ponds sat 18 to 21 L* over a wood)
  const nat = rlShownLook() === 'natural', bank = nat ? { lit: 'rgba(236,240,226,.18)', litW: 0.6, shade: 'rgba(12,20,14,.25)', ripple: bandOf(cam.s) === 'near' ? 0.22 : 0.12 } : { lit: 'rgba(236,240,226,.42)', litW: 1.2, shade: 'rgba(12,20,14,.38)', ripple: 0.22 };
  g.save(); g.globalAlpha = alpha; modelPath(g); g.clip();
  for (const s of Wt.streams) {
    const P = s.pts, n = P.length; g.lineCap = 'round'; g.lineJoin = 'round';
    for (let k = 0; k < n - 1; k++) { const t = k / (n - 1), w = s.w0 + (s.w1 - s.w0) * t; g.strokeStyle = shore; g.lineWidth = w + 0.8; g.beginPath(); g.moveTo(...P[k]); g.lineTo(...P[k + 1]); g.stroke(); }
    for (let k = 0; k < n - 1; k++) { const t = k / (n - 1), w = s.w0 + (s.w1 - s.w0) * t; g.strokeStyle = wc; g.lineWidth = Math.max(0.6, w - 0.4); g.beginPath(); g.moveTo(...P[k]); g.lineTo(...P[k + 1]); g.stroke(); }
    g.strokeStyle = 'rgba(220,240,232,.35)'; g.lineWidth = Math.max(0.4, 0.6 * px); g.beginPath(); P.forEach(([x, y], k) => (k ? g.lineTo(x - 0.4, y - 0.4) : g.moveTo(x - 0.4, y - 0.4))); g.stroke();
  }
  for (const L of [...Wt.lakes, ...Wt.ponds]) {
    const path = () => { g.beginPath(); L.P.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
    g.save(); g.beginPath(); g.rect(-50, -50, W + 100, H + 100); L.P.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.clip('evenodd'); // the banks, outside the water
    g.translate(0.9 * RLK, 0.9 * RLK); g.strokeStyle = bank.lit; g.lineWidth = bank.litW * RLK; path(); g.stroke(); // the lit bank (south-east)
    g.translate(-1.8 * RLK, -1.8 * RLK); g.strokeStyle = bank.shade; g.lineWidth = 1.4 * RLK; path(); g.stroke(); g.restore(); // the shaded bank (north-west)
    path(); g.fillStyle = wc; g.fill();
    g.save(); path(); g.clip(); g.strokeStyle = shore; g.lineWidth = 3.2 * RLK; path(); g.stroke(); // the shore band, 3 L* darker
    g.strokeStyle = `rgba(232,246,240,${bank.ripple})`; g.lineWidth = 0.7 * RLK; const R = rngFor('ripple:' + L.i); for (let k = 0; k < 3; k++) { const x = L.x + (R() - 0.5) * 18 * RLK, y = L.y + (R() - 0.5) * 8 * RLK; g.beginPath(); g.ellipse(x, y, 5 * RLK, 1.1 * RLK, 0, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
    g.restore();
  }
  g.restore();
}
// ---- the wilds' contour (3 px ink) and light rim, never tinted, faded or fogged (approved)
function rlDrawWildContours(g, px) {
  for (const w of WILDS) {
    const ol = rlWildOutline(w), path = () => { g.beginPath(); for (const e of ol) { g.moveTo(...e.a); g.lineTo(...e.b); } };
    g.save(); g.beginPath(); for (const c of w.cells) { cells[c].forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); } g.clip();
    // pass 2: the rim shows 2 px inside the ink at 0.85 in every look and mode (v4: 1.5 to 2 px at 0.8 and 0.7), so a diagonal edge keeps a fully lit pixel (the verifier's
    // Ashspine/Morholt sample; Greyteeth/Marholt in Clear); the natural wilds' land runs up to it, so it reads as the footprint's edge, not a frame
    g.strokeStyle = `rgba(233,228,216,${view.pass ? 1 : 0.85})`; g.lineWidth = 7 * px; g.lineCap = 'round'; path(); g.stroke(); g.restore();
    g.strokeStyle = '#1C1A17'; g.lineWidth = 3 * px; g.lineCap = 'round'; path(); g.stroke(); g.lineCap = 'butt';
    if (view.pass) { g.strokeStyle = '#E9E4D8'; g.lineWidth = 4 * px; path(); g.stroke(); }
  }
}
