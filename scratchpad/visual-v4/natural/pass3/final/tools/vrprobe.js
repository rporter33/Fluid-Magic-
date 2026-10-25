// The verifier's own probes, evaluated inside the page (window.__mock.ev) so they can read its geometry; the colour math is my own (sRGB -> CIELAB D65,
// CIEDE2000 after Sharma 2005, Machado 2009 severity 1 on linear RGB, clamped, the repo's matrices), not the page's rlPairDE.
window.__vr = (() => {
  const s2l = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }, l2s = (v) => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
  const labL = (r, g, b) => { const X = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047, Y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b, Z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883;
    const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : ((24389 / 27) * t + 16) / 116), fx = f(X), fy = f(Y), fz = f(Z); return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]; };
  const M = { protan: [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998], deutan: [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182, 0.04294, 0.968881], tritan: [1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.3039] };
  const cl = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const labs = (c) => { const l = [s2l(c[0]), s2l(c[1]), s2l(c[2])], o = { normal: labL(...l) }; for (const k in M) { const m = M[k]; const q = [0, 1, 2].map((r) => cl(m[r * 3] * l[0] + m[r * 3 + 1] * l[1] + m[r * 3 + 2] * l[2])); o[k] = labL(...q); } return o; };
  const de = (A, B) => { const [L1, a1, b1] = A, [L2, a2, b2] = B, d2r = Math.PI / 180; const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2), Cb = (C1 + C2) / 2, G = 0.5 * (1 - Math.sqrt(Cb ** 7 / (Cb ** 7 + 6103515625)));
    const ap1 = (1 + G) * a1, ap2 = (1 + G) * a2, Cp1 = Math.hypot(ap1, b1), Cp2 = Math.hypot(ap2, b2); let hp1 = Math.atan2(b1, ap1) / d2r; if (hp1 < 0) hp1 += 360; let hp2 = Math.atan2(b2, ap2) / d2r; if (hp2 < 0) hp2 += 360;
    const dL = L2 - L1, dC = Cp2 - Cp1; let dh = 0; if (Cp1 * Cp2 !== 0) { dh = hp2 - hp1; if (dh > 180) dh -= 360; else if (dh < -180) dh += 360; } const dH = 2 * Math.sqrt(Cp1 * Cp2) * Math.sin((dh / 2) * d2r);
    const Lb = (L1 + L2) / 2, Cpb = (Cp1 + Cp2) / 2; let hb = hp1 + hp2; if (Cp1 * Cp2 !== 0) { if (Math.abs(hp1 - hp2) <= 180) hb /= 2; else hb = hp1 + hp2 < 360 ? (hb + 360) / 2 : (hb - 360) / 2; }
    const T = 1 - 0.17 * Math.cos((hb - 30) * d2r) + 0.24 * Math.cos(2 * hb * d2r) + 0.32 * Math.cos((3 * hb + 6) * d2r) - 0.2 * Math.cos((4 * hb - 63) * d2r), dt = 30 * Math.exp(-(((hb - 275) / 25) ** 2)), Rc = 2 * Math.sqrt(Cpb ** 7 / (Cpb ** 7 + 6103515625));
    const SL = 1 + (0.015 * (Lb - 50) ** 2) / Math.sqrt(20 + (Lb - 50) ** 2), SC = 1 + 0.045 * Cpb, SH = 1 + 0.015 * Cpb * T, RT = -Math.sin(2 * dt * d2r) * Rc;
    return Math.sqrt((dL / SL) ** 2 + (dC / SC) ** 2 + (dH / SH) ** 2 + RT * (dC / SC) * (dH / SH)); };
  const cache = new Map(); const LB = (c) => { const k = (c[0] << 16) | (c[1] << 8) | c[2]; let v = cache.get(k); if (!v) { v = labs(c); cache.set(k, v); if (cache.size > 200000) cache.clear(); } return v; };
  const pair = (a, b) => { const A = LB(a), B = LB(b), n = de(A.normal, B.normal), p = de(A.protan, B.protan), d = de(A.deutan, B.deutan), t = de(A.tritan, B.tritan); return { n, cvd: Math.min(p, d, t), p, d, t, r: Math.min(n / 20, Math.min(p, d, t) / 12) }; };
  const lum = (c) => 0.2126 * s2l(c[0]) + 0.7152 * s2l(c[1]) + 0.0722 * s2l(c[2]), wcag = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const frame = (skip) => { const was = new Set(SKIP); SKIP.clear(); for (const k of skip) SKIP.add(k); RCK = null; draw(); const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data.slice(); SKIP.clear(); for (const k of was) SKIP.add(k); RCK = null; draw(); return d; };
  const pxOf = (d) => { const W2 = canvas.width, H2 = canvas.height; return (sx, sy) => { const X = Math.floor(sx * dpr), Y = Math.floor(sy * dpr); if (X < 0 || Y < 0 || X >= W2 || Y >= H2) return null; const k = (Y * W2 + X) * 4; return [d[k], d[k + 1], d[k + 2]]; }; };
  const medL = (a) => { const s = a.filter(Boolean).sort((p, q) => LB(p).normal[0] - LB(q).normal[0]); return s.length ? s[s.length >> 1] : null; };
  // (1) the wild edge test, my sampling: every 1 px along each outline edge (3 px clear of its ends), the rule's grounds (6-9 px in, 6-9.5 px out) and three other ground depths
  function wild(opts = {}) {
    const d = frame(['pieces', 'labels', 'badges', 'arrows']), px = pxOf(d), v = viewRect(), depths = opts.depths ?? { rule: [[6, 7, 8, 9], [6, 7, 8, 9, 9.5]], near: [[4, 5, 6], [4, 5, 6]], deep: [[9, 10, 11, 12], [9, 10, 11, 12]], wide: [[5, 6, 7, 8, 9, 10, 11, 12], [5, 6, 7, 8, 9, 10, 11, 12]] };
    const res = {}; for (const k in depths) res[k] = { n: 0, fails: 0, direct: 0, minR: Infinity, ex: [] }; const byWild = {}; let lightBand = 0, nAll = 0;
    for (const w of WILDS) for (const e of rlWildOutline(w)) { if (isWild(e.j)) continue;
      const [ax, ay] = toScreen(...e.a), [bx, by] = toScreen(...e.b), Lg = Math.hypot(bx - ax, by - ay); if (Lg < 8) continue; let nx = -(by - ay) / Lg, ny = (bx - ax) / Lg;
      if (provinceAt(...toWorld((ax + bx) / 2 + nx * 8, (ay + by) / 2 + ny * 8)) !== e.j) { nx = -nx; ny = -ny; }
      const e0 = opts.endClear ?? 3; for (let s = e0; s <= Lg - e0; s += 1) {
        const sx = ax + ((bx - ax) * s) / Lg, sy = ay + ((by - ay) * s) / Lg; if (sx < v.l + 12 || sx > v.r - 12 || sy < v.t + 12 || sy > v.b - 12) continue;
        if (!inModel(...toWorld(sx + nx * 12, sy + ny * 12)) || provinceAt(...toWorld(sx + nx * 8, sy + ny * 8)) !== e.j || !isWild(provinceAt(...toWorld(sx - nx * 8, sy - ny * 8)))) continue;
        const K = []; for (let o = -4; o <= 4; o += 0.5) { const c = px(sx + nx * o, sy + ny * o); if (c) K.push(c); } nAll++;
        if (K.some((c) => LB(c).normal[0] >= 45 && LB(c).normal[0] <= 80)) lightBand++;
        for (const k in depths) { const [di, dx] = depths[k], Wg = medL(di.map((o) => px(sx - nx * o, sy - ny * o))), G = medL(dx.map((o) => px(sx + nx * o, sy + ny * o))); if (!Wg || !G) continue; const R = res[k]; R.n++;
          const pg = pair(Wg, G); let best = pg.r; if (pg.r >= 1) R.direct++; else for (const c of K) { const a = pair(c, Wg), b = pair(c, G), r = Math.min(a.r, b.r); if (r > best) best = r; if (best >= 1) break; }
          if (best < R.minR) { R.minR = best; R.minAt = `${w.name}/${names[e.j]} (${terr[e.j]}${fogOf(e.j) ? ',' + fogOf(e.j) : ''}) ${Math.round(sx)},${Math.round(sy)}`; }
          if (best < 1) { R.fails++; if (R.ex.length < (opts.nex ?? 6)) R.ex.push(`${w.name}/${names[e.j]} ${Math.round(sx)},${Math.round(sy)} r${best.toFixed(3)} W L${LB(Wg).normal[0].toFixed(0)} G L${LB(G).normal[0].toFixed(0)} s${s}/${Lg.toFixed(0)} pair ${pg.r.toFixed(3)} Wrgb ${Wg.join(',')} Grgb ${G.join(',')}`); }
          if (k === 'rule') { const b = (byWild[w.name] ??= { n: 0, fails: 0 }); b.n++; if (best < 1) b.fails++; } } } }
    for (const k in res) res[k].minR = res[k].minR === Infinity ? null : +res[k].minR.toFixed(3);
    return { look: rlShownLook(), mode: state.mode, band: bandOf(cam.s), Dpx: +(cam.s * MED_DIAM).toFixed(1), dpr, hover: hoverProv >= 0 ? names[hoverProv] : null, sel: state.sel && state.sel.type === 'prov' ? names[state.sel.id] : null, samples: nAll, lightElementShare: nAll ? +(lightBand / nAll).toFixed(3) : null, byWild, ...res };
  }
  // (2) the band rule on realm rails, my sampling: every 2 px along each realm edge (0.1 to 0.9 of it), the banner at its offset +-0.5 px, any rail pixel as the keyline
  function rails(opts = {}) {
    const d = frame(['pieces', 'labels', 'badges', 'arrows']), px = pxOf(d), w = rlW(), gap = 1, tot = gap + w.d + w.b + w.l, ban = gap + w.d + w.b / 2, v = viewRect(); let n = 0, fails = 0, minR = Infinity, minAt = '', direct = 0, dotted = 0, minW = Infinity; const ex = [];
    for (const i of provList) { const p = prov[i]; if (!p.owner) continue;
      for (const e of RL_EDGES[i]) { if (!isRealmEdge(i, e)) continue; const L = e.len * cam.s; if (L < 16) continue; if (fogOf(i) && fogOf(e.j)) { dotted++; continue; }
        const step = 2 / L; for (let t = 0.1; t <= 0.9001; t += step) {
          const bx = e.a[0] + (e.b[0] - e.a[0]) * t, by = e.a[1] + (e.b[1] - e.a[1]) * t, [sx, sy] = toScreen(bx, by); if (sx < v.l + 10 || sy < v.t + 10 || sx > v.r - 10 || sy > v.b - 10) continue;
          const gw = toWorld(sx + e.nx * (tot + 3.5), sy + e.ny * (tot + 3.5)); if (provinceAt(...gw) !== i || !inModel(...gw)) continue;
          const G = medL([tot + 2.5, tot + 3, tot + 3.5, tot + 4, tot + 4.5].map((o) => px(sx + e.nx * o, sy + e.ny * o))), Bs = [ban - 0.5, ban, ban + 0.5].map((o) => px(sx + e.nx * o, sy + e.ny * o)).filter(Boolean), Ks = []; for (let o = 0; o <= tot + 0.5; o += 0.5) { const c = px(sx + e.nx * o, sy + e.ny * o); if (c) Ks.push(c); }
          if (!G || !Bs.length) continue; n++; let best = 0;
          for (const B of Bs) { const bg = pair(B, G); if (bg.r > best) best = bg.r; if (bg.r >= 1) { direct++; break; } for (const K of Ks) { const r = Math.min(pair(K, B).r, pair(K, G).r); if (r > best) best = r; if (best >= 1) break; } if (best >= 1) break; }
          if (best < minR) { minR = best; minAt = `${p.name}/${names[e.j]} ${Math.round(sx)},${Math.round(sy)}`; } if (best < 1) { fails++; if (ex.length < 8) ex.push(`${p.name}/${names[e.j]} r${best.toFixed(3)} at ${Math.round(sx)},${Math.round(sy)}`); } } } }
    return { look: rlShownLook(), mode: state.mode, band: bandOf(cam.s), dpr, widths: [w.d, w.b, w.l], hover: hoverProv >= 0 ? names[hoverProv] : null, sel: state.sel && state.sel.type === 'prov' ? names[state.sel.id] : null, samples: n, fails, direct, dottedEdgesSkipped: dotted, minR: minR === Infinity ? null : +minR.toFixed(3), minAt, ex };
  }
  // (3) distinct colours: per province, the median colour of its core on the land layer (beyond 0.15 D of its edges, water and wilds out); terrain pairs on every pair of provinces of
  // different terrain in view and on adjacent pairs, normal and under each deficiency
  function distinct() {
    const d = frame(['rails', 'pieces', 'labels', 'badges', 'arrows', 'water']), W2 = canvas.width, H2 = canvas.height, { BW, TX, id } = RB, acc = new Map(), v = viewRect(), step = Math.max(1, Math.round(dpr));
    for (let Y = Math.ceil(v.t * dpr); Y < v.b * dpr; Y += step) for (let X = Math.ceil(v.l * dpr); X < v.r * dpr; X += step) { const [x, y] = toWorld((X + 0.5) / dpr, (Y + 0.5) / dpr); if (x < 0 || y < 0 || x >= W || y >= H || !inModel(x, y)) continue; const i = id[Math.floor(y * TX) * BW + Math.floor(x * TX)]; if (i === 255 || isWild(i)) continue; if (distToEdge(cells[i], x, y) < 0.15 * MED_DIAM) continue; const k = (Y * W2 + X) * 4; let a = acc.get(i); if (!a) acc.set(i, (a = [])); a.push([d[k], d[k + 1], d[k + 2]]); }
    const rows = []; for (const [i, a] of acc) { if (a.length < 60) continue; const L = a.map((c) => LB(c).normal), med = [0, 1, 2].map((j) => { const s = L.map((q) => q[j]).sort((p, q) => p - q); return s[s.length >> 1]; }); const mrgb = (() => { const s = [0, 1, 2].map((j) => { const t = a.map((c) => c[j]).sort((p, q) => p - q); return t[t.length >> 1]; }); return s; })(); rows.push({ i, name: names[i], t: terr[i], fog: fogOf(i) || '', n: a.length, rgb: mrgb }); }
    let worst = { r: Infinity }, wN = Infinity, wC = Infinity, pairs = 0, under = 0, adjUnder = 0, adj = 0; const ex = [];
    for (let a = 0; a < rows.length; a++) for (let b = a + 1; b < rows.length; b++) { const A = rows[a], B = rows[b]; if (A.t === B.t) continue; const q = pair(A.rgb, B.rgb); pairs++; const isAdj = NB[A.i].includes(B.i); if (isAdj) adj++;
      if (q.n < wN) wN = q.n; if (q.cvd < wC) wC = q.cvd; if (q.r < worst.r) worst = { r: +q.r.toFixed(3), pair: `${A.name} (${A.t}${A.fog ? ',' + A.fog : ''})/${B.name} (${B.t}${B.fog ? ',' + B.fog : ''})`, n: +q.n.toFixed(2), p: +q.p.toFixed(2), d: +q.d.toFixed(2), t: +q.t.toFixed(2) };
      if (q.n < 20 || q.cvd < 12) { under++; if (isAdj) adjUnder++; if (ex.length < 8) ex.push(`${A.name}/${B.name} ${q.n.toFixed(1)}/${q.cvd.toFixed(1)}${isAdj ? ' adj' : ''}`); } }
    return { look: rlShownLook(), mode: state.mode, band: bandOf(cam.s), provinces: rows.length, pairs, under, adjacentPairs: adj, adjacentUnder: adjUnder, worstNormal: +wN.toFixed(2), worstCvd: +wC.toFixed(2), worst, ex };
  }
  return { pair, wcag, wild, rails, distinct, frame };
})(); 'ok'
