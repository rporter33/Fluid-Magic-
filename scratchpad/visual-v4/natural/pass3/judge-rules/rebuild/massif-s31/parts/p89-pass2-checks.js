// ------------------------------------------------------------------ pass 2 checks (window.__mock): the faint lines' floor on hover and selection, the wild edge, the wild landforms
// Read-only helpers for automated review, measured on the rendered canvas (the composite as drawn).
// (1) the owner's decision of 2026-10-23: in the natural view a province's own lines reach the floor when it is hovered (live) or selected (static): every hairline sample
// >= 2.3:1 (+-3 px) and every internal keyline sample >= 3.2:1 (0 to 6 px, lower-right side), dense along each edge; the other provinces' lines stay faint
function rlProvLinesSample(i, land, lines) {
  const W2 = canvas.width, H2 = canvas.height, v = viewRect(), band = bandOf(cam.s), ctx = rlLineCtx(), out = { hair: [], int: [], under: [] };
  const px = (d, sx, sy) => { const X = Math.floor(sx * dpr), Y = Math.floor(sy * dpr); if (X < 0 || Y < 0 || X >= W2 || Y >= H2) return null; const k = (Y * W2 + X) * 4; return [d[k], d[k + 1], d[k + 2]]; };
  for (const [, e] of EDGE) {
    if (e.i !== i && e.j !== i) continue; const kind = rlEdgeKind(e, band); if (!kind || (fogOf(e.i) && fogOf(e.j))) continue;
    const st = rlSegStyles(e, kind, ctx), { nx, ny } = st, [ax, ay] = toScreen(...e.a), [bx, by] = toScreen(...e.b), Lg = Math.hypot(bx - ax, by - ay), offs = kind === 'hair' ? [-3, 3] : [0, 6], lim = kind === 'hair' ? 2.3 : 3.2;
    for (let s = 4; s < Lg - 4; s += 2) {
      const sx = ax + ((bx - ax) * s) / Lg, sy = ay + ((by - ay) * s) / Lg; if (sx < v.l + 8 || sx > v.r - 8 || sy < v.t + 8 || sy > v.b - 8) continue; let b = 0;
      for (let o = offs[0]; o <= offs[1]; o += 0.5) { const a = px(lines, sx + nx * o, sy + ny * o), c = px(land, sx + nx * o, sy + ny * o); if (a && c) b = Math.max(b, rlWcag(a, c)); }
      out[kind].push(b); if (b < lim && out.under.length < 4) out.under.push(`${kind} ${names[e.i]}/${names[e.j]} ${b.toFixed(2)}`);
    }
  }
  return out;
}
function rlLinesHoverCheck(opts = {}) {
  if (!rlFaintOn()) return { applicable: false, look: rlShownLook(), mode: state.mode, note: 'every line is drawn at the floor here (Clear, the Terrain mode, the data modes); reliefLines() checks them; the hover look is v4\'s', pass: true };
  const keepH = hoverProv, keepS = state.sel, v = viewRect(), max = opts.max ?? 10, rows = [];
  const pick = provList.filter((i) => { const [sx, sy] = toScreen(...cent[i]); return sx > v.l + 40 && sx < v.r - 40 && sy > v.t + 40 && sy < v.b - 40; });
  const byKind = [...pick.filter((i) => !prov[i].owner), ...pick.filter((i) => prov[i].owner)], list = opts.only ?? [...byKind.filter((_, k) => k % 2 === 0), ...byKind.filter((_, k) => k % 2 === 1)].slice(0, max);
  for (const how of ['hover', 'select']) for (const i of list) {
    if (how === 'hover') { hoverProv = i; state.sel = keepS; } else { hoverProv = -1; state.sel = { type: 'prov', id: i }; }
    const land = rlRedraw(['rails', 'pieces', 'labels', 'badges', 'arrows']), lines = rlRedraw(['pieces', 'labels', 'badges', 'arrows']), r = rlProvLinesSample(i, land, lines);
    rows.push({ how, prov: names[i], owner: prov[i].owner ?? '', hair: r.hair.length, hairMin: r3(r.hair.length ? Math.min(...r.hair) : null), int: r.int.length, intMin: r3(r.int.length ? Math.min(...r.int) : null), under: r.under, pass: r.hair.every((x) => x >= 2.3) && r.int.every((x) => x >= 3.2) });
  }
  hoverProv = keepH; state.sel = keepS; RCK = null; draw();
  const all = (k) => rows.flatMap((q) => (q[k + 'Min'] != null ? [q[k + 'Min']] : []));
  return { look: rlShownLook(), faintOn: rlFaintOn(), band: bandOf(cam.s), provinces: list.length, rows, hairMin: r3(all('hair').length ? Math.min(...all('hair')) : null), intMin: r3(all('int').length ? Math.min(...all('int')) : null), pass: rows.every((q) => q.pass) };
}
// (2) the wild edge (docs/09 and natural §8.1: the wild contour differs from the ground at 20 / 12, directly or through its light rim by the band rule), on rendered
// pixels as the verifier samples it: across each wild/passable edge every 4 px, W the wild's ground 6 to 9 px inside, G the land 6 to 9.5 px outside, K the line pixels
// within 4 px; a sample passes when W against G reaches 20 / 12 (normal / worst deficiency), or a K reaches it against both W and G
function rlWildEdgeCheck() {
  const d = rlRedraw(['pieces', 'labels', 'badges', 'arrows']), W2 = canvas.width, H2 = canvas.height, v = viewRect(), ok = (q) => q.normal >= 20 && q.cvd >= 12;
  const px = (sx, sy) => { const X = Math.floor(sx * dpr), Y = Math.floor(sy * dpr); if (X < 0 || Y < 0 || X >= W2 || Y >= H2) return null; const k = (Y * W2 + X) * 4; return [d[k], d[k + 1], d[k + 2]]; };
  const med = (a) => { const s2 = a.filter(Boolean).sort((p, q) => rlL(...p) - rlL(...q)); return s2[s2.length >> 1]; };
  let n = 0, fails = 0, direct = 0, worst = { v: Infinity }; const ex = [];
  for (const w of WILDS) for (const e of rlWildOutline(w)) {
    const [ax, ay] = toScreen(...e.a), [bx, by] = toScreen(...e.b), Lg = Math.hypot(bx - ax, by - ay); if (Lg < 12) continue; let nx = -(by - ay) / Lg, ny = (bx - ax) / Lg;
    const [mx, my] = [(ax + bx) / 2, (ay + by) / 2]; if (provinceAt(...toWorld(mx + nx * 8, my + ny * 8)) !== e.j) { nx = -nx; ny = -ny; } // +n into the passable province
    for (let s = 6; s < Lg - 6; s += 4) {
      const sx = ax + ((bx - ax) * s) / Lg, sy = ay + ((by - ay) * s) / Lg; if (sx < v.l + 12 || sx > v.r - 12 || sy < v.t + 12 || sy > v.b - 12) continue;
      if (!inModel(...toWorld(sx + nx * 10, sy + ny * 10)) || provinceAt(...toWorld(sx + nx * 8, sy + ny * 8)) !== e.j) continue;
      const Wg = med([6, 7, 8, 9].map((o) => px(sx - nx * o, sy - ny * o))), G = med([6, 7, 8, 9, 9.5].map((o) => px(sx + nx * o, sy + ny * o))); if (!Wg || !G) continue;
      const K = []; for (let o = -4; o <= 4; o += 0.5) { const c = px(sx + nx * o, sy + ny * o); if (c) K.push(c); } n++;
      const wg = rlPairDE(Wg, G); let pass = ok(wg); if (pass) direct++; let best = 0;
      if (!pass) for (const c of K) { const a = rlPairDE(c, Wg), b = rlPairDE(c, G), m = Math.min(a.normal / 20, a.cvd / 12, b.normal / 20, b.cvd / 12); if (m > best) best = m; if (m >= 1) { pass = true; break; } }
      if (!pass) { fails++; if (ex.length < 6) ex.push(`${w.name}/${names[e.j]} (${terr[e.j]}${fogOf(e.j) ? ', ' + fogOf(e.j) : ''}) W${rgb2hex(Wg)} G${rgb2hex(G)} best ${best.toFixed(2)}`); }
      if (!pass && best < worst.v) worst = { v: +best.toFixed(3), at: `${w.name}/${names[e.j]}` };
    }
  }
  const rim = rlFaintOn() && !view.pass && RL_WRIM.map ? (typeof rlQuietEdgeOn === 'function' && rlQuietEdgeOn()) ? { quietEdgeShare: +rlQuietShare().toFixed(3), edges: RL_WRIM.edges, ms: RL_WRIM.ms } : { share: +rlWildRimShare().toFixed(3), edges: RL_WRIM.edges, ms: RL_WRIM.ms } : 'every edge'; // pass-2 critique fix 3b: the share of the outline that keeps the light rim
  return { look: rlShownLook(), mode: state.mode, band: bandOf(cam.s), samples: n, fails, passDirect: direct, directShare: n ? +(direct / n).toFixed(3) : null, rim, worstFailRatio: worst.v === Infinity ? null : worst, examples: ex, pass: fails === 0 };
}
// (3) the natural wilds as landforms (pass 2): on the natural bake, no wild texel lighter than the passable mountains' brightest lit rock (p99.9) + the margin; the share of
// rock, foothill and water texels; the mere's water against the map's natural water (hue and chroma); the footprint (wild texels are exactly the wild cells' texels)
function rlWildLookCheck() {
  const Lk = RB.L.natural; if (!Lk || !RB.nw) return { baked: false }; const d = Lk.img.data, { LT, id, BW } = RB, cap = RB.nwCap, out = {}, wl = rgb2lab(hex2rgb(RL_C.waterNat));
  for (const kind of [7, 8]) { const Ls = [], C = [], Hs = []; let foot = 0, n = 0, outside = 0;
    for (let k = 0; k < LT.length; k += 3) { if (LT[k] !== kind) continue; const o = k * 4; if (d[o + 3] < 255) continue; const lab = rgb2lab([d[o], d[o + 1], d[o + 2]]); Ls.push(lab[0]); n++; if (!RL_WILDK[id[k]]) outside++;
      if (kind === 8) { const hx = ((k % BW) + 0.5) / 2, hy = (Math.floor(k / BW) + 0.5) / 2; if (rlBilin(RB.nw.F, RB.HW, RB.HH, hx, hy) > 0.9) { C.push(Math.hypot(lab[1], lab[2])); Hs.push(lab); } else foot++; } }
    Ls.sort((a, b) => a - b); const q = (f) => +Ls[Math.min(Ls.length - 1, Math.floor(f * Ls.length))].toFixed(1);
    const row = { texels: n, Lp5: q(0.05), Lp50: q(0.5), Lp95: q(0.95), Lmax: q(1), textelsOutsideTheirCells: outside };
    if (kind === 7 && RB.mw && RB.mw.snow8) { // pass 3 prototype (proto-massif), the rule changed: rock stays under the cap; snow on the top crests may pass it, to RL_MSC.snowMax, on at most RL_MSC.snowShareMax of the range
      const S8 = RB.mw.snow8; let n2 = 0, rockOver = 0, snowN = 0, snowOver = 0, snowMax = 0; for (let k = 0; k < LT.length; k += 3) { if (LT[k] !== 7) continue; const o = k * 4; if (d[o + 3] < 255) continue; n2++; const L = rgb2lab([d[o], d[o + 1], d[o + 2]])[0];
        const allow = cap.cap + (RL_MSC.snowMax - cap.cap) * (S8[k] / 255) + 1.0; if (S8[k] >= 128) { snowN++; snowMax = Math.max(snowMax, L); } if (L > cap.cap + 0.5) snowOver++; if (L > allow) rockOver++; } // a texel passes the cap only by its snow share (1 L* for the 8-bit rounding and the F x F mean)
      Object.assign(row, { cap: +cap.cap.toFixed(2), passableRockP999: cap.rockP999, overCap: rockOver, rockOverCap: rockOver, snowShare: +(snowN / (n2 || 1)).toFixed(4), snowOverCapShare: +(snowOver / (n2 || 1)).toFixed(4), snowLmax: +snowMax.toFixed(1), snowMax: RL_MSC.snowMax, snowShareMax: RL_MSC.snowShareMax, rule: 'pass 3 prototype: rock under the cap; snow on the top crests to snowMax on at most snowShareMax' });
      row.snowPass = row.snowShare <= RL_MSC.snowShareMax && row.snowLmax <= RL_MSC.snowMax + 0.5; }
    else if (kind === 7) { row.cap = +cap.cap.toFixed(2); row.passableRockP999 = cap.rockP999; row.overCap = Ls.filter((x) => x > cap.cap + 0.5).length; row.note = "8-bit sRGB rounds L* by up to about 0.4"; }
    else { const m = Hs.reduce((a, b) => [a[0] + b[0] / Hs.length, a[1] + b[1] / Hs.length, a[2] + b[2] / Hs.length], [0, 0, 0]); row.waterMeanLab = m.map((x) => +x.toFixed(1)); row.naturalWaterLab = wl.map((x) => +x.toFixed(1)); row.waterDE = +dE2000(m, wl).toFixed(1); row.fringeShare = +(foot / n).toFixed(3); }
    out[kind === 7 ? 'peaks' : 'mere'] = row; }
  out.pass = out.peaks.overCap === 0 && out.peaks.snowPass !== false && out.peaks.textelsOutsideTheirCells === 0 && out.mere.textelsOutsideTheirCells === 0;
  return out;
}
Object.assign(window.__mock, { reliefLinesHover: (o) => rlLinesHoverCheck(o), reliefWildEdge: () => rlWildEdgeCheck(), reliefWildLook: () => rlWildLookCheck() });
