
// ------------------------------------------------------------------ v3 lettering: ink on paper (Alegreya), curved wild names, region names under the instrument
// Setting text on a path: equal-step arc sampling, kerned prefix advances plus manual tracking, keep upright, reject turns over 45 degrees.
function orientUpright(P) { const a = P[0], b = P[P.length - 1], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; if (dx < -0.25 * L || (Math.abs(dx) <= 0.25 * L && dy > 0)) return [...P].reverse(); return P; }
function layoutOnPath(text, P, font, track, fs, adv0) { // P in screen px; returns glyphs [{ch, x, y, a, w}] or null (adv0: prefix advances, if known)
  const Lc = P.Lc ?? cumLen(P), tot = Lc[Lc.length - 1], n = text.length, adv = adv0 ?? [0];
  if (!adv0) for (let k = 1; k <= n; k++) adv.push(textW(text.slice(0, k), font));
  const len = adv[n] + track * (n - 1); if (len > tot * 0.98) return null;
  const start = (tot - len) / 2, out = [];
  for (let k = 0; k < n; k++) {
    const d = start + (adv[k] + adv[k + 1]) / 2 + track * k, a = arcAt(P, Lc, d - 1.5), b = arcAt(P, Lc, d + 1.5), q = arcAt(P, Lc, d);
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    if (out.length) { let da = Math.abs(ang - out[out.length - 1].a); if (da > Math.PI) da = 2 * Math.PI - da; if (da > Math.PI / 4) return null; }
    out.push({ ch: text[k], x: q[0], y: q[1], a: ang, w: adv[k + 1] - adv[k], fs });
  }
  return out;
}
const glyphBoxes = (gl, pad) => gl.filter((q) => q.ch !== ' ').map((q) => { const r = Math.max(q.w, q.fs * 0.8) / 2 + pad; return [q.x - r, q.y - r, q.x + r, q.y + r]; });
const anyHit = (bs, boxes) => bs.some((b) => boxes.some((q) => b[2] > q[0] && b[0] < q[2] && b[3] > q[1] && b[1] < q[3]));
function paintGlyphs(g, gl, font, fill, halo, haloW) {
  g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  for (const q of gl) { if (q.ch === ' ') continue; g.save(); g.translate(q.x, q.y); g.rotate(q.a); if (halo) { g.strokeStyle = halo; g.lineWidth = haloW; g.strokeText(q.ch, 0, 0); } g.fillStyle = fill; g.fillText(q.ch, 0, 0); g.restore(); }
}
// ---- wild names: the spine of a range (cells' centroids along its axis, extended 10%, smoothed) or an arc along one cell's long axis
const SPINES = new Map();
function wildSpine(w) {
  const k = w.id + ':' + view.borders; let v = SPINES.get(k); if (v) return v;
  const cs = w.cells.map((c) => cent[c]), cx = cs.reduce((a, q) => a + q[0], 0) / cs.length, cy = cs.reduce((a, q) => a + q[1], 0) / cs.length;
  let pts0 = w.cells.length > 1 ? cs : cells[w.cells[0]];
  let sxx = 0, syy = 0, sxy = 0; for (const [x, y] of pts0) { sxx += (x - cx) ** 2; syy += (y - cy) ** 2; sxy += (x - cx) * (y - cy); }
  const ang = 0.5 * Math.atan2(2 * sxy, sxx - syy), ax = [Math.cos(ang), Math.sin(ang)], pr = (q) => (q[0] - cx) * ax[0] + (q[1] - cy) * ax[1];
  if (w.cells.length > 1) {
    const ord = [...cs].sort((a, b) => pr(a) - pr(b)), a = ord[0], b = ord[ord.length - 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const ext = (p, q) => [p[0] + ((p[0] - q[0]) / L) * 0.1 * L, p[1] + ((p[1] - q[1]) / L) * 0.1 * L];
    v = chaikin([ext(a, b), ...ord, ext(b, a)], 2, false);
  } else {
    let lo = Infinity, hi = -Infinity; for (const q of cells[w.cells[0]]) { const d = pr(q); lo = Math.min(lo, d); hi = Math.max(hi, d); }
    const L = (hi - lo) * 0.82, c0 = cent[w.cells[0]], nx = -ax[1], ny = ax[0], sg = ny > 0 ? -1 : 1; v = [];
    for (let m = 0; m <= 16; m++) { const t = m / 16 - 0.5, bow = 0.06 * L * 4 * (0.25 - t * t) * sg; v.push([c0[0] + ax[0] * t * L + nx * bow, c0[1] + ax[1] * t * L + ny * bow]); }
  }
  v = orientUpright(v); SPINES.set(k, v); return v;
}
function wildFs(w, band) { const b = wgeo(w).nameFs; return band === 'far' ? Math.min(13, b) : band === 'mid' ? Math.max(12, b) : b + 4; }
const wildFont = (fs) => `italic 500 ${fs.toFixed(1)}px 'Alegreya', Georgia, serif`;
function wildLayout(w, band, s, ox, oy, fsK = 1) { // curved glyphs in a frame where world (x, y) maps to (x * s + ox, y * s + oy)
  const fs = wildFs(w, band) * fsK; if (fs < 13 || !inkLabels()) return null;
  const P = wildSpine(w).map(([x, y]) => [x * s + ox, y * s + oy]);
  return layoutOnPath(w.name, P, wildFont(fs), 0.12 * fs, fs);
}
// ---- the label layout, shared by the region names and tracks (knock-outs) and painted last
const LABEL_ORDER2 = () => LABEL_ORDER;
function layoutLabels(band) {
  const ink = inkLabels(), fs = labelSize(cam.s), placed = [], ops = [], wildBoxes = [], tokenBoxes = [], chips = [];
  const hits = (b) => placed.some((q) => b[2] > q[0] && b[0] < q[2] && b[3] > q[1] && b[1] < q[3]);
  const byAt = new Map(); for (const c of Object.values(cmd)) if (!c.hidden) byAt.set(c.at, [...(byAt.get(c.at) ?? []), c]);
  for (const [at, list] of byAt) { const [sx, sy] = toScreen(...cent[at]), n = list.length, eta = list.some((c) => c.eta), hw = Math.max(15 * n + 3, eta ? 40 : 0), h = 54 + (eta ? 17 : 0) + (band === 'near' ? 34 : 0); const b = [sx - hw, sy - 18 - h, sx + hw, sy - 16]; placed.push(b); tokenBoxes.push(b); }
  const queue = [], regFirst = band === 'far' && regionsShown(band); let regions = null;
  for (const p of LABEL_ORDER) if (p.cap || p.well) queue.push(['p', p]);
  for (const w of WILDS) queue.push(['w', w]);
  if (regFirst) { // v3 critique 6 (amends H12 at Far only): region names go before the place names of minor provinces
    for (const p of LABEL_ORDER) if (!p.cap && !p.well && majorAtFar(p)) queue.push(['p', p]);
    queue.push(['r', null]);
    for (const p of LABEL_ORDER) if (!p.cap && !p.well && !majorAtFar(p)) queue.push(['p', p]);
  } else for (const p of LABEL_ORDER) if (!p.cap && !p.well) queue.push(['p', p]);
  for (const [kind, it] of queue) {
    if (kind === 'r') { regions = regionItems(band, { placed: [...placed, ...chips], wildBoxes: [...wildBoxes] }); for (const r of regions) placed.push(...regionBoxes(r)); continue; }
    if (kind === 'w') {
      const w = it, G = wgeo(w);
      const curvedOK = ink && G.curved && G.curved[band];
      if (curvedOK) {
        let done = false;
        for (const k of [1, 0.9]) { const gl = wildLayout(w, band, cam.s, cam.x, cam.y, k); if (!gl) continue; const bs = glyphBoxes(gl, 2); if (anyHit(bs, placed)) continue; placed.push(...bs); wildBoxes.push(...bs); ops.push({ t: 'wc', w, gl, font: wildFont(gl[0].fs) }); done = true; break; }
        if (done) continue;
      }
      const fsz = ink ? wildFs(w, band) : G.nameFs, f = ink ? wildFont(fsz) : `italic 400 ${G.nameFs}px 'Alegreya Sans', sans-serif`, tw = textW(w.name, f) * (ink ? 1.12 : 1.1);
      const spots = G.vertical ? [toScreen(...G.labelPt)] : [G.labelAt, ...[...w.cells].sort((a, b) => areaOf[b] - areaOf[a])].flatMap((c) => [[0, 0], [0, 26], [0, -26]].map(([dx, dy]) => { const [sx, sy] = toScreen(...cent[c]); return [sx + dx, sy + dy]; }));
      const hw = (G.vertical ? fsz : tw) / 2 + 2, hh = (G.vertical ? tw : fsz) / 2 + 2;
      const spot = spots.find(([x, y]) => !hits([x - hw, y - hh, x + hw, y + hh])); if (!spot) continue;
      const b = [spot[0] - hw, spot[1] - hh, spot[0] + hw, spot[1] + hh]; placed.push(b); wildBoxes.push(b);
      ops.push({ t: 'ws', w, x: spot[0], y: spot[1], f, vertical: G.vertical, ink });
      continue;
    }
    const p = it, [sx, sy] = toScreen(...cent[p.i]);
    if (sx < -80 || sy < -40 || sx > cw + 80 || sy > ch + 40) continue;
    for (const f2 of ink && fs - 1 >= 11 ? [fs, fs - 1] : [fs]) { // v3 critique 3: a crowded name steps down one px (never under 11) before it is culled
      const font = nameFont(p, f2), tw = textW(p.name, font), pfs = p.cap ? f2 + 1 : f2;
      const box = [sx - tw / 2 - (ink ? 3 : 2), sy - 6 - pfs / 2 - 1.5, sx + tw / 2 + (ink ? 3 : 2), sy - 6 + pfs / 2 + 1.5];
      if (hits(box)) continue; placed.push(box);
      ops.push({ t: 'p', p, sx, sy, font, ink }); const cw2 = secondLineW(p, band); if (cw2) chips.push([sx - 28, sy + 1, sx - 14 + cw2, sy + 19]); break;
    }
  }
  return { placed, ops, wildBoxes, tokenBoxes, band, regions, chips };
}
// the second line's width (paintLabels draws it from sx - 14: a 26 px candle chip, 18 px glyph discs), 0 when it has none
function secondLineW(p, band) {
  if (band === 'far' && !p.cap) return 0; const hid = fogOf(p.i) === 'unexplored';
  const n = (p.unrest >= 25 && p.owner && !hid ? 1 : 0) + (p.buildings.length ? 1 : 0) + (p.well ? 1 : 0) + (p.fx ?? []).length;
  return (p.dom.n && !hid ? 26 : 0) + 18 * n;
}
// At Far a province's name is major (placed before the region names) when it is a capital or Wellspring, the viewer's, holds a visible
// army, is selected or is contested (a siege, pillage or another nation's dominion over owned land); every other name is minor.
const VIEWER = 'red';
function majorAtFar(p) { return p.cap || p.well || p.owner === VIEWER || tokensAt(p.i) > 0 || (state.sel && state.sel.type === 'prov' && state.sel.id === p.i) || !!(p.siege || p.pillage || (p.dom.n && p.owner && p.dom.n !== p.owner)); }
function paintLabels(g, lay) {
  const band = lay.band; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (const op of lay.ops) {
    if (op.t === 'wc') { paintGlyphs(g, op.gl, op.font, '#E9E4D8', null, 0); continue; }
    if (op.t === 'ws') { g.save(); g.translate(op.x, op.y); if (op.vertical) g.rotate(-Math.PI / 2); g.font = op.f; if ('letterSpacing' in g) g.letterSpacing = op.ink ? '0.12em' : '0.08em'; g.fillStyle = '#E9E4D8'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(op.w.name, 0, 0); if ('letterSpacing' in g) g.letterSpacing = '0px'; g.restore(); continue; }
    const { p, sx, sy, font, ink } = op;
    g.font = font; g.lineJoin = 'round'; g.textAlign = 'center'; g.textBaseline = 'middle';
    if (ink) { const dk = DARK_T.has(p.terrain); g.lineWidth = 2.5; g.strokeStyle = dk ? 'rgba(20,18,15,.75)' : 'rgba(242,234,214,.8)'; g.strokeText(p.name, sx, sy - 6); g.fillStyle = dk ? '#F4EEDF' : '#2A1F14'; g.fillText(p.name, sx, sy - 6); } // v3 critique 3: light letters on a dark halo on Forest, Hills and Swamp
    else { g.lineWidth = 3; g.strokeStyle = 'rgba(20,18,15,.85)'; g.strokeText(p.name, sx, sy - 6); g.fillStyle = '#F4EEDF'; g.fillText(p.name, sx, sy - 6); }
    if (band === 'far' && !p.cap) continue;
    const hid = fogOf(p.i) === 'unexplored';
    let gx = sx - 14; const gy = sy + 10;
    if (p.dom.n && !hid) { chipCandle(g, gx, gy, p.dom.n, p.dom.s); gx += 26; }
    if (p.unrest >= 25 && p.owner && !hid) { glyph(g, 'fist', gx, gy, '#FFB4A9'); gx += 18; }
    if (p.buildings.length) { glyph(g, 'fort', gx, gy, '#F4EEDF'); gx += 18; }
    if (p.well) { glyph(g, 'well', gx, gy, '#CFE8FF'); gx += 18; }
    for (const fx of p.fx ?? []) { glyph(g, { burn: 'fire', ashrain: 'ash', fertile: 'leaf' }[fx.kind], gx, gy, { burn: '#FFB4A9', ashrain: '#E9E4D8', fertile: '#A6D96A' }[fx.kind]); gx += 18; }
    g.textAlign = 'center';
    if (state.mode === 'springs') p.springs.forEach((c, k) => { const img = manaImg[c]; if (img.complete) g.drawImage(img, sx - 9 + k * 20, sy + 22, 18, 18); });
    if (!hid && (state.mode === 'population' || state.mode === 'unrest' || state.mode === 'supply')) {
      const v = state.mode === 'population' ? (p.pop / 1000).toFixed(1) + 'k' : state.mode === 'unrest' ? p.unrest : Math.round(SUPPLY[p.terrain] + p.pop / 50);
      g.font = `600 12px 'IBM Plex Sans Condensed', sans-serif`; g.lineWidth = 3; g.strokeStyle = 'rgba(20,18,15,.85)'; g.strokeText(String(v), sx, sy + 26); g.fillStyle = '#FFF'; g.fillText(String(v), sx, sy + 26);
    }
  }
}
const REGDBG = [], REGOPT = {}; // REGOPT: review-only switches for the placement diagnosis
// ---- region names (H12): a live lettering layer above the decoration, below tracks, borders, bands, wilds and every label; placed last
let REGCACHE = { key: '', items: [] };
function regionFade(band) { const med = cam.s * MED_DIAM; return band === 'far' ? 1 : Math.max(0, Math.min(1, (110 - med) / 10)); }
function regionsShown(band) { return PAINTED() && state.mode === 'ownership' && decoTo >= 1 && decoAlpha >= 0.999 && band !== 'near' && regionFade(band) > 0; }
function regionItems(band, lay) { // placements are cached per zoom and army layout (pans re-use them; positions are kept in world units)
  const key = [band, cam.s.toFixed(4), Object.values(cmd).filter((c) => !c.hidden).map((c) => c.at + ':' + (c.eta ?? '')).join(','), KEYVER, view.borders, view.labels, fontsReady, state.sel ? state.sel.type + state.sel.id : ''].join('|');
  if (REGCACHE.key !== key) REGCACHE = { key, items: placeRegionNames(band, lay) };
  return REGCACHE.items;
}
const regionBoxes = (it) => glyphBoxes(it.gl.map((q) => { const [x, y] = toScreen(q.wx, q.wy); return { ...q, x, y }; }), 2);
function drawRegionNames(g, band, lay) {
  if (!regionsShown(band)) return;
  const items = band === 'far' ? lay.regions ?? [] : regionItems(band, lay);
  g.globalAlpha = regionFade(band);
  for (const it of items) paintGlyphs(g, it.gl.map((q) => { const [x, y] = toScreen(q.wx, q.wy); return { ...q, x, y }; }), it.font, it.ink, it.halo, 3);
  g.globalAlpha = 1;
}
function placeRegionNames(band, lay) {
  const D = MED_DIAM, avoid = [...lay.placed, ...(lay.chips ?? []), ...lay.wildBoxes], out = []; // names, second lines, tokens, wild names
  // deviation: the armies' actual token boxes (in lay.placed) and each settlement's drawn extent stand in for the fixed token and seat
  // zones, which at the start zoom leave no room for a name across three provinces; region names are a live layer, so this stays exact
  if (band !== 'far' && !REGOPT.noSettle) for (const p of provs) for (const b of settlementBoxes(p.i)) { const [a0, b0] = toScreen(b[0], b[1]), [a1, b1] = toScreen(b[2], b[3]); avoid.push([a0, b0, a1, b1]); }
  const grid = new Map(); for (const b of avoid) gridAdd(grid, b);
  REGDBG.length = 0;
  // v3 critique 6: offsets from -0.5 D to +0.5 D (Far in steps of 0.125 D; Mid, where the lanes between the names and the towns are narrow,
  // in steps of 0.0625 D), and at Mid the two-province chains too; at most 900 tries a region, the cheap box test first
  const OFFS = band === 'far' ? [0.25, -0.25, 0.375, -0.375, 0.125, -0.125, 0.5, -0.5, 0] : [0.25, -0.25, 0.375, -0.375, 0.3125, -0.3125, 0.4375, -0.4375, 0.1875, -0.1875, 0.125, -0.125, 0.5, -0.5, 0.0625, -0.0625, 0];
  for (const rg of feats().regions) { const why = { name: rg.name, long: 0, out: 0, hit: 0, ok: 0, fs: 0 }; REGDBG.push(why);
    const n = rg.provs.length, fsMax = band === 'far' ? 15 + 9 * Math.min(1, (n - 3) / 5) : 13 + 2 * Math.min(1, (n - 3) / 3);
    const dark = DARK_T.has(rg.terrain), ink = dark ? 'rgba(244,238,223,.9)' : 'rgba(42,31,20,.9)', halo = rgba(TERRAIN[rg.terrain].fill, 0.5);
    const f100 = `100px 'Marcellus SC', Georgia, serif`, adv100 = [0]; for (let k = 1; k <= rg.name.length; k++) adv100.push(textW(rg.name.slice(0, k), f100)); // prefix advances at 100 px, scaled per size
    const w100 = adv100[rg.name.length] / 100; // the name's width at 1 px
    let done = false, tries = 0; const Pc = new Map(), spines = regionSpines(rg, band === 'far' ? 0.6 : 0.3).slice(0, band === 'far' ? 5 : 14);
    const attempt = (P, fs, trk) => { // true when the name is set on P
      fs = Math.round(fs * 2) / 2; const font = `${fs.toFixed(1)}px 'Marcellus SC', Georgia, serif`, adv = adv100.map((a) => (a * fs) / 100);
      if (adv[rg.name.length] + trk * fs * (rg.name.length - 1) > P.len * 0.98) { why.long++; return false; }
      const gl = layoutOnPath(rg.name, P, font, trk * fs, fs, adv); if (!gl) { why.long++; return false; }
      const bs = glyphBoxes(gl, 2); if (gridHit(grid, bs)) { why.hit++; return false; }
      const vis = gl.filter((q) => q.ch !== ' '), Bw = Math.max(2.5, 5.5 * cam.s), clearW = (Bw + fs * 0.5 + 2) / cam.s;
      const wpts = vis.map((q) => toWorld(q.x, q.y));
      if (wpts.some(([x, y]) => x < 4 || y < 4 || x > W - 4 || y > H - 4)) { why.out++; return false; }
      const owners = wpts.map((q) => nearest(q[0], q[1])), inRun = owners.filter((pi) => rg.set.has(pi)).length;
      if (owners.some((pi) => isWild(pi))) { why.out++; return false; } // a wild would cut the name // deviation: 60% of glyph centers inside the run (v3 critique 6: Mid 0.75 -> 0.6)
      if (inRun < 0.6 * vis.length) { why.out++; return false; }
      if (!REGOPT.noBand && wpts.some(([x, y], m) => { const pi = owners[m]; return !isWild(pi) && prov[pi].owner && distToEdge(cells[pi], x, y) < clearW; })) { why.hit++; return false; } // never under an owner band
      for (const b of bs) gridAdd(grid, b); why.ok = 1; why.fs = +fs.toFixed(1); done = true;
      out.push({ font, ink, halo, gl: gl.map((q) => { const [wx, wy] = toWorld(q.x, q.y); return { ...q, wx, wy }; }) }); return true;
    };
    for (const trk of [0.2, 0.12]) for (const sp of spines) for (const off of OFFS) for (const k of [1, 0.88]) {
      if (done || ++tries > (band === 'far' ? 700 : 160)) break;
      const pk = sp.pts.length + ':' + sp.pts[0][0] + ':' + off;
      let P = Pc.get(pk); if (!P) { P = orientUpright(sp.pts.map(([x, y], m) => toScreen(x + sp.nrm[m][0] * off * D, y + sp.nrm[m][1] * off * D))); P.Lc = cumLen(P); P.len = P.Lc.at(-1); Pc.set(pk, P); }
      const fs = Math.max(10, Math.min(fsMax, (0.9 * P.len) / (w100 + trk * (rg.name.length - 1)))) * k; if (fs < 10) { why.long++; continue; } // sized from the spine: 10 px up to the spec's size
      attempt(P, fs, trk);
    }
    // §3.9's last resort, a straight line: along the run's axis or level, scanned across the run in steps of 1/16 D (Mid only; the curved
    // search covers Far); the shortest line that holds the name at 10 to 12 px
    if (!done && band !== 'far') {
      const [bx0, by0, bx1, by1] = rg.provs.reduce((b, i) => { const q = geo(i).bb; return [Math.min(b[0], q[0]), Math.min(b[1], q[1]), Math.max(b[2], q[2]), Math.max(b[3], q[3])]; }, [Infinity, Infinity, -Infinity, -Infinity]), st = D / 14;
      outer: for (const fs of [12, 10]) for (const ang of [0, Math.atan2(rg.ax[1], rg.ax[0])]) {
        const a = ((ang + Math.PI / 2) % Math.PI) - Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a), half = ((w100 + 0.12 * (rg.name.length - 1)) * fs) / cam.s / 2 / 0.95;
        for (let y = by0 + st; y < by1; y += st) for (let x = bx0 + half; x < bx1 - half; x += st) {
          const P = [toScreen(x - ca * half, y - sa * half), toScreen(x + ca * half, y + sa * half)], hh = fs * 0.5 + 3; P.len = Math.hypot(P[1][0] - P[0][0], P[1][1] - P[0][1]);
          if (gridHit(grid, [[Math.min(P[0][0], P[1][0]) - hh * Math.abs(sa), Math.min(P[0][1], P[1][1]) - hh, Math.max(P[0][0], P[1][0]) + hh * Math.abs(sa), Math.max(P[0][1], P[1][1]) + hh]]) && !sa) { why.hit++; continue; } // the line's box first (exact enough when level)
          if (!rg.set.has(nearest(x, y))) continue;
          if (attempt(P, fs, 0.12)) break outer;
        }
      }
    }
  }
  return out;
}
// v3 critique 6: the settlement's drawn extent, measured tighter than v3's box (which was 1.3 x its radius wide and missed the pennant):
// the houses with their roofs, the temple, lab and keep where built, and the pennant as its own narrow box (world units)
function settlementBoxes(i) {
  const p = prov[i], st = settlementC(i), L = LS, top = st.sy - st.rad * 0.62 - 4.6 * HSC - 2;
  let x0 = st.sx - st.rad - 4, x1 = st.sx + st.rad + 4, y0 = top; const y1 = st.sy + st.rad * 0.62 + 3;
  if (p.buildings.includes('temple') || p.build) x1 = st.sx + st.rad + 13 * L;
  if (p.buildings.includes('lab')) x0 = st.sx - st.rad - 13 * L;
  if (p.buildings.includes('fort')) y0 = Math.min(y0, st.sy - st.rad * 0.62 - 3 - 17 * L - 2);
  if (p.pd >= 15) y0 = Math.min(y0, st.sy - (st.rad + 3) * 0.62 - 6);
  const h0 = st.houses[0], px = h0.x, py = h0.y - 4.6 * HSC;
  return [[x0, y0, x1, y1], [px - 2, py - 9 * L - 2, px + 6 * L + 2, py]];
}
// A region's name runs along a chain of its provinces: the longest chains first, the more level ones preferred; smoothed, ends extended.
function regionSpines(rg, extK) {
  const mk = view.borders + extK; if (rg.spines && rg.spinesMode === mk) return rg.spines;
  const ids = rg.provs, idx = new Map(ids.map((i, k) => [i, k])), paths = [];
  for (const a of ids) { const prev = new Map([[a, -1]]), q = [a]; for (let h = 0; h < q.length; h++) for (const w of nbrs(q[h])) if (idx.has(w) && !prev.has(w)) { prev.set(w, q[h]); q.push(w); }
    for (const b of ids) { if (b <= a) continue; const chain = []; for (let v = b; v !== -1; v = prev.get(v)) chain.unshift(v); const dx = cent[b][0] - cent[a][0], dy = cent[b][1] - cent[a][1], d = Math.hypot(dx, dy); paths.push({ chain, score: d * (0.55 + 0.45 * Math.abs(dx) / (d || 1)) }); } }
  paths.sort((x, y) => y.score - x.score);
  const out = [], pairs = paths.filter((q) => q.chain.length === 2 && !paths.slice(0, 8).includes(q)); // the 8 longest chains, then the two-province ones
  for (const pth of [...paths.slice(0, 8), ...pairs]) {
    let P = pth.chain.map((i) => [...cent[i]]); if (P.length < 2) continue;
    const ext = (p0, p1) => { const L = Math.hypot(p0[0] - p1[0], p0[1] - p1[1]) || 1; return [p0[0] + ((p0[0] - p1[0]) / L) * extK * MED_DIAM, p0[1] + ((p0[1] - p1[1]) / L) * extK * MED_DIAM]; };
    P = chaikin([ext(P[0], P[1]), ...P, ext(P[P.length - 1], P[P.length - 2])], 3, false);
    const nrm = P.map((q, m) => { const a = P[Math.max(0, m - 1)], b = P[Math.min(P.length - 1, m + 1)], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [-(b[1] - a[1]) / L, (b[0] - a[0]) / L]; });
    out.push({ pts: P, nrm });
  }
  rg.spines = out; rg.spinesMode = mk; return out;
}

const GC = 48; // a coarse screen grid for box collisions
function gridAdd(grid, b) { for (let x = Math.floor(b[0] / GC); x <= Math.floor(b[2] / GC); x++) for (let y = Math.floor(b[1] / GC); y <= Math.floor(b[3] / GC); y++) { const k = x + ',' + y; let l = grid.get(k); if (!l) grid.set(k, (l = [])); l.push(b); } }
function gridHit(grid, bs) { for (const b of bs) for (let x = Math.floor(b[0] / GC); x <= Math.floor(b[2] / GC); x++) for (let y = Math.floor(b[1] / GC); y <= Math.floor(b[3] / GC); y++) { const l = grid.get(x + ',' + y); if (l) for (const q of l) if (b[2] > q[0] && b[0] < q[2] && b[3] > q[1] && b[1] < q[3]) return true; } return false; }
