// In-memory prototype of the design's line, seat and label fixes (evaluated in the page through window.__mock.ev; the page file is untouched).
// 1. Hairlines and internal keylines adapt per segment to the bake under them (both views), with the coverage antialiasing leaves (0.75 at 1.5 px);
//    internal keylines are 2 CSS px below device pixel ratio 1.5 so a fully covered pixel always exists.
// 2. Hamlets, huts and town yards take their ground from the bake under the seat (its darker quartile), not the flat albedo.
// 3. A hovered or linked name never covers an arrow's or the path's day chip: it moves to the next free spot, or the chip is drawn again on top.
(() => {
  const lumOf = (r, g, b) => 0.2126 * s2l(r) + 0.7152 * s2l(g) + 0.0722 * s2l(b);
  const cr = (l1, l2) => (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  const KEYS = { light: hex2rgb(RL_C.keyLight), dark: hex2rgb(RL_C.keyDark) };
  window.NAT_LINES = { target: 2.45, internalTarget: 3.3, cov: 0.75, segD: 0.1, cache: new Map(), stats: { segs: 0, unreachable: 0 } };
  // the ground under a line: bake texels within 3 px either side, every texel along it; its p10 and p90 colours by luminance
  function groundAlong(ax, ay, bx, by, sideSel = 0) {
    const { BW, BH, TX } = RB, d = RB.img.data, L = Math.hypot(bx - ax, by - ay) || 1, n = Math.max(2, Math.ceil(L * TX)), nx = -(by - ay) / L, ny = (bx - ax) / L, side = 3 / Math.max(0.2, cam.s), out = [];
    for (let t = 0; t <= n; t++) for (let o = sideSel > 0 ? 0.25 / Math.max(0.2, cam.s) : -side; o <= (sideSel < 0 ? -0.25 / Math.max(0.2, cam.s) : side); o += Math.max(0.5 / TX, side / 4)) {
      const x = ax + ((bx - ax) * t) / n + nx * o, y = ay + ((by - ay) * t) / n + ny * o, tx = Math.floor(x * TX), ty = Math.floor(y * TX); if (tx < 0 || ty < 0 || tx >= BW || ty >= BH) continue;
      const k = (ty * BW + tx) * 4; if (d[k + 3] < 255 || RB.LT[ty * BW + tx] >= 7) continue; let c3 = [d[k], d[k + 1], d[k + 2]]; const pid = RB.id[ty * BW + tx]; if (window.__fogAware && pid !== 255 && !isWild(pid) && fogOf(pid) === 'unexplored') { const G0 = hex2rgb(RL_C.gesso), h = RL_P.hemPeak; c3 = c3.map((v, j) => v * (1 - h) + G0[j] * h); } out.push([lumOf(...c3), ...c3]);
    }
    out.sort((p, q) => p[0] - q[0]); if (!out.length) return null; const q = (f) => out[Math.min(out.length - 1, Math.floor(f * out.length))];
    return { p10: q(0.1), p50: q(0.5), p90: q(0.9) };
  }
  // the smallest alpha of a keyline (light or dark) whose antialiased pixel reaches the target against both p10 and p90 of the ground
  function solve(G, target, cov) {
    let best = null;
    for (const [kn, K] of Object.entries(KEYS)) {
      const worst = (a) => Math.min(...[G.p10, G.p90].map((g) => { const m = a * cov, c = [0, 1, 2].map((j) => g[j + 1] * (1 - m) + K[j] * m); return cr(lumOf(...c), g[0]); }));
      if (worst(1) < target) { if (!best || worst(1) > best.reach) best = { key: kn, alpha: 1, reach: worst(1), ok: false }; continue; }
      let lo = 0, hi = 1; for (let it = 0; it < 14; it++) { const m = (lo + hi) / 2; if (worst(m) >= target) hi = m; else lo = m; }
      if (!best || !best.ok || hi < best.alpha) best = { key: kn, alpha: hi, reach: worst(hi), ok: true };
    }
    return best;
  }
  function segStyles(e, kind) {
    const k = `${window.__fogVer || 0}|${RB.ver}|${RB.img.width}|${window.__natLook || 'clear'}|${e.i}-${e.j}|${kind}|${bandOf(cam.s)}|${dpr < 1.5 ? 1 : 2}`; let v = NAT_LINES.cache.get(k); if (v) return v;
    const [ax, ay] = e.a, [bx, by] = e.b, L = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.ceil(L / (NAT_LINES.segD * RLD))); v = [];
    for (let s = 0; s < n; s++) {
      const x0 = ax + ((bx - ax) * s) / n, y0 = ay + ((by - ay) * s) / n, x1 = ax + ((bx - ax) * (s + 1)) / n, y1 = ay + ((by - ay) * (s + 1)) / n, G = groundAlong(x0, y0, x1, y1);
      const r = G ? solve(G, kind === 'hair' ? NAT_LINES.target : NAT_LINES.internalTarget, kind === 'hair' ? NAT_LINES.cov : 1) : { key: 'dark', alpha: 0.7, ok: true };
      NAT_LINES.stats.segs++; if (!r.ok) NAT_LINES.stats.unreachable++; v.push({ x0, y0, x1, y1, ...r });
    }
    NAT_LINES.cache.set(k, v); return v;
  }
  function worstOf(G, K, a, cov) { return Math.min(...[G.p10, G.p90].map((g) => { const m = a * cov, c = [0, 1, 2].map((j) => g[j + 1] * (1 - m) + K[j] * m); return cr(lumOf(...c), g[0]); })); }
  function alphaFor(G, K, target, cov) { if (!G) return 0.7; if (worstOf(G, K, 1, cov) < target) return null; let lo = 0, hi = 1; for (let it = 0; it < 14; it++) { const m = (lo + hi) / 2; if (worstOf(G, K, m, cov) >= target) hi = m; else lo = m; } return hi; }
  window.NAT_LINES.stats3 = { edges: 0, segs: 0, partner: 0, flipsAvoided: 0 };
  function segStyles3(e) {
    const k = `A|${window.__fogVer || 0}|${RB.ver}|${RB.img.width}|${window.__natLook || 'clear'}|${e.i}-${e.j}|${dpr < 1.5 ? 1 : 2}|${bandOf(cam.s)}`; let v = NAT_LINES.cache.get(k); if (v) return v;
    const [ax, ay] = e.a, [bx, by] = e.b, L = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.ceil(L / (NAT_LINES.segD * RLD)));
    const T = NAT_LINES.target, cov = NAT_LINES.cov, S = [];
    for (let s = 0; s < n; s++) { const x0 = ax + ((bx - ax) * s) / n, y0 = ay + ((by - ay) * s) / n, x1 = ax + ((bx - ax) * (s + 1)) / n, y1 = ay + ((by - ay) * (s + 1)) / n;
      S.push({ x0, y0, x1, y1, G: groundAlong(x0, y0, x1, y1), Glr: groundAlong(x0, y0, x1, y1, 1), Gul: groundAlong(x0, y0, x1, y1, -1) }); }
    // the anchor: the keyline that reaches the target on the most segments (ties: the lower mean alpha)
    let best = null; for (const kn of ['dark', 'light']) { const al = S.map((sg) => alphaFor(sg.G, KEYS[kn], T, cov)); const ok = al.filter((a) => a != null); const score = ok.length - 0.001 * ok.reduce((p, q) => p + q, 0); if (!best || score > best.score) best = { kn, al, score }; }
    const other = best.kn === 'dark' ? 'light' : 'dark', flips = (() => { const per = S.map((sg) => { const r = solve(sg.G || { p10: [0, 64, 64, 64], p90: [0, 64, 64, 64] }, T, cov); return r.key; }); let f = 0; for (let s = 1; s < per.length; s++) if (per[s] !== per[s - 1]) f++; return f; })();
    v = S.map((sg, s) => {
      let a = best.al[s]; let partner = null;
      if (a == null) { // the anchor cannot serve both sides here: it serves the side it can, and the other keyline goes beside it on the side it cannot
        const aL = alphaFor(sg.Glr, KEYS[best.kn], T, cov), aU = alphaFor(sg.Gul, KEYS[best.kn], T, cov);
        a = Math.max(aL ?? 0, aU ?? 0) || 0.92; partner = { key: other, side: aL == null ? 1 : -1 };
        if (aL == null && aU == null) partner = { key: other, side: (sg.Glr && sg.Gul && Math.abs(sg.Glr.p50[0] - lumOf(...KEYS[best.kn])) < Math.abs(sg.Gul.p50[0] - lumOf(...KEYS[best.kn]))) ? 1 : -1 };
      }
      return { x0: sg.x0, y0: sg.y0, x1: sg.x1, y1: sg.y1, key: best.kn, alpha0: a, partner };
    });
    for (let s = 0; s < v.length; s++) v[s].alpha = Math.min(0.92, Math.max(v[s].alpha0, s > 0 ? v[s - 1].alpha0 : 0, s < v.length - 1 ? v[s + 1].alpha0 : 0));
    NAT_LINES.stats3.edges++; NAT_LINES.stats3.segs += v.length; NAT_LINES.stats3.partner += v.filter((x) => x.partner).length; NAT_LINES.stats3.flipsAvoided += flips;
    NAT_LINES.cache.set(k, v); return v;
  }
  window.NAT_LINES.segStyles = segStyles; window.NAT_LINES.segStyles3 = segStyles3;
  // rlDrawRails with the adaptive hairline and internal keyline (the realm rails are unchanged)
  const src = rlDrawRails.toString()
    .replace("g.strokeStyle = key; g.lineWidth = w.ik * px; g.beginPath(); g.moveTo(ax + nx * o2 * px, ay + ny * o2 * px); g.lineTo(bx + nx * o2 * px, by + ny * o2 * px); g.stroke();",
      "const ikw = dpr < 1.5 ? 2 : w.ik, o2b = ikw / 2; for (const sg of NAT_LINES.segStyles(e, 'int')) { g.strokeStyle = sg.key === 'light' ? RL_C.keyLight : RL_C.keyDark; g.lineWidth = ikw * px; g.beginPath(); g.moveTo(sg.x0 + nx * o2b * px, sg.y0 + ny * o2b * px); g.lineTo(sg.x1 + nx * o2b * px, sg.y1 + ny * o2b * px); g.stroke(); }")
    .replace("{ g.strokeStyle = rgba(key, Math.min(RL_P.hairline, RL_HAIRA[terr[lr]])); g.lineWidth = 1.5 * px; g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke(); }",
      "{ g.lineWidth = 1.5 * px; for (const sg of NAT_LINES.segStyles3(e)) { const col = sg.key === 'light' ? RL_C.keyLight : RL_C.keyDark; g.strokeStyle = rgba(col, sg.alpha); g.beginPath(); g.moveTo(sg.x0, sg.y0); g.lineTo(sg.x1, sg.y1); g.stroke(); if (sg.partner) { const o = sg.partner.side * 1.5; g.strokeStyle = rgba(sg.partner.key === 'light' ? RL_C.keyLight : RL_C.keyDark, 0.8); g.beginPath(); g.moveTo(sg.x0 + nx * o * px, sg.y0 + ny * o * px); g.lineTo(sg.x1 + nx * o * px, sg.y1 + ny * o * px); g.stroke(); } } if (0) for (const sg of NAT_LINES.segStyles(e, 'hair')) { if (sg.ok) { g.strokeStyle = rgba(sg.key === 'light' ? RL_C.keyLight : RL_C.keyDark, Math.min(0.92, sg.alpha)); g.beginPath(); g.moveTo(sg.x0, sg.y0); g.lineTo(sg.x1, sg.y1); g.stroke(); } else { for (const [c, o] of [[RL_C.keyDark, -0.75], [RL_C.keyLight, 0.75]]) { g.strokeStyle = rgba(c, 0.8); g.beginPath(); g.moveTo(sg.x0 + nx * o * px, sg.y0 + ny * o * px); g.lineTo(sg.x1 + nx * o * px, sg.y1 + ny * o * px); g.stroke(); } } } }");
  if (src === rlDrawRails.toString()) throw new Error('rails patch did not apply');
  const src2 = src.replace('const w = rlW(),', 'const w = (() => { const v = rlW(); return dpr < 1.5 ? { ...v, b: 2 } : v; })(),'); // the rail's banner line is 2 px below ratio 1.5: it always has a fully covered pixel
  if (src2 === src) throw new Error('rail width patch did not apply');
  rlDrawRails = eval('(' + src2 + ')');
  // seat grounds from the bake (the darker quartile of the texels under the seat's footprint)
  window.NAT_SEAT = new Map();
  window.rlSeatGround = (i) => {
    const k = `${window.__natLook || 'clear'}|${i}`; let v = NAT_SEAT.get(k); if (v) return v;
    const [cx, cy] = cent[i], r = 0.09 * RLD, { BW, BH, TX } = RB, d = RB.img.data, s = [];
    for (let y = cy - r; y <= cy + r; y += 0.8 / TX) for (let x = cx - r; x <= cx + r; x += 0.8 / TX) { if ((x - cx) ** 2 + (y - cy) ** 2 > r * r) continue; const tx = Math.floor(x * TX), ty = Math.floor(y * TX); if (tx < 0 || ty < 0 || tx >= BW || ty >= BH) continue; const kk = (ty * BW + tx) * 4; s.push([lumOf(d[kk], d[kk + 1], d[kk + 2]), d[kk], d[kk + 1], d[kk + 2]]); }
    s.sort((p, q) => p[0] - q[0]); const q = s[Math.floor(s.length * 0.1)] || [0, 64, 64, 64]; v = rgb2hex([q[1], q[2], q[3]]); NAT_SEAT.set(k, v); return v;
  };
  const ps = rlDrawPieces.toString().replace('ground = RL_ALB[p.terrain];', 'ground = rlSeatGround(i);');
  if (ps === rlDrawPieces.toString()) throw new Error('pieces patch did not apply');
  rlDrawPieces = eval('(' + ps + ')');
  // arrow chips are recorded; live names keep off every chip
  window.NAT_CHIPS = [];
  const ar = rlArrow.toString().replace("g.fillStyle = 'rgba(20,18,15,.9)'; roundRect(g, mx - 16, my - 10, 32, 20, 4);", "NAT_CHIPS.push([mx - 17, my - 11, mx + 17, my + 11]); g.fillStyle = 'rgba(20,18,15,.9)'; roundRect(g, mx - 16, my - 10, 32, 20, 4);");
  if (ar === rlArrow.toString()) throw new Error('arrow patch did not apply');
  rlArrow = eval('(' + ar + ')');
  rlLiveLabels = function (g, band) {
    const lay = RL_PIECE_CACHE.get('L'); if (!lay) return; const chips = [...NAT_CHIPS, ...RL_THREAD_CHIPS.list.map((c) => c.box)], hitAny = (r) => chips.some((q) => r[2] > q[0] && r[0] < q[2] && r[3] > q[1] && r[1] < q[3]);
    for (const i of [hoverProv, RL_LINK.prov]) {
      if (i < 0 || isWild(i) || lay.labels.some((q) => q.i === i)) continue; const c = lay.cand.get(i); if (!c) continue;
      g.font = c.font; const tw = g.measureText(prov[i].name).width + 8, th = 16, [x0, y0] = rlToScr(c.x, c.y, lay.s), st = lay.seats.get(i), sr = st ? (st.r || st.T || 10) * rlLayK(lay) : 12;
      const spots = [[x0, y0], [x0, y0 + th + 4], [x0, y0 - sr * 2 - th], [x0 + tw / 2 + sr + 6, y0 - sr], [x0 - tw / 2 - sr - 6, y0 - sr], [x0, y0 + 2 * th + 8]];
      const at = spots.find(([x, y]) => !hitAny([x - tw / 2, y - th / 2, x + tw / 2, y + th / 2]));
      const [x, y] = at ?? spots[0]; rlLabel(g, prov[i].name, x, y, c.font, true); window.NAT_LIVE = { i, box: [x - tw / 2, y - th / 2, x + tw / 2, y + th / 2], moved: at !== spots[0], chips: chips.length };
    }
  };
  const dr = rlDraw.toString().replace("if (!SKIP.has('arrows')) {", "if (!SKIP.has('arrows')) { NAT_CHIPS.length = 0;");
  if (dr === rlDraw.toString()) throw new Error('draw patch did not apply');
  rlDraw = eval('(' + dr + ')');
  const mu = rlMuted.toString().replace("const lim = bandOf(cam.s) === 'near' ? 4 : 2.5", "const lim = bandOf(cam.s) === 'near' ? 3.6 : 2.3"); if (mu === rlMuted.toString()) throw new Error('mute patch did not apply'); rlMuted = eval('(' + mu + ')'); RL_MUTE.clear();
  NAT_LINES.cache.clear(); NAT_SEAT.clear(); RCK = null; RL_PIECE_CACHE.clear(); draw(); return 'patched';
})()
