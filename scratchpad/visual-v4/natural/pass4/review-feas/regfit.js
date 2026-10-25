// Do region names fit their regions at Lean-back? For pseudo-regions of about 7 provinces (BFS chunks), the longest of regionSpines' first 5 spines (extended 0.3 D),
// against the record-style names at the design's sizes (Lean-back 15 px, 0.28 em tracking; and 12.5 px at 0.12 em), at a few zooms
(() => {
  layout(); const out = { provinces: provList.length, view: [cw, ch, dpr], fitDpx: +(fitScale * MED_DIAM).toFixed(1), minDpx: +(minScale * MED_DIAM).toFixed(1) };
  const left = new Set(provList), regs = []; while (left.size) { const s0 = Math.min(...left), q = [s0], got = [s0]; left.delete(s0); for (let h = 0; h < q.length && got.length < 7; h++) for (const w of nbrs(q[h])) if (left.has(w) && got.length < 7) { left.delete(w); got.push(w); q.push(w); } if (got.length >= 5) regs.push({ provs: got }); }
  const NAMES = ['The Broad Plain', 'The Wind Knolls', 'The Sedge Fens', 'The Lark Leas', 'The Long Downs', 'The Mosswold', 'The Elderholt', 'The Gold Leas'];
  const wOf = (t, fs, tr) => textW(t, `${fs}px 'Marcellus SC', Georgia, serif`) + tr * fs * (t.length - 1);
  const nameW = (fs, tr) => NAMES.map((t) => wOf(t, fs, tr)), median = (a) => { const q = [...a].sort((x, y) => x - y); return +q[q.length >> 1].toFixed(0); };
  out.nameWidthPx = { lean15_028: [Math.round(Math.min(...nameW(15, 0.28))), Math.round(Math.max(...nameW(15, 0.28)))], far125_028: [Math.round(Math.min(...nameW(12.5, 0.28))), Math.round(Math.max(...nameW(12.5, 0.28)))], s12_012: [Math.round(Math.min(...nameW(12, 0.12))), Math.round(Math.max(...nameW(12, 0.12)))] };
  out.byZoom = {};
  for (const dpx of [26.6, 29.4, 36.7, 44, 54]) { const sc = dpx / MED_DIAM, L = regs.map((rg) => { const sp = regionSpines(rg, 0.3).slice(0, 5); return Math.max(...sp.map((S) => { const P = S.pts.map(([x, y]) => [x * sc, y * sc]), c = cumLen(P); return c[c.length - 1]; })); });
    const fits = (fs, tr) => { const nw = median(nameW(fs, tr)); return { medianSpinePx: median(L), medianNamePx: nw, shareFit: +(L.filter((l) => 0.85 * l >= nw).length / L.length).toFixed(2) }; };
    out.byZoom[dpx] = { lean15: fits(15, 0.28), far12_5: fits(12.5, 0.28), small12_012: fits(12, 0.12) }; }
  out.regions = regs.length; return JSON.stringify(out);
})()
