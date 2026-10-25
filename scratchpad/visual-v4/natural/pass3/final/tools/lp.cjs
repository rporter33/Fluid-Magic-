// the verifier's own line probe on rendered pixels (not the page's checks): the composite with the lines on against the same frame with the lines off
// (pieces, labels, badges, arrows off in both), WCAG contrast at the same pixel, the best over +-7 px across the edge, every 1 px along it, 6 px clear of its ends.
// Edge kinds from ownership: neutral (no owner either side), internal (one owner both sides), realm (rails), wild (skipped). Fogged-both-sides edges reported apart.
// LP(focus) -> per edge { i, j, kind, touches focus, n, min, p10, median, max }, plus summaries: focus edges against the floor, other edges as faint
const LP = (focusList) => String.raw`(() => {
  const focus = new Set(${JSON.stringify(focusList)}.filter((x) => x != null && x >= 0));
  const redraw = (skip) => { const was = new Set(SKIP); for (const k of skip) SKIP.add(k); RCK = null; draw(); const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data.slice(); SKIP.clear(); for (const k of was) SKIP.add(k); RCK = null; draw(); return d; };
  const land = redraw(['rails', 'pieces', 'labels', 'badges', 'arrows']), lines = redraw(['pieces', 'labels', 'badges', 'arrows']);
  const W2 = canvas.width, H2 = canvas.height, v = viewRect(), band = bandOf(cam.s);
  const f = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }, lum = (d, k) => 0.2126 * f(d[k]) + 0.7152 * f(d[k + 1]) + 0.0722 * f(d[k + 2]);
  const at = (sx, sy) => { const X = Math.floor(sx * dpr), Y = Math.floor(sy * dpr); if (X < 0 || Y < 0 || X >= W2 || Y >= H2) return -1; return (Y * W2 + X) * 4; };
  const pct = (a, q) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return +s[Math.min(s.length - 1, Math.floor(q * s.length))].toFixed(3); };
  const rows = [];
  for (const [, e] of EDGE) {
    if (isWild(e.i) || isWild(e.j)) continue;
    const oi = prov[e.i] ? prov[e.i].owner : null, oj = prov[e.j] ? prov[e.j].owner : null;
    const kind = oi && oj && oi === oj ? 'internal' : !oi && !oj ? 'neutral' : 'realm';
    const fogBoth = !!(fogOf(e.i) && fogOf(e.j));
    const [ax, ay] = toScreen(...e.a), [bx, by] = toScreen(...e.b), Lg = Math.hypot(bx - ax, by - ay); if (Lg < 16) continue;
    const nx = -(by - ay) / Lg, ny = (bx - ax) / Lg, cs = [];
    for (let s = 6; s <= Lg - 6; s += 1) {
      const sx = ax + ((bx - ax) * s) / Lg, sy = ay + ((by - ay) * s) / Lg; if (sx < v.l + 10 || sx > v.r - 10 || sy < v.t + 10 || sy > v.b - 10) continue;
      let b = 1; for (let o = -7; o <= 7; o += 0.5) { const k = at(sx + nx * o, sy + ny * o); if (k < 0) continue; const x = lum(lines, k), y = lum(land, k); const c = (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); if (c > b) b = c; }
      cs.push(b);
    }
    if (cs.length < 4) continue;
    rows.push({ i: e.i, j: e.j, a: names[e.i], b: names[e.j], kind, fogBoth, touches: focus.has(e.i) || focus.has(e.j), n: cs.length, min: pct(cs, 0), p10: pct(cs, 0.1), median: pct(cs, 0.5), max: pct(cs, 1), under23: cs.filter((x) => x < 2.3).length, under32: cs.filter((x) => x < 3.2).length });
  }
  const floorOf = (r) => (r.kind === 'internal' && band !== 'far' ? 3.2 : 2.3);
  const sum = (sel) => { const R = rows.filter(sel); const mins = R.map((r) => r.min), meds = R.map((r) => r.median), maxs = R.map((r) => r.max); return { edges: R.length, samples: R.reduce((a, r) => a + r.n, 0), minOfMins: pct(mins, 0), medianOfMedians: pct(meds, 0.5), p90OfMedians: pct(meds, 0.9), maxOfMax: pct(maxs, 1), edgesWithAnyUnderFloor: R.filter((r) => r.min < floorOf(r)).length, samplesUnderFloor: R.reduce((a, r) => a + (floorOf(r) === 3.2 ? r.under32 : r.under23), 0), edgesWithMedianOverFloor: R.filter((r) => r.median >= floorOf(r)).length }; };
  return { look: rlShownLook(), mode: state.mode, band, Dpx: +(cam.s * MED_DIAM).toFixed(1), dpr, hover: hoverProv >= 0 ? names[hoverProv] : null, sel: state.sel ? (state.sel.type === 'prov' ? 'prov:' + names[state.sel.id] : state.sel.type + ':' + state.sel.id) : null, focus: [...focus].map((x) => names[x]),
    focusNeutral: sum((r) => r.touches && !r.fogBoth && r.kind === 'neutral'), focusInternal: sum((r) => r.touches && !r.fogBoth && r.kind === 'internal'), focusFog: sum((r) => r.touches && r.fogBoth && r.kind !== 'realm'),
    otherNeutral: sum((r) => !r.touches && !r.fogBoth && r.kind === 'neutral'), otherInternal: sum((r) => !r.touches && !r.fogBoth && r.kind === 'internal'), otherFog: sum((r) => !r.touches && r.fogBoth && r.kind !== 'realm'), realm: sum((r) => r.kind === 'realm' && !r.fogBoth),
    focusUnder: rows.filter((r) => r.touches && !r.fogBoth && r.kind !== 'realm' && r.min < floorOf(r)).map((r) => r.a + '/' + r.b + ' ' + r.kind + ' min ' + r.min + ' p10 ' + r.p10 + ' under ' + (floorOf(r) === 3.2 ? r.under32 : r.under23) + '/' + r.n),
    otherBright: rows.filter((r) => !r.touches && !r.fogBoth && r.kind !== 'realm' && r.median >= 2.0).map((r) => r.a + '/' + r.b + ' ' + r.kind + ' med ' + r.median + ' max ' + r.max), rows };
})()`;
module.exports = { LP };
