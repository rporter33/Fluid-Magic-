
(() => {
'use strict';
// ------------------------------------------------------------------ icons (monoline 24x24)
const ICON = {
  pop: '<path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 20c0-3.3 2.7-6 6-6s6 2.7 6 6M12 20c0-3.3 1.8-6 4-6s6 2.7 6 6"/>',
  gold: '<circle cx="12" cy="12" r="8"/><path d="M12 7v10M9 9.5h4.5a2 2 0 0 1 0 4H10a2 2 0 0 0 0 4H15"/>',
  anvil: '<path d="M3 8h14l4-2v4a4 4 0 0 1-4 4h-2l1 4H8l1-4H7A4 4 0 0 1 3 10z"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21V5M8 7h7"/>',
  candle: '<path d="M10 10h4v11h-4zM12 3c1.5 2 2 3 0 5-2-2-1.5-3 0-5z"/>',
  well: '<path d="M4 12h16v8H4zM6 12V9a6 3 0 0 1 12 0v3M12 4v3M9 2l3 2 3-2"/>',
  ledger: '<path d="M4 4h16v16H4zM4 9h16M4 14h16M10 4v16"/>',
  codex: '<path d="M5 4h11l3 3v13H5zM9 9h6M9 13h6M9 17h4"/>',
  supply: '<path d="M12 21V9M12 9c0-3 2-5 5-5 0 3-2 5-5 5zm0 4c0-3-2-5-5-5 0 3 2 5 5 5zm0 4c0-2.5 2-4.5 4.5-4.5"/>',
  fist: '<path d="M7 11V7a1.5 1.5 0 0 1 3 0v3M10 10V6a1.5 1.5 0 0 1 3 0v4M13 10V7a1.5 1.5 0 0 1 3 0v4M16 11V9a1.5 1.5 0 0 1 3 0v4c0 4-3 7-7 7s-6-3-6-6v-2a1.5 1.5 0 0 1 3 0"/>',
  growth: '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
  fort: '<path d="M4 20V9l2-2 2 2V5h8v4l2-2 2 2v11zM10 20v-4a2 2 0 0 1 4 0v4"/>',
  temple: '<path d="M3 9l9-5 9 5M5 9v10M19 9v10M9 9v10M15 9v10M3 20h18"/>',
  lab: '<path d="M9 3h6M10 3v6l-6 10a1.5 1.5 0 0 0 1.3 2h13.4a1.5 1.5 0 0 0 1.3-2L14 9V3M7 15h10"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
  pd: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4"/>',
  tax: '<path d="M6 4h12v16l-3-2-3 2-3-2-3 2zM9 9h6M9 13h6"/>',
  dominion: '<path d="M10 10h4v11h-4zM12 3c1.5 2 2 3 0 5-2-2-1.5-3 0-5z"/>',
  ownership: '<path d="M5 21V4M5 4h12l-2 4 2 4H5"/>',
  sword: '<path d="M14 4h6v6L9 21l-3-3zM6 15l3 3M4 20l2-2"/>',
  hold: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  springs: '<path d="M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z"/>',
  terrainMode: '<path d="M4 4h16v16H4zM8 16c0-5 3-8 8-8 0 5-3 8-8 8zM8 16l5-5"/>', // natural §7: the Terrain mode, a square swatch with a leaf
};
// natural §7: seven terrain glyphs, 24 x 24 monoline, one silhouette each, single paths (so the map can draw them too). Farmland is never a wheat ear (supply);
// Mountains is one peak and never snow (the wild icon is three snow-capped peaks); Swamp is reeds over water, never a drop (Mana springs).
const TGLYPH = {
  plains: 'M3 19h18M6 19c0-3-1.2-5-2.5-6M6 19c0-3 1.2-5 2.5-6M12 19c0-3.5-1.2-6-2.5-7M12 19c0-3.5 1.2-6 2.5-7M18 19c0-3-1.2-5-2.5-6M18 19c0-3 1.2-5 2.5-6',
  farmland: 'M2 20h20M4.5 20L8 8h8l3.5 12M10.3 20L11 8M13.7 20L13 8M6.2 14h11.6',
  forest: 'M8 3l-5 9h3l-3 6h10l-3-6h3zM8 18v3M17 7l-4 7h2l-2 4h8l-2-4h2zM17 18v3',
  hills: 'M2 19c1.5-5 4-8 7-8s5.5 3 7 6M12 19c1.5-4 3.5-6 5.5-6s3.2 2.4 4.5 6M2 19h20',
  mountains: 'M2 20L12 4l10 16zM12 4l1.5 6-2 3.5 1.5 3',
  swamp: 'M3 17c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0M3 21c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0M8 15V8M12 15V4M16 15V9M11 4h2v4h-2z',
  wasteland: 'M2 19h20M6 19l1.5 2.5M10 19l-1 2.5M14 19l1.5-2.5 1 2.5M18 19V13M18 15l-3-3M18 14l3-4M16.4 13.4L15 11.2M19.7 11.8l1.6-.8',
};
const tGlyphSvg = (t, size, stroke = 'currentColor', sw = 1.7) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${TGLYPH[t]}"/></svg>`;
// the terrain chip (natural §7): a swatch in the terrain's Clear fill (the colour-blind-safe one) with its glyph inside, then the word; shape and colour carry it twice
const terrainSwatch = (t, size = 12) => `<span class="tsw" style="width:${size}px;height:${size}px;background:${RL_ALB[t]};color:${RL_KEYFOR[t]}" aria-hidden="true">${tGlyphSvg(t, size - 2, 'currentColor', 2.6)}</span>`;
const terrainChip = (t, lower) => `<span class="tchip">${terrainSwatch(t, 12)}<span>${lower ? TERRAIN[t].name.toLowerCase() : TERRAIN[t].name}</span></span>`;
const TGLYPH2D = {}; const tGlyphPath = (t) => (TGLYPH2D[t] ??= new Path2D(TGLYPH[t])); // for the map's chips
function svgIcon(name, size = 18, stroke = 'currentColor') {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[name] ?? ''}</svg>`;
}
document.querySelectorAll('[data-icon]').forEach((el) => { el.innerHTML = svgIcon(el.dataset.icon, 18); el.style.display = 'inline-flex'; el.style.color = 'var(--dim)'; });

// Mana symbols: shape + letter + hue, never hue alone.
const MANA = {
  W: { name: 'Radiance', fill: '#F3E6B8', ink: '#5A4A1C', shape: '<circle cx="12" cy="12" r="5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>' },
  U: { name: 'Tide', fill: '#3A7BD5', ink: '#fff', shape: '<path d="M3 14c3-4 6-4 9 0s6 4 9 0M3 18c3-3 6-3 9 0s6 3 9 0M8 9c2-3 6-3 8 0"/>' },
  B: { name: 'Umbra', fill: '#3D2B4F', ink: '#E6D6F5', shape: '<path d="M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z"/><circle cx="10" cy="14" r="1"/><circle cx="14" cy="14" r="1"/>' },
  R: { name: 'Ember', fill: '#FD6533', ink: '#2A0A04', shape: '<path d="M12 21c-4 0-6-3-6-6 0-4 3-6 4-10 1 3 3 4 3 6 1-1 2-2 2-4 2 2 3 5 3 8 0 3-2 6-6 6z"/>' },
  G: { name: 'Loam', fill: '#00674B', ink: '#DFF5E8', shape: '<path d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14zM5 19l8-8"/>' },
};
function manaSym(c, size = 18) {
  const m = MANA[c];
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-label="${m.name} (${c})"><circle cx="12" cy="12" r="11" fill="${m.fill}" stroke="rgba(0,0,0,.45)"/><g fill="none" stroke="${m.ink}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" transform="translate(4.8 4.8) scale(.6)">${m.shape}</g></svg>`;
}
document.getElementById('bannerSvg').innerHTML = `<svg width="22" height="28" viewBox="0 0 22 28"><path d="M1 1h20v20l-10 6-10-6z" fill="#FD6533" stroke="#7A1E12"/><g transform="translate(4 4) scale(.58)" fill="none" stroke="#2A0A04" stroke-width="2" stroke-linejoin="round">${MANA.R.shape}</g></svg>`;

Object.assign(ICON, {
  leaf: '<path d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14zM5 19l8-8"/>',
  wheat: '<path d="M12 21V8M12 8c-2-1-3-3-3-5 2 1 3 3 3 5zm0 0c2-1 3-3 3-5-2 1-3 3-3 5zM12 13c-2-1-3-3-3-5 2 1 3 3 3 5zm0 0c2-1 3-3 3-5-2 1-3 3-3 5z"/>',
  ash: '<path d="M4 8h3M10 6h2M15 9h4M6 13h2M11 12h3M17 15h2M5 18h3M12 18h2"/>',
  fire: '<path d="M12 21c-4 0-6-3-6-6 0-4 3-6 4-10 1 3 3 4 3 6 1-1 2-2 2-4 2 2 3 5 3 8 0 3-2 6-6 6z"/>',
  blades: '<path d="M4 4l16 16M20 4L4 20M4 4h4M4 4v4M20 4h-4M20 4v4"/>',
  mountain: '<path d="M2 20l7-12 4 6 3-4 6 10z"/>',
});

const T_START = performance.now(); // review: the first paint is reported from here
// ------------------------------------------------------------------ seeded randomness (every draw is seeded; nothing unseeded) and color helpers
function mulberry32(a) { return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function h32(str) { let h = 0x811c9dc5; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); } h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return h >>> 0; }
const rngFor = (key) => mulberry32(h32(key));
const hex2rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const rgb2hex = (c) => '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const s2l = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const l2s = (c) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.max(0, c) ** (1 / 2.4) - 0.055);
function rgb2lab([r, g, b]) {
  const R = s2l(r), G = s2l(g), B = s2l(b);
  const X = (0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047, Y = 0.2126 * R + 0.7152 * G + 0.0722 * B, Z = (0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116); const fx = f(X), fy = f(Y), fz = f(Z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}
function lab2rgb([L, a, b]) {
  const fy = (L + 16) / 116, fx = fy + a / 500, fz = fy - b / 200; const fi = (t) => (t ** 3 > 0.008856 ? t ** 3 : (t - 16 / 116) / 7.787);
  const X = fi(fx) * 0.95047, Y = fi(fy), Z = fi(fz) * 1.08883;
  return [l2s(3.2406 * X - 1.5372 * Y - 0.4986 * Z), l2s(-0.9689 * X + 1.8758 * Y + 0.0415 * Z), l2s(0.0557 * X - 0.204 * Y + 1.057 * Z)];
}
const LCACHE = new Map();
function shadeL(hex, dL) { const k = hex + dL; let v = LCACHE.get(k); if (!v) { const lab = rgb2lab(hex2rgb(hex)); lab[0] = Math.max(0, Math.min(100, lab[0] + dL)); v = rgb2hex(lab2rgb(lab)); LCACHE.set(k, v); } return v; }
function desat(hex, k, minL) { const lab = rgb2lab(hex2rgb(hex)); lab[1] *= 1 - k; lab[2] *= 1 - k; if (minL != null) lab[0] = Math.max(lab[0], minL); return rgb2hex(lab2rgb(lab)); }
function mix(a, b, t) { const A = hex2rgb(a), B = hex2rgb(b); return rgb2hex(A.map((v, j) => v + (B[j] - v) * t)); }
const rgba = (hex, a) => { const [r, g, b] = hex2rgb(hex); return `rgba(${r},${g},${b},${a})`; };

// ------------------------------------------------------------------ the example map (66 sites: 60 provinces and 6 wild cells)
const MAP_SEED = 12, RANGE_GAP = 2; // see the notes at the bottom of the file
const rnd = mulberry32(MAP_SEED);
const W = 1600, H = 1000, COLS = 11, ROWS = 6;
let pts = [];
for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
  pts.push([(c + 0.5) / COLS * W + (rnd() - 0.5) * (W / COLS) * 0.8, (r + 0.5) / ROWS * H + (rnd() - 0.5) * (H / ROWS) * 0.8]);
}
let delaunay, voronoi;
for (let k = 0; k < 2; k++) {
  delaunay = d3.Delaunay.from(pts); voronoi = delaunay.voronoi([0, 0, W, H]);
  pts = pts.map((p, i) => d3.polygonCentroid(voronoi.cellPolygon(i)));
}
delaunay = d3.Delaunay.from(pts); voronoi = delaunay.voronoi([0, 0, W, H]);
const N = pts.length;
// Adjacency only through shared border segments (Voronoi neighbors, never clipped Delaunay edges).
const NB = [...Array(N).keys()].map((i) => [...voronoi.neighbors(i)]);
const cells = [...Array(N).keys()].map((i) => voronoi.cellPolygon(i));
const cent = cells.map((c) => d3.polygonCentroid(c));
const areaOf = cells.map((c) => Math.abs(d3.polygonArea(c)));
const nearest = (x, y) => delaunay.find(x, y);
const TERRAIN = {
  plains: { name: 'Plains', fill: '#C1D29F' }, farmland: { name: 'Farmland', fill: '#EEBA3A' },
  forest: { name: 'Forest', fill: '#374C2B' }, hills: { name: 'Hills', fill: '#856824' },
  mountains: { name: 'Mountains', fill: '#8DA4AD' }, swamp: { name: 'Swamp', fill: '#1A727A' },
  wasteland: { name: 'Wasteland', fill: '#AE897F' },
};
// Palette A/B (palette-ab/decision.md): Bright is the approved docs/09 fills (the default); Painted is the muted set that still keeps docs/09's
// rule (20 / 12 every pair, every band readable). The Palette control and ?palette=painted swap the fills; everything derived from a fill
// follows it, while the data-mode bases, keylines, inks, halos, wild grounds and the paint recipe stay as they are.
// Painted also carries the palette-ab critique's drawing fixes 1 to 5 (p52 paletteP / treeP, p54 canopyBlocked / drawWater, p55 canopy, groundP,
// stampItemP), each gated on PAINTED_PAL() so Bright stays pixel-identical to the approved v3 drawing.
const PALETTES = {
  bright: { plains: '#C1D29F', farmland: '#EEBA3A', forest: '#374C2B', hills: '#856824', mountains: '#8DA4AD', swamp: '#1A727A', wasteland: '#AE897F' },
  painted: { plains: '#D4DCC0', farmland: '#CEA265', forest: '#243F1B', hills: '#7D6542', mountains: '#9FB8D0', swamp: '#58696E', wasteland: '#9E8A91' },
};
const PALETTE0 = new URLSearchParams(location.search).get('palette') === 'painted' ? 'painted' : 'bright';
for (const t of Object.keys(TERRAIN)) TERRAIN[t].fill = PALETTES[PALETTE0][t];
// v4: Map look. Relief (map-design-final.md, the default) or Painted (v3, ?look=v3: the page behaves exactly as before)
const LOOK0 = new URLSearchParams(location.search).get('look') === 'v3' ? 'v3' : 'relief';
const noise = (x, y) => Math.sin(x * 0.0042 + 1.3) + Math.sin(y * 0.0063 + 0.4) + 0.6 * Math.sin((x + y) * 0.0101 + 2.1) + 0.4 * Math.sin((x - 2 * y) * 0.007);
const wet = (x, y) => Math.sin(x * 0.0051 + 2.7) + Math.sin(y * 0.0047 + 1.9) + 0.6 * Math.sin((x - y) * 0.0089 + 0.6) + 0.4 * Math.sin((2 * x + y) * 0.0061 + 4.2);
// Capitals first, as before.
const redCap = nearest(230, 520), greenCap = nearest(1380, 470);

// ---- wilds: named peaks and meres that are map cells but not provinces
const WILD_PLAN = [['ashspine', 'peaks', 'The Ashspine', 3], ['stillmere', 'mere', 'The Still Mere', 1], ['greyteeth', 'peaks', 'The Greyteeth', 2]];
const wildOf = new Array(N).fill(null);
const WILDS = [];
{
  const onRect = (i) => cells[i].some(([x, y]) => x < 0.5 || y < 0.5 || x > W - 0.5 || y > H - 0.5);
  const hops = (from, blocked) => { const d = new Array(N).fill(Infinity); const q = []; for (const f of from) { d[f] = 0; q.push(f); } for (let h = 0; h < q.length; h++) for (const w of NB[q[h]]) if (d[w] === Infinity && !(blocked && blocked.has(w))) { d[w] = d[q[h]] + 1; q.push(w); } return d; };
  const capHops = hops([redCap, greenCap]);
  const graphCheck = (blocked) => { // connected, and no cut vertex (iterative Tarjan)
    const disc = new Array(N).fill(-1), low = new Array(N).fill(0); let t = 0, cut = false, rootKids = 0;
    const start = [...Array(N).keys()].find((i) => !blocked.has(i));
    const stack = [[start, -1, 0]]; disc[start] = low[start] = t++;
    while (stack.length) {
      const top = stack[stack.length - 1], v = top[0], parent = top[1], list = NB[v];
      if (top[2] < list.length) {
        const w = list[top[2]++]; if (blocked.has(w)) continue;
        if (disc[w] < 0) { disc[w] = low[w] = t++; stack.push([w, v, 0]); if (v === start) rootKids++; } else if (w !== parent) low[v] = Math.min(low[v], disc[w]);
      } else { stack.pop(); if (parent >= 0) { low[parent] = Math.min(low[parent], low[v]); if (parent !== start && low[v] >= disc[parent]) cut = true; } }
    }
    if (rootKids > 1) cut = true;
    let reached = 0; for (let i = 0; i < N; i++) if (disc[i] >= 0) reached++;
    return reached === N - blocked.size && !cut;
  };
  const eligible = (c, rangeCells) => {
    if (wildOf[c] || rangeCells.includes(c) || onRect(c) || capHops[c] < 3) return false;
    for (const r of WILDS) if (hops(r.cells)[c] < RANGE_GAP) return false;
    const blocked = new Set([...WILDS.flatMap((r) => r.cells), ...rangeCells, c]);
    for (const w of NB[c]) if (!blocked.has(w) && NB[w].filter((x) => !blocked.has(x)).length < 2) return false;
    if (!graphCheck(blocked)) return false;
    for (const cellsR of [...WILDS.map((r) => r.cells), [...rangeCells, c]]) { // the way around stays short
      const ring = [...new Set(cellsR.flatMap((x) => NB[x]))].filter((x) => !blocked.has(x));
      for (const a of ring) { const d = hops([a], blocked); if (ring.some((b) => d[b] > 6)) return false; }
    }
    return true;
  };
  for (const [id, kind, name, size] of WILD_PLAN) {
    const score = (i) => (kind === 'peaks' ? noise(...pts[i]) : wet(...pts[i]) - noise(...pts[i]));
    const seeds = [...Array(N).keys()].sort((a, b) => score(b) - score(a));
    let tries = 0, done = null;
    for (const s of seeds) {
      if (!eligible(s, [])) continue; if (++tries > 12) break;
      const rc = [s];
      while (rc.length < size) { const cand = [...new Set(rc.flatMap((x) => NB[x]))].filter((x) => eligible(x, rc)).sort((a, b) => score(b) - score(a)); if (!cand.length) break; rc.push(cand[0]); }
      if (rc.length === size) { done = rc; break; }
    }
    if (!done) continue;
    const w = { id, kind, name, cells: done };
    w.big = done.reduce((a, b) => (areaOf[b] > areaOf[a] ? b : a));
    WILDS.push(w); for (const c of done) wildOf[c] = w;
  }
}
const isWild = (i) => wildOf[i] !== null;
const provList = [...Array(N).keys()].filter((i) => !isWild(i));
const nbrs = (i) => NB[i].filter((w) => !isWild(w));
// Terrain ranks over the 60 provinces with today's shares.
const order = [...provList].sort((a, b) => noise(...pts[a]) - noise(...pts[b]));
const shares = [['swamp', .08], ['forest', .22], ['farmland', .14], ['plains', .24], ['wasteland', .1], ['hills', .14], ['mountains', .08]];
const terr = new Array(N).fill(null); { let i = 0; for (const [t, s] of shares) { const n = Math.round(s * provList.length); for (let k = 0; k < n && i < order.length; k++) terr[order[i++]] = t; } while (i < order.length) terr[order[i++]] = 'plains'; }
terr[redCap] = 'plains'; terr[greenCap] = 'forest';
function bfs(from) { const d = new Array(N).fill(Infinity); d[from] = 0; const q = [from]; for (let h = 0; h < q.length; h++) { const v = q[h]; for (const w of nbrs(v)) if (d[w] === Infinity) { d[w] = d[v] + 1; q.push(w); } } return d; }
const dRed = bfs(redCap), dGreen = bfs(greenCap);
const owner = new Array(N).fill(null);
[...provList].sort((a, b) => dRed[a] - dRed[b]).slice(0, 9).forEach((i) => (owner[i] = 'red'));
provList.filter((i) => owner[i] === null).sort((a, b) => dGreen[a] - dGreen[b]).slice(0, 8).forEach((i) => (owner[i] = 'green'));
const A = ['Ash', 'Cin', 'Kar', 'Vel', 'Mor', 'Thorn', 'Fen', 'Oak', 'Briar', 'Gall', 'Rook', 'Hale', 'Sun', 'Dusk', 'Bram', 'Wyr', 'Elm', 'Cold', 'Red', 'Stag', 'Gor', 'Lan', 'Tor', 'Mar'];
const B = ['fen', 'reach', 'vale', 'moor', 'hold', 'mere', 'ford', 'wick', 'march', 'barrow', 'holt', 'crag', 'stead', 'dale', 'gate', 'brook'];
const used = new Set(['Kharnath', 'Deepmoss', 'Ashfen', 'Sunmere', 'Morholt']); const names = new Array(N).fill('');
for (const i of provList) { let nm; do { nm = A[Math.floor(rnd() * A.length)] + B[Math.floor(rnd() * B.length)]; } while (used.has(nm)); used.add(nm); names[i] = nm; }
for (const w of WILDS) for (const c of w.cells) names[c] = w.name;
names[redCap] = 'Kharnath'; names[greenCap] = 'Deepmoss';
// A red border province facing Thornwood becomes Ashfen.
const redBorder = provList.filter((i) => owner[i] === 'red' && nbrs(i).some((w) => owner[w] !== 'red')).sort((a, b) => dGreen[a] - dGreen[b]);
const ashfen = redBorder[0]; names[ashfen] = 'Ashfen'; terr[ashfen] = 'swamp';
const morholt = redBorder.find((i, k) => k >= 2 && i !== redCap) ?? redBorder.at(-1); names[morholt] = 'Morholt';
const prov = [...Array(N).keys()].map((i) => {
  if (isWild(i)) return { i, wild: wildOf[i], name: wildOf[i].name, terrain: null, owner: null, dom: { n: null, s: 0 }, springs: [], buildings: [], pop: 0, unrest: 0, pd: 0, indep: 0, well: false };
  const t = terr[i];
  const cap = i === redCap || i === greenCap;
  return {
    i, name: names[i], terrain: t, owner: owner[i], cap,
    pop: cap ? 25000 : Math.round((2000 + rnd() * 9000) / 100) * 100,
    unrest: owner[i] === 'red' ? Math.round(rnd() * 22) : Math.round(rnd() * 40),
    dom: owner[i] === 'red' ? { n: 'red', s: i === redCap ? 5 : 1 + Math.floor(rnd() * 3) } : owner[i] === 'green' ? { n: 'green', s: i === greenCap ? 5 : 1 + Math.floor(rnd() * 3) } : { n: null, s: 0 },
    springs: rnd() < 0.45 ? [['W', 'U', 'B', 'R', 'G'][Math.floor(rnd() * 5)]] : [],
    indep: owner[i] === null ? 8 + Math.floor(rnd() * 26) : 0,
    buildings: cap ? ['fort', 'temple', 'lab'] : [],
    well: false, pd: cap ? 6 : owner[i] ? Math.floor(rnd() * 3) : 0,
  };
});
const provs = provList.map((i) => prov[i]);
prov[ashfen].unrest = 31; prov[ashfen].dom = { n: 'green', s: 2 }; prov[ashfen].pop = 7400;
// Wellsprings: three provinces far from both capitals; one already Cinder Horde's.
const wellCands = provList.filter((i) => !prov[i].cap && dRed[i] >= 3 && dGreen[i] >= 3).sort((a, b) => Math.abs(dRed[a] - dGreen[a]) - Math.abs(dRed[b] - dGreen[b]));
const wells = []; for (const i of wellCands) { if (wells.every((w) => !nbrs(w).includes(i))) wells.push(i); if (wells.length === 3) break; }
wells.forEach((i) => { prov[i].well = true; prov[i].indep = 30; });
const ownWell = provList.filter((i) => owner[i] === 'red' && !prov[i].cap && i !== ashfen && i !== morholt && dRed[i] >= 2).sort((a, b) => dRed[b] - dRed[a])[0] ?? provList.find((i) => owner[i] === 'red' && !prov[i].cap && i !== ashfen && i !== morholt);
prov[ownWell].well = true; prov[ownWell].name = 'Sunmere'; names[ownWell] = 'Sunmere';
const wildsBordering = (i) => WILDS.filter((w) => w.cells.some((c) => NB[i].includes(c)));

// Commanders. Personal names are presentation state; the unit is the title ("Varo, Ash Chieftain").
const greenTarget = ashfen;
const greenFrom = nbrs(ashfen).find((w) => owner[w] === 'green') ?? nbrs(ashfen).find((w) => owner[w] !== 'red') ?? greenCap;
const scoutAt = redBorder[1] ?? redCap;
const cmd = {
  varo: { id: 'varo', name: 'Varo', unit: 'Ash Chieftain', ptype: 'ashChieftain', side: 'red', at: ashfen, hp: [14, 14], mor: 13, lead: 80, pips: '', order: 'Guard', gear: { n: 1, tier: 2 }, squads: [['Cinder Warriors', 30, 100], ['Flame Archers', 18, 92]], script: ['hold', 'hold', 'sword', 'sword', 'sword'] },
  titan: { id: 'titan', name: 'The Ashen Titan', unit: 'Titan (pretender)', ptype: 'titan', side: 'red', at: redCap, hp: [60, 60], mor: 18, lead: 100, pips: 'RRRR', order: 'Idle', squads: [], script: ['bolt', 'bolt', 'bolt', 'sword', 'sword'], crown: true },
  seren: { id: 'seren', name: 'Seren', unit: 'Ember Adept', ptype: 'emberAdept', side: 'red', at: redCap, hp: [10, 10], mor: 10, lead: 10, pips: 'R', order: 'Research', squads: [], script: ['bolt', 'bolt', 'bolt', 'bolt', 'bolt'] },
  ondra: { id: 'ondra', name: 'Ondra', unit: 'Pyre Priest', ptype: 'pyrePriest', side: 'red', at: redCap, hp: [10, 10], mor: 11, lead: 20, pips: 'R', holy: 2, order: 'Preach', squads: [], script: ['bolt', 'bolt', 'bolt', 'bolt', 'bolt'] },
  kesh: { id: 'kesh', name: 'Kesh', unit: 'Cinder Scout', ptype: 'cinderScout', side: 'red', at: scoutAt, hp: [10, 10], mor: 10, lead: 10, pips: '', order: 'Idle', scout: true, stealthy: true, squads: [], script: ['hold', 'hold', 'hold', 'hold', 'hold'] },
  ilsa: { id: 'ilsa', name: 'Ilsa Oakhand', unit: 'Warden Captain', ptype: 'wardenCaptain', side: 'green', at: greenFrom, to: greenTarget, eta: 4, hp: [14, 14], mor: 12, lead: 80, squads: [['Wardens', 34, 100], ['Longbow Hunters', 18, 100]] },
};
const cname = (c) => (c.crown ? c.name : `${c.name}, ${c.unit}`);

// Time-lapse cast: the provinces the scripted months touch.
const captureTargets = provList.filter((i) => owner[i] === null && !prov[i].well && i !== greenFrom && nbrs(i).some((w) => owner[w] === 'red')).sort((a, b) => dRed[a] - dRed[b] || prov[b].pop - prov[a].pop).slice(0, 2);
const greenBorder = provList.filter((i) => owner[i] === 'green' && i !== greenCap && nbrs(i).some((w) => owner[w] !== 'green')).sort((a, b) => dRed[a] - dRed[b]);
const pillageProv = greenBorder[0] ?? greenCap, burnProv = greenBorder[1] ?? greenBorder[0], ashRainProv = greenBorder[2] ?? greenBorder[0];
prov[pillageProv].pop = 5600; // a town that the pillage drops a tier
// Fog: the far east is unexplored; Deepmoss and one more were seen once and are out of sight now.
const FOG = new Array(N).fill(null);
{
  const cast = new Set([pillageProv, burnProv, ashRainProv, greenFrom, ashfen, ...captureTargets, ...wells]);
  const far = provList.filter((i) => !nbrs(i).some((w) => owner[w] === 'red') && owner[i] !== 'red' && i !== greenCap && !cast.has(i)).sort((a, b) => cent[b][0] - cent[a][0]);
  far.slice(0, 8).forEach((i) => (FOG[i] = 'unexplored'));
  FOG[greenCap] = 'outofsight'; if (far[8] != null) FOG[far[8]] = 'outofsight';
}

// ------------------------------------------------------------------ v3: hand-ruled borders. One seeded polyline per shared edge, used by the fill, the border,
// the band, hover, selection, the hit test and the wild contour (H3). Endpoints stay the Voronoi vertices; adjacency stays NB.
const PEQ = (a, b) => Math.abs(a[0] - b[0]) < 0.01 && Math.abs(a[1] - b[1]) < 0.01;
const MEAN_AREA0 = provList.reduce((a, i) => a + areaOf[i], 0) / provList.length;
const EDGE_L = 3 * Math.sqrt(MEAN_AREA0 / 6400); // recursion floor: 3 units on a 6400-unit province
const lerp2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
function segCross(a, b, p, q) { // proper crossing of segments ab and pq
  const d = (b[0] - a[0]) * (q[1] - p[1]) - (b[1] - a[1]) * (q[0] - p[0]); if (Math.abs(d) < 1e-9) return false;
  const u = ((p[0] - a[0]) * (q[1] - p[1]) - (p[1] - a[1]) * (q[0] - p[0])) / d, v = ((p[0] - a[0]) * (b[1] - a[1]) - (p[1] - a[1]) * (b[0] - a[0])) / d;
  return u > 0 && u < 1 && v > 0 && v < 1;
}
function noisyPts(a, b, p, q, R, out) { // Red Blob's quad recursion: the new point lies on the segment between the two sites
  if (Math.hypot(b[0] - a[0], b[1] - a[1]) < EDGE_L || !segCross(a, b, p, q)) return;
  const c = lerp2(p, q, 0.4 + 0.2 * R());
  noisyPts(a, c, lerp2(a, p, 0.5), lerp2(a, q, 0.5), R, out); out.push(c); noisyPts(c, b, lerp2(b, p, 0.5), lerp2(b, q, 0.5), R, out);
}
function chaikin(P, n, closed) { // corner cutting; open polylines keep their endpoints
  for (let k = 0; k < n; k++) {
    const o = closed ? [] : [P[0]], m = P.length - 1;
    for (let j = 0; j < m; j++) { const a = P[j], b = P[j + 1]; o.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); }
    if (closed) o.push(o[0]); else o.push(P[m]); P = o;
  }
  return P;
}
const ekey = (i, j) => (i < j ? i + ':' + j : j + ':' + i);
const EDGE = new Map(); // 'min:max' -> { i, j, a, b, wobble: [a ... b], straight: [a, b] }
for (let i = 0; i < N; i++) for (const j of NB[i]) {
  if (j < i) continue; const ci = cells[i];
  for (let k = 0; k < ci.length - 1; k++) {
    const a = ci[k], b = ci[k + 1];
    if (!cells[j].some((q) => PEQ(q, a)) || !cells[j].some((q) => PEQ(q, b))) continue;
    const R = rngFor(`edge:12:${i}:${j}`), mids = [];
    noisyPts(a, b, pts[i], pts[j], R, mids);
    const wob = mids.length ? chaikin([a, ...mids, b], 2, false) : [a, b];
    const Ri = rngFor(`ink:12:${i}:${j}`);
    EDGE.set(i + ':' + j, { i, j, a, b, wobble: wob, straight: [a, b], f1: 1 + Ri(), f2: 3 + 2 * Ri(), p1: Ri(), p2: Ri(), alpha: 0.85 + 0.15 * Ri() });
    break;
  }
}
function edgeBetween(i, j) { return EDGE.get(ekey(i, j)) ?? null; }
function edgePts(e) { return view.borders === 'straight' || view.look === 'relief' ? e.straight : e.wobble; } // v4: relief edges are straight
function wildEdges(w) { // the range's outline as polylines (each against a cell outside the range), with the wild cell it bounds
  const out = [];
  for (const c of w.cells) for (const j of NB[c]) { if (w.cells.includes(j)) continue; const e = edgeBetween(c, j); if (e) out.push({ pts: edgePts(e), c }); }
  return out;
}
function buildNpoly(mode) { // each cell's ring with every shared edge replaced by its polyline, walked in the ring's direction
  return cells.map((ring, i) => {
    if (mode === 'straight') return ring;
    const out = [];
    for (let k = 0; k < ring.length - 1; k++) {
      const a = ring[k], b = ring[k + 1]; let seg = null;
      for (const j of NB[i]) { const e = edgeBetween(i, j); if (!e) continue; if (PEQ(e.a, a) && PEQ(e.b, b)) { seg = e.wobble; break; } if (PEQ(e.a, b) && PEQ(e.b, a)) { seg = [...e.wobble].reverse(); break; } }
      if (seg) for (let m = 0; m < seg.length - 1; m++) out.push(seg[m]); else out.push(a);
    }
    out.push(out[0]); return out;
  });
}
const NPOLY_W = buildNpoly('wobble');
let npoly = LOOK0 === 'relief' ? cells : NPOLY_W; // v4: the relief map draws straight polygons (§5.1); v3 keeps its wobble
// a lighter ring (every third point; first and last kept) for fills, overlays and band clips, where the ink covers the edge anyway
const LITE = new Map();
function npolyLite(i) { if (npoly === cells) return cells[i]; let v = LITE.get(i); if (!v) { const P = npoly[i]; v = P.filter((q, k) => k % 3 === 0 || k === P.length - 1); LITE.set(i, v); } return v; }
function provinceAt(x, y) { // the hit test on the wobbling polygons: the nearest site, then its neighbors
  const i0 = nearest(x, y); if (npoly === cells) return i0;
  for (const c of [i0, ...NB[i0]]) if (d3.polygonContains(npoly[c], [x, y])) return c;
  return i0;
}
// Ribbon geometry per edge: unit normals and the width factor along the arc (2 px x (1 + .12 sin + .05 sin)); computed once per border mode.
const RIBBON = new Map();
function ribbonOf(key) {
  const e = EDGE.get(key), mode = view.borders, k = key + ':' + mode; let r = RIBBON.get(k); if (r) return r;
  const P = edgePts(e), n = P.length, L = [0];
  for (let m = 1; m < n; m++) L.push(L[m - 1] + Math.hypot(P[m][0] - P[m - 1][0], P[m][1] - P[m - 1][1]));
  const tot = L[n - 1] || 1, nx = new Float32Array(n), ny = new Float32Array(n), wf = new Float32Array(n);
  for (let m = 0; m < n; m++) {
    const a = P[Math.max(0, m - 1)], b = P[Math.min(n - 1, m + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    nx[m] = -dy / l; ny[m] = dx / l; const t = L[m] / tot;
    wf[m] = 1 + 0.12 * Math.sin(2 * Math.PI * (e.f1 * t + e.p1)) + 0.05 * Math.sin(2 * Math.PI * (e.f2 * t + e.p2));
  }
  r = { P, nx, ny, wf, len: tot }; RIBBON.set(k, r); return r;
}
function ribbonPath(g, key, wpx, stride) { // a filled ribbon of mean width wpx world units along the edge
  const { P, nx, ny, wf } = ribbonOf(key), n = P.length, h = wpx / 2, idx = [];
  for (let m = 0; m < n; m += stride) idx.push(m); if (idx[idx.length - 1] !== n - 1) idx.push(n - 1);
  idx.forEach((m, k) => { const x = P[m][0] + nx[m] * h * wf[m], y = P[m][1] + ny[m] * h * wf[m]; k ? g.lineTo(x, y) : g.moveTo(x, y); });
  for (let k = idx.length - 1; k >= 0; k--) { const m = idx[k]; g.lineTo(P[m][0] - nx[m] * h * wf[m], P[m][1] - ny[m] * h * wf[m]); }
  g.closePath();
}

// A second Cinder army that only the time-lapse uses (pillage at M14, siege of Deepmoss from M60).
cmd.dravik = { id: 'dravik', name: 'Dravik', unit: 'Ash Chieftain', ptype: 'ashChieftain', side: 'red', at: pillageProv, hp: [14, 14], mor: 13, lead: 80, pips: '', order: 'Pillage', squads: [['Cinder Warriors', 40, 100], ['Ash Riders', 12, 100]], script: ['sword', 'sword', 'sword', 'sword', 'sword'], hidden: true };

// ------------------------------------------------------------------ time-lapse: the example state re-derived month by month (M3 to M70)
const SCALES = { red: [['Fury', 3], ['Turmoil', 2]], green: [['Growth', 3], ['Wild', 2]] };
const effStep = (scale, s) => { const v = (scale * s) / 10; return Math.sign(v) * Math.round(Math.abs(v)); }; // halves away from zero
const BASE = provs.map((p) => ({ i: p.i, pop: p.pop, owner: p.owner, dom: { ...p.dom }, pd: p.pd, unrest: p.unrest, buildings: [...p.buildings] }));
for (const p of provs) p.startPop = p.pop;
let curMonth = 3;
function deriveMonth(M) {
  for (const b of BASE) { const p = prov[b.i]; Object.assign(p, { pop: b.pop, owner: b.owner, dom: { ...b.dom }, pd: b.pd, unrest: b.unrest, buildings: [...b.buildings], kitOwner: b.owner }); }
  for (let k = 4; k <= M; k++) {
    for (const p of provs) p.kitOwner = p.owner; // a captured town is rebuilt in its new owner's kit a month later
    if (k === 12) captureTargets.forEach((i) => { prov[i].owner = 'red'; });
    if (k === 30) prov[ashfen].owner = 'green';
    if ((k - 3) % 6 === 0) for (const p of provs) if (p.dom.n && p.i !== ashfen) p.dom.s = Math.min(p.dom.n === p.owner ? 7 : 4, p.dom.s + 1);
    if ((k - 3) % 8 === 0) for (const n of ['red', 'green']) {
      provs.filter((p) => !p.dom.n && (p.owner === null || p.owner === n) && nbrs(p.i).some((w) => prov[w].dom.n === n && prov[w].dom.s >= 2)).forEach((p) => { p.dom = { n, s: 1 }; });
    }
    const a = prov[ashfen];
    a.dom = k <= 24 ? { n: 'green', s: 2 + Math.floor((3 * (k - 3)) / 21) } : k < 40 ? { n: 'green', s: 5 } : { n: 'red', s: Math.min(6, 3 + Math.floor((k - 40) / 6)) };
    if (k >= 20) prov[redCap].pd = Math.max(prov[redCap].pd, k >= 48 ? 25 : 15);
    for (const p of provs) p.pop *= 1 + 0.002 + 0.003 * (p.dom.n === 'green' ? effStep(3, p.dom.s) : 0);
    if (k === 14) prov[pillageProv].pop *= 0.92;
    if (k === 15) prov[pillageProv].pop *= 0.815;
  }
  for (const p of provs) { p.pop = Math.round(p.pop / 10) * 10; p.fx = []; p.siege = null; p.scar = null; p.pillage = false; p.claim = null; p.build = null; }
  const sun = prov[ownWell], ash = prov[ashfen];
  if (M < 6) sun.build = { kind: 'temple', q: M - 2 }; else sun.buildings = [...new Set([...sun.buildings, 'temple'])];
  if (M >= 5 && M < 8) ash.build = { kind: 'temple', q: M - 4 }; else if (M >= 8) ash.buildings = [...new Set([...ash.buildings, 'temple'])];
  sun.claim = M === 17 ? 'running' : M >= 18 ? 'red' : null;
  const pp = prov[pillageProv];
  pp.pillage = M === 14 || M === 15; if (M >= 14 && M <= 16) pp.unrest = 50; else if (M > 16 && M <= 20) pp.unrest = 30;
  if (M >= 20 && M <= 23) prov[burnProv].fx.push({ kind: 'burn' });
  if (M === 36 || M === 37) prov[ashRainProv].fx.push({ kind: 'ashrain', step: M === 36 ? 3 : 1 });
  if (M >= 8 && M <= 14) prov[greenCap].fx.push({ kind: 'fertile' });
  if (M >= 60) prov[greenCap].siege = M >= 64 ? 'breached' : M >= 62 ? 'cracked' : 'intact';
  prov[morholt].scar = M <= 5 ? 'churned' : M <= 14 ? 'cairns' : null;
  cmd.varo.hp[0] = M >= 12 && M <= 13 ? 6 : 14;
  cmd.ondra.prophet = M >= 24;
  const fell = M >= 30; // Ashfen falls to Thornwood: Varo falls back to Morholt and Ilsa holds Ashfen
  cmd.varo.at = fell ? morholt : ashfen; cmd.ilsa.at = fell ? ashfen : greenFrom; if (fell) cmd.ilsa.eta = 0; else if (cmd.ilsa.eta === 0 && !state.autoPaused) cmd.ilsa.eta = 4;
  const dv = cmd.dravik; dv.hidden = !(pp.pillage || M >= 60); dv.at = M >= 60 ? greenCap : pillageProv; dv.order = M >= 60 ? 'Besiege' : 'Pillage';
  curMonth = M;
}
const fogOf = (i) => (i === greenCap && curMonth >= 60 ? null : FOG[i]); // a besieging army sees Deepmoss
const wellClaimed = () => prov[ownWell].claim === 'red';

// ------------------------------------------------------------------ paths (by days), barriers and the review targets
const DAYS = { plains: 2, farmland: 2, forest: 3, hills: 3, mountains: 5, swamp: 4, wasteland: 2 };
function pathTo(from, to) {
  if (isWild(to) || isWild(from)) return null;
  const dist = new Array(N).fill(Infinity), prev = new Array(N).fill(-1); dist[from] = 0;
  const open = new Set([from]);
  while (open.size) {
    let v = -1; for (const o of open) if (v < 0 || dist[o] < dist[v]) v = o;
    open.delete(v); if (v === to) break;
    if (v !== from && prov[v].owner !== 'red') continue; // paths cross only friendly land; the last step may be hostile
    for (const w of nbrs(v)) { const d = dist[v] + DAYS[prov[w].terrain]; if (d < dist[w]) { dist[w] = d; prev[w] = v; open.add(w); } }
  }
  if (dist[to] === Infinity) return null;
  const path = []; for (let v = to; v !== from; v = prev[v]) path.unshift(v);
  return { path, days: dist[to] };
}
function segT(a, b, p, q) { // parameter along ab where it crosses pq, or null
  const d = (b[0] - a[0]) * (q[1] - p[1]) - (b[1] - a[1]) * (q[0] - p[0]); if (Math.abs(d) < 1e-9) return null;
  const u = ((p[0] - a[0]) * (q[1] - p[1]) - (p[1] - a[1]) * (q[0] - p[0])) / d, v = ((p[0] - a[0]) * (b[1] - a[1]) - (p[1] - a[1]) * (b[0] - a[0])) / d;
  return u > 0 && u < 1 && v >= 0 && v <= 1 ? u : null;
}
function barrierOnLine(from, to) { // the first wild the straight segment between the two centers crosses
  let best = null, bt = Infinity;
  for (const w of WILDS) for (const c of w.cells) { const poly = cells[c]; for (let k = 0; k < poly.length - 1; k++) { const t = segT(cent[from], cent[to], poly[k], poly[k + 1]); if (t !== null && t < bt) { bt = t; best = w; } } }
  return best;
}
function hostileAround(from, to) { // the first province not ours on the shortest way around
  const prev = new Array(N).fill(-1), seen = new Set([from]), q = [from];
  for (let h = 0; h < q.length; h++) { const v = q[h]; if (v === to) break; for (const w of nbrs(v)) if (!seen.has(w)) { seen.add(w); prev[w] = v; q.push(w); } }
  const path = []; for (let v = to; v !== from && v >= 0; v = prev[v]) path.unshift(v);
  return path.slice(0, -1).find((v) => prov[v].owner !== 'red') ?? null;
}
const ashspine = WILDS.find((w) => w.id === 'ashspine') ?? WILDS[0];
let acrossTarget = null, closedTarget = null;
if (ashspine) {
  const ring = [...new Set(ashspine.cells.flatMap((c) => NB[c]))].filter((x) => !isWild(x) && x !== cmd.varo.at && prov[x].owner !== 'red');
  const crossing = ring.filter((t) => barrierOnLine(cmd.varo.at, t) === ashspine);
  const reach = crossing.filter((t) => pathTo(cmd.varo.at, t)).sort((a, b) => pathTo(cmd.varo.at, b).path.length - pathTo(cmd.varo.at, a).path.length);
  acrossTarget = reach[0] ?? null;
  const closed = crossing.filter((t) => !pathTo(cmd.varo.at, t)).map((t) => [t, hostileAround(cmd.varo.at, t)]).filter(([, h]) => h !== null);
  const pick = closed.find(([, h]) => prov[h].owner === 'green') ?? closed[0];
  closedTarget = pick ? pick[0] : null;
}
// ------------------------------------------------------------------ sample economy and tooltips
const fmt = (n) => n.toLocaleString('en-US');
const state = { day: 14, month: 3, year: 1, gold: 1240, speed: 1, paused: true, mode: 'ownership', sel: null, filter: 'All', pauseReason: null, autoPaused: false };
const CONCEPTS = {
  upkeep: ['Upkeep', 'Every troop and commander costs gold each month. Unpaid troops lose morale, one point per 10 unpaid days.'],
  taxrate: ['Tax rate', 'Low, Normal, or High per province. High collects 50% more gold and adds 4 unrest a month.'],
  unrest: ['Unrest', 'From 0 to 100. It lowers gold by its share. Above 50 the province cannot recruit.'],
  supply: ['Supply', 'Food a province gives armies each day: terrain base plus population ÷ 50. Armies that eat more than it gives start to starve.'],
  dominion: ['Dominion', 'Your god\'s presence in a province, 0 to 10. It spreads from your capital, temples, pretender, prophet, and preaching priests, and it carries your scales.'],
  scales: ['Scales', 'Five two-pole axes your pretender sets the world toward, such as Order against Turmoil. They apply where your dominion holds, scaled by its strength.'],
  pip: ['Pip', 'One point of a color on a commander. Pips decide which spells it can cast and how cheaply.'],
  materials: ['Materials', 'Built up in each fort from its own and its neighbors\' land, up to six months of production. Troops and buildings spend them.'],
  fort: ['Fort', 'The only place troops are recruited. In this milestone every capital has one.'],
  research: ['Research', 'Mages in a lab earn points toward the next level of your active color. Levels unlock spells.'],
  wellspring: ['Wellspring', 'A source of all five colors. A priest claims an owned one in 10 uninterrupted days. Claim 2 of 3 to win.'],
  godless: ['Godless', 'When neither your capital nor any temple you own is under your own dominion: no rituals, and your pretender leaves the map.'],
  morale: ['Morale', 'How long a squad holds. Losses, fear, and hunger test it each round; a squad that fails routs.'],
  leadership: ['Leadership', 'How many troops a commander can lead into battle.'],
  pd: ['Provincial defense', 'Militia and archers that defend the province, from 0 to 30. Each level costs more than the last.'],
  script: ['Script', 'Five orders a commander follows in the first five rounds of a battle: cast a spell, attack, hold, or retreat.'],
  growth: ['Growth', 'Population change each month: about 1% plus the Growth scale, minus losses to pillage and battle.'],
  impassable: ['Impassable terrain', 'Some of the map is wild: named mountain massifs (peaks) and dark lakes (meres). A wild is not a province. No one owns, enters, crosses or targets it, so movement, retreat, sight, dominion spread and ritual reach all go around it. Every province can still reach every other.'],
  inbound: ['Hostile inbound', 'A visible enemy army whose march ends where you have troops, a fort, or your capital. Battles resolve the moment armies meet, so you are warned before.'],
};
const term = (k, text) => `<span class="term" data-concept="${k}">${text ?? CONCEPTS[k][0].toLowerCase()}</span>`;
const FOOT = '<span>Shift more · T lock · Click open</span><span>Ctrl+click Codex</span>';
function tipHTML(t) {
  let h = `<h4><span class="tt">${t.portrait ? `<span class="tport">${t.portrait}</span>` : ''}<span>${t.title}</span></span>${t.value ? `<span class="num">${t.value}</span>` : ''}</h4>`;
  if (t.meaning) h += `<p class="meaning">${t.meaning}</p>`;
  if (t.rows) {
    h += '<table>';
    for (const r of t.rows) h += `<tr class="${r[2] ?? ''}"><td>${r[0]}</td><td>${r[1]}</td></tr>`;
    h += '</table>';
  }
  if (t.why) h += `<p class="why">${t.why}</p>`;
  if (t.proj) h += `<p class="proj">${t.proj}</p>`;
  return h + `<div class="foot">${t.foot ?? FOOT}</div><div class="lockbar"></div>`;
}
const TIPS = {
  nation: () => ({ title: 'Cinder Horde', meaning: `Red. Pretender: <b>The Ashen Titan</b>, awake in Kharnath. Not ${term('godless', 'godless')}.`, rows: [['Order ◀ ▶ Turmoil', 'Turmoil 2'], ['Lore ◀ ▶ Fury', 'Fury 3'], ['Growth ◀ ▶ Rot', '0'], ['Wild ◀ ▶ Artifice', '0'], ['Sanctity ◀ ▶ Dread', '0']], proj: `Your ${term('scales')} apply where your dominion holds.` }),
  pop: () => ({ title: 'Population', value: '84.2k', meaning: `People under your rule. They pay tax, give ${term('supply')}, and fill your ranks.`, rows: [['Kharnath', '25,000'], ['Ashfen', '7,400'], ['Six others', '51,800'], ['Growth per month', '+0.3k'], ['Recruits waiting for people', '0', 'more']], proj: `${term('growth', 'Growth')}: +0.4% a month.` }),
  gold: () => ({ title: 'Gold', value: fmt(Math.round(state.gold)), meaning: 'Treasury and its net monthly change.', rows: [['Kharnath (tax Normal)', '+250'], ['Ashfen', '+52'], ['Six other provinces', '+188'], ['Troop and commander ' + term('upkeep'), '−452'], ['Varo\'s army', '−192', 'more'], ['Garrison of Kharnath', '−164', 'more'], ['Pretender and mages', '−96', 'more'], ['Net', '+38 /mo', 'total']], proj: `At this rate: ${fmt(Math.round(state.gold) + 38)} in 30 days.` }),
  materials: () => ({ title: 'Materials at Kharnath', value: '212 / 360', meaning: `The capital ${term('fort')}'s ${term('materials')} pool. Troops spend it when queued.`, rows: [['Kharnath\'s own land', '+38'], ['Neighbors (half each)', '+22'], ['Net', '+60 /mo', 'total'], ['Cap (6 months)', '360']], proj: 'Full in 2.5 months.' }),
  research: () => ({ title: 'Research: Ember', value: 'L2 ▸ 47 days', meaning: `${term('research', 'Research')} goes to Red. Level 3 unlocks Fireball and Blood Fury.`, rows: [['Seren (Ember Adept, R1, in Kharnath\'s lab)', '+5.6 /mo'], ['Fury 3 on research', '−30%'], ['Total', '+3.9 /mo', 'total'], ['Points to level 3', '61']] }),
  dominion: () => ({ title: 'Dominion score', value: '5', meaning: `How far and how strongly your ${term('dominion')} spreads. Each check rolls d10; at or below 5 it pushes.`, rows: [['Pretender', '5'], ['Claimed Wellsprings', '+0'], ['Checks per month', '9', 'total'], ['Capital', '3', 'more'], ['Temple', '1', 'more'], ['Pretender', '2', 'more'], ['Preaching priest (Ondra, holy 2, temple)', '3', 'more']], proj: 'Next spread on the last day of the month (16 days).' }),
  wells: () => ({ title: 'Wellsprings', value: '0 / 2', meaning: `Claim 2 of the 3 ${term('wellspring', 'Wellsprings')} to win.`, rows: [['Sunmere', 'yours, unclaimed'], [names[wells[0]], 'independent'], [names[wells[1]], 'independent'], ['Thornwood', '0 claimed']], proj: 'Click to center the map on the next one.' }),
  clock: () => ({ title: `Y${state.year} M${state.month} D${state.day}`, meaning: 'Dominion spreads and Godless is checked on the last day of each month. Every other rate is paid daily.', rows: [['Today', '+1.3 gold, +0.1 R']], foot: '<span>Space pause · 1–4 speed · + / − step</span><span></span>' }),
  btnR: () => ({ title: 'Research', meaning: 'Levels per color, unlocks, and who researches.', foot: '<span>Key R</span><span></span>' }),
  btnL: () => ({ title: 'Ledger', meaning: 'Sortable tables of provinces, commanders, magic, battles, and nations.', foot: '<span>Key L</span><span></span>' }),
  btnF: () => ({ title: 'Codex', meaning: 'Every unit, spell, building, and rule, linked from every tooltip.', foot: '<span>Key F</span><span></span>' }),
  railOut: () => ({ title: 'Outliner', meaning: 'Everything you own or are doing.' }),
  railFeed: () => ({ title: 'Messages', meaning: 'Events as they happen; battles open their report.' }),
};
for (const c of 'WUBRG') {
  const stock = { W: 0, U: 0, B: 0, R: 14, G: 2 }[c], rate = { W: 0, U: 0, B: 0, R: 3, G: 1 }[c];
  TIPS['mana' + c] = () => ({ title: `${MANA[c].name} mana (${c})`, value: String(stock), meaning: stock || rate ? `Spent on rituals and carried into battle by mages.` : `You have no source of ${MANA[c].name} yet. Springs and Wellsprings give it.`, rows: rate ? (c === 'R' ? [['Springs: Kharnath, ' + names[redBorder[2] ?? redCap]], ['Dominion tint (Red)', '+1'], ['Springs', '+2'], ['Net', '+3 /mo', 'total']] : [['Spring: ' + names[redBorder[3] ?? redCap], '+1'], ['Net', '+1 /mo', 'total']]).map((r) => (r.length === 1 ? [r[0], ''] : r)) : null });
}
const manaEl = document.getElementById('mana');
for (const c of 'WUBRG') {
  const stock = { W: 0, U: 0, B: 0, R: 14, G: 2 }[c], rate = { W: 0, U: 0, B: 0, R: 3, G: 1 }[c];
  manaEl.insertAdjacentHTML('beforeend', `<div class="readout ${stock || rate ? '' : 'zero'}" tabindex="0" data-tip="mana${c}">${manaSym(c, 18)}<span class="v">${stock}</span>${rate ? `<span class="r up hidephone">▲${rate}</span>` : ''}</div>`);
}


const SUPPLY = { plains: 60, farmland: 80, forest: 50, hills: 40, mountains: 20, swamp: 30, wasteland: 15 };
const ownerName = (o) => (o === 'red' ? 'Cinder Horde' : o === 'green' ? 'Thornwood' : 'Independent');
function moveProjection(c, i) {
  const d = pathTo(c.at, i);
  if (d) { const bw = barrierOnLine(c.at, i); return `Right-click: ${c.name} marches here in <b>${d.days} days</b>${bw ? `, around ${bw.name.replace('The ', 'the ')}` : ''}${prov[i].owner !== 'red' ? ', then fights for it' : ''}.`; }
  return noPathText(c, i);
}
function noPathText(c, i) {
  const bw = barrierOnLine(c.at, i);
  if (bw) { const h = hostileAround(c.at, i); return `No path: ${bw.name.replace('The ', 'the ')} blocks the way${h != null ? `, and the way around crosses hostile ${names[h]}` : ''}.`; }
  return `${c.name} has no path here through your land.`;
}
function provTip(i) {
  if (isWild(i)) return wildTip(wildOf[i]);
  const p = prov[i], fog = fogOf(i), hid = fog === 'unexplored';
  const supply = Math.round(SUPPLY[p.terrain] + p.pop / 50);
  const eat = p.i === cmd.varo.at ? 50 : p.i === redCap ? 4 : 0;
  const rows = [['Owner', ownerName(p.owner)], ['Population', hid ? 'unknown' : fmt(p.pop)], [term('supply', 'Supply') + ' (eaten / given)', hid ? 'unknown' : `${eat} / ${supply}`], [term('unrest', 'Unrest'), hid ? 'unknown' : String(p.unrest)], [term('dominion', 'Dominion'), hid ? 'unknown' : p.dom.n ? `${ownerName(p.dom.n)} ${p.dom.s}` : 'none']];
  if (p.springs.length && !hid) rows.push(['Spring', p.springs.map((c) => MANA[c].name).join(', ')]);
  if (p.well) rows.push([term('wellspring', 'Wellspring'), p.i === ownWell ? (p.claim === 'red' ? 'yours, claimed' : p.claim ? 'claim under way' : 'yours, unclaimed') : 'unclaimed']);
  if (p.owner === null && !hid) rows.push(['Defenders', strengthWord(p.indep)]);
  if (fog === 'outofsight') rows.push(['Seen', 'earlier; out of sight now', 'more']);
  const bw = wildsBordering(i);
  const meaning = [hid ? 'Unexplored: not yet painted. Terrain is public; what lives here is unknown.' : '', bw.length ? `Borders ${bw.map((w) => w.name.replace('The ', 'the ')).join(' and ')} (${term('impassable', 'impassable')}).` : ''].filter(Boolean).join(' ');
  const sel = state.sel && state.sel.type === 'cmd' && cmd[state.sel.id].side === 'red' ? cmd[state.sel.id] : null;
  const proj = sel && i !== sel.at ? moveProjection(sel, i) : null;
  // natural §7: the terrain is named on the title line, once, in every mode, fog state, zoom and look: the name, the terrain chip (swatch, glyph, word), then "capital".
  // The value slot keeps the active mode's value; in the Terrain mode that value is the terrain, and the chip is not repeated. (The separate Terrain row is gone.)
  const tmode = state.mode === 'terrain', cap = p.cap ? '<span class="tdot"> · </span>capital' : '', mv = !tmode && state.mode !== 'ownership' && !hid ? rlModeValue(p) : null;
  const title = tmode ? `${p.name}${cap}` : `${p.name}<span class="tdot"> · </span>${terrainChip(p.terrain)}${cap}`;
  return { title, value: tmode ? terrainChip(p.terrain) : mv != null ? `${MODES.find((m) => m[0] === state.mode)[2]} ${mv}` : '', meaning: meaning || null, rows, proj };
}
function wildTip(w) {
  const border = [...new Set(w.cells.flatMap((c) => NB[c]))].filter((x) => !isWild(x));
  return { title: w.name, value: (w.kind === 'peaks' ? 'Peaks' : 'Mere') + ' · Impassable',
    meaning: `A wild is not a province. No one owns, enters, crosses or targets it: movement, retreat, sight, dominion spread and ritual reach all go around it. ${term('impassable', 'Impassable terrain')}.`,
    proj: 'Borders: ' + border.map((b) => `<span class="link" data-go="${b}">${names[b]}</span>`).join(', '),
    foot: '<span>T lock, then click a name</span><span>Ctrl+click Codex</span>' };
}

// ------------------------------------------------------------------ the war table and the tavern (world units; the map is [0, 0, W, H])
// Cloth margin m = 40, hem 6, table margin T = 0.35 (H + 2m), room margin R = 0.5 (H + 2m + 2T).
const CM = 40, HEM = 6, TM = 0.35 * (H + 2 * CM), RM = 0.5 * (H + 2 * CM + 2 * TM);
const CLOTH = [-CM, -CM, W + CM, H + CM];
const TABLE = [-CM - TM, -CM - TM, W + CM + TM, H + CM + TM];
const ROOM = [TABLE[0] - RM, TABLE[1] - RM, TABLE[2] + RM, TABLE[3] + RM];
const TW = TABLE[2] - TABLE[0], TH = TABLE[3] - TABLE[1];
const POFF = 0.06 * (H + 2 * CM);
const PROPS = {
  candle: [CLOTH[0] - POFF, CLOTH[1] - POFF], hourglass: [CLOTH[2] + POFF, CLOTH[1] - POFF],
  ink: [CLOTH[0] - POFF, CLOTH[3] + POFF], tankard: [CLOTH[2] + POFF, CLOTH[3] + POFF],
  bread: [W * 0.6, CLOTH[3] + POFF + 6], letter: [W * 0.32, CLOTH[1] - POFF - 4], tokens: [CLOTH[0] - POFF - 6, H * 0.52],
};
const HEARTH = [TABLE[0] - 330, H * 0.42], WINDOW = [TABLE[2] + 120, -260];
const view = { table: 'full', detail: 'full', chrome: 'approved', parch: false, vision: 'normal', reduced: !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches), pass: false, wipe: false,
  // v3, the painted map: Hand (the whole pass against v2), Labels, Borders, Bands, Tracks and the Farmland A/B; owner sheets from "Try your art"
  hand: 'painted', labels: 'ink', borders: 'wobble', bandCap: 'capped', tracks: 'full', farm: 'approved', footpath: false, art: {},
  palette: PALETTE0, // the Palette A/B: 'bright' (approved fills, default) or 'painted' (?palette=painted)
  look: LOOK0, tint: false }; // v4: Map look ('relief' or 'v3') and the Realm tint option (8%, off by default; owner question 1)
const PAINTED_PAL = () => view.palette === 'painted';
const PAINTED = () => view.hand === 'painted';
const seasonOf = (m) => (m >= 11 || m <= 2 ? 'winter' : m <= 5 ? 'spring' : m <= 8 ? 'summer' : 'autumn');
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
const BAKE_CTX = {}; // (CPU-backed canvases made createImageBitmap slow; the default context is kept)
function bakeWorld(rect, res, fn, noBitmap) { // a world-space bake; once drawn it becomes an ImageBitmap, so a blit never re-uploads it
  const [x0, y0, x1, y1] = rect; const c = makeCanvas((x1 - x0) * res, (y1 - y0) * res), g = c.getContext('2d', BAKE_CTX); g.setTransform(res, 0, 0, res, -x0 * res, -y0 * res); fn(g);
  const out = { canvas: c, src: c, x0, y0, w: x1 - x0, h: y1 - y0 };
  if (window.createImageBitmap && !noBitmap) createImageBitmap(c).then((bm) => { out.src = bm; requestDraw(); }).catch(() => {}); // v3: Mid and Far province sprites only feed the composite
  return out;
}
const sq = (g, x, y, s, fill, hi, edge) => { g.fillStyle = fill; g.fillRect(x - s / 2, y - s / 2, s, s); if (hi) { g.fillStyle = hi; g.fillRect(x - s / 2, y - s / 2, s, Math.max(0.8, s / 6)); g.fillRect(x - s / 2, y - s / 2, Math.max(0.8, s / 6), s); } if (edge) { g.strokeStyle = edge; g.lineWidth = Math.max(0.8, s / 10); g.strokeRect(x - s / 2, y - s / 2, s, s); } };
function ellipse(g, x, y, rx, ry, rot = 0) { g.beginPath(); g.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot, 0, Math.PI * 2); }

// ---- the oak tile (512 square, seamless; grain along x, ray fleck)
let OAK = null;
function oakTile() {
  if (OAK) return OAK;
  const S = 512, c = makeCanvas(S, S), g = c.getContext('2d'), img = g.createImageData(S, S), d = img.data;
  const base = hex2rgb('#8F7459'), grain = hex2rgb('#715636'), lit = hex2rgb('#B08A5E'), T = 2 * Math.PI / S;
  const R = rngFor('oak:tile');
  const noiseT = new Float32Array(64 * 64); for (let k = 0; k < noiseT.length; k++) noiseT[k] = R() * 2 - 1;
  const vn = (x, y) => { // periodic value noise on an 8 px lattice
    const gx = x / 8, gy = y / 8, ix = Math.floor(gx), iy = Math.floor(gy), fx = gx - ix, fy = gy - iy;
    const at = (a, b) => noiseT[((b & 63) * 64) + (a & 63)];
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    return (at(ix, iy) * (1 - sx) + at(ix + 1, iy) * sx) * (1 - sy) + (at(ix, iy + 1) * (1 - sx) + at(ix + 1, iy + 1) * sx) * sy;
  };
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const ax = x * T;
    const wob = 2.6 * Math.sin(ax + 1.7) + 1.1 * Math.sin(2 * ax + 0.4 + 2 * y * T) + 0.45 * Math.sin(5 * ax + 3 * y * T);
    const v = Math.sin(73 * y * T + wob), v2 = Math.sin(29 * y * T + 0.7 * wob + 1.3);
    const streak = 0.55 * Math.sin(5 * y * T + 0.8 * Math.sin(ax)) + 0.3 * Math.sin(11 * y * T + 2 * Math.sin(2 * ax + 1)) + 0.25 * vn(x / 6, y);
    let r = base[0] * (1 + 0.045 * streak), gg = base[1] * (1 + 0.045 * streak), b = base[2] * (1 + 0.045 * streak);
    const gl = v > 0.96 ? 0.85 : v > 0.82 ? 0.25 * (v - 0.82) / 0.14 : 0;
    const gl2 = v2 > 0.985 ? 0.45 : 0;
    const k = Math.max(gl, gl2); r += (grain[0] - r) * k; gg += (grain[1] - gg) * k; b += (grain[2] - b) * k;
    const sheen = Math.max(0, Math.sin(13 * y * T + wob * 0.5)) * 0.06; r += (lit[0] - r) * sheen; gg += (lit[1] - gg) * sheen; b += (lit[2] - b) * sheen;
    const n = (vn(x * 3, y * 3) * 0.02); const o = (y * S + x) * 4;
    d[o] = r * (1 + n); d[o + 1] = gg * (1 + n); d[o + 2] = b * (1 + n); d[o + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  for (let k = 0; k < 220; k++) { // ray fleck
    const x = R() * S, y = R() * S, w = 3 + R() * 4; g.fillStyle = 'rgba(187,158,124,.25)';
    for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { ellipse(g, x + ox, y + oy, w, 1 + R() * 0.6, (R() - 0.5) * 0.15); g.fill(); }
  }
  OAK = c; return c;
}

// ---- T0: the room, seen from above (baked once per settings change and per season)
let ROOMB = null, ROOMKEY = '';
function bakeRoom() {
  const sea = seasonOf(state.month), key = sea + ':' + dpr;
  if (ROOMB && ROOMKEY === key) return ROOMB;
  ROOMKEY = key;
  const res = 0.34 * Math.min(2, dpr);
  ROOMB = bakeWorld(ROOM, res, (g) => {
    const R = rngFor('room:11'), [x0, y0, x1, y1] = ROOM;
    g.fillStyle = '#2A2018'; g.fillRect(x0, y0, x1 - x0, y1 - y0);
    for (let y = y0, k = 0; y < y1; y += 90, k++) { // wide oak floorboards
      g.fillStyle = k % 2 ? '#34281D' : '#3A2C20'; g.fillRect(x0, y, x1 - x0, 88);
      for (let s = 0; s < 26; s++) { g.fillStyle = R() < 0.5 ? 'rgba(255,236,210,.035)' : 'rgba(0,0,0,.05)'; g.fillRect(x0 + R() * (x1 - x0), y + 4 + R() * 80, 200 + R() * 900, 2 + R() * 4); }
      g.fillStyle = '#1E1712'; g.fillRect(x0, y + 88, x1 - x0, 2);
      let x = x0 - R() * 700; while (x < x1) { x += 600 + R() * 900; g.fillRect(x, y, 2.5, 88); }
    }
    // lit planks toward the window (east)
    const lg = g.createLinearGradient(TABLE[2] - 200, 0, ROOM[2], 0); lg.addColorStop(0, 'rgba(90,68,48,0)'); lg.addColorStop(1, 'rgba(90,68,48,.55)');
    g.fillStyle = lg; g.fillRect(TABLE[2] - 200, y0, ROOM[2] - TABLE[2] + 200, y1 - y0);
    // straw or rushes by the door; the door at the south edge
    const door = [W * 0.72, ROOM[3] - 70];
    g.fillStyle = '#2B2018'; g.fillRect(door[0] - 170, door[1], 340, 70); g.strokeStyle = '#1E1712'; g.lineWidth = 3; for (let k = 1; k < 5; k++) { g.beginPath(); g.moveTo(door[0] - 170 + k * 68, door[1]); g.lineTo(door[0] - 170 + k * 68, door[1] + 70); g.stroke(); }
    for (const hx of [door[0] - 120, door[0] + 120]) { sq(g, hx, door[1] + 22, 26, '#4A4744', '#6E6A64', '#2B2A28'); }
    g.lineCap = 'round';
    for (let k = 0; k < 30; k++) { const sx = door[0] - 420 + R() * 260, sy = door[1] - 30 - R() * 160, a = (R() - 0.5) * 1.4; g.strokeStyle = sea === 'spring' && k % 3 === 0 ? '#8E9A6E' : '#B89A5A'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + Math.cos(a) * 40, sy + Math.sin(a) * 40); g.stroke(); }
    if (sea === 'spring') for (let k = 0; k < 40; k++) { const sx = TABLE[0] - 300 + R() * (TW + 600), sy = TABLE[1] - 260 - R() * 160, a = (R() - 0.5) * 0.8; g.strokeStyle = k % 2 ? '#7F8A5E' : '#A39465'; g.lineWidth = 2; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + Math.cos(a) * 34, sy + Math.sin(a) * 34); g.stroke(); }
    if (sea === 'autumn') for (let k = 0; k < 14; k++) { const sx = door[0] - 380 + R() * 300, sy = door[1] - 40 - R() * 200; g.fillStyle = ['#8A5A2A', '#9B6B30', '#6E4A26'][k % 3]; ellipse(g, sx, sy, 9, 5, R() * 3); g.fill(); }
    // the wool rug under the table's south half
    const rug = [TABLE[0] - 0.14 * TW, (TABLE[1] + TABLE[3]) / 2, TABLE[2] + 0.14 * TW, TABLE[3] + 0.26 * TH];
    g.fillStyle = '#6B5A48'; g.fillRect(rug[0], rug[1], rug[2] - rug[0], rug[3] - rug[1]);
    for (let k = 0; k < 900; k++) { g.fillStyle = R() < 0.5 ? 'rgba(255,240,220,.05)' : 'rgba(0,0,0,.06)'; g.fillRect(rug[0] + R() * (rug[2] - rug[0]), rug[1] + R() * (rug[3] - rug[1]), 6 + R() * 10, 2); }
    g.strokeStyle = '#8A7560'; g.lineWidth = 24; g.strokeRect(rug[0] + 30, rug[1] + 30, rug[2] - rug[0] - 60, rug[3] - rug[1] - 60);
    g.strokeStyle = '#4A3A2E'; g.lineWidth = 3; g.strokeRect(rug[0] + 52, rug[1] + 52, rug[2] - rug[0] - 104, rug[3] - rug[1] - 104);
    for (let x = rug[0] + 10; x < rug[2]; x += 14) { g.strokeStyle = '#8A7560'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, rug[3]); g.lineTo(x + 2, rug[3] + 18); g.stroke(); } // fringe
    // the hound asleep on the rug (south-west), head tucked away
    const hd = [TABLE[0] + 40, TABLE[3] + 150];
    g.fillStyle = 'rgba(0,0,0,.25)'; ellipse(g, hd[0] + 8, hd[1] + 10, 80, 50); g.fill();
    g.fillStyle = '#7A6450'; ellipse(g, hd[0], hd[1], 75, 45, -0.15); g.fill();
    g.fillStyle = '#5A4636'; ellipse(g, hd[0] + 10, hd[1] + 18, 62, 22, -0.15); g.fill();
    g.fillStyle = '#7A6450'; ellipse(g, hd[0] - 58, hd[1] - 6, 30, 24, 0.4); g.fill(); // head tucked against the flank
    g.fillStyle = '#5A4636'; ellipse(g, hd[0] - 74, hd[1] - 18, 12, 8, 0.9); g.fill(); // ear
    g.strokeStyle = '#7A6450'; g.lineWidth = 12; g.beginPath(); g.moveTo(hd[0] + 66, hd[1] + 10); g.quadraticCurveTo(hd[0] + 92, hd[1] + 48, hd[0] + 40, hd[1] + 52); g.stroke(); // tail
    g.strokeStyle = 'rgba(28,26,23,.35)'; g.lineWidth = 2; ellipse(g, hd[0], hd[1], 75, 45, -0.15); g.stroke();
    // the bench along the north side, with a folded cloak
    const bn = [TABLE[0] + 0.22 * TW, TABLE[1] - 250, TABLE[0] + 0.72 * TW, TABLE[1] - 140];
    g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(bn[0] + 10, bn[1] + 12, bn[2] - bn[0], bn[3] - bn[1]);
    g.fillStyle = '#4E3A28'; g.fillRect(bn[0], bn[1], bn[2] - bn[0], bn[3] - bn[1]);
    g.strokeStyle = '#3A2B1E'; g.lineWidth = 3; for (const yy of [bn[1] + 36, bn[1] + 73]) { g.beginPath(); g.moveTo(bn[0], yy); g.lineTo(bn[2], yy); g.stroke(); }
    g.strokeStyle = '#2B2018'; g.strokeRect(bn[0], bn[1], bn[2] - bn[0], bn[3] - bn[1]);
    g.fillStyle = '#5A5148'; g.beginPath(); g.moveTo(bn[0] + 120, bn[1] + 8); g.lineTo(bn[0] + 330, bn[1] + 4); g.lineTo(bn[0] + 340, bn[3] - 8); g.lineTo(bn[0] + 110, bn[3] - 2); g.closePath(); g.fill();
    g.strokeStyle = '#463F38'; g.lineWidth = 3; g.beginPath(); g.moveTo(bn[0] + 116, bn[1] + 52); g.lineTo(bn[0] + 336, bn[1] + 50); g.stroke();
    // a barrel with iron hoops (east), a three-legged stool (west)
    const br = [TABLE[2] + 190, TABLE[3] - 260];
    g.fillStyle = 'rgba(0,0,0,.3)'; ellipse(g, br[0] + 8, br[1] + 10, 58, 58); g.fill();
    g.fillStyle = '#5E4630'; ellipse(g, br[0], br[1], 55, 55); g.fill();
    g.strokeStyle = '#3E2E20'; g.lineWidth = 2; for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; g.beginPath(); g.moveTo(br[0] + Math.cos(a) * 18, br[1] + Math.sin(a) * 18); g.lineTo(br[0] + Math.cos(a) * 50, br[1] + Math.sin(a) * 50); g.stroke(); }
    g.strokeStyle = '#3A3836'; g.lineWidth = 6; for (const rr of [52, 34]) { ellipse(g, br[0], br[1], rr, rr); g.stroke(); }
    const st = [TABLE[0] - 150, TABLE[1] + 0.3 * TH];
    g.fillStyle = 'rgba(0,0,0,.3)'; ellipse(g, st[0] + 6, st[1] + 8, 32, 32); g.fill();
    g.fillStyle = '#5E4630'; ellipse(g, st[0], st[1], 30, 30); g.fill(); g.strokeStyle = '#3E2E20'; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#3E2E20'; for (let k = 0; k < 3; k++) { const a = k * 2.094 + 0.5; ellipse(g, st[0] + Math.cos(a) * 19, st[1] + Math.sin(a) * 19, 4, 4); g.fill(); }
    // the hearth at the west: an arc of stones and the fire bed, its glow across the floor
    const [hx, hy] = HEARTH;
    const glow = g.createRadialGradient(hx, hy, 20, hx, hy, 700); const gm = sea === 'winter' ? 0.36 : 0.3;
    glow.addColorStop(0, `rgba(255,137,14,${gm})`); glow.addColorStop(0.45, `rgba(255,137,14,${gm * 0.35})`); glow.addColorStop(1, 'rgba(255,137,14,0)');
    g.globalCompositeOperation = 'lighter'; g.fillStyle = glow; g.fillRect(hx - 700, hy - 700, 1400, 1400); g.globalCompositeOperation = 'source-over';
    for (let k = 0; k <= 12; k++) { const a = Math.PI / 2 + (k / 12) * Math.PI; g.fillStyle = k % 2 ? '#4A4744' : '#5E5953'; ellipse(g, hx + Math.cos(a) * 120, hy + Math.sin(a) * 120, 26, 20, a); g.fill(); g.strokeStyle = '#2B2A28'; g.lineWidth = 2; g.stroke(); }
    g.fillStyle = '#1C1410'; ellipse(g, hx - 10, hy, 92, 92); g.fill();
    const fire = g.createRadialGradient(hx, hy, 4, hx, hy, 70); fire.addColorStop(0, '#FFC46B'); fire.addColorStop(0.35, '#FF890E'); fire.addColorStop(1, 'rgba(120,40,10,0)');
    g.fillStyle = fire; ellipse(g, hx, hy, 70, 60); g.fill();
    g.strokeStyle = '#2B1A10'; g.lineWidth = 9; for (const [a, b] of [[-40, 30], [-30, -32], [10, 40]]) { g.beginPath(); g.moveTo(hx + a, hy - b * 0.6); g.lineTo(hx - a * 0.8, hy + b * 0.7); g.stroke(); }
    // the window's daylight (east): a pale parallelogram with three lead bars
    const wc = sea === 'winter' ? '#CFE0EA' : sea === 'summer' ? '#FFF1D6' : '#F2EBDD', wa = sea === 'summer' ? 0.17 : 0.14;
    const [wx, wy] = WINDOW, wq = [[wx, wy], [wx + 380, wy - 40], [wx + 520, wy + 820], [wx + 140, wy + 860]];
    g.save(); g.filter = `blur(${Math.round(26 * res)}px)`; g.fillStyle = rgba(wc, wa); g.beginPath(); wq.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill(); g.restore();
    g.strokeStyle = 'rgba(30,23,18,.22)'; g.lineWidth = 10; g.save(); g.filter = `blur(${Math.round(6 * res)}px)`;
    for (let k = 1; k <= 3; k++) { const t = k / 4; g.beginPath(); g.moveTo(wq[0][0] + (wq[1][0] - wq[0][0]) * t, wq[0][1] + (wq[1][1] - wq[0][1]) * t); g.lineTo(wq[3][0] + (wq[2][0] - wq[3][0]) * t, wq[3][1] + (wq[2][1] - wq[3][1]) * t); g.stroke(); }
    g.beginPath(); g.moveTo((wq[0][0] + wq[3][0]) / 2, (wq[0][1] + wq[3][1]) / 2); g.lineTo((wq[1][0] + wq[2][0]) / 2, (wq[1][1] + wq[2][1]) / 2); g.stroke(); g.restore();
    if (sea === 'winter') { g.fillStyle = 'rgba(235,244,250,.18)'; for (const c of [wq[0], wq[1]]) { ellipse(g, c[0] + 40, c[1] + 50, 60, 40); g.fill(); } }
    if (sea === 'autumn') { g.strokeStyle = 'rgba(207,224,234,.18)'; g.lineWidth = 2; for (let k = 0; k < 24; k++) { const sx = wx + 60 + R() * 340, sy = wy + R() * 700; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + 8, sy + 60); g.stroke(); } }
    // the table's shadow on the floor
    g.save(); g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 30 * res; g.shadowOffsetX = 14 * res; g.shadowOffsetY = 14 * res;
    g.fillStyle = '#000'; g.fillRect(TABLE[0], TABLE[1], TW, TH); g.restore();
  });
  return ROOMB;
}

// ---- T1 to T4: the oak top, its hardware and wear, the table light, the props (baked)
let TABLEB = null, TABLEKEY = '';
function bakeTable() {
  const key = view.table + ':' + dpr + ':' + view.look;
  if (TABLEB && TABLEKEY === key) return TABLEB;
  TABLEKEY = key;
  const res = 0.75 * Math.min(2, dpr), full = view.table === 'full';
  TABLEB = bakeWorld(TABLE, res, (g) => {
    const R = rngFor('table:11:detail'), [x0, y0, x1, y1] = TABLE;
    const pat = g.createPattern(oakTile(), 'repeat');
    const plankH = TH / 3;
    for (let k = 0; k < 3; k++) {
      pat.setTransform(new DOMMatrix().translateSelf(R() * 512, R() * 512).scaleSelf(1.6, 1));
      g.fillStyle = pat; g.fillRect(x0, y0 + k * plankH, TW, plankH);
      g.fillStyle = k === 1 ? 'rgba(255,240,220,.03)' : 'rgba(30,20,10,.04)'; g.fillRect(x0, y0 + k * plankH, TW, plankH);
      // darker end grain on the short edges
      for (const ex of [x0, x1 - 70]) { const eg = g.createLinearGradient(ex, 0, ex + 70, 0); const left = ex === x0; eg.addColorStop(left ? 0 : 1, 'rgba(62,46,32,.35)'); eg.addColorStop(left ? 1 : 0, 'rgba(62,46,32,0)'); g.fillStyle = eg; g.fillRect(ex, y0 + k * plankH, 70, plankH); }
      for (const ex of [x0 + 44, x1 - 44]) for (const dy of [-plankH * 0.28, plankH * 0.28]) sq(g, ex, y0 + (k + 0.5) * plankH + dy, 6, '#2B2A28', '#6E6A64');
    }
    g.fillStyle = '#5E4630'; for (let k = 1; k < 3; k++) g.fillRect(x0, y0 + k * plankH - 1, TW, 2);
    // the rim: a 22-unit band shaded outward, and a worn lighter strip along the bottom edge
    const rim = 22;
    const edge = (ax, ay, bx, by, gx0, gy0, gx1, gy1, poly) => { const lg = g.createLinearGradient(gx0, gy0, gx1, gy1); lg.addColorStop(0, 'rgba(113,86,54,.55)'); lg.addColorStop(1, '#3E2E20'); g.fillStyle = lg; g.beginPath(); poly.forEach(([x, y], j) => (j ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill(); };
    edge(0, 0, 0, 0, 0, y0 + rim, 0, y0, [[x0, y0], [x1, y0], [x1 - rim, y0 + rim], [x0 + rim, y0 + rim]]);
    edge(0, 0, 0, 0, 0, y1 - rim, 0, y1, [[x0, y1], [x1, y1], [x1 - rim, y1 - rim], [x0 + rim, y1 - rim]]);
    edge(0, 0, 0, 0, x0 + rim, 0, x0, 0, [[x0, y0], [x0 + rim, y0 + rim], [x0 + rim, y1 - rim], [x0, y1]]);
    edge(0, 0, 0, 0, x1 - rim, 0, x1, 0, [[x1, y0], [x1 - rim, y0 + rim], [x1 - rim, y1 - rim], [x1, y1]]);
    g.fillStyle = 'rgba(176,138,94,.3)'; g.fillRect(x0 + 60, y1 - rim - 10, TW - 120, 9);
    // forged iron corner straps, three square nails per arm
    for (const [cx, cy, sx, sy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) {
      g.fillStyle = '#4A4744'; g.strokeStyle = '#2B2A28'; g.lineWidth = 2.5;
      const armA = [cx + (sx < 0 ? -110 : 0), cy + (sy < 0 ? -26 : 0), 110, 26], armB = [cx + (sx < 0 ? -26 : 0), cy + (sy < 0 ? -110 : 0), 26, 110];
      for (const a of [armA, armB]) { g.fillRect(...a); g.strokeRect(...a); }
      for (let k = 0; k < 3; k++) { const d = 22 + k * 32; sq(g, cx + sx * d, cy + sy * 13, 7, '#2B2A28', '#6E6A64'); if (k) sq(g, cx + sx * 13, cy + sy * d, 7, '#2B2A28', '#6E6A64'); }
    }
    // knife marks beside the bread board's slot, a tankard ring beside the tankard's slot
    g.strokeStyle = 'rgba(94,70,48,.6)'; g.lineWidth = 1.4;
    for (let k = 0; k < 4; k++) { const bx = PROPS.bread[0] + 100 + R() * 120, by = PROPS.bread[1] - 40 + R() * 90, L = 30 + R() * 20, a = (R() - 0.5) * 0.7; g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + Math.cos(a) * L, by + Math.sin(a) * L); g.stroke(); }
    g.strokeStyle = 'rgba(94,70,48,.35)'; g.lineWidth = 1.5; const tr = [PROPS.tankard[0] - 110, PROPS.tankard[1] + 40];
    g.beginPath(); g.arc(tr[0], tr[1], 34, 0.3, 2.6); g.stroke(); g.beginPath(); g.arc(tr[0], tr[1], 34, 2.9, 5.9); g.stroke();
    // table light, masked off the cloth: the hearth on the west rim, the candle's pool, a rim vignette
    const LM = view.look === 'relief' ? MODEL_BOX : CLOTH; // v4: the table's lights stay off the model
    g.save(); g.beginPath(); g.rect(x0, y0, TW, TH); g.rect(LM[0], LM[1], LM[2] - LM[0], LM[3] - LM[1]); g.clip('evenodd');
    if (full) {
      const hg = g.createLinearGradient(x0, 0, x0 + 0.3 * TW, 0); hg.addColorStop(0, 'rgba(255,137,14,.2)'); hg.addColorStop(1, 'rgba(255,137,14,0)');
      g.globalCompositeOperation = 'lighter'; g.fillStyle = hg; g.fillRect(x0, y0, 0.3 * TW, TH);
      const cr = 0.12 * (H + 2 * CM), cp = g.createRadialGradient(PROPS.candle[0], PROPS.candle[1], 8, PROPS.candle[0], PROPS.candle[1], cr);
      cp.addColorStop(0, 'rgba(255,167,87,.25)'); cp.addColorStop(1, 'rgba(255,167,87,0)'); g.fillStyle = cp; g.fillRect(PROPS.candle[0] - cr, PROPS.candle[1] - cr, cr * 2, cr * 2);
      g.globalCompositeOperation = 'source-over';
    }
    for (const [ax, ay, bx, by, rx, ry, rw, rh] of [[x0, 0, x0 + 170, 0, x0, y0, 170, TH], [x1, 0, x1 - 170, 0, x1 - 170, y0, 170, TH], [0, y0, 0, y0 + 150, x0, y0, TW, 150], [0, y1, 0, y1 - 150, x0, y1 - 150, TW, 150]]) {
      const vg = g.createLinearGradient(ax, ay, bx, by); vg.addColorStop(0, 'rgba(20,12,6,.45)'); vg.addColorStop(1, 'rgba(20,12,6,0)'); g.fillStyle = vg; g.fillRect(rx, ry, rw, rh);
    }
    g.restore();
    // the cloth's contact shadow on the oak
    if (view.look !== 'relief') { g.save(); g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 8; g.shadowOffsetX = 3; g.shadowOffsetY = 3; g.fillStyle = '#3E2E20'; g.fillRect(CLOTH[0], CLOTH[1], CLOTH[2] - CLOTH[0], CLOTH[3] - CLOTH[1]); g.restore(); } // v4: the model casts its own shadow (the rim bake)
    if (full) drawStaticProps(g, R);
    if (full && view.look === 'relief') rlCompass(g);
  });
  return TABLEB;
}
function drawStaticProps(g, R) {
  const ink = '#1C1A17';
  // inkpot, quill and brass dividers (lower left)
  const [ix, iy] = PROPS.ink;
  g.fillStyle = 'rgba(0,0,0,.3)'; ellipse(g, ix + 5, iy + 6, 24, 24); g.fill();
  g.fillStyle = '#1E2A2E'; ellipse(g, ix, iy, 22, 22); g.fill(); g.fillStyle = '#0E1416'; ellipse(g, ix, iy, 9, 9); g.fill();
  g.strokeStyle = 'rgba(207,224,234,.45)'; g.lineWidth = 2; g.beginPath(); g.arc(ix, iy, 16, 3.6, 4.6); g.stroke();
  g.save(); g.translate(ix + 8, iy - 6); g.rotate(-0.85);
  g.fillStyle = '#E9E4D8'; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(46, -16, 96, -4); g.quadraticCurveTo(50, 8, 0, 0); g.fill();
  g.strokeStyle = '#CFC6B4'; g.lineWidth = 1; for (let k = 1; k < 9; k++) { const x = k * 10; g.beginPath(); g.moveTo(x, -2); g.lineTo(x + 6, -9 + (k > 6 ? 3 : 0)); g.stroke(); g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 5, 5); g.stroke(); }
  g.strokeStyle = '#8C8578'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-14, 1); g.lineTo(98, -4); g.stroke(); g.restore();
  g.save(); g.translate(ix + 70, iy - 50); g.rotate(0.5); g.strokeStyle = '#B8914A'; g.lineWidth = 3; g.lineCap = 'round';
  g.beginPath(); g.moveTo(0, 0); g.lineTo(-14, 74); g.moveTo(0, 0); g.lineTo(14, 74); g.stroke(); sq(g, 0, 0, 8, '#B8914A', '#D4B26A', '#5E4630'); g.restore();
  // pewter tankard and two bone dice (lower right)
  const [tx, ty] = PROPS.tankard;
  g.fillStyle = 'rgba(0,0,0,.3)'; ellipse(g, tx + 6, ty + 7, 36, 36); g.fill();
  g.strokeStyle = '#6F7C70'; g.lineWidth = 9; g.beginPath(); g.arc(tx + 38, ty, 16, -1.2, 1.2); g.stroke();
  g.fillStyle = '#91A092'; ellipse(g, tx, ty, 34, 34); g.fill(); g.strokeStyle = '#6F7C70'; g.lineWidth = 5; g.stroke();
  g.fillStyle = '#4A3420'; ellipse(g, tx, ty, 25, 25); g.fill(); g.fillStyle = 'rgba(233,223,194,.75)'; ellipse(g, tx - 2, ty - 2, 20, 19); g.fill(); g.fillStyle = 'rgba(200,180,140,.6)'; ellipse(g, tx + 3, ty + 3, 12, 10); g.fill();
  for (const [dx, dy, a, n] of [[tx - 70, ty + 34, 0.4, 5], [tx - 34, ty + 58, -0.3, 3]]) {
    g.save(); g.translate(dx, dy); g.rotate(a); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-9, -9, 22, 22); g.fillStyle = '#E9E4D8'; g.beginPath(); g.roundRect(-11, -11, 22, 22, 4); g.fill(); g.strokeStyle = '#B8B0A0'; g.lineWidth = 1; g.stroke();
    g.fillStyle = ink; const P = { 3: [[-5, -5], [0, 0], [5, 5]], 5: [[-5, -5], [5, -5], [0, 0], [-5, 5], [5, 5]] }[n]; for (const [px, py] of P) { ellipse(g, px, py, 1.8, 1.8); g.fill(); } g.restore();
  }
  // bread board, a heel of bread and a knife (bottom edge)
  const [bx, by] = PROPS.bread;
  g.save(); g.translate(bx, by); g.rotate(-0.06);
  g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-56, -30, 120, 70); g.fillStyle = '#8C6A47'; g.beginPath(); g.roundRect(-60, -35, 120, 70, 8); g.fill(); g.strokeStyle = '#5E4630'; g.lineWidth = 1.5; g.stroke();
  g.strokeStyle = 'rgba(94,70,48,.5)'; g.lineWidth = 1; for (let k = 0; k < 7; k++) { g.beginPath(); g.moveTo(-56, -26 + k * 9); g.bezierCurveTo(-20, -30 + k * 9 + R() * 6, 20, -22 + k * 9, 56, -26 + k * 9 + R() * 4); g.stroke(); }
  g.fillStyle = '#8A5A2A'; ellipse(g, -18, -2, 30, 20, 0.2); g.fill(); g.fillStyle = '#C9A06A'; ellipse(g, -10, 0, 20, 15, 0.2); g.fill();
  g.fillStyle = 'rgba(255,240,210,.3)'; for (let k = 0; k < 8; k++) { ellipse(g, -16 + R() * 14, -6 + R() * 12, 1.4, 1.4); g.fill(); }
  g.fillStyle = '#A8ADB3'; g.beginPath(); g.moveTo(10, 18); g.lineTo(62, 10); g.lineTo(66, 14); g.lineTo(12, 24); g.closePath(); g.fill(); g.fillStyle = '#4E3A28'; g.fillRect(-26, 20, 38, 8);
  g.restore();
  // a folded letter with a dark wax seal (top edge)
  const [lx, ly] = PROPS.letter;
  g.save(); g.translate(lx, ly); g.rotate(0.08); g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(-41, -26, 90, 60); g.fillStyle = '#E9DFC2'; g.fillRect(-45, -30, 90, 60);
  g.strokeStyle = 'rgba(28,26,23,.25)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-45, -30); g.lineTo(0, 4); g.lineTo(45, -30); g.stroke(); g.strokeRect(-45, -30, 90, 60);
  g.fillStyle = '#4A2A1C'; ellipse(g, 0, 4, 10, 10); g.fill(); g.strokeStyle = 'rgba(0,0,0,.4)'; g.stroke(); g.restore();
  // six spare unpainted shield tokens (left edge)
  const [kx, ky] = PROPS.tokens;
  for (let k = 0; k < 6; k++) {
    const x = kx + (k % 2) * 26 - 13 + (R() - 0.5) * 6, y = ky - 75 + Math.floor(k / 2) * 52 + (R() - 0.5) * 6;
    g.save(); g.translate(x, y); g.rotate((R() - 0.5) * 0.5); g.scale(0.8, 0.8);
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.moveTo(3, -10); g.lineTo(17, -5); g.lineTo(17, 6); g.quadraticCurveTo(17, 20, 3, 26); g.quadraticCurveTo(-11, 20, -11, 6); g.lineTo(-11, -5); g.closePath(); g.fill();
    g.fillStyle = '#B08A5E'; g.beginPath(); g.moveTo(0, -13); g.lineTo(14, -8); g.lineTo(14, 3); g.quadraticCurveTo(14, 17, 0, 23); g.quadraticCurveTo(-14, 17, -14, 3); g.lineTo(-14, -8); g.closePath(); g.fill(); g.strokeStyle = '#715636'; g.lineWidth = 2; g.stroke();
    g.restore();
  }
}

// ---- T5: the painted linen cloth: hem, square brass tacks, cartouche, compass rose (baked; never lit)
let CLOTHB = null, CLOTHKEY = '', fontsReady = false;
function checkFonts() { // true once, when the web fonts arrive; checked at the top of every draw
  if (fontsReady || !document.fonts || !document.fonts.check) return false;
  fontsReady = ["22px 'Marcellus SC'", '13px Alegreya', '600 13px Alegreya', '800 13px Alegreya', 'italic 500 13px Alegreya'].every((f) => document.fonts.check(f)); return fontsReady; // v3 critique 3: the 600 and 800 weights too
}
function bakeCloth() {
  const key = dpr + ':' + fontsReady + ':' + view.hand + view.borders + view.farm + view.palette + (view.art.paper ? 'P' : '');
  if (CLOTHB && CLOTHKEY === key) return CLOTHB;
  CLOTHKEY = key;
  const res = 1.25 * Math.min(2, dpr);
  CLOTHB = bakeWorld(CLOTH, res, (g) => {
    const R = rngFor('cloth:11'), [x0, y0, x1, y1] = CLOTH;
    g.fillStyle = '#E8DCC2'; g.fillRect(x0, y0, x1 - x0, y1 - y0);
    const fl = [shadeL('#E8DCC2', -3), shadeL('#E8DCC2', 3), shadeL('#E8DCC2', -2)];
    g.lineWidth = 0.7; g.lineCap = 'round';
    if (PAINTED()) clothMarginV3(g, x0, y0, x1, y1);
    else for (let k = 0; k < 7000; k++) { // fiber flecks, in the margin only (the map covers the rest)
      let x, y; const side = R(); const t = R();
      if (side < 0.35) { x = x0 + t * (x1 - x0); y = y0 + R() * CM; } else if (side < 0.7) { x = x0 + t * (x1 - x0); y = y1 - R() * CM; } else if (side < 0.85) { x = x0 + R() * CM; y = y0 + t * (y1 - y0); } else { x = x1 - R() * CM; y = y0 + t * (y1 - y0); }
      const a = R() * Math.PI, L = 1.5 + R() * 4; g.strokeStyle = fl[k % 3]; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke();
    }
    g.strokeStyle = '#3E2E20'; g.lineWidth = HEM; g.strokeRect(x0 + HEM / 2, y0 + HEM / 2, x1 - x0 - HEM, y1 - y0 - HEM);
    g.strokeStyle = 'rgba(232,220,194,.35)'; g.lineWidth = 0.6; g.setLineDash([3, 3]); g.strokeRect(x0 + HEM + 1.5, y0 + HEM + 1.5, x1 - x0 - 2 * HEM - 3, y1 - y0 - 2 * HEM - 3); g.setLineDash([]);
    for (const [cx, cy] of [[x0 + 12, y0 + 12], [x1 - 12, y0 + 12], [x0 + 12, y1 - 12], [x1 - 12, y1 - 12]]) {
      g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(cx - 5, cy - 5, 12, 12); sq(g, cx, cy, 12, '#B8914A', '#D4B26A', '#1C1A17');
    }
    // the cartouche: a scroll frame in ink with the map's name
    const title = 'The Ember Marches', cx = W / 2, cy = -CM / 2 + 1;
    g.font = "22px 'Marcellus SC', Georgia, serif"; const tw = g.measureText(title).width + 36;
    g.fillStyle = 'rgba(232,220,194,1)'; g.fillRect(cx - tw / 2, cy - 14, tw, 28);
    g.strokeStyle = '#1C1A17'; g.lineWidth = 1.3; g.strokeRect(cx - tw / 2, cy - 14, tw, 28); g.lineWidth = 0.6; g.strokeRect(cx - tw / 2 + 3, cy - 11, tw - 6, 22);
    for (const s of [-1, 1]) { const ex = cx + s * tw / 2; g.lineWidth = 1.3; g.beginPath(); g.moveTo(ex, cy - 14); g.bezierCurveTo(ex + s * 16, cy - 16, ex + s * 16, cy + 2, ex + s * 6, cy + 2); g.bezierCurveTo(ex + s * 1, cy + 2, ex + s * 2, cy - 6, ex + s * 7, cy - 5); g.stroke(); g.beginPath(); g.moveTo(ex, cy + 14); g.bezierCurveTo(ex + s * 12, cy + 14, ex + s * 14, cy + 6, ex + s * 9, cy + 4); g.stroke(); }
    if (PAINTED()) for (const sgn of [-1, 1]) { const ex = cx + sgn * (tw / 2 + 15); oakSprig(g, ex, cy, sgn, 7, true); }
    g.fillStyle = '#1C1A17'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(title, cx, cy + 1.5);
    // the compass rose in the upper-right corner of the margin
    const rx = W + CM / 2 - 2, ry = -CM / 2 + 3, rr = 15;
    g.strokeStyle = '#1C1A17'; g.lineWidth = 0.8; g.beginPath(); g.arc(rx, ry, rr * 0.62, 0, Math.PI * 2); g.stroke();
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 - Math.PI / 2, L = k % 2 ? rr * 0.6 : rr, w = k % 2 ? 2 : 3.2; const tip = [rx + Math.cos(a) * L, ry + Math.sin(a) * L], l = [rx + Math.cos(a - Math.PI / 2) * w, ry + Math.sin(a - Math.PI / 2) * w], r2 = [rx + Math.cos(a + Math.PI / 2) * w, ry + Math.sin(a + Math.PI / 2) * w];
      g.fillStyle = k === 0 ? '#1C1A17' : '#E8DCC2'; g.beginPath(); g.moveTo(...l); g.lineTo(...tip); g.lineTo(...r2); g.closePath(); g.fill(); g.stroke(); }
    g.font = "8px 'Marcellus SC', Georgia, serif"; g.fillStyle = '#1C1A17'; g.fillText('N', rx - rr - 5, ry - rr + 4);
    g.strokeStyle = '#1C1A17'; g.lineWidth = 3; g.strokeRect(-1.5, -1.5, W + 3, H + 3); // the map's outline
    if (PAINTED()) { g.globalAlpha = 0.6; g.lineWidth = 0.8; g.strokeRect(-1.5 - 5, -1.5 - 5, W + 13, H + 13); g.globalAlpha = 1; } // a double neatline
  });
  return CLOTHB;
}

// ---- the two mirror props, drawn live: the month candle (wax height = 1 - day / 30) and the hourglass (on its side while paused)
function flick(t, ph) { return 0.6 * Math.sin(2 * Math.PI * 0.7 * t + ph) + 0.4 * Math.sin(2 * Math.PI * 1.3 * t + ph * 1.7); }
function drawCandle(g, t, live) {
  const [x, y] = PROPS.candle; const day = state.day;
  g.fillStyle = 'rgba(0,0,0,.3)'; ellipse(g, x + 5, y + 6, 28, 28); g.fill();
  g.strokeStyle = '#4A4744'; g.lineWidth = 4; g.beginPath(); g.arc(x + 30, y + 8, 9, 0, Math.PI * 2); g.stroke(); // ring handle
  g.fillStyle = '#4A4744'; ellipse(g, x, y, 26, 26); g.fill(); g.strokeStyle = '#2B2A28'; g.lineWidth = 2; g.stroke();
  g.fillStyle = '#3A3836'; ellipse(g, x, y, 15, 15); g.fill();
  const hgt = 50 * (1 - day / 30) + 3, top = y - hgt;
  g.fillStyle = '#CFC0A0'; g.fillRect(x - 9, top, 18, hgt); g.fillStyle = '#E9DFC2'; g.fillRect(x - 9, top, 7, hgt);
  g.fillStyle = '#E9DFC2'; ellipse(g, x, top, 9, 4.5); g.fill(); g.strokeStyle = 'rgba(28,26,23,.35)'; g.lineWidth = 0.8; g.stroke();
  g.strokeStyle = '#2B2A28'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, top); g.lineTo(x, top - 4); g.stroke();
  const fl = live ? flick(t, 1.1) : 0, fh = 15 * (1 + 0.02 * fl), fb = 1 + 0.03 * fl;
  const fy = top - 4;
  const glow = g.createRadialGradient(x, fy - fh * 0.5, 1, x, fy - fh * 0.5, 30); glow.addColorStop(0, `rgba(255,200,120,${0.35 * fb})`); glow.addColorStop(1, 'rgba(255,167,87,0)');
  g.fillStyle = glow; g.fillRect(x - 30, fy - fh * 0.5 - 30, 60, 60);
  const fg = g.createRadialGradient(x, fy - fh * 0.35, 0.5, x, fy - fh * 0.4, fh * 0.6); fg.addColorStop(0, '#FFE8C3'); fg.addColorStop(1, '#FF8400');
  g.globalAlpha = Math.min(1, 0.95 * fb); g.fillStyle = fg; g.beginPath(); g.moveTo(x, fy - fh); g.bezierCurveTo(x + 6, fy - fh * 0.5, x + 5, fy, x, fy); g.bezierCurveTo(x - 5, fy, x - 6, fy - fh * 0.5, x, fy - fh); g.fill(); g.globalAlpha = 1;
}
function drawHourglass(g, t, live) {
  const [x, y] = PROPS.hourglass, frac = state.day / 30;
  g.save(); g.translate(x, y); if (state.paused) g.rotate(Math.PI / 2);
  g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(-22, -36, 50, 80);
  g.fillStyle = 'rgba(207,224,234,.3)'; g.beginPath(); g.moveTo(-16, -30); g.lineTo(16, -30); g.lineTo(2, 0); g.lineTo(16, 30); g.lineTo(-16, 30); g.lineTo(-2, 0); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(28,26,23,.5)'; g.lineWidth = 1; g.stroke();
  g.fillStyle = '#C9A86A';
  const up = 1 - frac; if (up > 0.02) { const hh = 26 * up; g.beginPath(); g.moveTo(-14 * up - 2, -hh); g.lineTo(14 * up + 2, -hh); g.lineTo(1.5, -2); g.lineTo(-1.5, -2); g.closePath(); g.fill(); }
  const lo = frac; if (lo > 0.02) { const hh = 26 * lo; g.beginPath(); g.moveTo(-15, 29); g.lineTo(15, 29); g.lineTo(15 - 13 * lo, 29 - hh); g.lineTo(-15 + 13 * lo, 29 - hh); g.closePath(); g.fill(); }
  if (live && !state.paused && !view.reduced) { g.strokeStyle = '#C9A86A'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, -1); g.lineTo(0, 29 - 26 * lo); g.stroke(); }
  g.fillStyle = '#5E4630'; g.strokeStyle = '#3E2E20'; g.lineWidth = 1.5;
  for (const cy of [-36, 30]) { g.beginPath(); g.roundRect(-20, cy, 40, 7, 2); g.fill(); g.stroke(); }
  g.fillStyle = '#715636'; for (const px of [-17, 17]) g.fillRect(px - 1.5, -30, 3, 60);
  g.restore();
}

// ---- v3 cloth margin (step 11): the paper tooth over the margin, a little wear by the hem, the wash overrun at the outline, oak sprigs
function oakLeaf(g, x, y, len, ang) {
  g.save(); g.translate(x, y); g.rotate(ang); g.beginPath();
  for (let k = 0; k <= 24; k++) { const t = k / 24, w = Math.sin(Math.PI * t) * (0.3 + 0.1 * Math.cos(6 * Math.PI * t)) * len; k ? g.lineTo(t * len, -w) : g.moveTo(0, 0); }
  for (let k = 24; k >= 0; k--) { const t = k / 24, w = Math.sin(Math.PI * t) * (0.3 + 0.1 * Math.cos(6 * Math.PI * t)) * len; g.lineTo(t * len, w); }
  g.closePath(); g.fillStyle = 'rgba(168,154,110,.5)'; g.fill(); g.strokeStyle = '#3E3428'; g.lineWidth = 0.6; g.stroke();
  g.beginPath(); g.moveTo(0, 0); g.lineTo(len * 0.92, 0); g.lineWidth = 0.4; g.stroke(); g.restore();
}
function oakSprig(g, x, y, sgn, len, acorn) { // three leaves and (on the cartouche) an acorn, mirrored by sgn
  g.save(); g.translate(x, y); g.scale(sgn, 1);
  g.strokeStyle = '#3E3428'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(-len * 0.8, 0); g.quadraticCurveTo(0, -len * 0.15, len * 0.4, 0); g.stroke();
  oakLeaf(g, 0, 0, len, -0.75); oakLeaf(g, 0, 0, len * 1.1, 0.05); oakLeaf(g, 0, 0, len * 0.9, 0.8);
  if (acorn) { g.fillStyle = 'rgba(168,154,110,.8)'; ellipse(g, -len * 0.55, len * 0.35, len * 0.16, len * 0.22, 0.3); g.fill(); g.strokeStyle = '#3E3428'; g.lineWidth = 0.5; g.stroke(); g.fillStyle = '#6E5A3C'; g.beginPath(); g.ellipse(-len * 0.6, len * 0.17, len * 0.19, len * 0.1, 0.3, Math.PI, 0); g.fill(); g.stroke(); }
  g.restore();
}
function clothMarginV3(g, x0, y0, x1, y1) {
  g.save(); g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); g.rect(0, 0, W, H); g.clip('evenodd');
  g.globalCompositeOperation = 'soft-light'; g.globalAlpha = 0.6; const pat = g.createPattern(paperTile(), 'repeat'), pk = U * PAT_SCALE.mid; pat.setTransform(new DOMMatrix([pk, 0, 0, pk, 0, 0])); // v3 critique 2: the Mid tile scale g.fillStyle = pat; g.fillRect(x0, y0, x1 - x0, y1 - y0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  const wear = 6, h = HEM; // a 6-unit band inside the hem, toward #D9CBAE (texture, not light)
  for (const [ax, ay, bx, by, rx, ry, rw, rh] of [[x0 + h, 0, x0 + h + wear, 0, x0 + h, y0, wear, y1 - y0], [x1 - h, 0, x1 - h - wear, 0, x1 - h - wear, y0, wear, y1 - y0], [0, y0 + h, 0, y0 + h + wear, x0, y0 + h, x1 - x0, wear], [0, y1 - h, 0, y1 - h - wear, x0, y1 - h - wear, x1 - x0, wear]]) {
    const lg = g.createLinearGradient(ax, ay, bx, by); lg.addColorStop(0, 'rgba(217,203,174,.9)'); lg.addColorStop(1, 'rgba(217,203,174,0)'); g.fillStyle = lg; g.fillRect(rx, ry, rw, rh);
  }
  // the wash overrun: each outer province's wash runs a few units into the margin as an irregular lighter edge (never along a wild)
  for (const i of provList) {
    const ring = cells[i], R = rngFor('overrun:12:' + i), f = TERRAIN[terr[i]].fill, ph1 = R() * 6.28, ph2 = R() * 6.28;
    for (let k = 0; k < ring.length - 1; k++) {
      const a = ring[k], b = ring[k + 1], side = Math.abs(a[0]) < 0.5 && Math.abs(b[0]) < 0.5 ? [-1, 0] : Math.abs(a[0] - W) < 0.5 && Math.abs(b[0] - W) < 0.5 ? [1, 0] : Math.abs(a[1]) < 0.5 && Math.abs(b[1]) < 0.5 ? [0, -1] : Math.abs(a[1] - H) < 0.5 && Math.abs(b[1] - H) < 0.5 ? [0, 1] : null;
      if (!side) continue; const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(4, Math.round(L / 4)), out = [], back = [];
      for (let m = 0; m <= n; m++) { const t = m / n, w = 3.3 + 1.7 * (Math.sin(t * 7 + ph1) * 0.6 + Math.sin(t * 17 + ph2) * 0.4), px = a[0] + (b[0] - a[0]) * t, py = a[1] + (b[1] - a[1]) * t; out.push([px + side[0] * w, py + side[1] * w]); back.push([px, py]); }
      g.beginPath(); out.forEach(([x, y], m) => (m ? g.lineTo(x, y) : g.moveTo(x, y))); for (let m = back.length - 1; m >= 0; m--) g.lineTo(...back[m]); g.closePath(); g.fillStyle = rgba(f, 0.35); g.fill();
    }
  }
  g.restore();
  for (const [cx, cy, sx, sy] of [[x0 + HEM + 16, y0 + HEM + 16, 1, 1], [x1 - HEM - 16, y0 + HEM + 16, -1, 1], [x0 + HEM + 16, y1 - HEM - 16, 1, -1], [x1 - HEM - 16, y1 - HEM - 16, -1, -1]]) { g.save(); g.translate(cx, cy); g.scale(sx, sy); oakSprig(g, 0, 0, 1, 7, false); g.restore(); }
}

// ------------------------------------------------------------------ map detail: terrain, settlements, alignment, wilds (baked per province per zoom band)
const MEAN_AREA = provs.reduce((a, p) => a + areaOf[p.i], 0) / provs.length;
const MED_DIAM = (() => { const d = provs.map((p) => 2 * Math.sqrt(areaOf[p.i] / Math.PI)).sort((a, b) => a - b); return d[Math.floor(d.length / 2)]; })();
const bandOf = (s) => (s * MED_DIAM < 70 ? 'far' : s * MED_DIAM <= 180 ? 'mid' : 'near');
const BAND_RES = { far: 70 / MED_DIAM, mid: 180 / MED_DIAM, near: 420 / MED_DIAM }; // px per unit at the top of each band
const DESIGN = { far: 0.3, mid: 0.62, near: 1.5 }; // scale that screen-px sizes (ticks, strokes) are designed for
const EXCL = { far: 0.33, mid: 70 / MED_DIAM, near: 180 / MED_DIAM }; // label boxes are measured at the band's widest
const TSPEC = { plains: [2, 14, 34], farmland: [2, 4, 8], forest: [4, 30, 60], hills: [3, 7, 14], mountains: [3, 6, 12], swamp: [3, 14, 30], wasteland: [2, 12, 28] }; // v3 critique 4, 10: hills and mountains count ranges
const TSPEC_V2 = { plains: [2, 10, 20], farmland: [2, 4, 8], forest: [4, 30, 60], hills: [3, 6, 10], mountains: [3, 5, 8], swamp: [3, 12, 22], wasteland: [2, 8, 14] }; // v2's counts: its slot set and the Hand: v2 toggle
const BIX = { far: 0, mid: 1, near: 2 };
const SU = Math.sqrt(MEAN_AREA / 6400); // the brief's units assume a 6400-unit average province; this sheet's are about 4 times larger
const HSC = 0.92 * SU, HR = 3.2 * HSC, LS = HSC / 1.3, SS = 1.55, MS = 1.45; // houses, spiral, landmarks, stamps, motifs
const INK = '#1C1A17', INK7 = 'rgba(28,26,23,.7)';
function distToEdge(poly, x, y) { let m = Infinity; for (let k = 0; k < poly.length - 1; k++) { const a = poly[k], b = poly[k + 1], ax = a[0], ay = a[1], dx = b[0] - ax, dy = b[1] - ay; const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1))); const ex = x - ax - t * dx, ey = y - ay - t * dy, d2 = ex * ex + ey * ey; if (d2 < m) m = d2; } return Math.sqrt(m); }
const inPoly = (poly, x, y) => d3.polygonContains(poly, [x, y]);
const bboxOf = (poly) => { let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity; for (const [x, y] of poly) { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); d = Math.max(d, y); } return [a, b, c, d]; };
const boxHit = (bs, x0, y0, x1, y1) => bs.some((b) => x1 > b[0] && x0 < b[2] && y1 > b[1] && y0 < b[3]);
const pathPoly = (g, poly) => { g.beginPath(); poly.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };

// ---- per-province geometry: the seat (below the label), stable Poisson slots with ranks
const GEO = new Map();
function geo(i) {
  let G = GEO.get(i); if (G) return G;
  const poly = npoly[i], cv = cells[i], c = cent[i], bb = bboxOf(poly); // v3: clips and containment on the wobbling polygon, distances on the convex cell
  const ext = HR * Math.sqrt((prov[i].cap ? 22 : 12) + 0.35) * 1.3 * 0.62 + 10;
  let seat = [c[0], c[1] + 52];
  for (let t = 1; t >= 0; t -= 0.08) { seat = [c[0], c[1] + 52 * t]; if (inPoly(cv, ...seat) && distToEdge(cv, ...seat) > ext) break; }
  const R = rngFor(`map:11:${i}:slots`), spec = TSPEC[terr[i]] ?? [3, 10, 20], spec2 = TSPEC_V2[terr[i]] ?? [3, 10, 20];
  const want = Math.round((spec2[2] * areaOf[i]) / MEAN_AREA * 1.6) + 10; // v2's slots (landmarks, water, motifs) keep v2's count, so they do not move
  const rad = Math.sqrt(areaOf[i] / want) * 0.78;
  const slots = [], cellS = rad, grid = new Map(), gk = (x, y) => Math.floor(x / cellS) * 8192 + Math.floor(y / cellS);
  const close = (x, y) => { const gx = Math.floor(x / cellS), gy = Math.floor(y / cellS); for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const l = grid.get((gx + a) * 8192 + gy + b); if (l) for (const s of l) if ((s.x - x) ** 2 + (s.y - y) ** 2 < rad * rad) return true; } return false; };
  for (let t = 0; t < want * 40 && slots.length < want; t++) {
    const x = bb[0] + R() * (bb[2] - bb[0]), y = bb[1] + R() * (bb[3] - bb[1]);
    if (!inPoly(cv, x, y)) continue; const de = distToEdge(cv, x, y) - (npoly === cells ? 0 : 6);
    if (de < 15 || close(x, y) || (npoly !== cells && !inPoly(poly, x, y))) continue;
    const sl = { x, y, rank: R(), d: Math.hypot(x - seat[0], (y - seat[1]) * 1.4), v: R(), e: de }; slots.push(sl); const kk = gk(x, y); let gl = grid.get(kk); if (!gl) grid.set(kk, (gl = [])); gl.push(sl);
  }
  slots.sort((a, b) => a.d - b.d);
  G = { poly, c, bb, seat, slots, rad };
  if (PAINTED()) { // v3: a denser seeded slot set for the painted stamps (v2's slots stay for v2's paths and the motifs)
    const R2 = rngFor(`map:12:${i}:slots3`), want2 = Math.round(Math.max(spec[2], 24) * (areaOf[i] / MEAN_AREA) * 2.4) + 16, rad2 = Math.sqrt(areaOf[i] / want2) * 0.8, s2 = [], g2 = new Map();
    const near2 = (x, y) => { const gx = Math.floor(x / rad2), gy = Math.floor(y / rad2); for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const l = g2.get((gx + a) * 8192 + gy + b); if (l) for (const q of l) if ((q.x - x) ** 2 + (q.y - y) ** 2 < rad2 * rad2) return true; } return false; };
    for (let t = 0; t < want2 * 30 && s2.length < want2; t++) {
      const x = bb[0] + R2() * (bb[2] - bb[0]), y = bb[1] + R2() * (bb[3] - bb[1]);
      if (!inPoly(cv, x, y)) continue; const de = distToEdge(cv, x, y) - (npoly === cells ? 0 : 6); if (de < 12 || near2(x, y) || (npoly !== cells && !inPoly(poly, x, y))) continue;
      const q = { x, y, rank: R2(), d: Math.hypot(x - seat[0], (y - seat[1]) * 1.4), v: R2(), e: de }; s2.push(q); const kk = Math.floor(x / rad2) * 8192 + Math.floor(y / rad2); let gl = g2.get(kk); if (!gl) g2.set(kk, (gl = [])); gl.push(q);
    }
    G.slots3 = s2.sort((a, b) => a.d - b.d);
  }
  GEO.set(i, G); return G;
}
const labelFs = (s) => Math.max(10, Math.min(15, 15 * s * 1.4));
const TW_CACHE = new Map();
let measureCtx = null;
function textW(text, font) { const k = font + '|' + text; let w = TW_CACHE.get(k); if (w == null) { measureCtx ??= makeCanvas(4, 4).getContext('2d'); measureCtx.font = font; w = measureCtx.measureText(text).width; TW_CACHE.set(k, w); } return w; }
const nameFontV2 = (p, fs) => `${p.cap ? 600 : 500} ${p.cap ? fs + 1 : fs}px 'Alegreya Sans', 'Segoe UI', sans-serif`;
// v3 lettering: Alegreya. v3 critique 3: one size up and heavier: 12 px at the bottom of Mid ramping to 13.5 at its top, 13.5 to 15.5 at Near
// (Far stays 11); weight 600, capitals +1 at 800
function nameFs(s) { const med = s * MED_DIAM, v = med < 70 ? 11 : med <= 180 ? 12 + (1.5 * (med - 70)) / 110 : 13.5 + 2 * Math.min(1, (med - 180) / 240); return Math.round(v * 4) / 4; } // quarter-px steps keep the measure cache warm
const nameFontInk = (p, fs) => `${p.cap ? 800 : 600} ${(p.cap ? fs + 1 : fs).toFixed(1)}px 'Alegreya', Georgia, serif`;
const inkLabels = () => view.labels === 'ink';
const labelSize = (s) => (inkLabels() ? nameFs(s) : labelFs(s));
const nameFont = (p, fs) => (inkLabels() ? nameFontInk(p, fs) : nameFontV2(p, fs));
function tokensAt(i) { return Object.values(cmd).filter((c) => !c.hidden && c.at === i).length; }
// v3 fixed zones (H10): label, token and seat boxes per band that never depend on armies, sized at the band's design scale (deviation:
// at the band's widest scale the Mid zones span a whole province). The label zone is the name (with its halo) and a second line of two
// chips; the token zone holds TOKEN_ZONE stacks. The paint and the features use zonesAll, the union of the Mid and Near zones.
const TOKEN_ZONE = { far: 1, mid: 1, near: 2 };
const ZCACHE = new Map();
function zones(i, band) {
  const k = i + ':' + band + ':' + view.labels + ':' + fontsReadyFlag(); let z = ZCACHE.get(k); if (z) return z;
  const s = DESIGN[band], p = prov[i], G = geo(i), [cx, cy] = G.c, fs = labelSize(s), m = 4 / s, tw = textW(p.name, nameFont(p, fs)) + 6;
  z = [[cx - tw / 2 / s - m, cy + (-6 - fs / 2 - 2) / s - m, cx + tw / 2 / s + m, cy + (-6 + fs / 2 + 2) / s + m], [cx - 27 / s - m, cy + 2 / s - m, cx + 22 / s + m, cy + 18 / s + m]];
  const tz = (15 * TOKEN_ZONE[band] + 4) / s; z.push([cx - tz - m, cy - (72 + (band === 'near' ? 44 : 0)) / s - m, cx + tz + m, cy - 14 / s + m]);
  const sr = settleExtent(i); z.push([G.seat[0] - sr - 4, G.seat[1] - sr * 0.8 - 14, G.seat[0] + sr + 4, G.seat[1] + sr * 0.8 + 6]);
  ZCACHE.set(k, z); return z;
}
function zonesAll(i) { const k = i + ':all:' + view.labels + ':' + fontsReadyFlag(); let z = ZCACHE.get(k); if (!z) { z = [...zones(i, 'mid'), ...zones(i, 'near')]; ZCACHE.set(k, z); } return z; }
const fontsReadyFlag = () => (typeof fontsReady === 'undefined' ? false : fontsReady);
function exclusions(i, band) { // v2: label, token and seat boxes in world units, plus a 4 px margin
  const s = EXCL[band], p = prov[i], G = geo(i), [cx, cy] = G.c, fs = labelFs(s), m = 4 / s;
  const w = Math.max(textW(p.name, nameFontV2(p, fs)) + 10, 84) / s;
  const out = [[cx - w / 2 - m, cy + (-6 - fs / 2 - 5) / s - m, cx + w / 2 + m, cy + 24 / s + m]];
  const n = tokensAt(i); if (n) { const tw = (15 * n + 4) / s; out.push([cx - tw - m, cy - (72 + (band === 'near' ? 44 : 0)) / s - m, cx + tw + m, cy - 14 / s + m]); }
  const sr = settleExtent(i); out.push([G.seat[0] - sr - 4, G.seat[1] - sr * 0.8 - 14, G.seat[0] + sr + 4, G.seat[1] + sr * 0.8 + 6]);
  return out;
}

// ---- settlements: tier from population, houses on a golden-angle spiral, walls by PD, landmarks, kits by owner
const TIERS = [[0, 2000, 1, 2], [2000, 5000, 3, 5], [5000, 10000, 6, 9], [10000, 20000, 10, 15], [20000, 40000, 16, 22]];
const tierOf = (p) => (p.cap ? 4 : TIERS.findIndex((t) => p.pop < t[1]) < 0 ? 4 : TIERS.findIndex((t) => p.pop < t[1]));
function houseCount(p) { const t = TIERS[tierOf(p)]; const pop = Math.max(p.pop, t[0]); return Math.max(t[2], Math.min(t[3], t[2] + Math.floor(((pop - t[0]) / (t[1] - t[0])) * (t[3] - t[2] + 1)))); }
function settleExtent(i) { const p = prov[i]; return HR * Math.sqrt((p.cap ? 22 : 15) + 0.35) * 1.3 + 8; } // fixed per province, so growth never moves stamps
function settlement(i) {
  const p = prov[i], [sx, sy] = geo(i).seat, n = houseCount(p);
  const thrive = p.pop >= 1.25 * p.startPop, decline = p.pop <= 0.8 * p.startPop;
  const houses = [];
  for (let k = 0; k < n; k++) {
    const R = rngFor(`house:${i}:${k}`), a = (k * 137.508 * Math.PI) / 180, r = HR * Math.sqrt(k + 0.35);
    houses.push({ k, x: sx + Math.cos(a) * r * 1.3 + (R() - 0.5) * 1.4, y: sy + Math.sin(a) * r * 0.8 + (R() - 0.5) * 1.1, v: Math.floor(R() * 3), fresh: thrive && k >= n - 2, ruin: decline && k >= n - 2 });
  }
  const rad = HR * Math.sqrt(n + 0.35) * 1.3 + 5;
  return { tier: tierOf(p), n, houses, rad, thrive, decline, kit: p.kitOwner ?? p.owner, sx, sy };
}
function house(g, h, kit, PX, flags) {
  const { x, y } = h, u = HSC;
  g.lineWidth = PX * 0.9; g.strokeStyle = INK;
  if (flags.line) { g.strokeStyle = flags.line; g.lineWidth = PX * 1.1; g.beginPath(); g.moveTo(x - 3 * u, y); g.lineTo(x - 3 * u, y - 2 * u); g.lineTo(x, y - 4.5 * u); g.lineTo(x + 3 * u, y - 2 * u); g.lineTo(x + 3 * u, y); g.closePath(); g.stroke(); return; }
  const L = PAINTED(), lw0 = g.lineWidth; // v3: warm lit faces left, cool shade right (H14); the cast shadow is drawn in the first pass
  if (!L) { g.fillStyle = 'rgba(28,26,23,.25)'; ellipse(g, x + 0.8 * u, y + 0.4 * u, 3.8 * u, 1.3 * u); g.fill(); }
  const roof = (P, tone) => { if (L) facePoly(g, P, tone, lw0, null, 0.5); else { g.fillStyle = tone; g.beginPath(); P.forEach(([px, py], k) => (k ? g.lineTo(px, py) : g.moveTo(px, py))); g.closePath(); g.fill(); g.stroke(); } };
  const wall = (x0, y0, w0, h0, tone) => { if (L) faceRect(g, x0, y0, w0, h0, tone, lw0, null, 0.62); else { g.fillStyle = tone; g.fillRect(x0, y0, w0, h0); g.strokeRect(x0, y0, w0, h0); } };
  if (kit === 'red') {
    wall(x - 3.6 * u, y - 1.8 * u, 7.2 * u, 1.8 * u, '#8F8C88');
    if (h.ruin) return;
    roof([[x - 4 * u, y - 1.8 * u], [x - 2.7 * u, y - 4.6 * u], [x + 2.7 * u, y - 4.6 * u], [x + 4 * u, y - 1.8 * u]], h.fresh ? '#E3CF8F' : '#3A3633'); g.strokeStyle = INK; g.lineWidth = lw0;
    g.strokeStyle = h.fresh ? '#B89A5A' : '#5E5953'; g.beginPath(); for (let k = 0; k <= 6; k++) { const xx = x - 2.7 * u + (k * 5.4 * u) / 6, yy = y - 4.6 * u - (k % 2 ? 0.9 * u : 0); k ? g.lineTo(xx, yy) : g.moveTo(xx, yy); } g.stroke();
    if (!flags.shut) { g.fillStyle = '#FFB347'; for (const dx of [-1.6, 1.4]) { ellipse(g, x + dx * u, y - 0.9 * u, 0.55 * u, 0.55 * u); g.fill(); } } else { g.fillStyle = '#2B2A28'; for (const dx of [-1.6, 1.4]) g.fillRect(x + dx * u - 0.6 * u, y - 1.4 * u, 1.2 * u, 0.9 * u); }
  } else if (kit === 'green') {
    if (L) faceFill(g, () => ellipse(g, x, y - 0.9 * u, 3 * u, 1.5 * u), '#A0785A', x + 0.6 * u, [x - 4 * u, y - 3 * u, x + 4 * u, y + u], INK, lw0); else { g.fillStyle = '#A0785A'; ellipse(g, x, y - 0.9 * u, 3 * u, 1.5 * u); g.fill(); g.stroke(); }
    if (h.ruin) return;
    if (L) faceFill(g, () => { g.beginPath(); g.ellipse(x, y - 1.6 * u, 3.3 * u, 3 * u, 0, Math.PI, 0); g.closePath(); }, h.fresh ? '#E3CF8F' : '#4E6B3A', x + 0.4 * u, [x - 4 * u, y - 5 * u, x + 4 * u, y], INK, lw0);
    else { g.fillStyle = h.fresh ? '#E3CF8F' : '#4E6B3A'; g.beginPath(); g.ellipse(x, y - 1.6 * u, 3.3 * u, 3 * u, 0, Math.PI, 0); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = h.fresh ? '#F2E4B0' : '#6E8F4E'; ellipse(g, x - 1 * u, y - 3.2 * u, 1.3 * u, 0.8 * u); g.fill(); }
    if (flags.shut) { g.fillStyle = '#2B2A28'; g.fillRect(x - 0.6 * u, y - 1.3 * u, 1.2 * u, 0.9 * u); }
  } else {
    wall(x - 2.7 * u, y - 2 * u, 5.4 * u, 2 * u, '#D8CBB0');
    if (h.ruin) return;
    roof([[x - 3.1 * u, y - 2 * u], [x - 1.4 * u, y - 4.7 * u], [x + 1.4 * u, y - 4.7 * u], [x + 3.1 * u, y - 2 * u]], h.fresh ? '#E3CF8F' : '#C2A86B');
    if (flags.shut) { g.fillStyle = '#2B2A28'; g.fillRect(x - 0.6 * u, y - 1.5 * u, 1.2 * u, 0.9 * u); }
  }
  if (flags.vines) { g.strokeStyle = '#4E6B3A'; g.lineWidth = PX * 1.2; g.beginPath(); g.moveTo(x - 3 * u, y); g.quadraticCurveTo(x - 2 * u, y - 3 * u, x, y - 4 * u); g.stroke(); }
}
function pennant(g, x, y, col, PX) { const k = LS; g.strokeStyle = INK; g.lineWidth = PX; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 9 * k); g.stroke(); g.fillStyle = col; g.beginPath(); g.moveTo(x, y - 9 * k); g.lineTo(x + 6 * k, y - 7.5 * k); g.lineTo(x, y - 6 * k); g.closePath(); g.fill(); g.lineWidth = PX * 0.7; g.stroke(); }
function landmark(g, kind, kit, x0, y0, PX0, o = {}) { // drawn on a 1.3-house grid, scaled to the house size
  g.save(); g.translate(x0, y0); g.scale(LS, LS);
  try { return y0 + LS * landmarkShape(g, kind, kit, 0, 0, PX0 / LS, o); } finally { g.restore(); }
}
function landmarkShape(g, kind, kit, x, y, PX, o) {
  g.lineWidth = PX * 0.9; g.strokeStyle = INK;
  if (o.q != null) { // scaffold: the built part's height in quarters
    const hh = 12 * (o.q / 4); g.fillStyle = kit === 'green' ? '#A0785A' : kit === 'red' ? '#5E5953' : '#D8CBB0'; g.fillRect(x - 4, y - hh, 8, hh); g.strokeRect(x - 4, y - hh, 8, hh);
    g.strokeStyle = '#8C6A47'; g.lineWidth = PX * 0.8; for (const xx of [-5, 0, 5]) { g.beginPath(); g.moveTo(x + xx, y); g.lineTo(x + xx, y - 13); g.stroke(); } for (const yy of [-4, -8, -12]) { g.beginPath(); g.moveTo(x - 5.5, y + yy); g.lineTo(x + 5.5, y + yy); g.stroke(); }
    return y - 13;
  }
  const lit = o.lit !== false, L = PAINTED(), lw0 = PX * 0.9;
  const FR = (x0, y0, w0, h0, col) => { if (L) faceRect(g, x0, y0, w0, h0, col, lw0); else { g.fillStyle = col; g.fillRect(x0, y0, w0, h0); g.strokeStyle = INK; g.lineWidth = lw0; g.strokeRect(x0, y0, w0, h0); } };
  const FP = (P, col) => { if (L) facePoly(g, P, col, lw0); else { g.fillStyle = col; g.beginPath(); P.forEach(([px, py], k) => (k ? g.lineTo(px, py) : g.moveTo(px, py))); g.closePath(); g.fill(); g.strokeStyle = INK; g.lineWidth = lw0; g.stroke(); } };
  if (kind === 'keep') {
    if (kit === 'green') { g.strokeStyle = '#4E6B3A'; g.lineWidth = PX * 2.2; ellipse(g, x, y - 2, 9, 5); g.stroke(); FR(x - 3.5, y - 12, 7, 11, '#6B4A2B'); if (L) faceFill(g, () => ellipse(g, x, y - 13, 5.5, 3.5), '#4E6B3A', x + 0.8, [x - 6, y - 17, x + 6, y - 9], INK, lw0); else { g.fillStyle = '#4E6B3A'; ellipse(g, x, y - 13, 5.5, 3.5); g.fill(); g.stroke(); } return y - 15; }
    const col = kit === 'red' ? '#3A3836' : '#9A958C', top = kit === 'red' ? '#2B2A28' : '#B9B4AA';
    FR(x - 5, y - 12, 10, 12, col); FR(x - 6, y - 15, 12, 3.4, top);
    for (const xx of [-6, -2, 2]) FR(x + xx, y - 17, 2.6, 2.2, col);
    if (kit === 'red') { g.fillStyle = '#FFB347'; g.fillRect(x - 1, y - 8, 2, 2.6); }
    return y - 17;
  }
  if (kind === 'temple') {
    if (kit === 'red') { // a stepped pyre tower with a brazier
      for (let k = 0; k < 3; k++) { const w = 9 - k * 2.5; FR(x - w / 2, y - 4 * (k + 1), w, 4, '#5E5953'); }
      if (lit) { const gl = g.createRadialGradient(x, y - 14, 0.3, x, y - 14, 4.5); gl.addColorStop(0, 'rgba(255,179,71,.9)'); gl.addColorStop(1, 'rgba(255,179,71,0)'); g.fillStyle = gl; ellipse(g, x, y - 14, 4.5, 4.5); g.fill(); g.fillStyle = '#FFB347'; ellipse(g, x, y - 13.6, 1.3, 1.3); g.fill(); }
      else { g.fillStyle = '#8F8C88'; ellipse(g, x, y - 13.5, 1.2, 1.2); g.fill(); }
      return y - 15;
    }
    if (kit === 'green') { // a ring of six small trees around an altar
      g.fillStyle = lit ? '#9A958C' : '#7A7670'; g.fillRect(x - 1.6, y - 2.4, 3.2, 2.4); g.strokeRect(x - 1.6, y - 2.4, 3.2, 2.4);
      for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; const tx = x + Math.cos(a) * 6, ty = y - 1 + Math.sin(a) * 3.4; g.fillStyle = '#2F4A26'; ellipse(g, tx, ty - 2.6, 2, 2); g.fill(); g.fillStyle = '#4E6B3A'; ellipse(g, tx - 0.5, ty - 3.1, 1.3, 1.3); g.fill(); g.lineWidth = PX * 0.7; ellipse(g, tx, ty - 2.6, 2, 2); g.stroke(); }
      return y - 6;
    }
    FR(x - 3, y - 6, 6, 6, '#D8CBB0'); FP([[x - 3.5, y - 6], [x, y - 10], [x + 3.5, y - 6]], '#C2A86B'); g.strokeStyle = INK; g.lineWidth = lw0; g.beginPath(); g.moveTo(x, y - 10); g.lineTo(x, y - 13); g.moveTo(x - 1.4, y - 11.8); g.lineTo(x + 1.4, y - 11.8); g.stroke();
    return y - 13;
  }
  if (kind === 'lab') {
    if (kit === 'red') { FP([[x - 3, y], [x - 1.4, y - 16], [x, y - 19], [x + 1.4, y - 16], [x + 3, y]], '#2B2A28'); g.fillStyle = '#FFB347'; g.fillRect(x - 0.6, y - 12, 1.2, 2); return y - 19; }
    if (kit === 'green') { FP([[x - 3.4, y], [x - 2.4, y - 13], [x + 2.4, y - 13], [x + 3.4, y]], '#5E4630'); g.strokeStyle = INK; g.lineWidth = lw0; g.fillStyle = '#1C1A17'; ellipse(g, x, y - 5, 1, 1.6); g.fill(); g.fillStyle = '#4E6B3A'; ellipse(g, x, y - 15, 5, 3.6); g.fill(); g.stroke(); g.fillStyle = '#6E8F4E'; ellipse(g, x - 1.4, y - 16, 2, 1.4); g.fill(); return y - 18; }
    FR(x - 2.5, y - 14, 5, 14, '#B9B4AA'); FP([[x - 3, y - 14], [x, y - 18], [x + 3, y - 14]], '#9A958C'); return y - 18;
  }
  return y;
}
function walls(g, st, pd, PX, half) { // half: 'back' or 'front'
  const { sx, sy } = st, rx = st.rad + 3, ry = rx * 0.62;
  const a0 = half === 'back' ? Math.PI : 0, a1 = half === 'back' ? 2 * Math.PI : Math.PI;
  if (pd >= 5 && pd < 15) {
    g.strokeStyle = '#6B4A2B'; g.lineWidth = PX * 1.2;
    for (let a = a0; a < a1; a += 0.16) { const x = sx + Math.cos(a) * rx, y = sy + Math.sin(a) * ry; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 2.6); g.stroke(); }
    g.lineWidth = PX * 0.8; g.beginPath(); g.ellipse(sx, sy - 1.3, rx, ry, 0, a0, a1); g.stroke();
  } else if (pd >= 15) {
    g.strokeStyle = INK; g.lineWidth = PX * 3.6 + 1.2; g.beginPath(); g.ellipse(sx, sy, rx, ry, 0, a0, a1); g.stroke();
    if (PAINTED()) { const F = kitFaces('#9A958C'); g.lineWidth = 2.6; for (const [b0, b1, c] of [[Math.PI / 2, Math.PI * 1.5, F.lit], [-Math.PI / 2, Math.PI / 2, F.shade], [Math.PI * 1.5, Math.PI * 2.5, F.shade]]) { const lo = Math.max(a0, b0), hi = Math.min(a1, b1); if (hi > lo) { g.strokeStyle = c; g.beginPath(); g.ellipse(sx, sy, rx, ry, 0, lo, hi); g.stroke(); } } }
    else { g.strokeStyle = '#9A958C'; g.lineWidth = 2.6; g.beginPath(); g.ellipse(sx, sy, rx, ry, 0, a0, a1); g.stroke(); }
    g.strokeStyle = INK7; g.lineWidth = PX * 0.8; for (let a = a0; a < a1; a += 0.22) { const x = sx + Math.cos(a) * rx, y = sy + Math.sin(a) * ry; g.beginPath(); g.moveTo(x, y - 1.3); g.lineTo(x, y - 2.4); g.stroke(); }
    if (pd >= 25) for (const a of [Math.PI * 1.25, Math.PI * 1.75, Math.PI * 0.25, Math.PI * 0.75]) {
      if ((a > Math.PI) !== (half === 'back')) continue;
      const x = sx + Math.cos(a) * rx, y = sy + Math.sin(a) * ry; if (PAINTED()) faceRect(g, x - 2.4, y - 5, 4.8, 6, '#9A958C', PX * 0.9); else { g.fillStyle = '#9A958C'; g.fillRect(x - 2.4, y - 5, 4.8, 6); g.strokeStyle = INK; g.lineWidth = PX * 0.9; g.strokeRect(x - 2.4, y - 5, 4.8, 6); }
    }
    if (pd >= 25 && half === 'front') { const x = sx, y = sy + ry; if (PAINTED()) faceRect(g, x - 4.5, y - 5, 9, 6, '#B9B4AA', PX * 0.9); else { g.fillStyle = '#B9B4AA'; g.fillRect(x - 4.5, y - 5, 9, 6); g.strokeRect(x - 4.5, y - 5, 9, 6); } g.fillStyle = '#2B2A28'; g.fillRect(x - 1.6, y - 3, 3.2, 4); }
  }
}

// ---- stamp vocabulary (faces: the fill +12 and -18 L*, a 1 px ink outline at 70%)
function palette(i, band, line) {
  const f = TERRAIN[terr[i]].fill, PX = 1 / BAND_RES[band];
  return { lit: shadeL(f, 12), shade: shadeL(f, -18), ink: INK7, lw: PX, PX, line, fill: f, trunk: shadeL(f, -30) };
}
function stroke(g, P, w = 1) { g.strokeStyle = P.line ?? P.ink; g.lineWidth = P.lw * w; g.stroke(); }
function fillOr(g, P, col) { if (!P.line) { g.fillStyle = col; g.fill(); } }
function tree(g, x, y, r, P, o = {}) {
  const cy = y - r * 1.1;
  if (!P.line) { g.fillStyle = o.trunk ?? P.trunk; g.fillRect(x - r * 0.12, cy, r * 0.24, y - cy); }
  ellipse(g, x, cy, r, r * 0.92); fillOr(g, P, o.shade ?? P.shade);
  if (!P.line) { ellipse(g, x - r * 0.22, cy - r * 0.2, r * 0.7, r * 0.64); g.fillStyle = o.lit ?? P.lit; g.fill(); }
  ellipse(g, x, cy, r, r * 0.92); stroke(g, P);
  if (P.line) { g.beginPath(); g.moveTo(x, cy + r * 0.92); g.lineTo(x, y); stroke(g, P); }
  if (o.blossom && !P.line) { g.fillStyle = '#EAD2DA'; for (let k = 0; k < 4; k++) { const a = k * 1.7 + x; ellipse(g, x + Math.cos(a) * r * 0.5, cy + Math.sin(a) * r * 0.45, r * 0.16, r * 0.16); g.fill(); } }
  if (o.fruit && !P.line) { g.fillStyle = '#D98E4A'; for (let k = 0; k < 4; k++) { const a = k * 1.9 + y; ellipse(g, x + Math.cos(a) * r * 0.55, cy + Math.sin(a) * r * 0.5, r * 0.13, r * 0.13); g.fill(); } }
}
function hump(g, x, y, w, P) {
  const h = w * 0.42; g.beginPath(); g.ellipse(x, y, w / 2, h, 0, Math.PI, 0); g.closePath(); fillOr(g, P, P.lit);
  if (!P.line) { g.save(); g.beginPath(); g.ellipse(x, y, w / 2, h, 0, Math.PI, 0); g.closePath(); g.clip(); g.fillStyle = P.shade; g.beginPath(); g.ellipse(x + w * 0.22, y + h * 0.1, w * 0.42, h * 1.05, 0, Math.PI, 0); g.fill(); g.restore(); }
  g.beginPath(); g.ellipse(x, y, w / 2, h, 0, Math.PI, 0); stroke(g, P);
  for (let k = 0; k < 3; k++) { const a = -0.5 + k * 0.32; g.beginPath(); g.moveTo(x + Math.cos(a) * w * 0.32, y + Math.sin(a) * h * 0.75); g.lineTo(x + Math.cos(a) * w * 0.45, y + Math.sin(a) * h * 0.25 + h * 0.15); stroke(g, P, 0.8); }
}
function peakStamp(g, x, y, h, P, cols) {
  const w = h * 1.15, ax = x - w * 0.06, mid = x + w * 0.08;
  g.beginPath(); g.moveTo(x - w / 2, y); g.lineTo(ax, y - h); g.lineTo(mid, y); g.closePath(); fillOr(g, P, cols.lit);
  g.beginPath(); g.moveTo(ax, y - h); g.lineTo(x + w / 2, y); g.lineTo(mid, y); g.closePath(); fillOr(g, P, cols.shade);
  if (cols.snow && !P.line) {
    const sh = h * 0.4, lx = ax + (x - w / 2 - ax) * 0.4, rx = ax + (x + w / 2 - ax) * 0.4, my = y - h + sh;
    g.fillStyle = cols.snow; g.beginPath(); g.moveTo(ax, y - h); g.lineTo(lx, my); g.lineTo(lx + (ax - lx) * 0.35, my - sh * 0.18); g.lineTo(ax + (mid - ax) * 0.4 - w * 0.03, y - h + sh * 0.95); g.lineTo(ax + (mid - ax) * 0.4, y - h + sh * 0.95); g.closePath(); g.fill();
    g.fillStyle = cols.snowShade; g.beginPath(); g.moveTo(ax, y - h); g.lineTo(ax + (mid - ax) * 0.4, y - h + sh * 0.95); g.lineTo(rx - (rx - ax) * 0.3, my - sh * 0.15); g.lineTo(rx, my); g.closePath(); g.fill();
  }
  g.beginPath(); g.moveTo(x - w / 2, y); g.lineTo(ax, y - h); g.lineTo(x + w / 2, y); g.strokeStyle = P.line ?? cols.ink; g.lineWidth = cols.lw; g.lineJoin = 'round'; g.stroke();
  g.beginPath(); g.moveTo(ax, y - h); g.lineTo(mid, y); g.lineWidth = cols.lw * 0.6; g.stroke();
}
function reeds(g, x, y, h, P) { for (let k = 0; k < 4; k++) { const a = -Math.PI / 2 + (k - 1.5) * 0.28; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * h, y + Math.sin(a) * h); g.strokeStyle = P.line ?? (k % 2 ? P.shade : P.lit); g.lineWidth = P.lw * 1.3; g.stroke(); } if (!P.line) { g.fillStyle = '#4A3A2A'; ellipse(g, x + 1, y - h * 0.9, h * 0.08, h * 0.2, 0.2); g.fill(); } }
function rock(g, x, y, r, P, col, hand) { const c1 = col ?? P.lit; g.beginPath(); g.moveTo(x - r, y); g.lineTo(x - r * 0.6, y - r * 0.9); g.lineTo(x + r * 0.2, y - r * 1.05); g.lineTo(x + r * 0.15, y); g.closePath(); fillOr(g, P, c1); g.beginPath(); g.moveTo(x + r * 0.15, y); g.lineTo(x + r * 0.2, y - r * 1.05); g.lineTo(x + r * 0.95, y - r * 0.5); g.lineTo(x + r, y); g.closePath(); fillOr(g, P, col ? shadeL(col, -22) : P.shade); const out = [[x - r, y], [x - r * 0.6, y - r * 0.9], [x + r * 0.2, y - r * 1.05], [x + r * 0.95, y - r * 0.5], [x + r, y]]; if (hand) { inkPath(g, out, hand.R, true, P.lw, P.line ?? P.ink, hand.k); return; } g.beginPath(); out.forEach(([px, py], k) => (k ? g.lineTo(px, py) : g.moveTo(px, py))); g.closePath(); stroke(g, P); } // v3 critique 12: the hand's ink when a hand is passed
function tuftLean(g, x, y, h, lean, P) { g.strokeStyle = P.line ?? P.shade; g.lineWidth = P.lw * 1.1; g.beginPath(); for (const a of [-0.45, 0, 0.4]) { g.moveTo(x, y); g.lineTo(x + Math.sin(a + lean) * h, y - Math.cos(a + lean) * h); } g.stroke(); }
function tuft(g, x, y, h, P) { g.strokeStyle = P.line ?? P.shade; g.lineWidth = P.lw * 1.2; for (const a of [-0.5, 0, 0.45]) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.sin(a) * h, y - Math.cos(a) * h); g.stroke(); } }
function haystack(g, x, y, r, P) { g.beginPath(); g.ellipse(x, y, r, r * 1.1, 0, Math.PI, 0); g.closePath(); fillOr(g, P, P.lit); if (!P.line) { g.save(); g.clip(); g.fillStyle = P.shade; g.fillRect(x + r * 0.15, y - r * 1.2, r, r * 1.3); g.restore(); } g.beginPath(); g.ellipse(x, y, r, r * 1.1, 0, Math.PI, 0); g.closePath(); stroke(g, P); g.beginPath(); g.moveTo(x - r * 0.6, y - r * 0.5); g.lineTo(x + r * 0.5, y - r * 0.6); stroke(g, P, 0.7); }
function windmill(g, x, y, P) { g.beginPath(); g.moveTo(x - 3, y); g.lineTo(x - 2, y - 10); g.lineTo(x + 2, y - 10); g.lineTo(x + 3, y); g.closePath(); fillOr(g, P, '#D8CBB0'); stroke(g, P); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + 0.4; g.beginPath(); g.moveTo(x, y - 10); g.lineTo(x + Math.cos(a) * 8, y - 10 + Math.sin(a) * 8); g.strokeStyle = P.line ?? INK; g.lineWidth = P.lw * 1.6; g.stroke(); } }
function snag(g, x, y, h, P, col = '#5A4A3A') { g.strokeStyle = P.line ?? col; g.lineWidth = P.lw * 1.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 0.5, y - h); g.moveTo(x + 0.3, y - h * 0.6); g.lineTo(x - h * 0.3, y - h * 0.85); g.moveTo(x + 0.4, y - h * 0.75); g.lineTo(x + h * 0.3, y - h * 0.95); g.stroke(); }
function shrub(g, x, y, r, P) { g.strokeStyle = P.line ?? '#8F6E64'; g.lineWidth = P.lw; for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k - 2) * 0.35; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); g.stroke(); } }
function skull(g, x, y, P) { if (P.line) return; g.fillStyle = '#E9E4D8'; ellipse(g, x, y - 1.6, 2, 1.7); g.fill(); g.fillRect(x - 1.1, y - 0.6, 2.2, 1); g.fillStyle = INK; ellipse(g, x - 0.7, y - 1.6, 0.45, 0.45); g.fill(); ellipse(g, x + 0.7, y - 1.6, 0.45, 0.45); g.fill(); }

// motifs (nation looks and scale poles)
function cairn(g, x, y, s, PX, ember) { g.fillStyle = '#2B2A28'; g.strokeStyle = INK; g.lineWidth = PX * 0.7; for (let k = 0; k < 3; k++) { ellipse(g, x, y - k * 1.9 * s, (2.6 - k * 0.6) * s, 1.2 * s); g.fill(); g.stroke(); } if (ember) { g.fillStyle = '#FFB347'; ellipse(g, x + 0.6 * s, y - 2 * s, 0.5 * s, 0.5 * s); g.fill(); } }
function scorch(g, x, y, r, R) { g.fillStyle = 'rgba(58,54,51,.35)'; g.beginPath(); for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI * 2, rr = r * (0.7 + R() * 0.5); const px = x + Math.cos(a) * rr * 1.3, py = y + Math.sin(a) * rr * 0.8; k ? g.lineTo(px, py) : g.moveTo(px, py); } g.closePath(); g.fill(); g.fillStyle = '#FFB347'; for (let k = 0; k < 4; k++) { ellipse(g, x + (R() - 0.5) * r * 1.6, y + (R() - 0.5) * r, 0.45, 0.45); g.fill(); } }
function shard(g, x, y, PX) { g.fillStyle = '#1C1A17'; g.strokeStyle = '#6E6A64'; g.lineWidth = PX * 0.8; for (const [dx, h] of [[-1.5, 4], [1.2, 5.5]]) { g.beginPath(); g.moveTo(x + dx - 1.2, y); g.lineTo(x + dx, y - h); g.lineTo(x + dx + 1.2, y); g.closePath(); g.fill(); g.stroke(); } }
function brazier(g, x, y, PX) { g.strokeStyle = INK; g.lineWidth = PX; g.beginPath(); g.moveTo(x - 2, y); g.lineTo(x, y - 3); g.lineTo(x + 2, y); g.stroke(); g.fillStyle = '#3A3836'; g.beginPath(); g.ellipse(x, y - 3.4, 2.4, 1.2, 0, 0, Math.PI); g.fill(); g.stroke(); g.fillStyle = '#FFB347'; ellipse(g, x, y - 4, 1.3, 0.9); g.fill(); }
function charred(g, x, y, r, PX) { g.strokeStyle = '#2B2A28'; g.lineWidth = PX * 1.8; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - r * 2); g.moveTo(x, y - r * 1.2); g.lineTo(x - r * 0.7, y - r * 1.8); g.moveTo(x, y - r * 1.5); g.lineTo(x + r * 0.7, y - r * 2.1); g.moveTo(x - r * 0.4, y - r * 1.6); g.lineTo(x - r * 0.7, y - r * 2.2); g.stroke(); g.lineCap = 'butt'; }
function emberCrack(g, x, y, L, R, PX) { g.strokeStyle = '#FFB347'; g.lineWidth = PX * 0.9; g.beginPath(); g.moveTo(x - L / 2, y); for (let k = 1; k <= 4; k++) g.lineTo(x - L / 2 + (k * L) / 4, y + (R() - 0.5) * 3); g.stroke(); }
function burningCairn(g, x, y, PX) { g.strokeStyle = 'rgba(255,179,71,.4)'; g.lineWidth = PX * 1.6; ellipse(g, x, y - 1, 9, 4.5); g.stroke(); g.fillStyle = '#2B2A28'; g.strokeStyle = INK; g.lineWidth = PX * 0.7; for (let k = 0; k < 5; k++) { ellipse(g, x, y - k * 2.3, 3.4 - k * 0.45, 1.4); g.fill(); g.stroke(); } brazier(g, x, y - 11, PX); }
function ivyStone(g, x, y, PX) { rock(g, x, y, 2.8, { lit: '#9A958C', shade: '#7A7670', ink: INK7, lw: PX }, '#9A958C'); g.strokeStyle = '#4E6B3A'; g.lineWidth = PX * 1.1; g.beginPath(); g.moveTo(x - 2.6, y); g.quadraticCurveTo(x - 1.6, y - 2, x - 0.2, y - 2.6); g.moveTo(x + 0.5, y - 1); g.lineTo(x + 1.6, y - 2.2); g.stroke(); }
function blossomBush(g, x, y, PX, R) { g.fillStyle = '#4E6B3A'; g.strokeStyle = INK7; g.lineWidth = PX * 0.7; for (const [dx, dy, r] of [[-2.2, -1.6, 2.2], [1.8, -1.8, 2.4], [0, -3.4, 2.2]]) { ellipse(g, x + dx, y + dy, r, r * 0.85); g.fill(); g.stroke(); } g.fillStyle = '#EAD2DA'; for (let k = 0; k < 7; k++) { const a = k * 2.4; ellipse(g, x + Math.cos(a) * 2.6, y - 2.2 + Math.sin(a) * 1.8, 0.75, 0.75); g.fill(); } }
function sapling(g, x, y, PX) { g.strokeStyle = '#5E4630'; g.lineWidth = PX; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 4.5); g.stroke(); g.fillStyle = '#6E8F4E'; ellipse(g, x, y - 5.5, 1.8, 1.6); g.fill(); g.strokeStyle = INK7; g.lineWidth = PX * 0.7; g.stroke(); }
function mossStone(g, x, y, PX) { g.fillStyle = '#9A958C'; g.strokeStyle = INK; g.lineWidth = PX * 0.8; g.beginPath(); g.moveTo(x - 1.6, y); g.lineTo(x - 1.2, y - 6); g.lineTo(x + 1.2, y - 6.4); g.lineTo(x + 1.6, y); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#5E7F45'; g.fillRect(x - 1.2, y - 6.4, 2.4, 1.6); }
function bramble(g, x, y, PX) { g.strokeStyle = '#5A3A28'; g.lineWidth = PX * 1.1; for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(x - 3 + k * 3, y, 2.4, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); } }
function warCairn(g, x, y, PX) { cairn(g, x, y, 1.1, PX, false); g.strokeStyle = '#5E4630'; g.lineWidth = PX * 1.1; for (const dx of [-1, 1.2]) { g.beginPath(); g.moveTo(x + dx, y - 4); g.lineTo(x + dx * 1.6, y - 13); g.stroke(); } g.fillStyle = '#A8ADB3'; for (const dx of [-1, 1.2]) { g.beginPath(); g.moveTo(x + dx * 1.6 - 0.8, y - 12.4); g.lineTo(x + dx * 1.6, y - 15); g.lineTo(x + dx * 1.6 + 0.8, y - 12.4); g.closePath(); g.fill(); } }
function tornBanner(g, x, y, PX) { g.strokeStyle = '#3E2E20'; g.lineWidth = PX * 1.1; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 12); g.stroke(); g.fillStyle = '#7A1E12'; g.beginPath(); g.moveTo(x, y - 12); g.lineTo(x + 6, y - 11); g.lineTo(x + 4, y - 9.5); g.lineTo(x + 6.5, y - 8); g.lineTo(x + 3, y - 7.4); g.lineTo(x, y - 7); g.closePath(); g.fill(); g.strokeStyle = INK7; g.lineWidth = PX * 0.7; g.stroke(); }
function brokenFence(g, x, y, PX) { g.strokeStyle = '#6B4A2B'; g.lineWidth = PX * 1.1; for (const dx of [-5, -1.5, 2, 5.5]) { g.beginPath(); g.moveTo(x + dx, y); g.lineTo(x + dx + (dx > 4 ? 1.5 : 0), y - 3.4); g.stroke(); } g.beginPath(); g.moveTo(x - 5, y - 2.4); g.lineTo(x - 1.5, y - 2.6); g.moveTo(x + 2, y - 2.2); g.lineTo(x + 6, y - 0.8); g.stroke(); }
function toppledCart(g, x, y, PX) { g.save(); g.translate(x, y); g.rotate(0.5); g.fillStyle = '#8C6A47'; g.fillRect(-4, -3, 8, 3); g.strokeStyle = INK; g.lineWidth = PX * 0.8; g.strokeRect(-4, -3, 8, 3); g.restore(); g.strokeStyle = '#3E2E20'; g.lineWidth = PX; ellipse(g, x + 3, y + 0.5, 1.6, 1.6); g.stroke(); }
function smokeWisp(g, x, y, PX, h = 14) { g.strokeStyle = 'rgba(110,106,100,.55)'; g.lineWidth = PX * 1.6; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 3, y - h * 0.3, x - 3, y - h * 0.6, x + 1.5, y - h); g.stroke(); g.lineCap = 'butt'; }
function cropClump(g, x, y, PX) { g.strokeStyle = '#4E7A32'; g.lineWidth = PX * 1.1; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(x - 3 + k * 1.2, y); g.lineTo(x - 3.4 + k * 1.3, y - 3.5 - (k % 2)); g.stroke(); } }
function briar(g, x, y, PX) { g.strokeStyle = '#3F4A2A'; g.lineWidth = PX * 1.1; for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(x + (k - 1.5) * 2.2, y - 1, 2.2, Math.PI * (1 + k * 0.1), Math.PI * 2.1); g.stroke(); } }
function fern(g, x, y, PX) { g.strokeStyle = '#5E8A3A'; g.lineWidth = PX * 0.9; for (const a of [-0.7, 0, 0.7]) { g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.sin(a) * 3, y - 3, x + Math.sin(a) * 5, y - 4.5); g.stroke(); } }
function beastDen(g, x, y, PX) { g.fillStyle = '#5E4630'; g.beginPath(); g.ellipse(x, y, 5, 3, 0, Math.PI, 0); g.closePath(); g.fill(); g.strokeStyle = INK7; g.lineWidth = PX * 0.8; g.stroke(); g.fillStyle = '#1C1A17'; g.beginPath(); g.ellipse(x, y, 2, 1.6, 0, Math.PI, 0); g.fill(); g.strokeStyle = '#E9E4D8'; g.lineWidth = PX * 0.9; g.beginPath(); g.moveTo(x + 3.5, y + 0.6); g.lineTo(x + 6, y - 0.2); g.stroke(); }
function hutOutline(g, x, y, PX, col) { g.strokeStyle = col; g.lineWidth = PX * 1.1; g.setLineDash([PX * 2, PX * 1.5]); g.beginPath(); g.moveTo(x - 4, y); g.lineTo(x - 4, y - 3); g.lineTo(x, y - 6.5); g.lineTo(x + 4, y - 3); g.lineTo(x + 4, y); g.closePath(); g.stroke(); g.setLineDash([]); }

// ---- the province's look: everything its decoration bake depends on (slow and fast parts)
const effOf = (p) => (p.dom.n ? SCALES[p.dom.n].map(([nm, v]) => [nm, effStep(v, p.dom.s)]) : []);
const unrestStage = (p) => (p.unrest >= 75 ? 3 : p.unrest >= 50 ? 2 : p.unrest >= 25 ? 1 : 0);
const wallStage = (pd) => (pd >= 25 ? 4 : pd >= 15 ? 3 : pd >= 5 ? 2 : pd >= 1 ? 1 : 0);
function paintPart(i) { const p = prov[i]; return (fogOf(i) === 'unexplored' ? 'U' : 'E') + (p.owner ? 'O' : '') + view.detail[0] + view.hand[0] + view.borders[0] + view.farm[0] + view.labels[0] + view.palette[0] + artSig(); }
const artSig = () => Object.keys(view.art).sort().join('');
function lookKey(i) {
  const p = prov[i], f = fogOf(i);
  if (PAINTED()) { // v3 (H10): the paint's key is terrain, explored, owned and Map detail; the stamps keep v2's slow keys without tokens or sight
    if (f === 'unexplored') return paintPart(i) + '|' + (p.owner === null ? p.indep : '');
    return [paintPart(i), houseCount(p), p.pop >= 1.25 * p.startPop ? 'T' : p.pop <= 0.8 * p.startPop ? 'D' : '', p.kitOwner ?? p.owner, p.owner, p.dom.n, p.dom.s, unrestStage(p), p.scar, p.buildings.join(','), p.build ? p.build.q : '', wallStage(p.pd), p.owner === null ? p.indep : '', tierOf(p)].join('|');
  }
  if (f === 'unexplored') return 'U|' + view.detail + view.hand[0] + view.borders[0];
  return [view.hand[0] + view.borders[0], f ?? '', houseCount(p), p.pop >= 1.25 * p.startPop ? 'T' : p.pop <= 0.8 * p.startPop ? 'D' : '', p.kitOwner ?? p.owner, p.owner, p.dom.n, p.dom.s, unrestStage(p), p.scar, p.buildings.join(','), p.build ? p.build.q : '', wallStage(p.pd), tokensAt(i), view.detail].join('|');
}

// ---- ground textures (flat lightness changes within +-8 L*, clipped to the cell)
function ground(g, i, band, R) {
  const p = prov[i], G = geo(i), f = TERRAIN[p.terrain].fill, PX = 1 / BAND_RES[band], k = areaOf[i] / MEAN_AREA, [bx0, by0, bx1, by1] = G.bb;
  const rx = () => bx0 + R() * (bx1 - bx0), ry = () => by0 + R() * (by1 - by0);
  switch (p.terrain) {
    case 'plains': {
      for (let n = 0; n < 120 * k; n++) { g.fillStyle = rgba(shadeL(f, R() < 0.5 ? -8 : 8), 0.55); ellipse(g, rx(), ry(), 1.1, 1.1); g.fill(); }
      for (let h = 0; h < 1 + (R() < 0.5 ? 1 : 0); h++) { const s = G.slots[Math.floor(R() * G.slots.length)]; if (!s) break; const a = R() * Math.PI, L = 40 + R() * 40; g.strokeStyle = 'rgba(94,112,70,.5)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(s.x, s.y); for (let t = 1; t <= 5; t++) g.lineTo(s.x + Math.cos(a) * L * t / 5 + (R() - 0.5) * 3, s.y + Math.sin(a) * L * t / 5 * 0.6 + (R() - 0.5) * 3); g.stroke(); g.fillStyle = 'rgba(94,112,70,.55)'; for (let t = 0; t < 6; t++) { ellipse(g, s.x + Math.cos(a) * L * t / 5, s.y + Math.sin(a) * L * t / 5 * 0.6, 1.8, 1.5); g.fill(); } }
      break;
    }
    case 'farmland': {
      const n = 5 + Math.floor(R() * 5), seeds = []; while (seeds.length < n) { const x = rx(), y = ry(); if (inPoly(G.poly, x, y)) seeds.push([x, y]); }
      const vor = d3.Delaunay.from(seeds).voronoi([bx0 - 2, by0 - 2, bx1 + 2, by1 + 2]);
      const doubled = p.dom.n === 'green' && effStep(3, p.dom.s) >= 2;
      seeds.forEach((sd, j) => {
        const cell = vor.cellPolygon(j); if (!cell) return;
        g.save(); pathPoly(g, cell); g.clip(); g.fillStyle = shadeL(f, (R() - 0.5) * 12); g.fillRect(bx0, by0, bx1 - bx0, by1 - by0);
        const ang = [0, Math.PI / 2, Math.PI / 6, -Math.PI / 6][Math.floor(R() * 4)], sp = doubled ? 3.2 : 6.4, L = (bx1 - bx0) + (by1 - by0);
        g.strokeStyle = 'rgba(160,122,32,.35)'; g.lineWidth = 0.9; g.beginPath();
        for (let o = -L; o < L; o += sp) { const cx = sd[0] + Math.cos(ang + Math.PI / 2) * o, cy = sd[1] + Math.sin(ang + Math.PI / 2) * o; g.moveTo(cx - Math.cos(ang) * L, cy - Math.sin(ang) * L); g.lineTo(cx + Math.cos(ang) * L, cy + Math.sin(ang) * L); }
        g.stroke(); g.restore();
        pathPoly(g, cell); g.strokeStyle = 'rgba(70,90,40,.55)'; g.lineWidth = 1.6; g.stroke();
      });
      break;
    }
    case 'forest': {
      for (let y = by0; y < by1; y += 8) for (let x = bx0 + ((y / 8) % 2) * 5; x < bx1; x += 10) { const r = 4 + R() * 2; g.strokeStyle = R() < 0.55 ? 'rgba(42,58,33,.4)' : 'rgba(75,99,57,.3)'; g.lineWidth = 1.1; g.beginPath(); g.arc(x + (R() - 0.5) * 3, y, r, Math.PI * 1.05, Math.PI * 1.95); g.stroke(); }
      break;
    }
    case 'hills': {
      g.strokeStyle = 'rgba(110,86,28,.5)'; g.lineWidth = 1.1;
      for (const s of G.slots) for (let h = 0; h < 3 + (R() < 0.5 ? 1 : 0); h++) { g.beginPath(); g.arc(s.x, s.y, 7 + h * 2.4, 0.15, 1.1); g.stroke(); }
      break;
    }
    case 'mountains': { for (let n = 0; n < 160 * k; n++) { g.fillStyle = 'rgba(110,127,134,.4)'; ellipse(g, rx(), ry(), 0.9 + R() * 0.8, 0.8); g.fill(); } break; }
    case 'swamp': {
      g.strokeStyle = 'rgba(44,140,148,.6)'; g.lineWidth = 1.2; g.lineCap = 'round';
      for (let y = by0 + 4; y < by1; y += 7) for (let x = bx0 + ((y / 7) % 2) * 9; x < bx1; x += 22) { const L = 6 + R() * 8; g.beginPath(); g.moveTo(x, y); g.lineTo(x + L, y); g.stroke(); }
      g.lineCap = 'butt'; g.fillStyle = 'rgba(44,140,148,.45)'; for (let n = 0; n < 5 * k; n++) { ellipse(g, rx(), ry(), 6 + R() * 8, 2.5 + R() * 2.5); g.fill(); }
      break;
    }
    case 'wasteland': {
      const seeds = []; const n = 20 + Math.floor(R() * 11); while (seeds.length < n) seeds.push([rx(), ry()]);
      const vor = d3.Delaunay.from(seeds).voronoi([bx0, by0, bx1, by1]); g.strokeStyle = 'rgba(143,110,100,.45)'; g.lineWidth = 1; g.beginPath(); vor.render(g); g.stroke();
      break;
    }
  }
}

// ---- one province's decoration bake (v2; v3's painted bake is drawProvinceDecoP)
function drawProvinceDecoV2(g, i, band) {
  const p = prov[i], G = geo(i), fog = fogOf(i), unexp = fog === 'unexplored';
  const PX = 1 / BAND_RES[band], R = rngFor(`map:11:${i}:${band}:paint`);
  const lineCol = ['forest', 'hills', 'swamp'].includes(p.terrain) ? '#E8DCC2' : '#3E3428';
  const P = palette(i, band, unexp ? lineCol : null);
  g.save(); pathPoly(g, G.poly); g.clip();
  if (!unexp) ground(g, i, band, rngFor(`map:11:${i}:ground`));
  const look = unexp ? null : p.dom.n, lvl = p.dom.s >= 7 ? 3 : p.dom.s >= 4 ? 2 : p.dom.s >= 1 ? 1 : 0;
  const shown = band !== 'far' && !unexp;
  if (shown && look === 'red' && lvl) { // L1: ash drifts
    const Rr = rngFor(`map:11:${i}:ash`); g.fillStyle = 'rgba(143,140,136,.25)'; for (let n = 0; n < 50 * lvl; n++) { const s = G.slots[Math.floor(Rr() * Math.min(G.slots.length, 6 + lvl * 6))]; if (s) { ellipse(g, s.x + (Rr() - 0.5) * 26, s.y + (Rr() - 0.5) * 18, 1.2, 1.2); g.fill(); } }
  }
  if (shown && look === 'green' && lvl >= 2) { const Rr = rngFor(`map:11:${i}:meadow`); g.fillStyle = 'rgba(239,231,207,.75)'; for (let n = 0; n < 30 * lvl; n++) { const s = G.slots[Math.floor(Rr() * Math.min(G.slots.length, 8 + lvl * 6))]; if (s) { ellipse(g, s.x + (Rr() - 0.5) * 24, s.y + (Rr() - 0.5) * 16, 0.9, 0.9); g.fill(); } } }
  const st = unexp ? null : settlement(i);
  if (st && st.thrive && band !== 'far') { const Rr = rngFor(`map:11:${i}:garden`); for (let n = 0; n < 6; n++) { const a = Rr() * Math.PI * 2, r = st.rad + 3 + Rr() * 6; g.fillStyle = n % 2 ? 'rgba(110,143,78,.55)' : 'rgba(138,106,58,.45)'; g.fillRect(st.sx + Math.cos(a) * r * 1.1 - 2.5, st.sy + Math.sin(a) * r * 0.7 - 1.5, 5, 3); } }
  if (!unexp && p.scar === 'churned' && band !== 'far') { const Rr = rngFor(`map:11:${i}:scar`); g.fillStyle = 'rgba(94,70,48,.45)'; for (let n = 0; n < 40; n++) { const t = Rr(); ellipse(g, G.c[0] - 60 + t * 120 + (Rr() - 0.5) * 10, G.c[1] - 30 + t * 50 + (Rr() - 0.5) * 10, 2 + Rr() * 3, 1.2 + Rr()); g.fill(); } }
  g.restore();

  // standing stamps, motifs, the settlement: collected, then drawn by bottom edge
  const items = [];
  const ex = exclusions(i, band);
  const spec = TSPEC_V2[p.terrain], k = areaOf[i] / MEAN_AREA, reduced = view.detail === 'reduced';
  const free = G.slots.filter((s) => !boxHit(ex, s.x - 6, s.y - 12, s.x + 6, s.y + 2));
  let motifSlots = [], poleSlots = [];
  if (shown && look && lvl) {
    const pct = [0, 0.08, 0.15, 0.22][lvl]; motifSlots = free.slice(0, Math.max(1, Math.round(free.length * pct)));
    if (!reduced) { const eff = effOf(p); const per = band === 'near' ? 2 : 1; const list = []; for (const [nm, st2] of eff) for (let n = 0; n < Math.min(6, st2 * per); n++) list.push(nm); poleSlots = free.slice(-list.length).map((s, j) => ({ s, pole: list[j] })).filter((x) => list.length && x.s); poleSlots = poleSlots.slice(0, Math.floor(free.length * 0.3)); }
  }
  const taken = new Set([...motifSlots, ...poleSlots.map((x) => x.s)]);
  const count = Math.round(spec[BIX[band]] * k * (reduced ? 0.5 : 1));
  const stampSlots = free.filter((s) => !taken.has(s)).sort((a, b) => a.rank - b.rank).slice(0, count);
  const forestNear = p.terrain === 'forest';
  const blossom = shown && look === 'green', charredOK = shown && look === 'red' && lvl >= 3;
  for (const s of stampSlots) items.push({ y: s.y, f: () => stampFor(g, p, s, band, P, { blossom: blossom && s.v < 0.35, charred: charredOK && forestNear && s.d < (G.slots.at(-1)?.d ?? 1) * 0.5 && s.v < 0.33, great: shown && look === 'green' && lvl >= 3 && s.v > 0.85, fruit: false }) });
  const scaled = (s, k, fn) => { g.save(); g.translate(s.x, s.y); g.scale(k, k); try { fn({ ...s, x: 0, y: 0 }, PX / k); } finally { g.restore(); } };
  motifSlots.forEach((s, j) => items.push({ y: s.y, f: () => scaled(s, MS, (q, px2) => motifFor(g, look, lvl, q, j, px2, R)) }));
  poleSlots.forEach(({ s, pole }, j) => items.push({ y: s.y, f: () => scaled(s, MS, (q, px2) => poleFor(g, pole, q, j, px2, { ...P, lw: px2, PX: px2 })) }));
  if (shown && look && lvl === 3 && free.length) { const s = free[Math.min(free.length - 1, motifSlots.length)]; items.push({ y: s.y, f: () => scaled(s, MS, (q, px2) => (look === 'red' ? burningCairn(g, q.x, q.y, px2) : tree(g, q.x, q.y, 9, { ...P, lw: px2 }, { blossom: true, shade: '#2F4A26', lit: '#5E7F45' }))) }); }
  if (shown && look === 'red' && lvl >= 3) { const Rr = rngFor(`map:11:${i}:cracks`); for (let n = 0; n < 3; n++) { const s = free[Math.floor(Rr() * free.length)]; if (s) items.push({ y: s.y - 1, f: () => emberCrack(g, s.x, s.y, 9, Rr, PX) }); } }
  if (!unexp && p.scar === 'cairns' && band !== 'far') { const s0 = free[Math.floor(free.length / 2)] ?? G.slots[0]; for (let n = 0; n < 3; n++) items.push({ y: s0.y + n, f: () => cairn(g, s0.x - 12 + n * 11, s0.y + n * 2, 1.4, PX, false) }); }
  if (!unexp && p.scar === 'churned' && band !== 'far') { const s0 = free[Math.floor(free.length / 2)] ?? G.slots[0]; items.push({ y: s0.y, f: () => { g.strokeStyle = '#5E4630'; g.lineWidth = PX * 1.2; for (const [dx, a] of [[-6, 0.6], [4, -0.8], [9, 0.3]]) { g.beginPath(); g.moveTo(s0.x + dx, s0.y); g.lineTo(s0.x + dx + Math.cos(a) * 7, s0.y - Math.abs(Math.sin(a)) * 7); g.stroke(); } g.fillStyle = '#1C1A17'; for (const [dx, dy] of [[-2, -10], [6, -13], [12, -8]]) { g.beginPath(); g.moveTo(s0.x + dx - 1.6, s0.y + dy); g.lineTo(s0.x + dx, s0.y + dy - 0.8); g.lineTo(s0.x + dx + 1.6, s0.y + dy); g.lineTo(s0.x + dx, s0.y + dy + 0.4); g.closePath(); g.fill(); } } }); }
  if (p.terrain === 'mountains' && !unexp) items.push({ y: -1e9, f: () => footpath(g, i, PX) });
  if (st) settlementItems(g, i, st, band, items, PX, look, lvl);
  if (unexp) items.push({ y: G.seat[1], f: () => hutOutline(g, G.seat[0], G.seat[1], PX, lineCol) });
  items.sort((a, b) => a.y - b.y).forEach((it) => it.f());
}
function footpath(g, i, PX) {
  const G = geo(i), poly = G.poly, edges = [];
  for (let k = 0; k < poly.length - 1; k++) edges.push([poly[k], poly[k + 1], Math.hypot(poly[k + 1][0] - poly[k][0], poly[k + 1][1] - poly[k][1])]);
  edges.sort((a, b) => b[2] - a[2]); const m = (e) => [(e[0][0] + e[1][0]) / 2, (e[0][1] + e[1][1]) / 2]; const a = m(edges[0]), b = m(edges[1]);
  const ins = (q) => [q[0] + (G.c[0] - q[0]) * 0.12, q[1] + (G.c[1] - q[1]) * 0.12];
  g.strokeStyle = 'rgba(43,38,32,.75)'; g.lineWidth = 1.5 * PX * 1.3; g.setLineDash([4 * PX * 1.6, 3 * PX * 1.6]); g.beginPath(); const A0 = ins(a), B0 = ins(b); g.moveTo(...A0); g.quadraticCurveTo(G.seat[0], G.seat[1] + 6, ...B0); g.stroke(); g.setLineDash([]);
}
function stampFor(g, p, s0, band, P0, o) {
  const R = rngFor(`stamp:${p.i}:${s0.x | 0}:${s0.y | 0}`), far = band === 'far', sc = far ? 1.8 : 1;
  g.save(); g.translate(s0.x, s0.y); g.scale(SS, SS);
  const P = { ...P0, lw: P0.lw / SS, PX: P0.PX / SS }, s = { ...s0, x: 0, y: 0 };
  try { stampShape(g, p, s, far, sc, R, P, o); } finally { g.restore(); }
}
function stampShape(g, p, s, far, sc, R, P, o) {
  switch (p.terrain) {
    case 'plains': if (far) { for (let n = 0; n < 4; n++) tuft(g, s.x + (n - 1.5) * 4, s.y + (n % 2) * 2, 5, P); return; }
      if (s.v < 0.18) return tree(g, s.x, s.y, 4.2, P, { blossom: o.blossom }); if (s.v > 0.94) return haystack(g, s.x, s.y, 3.4, P);
      if (P.painted && !P.line) { const u = U / SS, n = 3 + Math.floor(R() * 4); for (let k = 0; k < n; k++) tuftLean(g, s.x + (R() - 0.5) * 4 * u, s.y + (R() - 0.5) * 1.6 * u, (2.5 + 2.5 * R()) * u, (R() - 0.5) * 2 * (15 * Math.PI / 180), P); return; } // v3 critique 10: tufts in clusters of 3 to 6
      return tuft(g, s.x, s.y, 4, P);
    case 'farmland': if (far) { g.fillStyle = P.line ? 'rgba(0,0,0,0)' : rgba(P.shade, 0.5); g.fillRect(s.x - 9, s.y - 6, 18, 12); g.strokeStyle = P.line ?? P.ink; g.lineWidth = P.lw; g.strokeRect(s.x - 9, s.y - 6, 18, 12); return; }
      if (s.v > 0.9 && s.rank < 0.5) return windmill(g, s.x, s.y, P); return haystack(g, s.x, s.y, 3.2, P);
    case 'forest': if (o.charred) return charred(g, s.x, s.y, 3.4, P.PX);
      if (far) { for (let n = 0; n < 5; n++) tree(g, s.x + Math.cos(n * 1.3) * 7, s.y + Math.sin(n * 1.3) * 4, 6, P); return; }
      return tree(g, s.x, s.y, (o.great ? 2 : 1) * (3.8 + R() * 1.4), P, { blossom: o.blossom, shade: s.v < 0.5 ? P.shade : shadeL(P.fill, -10), lit: s.v < 0.5 ? P.lit : shadeL(P.fill, 6) });
    case 'hills': return hump(g, s.x, s.y, (12 + R() * 6) * sc, P);
    case 'mountains': return peakStamp(g, s.x, s.y, (9 + R() * 4) * sc, P, { lit: '#B4C1C6', shade: '#6E7F86', ink: INK, lw: P.lw });
    case 'swamp': if (far) { for (let n = 0; n < 3; n++) reeds(g, s.x + (n - 1) * 4, s.y, 7, P); return; } if (s.v > 0.8) return snag(g, s.x, s.y, 7, P);
      if (P.painted && !P.line) { // v3 critique 10: a reed bed of 5 to 9 around a short pool dash (fog line art keeps the single clump)
        const u = U / SS, n = 5 + Math.floor(R() * 5), pw = (2 + R()) * u; if (!P.line) { g.fillStyle = 'rgba(159,208,212,.85)'; ellipse(g, s.x, s.y - 0.3 * u, pw, 0.55 * u); g.fill(); g.strokeStyle = 'rgba(53,83,90,.6)'; g.lineWidth = P.lw * 0.8; g.beginPath(); g.moveTo(s.x - pw * 0.8, s.y + 0.2 * u); g.lineTo(s.x + pw * 0.8, s.y + 0.2 * u); g.stroke(); }
        const at = []; for (let k = 0; k < n; k++) { const a = Math.PI * (0.9 + 1.2 * (k / Math.max(1, n - 1))) + (R() - 0.5) * 0.3; at.push([s.x + Math.cos(a) * (pw + 0.6 * u), s.y - 0.3 * u + Math.sin(a) * 1.4 * u, (3.4 + 2.6 * R()) * u]); }
        at.sort((a, b) => a[1] - b[1]).forEach(([x, y, h]) => reeds(g, x, y, h, P)); return; }
      if (P.painted) { for (let n = 0; n < 3; n++) reeds(g, s.x + (n - 1) * 3.4, s.y + (n % 2) * 0.8, 4.6 - (n % 2), P); return; } // fog line art: a low row of three clumps
      return reeds(g, s.x, s.y, 5.5, P);
    case 'wasteland': if (far) { rock(g, s.x - 3, s.y, 4, P); rock(g, s.x + 4, s.y + 1, 3, P); return; } if (s.v > 0.95) return o.noSkull ? rock(g, s.x, s.y, 2.6, P, null, P.painted ? { R, k: SS / U } : null) : skull(g, s.x, s.y, P);
      if (P.painted) { // v3 critique 10: dry scrub in twos and threes; outcrops of 3 to 5 rocks of falling size side by side on one ground line (never stacked)
        const hand = { R, k: SS / U };
        if (s.v > 0.65) { const n = 2 + Math.floor(R() * 2); for (let k = 0; k < n; k++) shrub(g, s.x + (k - (n - 1) / 2) * 2.6 + (R() - 0.5), s.y + (R() - 0.5) * 0.8, 3 + R() * 1.4, P); return; }
        const n = 3 + Math.floor(R() * 3), dir = R() < 0.5 ? -1 : 1, rs = []; let r = 2.4 + R() * 1.2, x = s.x - dir * r;
        for (let k = 0; k < n; k++) { rs.push([x, s.y + (R() - 0.5) * 0.3, r]); const r2 = r * (0.68 + 0.14 * R()); x += dir * (r + r2) * 0.88; r = r2; }
        for (const [rx, ry, rr] of [...rs].reverse()) rock(g, rx, ry, rr, P, null, hand);
        if (R() < 0.5) shrub(g, x + dir * 1.2, s.y, 2.6 + R(), P); return; }
      if (s.v > 0.65) return shrub(g, s.x, s.y, 4, P); return rock(g, s.x, s.y, 2.6 + R() * 1.2, P);
  }
}
function motifFor(g, look, lvl, s, j, PX, R) {
  const kinds = look === 'red' ? ['cairn', ...(lvl >= 2 ? ['scorch', 'shard', 'brazier'] : [])] : ['blossom', 'ivy', ...(lvl >= 2 ? ['sapling', 'moss', 'blossom'] : []), ...(lvl >= 3 ? ['bramble'] : [])];
  const kd = kinds[j % kinds.length];
  if (kd === 'cairn') return cairn(g, s.x, s.y, 1, PX, true); if (kd === 'scorch') return scorch(g, s.x, s.y, 5, R); if (kd === 'shard') return shard(g, s.x, s.y, PX); if (kd === 'brazier') return brazier(g, s.x, s.y, PX);
  if (kd === 'blossom') return blossomBush(g, s.x, s.y, PX, R);
  if (kd === 'ivy') return ivyStone(g, s.x, s.y, PX); if (kd === 'sapling') return sapling(g, s.x, s.y, PX); if (kd === 'moss') return mossStone(g, s.x, s.y, PX); return bramble(g, s.x, s.y, PX);
}
function poleFor(g, pole, s, j, PX, P) {
  switch (pole) {
    case 'Fury': return j % 2 ? tornBanner(g, s.x, s.y, PX) : warCairn(g, s.x, s.y, PX);
    case 'Turmoil': return [brokenFence, toppledCart, smokeWisp][j % 3](g, s.x, s.y, PX);
    case 'Growth': return j % 2 ? cropClump(g, s.x, s.y, PX) : tree(g, s.x, s.y, 4, P, { fruit: true, shade: '#3F5E2E', lit: '#6E8F4E' });
    case 'Wild': return [briar, fern, beastDen][j % 3](g, s.x, s.y, PX);
  }
}
function settlementItems(g, i, st, band, items, PX, look, lvl) {
  const p = prov[i], kit = st.kit, out = fogOf(i) === 'outofsight';
  if (band === 'far') { // a keep glyph at capitals and one roof cluster from tier 3
    if (p.cap) items.push({ y: st.sy, f: () => landmark(g, 'keep', kit, st.sx, st.sy, PX) });
    else if (st.tier >= 2) items.push({ y: st.sy, f: () => { for (const h of st.houses.slice(0, 3)) house(g, h, kit, PX, {}); } });
    return;
  }
  const shut = unrestStage(p) >= 1, vines = look === 'green' && lvl >= 3;
  const ord = (y) => y;
  items.push({ y: st.sy - st.rad, f: () => walls(g, st, p.pd, PX, 'back') });
  for (const h of st.houses) items.push({ y: ord(h.y), house: h, f: () => house(g, h, kit, PX, { shut, vines: vines && h.k % 3 === 0 }) });
  items.push({ y: st.sy + st.rad * 0.62 + 0.5, f: () => walls(g, st, p.pd, PX, 'front') });
  if (p.pd >= 1 && p.pd < 5) { const x = st.sx + st.rad + 3, y = st.sy + 2; items.push({ y, f: () => { g.save(); g.translate(x, y); g.scale(LS, LS); g.translate(-x, -y); g.fillStyle = kit === 'green' ? '#6B4A2B' : '#8C6A47'; g.fillRect(x - 1.6, y - 9, 3.2, 9); g.strokeStyle = INK; g.lineWidth = PX * 0.8; g.strokeRect(x - 1.6, y - 9, 3.2, 9); g.fillStyle = '#5E4630'; g.fillRect(x - 2.6, y - 11, 5.2, 2.4); g.strokeRect(x - 2.6, y - 11, 5.2, 2.4); g.restore(); } }); }
  let top = { x: st.houses[0].x, y: st.houses[0].y - 4.6 * HSC };
  const keepAt = [st.sx + 1, st.sy - st.rad * 0.62 - 3];
  if (p.buildings.includes('fort')) items.push({ y: keepAt[1], f: () => { const t = landmark(g, 'keep', kit, ...keepAt, PX); top = { x: keepAt[0], y: t }; } });
  const faith = !(p.dom.n && p.dom.n !== p.owner);
  if (p.build) { const at = [st.sx + st.rad + 7 * LS, st.sy - 1]; items.push({ y: at[1], f: () => landmark(g, 'temple', kit, ...at, PX, { q: p.build.q }) }); }
  else if (p.buildings.includes('temple')) { const at = [st.sx + st.rad + 7 * LS, st.sy - 1]; items.push({ y: at[1], f: () => landmark(g, 'temple', kit, ...at, PX, { lit: faith }) }); }
  if (p.buildings.includes('lab')) { const at = [st.sx - st.rad - 7 * LS, st.sy - 1]; items.push({ y: at[1], f: () => landmark(g, 'lab', kit, ...at, PX) }); }
  if (band === 'near' && st.tier >= 1) { // yard details: a well and a cart
    const wx = st.sx - st.rad * 0.55, wy = st.sy + st.rad * 0.45; items.push({ y: wy, f: () => { g.fillStyle = '#9A958C'; ellipse(g, wx, wy, 1.8, 1.1); g.fill(); g.strokeStyle = INK; g.lineWidth = PX * 0.7; g.stroke(); g.fillStyle = '#24222A'; ellipse(g, wx, wy, 0.9, 0.5); g.fill(); } });
    const cx = st.sx + st.rad * 0.5, cy = st.sy + st.rad * 0.55; items.push({ y: cy, f: () => { g.fillStyle = '#8C6A47'; g.fillRect(cx - 2.4, cy - 2, 4.8, 1.8); g.strokeStyle = INK; g.lineWidth = PX * 0.7; g.strokeRect(cx - 2.4, cy - 2, 4.8, 1.8); ellipse(g, cx - 1.6, cy, 0.9, 0.9); g.stroke(); ellipse(g, cx + 1.6, cy, 0.9, 0.9); g.stroke(); } });
  }
  if (unrestStage(p) >= 2) { const bx = st.sx - st.rad * 0.3, by = st.sy + st.rad * 0.62 + 4; items.push({ y: by, f: () => { g.strokeStyle = '#6B4A2B'; g.lineWidth = PX * 1.3; for (let n = 0; n < 3; n++) { g.beginPath(); g.moveTo(bx + n * 4 - 2, by); g.lineTo(bx + n * 4 + 2, by - 4); g.moveTo(bx + n * 4 + 2, by); g.lineTo(bx + n * 4 - 2, by - 4); g.stroke(); } smokeWisp(g, st.sx + 3, st.sy - 6, PX, 16); if (unrestStage(p) >= 3) smokeWisp(g, st.sx - 6, st.sy - 4, PX, 13); } }); }
  const seen = !out || PAINTED(); // v3 (H10): sight is not in the bake's key; the pennant shows the last known owner
  items.push({ y: 1e9, f: () => { if (p.owner && seen) pennant(g, top.x, top.y, BAN[p.owner], PX); else if (p.owner === null && seen) pennant(g, top.x, top.y, '#8C8A80', PX); } });
}

// ---- wilds: one bake per range per band (ground, massif or mere marks); contour, ticks and names are drawn live
const WGEO = new Map();
function wgeo(w) {
  let G = WGEO.get(w.id); if (G) return G;
  const edges = wildEdges(w); // v3: the range's outline as the shared wobbling polylines
  let bb = [Infinity, Infinity, -Infinity, -Infinity]; for (const c of w.cells) { const b = bboxOf(npoly[c]); bb = [Math.min(bb[0], b[0]), Math.min(bb[1], b[1]), Math.max(bb[2], b[2]), Math.max(bb[3], b[3])]; }
  const ticks = {};
  for (const band of ['far', 'mid', 'near']) { // ticks by arc length along the polylines, on the inner side
    const s = DESIGN[band], sp = (band === 'far' ? 3.5 : 5) / s, R = rngFor(`wild:${w.id}:ticks:${band}`), out = [];
    for (const e of edges) {
      const P = e.pts, Lc = cumLen(P), L = Lc[Lc.length - 1];
      for (let t = sp / 2; t < L; t += sp) {
        const j = (R() - 0.5) * 2 / s, len = (4 + R() * 3) / s, d = Math.max(0, Math.min(L, t + j)), q = arcAt(P, Lc, d), a = arcAt(P, Lc, d - 1), b = arcAt(P, Lc, d + 1), l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
        let nx = -(b[1] - a[1]) / l, ny = (b[0] - a[0]) / l; if (!inPoly(npoly[e.c], q[0] + nx * 2, q[1] + ny * 2)) { nx = -nx; ny = -ny; }
        out.push([q[0] + nx * 1.5 / s, q[1] + ny * 1.5 / s, q[0] + nx * (1.5 / s + len), q[1] + ny * (1.5 / s + len)]);
      }
    }
    ticks[band] = out;
  }
  const nameFs = Math.max(11, Math.min(16, 11 + (w.cells.reduce((a, c) => a + areaOf[c], 0) / MEAN_AREA) * 1.8));
  const zs = 0.42, byAt = new Map(); for (const c of Object.values(cmd)) if (!c.hidden) byAt.set(c.at, [...(byAt.get(c.at) ?? []), c]);
  const tokenZones = [...byAt].map(([at, l]) => { const hw = Math.max(15 * l.length + 3, l.some((c) => c.eta) ? 42 : 0) / zs; return [cent[at][0] - hw, cent[at][1] - 92 / zs, cent[at][0] + hw, cent[at][1] - 14 / zs]; });
  const lw0 = (textW(w.name, `italic 400 16px 'Alegreya Sans'`) * 1.1 + 8) / zs / 2, lh0 = 13 / zs;
  const labelAt = [...w.cells].sort((a, b) => areaOf[b] - areaOf[a]).find((c) => !boxHit(tokenZones, cent[c][0] - lw0, cent[c][1] - lh0, cent[c][0] + lw0, cent[c][1] + lh0)) ?? w.big;
  const vertical = w.cells.length > 1 && (bb[3] - bb[1]) > (bb[2] - bb[0]) * 1.2;
  const tot = w.cells.reduce((a2, c) => a2 + areaOf[c], 0), mid = [w.cells.reduce((a2, c) => a2 + cent[c][0] * areaOf[c], 0) / tot, w.cells.reduce((a2, c) => a2 + cent[c][1] * areaOf[c], 0) / tot];
  const labelPt = vertical ? mid : cent[labelAt];
  G = { edges, bb, ticks, nameFs, labelAt, vertical, labelPt, curved: {}, nameBoxes: {} };
  WGEO.set(w.id, G);
  // v3 (4.3): the name is laid out first, per band at the band's widest scale; curved from 13 px, else straight; peaks keep out of it plus 2 px
  const LS2 = { far: 0.3, mid: 0.42, near: 1.02 };
  for (const band of ['far', 'mid', 'near']) {
    const ls = LS2[band], gl = PAINTED() ? wildLayout(w, band, ls, 0, 0) : null;
    G.curved[band] = !!gl;
    if (gl) G.nameBoxes[band] = glyphBoxes(gl, 2).map((b) => b.map((v) => v / ls));
    else { const f = inkLabels() ? wildFont(wildFs(w, band)) : `italic 400 ${nameFs}px 'Alegreya Sans'`, fsz = inkLabels() ? wildFs(w, band) : nameFs, tl = (textW(w.name, f) * 1.12 + 8) / ls, th = (fsz + 8) / ls, [lx, ly] = labelPt;
      const lw = vertical ? th : Math.min(tl, (bboxOf(cells[labelAt])[2] - bboxOf(cells[labelAt])[0]) * 0.9), lh = vertical ? Math.min(tl, (bb[3] - bb[1]) * 0.9) : th;
      G.nameBoxes[band] = [[lx - lw / 2, ly - lh / 2, lx + lw / 2, ly + lh / 2]]; }
  }
  return G;
}
const inWild = (w, x, y) => w.cells.some((c) => inPoly(npoly[c], x, y));
function bakeWildInto(g, w, band) {
  const G = wgeo(w), PX = 1 / BAND_RES[band], s = DESIGN[band], painted = PAINTED();
  g.save(); g.beginPath(); for (const c of w.cells) { const poly = npoly[c]; poly.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); } g.clip();
  const peaks = w.kind === 'peaks';
  g.fillStyle = peaks ? '#2A292C' : '#24222A'; g.fillRect(G.bb[0], G.bb[1], G.bb[2] - G.bb[0], G.bb[3] - G.bb[1]);
  const ls = { far: 0.3, mid: 0.42, near: 1.02 }[band], [lx, ly] = G.labelPt, tl = (textW(w.name, `italic 400 ${G.nameFs}px 'Alegreya Sans'`) * 1.1 + 8) / ls, th = (G.nameFs + 8) / ls;
  const lw = G.vertical ? th : Math.min(tl, (bboxOf(cells[G.labelAt])[2] - bboxOf(cells[G.labelAt])[0]) * 0.9), lh = G.vertical ? Math.min(tl, (G.bb[3] - G.bb[1]) * 0.9) : th;
  const lbox = painted ? G.nameBoxes[band] : band === 'far' ? [] : [[lx - lw / 2, ly - lh / 2, lx + lw / 2, ly + lh / 2]]; // v2: at Far the massif kept all its peaks
  if (!peaks) {
    g.strokeStyle = '#2E3138'; g.lineWidth = 10 / s; g.lineJoin = 'round'; for (const e of G.edges) { g.beginPath(); e.pts.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); }
    const R = rngFor('wild:' + w.id + ':ripples'), area = w.cells.reduce((a, c) => a + areaOf[c], 0), n = Math.round(Math.max(8, Math.min(14, (8 * area) / MEAN_AREA))) * (band === 'far' ? 0.4 : 1);
    g.strokeStyle = '#8FC3D3'; g.lineWidth = 1.5 / s; let placed = 0;
    for (let t = 0; t < 400 && placed < n; t++) {
      const x = G.bb[0] + R() * (G.bb[2] - G.bb[0]), y = G.bb[1] + R() * (G.bb[3] - G.bb[1]), wv = (14 + R() * 6) / s;
      if (!inWild(w, x - wv / 2, y) || !inWild(w, x + wv / 2, y) || (painted ? boxHit(lbox, x - wv / 2, y - 4 / s, x + wv / 2, y + 2 / s) : Math.abs(y - ly) < (G.nameFs * 1.4) / s) || w.cells.some((c) => distToEdge(cells[c], x, y) < 14 / s + (painted ? 6 : 0) && inPoly(cells[c], x, y))) continue;
      g.beginPath(); g.moveTo(x - wv / 2, y); g.quadraticCurveTo(x - wv / 4, y - 3 / s, x, y); g.quadraticCurveTo(x + wv / 4, y - 3 / s, x + wv / 2, y); g.stroke(); placed++;
    }
    if (band !== 'far') {
      const Rr = rngFor('wild:' + w.id + ':shore'); let reedsN = 5 + Math.floor(Rr() * 4), snags = 2 + Math.floor(Rr() * 2);
      for (const e of G.edges) { if (reedsN <= 0 && snags <= 0) break; if (Rr() < 0.45) continue; const t = 0.3 + Rr() * 0.4, Lc = cumLen(e.pts), q = arcAt(e.pts, Lc, t * Lc[Lc.length - 1]); let x = q[0], y = q[1]; x += (cent[e.c][0] - x) * 0.09; y += (cent[e.c][1] - y) * 0.09;
        if (reedsN > 0) { reeds(g, x, y, 7, { lit: '#8E9A6E', shade: '#5E6A48', ink: INK7, lw: PX }); reedsN--; } else if (snags > 0) { snag(g, x, y, 9, { lw: PX }, '#CFC6B4'); if (band === 'near') { g.globalAlpha = 0.25; g.save(); g.translate(x, y); g.scale(1, -0.6); snag(g, 0, 0, 9, { lw: PX }, '#CFC6B4'); g.restore(); g.globalAlpha = 1; } snags--; } }
    }
  }
  g.restore();
  if (peaks) { // the massif: drawn after the clip so tips may rise a little over the outline
    const R = rngFor('wild:' + w.id), list = [];
    for (const c of w.cells) {
      const poly = cells[c], bb = bboxOf(poly), inr = distToEdge(poly, ...cent[c]), base = 0.55 * inr;
      const n = band === 'far' ? 3 + Math.floor(R() * 3) : Math.round(Math.max(8, Math.min(14, (11 * areaOf[c]) / MEAN_AREA)));
      const pts2 = []; const rad = Math.sqrt(areaOf[c] / (n * 1.6));
      for (let t = 0; t < 600 && pts2.length < n; t++) {
        const x = bb[0] + R() * (bb[2] - bb[0]), y = bb[1] + R() * (bb[3] - bb[1]);
        if (!inPoly(poly, x, y) || distToEdge(poly, x, y) < base * 0.42 + (painted ? 4 : 0)) continue;
        if (pts2.some((q) => Math.hypot(q[0] - x, (q[1] - y) * 1.6) < rad)) continue;
        if (boxHit(lbox, x - base * 0.6, y - base, x + base * 0.6, y + 2)) continue;
        pts2.push([x, y]);
      }
      if (painted) { // v3 critique 9: one or two ridges per cell: a tall center (2.0 x base where the name allows) with flankers chained to it
        // along a seeded ridge axis (each 0.45 to 0.6 of the previous peak's height further out, overlapping), drawn back to front
        const nC = Math.min(pts2.length, areaOf[c] > 0.9 * MEAN_AREA ? 2 : 1), per = Math.max(0, Math.round((pts2.length - nC) / Math.max(1, nC))), fk = band === 'far' ? 1.25 : 1;
        const fit = (x, y, h) => { while (h > base * 0.4 && !inWild(w, x, y - h * 0.9)) h *= 0.85; while (h > base * 0.4 && boxHit(lbox, x - h * 0.45, y - h, x + h * 0.45, y)) h *= 0.85; return boxHit(lbox, x - h * 0.45, y - h, x + h * 0.45, y) ? 0 : h; };
        const cand = [...pts2].sort((a, b) => distToEdge(poly, b[0], b[1]) - distToEdge(poly, a[0], a[1])); // the most interior points carry the ridges
        for (let ci = 0; ci < nC; ci++) {
          const [cx, cy] = cand[ci], th = (R() - 0.5) * 2 * ((25 * Math.PI) / 180), ax = [Math.cos(th), Math.sin(th)], hC = fit(cx, cy, base * 2.0 * fk); if (!hC) continue;
          list.push({ x: cx, y: cy, h: hC, big: true });
          for (const sd of [-1, 1]) {
            let d = 0, hp = hC; const m = sd < 0 ? Math.floor(per / 2) : per - Math.floor(per / 2);
            for (let k = 0; k < m; k++) {
              d += (0.45 + 0.15 * R()) * hp; const hk0 = base * Math.max(0.6, 1.2 - 0.16 * k + (R() - 0.5) * 0.2) * fk, j = (R() - 0.5) * 0.12 * hk0;
              const x = cx + sd * ax[0] * d - ax[1] * j, y = cy + sd * ax[1] * d + ax[0] * j;
              if (!inPoly(poly, x, y) || distToEdge(poly, x, y) < base * 0.42 + 4) break;
              const hk = fit(x, y, hk0); if (!hk) break; list.push({ x, y, h: hk, big: false }); hp = hk;
            }
          }
        }
        continue;
      }
      const centers = Math.min(pts2.length, 2 + (R() < 0.5 ? 1 : 0));
      pts2.forEach(([x, y], k) => {
        let h = base * (k < centers ? 1.7 : 0.75 + R() * 0.45) * (band === 'far' ? 1.25 : 1);
        while (h > base * 0.4 && !inWild(w, x, y - h * 0.9)) h *= 0.85;
        if (painted) { while (h > base * 0.4 && boxHit(lbox, x - h * 0.45, y - h, x + h * 0.45, y)) h *= 0.85; if (boxHit(lbox, x - h * 0.45, y - h, x + h * 0.45, y)) return; }
        else if (lbox.length && boxHit(lbox, x - h * 0.6, y - h, x + h * 0.6, y)) h = Math.min(h, Math.max(base * 0.4, y - lbox[0][3] - 2));
        list.push({ x, y, h, big: k < centers });
      });
    }
    list.sort((a, b) => (a.big !== b.big ? (a.big ? -1 : 1) : a.y - b.y));
    const cols = { lit: '#8A857E', shade: '#46423F', snow: '#F2EEE6', snowShade: '#CFCAC1', ink: INK, lw: 1.3 / s };
    if (painted) list.sort((a, b) => a.y - b.y || a.h - b.h); // v3 critique 9: back to front by the peak's foot
    for (const q of list) {
      if (painted) { // ticks at a wild peak's foot are the wild's own vocabulary
        if (band === 'near') { g.strokeStyle = 'rgba(110,106,100,.55)'; g.lineWidth = PX; for (let n = 0; n < 5; n++) { g.beginPath(); g.moveTo(q.x - q.h * 0.25 + n * q.h * 0.12, q.y); g.lineTo(q.x - q.h * 0.34 + n * q.h * 0.17, q.y + q.h * 0.12); g.stroke(); } }
        peakPaint(g, peakGeom(q.x, q.y, q.h, q.h / 1.1, rngFor(`wpeak:${w.id}:${q.x | 0}:${q.y | 0}`), true), cols, { lw: 1.3 / s }, null); continue; } // v3 critique 9: h / 1.1 wide (§2.3's limit)
      if (band === 'near') { g.strokeStyle = 'rgba(110,106,100,.55)'; g.lineWidth = PX; for (let n = 0; n < 5; n++) { g.beginPath(); g.moveTo(q.x - q.h * 0.3 + n * q.h * 0.15, q.y); g.lineTo(q.x - q.h * 0.42 + n * q.h * 0.21, q.y + q.h * 0.14); g.stroke(); } }
      peakStamp(g, q.x, q.y, q.h, { lw: 1.3 / s }, cols);
    }
  }
}

// ---- the sprite cache: decoration per province per band, wilds per range per band; budgeted, with cross-fades
const SPR = new Map(), WSPR = new Map(), KEYS = new Array(N).fill(''), ANIM = new Map();
const dprC = () => Math.min(2, dpr);
function spriteRes(band) { return Math.min(3.2, BAND_RES[band] * dprC()); }
let BAKECOUNT = 0;
function bakeProv(i, band) { BAKECOUNT++;
  const G = geo(i), pad = [12, 30, 12, 8], bb = [G.bb[0] - pad[0], G.bb[1] - pad[1], G.bb[2] + pad[2], G.bb[3] + pad[3]];
  return bakeWorld(bb, spriteRes(band), (g) => drawProvinceDeco(g, i, band), band !== 'near');
}
function bakeWild(w, band) { const G = wgeo(w), bb = [G.bb[0] - 4, G.bb[1] - 30, G.bb[2] + 4, G.bb[3] + 4]; return bakeWorld(bb, spriteRes(band), (g) => bakeWildInto(g, w, band)); }
let KEYVER = 0;
function refreshKeys() { for (const i of provList) KEYS[i] = lookKey(i); KEYVER++; }
const STL = new Map();
function settlementC(i) { const k = KEYS[i] + '|' + prov[i].pop; let v = STL.get(i); if (!v || v.k !== k) { v = { k, st: settlement(i) }; STL.set(i, v); } return v.st; }
const COMP = {};
function animatingSprites(now) { for (const i of ANIM.keys()) { const sp = SPR.get(bandOf(cam.s) + ':' + i); if (!sp || sp.key !== KEYS[i] || (sp.prev && now - sp.t0 < 600)) return true; } return false; }
function decoComposite(band, now) { // the whole sheet in one canvas for Far and Mid: a pan blits it once
  const sig = KEYVER + ':' + band + ':' + dpr + ':' + SPR.size;
  const c = COMP[band]; if (c && c.sig === sig && c.ok) return c;
  if (!bakeMissing(provsByY.map((p) => p.i), band, now)) return null;
  const out = bakeWorld([-20, -40, W + 20, H + 20], spriteRes(band), (g) => { for (const p of provsByY) blitW(g, SPR.get(band + ':' + p.i)); });
  out.sig = KEYVER + ':' + band + ':' + dpr + ':' + SPR.size; out.ok = true; COMP[band] = out; return out;
}
let bakeBudgetEnd = 0, bakesPending = false;
const BAKES = [];
function provSprite(i, band, now, force) { // force: bake now whatever the budget (the caller guarantees progress)
  const k = band + ':' + i, sp = SPR.get(k);
  if (sp && sp.key === KEYS[i]) return sp;
  if (!force && performance.now() > bakeBudgetEnd) { bakesPending = true; return sp ?? SPR.get('mid:' + i) ?? SPR.get('far:' + i) ?? SPR.get('near:' + i) ?? null; }
  const nb = bakeProv(i, band); nb.key = KEYS[i];
  const an = ANIM.get(i);
  if (sp && an && !view.reduced) { nb.prev = sp; nb.t0 = now; nb.from = an.from; }
  SPR.set(k, nb); return nb;
}
function bakeMissing(list, band, now) { // at least one bake per pass, then as many as the budget allows
  let n = 0;
  for (const i of list) { const sp = SPR.get(band + ':' + i); if (sp && sp.key === KEYS[i]) continue; if (n > 0 && performance.now() > bakeBudgetEnd) { bakesPending = true; return false; } provSprite(i, band, now, true); n++; }
  return true;
}
function wildSprite(w, band) { const k = band + ':' + w.id; let sp = WSPR.get(k); if (!sp) { sp = bakeWild(w, band); WSPR.set(k, sp); } return sp; }
function invalidateBakes() { SPR.clear(); WSPR.clear(); for (const k in COMP) delete COMP[k]; ZCACHE.clear(); }

// ------------------------------------------------------------------ v3 painters: one light from the upper left (warm lit faces, cool shade faces,
// cool cast shadows to the lower right), painted tree clumps, hachured hills, ridge peaks, sheaves, landmarks, heroes, camps, stones, vignettes.
// Sizes are in u (U world units, U = MED_DIAM / 180, the same in every band); ink widths in band px (PX).
const U = MED_DIAM / 180, B_U = 6.4 * U;
const FEATURE_INK = '#3E3428', PAPER_INK = '#E8DCC2', STAMP_INK = 'rgba(62,52,40,.8)';
const DARK_T = new Set(['forest', 'hills', 'swamp']);
const FACEMEMO = new Map();
function faces(f) { // stamps: lit = fill + 12 L* toward warm light, shade = fill - 18 L* toward the cool shadow
  let v = FACEMEMO.get('s' + f); if (!v) { v = { lit: mix(shadeL(f, 12), '#F6D9A0', 0.12), shade: mix(shadeL(f, -18), '#3A4466', 0.14) }; FACEMEMO.set('s' + f, v); } return v;
}
function kitFaces(tone) { // settlements, landmarks, ruins, heroes: +8 / -12 L*, so every kit keeps its tones (H14)
  let v = FACEMEMO.get('k' + tone); if (!v) { v = { lit: mix(shadeL(tone, 8), '#F6D9A0', 0.12), shade: mix(shadeL(tone, -12), '#3A4466', 0.14) }; FACEMEMO.set('k' + tone, v); } return v;
}
const SHADOW = 'rgba(38,42,64,0.22)';
function castShadow(g, x, y, w) { g.fillStyle = SHADOW; g.beginPath(); g.ellipse(x + 0.25 * w, y + 0.4 * U, Math.max(0.01, 0.6 * w), Math.max(0.01, 0.22 * w), -10 * Math.PI / 180, 0, Math.PI * 2); g.fill(); }
function paletteP(i, band, line) {
  const f = TERRAIN[terr[i]].fill, PX = 1 / BAND_RES[band], F = faces(f);
  // palette-ab critique fix 1 asked for crowns lit at the fill + 22 L* on Painted Forest; that put Hills/Forest at 10.7 under protanopia at
  // the start zoom (rule: 12), so every palette keeps the + 12 face (12.3 at Mid, 12.2 at Near). forestLit22 stays for the record.
  const lit = F.lit;
  return { lit, shade: F.shade, ink: STAMP_INK, lw: PX, PX, line, fill: f, trunk: shadeL(f, -30), painted: true, dark: DARK_T.has(terr[i]) };
}
function forestLit22(f) { let v = FACEMEMO.get('f22' + f); if (!v) { v = mix(shadeL(f, 22), '#F6D9A0', 0.12); FACEMEMO.set('f22' + f, v); } return v; }
// palette-ab critique fix 2 (Painted only): trees standing on Plains (copses, the Near hedgerow crowns) take tree faces, the faces of the
// Forest fill + 20 L* with a Forest - 6 trunk, instead of the Plains fill's own faces (near-white puffballs on the pale Plains). P.line passes
// through, so fog line art is unchanged. Bright keeps the Plains faces.
function treeP(P) { const tf = shadeL(TERRAIN.forest.fill, 20); return { ...P, ...faces(tf), trunk: shadeL(TERRAIN.forest.fill, -6), dark: false }; }
const plainsTreeP = (P) => (PAINTED_PAL() ? treeP(P) : P);
// ---- the hand in the stamp ink (v3 critique 12): a slight wobble, a tapered stroke and one small break. Used on hill, passable-peak,
// rock, sheaf, landmark and pond outlines; never on settlements, tokens, borders or wild outlines. Fills stay on the clean path.
function inkPath(g, pts, R, closed, w0, col, uPer = 1 / U) { // uPer: u per local unit (the break needs a path longer than 12 u)
  let P = closed ? [...pts, pts[0]] : pts; if (P.length < 2) return;
  if (P.length > 12) { const mn = 0.6 / uPer, q = [P[0]]; for (let k = 1; k < P.length - 1; k++) { const a = q[q.length - 1]; if (Math.hypot(P[k][0] - a[0], P[k][1] - a[1]) >= mn) q.push(P[k]); } q.push(P[P.length - 1]); P = q; } // points closer than 0.6 u add nothing
  const o = [P[0]]; // one level of midpoint displacement at 0.04 of the segment, then one Chaikin pass
  for (let k = 0; k < P.length - 1; k++) { const a = P[k], b = P[k + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), d = (R() - 0.5) * 2 * 0.04 * L; o.push(L ? [(a[0] + b[0]) / 2 - ((b[1] - a[1]) / L) * d, (a[1] + b[1]) / 2 + ((b[0] - a[0]) / L) * d] : a, b); }
  P = chaikin(o, 1, false);
  const Lc = cumLen(P), tot = Lc[Lc.length - 1]; if (!(tot > 0)) return;
  let pieces = [[0, tot]];
  if (tot * uPer > 12) { const gap = (0.08 + 0.04 * R()) * tot, at = (0.15 + 0.7 * R()) * tot; pieces = closed ? [[at + gap / 2, at - gap / 2 + tot]] : [[0, at - gap / 2], [at + gap / 2, tot]]; }
  g.fillStyle = col; g.beginPath();
  for (const [d0, d1] of pieces) { // a ribbon w0 (0.75 + 0.25 sin(pi t)) wide, t along the piece
    if (d1 - d0 < 1e-6) continue; const S = [[d0, arcAt(P, Lc, d0 % tot)]];
    for (let k = 0; k < P.length - 1; k++) for (const off of closed ? [0, tot] : [0]) { const d = Lc[k] + off; if (d > d0 + 1e-9 && d < d1 - 1e-9) S.push([d, P[k]]); }
    S.push([d1, arcAt(P, Lc, d1 > tot ? d1 - tot : d1)]); if (closed) S.sort((a, b) => a[0] - b[0]);
    const left = [], right = [];
    for (let k = 0; k < S.length; k++) {
      const a = S[Math.max(0, k - 1)][1], b = S[Math.min(S.length - 1, k + 1)][1], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = -(b[1] - a[1]) / l, ny = (b[0] - a[0]) / l;
      const t = (S[k][0] - d0) / (d1 - d0), w = (w0 * (0.75 + 0.25 * Math.sin(Math.PI * t))) / 2, q = S[k][1];
      left.push([q[0] + nx * w, q[1] + ny * w]); right.push([q[0] - nx * w, q[1] - ny * w]);
    }
    left.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); for (let k = right.length - 1; k >= 0; k--) g.lineTo(right[k][0], right[k][1]); g.closePath();
  }
  g.fill();
}
// The subpaths a path closure builds on g, flattened to polylines in local coordinates (the closures draw on g itself, so its path
// methods are shadowed for the call and restored after).
function recordPath(g, path) {
  const subs = []; let cur = null, sx = 0, sy = 0;
  const start = (x, y) => { cur = { pts: [[x, y]], closed: false }; subs.push(cur); sx = x; sy = y; };
  const to = (x, y) => { if (!cur) { start(sx, sy); } cur.pts.push([x, y]); };
  const ell = (cx, cy, rx, ry, rot, a0, a1, ccw) => {
    const T = 2 * Math.PI; let sw = a1 - a0;
    if (!ccw) sw = sw >= T ? T : ((sw % T) + T) % T; else sw = sw <= -T ? -T : -((((a0 - a1) % T) + T) % T);
    const n = Math.max(6, Math.ceil(Math.abs(sw) / (Math.PI / 12))), cr = Math.cos(rot), sr = Math.sin(rot), fresh = !cur;
    for (let k = 0; k <= n; k++) { const a = a0 + (sw * k) / n, px = cx + rx * Math.cos(a) * cr - ry * Math.sin(a) * sr, py = cy + rx * Math.cos(a) * sr + ry * Math.sin(a) * cr; if (!k && !cur) start(px, py); else to(px, py); }
    if (fresh && Math.abs(sw) >= T - 1e-9) { cur.closed = true; cur = null; }
  };
  const rec = {
    beginPath: () => { subs.length = 0; cur = null; },
    moveTo: (x, y) => start(x, y), lineTo: (x, y) => to(x, y),
    closePath: () => { if (cur) cur.closed = true; cur = null; },
    rect: (x, y, w, h) => { start(x, y); to(x + w, y); to(x + w, y + h); to(x, y + h); cur.closed = true; cur = null; sx = x; sy = y; },
    arc: (cx, cy, r, a0, a1, ccw) => ell(cx, cy, r, r, 0, a0, a1, ccw), ellipse: ell,
    quadraticCurveTo: (cx, cy, x, y) => { const p = cur ? cur.pts[cur.pts.length - 1] : [sx, sy]; for (let k = 1; k <= 8; k++) { const t = k / 8, u = 1 - t; to(u * u * p[0] + 2 * u * t * cx + t * t * x, u * u * p[1] + 2 * u * t * cy + t * t * y); } },
    bezierCurveTo: (c1x, c1y, c2x, c2y, x, y) => { const p = cur ? cur.pts[cur.pts.length - 1] : [sx, sy]; for (let k = 1; k <= 10; k++) { const t = k / 10, u = 1 - t; to(u ** 3 * p[0] + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t ** 3 * x, u ** 3 * p[1] + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t ** 3 * y); } },
  };
  for (const k of Object.keys(rec)) g[k] = rec[k];
  try { path(); } finally { for (const k of Object.keys(rec)) delete g[k]; }
  return subs;
}
let INKHAND = null; // { R, k }: set while a landmark, ruin or hero draws, so its ink outlines get the hand
function inkStroke(g, path, col, lw) {
  if (!INKHAND) { path(); g.strokeStyle = col; g.lineWidth = lw; g.lineJoin = 'round'; g.stroke(); return; }
  for (const sp of recordPath(g, path)) if (sp.pts.length > 1) inkPath(g, sp.pts, INKHAND.R, sp.closed, lw, col, INKHAND.k);
}
// A shape filled as two faces: lit left of xs, shade right of it, clipped to the path; then the ink outline.
function faceFill(g, path, tone, xs, bb, ink, lw, line) {
  if (line) { inkStroke(g, path, line, lw * 1.1); return; }
  const F = kitFaces(tone);
  g.save(); path(); g.clip(); g.fillStyle = F.lit; g.fillRect(bb[0], bb[1], xs - bb[0], bb[3] - bb[1]); g.fillStyle = F.shade; g.fillRect(xs, bb[1], bb[2] - xs, bb[3] - bb[1]); g.restore();
  if (ink) inkStroke(g, path, ink, lw);
}
const rectPath = (g, x, y, w, h) => () => { g.beginPath(); g.rect(x, y, w, h); };
function faceRect(g, x, y, w, h, tone, lw, line, split = 0.6) { faceFill(g, rectPath(g, x, y, w, h), tone, x + w * split, [x - 1, y - 1, x + w + 1, y + h + 1], INK, lw, line); }
const polyPath = (g, P) => () => { g.beginPath(); P.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
function facePoly(g, P, tone, lw, line, split = 0.6) { const bb = bboxOf(P); faceFill(g, polyPath(g, P), tone, bb[0] + (bb[2] - bb[0]) * split, [bb[0] - 1, bb[1] - 1, bb[2] + 1, bb[3] + 1], INK, lw, line); }

// ---- trees: lobed crowns in clumps, one outer outline per clump (stroke every crown twice the ink width, then fill every crown over it)
function crownPath(g, c) {
  g.beginPath();
  if (c.conifer) { // three jagged tiers
    const { x, y, r } = c, top = y - 1.45 * r, y1 = top + 0.5 * r, y2 = top + 0.95 * r, y3 = y - 0.05 * r;
    for (const [px, py] of [[x, top], [x + 0.55 * r, y1], [x + 0.28 * r, y1], [x + 0.8 * r, y2], [x + 0.5 * r, y2], [x + r, y3], [x - r, y3], [x - 0.5 * r, y2], [x - 0.8 * r, y2], [x - 0.28 * r, y1], [x - 0.55 * r, y1]]) g.lineTo(px, py);
    g.closePath(); return;
  }
  for (let k = 0; k <= 28; k++) { const a = (k / 28) * Math.PI * 2, rr = c.r * (1 + 0.12 * Math.sin(c.k * a + c.ph)); const px = c.x + Math.cos(a) * rr, py = c.y - c.r * 0.95 + Math.sin(a) * rr * 0.92; k ? g.lineTo(px, py) : g.moveTo(px, py); }
  g.closePath();
}
function crownFill(g, c, P, art) {
  if (art) { drawArtFrame(g, art, c.x, c.y, c.r * 2.3, c.seed); return; }
  if (c.conifer) { g.save(); crownPath(g, c); g.clip(); g.fillStyle = P.lit; g.fillRect(c.x - c.r * 1.2, c.y - c.r * 1.6, c.r * 1.2, c.r * 1.8); g.fillStyle = P.shade; g.fillRect(c.x, c.y - c.r * 1.6, c.r * 1.2, c.r * 1.8); g.restore(); return; }
  crownPath(g, c); g.fillStyle = P.shade; g.fill();
  crownPath(g, litFace(c)); g.fillStyle = P.lit; g.fill();
}
// v3 critique 1: the lit face is 0.8 r, its center offset (-0.16 r, -0.18 r) from the crown's center, so a crown reads lit from the upper left
// (v3 drew it 0.72 r and 0.31 r below the center, which left a dark crown with a pale bottom)
const litFace = (c) => ({ ...c, x: c.x - 0.16 * c.r, y: c.y - 0.95 * c.r - 0.18 * c.r + 0.95 * 0.8 * c.r, r: 0.8 * c.r });
function drawClump(g, crowns, P, o = {}) { // crowns sorted back to front
  const art = o.art ?? null;
  if (P.line) { for (const c of crowns) { crownPath(g, c); g.strokeStyle = P.line; g.lineWidth = P.lw; g.stroke(); } return; }
  if (!art) { g.strokeStyle = P.dark ? 'rgba(62,52,40,.6)' : 'rgba(62,52,40,.8)'; g.lineWidth = 2 * P.lw; g.lineJoin = 'round'; for (const c of crowns) { crownPath(g, c); g.stroke(); } }
  for (const c of crowns) { // trunks only under crowns with nothing just below them
    if (art) break;
    if (crowns.some((d) => d !== c && d.y > c.y && d.y - c.y < 1.2 * c.r && Math.abs(d.x - c.x) < c.r)) continue;
    g.fillStyle = P.trunk; g.fillRect(c.x - 0.12 * c.r, c.y - 0.15 * c.r, 0.24 * c.r, 0.3 * c.r + 0.6 * U);
  }
  for (const c of crowns) crownFill(g, c, P, art);
}
function makeClump(cx, cy, n, R, conRate, rU = [4, 5.5]) { // a tight seeded cluster: first crown at the center, the rest on a squashed spiral
  const out = [];
  for (let k = 0; k < n; k++) {
    const r = (rU[0] + R() * (rU[1] - rU[0])) * U, a = k * 2.4 + R() * 0.5, d = k ? 0.85 * r * Math.sqrt(k) : 0; // v3 critique 1: 1.05 -> 0.85, crowns overlap into a canopy
    out.push({ x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d * 0.62, r, k: 3 + Math.floor(R() * 3), ph: R() * 6.28, conifer: R() < conRate, seed: Math.floor(R() * 1e9) });
  }
  return out.sort((a, b) => a.y - b.y);
}

// ---- hills: humps with warm-cool faces and tapered hachures on the lower-right flank (never within 12 degrees of 45)
// v3 critique 4 and 5: an asymmetric hump (its crest at 0.4 of its width), a shade crescent on the lower-right flank (an ellipse at
// x + 0.3 w, rx 0.34 w, with a one band px soft edge), hachures that start on the crest (lit tone over the shade, feature ink on the lit
// face), the outline in the hand's ink; humps stand in ranges (hillRange), never alone (a lone dome is the reserved shape).
function humpTop(x, y, w) { const h = w * 0.42, xc = x - 0.1 * w, top = []; for (let k = 0; k <= 8; k++) { const a = Math.PI + (k / 8) * (Math.PI / 2); top.push([xc + Math.cos(a) * 0.4 * w, y + Math.sin(a) * h]); } for (let k = 1; k <= 12; k++) { const a = 1.5 * Math.PI + (k / 12) * (Math.PI / 2); top.push([xc + Math.cos(a) * 0.6 * w, y + Math.sin(a) * h]); } return { h, xc, top }; }
function humpP(g, x, y, w, P, R, art) {
  if (art) { drawArtFrame(g, art, x, y, w * 1.1, Math.floor(R() * 1e9)); return; }
  const { h, xc, top } = humpTop(x, y, w), path = () => { g.beginPath(); top.forEach(([px, py], k) => (k ? g.lineTo(px, py) : g.moveTo(px, py))); g.closePath(); };
  if (P.line) { inkPath(g, top, R, false, P.lw * 1.1, P.line); return; }
  // the shade is a crescent on the lower-right flank: the hump in the shade tone, then the lit face as an ellipse offset toward the light
  // (center x - 0.18 w, rx 0.44 w), over a half-alpha ring one band px wider for the soft edge. (Deviation: the critique's literal shade
  // ellipse at x + 0.3 w, rx 0.34 w, split the asymmetric hump down a near-vertical line, the look it set out to remove.)
  path(); g.fillStyle = P.shade; g.fill();
  const lx = x - 0.18 * w, ly = y - 0.04 * h, rx = 0.44 * w, ry = 0.98 * h, n = 4 + Math.floor(R() * 3);
  g.save(); path(); g.clip(); g.fillStyle = P.lit;
  g.globalAlpha = 0.5; g.beginPath(); g.ellipse(lx, ly, rx + P.lw, ry + P.lw, 0, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
  g.beginPath(); g.ellipse(lx, ly, rx, ry, 0, 0, Math.PI * 2); g.fill();
  for (let k = 0; k < n; k++) { // from 0.05 to 0.45 w right of the apex, 0.12 h below the outline, down the flank at 6-33 or 57-80 degrees
    const f = 0.05 + (0.4 * (k + 0.2 + 0.6 * R())) / n, xs = xc + f * w, ys = y - h * Math.sqrt(Math.max(0, 1 - (f / 0.6) ** 2)) + 0.12 * h;
    const deg = k % 2 ? 6 + R() * 27 : 57 + R() * 23, a = (deg * Math.PI) / 180, L = (0.35 + R() * 0.2) * w * 0.5;
    const onShade = ((xs - lx) / rx) ** 2 + ((ys - ly) / ry) ** 2 >= 1;
    taper(g, xs, ys, xs + Math.cos(a) * L, ys + Math.sin(a) * L, 0.9 * P.lw, onShade ? rgba(P.lit, 0.55) : 'rgba(62,52,40,.75)');
  }
  g.restore();
  inkPath(g, top, R, false, P.lw, STAMP_INK);
}
function hillRangeGeom(x, y, w, R, nForce) { // 2 to 4 humps: the lead (w) at the back, flankers 0.55-0.8 w wide lower-left and lower-right, 0.35-0.5 w out
  const n0 = 2 + Math.floor(R() * 3), n = nForce ?? n0, first = R() < 0.5 ? -1 : 1, out = [{ x, y: y - 0.06 * w, w }], reach = { '-1': 0, '1': 0 };
  for (let k = 1; k < n; k++) {
    const s = k % 2 ? first : -first, wk = (n === 2 ? 0.5 + 0.12 * R() : 0.5 + 0.2 * R()) * w, off = reach[s] + (reach[s] ? (0.35 + 0.15 * R()) * wk : (n === 2 ? 0.62 + 0.1 * R() : 0.55 + 0.12 * R()) * w); // spread so the notches show (a lone dome is reserved)
    reach[s] = off; out.push({ x: x + s * off, y: y + (n === 2 ? 0.1 + 0.04 * R() : 0.07 + 0.06 * R()) * w, w: wk });
  }
  return out.sort((a, b) => a.y - b.y);
}
function hillRange(g, list, P, R, art) { for (const q of list) humpP(g, q.x, q.y, q.w, P, R, art); }
const rangeBox = (list) => { let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity; for (const q of list) { a = Math.min(a, q.x - q.w / 2); c = Math.max(c, q.x + q.w / 2); b = Math.min(b, q.y - (q.h ?? q.w * 0.42)); d = Math.max(d, q.y); } return [a, b, c, d]; };
function peakRangeGeom(x, y, w, R, nForce) { // 3 to 5 passable peaks chained along an axis within +-20 degrees of horizontal; the tallest in the middle
  const n0 = 3 + Math.floor(R() * 3), n = nForce ?? n0, th = (R() - 0.5) * 2 * ((20 * Math.PI) / 180), ax = [Math.cos(th), Math.sin(th)], left = Math.floor((n - 1) / 2) + (n % 2 ? 0 : R() < 0.5 ? 1 : 0);
  const out = [{ x, y, w, h: 0.75 * w, d: 0 }];
  for (const [s, m] of [[-1, left], [1, n - 1 - left]]) {
    let prev = out[0];
    for (let k = 0; k < m; k++) {
      const hk = prev.h * (k ? 0.75 + 0.15 * R() : 0.6 + 0.25 * R()), wk = hk / 0.75, off = Math.abs(prev.d) + prev.w / 2 + wk / 2 - 0.35 * wk, j = (R() - 0.5) * 0.08 * w;
      const q = { x: x + s * ax[0] * off - ax[1] * j, y: y + s * ax[1] * off + ax[0] * j, w: wk, h: hk, d: off }; out.push(q); prev = q;
    }
  }
  return out.sort((a, b) => a.y - b.y || a.h - b.h);
}
function taper(g, x0, y0, x1, y1, w0, col) { // width w0 sin(pi t)^0.6 + 0.2 band px, as a filled sliver
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, m = 6, left = [], right = [];
  for (let k = 0; k <= m; k++) { const t = k / m, w = (w0 * Math.pow(Math.sin(Math.PI * t), 0.6) + 0.2 * w0 / 0.9) / 2; const px = x0 + dx * t, py = y0 + dy * t; left.push([px + nx * w, py + ny * w]); right.push([px - nx * w, py - ny * w]); }
  g.beginPath(); left.forEach(([px, py], k) => (k ? g.lineTo(px, py) : g.moveTo(px, py))); for (let k = right.length - 1; k >= 0; k--) g.lineTo(...right[k]); g.closePath(); g.fillStyle = col; g.fill();
}

// ---- peaks: ridge profiles by three levels of midpoint displacement; passable ones low and rounded, wild ones tall and sharp with ragged snow
function ridge(a, b, R, amp, levels) {
  let P = [a, b];
  for (let lv = 0; lv < levels; lv++) { const o = [P[0]]; for (let k = 0; k < P.length - 1; k++) { const p = P[k], q = P[k + 1], L = Math.hypot(q[0] - p[0], q[1] - p[1]), nx = -(q[1] - p[1]) / (L || 1), ny = (q[0] - p[0]) / (L || 1), d = (R() - 0.5) * 2 * amp * L; o.push([(p[0] + q[0]) / 2 + nx * d, (p[1] + q[1]) / 2 + ny * d], q); } P = o; amp *= 0.55; }
  return P;
}
function peakGeom(x, y, h, w, R, wild) {
  const ax = x - w * 0.06, apex = [ax, y - h], mid = [x + w * 0.08, y];
  let L = ridge([x - w / 2, y], apex, R, wild ? 0.16 : 0.12, 3), Rr = ridge(apex, [x + w / 2, y], R, wild ? 0.16 : 0.12, 3);
  if (!wild) { L = chaikin(L, 2, false); Rr = chaikin(Rr, 2, false); }
  const valley = ridge(apex, mid, R, 0.08, 2);
  return { L, Rr, valley, apex, mid, x, y, h, w, wild };
}
function peakPaint(g, q, cols, P, lineCol) {
  const { L, Rr, valley, apex, y, h, w, x } = q;
  const outline = [...L, ...Rr.slice(1)];
  const hand = !q.wild ? rngFor(`ink:peak:${(x * 8) | 0}:${(y * 8) | 0}`) : null; // passable peaks only: wild contours keep the clean line
  if (lineCol) { if (hand) inkPath(g, outline, hand, false, P.lw, lineCol); else { g.beginPath(); outline.forEach(([px, py], k) => (k ? g.lineTo(px, py) : g.moveTo(px, py))); g.strokeStyle = lineCol; g.lineWidth = P.lw; g.stroke(); } g.beginPath(); valley.forEach(([px, py], k) => (k ? g.lineTo(px, py) : g.moveTo(px, py))); g.strokeStyle = lineCol; g.lineWidth = P.lw * 0.6; g.stroke(); return; }
  const litFace = [...L, ...valley.slice(1)];
  const shadeFace = [...valley, ...[...Rr].reverse().slice(0, -1)];
  const lg = g.createLinearGradient(0, y - h, 0, y); lg.addColorStop(0, shadeL(cols.lit, 4)); lg.addColorStop(1, cols.lit);
  g.beginPath(); litFace.forEach(([px, py], k) => (k ? g.lineTo(px, py) : g.moveTo(px, py))); g.closePath(); g.fillStyle = lg; g.fill();
  g.beginPath(); shadeFace.forEach(([px, py], k) => (k ? g.lineTo(px, py) : g.moveTo(px, py))); g.closePath(); g.fillStyle = cols.shade; g.fill();
  if (cols.snow) { // ragged lower edge, 3 to 5 teeth, down to 40% of the height
    const sy = y - h + 0.4 * h, teeth = 3 + Math.floor(((x * 7 + y * 3) % 1000) / 334), zig = [];
    for (let k = 0; k <= teeth * 2; k++) { const t = k / (teeth * 2); zig.push([x - w / 2 + t * w, sy - (k % 2 ? 0.16 * h : 0) + 0.04 * h * Math.sin(k * 1.7)]); }
    g.save(); g.beginPath(); outline.forEach(([px, py], k) => (k ? g.lineTo(px, py) : g.moveTo(px, py))); g.closePath(); g.clip();
    g.beginPath(); g.moveTo(x - w, y - h - 2); g.lineTo(x + w, y - h - 2); for (let k = zig.length - 1; k >= 0; k--) g.lineTo(...zig[k]); g.closePath();
    g.save(); g.clip(); g.beginPath(); litFace.forEach(([px, py], k) => (k ? g.lineTo(px, py) : g.moveTo(px, py))); g.closePath(); g.fillStyle = cols.snow; g.fill();
    g.beginPath(); shadeFace.forEach(([px, py], k) => (k ? g.lineTo(px, py) : g.moveTo(px, py))); g.closePath(); g.fillStyle = cols.snowShade; g.fill(); g.restore(); g.restore();
  }
  g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = cols.ink;
  const top = outline.filter(([, py]) => py < y - h * 0.62);
  if (hand) { inkPath(g, outline, hand, false, cols.lw * 0.8, cols.ink); if (top.length > 1) inkPath(g, top, hand, false, cols.lw * 1.4, cols.ink); g.strokeStyle = cols.ink; }
  else { g.beginPath(); outline.forEach(([px, py], k) => (k ? g.lineTo(px, py) : g.moveTo(px, py))); g.lineWidth = cols.lw * 0.8; g.stroke();
    if (top.length > 1) { g.beginPath(); top.forEach(([px, py], k) => (k ? g.lineTo(px, py) : g.moveTo(px, py))); g.lineWidth = cols.lw * 1.4; g.stroke(); } }
  g.beginPath(); valley.forEach(([px, py], k) => (k ? g.lineTo(px, py) : g.moveTo(px, py))); g.lineWidth = cols.lw * 0.5; g.stroke(); g.lineCap = 'butt';
}

// ---- sheaves (H6: the approved half-dome haystack is the camp tent's silhouette): upright tied bundles, in rows along the furrows
function sheaf(g, x, y, P, line) {
  const w = 2.6 * U, h = 4.2 * U;
  const body = [[x - 0.48 * w, y], [x - 0.15 * w, y - 0.4 * h], [x - 0.5 * w, y - 0.84 * h], [x - 0.22 * w, y - h], [x + 0.22 * w, y - h], [x + 0.5 * w, y - 0.84 * h], [x + 0.15 * w, y - 0.4 * h], [x + 0.48 * w, y]];
  const path = polyPath(g, body), hand = rngFor(`ink:sheaf:${(x * 8) | 0}:${(y * 8) | 0}`);
  if (line) inkPath(g, body, hand, true, P.lw, line);
  else { g.save(); path(); g.clip(); g.fillStyle = P.lit; g.fillRect(x - w, y - h - 1, w, h + 2); g.fillStyle = P.shade; g.fillRect(x + 0.05 * w, y - h - 1, w, h + 2); g.restore(); inkPath(g, body, hand, true, P.lw * 0.8, STAMP_INK); }
  g.strokeStyle = line ?? FEATURE_INK; g.lineWidth = P.lw * 0.7; g.beginPath();
  for (let k = 0; k < 4; k++) { const a = -Math.PI / 2 + (k - 1.5) * 0.32; g.moveTo(x + (k - 1.5) * 0.12 * w, y - h); g.lineTo(x + (k - 1.5) * 0.12 * w + Math.cos(a) * 0.32 * h, y - h + Math.sin(a) * 0.32 * h); } // fanned ears
  if (!line) { g.moveTo(x - 0.2 * w, y - 0.4 * h); g.lineTo(x + 0.2 * w, y - 0.4 * h); } // the waist tie
  g.stroke();
}
function sheafRow(g, x, y, P, n, ang, line) { for (let k = 0; k < n; k++) { const d = (k - (n - 1) / 2) * 3.2 * U; sheaf(g, x + Math.cos(ang) * d, y + Math.sin(ang) * d * 0.6, P, line); } }

// ---- landmarks (about 17 u; stone #CFC6B4, timber #8C6A47; settlement faces; ink #1C1A17 at 0.9 band px). Drawn on a grid of LS * 1.3.
const STONE = '#CFC6B4', TIMBER = '#8C6A47', LMS = () => LS * 1.3;
function onGrid(g, x, y, scale, mirror, fn) { g.save(); g.translate(x, y); g.scale(mirror ? -scale : scale, scale); try { fn(); } finally { g.restore(); } }
function rubble(g, pts, lw, line) { for (const [x, y, r] of pts) { const path = () => { g.beginPath(); g.ellipse(x, y, r, r * 0.7, 0, 0, Math.PI * 2); }; if (!line) { path(); g.fillStyle = STONE; g.fill(); } inkStroke(g, path, line ?? INK, lw * 0.7); } }
function moundPath(g, x0, x1, hgt) { return () => { g.beginPath(); g.ellipse((x0 + x1) / 2, 0, (x1 - x0) / 2, hgt, 0, Math.PI, 0); g.closePath(); }; }
function archPath(g, x0, x1, top, bottom) { // an opening: a rectangle with a round head
  const r = (x1 - x0) / 2, cx = (x0 + x1) / 2; g.moveTo(x0, bottom); g.lineTo(x0, top + r); g.arc(cx, top + r, r, Math.PI, 0); g.lineTo(x1, bottom); g.closePath();
}
const LANDMARKS = {
  mine(g, lw, line, P) { // v3 critique 4: a timber A-frame headframe (two raked legs, a cross-beam, a head block; no wheel) on a plank collar, over a
    // flat spoil fan of dots. No mound and no dark opening (a mound with an opening is the beast den); the spoil is never stacked (cairns).
    void P;
    rubble(g, [[2.6, -0.25, 0.5], [3.7, -0.15, 0.55], [4.8, -0.05, 0.5], [5.8, 0, 0.45], [6.8, 0.05, 0.4], [7.7, 0.1, 0.35], [3.2, -1.05, 0.42], [4.3, -0.95, 0.4], [5.3, -0.8, 0.36], [6.3, -0.6, 0.3]], lw, line);
    faceRect(g, -4.8, -1.0, 7.6, 1.0, TIMBER, lw, line);
    for (const [bx, tx] of [[-4.0, -0.75], [2.2, 0.45]]) facePoly(g, [[bx - 0.45, -1], [tx - 0.4, -9.4], [tx + 0.4, -9.4], [bx + 0.45, -1]], TIMBER, lw, line, 0.5);
    faceRect(g, -3.1, -5.5, 4.9, 0.8, TIMBER, lw, line);
    faceRect(g, -1.5, -10.4, 2.6, 1.2, TIMBER, lw, line);
    g.strokeStyle = line ?? INK; g.lineWidth = lw * 0.5; g.beginPath(); g.moveTo(-0.2, -9.2); g.lineTo(-0.2, -1.0); g.stroke(); // the hoist rope
  },
  windmill(g, lw, line) {
    facePoly(g, [[-2.3, 0], [-1.5, -9], [1.5, -9], [2.3, 0]], STONE, lw, line);
    if (!line) { g.fillStyle = '#3E3428'; g.fillRect(-0.6, -2, 1.2, 2); }
    facePoly(g, [[-1.9, -9], [0, -11.2], [1.9, -9]], TIMBER, lw, line);
    const hub = [0, -9.8];
    for (let k = 0; k < 4; k++) { // sails at 22.5 + k 90 degrees, never at 45
      const a = ((22.5 + k * 90) * Math.PI) / 180, ex = hub[0] + Math.cos(a) * 7.2, ey = hub[1] + Math.sin(a) * 7.2, nx = -Math.sin(a) * 1.3, ny = Math.cos(a) * 1.3;
      const sail = [[hub[0] + Math.cos(a) * 1.6, hub[1] + Math.sin(a) * 1.6], [ex, ey], [ex + nx, ey + ny], [hub[0] + Math.cos(a) * 1.6 + nx, hub[1] + Math.sin(a) * 1.6 + ny]];
      g.beginPath(); sail.forEach(([x, y], j) => (j ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); if (!line) { g.fillStyle = k % 2 ? '#E8DCC5' : '#D6CCB6'; g.fill(); } g.strokeStyle = line ?? INK; g.lineWidth = lw * 0.7; g.stroke();
      g.beginPath(); g.moveTo(...hub); g.lineTo(ex, ey); g.lineWidth = lw * 1.1; g.stroke();
    }
  },
  arch(g, lw, line) { // a ruined arch: two coursed piers, the ring between them broken short of the right pier, voussoirs, rubble
    const blocks = (x0, y0, w, h, n) => { if (line) return; g.strokeStyle = 'rgba(28,26,23,.55)'; g.lineWidth = lw * 0.5; g.beginPath(); for (let k = 1; k < n; k++) { const y = y0 + (h * k) / n; g.moveTo(x0, y); g.lineTo(x0 + w, y); g.moveTo(x0 + (k % 2 ? w * 0.45 : w * 0.7), y); g.lineTo(x0 + (k % 2 ? w * 0.45 : w * 0.7), y - h / n); } g.stroke(); };
    faceRect(g, -5.6, -7.2, 2.6, 7.2, STONE, lw, line, 0.5); blocks(-5.6, -7.2, 2.6, 7.2, 4);
    facePoly(g, [[3, 0], [3, -4.6], [3.8, -5.2], [4.6, -4.4], [5.6, -4.9], [5.6, 0]], STONE, lw, line, 0.5); blocks(3, -4.4, 2.6, 4.4, 3);
    const cx = -0.0, cy = -7.2, ro = 5.6, ri = 3.0, a0 = Math.PI, a1 = Math.PI * 1.66, P = [];
    for (let k = 0; k <= 14; k++) { const a = a0 + (k / 14) * (a1 - a0); P.push([cx + Math.cos(a) * ro, cy + Math.sin(a) * ro]); }
    P.push([cx + Math.cos(a1 + 0.06) * (ri + 1.1), cy + Math.sin(a1 + 0.06) * (ri + 1.1)]);
    for (let k = 14; k >= 0; k--) { const a = a0 + (k / 14) * (a1 - a0); P.push([cx + Math.cos(a) * ri, cy + Math.sin(a) * ri]); }
    facePoly(g, P, STONE, lw, line, 0.5);
    if (!line) { g.strokeStyle = 'rgba(28,26,23,.6)'; g.lineWidth = lw * 0.55; g.beginPath(); for (let k = 1; k < 6; k++) { const a = a0 + (k / 6) * (a1 - a0); g.moveTo(cx + Math.cos(a) * ri, cy + Math.sin(a) * ri); g.lineTo(cx + Math.cos(a) * ro, cy + Math.sin(a) * ro); } g.stroke(); }
    rubble(g, [[1.2, 0, 0.7], [2.2, -0.35, 0.5], [0.2, 0.2, 0.45], [6.6, 0.1, 0.5], [1.7, 0.45, 0.35]], lw, line);
  },
  smallArch(g, lw, line) { // a small broken arch (the ring alone, standing)
    const P = []; for (let k = 0; k <= 12; k++) { const a = Math.PI + (k / 12) * Math.PI * 0.8; P.push([Math.cos(a) * 4, -0.2 + Math.sin(a) * 4.4]); } for (let k = 12; k >= 0; k--) { const a = Math.PI + (k / 12) * Math.PI * 0.8; P.push([Math.cos(a) * 2.4, -0.2 + Math.sin(a) * 2.8]); }
    facePoly(g, [[-4, 0], ...P, [-2.4, 0]], STONE, lw, line, 0.5);
  },
  barrow(g, lw, line, P) { // a long grassy mound, at least 2.5 times as long as tall, no opening (v3 critique: longer and lower, aspect 6, clear of the den)
    faceFill(g, moundPath(g, -7.8, 7.8, 2.6), P.fill, -1.5, [-9, -4, 9, 1], STAMP_INK, lw, line);
    if (!line) { g.strokeStyle = STAMP_INK; g.lineWidth = lw * 0.6; g.beginPath(); for (const x of [-4, -1, 2.5, 5]) { g.moveTo(x, -1.9 + Math.abs(x) * 0.16); g.lineTo(x + 0.4, -2.5 + Math.abs(x) * 0.16); } g.stroke(); }
  },
  aqueduct(g, lw, line) { // a fragment of three arches, the right end broken
    const path = () => { g.beginPath(); g.moveTo(-7, 0); g.lineTo(-7, -7.5); g.lineTo(3.5, -7.5); g.lineTo(4.4, -6.6); g.lineTo(5.6, -6.9); g.lineTo(6.6, -5.4); g.lineTo(6.6, 0); g.closePath(); for (const x0 of [-5.6, -1.4, 2.8]) archPath(g, x0, x0 + 2.8, -5.5, 0); };
    if (line) { inkStroke(g, path, line, lw * 1.1); return; }
    const F = kitFaces(STONE); g.save(); path(); g.clip('evenodd'); g.fillStyle = F.lit; g.fillRect(-8, -9, 9.5, 10); g.fillStyle = F.shade; g.fillRect(1.5, -9, 6, 10); g.restore();
    inkStroke(g, path, INK, lw);
  },
  wallFragment(g, lw, line) { // a ruined wall with an empty window
    const path = () => { g.beginPath(); g.moveTo(-5, 0); g.lineTo(-5, -7.5); g.lineTo(-3.4, -8.4); g.lineTo(-1.8, -7.2); g.lineTo(0.2, -8); g.lineTo(1.8, -5.6); g.lineTo(3.2, -6.1); g.lineTo(4.4, -3.6); g.lineTo(4.4, 0); g.closePath(); archPath(g, -1.9, 0.4, -6, -2.8); };
    if (line) { inkStroke(g, path, line, lw * 1.1); return; }
    const F = kitFaces(STONE); g.save(); path(); g.clip('evenodd'); g.fillStyle = F.lit; g.fillRect(-6, -9, 7.2, 10); g.fillStyle = F.shade; g.fillRect(1.2, -9, 4, 10); g.restore();
    inkStroke(g, path, INK, lw); rubble(g, [[5.4, 0, 0.5], [6.2, -0.1, 0.4]], lw, line);
  },
  fallenTrunk(g, lw, line) { // lying flat with its roots (a bare dead tree standing is Rot's)
    faceFill(g, () => { g.beginPath(); g.moveTo(-5, -0.2); g.lineTo(5.5, -0.5); g.lineTo(5.6, -2.4); g.lineTo(-5, -2.7); g.closePath(); }, '#7A5E40', 1.5, [-6, -3, 6, 0], INK, lw, line);
    if (!line) { g.fillStyle = '#D8C29A'; g.beginPath(); g.ellipse(5.55, -1.45, 0.5, 0.98, 0, 0, Math.PI * 2); g.fill(); g.strokeStyle = INK; g.lineWidth = lw * 0.6; g.stroke(); }
    g.strokeStyle = line ?? '#5A4430'; g.lineWidth = lw * 1.3; g.lineCap = 'round'; g.beginPath();
    for (const [dx, dy] of [[-2.4, -3.2], [-3.0, -0.6], [-2.2, 1.6], [-1.2, -3.4], [-2.8, 0.9]]) { g.moveTo(-5, -1.4); g.quadraticCurveTo(-5 + dx * 0.5, -1.4 + dy * 0.2, -5 + dx, -1.4 + dy); }
    g.stroke(); g.lineCap = 'butt';
  },
  columns(g, lw, line) { // three broken columns on a step
    faceRect(g, -6, -1.3, 12, 1.3, STONE, lw, line);
    for (const [x, h] of [[-3.9, 6.2], [0, 4.1], [3.9, 2.4]]) {
      const P = [[x - 0.85, -1.3], [x - 0.85, -1.3 - h], [x - 0.2, -1.3 - h - 0.5], [x + 0.3, -1.3 - h + 0.2], [x + 0.85, -1.3 - h - 0.3], [x + 0.85, -1.3]];
      facePoly(g, P, STONE, lw, line, 0.55);
      if (h > 5 && !line) faceRect(g, x - 1.15, -1.3 - h - 0.2, 2.3, 0.7, STONE, lw, line);
    }
  },
  sunkenColumns(g, lw, line, P) { // half-sunken columns in reeds
    for (const [x, h, a] of [[-3, 4.6, -0.12], [1.2, 3.0, 0.1], [4, 2.0, 0.05]]) { g.save(); g.translate(x, 0); g.rotate(a); facePoly(g, [[-0.8, 0], [-0.8, -h], [0, -h - 0.4], [0.8, -h + 0.1], [0.8, 0]], STONE, lw, line, 0.55); g.restore(); }
    reedFringe(g, -5.5, 5.5, lw, line, P);
  },
  sunkenArch(g, lw, line, P) {
    faceFill(g, () => { g.beginPath(); g.moveTo(-4.4, 0); g.arc(0, 0, 4.4, Math.PI, Math.PI * 1.85); g.lineTo(2.2, -2.1); g.arc(0, 0, 2.6, Math.PI * 1.8, Math.PI, true); g.closePath(); }, STONE, -0.5, [-5, -5, 5, 1], INK, lw, line);
    reedFringe(g, -5.5, 5, lw, line, P);
  },
  toppledStatue(g, lw, line) { // a statue lying face down beside its plinth
    faceRect(g, 3.6, -3.2, 2.6, 3.2, STONE, lw, line);
    facePoly(g, [[-6.2, -0.2], [-6.4, -1.6], [-5.4, -2.4], [-4.4, -1.9], [-3.8, -2.3], [1.8, -2.6], [3.2, -1.8], [3.3, -0.2]], STONE, lw, line, 0.5);
    if (!line) { g.strokeStyle = INK; g.lineWidth = lw * 0.6; g.beginPath(); g.moveTo(-1.6, -2.4); g.lineTo(-1.2, -0.6); g.moveTo(0.9, -2.5); g.lineTo(1.1, -0.5); g.stroke(); }
  },
};
function reedFringe(g, x0, x1, lw, line, P) { g.strokeStyle = line ?? '#5E6A48'; g.lineWidth = lw * 0.9; g.beginPath(); for (let x = x0; x <= x1; x += 1.1) { const h = 1.4 + ((x * 13.7) % 1.2); g.moveTo(x, 0.4); g.lineTo(x + 0.25, 0.4 - h); } g.stroke(); void P; }
// Heroes: one per named region, 34 to 43 u wide (drawn on the same grid; about 19 to 24 grid units).
const HEROES = {
  heroFeet(g, lw, line) { // the stone feet of a fallen colossus on a plinth
    faceRect(g, -10, -3.2, 20, 3.2, STONE, lw, line);
    for (const s of [-1, 1]) {
      const x = s * 4.2;
      facePoly(g, [[x - 3.6, -3.2], [x - 3.2, -5], [x - 1.6, -5.6], [x - 1.4, -12], [x - 0.4, -13.2], [x + 0.6, -12.2], [x + 1.4, -13], [x + 1.6, -5.4], [x + 3.4, -4.6], [x + 3.8, -3.2]], STONE, lw, line, 0.5);
      if (!line) { g.strokeStyle = INK; g.lineWidth = lw * 0.6; g.beginPath(); for (let k = 0; k < 4; k++) { g.moveTo(x + 1.6 + k * 0.5, -4.6 + k * 0.2); g.lineTo(x + 1.6 + k * 0.5, -3.4); } g.stroke(); }
    }
  },
  heroAqueduct(g, lw, line) { // a long ruined aqueduct of five arches striding across the fields
    const path = () => { g.beginPath(); g.moveTo(-12, 0); g.lineTo(-12, -9); g.lineTo(6, -9); g.lineTo(7.2, -7.6); g.lineTo(8.6, -7.9); g.lineTo(9.6, -5.4); g.lineTo(10.8, -5.6); g.lineTo(11.6, -3); g.lineTo(11.6, 0); g.closePath(); for (let k = 0; k < 5; k++) { const x0 = -10.6 + k * 4.4; archPath(g, x0, x0 + 3, -6.4, 0); } };
    if (line) { inkStroke(g, path, line, lw * 1.1); return; }
    const F = kitFaces(STONE); g.save(); path(); g.clip('evenodd'); g.fillStyle = F.lit; g.fillRect(-13, -10, 16, 11); g.fillStyle = F.shade; g.fillRect(3, -10, 10, 11); g.restore();
    inkStroke(g, path, INK, lw); g.strokeStyle = INK; g.beginPath(); g.moveTo(-12, -7.6); g.lineTo(6.8, -7.6); g.lineWidth = lw * 0.6; g.stroke();
    rubble(g, [[12.6, 0, 0.6], [13.6, -0.2, 0.5], [12.2, 0.3, 0.4]], lw, line);
  },
  heroStump(g, lw, line) { // a giant flat-topped ancient stump with roots and ferns, and no crown
    faceFill(g, () => { g.beginPath(); g.moveTo(-7, 0); g.quadraticCurveTo(-5.4, -2, -5.6, -8); g.lineTo(5.6, -8); g.quadraticCurveTo(5.4, -2, 7, 0); g.closePath(); }, '#7A5E40', 0.8, [-8, -9, 8, 1], INK, lw, line);
    const top = () => { g.beginPath(); g.ellipse(0, -8, 5.6, 1.6, 0, 0, Math.PI * 2); }; if (!line) { top(); g.fillStyle = '#D8C29A'; g.fill(); } inkStroke(g, top, line ?? INK, lw);
    if (!line) { g.strokeStyle = 'rgba(110,82,50,.8)'; g.lineWidth = lw * 0.5; for (const r of [1.2, 2.4, 3.6, 4.6]) { g.beginPath(); g.ellipse(0.3, -8, r, r * 0.28, 0, 0, Math.PI * 2); g.stroke(); } }
    g.strokeStyle = line ?? '#5A4430'; g.lineWidth = lw * 1.6; g.lineCap = 'round'; g.beginPath();
    for (const [x, dx] of [[-6.4, -4], [-4, -2.4], [5.8, 4.2], [3.4, 2.8], [0.6, 0.6]]) { g.moveTo(x, -0.4); g.quadraticCurveTo(x + dx * 0.5, 0.8, x + dx, 1.4); }
    g.stroke(); g.lineCap = 'butt';
    if (!line) for (const fx of [-8.6, 8.4]) fern(g, fx, 1, lw);
  },
  heroHead(g, lw, line, P) { // v3 critique 4: a colossal stone head toppled onto its back and seen in profile (brow, nose and chin skyward), its
    // neck stump cut clean at the right, so its outline is long and broken (an upright half-buried face was a dome: the beast den's family)
    void P;
    const head = [[-10.6, 0], [-10.9, -2.3], [-10.1, -4.5], [-8.5, -6.3], [-6.2, -7.3], [-3.6, -7.6], [-1.3, -7.3], [0.3, -6.9], [1.0, -6.3], [1.9, -6.8], [2.5, -8.8], [3.2, -9.2], [3.9, -7.4], [4.7, -7.0], [5.2, -6.4], [5.8, -6.8], [6.6, -6.4], [7.2, -5.3], [7.3, -4.5], [10.4, -4.4], [10.4, 0]];
    facePoly(g, head, STONE, lw, line, 0.55);
    faceFill(g, () => ellipse(g, 10.4, -2.2, 1.0, 2.2), STONE, 10.2, [9.3, -4.6, 11.6, 0.2], INK, lw, line); // the neck's cut face
    g.strokeStyle = line ?? INK; g.lineWidth = lw * 0.8; g.beginPath();
    g.moveTo(-0.6, -5.4); g.quadraticCurveTo(0.6, -4.8, 1.6, -5.5); // the closed eye
    g.moveTo(-4.6, -2.4); g.quadraticCurveTo(-5.8, -3.6, -4.4, -4.8); // the ear
    g.moveTo(5.0, -6.2); g.lineTo(5.6, -5.4); // the lips
    if (!line) { g.moveTo(-7.6, -5.4); g.lineTo(-6.8, -3.9); g.moveTo(8.4, -4.2); g.lineTo(8.9, -2.6); } // weathering cracks
    g.stroke();
  },
  heroArch(g, lw, line) { // a great natural stone arch, rounded, no cliff ticks
    const path = () => { g.beginPath(); g.moveTo(-10, 0); g.quadraticCurveTo(-11, -6, -7.5, -10.5); g.quadraticCurveTo(-2, -14.5, 5, -11.5); g.quadraticCurveTo(10, -8.5, 10, 0); g.closePath(); g.moveTo(-6, 0); g.quadraticCurveTo(-6.6, -6.4, -1.5, -7.6); g.quadraticCurveTo(4.4, -7.4, 5.4, 0); g.closePath(); };
    if (line) { inkStroke(g, path, line, lw * 1.1); return; }
    const F = kitFaces('#B9AE98'); g.save(); path(); g.clip('evenodd'); g.fillStyle = F.lit; g.fillRect(-12, -15, 13, 16); g.fillStyle = F.shade; g.fillRect(1, -15, 11, 16); g.restore();
    inkStroke(g, path, INK, lw);
    g.strokeStyle = 'rgba(28,26,23,.45)'; g.lineWidth = lw * 0.5; g.beginPath(); g.moveTo(-8.6, -4); g.quadraticCurveTo(-7, -9.6, -1, -11.6); g.moveTo(7.2, -3); g.quadraticCurveTo(7.6, -7.6, 3.6, -10); g.stroke();
  },
  heroPier(g, lw, line, P) { // a great broken bridge pier with one arch, standing in reeds
    const path = () => { g.beginPath(); g.moveTo(-4, 0); g.lineTo(-4, -14); g.lineTo(-2.6, -15); g.lineTo(-1, -14.2); g.lineTo(0, -14.8); g.lineTo(0, -12); g.quadraticCurveTo(4, -12.6, 7.2, -9.6); g.lineTo(8.4, -10.4); g.lineTo(9.2, -8.6); g.lineTo(8.4, -7.2); g.quadraticCurveTo(5, -9.6, 0, -8.6); g.lineTo(0, 0); g.closePath(); };
    faceFill(g, path, STONE, -1.4, [-5, -16, 10, 1], INK, lw, line);
    if (!line) { g.strokeStyle = 'rgba(28,26,23,.5)'; g.lineWidth = lw * 0.5; g.beginPath(); for (let y = -2; y > -13; y -= 2.2) { g.moveTo(-4, y); g.lineTo(0, y); } g.stroke(); }
    reedFringe(g, -9, 9, lw, line, P);
    if (!line) { g.strokeStyle = '#9FD0D4'; g.lineWidth = lw * 0.7; g.beginPath(); g.moveTo(-8, 1.2); g.lineTo(-5, 1.2); g.moveTo(2, 1.4); g.lineTo(6, 1.4); g.stroke(); }
  },
  heroStatue(g, lw, line) { // a colossal toppled statue lying face down
    faceRect(g, 7.6, -4.6, 3.6, 4.6, STONE, lw, line);
    facePoly(g, [[-11, -0.3], [-11.4, -2.4], [-10, -3.6], [-8.4, -3.2], [-7.6, -3.8], [-4, -4.4], [3, -4.2], [5.6, -3.4], [7.4, -2.2], [7.6, -0.3]], STONE, lw, line, 0.5);
    facePoly(g, [[-4.6, -4.2], [-2.6, -6.4], [-1.4, -6.2], [-2.6, -4.2]], STONE, lw, line, 0.5); // an arm lifted from the ground
    if (!line) { g.strokeStyle = INK; g.lineWidth = lw * 0.6; g.beginPath(); for (const x of [-6, -1, 2.6]) { g.moveTo(x, -4.1); g.lineTo(x + 0.4, -0.5); } g.stroke(); }
  },
};
function fern(g, x, y, lw) { g.strokeStyle = '#5E7F45'; g.lineWidth = lw * 0.8; g.beginPath(); for (const a of [-0.8, -0.3, 0.3, 0.8]) { g.moveTo(x, y); g.quadraticCurveTo(x + Math.sin(a) * 1.4, y - 1.4, x + Math.sin(a) * 2.6, y - 2); } g.stroke(); }
const RUIN_KINDS = { plains: ['arch', 'barrow', 'aqueduct'], farmland: ['aqueduct', 'wallFragment'], forest: ['fallenTrunk', 'wallFragment', 'arch'], hills: ['columns', 'barrow', 'arch'], mountains: ['columns', 'toppledStatue'], swamp: ['sunkenColumns', 'sunkenArch'], wasteland: ['arch', 'columns', 'toppledStatue'] };
const HERO_KIND = { plains: 'heroFeet', farmland: 'heroAqueduct', forest: 'heroStump', hills: 'heroHead', mountains: 'heroArch', swamp: 'heroPier', wasteland: 'heroStatue' };
const LM_W = { mine: 13, windmill: 10, arch: 9, smallArch: 8, barrow: 14, aqueduct: 14, wallFragment: 10, fallenTrunk: 12, columns: 12, sunkenColumns: 11, sunkenArch: 10, toppledStatue: 13 };
function drawLandmark(g, kind, x, y, PX, P, line, mirror, hero, scale) {
  const sc = scale ?? LMS(), fn = (hero ? HEROES : LANDMARKS)[kind], prev = INKHAND;
  INKHAND = { R: rngFor(`ink:${kind}:${(x * 8) | 0}:${(y * 8) | 0}`), k: sc / U }; // landmarks, ruins and heroes: outlines in the hand's ink
  try { onGrid(g, x, y, sc, mirror, () => fn(g, (0.9 * PX) / sc, line, P)); } finally { INKHAND = prev; }
}

// ---- independent camps (Near; H11): 1 to 4 domed tents by the public strength word, a finial, a pale door line; never a dark slit
const CANVAS = '#B9B4A6';
function campTent(g, x, y, PX, line) {
  const w = 5 * U, h = 4.2 * U, path = () => { g.beginPath(); g.ellipse(x, y, w / 2, h, 0, Math.PI, 0); g.closePath(); };
  faceFill(g, path, CANVAS, x + w * 0.08, [x - w, y - h - 1, x + w, y + 1], line ? null : INK, 0.9 * PX, line);
  g.strokeStyle = line ?? INK; g.lineWidth = 0.9 * PX; g.beginPath(); g.moveTo(x, y - h); g.lineTo(x, y - h - 1.2 * U); g.stroke();
  if (!line) { g.strokeStyle = PAPER_INK; g.lineWidth = 0.8 * PX; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - h * 0.55); g.stroke(); }
  else { g.lineWidth = 0.8 * PX; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - h * 0.55); g.stroke(); }
}
const strengthWord = (v) => (v < 16 ? 'weak' : v < 24 ? 'moderate' : v < 30 ? 'strong' : 'fortress');
const TENTS = { weak: 1, moderate: 2, strong: 3, fortress: 4 };

// ---- mana spring stones (Near; redundant with the Springs mode)
function springStone(g, x, y, c, PX) {
  g.fillStyle = '#E9E1CC'; g.beginPath(); g.arc(x, y, 4.5 * U, 0, Math.PI * 2); g.fill(); g.strokeStyle = INK; g.lineWidth = PX; g.stroke();
  const img = manaImg[c]; if (img && img.complete && img.naturalWidth) g.drawImage(img, x - 3.5 * U, y - 3.5 * U, 7 * U, 7 * U);
}

// ---- vignettes (Near only; 5 to 8 u; pale birds only; nothing that moves)
const VIG = {
  plains: 'sheep', hills: 'sheep', forest: 'deer', swamp: 'heron', mountains: 'goats', farmland: 'cows', wasteland: 'hare',
};
function vignette(g, kind, x, y, PX, R) {
  const lw = 0.7 * PX, ink = INK;
  const body = (bx, by, rx, ry, col) => { g.beginPath(); g.ellipse(bx, by, rx, ry, 0, 0, Math.PI * 2); g.fillStyle = col; g.fill(); g.strokeStyle = ink; g.lineWidth = lw; g.stroke(); };
  const legs = (bx, by, rx, hh) => { g.strokeStyle = ink; g.lineWidth = lw; g.beginPath(); for (const dx of [-0.6, 0.6]) { g.moveTo(bx + dx * rx, by); g.lineTo(bx + dx * rx, by + hh); } g.stroke(); };
  if (kind === 'sheep') { const n = 3 + Math.floor(R() * 3); for (let k = 0; k < n; k++) { const sx = x + (k - n / 2) * 2.3 * U + (R() - 0.5) * U, sy = y + (R() - 0.5) * 2 * U; castShadow(g, sx, sy + 0.9 * U, 1.8 * U); legs(sx, sy, 0.9 * U, 0.8 * U); body(sx, sy, 1.1 * U, 0.75 * U, '#EFE9DC'); body(sx + 1.1 * U, sy - 0.3 * U, 0.38 * U, 0.32 * U, '#2B2620'); } return; }
  if (kind === 'cows') { for (let k = 0; k < 2; k++) { const sx = x + k * 4.2 * U, sy = y + k * 0.8 * U; castShadow(g, sx, sy + 1.2 * U, 2.6 * U); legs(sx, sy, 1.4 * U, 1.1 * U); body(sx, sy, 1.7 * U, 0.95 * U, '#EFE9DC'); g.fillStyle = '#8C6A47'; g.beginPath(); g.ellipse(sx - 0.4 * U, sy - 0.2 * U, 0.6 * U, 0.4 * U, 0, 0, Math.PI * 2); g.fill(); body(sx + 1.8 * U, sy - 0.5 * U, 0.5 * U, 0.42 * U, '#EFE9DC'); } return; }
  if (kind === 'deer') { for (let k = 0; k < 2; k++) { const sx = x + k * 3.6 * U, sy = y + k * 0.6 * U; castShadow(g, sx, sy + 1.6 * U, 2.2 * U); legs(sx, sy, 1.1 * U, 1.6 * U); body(sx, sy, 1.4 * U, 0.7 * U, '#8C6A47'); g.strokeStyle = ink; g.lineWidth = lw; g.beginPath(); g.moveTo(sx + 1.2 * U, sy - 0.3 * U); g.lineTo(sx + 1.8 * U, sy - 1.6 * U); g.stroke(); body(sx + 1.95 * U, sy - 1.8 * U, 0.42 * U, 0.3 * U, '#8C6A47'); if (!k) { g.beginPath(); g.moveTo(sx + 1.9 * U, sy - 2.1 * U); g.lineTo(sx + 1.6 * U, sy - 2.9 * U); g.moveTo(sx + 2.1 * U, sy - 2.1 * U); g.lineTo(sx + 2.4 * U, sy - 2.9 * U); g.stroke(); } } return; }
  if (kind === 'goats') { for (let k = 0; k < 3; k++) { const sx = x + k * 3.2 * U, sy = y - 0.2 * U + (k % 2) * 0.4 * U; legs(sx, sy, 0.7 * U, 0.7 * U); body(sx, sy, 0.95 * U, 0.6 * U, '#D8CBB0'); body(sx + 0.95 * U, sy - 0.45 * U, 0.32 * U, 0.3 * U, '#D8CBB0'); } return; } // v3 critique 4: no ground patch, 3.2 u apart
  if (kind === 'heron') { castShadow(g, x, y + 2.4 * U, 1.6 * U); g.strokeStyle = ink; g.lineWidth = lw; g.beginPath(); g.moveTo(x - 0.3 * U, y + 0.6 * U); g.lineTo(x - 0.3 * U, y + 2.6 * U); g.moveTo(x + 0.3 * U, y + 0.6 * U); g.lineTo(x + 0.4 * U, y + 2.6 * U); g.stroke(); body(x, y, 1.0 * U, 1.5 * U, '#B9C2C6'); g.beginPath(); g.moveTo(x + 0.4 * U, y - 1.2 * U); g.quadraticCurveTo(x + 1.4 * U, y - 2.2 * U, x + 0.8 * U, y - 3.2 * U); g.strokeStyle = '#B9C2C6'; g.lineWidth = 2.4 * lw; g.stroke(); g.strokeStyle = ink; g.lineWidth = lw; g.stroke(); body(x + 0.9 * U, y - 3.4 * U, 0.42 * U, 0.34 * U, '#B9C2C6'); g.beginPath(); g.moveTo(x + 1.3 * U, y - 3.4 * U); g.lineTo(x + 2.5 * U, y - 3.2 * U); g.stroke(); reeds(g, x - 2 * U, y + 2.6 * U, 3 * U, { lit: '#8E9A6E', shade: '#5E6A48', lw: PX * 0.8 }); return; }
  if (kind === 'hare') { // v3 critique 4: crouched, long and low, the head forward and the ears raised and swept back (a hare sitting up read as a standing stone)
    castShadow(g, x - 0.2 * U, y + 0.3 * U, 1.6 * U); body(x, y, 1.45 * U, 0.6 * U, '#B59A7A'); body(x - 1.05 * U, y + 0.05 * U, 0.55 * U, 0.45 * U, '#B59A7A');
    g.fillStyle = '#B59A7A'; g.strokeStyle = ink; g.lineWidth = lw; for (const [dx, a] of [[1.05, -0.62], [1.35, -0.42]]) { g.beginPath(); g.ellipse(x + dx * U, y - 1.15 * U, 0.15 * U, 0.72 * U, a, 0, Math.PI * 2); g.fill(); g.stroke(); }
    body(x + 1.5 * U, y - 0.3 * U, 0.5 * U, 0.38 * U, '#B59A7A');
    g.fillStyle = '#EFE9DC'; ellipse(g, x - 1.55 * U, y - 0.15 * U, 0.22 * U, 0.2 * U); g.fill(); }
}

// ---- owner sheets ("Try your art"): frames drawn at the stamp's footprint; the image's own shadow replaces castShadow
function artFor(entry) { return view.art[entry] ?? null; }
function drawArtFrame(g, art, x, y, w, seed) {
  const fr = art.frames; if (!fr || !fr.length) return;
  const h32v = Math.abs(seed | 0), f = fr[h32v % fr.length], mirror = h32v & 1, hgt = (w * f.height) / f.width;
  g.save(); g.translate(x, y); if (mirror) g.scale(-1, 1); g.drawImage(f, -w / 2, -hgt * 0.92, w, hgt); g.restore();
}

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

// ------------------------------------------------------------------ v3: watercolor washes on linen (D1 ground paint, D2 paper), the province bake,
// and the live state overlay. The paint's mean stays the docs/09 fill (H1, H2); its key is terrain, explored, owned and Map detail (H10).
// v3 critique 2: lifts recalibrated for the wider, irregular edge pool and the ranges' relief wash (mountains 1.2 -> 2.6, plains 1.2 -> 1.7)
const PAINT = { plains: { M: 3, E: -7, G: 0.25, B: 1, lift: 1.7 }, farmland: { M: 3, E: -7, G: 0.2, B: 0, lift: 1.2 }, forest: { M: 3, E: -5, G: 0.45, B: 0, lift: 0.8 }, hills: { M: 0, E: -6, G: 0.6, B: 1, lift: 1.0 }, mountains: { M: 1, E: -7, G: 0.7, B: 1, lift: 2.6, relief: 0.08 }, swamp: { M: 1, E: -6, G: 0.35, B: 2, lift: 1.0 }, wasteland: { M: 0, E: -8, G: 0.8, B: 1, lift: 1.4 } };
const FLECK = { plains: { col: '#9A6446', cov: 0.009, bands: ['near'] }, mountains: { col: '#B59A55', cov: 0.015, bands: ['mid', 'near'] }, wasteland: { col: '#8E5A3E', cov: 0.02, bands: ['mid', 'near'] }, swamp: { col: '#A99C70', cov: 0.015, bands: ['near'], stalk: true } };
// ---- seamless tiles, seeded and world-locked (one tile pixel per u)
function vnoiseTile(S, R, cells, amp) { // periodic value noise, smoothstep-interpolated
  const L = new Float32Array(cells * cells); for (let k = 0; k < L.length; k++) L[k] = R() * 2 - 1;
  const out = new Float32Array(S * S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const gx = (x / S) * cells, gy = (y / S) * cells, ix = Math.floor(gx), iy = Math.floor(gy), fx = gx - ix, fy = gy - iy, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const at = (a, b) => L[((b % cells) * cells) + (a % cells)];
    out[y * S + x] = amp * ((at(ix, iy) * (1 - sx) + at(ix + 1, iy) * sx) * (1 - sy) + (at(ix, iy + 1) * (1 - sx) + at(ix + 1, iy + 1) * sx) * sy);
  }
  return out;
}
let PAPER = null, GRAN = null;
function paperTile() {
  if (view.art.paper && view.art.paper.tile) return view.art.paper.tile;
  if (PAPER) return PAPER;
  const S = 256, R = rngFor('paper:12'), fine = vnoiseTile(S, R, 170, 12), coarse = vnoiseTile(S, R, 6, 8); // v3 critique 2: the coarse octave 11 -> 6 cells (the slow unevenness of a wash)
  const c = makeCanvas(S, S), g = c.getContext('2d'), img = g.createImageData(S, S);
  for (let k = 0; k < S * S; k++) { const v = 128 + fine[k] + coarse[k]; img.data[k * 4] = img.data[k * 4 + 1] = img.data[k * 4 + 2] = v; img.data[k * 4 + 3] = 255; }
  g.putImageData(img, 0, 0); g.lineCap = 'round'; g.lineWidth = 0.8;
  for (let k = 0; k < 400; k++) { // fibres within 25 degrees of horizontal (never near the reserved 45)
    const x = R() * S, y = R() * S, a = (R() - 0.5) * (50 * Math.PI / 180), L = 3 + R() * 5; g.strokeStyle = k % 2 ? 'rgba(90,70,40,.10)' : 'rgba(255,250,235,.14)';
    for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { g.beginPath(); g.moveTo(x + ox, y + oy); g.lineTo(x + ox + Math.cos(a) * L, y + oy + Math.sin(a) * L); g.stroke(); }
  }
  PAPER = c; return c;
}
function granTile() {
  if (GRAN) return GRAN;
  const S = 128, R = rngFor('gran:12'), n = vnoiseTile(S, R, 85, 26), c = makeCanvas(S, S), g = c.getContext('2d'), img = g.createImageData(S, S);
  for (let k = 0; k < S * S; k++) { const v = 128 + n[k]; img.data[k * 4] = img.data[k * 4 + 1] = img.data[k * 4 + 2] = v; img.data[k * 4 + 3] = 255; }
  g.putImageData(img, 0, 0); GRAN = c; return c;
}
const PATS = new WeakMap();
// v3 critique 2 (deviation from §1.3, "one tile pixel = 1 u"): the paper and granulation tiles are scaled per band, U x {far 4, mid 2.4,
// near 1.2} per tile pixel, so the tooth lands at about 1.5 screen px at the start zoom instead of averaging away below a pixel.
// Amplitudes, alpha and the soft-light blend are unchanged, so the means hold; the 150 ms band cross-fade hides the step in scale.
const PAT_SCALE = { far: 4, mid: 2.4, near: 1.2 };
function worldPattern(g, tile, band = 'mid') { const k = U * PAT_SCALE[band], p = g.createPattern(tile, 'repeat'); p.setTransform(new DOMMatrix([k, 0, 0, k, 0, 0])); return p; }
// scratch canvases reused by every bake
const SCR = {};
function scratch(name, w, h, T) {
  let c = SCR[name]; if (!c) c = SCR[name] = makeCanvas(w, h);
  if (c.width < w || c.height < h) { c.width = Math.max(c.width, w); c.height = Math.max(c.height, h); }
  const x = c.getContext('2d', BAKE_CTX); x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; x.filter = 'none'; x.clearRect(0, 0, w, h); if (T) x.setTransform(T); return [c, x];
}
function blitScratch(g, c, w, h, mode, alpha) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = mode; g.globalAlpha = alpha; g.drawImage(c, 0, 0, w, h, 0, 0, w, h); g.restore(); }
const rgbaOf = (hex, a) => rgba(hex, a);
const PG = {}, PSKIP = new Set(); let PGT = 0; const pgm = (k) => { const t = performance.now(); PG[k] = (PG[k] ?? 0) + t - PGT; PGT = t; };
function paintGround(g, i, band, unexp) { PGT = performance.now();
  const p = prov[i], f = TERRAIN[p.terrain].fill, rec = PAINT[p.terrain], G = geo(i), poly = G.poly, PX = 1 / BAND_RES[band];
  const T = g.getTransform(), res = T.a, cw = g.canvas.width, ch = g.canvas.height, D = MED_DIAM;
  // 1 base, opaque
  pathPoly(g, poly); g.fillStyle = f; g.fill();
  const paper = () => { g.save(); g.globalCompositeOperation = 'soft-light'; g.globalAlpha = 0.5; g.fillStyle = worldPattern(g, paperTile(), band); pathPoly(g, poly); g.fill(); g.restore(); };
  if (unexp) { paper(); return; } // not yet painted: the terrain base and the paper only
  pgm('base');
  // 2 lift
  g.globalAlpha = 0.5; g.fillStyle = shadeL(f, 2 * rec.lift); pathPoly(g, poly); g.fill(); g.globalAlpha = 1;
  const zs = zonesAll(i), R = rngFor(`paint:12:${i}`), owned = !!p.owner, n = Math.max(2, Math.round((6 * areaOf[i]) / MEAN_AREA)), bb = G.bb;
  const inside = (x, y, m) => d3.polygonContains(poly, [x, y]) && distToEdge(cells[i], x, y) - 6 > m;
  const pick = (m) => { for (let t = 0; t < 30; t++) { const x = bb[0] + R() * (bb[2] - bb[0]), y = bb[1] + R() * (bb[3] - bb[1]); if (inside(x, y, m)) return [x, y]; } return null; };
  pgm('lift');
  // 3 mottle pairs: skipped whole when either blotch's inner half touches the zones, so the sum stays zero in every band
  if (rec.M) for (let k = 0; k < n; k++) {
    const r = (0.1 + 0.08 * R()) * D, a = pick(0), b = pick(0);
    if (!a || !b || inBoxes(zs, a[0], a[1], r / 2) || inBoxes(zs, b[0], b[1], r / 2)) continue;
    for (const [[x, y], dl] of [[a, rec.M], [b, -rec.M]]) { const col = shadeL(f, dl), rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, rgbaOf(col, 0.55)); rg.addColorStop(1, rgbaOf(col, 0)); g.fillStyle = rg; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
  }
  pgm('mottle');
  // the zones are cut out of the textures with a two-step 4 px feather: full strength beyond zone + 4 px, half between, none inside.
  // (A clip of the polygon minus the zones' union; cheaper than a mask layer.)
  const fth = 4 * U, cutClip = (e) => { g.beginPath(); g.rect(bb[0] - 50, bb[1] - 50, bb[2] - bb[0] + 100, bb[3] - bb[1] + 100); for (const r of rectUnion(zs.map((z) => [z[0] - e, z[1] - e, z[2] + e, z[3] + e]))) g.rect(r[0], r[1], r[2] - r[0], r[3] - r[1]); g.clip('evenodd'); };
  const feathered = (draw) => { for (const [e, a] of [[fth, 0.5], [0, 0.5]]) { g.save(); cutClip(e); g.globalAlpha = a; draw(); g.restore(); } };
  pgm('mask');
  // 4 relief wash beside passable peaks (Mountains; the Mid peak slots, so it is the same in every band): one path, so overlaps never stack
  if (rec.relief && !PSKIP.has('relief')) feathered(() => { g.globalAlpha *= rec.relief; g.fillStyle = '#3A4466'; g.beginPath(); for (const q of midPeaks(i)) { g.moveTo(q.x + 1.7 * q.w, q.y + 0.25 * q.w); g.ellipse(q.x + 0.6 * q.w, q.y + 0.25 * q.w, 1.1 * q.w, 0.45 * q.w, 0, 0, Math.PI * 2); } g.fill(); });
  pgm('relief');
  // 5 granulation (Mid, Near): earths and greys granulate, yellows stay smooth
  if (band !== 'far' && !PSKIP.has('gran')) feathered(() => { g.globalAlpha *= rec.G; g.globalCompositeOperation = 'soft-light'; g.fillStyle = worldPattern(g, granTile(), band); pathPoly(g, poly); g.fill(); });
  pgm('gran');
  // 6 blooms (Mid, Near)
  if (band !== 'far') for (let k = 0; k < rec.B; k++) {
    const r = (0.07 + 0.04 * R()) * D, c = pick(10 * U + r); if (!c || inBoxes(zs, c[0], c[1], r + 4 * U)) continue;
    g.beginPath(); for (let m = 0; m <= 48; m++) { const t = (m / 48) * Math.PI * 2, rr = r * (1 + 0.18 * Math.sin(5 * t) + 0.1 * Math.sin(11 * t)); const x = c[0] + Math.cos(t) * rr, y = c[1] + Math.sin(t) * rr; m ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath();
    g.fillStyle = rgbaOf(shadeL(f, 4), 0.35); g.fill(); g.strokeStyle = rgbaOf(shadeL(f, -9), 0.3); g.lineWidth = 1.2 * PX; g.stroke();
  }
  pgm('blooms');
  // 7 flecks: blue noise, outside the zones (hue richness without a hue mottle). v3 critique 11: gathered in drifts, only where a seeded
  // value-noise mask at 0.25 D is above 0.55 (about a third of the land), radius 0.6 to 1.4 u; the count keeps the §1.4 coverage, so the
  // density inside a drift is about 2.5 to 3 times v3's and the mean holds. 3 u minimum spacing, no rings or rows.
  const fk = FLECK[p.terrain];
  if (fk && fk.bands.includes(band) && view.detail !== 'reduced' && !PSKIP.has('flecks')) {
    const Rf = rngFor('fleck:12:' + i), Rm = rngFor('fleckmask:12:' + i), mc = 0.25 * D, mx = Math.ceil((bb[2] - bb[0]) / mc) + 2, my = Math.ceil((bb[3] - bb[1]) / mc) + 2, lat = new Float32Array(mx * my);
    for (let k = 0; k < lat.length; k++) lat[k] = Rm();
    const sm = (f) => f * f * (3 - 2 * f), mask = (x, y) => { const gx = (x - bb[0]) / mc, gy = (y - bb[1]) / mc, ix = Math.floor(gx), iy = Math.floor(gy), fx = sm(gx - ix), fy = sm(gy - iy), at = (a, b) => lat[b * mx + a]; return (at(ix, iy) * (1 - fx) + at(ix + 1, iy) * fx) * (1 - fy) + (at(ix, iy + 1) * (1 - fx) + at(ix + 1, iy + 1) * fx) * fy; };
    const want = Math.round((fk.cov * areaOf[i]) / (Math.PI * 1.0533 * U * U)), got = [], cell = 3 * U, grid = new Map(); // E[r^2] for r uniform in 0.6..1.4 u
    for (let t = 0; t < want * 16 && got.length < want; t++) {
      const x = bb[0] + Rf() * (bb[2] - bb[0]), y = bb[1] + Rf() * (bb[3] - bb[1]), r = (0.6 + 0.8 * Rf()) * U;
      if (mask(x, y) <= 0.55 || inBoxes(zs, x, y, 2 * U)) continue;
      const gx = Math.floor(x / cell), gy = Math.floor(y / cell); let near = false;
      for (let a = -1; a <= 1 && !near; a++) for (let b = -1; b <= 1 && !near; b++) for (const q of grid.get((gx + a) * 8192 + gy + b) ?? []) if (Math.hypot(q[0] - x, q[1] - y) < cell) { near = true; break; }
      if (near || !inside(x, y, 3 * U)) continue; got.push([x, y, r]); const kk = gx * 8192 + gy; let gl = grid.get(kk); if (!gl) grid.set(kk, (gl = [])); gl.push([x, y]);
    }
    if (fk.stalk) { g.strokeStyle = 'rgba(94,106,72,.8)'; g.lineWidth = 0.5 * PX; g.beginPath(); for (const [x, y] of got) { g.moveTo(x, y + 3 * U); g.lineTo(x + 0.3 * U, y); } g.stroke(); }
    g.fillStyle = fk.col; g.beginPath(); for (const [x, y, r] of got) { g.moveTo(x + r, y); g.arc(x, y, r, 0, Math.PI * 2); } g.fill();
  }
  pgm('flecks');
  // 8 the edge pool: an inner shadow (inset by B_u on owned land so it begins at the band's inner edge)
  if (!PSKIP.has('pool')) {
    const [c, x] = scratch('pool', cw, ch); x.fillStyle = '#000'; x.fillRect(0, 0, cw, ch); x.setTransform(T); x.globalCompositeOperation = 'destination-out'; pathPoly(x, poly); x.fill(); x.globalCompositeOperation = 'source-over';
    if (owned) { x.strokeStyle = '#000'; x.lineWidth = 2 * B_U; x.lineJoin = 'round'; pathPoly(x, poly); x.stroke(); }
    // v3 critique 2: an irregular casting rim (circles every 3 u along the ring, inset B_u on owned land, radius (1 + 0.6 n) x 3 band px,
    // n value noise along the arc), so the pooled edge swells and thins like a drying wash; and a wider blur (far 5, mid 11, near 14)
    const Rp = rngFor('pool:12:' + i), Lc = cumLen(poly), tot = Lc[Lc.length - 1], nk = Math.max(3, Math.ceil(tot / (24 * U))), kn = Array.from({ length: nk }, () => Rp() * 2 - 1);
    const nAt = (d) => { const t = (d / tot) * nk, k0 = Math.floor(t) % nk, f = t - Math.floor(t), sm = f * f * (3 - 2 * f); return kn[k0] * (1 - sm) + kn[(k0 + 1) % nk] * sm; };
    const nrm = (d) => { const a = arcAt(poly, Lc, Math.max(0, d - U)), b = arcAt(poly, Lc, Math.min(tot, d + U)), l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [-(b[1] - a[1]) / l, (b[0] - a[0]) / l]; };
    let vote = 0; for (const f of [0.13, 0.46, 0.79]) { const q = arcAt(poly, Lc, f * tot), n = nrm(f * tot); vote += inPoly(poly, q[0] + n[0] * 2 * U, q[1] + n[1] * 2 * U) ? 1 : -1; }
    const sg = vote > 0 ? 1 : -1, ins = owned ? B_U : 0; x.fillStyle = '#000'; x.beginPath();
    for (let d = 0; d < tot; d += 3 * U) { const q = arcAt(poly, Lc, d), n = nrm(d), r = (1 + 0.6 * nAt(d)) * 3 * PX, cx = q[0] + n[0] * sg * ins, cy = q[1] + n[1] * sg * ins; x.moveTo(cx + r, cy); x.arc(cx, cy, r, 0, Math.PI * 2); }
    x.fill();
    const blur = { far: 5, mid: 11, near: 14 }[band] * spriteRes(band) * PX, OFF = cw + ch + 200;
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.shadowColor = rgbaOf(shadeL(f, -28), 0.45); g.shadowBlur = blur; g.shadowOffsetX = OFF; g.drawImage(c, 0, 0, cw, ch, -OFF, 0, cw, ch); g.restore();
  }
  pgm('pool');
  // 9 the pooling line: 2.2 band px visible inside the border or the band
  g.strokeStyle = rgbaOf(shadeL(f, -14), 0.35); g.lineWidth = (owned ? 2 * B_U : 0) + 4.4 * PX; g.lineJoin = 'round'; pathPoly(g, poly); g.stroke();
  pgm('line');
  if (!PSKIP.has('paper')) paper(); pgm('paper');
}
// the Mid passable-peak stamps of a Mountains province (positions and sizes), for the relief wash in every band
const MIDPEAKS = new Map();
function midPeaks(i) {
  const k = KEYS[i] + ':' + i; let v = MIDPEAKS.get(i); if (v && v.k === k) return v.list;
  const list = stampSlotsFor(i, 'mid').flatMap((s) => mountainRange(i, s, false).list); // v3 critique 4: every peak of every range
  MIDPEAKS.set(i, { k, list }); return list;
}
// ---- the province's stamp slots for a band: free of the band's zones, motifs and poles, tracks, water and marks
const STAMP_R = { forest: 7, hills: 10, mountains: 9, plains: 3.5, farmland: 5, swamp: 3.5, wasteland: 3.5 };
function slotLooks(i, band) {
  const p = prov[i], G = geo(i), unexp = fogOf(i) === 'unexplored', ex = zones(i, band);
  const free = G.slots.filter((s) => !boxHit(ex, s.x - 6, s.y - 12, s.x + 6, s.y + 2));
  // deviation: terrain stamps may stand in the fixed token zone (tokens are opaque plates over them; the zone keeps the paint flat);
  // labels, the second line and the seat stay clear
  const exS = [ex[0], ex[1], ex[3]], free3 = (G.slots3 ?? G.slots).filter((s) => !boxHit(exS, s.x - 4, s.y - 8, s.x + 4, s.y + 2));
  const look = unexp ? null : p.dom.n, lvl = p.dom.s >= 7 ? 3 : p.dom.s >= 4 ? 2 : p.dom.s >= 1 ? 1 : 0, shown = band !== 'far' && !unexp, reduced = view.detail === 'reduced';
  let motifSlots = [], poleSlots = [];
  if (shown && look && lvl) {
    const pct = [0, 0.08, 0.15, 0.22][lvl]; motifSlots = free.slice(0, Math.max(1, Math.round(free.length * pct)));
    if (!reduced) { const eff = effOf(p); const per = band === 'near' ? 2 : 1; const list = []; for (const [nm, st2] of eff) for (let n = 0; n < Math.min(6, st2 * per); n++) list.push(nm); poleSlots = free.slice(-list.length).map((s, j) => ({ s, pole: list[j] })).filter((x) => list.length && x.s); poleSlots = poleSlots.slice(0, Math.floor(free.length * 0.3)); }
  }
  return { free, free3, look, lvl, shown, motifSlots, poleSlots, unexp, reduced };
}
function stampSlotsFor(i, band, L) {
  L = L ?? slotLooks(i, band); const p = prov[i], k = areaOf[i] / MEAN_AREA, spec = TSPEC[p.terrain], r = STAMP_R[p.terrain] * U;
  const taken = new Set([...L.motifSlots, ...L.poleSlots.map((x) => x.s)]);
  const se = settleExtent(i), G = geo(i), clearing = p.terrain === 'forest' ? 1.3 * se : 0;
  const count = Math.round(spec[BIX[band]] * k * (L.reduced ? 0.5 : 1) * (p.terrain === 'forest' && band !== 'far' ? (band === 'mid' ? 2 : 1.5) : 1)); // forests (fog line art): crowns in clumps
  const near = (s) => [...L.motifSlots, ...L.poleSlots.map((x) => x.s)].some((q) => Math.hypot(q.x - s.x, q.y - s.y) < 6 * U);
  // v3 critique 4: a range's whole box keeps out of the label, second-line and seat zones and off the tracks, brooks, ponds and marks
  const rng = p.terrain === 'hills' ? hillsRange : p.terrain === 'mountains' ? mountainRange : null, zb = zones(i, band), zS = [zb[0], zb[1], zb[3]];
  const rangeOK = (s) => { const b = rng(i, s, band === 'far').box; return !boxHit(zS, b[0], b[1], b[2], b[3]) && !rangeBlocked(i, b); };
  return L.free3.filter((s) => !taken.has(s) && !near(s) && !stampBlocked(i, s.x, s.y, r) && !(clearing && Math.hypot(s.x - G.seat[0], (s.y - G.seat[1]) * 1.3) < clearing) && (!rng || rangeOK(s))).sort((a, b) => a.rank - b.rank).slice(0, count);
}
// ---- v3 critique 4: Hills and Mountains stand as ranges, one §5.4 item per slot (seeded by the slot, so every band draws the same range)
const RANGES = new Map();
function hillsRange(i, s, far) {
  const k = 'h' + i + ':' + (s.x | 0) + ':' + (s.y | 0) + ':' + far; let v = RANGES.get(k); if (v) return { ...v, R: rngFor(k + ':draw') };
  const R = rngFor(`stamp:${i}:${s.x | 0}:${s.y | 0}`), w = (11 + R() * 5) * (far ? 1.8 : 1) * SS, list = hillRangeGeom(s.x, s.y, w, R);
  v = { list, box: rangeBox(list.map((q) => ({ ...q, h: q.w * 0.42 }))) }; RANGES.set(k, v); return { ...v, R: rngFor(k + ':draw') };
}
function mountainRange(i, s, far) {
  const k = 'm' + i + ':' + (s.x | 0) + ':' + (s.y | 0) + ':' + far; let v = RANGES.get(k); if (v) return v;
  const R = rngFor(`stamp:${i}:${s.x | 0}:${s.y | 0}`), w = (7 + R() * 3) * (far ? 1.8 : 1) * SS * 1.15, list = peakRangeGeom(s.x, s.y, w, R);
  v = { list, box: rangeBox(list), geoms: list.map((q) => peakGeom(q.x, q.y, q.h, q.w, R, false)), R }; RANGES.set(k, v); return v;
}
function rangeBlocked(i, b) { // landmarks, ruins, heroes, vignettes and ponds keep clear of the whole range; tracks and brooks of its middle
  const blk = feats().block.get(i); if (!blk) return false; const cy = (b[1] + b[3]) / 2, rr = Math.max(2 * U, (b[3] - b[1]) / 2), cx = (b[0] + b[2]) / 2;
  if (blk.lines.some((L) => distToPolyline(L, cx, cy) < rr + 2 * U)) return true;
  for (let k = 0; k <= 4; k++) { const x = b[0] + rr + ((b[2] - b[0] - 2 * rr) * k) / 4; if (blk.pond && Math.hypot(x - blk.pond.x, (cy - blk.pond.y) / 0.75) < blk.pond.r + rr) return true; if (blk.marks.some(([mx, my, mr]) => Math.hypot(x - mx, cy - my) < mr + rr)) return true; }
  return false;
}
// ---- v3 critique 1: forests as a canopy. Crown centers are sampled once per province by seeded Poisson disk at Near spacing (0.75 (ra + rb),
// about 1.5 r, r 4.5 to 6.5 u) over the polygon inset by B_u + 2 u, off the tracks, brooks, ponds and marks, the clearing (1.3 x the settlement
// extent) and 2 to 4 glades (r 0.08 to 0.12 D). Each band keeps a rank share (Mid 0.55) outside its own label, second-line and seat zones,
// so crossing into Near adds crowns and never moves one. Crowns group into clumps by proximity (at most 7 at Mid, 9 at Near), a clump is one
// §5.4 item, and the clumps are capped at 28 (Mid) and 55 (Near) per average province.
// palette-ab critique fix 1, under Palette: Painted only (Bright keeps v3's canopy exactly): every crown at Mid and Near (keep 1 / 1, so Near
// still only adds crowns), denser sampling (24 tries per crown area, crowd 0.6 (ra + rb)), one or two glades of 0.06 to 0.09 D, the B_u border
// inset only on owned land (the band is there; "owned" is in the paint key, H10), and canopyBlocked (p54) instead of stampBlocked.
const CANOPY = new Map(), CANOPY_KEEP = { mid: 0.55, near: 0.77 }, CANOPY_KEEP_P = { mid: 1, near: 1 }, CLUMP_MAX = { mid: 7, near: 9 }, CLUMP_CAP = { mid: 28, near: 55 };
const conRateOf = (i) => (nbrs(i).some((w) => terr[w] === 'mountains') || NB[i].some((w) => isWild(w) && wildOf[w].kind === 'peaks') ? 0.7 : 0.15);
function canopyAll(i) {
  const F = feats(), pp = PAINTED_PAL(), own = pp ? !!prov[i].owner : null; let v = CANOPY.get(i); if (v && v.F === F && v.pp === pp && v.own === own) return v.list;
  const G = geo(i), poly = G.poly, cv = cells[i], bb = G.bb, R = rngFor('canopy:12:' + i), se = settleExtent(i), D = MED_DIAM, conRate = conRateOf(i);
  const glades = [], ng = pp ? 1 + Math.floor(R() * 2) : 2 + Math.floor(R() * 3), inset = (pp && !own ? 0 : B_U) + 2 * U, blocked = pp ? canopyBlocked : stampBlocked;
  for (let t = 0; t < 80 && glades.length < ng; t++) { const x = bb[0] + R() * (bb[2] - bb[0]), y = bb[1] + R() * (bb[3] - bb[1]), r = (pp ? 0.06 + 0.03 * R() : 0.08 + 0.04 * R()) * D; if (inPoly(cv, x, y) && distToEdge(cv, x, y) > 0.12 * D && Math.hypot(x - G.seat[0], (y - G.seat[1]) * 1.3) > 1.3 * se + r * 0.5) glades.push([x, y, r]); }
  const list = [], cell = 10 * U, grid = new Map(), lastD = G.slots.at(-1)?.d ?? 1, tries = Math.round((areaOf[i] / (Math.PI * (3.6 * U) ** 2)) * (pp ? 24 : 14)), cr = pp ? 0.6 : 0.75;
  const crowd = (x, y, r) => { const gx = Math.floor(x / cell), gy = Math.floor(y / cell); for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (const q of grid.get((gx + a) * 8192 + gy + b) ?? []) if (Math.hypot(q.x - x, q.y - y) < cr * (q.r + r)) return true; return false; };
  for (let t = 0; t < tries; t++) {
    const x = bb[0] + R() * (bb[2] - bb[0]), y = bb[1] + R() * (bb[3] - bb[1]), r = (4.5 + 2 * R()) * U, vy = y - 0.95 * r;
    if (crowd(x, y, r) || Math.hypot(x - G.seat[0], (y - G.seat[1]) * 1.3) < 1.3 * se || glades.some(([gx, gy, gr]) => Math.hypot(x - gx, y - gy) < gr)) continue;
    if (!inPoly(cv, x, vy) || distToEdge(cv, x, vy) - 6 < inset || !inPoly(poly, x, vy) || !inPoly(poly, x, y) || blocked(i, x, vy, r)) continue;
    const Rc = rngFor(`crown:12:${i}:${list.length}`), q = { x, y, r, rank: Rc(), k: 3 + Math.floor(Rc() * 3), ph: Rc() * 6.28, conifer: Rc() < conRate, seed: Math.floor(Rc() * 1e9), v: Rc(), d: Math.hypot(x - G.seat[0], (y - G.seat[1]) * 1.4), lastD };
    list.push(q); const kk = Math.floor(x / cell) * 8192 + Math.floor(y / cell); let gl = grid.get(kk); if (!gl) grid.set(kk, (gl = [])); gl.push(q);
  }
  CANOPY.set(i, { F, pp, own, list, glades }); return list;
}
function canopyFor(i, band) {
  const zb = zones(i, band), zS = [zb[0], zb[1], zb[3]], keep = (PAINTED_PAL() ? CANOPY_KEEP_P : CANOPY_KEEP)[band] * (view.detail === 'reduced' ? 0.5 : 1);
  return canopyAll(i).filter((q) => q.rank < keep && !boxHit(zS, q.x - q.r, q.y - 2 * q.r, q.x + q.r, q.y));
}
function canopyClumps(i, band, crowns) { // greedy grouping by proximity in rank order, then the smallest clumps merge until under the cap
  const max = CLUMP_MAX[band], cap = Math.max(3, Math.round(CLUMP_CAP[band] * (areaOf[i] / MEAN_AREA))), cell = 16 * U, grid = new Map(), left = new Set(crowns);
  for (const q of crowns) { const kk = Math.floor(q.x / cell) * 8192 + Math.floor(q.y / cell); let gl = grid.get(kk); if (!gl) grid.set(kk, (gl = [])); gl.push(q); }
  const nb = (m) => { const gx = Math.floor(m.x / cell), gy = Math.floor(m.y / cell), o = []; for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (const q of grid.get((gx + a) * 8192 + gy + b) ?? []) if (left.has(q)) o.push(q); return o; };
  let clumps = [];
  for (const c of [...crowns].sort((a, b) => a.rank - b.rank)) {
    if (!left.has(c)) continue; left.delete(c); const cl = [c];
    while (cl.length < max) { let best = null, bd = Infinity; for (const m of cl) for (const q of nb(m)) { const d = Math.hypot(q.x - m.x, q.y - m.y); if (d < 1.2 * (q.r + m.r) && d < bd) { bd = d; best = q; } } if (!best) break; left.delete(best); cl.push(best); }
    clumps.push(cl);
  }
  const ctr = (cl) => [cl.reduce((a, q) => a + q.x, 0) / cl.length, cl.reduce((a, q) => a + q.y, 0) / cl.length];
  while (clumps.length > cap) { clumps.sort((a, b) => a.length - b.length); const sm = clumps.shift(), c0 = ctr(sm); let best = 0, bd = Infinity; clumps.forEach((cl, k) => { const c1 = ctr(cl), d = Math.hypot(c1[0] - c0[0], c1[1] - c0[1]); if (d < bd) { bd = d; best = k; } }); clumps[best] = clumps[best].concat(sm); }
  return clumps.map((cl) => cl.sort((a, b) => a.y - b.y));
}

// ---- D3 ground textures for the painted look (within +-8 L*): v2's, with hand-inked fields, wavy dotted hedges, infields and clearings
function dotLine(g, P, every, r, col) { const Lc = cumLen(P), tot = Lc[Lc.length - 1]; g.fillStyle = col; g.beginPath(); for (let d = every / 2; d < tot; d += every) { const q = arcAt(P, Lc, d); g.moveTo(q[0] + r, q[1]); g.arc(q[0], q[1], r, 0, Math.PI * 2); } g.fill(); }
function wobble(a, b, R, amp, levels) { return ridge(a, b, R, amp, levels); }
// Palette A/B (decision.md item 2): under Painted each ground mark is a lightness step from its own fill, at v3's alpha; Bright keeps v3's
// literal colors (tuned to the approved fills), so view A is unchanged. Plains stipple and the Farmland field tones and furrows already follow the fill.
const markCol = (f, lit, dL, a) => (PAINTED_PAL() ? rgba(shadeL(f, dL), a) : lit);
function groundP(g, i, band, R) {
  const p = prov[i], G = geo(i), f = TERRAIN[p.terrain].fill, PX = 1 / BAND_RES[band], k = areaOf[i] / MEAN_AREA, [bx0, by0, bx1, by1] = G.bb;
  const rx = () => bx0 + R() * (bx1 - bx0), ry = () => by0 + R() * (by1 - by0), se = settleExtent(i);
  // palette-ab critique fix 3 (Painted only, Mid and Near): grass tufts of three short strokes, each within 26 degrees of vertical (at least 19
  // from the reserved 45), on their own seed; strokes, not free pale dots, grey stipple or dot rings (H6). Far and Bright keep v3's ground.
  const grass = PAINTED_PAL() && band !== 'far', Rg = rngFor('grass:12:' + i), gx = () => bx0 + Rg() * (bx1 - bx0), gy = () => by0 + Rg() * (by1 - by0);
  const tufts = (n, dL, a) => { g.strokeStyle = rgba(shadeL(f, dL), a); g.lineWidth = 0.9 * PX; g.lineCap = 'round'; g.beginPath();
    for (let m = 0; m < n; m++) { const x = gx(), y = gy(), L = (2.2 + 1.4 * Rg()) * U, a0 = -Math.PI / 2 + (Rg() - 0.5) * 0.3;
      for (const da of [-0.3, 0, 0.3]) { const l = da ? 0.75 * L : L; g.moveTo(x, y); g.lineTo(x + Math.cos(a0 + da) * l, y + Math.sin(a0 + da) * l); } }
    g.stroke(); g.lineCap = 'butt'; };
  switch (p.terrain) {
    case 'plains': {
      if (grass) { for (let n = 0; n < 120 * k; n++) { R(); R(); R(); } tufts(Math.round(600 * k), -20, 0.5); } // the stipple's draws are still taken, so the hedgerows never move between bands
      else for (let n = 0; n < 120 * k; n++) { g.fillStyle = rgba(shadeL(f, R() < 0.5 ? -8 : 8), 0.55); ellipse(g, rx(), ry(), 1.1, 1.1); g.fill(); }
      for (let h = 0; h < 1 + (R() < 0.5 ? 1 : 0); h++) { // v3 critique 10: hedgerow dots 1.2 u every 3.5 u (wavy: Order's are straight); at Near a crown on every fifth
        const s = G.slots[Math.floor(R() * G.slots.length)]; if (!s) break; const a = R() * Math.PI, L = 40 + R() * 40; const P = chaikin(wobble([s.x, s.y], [s.x + Math.cos(a) * L, s.y + Math.sin(a) * L * 0.6], R, 0.12, 3), 2, false);
        dotLine(g, P, 3.5 * U, 1.2 * U, markCol(f, 'rgba(94,112,70,.6)', -37, 0.6));
        if (band === 'near') { const Lc = cumLen(P), tot = Lc[Lc.length - 1], Pp = paletteP(i, band, null), Rh = rngFor(`hedge:12:${i}:${h}`); let m = 0; for (let d = 3.5 * U / 2; d < tot; d += 3.5 * U, m++) { if (m % 5 !== 2) continue; const q = arcAt(P, Lc, d); drawClump(g, [{ x: q[0], y: q[1], r: 2.5 * U, k: 3 + Math.floor(Rh() * 3), ph: Rh() * 6.28, conifer: false }], plainsTreeP(Pp)); } }
      }
      break;
    }
    case 'farmland': {
      const n = 5 + Math.floor(R() * 5), seeds = []; while (seeds.length < n) { const x = rx(), y = ry(); if (inPoly(G.poly, x, y)) seeds.push([x, y]); }
      const vor = d3.Delaunay.from(seeds).voronoi([bx0 - 2, by0 - 2, bx1 + 2, by1 + 2]);
      const doubled = p.dom.n === 'green' && effStep(3, p.dom.s) >= 2, edges = new Map();
      seeds.forEach((sd, j) => {
        const cell = vor.cellPolygon(j); if (!cell) return;
        g.save(); pathPoly(g, cell); g.clip(); g.fillStyle = shadeL(f, (R() - 0.5) * 10); g.fillRect(bx0, by0, bx1 - bx0, by1 - by0);
        const ang = [0, Math.PI / 2, Math.PI / 6, -Math.PI / 6][Math.floor(R() * 4)], sp = doubled ? 3.2 : 6.4, L = (bx1 - bx0) + (by1 - by0);
        g.strokeStyle = rgba(shadeL(f, -12), 0.35); g.lineWidth = 0.9; g.beginPath();
        for (let o = -L; o < L; o += sp) { const cx = sd[0] + Math.cos(ang + Math.PI / 2) * o, cy = sd[1] + Math.sin(ang + Math.PI / 2) * o; g.moveTo(cx - Math.cos(ang) * L, cy - Math.sin(ang) * L); g.lineTo(cx + Math.cos(ang) * L, cy + Math.sin(ang) * L); }
        g.stroke(); g.restore();
        for (let m = 0; m < cell.length - 1; m++) { const a = cell[m], b = cell[m + 1], key = [a, b].map((q) => q[0].toFixed(1) + ',' + q[1].toFixed(1)).sort().join('|'); if (!edges.has(key)) edges.set(key, [a, b]); }
      });
      const Re = rngFor(`map:11:${i}:hedges`); // hedges between fields: hand-inked, wobbly dotted bushes
      for (const [a, b] of edges.values()) { if (!inPoly(G.poly, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2)) continue; const P = chaikin(wobble(a, b, Re, 0.15, 2), 1, false); g.strokeStyle = markCol(f, 'rgba(78,90,46,.35)', -42, 0.35); g.lineWidth = 0.8 * PX; g.beginPath(); P.forEach(([x, y], m) => (m ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); dotLine(g, P, 3 * U, 0.7 * U, markCol(f, 'rgba(78,90,46,.6)', -42, 0.6)); }
      break;
    }
    case 'forest': {
      for (let y = by0; y < by1; y += 8) for (let x = bx0 + ((y / 8) % 2) * 5; x < bx1; x += 10) { const r = 4 + R() * 2; g.strokeStyle = R() < 0.55 ? markCol(f, 'rgba(42,58,33,.4)', -8, 0.4) : markCol(f, 'rgba(75,99,57,.3)', 8, 0.3); g.lineWidth = 1.1; g.beginPath(); g.arc(x + (R() - 0.5) * 3, y, r, Math.PI * 1.05, Math.PI * 1.95); g.stroke(); }
      const c = G.seat, rg = g.createRadialGradient(c[0], c[1], 0, c[0], c[1], 1.3 * se); rg.addColorStop(0, rgba(shadeL(f, 5), 1)); rg.addColorStop(0.75, rgba(shadeL(f, 5), 0.85)); rg.addColorStop(1, rgba(shadeL(f, 5), 0)); // a clearing in the woods
      g.save(); g.translate(c[0], c[1]); g.scale(1, 1 / 1.3); g.translate(-c[0], -c[1]); g.fillStyle = rg; g.beginPath(); g.arc(c[0], c[1], 1.3 * se, 0, Math.PI * 2); g.fill(); g.restore();
      break;
    }
    case 'hills': if (grass) tufts(Math.round(400 * k), 12, 0.45); break; // v3 critique 5: v2's loose arcs (unscaled, with no hump under them) are gone
    case 'mountains': { for (let n = 0; n < 160 * k; n++) { g.fillStyle = markCol(f, 'rgba(110,127,134,.4)', -14, 0.4); ellipse(g, rx(), ry(), 0.9 + R() * 0.8, 0.8); g.fill(); } break; }
    case 'swamp': {
      if (grass) tufts(Math.round(300 * k), 14, 0.45);
      g.strokeStyle = markCol(f, 'rgba(44,140,148,.6)', 10, 0.6); g.lineWidth = 1.2; g.lineCap = 'round';
      for (let y = by0 + 4; y < by1; y += 7) for (let x = bx0 + ((y / 7) % 2) * 9; x < bx1; x += 22) { const L = 6 + R() * 8; g.beginPath(); g.moveTo(x, y); g.lineTo(x + L, y); g.stroke(); }
      g.lineCap = 'butt'; for (let n = 0; n < 5 * k; n++) { const x = rx(), y = ry(), w = 6 + R() * 8, h = 2.5 + R() * 2.5; g.fillStyle = markCol(f, 'rgba(44,140,148,.45)', 10, 0.45); ellipse(g, x, y, w, h); g.fill(); if (band === 'near') { g.strokeStyle = markCol(f, 'rgba(159,208,212,.7)', 36, 0.7); g.lineWidth = PX; g.beginPath(); g.moveTo(x - w * 0.4, y - h * 0.2); g.lineTo(x + w * 0.1, y - h * 0.2); g.stroke(); } }
      break;
    }
    case 'wasteland': { const seeds = []; const n = 20 + Math.floor(R() * 11); while (seeds.length < n) seeds.push([rx(), ry()]); const vor = d3.Delaunay.from(seeds).voronoi([bx0, by0, bx1, by1]); g.strokeStyle = markCol(f, 'rgba(143,110,100,.45)', -11, 0.45); g.lineWidth = 1; g.beginPath(); vor.render(g); g.stroke(); break; }
  }
  // infields: on Plains, Hills and Wasteland a town of tier T >= 2 tills T - 1 patches just outside its fixed extent (growth adds the next spot)
  const tier = tierOf(p);
  if (band !== 'far' && tier >= 2 && ['plains', 'hills', 'wasteland'].includes(p.terrain)) {
    const Ri = rngFor('infield:12:' + i), spots = []; for (let m = 0; m < 6; m++) spots.push({ a: Ri() * Math.PI * 2, rr: (1.15 + 0.35 * Ri()) * se, rank: Ri(), sides: 3 + Math.floor(Ri() * 3), ang: [0, Math.PI / 2, Math.PI / 6, -Math.PI / 6][Math.floor(Ri() * 4)], dl: (Ri() - 0.5) * 10, rot: Ri() * 6.28 });
    const st = settlementC(i), hr = 0.5 * st.rad;
    for (const sp of spots.sort((a, b) => a.rank - b.rank).slice(0, Math.min(4, tier - 1))) {
      const cx = G.seat[0] + Math.cos(sp.a) * sp.rr, cy = G.seat[1] + Math.sin(sp.a) * sp.rr * 0.7; if (!inPoly(G.poly, cx, cy)) continue;
      const P = []; for (let m = 0; m < sp.sides; m++) { const t = sp.rot + (m / sp.sides) * Math.PI * 2; P.push([cx + Math.cos(t) * hr, cy + Math.sin(t) * hr * 0.7]); }
      g.save(); pathPoly(g, P); g.clip(); g.fillStyle = shadeL(f, sp.dl); g.fillRect(cx - hr, cy - hr, 2 * hr, 2 * hr); g.strokeStyle = rgba(shadeL(f, -12), 0.4); g.lineWidth = 0.8 * PX; g.beginPath(); for (let o = -hr; o < hr; o += 2.4) { const ox = cx + Math.cos(sp.ang + Math.PI / 2) * o, oy = cy + Math.sin(sp.ang + Math.PI / 2) * o; g.moveTo(ox - Math.cos(sp.ang) * hr, oy - Math.sin(sp.ang) * hr); g.lineTo(ox + Math.cos(sp.ang) * hr, oy + Math.sin(sp.ang) * hr); } g.stroke(); g.restore();
      pathPoly(g, P); g.strokeStyle = markCol(f, 'rgba(78,90,46,.45)', -42, 0.45); g.lineWidth = 0.8 * PX; g.stroke();
    }
  }
}

// ---- the painted province bake
function drawProvinceDeco(g, i, band, opt = {}) { if (!PAINTED()) return drawProvinceDecoV2(g, i, band); return drawProvinceDecoP(g, i, band, opt); }
function drawProvinceDecoP(g, i, band, opt) {
  const p = prov[i], G = geo(i), fog = fogOf(i), unexp = fog === 'unexplored';
  const PX = 1 / BAND_RES[band], R = rngFor(`map:11:${i}:${band}:paint`);
  const lineCol = DARK_T.has(p.terrain) ? PAPER_INK : FEATURE_INK;
  const P = paletteP(i, band, unexp ? lineCol : null);
  const FT = feats(), LM = FT.land.get(i) ?? {}, HERO = FT.heroes.get(i), VG = FT.vig.get(i), reduced = view.detail === 'reduced';
  const IO = !!opt.itemsOnly; // the density check: standing items only, no paint, ground, water, settlement or shadows
  g.save(); pathPoly(g, G.poly); g.clip();
  if (!reduced && !IO) paintGround(g, i, band, unexp);
  if (opt.paintOnly) { g.restore(); return; }
  if (!unexp && !IO) groundP(g, i, band, rngFor(`map:11:${i}:ground`));
  const L = slotLooks(i, band), { look, lvl, shown } = L, st = unexp ? null : settlement(i);
  if (IO) g.restore(); else {
  if (shown && look === 'red' && lvl) { const Rr = rngFor(`map:11:${i}:ash`); g.fillStyle = 'rgba(143,140,136,.25)'; for (let n = 0; n < 50 * lvl; n++) { const s = G.slots[Math.floor(Rr() * Math.min(G.slots.length, 6 + lvl * 6))]; if (s) { ellipse(g, s.x + (Rr() - 0.5) * 26, s.y + (Rr() - 0.5) * 18, 1.2, 1.2); g.fill(); } } }
  if (shown && look === 'green' && lvl >= 2) { const Rr = rngFor(`map:11:${i}:meadow`); g.fillStyle = 'rgba(239,231,207,.75)'; for (let n = 0; n < 30 * lvl; n++) { const s = G.slots[Math.floor(Rr() * Math.min(G.slots.length, 8 + lvl * 6))]; if (s) { ellipse(g, s.x + (Rr() - 0.5) * 24, s.y + (Rr() - 0.5) * 16, 0.9, 0.9); g.fill(); } } }
  if (st && st.thrive && band !== 'far') { const Rr = rngFor(`map:11:${i}:garden`); for (let n = 0; n < 6; n++) { const a = Rr() * Math.PI * 2, r = st.rad + 3 + Rr() * 6; g.fillStyle = n % 2 ? 'rgba(110,143,78,.55)' : 'rgba(138,106,58,.45)'; g.fillRect(st.sx + Math.cos(a) * r * 1.1 - 2.5, st.sy + Math.sin(a) * r * 0.7 - 1.5, 5, 3); } }
  if (!unexp && p.scar === 'churned' && band !== 'far') { const Rr = rngFor(`map:11:${i}:scar`); g.fillStyle = 'rgba(94,70,48,.45)'; for (let n = 0; n < 40; n++) { const t = Rr(); ellipse(g, G.c[0] - 60 + t * 120 + (Rr() - 0.5) * 10, G.c[1] - 30 + t * 50 + (Rr() - 0.5) * 10, 2 + Rr() * 3, 1.2 + Rr()); g.fill(); } }
  if (!unexp && band !== 'far') drawWater(g, i, band, PX); // D4: scenery; unexplored provinces show no water (H5)
  g.restore(); }

  // D6: standing items, by bottom edge, every cast shadow first
  const items = [], free = L.free, far = band === 'far';
  const stampSlots = stampSlotsFor(i, band, L);
  const blossom = shown && look === 'green', charredOK = shown && look === 'red' && lvl >= 3;
  const conRate = conRateOf(i);
  if (p.terrain === 'forest' && !P.line && !far) { // v3 critique 1: the canopy (see canopyAll)
    const all = canopyFor(i, band), ch = all.filter((q) => charredOK && q.d < q.lastD * 0.5 && q.v < 0.33), rest = all.filter((q) => !ch.includes(q));
    for (const q of ch) items.push({ y: q.y, sh: () => castShadow(g, q.x, q.y, 4 * U), f: () => charred(g, q.x, q.y, 3.4 * SS, PX) });
    const art = artFor('broadleaf'), artC = artFor('conifer');
    for (const crowns of canopyClumps(i, band, rest)) {
      if (blossom) crowns.forEach((q) => (q.blossom = q.seed % 100 < 35)); else crowns.forEach((q) => (q.blossom = false));
      const xs = crowns.map((q) => q.x), w = Math.max(...xs) - Math.min(...xs) + 2 * crowns[0].r, by = Math.max(...crowns.map((q) => q.y));
      items.push({ y: by, clump: crowns.length, sh: () => castShadow(g, (Math.max(...xs) + Math.min(...xs)) / 2, by, w), f: () => { const conMost = crowns.filter((q) => q.conifer).length * 2 > crowns.length, a = conMost ? artC ?? art : art ?? artC; if (a) drawArtFrame(g, a, (Math.max(...xs) + Math.min(...xs)) / 2, by, w * 1.15, crowns[0].seed); else drawClump(g, crowns, P); for (const q of crowns) if (q.blossom) { g.fillStyle = '#EAD2DA'; for (let m = 0; m < 3; m++) { const a2 = m * 2.1 + q.ph; ellipse(g, q.x + Math.cos(a2) * q.r * 0.45, q.y - 0.95 * q.r + Math.sin(a2) * q.r * 0.4, q.r * 0.16, q.r * 0.16); g.fill(); } } } });
    }
  } else for (const s of stampSlots) {
    const it = stampItemP(g, i, p, s, band, P, { conRate, blossom: blossom && s.v < 0.35, great: shown && look === 'green' && lvl >= 3 && s.v > 0.85 });
    if (it) items.push(it);
  }
  const scaled = (s, k2, fn) => { g.save(); g.translate(s.x, s.y); g.scale(k2, k2); try { fn({ ...s, x: 0, y: 0 }, PX / k2); } finally { g.restore(); } };
  L.motifSlots.forEach((s, j) => items.push({ y: s.y, f: () => scaled(s, MS, (q, px2) => motifFor(g, look, lvl, q, j, px2, R)) }));
  L.poleSlots.forEach(({ s, pole }, j) => items.push({ y: s.y, f: () => scaled(s, MS, (q, px2) => poleFor(g, pole, q, j, px2, { ...P, lw: px2, PX: px2 })) }));
  if (shown && look && lvl === 3 && free.length) { const s = free[Math.min(free.length - 1, L.motifSlots.length)]; items.push({ y: s.y, f: () => scaled(s, MS, (q, px2) => (look === 'red' ? burningCairn(g, q.x, q.y, px2) : tree(g, q.x, q.y, 9, { ...P, lw: px2 }, { blossom: true, shade: '#2F4A26', lit: '#5E7F45' }))) }); }
  if (shown && look === 'red' && lvl >= 3) { const Rr = rngFor(`map:11:${i}:cracks`); for (let n = 0; n < 3; n++) { const s = free[Math.floor(Rr() * free.length)]; if (s) items.push({ y: s.y - 1, f: () => emberCrack(g, s.x, s.y, 9, Rr, PX) }); } }
  if (!unexp && p.scar === 'cairns' && !far) { const s0 = free[Math.floor(free.length / 2)] ?? G.slots[0]; for (let n = 0; n < 3; n++) items.push({ y: s0.y + n, f: () => cairn(g, s0.x - 12 + n * 11, s0.y + n * 2, 1.4, PX, false) }); }
  if (!unexp && p.scar === 'churned' && !far) { const s0 = free[Math.floor(free.length / 2)] ?? G.slots[0]; items.push({ y: s0.y, f: () => { g.strokeStyle = '#5E4630'; g.lineWidth = PX * 1.2; for (const [dx, a] of [[-6, 0.6], [4, -0.8], [9, 0.3]]) { g.beginPath(); g.moveTo(s0.x + dx, s0.y); g.lineTo(s0.x + dx + Math.cos(a) * 7, s0.y - Math.abs(Math.sin(a)) * 7); g.stroke(); } g.fillStyle = '#1C1A17'; for (const [dx, dy] of [[-2, -10], [6, -13], [12, -8]]) { g.beginPath(); g.moveTo(s0.x + dx - 1.6, s0.y + dy); g.lineTo(s0.x + dx, s0.y + dy - 0.8); g.lineTo(s0.x + dx + 1.6, s0.y + dy); g.lineTo(s0.x + dx, s0.y + dy + 0.4); g.closePath(); g.fill(); } } }); }
  if (p.terrain === 'mountains' && !unexp && view.footpath) items.push({ y: -1e9, f: () => footpath(g, i, PX) });
  // landmarks (terrain-coded), ruins (history), the hero set piece (Far, Mid, Near)
  const lm = (o, hero) => items.push({ y: o.y, sh: P.line ? null : () => castShadow(g, o.x, o.y, o.w * 0.8), f: () => drawLandmark(g, o.kind, o.x, o.y, PX, P, P.line, o.mirror, hero, hero ? o.scale : null) });
  if (!far && LM.always) lm(LM.always, false);
  if (!far && LM.ruin) lm(LM.ruin, false);
  if (HERO) lm(HERO, true);
  // independent camps (Near; the public strength word, so line art in fog too)
  if (band === 'near' && p.owner === null) {
    const n = TENTS[strengthWord(p.indep)], se = settleExtent(i);
    for (let k = 0; k < n; k++) { const x = G.seat[0] + 0.9 * se + k * 7 * U, y = G.seat[1] + 4 * U; items.push({ y, sh: P.line ? null : () => castShadow(g, x, y, 5 * U), f: () => campTent(g, x, y, PX, P.line) }); }
  }
  // mana spring stones (Near; never in unexplored provinces)
  if (band === 'near' && !unexp) p.springs.forEach((c, k) => { const se = settleExtent(i), x = G.seat[0] - (0.9 * se + k * 10 * U), y = G.seat[1] + 6 * U; items.push({ y, f: () => springStone(g, x, y, c, PX) }); });
  // vignettes (Near only)
  if (band === 'near' && !unexp && VG && !reduced) items.push({ y: VG.y, f: () => vignette(g, VG.kind, VG.x, VG.y, PX, rngFor('vig:' + VG.seed)) });
  if (opt.stats) { const n = items.length + (HERO ? 2 : 0); Object.assign(opt.stats, { items: n, clumps: items.filter((q) => q.clump).length, crowns: items.reduce((a, q) => a + (q.clump ?? 0), 0), ranges: items.filter((q) => q.range).length, rangeParts: items.reduce((a, q) => a + (q.range ?? 0), 0) }); }
  if (st && !IO) settlementItemsP(g, i, st, band, items, PX, look, lvl);
  if (unexp && !IO) items.push({ y: G.seat[1], f: () => hutOutline(g, G.seat[0], G.seat[1], PX, lineCol) });
  items.sort((a, b) => a.y - b.y);
  if (!IO) for (const it of items) if (it.sh) it.sh();
  for (const it of items) it.f();
}
// palette-ab critique fix 4 (Painted only): a passable peak's shade face is the Mountains fill - 26 L* toward the cool shadow (lit: faces().lit)
function peakShade26(f) { let v = FACEMEMO.get('m26' + f); if (!v) { v = mix(shadeL(f, -26), '#3A4466', 0.14); FACEMEMO.set('m26' + f, v); } return v; }
function stampItemP(g, i, p, s, band, P, o) {
  const R = rngFor(`stamp:${p.i}:${s.x | 0}:${s.y | 0}`), far = band === 'far', sc = far ? 1.8 : 1;
  const viaV2 = (w) => ({ y: s.y, sh: P.line ? null : () => castShadow(g, s.x, s.y, w), f: () => stampFor(g, p, s, band, P, o) });
  switch (p.terrain) {
    case 'forest': { // Far: canopy masses of six crowns at r 15 u; fog line art
      const crowns = makeClump(s.x, s.y, far ? 6 : 3, R, o.conRate, far ? [13, 16] : [4, 5.5]);
      return { y: s.y, sh: P.line ? null : () => castShadow(g, s.x, s.y, far ? 40 * U : 12 * U), f: () => drawClump(g, crowns, P) };
    }
    case 'hills': { // v3 critique 4 and 5: a range of 2 to 4 humps; no cast shadow (hills are ground forms; the hachures carry the shade)
      const hr = hillsRange(i, s, far), art = artFor('relief'); return { y: hr.box[3], range: hr.list.length, f: () => hillRange(g, hr.list, P, hr.R, art && art.hills) };
    }
    case 'mountains': { // v3 critique 4: a range of 3 to 5 passable peaks (each 0.75 of its base tall, Chaikin-rounded)
      const m = mountainRange(i, s, far), art = artFor('relief');
      if (art && art.peaks && !P.line) return { y: m.box[3], range: m.list.length, f: () => { for (const q of m.list) drawArtFrame(g, art.peaks, q.x, q.y, q.w * 1.1, (q.x * 7 + q.y * 13) | 0); } };
      const cols = PAINTED_PAL() ? { lit: faces(P.fill).lit, shade: peakShade26(P.fill), ink: INK, lw: P.lw } : { lit: '#B4C1C6', shade: '#6E7F86', ink: INK, lw: P.lw }; // palette-ab critique fix 4 (Painted only)
      return { y: m.box[3], range: m.list.length, sh: P.line ? null : () => { g.fillStyle = SHADOW; g.beginPath(); for (const q of m.list) { const w2 = q.w * 0.8; g.moveTo(q.x + 0.25 * w2 + 0.6 * w2, q.y + 0.4 * U); g.ellipse(q.x + 0.25 * w2, q.y + 0.4 * U, 0.6 * w2, 0.22 * w2, -10 * Math.PI / 180, 0, Math.PI * 2); } g.fill(); }, f: () => { for (const q of m.geoms) peakPaint(g, q, cols, P, P.line); } };
    }
    case 'farmland': {
      if (far) return viaV2(0);
      const n = 2 + (R() < 0.5 ? 1 : 0), ang = [0, Math.PI / 2, Math.PI / 6, -Math.PI / 6][Math.floor(rngFor(`furrow:${i}`)() * 4)];
      return { y: s.y, sh: P.line ? null : () => castShadow(g, s.x, s.y, n * 3.2 * U), f: () => sheafRow(g, s.x, s.y, P, n, ang, P.line) };
    }
    case 'plains': {
      if (far) return viaV2(0);
      if (s.v < 0.18) { const c = makeClump(s.x, s.y, 2 + Math.floor(R() * 3), R, 0.1); if (o.blossom) c[0].blossom = true; const by = Math.max(...c.map((q) => q.y)); return { y: by, sh: P.line ? null : () => castShadow(g, s.x, by, 3 * c[0].r), f: () => drawClump(g, c, plainsTreeP(P)) }; } // v3 critique 10: a copse of 2 to 4
      if (s.v > 0.94) return { y: s.y, sh: P.line ? null : () => castShadow(g, s.x, s.y, 2.6 * U), f: () => sheaf(g, s.x, s.y, P, P.line) };
      return viaV2(0);
    }
    case 'wasteland': return { y: s.y, sh: P.line || s.v > 0.65 ? null : () => castShadow(g, s.x, s.y, 5 * U), f: () => stampFor(g, p, s, band, P, { ...o, noSkull: true }) };
    default: return viaV2(0);
  }
}
function settlementItemsP(g, i, st, band, items, PX, look, lvl) {
  const p = prov[i], kit = st.kit;
  if (band === 'far') { // a capital reads as a city from the table's edge: the keep, three roofs of its kit and the pennant
    if (p.cap) { for (const h of st.houses.slice(0, 3)) items.push({ y: h.y, sh: () => castShadow(g, h.x, h.y, 7 * HSC), f: () => house(g, h, kit, PX, {}) }); items.push({ y: st.sy + 0.5, f: () => landmark(g, 'keep', kit, st.sx, st.sy, PX) }); if (p.owner) items.push({ y: 1e9, f: () => pennant(g, st.sx, st.sy - 17 * LS, BAN[p.owner], PX) }); }
    else if (st.tier >= 2) items.push({ y: st.sy, sh: () => castShadow(g, st.sx, st.sy, 14 * HSC), f: () => { for (const h of st.houses.slice(0, 3)) house(g, h, kit, PX, {}); } });
    return;
  }
  const before = items.length; settlementItems(g, i, st, band, items, PX, look, lvl);
  for (let k = before; k < items.length; k++) { const it = items[k]; if (it.house) it.sh = () => castShadow(g, it.house.x, it.house.y, 7 * HSC); }
}
function drawStateOverlay(g, band) { // live (H10): haze, the out-of-sight grey and the land-look wash; a pending paint bake shows its live fill
  if (!PAINTED() || state.mode !== 'ownership' || decoAlpha < 0.001) return;
  g.globalAlpha = decoAlpha;
  for (const p of provs) {
    const G = geo(p.i); if (G.bb[2] < VW[0] || G.bb[0] > VW[2] || G.bb[3] < VW[1] || G.bb[1] > VW[3]) continue;
    const f = TERRAIN[p.terrain].fill, fog = fogOf(p.i), sp = SPR.get(band + ':' + p.i) ?? null, pend = sp && sp.key.split('|')[0] !== KEYS[p.i].split('|')[0];
    let col = null;
    if (pend) col = ownFill(p);
    else if (fog === 'unexplored') col = 'rgba(232,220,194,.04)';
    else if (fog === 'outofsight') col = rgba(greyEqL(f), 0.1);
    else if (p.dom.n) col = rgba(p.dom.n === 'red' ? '#8F8C88' : '#5E7F45', ((p.dom.n === 'red' ? 0.1 : 0.06) * p.dom.s) / 10);
    if (!col) continue; pathPoly(g, npolyLite(p.i)); g.fillStyle = col; g.fill();
  }
  g.globalAlpha = 1;
}
const GREYMEMO = new Map();
function greyEqL(f) { let v = GREYMEMO.get(f); if (!v) { const L = rgb2lab(hex2rgb(f))[0]; v = rgb2hex(lab2rgb([L, 0, 0])); GREYMEMO.set(f, v); } return v; }
function ownFill(p) { // v2's Ownership fill: haze, the out-of-sight desaturation or the land-look mix
  const fog = fogOf(p.i), f = TERRAIN[p.terrain].fill;
  if (fog === 'unexplored') return mix(f, '#E8DCC2', 0.04);
  if (fog === 'outofsight') return desat(f, 0.1);
  if (!p.dom.n) return f;
  return mix(f, p.dom.n === 'red' ? '#8F8C88' : '#5E7F45', ((p.dom.n === 'red' ? 0.1 : 0.06) * p.dom.s) / 10);
}

function rectUnion(rs) { // disjoint rectangles covering the union of rs (slab decomposition), so an even-odd clip can cut them all out
  const ys = [...new Set(rs.flatMap((r) => [r[1], r[3]]))].sort((a, b) => a - b), out = [];
  for (let k = 0; k < ys.length - 1; k++) {
    const y0 = ys[k], y1 = ys[k + 1], iv = rs.filter((r) => r[1] <= y0 && r[3] >= y1).map((r) => [r[0], r[2]]).sort((a, b) => a[0] - b[0]);
    let cur = null; for (const v of iv) { if (cur && v[0] <= cur[1]) cur[1] = Math.max(cur[1], v[1]); else { if (cur) out.push([cur[0], y0, cur[1], y1]); cur = [...v]; } } if (cur) out.push([cur[0], y0, cur[1], y1]);
  }
  return out;
}

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

// ================================================================== v4: the relief map (visual-v4/map-design-final.md). Map look: Relief (default) | Painted (v3)
// The cloth becomes a terrain model on the oak table: one bake per map (albedo through a seeded lookup warp, relief with its own wider
// blend, mean-neutral hillshade, ground detail, wilds in relief), live layers over it (glow, fog, modes, hover), vector rails and water,
// miniatures on bases, labels by zoom band. Nothing here calls Math.random or Date: every draw is seeded from the map seed.
// Natural view (visual-v4/natural/design-final.md): the land has two looks of one model. Natural (default) is a muted landscape that blends across
// borders (p58n covers, p58m materials); Clear is the v4 colour-blind-safe bake (p58c), shown by the Clear terrain colours setting and the Terrain mode.
// This file: constants, the seeded noise, the blur and colour helpers. p58b: the shared rasters; p58c: the Clear colour pass; p58d: wilds, water, the scheduler.
const RELIEF = () => view.look === 'relief';
const RLD = MED_DIAM, RLK = MED_DIAM / 90; // D, and mockup units per mapgen unit (the design's numbers are mapgen units, D = 90)
const RL_T = ['plains', 'farmland', 'forest', 'hills', 'mountains', 'swamp', 'wasteland']; // terrain index order; 7 peaks, 8 mere, 255 off
const RL_TI = Object.fromEntries(RL_T.map((t, k) => [t, k]));
const RL_ALB = { plains: '#78894A', farmland: '#D5B16B', forest: '#1A3819', hills: '#6D5303', mountains: '#859BB8', swamp: '#38616D', wasteland: '#877773' }; // §4.1
const RL_CAP = { plains: 4, farmland: 4, forest: 6, hills: 9, mountains: 16, swamp: 3, wasteland: 6 }; // §3.3 swing caps, L*
// Shade gain per terrain (RL_T order), blended across ecotones like the heights: tanh(3.2 g (s - sin 40)) under the same caps, so the low land's
// gentle slopes reach a third of their swing cap in the core (§3.2, §13) and the relief, not the mottle, carries the lightness budget (critique fix 3)
const RL_SHG = [2.6, 3.6, 1.4, 1.0, 1.0, 2.2, 1.2]; // plains, farmland, forest, hills, mountains, swamp, wasteland
const RL_HT = { swamp: [0.03, 0.04, 60], farmland: [0.08, 0.075, 60], plains: [0.10, 0.15, 60], forest: [0.14, 0.175, 45], wasteland: [0.18, 0.25, 40], hills: [0.28, 0.30, 30], mountains: [0.48, 0.62, 22] }; // §3.2 base, amplitude, feature (mapgen units)
const RL_KEYFOR = { plains: '#1C1A17', farmland: '#1C1A17', forest: '#F4EEDF', hills: '#F4EEDF', mountains: '#1C1A17', swamp: '#F4EEDF', wasteland: '#1C1A17' }; // keylineFor(albedo), §4.1
// (RL_HAIRA, the per-terrain hairline alpha keyed to the Clear albedo, is superseded by the line rule of natural §8.2: one keyline per edge, solved on the ground under it; p59b)
const RL_WASH = { red: ['#8F8C88', 0.1], green: ['#5E7F45', 0.06] }; // the land looks' wash colors and caps at strength 10 (ash 10%, moss 6%; §4.2)
const RL_C = { water: '#50AF9B', granite: '#2A292C', graniteLit: '#8A857E', snow: '#F2EEE6', mere: '#24222A', mereBank: '#3A3640', ripple: '#8FC3D3', lip: '#E9E4D8', cliffTop: '#3A3436', cliffFoot: '#221E20', plinth: '#2B231C', contact: '#1C1A17', brass: '#B8914A', fall: '#B9D3CF', waterNat: '#14615B', gesso: '#E8DCC2', base: '#1E1B18', baseLip: '#B8B1A4', pewter: '#91A092', keyLight: '#F4EEDF', keyDark: '#1C1A17' };
// Presentation numbers (V16: docs/09-balance "Map presentation"; one place, read by the checks). Lengths in D or in mapgen units (x RLK).
const RL_P = {
  bakeW: 2048, bakeH: 1280, warpD: 0.10, warpF1: 40, warpF2: 9, albBlur: 1.1, hSigmaD: 0.12, vScale: 26, litCap: 0.6, elev: 40, azimuth: 315,
  castD: 0.25, castSteps: 16, castL: 6, valleyL: 4, meanBudget: 0.5, meanSpreadD: 0.03, meanIters: 3, octaves: 5, lacunarity: 2.03, gain: 0.5, hGain: 0.42, featK: 1.5, // featK: the height features x 1.5 (larger landforms) // hGain: the heights' fBm gain (the design's 0.5 let the fine octaves own the hillshade)
  glow: 0.35, glowD: 0.05, glowPow: 1.6, coreD: 0.06, hover: 0.25, select: 0.30, indepHover: 0.20, indepSelect: 0.25, hairline: 0.70, hemPeak: 0.12, haze: 0.04, outSat: 0.10, realmTint: 0.08,
  face: 48, faceShown: 37, plinth: 3, strata: 6, crag: 10, cragShown: 8, bank: 4, cornerD: 0.22, shadowD: 0.05, shadowBlurD: 0.06, shadowA: 0.55, plaqueD: 0.9,
  modeRelief: 3, lakeMax: 0.08, pondMax: 0.02, waterClearD: 0.10, townStep: 4, townPD: 5,
  hamletDpx: 100, hamletFadePx: 130, guardDpx: 300, guardMax: 2, townMaxPx: 96, townHouseK: 0.14, townHouseMax: 16, // fix 4: hamlets and huts from 100 px a province (fading in to 130); fix 7: guards from 300 px, at most 2; fix 8: town ceiling and house size
  plaqueH: 11.3, // the plaque keeps its height on the taller face (mapgen units)
  // natural §8.3: fog per look. Natural: unexplored 6% haze then 40% desaturation (hem to 12%), out of sight 25%; Clear and the Terrain mode: the approved 4% and 10%
  fog: { natural: { haze: 0.06, unexSat: 0.40, outSat: 0.25, hemPeak: 0.12 }, clear: { haze: 0.04, unexSat: 0, outSat: 0.10, hemPeak: 0.12 } },
  // natural §8.2: the line rule (segments 0.1 D; hairline 2.45:1 at coverage 0.75 against p10 and p90, alpha cap 0.92; partner 1.5 px at 0.8; internal 3.3:1 at coverage 1, 2.5 px below ratio 1.5)
  line: { q: 0.05, segD: 0.1, hair: 2.45, hairCov: 0.8, hairCap: 0.92, partnerA: 1, internal: 3.3, intW1: 2.5, sidePx: 3, hairW1: 2, partnerW1: 2, pairW1: [1.5, 1.5] }, // below ratio 1.5 the hairline and its partner are 2 px: a 1.5 px line at 45 degrees leaves no pixel over 0.56 coverage (the reason the rail's banner is 2 px)
  seatMute: { mid: 2.3, near: 3.6 }, startDpx: 96, // natural §10: hamlets muted per house (2.3:1 Mid, 3.6:1 Near); the start view at least 96 px a province
};
// natural §6: the look of the land. Natural by default; Clear with Settings → Accessibility → Terrain colours: Clear (?terrain=clear) and in the Terrain mode.
view.terrain = new URLSearchParams(location.search).get('terrain') === 'clear' ? 'clear' : 'natural';
const rlLandLook = () => (state.mode === 'terrain' || view.terrain === 'clear' ? 'clear' : 'natural'); // the look the land should show
const rlShownLook = () => { const w = rlLandLook(); if (!RB.ready || rlLookReady(w)) return w; return rlLookReady('natural') ? 'natural' : 'clear'; }; // the ready look stays while the other is prepared
const RL_FOG = () => RL_P.fog[rlShownLook()]; // the fog of the look on screen
const RL_FACE = RL_P.faceShown * RLK; // the cliff as shown in the 40 degree oblique (48 units tall, 37 shown; critique fix 9, the design's §2.2 had 24 and 18)
const RL_PLINTH = RL_P.plinth * RLK * 0.77;
const RL_RC = RL_P.cornerD * RLD; // the model is mapgen's rounded rectangle
const MODEL_BOX = [0, 0, W, H + RL_FACE];
function inModel(x, y) { // inside the land's rounded rectangle
  if (x < 0 || y < 0 || x > W || y > H) return false;
  const cx = x < RL_RC ? RL_RC : x > W - RL_RC ? W - RL_RC : x, cy = y < RL_RC ? RL_RC : y > H - RL_RC ? H - RL_RC : y;
  return (x - cx) ** 2 + (y - cy) ** 2 <= RL_RC * RL_RC;
}
function modelPath(g) { g.beginPath(); g.roundRect(0, 0, W, H, RL_RC); }
const RL_L = (() => { const r = {}; for (const t of RL_T) r[t] = rgb2lab(hex2rgb(RL_ALB[t])); return r; })();
// tanh by a rational approximation (the rule-bearing rasters use arithmetic, sqrt and floor only; V13, review item 34)
const rlTanh = (x) => { if (x > 4.97) return 1; if (x < -4.97) return -1; const x2 = x * x; return (x * (135135 + x2 * (17325 + x2 * (378 + x2)))) / (135135 + x2 * (62370 + x2 * (3150 + x2 * 28))); };
const rlLum = (c) => 0.2126 * s2l(c[0]) + 0.7152 * s2l(c[1]) + 0.0722 * s2l(c[2]);
const rlWcag = (a, b) => { const la = rlLum(a), lb = rlLum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); }; // WCAG contrast of two sRGB triples
const rlSmooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---- seeded value noise: one 256 x 256 table per purpose (V13: presentation streams keyed relief:<seed>:<purpose>, never state.rng)
const RL_TABLES = new Map();
function rlTable(purpose) {
  let t = RL_TABLES.get(purpose); if (t) return t;
  const R = rngFor(`relief:${MAP_SEED}:${purpose}`); t = new Float32Array(65536); for (let k = 0; k < 65536; k++) t[k] = R() * 2 - 1;
  RL_TABLES.set(purpose, t); return t;
}
function rlVN(T, x, y) { // value noise on the unit lattice, smoothstep interpolation, in [-1, 1]
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const x0 = ix & 255, x1 = (ix + 1) & 255, y0 = (iy & 255) << 8, y1 = ((iy + 1) & 255) << 8;
  const a = T[y0 | x0], b = T[y0 | x1], c = T[y1 | x0], d = T[y1 | x1];
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}
// gradient noise for the heights (value noise creases along its lattice): a seeded permutation and unit gradients made with sqrt only
const RL_GTABLES = new Map();
function rlGTable(purpose) {
  let t = RL_GTABLES.get(purpose); if (t) return t;
  const R = rngFor(`relief:${MAP_SEED}:g:${purpose}`), perm = new Uint8Array(512), gx = new Float32Array(256), gy = new Float32Array(256), p = [...Array(256).keys()];
  for (let k = 255; k > 0; k--) { const j = Math.floor(R() * (k + 1)); [p[k], p[j]] = [p[j], p[k]]; }
  for (let k = 0; k < 512; k++) perm[k] = p[k & 255];
  for (let k = 0; k < 256; k++) { let x, y, l; do { x = R() * 2 - 1; y = R() * 2 - 1; l = x * x + y * y; } while (l > 1 || l < 0.05); l = Math.sqrt(l); gx[k] = x / l; gy[k] = y / l; }
  t = { perm, gx, gy }; RL_GTABLES.set(purpose, t); return t;
}
function rlGN(G, x, y) { // 2D gradient noise, quintic fade, about [-1, 1]
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, X = ix & 255, Y = iy & 255, P = G.perm;
  const a = P[P[X] + Y], b = P[P[X + 1] + Y], c = P[P[X] + Y + 1], d = P[P[X + 1] + Y + 1];
  const u = fx * fx * fx * (fx * (fx * 6 - 15) + 10), v = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
  const na = G.gx[a] * fx + G.gy[a] * fy, nb = G.gx[b] * (fx - 1) + G.gy[b] * fy, nc = G.gx[c] * fx + G.gy[c] * (fy - 1), nd = G.gx[d] * (fx - 1) + G.gy[d] * (fy - 1);
  return 1.45 * (na + (nb - na) * u + (nc - na) * v + (na - nb - nc + nd) * u * v);
}
function rlGFbm(G, x, y, oct, gain) { let s = 0, amp = 1, f = 1, norm = 0; for (let k = 0; k < oct; k++) { s += amp * rlGN(G, x * f + k * 19.17, y * f + k * 47.53); norm += amp; amp *= gain; f *= RL_P.lacunarity; } const v = (s / norm) * 1.5; return v > 1 ? 1 : v < -1 ? -1 : v; }
function rlFbm(T, x, y, oct, gain = RL_P.gain) { // fBm, lacunarity 2.03; each octave offset in the table; scaled so p95 |n| is about 0.9
  let s = 0, amp = 1, f = 1, norm = 0;
  for (let k = 0; k < oct; k++) { s += amp * rlVN(T, x * f + k * 37.31, y * f + k * 91.17); norm += amp; amp *= gain; f *= RL_P.lacunarity; }
  const v = (s / norm) * 1.75; return v > 1 ? 1 : v < -1 ? -1 : v;
}
function rlRidged(G, x, y, oct, warp) { // ridged multifractal on gradient noise (sharp crests, smooth valleys), domain-warped so crests meander; about [-1, 1]
  if (warp) { const wx = rlGN(G, x * 0.43 + 17.3, y * 0.43 + 5.1), wy = rlGN(G, x * 0.43 + 61.7, y * 0.43 + 29.9); x += warp * wx; y += warp * wy; }
  let s = 0, amp = 1, f = 1, w = 1, norm = 0;
  for (let k = 0; k < oct; k++) { let n = 1 - Math.abs(rlGN(G, x * f + k * 37.31, y * f + k * 91.17)); n *= n; n *= w; w = Math.min(1, n * 1.6); s += n * amp; norm += amp; amp *= 0.45; f *= RL_P.lacunarity; }
  return Math.max(-1, Math.min(1, (s / norm) * 2.4 - 1.0));
}

// ---- box blur helpers on Float32 planes (separable running sums; edges renormalized)
function rlBoxBlur(src, w, h, r, passes, mask) { // mask: optional Float32 weights (blur value*mask and mask, divide); returns a new plane
  let a = Float32Array.from(src), m = mask ? Float32Array.from(mask) : null; const tmp = new Float32Array(w * h), tmpm = m ? new Float32Array(w * h) : null;
  if (m) for (let k = 0; k < a.length; k++) a[k] *= m[k];
  const run = (S, D, n, stride, count, step) => { // blur `count` lines of length n
    for (let l = 0; l < count; l++) {
      const o = l * step; let acc = 0, cnt = 0;
      for (let k = 0; k <= r && k < n; k++) { acc += S[o + k * stride]; cnt++; }
      for (let k = 0; k < n; k++) {
        D[o + k * stride] = acc / cnt;
        const add = k + r + 1, rem = k - r; if (add < n) { acc += S[o + add * stride]; cnt++; } if (rem >= 0) { acc -= S[o + rem * stride]; cnt--; }
      }
    }
  };
  for (let p = 0; p < passes; p++) {
    run(a, tmp, w, 1, h, w); run(tmp, a, h, w, w, 1);
    if (m) { run(m, tmpm, w, 1, h, w); run(tmpm, m, h, w, w, 1); }
  }
  if (m) for (let k = 0; k < a.length; k++) a[k] = m[k] > 1e-6 ? a[k] / m[k] : 0;
  return a;
}
function rlBilin(P, w, h, x, y) { // bilinear sample of a plane at fractional texel coordinates (texel centers at k + 0.5)
  x -= 0.5; y -= 0.5; if (x < 0) x = 0; if (y < 0) y = 0; if (x > w - 1) x = w - 1; if (y > h - 1) y = h - 1;
  const ix = x | 0, iy = y | 0, fx = x - ix, fy = y - iy, ix1 = ix + 1 < w ? ix + 1 : ix, iy1 = iy + 1 < h ? iy + 1 : iy;
  const a = P[iy * w + ix], b = P[iy * w + ix1], c = P[iy1 * w + ix], d = P[iy1 * w + ix1];
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}
const RL_GAMMA = (() => { const n = 4096, t = new Uint8ClampedArray(n + 1); for (let k = 0; k <= n; k++) { const c = k / n; t[k] = Math.round(255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)); } return t; })();
function rlLabTo(L, a, b, d, o) { // CIELAB (D65) to sRGB bytes at d[o..o+2]
  const fy = (L + 16) / 116, fx = fy + a / 500, fz = fy - b / 200;
  const X = (fx > 0.2068966 ? fx * fx * fx : (fx - 16 / 116) / 7.787) * 0.95047, Y = fy > 0.2068966 ? fy * fy * fy : (fy - 16 / 116) / 7.787, Z = (fz > 0.2068966 ? fz * fz * fz : (fz - 16 / 116) / 7.787) * 1.08883;
  let r = 3.2406 * X - 1.5372 * Y - 0.4986 * Z, g = -0.9689 * X + 1.8758 * Y + 0.0415 * Z, bb = 0.0557 * X - 0.204 * Y + 1.057 * Z;
  r = r < 0 ? 0 : r > 1 ? 1 : r; g = g < 0 ? 0 : g > 1 ? 1 : g; bb = bb < 0 ? 0 : bb > 1 ? 1 : bb;
  d[o] = RL_GAMMA[(r * 4096 + 0.5) | 0]; d[o + 1] = RL_GAMMA[(g * 4096 + 0.5) | 0]; d[o + 2] = RL_GAMMA[(bb * 4096 + 0.5) | 0];
}

// ---- the wild outlines (straight edges against non-wild cells) and the light
const RL_WILDK = new Uint8Array(N); for (const w of WILDS) for (const c of w.cells) RL_WILDK[c] = w.kind === 'peaks' ? 7 : 8;
const RL_LIGHT = (() => { const el = (RL_P.elev * Math.PI) / 180, az = (RL_P.azimuth * Math.PI) / 180; // azimuth 315: from the upper left of the screen
  return [Math.sin(az) * Math.cos(el), -Math.cos(az) * Math.cos(el), Math.sin(el)]; })(); // [-0.54, -0.54, 0.64]
const RL_SIN_EL = Math.sin((RL_P.elev * Math.PI) / 180), RL_TAN_EL = Math.tan((RL_P.elev * Math.PI) / 180);
function rlWildOutline(w) { const out = []; for (const c of w.cells) for (const j of NB[c]) { if (w.cells.includes(j)) continue; const e = edgeBetween(c, j); if (e) out.push({ a: e.a, b: e.b, c, j }); } return out; }
// the mountains' micro-relief (lightness only, in [-1, 1]; rock at 7-unit features), shared by the Clear detail and the granite
let RL_TMR = null; const rlMicro = (x, y) => { const T = (RL_TMR ??= rlGTable('micro:mountains')), mE = 0.7 * RLK, f = (u, v) => rlRidged(T, u / (7 * RLK), v / (7 * RLK), 2, 0.2), t = (f(x + mE, y + mE) - f(x - mE, y - mE)) * 2.2; return t > 1 ? 1 : t < -1 ? -1 : t; };
// which keyline (light #F4EEDF or dark #1C1A17) contrasts more with a colour (keylineFor; natural §8.4 keys independents' hover to the natural core)
const rlKeyFor = (rgb) => (rlWcag(rgb, hex2rgb(RL_C.keyLight)) >= rlWcag(rgb, hex2rgb(RL_C.keyDark)) ? RL_C.keyLight : RL_C.keyDark);
function rlSegDist(px, py, ax, ay, bx, by) { const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1; let t = ((px - ax) * dx + (py - ay) * dy) / l2; t = t < 0 ? 0 : t > 1 ? 1 : t; const ex = px - ax - t * dx, ey = py - ay - t * dy; return Math.sqrt(ex * ex + ey * ey); }


// ------------------------------------------------------------------ v4 relief: the shared rasters (natural N1: both looks of the land come from these)
// RB holds every raster the live layers, the checks and the water placement read; RB.L[look] holds each look's colour bake (Natural, Clear), made lazily.
const RB = { ready: false, running: false, ver: 0, lookVer: 0, t: {}, total: 0, slices: 0, wall: 0, L: { natural: null, clear: null }, lookRunning: null };
function* rlSharedGen(out) {
  const BW = RL_P.bakeW, BH = RL_P.bakeH, TX = BW / W, NP = BW * BH, HW = BW >> 1, HH = BH >> 1, QW = BW >> 2, QH = BH >> 2;
  const tm = out.t = {}; let t = performance.now(); const lap = (k) => { const n = performance.now(); tm[k] = +((tm[k] ?? 0) + n - t).toFixed(1); t = n; };
  out.BW = BW; out.BH = BH; out.TX = TX; out.HW = HW; out.HH = HH; out.QW = QW; out.QH = QH;
  // S1: the province id raster (convex cells by scanline, texel centers), off the model 255; the land mask's rounded corners
  const id = new Uint8Array(NP).fill(255);
  for (let i = 0; i < N; i++) {
    const poly = cells[i]; let y0 = Infinity, y1 = -Infinity; for (const q of poly) { y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
    const ty0 = Math.max(0, Math.floor(y0 * TX - 0.5)), ty1 = Math.min(BH - 1, Math.ceil(y1 * TX));
    for (let ty = ty0; ty <= ty1; ty++) {
      const wy = (ty + 0.5) / TX; let xa = Infinity, xb = -Infinity;
      for (let k = 0; k < poly.length - 1; k++) { const p = poly[k], q = poly[k + 1]; if ((p[1] - wy) * (q[1] - wy) > 0 || p[1] === q[1]) continue; const x = p[0] + ((wy - p[1]) * (q[0] - p[0])) / (q[1] - p[1]); if (x < xa) xa = x; if (x > xb) xb = x; }
      if (xb < xa) continue; const tx0 = Math.max(0, Math.ceil(xa * TX - 0.5)), tx1 = Math.min(BW - 1, Math.ceil(xb * TX - 0.5) - 1);
      for (let tx = tx0; tx <= tx1; tx++) id[ty * BW + tx] = i;
    }
  }
  for (let ty = 0, k = 0; ty < BH; ty++) for (let tx = 0; tx < BW; tx++, k++) { // gaps on shared edges, then the rounded corners
    const x = (tx + 0.5) / TX, y = (ty + 0.5) / TX;
    if (id[k] === 255) id[k] = nearest(x, y);
    if (!inModel(x, y)) id[k] = 255;
  }
  out.id = id; yield; lap('idRaster');
  // S2: the lookup warp (|w| <= 0.10 D; features 40 and 9 mapgen units at 0.7 and 0.3), at quarter resolution, then the lookup
  const Wm = RL_P.warpD * RLD, F1 = RL_P.warpF1 * RLK, F2 = RL_P.warpF2 * RLK, TW1 = rlTable('warp:x1'), TW2 = rlTable('warp:x2'), TW3 = rlTable('warp:y1'), TW4 = rlTable('warp:y2');
  const wqx = new Float32Array(QW * QH), wqy = new Float32Array(QW * QH);
  for (let qy = 0, k = 0; qy < QH; qy++) for (let qx = 0; qx < QW; qx++, k++) {
    const x = ((qx + 0.5) * 4) / TX, y = ((qy + 0.5) * 4) / TX;
    let vx = 0.7 * rlVN(TW1, x / F1, y / F1) + 0.3 * rlVN(TW2, x / F2, y / F2), vy = 0.7 * rlVN(TW3, x / F1, y / F1) + 0.3 * rlVN(TW4, x / F2, y / F2);
    vx *= 1.7 * Wm; vy *= 1.7 * Wm; const m = Math.sqrt(vx * vx + vy * vy); if (m > Wm) { vx *= Wm / m; vy *= Wm / m; }
    wqx[k] = vx; wqy[k] = vy;
  }
  const LT = new Uint8Array(NP), LP = new Uint8Array(NP);
  const own = new Float64Array(N), tot = new Float64Array(N);
  for (let ty = 0, k = 0; ty < BH; ty++) for (let tx = 0; tx < BW; tx++, k++) {
    const o = id[k]; if (o === 255) { LT[k] = 255; LP[k] = 255; continue; }
    if (RL_WILDK[o]) { LT[k] = RL_WILDK[o]; LP[k] = o; continue; }
    const fxq = (tx + 0.5) / 4, fyq = (ty + 0.5) / 4, dx = rlBilin(wqx, QW, QH, fxq, fyq), dy = rlBilin(wqy, QW, QH, fxq, fyq);
    let sx = Math.floor(tx + dx * TX), sy = Math.floor(ty + dy * TX); sx = sx < 0 ? 0 : sx >= BW ? BW - 1 : sx; sy = sy < 0 ? 0 : sy >= BH ? BH - 1 : sy;
    let tid = id[sy * BW + sx]; if (tid === 255 || RL_WILDK[tid]) tid = o;
    LP[k] = tid; LT[k] = RL_TI[terr[tid]];
    tot[o]++; if (terr[tid] === terr[o]) own[o]++;
  }
  out.LT = LT; out.LP = LP; out.ownShare = provList.map((i) => ({ i, share: tot[i] ? own[i] / tot[i] : 1 }));
  yield; lap('warpLookup');
  // S3: height weights: the warped one-hot at quarter resolution, Gaussian sigma 0.12 D (three box passes); wilds excluded from the land blend
  const sigQ = (RL_P.hSigmaD * RLD * TX) / 4, rq = Math.max(1, Math.round((Math.sqrt((12 * sigQ * sigQ) / 3 + 1) - 1) / 2));
  const wch = [];
  for (let c = 0; c < 8; c++) { // 0..6 land terrains, 7 peaks (for foothills); kept (out.wch): the natural ground blend is these weights (natural §3.1)
    const P = new Float32Array(QW * QH);
    for (let qy = 0, k = 0; qy < QH; qy++) for (let qx = 0; qx < QW; qx++, k++) { const v = LT[(qy * 4 + 2) * BW + qx * 4 + 2]; P[k] = v === c ? 1 : 0; }
    wch.push(rlBoxBlur(P, QW, QH, rq, 3)); if (c % 3 === 2) yield;
  }
  out.wch = wch; lap('heightWeights');
  // S4: the heightfield at half resolution: sum_t w_t (B_t + A_t n_t), mountains ridged, the canopy +0.04, foothills toward the peaks,
  // passable land soft-clamped under 1.00; wild peaks a dome plus ridged noise, never under 1.10; meres flat at -0.05 (§3.2)
  const hh = new Float32Array(HW * HH), HG = new Float32Array(HW * HH).fill(1), hid = new Uint8Array(HW * HH), hLT = new Uint8Array(HW * HH); // HG: the shade gain, blended by the height weights
  for (let y = 0, k = 0; y < HH; y++) for (let x = 0; x < HW; x++, k++) { const fk = (y * 2 + 1) * BW + x * 2 + 1; hid[k] = id[fk]; hLT[k] = LT[fk]; }
  const tabs = RL_T.map((tn) => rlGTable('height:' + tn)), feat = RL_T.map((tn) => RL_HT[tn][2] * RLK * RL_P.featK);
  const wdist = new Float32Array(HW * HH); // distance into a wild from its outline (half res; wild texels only)
  for (const w of WILDS) {
    const ol = rlWildOutline(w); let bb = [Infinity, Infinity, -Infinity, -Infinity]; for (const c of w.cells) { const b = bboxOf(cells[c]); bb = [Math.min(bb[0], b[0]), Math.min(bb[1], b[1]), Math.max(bb[2], b[2]), Math.max(bb[3], b[3])]; }
    const set = new Set(w.cells);
    for (let y = Math.max(0, Math.floor(bb[1] * TX / 2)); y <= Math.min(HH - 1, Math.ceil(bb[3] * TX / 2)); y++) for (let x = Math.max(0, Math.floor(bb[0] * TX / 2)); x <= Math.min(HW - 1, Math.ceil(bb[2] * TX / 2)); x++) {
      const k = y * HW + x; if (!set.has(hid[k])) continue; const px = ((x + 0.5) * 2) / TX, py = ((y + 0.5) * 2) / TX; let d = Infinity;
      for (const e of ol) { const v = rlSegDist(px, py, e.a[0], e.a[1], e.b[0], e.b[1]); if (v < d) d = v; } wdist[k] = d;
    }
  }
  const TR = rlGTable('wild:ridge'), VS = RL_P.vScale * RLK;
  for (let y = 0, k = 0; y < HH; y++) {
    for (let x = 0; x < HW; x++, k++) {
      const o = hid[k], lt = hLT[k], px = ((x + 0.5) * 2) / TX, py = ((y + 0.5) * 2) / TX;
      if (o === 255) { hh[k] = 0; continue; }
      if (lt === 7) { const dome = Math.pow(Math.min(1, wdist[k] / (0.30 * RLD)), 0.75), r = rlRidged(TR, px / (34 * RLK), py / (34 * RLK), 4, 0.6); hh[k] = Math.max(1.10, 1.25 + 0.60 * dome + 0.28 * r * (0.35 + 0.65 * dome)); continue; }
      if (lt === 8) { hh[k] = -0.05; continue; }
      const fq = (x + 0.5) / 2, gq = (y + 0.5) / 2; let ws = 0; const wv = [0, 0, 0, 0, 0, 0, 0];
      for (let c = 0; c < 7; c++) { const v = rlBilin(wch[c], QW, QH, fq, gq); wv[c] = v; ws += v; }
      if (ws < 1e-4) { wv[lt] = 1; ws = 1; }
      { let gs = 0; for (let c = 0; c < 7; c++) gs += (wv[c] / ws) * RL_SHG[c]; HG[k] = gs; }
      let h = 0;
      for (let c = 0; c < 7; c++) {
        const wt = wv[c] / ws; if (wt < 0.003) continue; const tn = RL_T[c], [Bt, At] = RL_HT[tn];
        const n = tn === 'mountains' ? rlRidged(tabs[c], px / feat[c], py / feat[c], 4, 0.3) : rlGFbm(tabs[c], px / feat[c], py / feat[c], tn === 'hills' ? 3 : RL_P.octaves, RL_P.hGain);
        h += wt * (Bt + At * n);
        if (tn === 'forest') h += wt * 0.04; // the canopy (§3.5)
      }
      h += 0.30 * rlBilin(wch[7], QW, QH, fq, gq); // foothills toward the massifs
      if (h > 0.85) h = 0.85 + 0.15 * rlTanh((h - 0.85) / 0.15); // soft clamp under 1.00
      hh[k] = h;
    }
    if ((y & 63) === 63) yield;
  }
  out.hh = hh; out.hid = hid; out.hLT = hLT; lap('heightfield');
  // S5: hillshade (Horn), the asymmetric lit cap, cast shadows (16 steps toward the light, at most 0.25 D), valleys; at half resolution
  const dxw = 2 / TX, fS = new Float32Array(HW * HH), sS = new Float32Array(HW * HH), shd = new Float32Array(HW * HH), [lx, ly, lz] = RL_LIGHT;
  const H_ = (xx, yy, k0) => { xx = xx < 0 ? 0 : xx >= HW ? HW - 1 : xx; yy = yy < 0 ? 0 : yy >= HH ? HH - 1 : yy; const kk = yy * HW + xx; return hid[kk] === 255 ? hh[k0] : hh[kk]; };
  for (let y = 0, k = 0; y < HH; y++) {
    for (let x = 0; x < HW; x++, k++) {
      if (hid[k] === 255) continue;
      const a = H_(x - 1, y - 1, k), b = H_(x, y - 1, k), c = H_(x + 1, y - 1, k), d = H_(x - 1, y, k), f = H_(x + 1, y, k), g = H_(x - 1, y + 1, k), i2 = H_(x, y + 1, k), j = H_(x + 1, y + 1, k);
      const dzdx = ((c + 2 * f + j - (a + 2 * d + g)) * VS) / (8 * dxw), dzdy = ((g + 2 * i2 + j - (a + 2 * b + c)) * VS) / (8 * dxw);
      const nl = Math.sqrt(dzdx * dzdx + dzdy * dzdy + 1), s = Math.max(0, (-dzdx * lx - dzdy * ly + lz) / nl);
      sS[k] = s; let v = rlTanh(3.2 * HG[k] * (s - RL_SIN_EL)); fS[k] = v < -1 ? -1 : v > RL_P.litCap ? RL_P.litCap : v;
      // cast shadow: march toward the light; the ray rises at tan 40
      const z0 = hh[k] * VS, stepW = (RL_P.castD * RLD) / RL_P.castSteps, stepT = stepW / dxw; let occ = 0;
      for (let m = 1; m <= RL_P.castSteps; m++) { const sxx = x + 0.5 + -0.70710678 * stepT * m, syy = y + 0.5 + -0.70710678 * stepT * m; if (sxx < 0 || syy < 0) break; const zs = rlBilin(hh, HW, HH, sxx, syy) * VS - (z0 + stepW * m * RL_TAN_EL); if (zs > occ) occ = zs; }
      shd[k] = rlSmooth(0, 0.04 * RLD, occ);
    }
    if ((y & 63) === 63) yield;
  }
  const hb = rlBoxBlur(hh, HW, HH, Math.round(0.08 * RLD * TX / 2), 2), ao = new Float32Array(HW * HH);
  for (let k = 0; k < HW * HH; k++) ao[k] = hid[k] === 255 || RL_WILDK[hid[k]] ? 0 : rlSmooth(0, 0.03 * RLD, (hb[k] - hh[k]) * VS);
  out.fS = fS; out.sS = sS; out.shd = shd; out.ao = ao; yield; lap('hillshade');
  // snow: the highest eighth of each massif where its faces turn to the light (§3.8)
  const snow = new Float32Array(HW * HH);
  for (const w of WILDS) if (w.kind === 'peaks') {
    const set = new Set(w.cells); let lo = Infinity, hi = -Infinity; for (let k = 0; k < HW * HH; k++) if (set.has(hid[k])) { lo = Math.min(lo, hh[k]); hi = Math.max(hi, hh[k]); }
    const cut = hi - (hi - lo) / 8; for (let k = 0; k < HW * HH; k++) if (set.has(hid[k])) snow[k] = rlSmooth(cut - 0.02, cut + 0.03, hh[k]) * rlSmooth(RL_SIN_EL - 0.05, RL_SIN_EL + 0.12, sS[k]);
  }
  out.snow = snow;
  // the quarter-resolution heightfield for the water and the invariant checks (the CPU reference's own; review item 33); water is placed now
  const hq = new Float32Array(QW * QH); for (let y = 0, k = 0; y < QH; y++) for (let x = 0; x < QW; x++, k++) hq[k] = hh[(y * 2 + 1) * HW + x * 2 + 1];
  out.hq = hq; out.water = rlPlaceWater(out); lap('water');
  // the mip texels inside one province carry its id (the land-look wash composites per province into each look's canvases and mips)
  { const W1 = BW / 2, H1 = BH / 2, W2 = BW / 4, H2 = BH / 4, mid1 = new Uint8Array(W1 * H1), mid2 = new Uint8Array(W2 * H2), wid = (k) => (LT[k] < 7 ? id[k] : 255);
    for (let y = 0; y < H1; y++) for (let x = 0; x < W1; x++) { const k = y * 2 * BW + x * 2, a = wid(k); mid1[y * W1 + x] = a !== 255 && a === wid(k + 1) && a === wid(k + BW) && a === wid(k + BW + 1) ? a : 255; }
    for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) { const k = y * 2 * W1 + x * 2, a = mid1[k]; mid2[y * W2 + x] = a !== 255 && a === mid1[k + 1] && a === mid1[k + W1] && a === mid1[k + W1 + 1] ? a : 255; }
    out.mid1 = mid1; out.mid2 = mid2; }
  // the mode relief: a gentle fixed relief of +-3 L* (p95), mean-neutral per province, at half resolution (§9.2)
  const mr = new Float32Array(HW * HH), msum = new Float64Array(N), mcnt = new Float64Array(N);
  { const abs = []; for (let k = 0; k < HW * HH; k += 7) if (hid[k] !== 255 && !RL_WILDK[hid[k]]) abs.push(Math.abs(fS[k])); abs.sort((p, q) => p - q); const p95 = abs[Math.floor(abs.length * 0.95)] || 1;
    for (let k = 0; k < HW * HH; k++) { const o = hid[k]; if (o === 255 || RL_WILDK[o]) continue; mr[k] = Math.max(-4, Math.min(4, (RL_P.modeRelief * fS[k]) / p95)); msum[o] += mr[k]; mcnt[o]++; }
    for (let k = 0; k < HW * HH; k++) { const o = hid[k]; if (o === 255 || RL_WILDK[o]) continue; mr[k] -= msum[o] / mcnt[o]; } }
  out.modeRelief = mr; lap('modeRelief');
}
// the wilds' texels (granite with its snow, the meres), the same in both looks: shade #2A292C to lit #8A857E by the light, snow on the highest eighth's lit faces
let RL_WILDC = null;
function rlWildTexel(S, lt, tx, ty, d8, o4) { // S: the bake's shared rasters (RB, or a re-bake's own)
  const R = (RL_WILDC ??= { gr: rgb2lab(hex2rgb(RL_C.granite)), gl: rgb2lab(hex2rgb(RL_C.graniteLit)), sn: rgb2lab(hex2rgb(RL_C.snow)), me: rgb2lab(hex2rgb(RL_C.mere)), TG: rlTable('granite') });
  const { HW, HH, TX, sS, snow } = S, x = (tx + 0.5) / TX, y = (ty + 0.5) / TX, { gr, gl, sn, me, TG } = R;
  if (lt === 7) {
    const s = rlBilin(sS, HW, HH, (tx + 0.5) / 2, (ty + 0.5) / 2), q = rlSmooth(0.12, 1.0, s), grain = 1.4 * rlVN(TG, x / (3 * RLK), y / (3 * RLK)), sw = rlBilin(snow, HW, HH, (tx + 0.5) / 2, (ty + 0.5) / 2);
    let L = gr[0] + (gl[0] - gr[0]) * q + grain + 5 * rlMicro(x, y), a = gr[1] + (gl[1] - gr[1]) * q, b = gr[2] + (gl[2] - gr[2]) * q;
    L += (sn[0] - L) * sw; a += (sn[1] - a) * sw; b += (sn[2] - b) * sw; rlLabTo(L, a, b, d8, o4); d8[o4 + 3] = 255; return;
  }
  rlLabTo(me[0] + 0.9 * rlVN(TG, x / (9 * RLK), y / (5 * RLK)), me[1], me[2], d8, o4); d8[o4 + 3] = 255;
}

// ------------------------------------------------------------------ v4 relief: the Clear colour pass (map-relief §3.4 and §4 unchanged; natural §6: the setting and the Terrain mode)
// Runs the first time Clear is needed (the setting at load, the Terrain mode, ?terrain=clear). Three changes from v4 apply to both looks or fix verifier defects:
// the snow clamp below (natural §10 defect 2), the line rule (p59b) and the seat ground (p62).
// natural §10 defect 2 (Clear): the lightest L* at which a colour of this a*, b* stays 21 / 13 from the snow #F2EEE6 raw and 20 / 12 under the hem's peak haze
const RL_SNOWC = new Map(); const RL_GAMUT_PASSES = 4;
function rlSnowCap(a, b) {
  const key = Math.round(a * 2) * 1000 + Math.round(b * 2); let v = RL_SNOWC.get(key); if (v != null) return v; const sn = hex2rgb(RL_C.snow), t = [0, 0, 0];
  const G = hex2rgb(RL_C.gesso), hz = RL_P.fog.clear.hemPeak; // and 20 / 12 under the fog's strongest haze (the hem's peak over unexplored land)
  const ok = (L) => { rlLabTo(L, a, b, t, 0); const e = rlPairDE([t[0], t[1], t[2]], sn); if (e.normal < 21 || e.cvd < 13) return false; const h = rlPairDE(t.map((x, j) => x + (G[j] - x) * hz), sn); return h.normal >= 20.6 && h.cvd >= 12.6; }; // margins for 8-bit rounding
  let lo = 40, hi = 95; if (ok(hi)) v = hi; else { for (let it = 0; it < 18; it++) { const m = (lo + hi) / 2; if (ok(m)) lo = m; else hi = m; } v = lo; }
  RL_SNOWC.set(key, v); return v;
}
function* rlClearGen(out) {
  const { BW, BH, TX, HW, HH, id, LT, LP, fS, shd, ao } = out, NP = BW * BH;
  const tm = {}; let t = performance.now(); const lap = (k) => { const n = performance.now(); tm[k] = +((tm[k] ?? 0) + n - t).toFixed(1); t = n; };
  // S6: the lightness change at full resolution: relief (the blended swing cap x the lit-capped shade), cast shadow, valley, ground detail
  const clampN = [0, 0, 0]; out.clampN = clampN; const capK = new Uint8Array(NP), DL = new Float32Array(NP), TD = [rlTable('detail:a'), rlTable('detail:b'), rlTable('detail:c'), rlTable('detail:d')];
  const capT = RL_T.map((tn) => RL_CAP[tn]), parcelAng = new Float32Array(N); for (let i = 0; i < N; i++) { const R = rngFor(`relief:${MAP_SEED}:parcels:${i}`); parcelAng[i] = [0, Math.PI / 2, Math.PI / 6, -Math.PI / 6][Math.floor(R() * 4)] + (R() - 0.5) * 0.12; } // never 45 degrees (the reserved hatch)
  const crownCell = 7 * RLK * 0.75, cellP = 7 * RLK, micro = rlMicro; // micro: rock at 7-unit features (p58a) // canopy crowns of 3 to 6 mapgen units on a jittered grid; parcels of 7 units
  for (let ty = 0, k = 0; ty < BH; ty++) {
    for (let tx = 0; tx < BW; tx++, k++) {
      const lt = LT[k]; if (lt >= 7) continue;
      // the blended swing cap over the 3 x 3 albedo window (land only)
      let cs = 0, cn = 0; for (let oy = -1; oy <= 1; oy++) { const yy = ty + oy; if (yy < 0 || yy >= BH) continue; for (let ox = -1; ox <= 1; ox++) { const xx = tx + ox; if (xx < 0 || xx >= BW) continue; const v = LT[yy * BW + xx]; if (v < 7) { cs += capT[v]; cn++; } } }
      const At = cs / cn, hx = (tx + 0.5) / 2, hy = (ty + 0.5) / 2;
      const fs = rlBilin(fS, HW, HH, hx, hy), x = (tx + 0.5) / TX, y = (ty + 0.5) / TX;
      let d = At * fs - RL_P.castL * rlBilin(shd, HW, HH, hx, hy) - RL_P.valleyL * rlBilin(ao, HW, HH, hx, hy);
      const tn = RL_T[lt];
      if (tn === 'plains') d += 1.8 * rlFbm(TD[0], x / (22 * RLK), y / (22 * RLK), 2) + 1.0 * rlVN(TD[1], x / (5 * RLK), y / (5 * RLK)) + 1.1 * rlVN(TD[3], x / (1.6 * RLK), y / (1.6 * RLK));
      else if (tn === 'farmland') {
        const a = parcelAng[LP[k]], ca = Math.cos(a), sa = Math.sin(a), u = (x * ca + y * sa) / (cellP * 1.35), v = (-x * sa + y * ca) / (cellP * 0.8), iu = Math.floor(u), iv = Math.floor(v); let best = 9, best2 = 9, bid = 0;
        for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) { const cu = iu + ox, cv2 = iv + oy, hh2 = h32(`f${cu},${cv2}`), du = u - (cu + 0.15 + 0.7 * ((hh2 & 1023) / 1023)), dv = v - (cv2 + 0.15 + 0.7 * (((hh2 >>> 10) & 1023) / 1023)), dd = du * du + dv * dv; if (dd < best) { best2 = best; best = dd; bid = hh2; } else if (dd < best2) best2 = dd; }
        d += [-1.6, -0.5, 0.5, 1.6][(bid >>> 20) & 3] * (0.55 + 0.45 * rlSmooth(0, 0.12, Math.sqrt(best2) - Math.sqrt(best))) + 0.8 * rlVN(TD[2], x / (8 * RLK), y / (8 * RLK)); // parcel tones, the seams softened (fix 10)
      } else if (tn === 'forest') {
        const gx = x / crownCell, gy = y / crownCell, ix = Math.floor(gx), iy = Math.floor(gy); let best = 9, bdx = 0, bdy = 0, br = 1;
        for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
          const cx = ix + ox, cy = iy + oy, hsh = h32(`c${cx},${cy}`), jx = (hsh & 1023) / 1023, jy = ((hsh >>> 10) & 1023) / 1023, rr = 0.42 + 0.33 * (((hsh >>> 20) & 255) / 255);
          const ddx = gx - (cx + jx), ddy = gy - (cy + jy), dd = Math.sqrt(ddx * ddx + ddy * ddy) / rr; if (dd < best) { best = dd; bdx = ddx / rr; bdy = ddy / rr; br = rr; }
        }
        const crown = best < 1 ? 1 - best * best : 0, lit = -(bdx + bdy) * 0.7071; // a dome lit from the upper left
        d += best < 1 ? 6 * (0.15 + 0.55 * crown * 0.5 + 0.55 * lit * Math.sqrt(crown)) : -6 * Math.min(1, (best - 1) * 3 + 0.6);
        d += 2 * rlFbm(TD[3], x / (30 * RLK), y / (30 * RLK), 2); void br;
      } else if (tn === 'hills') d += 2 * rlFbm(TD[0], x / (26 * RLK), y / (26 * RLK), 3) + 0.9 * rlVN(TD[3], x / (1.8 * RLK), y / (1.8 * RLK));
      else if (tn === 'mountains') { const sc = Math.max(0, -fs - 0.15); d += sc * 3 * rlVN(TD[1], x / (2.2 * RLK), y / (2.2 * RLK)) + 0.7 * rlVN(TD[2], x / (5 * RLK), y / (5 * RLK)) + 3 * micro(x, y); } // + the full-resolution micro-relief (fix 10)
      else if (tn === 'swamp') { const pn = rlFbm(TD[2], x / (16 * RLK), y / (16 * RLK), 3); d += -5 * rlSmooth(0.30, 0.42, pn) + 1 * rlVN(TD[3], x / (2.6 * RLK), y / (2.6 * RLK)); }
      else { const cr = 1 - Math.abs(rlFbm(TD[3], x / (12 * RLK), y / (12 * RLK), 3)); d += 2.2 * rlFbm(TD[0], x / (34 * RLK), y / (34 * RLK), 2) + 1.2 * Math.sin((x * 0.8 + y * 0.6) / (3.2 * RLK) + 3 * rlVN(TD[1], x / (25 * RLK), y / (25 * RLK))) - 3 * rlSmooth(0.90, 0.97, cr); }
      if (!RL_DBG.noSnowClamp) { capK[k] = Math.round(At * 8); if (d > 0.6 * At) { d = 0.6 * At; clampN[1]++; } else if (d < -At && RL_DBG.clampLow) { d = -At; clampN[0]++; } } DL[k] = d; // natural §10 defect 2: the lit side clamped to +0.6 A before the mean-neutral pass (passable rock kept off the snow) and again after it (below)
    }
    if ((ty & 127) === 127) yield;
  }
  lap('detail');
  // S7: mean-neutral (V3): per province, the mean change over its pure-terrain pixels is removed as a smooth field (spread 0.03 D, three iterations)
  const pure = new Uint8Array(NP);
  for (let ty = 1, k0 = BW; ty < BH - 1; ty++, k0 += BW) for (let tx = 1; tx < BW - 1; tx++) { const k = k0 + tx, o = id[k]; if (o === 255 || RL_WILDK[o]) continue; const want = RL_TI[terr[o]]; if (LT[k] !== want) continue;
    if (LT[k - 1] === want && LT[k + 1] === want && LT[k - BW] === want && LT[k + BW] === want && LT[k - BW - 1] === want && LT[k - BW + 1] === want && LT[k + BW - 1] === want && LT[k + BW + 1] === want && distToEdge(cells[o], (tx + 0.5) / TX, (ty + 0.5) / TX) >= RL_P.coreD * RLD) pure[k] = 1; } // the untinted core: pure terrain beyond the glow band
  { // erode the core by 4 texels, so a mip or a screen filter never blends a fringe into it (the checks read the same set on screen)
    const r = 4, tmp = new Uint8Array(NP);
    for (let y = 0; y < BH; y++) { let run = 0; for (let x = 0; x < BW; x++) { const k = y * BW + x; run = pure[k] ? run + 1 : 0; tmp[k] = run; } for (let x = BW - 1, run2 = 0; x >= 0; x--) { const k = y * BW + x; run2 = pure[k] ? run2 + 1 : 0; tmp[k] = Math.min(tmp[k], run2) > r ? 1 : 0; } }
    for (let x = 0; x < BW; x++) { let run = 0; const col = new Uint16Array(BH); for (let y = 0; y < BH; y++) { const k = y * BW + x; run = tmp[k] ? run + 1 : 0; col[y] = run; } for (let y = BH - 1, run2 = 0; y >= 0; y--) { const k = y * BW + x; run2 = tmp[k] ? run2 + 1 : 0; pure[k] = Math.min(col[y], run2) > r ? 1 : 0; } }
  }
  { // the water covers part of some cores: those texels (with a 3-unit bank) leave the core, so the visible land is what is mean-neutral
    const m = 3 * RLK, clr = (x0, y0, x1, y1, test) => { for (let ty = Math.max(0, Math.floor(y0 * TX)); ty <= Math.min(BH - 1, Math.ceil(y1 * TX)); ty++) for (let tx = Math.max(0, Math.floor(x0 * TX)); tx <= Math.min(BW - 1, Math.ceil(x1 * TX)); tx++) if (test((tx + 0.5) / TX, (ty + 0.5) / TX)) pure[ty * BW + tx] = 0; };
    for (const L of [...out.water.lakes, ...out.water.ponds]) { const b = bboxOf(L.P), ring = [...L.P, L.P[0]]; clr(b[0] - m, b[1] - m, b[2] + m, b[3] + m, (x, y) => d3.polygonContains(L.P, [x, y]) || distToEdge(ring, x, y) < m); }
    for (const s of out.water.streams) { const b = bboxOf(s.pts), w = s.w1 + m; clr(b[0] - w, b[1] - w, b[2] + w, b[3] + w, (x, y) => distToEdge(s.pts, x, y) < w); }
  }
  const meanOf = new Float64Array(N), hLP = new Uint8Array(HW * HH); for (let y = 0, k = 0; y < HH; y++) for (let x = 0; x < HW; x++, k++) hLP[k] = LP[(y * 2 + 1) * BW + x * 2 + 1];
  let Oh = new Float32Array(HW * HH); const rS = Math.max(1, Math.round((RL_P.meanSpreadD * RLD * TX) / 2));
  const landMaskH = new Float32Array(HW * HH); for (let k = 0; k < HW * HH; k++) landMaskH[k] = hLP[k] !== 255 && !RL_WILDK[hLP[k]] ? 1 : 0;
  for (let it = 0; it < RL_P.meanIters; it++) {
    const sum = new Float64Array(N), cnt = new Float64Array(N);
    for (let ty = 0, k = 0; ty < BH; ty++) for (let tx = 0; tx < BW; tx++, k++) if (pure[k]) { const o = id[k]; sum[o] += DL[k] - (it ? rlBilin(Oh, HW, HH, (tx + 0.5) / 2, (ty + 0.5) / 2) : 0); cnt[o]++; }
    for (let i = 0; i < N; i++) if (cnt[i]) meanOf[i] += sum[i] / cnt[i];
    const raw = new Float32Array(HW * HH); for (let k = 0; k < HW * HH; k++) raw[k] = landMaskH[k] ? meanOf[hLP[k]] : 0;
    Oh = rlBoxBlur(raw, HW, HH, rS, 2, landMaskH); yield;
  }
  const resid = new Float64Array(N), rcnt = new Float64Array(N);
  for (let ty = 0, k = 0; ty < BH; ty++) for (let tx = 0; tx < BW; tx++, k++) { if (LT[k] >= 7) continue; DL[k] -= rlBilin(Oh, HW, HH, (tx + 0.5) / 2, (ty + 0.5) / 2); if (!RL_DBG.noSnowClamp && DL[k] > 0.075 * capK[k]) { DL[k] = 0.075 * capK[k]; clampN[2]++; } if (pure[k]) { resid[id[k]] += DL[k]; rcnt[id[k]]++; } } // the mean-neutral offset may not lift a lit face back over +0.6 A
  if (!RL_DBG.noSnowClamp) for (let it = 0; it < 8; it++) { // the cap above moves a province's mean off zero: a constant per province brings it back (re-capped), so the mean-neutral invariant holds
    const r = new Float64Array(N); let worst = 0; for (const i of provList) { r[i] = rcnt[i] ? resid[i] / rcnt[i] : 0; worst = Math.max(worst, Math.abs(r[i])); } if (worst < 0.01) break; resid.fill(0); rcnt.fill(0);
    for (let k = 0; k < NP; k++) { if (LT[k] >= 7) continue; const i = id[k]; if (i === 255) continue; DL[k] -= r[i]; if (DL[k] > 0.075 * capK[k]) DL[k] = 0.075 * capK[k]; if (pure[k]) { resid[i] += DL[k]; rcnt[i]++; } }
  }
  out.residual = provList.map((i) => ({ i, dL: rcnt[i] ? resid[i] / rcnt[i] : 0, n: rcnt[i] }));
  out.pure = pure; out.DL = DL; yield; lap('meanNeutral');
  // S8: color: the 3 x 3 blended albedo in CIELAB with the change added to L*, to sRGB once; wilds; the rounded corners' coverage
  const img = new ImageData(BW, BH), d8 = img.data, Lt = RL_T.map((tn) => RL_L[tn]), corr = new Float64Array(N * 3);
  const landPx = (k, tx, ty, o4, cr) => { // the 3 x 3 blended albedo, the lightness change, and (after the first pass) the province's gamut correction
    let L = 0, a = 0, b = 0, n = 0;
    for (let oy = -1; oy <= 1; oy++) { const yy = ty + oy; if (yy < 0 || yy >= BH) continue; for (let ox = -1; ox <= 1; ox++) { const xx = tx + ox; if (xx < 0 || xx >= BW) continue; const v = LT[yy * BW + xx]; if (v < 7) { const c = Lt[v]; L += c[0]; a += c[1]; b += c[2]; n++; } } }
    L = L / n + DL[k]; a /= n; b /= n; if (cr) { const p3 = LP[k] * 3; L += cr[p3]; a += cr[p3 + 1]; b += cr[p3 + 2]; }
    if (L > 60 && !RL_DBG.noSnowClamp) { const c = rlSnowCap(a, b); if (L > c) L = c; } // passable land (rock above all) never reaches the snow: the lightest L* that keeps this a, b 21 / 13 from it
    rlLabTo(L, a, b, d8, o4);
  };
  const gr = rgb2lab(hex2rgb(RL_C.granite));
  for (let ty = 0, k = 0; ty < BH; ty++) {
    for (let tx = 0; tx < BW; tx++, k++) {
      const lt = LT[k], o4 = k * 4; if (lt === 255) { d8[o4 + 3] = 0; continue; }
      if (lt >= 7) { rlWildTexel(out, lt, tx, ty, d8, o4); continue; } // granite and its snow, the meres (p58b; the same in both looks)
      landPx(k, tx, ty, o4, null); d8[o4 + 3] = 255;
    }
    if ((ty & 127) === 127) yield;
  }
  // the gamut: a dark or lit pixel of a saturated albedo leaves sRGB and is clipped, which moves the province's mean (hills lost about 1 b*).
  // Two correction passes: each province's CIELAB mean over its pure pixels, as converted, is brought back onto its albedo (a constant per province)
  const LIN = new Float32Array(256); for (let v = 0; v < 256; v++) LIN[v] = s2l(v);
  const cf = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  for (let pass = 0; pass < (RL_DBG.noSnowClamp ? 2 : RL_GAMUT_PASSES); pass++) { // a third pass since the snow clamp: the means converge again (Ashfen 0.53 to 0.36 at month 40)
    const sL = new Float64Array(N), sa = new Float64Array(N), sb = new Float64Array(N), sn2 = new Float64Array(N);
    for (let k = 0; k < NP; k++) { if (!pure[k]) continue; const o4 = k * 4, R0 = LIN[d8[o4]], G0 = LIN[d8[o4 + 1]], B0 = LIN[d8[o4 + 2]], fx = cf((0.4124 * R0 + 0.3576 * G0 + 0.1805 * B0) / 0.95047), fy = cf(0.2126 * R0 + 0.7152 * G0 + 0.0722 * B0), fz = cf((0.0193 * R0 + 0.1192 * G0 + 0.9505 * B0) / 1.08883), i = id[k];
      sL[i] += 116 * fy - 16; sa[i] += 500 * (fx - fy); sb[i] += 200 * (fy - fz); sn2[i]++; }
    for (let i = 0; i < N; i++) if (sn2[i] && !RL_WILDK[i]) { const al = RL_L[terr[i]]; corr[i * 3] += al[0] - sL[i] / sn2[i]; corr[i * 3 + 1] += al[1] - sa[i] / sn2[i]; corr[i * 3 + 2] += al[2] - sb[i] / sn2[i]; }
    yield;
    for (let ty = 0, k = 0; ty < BH; ty++) { for (let tx = 0; tx < BW; tx++, k++) { if (LT[k] < 7) landPx(k, tx, ty, k * 4, corr); } if ((ty & 255) === 255) yield; }
  }
  out.gamutCorr = provList.map((i) => [names[i], +corr[i * 3].toFixed(2), +corr[i * 3 + 1].toFixed(2), +corr[i * 3 + 2].toFixed(2)]);
  for (let ty = 0; ty < BH; ty++) for (let tx = 0; tx < BW; tx++) { // antialias the rounded corners
    const x = (tx + 0.5) / TX, y = (ty + 0.5) / TX; if (!((x < RL_RC || x > W - RL_RC) && (y < RL_RC || y > H - RL_RC))) continue;
    const cx = x < RL_RC ? RL_RC : W - RL_RC, cy = y < RL_RC ? RL_RC : H - RL_RC, dd = Math.hypot(x - cx, y - cy) - RL_RC, cov = Math.max(0, Math.min(1, 0.5 - dd * TX)), o4 = (ty * BW + tx) * 4;
    if (cov > 0 && d8[o4 + 3] === 0) { const nb = nearest(x, y), c = RL_WILDK[nb] ? gr : RL_L[terr[nb]]; rlLabTo(c[0], c[1], c[2], d8, o4); }
    d8[o4 + 3] = Math.round(255 * cov);
  }
  yield; lap('color');
  yield* rlFinishLook(out, 'clear', img, tm, lap);
}
// S9 for either look: the canvas, the wild sculpture drawn into it (crags, mere banks, ripples, reeds and snags), the mips (averaged in CIELAB: an sRGB average
// darkens a textured province's L* mean by 0.2 to 0.4) and the unwashed copies the land-look wash composites from (rlWashSync). Writes out.L[look].
function* rlFinishLook(out, look, img, tm, lap) {
  const { BW, BH, TX } = out, LIN = new Float32Array(256); for (let v = 0; v < 256; v++) LIN[v] = s2l(v);
  const cf = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const cv = makeCanvas(BW, BH), g = cv.getContext('2d'); g.putImageData(img, 0, 0);
  g.setTransform(TX, 0, 0, TX, 0, 0); rlSculptWilds(g); g.setTransform(1, 0, 0, 1, 0, 0);
  const labMip = (src, w, h) => { const W2 = w >> 1, H2 = h >> 1, dst = new ImageData(W2, H2), dd = dst.data, sd = src.data;
    for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) { let L = 0, a = 0, b = 0, al = 0, n = 0;
      for (const [ox, oy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const o = ((y * 2 + oy) * w + x * 2 + ox) * 4; if (!sd[o + 3]) continue; const R0 = LIN[sd[o]], G0 = LIN[sd[o + 1]], B0 = LIN[sd[o + 2]], fx = cf((0.4124 * R0 + 0.3576 * G0 + 0.1805 * B0) / 0.95047), fy = cf(0.2126 * R0 + 0.7152 * G0 + 0.0722 * B0), fz = cf((0.0193 * R0 + 0.1192 * G0 + 0.9505 * B0) / 1.08883); L += 116 * fy - 16; a += 500 * (fx - fy); b += 200 * (fy - fz); al += sd[o + 3]; n++; }
      const o4 = (y * W2 + x) * 4; if (n) { rlLabTo(L / n, a / n, b / n, dd, o4); dd[o4 + 3] = Math.round(al / 4); } }
    return dst; };
  const m1 = labMip(img, BW, BH); yield; const m2 = labMip(m1, BW / 2, BH / 2), R = { look, canvas: cv };
  R.mip1 = makeCanvas(BW / 2, BH / 2); R.mip1.getContext('2d').putImageData(m1, 0, 0); R.mip2 = makeCanvas(BW / 4, BH / 4); R.mip2.getContext('2d').putImageData(m2, 0, 0);
  { const t1 = makeCanvas(BW / 2, BH / 2), t2 = makeCanvas(BW / 4, BH / 4); t1.getContext('2d').drawImage(cv, 0, 0, BW / 2, BH / 2); t2.getContext('2d').drawImage(t1, 0, 0, BW / 4, BH / 4); // the sculpture drawn after the pixel pass: wilds only, so the land mips stay Lab averages
    for (const [m, t] of [[R.mip1, t1], [R.mip2, t2]]) { const mg = m.getContext('2d'); mg.save(); mg.setTransform(m.width / W, 0, 0, m.height / H, 0, 0); mg.beginPath(); for (const w of WILDS) for (const c of w.cells) { cells[c].forEach(([x, y], k) => (k ? mg.lineTo(x, y) : mg.moveTo(x, y))); mg.closePath(); } mg.clip(); mg.setTransform(1, 0, 0, 1, 0, 0); mg.clearRect(0, 0, m.width, m.height); mg.drawImage(t, 0, 0); mg.restore(); } }
  // the land-look wash is composited per texel into these canvases from their unwashed copies (rlWashSync)
  R.img = g.getImageData(0, 0, BW, BH); R.mb1 = R.mip1.getContext('2d').getImageData(0, 0, BW / 2, BH / 2); R.mb2 = R.mip2.getContext('2d').getImageData(0, 0, BW / 4, BH / 4);
  lap('canvas'); R.t = tm; R.washKeys = null; R.ready = true; out.L = out.L ?? {}; out.L[look] = R;
}

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

// ------------------------------------------------------------------ natural view: the covers (natural §3.1, §3.2), the rule-bearing raster of the natural look
// What each texel is drawn as (canopy, field, copse, or the cover blend's terrain), decided from the shared lookup and the seeded value tables only (N8):
// arithmetic, square roots, floors and table noise. No cosine, sine, exponential, logarithm, power or arctangent call appears in this part (a source scan guards it, §14).
// In the game this is a GPU pass; this CPU reference (half-resolution blend, 8-bit planes) serves the N4 and readability checks and the fallback (N11).
const RL_NAT = { // natural §2.2, §3, §4 (docs/09-balance "Map presentation" rows): materials in CIELAB D65, sizes in mapgen units (D = 90)
  mat: {
    plains: { ground: [43, -11, 33], light: [48, -14, 35], dry: [46, -5, 31] },
    farmland: { ground: [45, -9, 30], ripe: [53, 2, 31], straw: [56, 1, 25], green: [46, -12, 30], ploughed: [43, 5, 19], fallow: [49, -4, 25], hedge: [29, -12, 19] },
    forest: { ground: [28, -11, 21], canopy: [19, -15, 21], conifer: [16, -11, 13] },
    hills: { ground: [35, 3, 21], turf: [40, -8, 27], bracken: [37, 7, 24], rock: [50, 1, 6] },
    mountains: { ground: [42, 1, -5], scree: [49, 1, -2], turf: [35, -7, 17] },
    swamp: { ground: [34, -8, 22], pool: [25, -8, 2], reed: [42, -4, 29], shrub: [24, -11, 16] },
    wasteland: { ground: [54, 4, 17], crack: [45, 4, 13], scrub: [36, -5, 15], pale: [59, 3, 14] },
  },
  cap: [6, 4, 7, 13, 18, 3, 8], lit: 0.6, castL: 6, valleyL: 4, mottle: 2.2, // the natural relief caps (§3.3), in RL_T order
  sigG: 0.12, sigC: 0.04, sigF: 0.07, sigA: 0.06, pres0: 0.35, presW: 0.3, // the ground blend is S3's (0.12 D); the cover blend 0.04 D at half resolution
  canopy: { edgeU: 10, edgeK: 0.42, thr: 0.52, gladeW: 0.85, gladeU: 9, gladeN: -0.62, copseU: 15, copseN: 0.80, copseW: 0.6, treeN: 0.55, treeSeam: 0.6 },
  field: { rowH: 8.5, bend: 1.6, bendU: 28, depthJ: 2.5, lenMin: 13, lenSpan: 19, wCentre: 0.6, wCover: 0.4, wRand: 0.36, thr: 0.5, hedgeU: 0.4, hedgeA: 0.6, seamShare: 0.45, furrow: 1.25, jitter: 0.06 },
  crown: 2.3, shadowU: 1.2, shadowL: 9, damp: 0.7,
  tones: ['ripe', 'straw', 'green', 'ploughed', 'fallow', 'ripe', 'green', 'fallow'],
};
// the integer hash of two lattice coordinates and a salt (32-bit): bits 0-9, 10-19 and 20-29 give three values in [0, 1]
const rlH2 = (ix, iy, salt) => { let h = (Math.imul(ix | 0, 374761393) + Math.imul(iy | 0, 668265263) + Math.imul(salt, -2048144777)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return h >>> 0; };
const rlH2a = (h) => (h & 1023) / 1023, rlH2b = (h) => ((h >>> 10) & 1023) / 1023, rlH2c = (h) => ((h >>> 20) & 1023) / 1023;
// each province's field frame: 0, 90 or +-30 degrees (never 45, the reserved hatch) by exact constants, then a seeded jitter j (|j| <= 0.06, about 3.4 degrees) as the
// small rotation (1, j) / sqrt(1 + j^2): [cos, sin] with no trigonometry (N8)
const RL_FRAMES = (() => { const base = [[1, 0], [0, 1], [Math.sqrt(3) / 2, 0.5], [Math.sqrt(3) / 2, -0.5]], out = new Float64Array(N * 2);
  for (let i = 0; i < N; i++) { const R = rngFor(`relief:${MAP_SEED}:natural:parcel:${i}`), [c0, s0] = base[Math.floor(R() * 4)], j = (R() - 0.5) * 2 * RL_NAT.field.jitter, n = Math.sqrt(1 + j * j), cj = 1 / n, sj = j / n;
    out[i * 2] = c0 * cj - s0 * sj; out[i * 2 + 1] = s0 * cj + c0 * sj; }
  return out; })();
const rlNatT = (k) => rlTable('natural:' + k); // N8: relief:<seed>:natural:<purpose>
// the parcel a point (mapgen units) falls in, in its province's frame: fills F with the row and column seams, the parcel's id value and centre, the furrow phase
function rlParcel(i, u, v, F) {
  const P = RL_NAT.field, ca = RL_FRAMES[i * 2], sa = RL_FRAMES[i * 2 + 1], T = (RL_NATTF ??= rlNatT('field'));
  const pu = u * ca + v * sa; let pv = -u * sa + v * ca;
  pv += P.bend * rlVN(T, pu / P.bendU + 90, pv / P.bendU); pv += P.depthJ * rlVN(T, pu / 9 + 17, pv / 61); // rows bend a little; uneven row depths
  const row = Math.floor(pv / P.rowH), fv = pv / P.rowH - row, hr = rlH2c(rlH2(row, 3, 41)), hp = rlH2c(rlH2(row, 5, 43)), Lp = P.lenMin + P.lenSpan * hr;
  const uu = (pu + hp * 40) / Lp, col = Math.floor(uu), fu = uu - col, bid = rlH2c(rlH2(row, col, 47));
  const sv = Math.min(fv, 1 - fv) * P.rowH, su = Math.min(fu, 1 - fu) * Lp, cu = (col + 0.5) * Lp - hp * 40, cv = (row + 0.5) * P.rowH;
  F.seam = Math.min(sv, su); F.rowSeam = sv < su; F.row = row; F.bid = bid; F.cx = cu * ca - cv * sa; F.cy = cu * sa + cv * ca; // the parcel's centre back in map units
  const ph = pv / P.furrow + bid * 3.1830989; F.phase = ph - Math.floor(ph); // furrows 1.25 units apart along the strip (the colour pass draws them)
}
let RL_NATTF = null;
// the covers: writes out.nat = { cls, ftone, fhedge, fph, wc8, wF8, wA8 } (cls: 0-6 the blend's terrain, 1 a field, 2 forest canopy, 9 a copse, 10 a hedge tree, 255 off the land)
function* rlNatCoverGen(out, lap) {
  const { BW, BH, TX, HW, HH, LT, LP } = out, NP = BW * BH, HN = HW * HH, NAT = RL_NAT, CP = NAT.canopy, FP = NAT.field;
  const rad = (sD) => { const s = (sD * RLD * TX) / 2; return Math.max(1, Math.round((Math.sqrt((12 * s * s) / 3 + 1) - 1) / 2)); }; // three box passes, sigma in half-res texels
  const OH = [...Array(7)].map(() => new Float32Array(HN)); // the warped one-hot at half resolution (2 x 2 box), all seven in one pass
  for (let y = 0, k = 0; y < HH; y++) for (let x = 0; x < HW; x++, k++) { const a = (y * 2) * BW + x * 2; for (const q of [LT[a], LT[a + 1], LT[a + BW], LT[a + BW + 1]]) if (q < 7) OH[q][k] += 0.25; }
  const onehot = (t) => OH[t];
  const q8 = (P, s) => { const o = new Uint8Array(HN); for (let k = 0; k < HN; k++) { const v = P[k] * s; o[k] = v >= 1 ? 255 : v <= 0 ? 0 : Math.round(v * 255); } return o; };
  const wf = []; for (let t = 0; t < 7; t++) { wf.push(rlBoxBlur(onehot(t), HW, HH, rad(NAT.sigC), 3)); if (t % 2) yield; }
  const sum = new Float32Array(HN); for (let t = 0; t < 7; t++) { const P = wf[t]; for (let k = 0; k < HN; k++) sum[k] += P[k]; }
  const wc8 = wf.map((P) => { const o = new Uint8Array(HN); for (let k = 0; k < HN; k++) { const s = sum[k]; o[k] = s > 1e-4 ? Math.round((255 * P[k]) / s) : 0; } return o; });
  wf.length = 0; const wF8 = q8(rlBoxBlur(onehot(2), HW, HH, rad(NAT.sigF), 3), 1), wA8 = q8(rlBoxBlur(onehot(1), HW, HH, rad(NAT.sigA), 3), 1); yield; lap('coverBlend');
  const cls = new Uint8Array(NP).fill(255), ftone = new Uint8Array(NP), fhedge = new Uint8Array(NP), fph = new Uint8Array(NP), F = {}, w = new Float64Array(7);
  const Te = rlNatT('edge'), Tg = rlNatT('glade'), Tc = rlNatT('copse'), Tt = rlNatT('tree'), Tf = rlNatT('field');
  const KU = 1 / RLK; let nField = 0, nCanopy = 0;
  for (let ty = 0, k = 0; ty < BH; ty++) {
    let hy = (ty + 0.5) / 2 - 0.5; if (hy < 0) hy = 0; if (hy > HH - 1) hy = HH - 1; const iy = hy | 0, fy = hy - iy, iy1 = iy + 1 < HH ? iy + 1 : iy, r0 = iy * HW, r1 = iy1 * HW, v = ((ty + 0.5) / TX) * KU;
    for (let tx = 0; tx < BW; tx++, k++) {
      if (LT[k] >= 7) continue;
      let hx = (tx + 0.5) / 2 - 0.5; if (hx < 0) hx = 0; if (hx > HW - 1) hx = HW - 1; const ix = hx | 0, fx = hx - ix, ix1 = ix + 1 < HW ? ix + 1 : ix;
      const a00 = r0 + ix, a01 = r0 + ix1, a10 = r1 + ix, a11 = r1 + ix1, w00 = (1 - fx) * (1 - fy) / 255, w01 = fx * (1 - fy) / 255, w10 = (1 - fx) * fy / 255, w11 = fx * fy / 255;
      for (let t = 0; t < 7; t++) { const P = wc8[t]; w[t] = P[a00] * w00 + P[a01] * w01 + P[a10] * w10 + P[a11] * w11; }
      const u = ((tx + 0.5) / TX) * KU, wFv = wF8[a00] * w00 + wF8[a01] * w01 + wF8[a10] * w10 + wF8[a11] * w11, wAv = wA8[a00] * w00 + wA8[a01] * w01 + wA8[a10] * w10 + wA8[a11] * w11;
      // fields (§3.2.2): strip parcels in the province's frame; a parcel is a field when 0.6 w_A(0.06 D) at its centre + 0.4 w_A(cover) + 0.36 (h - 0.5) > 0.5
      let field = false, hedgeT = false;
      if (wAv > 0.004 || w[1] > 0) {
        rlParcel(LP[k], u, v, F);
        let cx = Math.floor((F.cx * RLK * TX) / 2), cy = Math.floor((F.cy * RLK * TX) / 2); cx = cx < 0 ? 0 : cx >= HW ? HW - 1 : cx; cy = cy < 0 ? 0 : cy >= HH ? HH - 1 : cy;
        const h = F.bid * 7.31 - Math.floor(F.bid * 7.31), wA = FP.wCentre * (wA8[cy * HW + cx] / 255) + FP.wCover * w[1];
        if (wA + FP.wRand * (h - 0.5) > FP.thr) {
          field = true; nField++; ftone[k] = 1 + (Math.floor(F.bid * 8) % 8); fph[k] = Math.floor(F.phase * 256) & 255;
          const rs = F.row * 0.618 - Math.floor(F.row * 0.618), onSeam = F.rowSeam ? rs < FP.seamShare : true; // about half the row seams carry a hedge; every parcel end does
          const hd = Math.max(0, 1 - F.seam / FP.hedgeU) * (onSeam ? 1 : 0) * (rlVN(Tf, u / 6 + 50, v / 6) > -0.35 ? 1 : 0); fhedge[k] = Math.round(hd * 255);
          hedgeT = F.seam < CP.treeSeam && rlVN(Tt, u, v) > CP.treeN; // trees along the hedges
        }
      }
      // canopy (§3.2.1): forest masses with ragged edges that cross borders, glades inside, copses on open land, hedge trees
      let forest = false, copse = false; const fb = 0.5 * wFv + 0.5 * w[2];
      if (fb > CP.thr - CP.edgeK) forest = fb + CP.edgeK * rlFbm(Te, u / CP.edgeU, v / CP.edgeU, 3) > CP.thr;
      if (forest && w[2] > CP.gladeW && rlFbm(Tg, u / CP.gladeU, v / CP.gladeU, 2) < CP.gladeN) forest = false;
      if (!forest && !field && w[0] + w[3] > CP.copseW) copse = rlFbm(Tc, u / CP.copseU, v / CP.copseU, 3) > CP.copseN;
      if (forest) cls[k] = 2; else if (copse) cls[k] = 9; else if (hedgeT) cls[k] = 10; else if (field) cls[k] = 1;
      else { let bt = 0, bv = -1; for (let t = 0; t < 7; t++) if (t !== 1 && w[t] > bv) { bv = w[t]; bt = t; } cls[k] = bt; } // the cover blend's terrain; farmland shows only as fields
      if (forest || copse || hedgeT) nCanopy++;
    }
    if ((ty & 63) === 63) yield;
  }
  out.nat = { cls, ftone, fhedge, fph, wc8, wF8, wA8, nField, nCanopy }; lap('covers');
}

// ------------------------------------------------------------------ natural view: the materials (natural §2, §3.3, §4), the colour of the natural look
// The ground blends wide (S3's height weights, sigma 0.12 D), the covers of p58n decide what is drawn; every recipe is CIELAB on the ground, weighted by each terrain's
// presence p_t = clamp((w_t - 0.35) / 0.3, 0, 1). No province-mean budget, no mean-neutral pass, no gamut correction (N5): the readability checks hold this look.
function* rlNaturalGen(out) {
  const tm = {}; let t0 = performance.now(); const lap = (k) => { const n = performance.now(); tm[k] = +((tm[k] ?? 0) + n - t0).toFixed(1); t0 = n; };
  yield* rlNatCoverGen(out, lap);
  const { BW, BH, TX, HW, HH, QW, QH, LT, id, fS, shd, ao, wch } = out, NP = BW * BH, NAT = RL_NAT, M = NAT.mat, CAP = NAT.cap;
  const { cls, ftone, fhedge, fph, wc8 } = out.nat, G = RL_T.map((t) => M[t].ground);
  // the canopy's own shadow on the ground to the lower right (1.2 units), softened, 9 L* (the dark fringe of the references' forest masses)
  const ks = Math.max(1, Math.round(NAT.shadowU * RLK * TX)), sh = new Float32Array(HW * HH); // at half resolution (the mask's 2 x 2 share), offset and softened
  for (let y = ks; y < BH; y++) for (let x = ks; x < BW; x++) { const c = cls[(y - ks) * BW + x - ks]; if (c === 2 || c === 9 || c === 10) sh[(y >> 1) * HW + (x >> 1)] += 0.25; }
  const shb = rlBoxBlur(sh, HW, HH, 1, 2); yield; lap('canopyShadow');
  const T = (k) => rlNatT(k), Tm = T('mottle'), Ts = T('streak'), Td = T('dust'), Th = T('heath'), Tr = T('rock'), Tmi = T('micro'), Tp = T('pool'), Tre = T('reed'), Tsc = T('scrub'), Tf = T('field'), Tco = T('conifer');
  const img = new ImageData(BW, BH), d8 = img.data, KU = 1 / RLK, w = new Float64Array(7), wg = new Float64Array(7), pz = new Float64Array(7), TWO_PI = 2 * Math.PI;
  const Q = new Float64Array(3), mixc = (c, f) => { if (f <= 0) return; Q[0] += f * (c[0] - Q[0]); Q[1] += f * (c[1] - Q[1]); Q[2] += f * (c[2] - Q[2]); }; // the texel's colour in CIELAB
  const core = new Float64Array(N * 4), OWN = new Uint8Array(N).fill(255); for (const i of provList) OWN[i] = RL_TI[terr[i]]; // the natural core mean per province (own-terrain texels), for the independents' hover keyline (§8.4)
  for (let ty = 0, k = 0; ty < BH; ty++) {
    let hy = (ty + 0.5) / 2 - 0.5; if (hy < 0) hy = 0; if (hy > HH - 1) hy = HH - 1; const iy = hy | 0, fy = hy - iy, iy1 = iy + 1 < HH ? iy + 1 : iy, r0 = iy * HW, r1 = iy1 * HW;
    let qy = (ty + 0.5) / 4 - 0.5; if (qy < 0) qy = 0; if (qy > QH - 1) qy = QH - 1; const jy = qy | 0, gy = qy - jy, jy1 = jy + 1 < QH ? jy + 1 : jy, q0 = jy * QW, q1 = jy1 * QW;
    const v = ((ty + 0.5) / TX) * KU;
    for (let tx = 0; tx < BW; tx++, k++) {
      const lt = LT[k], o4 = k * 4; if (lt === 255) { d8[o4 + 3] = 0; continue; }
      if (lt >= 7) { rlWildTexel(out, lt, tx, ty, d8, o4); continue; }
      let hx = (tx + 0.5) / 2 - 0.5; if (hx < 0) hx = 0; if (hx > HW - 1) hx = HW - 1; const ix = hx | 0, fx = hx - ix, ix1 = ix + 1 < HW ? ix + 1 : ix;
      const a00 = r0 + ix, a01 = r0 + ix1, a10 = r1 + ix, a11 = r1 + ix1, w00 = (1 - fx) * (1 - fy), w01 = fx * (1 - fy), w10 = (1 - fx) * fy, w11 = fx * fy;
      for (let t = 0; t < 7; t++) { const P = wc8[t]; w[t] = (P[a00] * w00 + P[a01] * w01 + P[a10] * w10 + P[a11] * w11) / 255; }
      const fsV = fS[a00] * w00 + fS[a01] * w01 + fS[a10] * w10 + fS[a11] * w11, shdV = shd[a00] * w00 + shd[a01] * w01 + shd[a10] * w10 + shd[a11] * w11, aoV = ao[a00] * w00 + ao[a01] * w01 + ao[a10] * w10 + ao[a11] * w11, shbV = shb[a00] * w00 + shb[a01] * w01 + shb[a10] * w10 + shb[a11] * w11;
      let qx = (tx + 0.5) / 4 - 0.5; if (qx < 0) qx = 0; if (qx > QW - 1) qx = QW - 1; const jx = qx | 0, gx = qx - jx, jx1 = jx + 1 < QW ? jx + 1 : jx;
      const b00 = q0 + jx, b01 = q0 + jx1, b10 = q1 + jx, b11 = q1 + jx1, v00 = (1 - gx) * (1 - gy), v01 = gx * (1 - gy), v10 = (1 - gx) * gy, v11 = gx * gy;
      let ws = 0; for (let t = 0; t < 7; t++) { const P = wch[t]; wg[t] = P[b00] * v00 + P[b01] * v01 + P[b10] * v10 + P[b11] * v11; ws += wg[t]; }
      if (ws < 1e-4) { wg.fill(0); wg[lt] = 1; ws = 1; }
      // the ground: the wide blend of each terrain's ground colour, and a broad mottle (fBm, 26 units)
      Q[0] = 0; Q[1] = 0; Q[2] = 0; for (let t = 0; t < 7; t++) { const f = wg[t] / ws; if (f > 0) { Q[0] += f * G[t][0]; Q[1] += f * G[t][1]; Q[2] += f * G[t][2]; } }
      const u = ((tx + 0.5) / TX) * KU; Q[0] += NAT.mottle * rlFbm(Tm, u / 26, v / 26, 3);
      for (let t = 0; t < 7; t++) { const q = (w[t] - NAT.pres0) / NAT.presW; pz[t] = q < 0 ? 0 : q > 1 ? 1 : q; } const pp = pz[0], ph = pz[3], pm = pz[4], ps = pz[5], pw = pz[6];
      if (pp > 0) { // plains: wind streaks (14 x 3.2 units), light-grass patches (fBm 11), dry patches (fBm 18)
        Q[0] += pp * 1.6 * rlVN(Ts, u / 14 + (0.6 * v) / 14, v / 3.2);
        mixc(M.plains.light, pp * Math.max(0, Math.min(1, rlFbm(Tm, u / 11 + 40, v / 11, 2) - 0.2)) * 0.6);
        mixc(M.plains.dry, pp * Math.max(0, Math.min(1, rlFbm(Td, u / 18 + 70, v / 18, 2) - 0.3)) * 0.8);
      }
      if (ph > 0) { // hills: heath blotches of turf and bracken (fBm 9), rock specks
        const hb = rlFbm(Th, u / 9, v / 9, 3);
        mixc(M.hills.turf, ph * Math.max(0, Math.min(1, hb * 1.4)) * 0.75); mixc(M.hills.bracken, ph * Math.max(0, Math.min(1, -hb * 1.4 - 0.2)) * 0.6);
        if (rlVN(Tr, u / 1.6, v / 1.6) > 0.78) mixc(M.hills.rock, ph * 0.7);
      }
      if (pm > 0) { // mountains: scree where the ground is concave or noisy, turf in deep valleys, rock micro-relief
        mixc(M.mountains.scree, pm * Math.max(0, Math.min(1, aoV * 1.2 + 0.4 * rlFbm(Tr, u / 5 + 9, v / 5, 2) - 0.1)) * 0.6);
        mixc(M.mountains.turf, pm * Math.max(0, Math.min(1, (aoV - 0.5) * 2)) * 0.5); Q[0] += pm * 2.0 * rlFbm(Tmi, u / 3.5, v / 3.5, 3);
      }
      let pool = 0;
      if (ps > 0) { // swamp: dark peat pools (fBm 9 > 0.40, drawn last), reed beds as short strokes, shrubs
        pool = Math.max(0, Math.min(1, (rlFbm(Tp, u / 9, v / 9, 3) - 0.40) / 0.08)) * ps;
        const reed = Math.max(0, Math.min(1, (rlVN(Tre, u / 0.9, v / 4.5) * 0.6 + rlFbm(Tre, u / 12 + 7, v / 12, 2) - 0.25) * 2)) * ps * (1 - pool);
        mixc(M.swamp.reed, reed * 0.7); if (rlVN(Tsc, u / 1.3 + 3, v / 1.3) > 0.72) mixc(M.swamp.shrub, ps * (1 - pool) * 0.8);
      }
      if (pw > 0) { // wasteland: pale drifts, a crack network (cells 6 units), ripples and streaks, scrub dots
        const cu = u / 6, cv = v / 6, iu = Math.floor(cu), iv = Math.floor(cv); let d1 = 9, d2 = 9;
        for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) { const h = rlH2(iu + ox, iv + oy, 11), dx = cu - (iu + ox + rlH2a(h)), dy = cv - (iv + oy + rlH2b(h)), dd = dx * dx + dy * dy; if (dd < d1) { d2 = d1; d1 = dd; } else if (dd < d2) d2 = dd; }
        const crack = Math.max(0, Math.min(1, 1 - (Math.sqrt(d2) - Math.sqrt(d1)) / 0.05)) * (rlVN(Td, u / 7, v / 7) > -0.35 ? 1 : 0);
        mixc(M.wasteland.pale, pw * Math.max(0, Math.min(1, rlFbm(Td, u / 16 + 5, v / 16, 2))) * 0.7 * 0.6); mixc(M.wasteland.crack, pw * crack * 0.8);
        Q[0] += pw * (1.2 * Math.sin((u * 0.8 + v * 0.6) / 1.3 + 3 * rlVN(Td, u / 20, v / 20)) + 2.5 * rlFbm(Td, u / 8 + 3, v / 3, 2));
        if (rlVN(Tsc, u / 1.4, v / 1.4) > 0.78) mixc(M.wasteland.scrub, pw * 0.85);
      }
      const c = cls[k], tone = ftone[k];
      if (tone) { // a field: its crop's tone, uneven, with furrows along the strip (the green crop excepted), and its hedgerow
        const fc = M.farmland[NAT.tones[tone - 1]]; Q[0] = fc[0] + 1.2 * rlVN(Tf, u / 3, v / 3) + (tone !== 3 ? 1.6 * Math.sin((fph[k] / 256) * TWO_PI) : 0); Q[1] = fc[1]; Q[2] = fc[2];
        mixc(M.farmland.hedge, (fhedge[k] / 255) * NAT.field.hedgeA);
      }
      const canopy = c === 2 || c === 9 || c === 10;
      if (!canopy) Q[0] -= NAT.shadowL * shbV;
      else { // crowns: a jittered grid 2.3 units apart, each a dome lit from the upper left; gaps darker; conifer stands darker and bluer; a broad stand mottle
        const gu = u / NAT.crown, gv = v / NAT.crown, iu = Math.floor(gu), iv = Math.floor(gv); let best = 9, bdx = 0, bdy = 0;
        for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) { const h = rlH2(iu + ox, iv + oy, 37), rr = 0.55 + 0.35 * rlH2c(h), ddx = (gu - (iu + ox + rlH2a(h))) / rr, ddy = (gv - (iv + oy + rlH2b(h))) / rr, dd = Math.sqrt(ddx * ddx + ddy * ddy); if (dd < best) { best = dd; bdx = ddx; bdy = ddy; } }
        const crown = Math.max(0, 1 - best * best), lit = -(bdx + bdy) * 0.7071, cl = best < 1 ? 3.5 * crown + 5.0 * lit * Math.sqrt(crown) - 1.0 : -6.0;
        const cc = rlFbm(Tco, u / 22, v / 22, 2) > 0.25 ? M.forest.conifer : M.forest.canopy; Q[0] = cc[0] + cl + 2.0 * rlFbm(Tm, u / 30 + 11, v / 30, 2); Q[1] = cc[1]; Q[2] = cc[2];
      }
      // relief: the shared hillshade with the natural caps, blended by the cover weights; cast shadow and valleys; a canopy damps the ground's shading
      let cap = 0; for (let t = 0; t < 7; t++) cap += CAP[t] * w[t];
      const rel = cap * (fsV < -1 ? -1 : fsV > NAT.lit ? NAT.lit : fsV) - NAT.castL * shdV - NAT.valleyL * aoV;
      Q[0] += canopy ? rel * NAT.damp : rel;
      if (pool > 0) { mixc(M.swamp.pool, pool); Q[0] += pool * 1.2 * rlVN(Tp, u / 2, v / 2); } // pools last: flat dark peat-water
      rlLabTo(Q[0], Q[1], Q[2], d8, o4); d8[o4 + 3] = 255;
      if ((k & 3) === 0 && lt === OWN[id[k]]) { const q = id[k] * 4; core[q] += Q[0]; core[q + 1] += Q[1]; core[q + 2] += Q[2]; core[q + 3]++; }
    }
    if ((ty & 63) === 63) yield;
  }
  lap('materials');
  for (let ty = 0; ty < BH; ty++) for (let tx = 0; tx < BW; tx++) { // antialias the rounded corners (the nearest province's natural ground)
    const x = (tx + 0.5) / TX, y = (ty + 0.5) / TX; if (!((x < RL_RC || x > W - RL_RC) && (y < RL_RC || y > H - RL_RC))) continue;
    const cx = x < RL_RC ? RL_RC : W - RL_RC, cy = y < RL_RC ? RL_RC : H - RL_RC, dd = Math.hypot(x - cx, y - cy) - RL_RC, cov = Math.max(0, Math.min(1, 0.5 - dd * TX)), o4 = (ty * BW + tx) * 4;
    if (cov > 0 && d8[o4 + 3] === 0) { const nb = nearest(x, y), c = RL_WILDK[nb] ? rgb2lab(hex2rgb(RL_C.granite)) : M[terr[nb]].ground; rlLabTo(c[0], c[1], c[2], d8, o4); }
    d8[o4 + 3] = Math.round(255 * cov);
  }
  const coreKey = new Array(N).fill(null), coreHex = new Array(N).fill(null);
  for (const i of provList) { const q = i * 4; if (!core[q + 3]) continue; const rgb = [0, 0, 0]; rlLabTo(core[q] / core[q + 3], core[q + 1] / core[q + 3], core[q + 2] / core[q + 3], rgb, 0); coreHex[i] = rgb2hex(rgb); coreKey[i] = rlKeyFor(rgb); }
  yield; lap('corners');
  yield* rlFinishLook(out, 'natural', img, tm, lap);
  out.L.natural.coreKey = coreKey; out.L.natural.coreHex = coreHex;
}

// ------------------------------------------------------------------ v4 relief: the live layers (glow, fog, modes), the static layers and the draw; the rim is p59a, the lines and water p59b
// natural §6: the land shows the look of the setting (Natural by default, Clear with "Clear terrain colours") or, in the Terrain mode, the Clear bake as baked;
// a look that is not baked yet is prepared in the background while the ready one stays on screen, and the swap cross-fades over 150 ms (instant under reduced motion).
// Per-province edges of the straight cells and the cell across each (-1: the model's edge)
const RL_EDGES = cells.map((ring, i) => {
  const out = [], [cx, cy] = cent[i];
  for (let k = 0; k < ring.length - 1; k++) {
    const a = ring[k], b = ring[k + 1]; let j = -1;
    for (const q of NB[i]) { const e = edgeBetween(i, q); if (e && ((PEQ(e.a, a) && PEQ(e.b, b)) || (PEQ(e.a, b) && PEQ(e.b, a)))) { j = q; break; } }
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; let nx = -dy / L, ny = dx / L; // the inward normal: toward the centroid
    if ((cx - a[0]) * nx + (cy - a[1]) * ny < 0) { nx = -nx; ny = -ny; }
    out.push({ a, b, j, nx, ny, len: L });
  }
  return out;
});
const ownerOf = (i) => (i < 0 || isWild(i) ? undefined : prov[i].owner);
const isRealmEdge = (i, e) => { const o = prov[i].owner; return !!o && e.j >= 0 && !isWild(e.j) && prov[e.j].owner !== o; };

// ---- the live layers at half the bake's resolution: the rim glow along realm edges and the fog hem (one raster, re-made when ownership or fog changes).
// hemOnly: the Terrain mode's raster (no glow; the fog states stay, natural §6). The hem peaks at 12% over the look's own haze.
let GLOW = null, GLOWH = null;
const rlFogAt = (i) => (RL_DBG.fog !== undefined ? RL_DBG.fog : fogOf(i)); // review only: RL_DBG.fog forces one state on every province (the readability check)
function rlGlow(hemOnly) {
  if (!RB.ready) return null; const F = RL_FOG();
  const sig = provList.map((i) => (hemOnly ? '' : (prov[i].owner ?? '-')[0]) + (rlFogAt(i) ?? '-')[0]).join('') + '|' + F.haze;
  const C = hemOnly ? GLOWH : GLOW; if (C && C.sig === sig) return C;
  const t0 = performance.now(), { HW, HH, TX, hid } = RB, T2 = TX / 2, Wg = RL_P.glowD * RLD, acc = new Float32Array(HW * HH * 2), owner = new Uint8Array(HW * HH); // [glow alpha, hem extra]
  const band = (i, e, Wd, slot) => {
    const x0 = Math.max(0, Math.floor((Math.min(e.a[0], e.b[0]) - Wd) * T2)), x1 = Math.min(HW - 1, Math.ceil((Math.max(e.a[0], e.b[0]) + Wd) * T2)), y0 = Math.max(0, Math.floor((Math.min(e.a[1], e.b[1]) - Wd) * T2)), y1 = Math.min(HH - 1, Math.ceil((Math.max(e.a[1], e.b[1]) + Wd) * T2));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const k = y * HW + x; if (hid[k] !== i) continue; const d = rlSegDist((x + 0.5) / T2, (y + 0.5) / T2, e.a[0], e.a[1], e.b[0], e.b[1]); if (d >= Wd) continue;
      const v = slot === 0 ? RL_P.glow * Math.pow(1 - d / Wd, RL_P.glowPow) : (F.hemPeak - F.haze) / (1 - F.haze) * (1 - d / Wd);
      if (v > acc[k * 2 + slot]) acc[k * 2 + slot] = v;
    }
  };
  for (const i of provList) {
    const p = prov[i];
    if (p.owner && !hemOnly) for (const e of RL_EDGES[i]) if (isRealmEdge(i, e)) band(i, e, Wg, 0);
    if (rlFogAt(i) === 'unexplored') for (const e of RL_EDGES[i]) if (e.j >= 0 && !isWild(e.j) && rlFogAt(e.j) !== 'unexplored') band(i, e, Wg, 1);
  }
  const img = new ImageData(HW, HH), d = img.data, ban = { red: hex2rgb(BAN.red), green: hex2rgb(BAN.green) }, hz = hex2rgb(RL_C.gesso);
  for (let k = 0; k < HW * HH; k++) {
    const a1 = acc[k * 2], a2 = acc[k * 2 + 1]; if (!a1 && !a2) continue; const o = hid[k], G = a1 ? ban[prov[o].owner] : hz;
    const A = a2 + a1 * (1 - a2); for (let c = 0; c < 3; c++) d[k * 4 + c] = Math.round((hz[c] * a2 + G[c] * a1 * (1 - a2)) / A); d[k * 4 + 3] = Math.round(255 * A);
  }
  const cv = makeCanvas(HW, HH); cv.getContext('2d').putImageData(img, 0, 0);
  const R = { sig, canvas: cv, ms: performance.now() - t0 }; if (hemOnly) GLOWH = R; else GLOW = R; return R;
}
// ---- data modes: each province shows its mode color shaded by the gentle fixed relief (+-3 L*, mean-neutral), wilds left to the bake
let MODER = null;
function rlModeRaster() {
  if (!RB.ready || state.mode === 'ownership' || state.mode === 'terrain') return null; // the Terrain mode's raster is the Clear bake itself (natural §6)
  const cols = provList.map((i) => fillFor(prov[i])), sig = state.mode + '|' + cols.join(',');
  if (MODER && MODER.sig === sig) return MODER;
  const t0 = performance.now(), { HW, HH, hid, modeRelief } = RB, lut = new Array(N).fill(null);
  provList.forEach((i, k) => { const lab = rgb2lab(hex2rgb(cols[k])), row = new Uint8ClampedArray(17 * 3), tmp = [0, 0, 0]; for (let s = 0; s < 17; s++) { rlLabTo(Math.max(0, Math.min(100, lab[0] + (s - 8) * 0.5)), lab[1], lab[2], tmp, 0); row.set(tmp, s * 3); } lut[i] = row; });
  const img = new ImageData(HW, HH), d = img.data;
  for (let k = 0; k < HW * HH; k++) { const o = hid[k]; if (o === 255 || RL_WILDK[o]) continue; const s = Math.max(0, Math.min(16, Math.round(modeRelief[k] * 2 + 8))), row = lut[o]; d[k * 4] = row[s * 3]; d[k * 4 + 1] = row[s * 3 + 1]; d[k * 4 + 2] = row[s * 3 + 2]; d[k * 4 + 3] = 255; }
  const cv = makeCanvas(HW, HH); cv.getContext('2d').putImageData(img, 0, 0); MODER = { sig, canvas: cv, img, ver: (MODER ? MODER.ver : 0) + 1, ms: performance.now() - t0 }; return MODER;
}
function rlAfterBake() { GLOW = null; GLOWH = null; MODER = null; RCK = null; RL_PIECE_CACHE.clear(); RL_LINES.cache.clear(); RL_SEATG.clear(); for (const k of ['natural', 'clear']) if (RB.L[k]) RB.L[k].washKeys = null; }

// ---- the relief static layers: "under" (scene, model, land, live composite, water) and "over" (wild contours, rails, lip, pieces, labels)
const rlU = document.createElement('canvas'), rlUg = rlU.getContext('2d'), rlO = document.createElement('canvas'), rlOg = rlO.getContext('2d');
let RCK = null; const RREB = { n: 0, ms: 0, why: '' };
const rlPiecesSig = () => Object.values(cmd).map((c) => (c.hidden ? '' : c.id + c.at + ':' + (c.eta ?? '') + (c.prophet ? 'P' : ''))).join(',');
const rlStaticSig = () => ['relief', state.mode, KEYVER, view.table, view.detail, view.pass, view.reduced, curMonth, fontsReady, dpr, cw, ch, decoTo, RB.ready, RB.ver, RB.lookVer, rlShownLook(), view.terrain, RL_DBG.fog ?? '', [...SKIP].join(''), view.tint, rlPiecesSig(), state.sel ? state.sel.type + state.sel.id : '', moveLine ? moveLine.path.join('.') : '', RL_NUMBERS.on, RL_NUMBERS.shift, FIGS.ver].join('|');
// ---- the land-look wash: composited per texel into each look's canvases (and mips) from their unwashed copies whenever a province's wash changes.
// Canvas 2D blends in 8-bit premultiplied color, so a 1.2% polygon fill lands as a darkening (Ashfen measured 0.6 dE off); this is the shader's mix done on the CPU.
const RLW = { ms: 0, n: 0 };
const rlWashOf = (i, on) => { const p = prov[i]; if (!on || fogOf(i) || !p.dom.n || !RL_WASH[p.dom.n]) return 0; return (RL_WASH[p.dom.n][1] * p.dom.s) / 10; };
function rlWashSync(look) {
  const Lk = RB.L[look]; if (!RB.ready || !Lk) return;
  const on = decoTo >= 0.5 && !RL_DBG.noWash && !RL_DBG.noLive, A = new Float32Array(N), C = new Float32Array(N * 3);
  for (const i of provList) { A[i] = rlWashOf(i, on); if (A[i]) { const w = hex2rgb(RL_WASH[prov[i].dom.n][0]); for (let c = 0; c < 3; c++) C[i * 3 + c] = w[c] * A[i]; } }
  const keys = provList.map((i) => (A[i] ? prov[i].dom.n[0] + A[i].toFixed(4) : '-')), was = Lk.washKeys ?? provList.map(() => '-'), dirty = provList.filter((i, k) => keys[k] !== was[k]);
  Lk.washKeys = keys; if (!dirty.length) return;
  const t0 = performance.now();
  for (const [cv, base, ids] of [[Lk.canvas, Lk.img, null], [Lk.mip1, Lk.mb1, RB.mid1], [Lk.mip2, Lk.mb2, RB.mid2]]) {
    const w = base.width, h = base.height, f = (RB.TX * w) / RB.BW, B = base.data, idOf = ids ? (k) => ids[k] : (k) => (RB.LT[k] < 7 ? RB.id[k] : 255), g = cv.getContext('2d');
    for (const i of dirty) {
      const bb = geo(i).bb, x0 = Math.max(0, Math.floor(bb[0] * f) - 2), y0 = Math.max(0, Math.floor(bb[1] * f) - 2), x1 = Math.min(w - 1, Math.ceil(bb[2] * f) + 2), y1 = Math.min(h - 1, Math.ceil(bb[3] * f) + 2), bw = x1 - x0 + 1, bh = y1 - y0 + 1;
      const out = new ImageData(bw, bh), D = out.data;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const k = y * w + x, o4 = k * 4, d4 = ((y - y0) * bw + x - x0) * 4, o = idOf(k); D[d4 + 3] = B[o4 + 3];
        if (o === 255) { D[d4] = B[o4]; D[d4 + 1] = B[o4 + 1]; D[d4 + 2] = B[o4 + 2]; continue; }
        let a = A[o], r = C[o * 3], gg = C[o * 3 + 1], b = C[o * 3 + 2];
        if (x > 0 && y > 0 && x < w - 1 && y < h - 1 && (idOf(k - 1) !== o || idOf(k + 1) !== o || idOf(k - w) !== o || idOf(k + w) !== o)) { // a 3x3 average across a border, so the step is soft
          a = 0; r = gg = b = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { let q = idOf(k + dy * w + dx); if (q === 255) q = o; a += A[q]; r += C[q * 3]; gg += C[q * 3 + 1]; b += C[q * 3 + 2]; }
          a /= 9; r /= 9; gg /= 9; b /= 9;
        }
        D[d4] = Math.round(B[o4] * (1 - a) + r); D[d4 + 1] = Math.round(B[o4 + 1] * (1 - a) + gg); D[d4 + 2] = Math.round(B[o4 + 2] * (1 - a) + b);
      }
      g.putImageData(out, x0, y0);
    }
  }
  RLW.ms += performance.now() - t0; RLW.n++;
}
const RL_XF = { from: null, to: null, t0: 0 }; // the look cross-fade (150 ms)
const rlXfT = (now) => (RL_XF.from && !view.reduced ? Math.min(1, (now - RL_XF.t0) / 150) : 1);
const rlNatHex = (t) => { const c = RL_NAT.mat[t].ground, o = [0, 0, 0]; rlLabTo(c[0], c[1], c[2], o, 0); return rgb2hex(o); };
function rlRenderStatic(gU, gO, now) {
  const band = bandOf(cam.s), px = 1 / cam.s, covers = (r) => r[0] <= VW[0] && r[1] <= VW[1] && r[2] >= VW[2] && r[3] >= VW[3];
  gU.setTransform(1, 0, 0, 1, 0, 0); gO.setTransform(1, 0, 0, 1, 0, 0); gO.clearRect(0, 0, gO.canvas.width, gO.canvas.height);
  const g = gU;
  if (view.table === 'off') { g.fillStyle = '#15130F'; g.fillRect(0, 0, g.canvas.width, g.canvas.height); }
  else {
    const roomShows = !covers(TABLE);
    if (roomShows) {
      if (!covers(ROOM)) { g.fillStyle = '#0E0905'; g.fillRect(0, 0, g.canvas.width, g.canvas.height); }
      worldT(g);
      if (view.table === 'full') blitRing(g, bakeRoom(), ROOM, TABLE);
      else { const [cx, cy] = [(TABLE[0] + TABLE[2]) / 2, (TABLE[1] + TABLE[3]) / 2], rg = g.createRadialGradient(cx, cy, TW * 0.3, cx, cy, TW * 1.1); rg.addColorStop(0, '#2A2018'); rg.addColorStop(1, '#0E0905'); g.fillStyle = rg; g.fillRect(ROOM[0], ROOM[1], ROOM[2] - ROOM[0], ROOM[3] - ROOM[1]); }
    }
    worldT(g); const T = bakeTable(); blitRegion(g, T, T.x0, T.y0, T.x0 + T.w, T.y0 + T.h);
    if (view.table === 'full' && roomShows) { screenT(g); const vg = g.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.35, cw / 2, ch / 2, Math.hypot(cw, ch) * 0.6); vg.addColorStop(0, 'rgba(14,9,5,0)'); vg.addColorStop(1, 'rgba(14,9,5,.5)'); g.fillStyle = vg; g.save(); g.beginPath(); g.rect(0, 0, cw, ch); const [a, b] = toScreen(MODEL_BOX[0], MODEL_BOX[1]), [c, d] = toScreen(MODEL_BOX[2], MODEL_BOX[3]); g.rect(a, b, c - a, d - b); g.clip('evenodd'); g.fillRect(0, 0, cw, ch); g.restore(); }
  }
  worldT(g); const RM = rlRim(); blitRegion(g, RM, RM.x0, RM.y0, RM.x0 + RM.w, RM.y0 + RM.h);
  // the land: the shown look's bake (a mip below 0.6 texels per pixel) with the land-look wash composited in, or flat grounds while the map is being prepared
  if (RB.ready) {
    // the blit: bilinear while it upscales the chosen source, high quality only while it shrinks it ('high' upscaling cost about 255 of a 334 ms re-render at Near for a 0.31/255 mean change; critique fix 12)
    const lvl = rlMipLevel(), x0 = Math.max(0, VW[0]), y0 = Math.max(0, VW[1]), x1 = Math.min(W, VW[2]), y1 = Math.min(H, VW[3]), xf = rlXfT(now);
    const blitLook = (look, a) => { const Lk = RB.L[look]; if (!Lk || !Lk.ready || a <= 0) return; rlWashSync(look); const src = lvl === 2 ? Lk.mip2 : lvl === 1 ? Lk.mip1 : Lk.canvas, k = src.width / W;
      g.imageSmoothingQuality = src.width / W < cam.s * dpr ? 'low' : 'high'; g.globalAlpha = a; if (x1 > x0 && y1 > y0) g.drawImage(src, x0 * k, y0 * k, (x1 - x0) * k, (y1 - y0) * k, x0, y0, x1 - x0, y1 - y0); g.globalAlpha = 1; };
    if (xf < 1 && RL_XF.from) blitLook(RL_XF.from, 1); blitLook(RL_XF.to ?? rlShownLook(), xf < 1 && RL_XF.from ? xf : 1);
  } else {
    const nat = rlLandLook() === 'natural';
    g.save(); modelPath(g); g.clip(); for (const p of provs) { pathPoly(g, cells[p.i]); g.fillStyle = nat ? rlNatHex(p.terrain) : RL_ALB[p.terrain]; g.fill(); } for (const w of WILDS) for (const c of w.cells) { pathPoly(g, cells[c]); g.fillStyle = w.kind === 'peaks' ? RL_C.granite : RL_C.mere; g.fill(); } g.restore();
  }
  // the live composite: the data-mode raster (cross-fades over 150 ms), then in Ownership: the realm tint option, the glow and fog; in the Terrain mode: the fog alone.
  // Fog by look (natural §8.3): Natural hazes unexplored land 6% and then desaturates it 40%, and desaturates out-of-sight land 25%; Clear keeps the approved 4% and 10%.
  g.save(); modelPath(g); g.clip();
  const tmode = state.mode === 'terrain', liveA = tmode ? 1 : decoAlpha, F = RL_FOG();
  const MR = !tmode && decoAlpha < 0.999 ? rlModeRaster() : null; if (MR) { g.globalAlpha = 1 - decoAlpha; g.drawImage(MR.canvas, 0, 0, W, H); g.globalAlpha = 1; }
  if (liveA > 0.001 && RB.ready && !RL_DBG.noLive) {
    g.globalAlpha = liveA;
    if (view.tint && !tmode) for (const p of provs) { if (!p.owner) continue; pathPoly(g, cells[p.i]); g.fillStyle = rgba(BAN[p.owner], RL_P.realmTint); g.fill(); }
    const GL = RL_DBG.noGlow ? null : rlGlow(tmode); if (GL) g.drawImage(GL.canvas, 0, 0, W, H);
    for (const p of provs) { if (rlFogAt(p.i) !== 'unexplored') continue; pathPoly(g, cells[p.i]); g.fillStyle = rgba(RL_C.gesso, F.haze); g.fill(); }
    g.globalCompositeOperation = 'saturation';
    for (const p of provs) { const f = rlFogAt(p.i), s = f === 'outofsight' ? F.outSat : f === 'unexplored' ? F.unexSat : 0; if (!s) continue; pathPoly(g, cells[p.i]); g.fillStyle = `rgba(128,128,128,${s})`; g.fill(); }
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  }
  g.restore();
  rlDrawWater(g, px, tmode ? 1 : decoAlpha); // the Terrain mode keeps its water (natural §6)
  if (!RB.ready) { screenT(g); const [mx, my] = toScreen(W / 2, H / 2); g.font = "500 15px 'Alegreya Sans', sans-serif"; g.textAlign = 'center'; g.fillStyle = 'rgba(20,18,15,.8)'; g.fillRect(mx - 110, my - 16, 220, 32); g.fillStyle = '#F4EEDF'; g.fillText('Preparing the map…', mx, my + 1); worldT(g); }
  // over: wild contours, rails and hairlines, the worn lip, pieces, labels
  worldT(gO); gO.save(); modelPath(gO); gO.clip();
  if (!SKIP.has('rails')) rlDrawRails(gO, band, px);
  gO.restore();
  rlDrawWildContours(gO, px);
  gO.save(); modelPath(gO); gO.clip(); gO.strokeStyle = 'rgba(233,228,216,.5)'; gO.lineWidth = 3 * px; modelPath(gO); gO.stroke(); gO.restore(); // the worn lip, 1.5 px on the land's side
  if (view.pass) { gO.save(); gO.beginPath(); for (const p of provs) if (p.i !== cmd.varo.at && !pathTo(cmd.varo.at, p.i)) { cells[p.i].forEach(([x, y], k) => (k ? gO.lineTo(x, y) : gO.moveTo(x, y))); gO.closePath(); } gO.clip(); gO.strokeStyle = 'rgba(28,26,23,.55)'; gO.lineWidth = 1.6 * px; gO.beginPath(); for (let d = -H; d < W + H; d += 9 * px) { gO.moveTo(d, 0); gO.lineTo(d + H, H); } gO.stroke(); gO.restore(); }
  const lay = rlLayout(band);
  screenT(gO); if (!SKIP.has('pieces')) rlDrawPieces(gO, band, lay); if (!SKIP.has('labels')) rlPaintLabels(gO, lay);
  gO.setTransform(1, 0, 0, 1, 0, 0); gU.setTransform(1, 0, 0, 1, 0, 0);
  RL_LAST_LAYOUT = lay;
}
let RL_LAST_LAYOUT = null; const RL_DBG = { mip: null }; // review only: force a mip level
function rlRenderCache(now, sig, why) {
  const m = 0.35, vw = cw * (1 + 2 * m), vh = ch * (1 + 2 * m), W2 = Math.round(vw * dpr), H2 = Math.round(vh * dpr);
  for (const c of [rlU, rlO]) if (c.width !== W2 || c.height !== H2) { c.width = W2; c.height = H2; }
  const sx = cam.x, sy = cam.y, scw = cw, sch = ch, ox = Math.round(m * cw * dpr) / dpr, oy = Math.round(m * ch * dpr) / dpr; // whole device pixels: the blit is an exact copy
  cam.x += ox; cam.y += oy; cw = vw; ch = vh; VW = visibleWorld();
  const t0 = performance.now(); try { rlRenderStatic(rlUg, rlOg, now); } finally { RREB.n++; RREB.ms += performance.now() - t0; RREB.why = why;
    RCK = { sig, s: cam.s, wx0: -cam.x / cam.s, wy0: -cam.y / cam.s, ww: vw / cam.s, wh: vh / cam.s, ox: cam.x, oy: cam.y };
    cam.x = sx; cam.y = sy; cw = scw; ch = sch; VW = visibleWorld(); }
}
function rlDraw() {
  if (checkFonts()) onFontsArrived();
  if (!RB.ready) rlStartBake(); else rlEnsureLook(rlLandLook()); if (!FIGS.started) rlStartFigures();
  const now = performance.now(); animating = false;
  let decoAnim = false;
  { const shown = RB.ready ? rlShownLook() : null; if (shown && RL_XF.to !== shown) { RL_XF.from = RL_XF.to; RL_XF.to = shown; RL_XF.t0 = now; } if (RL_XF.from && rlXfT(now) < 1) { decoAnim = true; animating = true; } else if (RL_XF.from) { RL_XF.from = null; decoAnim = true; } } // the look cross-fade re-renders each frame
  if (decoAlpha !== decoTo) { const t = view.reduced ? 1 : Math.min(1, (now - decoT0) / 150); decoAlpha = decoFrom + (decoTo - decoFrom) * t; decoAnim = true; if (t < 1) animating = true; }
  VW = visibleWorld();
  const band = bandOf(cam.s), sig = rlStaticSig();
  const inside = RCK && VW[0] >= RCK.wx0 && VW[1] >= RCK.wy0 && VW[2] <= RCK.wx0 + RCK.ww && VW[3] <= RCK.wy0 + RCK.wh;
  const zooming = RCK && cam.s !== RCK.s && now < zoomingUntil && inside;
  if (!RCK || RCK.sig !== sig || decoAnim || !inside || (cam.s !== RCK.s && !zooming)) rlRenderCache(now, sig, !RCK ? 'none' : RCK.sig !== sig ? 'sig' : decoAnim ? 'deco' : !inside ? 'outside' : 'scale');
  if (zooming) setTimeout(requestDraw, zoomingUntil - now + 10);
  const g = ctx; g.setTransform(1, 0, 0, 1, 0, 0);
  if (zooming) { g.fillStyle = '#0E0905'; g.fillRect(0, 0, canvas.width, canvas.height); }
  const blit = (c) => { if (cam.s === RCK.s) { g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(c, Math.round((cam.x - RCK.ox) * dpr), Math.round((cam.y - RCK.oy) * dpr)); worldT(g); } else { worldT(g); g.drawImage(c, RCK.wx0, RCK.wy0, RCK.ww, RCK.wh); } };
  worldT(g); blit(rlU);
  const px = 1 / cam.s, own = state.mode === 'ownership';
  // live: the hovered, linked and selected provinces' tints under the rails and pieces (Ownership only; data modes draw the line alone)
  const hp = hoverProv >= 0 && !isWild(hoverProv) ? hoverProv : -1, lp = RL_LINK.prov, sp = state.sel && state.sel.type === 'prov' ? state.sel.id : -1;
  if (own && RB.ready) { g.save(); modelPath(g); g.clip(); for (const [i, sel] of [[hp, false], [lp, false], [sp, true]]) { if (i < 0 || (sel === false && i === sp)) continue; const [c, a] = rlTintOf(i, sel); pathPoly(g, cells[i]); g.fillStyle = rgba(c, a); g.fill(); } g.restore(); }
  blit(rlO);
  for (const i of [hp, lp]) if (i >= 0 && i !== sp) { if (prov[i].owner) { g.save(); modelPath(g); g.clip(); rlDrawRails(g, bandOf(cam.s), px, { only: i, extra: 0.5 }); g.restore(); } rlInnerLine(g, i, px, 1, 0.7); }
  if (sp >= 0) rlInnerLine(g, sp, px, 1.5, 1);
  screenT(g);
  RL_CHIPS.length = 0; if (!SKIP.has('arrows')) { if (moveLine) rlThread(g, moveLine); if (!cmd.ilsa.hidden && cmd.ilsa.eta > 0) { const a = rlPieceAt('ilsa') ?? cent[cmd.ilsa.at]; rlArrow(g, a, cent[cmd.ilsa.to], cmd.ilsa.to, '#9FE0C2', `${cmd.ilsa.eta}d`); } rlLiveLabels(g, band); }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  present(now, true);
  if (!SKIP.has('badges')) rlPlacePieces(band);
  updateZoomChip(band);
  if (RB.ready && !window.__rlReadyMs) window.__rlReadyMs = performance.now() - T_START; // the first frame with the bake
  if (!window.__firstPaintMs) { window.__firstPaintMs = performance.now(); window.__firstPaintFromScript = performance.now() - T_START; }
  firstPaint = false;
  if (animating) requestDraw();
}
// ---- the brass compass prop in the table's upper-right slot (the cloth's compass rose moves to the table; inert, like the other props)
function rlCompass(g) {
  const x = W * 0.82, y = CLOTH[1] - POFF + 4, r = 34;
  g.fillStyle = 'rgba(0,0,0,.32)'; ellipse(g, x + 6, y + 7, r + 2, r + 2); g.fill();
  const rg = g.createLinearGradient(x - r, y - r, x + r, y + r); rg.addColorStop(0, '#D4B26A'); rg.addColorStop(0.5, '#B8914A'); rg.addColorStop(1, '#7A5F2E');
  g.fillStyle = rg; ellipse(g, x, y, r, r); g.fill(); g.fillStyle = '#E8DCC2'; ellipse(g, x, y, r * 0.8, r * 0.8); g.fill();
  g.strokeStyle = '#7A5F2E'; g.lineWidth = 1.2; ellipse(g, x, y, r * 0.8, r * 0.8); g.stroke();
  g.strokeStyle = 'rgba(28,26,23,.55)'; g.lineWidth = 0.9; for (let k = 0; k < 32; k++) { const a = (k * Math.PI) / 16, l = k % 4 ? 0.06 : 0.12; g.beginPath(); g.moveTo(x + Math.cos(a) * r * 0.78, y + Math.sin(a) * r * 0.78); g.lineTo(x + Math.cos(a) * r * (0.78 - l), y + Math.sin(a) * r * (0.78 - l)); g.stroke(); }
  for (let k = 0; k < 4; k++) { const a = (k * Math.PI) / 2 - Math.PI / 2, tip = [x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62], l = [x + Math.cos(a - Math.PI / 2) * 4, y + Math.sin(a - Math.PI / 2) * 4], rr = [x + Math.cos(a + Math.PI / 2) * 4, y + Math.sin(a + Math.PI / 2) * 4];
    g.fillStyle = k === 0 ? '#7A1E12' : '#3E3428'; g.beginPath(); g.moveTo(...l); g.lineTo(...tip); g.lineTo(...rr); g.closePath(); g.fill(); }
  g.fillStyle = '#B8914A'; ellipse(g, x, y, 3, 3); g.fill(); g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.ellipse(x - r * 0.2, y - r * 0.25, r * 0.5, r * 0.28, -0.6, 0, Math.PI * 2); g.fill();
  g.font = "10px 'Marcellus SC', Georgia, serif"; g.fillStyle = '#1C1A17'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('N', x, y - r * 0.42);
}

// ------------------------------------------------------------------ v4 relief: the rim (the model's shadow on the oak, its cliff face, the plinth, waterfalls, the brass plaque)
// natural §10 defect 5: the face is strata-led (it read as vertical stripes): horizontal strata 6 to 13 units deep, each with its own value, a lit ledge on each top and a
// shadow below, gentle bends and fault steps every 80 to 200 units, short joints inside one stratum only, low-frequency weathering; no full-height facets.
let RIM = null, RIMKEY = '';
function rlOutlineSouth(n) { // the south half of the rounded outline, west to east: [x, y, nx, ny] with the outward normal
  const out = [], rc = RL_RC;
  for (let k = 0; k <= n; k++) { const t = Math.PI - (k / n) * (Math.PI / 2); out.push([rc + rc * Math.cos(t), H - rc + rc * Math.sin(t), Math.cos(t), Math.sin(t)]); }
  const m = Math.max(8, Math.round((W - 2 * rc) / (6 * RLK))); for (let k = 1; k < m; k++) out.push([rc + ((W - 2 * rc) * k) / m, H, 0, 1]);
  for (let k = 0; k <= n; k++) { const t = Math.PI / 2 - (k / n) * (Math.PI / 2); out.push([W - rc + rc * Math.cos(t), H - rc + rc * Math.sin(t), Math.cos(t), Math.sin(t)]); }
  return out;
}
function rlRim() {
  const key = dpr + ':' + fontsReady + ':' + RB.ver + ':' + view.table;
  if (RIM && RIMKEY === key) return RIM;
  RIMKEY = key; const res = 0.9 * Math.min(2, dpr), hs = RL_FACE, pl = RL_PLINTH;
  RIM = bakeWorld([-70, -60, W + 80, H + hs + 70], res, (g) => {
    const S = rlOutlineSouth(14);
    const silhouette = () => { g.beginPath(); g.moveTo(0, RL_RC); g.lineTo(0, H - RL_RC); for (const [x, y] of S) g.lineTo(x, y + hs); g.lineTo(W, RL_RC); g.arcTo(W, 0, W - RL_RC, 0, RL_RC); g.lineTo(RL_RC, 0); g.arcTo(0, 0, 0, RL_RC, RL_RC); g.closePath(); };
    // the shadow on the oak: offset 0.05 D to the lower right, blurred 0.06 D, #000 from 55% at the plinth
    g.save(); g.filter = `blur(${Math.max(1, RL_P.shadowBlurD * RLD * res).toFixed(1)}px)`; g.translate(RL_P.shadowD * RLD, RL_P.shadowD * RLD); g.fillStyle = `rgba(0,0,0,${RL_P.shadowA})`; silhouette(); g.fill(); g.restore();
    // the face, per pixel of this bake (proto/cliff.py): the approved #3A3436 to #221E20 from top to foot
    { const fh = hs - pl, top = rgb2lab(hex2rgb(RL_C.cliffTop)), foot = rgb2lab(hex2rgb(RL_C.cliffFoot)), TV = rlTable('cliff'), K = 1 / RLK, Hu = fh * K;
      const edges = [0]; for (let k = 0; k < 14; k++) edges.push(edges[k] + 6 + 7 * rlH2c(rlH2(k, 0, 9))); // stratum boundaries 6 to 13 units apart
      const X0 = -70, Y0 = -60, fx0 = Math.floor(0 * res), fx1 = Math.ceil(W * res), fy0 = Math.floor((H - RL_RC - Y0) * res), fy1 = Math.ceil((H + fh - Y0) * res), fw = fx1 - fx0 + 1, fhp = fy1 - fy0 + 1;
      const fc = makeCanvas(fw, fhp), fg = fc.getContext('2d'), im = fg.createImageData(fw, fhp), d = im.data;
      const yTop = (x) => { if (x <= S[0][0]) return S[0][1]; for (let k = 0; k < S.length - 1; k++) { const p = S[k], q = S[k + 1]; if (x <= q[0]) { const f = (x - p[0]) / Math.max(1e-6, q[0] - p[0]); return p[1] + (q[1] - p[1]) * f; } } return S[S.length - 1][1]; };
      const turnAt = (x) => (x < RL_RC ? (RL_RC - x) / RL_RC : x > W - RL_RC ? -(x - (W - RL_RC)) / RL_RC : 0); // the face turns west (toward the light) at the west corner
      for (let px = 0; px < fw; px++) {
        const x = (fx0 + px + 0.5) / res + X0; if (x < 0 || x > W) continue; const yt = yTop(x), X = x * K, turn = turnAt(x);
        const fault = Math.floor((X + 40 * rlVN(TV, X / 140, 3.3)) / 130), fo = rlH2c(rlH2(fault, 0, 5)), bend = 1.6 * rlVN(TV, X / 60, 7.1) + (fo - 0.5) * 5;
        for (let py = 0; py < fhp; py++) {
          const y = (fy0 + py + 0.5) / res + Y0; if (y < yt || y > yt + fh) continue; const Y = (y - yt) * K, t = Y / Hu, yb = Y + bend;
          let band = 0; while (band < edges.length - 2 && yb >= edges[band + 1]) band++; const rel = yb - edges[band];
          let Lv = top[0] + (foot[0] - top[0]) * t + (rlH2c(rlH2(band, 0, 13)) - 0.5) * 7; // each stratum its own value (+-3.5 L*)
          if (rel >= 0) Lv += 7 * Math.exp(-rel / 0.5); if (band > 0 || yb > 1) Lv -= 3 * Math.exp(-Math.abs(rel - 1) / 0.6); // the lit ledge on each top, its shadow below
          const js = rlH2c(rlH2(band, 1, 17)), sp = 18 + 30 * js, jx = (X + 97 * js + 14 * rlVN(TV, X / 23 + band * 3.1, 11)) / sp, jf = jx - Math.floor(jx); // joints inside one stratum, 18 to 48 units apart
          if (Math.abs(jf - 0.5) > 0.5 - 0.35 / sp && rlH2c(rlH2(Math.floor(jx), band, 19)) > 0.55 && rel > 0.8) Lv -= 6;
          Lv += 2.5 * rlFbm(TV, X / 30, Y / 12 + 40, 3) - 3 * t * t + 3.5 * turn; // low-frequency weathering, darker toward the foot, the corners' turn to the light
          const o4 = (py * fw + px) * 4; rlLabTo(Lv, top[1] + (foot[1] - top[1]) * t, top[2] + (foot[2] - top[2]) * t, d, o4); d[o4 + 3] = 255;
        }
      }
      fg.putImageData(im, 0, 0); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(fc, fx0, fy0); g.restore();
      // the strata's antialiased top edge under the land: a 0.6 px dark line along the outline
      g.strokeStyle = 'rgba(10,8,9,.35)'; g.lineWidth = 0.6; g.beginPath(); S.forEach(([x, y], k) => (k ? g.lineTo(x, y + 0.3) : g.moveTo(x, y + 0.3))); g.stroke(); }
    // the plinth: the board the model is built on (dark oak), its lit top edge, and the contact line on the table
    g.fillStyle = RL_C.plinth; g.beginPath(); S.forEach(([x, y], k) => (k ? g.lineTo(x, y + hs - pl) : g.moveTo(x, y + hs - pl))); for (let k = S.length - 1; k >= 0; k--) g.lineTo(S[k][0], S[k][1] + hs); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(176,138,94,.55)'; g.lineWidth = 0.8; g.beginPath(); S.forEach(([x, y], k) => (k ? g.lineTo(x, y + hs - pl + 0.4) : g.moveTo(x, y + hs - pl + 0.4))); g.stroke();
    g.strokeStyle = 'rgba(28,26,23,.6)'; g.lineWidth = 2.2; g.beginPath(); S.forEach(([x, y], k) => (k ? g.lineTo(x, y + hs + 0.6) : g.moveTo(x, y + hs + 0.6))); g.stroke();
    // waterfalls: a stream that reaches the south edge falls down the face as a pale streak and ends at the plinth
    if (RB.ready) for (const f of RB.water.falls) {
      const gr = g.createLinearGradient(0, H, 0, H + hs - pl); gr.addColorStop(0, 'rgba(185,211,207,.95)'); gr.addColorStop(0.7, 'rgba(185,211,207,.55)'); gr.addColorStop(1, 'rgba(185,211,207,.2)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(f.x - f.w * 0.55, H); g.lineTo(f.x + f.w * 0.55, H); g.lineTo(f.x + f.w * 0.9, H + hs - pl); g.lineTo(f.x - f.w * 0.9, H + hs - pl); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(240,248,246,.55)'; g.lineWidth = 0.5; for (const dx of [-0.3, 0.1, 0.4]) { g.beginPath(); g.moveTo(f.x + dx * f.w, H + 0.5); g.lineTo(f.x + dx * f.w * 1.5, H + hs - pl - 1); g.stroke(); }
      g.fillStyle = 'rgba(214,232,228,.6)'; ellipse(g, f.x, H + hs - pl - 0.6, f.w * 1.3, 1.1); g.fill();
    }
    // the brass plaque, set on the plinth at the middle of the south face: the map's seeded name
    const pw = RL_P.plaqueD * RLD, ph = Math.min((hs - pl) * 0.72, RL_P.plaqueH * RLK), px0 = W / 2 - pw / 2, py1 = H + hs - pl, py0 = py1 - ph;
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(px0 + 1.2, py0 + 1.2, pw, ph);
    const bg = g.createLinearGradient(0, py0, 0, py1); bg.addColorStop(0, '#CDA862'); bg.addColorStop(0.5, RL_C.brass); bg.addColorStop(1, '#8E6E36'); g.fillStyle = bg; g.fillRect(px0, py0, pw, ph);
    g.strokeStyle = '#D9BC7A'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(px0 + 0.5, py1 - 0.5); g.lineTo(px0 + 0.5, py0 + 0.5); g.lineTo(px0 + pw - 0.5, py0 + 0.5); g.stroke();
    g.strokeStyle = '#6E5428'; g.beginPath(); g.moveTo(px0 + pw - 0.5, py0 + 0.5); g.lineTo(px0 + pw - 0.5, py1 - 0.5); g.lineTo(px0 + 0.5, py1 - 0.5); g.stroke();
    for (const [rx, ry] of [[px0 + 3.2, py0 + 3.2], [px0 + pw - 3.2, py0 + 3.2], [px0 + 3.2, py1 - 3.2], [px0 + pw - 3.2, py1 - 3.2]]) { g.fillStyle = '#7A5F2E'; g.fillRect(rx - 1, ry - 1, 2, 2); g.fillStyle = '#E2C98E'; g.fillRect(rx - 1, ry - 1, 1, 1); }
    const fs = Math.min(ph * 0.62, pw / 12.5); g.font = `${fs.toFixed(2)}px 'Marcellus SC', Georgia, serif`; g.fillStyle = '#1C1A17'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('The Ember Marches', W / 2, (py0 + py1) / 2 + fs * 0.06);
  }, true);
  return RIM;
}

// ------------------------------------------------------------------ v4 relief: the lit-bead rails, internal keylines and neutral hairlines (map-relief §5.1, natural §8.2), water, wild contours
// natural §8.2 (both looks): each shared edge keeps ONE keyline (light #F4EEDF or dark #1C1A17) along its whole length, the one that reaches the target on the most of its
// 0.1 D segments; per segment its alpha is the smallest that brings the antialiased pixel to the target against the p10 and p90 of the ground on both sides (in each
// province's fog state, at the drawn mip), raised to its neighbours' (a running maximum); where it cannot serve one side, a 1.5 px partner of the other keyline runs on
// that side. Lines never dash unless fog says so (N10). Below device pixel ratio 1.5 the rail's banner is 2 px and the internal keyline 2.5 px (a fully covered pixel).
const rlW = () => (dpr < 1.5 ? { d: 1.5, b: 2, l: 1.5, ib: 1.5, ik: RL_P.line.intW1, h: RL_P.line.hairW1, hp: RL_P.line.partnerW1, ph: RL_P.line.pairW1[0], pp: RL_P.line.pairW1[1] } : { d: 1, b: 1.5, l: 1, ib: 1.5, ik: 1, h: 1.5, hp: 1.5, ph: 1.5, pp: 1.5 });
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
  return [r, g, b];
}
const RL_GESSO = hex2rgb(RL_C.gesso);
// in a data mode the land on screen is the mode raster (flat fills under the gentle relief, no fog), so the lines are solved against it
const rlDataGround = () => (state.mode !== 'ownership' && state.mode !== 'terrain' && decoTo < 0.5 ? rlModeRaster() : null);
function rlGroundSides(x0, y0, x1, y1, nx, ny, look, lvl, states) { // [lower-right side, upper-left side]: sorted luminance samples with colours
  const Lk = RB.L[look], src = lvl === 2 ? Lk.mb2 : lvl === 1 ? Lk.mb1 : Lk.img, w = src.width, h = src.height, f = (RB.TX * w) / RB.BW, d = src.data, { BW, TX, HW, id, LT } = RB, MR = rlDataGround(), md = MR && MR.img.data;
  const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(2, Math.ceil(L * f) + 1), px = 1 / cam.s, out = [[], [], []]; // lower-right, upper-left, and directly under the line
  for (let s = 0; s < 2; s++) for (const o of [0, 0.75, 1.5, 2.25, 3]) for (let t = 0; t < n; t++) { // from under the line (thin hedges and shores on the border) to 3 px out
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
  const S = []; for (let s = 0; s < n; s++) { const x0 = ax + ((bx - ax) * s) / n, y0 = ay + ((by - ay) * s) / n, x1 = ax + ((bx - ax) * (s + 1)) / n, y1 = ay + ((by - ay) * (s + 1)) / n, [lr, ul, on] = rlGroundSides(x0, y0, x1, y1, nx, ny, ctx.look, ctx.lvl, ctx.states); S.push({ x0, y0, x1, y1, lr: rlPQ(lr), ul: rlPQ(ul), on: on.length ? [on[0], on[on.length - 1]] : [] }); } // the ground the line covers: its extremes too (a hedge or a shore along the border)
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
        partner = { key: other, side };
      } else { a = 1; partner = { key: other, side: 1 }; }
    }
    return { x0: sg.x0, y0: sg.y0, x1: sg.x1, y1: sg.y1, key: best.kn, alpha0: hair ? a : 1, partner };
  });
  for (let s = 0; s < v.length; s++) v[s].alpha = hair ? Math.min(cap, Math.max(v[s].alpha0, s > 0 ? v[s - 1].alpha0 : 0, s < v.length - 1 ? v[s + 1].alpha0 : 0)) : 1;
  // a partner that came and went per 0.1 D segment read as dashes at Near (and dashes mean fog, N10): it runs on along the whole edge where a third of it needs one,
  // and elsewhere it is widened by a segment either side, with gaps of up to two segments closed, so it reads as a second line, not a dashed one
  const n1 = v.filter((x) => x.partner && x.partner.side === 1).length, n2 = v.filter((x) => x.partner && x.partner.side === -1).length, major = n1 >= n2 ? 1 : -1;
  for (const sd of [major, -major]) { // the solved partners keep the side their anchor fails on; the extension runs on the edge's majority side only
    if (sd !== major) continue;
    const has = v.map((x) => !!(x.partner && x.partner.side === sd)), n1 = has.filter(Boolean).length; if (!n1) continue;
    let fill = n1 / v.length >= 1 / 3 ? v.map(() => true) : has.map((h, s) => h || !!has[s - 1] || !!has[s + 1]);
    for (let s = 0; s < fill.length; s++) if (!fill[s]) { let e = s; while (e < fill.length && !fill[e]) e++; if (s > 0 && e < fill.length && e - s <= 2) for (let q = s; q < e; q++) fill[q] = true; s = e; }
    v.forEach((x, s) => { if (fill[s] && !x.partner) x.partner = { key: other, side: sd, extended: true }; });
  }
  const out = { segs: v, key: best.kn, nx, ny }; RL_LINES.cache.set(ck, out); if (RL_LINES.cache.size > 4000) RL_LINES.cache.clear(); return out;
}
function rlLineCtx() { // the cache key: the map, the look, the drawn mip, a zoom step (the side width), the provinces' states, the device pixel class
  const look = rlShownLook(), lvl = rlMipLevel(), st = provList.map((i) => (fogOf(i) ?? '-')[0] + (state.mode === 'ownership' && decoTo >= 0.5 ? rlWashOf(i, true).toFixed(3) : '0')).join(',');
  const MR = rlDataGround();
  return { look, lvl, states: new Map(), key: [RB.ver, RB.lookVer, look, lvl, MR ? 'm' + MR.ver : '', Math.round(Math.log2(cam.s) * 4), st, view.tint && state.mode === 'ownership', dpr < 1.5 ? 1 : 2].join('|') };
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
  const ctx = rlLineCtx(), drawn = []; RL_LINES.stats = { edges: 0, segs: 0, partners: 0, flips: 0, maxWidthPx: 0 };
  const key = (k) => (k === 'light' ? RL_C.keyLight : RL_C.keyDark);
  for (const [, e] of EDGE) { // internal keylines and neutral hairlines, once per shared edge
    const i = e.i, j = e.j; if (isWild(i) || isWild(j)) continue; const oi = prov[i].owner, oj = prov[j].owner;
    const b = e.bb ?? (e.bb = bboxOf(e.wobble)); if (!seen(b)) continue;
    const internal = oi && oi === oj && band !== 'far', hairline = !internal && ((!oi && !oj) || (oi && oi === oj)); if (!internal && !hairline) continue;
    const fog = fogOf(i) && fogOf(j), st = rlSegStyles(e, internal ? 'int' : 'hair', ctx), { nx, ny } = st; let run = 0;
    if (fog) g.setLineDash([2 * px, 3 * px]);
    const stroke = (sg, off, lw, col) => { g.strokeStyle = col; g.lineWidth = lw * px; if (fog) g.lineDashOffset = -run; g.beginPath(); g.moveTo(sg.x0 + nx * off * px, sg.y0 + ny * off * px); g.lineTo(sg.x1 + nx * off * px, sg.y1 + ny * off * px); g.stroke(); };
    for (const sg of st.segs) {
      if (internal) { // the banner half on the upper-left side, the anchored keyline on the lower-right, the partner beyond it
        stroke(sg, -w.ib / 2, w.ib, BAN[oi]); stroke(sg, w.ik / 2, w.ik, key(sg.key)); if (sg.partner) stroke(sg, w.ik + w.hp / 2, w.hp, key(sg.partner.key));
      } else { // a partnered segment is 1.5 + 1.5 px at every ratio (RL_P.line.pairW1; no hairline wider than 3 px, natural §13); alone, the hairline is 2 px below ratio 1.5
        const hw = sg.partner ? w.ph : w.h, pw = sg.partner ? w.pp : 0, al = Math.min(1, (sg.alpha * w.h) / hw); stroke(sg, 0, hw, rgba(key(sg.key), +al.toFixed(3))); // narrowed, the anchor keeps its weight (alpha x width)
        if (sg.partner) stroke(sg, sg.partner.side * (hw + pw) / 2, pw, rgba(key(sg.partner.key), RL_P.line.partnerA));
        RL_LINES.stats.maxWidthPx = Math.max(RL_LINES.stats.maxWidthPx, sg.partner ? hw + pw : hw);
      }
      run += Math.hypot(sg.x1 - sg.x0, sg.y1 - sg.y0);
      RL_LINES.stats.segs++; if (sg.partner) RL_LINES.stats.partners++; if (sg.key !== st.segs[0].key) RL_LINES.stats.flips++;
    }
    if (fog) { g.setLineDash([]); g.lineDashOffset = 0; }
    RL_LINES.stats.edges++;
    drawn.push({ e, i, j, kind: internal ? 'int' : 'hair', key: st.key, segs: st.segs.length, partners: st.segs.filter((s) => s.partner).length, fog: !!fog });
  }
  RL_LINES.drawn = drawn;
}
// the hover and selection inner line, inside the rail (or at the border where there is none)
function rlInnerLine(g, i, px, width, alpha) {
  const w = rlW(), hasRail = !!prov[i].owner && RL_EDGES[i].some((e) => isRealmEdge(i, e)), d = (hasRail ? 1 + w.d + w.b + w.l + 0.5 : 1) + width / 2;
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
    g.translate(0.9 * RLK, 0.9 * RLK); g.strokeStyle = 'rgba(236,240,226,.42)'; g.lineWidth = 1.2 * RLK; path(); g.stroke(); // the lit bank (south-east)
    g.translate(-1.8 * RLK, -1.8 * RLK); g.strokeStyle = 'rgba(12,20,14,.38)'; g.lineWidth = 1.4 * RLK; path(); g.stroke(); g.restore(); // the shaded bank (north-west)
    path(); g.fillStyle = wc; g.fill();
    g.save(); path(); g.clip(); g.strokeStyle = shore; g.lineWidth = 3.2 * RLK; path(); g.stroke(); // the shore band, 3 L* darker
    g.strokeStyle = 'rgba(232,246,240,.22)'; g.lineWidth = 0.7 * RLK; const R = rngFor('ripple:' + L.i); for (let k = 0; k < 3; k++) { const x = L.x + (R() - 0.5) * 18 * RLK, y = L.y + (R() - 0.5) * 8 * RLK; g.beginPath(); g.ellipse(x, y, 5 * RLK, 1.1 * RLK, 0, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
    g.restore();
  }
  g.restore();
}
// ---- the wilds' contour (3 px ink) and light rim, never tinted, faded or fogged (approved)
function rlDrawWildContours(g, px) {
  for (const w of WILDS) {
    const ol = rlWildOutline(w), path = () => { g.beginPath(); for (const e of ol) { g.moveTo(...e.a); g.lineTo(...e.b); } };
    g.save(); g.beginPath(); for (const c of w.cells) { cells[c].forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); } g.clip();
    g.strokeStyle = `rgba(233,228,216,${view.pass ? 1 : w.kind === 'mere' ? 0.7 : 0.8})`; g.lineWidth = (w.kind === 'mere' ? 7 : 6) * px; g.lineCap = 'round'; path(); g.stroke(); g.restore();
    g.strokeStyle = '#1C1A17'; g.lineWidth = 3 * px; g.lineCap = 'round'; path(); g.stroke(); g.lineCap = 'butt';
    if (view.pass) { g.strokeStyle = '#E9E4D8'; g.lineWidth = 4 * px; path(); g.stroke(); }
  }
}

// ------------------------------------------------------------------ canvas, camera, drawing
const app = document.getElementById('app');
const canvas = document.getElementById('map'), ctx = canvas.getContext('2d');
const layer = document.getElementById('layer');
const amb = document.getElementById('amb'), actx = amb.getContext('2d');
const cam = { s: 1, x: 0, y: 0 };
let dpr = 1, cw = 0, ch = 0, moveLine = null, hoverProv = -1, fitScale = 1, minScale = 0.2, maxScale = 2.4, firstPaint = true;
let decoAlpha = 1, decoFrom = 1, decoTo = 1, decoT0 = 0;
let fontsGate = false; // (tried: holding the bake until the web fonts load; the first paint then waits on the network, so the v2 order stays)
const BAN = { red: '#FD6533', green: '#00674B' };
// (the camera, the fit and the start view: p60a-camera.js; the data-mode colours: p60b-modes.js)
const provsByY = [...provs].sort((a, b) => cent[a.i][1] - cent[b.i][1]);
const worldT = (g) => g.setTransform(dpr * cam.s, 0, 0, dpr * cam.s, dpr * cam.x, dpr * cam.y);
const screenT = (g) => g.setTransform(dpr, 0, 0, dpr, 0, 0);
const blitW = (g, B) => g.drawImage(B.src, B.x0, B.y0, B.w, B.h);
let drawQueued = false, animating = false, VW = [0, 0, W, H];
function blitRegion(g, B, x0, y0, x1, y1) { // the part of a world-space bake that is on screen
  x0 = Math.max(x0, B.x0, VW[0]); y0 = Math.max(y0, B.y0, VW[1]); x1 = Math.min(x1, B.x0 + B.w, VW[2]); y1 = Math.min(y1, B.y0 + B.h, VW[3]);
  if (x1 <= x0 || y1 <= y0) return; const kx = B.canvas.width / B.w, ky = B.canvas.height / B.h;
  g.drawImage(B.src, (x0 - B.x0) * kx, (y0 - B.y0) * ky, (x1 - x0) * kx, (y1 - y0) * ky, x0, y0, x1 - x0, y1 - y0);
}
function blitRing(g, B, o, n) { blitRegion(g, B, o[0], o[1], o[2], n[1]); blitRegion(g, B, o[0], n[3], o[2], o[3]); blitRegion(g, B, o[0], n[1], n[0], n[3]); blitRegion(g, B, n[2], n[1], o[2], n[3]); }
function requestDraw() { if (!drawQueued) { drawQueued = true; requestAnimationFrame(() => { drawQueued = false; draw(); }); } }
let tmpA = null, tmpB = null;
function wipeDraw(g, sp, t, alpha) { // the M1-should brush wipe: a soft edge sweeping from the nation's side
  const w = sp.canvas.width, h = sp.canvas.height; tmpA ??= makeCanvas(w, h); tmpB ??= makeCanvas(w, h);
  for (const c of [tmpA, tmpB]) { if (c.width < w) c.width = w; if (c.height < h) c.height = h; }
  const [dx, dy] = sp.from, L = Math.abs(dx) * w + Math.abs(dy) * h, cx = w / 2 - (dx * L) / 2, cy = h / 2 - (dy * L) / 2;
  const mk = (c, src, keepNew) => { const q = c.getContext('2d'); q.globalCompositeOperation = 'source-over'; q.clearRect(0, 0, c.width, c.height); q.drawImage(src, 0, 0); q.globalCompositeOperation = keepNew ? 'destination-in' : 'destination-out';
    const gr = q.createLinearGradient(cx, cy, cx + dx * L, cy + dy * L), e = t * 1.3 - 0.15; gr.addColorStop(Math.max(0, Math.min(1, e - 0.15)), 'rgba(0,0,0,1)'); gr.addColorStop(Math.max(0, Math.min(1, e + 0.15)), 'rgba(0,0,0,0)'); q.fillStyle = gr; q.fillRect(0, 0, w, h); };
  mk(tmpA, sp.prev.canvas, false); mk(tmpB, sp.canvas, true);
  g.globalAlpha = alpha; g.drawImage(tmpA, 0, 0, w, h, sp.x0, sp.y0, sp.w, sp.h); g.drawImage(tmpB, 0, 0, w, h, sp.x0, sp.y0, sp.w, sp.h); g.globalAlpha = 1;
}
function visibleWorld() { const [x0, y0] = toWorld(0, 0), [x1, y1] = toWorld(cw, ch); return [x0, y0, x1, y1]; }
const PROF = {}, SKIP = new Set(); let PT = 0; const PM = (k) => { const t = performance.now(); PROF[k] = (PROF[k] ?? 0) + (t - PT); PT = t; };
// The static layers (scene, fills, decoration, wilds, marks, borders, bands, labels) render into a cache 35% larger than the
// view on every side; a pan or a hover only blits it and draws the live overlays (hover, selection, arrows, the path).
const cache = document.createElement('canvas'), cctx = cache.getContext('2d');
let CK = null, zoomingUntil = 0;
const staticSig = () => [state.mode, KEYVER, view.table, view.detail, view.pass, view.reduced, curMonth, fontsReady, dpr, cw, ch, TW_CACHE.size > 0, SPR.size === 0, view.hand, view.labels, view.borders, view.bandCap, view.tracks, view.farm, view.palette, artSig(), state.sel ? state.sel.type : '', decoTo].join('|');
function renderStatic(g, now) {
  const band = bandOf(cam.s);
  g.setTransform(1, 0, 0, 1, 0, 0);
  const covers = (r) => r[0] <= VW[0] && r[1] <= VW[1] && r[2] >= VW[2] && r[3] >= VW[3];
  // T0 to T5: the room, the oak, the props, the cloth (each drawn only where it shows, as strips around the next layer)
  if (SKIP.has('scene')) { g.fillStyle = '#15130F'; g.fillRect(0, 0, g.canvas.width, g.canvas.height); }
  else if (view.table === 'off') { g.fillStyle = '#15130F'; g.fillRect(0, 0, g.canvas.width, g.canvas.height); }
  else {
    const roomShows = !covers(TABLE);
    if (roomShows) {
      if (!covers(ROOM)) { g.fillStyle = '#0E0905'; g.fillRect(0, 0, g.canvas.width, g.canvas.height); }
      worldT(g);
      if (view.table === 'full') blitRing(g, bakeRoom(), ROOM, TABLE);
      else { const [cx, cy] = [(TABLE[0] + TABLE[2]) / 2, (TABLE[1] + TABLE[3]) / 2], rg = g.createRadialGradient(cx, cy, TW * 0.3, cx, cy, TW * 1.1); rg.addColorStop(0, '#2A2018'); rg.addColorStop(1, '#0E0905'); g.fillStyle = rg; g.fillRect(ROOM[0], ROOM[1], ROOM[2] - ROOM[0], ROOM[3] - ROOM[1]); }
    }
    worldT(g); if (!SKIP.has('table')) blitRing(g, bakeTable(), TABLE, CLOTH);
    if (view.table === 'full' && roomShows) { screenT(g); const vg = g.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.35, cw / 2, ch / 2, Math.hypot(cw, ch) * 0.6); vg.addColorStop(0, 'rgba(14,9,5,0)'); vg.addColorStop(1, 'rgba(14,9,5,.5)'); g.fillStyle = vg; g.save(); g.beginPath(); g.rect(0, 0, cw, ch); const [a, b] = toScreen(CLOTH[0], CLOTH[1]), [c, d] = toScreen(CLOTH[2], CLOTH[3]); g.rect(a, b, c - a, d - b); g.clip('evenodd'); g.fillRect(0, 0, cw, ch); g.restore(); }
  }
  worldT(g); if (!SKIP.has('cloth')) blitRing(g, bakeCloth(), CLOTH, [0, 0, W, H]);
  PM('cloth');
  PM('scene');
  // M: the fill layer
  const vw = VW, seen = (bb) => bb[2] > vw[0] && bb[0] < vw[2] && bb[3] > vw[1] - 30 && bb[1] < vw[3] + 10;
  for (const p of provs) { if (!seen(geo(p.i).bb)) continue; pathPoly(g, npolyLite(p.i)); g.fillStyle = fillFor(p); g.fill(); }
  for (const w of WILDS) { g.fillStyle = w.kind === 'peaks' ? '#2A292C' : '#24222A'; for (const c of w.cells) { pathPoly(g, npolyLite(c)); g.fill(); } }
  PM('fills');
  // the decoration layer (Ownership mode; faded out in data modes). v3: while the web fonts load, the flat fills stand in (one bake, not two)
  if (fontsGate) bakesPending = true;
  else if (decoAlpha > 0.001 && !SKIP.has('deco')) {
    bakeBudgetEnd = firstPaint ? Infinity : performance.now() + 12;
    if (band === 'near') bakeMissing(provsByY.filter((p) => seen(geo(p.i).bb)).map((p) => p.i), band, now);
    const C = band !== 'near' ? decoComposite(band, now) : null;
    if (C) { // v3: the composite holds the new sprites; a fading province draws its previous sprite over it at (1 - t), which is the cross-fade
      g.globalAlpha = decoAlpha; blitRegion(g, C, C.x0, C.y0, C.x0 + C.w, C.y0 + C.h);
      for (const i of [...ANIM.keys()]) { const sp = SPR.get(band + ':' + i); if (!sp || !sp.prev) continue; const t = (now - sp.t0) / 600; if (t >= 1) { sp.prev = null; ANIM.delete(i); continue; } animating = true; if (view.wipe && sp.from) wipeDraw(g, sp, t, decoAlpha); else { g.globalAlpha = decoAlpha * (1 - t); blitW(g, sp.prev); } }
      g.globalAlpha = 1;
    }
    else for (const p of provsByY) {
      const G = geo(p.i); if (!seen(G.bb)) continue;
      const sp = provSprite(p.i, band, now); if (!sp) continue;
      if (sp.prev && now - sp.t0 < 600) {
        const t = (now - sp.t0) / 600; animating = true;
        if (view.wipe && sp.from) wipeDraw(g, sp, t, decoAlpha);
        else { g.globalAlpha = decoAlpha * (1 - t); blitW(g, sp.prev); g.globalAlpha = decoAlpha * t; blitW(g, sp); }
      } else { if (sp.prev) { sp.prev = null; ANIM.delete(p.i); } g.globalAlpha = decoAlpha; blitW(g, sp); }
    }
    g.globalAlpha = 1;
  }
  PM('deco');
  drawStateOverlay(g, band); // v3: live haze, out-of-sight grey and land-look wash over the paint
  const lay = SKIP.has('labels') ? { placed: [], ops: [], wildBoxes: [], tokenBoxes: [], band } : layoutLabels(band);
  PM('layout');
  screenT(g); drawRegionNames(g, band, lay); worldT(g);
  PM('regions');
  drawTracks(g, band, lay.placed);
  PM('tracks');
  // the always-on layer: wilds (every mode, every band), information marks, borders, bands
  if (!SKIP.has('wilds')) for (const w of WILDS) blitW(g, wildSprite(w, band));
  PM('wilds');
  if (!SKIP.has('marks')) drawMarks(g, band, now);
  PM('marks');
  const px = 1 / cam.s;
  if (state.mode === 'ownership' && !PAINTED()) { g.strokeStyle = 'rgba(0,0,0,.12)'; g.lineWidth = 5 * px; for (const p of provs) { pathPoly(g, npoly[p.i]); g.stroke(); } }
  drawBorders(g, band, px);
  if (state.mode === 'ownership') drawBands(g, band, px);
  PM('borders');
  g.strokeStyle = '#1C1A17'; g.lineWidth = 2.5 * px; g.strokeRect(-1, -1, W + 2, H + 2);
  // wild signature: a 3 px ink contour in place of the border, and a light rim inside (ticks on peaks, a keyline on meres)
  const edgePath = (G) => { g.beginPath(); for (const e of G.edges) e.pts.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); };
  for (const w of WILDS) {
    const G = wgeo(w), full = view.pass;
    if (w.kind === 'mere') { g.save(); g.beginPath(); for (const c of w.cells) pathPoly(g, npoly[c]); g.clip(); g.strokeStyle = `rgba(233,228,216,${full ? 1 : 0.7})`; g.lineWidth = 7 * px; g.lineJoin = 'round'; edgePath(G); g.stroke(); g.restore(); }
    else { g.strokeStyle = `rgba(233,228,216,${full ? 1 : 0.85})`; g.lineWidth = 1.3 * px; g.beginPath(); for (const t of G.ticks[band]) { g.moveTo(t[0], t[1]); g.lineTo(t[2], t[3]); } g.stroke(); }
    g.strokeStyle = '#1C1A17'; g.lineWidth = 3 * px; g.lineCap = 'round'; g.lineJoin = 'round'; edgePath(G); g.stroke(); g.lineCap = 'butt';
    if (view.pass) { g.strokeStyle = '#E9E4D8'; g.lineWidth = 4 * px; edgePath(G); g.stroke(); }
  }
  // review overlay: hatch every province Varo cannot reach
  if (view.pass) {
    g.save(); g.beginPath(); for (const p of provs) if (p.i !== cmd.varo.at && !pathTo(cmd.varo.at, p.i)) { const poly = npoly[p.i]; poly.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); } g.clip();
    g.strokeStyle = 'rgba(28,26,23,.55)'; g.lineWidth = 1.6 * px; g.beginPath(); for (let d = -H; d < W + H; d += 9 * px) { g.moveTo(d, 0); g.lineTo(d + H, H); } g.stroke(); g.restore();
  }
  screenT(g);
  if (!SKIP.has('labels')) paintLabels(g, lay);
  g.setTransform(1, 0, 0, 1, 0, 0);
}
function drawBorders(g, band, px) { // v3: one ink ribbon per shared edge (hand-ruled, +-12% width); dotted where both sides are fogged
  const stride = band === 'far' ? 3 : 1;
  g.fillStyle = '#2B2620';
  for (const [key, e] of EDGE) {
    if (isWild(e.i) || isWild(e.j)) continue;
    const b = e.bb ?? (e.bb = bboxOf(e.wobble)); if (b[2] < VW[0] - 4 || b[0] > VW[2] + 4 || b[3] < VW[1] - 4 || b[1] > VW[3] + 4) continue;
    if (fogOf(e.i) && fogOf(e.j)) { g.strokeStyle = '#2B2620'; g.lineWidth = 2 * px; g.setLineDash([2 * px, 3 * px]); g.beginPath(); edgePts(e).forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); g.setLineDash([]); continue; }
    if (view.borders === 'straight' && !PAINTED()) { g.strokeStyle = '#2B2620'; g.lineWidth = 2 * px; g.beginPath(); g.moveTo(...e.a); g.lineTo(...e.b); g.stroke(); continue; }
    g.globalAlpha = PAINTED() ? e.alpha : 1; g.beginPath(); ribbonPath(g, key, 2 * px, stride); g.fill();
  }
  g.globalAlpha = 1;
}
function drawBands(g, band, px) { // v3: inner ribbons on the province's own polygon, capped at 9 px at Near; a 1 px keyline on the inner edge
  const capped = view.bandCap === 'capped';
  for (const p of provs) {
    if (!p.owner) continue; const poly = band === 'near' ? npoly[p.i] : npolyLite(p.i), G = geo(p.i); if (G.bb[2] < VW[0] || G.bb[0] > VW[2] || G.bb[3] < VW[1] || G.bb[1] > VW[3]) continue;
    g.save(); pathPoly(g, poly); g.clip(); g.lineJoin = 'round';
    if (capped || PAINTED()) {
      let B = Math.max(2.5, 5.5 * cam.s); if (band === 'near' && capped) B = Math.min(9, B);
      g.globalAlpha = 0.7; g.strokeStyle = p.owner === 'green' ? '#F4EEDF' : '#1C1A17'; g.lineWidth = 2 * (B + 1) * px; g.stroke(); g.globalAlpha = 1;
      g.strokeStyle = BAN[p.owner]; g.lineWidth = 2 * B * px; g.stroke();
    } else { // v2: an 11 px stroke and a keyline on the 0.86-scaled polygon
      g.lineWidth = Math.max(5, 11 * cam.s) * px; g.strokeStyle = BAN[p.owner]; g.stroke();
      g.lineWidth = px; g.strokeStyle = p.owner === 'green' ? '#F4EEDF' : '#1C1A17'; g.globalAlpha = 0.7;
      const c = cent[p.i]; g.beginPath(); poly.forEach(([x, y], k) => { const ix = c[0] + (x - c[0]) * 0.86, iy = c[1] + (y - c[1]) * 0.86; k ? g.lineTo(ix, iy) : g.moveTo(ix, iy); }); g.closePath(); g.stroke();
    }
    g.restore();
  }
}
const REB = { n: 0, ms: 0, why: '' };
function renderCache(now, sig, why) {
  const m = 0.35, vw = cw * (1 + 2 * m), vh = ch * (1 + 2 * m), W2 = Math.round(vw * dpr), H2 = Math.round(vh * dpr);
  if (cache.width !== W2 || cache.height !== H2) { cache.width = W2; cache.height = H2; }
  const sx = cam.x, sy = cam.y, scw = cw, sch = ch;
  cam.x += m * cw; cam.y += m * ch; cw = vw; ch = vh; VW = visibleWorld(); bakesPending = false;
  const t0 = performance.now(); renderStatic(cctx, now); REB.n++; REB.ms += performance.now() - t0; REB.why = why;
  CK = { sig, s: cam.s, wx0: -cam.x / cam.s, wy0: -cam.y / cam.s, ww: vw / cam.s, wh: vh / cam.s, pending: bakesPending };
  cam.x = sx; cam.y = sy; cw = scw; ch = sch; VW = visibleWorld();
}
function draw() {
  if (RELIEF()) return rlDraw(); // v4: the relief map's own draw (p59)
  if (checkFonts()) onFontsArrived();
  const now = performance.now(); PT = now; animating = false;
  let decoAnim = false;
  if (decoAlpha !== decoTo) { const t = view.reduced ? 1 : Math.min(1, (now - decoT0) / 150); decoAlpha = decoFrom + (decoTo - decoFrom) * t; decoAnim = true; if (t < 1) animating = true; } // the fade's last step re-renders too (it used to leave the cache at the previous step's alpha, so a data mode kept a few % of the paint)
  VW = visibleWorld();
  const band = bandOf(cam.s), sig = staticSig();
  const inside = CK && VW[0] >= CK.wx0 && VW[1] >= CK.wy0 && VW[2] <= CK.wx0 + CK.ww && VW[3] <= CK.wy0 + CK.wh;
  const spritesAnim = ANIM.size > 0 && animatingSprites(now);
  const zooming = CK && cam.s !== CK.s && now < zoomingUntil && inside;
  if (!CK || CK.sig !== sig || decoAnim || spritesAnim || CK.pending || !inside || (cam.s !== CK.s && !zooming)) renderCache(now, sig, !CK ? 'none' : CK.sig !== sig ? 'sig ' + CK.sig + ' > ' + sig : decoAnim ? 'deco' : spritesAnim ? 'sprites' : CK.pending ? 'pending' : !inside ? 'outside' : 'scale');
  if (spritesAnim) animating = true;
  if (zooming) setTimeout(requestDraw, zoomingUntil - now + 10);
  PM('static');
  const g = ctx; g.setTransform(1, 0, 0, 1, 0, 0);
  if (zooming) { g.fillStyle = '#0E0905'; g.fillRect(0, 0, canvas.width, canvas.height); }
  worldT(g); g.drawImage(cache, CK.wx0, CK.wy0, CK.ww, CK.wh);
  PM('blit');
  const px = 1 / cam.s;
  const hw = hoverProv >= 0 && isWild(hoverProv) ? wildOf[hoverProv] : null;
  if (hw) { // hover brightens the wild's rim to 100%
    const G = wgeo(hw);
    const ep = () => { g.beginPath(); for (const e of G.edges) e.pts.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); };
    if (hw.kind === 'mere') { g.save(); g.beginPath(); for (const c of hw.cells) pathPoly(g, npoly[c]); g.clip(); g.strokeStyle = '#E9E4D8'; g.lineWidth = 7 * px; ep(); g.stroke(); g.restore(); }
    else { g.strokeStyle = '#E9E4D8'; g.lineWidth = 1.3 * px; g.beginPath(); for (const t of G.ticks[band]) { g.moveTo(t[0], t[1]); g.lineTo(t[2], t[3]); } g.stroke(); }
    g.strokeStyle = '#1C1A17'; g.lineWidth = 3 * px; g.lineCap = 'round'; g.lineJoin = 'round'; ep(); g.stroke(); g.lineCap = 'butt';
  }
  if (hoverProv >= 0 && !isWild(hoverProv)) { pathPoly(g, npoly[hoverProv]); g.lineWidth = 2 * px; g.lineJoin = 'round'; g.strokeStyle = 'rgba(244,238,223,.55)'; g.stroke(); }
  if (state.sel && state.sel.type === 'prov') { pathPoly(g, npoly[state.sel.id]); g.lineWidth = 3 * px; g.lineJoin = 'round'; g.strokeStyle = '#F4EEDF'; g.stroke(); }
  // transit arrows and the path preview (a thread with square brass tacks and day plates)
  screenT(g);
  if (!cmd.ilsa.hidden && cmd.ilsa.eta > 0) arrow(g, cent[cmd.ilsa.at], cent[cmd.ilsa.to], '#9FE0C2', `${cmd.ilsa.eta}d`);
  if (moveLine) thread(g, moveLine);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  present(now, true);
  if (!SKIP.has('badges')) placeBadges(band);
  PM('badges');
  updateZoomChip(band);
  if (firstPaint && !fontsGate && !window.__firstPaintMs) { window.__firstPaintMs = performance.now(); window.__firstPaintFromScript = performance.now() - T_START; }
  if (!fontsGate) firstPaint = false;
  if (animating || (CK && CK.pending)) requestDraw();
}
let ambDirty = [];
function present(now, all) { // the overlay canvas: the two mirror props and the ambience, redrawn alone at up to 30 fps
  const g = actx; g.setTransform(1, 0, 0, 1, 0, 0);
  if (all) g.clearRect(0, 0, amb.width, amb.height); else for (const r of ambDirty) g.clearRect(r[0], r[1], r[2], r[3]);
  ambDirty = [];
  if (view.table !== 'full') return;
  const live = ambienceOn(), t = now / 1000;
  const rectOf = (x0, y0, x1, y1) => { const [a, b] = toScreen(x0, y0), [c, d] = toScreen(x1, y1); const r = [Math.floor(a * dpr) - 2, Math.floor(b * dpr) - 2, Math.ceil((c - a) * dpr) + 4, Math.ceil((d - b) * dpr) + 4]; return r[0] < amb.width && r[1] < amb.height && r[0] + r[2] > 0 && r[1] + r[3] > 0 ? r : null; };
  const cRect = rectOf(PROPS.candle[0] - 60, PROPS.candle[1] - 110, PROPS.candle[0] + 60, PROPS.candle[1] + 40), hRect = rectOf(PROPS.hourglass[0] - 50, PROPS.hourglass[1] - 50, PROPS.hourglass[0] + 50, PROPS.hourglass[1] + 50);
  const gRect = live ? rectOf(HEARTH[0] - 620, HEARTH[1] - 620, HEARTH[0] + 620, HEARTH[1] + 620) : null, mRect = live ? rectOf(WINDOW[0] - 40, WINDOW[1] - 120, WINDOW[0] + 600, WINDOW[1] + 900) : null;
  if (!cRect && !hRect && !gRect && !mRect) return;
  const MB = RELIEF() ? MODEL_BOX : CLOTH; // v4: the ambience stays off the model
  worldT(g); g.save(); g.beginPath(); g.rect(ROOM[0], ROOM[1], ROOM[2] - ROOM[0], ROOM[3] - ROOM[1]); g.rect(MB[0], MB[1], MB[2] - MB[0], MB[3] - MB[1]); g.clip('evenodd');
  if (gRect) { const a = 0.04 * (1 + Math.cos((2 * Math.PI * t) / 7)), [hx, hy] = HEARTH, hg = g.createRadialGradient(hx, hy, 10, hx, hy, 620); hg.addColorStop(0, `rgba(255,137,14,${a})`); hg.addColorStop(1, 'rgba(255,137,14,0)'); g.fillStyle = hg; g.fillRect(hx - 620, hy - 620, 1240, 1240); ambDirty.push(gRect); }
  if (mRect) { const R = rngFor('motes'); for (let k = 0; k < 12; k++) { const bx = WINDOW[0] + 60 + R() * 400, by = WINDOW[1] + 60 + R() * 700, sp = 3 / cam.s + R() * 1.5 / cam.s, ph = R() * 1000; const x = bx + ((t * sp + ph) % 120) - 60, y = by - ((t * sp * 0.6 + ph) % 80); g.fillStyle = `rgba(242,235,221,${0.3 + 0.15 * Math.sin(t + k)})`; ellipse(g, x, y, 2 / cam.s + 1.5, 2 / cam.s + 1.5); g.fill(); } ambDirty.push(mRect); }
  if (cRect) { drawCandle(g, t, live); ambDirty.push(cRect); }
  if (hRect) { drawHourglass(g, t, live); ambDirty.push(hRect); }
  g.restore();
}
function tableOnScreen() { const [a, b] = toScreen(CLOTH[0], CLOTH[1]), [c, d] = toScreen(CLOTH[2], CLOTH[3]); return a > 0 || b > 0 || c < cw || d < ch; }
function ambienceOn() { return view.table === 'full' && view.detail === 'full' && !view.reduced && !document.hidden && scrim.hidden && tableOnScreen(); }
function arrow(g, a, b, color, label) {
  const [ax, ay] = toScreen(...a), [bx, by] = toScreen(...b);
  g.save(); g.strokeStyle = color; g.lineWidth = 3; g.setLineDash([8, 6]); g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke(); g.setLineDash([]);
  const ang = Math.atan2(by - ay, bx - ax); g.fillStyle = color; g.beginPath(); g.moveTo(bx, by); g.lineTo(bx - 12 * Math.cos(ang - 0.4), by - 12 * Math.sin(ang - 0.4)); g.lineTo(bx - 12 * Math.cos(ang + 0.4), by - 12 * Math.sin(ang + 0.4)); g.closePath(); g.fill();
  if (label) { const mx = (ax + bx) / 2, my = (ay + by) / 2; g.fillStyle = 'rgba(20,18,15,.9)'; roundRect(g, mx - 16, my - 10, 32, 20, 4); g.fill(); g.fillStyle = '#F4EEDF'; g.font = `600 12px 'IBM Plex Sans Condensed', sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, mx, my + 1); }
  g.restore();
}
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function thread(g, ml) {
  const pts3 = [cent[ml.from], ...ml.path.map((v) => cent[v])].map((q) => toScreen(...q));
  g.save(); g.lineJoin = 'round';
  g.setLineDash([8, 6]); g.strokeStyle = '#1C1A17'; g.lineWidth = 5; g.beginPath(); pts3.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
  g.strokeStyle = '#F4EEDF'; g.lineWidth = 3; g.stroke(); g.setLineDash([]);
  let days = 0;
  g.font = `600 11.5px 'IBM Plex Sans Condensed', sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  ml.path.forEach((v, k) => {
    days += DAYS[prov[v].terrain]; const [x, y] = pts3[k + 1], last = k === ml.path.length - 1;
    g.save(); g.translate(x, y); g.rotate(Math.PI / 4); g.fillStyle = '#B8914A'; g.fillRect(-3.5, -3.5, 7, 7); g.strokeStyle = '#1C1A17'; g.lineWidth = 1; g.strokeRect(-3.5, -3.5, 7, 7); g.restore();
    const lbl = last ? `${days}d${ml.around ? ' · around ' + ml.around : ''}` : `${days}d`, tw = g.measureText(lbl).width + 10;
    const ox = last ? Math.max(8, textW(prov[v].name, nameFont(prov[v], labelFs(cam.s))) / 2 + 6) : 7, oy = last ? -14 : -21;
    g.fillStyle = last ? 'rgba(20,18,15,.95)' : 'rgba(20,18,15,.82)'; roundRect(g, x + ox, y + oy, tw, 17, 3); g.fill();
    if (last) { g.strokeStyle = '#B8914A'; g.lineWidth = 1; g.stroke(); }
    g.fillStyle = '#F4EEDF'; g.fillText(lbl, x + ox + tw / 2, y + oy + 9);
  });
  g.restore();
}
// ---- labels: names and the second line; wild names; culled by priority (capitals, Wellsprings, wilds, own, the rest)
const glyphCache = {};
function glyph(g, name, x, y, color) {
  const key = name + color; let img = glyphCache[key];
  if (!img) { img = new Image(); img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(svgIcon(name, 16, color).replace('aria-hidden="true"', 'xmlns="http://www.w3.org/2000/svg"')); img.onload = () => requestDraw(); glyphCache[key] = img; }
  if (img.complete && img.naturalWidth) { g.fillStyle = 'rgba(20,18,15,.7)'; g.beginPath(); g.arc(x, y, 9, 0, Math.PI * 2); g.fill(); g.drawImage(img, x - 8, y - 8, 16, 16); }
}
const manaImg = {}; for (const c of 'WUBRG') { manaImg[c] = new Image(); manaImg[c].src = 'data:image/svg+xml;utf8,' + encodeURIComponent(manaSym(c, 18).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')); }
function chipCandle(g, x, y, n, s) {
  g.fillStyle = 'rgba(20,18,15,.82)'; roundRect(g, x - 12, y - 8, 24, 16, 4); g.fill();
  g.fillStyle = n === 'green' ? '#4FB38C' : BAN[n]; g.fillRect(x - 8, y - 3, 3, 8); g.beginPath(); g.arc(x - 6.5, y - 5, 2, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#F4EEDF'; g.font = `600 11px 'IBM Plex Sans Condensed', sans-serif`; g.fillText(String(s), x + 4, y + 1);
}
const LABEL_ORDER = [...provs].sort((a, b) => { const pr = (p) => (p.cap ? 0 : p.well ? 1 : p.owner === 'red' ? 3 : 4); return pr(a) - pr(b); });
function drawLabels(g, band) {
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const fs = labelFs(cam.s), placed = [];
  const fits = (b) => { if (placed.some((q) => b[2] > q[0] && b[0] < q[2] && b[3] > q[1] && b[1] < q[3])) return false; placed.push(b); return true; };
  // token boxes first: no label may sit under an army token
  const byAt = new Map(); for (const c of Object.values(cmd)) if (!c.hidden) byAt.set(c.at, [...(byAt.get(c.at) ?? []), c]);
  for (const [at, list] of byAt) { const [sx, sy] = toScreen(...cent[at]), n = list.length, eta = list.some((c) => c.eta), hw = Math.max(15 * n + 3, eta ? 40 : 0), h = 54 + (eta ? 17 : 0) + (band === 'near' ? 34 : 0); placed.push([sx - hw, sy - 18 - h, sx + hw, sy - 16]); }
  const wildLabels = WILDS.map((w) => { const G = wgeo(w); const f = `italic 400 ${G.nameFs}px 'Alegreya Sans', sans-serif`; const tw = textW(w.name, f) * 1.1; const spots = G.vertical ? [toScreen(...G.labelPt)] : [G.labelAt, ...[...w.cells].sort((a, b) => areaOf[b] - areaOf[a])].flatMap((c) => [[0, 0], [0, 26], [0, -26]].map(([dx, dy]) => { const [sx, sy] = toScreen(...cent[c]); return [sx + dx, sy + dy]; })); return { w, spots, f, tw, fsz: G.nameFs, vertical: G.vertical }; });
  const queue = [];
  for (const p of LABEL_ORDER) { if (p.cap || p.well) queue.push(['p', p]); }
  for (const wl of wildLabels) queue.push(['w', wl]);
  for (const p of LABEL_ORDER) { if (!p.cap && !p.well) queue.push(['p', p]); }
  for (const [kind, it] of queue) {
    if (kind === 'w') {
      const hw = (it.vertical ? it.fsz : it.tw) / 2 + 2, hh = (it.vertical ? it.tw : it.fsz) / 2 + 2;
      const spot = it.spots.find(([x, y]) => { const b = [x - hw, y - hh, x + hw, y + hh]; return !placed.some((q) => b[2] > q[0] && b[0] < q[2] && b[3] > q[1] && b[1] < q[3]); });
      if (!spot) continue; const [lx, ly] = spot; placed.push([lx - hw, ly - hh, lx + hw, ly + hh]);
      g.save(); g.translate(lx, ly); if (it.vertical) g.rotate(-Math.PI / 2);
      g.font = it.f; if ('letterSpacing' in g) g.letterSpacing = '0.08em'; g.fillStyle = '#E9E4D8'; g.fillText(it.w.name, 0, 0); if ('letterSpacing' in g) g.letterSpacing = '0px'; g.restore();
      continue;
    }
    const p = it, [sx, sy] = toScreen(...cent[p.i]);
    if (sx < -80 || sy < -40 || sx > cw + 80 || sy > ch + 40) continue;
    const font = nameFont(p, fs), tw = textW(p.name, font);
    const box = [sx - tw / 2 - 2, sy - 6 - fs / 2 - 1, sx + tw / 2 + 2, sy - 6 + fs / 2 + 1];
    if (!fits(box)) continue;
    g.font = font; g.lineWidth = 3; g.strokeStyle = 'rgba(20,18,15,.85)'; g.strokeText(p.name, sx, sy - 6); g.fillStyle = '#F4EEDF'; g.fillText(p.name, sx, sy - 6);
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
// ---- always-on information marks: Wellsprings, sieges, pillage, rituals, the battle marker
function drawMarks(g, band, now) {
  const px = 1 / cam.s;
  for (const p of provs) {
    const G = geo(p.i), fog = fogOf(p.i); if (fog === 'unexplored') continue;
    if (!p.well && !p.siege && !p.pillage && !(p.fx && p.fx.length) && !p.scar) continue;
    const st = settlementC(p.i);
    if (p.well) { // the Wellspring monument and its claim state; v3: 1.4x, a soft glow, the settlement faces, five colored drops until claimed
      const painted = PAINTED(), [x0, y0] = painted ? wellBasinAt(p.i) : [st.sx - st.rad - 13 * LS, st.sy + 5], K = painted ? LS * 1.4 : LS;
      if (painted && band !== 'far') { g.save(); pathPoly(g, npoly[p.i]); g.clip(); const gr = g.createRadialGradient(x0, y0 - 2 * K, 0, x0, y0 - 2 * K, 18 * U); gr.addColorStop(0, 'rgba(244,238,223,.28)'); gr.addColorStop(1, 'rgba(244,238,223,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x0, y0 - 2 * K, 18 * U, 0, Math.PI * 2); g.fill(); g.restore(); }
      g.save(); g.translate(x0, y0); g.scale(K, K); const x = 0, y = 0; g.lineWidth = Math.min(1.2, px * 1.1) / K; g.strokeStyle = INK;
      if (p.claim === 'red') for (let k = 0; k < 4; k++) { const a = Math.PI + (k / 3) * Math.PI; const qx = x + Math.cos(a) * 9, qy = y + Math.sin(a) * 5; g.fillStyle = '#FD6533'; g.fillRect(qx - 1.3, qy - 6, 2.6, 6); g.strokeRect(qx - 1.3, qy - 6, 2.6, 6); }
      if (painted) faceFill(g, () => ellipse(g, x, y, 6.5, 3.6), '#CFC6B4', x + 1.2, [x - 7, y - 4, x + 7, y + 4], INK, g.lineWidth); else { g.fillStyle = '#CFC6B4'; ellipse(g, x, y, 6.5, 3.6); g.fill(); g.stroke(); }
      g.fillStyle = '#7FA9BA'; ellipse(g, x, y - 0.4, 4.2, 2); g.fill();
      const claimed = p.claim === 'red', dropCols = ['#F3E6B8', '#3A7BD5', '#3D2B4F', '#FD6533', '#00674B'];
      for (let k = 0; k < 5; k++) { const a = Math.PI + 0.3 + k * 0.6; g.fillStyle = painted ? (claimed ? '#CFC6B4' : dropCols[k]) : '#CFE8F0'; ellipse(g, x + Math.cos(a) * 5, y - 4 + Math.sin(a) * 1.5, painted ? 1.0 : 0.8, painted ? 1.4 : 1.2); g.fill(); if (painted) { g.lineWidth = (0.6 * px) / K; g.strokeStyle = INK; g.stroke(); } }
      g.lineWidth = Math.min(1.2, px * 1.1) / K;
      g.save(); g.translate(x, y - 10); g.rotate(Math.PI / 4); g.strokeStyle = '#E9E4D8'; g.lineWidth = Math.min(1.4, px * 1.3); g.fillStyle = p.claim === 'red' ? '#FD6533' : 'rgba(0,0,0,0)'; g.fillRect(-2.2, -2.2, 4.4, 4.4); g.strokeRect(-2.2, -2.2, 4.4, 4.4); g.restore();
      if (p.claim === 'running') { g.fillStyle = '#5E4630'; g.fillRect(x + 7, y - 6, 2.4, 6); g.fillStyle = '#E9DFC2'; ellipse(g, x + 8.2, y - 7.3, 1.4, 1.4); g.fill(); g.strokeStyle = '#E9E4D8'; g.lineWidth = Math.min(1.6, px * 1.5) / K; g.beginPath(); g.arc(x, y - 1, 11, -Math.PI / 2, -Math.PI / 2 + Math.PI); g.stroke(); g.strokeStyle = 'rgba(233,228,216,.3)'; g.beginPath(); g.arc(x, y - 1, 11, Math.PI / 2, Math.PI * 1.5); g.stroke(); }
      g.restore();
    }
    if (p.siege) { // tents in the besieger's banner, a stake ring, a ram; wall states
      const R = rngFor('siege:' + p.i), rx = st.rad + 12, ry = rx * 0.62;
      g.strokeStyle = '#6B4A2B'; g.lineWidth = Math.min(1.2, px); for (let a = 0.2; a < Math.PI * 2; a += 0.22) { const x = st.sx + Math.cos(a) * rx, y = st.sy + Math.sin(a) * ry; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 0.6, y - 2.6); g.stroke(); }
      for (let k = 0; k < 6; k++) { const a = Math.PI * 0.05 + k * 0.4 + R() * 0.1, x = st.sx + Math.cos(a) * (rx + 9), y = st.sy + Math.sin(a) * (ry + 6), q = LS; g.fillStyle = '#FD6533'; g.beginPath(); g.moveTo(x - 3.5 * q, y); g.lineTo(x, y - 5 * q); g.lineTo(x + 3.5 * q, y); g.closePath(); g.fill(); g.strokeStyle = INK; g.lineWidth = Math.min(1, px); g.stroke(); g.beginPath(); g.moveTo(x, y - 5 * q); g.lineTo(x, y); g.stroke(); }
      const gx = st.sx, gy = st.sy + st.rad * 0.62 + 9; g.fillStyle = '#8C6A47'; g.fillRect(gx - 4, gy - 2, 8, 3); g.strokeRect(gx - 4, gy - 2, 8, 3); g.beginPath(); g.moveTo(gx, gy - 2); g.lineTo(gx, gy - 6); g.stroke();
      if (p.siege !== 'intact') { g.strokeStyle = '#1C1A17'; g.lineWidth = Math.min(1.6, px * 1.4); const wr = st.rad + 3, wy = wr * 0.62; for (const a of [0.6, 2.3, 4.1]) { const x = st.sx + Math.cos(a) * wr, y = st.sy + Math.sin(a) * wy; g.beginPath(); g.moveTo(x - 1.5, y - 2.5); g.lineTo(x + 0.5, y - 0.6); g.lineTo(x - 0.6, y + 1.6); g.stroke(); }
        if (p.siege === 'breached') { const a = Math.PI / 2, x = st.sx + Math.cos(a) * wr + 6, y = st.sy + Math.sin(a) * wy; g.fillStyle = '#9A958C'; for (let k = 0; k < 5; k++) { ellipse(g, x - 3 + k * 1.6, y + (k % 2), 1.2, 0.8); g.fill(); } g.fillStyle = 'rgba(28,26,23,.75)'; g.fillRect(x - 3, y - 3, 6, 3); } }
    }
    if (p.pillage) { // two smoke columns and burning roofs
      for (const h of st.houses.slice(-2)) { g.fillStyle = '#FF8A3A'; ellipse(g, h.x, h.y - 3.5 * HSC, 2.2, 1.4); g.fill(); }
      for (const dx of [-5, 6]) { g.strokeStyle = 'rgba(70,66,63,.6)'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(st.sx + dx, st.sy - 6); g.bezierCurveTo(st.sx + dx + 5, st.sy - 16, st.sx + dx - 5, st.sy - 26, st.sx + dx + 3, st.sy - 38); g.stroke(); g.lineCap = 'butt'; }
    }
    for (const fx of p.fx ?? []) {
      const R = rngFor(`fx:${p.i}:${fx.kind}`);
      if (fx.kind === 'burn') { g.save(); pathPoly(g, G.poly); g.clip(); for (let k = 0; k < 7; k++) { const s = G.slots[Math.floor(R() * G.slots.length)]; if (!s) continue; g.fillStyle = 'rgba(43,42,40,.55)'; g.beginPath(); for (let j = 0; j < 9; j++) { const a = (j / 9) * Math.PI * 2, r = 7 + R() * 7; const xx = s.x + Math.cos(a) * r * 1.4, yy = s.y + Math.sin(a) * r * 0.8; j ? g.lineTo(xx, yy) : g.moveTo(xx, yy); } g.closePath(); g.fill(); } g.restore();
        for (let k = 0; k < 3; k++) { const s = G.slots[Math.floor(R() * G.slots.length)]; if (!s) continue; g.strokeStyle = 'rgba(110,106,100,.6)'; g.lineWidth = Math.min(1.4, px * 1.2); g.beginPath(); g.moveTo(s.x, s.y); g.bezierCurveTo(s.x + 4, s.y - 8, s.x - 4, s.y - 16, s.x + 2, s.y - 26); g.stroke(); } }
      if (fx.kind === 'ashrain') { g.save(); pathPoly(g, G.poly); g.clip(); const [x0, y0, x1, y1] = G.bb; for (let k = 0; k < 110 * fx.step; k++) { const x = x0 + R() * (x1 - x0), y = y0 + R() * (y1 - y0), a = R() * Math.PI; g.fillStyle = k % 3 ? 'rgba(74,71,68,.75)' : 'rgba(233,228,216,.85)'; g.save(); g.translate(x, y); g.rotate(a); g.fillRect(-1.6, -0.8, 3.2, 1.6); g.restore(); } g.restore(); }
      if (fx.kind === 'fertile') { g.strokeStyle = '#7FB04A'; g.lineWidth = Math.min(1.3, px * 1.1); for (const s of G.slots.slice(4, 22)) { g.beginPath(); g.moveTo(s.x, s.y); g.quadraticCurveTo(s.x - 2, s.y - 3, s.x - 3, s.y - 4); g.moveTo(s.x, s.y); g.quadraticCurveTo(s.x + 2, s.y - 3, s.x + 3, s.y - 4.5); g.stroke(); } }
    }
    if (p.scar === 'churned') { const [x, y] = toWorldOff(G.c, 0, -38); g.save(); g.translate(x, y); const k = Math.max(0.7, px * 1.3); g.scale(k, k); g.fillStyle = 'rgba(20,18,15,.85)'; g.beginPath(); g.arc(0, 0, 10, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#F4EEDF'; g.lineWidth = 1.8; g.beginPath(); g.moveTo(-5, -5); g.lineTo(5, 5); g.moveTo(5, -5); g.lineTo(-5, 5); g.moveTo(-5, -5); g.lineTo(-2, -5); g.moveTo(5, -5); g.lineTo(2, -5); g.stroke(); g.restore(); }
  }
}
const toWorldOff = (c, dx, dy) => [c[0] + dx / Math.max(cam.s, 0.5), c[1] + dy / Math.max(cam.s, 0.5)];
// ---- army tokens: painted wood, a contact shadow; standees at Near
const TOKEN_COL = { red: ['#FD6533', '#2A0A04', '#7A1E12'], green: ['#00674B', '#DFF5E8', '#244F22'], indep: ['#91A092', '#1C1A17', '#5E6A60'] };
function standeeSVG(side, cloaked) {
  const [f] = TOKEN_COL[side], body = cloaked ? '#5E6A60' : shadeL(f, -10);
  return cloaked ? `<svg class="standee" width="26" height="40" viewBox="0 0 26 40"><ellipse cx="13" cy="38" rx="9" ry="2" fill="rgba(0,0,0,.3)"/><path d="M13 3c4 0 6 3 6 7l4 27H3l4-27c0-4 2-7 6-7z" fill="${body}" stroke="#1C1A17" stroke-opacity=".7" stroke-width="1.4"/><path d="M9 9c1-3 7-3 8 0v4c-2-1-6-1-8 0z" fill="#2B2A28"/></svg>`
    : `<svg class="standee" width="26" height="40" viewBox="0 0 26 40"><ellipse cx="13" cy="38" rx="9" ry="2" fill="rgba(0,0,0,.3)"/><path d="M8 18h10l2 18H6z" fill="${body}" stroke="#1C1A17" stroke-opacity=".7" stroke-width="1.3"/><circle cx="13" cy="12" r="5" fill="${shadeL(f, 8)}" stroke="#1C1A17" stroke-opacity=".7" stroke-width="1.3"/><path d="M7.5 11c0-5 11-5 11 0z" fill="#4A4744" stroke="#1C1A17" stroke-width="1"/><path d="M6 20l-3 10M20 20l3 9" stroke="#1C1A17" stroke-opacity=".7" stroke-width="2.2" stroke-linecap="round"/><path d="M22 6v25" stroke="#5E4630" stroke-width="1.6"/></svg>`;
}
function badgeSVG(side, sel) {
  const [f, ink] = TOKEN_COL[side], hi = shadeL(f, 12), sym = side === 'red' ? MANA.R.shape : side === 'green' ? MANA.G.shape : '<path d="M7 12h10M12 7v10"/>';
  return `<svg width="30" height="36" viewBox="0 0 30 36"><ellipse cx="15" cy="33.5" rx="10" ry="2.4" fill="rgba(0,0,0,.25)"/><path d="M15 2l12 4v9c0 8-5.5 13-12 16C8.5 28 3 23 3 15V6z" fill="${f}" stroke="${sel ? '#fff' : 'rgba(28,26,23,.7)'}" stroke-width="${sel ? 2 : 1.5}"/><path d="M4.2 6.6L15 3.1l10.8 3.5" fill="none" stroke="${hi}" stroke-width="1"/><g transform="translate(8 7) scale(.58)" fill="none" stroke="${ink}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">${sym}</g></svg>`;
}
let badgeSig = '', badgeEls = [];
function placeBadges(band) { // tokens are rebuilt only when what they show changes; a pan only moves them
  if (RELIEF()) return rlPlacePieces(band); // v4: miniatures on bases (p61)
  const byProv = {};
  for (const c of Object.values(cmd)) if (!c.hidden) (byProv[c.at] ??= []).push(c);
  const near = band === 'near';
  if (near) for (const p of provs) if (p.owner === null && p.indep && !fogOf(p.i) && nbrs(p.i).some((w) => prov[w].owner === 'red') && !byProv[p.i]) (byProv[p.i] ??= []).push({ id: 'indep' + p.i, side: 'indep', squads: [], indepOf: p });
  const sig = [band, state.sel ? state.sel.id : '', curMonth, ...Object.entries(byProv).map(([at, l]) => at + ':' + l.map((c) => c.id + ':' + (c.eta ?? '') + ':' + c.squads.length).join(','))].join('|');
  if (sig !== badgeSig) {
    badgeSig = sig; layer.innerHTML = ''; badgeEls = [];
    for (const [at, list] of Object.entries(byProv)) list.forEach((c, k) => {
      const troops = c.squads.reduce((n, s) => n + s[1], 0);
      const el = document.createElement('div'); el.className = 'badge' + (state.sel && state.sel.id === c.id ? ' sel' : '') + (c.side === 'indep' ? ' indep' : '');
      const word = c.indepOf ? strengthWord(c.indepOf.indep) : null;
      el.innerHTML = (near ? standeeSVG(c.side, !!c.indepOf) : '') + badgeSVG(c.side, state.sel && state.sel.id === c.id) + `<span class="plate" style="background:${TOKEN_COL[c.side][2]}">${word ?? (troops || (c.crown ? '♛' : '·'))}</span>` + (c.eta ? `<span class="eta">${c.eta}d ▸ ${prov[c.to].name}</span>` : '');
      if (c.indepOf) { el.dataset.tip = 'prov:' + at; el.setAttribute('aria-label', `Independents in ${c.indepOf.name}, ${word}`); }
      else { el.dataset.tip = 'cmd:' + c.id; el.tabIndex = 0; el.setAttribute('role', 'button'); el.setAttribute('aria-label', `${cname(c)}, ${troops} troops`); el.addEventListener('click', (e) => { e.stopPropagation(); selectCmd(c.id); }); }
      layer.appendChild(el); badgeEls.push({ el, at: Number(at), k, n: list.length });
    });
  }
  for (const b of badgeEls) {
    const [sx, sy] = toScreen(...cent[b.at]), off = sx < -40 || sx > cw + 40 || sy < -20 || sy > ch + 80;
    b.el.style.display = off ? 'none' : '';
    if (!off) { b.el.style.left = sx + (b.k - (b.n - 1) / 2) * 30 + 'px'; b.el.style.top = sy - 18 - 44 + 'px'; }
  }
}
function updateZoomChip(band) { const z = document.getElementById('zoomChip'); if (z) z.textContent = 'Zoom: ' + band[0].toUpperCase() + band.slice(1); }

// ------------------------------------------------------------------ the camera: the view rect, the scales, the fit and the start view, clamping, zoom, easing
function viewRect() { // the part of the map the panels leave uncovered
  const shown = (id) => { const el = document.getElementById(id); return el && !el.hidden && getComputedStyle(el).display !== 'none' ? el : null; };
  const phone = app.classList.contains('phone'), ld = shown('leftDock'), rd = shown('rightDock'), rail = shown('rail');
  const l = ld && !phone ? ld.offsetWidth : 0;
  const r = cw - (rd && !rd.classList.contains('fly') ? rd.offsetWidth : 0) - (rail ? rail.offsetWidth : 0);
  const b = ch - (app.classList.contains('strip-on') ? document.getElementById('strip').offsetHeight : 0) - (ld && phone ? ld.offsetHeight : 0);
  return { l, r, t: 84, b }; // 84: top bar plus the alerts ribbon
}
function resize() {
  const r = canvas.getBoundingClientRect(); const nd = window.devicePixelRatio || 1;
  if (nd !== dpr) { dpr = nd; invalidateBakes(); }
  cw = r.width; ch = r.height; canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr); amb.width = canvas.width; amb.height = canvas.height;
}
function computeScales() {
  const v = viewRect(), vw = Math.max(80, v.r - v.l), vh = Math.max(80, v.b - v.t);
  const FB = RELIEF() ? MODEL_BOX : CLOTH; // v4: the model (with its south cliff and plaque) fits inside a 32 px oak band
  fitScale = Math.min((vw - 64) / (FB[2] - FB[0]), (vh - 64) / (FB[3] - FB[1]));
  minScale = Math.min(fitScale * 0.9, Math.max(0.75 * Math.min(vw / TW, vh / TH), vw / (ROOM[2] - ROOM[0]), vh / (ROOM[3] - ROOM[1])));
  maxScale = 420 / MED_DIAM;
}
function fit() { // v3: the cloth fits the unobscured area with a 32 px oak band; a phone starts closer, on the selected army. v4 relief: the start view (natural §10 defect 6)
  resize(); computeScales();
  const v = viewRect(), phone = app.classList.contains('phone');
  if (RELIEF()) { const s = startScale(), [fx, fy] = phone ? cent[cmd.varo.at] : startCenter(s); cam.s = s; cam.x = (v.l + v.r) / 2 - fx * s; cam.y = (v.t + v.b) / 2 - fy * s; clampCam(); return; }
  const s = phone ? Math.max(fitScale, 0.5) : fitScale;
  const FB = CLOTH, [fx, fy] = phone ? cent[cmd.varo.at] : [(FB[0] + FB[2]) / 2, (FB[1] + FB[3]) / 2];
  cam.s = s; cam.x = (v.l + v.r) / 2 - fx * s; cam.y = (v.t + v.b) / 2 - fy * s; clampCam();
}
// natural §10 defect 6: windows of 1280 x 720 and smaller started at Far (55 to 63 px a province). The start view is at least 96 px a province (Mid), centred on the
// capital and clamped so the view stays on the model (or centred on it where the model is the smaller). fitScale stays the lean-back fit; Z returns to the start view.
const startScale = () => (RELIEF() ? Math.max(fitScale, RL_P.startDpx / MED_DIAM) : fitScale);
function startCenter(s) {
  const v = viewRect(), hw = (v.r - v.l) / 2 / s, hh = (v.b - v.t) / 2 / s, B = MODEL_BOX, [kx, ky] = cent[redCap];
  const cl = (c, a, b, h) => (b - a <= 2 * h ? (a + b) / 2 : Math.max(a + h, Math.min(b - h, c)));
  return [cl(kx, B[0], B[2], hw), cl(ky, B[1], B[3], hh)];
}
function clampCam() { // the view's center stays inside the table, and the view never shows the void beyond the room
  const v = viewRect(); const cx = ((v.l + v.r) / 2 - cam.x) / cam.s, cy = ((v.t + v.b) / 2 - cam.y) / cam.s;
  const hw = (v.r - v.l) / 2 / cam.s, hh = (v.b - v.t) / 2 / cam.s;
  const rng = (lo, hi, rlo, rhi, mid) => { const a = Math.max(lo, rlo), b = Math.min(hi, rhi); return a <= b ? [a, b] : [mid, mid]; };
  const [xa, xb] = rng(TABLE[0], TABLE[2], ROOM[0] + hw, ROOM[2] - hw, (TABLE[0] + TABLE[2]) / 2), [ya, yb] = rng(TABLE[1], TABLE[3], ROOM[1] + hh, ROOM[3] - hh, (TABLE[1] + TABLE[3]) / 2);
  const nx = Math.max(xa, Math.min(xb, cx)), ny = Math.max(ya, Math.min(yb, cy));
  cam.x += (cx - nx) * cam.s; cam.y += (cy - ny) * cam.s;
}
function zoomAt(mx, my, ns) { ns = Math.max(minScale, Math.min(maxScale, ns)); const k = ns / cam.s; cam.x = mx - (mx - cam.x) * k; cam.y = my - (my - cam.y) * k; cam.s = ns; clampCam(); }
const toScreen = (x, y) => [x * cam.s + cam.x, y * cam.s + cam.y];
const toWorld = (sx, sy) => [(sx - cam.x) / cam.s, (sy - cam.y) / cam.s];
function animateCam(s1, center) { // the detent and Fit: ease over 200 ms (instant under reduced motion)
  const v = viewRect(), mx = (v.l + v.r) / 2, my = (v.t + v.b) / 2;
  const s0 = cam.s, [wx0, wy0] = toWorld(mx, my), [wx1, wy1] = center ?? [wx0, wy0], t0 = performance.now(), ms = view.reduced ? 0 : 200;
  const step = (now) => {
    const t = ms ? Math.min(1, (now - t0) / ms) : 1, e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    cam.s = s0 + (s1 - s0) * e; const wx = wx0 + (wx1 - wx0) * e, wy = wy0 + (wy1 - wy0) * e; cam.x = mx - wx * cam.s; cam.y = my - wy * cam.s; clampCam(); draw();
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
const fitToCloth = () => { if (RELIEF()) { const s = startScale(); animateCam(s, startCenter(s)); return; } const FB = CLOTH; animateCam(fitScale, [(FB[0] + FB[2]) / 2, (FB[1] + FB[3]) / 2]); }; // Z: the start view (relief), the cloth (v3)

// ------------------------------------------------------------------ data-mode colours (the opaque mode raster's fills; frozen as approved, natural §9)
// Palette A/B: the data-mode bases are built from the approved fills and stay frozen under Painted (only the Farmland A/B moves Farmland's, on Bright)
const MODE_BASE = Object.fromEntries(Object.entries(PALETTES.bright).map(([t, f]) => [t, { forest: '#79786B', hills: '#7E7767', swamp: '#6F7A77' }[t] ?? desat(f, 0.8)]));
const HEAT = ['#4C5E96', '#8170AC', '#C4808E', '#E6AC6E', '#F8E6A6'].map(hex2rgb);
function heat(t) { // 0..1 -> a lightness-carrying ramp (L* 41 to 91), readable without hue
  const x = Math.max(0, Math.min(0.9999, t)) * (HEAT.length - 1), k = Math.floor(x), f = x - k, a = HEAT[k], b = HEAT[k + 1];
  return rgb2hex(a.map((v, j) => v + (b[j] - v) * f));
}
const FILLMEMO = new Map();
function fillFor(p) {
  const fog = fogOf(p.i), hid = fog === 'unexplored', base = MODE_BASE[p.terrain];
  const memo = (k, fn) => { let v = FILLMEMO.get(k); if (!v) { v = fn(); FILLMEMO.set(k, v); } return v; };
  switch (state.mode) {
    case 'dominion': return hid || !p.dom.n ? base : memo(`d${p.terrain}${p.dom.n}${p.dom.s}`, () => mix(base, BAN[p.dom.n], p.dom.n === 'red' ? 0.25 + p.dom.s * 0.07 : 0.35 + p.dom.s * 0.07));
    case 'supply': return hid ? base : heat((SUPPLY[p.terrain] + p.pop / 50) / 320);
    case 'unrest': return hid ? base : heat(p.unrest / 60);
    case 'population': return hid ? base : heat((Math.log(p.pop) / Math.log(26000)) * 1.15 - 0.55);
    case 'springs': return base;
    default: {
      const f = TERRAIN[p.terrain].fill;
      if (PAINTED()) return f; // v3: the plain terrain fill; the live state overlay draws haze, sight and the land-look wash (H10)
      if (hid) return memo('u' + f, () => mix(f, '#E8DCC2', 0.04));
      if (fog === 'outofsight') return memo('o' + f, () => desat(f, 0.1));
      if (!p.dom.n) return f;
      return memo(`w${f}${p.dom.n}${p.dom.s}`, () => mix(f, p.dom.n === 'red' ? '#8F8C88' : '#5E7F45', (p.dom.n === 'red' ? 0.1 : 0.06) * p.dom.s / 10));
    }
  }
}

// ------------------------------------------------------------------ v4 relief: the battle's procedural figure atlas (§6.7 M1: one oblique, one figure atlas).
// Copied unchanged from visual-v4/src/00-util.js, 40-figures.js and 42-figure-draw.js (the battle mockup), wrapped so its names stay local.
const FIGLIB = (() => {
// ---- utilities: hashing, seeded streams, easing, projection (design section 3.1) ----
// The replay never uses an unseeded random source or the wall clock. Every choice comes from a
// stream keyed by (battle id, purpose) or from hash32 of a stable key.

const TAU = Math.PI * 2;

function hash32(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}
function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** docs/12 streamFor(battle, purpose): one independent seeded stream per purpose. */
function streamFor(battle, purpose) { return mulberry(hash32(battle + '/' + purpose)); }
/** A stable number in [0,1) for a key. */
function u01(key) { return hash32(key) / 4294967296; }

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const easeOut = (t) => { t = clamp(t, 0, 1); return 1 - (1 - t) * (1 - t); };
const easeIn = (t) => { t = clamp(t, 0, 1); return t * t; };

/** First index i with key(arr[i]) > t (arr sorted ascending by key). */
function upperBound(arr, t, key) {
  let lo = 0, hi = arr.length;
  while (lo < hi) { const m = (lo + hi) >> 1; if (key(arr[m]) <= t) lo = m + 1; else hi = m; }
  return lo;
}

// Projection: orthographic, pitch 40 degrees, yaw 30 degrees (design 3.1).
const PITCH = (40 * Math.PI) / 180, YAW = (30 * Math.PI) / 180;
const CY = Math.cos(YAW), SY = Math.sin(YAW), SP = Math.sin(PITCH), CP = Math.cos(PITCH);
/** Ground (x lateral, y depth, h height) to the screen plane, before the camera. */
function sx(x, y) { return x * CY + y * SY; }
function sy(x, y, h) { return (x * SY - y * CY) * SP - (h || 0) * CP; }
function toGround(X, Y) { const Yp = Y / SP; return { x: X * CY + Yp * SY, y: X * SY - Yp * CY }; }
/** Larger is nearer the camera. */
function depthKey(x, y) { return (x * SY - y * CY) * SP; }
/** Canvas 2D transform that draws ground coordinates onto the screen plane. */
const GROUND_MATRIX = [CY, SY * SP, SY, -CY * SP];

// Colors
function hexToNum(h) { return parseInt(h.replace('#', ''), 16); }
function numToHex(n) { return '#' + (n >>> 0).toString(16).padStart(6, '0'); }
function mix(a, b, t) {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  return (Math.round(lerp(ar, br, t)) << 16) | (Math.round(lerp(ag, bg, t)) << 8) | Math.round(lerp(ab, bb, t));
}
function shade(c, f) { return mix(c, f < 0 ? 0x000000 : 0xffffff, Math.abs(f)); }
function rgba(n, a) { return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; }
/** CIE L* of an sRGB color (for the value rule checks). */
function lstar(n) {
  const f = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const Y = 0.2126 * f((n >> 16) & 255) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255);
  return Y > 216 / 24389 ? 116 * Math.cbrt(Y) - 16 : (24389 / 27) * Y;
}

const PHASES = ['scripts', 'ranged', 'melee', 'morale', 'end'];

// Open-ended DRN (docs/04): 2d6, each 6 rerolled and added. Distribution of X - Y for the
// break chance (docs/12 S2.16), truncated below 1e-6, computed once.
const DRN_DIFF = (() => {
  const die = new Map();
  // one open-ended d6: values 1..5 with 1/6, 6+k recursively
  const add = (m, v, p) => m.set(v, (m.get(v) || 0) + p);
  const d = new Map();
  let carry = 1, base = 0;
  while (carry > 1e-9) {
    for (let v = 1; v <= 5; v++) add(d, base + v, carry / 6);
    base += 6; carry /= 6;
  }
  void die;
  const conv = (a, b) => { const m = new Map(); for (const [x, p] of a) for (const [y, q] of b) if (p * q > 1e-12) add(m, x + y, p * q); return m; };
  const drn = conv(d, d);
  const diff = new Map();
  for (const [x, p] of drn) for (const [y, q] of drn) if (p * q > 1e-12) add(diff, x - y, p * q);
  return diff;
})();
/** P(X - Y < thr) for two open-ended DRNs. */
function pBelow(thr) { let p = 0; for (const [v, q] of DRN_DIFF) if (v < thr) p += q; return p; }

// Color difference under color vision deficiency, as the repo's tests/content/colorMath.ts:
// sRGB -> CIELAB (D65), CIEDE2000, Machado 2009 full-severity simulation on linear RGB.
const CVD = {
  protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  tritan: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]],
};
const VISIONS = ['normal', 'protan', 'deutan', 'tritan'];
function labAs(n, vision) {
  const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  let rgb = [lin((n >> 16) & 255), lin((n >> 8) & 255), lin(n & 255)];
  if (vision !== 'normal') { const m = CVD[vision]; rgb = m.map((row) => clamp(row[0] * rgb[0] + row[1] * rgb[1] + row[2] * rgb[2], 0, 1)); }
  const [r, g, b] = rgb;
  const x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047;
  const y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  const z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883;
  const f = (q) => (q > 216 / 24389 ? Math.cbrt(q) : ((24389 / 27) * q + 16) / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}
function deltaE2000([L1, a1, b1], [L2, a2, b2]) {
  const rad = Math.PI / 180;
  const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2), Cbar = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cbar ** 7 / (Cbar ** 7 + 25 ** 7)));
  const a1p = (1 + G) * a1, a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);
  const hue = (a, b) => (a === 0 && b === 0 ? 0 : (Math.atan2(b, a) / rad + 360) % 360);
  const h1p = hue(a1p, b1), h2p = hue(a2p, b2);
  let dhp = 0;
  if (C1p * C2p !== 0) { dhp = h2p - h1p; if (dhp > 180) dhp -= 360; else if (dhp < -180) dhp += 360; }
  const dLp = L2 - L1, dCp = C2p - C1p, dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp / 2) * rad);
  const Lbp = (L1 + L2) / 2, Cbp = (C1p + C2p) / 2;
  let hbp = h1p + h2p;
  if (C1p * C2p !== 0) { if (Math.abs(h1p - h2p) > 180) hbp += h1p + h2p < 360 ? 360 : -360; hbp /= 2; }
  const Tt = 1 - 0.17 * Math.cos((hbp - 30) * rad) + 0.24 * Math.cos(2 * hbp * rad) + 0.32 * Math.cos((3 * hbp + 6) * rad) - 0.2 * Math.cos((4 * hbp - 63) * rad);
  const dTheta = 30 * Math.exp(-(((hbp - 275) / 25) ** 2));
  const Rc = 2 * Math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7));
  const Sl = 1 + (0.015 * (Lbp - 50) ** 2) / Math.sqrt(20 + (Lbp - 50) ** 2), Sc = 1 + 0.045 * Cbp, Sh = 1 + 0.015 * Cbp * Tt;
  const Rt = -Math.sin(2 * dTheta * rad) * Rc;
  return Math.sqrt((dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh));
}
/** ΔE2000 between two sRGB colors as seen with each vision. */
function deltaEBy(a, b) { const o = {}; for (const v of VISIONS) o[v] = +deltaE2000(labAs(a, v), labAs(b, v)).toFixed(1); return o; }
/** The colorblind rule's minimum (docs/09, palette-ab/decision.md). */
const CVD_MIN = 12;

// ---- procedural rank-and-file figures, baked into pose frames (design 12.1) ----
// Original shapes drawn with Pixi Graphics for a 40-degree overhead three-quarter camera; nothing
// is traced from any reference. Art space: a size-1 figure is 50 px tall, feet at (0, 0), facing
// screen right. Two views: 'se' (front three-quarter) and 'ne' (back three-quarter); flips give
// 'sw' and 'nw'. Every frame gets a dark keyline (#1C1A17 at 60%) around its silhouette.

const ART = { cell: 88, foot: 70, figH: 50, pxPerWu: 50 / 28 };
const INK = 0x1c1a17;
const FR = { idle: 0, idle1: 1, walk: 2, atk: 6, shoot: 10, brace: 13, flinch: 14, fall: 15, dead: 17, white: 18, whiteFlinch: 19, N: 20 };

const PALETTES = {
  cinderHorde: { cloth: 0xc4532c, clothDark: 0x7e3118, clothLight: 0xd9744a, metal: 0x4d4843, metalHi: 0x8f877d, leather: 0x47321f,
    skin: 0xa88068, wood: 0x6b4c32, trim: 0xd2a347, hair: 0x2a1d16, bark: 0x5b4636, horse: 0x5a4636, horseDark: 0x3a2b20 },
  thornwood: { cloth: 0x1f6a50, clothDark: 0x113f2f, clothLight: 0x2f8a68, metal: 0x6f5a3c, metalHi: 0xa58b5c, leather: 0x4a3a28,
    skin: 0xc49a76, wood: 0x6e5232, trim: 0xc9b26b, hair: 0x4a3524, bark: 0x5e4a33, horse: 0x77736c, horseDark: 0x4e4a45 },
  independent: { cloth: 0x8c8a80, clothDark: 0x5c5a54, clothLight: 0xaaa79c, metal: 0x6d7076, metalHi: 0xb0b4ba, leather: 0x4f4338,
    skin: 0xc8a080, wood: 0x7a5a3a, trim: 0x9a8a6a, hair: 0x3a2a20, bark: 0x5e4a33, horse: 0x6a5040, horseDark: 0x45342a },
};

/** Unit looks: body plan, gear and silhouette. */
const LOOKS = {
  ashMilitia: { body: 'man', helm: 'cap', armor: 'padded', weapon: 'spear', shield: null },
  thornMilitia: { body: 'man', helm: 'hood', armor: 'padded', weapon: 'spear', shield: null },
  lightInfantry: { body: 'man', helm: 'cap', armor: 'padded', weapon: 'spear', shield: 'round' },
  swampFighter: { body: 'man', helm: 'hood', armor: 'padded', weapon: 'spear', shield: null },
  cinderWarrior: { body: 'man', helm: 'crestHelm', armor: 'scale', weapon: 'axe', shield: 'round' },
  heavyInfantry: { body: 'man', helm: 'kettle', armor: 'plate', weapon: 'sword', shield: 'kite' },
  warden: { body: 'man', helm: 'leafHelm', armor: 'bark', weapon: 'sword', shield: 'round', cape: true },
  briarGuard: { body: 'man', helm: 'thornHelm', armor: 'bark', weapon: 'halberd', shield: null, cape: true },
  flamebrand: { body: 'man', helm: 'crestHelm', armor: 'scale', weapon: 'fireSword', shield: null, cape: true, glow: true },
  berserker: { body: 'man', helm: 'wild', armor: 'bare', weapon: 'greatAxe', shield: null },
  flameArcher: { body: 'man', helm: 'hood', armor: 'padded', weapon: 'bow', shield: null, quiver: true, fire: true },
  longbowHunter: { body: 'man', helm: 'hood', armor: 'padded', weapon: 'longbow', shield: null, quiver: true, cape: true },
  archer: { body: 'man', helm: 'cap', armor: 'padded', weapon: 'bow', shield: null, quiver: true },
  emberSkirmisher: { body: 'man', helm: 'band', armor: 'padded', weapon: 'javelin', shield: null },
  ashRider: { body: 'horse', helm: 'crestHelm', armor: 'scale', weapon: 'lance', shield: null },
  wolfRider: { body: 'wolf', helm: 'hood', armor: 'bark', weapon: 'spear', shield: null },
  wolf: { body: 'wolfOnly' },
  fireSprite: { body: 'sprite' },
  hornetSwarm: { body: 'swarm' },
  ashChieftain: { body: 'man', helm: 'horned', armor: 'scale', weapon: 'axe', shield: null, cape: true, banner: true },
  wardenCaptain: { body: 'man', helm: 'leafHelm', armor: 'bark', weapon: 'sword', shield: 'round', cape: true, banner: true },
  independentCaptain: { body: 'man', helm: 'kettle', armor: 'mail', weapon: 'sword', shield: 'round', cape: true, banner: true },
  cinderMagus: { body: 'man', helm: 'robeHood', armor: 'robe', weapon: 'staff', staffGlow: 0xff8a3a },
  emberAdept: { body: 'man', helm: 'robeHood', armor: 'robe', weapon: 'staff', staffGlow: 0xffa04a },
  pyrePriest: { body: 'man', helm: 'mitre', armor: 'robe', weapon: 'staff', staffGlow: 0xffd070 },
  elderDruid: { body: 'man', helm: 'antler', armor: 'robe', weapon: 'staff', staffGlow: 0x9be07a },
  saplingDruid: { body: 'man', helm: 'leafCrown', armor: 'robe', weapon: 'staff', staffGlow: 0xb8e08a },
  grovePriest: { body: 'man', helm: 'leafCrown', armor: 'robe', weapon: 'staff', staffGlow: 0xf0e08a, light: true },
  cinderScout: { body: 'man', helm: 'hood', armor: 'padded', weapon: 'dagger' },
  thornScout: { body: 'man', helm: 'hood', armor: 'padded', weapon: 'dagger' },
  oakheart: { body: 'man', helm: 'leafHelm', armor: 'bark', weapon: 'maul', shield: null, scale: 1.5 },
};

// ---------------------------------------------------------------------------------------
function P(g) {
  return {
    poly(pts, fill, a) { g.poly(pts).fill({ color: fill, alpha: a ?? 1 }); return this; },
    ell(x, y, rx, ry, fill, a) { g.ellipse(x, y, rx, ry).fill({ color: fill, alpha: a ?? 1 }); return this; },
    circ(x, y, r, fill, a) { g.circle(x, y, r).fill({ color: fill, alpha: a ?? 1 }); return this; },
    rect(x, y, w, h, fill, a) { g.rect(x, y, w, h).fill({ color: fill, alpha: a ?? 1 }); return this; },
    rrect(x, y, w, h, r, fill, a) { g.roundRect(x, y, w, h, r).fill({ color: fill, alpha: a ?? 1 }); return this; },
    line(x0, y0, x1, y1, w, color, a) { g.moveTo(x0, y0).lineTo(x1, y1).stroke({ width: w, color, alpha: a ?? 1, cap: 'round' }); return this; },
    curve(pts, w, color, a) { g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 4) g.quadraticCurveTo(pts[i], pts[i + 1], pts[i + 2], pts[i + 3]); g.stroke({ width: w, color, alpha: a ?? 1, cap: 'round', join: 'round' }); return this; },
  };
}

/** Pose parameters for a frame. */
function poseParams(frame) {
  const q = { step: 0, bob: 0, atk: -1, shoot: -1, brace: 0, flinch: 0, fall: -1, dead: false };
  if (frame === FR.idle1) q.bob = 0.8;
  else if (frame >= FR.walk && frame < FR.walk + 4) { const k = frame - FR.walk; q.step = [1, 0, -1, 0][k]; q.bob = [0, 1, 0, 1][k]; }
  else if (frame >= FR.atk && frame < FR.atk + 4) q.atk = frame - FR.atk; // 0 windup, 1 strike, 2 recover, 3 strike variant
  else if (frame >= FR.shoot && frame < FR.shoot + 3) q.shoot = frame - FR.shoot; // 0 draw, 1 loose, 2 recover
  else if (frame === FR.brace) q.brace = 1;
  else if (frame === FR.flinch || frame === FR.whiteFlinch) q.flinch = 1;
  else if (frame === FR.fall || frame === FR.fall + 1) q.fall = frame - FR.fall;
  else if (frame === FR.dead) q.dead = true;
  return q;
}

// ---------------------------------------------------------------------------------------
/**
 * Bakes the frames of the given (unit, side palette) looks: per look, one render of every frame's
 * vector parts, then one render that lays the dark keyline (the silhouette offset in 8 directions
 * at 60%) under it. Returns Map key -> {ne: Texture[], se: Texture[]}.
 */
function bakeFigures(renderer, list) {
  const out = new Map();
  const C = ART.cell;
  const cols = 10;
  const rows = Math.ceil((FR.N * 2) / cols);
  const whiteM = [0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0];
  for (const { key, unit, pal, scale } of list) {
    const opts = { width: C * cols, height: C * rows, resolution: 1, antialias: true };
    const rtA = PIXI.RenderTexture.create(opts), rtB = PIXI.RenderTexture.create(opts);
    const root = new PIXI.Container();
    const whites = new PIXI.Container();
    const cm = new PIXI.ColorMatrixFilter(); cm.matrix = whiteM; whites.filters = [cm];
    root.addChild(whites);
    const cells = { ne: [], se: [] };
    let k = 0;
    for (const view of ['ne', 'se']) for (let f = 0; f < FR.N; f++) {
      const cx = (k % cols) * C, cy = Math.floor(k / cols) * C;
      const holder = new PIXI.Container();
      holder.position.set(cx + C / 2, cy + ART.foot);
      const white = f === FR.white || f === FR.whiteFlinch;
      const fall = f === FR.fall || f === FR.fall + 1, dead = f === FR.dead;
      const g = new PIXI.Graphics();
      drawFigure(g, unit, pal, view, white ? (f === FR.white ? FR.idle : FR.flinch) : f === FR.fall ? FR.flinch : f);
      const body = new PIXI.Container();
      body.addChild(g);
      if (f === FR.fall) { body.rotation = (view === 'ne' ? -1 : 1) * 0.55; body.position.set((view === 'ne' ? -3 : 3), 0); }
      const s = scale || 1;
      body.scale.x *= s; body.scale.y *= s;
      holder.addChild(body);
      (white ? whites : root).addChild(holder);
      cells[view].push({ cx, cy });
      k++;
    }
    renderer.render({ container: root, target: rtA, clear: true });
    const comp = new PIXI.Container();
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]]) {
      const sp = new PIXI.Sprite(rtA); sp.position.set(dx * 1.1, dy * 1.1); sp.tint = INK; sp.alpha = 0.6; comp.addChild(sp);
    }
    comp.addChild(new PIXI.Sprite(rtA));
    renderer.render({ container: comp, target: rtB, clear: true });
    const frames = { ne: [], se: [] };
    for (const view of ['ne', 'se']) frames[view] = cells[view].map(({ cx, cy }) => new PIXI.Texture({ source: rtB.source, frame: new PIXI.Rectangle(cx, cy, C, C) }));
    out.set(key, frames);
    root.destroy({ children: true }); comp.destroy({ children: true });
    rtA.destroy(true); // only the composited frames are kept
  }
  return out;
}
const FIG_ANCHOR = { x: 0.5, y: ART.foot / ART.cell };

// ---- figure drawing: chunky miniatures for a 40-degree overhead camera ----
// Art px, figure 50 px tall, feet at (0, 0), facing screen right. Light from the upper left.
// Proportions favour what the camera sees: a big head and helmet top, broad shoulders, short legs.
// The side's cloth sits on the top-visible surfaces: helmet crests, shoulders, cloaks, shield faces.

/** Draws one figure frame into Graphics g (art space). */
function drawFigure(g, unit, pal, view, frame) {
  const look = LOOKS[unit] || LOOKS.ashMilitia;
  const q = poseParams(frame);
  if (look.body === 'sprite') return drawSprite(g, pal, q, view);
  if (look.body === 'swarm') return drawSwarm(g, q);
  if (q.dead || q.fall === 1) return drawLying(g, look, pal, view, q);
  if (look.body === 'horse' || look.body === 'wolf') return drawRider(g, look, pal, view, q);
  if (look.body === 'wolfOnly') return drawWolf(g, pal, view, q, 0, 0, true);
  return drawMan(g, look, pal, view, q);
}

function weaponPose(q) {
  if (q.atk === 0) return { w: -1, lunge: -1.5 };   // windup: pulled back
  if (q.atk === 1) return { w: 1, lunge: 3.5 };      // strike
  if (q.atk === 2) return { w: 0.45, lunge: 1.2 };   // recover
  if (q.atk === 3) return { w: 1.25, lunge: 3 };     // strike variant
  if (q.brace) return { w: 0.35, lunge: 0 };
  return { w: 0, lunge: 0 };
}

const SKIN_HI = (c) => shade(c, 0.12);

function drawMan(g, look, pal, view, q) {
  const d = P(g);
  const back = view === 'ne';
  const robe = look.armor === 'robe';
  const wp = weaponPose(q);
  const ox = wp.lunge + (q.flinch ? -2.2 : 0);
  const oy = -q.bob + (q.brace ? 1.4 : 0) + (q.flinch ? 0.6 : 0);
  const sc = look.scale || 1;
  void sc;
  d.ell(5, 0.6, 12.5, 4.4, 0x000000, 0.32);
  // weapon behind the body (back view: the weapon arm is on the far, screen-right side, in front)
  // banner pole behind everything
  if (look.banner) drawBanner(g, pal, back, ox, oy, q);
  if (look.quiver && !back) d.rrect(ox - 9, oy - 33, 5, 15, 2, pal.leather);
  // legs
  const legC = look.armor === 'bare' ? pal.clothDark : look.armor === 'bark' ? pal.bark : pal.leather;
  if (!robe) {
    const st = q.step * 3.4;
    d.line(ox - 2.8, oy - 15, -3.6 - st, -2, 5.4, shade(legC, -0.18));
    d.line(ox + 2.8, oy - 15, 3.8 + st, -2, 5.4, legC);
    d.ell(-3.8 - st, -1.2, 3.6, 2.1, 0x261c14); d.ell(4.4 + st, -1.2, 3.6, 2.1, 0x2c2118);
  }
  // cloak on the back (back view), large and in side cloth: what the camera sees of the near side
  if (back && (look.cape || look.armor === 'bark' || look.armor === 'padded' || look.armor === 'scale' || look.armor === 'mail')) {
    d.poly([ox - 9.5, oy - 30, ox + 9.5, oy - 30, ox + 10.5, oy - 9, ox + 3, oy - 7, ox - 3, oy - 8.5, ox - 10.5, oy - 9.5], look.cape ? pal.cloth : pal.clothDark);
    d.poly([ox + 2.5, oy - 30, ox + 9.5, oy - 30, ox + 10.5, oy - 9, ox + 3, oy - 7], shade(look.cape ? pal.cloth : pal.clothDark, -0.22), 0.8);
    d.line(ox - 3, oy - 27, ox - 4, oy - 10, 1.2, shade(pal.cloth, -0.35), 0.6);
  } else if (!back && look.cape) {
    d.poly([ox - 10, oy - 29, ox - 6, oy - 30, ox - 9, oy - 9, ox - 12.5, oy - 10], pal.clothDark);
  }
  // torso
  if (robe) {
    const R = look.light ? 0xd2c7aa : pal.cloth;
    d.poly([ox - 9, oy - 30, ox + 9, oy - 30, ox + 11.5, oy - 1.5, ox + 3, oy + 0.5, ox - 11.5, oy - 1.5], R);
    d.poly([ox + 2.5, oy - 30, ox + 9, oy - 30, ox + 11.5, oy - 1.5, ox + 3, oy + 0.5], shade(R, -0.22), 0.9);
    d.poly([ox - 9, oy - 30, ox - 4, oy - 30, ox - 6, oy - 1, ox - 11.5, oy - 1.5], shade(R, 0.1), 0.6);
    d.rect(ox - 9, oy - 18, 18, 2.6, pal.trim, 0.95);
    if (!back) d.rect(ox - 1.2, oy - 29, 2.4, 27, pal.trim, 0.7);
  } else {
    const T = look.armor === 'bare' ? pal.skin : look.armor === 'scale' ? pal.cloth : look.armor === 'bark' ? pal.bark : look.armor === 'plate' || look.armor === 'mail' ? pal.metal : pal.cloth;
    if (!back || !(look.cape || look.armor === 'bark' || look.armor === 'padded' || look.armor === 'scale' || look.armor === 'mail')) {
      d.poly([ox - 9.5, oy - 30, ox + 9.5, oy - 30, ox + 7.8, oy - 14, ox - 7.8, oy - 14], T);
      d.poly([ox + 3, oy - 30, ox + 9.5, oy - 30, ox + 7.8, oy - 14, ox + 2.5, oy - 14], shade(T, -0.24), 0.9);
      d.poly([ox - 9.5, oy - 30, ox - 4.5, oy - 30, ox - 4.2, oy - 14, ox - 7.8, oy - 14], shade(T, 0.12), 0.7);
      if (look.armor === 'scale') for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) d.ell(ox - 6.4 + c * 3.2 + (r % 2) * 1.6, oy - 27 + r * 3.5, 1.6, 1.1, shade(pal.cloth, -0.4), 0.55);
      if (look.armor === 'bark') { for (let r = 0; r < 3; r++) d.line(ox - 7, oy - 26 + r * 4.3, ox + 7, oy - 25 + r * 4.3, 1.3, shade(pal.bark, -0.4), 0.8); if (!back) d.poly([ox - 4, oy - 30, ox + 4, oy - 30, ox + 3, oy - 15, ox - 3, oy - 15], pal.cloth); }
      if (look.armor === 'bare') { for (let i = 0; i < 3; i++) d.line(ox - 6, oy - 26 + i * 3.6, ox + 1, oy - 25 + i * 3.6, 1.4, 0x7a2a20, 0.7); d.line(ox - 9, oy - 22, ox + 9, oy - 26, 2.4, pal.leather); }
      if (look.armor === 'padded' && !back) { d.poly([ox - 3.5, oy - 30, ox + 3.5, oy - 30, ox + 3, oy - 15, ox - 3, oy - 15], pal.clothLight, 0.55); }
      if (look.armor === 'mail' || look.armor === 'plate') d.poly([ox - 4, oy - 30, ox + 4, oy - 30, ox + 3, oy - 15, ox - 3, oy - 15], pal.cloth, 0.95);
    }
    // the tunic skirt over the upper legs, side cloth
    d.poly([ox - 8.5, oy - 16, ox + 8.5, oy - 16, ox + 9.5, oy - 8.5, ox - 9.5, oy - 8.5], look.armor === 'padded' ? pal.clothDark : pal.cloth);
    d.poly([ox + 2.5, oy - 16, ox + 8.5, oy - 16, ox + 9.5, oy - 8.5, ox + 3, oy - 8.5], shade(look.armor === 'padded' ? pal.clothDark : pal.cloth, -0.2), 0.8);
    d.rect(ox - 8.5, oy - 17.2, 17, 2.4, pal.leather);
  }
  // shield arm and shield on the far side in the back view
  const sh = look.shield;
  if (sh && back) drawShield(g, pal, true, ox - 10, oy - 19 + (q.brace ? -2 : 0), sh);
  // shoulders: pauldrons in side cloth, lit from the upper left
  const shC = look.armor === 'bare' ? pal.skin : robe ? (look.light ? 0xd2c7aa : pal.cloth) : look.armor === 'bark' ? pal.clothLight : pal.cloth;
  d.ell(ox - 8.6, oy - 28.5, 4.8, 3.6, shade(shC, 0.12));
  d.ell(ox + 8.6, oy - 28.5, 4.8, 3.6, shade(shC, -0.1));
  if (look.armor === 'scale' || look.armor === 'plate' || look.armor === 'mail') { d.ell(ox - 9.4, oy - 29.6, 2.4, 1.4, shade(pal.cloth, 0.35), 0.7); }
  // the off arm when there is no shield
  if (!sh && !robe && look.weapon !== 'bow' && look.weapon !== 'longbow') {
    const ax = back ? ox - 10 : ox + 9.5;
    d.line(ax, oy - 27, ax + (back ? -0.5 : 1.5), oy - 17, 4.4, look.armor === 'bare' ? pal.skin : pal.clothDark);
    d.circ(ax + (back ? -0.5 : 1.5), oy - 16.5, 2.1, pal.skin);
  }
  // head
  drawHead(g, look, pal, back, ox, oy, q);
  // weapon (and its arm)
  drawWeapon(g, look, pal, view, q, ox, oy);
  if (sh && !back) drawShield(g, pal, false, ox + 8.5, oy - 19 + (q.brace ? -2 : 0), sh);
  if (look.quiver && back) { d.rrect(ox - 7.5, oy - 35, 5.2, 16, 2, pal.leather); d.line(ox - 6.5, oy - 35.5, ox - 5, oy - 41, 1.3, pal.trim); d.line(ox - 4.5, oy - 35.5, ox - 3, oy - 41, 1.3, look.fire ? 0xffa040 : 0xe8e0c8); }
  if (look.glow) d.circ(ox, oy - 22, 15, 0xff9a40, 0.10);
}

function drawShield(g, pal, back, x, y, kind) {
  const d = P(g);
  const r = kind === 'kite' ? 8 : 8.6;
  if (back) {
    d.ell(x, y, 4.8, r + 0.6, pal.trim);
    d.ell(x + 0.6, y, 3.8, r - 0.6, shade(pal.wood, -0.1));
    d.line(x + 0.6, y - r + 2, x + 0.6, y + r - 2, 1.2, shade(pal.wood, -0.35));
    return;
  }
  d.ell(x, y, r, r + 0.8, pal.trim);
  d.ell(x, y, r - 1.4, r - 0.6, pal.cloth);
  d.ell(x - 1.8, y - 2.2, r - 4, r - 4.4, pal.clothLight, 0.55);
  d.ell(x + 2, y + 2.4, r - 4.2, r - 4.6, shade(pal.cloth, -0.25), 0.5);
  d.circ(x, y, 2.2, pal.metalHi); d.circ(x - 0.6, y - 0.6, 0.9, 0xffffff, 0.6);
}

function drawHead(g, look, pal, back, ox, oy, q) {
  const d = P(g);
  const hx = ox + (q.atk === 1 || q.atk === 3 ? 1.2 : 0), hy = oy - 36.5;
  const h = look.helm;
  // head and face
  d.circ(hx, hy, 6.8, pal.skin);
  if (!back) { d.ell(hx + 2.4, hy + 1, 3.8, 4, SKIN_HI(pal.skin)); d.circ(hx + 3.6, hy - 0.2, 0.9, 0x1c1a17); d.circ(hx + 0.8, hy - 0.4, 0.8, 0x1c1a17, 0.8); }
  else d.ell(hx - 0.6, hy + 0.6, 6.4, 5.6, pal.hair);
  const metalTop = (hRx, hRy) => {
    d.ell(hx, hy - 2.6, hRx, hRy, pal.metal);
    d.ell(hx + 2, hy - 1.6, hRx * 0.55, hRy * 0.7, shade(pal.metal, -0.22), 0.8);
    d.ell(hx - 2.2, hy - 4.4, hRx * 0.45, hRy * 0.38, pal.metalHi, 0.9);
  };
  if (h === 'crestHelm' || h === 'kettle' || h === 'horned') {
    metalTop(7.6, 6.2);
    d.rect(hx - 7.6, hy - 0.4, 15.2, 1.8, shade(pal.metal, -0.35));
    if (h === 'crestHelm') { d.ell(hx, hy - 7.6, 6.2, 2.4, pal.cloth); d.ell(hx - 1.5, hy - 8.4, 3.4, 1.1, pal.clothLight, 0.9); }
    if (h === 'kettle') d.ell(hx, hy - 0.4, 9.6, 2.6, pal.metal);
    if (h === 'horned') { d.curve([hx - 6, hy - 4, hx - 12.5, hy - 7, hx - 10, hy - 14], 2.6, 0xe6dac0); d.curve([hx + 6, hy - 4, hx + 12.5, hy - 7, hx + 10, hy - 14], 2.6, 0xcfc3a8); d.ell(hx, hy - 8, 4, 1.6, pal.cloth); }
  } else if (h === 'leafHelm' || h === 'thornHelm') {
    metalTop(7.6, 6.2);
    // a broad leaf crest in side cloth across the helmet top
    d.poly([hx - 7.5, hy - 4, hx - 3, hy - 10.5, hx + 1, hy - 11.2, hx + 7.6, hy - 5, hx + 1, hy - 7], pal.cloth);
    d.poly([hx - 6, hy - 5, hx - 2.5, hy - 9.5, hx + 0.5, hy - 9.8, hx - 1, hy - 7], pal.clothLight, 0.9);
    if (h === 'thornHelm') for (let i = -2; i <= 2; i++) d.line(hx + i * 2.6, hy - 7, hx + i * 3.4, hy - 12.5, 1.4, shade(pal.bark, -0.2));
  } else if (h === 'hood' || h === 'robeHood') {
    const C = h === 'robeHood' ? pal.clothDark : pal.cloth;
    d.poly([hx - 7.8, hy + 4, hx - 8, hy - 4, hx - 3, hy - 10.5, hx + 3, hy - 10, hx + 8, hy - 3.5, hx + 7.4, hy + 4], C);
    d.poly([hx + 2, hy - 10, hx + 8, hy - 3.5, hx + 7.4, hy + 4, hx + 3, hy + 3], shade(C, -0.22), 0.85);
    if (!back) { d.ell(hx + 2.8, hy + 1, 3.6, 3.8, pal.skin); d.circ(hx + 3.8, hy + 0.2, 0.85, 0x1c1a17); }
    d.ell(hx - 2.4, hy - 6, 3.2, 2, shade(C, 0.25), 0.8);
  } else if (h === 'cap') {
    d.ell(hx, hy - 3.4, 7.2, 5, pal.leather); d.ell(hx - 2, hy - 5, 3.2, 1.8, shade(pal.leather, 0.3));
    d.rect(hx - 7.2, hy - 1.4, 14.4, 2, pal.cloth);
  } else if (h === 'wild') {
    d.ell(hx, hy - 3.6, 7.4, 5, pal.hair);
    for (let i = 0; i < 6; i++) d.line(hx - 6 + i * 2.4, hy - 6, hx - 7.5 + i * 3, hy - 12 - (i % 2) * 2.5, 1.9, pal.hair);
    d.rect(hx - 6.8, hy - 2.6, 13.6, 1.8, pal.cloth);
  } else if (h === 'band') {
    d.ell(hx, hy - 3.4, 6.8, 4.6, pal.hair); d.rect(hx - 7, hy - 2.8, 14, 2.2, pal.cloth);
  } else if (h === 'mitre') {
    d.poly([hx - 6, hy - 2, hx - 5, hy - 13, hx, hy - 17, hx + 5, hy - 13, hx + 6, hy - 2], pal.trim);
    d.poly([hx - 2.4, hy - 3, hx - 1.8, hy - 13, hx + 1.8, hy - 13, hx + 2.4, hy - 3], pal.cloth);
  } else if (h === 'antler') {
    const C = pal.clothDark;
    d.poly([hx - 7.8, hy + 4, hx - 8, hy - 4, hx - 3, hy - 10.5, hx + 3, hy - 10, hx + 8, hy - 3.5, hx + 7.4, hy + 4], C);
    if (!back) d.ell(hx + 2.8, hy + 1, 3.6, 3.8, pal.skin);
    d.curve([hx - 3, hy - 9, hx - 10, hy - 14, hx - 8, hy - 20], 2, 0xdcd0b4); d.line(hx - 8.8, hy - 14.5, hx - 13, hy - 15, 1.6, 0xdcd0b4);
    d.curve([hx + 3, hy - 9, hx + 10, hy - 14, hx + 8, hy - 20], 2, 0xc8bca0); d.line(hx + 8.8, hy - 14.5, hx + 13, hy - 15, 1.6, 0xc8bca0);
  } else if (h === 'leafCrown') {
    d.ell(hx, hy - 3.4, 7, 4.8, pal.hair);
    for (let i = 0; i < 6; i++) d.ell(hx - 6 + i * 2.4, hy - 6.6 - (i % 2) * 1.2, 2, 1.3, 0x86b852);
  }
}

function drawWeapon(g, look, pal, view, q, ox, oy) {
  const d = P(g);
  const back = view === 'ne';
  const w = look.weapon;
  const wp = weaponPose(q);
  const armC = look.armor === 'bare' ? pal.skin : look.armor === 'robe' ? (look.light ? 0xd2c7aa : pal.cloth) : pal.clothDark;
  // weapon shoulder: screen right in the back view, screen left (behind) in the front view
  const sx0 = back ? ox + 9.5 : ox - 9.5, sy0 = oy - 27;
  if (w === 'bow' || w === 'longbow') {
    const L = w === 'longbow' ? 25 : 18;
    const bx = ox + (back ? 11 : 12), by = oy - 24;
    const draw = q.shoot === 0 ? 6 : q.shoot === 1 ? 1 : 0;
    d.line(ox + (back ? 9 : 8), oy - 27, bx, by, 4.2, armC);
    d.curve([bx, by - L, bx + 6, by, bx, by + L * 0.65], 2.6, pal.wood);
    d.line(bx, by - L, bx - draw, by, 0.9, 0xe6dcc0); d.line(bx - draw, by, bx, by + L * 0.65, 0.9, 0xe6dcc0);
    d.line(ox - (back ? 7 : 6), oy - 27, bx - draw - 1, by, 4, armC);
    if (q.shoot === 0) { d.line(bx - draw, by, bx + 11, by - 1.5, 1.4, pal.wood); if (look.fire) { d.circ(bx + 11.5, by - 1.5, 3.6, 0xff8a2a, 0.35); d.circ(bx + 11.5, by - 1.5, 2, 0xffc060); } }
    return;
  }
  // weapon arm toward the hand
  const handX = back ? ox + 11 + wp.w * 2 : ox - 8 + wp.w * 4, handY = oy - 20 - wp.w * 2;
  d.line(sx0, sy0, handX, handY, 4.6, armC);
  d.circ(handX, handY, 2.2, pal.skin);
  const along = (ang, a, b) => [handX + Math.cos(ang) * a, handY + Math.sin(ang) * a, handX + Math.cos(ang) * b, handY + Math.sin(ang) * b];
  if (w === 'spear' || w === 'lance' || w === 'javelin' || w === 'halberd') {
    // idle upright and leaning forward; strike: lowered toward the foe (up-right from the back, down-right from the front)
    const idleA = back ? -1.28 : -1.38, hitA = back ? -0.55 : 0.28, windA = back ? -1.75 : -1.8;
    const ang = wp.w > 0 ? lerp(idleA, hitA, Math.min(1, wp.w)) : lerp(idleA, windA, -wp.w);
    const len = w === 'javelin' ? 30 : w === 'halberd' ? 44 : 48;
    const [x0, y0, x1, y1] = along(ang, -14, len - 14);
    d.line(x0, y0, x1, y1, 2.2, pal.wood);
    const cx = Math.cos(ang), cy = Math.sin(ang);
    if (w === 'halberd') {
      d.poly([x1 - cx * 7 - cy * 1, y1 - cy * 7 + cx * 1, x1 - cx * 2 + cy * 7, y1 - cy * 2 - cx * 7, x1 + cx * 2 + cy * 6, y1 + cy * 2 - cx * 6], pal.metalHi);
      d.line(x1, y1, x1 + cx * 5, y1 + cy * 5, 2, pal.metalHi);
    } else d.poly([x1 + cx * 6, y1 + cy * 6, x1 - cy * 2, y1 + cx * 2, x1 + cy * 2, y1 - cx * 2], pal.metalHi);
    if (w === 'javelin' && q.atk < 0) { d.line(ox - 11, oy - 22, ox - 5, oy - 40, 1.6, pal.wood); d.line(ox - 9.5, oy - 22, ox - 2.5, oy - 39, 1.6, pal.wood); }
  } else if (w === 'sword' || w === 'fireSword' || w === 'dagger') {
    const idleA = back ? -0.9 : -2.2, hitA = back ? 0.2 : 0.5, windA = back ? -2.4 : -2.6;
    const ang = wp.w > 0 ? lerp(idleA, hitA, Math.min(1, wp.w)) : lerp(idleA, windA, -wp.w);
    const len = w === 'dagger' ? 9 : 17;
    const [x0, y0, x1, y1] = along(ang, 0, len);
    if (w === 'fireSword') d.line(x0, y0, x1, y1, 6, 0xff7a20, 0.35);
    d.line(x0, y0, x1, y1, 2.4, w === 'fireSword' ? 0xffbf60 : 0xdde2e6);
    d.line(handX - Math.sin(ang) * 3, handY + Math.cos(ang) * 3, handX + Math.sin(ang) * 3, handY - Math.cos(ang) * 3, 1.8, pal.trim);
  } else if (w === 'axe' || w === 'greatAxe' || w === 'maul') {
    const idleA = back ? -1.1 : -2.0, hitA = back ? 0.35 : 0.6, windA = back ? -2.5 : -2.7;
    const ang = wp.w > 0 ? lerp(idleA, hitA, Math.min(1, wp.w)) : lerp(idleA, windA, -wp.w);
    const len = w === 'greatAxe' ? 24 : 16;
    const [x0, y0, x1, y1] = along(ang, -3, len);
    d.line(x0, y0, x1, y1, 2.4, pal.wood);
    const cx = Math.cos(ang), cy = Math.sin(ang);
    if (w === 'maul') d.rrect(x1 - 5, y1 - 5, 10, 10, 2.5, pal.bark);
    else {
      const s = w === 'greatAxe' ? 8 : 5.6;
      d.poly([x1 - cx * 3, y1 - cy * 3, x1 - cx * 1.5 + cy * s, y1 - cy * 1.5 - cx * s, x1 + cx * 5 + cy * s * 0.8, y1 + cy * 5 - cx * s * 0.8, x1 + cx * 3.5, y1 + cy * 3.5], pal.metalHi);
      if (w === 'greatAxe') d.poly([x1 - cx * 3, y1 - cy * 3, x1 - cy * s * 0.8, y1 + cx * s * 0.8, x1 + cx * 3.5 - cy * s * 0.6, y1 + cy * 3.5 + cx * s * 0.6, x1 + cx * 3.5, y1 + cy * 3.5], shade(pal.metalHi, -0.2));
    }
  } else if (w === 'staff') {
    const ang = (back ? -1.42 : -1.62) + wp.w * 0.5 + (q.shoot >= 0 ? -0.25 : 0);
    const [x0, y0, x1, y1] = along(ang, -20, 30);
    d.line(x0, y0, x1, y1, 2.2, pal.wood);
    d.circ(x1, y1, 5.5, look.staffGlow, 0.25); d.circ(x1, y1, 2.6, look.staffGlow); d.circ(x1 - 0.8, y1 - 0.8, 1, 0xffffff, 0.8);
    if (q.shoot >= 0) d.circ(x1, y1, 10, look.staffGlow, 0.25);
  }
}

function drawBanner(g, pal, back, ox, oy, q) {
  const d = P(g);
  const px = ox + (back ? -12 : -13), top = oy - 74;
  d.line(px, oy - 2, px, top, 2, pal.wood);
  const wave = q.bob * 1.6;
  d.poly([px, top + 1, px + 17, top + 3 + wave, px + 14.5, top + 9.5 + wave, px + 17, top + 16 + wave, px, top + 15], pal.cloth);
  d.poly([px, top + 1, px + 17, top + 3 + wave, px + 16, top + 5.5 + wave, px, top + 4.5], pal.trim);
  d.circ(px, top, 2, pal.trim);
}

function drawLying(g, look, pal, view, q) {
  const d = P(g);
  const back = view === 'ne';
  const s = q.fall === 1 ? 0.9 : 1;
  d.ell(3, -0.5, 17 * s, 4.6, 0x000000, 0.26);
  const T = look.armor === 'bare' ? pal.skin : look.armor === 'bark' ? pal.bark : look.armor === 'robe' ? (look.light ? 0xd2c7aa : pal.cloth) : pal.cloth;
  const legC = look.armor === 'bark' ? pal.bark : pal.leather;
  if (look.body === 'horse' || look.body === 'wolf' || look.body === 'wolfOnly') {
    // a fallen mount: its bulk on the ground with the rider thrown beside it
    const coat = look.body === 'horse' ? pal.horse : 0x6d6a64;
    d.ell(4, -5, 15, 6, coat); d.ell(6, -3, 12, 3.5, shade(coat, -0.25), 0.8);
    d.line(14, -4, 21, -1, 3, shade(coat, -0.2)); d.line(10, -3, 15, 1, 2.6, shade(coat, -0.3));
    d.circ(-10, -6, 4.5, coat);
    if (look.body === 'wolfOnly') return;
  }
  d.line(2 * s, -4, 15 * s, -2.5, 5, legC); d.line(2 * s, -6, 13 * s, -7.5, 5, shade(legC, -0.15));
  d.ell(-3 * s, -5, 9.5 * s, 6, T);
  d.ell(-1 * s, -3, 8 * s, 3.4, shade(T, -0.25), 0.7);
  if (back || look.cape) d.poly([-11 * s, -9, 4 * s, -10, 6 * s, -3, -10 * s, -1.5], pal.cloth, 0.95);
  d.line(-6 * s, -9, -3 * s, -15, 4, look.armor === 'bare' ? pal.skin : pal.clothDark);
  d.circ(-14 * s, -5.5, 5.8, pal.skin);
  if (look.helm === 'crestHelm' || look.helm === 'kettle' || look.helm === 'horned' || look.helm === 'leafHelm' || look.helm === 'thornHelm') { d.ell(-15 * s, -6.5, 6, 5, pal.metal); d.ell(-16.5 * s, -8, 2.6, 1.6, pal.metalHi, 0.8); }
  else if (look.helm === 'hood' || look.helm === 'robeHood' || look.helm === 'antler') d.ell(-15 * s, -6, 6.2, 5.4, look.helm === 'hood' ? pal.cloth : pal.clothDark);
  else d.ell(-15 * s, -6.5, 5.6, 4.4, pal.hair);
  // the dropped weapon
  const w = look.weapon;
  if (w === 'spear' || w === 'halberd' || w === 'lance' || w === 'javelin') d.line(-22 * s, 3, 18 * s, -12, 2, pal.wood);
  else if (w === 'bow' || w === 'longbow') d.curve([-6, 4, 4, 7, 14, 3], 2.2, pal.wood);
  else if (w === 'staff') d.line(-18 * s, 2, 14 * s, 5, 2, pal.wood);
  else if (w) d.line(-2 * s, 4, 10 * s, 6, 2.4, 0xc8ccd0);
  if (look.shield) { d.ell(9 * s, 3, 6.5, 4.2, pal.trim); d.ell(9 * s, 3, 5.2, 3.2, pal.cloth); }
}

function drawRider(g, look, pal, view, q) {
  const d = P(g);
  const back = view === 'ne';
  const wolf = look.body === 'wolf';
  const s = q.step;
  d.ell(5, 1.5, 21, 6, 0x000000, 0.3);
  if (wolf) drawWolf(g, pal, view, q, 0, 0, false);
  else {
    const coat = pal.horse, dark = pal.horseDark;
    for (const [x, o, c] of [[-12, s, dark], [-8, -s, shade(dark, 0.1)], [9, -s, dark], [13, s, shade(dark, 0.1)]]) d.line(x, -13, x + o * 2.4, -1, 3.4, c);
    d.ell(0, -17, 17, 8.5, coat);
    d.ell(2, -13.5, 14, 4.2, shade(coat, -0.25), 0.8);
    d.ell(-3, -21, 11, 3.6, shade(coat, 0.14), 0.7);
    // caparison in side cloth (top-visible)
    d.poly([-13, -23, 10, -23, 12.5, -11, -14, -11], pal.cloth);
    d.poly([-13, -23, 10, -23, 9, -20.5, -12, -20.5], pal.trim, 0.9);
    d.poly([3, -23, 10, -23, 12.5, -11, 4, -11], shade(pal.cloth, -0.22), 0.8);
    if (!back) {
      d.poly([11, -21, 19, -33, 25, -31, 19, -18], coat);
      d.ell(24, -30.5, 4.8, 3.2, dark);
      d.line(19, -32, 17, -36, 1.8, dark); d.line(21, -33, 20, -37, 1.8, dark);
      d.line(12, -22, 18, -34, 2.2, pal.hair, 0.8);
    } else {
      d.ell(-16, -16, 3.4, 7, dark);
      d.poly([10, -22, 16, -33, 20, -31, 15, -20], coat);
      d.line(11, -24, 16, -34, 2.2, pal.hair, 0.8);
    }
  }
  // the rider
  const rx = -1, ry = wolf ? -17 : -21;
  const T = look.armor === 'scale' ? pal.cloth : pal.bark;
  if (back) d.poly([rx - 8, ry - 13, rx + 8, ry - 13, rx + 9, ry + 1, rx - 9, ry + 1], pal.cloth);
  else {
    d.poly([rx - 7.5, ry - 13, rx + 7.5, ry - 13, rx + 6.5, ry + 1, rx - 6.5, ry + 1], T);
    if (look.armor === 'scale') for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) d.ell(rx - 4.8 + c * 3.2 + (r % 2) * 1.5, ry - 10 + r * 3.4, 1.6, 1.1, shade(pal.cloth, -0.4), 0.55);
  }
  d.ell(rx - 7.4, ry - 12, 4.2, 3.2, shade(pal.cloth, 0.12)); d.ell(rx + 7.4, ry - 12, 4.2, 3.2, shade(pal.cloth, -0.1));
  drawHead(g, look, pal, back, rx, ry + 24.5, q);
  // lance or spear: couched forward
  const wp = weaponPose(q);
  const ang = (look.weapon === 'lance' ? (back ? -0.42 : -0.18) : (back ? -0.95 : -0.75)) + wp.w * 0.28;
  const cx = Math.cos(ang), cy = Math.sin(ang);
  const hx = rx + 6, hy = ry - 6;
  const L = look.weapon === 'lance' ? 42 : 34;
  d.line(rx + 7, ry - 11, hx, hy, 4.2, pal.clothDark);
  d.line(hx - cx * 14, hy - cy * 14, hx + cx * L, hy + cy * L, 2.2, pal.wood);
  d.poly([hx + cx * (L + 6), hy + cy * (L + 6), hx + cx * L - cy * 2, hy + cy * L + cx * 2, hx + cx * L + cy * 2, hy + cy * L - cx * 2], pal.metalHi);
  if (look.weapon === 'lance') d.poly([hx + cx * 28, hy + cy * 28, hx + cx * 36, hy + cy * 36, hx + cx * 33 - cy * 6, hy + cy * 33 + cx * 6], pal.cloth);
}

function drawWolf(g, pal, view, q, ox, oy, alone) {
  const d = P(g);
  const back = view === 'ne';
  const s = q.step;
  const fur = 0x726e67, dark = 0x48443f, light = 0xa29d94;
  if (alone) d.ell(ox + 4, oy + 1.5, 17, 5, 0x000000, 0.3);
  for (const [x, o, c] of [[-11, s, dark], [-7, -s, shade(dark, 0.12)], [8, -s, dark], [11, s, shade(dark, 0.12)]]) d.line(ox + x, oy - 10, ox + x + o * 2.2, oy - 0.5, 3.2, c);
  d.ell(ox, oy - 13, 15, 7, fur);
  d.ell(ox - 1, oy - 16.5, 12, 3.4, light, 0.6);
  d.ell(ox + 1, oy - 9.5, 12, 3, shade(fur, -0.25), 0.7);
  d.curve([ox - 14, oy - 14, ox - 20, oy - 17, ox - 24, oy - 12], 3.6, fur);
  const lunge = q.atk === 1 || q.atk === 3 ? 3.5 : 0;
  if (!back || alone) {
    d.poly([ox + 10, oy - 17, ox + 18 + lunge, oy - 22, ox + 25 + lunge, oy - 17.5, ox + 19 + lunge, oy - 11.5, ox + 11, oy - 10], fur);
    d.poly([ox + 14 + lunge, oy - 21, ox + 16.5 + lunge, oy - 27, ox + 19 + lunge, oy - 21], dark);
    d.circ(ox + 21 + lunge, oy - 18, 1, 0x1c1a17);
    if (q.atk === 1 || q.atk === 3) d.poly([ox + 20 + lunge, oy - 14, ox + 26 + lunge, oy - 15, ox + 21 + lunge, oy - 12], 0xa03a30);
  } else d.poly([ox + 10, oy - 17, ox + 17, oy - 23, ox + 21, oy - 20, ox + 13, oy - 12], fur);
}

function drawSprite(g, pal, q) {
  const d = P(g);
  const y = -26 - (q.bob ? 2 : 0) + (q.atk === 1 || q.atk === 3 ? 6 : 0);
  d.circ(0, y, 13, 0xff7a20, 0.16);
  d.poly([-6, y + 7, -3.5, y - 7, 0, y - 15, 3.5, y - 8, 6, y + 7, 0, y + 12], 0xff8a2a);
  d.poly([-3.5, y + 5, -1.8, y - 5, 0.5, y - 10, 3, y - 4, 3.5, y + 5, 0, y + 8], 0xffd060);
  d.circ(0, y - 1, 2.6, 0xfff4c0);
  void pal;
}

function drawSwarm(g, q) {
  const d = P(g);
  const r = mulberry(77 + (q.bob ? 5 : 0) + Math.max(0, q.atk) * 13);
  const tight = q.atk === 1 || q.atk === 3 ? 0.6 : 1;
  // a loose cloud of large striped hornets with bright wing blurs: reads as insects at play zoom, not
  // as a heap (the noted issue in the critique)
  d.ell(0, -26, 17 * tight, 11 * tight, 0xe8d890, 0.1);
  for (let i = 0; i < 11; i++) {
    const a = r() * TAU, rr = (0.35 + 0.65 * Math.sqrt(r())) * 17 * tight;
    const x = Math.cos(a) * rr, y = -26 + Math.sin(a) * rr * 0.7;
    const fl = r() < 0.5 ? -1 : 1;
    d.ell(x - 1.6 * fl, y - 2.2, 2.6, 1.2, 0xffffff, 0.75); d.ell(x + 1.4 * fl, y - 2.4, 2.4, 1.1, 0xffffff, 0.6);
    d.ell(x, y, 2.6, 1.6, 0x1a160a); d.ell(x + 1.4 * fl, y + 0.1, 1.7, 1.2, 0xf0c428); d.ell(x + 2.6 * fl, y + 0.2, 0.9, 0.9, 0x1a160a);
  }
}

  return { ART, FR, INK, PALETTES, LOOKS, drawFigure };
})();

// ------------------------------------------------------------------ v4 relief: miniatures on bases (§6), labels by zoom band (§7). This part: the figure atlas, sizes, the layout
// (seats, Wellsprings, army slots, scenery, labels, the numbers layer) and the seat ground. p62: bases, figures, towns, hamlets, huts, events and the army pieces;
// p63: labels, live names, chips, the path thread and arrows.
// Sizes are continuous in the median province's screen diameter D_px (§6.4); the layout lives in "layout px" (world x cam.s, no pan),
// so a pan moves it and only a zoom re-lays it. Armies are DOM pieces (click, tooltip, focus); everything else is drawn on the over layer.
const RL_LINK = { prov: -1 }; // a province named by a hovered link (feed, alerts, outliner, cards)
const RL_NUMBERS = { on: false, shift: false }; // the numbers layer (` or the # button) and Shift held alone
const RL_FIGLOOK = { // commander type -> the battle atlas's look, side palette and scale (the pretender's body at 1.3)
  ashChieftain: ['ashChieftain', 'cinderHorde', 1], titan: ['flamebrand', 'cinderHorde', 1.3], emberAdept: ['emberAdept', 'cinderHorde', 1], pyrePriest: ['pyrePriest', 'cinderHorde', 1],
  cinderScout: ['cinderScout', 'cinderHorde', 1], wardenCaptain: ['wardenCaptain', 'thornwood', 1], guard: ['lightInfantry', 'independent', 1], guardBow: ['archer', 'independent', 1],
};
const FIGS = { started: false, ready: false, ver: 0, fig: {}, err: null, ms: 0 };
function rlLoadPixi() {
  if (window.PIXI) return Promise.resolve(window.PIXI);
  return new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/pixi.js@8.22.0/dist/pixi.min.js'; s.onload = () => (window.PIXI ? res(window.PIXI) : rej(new Error('no PIXI'))); s.onerror = () => rej(new Error('pixi.js did not load')); document.head.appendChild(s); });
}
function rlStartFigures() {
  FIGS.started = true; const t0 = performance.now();
  rlLoadPixi().then(async (PX) => {
    const renderer = await PX.autoDetectRenderer({ preference: 'webgl', width: 64, height: 64, backgroundAlpha: 0, antialias: true, resolution: 1 });
    const { ART, FR, PALETTES: FP, drawFigure } = FIGLIB, C = ART.cell * 2;
    for (const [key, [unit, pal, sc]] of Object.entries(RL_FIGLOOK)) {
      const rt = PX.RenderTexture.create({ width: C, height: C, resolution: 1, antialias: true }), holder = new PX.Container(), gph = new PX.Graphics();
      drawFigure(gph, unit, FP[pal], 'se', FR.idle); holder.addChild(gph); holder.position.set(C / 2, ART.foot * 2); holder.scale.set(2 * sc);
      renderer.render({ container: holder, target: rt, clear: true });
      const raw = renderer.extract.canvas(rt), out = makeCanvas(C, C), og = out.getContext('2d'), sil = makeCanvas(C, C), sg = sil.getContext('2d');
      sg.drawImage(raw, 0, 0); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = '#1C1A17'; sg.fillRect(0, 0, C, C);
      og.globalAlpha = 0.6; for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]]) og.drawImage(sil, dx * 2.2, dy * 2.2); og.globalAlpha = 1; og.drawImage(raw, 0, 0);
      FIGS.fig[key] = { canvas: out, fx: C / 2, fy: ART.foot * 2, h: ART.figH * 2 * sc };
      holder.destroy({ children: true }); rt.destroy(true);
    }
    renderer.destroy(); FIGS.ready = true; FIGS.ver++; FIGS.ms = performance.now() - t0; rlPieceSigLast = ''; requestDraw();
  }).catch((e) => { FIGS.err = String(e && e.message || e); FIGS.ver++; requestDraw(); });
}
function rlFallbackFigure(g, x, y, h, side) { // used until (or unless) the atlas is baked: a cloaked figure, lit from the upper left
  const c = side === 'red' ? '#9A4A2A' : side === 'green' ? '#2F6A4E' : '#7E8478';
  g.fillStyle = 'rgba(28,26,23,.75)'; g.beginPath(); g.moveTo(x - h * 0.2, y); g.lineTo(x - h * 0.13, y - h * 0.62); g.lineTo(x + h * 0.13, y - h * 0.62); g.lineTo(x + h * 0.2, y); g.closePath(); g.fill();
  g.fillStyle = c; g.beginPath(); g.moveTo(x - h * 0.17, y - 1); g.lineTo(x - h * 0.11, y - h * 0.6); g.lineTo(x + h * 0.11, y - h * 0.6); g.lineTo(x + h * 0.17, y - 1); g.closePath(); g.fill();
  g.fillStyle = '#C49A76'; ellipse(g, x, y - h * 0.72, h * 0.12, h * 0.12); g.fill(); g.strokeStyle = 'rgba(28,26,23,.75)'; g.lineWidth = 1; g.stroke();
}

// ---- sizes (§6.4)
const rlDpx = () => cam.s * MED_DIAM;
const rlBa = (Dpx) => Math.max(16, Math.min(34, 0.23 * Dpx));
const rlStep = (p) => tierOf(p) + 1 + (p.cap ? 1 : 0);
const rlIsTown = (p) => tierOf(p) + 1 >= RL_P.townStep || p.pd >= RL_P.townPD || p.buildings.length > 0 || !!p.build || p.cap;
const rlTownPx = (p, Dpx) => Math.max(14, Math.min(RL_P.townMaxPx, (0.16 + 0.045 * (rlStep(p) - 1)) * Dpx)); // the ceiling 96 px (fix 8; §6.4 had 120)
const rlWallStage = (pd) => (pd >= 25 ? 'towers' : pd >= 15 ? 'stone' : pd >= 5 ? 'palisade' : pd >= 1 ? 'watch' : '');
const rlFs = (Dpx) => Math.max(11, Math.min(15, 11 + (4 * (Dpx - 70)) / 350));
const RL_KIT = {
  red: { wall: '#8F8C88', roof: '#3A3633', win: '#FFB347', stone: '#77736E', stoneHi: '#9E9A93' },
  green: { wall: '#A0785A', roof: '#4E6B3A', roofHi: '#6E8F4E', win: '#E9C46A', stone: '#8A7E66', stoneHi: '#ADA184' },
  indep: { wall: '#D8CBB0', roof: '#C2A86B', win: '#F2D58A', stone: '#A39C8E', stoneHi: '#C6C0B2' },
};
const rlKitOf = (k) => RL_KIT[k === 'red' ? 'red' : k === 'green' ? 'green' : 'indep'];

// ---- the layout: seats, Wellsprings, army pieces on slots, scenery points, labels; in layout px (world x cam.s)
const RL_PIECE_CACHE = new Map();
const RL_SCEN = new Map(); // fixed seeded scenery points per province (world units)
function rlScenPoints(i) {
  let v = RL_SCEN.get(i); if (v) return v; v = [];
  const R = rngFor(`relief:${MAP_SEED}:scenery:${i}`), bb = bboxOf(cells[i]), wt = RB.ready ? RB.water : { lakes: [], ponds: [], streams: [] };
  const wetNear = (x, y) => [...wt.lakes, ...wt.ponds].some((L) => L.i === i && (d3.polygonContains(L.P, [x, y]) || distToEdge([...L.P, L.P[0]], x, y) < 5 * RLK)) || wt.streams.some((s) => s.i === i && s.pts.some((q) => Math.hypot(q[0] - x, q[1] - y) < 5 * RLK));
  for (let t = 0; t < 400 && v.length < 14; t++) {
    const x = bb[0] + R() * (bb[2] - bb[0]), y = bb[1] + R() * (bb[3] - bb[1]);
    if (!d3.polygonContains(cells[i], [x, y]) || distToEdge(cells[i], x, y) < 0.13 * RLD || !inModel(x, y) || Math.hypot(x - cent[i][0], y - cent[i][1]) < 0.22 * RLD || wetNear(x, y)) continue;
    if (v.some((q) => Math.hypot(q.x - x, q.y - y) < 0.09 * RLD)) continue; v.push({ x, y, j: v.length, R: R() });
  }
  RL_SCEN.set(i, v); return v;
}
// ---- piece silhouettes [x0, y0, x1, y1, kind, prov, id, base?]: a base is its ellipse swept down by its side band, an upright part its box (the slot rule and the overlap check share them)
const rlSilIn = (S, x, y) => { const e = S[7]; if (!e) return x > S[0] + 0.5 && x < S[2] - 0.5 && y > S[1] + 0.5 && y < S[3] - 0.5; const sv = Math.max(0, Math.min(e.t, y - e.cy)); return ((x - e.cx) / Math.max(0.5, e.rx - 0.5)) ** 2 + ((y - e.cy - sv) / Math.max(0.5, e.ry - 0.5)) ** 2 < 1; };
const rlSilPts = (S) => { const e = S[7], P = []; if (e) { for (let k = 0; k < 64; k++) { const a = (k / 64) * 2 * Math.PI, c = Math.cos(a), sn = Math.sin(a); P.push([e.cx + c * e.rx, e.cy + sn * e.ry + (sn > 0 ? e.t : 0)]); } P.push([e.cx - e.rx, e.cy + e.t * 0.5], [e.cx + e.rx, e.cy + e.t * 0.5]); } else { for (let k = 0; k <= 16; k++) { const f = k / 16; P.push([S[0] + (S[2] - S[0]) * f, S[1]], [S[0] + (S[2] - S[0]) * f, S[3]], [S[0], S[1] + (S[3] - S[1]) * f], [S[2], S[1] + (S[3] - S[1]) * f]); } P.push([(S[0] + S[2]) / 2, (S[1] + S[3]) / 2]); } return P; };
const rlSilHit = (a, b) => { if (!(a[2] > b[0] + 0.5 && a[0] < b[2] - 0.5 && a[3] > b[1] + 0.5 && a[1] < b[3] - 0.5)) return false; if (!a[7] && !b[7]) return true; return rlSilPts(a).some(([x, y]) => rlSilIn(b, x, y)) || rlSilPts(b).some(([x, y]) => rlSilIn(a, x, y)); };
const rlSeatSh = (st, i, id) => (!st.kind ? [] : st.kind === 'town' ? [[st.x - st.r, st.y - st.r * 0.64, st.x + st.r, st.y + st.r * 0.64 + 0.12 * st.T, 'seat', i, id, { cx: st.x, cy: st.y, rx: st.r, ry: st.r * 0.64, t: 0.12 * st.T }], [st.x - st.r * 0.8, st.y - st.r * 0.64 - 0.38 * st.T, st.x + st.r * 0.8, st.y, 'seat', i, id]] : [[...st.box, 'seat', i, id]]);
const rlWellSh = (x, y, B, i, id) => { const rr = B / 2; return [[x - rr, y - rr * 0.64, x + rr, y + rr * 0.64 + 0.12 * B, 'well', i, id, { cx: x, cy: y, rx: rr, ry: rr * 0.64, t: 0.12 * B }], [x - rr * 0.7, y - rr * 0.64 - 0.4 * B, x + rr * 0.7, y, 'well', i, id]]; };
const rlArmySh = (x, y, kind, B, rx, ry, figH, i, id) => { const hw = kind === 'stack' ? rx : 0.32 * B; return [[x - rx, y - ry, x + rx, y + ry + 0.24 * B, 'army', i, id, { cx: x, cy: y, rx, ry, t: 0.24 * B }], [x - hw, y - figH - (kind === 'army' ? 0.25 * B : 0), x + hw, y, 'army', i, id]]; };
function rlLayout(band) {
  const key = [cam.s.toFixed(5), band, KEYVER, curMonth, rlPiecesSig(), state.sel ? state.sel.type + state.sel.id : '', moveLine ? moveLine.path.join('.') : '', RL_NUMBERS.on, RL_NUMBERS.shift, fontsReady, RB.ver, view.detail, state.mode, rlShiftSwatch()].join('|');
  const hit = RL_PIECE_CACHE.get('L'); if (hit && hit.key === key) return hit;
  const s = cam.s, Dpx = rlDpx(), Ba = rlBa(Dpx), far = band === 'far', near = band === 'near', L = (q) => [q[0] * s, q[1] * s];
  const seats = new Map(), armies = [], wells = [], boxes = [], scen = [], events = [], guards = [], stones = [];
  const inset = (i, x, y, rx, ry) => { // the base inside the province's polygon inset by 2 px (layout px)
    const wx = x / s, wy = y / s; if (!d3.polygonContains(cells[i], [wx, wy])) return false;
    for (let k = 0; k < 8; k++) { const a = (k * Math.PI) / 4, qx = (x + Math.cos(a) * rx) / s, qy = (y + Math.sin(a) * ry) / s; if (!d3.polygonContains(cells[i], [qx, qy]) || distToEdge(cells[i], qx, qy) * s < 2 || !inModel(qx, qy)) return false; }
    return true;
  };
  const ovl = (b, list) => list.some((q) => b[2] > q[0] && b[0] < q[2] && b[3] > q[1] && b[1] < q[3]);
  // seats
  for (const p of provs) {
    const fog = fogOf(p.i), [x, y] = L(cent[p.i]); let kind = null, T = 0, r = 0.08 * Dpx, rm = 0;
    if (fog === 'unexplored') { if (Dpx >= RL_P.hamletDpx) { kind = 'hut'; T = Math.max(6, 0.04 * Dpx * 1.6); r = T / 2; } }
    else if (rlIsTown(p)) { kind = 'town'; T = rlTownPx(p, Dpx); r = T / 2; }
    else if (Dpx >= RL_P.hamletDpx) { kind = 'hamlet'; T = Math.max(5, Math.min(14, 0.06 * Dpx)); const nH = near ? houseCount(p) : Math.min(4, houseCount(p)); rm = T * 0.62 * Math.sqrt(nH - 1 + 0.35); r = Math.max(0.08 * Dpx, rm * 1.25 + 0.6 * T); }
    const st = { i: p.i, x, y, kind, T, r };
    if (kind === 'town') st.box = [x - r - 1, y - r * 0.64 - 0.42 * T, x + r + 1, y + r * 0.64 + 0.12 * T + 1];
    else if (kind === 'hamlet') st.box = [x - rm * 1.25 - 0.62 * T, y - 0.72 * rm - 1.1 * T, x + rm * 1.25 + 0.62 * T, y + 0.72 * rm + 0.25 * T]; // the houses' extent (roofs to shadows)
    else if (kind === 'hut') st.box = [x - T * 0.7, y - T * 1.1, x + T * 0.7, y + T * 0.3];
    seats.set(p.i, st); if (st.box) boxes.push([...st.box, 'seat', p.i]);
  }
  // the label zone under every seat, reserved before the Wellspring and the armies take their slots (a piece never covers a label)
  const fs0 = rlFs(Dpx), lzone = new Map();
  for (const p of provs) { const st = seats.get(p.i), f0 = `${p.cap ? 700 : 500} ${(p.cap ? fs0 + 1 : fs0).toFixed(1)}px 'Alegreya Sans', 'Segoe UI', sans-serif`, tw = textW(p.name, f0), bot = st.kind === 'town' ? st.y + st.r * 0.64 + 0.12 * st.T : st.kind === 'hamlet' ? st.y + st.r * 0.6 : st.y + 2, h = fs0 + 4; lzone.set(p.i, [st.x - tw / 2 - 3, bot + 2, st.x + tw / 2 + 3, bot + 3 + h + 2]); }
  // Wellsprings: their own base, 20 degrees below the left-hand horizontal
  for (const p of provs) {
    if (!p.well || fogOf(p.i) === 'unexplored') continue; const st = seats.get(p.i), B = Math.max(12, 0.18 * Dpx), rr = B / 2;
    const ssh = rlSeatSh(st, p.i, 0), lz = [...lzone.get(p.i), 'label', p.i, 0];
    let pos = null; outerW: for (const da of [0, 15, -15, 30, -30, 45, -45, 60, -60, 90]) for (let e = 0; e <= B; e += 1.5) { const a = ((160 + da) * Math.PI) / 180, d = st.r + rr + 3 + e, x = st.x + Math.cos(a) * d, y = st.y + Math.sin(a) * d * 0.9, sh = rlWellSh(x, y, B, p.i, 0);
      if (sh.some((q) => ssh.some((z) => rlSilHit(q, z)) || rlSilHit(q, lz))) continue; if (inset(p.i, x, y, rr, rr * 0.64)) { pos = [x, y]; break outerW; } break; }
    if (!pos) pos = [st.x - st.r - rr - 3, st.y + 2];
    const wl = { i: p.i, x: pos[0], y: pos[1], B, box: [pos[0] - rr - 1, pos[1] - rr * 0.64 - B * 0.5, pos[0] + rr + 1, pos[1] + rr * 0.64 + 0.12 * B + 1] };
    wells.push(wl); boxes.push([...wl.box, 'well', p.i]);
  }
  // army pieces: one per nation per province (a stack for several armies of one nation), on the arc around the seat (§6.6)
  const byProv = new Map(); for (const c of Object.values(cmd)) { if (c.hidden) continue; const m = byProv.get(c.at) ?? new Map(); const l = m.get(c.side) ?? []; l.push(c); m.set(c.side, l); byProv.set(c.at, m); }
  const SLOTS = [20, -20, 60, -60, 100, -100, 140, -140];
  for (const [at, m] of byProv) {
    const st = seats.get(at), sides = [...m.keys()].sort((a, b) => (a === VIEWER ? -1 : b === VIEWER ? 1 : 0)), taken = [...rlSeatSh(st, at, 0), ...wells.filter((w) => w.i === at).flatMap((w) => rlWellSh(w.x, w.y, w.B, at, 0)), [...lzone.get(at), 'label', at, 0]];
    sides.forEach((side, k) => {
      const list = m.get(side).sort((a, b) => (b.crown ? 1 : 0) - (a.crown ? 1 : 0) || b.squads.length - a.squads.length), lead = list[0], stack = list.length > 1;
      const kindP = stack ? 'stack' : lead.crown ? 'pretender' : lead.squads.length ? 'army' : 'lone';
      const B = kindP === 'pretender' ? 1.15 * Ba : kindP === 'lone' ? 0.8 * Ba : Ba, rx = kindP === 'stack' ? 0.75 * Ba : B / 2, ry = (kindP === 'stack' ? 0.5 * Ba : B / 2) * 0.64;
      const figH = kindP === 'stack' ? Ba * 1.05 : B * 1.15 * (kindP === 'pretender' ? 1.3 : 1);
      const boxAt = (x, y) => [x - rx - 1, y - ry - figH - (kindP === 'army' ? 0.25 * B : 0), x + rx + 1, y + ry + 0.12 * B * 2 + 1];
      let pos = null, front = false;
      outer: for (const base of SLOTS.slice(k)) for (const da of [0, 10, -10, 20, -20, 30, -30, 40, -40, 50, -50, 60, -60, 70, -70, 80, -80, 90, -90, 120, -120, 150, -150, 180]) {
        for (let e = 0; e <= Ba; e += 1.5) { // the arc's radius grows until the piece clears what stands nearer (the seat's buildings rise above its base)
          const a = ((base + da) * Math.PI) / 180, d = st.r + rx + 3 + e, x = st.x + Math.cos(a) * d, y = st.y + Math.sin(a) * d, sh = rlArmySh(x, y, kindP, B, rx, ry, figH, at, 0);
          if (sh.some((q) => taken.some((z) => rlSilHit(q, z)))) continue; if (!inset(at, x, y, rx, ry)) break; pos = [x, y]; taken.push(...sh); break outer;
        }
      }
      if (!pos) { pos = [st.x, st.y + 0.5 * st.r]; front = true; taken.push(...rlArmySh(pos[0], pos[1], kindP, B, rx, ry, figH, at, 0)); }
      const pc = { key: side + ':' + at, ids: list.map((c) => c.id), side, prov: at, x: pos[0], y: pos[1], B, rx, ry, figH, kind: kindP, front, box: boxAt(pos[0], pos[1]) };
      armies.push(pc); boxes.push([...pc.box, 'army', at]);
    });
  }
  // the battle marker (a scar): beside the seat, clear of its label zone and the pieces, reserved before the names
  const scarAt = new Map();
  for (const p of provs) {
    // a battle marker stays where the hamlet is hidden (Mid under 100 px a province, fix 4); at Far only at towns, as before
    const st = seats.get(p.i); if (!p.scar || (!st.kind && far) || fogOf(p.i) === 'unexplored') continue; const k = Math.max(0.8, Math.min(2.4, 0.014 * Dpx)), h = 9 * k, others = [lzone.get(p.i), ...boxes.map((q) => q.slice(0, 4))];
    for (const [ox, oy] of [[-0.2, 0.16], [0.2, 0.16], [-0.26, 0.02], [0.26, 0.02], [-0.14, 0.26], [0.14, 0.26], [0, 0.3], [-0.3, 0.22], [0.3, 0.22]]) {
      const bx = st.x + ox * Dpx, by = st.y + oy * Dpx, b = [bx - h * 0.6 - 2, by - h - 2, bx + h * 0.6 + 2, by + 3];
      if (ovl(b, others) || !inset(p.i, bx, by - h / 2, h * 0.6, h / 2)) continue; scarAt.set(p.i, [bx, by]); boxes.push([...b, 'marker', p.i]); break;
    }
    if (!scarAt.has(p.i)) { const bx = st.x - 0.2 * Dpx, by = st.y + 0.16 * Dpx; scarAt.set(p.i, [bx, by]); boxes.push([bx - h * 0.6 - 2, by - h - 2, bx + h * 0.6 + 2, by + 3, 'marker', p.i]); }
  }
  // labels: Far capitals, Wellsprings and wilds; Mid adds what the player points at or plans with; Near (and Shift, the numbers layer) every name
  const fs = rlFs(Dpx), labels = [], allNames = RL_NUMBERS.on || RL_NUMBERS.shift || near;
  const want = new Set(); for (const p of provs) if (p.cap || p.well || allNames) want.add(p.i);
  if (!far || allNames) { if (state.sel && state.sel.type === 'prov') want.add(state.sel.id); if (moveLine) for (const v of moveLine.path) want.add(v); }
  else { if (state.sel && state.sel.type === 'prov') want.add(state.sel.id); if (moveLine) want.add(moveLine.path[moveLine.path.length - 1]); }
  const placed = [], order = [...provs].sort((a, b) => { const pr = (p) => (p.cap ? 0 : p.well ? 1 : state.sel && state.sel.id === p.i ? 2 : moveLine && moveLine.path.includes(p.i) ? 3 : p.owner === VIEWER ? 4 : 5); return pr(a) - pr(b) || cent[a.i][1] - cent[b.i][1]; });
  const anchorOf = (p) => { // under the seat piece, or under an army standing in front of it
    const st = seats.get(p.i), fr = armies.find((a) => a.prov === p.i && a.front), bottom = fr ? fr.y + fr.ry + 0.12 * fr.B * 2 : st.kind === 'town' ? st.y + st.r * 0.64 + 0.12 * st.T : st.kind === 'hamlet' ? st.y + st.r * 0.6 : st.y + 2;
    return [st.x, bottom + 3 + fs / 2];
  };
  const pieceBoxes = boxes.map((b) => b.slice(0, 4));
  if (moveLine) for (const v of moveLine.path) { const [x, y] = L(cent[v]); pieceBoxes.push([x - 8, y - 8, x + 8, y + 8]); } // the planned path's waypoint diamonds stay clear of the names
  const tryPlace = (p, force) => {
    const font = `${p.cap ? 700 : 500} ${(p.cap ? fs + 1 : fs).toFixed(1)}px 'Alegreya Sans', 'Segoe UI', sans-serif`, sw = rlShiftSwatch() ? 13 : 0, tw = textW(p.name, font) + sw, h = (p.cap ? fs + 1 : fs) + 3; // natural §7: Shift in Natural adds each name's 10 px swatch
    const [ax, ay] = anchorOf(p), st = seats.get(p.i);
    const spots = [[0, 0], [0, 4], [0, -(ay - st.y) * 2 - 2], [tw / 2 + st.r + 4, -(ay - st.y)], [-(tw / 2 + st.r + 4), -(ay - st.y)], [0, 10]];
    for (const [dx, dy] of spots) {
      const x = ax + dx, y = ay + dy, b = [x - tw / 2 - 2, y - h / 2, x + tw / 2 + 2, y + h / 2];
      if (ovl(b, pieceBoxes) || ovl(b, placed)) continue;
      placed.push(b); return { i: p.i, x, y, font, text: p.name, box: b, sw };
    }
    if (force) { const b = [ax - tw / 2 - 2, ay - h / 2, ax + tw / 2 + 2, ay + h / 2]; placed.push(b); return { i: p.i, x: ax, y: ay, font, text: p.name, box: b, forced: true, sw }; }
    return null;
  };
  const cand = new Map(); // every province's label spot (for live hover and link names)
  for (const p of order) { const [ax, ay] = anchorOf(p), font = `${p.cap ? 700 : 500} ${(p.cap ? fs + 1 : fs).toFixed(1)}px 'Alegreya Sans', 'Segoe UI', sans-serif`; cand.set(p.i, { x: ax, y: ay, font }); }
  // wild names first (they never move): straight at Far and Mid, curved along the massif at Near
  const wildOps = [];
  for (const w of WILDS) {
    const G = wgeo(w), wfs = far ? 11.5 : near ? Math.max(13, G.nameFs + 2) : Math.max(12, G.nameFs), f = `italic 500 ${wfs.toFixed(1)}px 'Alegreya Sans', sans-serif`;
    if (near) { const Pw = wildSpine(w).map(([x, y]) => [x * s, y * s]); const gl = layoutOnPath(w.name, Pw, f, 0.14 * wfs, wfs); if (gl) { const bs = glyphBoxes(gl, 2); if (!anyHit(bs, placed) && !anyHit(bs, pieceBoxes)) { placed.push(...bs); wildOps.push({ w, gl, font: f }); continue; } } }
    const tw = textW(w.name, f) + 0.12 * wfs * w.name.length + 2, [lx, ly] = L(G.labelPt ?? cent[G.labelAt]), vert = G.vertical, hw = (vert ? wfs : tw) / 2 + 2, hh = (vert ? tw : wfs) / 2 + 2;
    const spots = vert ? [[lx, ly]] : [[lx, ly], [lx, ly + 22], [lx, ly - 22], ...w.cells.map((c) => L(cent[c]))];
    const sp = spots.find(([x, y]) => !ovl([x - hw, y - hh, x + hw, y + hh], pieceBoxes) && !ovl([x - hw, y - hh, x + hw, y + hh], placed)) ?? spots[0];
    const b = [sp[0] - hw, sp[1] - hh, sp[0] + hw, sp[1] + hh]; placed.push(b); wildOps.push({ w, x: sp[0], y: sp[1], font: f, vertical: vert, box: b });
  }
  for (const p of order) if (want.has(p.i)) { const lb = tryPlace(p, p.cap || (moveLine && !allNames && moveLine.path.includes(p.i))); if (lb) labels.push(lb); } // a planned path's names always show
  // the numbers layer: one chip per province with the active mode's value (PD in Ownership)
  const chips = [];
  if (RL_NUMBERS.on || RL_NUMBERS.shift) for (const p of provs) {
    if (fogOf(p.i) === 'unexplored' && state.mode !== 'ownership' && state.mode !== 'terrain') continue; const v = rlModeValue(p); if (v == null) continue; // terrain is public: named in every fog state
    const tg = state.mode === 'terrain' ? p.terrain : null, lb = labels.find((q) => q.i === p.i), st = seats.get(p.i), w2 = textW(String(v), "600 11px 'IBM Plex Sans Condensed'") + 10 + (tg ? 13 : 0), lw = lb ? (lb.box[2] - lb.box[0]) / 2 : 0; // the Terrain mode's chip: the glyph and the word
    const spots = lb ? [[lb.x, lb.box[3] + 9], [lb.box[2] + w2 / 2 + 2, lb.y], [lb.box[0] - w2 / 2 - 2, lb.y], [lb.x, lb.box[1] - 9], [lb.x + lw, lb.box[3] + 9], [lb.x - lw, lb.box[3] + 9]] : [[st.x, st.y + st.r + 12], [st.x + st.r + w2 / 2 + 4, st.y], [st.x - st.r - w2 / 2 - 4, st.y]];
    const sp = spots.find(([x, y]) => { const b = [x - w2 / 2, y - 8, x + w2 / 2, y + 8]; return !ovl(b, pieceBoxes) && !ovl(b, placed); }); // a chip keeps off the pieces and names, or waits for the zoom
    if (!sp) continue; const [x, y] = sp, b = [x - w2 / 2, y - 8, x + w2 / 2, y + 8]; placed.push(b); chips.push({ x, y, text: String(v), box: b, tg });
  }
  // scenery on the land: land-look pieces by dominion band and one pole motif (Mid: at most 3 and 1; Near: up to 10), never under a piece or label
  if (!far) for (const p of provs) {
    if (fogOf(p.i) || !p.dom.n) continue; const sdom = p.dom.s, nLook = near ? Math.min(10, sdom + 1) : sdom <= 3 ? 1 : sdom <= 6 ? 2 : 3;
    const axis = SCALES[p.dom.n][0], pole = effStep(axis[1], sdom) >= 1 ? axis[0] : null, k = Math.max(0.55, Math.min(1.5, 0.0068 * Dpx));
    let nl = 0, np = 0; for (const q of rlScenPoints(p.i)) {
      const [x, y] = L([q.x, q.y]), b = [x - 6 * k, y - 9 * k, x + 6 * k, y + 2 * k]; if (ovl(b, pieceBoxes) || ovl(b, placed)) continue;
      if (pole && np < 1) { scen.push({ kind: 'pole', pole, x, y, k, j: q.j, i: p.i }); np++; placed.push(b); continue; }
      if (nl < nLook) { scen.push({ kind: 'look', look: p.dom.n, lvl: sdom >= 7 ? 3 : sdom >= 4 ? 2 : 1, x, y, k, j: q.j, i: p.i }); nl++; placed.push(b); }
      if (nl >= nLook && (np >= 1 || !pole)) break;
    }
  }
  // events, independents' guards (Near), mana spring stones (Near)
  for (const p of provs) {
    const st = seats.get(p.i), fog = fogOf(p.i); if (fog === 'unexplored' || (!st.kind && far)) continue; // event pieces stay where the hamlet is hidden (Mid under 100 px, fix 4); at Far only at towns, as before
    if (p.siege || p.pillage || (p.fx && p.fx.length) || p.scar || p.unrest >= 50) events.push({ p, st, scar: scarAt.get(p.i) ?? null });
    if (Dpx >= RL_P.guardDpx && st.kind && p.owner === null && p.indep) { const n = Math.min(RL_P.guardMax, TENTS[strengthWord(p.indep)]), gH = 0.55 * Ba; for (let k2 = 0; k2 < n; k2++) { const a = Math.PI * (0.8 + 0.22 * k2), d = st.r * (st.kind === 'town' ? 0.45 : 0.5); guards.push({ x: st.x + Math.cos(a) * d, y: st.y + Math.sin(a) * d * 0.64 + (st.kind === 'town' ? 0 : 2), h: gH, bow: k2 % 2 === 1, i: p.i }); } }
    if (near && p.springs.length) p.springs.forEach((c, k2) => stones.push({ c, x: st.x + st.r + 10 + k2 * 9, y: st.y - st.r * 0.3 - 4, i: p.i }));
  }
  const shapes = []; let sid = 0; // for the overlap check: [x0, y0, x1, y1, kind, prov, id, base?] (a base is its ellipse swept down by its side band; an upright part is its box)
  for (const [, st] of seats) { if (!st.kind) continue; sid++; shapes.push(...rlSeatSh(st, st.i, sid)); }
  for (const wl of wells) { sid++; shapes.push(...rlWellSh(wl.x, wl.y, wl.B, wl.i, sid)); }
  for (const a of armies) { sid++; shapes.push(...rlArmySh(a.x, a.y, a.kind, a.B, a.rx, a.ry, a.figH, a.prov, sid)); }
  for (const b of boxes) if (b[4] === 'marker') { sid++; shapes.push([...b.slice(0, 4), 'marker', b[5], sid]); }
  const out = { key, band, s, Dpx, Ba, fs, seats, armies, wells, boxes, shapes, labels, wildOps, chips, scen, events, guards, stones, cand };
  RL_PIECE_CACHE.set('L', out); return out;
}
function rlModeValue(p) {
  switch (state.mode) {
    case 'ownership': return p.pd; case 'population': return (p.pop / 1000).toFixed(1) + 'k'; case 'unrest': return p.unrest; case 'supply': return Math.round(SUPPLY[p.terrain] + p.pop / 50);
    case 'dominion': return p.dom.n ? p.dom.s : null; case 'springs': return p.springs.length ? p.springs.join('') : null; case 'terrain': return TERRAIN[p.terrain].name; default: return null;
  }
}
const rlToScr = (lx, ly, ls = cam.s) => [(lx * cam.s) / ls + cam.x, (ly * cam.s) / ls + cam.y]; // layout px (laid out at scale ls) to the live frame: during a wheel zoom the cached land is drawn at the new scale before the layout is redone
const rlLayK = (lay) => (lay ? cam.s / lay.s : 1);
function rlPieceAt(id) { const lay = RL_PIECE_CACHE.get('L'); if (!lay) return null; const a = lay.armies.find((q) => q.ids.includes(id)); return a ? [a.x / lay.s, a.y / lay.s] : null; }
const rlShiftSwatch = () => RL_NUMBERS.shift && RB.ready && rlShownLook() === 'natural'; // Shift held alone in Natural: each name with its terrain swatch
// ---- the seat ground (natural §10 defect 3): each house tone is muted against the darkest texel of the bake under that house's own footprint (+1 px), in the look on
// screen, at the drawn mip, in the province's state (wash, fog). The v4 muting against the flat albedo overshot on textured ground. Cached per spot, look and mip.
const RL_SEATG = new Map();
function rlHouseGround(i, x0, y0, x1, y1, median) { // a screen-px box (+1 px); returns a hex colour
  if (!RB.ready) return RL_ALB[prov[i].terrain]; const look = rlShownLook(), Lk = RB.L[look], lvl = rlMipLevel(); if (!Lk) return RL_ALB[prov[i].terrain];
  const [wx0, wy0] = toWorld(x0 - 1, y0 - 1), [wx1, wy1] = toWorld(x1 + 1, y1 + 1), S = rlStateOf(i, look, true);
  const key = [look, lvl, Math.round(wx0 * 8), Math.round(wy0 * 8), Math.round(wx1 * 8), Math.round(wy1 * 8), median ? 1 : 0, S.wa.toFixed(3), S.haze, S.sat].join('|'); let v = RL_SEATG.get(key); if (v) return v;
  const src = lvl === 2 ? Lk.mb2 : lvl === 1 ? Lk.mb1 : Lk.img, w = src.width, h = src.height, f = (RB.TX * w) / RB.BW, d = src.data, out = [];
  for (let ty = Math.max(0, Math.floor(wy0 * f)); ty <= Math.min(h - 1, Math.floor(wy1 * f)); ty++) for (let tx = Math.max(0, Math.floor(wx0 * f)); tx <= Math.min(w - 1, Math.floor(wx1 * f)); tx++) {
    const k = (ty * w + tx) * 4; if (d[k + 3] < 255) continue; const c = rlApplyState([d[k], d[k + 1], d[k + 2]], S); out.push([rlLumOf(...c), ...c]);
  }
  if (!out.length) return RL_ALB[prov[i].terrain]; out.sort((p, q) => p[0] - q[0]); const q = median ? out[out.length >> 1] : out[0];
  v = rgb2hex([q[1], q[2], q[3]]); if (RL_SEATG.size > 20000) RL_SEATG.clear(); RL_SEATG.set(key, v); return v;
}

// ------------------------------------------------------------------ v4 relief: bases, figures, towns, hamlets, huts, wells, motifs, events (screen px; the light from the upper left), and the army pieces
// ---- drawing bases, towns, houses (screen px; the light from the upper left; shadows to the lower right)
function rlBasePath(g, x, y, rx, ry, notched) {
  g.beginPath();
  if (!notched) { g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); return; }
  const depth = Math.max(2, 0.12 * 2 * rx), nArc = (0.3 * 2 * Math.PI) / 8; // 8 notches, 30% of the circumference
  for (let m = 0; m <= 96; m++) { const a = (m / 96) * Math.PI * 2, ph = ((a + Math.PI / 8) % (Math.PI / 4)) - Math.PI / 8, inN = Math.abs(ph) < nArc / 2, r = inN ? 1 - depth / rx : 1; const px = x + Math.cos(a) * rx * r, py = y + Math.sin(a) * ry * r; m ? g.lineTo(px, py) : g.moveTo(px, py); }
  g.closePath();
}
function rlBase(g, x, y, rx, ry, rim, opts = {}) { // a dark round base: shadow, side band, top, rim (banner or pewter), worn lip on its upper-left quarter
  const band = Math.max(1.5, 0.12 * 2 * rx * (opts.bandK ?? 1)), lift = opts.lift ?? 0;
  g.fillStyle = `rgba(0,0,0,${opts.shadowA ?? 0.25})`; rlBasePath(g, x + 0.15 * 2 * rx * 0.5 + lift, y + band + 0.15 * rx * 0.64 + lift, rx * (1 + lift * 0.03), ry * (1 + lift * 0.03), false); g.fill();
  y -= lift;
  for (let t = band; t > 0; t -= 1) { g.fillStyle = t > band * 0.5 ? '#0F0D0B' : '#16130F'; rlBasePath(g, x, y + t, rx, ry, opts.notched); g.fill(); }
  const sg = g.createLinearGradient(x - rx, 0, x + rx, 0); sg.addColorStop(0, 'rgba(120,108,92,.35)'); sg.addColorStop(0.45, 'rgba(0,0,0,0)'); g.fillStyle = sg; g.save(); g.beginPath(); g.rect(x - rx - 1, y, 2 * rx + 2, band + ry + 1); g.clip(); rlBasePath(g, x, y + band * 0.5, rx, ry, opts.notched); g.fill(); g.restore();
  g.fillStyle = opts.top ?? RL_C.base; rlBasePath(g, x, y, rx, ry, opts.notched); g.fill();
  if (opts.brass) { g.strokeStyle = RL_C.brass; g.lineWidth = Math.max(1.2, rx * 0.12); rlBasePath(g, x, y, rx + g.lineWidth * 0.2, ry + g.lineWidth * 0.12, opts.notched); g.stroke(); }
  if (rim) { g.strokeStyle = rim; g.lineWidth = opts.rimW ?? 2.4; rlBasePath(g, x, y, rx - g.lineWidth / 2, ry - g.lineWidth * 0.32, opts.notched); g.stroke(); }
  g.strokeStyle = RL_C.baseLip; g.lineWidth = 1; g.beginPath(); g.ellipse(x, y, Math.max(1, rx - (opts.rimW ?? 2.4) - 0.6), Math.max(1, ry - (opts.rimW ?? 2.4) * 0.32 - 0.4), 0, Math.PI * 1.05, Math.PI * 1.45); g.stroke();
  return y;
}
function rlHouse(g, x, y, s, kitK, muted, ground, flags = {}) { // one house seen from 40 degrees: a south wall in shade, the roof's south slope, its lit west end
  const K = rlKitOf(kitK), hw = 0.42 * s, hr = 0.42 * s;
  if (muted && flags.i != null) ground = rlHouseGround(flags.i, x - s / 2 - 0.16 * s, y - hw - hr, x + s / 2 + 0.06 * s, y + 0.06 * s); // the darkest texel under this house (natural §10 defect 3)
  const mu = (c) => (muted ? rlMuted(c, ground) : c);
  g.fillStyle = 'rgba(0,0,0,.25)'; ellipse(g, x + 0.28 * s, y + 0.06 * s, 0.62 * s, 0.17 * s); g.fill();
  if (kitK === 'green') { // a round timber hut under a living roof
    g.fillStyle = mu(shadeL(K.wall, -8)); ellipse(g, x, y - 0.18 * s, 0.46 * s, 0.24 * s); g.fill(); g.fillRect(x - 0.46 * s, y - 0.5 * s, 0.92 * s, 0.32 * s);
    if (flags.ruin) return; const rg = g.createLinearGradient(x - 0.5 * s, y - s, x + 0.5 * s, y); rg.addColorStop(0, mu(flags.fresh ? '#E3CF8F' : K.roofHi)); rg.addColorStop(1, mu(flags.fresh ? '#B89A5A' : K.roof));
    g.fillStyle = rg; g.beginPath(); g.ellipse(x, y - 0.5 * s, 0.56 * s, 0.5 * s, 0, Math.PI, 0); g.closePath(); g.fill();
    if (!flags.shut && !muted) { g.fillStyle = K.win; g.fillRect(x - 0.06 * s, y - 0.36 * s, 0.12 * s, 0.14 * s); } else if (flags.shut) { g.fillStyle = '#2B2A28'; g.fillRect(x - 0.08 * s, y - 0.38 * s, 0.16 * s, 0.16 * s); }
    return;
  }
  g.fillStyle = mu(shadeL(K.wall, -10)); g.fillRect(x - s / 2, y - hw, s, hw); // the south wall, in shade
  g.fillStyle = mu(shadeL(K.wall, 6)); g.beginPath(); g.moveTo(x - s / 2, y); g.lineTo(x - s / 2, y - hw); g.lineTo(x - s / 2 - 0.12 * s, y - hw - 0.1 * s); g.lineTo(x - s / 2 - 0.12 * s, y - 0.1 * s); g.closePath(); g.fill(); // the lit west end
  if (flags.ruin) return;
  const rg = g.createLinearGradient(x - s / 2, 0, x + s / 2, 0); rg.addColorStop(0, mu(shadeL(flags.fresh ? '#E3CF8F' : K.roof, 10))); rg.addColorStop(1, mu(flags.fresh ? '#B89A5A' : K.roof));
  g.fillStyle = rg; g.beginPath(); g.moveTo(x - s / 2 - 0.1 * s, y - hw); g.lineTo(x + s / 2 + 0.06 * s, y - hw); g.lineTo(x + s / 2 - 0.04 * s, y - hw - hr); g.lineTo(x - s / 2 - 0.16 * s, y - hw - hr); g.closePath(); g.fill();
  g.strokeStyle = mu(kitK === 'red' ? '#5E5953' : shadeL(K.roof, 14)); g.lineWidth = Math.max(0.5, 0.06 * s); g.beginPath(); g.moveTo(x - s / 2 - 0.16 * s, y - hw - hr); g.lineTo(x + s / 2 - 0.04 * s, y - hw - hr); g.stroke();
  if (s >= 5) { if (flags.shut) { g.fillStyle = '#2B2A28'; g.fillRect(x - 0.3 * s, y - hw * 0.72, 0.18 * s, 0.26 * s); g.fillRect(x + 0.1 * s, y - hw * 0.72, 0.18 * s, 0.26 * s); } else if (!muted || kitK === 'red') { g.fillStyle = mu(K.win); g.fillRect(x - 0.26 * s, y - hw * 0.66, 0.12 * s, 0.18 * s); g.fillRect(x + 0.14 * s, y - hw * 0.66, 0.12 * s, 0.18 * s); } } // every house tone, windows too, passes through the muting
}
const RL_MUTE = new Map();
function rlMuted(c, ground) { // the color moved toward the ground until it is within 2.3:1 of it (3.6:1 at Near; WCAG luminance; natural §10 defect 3, checked at 2.5 and 4)
  const lim = bandOf(cam.s) === 'near' ? RL_P.seatMute.near : RL_P.seatMute.mid, k = c + ground + lim; let v = RL_MUTE.get(k); if (v) return v; const G = hex2rgb(ground); // within 4:1 at Near (fix 7)
  if (rlWcag(hex2rgb(c), G) <= lim) v = c; else { let lo = 0, hi = 1; for (let it = 0; it < 14; it++) { const m = (lo + hi) / 2; if (rlWcag(hex2rgb(mix(c, ground, m)), G) > lim) lo = m; else hi = m; } v = mix(c, ground, hi); }
  RL_MUTE.set(k, v); return v;
}
function rlPennant(g, x, y, h, col) { g.strokeStyle = '#2B2A28'; g.lineWidth = Math.max(0.8, h * 0.06); g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - h); g.stroke(); g.fillStyle = col; g.beginPath(); g.moveTo(x, y - h); g.lineTo(x + h * 0.55, y - h * 0.84); g.lineTo(x, y - h * 0.66); g.closePath(); g.fill(); g.strokeStyle = 'rgba(28,26,23,.6)'; g.lineWidth = 0.6; g.stroke(); }
function rlTower(g, x, y, w, h, stone, hi) { g.fillStyle = shadeL(stone, -12); g.fillRect(x - w / 2, y - h, w, h); g.fillStyle = hi; g.fillRect(x - w / 2, y - h, w * 0.32, h); g.fillStyle = shadeL(stone, 8); ellipse(g, x, y - h, w / 2, w * 0.24); g.fill(); g.fillStyle = shadeL(stone, -22); for (let k = 0; k < 3; k++) g.fillRect(x - w / 2 + (k * w) / 3 + w * 0.04, y - h - w * 0.2, w * 0.18, w * 0.16); }
function rlTown(g, st, p, band, ground) {
  const { x, T } = st, far = band === 'far', kitK = p.kitOwner ?? p.owner, K = rlKitOf(kitK), rim = p.owner ? BAN[p.owner] : RL_C.pewter, rx = T / 2, ry = rx * 0.64;
  const y = rlBase(g, x, st.y, rx, ry, rim, { rimW: Math.max(1.6, Math.min(3, 0.03 * T)) });
  g.fillStyle = mix(ground, '#7A6A52', 0.6); ellipse(g, x, y - 0.5, rx * 0.8, ry * 0.8); g.fill(); // the yard: opaque packed earth inside the dark ring that carries the rim (fix 8)
  const ws = rlWallStage(p.pd), wr = rx * 0.8, wry = wr * 0.64, wallH = T * (ws === 'palisade' ? 0.07 : 0.085), stone = K.stone;
  const wallArc = (a0, a1) => { // the wall as a band of height wallH along the ring, from angle a0 to a1
    if (!ws || ws === 'watch') return; const n = 28; g.beginPath(); for (let m = 0; m <= n; m++) { const a = a0 + ((a1 - a0) * m) / n; g.lineTo(x + Math.cos(a) * wr, y + Math.sin(a) * wry - wallH); } for (let m = n; m >= 0; m--) { const a = a0 + ((a1 - a0) * m) / n; g.lineTo(x + Math.cos(a) * wr, y + Math.sin(a) * wry); } g.closePath();
    if (ws === 'palisade') { g.fillStyle = '#6B4A2B'; g.fill(); g.strokeStyle = '#3E2A18'; g.lineWidth = Math.max(0.5, T * 0.008); for (let m = 0; m <= Math.round(T * 0.5); m++) { const a = a0 + ((a1 - a0) * m) / Math.round(T * 0.5); const px = x + Math.cos(a) * wr, py = y + Math.sin(a) * wry; g.beginPath(); g.moveTo(px, py); g.lineTo(px, py - wallH * 1.15); g.stroke(); } }
    else { const gr = g.createLinearGradient(x - wr, 0, x + wr, 0); gr.addColorStop(0, K.stoneHi); gr.addColorStop(1, shadeL(stone, -14)); g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(28,26,23,.55)'; g.lineWidth = 0.6; g.stroke(); }
    if (p.siege && p.siege !== 'intact' && a0 > 0) { g.strokeStyle = '#1C1A17'; g.lineWidth = Math.max(0.8, T * 0.012); for (const a of [0.7, 1.9]) { const px = x + Math.cos(a) * wr, py = y + Math.sin(a) * wry - wallH * 0.5; g.beginPath(); g.moveTo(px - 1.5, py - 2); g.lineTo(px + 0.5, py); g.lineTo(px - 0.6, py + 2); g.stroke(); } }
  };
  wallArc(Math.PI, Math.PI * 2); // the back half first
  if (ws === 'towers') for (const a of [Math.PI * 1.25, Math.PI * 1.75]) rlTower(g, x + Math.cos(a) * wr, y + Math.sin(a) * wry, T * 0.1, T * 0.17, stone, K.stoneHi);
  if (ws === 'watch') rlTower(g, x + Math.cos(Math.PI * 1.7) * wr, y + Math.sin(Math.PI * 1.7) * wry, T * 0.08, T * 0.2, '#6B4A2B', '#8C6A47');
  // houses on the spiral, the keep at the center with a fort, the temple and the lab as landmarks on the ring, scaffolding while building
  const items = [], st2 = settlementC(p.i), n = far ? Math.min(3, st2.n) : Math.min(16, st2.n), hs = Math.max(3, Math.min(RL_P.townHouseMax, T * RL_P.townHouseK)), unrestShut = p.unrest >= 50;
  for (let k = 0; k < n; k++) { const a = (k * 137.508 * Math.PI) / 180, r = Math.min(0.62, 0.17 * Math.sqrt(k + 0.6)) * rx; items.push({ y: y + Math.sin(a) * r * 0.64, draw: () => rlHouse(g, x + Math.cos(a) * r, y + Math.sin(a) * r * 0.64, hs, kitK, false, ground, { fresh: st2.houses[k]?.fresh, ruin: st2.houses[k]?.ruin, shut: unrestShut }) }); }
  if (p.buildings.includes('fort')) items.push({ y: y + 0.01, draw: () => { rlTower(g, x, y + 2, T * 0.17, T * 0.3, stone, K.stoneHi); rlPennant(g, x, y + 2 - T * 0.3 - T * 0.04, T * 0.16, p.owner ? BAN[p.owner] : RL_C.pewter); } });
  const lm = (a, fn) => { const lx = x + Math.cos(a) * wr * 0.72, ly = y + Math.sin(a) * wry * 0.72; items.push({ y: ly, draw: () => fn(lx, ly) }); };
  if (!far && (p.buildings.includes('temple') || (p.build && p.build.kind === 'temple'))) lm(-Math.PI * 0.2, (lx, ly) => {
    const w = T * 0.2, h = T * 0.16;
    if (p.build && !p.buildings.includes('temple')) { g.strokeStyle = '#8C6A47'; g.lineWidth = Math.max(0.7, T * 0.012); g.strokeRect(lx - w / 2, ly - h, w, h); g.beginPath(); g.moveTo(lx - w / 2, ly); g.lineTo(lx + w / 2, ly - h); g.moveTo(lx - w / 2, ly - h); g.lineTo(lx + w / 2, ly); g.stroke(); return; }
    if (kitK === 'green') { g.fillStyle = shadeL(K.wall, -10); g.fillRect(lx - w / 2, ly - h * 0.6, w, h * 0.6); g.fillStyle = K.roof; g.beginPath(); g.ellipse(lx, ly - h * 0.6, w * 0.62, h * 0.6, 0, Math.PI, 0); g.closePath(); g.fill(); g.fillStyle = K.roofHi; ellipse(g, lx - w * 0.15, ly - h * 0.95, w * 0.2, h * 0.14); g.fill(); return; }
    g.fillStyle = shadeL(stone, -6); g.fillRect(lx - w / 2, ly - h * 0.5, w, h * 0.5); g.fillStyle = K.stoneHi; g.fillRect(lx - w * 0.36, ly - h * 0.85, w * 0.72, h * 0.35); g.fillStyle = shadeL(stone, -20); g.fillRect(lx - w * 0.2, ly - h * 0.5, w * 0.4, h * 0.3);
    const unlit = p.dom.n && p.dom.n !== (p.kitOwner ?? p.owner); if (!unlit) { g.fillStyle = '#FFB347'; ellipse(g, lx, ly - h * 0.98, w * 0.12, h * 0.16); g.fill(); g.fillStyle = 'rgba(255,179,71,.25)'; ellipse(g, lx, ly - h * 0.98, w * 0.28, h * 0.3); g.fill(); } else { g.fillStyle = '#3A3836'; ellipse(g, lx, ly - h * 0.9, w * 0.12, h * 0.07); g.fill(); }
  });
  if (!far && p.buildings.includes('lab')) lm(-Math.PI * 0.8, (lx, ly) => { const w = T * 0.11, h = T * 0.26; rlTower(g, lx, ly, w, h, kitK === 'green' ? '#8C6A47' : '#6E6A64', kitK === 'green' ? '#A88A64' : '#8E8A84'); g.fillStyle = '#2B2A28'; g.fillRect(lx + w * 0.15, ly - h - w * 0.5, w * 0.22, w * 0.5); if (!far) smokeWisp(g, lx + w * 0.26, ly - h - w * 0.5, 0.8, h * 0.6); });
  items.sort((a, b) => a.y - b.y); for (const it of items) it.draw();
  wallArc(0, Math.PI); // the front half over the houses
  if (ws === 'towers') { for (const a of [Math.PI * 0.25, Math.PI * 0.75]) rlTower(g, x + Math.cos(a) * wr, y + Math.sin(a) * wry, T * 0.1, T * 0.17, stone, K.stoneHi); const gx = x, gy = y + wry; g.fillStyle = shadeL(stone, -10); g.fillRect(gx - T * 0.09, gy - T * 0.15, T * 0.18, T * 0.15); g.fillStyle = '#1C1A17'; g.beginPath(); g.moveTo(gx - T * 0.035, gy); g.lineTo(gx - T * 0.035, gy - T * 0.06); g.arc(gx, gy - T * 0.06, T * 0.035, Math.PI, 0); g.lineTo(gx + T * 0.035, gy); g.closePath(); g.fill(); }
  if (!p.buildings.includes('fort') && n > 0 && !far) { const a = 0, r = 0.17 * Math.sqrt(0.6) * rx; rlPennant(g, x + Math.cos(a) * r - hs * 0.3, y - hs * 0.84, hs * 1.3, p.owner ? BAN[p.owner] : RL_C.pewter); }
  return y;
}
function rlHamlet(g, st, p, band, ground) { // houses on the land, no base; muted at every band (within 2.5:1 of the ground at Mid, 4:1 at Near; fix 7)
  const near = band === 'near', s2 = settlementC(p.i), n = near ? s2.n : Math.min(4, s2.n), hs = st.T, shut = p.unrest >= 50, list = []; // a cluster of at most 4 at Mid
  for (let k = 0; k < n; k++) { const a = (k * 137.508 * Math.PI) / 180, r = hs * 0.62 * Math.sqrt(k + 0.35); list.push([st.x + Math.cos(a) * r * 1.25, st.y + Math.sin(a) * r * 0.72, k]); }
  list.sort((a, b) => a[1] - b[1]); for (const [x, y, k] of list) rlHouse(g, x, y, hs * (k === 0 ? 1.1 : 1), p.kitOwner ?? p.owner, true, ground, { fresh: s2.houses[k]?.fresh, ruin: s2.houses[k]?.ruin, shut, i: p.i });
}
// the gesso hut at an unexplored seat: its walls and roof muted toward the ground like a hamlet's (fix 4; #C9C1B1 was 9.5:1 on forest)
function rlHut(g, st, ground) { const s = st.T, x = st.x, y = st.y; ground = rlHouseGround(st.i, x - 0.6 * s, y - 0.86 * s, x + 0.56 * s, y + 0.05 * s); g.fillStyle = 'rgba(0,0,0,.2)'; ellipse(g, x + 0.25 * s, y + 0.05 * s, 0.6 * s, 0.16 * s); g.fill(); g.fillStyle = rlMuted('#C9C1B1', ground); g.fillRect(x - s / 2, y - 0.42 * s, s, 0.42 * s); g.fillStyle = rlMuted(RL_C.gesso, ground); g.beginPath(); g.moveTo(x - 0.6 * s, y - 0.42 * s); g.lineTo(x + 0.56 * s, y - 0.42 * s); g.lineTo(x + 0.44 * s, y - 0.86 * s); g.lineTo(x - 0.5 * s, y - 0.86 * s); g.closePath(); g.fill(); g.strokeStyle = 'rgba(28,26,23,.35)'; g.lineWidth = 0.6; g.stroke(); }
function rlWell(g, wl, p) { // the Wellspring: a basin with five drops in the five colors on its own base; a static glow while unclaimed; claim stones
  const rx = wl.B / 2, ry = rx * 0.64, claimed = p.claim === 'red', rim = claimed ? BAN.red : RL_C.lip;
  if (!claimed) { const gr = g.createRadialGradient(wl.x, wl.y - ry, 0, wl.x, wl.y - ry, rx * 2); gr.addColorStop(0, 'rgba(244,238,223,.28)'); gr.addColorStop(1, 'rgba(244,238,223,0)'); g.fillStyle = gr; g.fillRect(wl.x - rx * 2, wl.y - ry - rx * 2, rx * 4, rx * 4); }
  const y = rlBase(g, wl.x, wl.y, rx, ry, rim, { rimW: Math.max(1.6, rx * 0.12) });
  g.fillStyle = '#9A9286'; ellipse(g, wl.x, y - ry * 0.25, rx * 0.62, ry * 0.62); g.fill(); g.fillStyle = '#CFC6B4'; ellipse(g, wl.x, y - ry * 0.45, rx * 0.6, ry * 0.58); g.fill();
  g.fillStyle = '#7FA9BA'; ellipse(g, wl.x, y - ry * 0.48, rx * 0.42, ry * 0.36); g.fill(); g.fillStyle = 'rgba(232,246,240,.5)'; ellipse(g, wl.x - rx * 0.12, y - ry * 0.55, rx * 0.16, ry * 0.08); g.fill();
  const cols = ['#F3E6B8', '#3A7BD5', '#3D2B4F', '#FD6533', '#00674B'];
  for (let k = 0; k < 5; k++) { const a = Math.PI + 0.25 + k * 0.66, px = wl.x + Math.cos(a) * rx * 0.64, py = y - ry * 0.45 + Math.sin(a) * ry * 0.6, h = rx * 0.34; g.fillStyle = claimed ? '#CFC6B4' : cols[k]; g.beginPath(); g.moveTo(px - h * 0.22, py); g.quadraticCurveTo(px - h * 0.24, py - h * 0.6, px, py - h); g.quadraticCurveTo(px + h * 0.24, py - h * 0.6, px + h * 0.22, py); g.closePath(); g.fill(); g.strokeStyle = 'rgba(28,26,23,.6)'; g.lineWidth = 0.6; g.stroke(); }
  if (claimed) for (let k = 0; k < 4; k++) { const a = Math.PI * 0.15 + (k / 3) * Math.PI * 0.7, px = wl.x + Math.cos(a) * rx * 0.86, py = y + Math.sin(a) * ry * 0.86; g.fillStyle = BAN.red; g.fillRect(px - rx * 0.06, py - rx * 0.22, rx * 0.12, rx * 0.22); }
  if (p.claim === 'running') { g.strokeStyle = '#E9E4D8'; g.lineWidth = Math.max(1, rx * 0.08); g.beginPath(); g.ellipse(wl.x, y, rx * 1.15, ry * 1.15, 0, -Math.PI / 2, Math.PI / 2); g.stroke(); }
}
const RL_LOOKKINDS = { red: (lvl) => ['cairn', ...(lvl >= 2 ? ['scorch', 'shard', 'brazier'] : [])], green: (lvl) => ['blossom', 'ivy', ...(lvl >= 2 ? ['sapling', 'moss', 'blossom'] : []), ...(lvl >= 3 ? ['bramble'] : [])] };
const RL_POLEKINDS = { Fury: ['warCairn', 'tornBanner'], Turmoil: ['brokenFence', 'toppledCart', 'smoke'], Growth: ['fruitTree', 'cropClump'], Wild: ['briar', 'fern', 'beastDen'] };
function rlMotif(g, kind, x, y, k, R) { // one scenery piece standing on the land at (x, y); k scales a 10 px design; lit from the upper left
  const sh = (rx, ry) => { g.fillStyle = 'rgba(0,0,0,.22)'; ellipse(g, x + 0.3 * rx, y + 0.15 * ry, rx, ry); g.fill(); };
  const stone = (sx, sy, w, h, c) => { g.fillStyle = shadeL(c, -14); g.beginPath(); g.moveTo(sx - w / 2, sy); g.lineTo(sx - w * 0.4, sy - h); g.lineTo(sx + w * 0.35, sy - h * 1.05); g.lineTo(sx + w / 2, sy); g.closePath(); g.fill(); g.fillStyle = shadeL(c, 6); g.beginPath(); g.moveTo(sx - w / 2, sy); g.lineTo(sx - w * 0.4, sy - h); g.lineTo(sx - w * 0.02, sy - h * 1.02); g.lineTo(sx - w * 0.08, sy); g.closePath(); g.fill(); };
  switch (kind) {
    case 'cairn': sh(4 * k, 1.3 * k); for (let m = 0; m < 3; m++) { const r = (3 - m * 0.7) * k, yy = y - m * 1.9 * k; g.fillStyle = '#6E6A64'; ellipse(g, x, yy, r, r * 0.55); g.fill(); g.fillStyle = '#8E8A84'; ellipse(g, x - r * 0.25, yy - r * 0.15, r * 0.55, r * 0.3); g.fill(); } g.fillStyle = '#FFB347'; ellipse(g, x + 0.7 * k, y - 2.4 * k, 0.6 * k, 0.6 * k); g.fill(); return;
    case 'scorch': g.fillStyle = 'rgba(52,48,44,.45)'; ellipse(g, x, y, 6 * k, 2.6 * k, (R() - 0.5) * 0.5); g.fill(); g.fillStyle = '#FF9A3A'; for (let m = 0; m < 4; m++) { ellipse(g, x + (R() - 0.5) * 7 * k, y + (R() - 0.5) * 2.4 * k, 0.45 * k, 0.45 * k); g.fill(); } return;
    case 'shard': sh(4 * k, 1.2 * k); for (const [dx, h] of [[-1.6, 5], [1.3, 7]]) { g.fillStyle = '#26232A'; g.beginPath(); g.moveTo(x + (dx - 1.2) * k, y); g.lineTo(x + dx * k, y - h * k); g.lineTo(x + (dx + 1.2) * k, y); g.closePath(); g.fill(); g.fillStyle = '#5A5560'; g.beginPath(); g.moveTo(x + (dx - 1.2) * k, y); g.lineTo(x + dx * k, y - h * k); g.lineTo(x + (dx - 0.2) * k, y); g.closePath(); g.fill(); } return;
    case 'brazier': sh(3 * k, 1 * k); g.strokeStyle = '#2B2A28'; g.lineWidth = 0.9 * k; g.beginPath(); g.moveTo(x - 2 * k, y); g.lineTo(x, y - 3.4 * k); g.lineTo(x + 2 * k, y); g.stroke(); g.fillStyle = '#3A3836'; g.beginPath(); g.ellipse(x, y - 3.6 * k, 2.6 * k, 1.2 * k, 0, 0, Math.PI); g.fill(); g.fillStyle = '#FF8A2A'; ellipse(g, x, y - 4.4 * k, 1.5 * k, 1.1 * k); g.fill(); g.fillStyle = '#FFD27A'; ellipse(g, x - 0.2 * k, y - 4.8 * k, 0.7 * k, 0.6 * k); g.fill(); return;
    case 'blossom': sh(4 * k, 1.3 * k); for (const [dx, dy, r] of [[-1.8, -1.6, 2.2], [1.8, -1.8, 2.3], [0, -3.3, 2.1]]) { g.fillStyle = '#3F5E2E'; ellipse(g, x + dx * k, y + dy * k, r * k, r * 0.85 * k); g.fill(); g.fillStyle = '#5E8044'; ellipse(g, x + (dx - 0.5) * k, y + (dy - 0.5) * k, r * 0.55 * k, r * 0.45 * k); g.fill(); } g.fillStyle = '#EAD2DA'; for (let m = 0; m < 7; m++) { const a = m * 2.4; ellipse(g, x + Math.cos(a) * 2.5 * k, y - 2.3 * k + Math.sin(a) * 1.7 * k, 0.55 * k, 0.55 * k); g.fill(); } return;
    case 'ivy': case 'moss': sh(3 * k, 1 * k); stone(x, y, 3.4 * k, 6.2 * k, '#9A958C'); g.fillStyle = '#4E6B3A'; g.fillRect(x - 1.4 * k, y - 6.3 * k, 2.6 * k, 1.5 * k); if (kind === 'ivy') { g.strokeStyle = '#5E8044'; g.lineWidth = 0.8 * k; g.beginPath(); g.moveTo(x - 1.6 * k, y); g.quadraticCurveTo(x - 0.6 * k, y - 2.5 * k, x + 0.4 * k, y - 4.5 * k); g.stroke(); } return;
    case 'sapling': sh(2.4 * k, 0.8 * k); g.strokeStyle = '#5E4630'; g.lineWidth = 0.8 * k; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 4.5 * k); g.stroke(); g.fillStyle = '#4E6B3A'; ellipse(g, x, y - 5.6 * k, 2 * k, 1.8 * k); g.fill(); g.fillStyle = '#6E8F4E'; ellipse(g, x - 0.6 * k, y - 6.1 * k, 1 * k, 0.8 * k); g.fill(); return;
    case 'bramble': case 'briar': g.strokeStyle = kind === 'bramble' ? '#5A3A28' : '#3F4A2A'; g.lineWidth = 0.9 * k; for (let m = 0; m < 3; m++) { g.beginPath(); g.arc(x + (m - 1) * 2.6 * k, y, 2.2 * k, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); } return;
    case 'warCairn': rlMotif(g, 'cairn', x, y, k, R); g.strokeStyle = '#5E4630'; g.lineWidth = 0.8 * k; for (const dx of [-1, 1.2]) { g.beginPath(); g.moveTo(x + dx * k, y - 4 * k); g.lineTo(x + dx * 1.6 * k, y - 11 * k); g.stroke(); } g.fillStyle = '#A8ADB3'; for (const dx of [-1, 1.2]) { g.beginPath(); g.moveTo(x + (dx * 1.6 - 0.7) * k, y - 10.6 * k); g.lineTo(x + dx * 1.6 * k, y - 13 * k); g.lineTo(x + (dx * 1.6 + 0.7) * k, y - 10.6 * k); g.closePath(); g.fill(); } return;
    case 'tornBanner': sh(2 * k, 0.7 * k); g.strokeStyle = '#3E2E20'; g.lineWidth = 0.8 * k; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 0.6 * k, y - 10 * k); g.stroke(); g.fillStyle = '#7A1E12'; g.beginPath(); g.moveTo(x + 0.6 * k, y - 10 * k); g.lineTo(x + 5 * k, y - 9.2 * k); g.lineTo(x + 3.4 * k, y - 8 * k); g.lineTo(x + 5.2 * k, y - 6.8 * k); g.lineTo(x + 2.6 * k, y - 6.4 * k); g.lineTo(x + 0.5 * k, y - 6 * k); g.closePath(); g.fill(); return;
    case 'brokenFence': g.strokeStyle = '#6B4A2B'; g.lineWidth = 0.9 * k; for (const dx of [-4.5, -1.5, 1.8, 4.6]) { g.beginPath(); g.moveTo(x + dx * k, y); g.lineTo(x + (dx + (dx > 4 ? 1.2 : 0)) * k, y - 3.2 * k); g.stroke(); } g.beginPath(); g.moveTo(x - 4.5 * k, y - 2.2 * k); g.lineTo(x - 1.5 * k, y - 2.4 * k); g.moveTo(x + 1.8 * k, y - 2 * k); g.lineTo(x + 5.2 * k, y - 0.8 * k); g.stroke(); return;
    case 'toppledCart': sh(4 * k, 1.2 * k); g.save(); g.translate(x, y); g.rotate(0.45); g.fillStyle = '#8C6A47'; g.fillRect(-3.6 * k, -2.6 * k, 7.2 * k, 2.6 * k); g.restore(); g.strokeStyle = '#3E2E20'; g.lineWidth = 0.9 * k; ellipse(g, x + 2.6 * k, y + 0.4 * k, 1.4 * k, 1.4 * k); g.stroke(); return;
    case 'smoke': g.strokeStyle = 'rgba(110,106,100,.5)'; g.lineWidth = 1.6 * k; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 2.5 * k, y - 4 * k, x - 2.5 * k, y - 8 * k, x + 1.5 * k, y - 12 * k); g.stroke(); g.lineCap = 'butt'; return;
    case 'fruitTree': sh(4 * k, 1.3 * k); g.strokeStyle = '#5E4630'; g.lineWidth = 0.9 * k; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 4 * k); g.stroke(); g.fillStyle = '#3F5E2E'; ellipse(g, x, y - 6.4 * k, 3.6 * k, 3 * k); g.fill(); g.fillStyle = '#6E8F4E'; ellipse(g, x - 1.2 * k, y - 7.4 * k, 1.8 * k, 1.3 * k); g.fill(); g.fillStyle = '#D9874A'; for (let m = 0; m < 5; m++) { const a = m * 1.3 + 0.4; ellipse(g, x + Math.cos(a) * 2.2 * k, y - 6.4 * k + Math.sin(a) * 1.7 * k, 0.5 * k, 0.5 * k); g.fill(); } return;
    case 'cropClump': g.strokeStyle = '#4E7A32'; g.lineWidth = 0.8 * k; for (let m = 0; m < 6; m++) { g.beginPath(); g.moveTo(x + (-3 + m * 1.2) * k, y); g.lineTo(x + (-3.4 + m * 1.3) * k, y - (3.5 + (m % 2)) * k); g.stroke(); } return;
    case 'fern': g.strokeStyle = '#5E8A3A'; g.lineWidth = 0.8 * k; for (const a of [-0.7, 0, 0.7]) { g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.sin(a) * 3 * k, y - 3 * k, x + Math.sin(a) * 5 * k, y - 4.5 * k); g.stroke(); } return;
    case 'beastDen': g.fillStyle = '#5E4630'; g.beginPath(); g.ellipse(x, y, 4.6 * k, 2.8 * k, 0, Math.PI, 0); g.closePath(); g.fill(); g.fillStyle = '#1C1A17'; g.beginPath(); g.ellipse(x, y, 1.9 * k, 1.5 * k, 0, Math.PI, 0); g.fill(); g.strokeStyle = '#E9E4D8'; g.lineWidth = 0.8 * k; g.beginPath(); g.moveTo(x + 3.2 * k, y + 0.5 * k); g.lineTo(x + 5.5 * k, y - 0.2 * k); g.stroke(); return;
  }
}
function rlDrawPieces(g, band, lay) { // review only: SKIP 'nonseats' draws the seats alone (the seat-muting check)
  const only = SKIP.has('nonseats');
  // decals on the land first: churned ground after a battle, burnt patches, ash, fresh growth
  if (!only) for (const { p, st, scar } of lay.events) {
    const R = rngFor(`relief:${MAP_SEED}:decal:${p.i}`), [sx, sy] = rlToScr(st.x, st.y), k = Math.max(0.7, Math.min(2.4, 0.012 * lay.Dpx));
    if ((p.scar === 'churned' || p.scar === 'cairns') && scar) { g.save(); g.globalAlpha = p.scar === 'churned' ? 0.45 : 0.25; const [cx, cy] = rlToScr(scar[0], scar[1]); for (let m = 0; m < 14; m++) { const x = cx + (R() - 0.5) * 0.16 * lay.Dpx, y = cy + (R() - 0.5) * 0.07 * lay.Dpx; g.fillStyle = m % 2 ? '#3A2E22' : '#5A4632'; ellipse(g, x, y, (1.2 + R() * 2.2) * k, (0.5 + R() * 0.8) * k, R() * 0.6); g.fill(); } g.restore(); }
    for (const fx of p.fx ?? []) {
      if (fx.kind === 'burn') { for (let m = 0; m < 6; m++) { const x = sx + (R() - 0.5) * 0.6 * lay.Dpx, y = sy + (R() - 0.5) * 0.45 * lay.Dpx; g.fillStyle = 'rgba(36,32,28,.55)'; ellipse(g, x, y, (6 + R() * 7) * k, (3 + R() * 3) * k, R()); g.fill(); smokeWisp(g, x, y, 1.2, 14 * k); } }
      if (fx.kind === 'ashrain') { for (let m = 0; m < 60 * fx.step; m++) { const x = sx + (R() - 0.5) * 0.7 * lay.Dpx, y = sy + (R() - 0.5) * 0.5 * lay.Dpx; g.fillStyle = m % 3 ? 'rgba(74,71,68,.75)' : 'rgba(233,228,216,.8)'; g.fillRect(x, y, 1.6 * k, 0.9 * k); } }
      if (fx.kind === 'fertile') { g.strokeStyle = '#7FB04A'; g.lineWidth = Math.max(0.8, 0.8 * k); for (let m = 0; m < 14; m++) { const x = sx + (R() - 0.5) * 0.55 * lay.Dpx, y = sy + (R() - 0.5) * 0.4 * lay.Dpx; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x - 2 * k, y - 3 * k, x - 3 * k, y - 4 * k); g.moveTo(x, y); g.quadraticCurveTo(x + 2 * k, y - 3 * k, x + 3 * k, y - 4.5 * k); g.stroke(); } }
    }
  }
  const items = [];
  for (const [i, st] of lay.seats) {
    if (!st.kind) continue; const p = prov[i], [x, y] = rlToScr(st.x, st.y), s2 = { ...st, x, y }, k = rlLayK(lay), ground = rlHouseGround(i, x - st.r * k, y - st.r * 0.64 * k, x + st.r * k, y + st.r * 0.64 * k, true); // the seat's ground: the bake under it (the town yard; houses take their own)
    if (st.kind === 'town') items.push({ y, f: () => rlTown(g, s2, p, band, ground) });
    else { const fade = rlSmooth(RL_P.hamletDpx, RL_P.hamletFadePx, lay.Dpx), f = st.kind === 'hamlet' ? () => rlHamlet(g, s2, p, band, ground) : () => rlHut(g, s2, ground); if (fade > 0.001) items.push({ y, f: () => { g.save(); g.globalAlpha = fade; f(); g.restore(); } }); } // hamlets and huts fade in from 100 to 130 px a province (fix 4)
  }
  if (!only) for (const wl of lay.wells) { const [x, y] = rlToScr(wl.x, wl.y); items.push({ y, f: () => rlWell(g, { ...wl, x, y }, prov[wl.i]) }); }
  if (!only) for (const q of lay.scen) { const [x, y] = rlToScr(q.x, q.y); items.push({ y, f: () => { const R = rngFor(`relief:motif:${q.i}:${q.j}`); if (q.kind === 'pole') { const ks = RL_POLEKINDS[q.pole]; rlMotif(g, ks[q.j % ks.length], x, y, q.k, R); } else { const ks = RL_LOOKKINDS[q.look](q.lvl); rlMotif(g, ks[q.j % ks.length], x, y, q.k, R); } } }); }
  if (!only) for (const q of lay.stones) { const [x, y] = rlToScr(q.x, q.y); items.push({ y, f: () => { g.fillStyle = 'rgba(0,0,0,.25)'; ellipse(g, x + 2, y + 1, 4, 1.4); g.fill(); g.fillStyle = '#9A958C'; g.beginPath(); g.moveTo(x - 2.6, y); g.lineTo(x - 2, y - 9); g.lineTo(x + 2, y - 10); g.lineTo(x + 2.6, y); g.closePath(); g.fill(); g.fillStyle = MANA[q.c] ? MANA[q.c].fill : '#E9E4D8'; g.fillRect(x - 1.6, y - 7, 3.2, 2.6); g.strokeStyle = 'rgba(28,26,23,.6)'; g.lineWidth = 0.7; g.strokeRect(x - 1.6, y - 7, 3.2, 2.6); } }); }
  if (!only) for (const q of lay.guards) { const [x, y] = rlToScr(q.x, q.y); items.push({ y, f: () => rlFigure(g, q.bow ? 'guardBow' : 'guard', x, y, q.h, null) }); }
  if (!only) for (const { p, st, scar } of lay.events) {
    const [x, y] = rlToScr(st.x, st.y), r = st.r, k = Math.max(0.8, Math.min(2.4, 0.014 * lay.Dpx)), [mx, my] = scar ? rlToScr(scar[0], scar[1]) : [x - 0.2 * lay.Dpx, y + 0.16 * lay.Dpx];
    if (p.siege) { const R = rngFor('siege:' + p.i); for (let m = 0; m < 5; m++) { const a = Math.PI * (0.1 + m * 0.2) + R() * 0.08, tx = x + Math.cos(a) * (r + 7 * k), ty = y + Math.sin(a) * (r + 7 * k) * 0.64; items.push({ y: ty, f: () => { g.fillStyle = 'rgba(0,0,0,.25)'; ellipse(g, tx + 2 * k, ty + 0.6 * k, 4 * k, 1.2 * k); g.fill(); g.fillStyle = BAN.red; g.beginPath(); g.moveTo(tx - 3.6 * k, ty); g.lineTo(tx, ty - 5.5 * k); g.lineTo(tx + 3.6 * k, ty); g.closePath(); g.fill(); g.fillStyle = shadeL(BAN.red, -25); g.beginPath(); g.moveTo(tx, ty - 5.5 * k); g.lineTo(tx + 3.6 * k, ty); g.lineTo(tx + 1.2 * k, ty); g.closePath(); g.fill(); } }); }
      items.push({ y: y + r * 0.64 + 6 * k, f: () => { const gx = x + 2 * k, gy = y + r * 0.64 + 6 * k; g.fillStyle = '#8C6A47'; g.fillRect(gx - 5 * k, gy - 2 * k, 10 * k, 2.4 * k); g.fillStyle = '#4A4744'; g.fillRect(gx + 4 * k, gy - 1.6 * k, 2.4 * k, 1.6 * k); g.strokeStyle = '#3E2E20'; g.lineWidth = k; ellipse(g, gx - 3 * k, gy + 0.6 * k, 1.4 * k, 1.4 * k); g.stroke(); ellipse(g, gx + 3 * k, gy + 0.6 * k, 1.4 * k, 1.4 * k); g.stroke(); } }); }
    if (p.pillage) items.push({ y: y + 1, f: () => { for (const dx of [-0.3, 0.25]) { g.strokeStyle = 'rgba(70,66,63,.6)'; g.lineWidth = 3 * k; g.lineCap = 'round'; const sx = x + dx * Math.max(r, 8), sy = y - r * 0.3; g.beginPath(); g.moveTo(sx, sy); g.bezierCurveTo(sx + 5 * k, sy - 10 * k, sx - 5 * k, sy - 20 * k, sx + 3 * k, sy - 32 * k); g.stroke(); g.lineCap = 'butt'; g.fillStyle = '#FF8A3A'; ellipse(g, sx, sy + 1, 2.4 * k, 1.4 * k); g.fill(); } } });
    if (p.unrest >= 50 && !p.pillage) items.push({ y: y + r * 0.64 + 3, f: () => { const bx = x - r - 4 * k, by = y + r * 0.4; g.strokeStyle = '#6B4A2B'; g.lineWidth = 1.4 * k; g.beginPath(); g.moveTo(bx - 4 * k, by); g.lineTo(bx + 4 * k, by - 5 * k); g.moveTo(bx - 4 * k, by - 5 * k); g.lineTo(bx + 4 * k, by); g.moveTo(bx - 5 * k, by - 2.5 * k); g.lineTo(bx + 5 * k, by - 2.5 * k); g.stroke(); } });
    if (p.scar === 'churned') items.push({ y: my, f: () => { const bx = mx, by = my, h = 9 * k; g.strokeStyle = '#2B2A28'; g.lineWidth = 2 * k; g.beginPath(); g.moveTo(bx - h * 0.45, by); g.lineTo(bx + h * 0.35, by - h); g.moveTo(bx + h * 0.45, by); g.lineTo(bx - h * 0.35, by - h); g.stroke(); g.strokeStyle = '#C8C2B6'; g.lineWidth = 1.1 * k; g.beginPath(); g.moveTo(bx - h * 0.3, by - h * 0.25); g.lineTo(bx + h * 0.35, by - h); g.moveTo(bx + h * 0.3, by - h * 0.25); g.lineTo(bx - h * 0.35, by - h); g.stroke(); g.fillStyle = '#5E4630'; g.fillRect(bx - h * 0.62, by - h * 0.32, h * 0.3, 1.4 * k); g.fillRect(bx + h * 0.32, by - h * 0.32, h * 0.3, 1.4 * k); } });
    if (p.scar === 'cairns') for (let m = 0; m < 3; m++) { const cx = mx - 0.04 * lay.Dpx + m * 7 * k, cy = my + (m % 2) * 2 * k; items.push({ y: cy, f: () => { g.save(); g.translate(cx, cy); g.scale(k, k); cairn(g, 0, 0, 1, 1 / k, false); g.restore(); } }); }
  }
  items.sort((a, b) => a.y - b.y); for (const it of items) it.f();
}
function rlFigure(g, key, x, y, h, side) { // the atlas figure with its feet at (x, y), h px tall
  const F = FIGS.fig[key]; if (!F) { rlFallbackFigure(g, x, y, h, side ?? (key.startsWith('guard') ? null : 'red')); return; }
  const k = h / F.h; g.drawImage(F.canvas, x - F.fx * k, y - F.fy * k, F.canvas.width * k, F.canvas.height * k);
}
// ---- army pieces: DOM elements in the layer (click selects, the tooltip is the army card, focusable); stacks fan out on hover.
// Only a piece's own silhouette (its .hit: base plus figure) takes the pointer; the map's wheel, drag, right-click and touch pass through it to the canvas.
const RL_PIECE_DOM = new Map(); let rlPieceSigLast = ''; const RL_LAYER_TOP = 44; // .layer { inset: 44px 0 0 0 }
const RL_PRESS = { prov: -1 }; // a touch that starts on a piece: a long-press there marches to the piece's province
const RL_STATUS = (c) => (c.side === 'red' && c.order === 'Pillage' && c.squads.length ? 'fire' : c.order === 'Besiege' ? 'blades' : c.crown ? 'crown' : c.prophet ? 'halo' : null);
function rlDrawPiece(cv, pc, hovered, fanK) { // one piece into its own canvas; the ground point at (ox, oy) in the canvas
  const c0 = cmd[pc.ids[0]], sel = state.sel && state.sel.type === 'cmd' && pc.ids.includes(state.sel.id), lift = sel || hovered ? 2 : 0, notched = c0.side !== VIEWER && c0.side !== 'indep', rim = c0.side === 'indep' ? RL_C.pewter : BAN[c0.side];
  const w = Math.ceil(pc.rx * 2 + pc.B * 1.6 + 16), h = Math.ceil(pc.figH + pc.B * 1.4 + 22), d = Math.min(2, dpr), g = cv.getContext('2d');
  if (cv.width !== Math.round(w * d) || cv.height !== Math.round(h * d)) { cv.width = Math.round(w * d); cv.height = Math.round(h * d); cv.style.width = w + 'px'; cv.style.height = h + 'px'; }
  g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, w, h);
  const ox = w / 2, oy = h - pc.ry - 0.12 * pc.B * 2 - 8; cv.dataset.ox = ox; cv.dataset.oy = oy;
  if (sel) { g.strokeStyle = '#F4EEDF'; g.lineWidth = 2; g.beginPath(); g.ellipse(ox, oy + 0.06 * pc.B, pc.rx + 4, pc.ry + 3, 0, 0, Math.PI * 2); g.stroke(); }
  const top = rlBase(g, ox, oy, pc.rx, pc.ry, rim, { notched, lift, shadowA: lift ? 0.34 : 0.25, brass: pc.kind === 'pretender', rimW: 2.4 });
  const figs = pc.kind === 'stack' ? pc.ids.slice(0, 3) : [pc.ids[0]];
  if (pc.kind === 'army') rlPennant(g, ox - pc.rx * 0.55, top - pc.ry * 0.5, pc.B * 1.25, rim); // the pennant at the base's rear
  figs.forEach((id, k) => { const c = cmd[id], fx = ox + (figs.length > 1 ? (k - (figs.length - 1) / 2) * pc.rx * 0.62 : 0), fy = top - (figs.length > 1 ? (k % 2 ? 0.5 : -0.5) * pc.ry * 0.3 : 0.1 * pc.ry), fh = pc.kind === 'stack' ? (c.crown ? 1.3 : 1) * pc.B * 0.92 : pc.figH;
    rlFigure(g, c.crown ? 'titan' : c.ptype in RL_FIGLOOK ? c.ptype : 'ashChieftain', fx, fy, fh, c.side); });
  const st = pc.kind === 'stack' ? null : RL_STATUS(c0); // one plaque on the front of the base, by exception
  if (st) { const ps = pc.B < 20 ? 10 : 12, px0 = ox - ps / 2, py0 = top + pc.ry * 0.55 - ps * 0.2; g.fillStyle = '#2B2620'; roundRect(g, px0, py0, ps, ps * 0.8, 2); g.fill(); g.strokeStyle = RL_C.brass; g.lineWidth = 1; g.stroke();
    g.strokeStyle = '#F4EEDF'; g.fillStyle = st === 'fire' ? '#FF8A3A' : '#F4EEDF'; g.lineWidth = 1; const cx = ox, cy = py0 + ps * 0.4, u = ps * 0.28;
    if (st === 'crown') { g.fillStyle = '#E2C98E'; g.beginPath(); g.moveTo(cx - u, cy + u * 0.6); g.lineTo(cx - u, cy - u * 0.4); g.lineTo(cx - u * 0.5, cy); g.lineTo(cx, cy - u * 0.7); g.lineTo(cx + u * 0.5, cy); g.lineTo(cx + u, cy - u * 0.4); g.lineTo(cx + u, cy + u * 0.6); g.closePath(); g.fill(); }
    else if (st === 'halo') { g.strokeStyle = '#F3E6B8'; g.beginPath(); g.ellipse(cx, cy, u, u * 0.55, 0, 0, Math.PI * 2); g.stroke(); }
    else if (st === 'fire') { g.beginPath(); g.moveTo(cx, cy - u); g.quadraticCurveTo(cx + u, cy, cx, cy + u * 0.8); g.quadraticCurveTo(cx - u, cy, cx, cy - u); g.fill(); }
    else { g.beginPath(); g.moveTo(cx - u, cy - u); g.lineTo(cx + u, cy + u); g.moveTo(cx + u, cy - u); g.lineTo(cx - u, cy + u); g.stroke(); } }
  if (fanK != null && pc.kind === 'stack') { g.font = "600 11px 'IBM Plex Sans Condensed', sans-serif"; g.textAlign = 'center'; g.fillStyle = 'rgba(20,18,15,.9)'; roundRect(g, ox + pc.rx - 4, top - pc.figH - 2, 18, 14, 3); g.fill(); g.fillStyle = '#F4EEDF'; g.fillText('×' + pc.ids.length, ox + pc.rx + 5, top - pc.figH + 5.5); }
}
// the hit box: the union of the piece's silhouettes (rlArmySh: the base swept down by its side band, and the upright figure with its pennant), plus the 2 px lift
function rlSizeHit(hit, cv, pc) {
  const ox = Number(cv.dataset.ox), oy = Number(cv.dataset.oy), top = oy - pc.figH - (pc.kind === 'army' ? 0.25 * pc.B : 0) - 3, bot = oy + pc.ry + 0.24 * pc.B + 1;
  hit.style.left = (ox - pc.rx - 2).toFixed(1) + 'px'; hit.style.top = top.toFixed(1) + 'px'; hit.style.width = (2 * pc.rx + 4).toFixed(1) + 'px'; hit.style.height = (bot - top).toFixed(1) + 'px';
}
// the map's gestures through a piece: the wheel zooms, a drag pans, a right-click orders the selected army to the piece's province (an attack on an enemy), touch pans, pinches and long-presses.
// provOf() null: a fanned piece stands off its ground, so a right-click or long-press on it aims at the land under the pointer
function rlWireHit(hit, provOf, onClick) {
  hit.addEventListener('wheel', (e) => { e.preventDefault(); canvas.dispatchEvent(new WheelEvent('wheel', e)); }, { passive: false });
  hit.addEventListener('contextmenu', (e) => { e.preventDefault(); if (e.pointerType === 'touch') return; orderMove(e.clientX, e.clientY, provOf()); });
  hit.addEventListener('mousedown', (e) => { if (e.button === 0) { drag = true; dragMoved = 0; } });
  for (const t of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) hit.addEventListener(t, (e) => { if (e.pointerType !== 'touch') return; if (t === 'pointerdown') RL_PRESS.prov = provOf(); canvas.dispatchEvent(new PointerEvent(t, e)); });
  hit.addEventListener('click', (e) => { e.stopPropagation(); if (dragMoved > 6) return; onClick(); });
  hit.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onClick(); } }); // Space selects the piece and must not also reach the window's pause shortcut
}
function rlPlacePieces(band) {
  const lay = RL_PIECE_CACHE.get('L'); if (!lay) return;
  const sigNow = lay.key + '|' + FIGS.ver + '|' + (state.sel ? state.sel.id : '') + '|' + RL_NUMBERS.on + RL_NUMBERS.shift;
  if (sigNow !== rlPieceSigLast) {
    rlPieceSigLast = sigNow; const keep = new Set();
    for (const pc of lay.armies) {
      keep.add(pc.key); let ent = RL_PIECE_DOM.get(pc.key);
      if (!ent) {
        const el = document.createElement('div'); el.className = 'mini'; const cv = document.createElement('canvas'); el.appendChild(cv); const hit = document.createElement('div'); hit.className = 'hit'; el.appendChild(hit); layer.appendChild(el);
        ent = { el, cv, hit, hovered: false, subOver: 0, fan: [], fanT: 0 }; RL_PIECE_DOM.set(pc.key, ent);
        hit.addEventListener('mouseenter', () => { ent.hovered = true; clearTimeout(ent.fanT); if (ent.pc.kind === 'stack') { if (!ent.fanned) rlFan(ent, true); } else rlDrawPiece(ent.cv, ent.pc, true); });
        hit.addEventListener('mouseleave', () => { ent.hovered = false; if (ent.pc.kind === 'stack') rlFanRelease(ent); else rlDrawPiece(ent.cv, ent.pc, false); });
        rlWireHit(hit, () => ent.pc.prov, () => { if (ent.pc.kind !== 'stack') selectCmd(ent.pc.ids[0]); else if (!ent.fanned) rlFan(ent, true); });
      }
      ent.pc = pc; const c0 = cmd[pc.ids[0]], troops = pc.ids.reduce((n, id) => n + cmd[id].squads.reduce((m, q) => m + q[1], 0), 0), hit = ent.hit;
      if (pc.kind === 'stack') delete hit.dataset.tip; else hit.dataset.tip = 'cmd:' + c0.id;
      hit.tabIndex = 0; hit.setAttribute('role', 'button'); hit.setAttribute('aria-label', pc.kind === 'stack' ? `${pc.ids.length} commanders of ${ownerName(pc.side)} in ${names[pc.prov]}` : `${cname(c0)}, ${troops} troops`);
      ent.el.classList.toggle('sel', !!(state.sel && pc.ids.includes(state.sel.id)));
      rlDrawPiece(ent.cv, pc, ent.hovered); rlSizeHit(hit, ent.cv, pc); if (ent.fanned) rlFan(ent, true, true);
      // the numbers layer's count plate under the piece (troops; the strength word where the view is fogged)
      let plate = ent.el.querySelector('.cplate'); if (RL_NUMBERS.on || RL_NUMBERS.shift) { if (!plate) { plate = document.createElement('span'); plate.className = 'cplate'; ent.el.appendChild(plate); } plate.textContent = pc.kind === 'stack' ? '×' + pc.ids.length : String(troops || (c0.crown ? '♛' : '1')); } else if (plate) plate.remove();
    }
    for (const [k, ent] of RL_PIECE_DOM) if (!keep.has(k)) { clearTimeout(ent.fanT); ent.el.remove(); RL_PIECE_DOM.delete(k); }
  }
  for (const [, ent] of RL_PIECE_DOM) {
    const pc = ent.pc, [sx, sy] = rlToScr(pc.x, pc.y, lay.s), off = sx < -60 || sx > cw + 60 || sy < -60 || sy > ch + 80; ent.el.style.display = off ? 'none' : '';
    if (!off) { ent.el.style.left = sx - Number(ent.cv.dataset.ox) + 'px'; ent.el.style.top = sy - RL_LAYER_TOP - Number(ent.cv.dataset.oy) + 'px'; } // the layer starts under the top bar
  }
}
// a fanned stack closes a moment after the pointer has left both the stack and its fanned pieces (the gap between them is crossed in time)
function rlFanRelease(ent) { clearTimeout(ent.fanT); ent.fanT = setTimeout(() => { if (!ent.hovered && ent.subOver <= 0 && ent.fanned) rlFan(ent, false); }, 160); }
function rlFan(ent, on, keepOpen) { // a stack fans out into its pieces on hover; each is clickable with its own card
  ent.fanned = on; for (const f of ent.fan) f.remove(); ent.fan = []; ent.subOver = 0;
  ent.cv.style.opacity = on ? '0.35' : '1';
  if (!on) return; const pc = ent.pc, n = pc.ids.length, Ba = rlBa(rlDpx());
  pc.ids.forEach((id, k) => {
    const c = cmd[id], kind = c.crown ? 'pretender' : c.squads.length ? 'army' : 'lone', B = kind === 'pretender' ? 1.15 * Ba : kind === 'lone' ? 0.8 * Ba : Ba;
    const sub = { ...pc, ids: [id], kind, B, rx: B / 2, ry: (B / 2) * 0.64, figH: B * 1.15 * (kind === 'pretender' ? 1.3 : 1) };
    const el = document.createElement('div'); el.className = 'mini fanned'; const cv = document.createElement('canvas'); el.appendChild(cv); const hit = document.createElement('div'); hit.className = 'hit'; el.appendChild(hit); ent.el.appendChild(el); rlDrawPiece(cv, sub, false); rlSizeHit(hit, cv, sub);
    const a = Math.PI + (Math.PI * (k + 1)) / (n + 1), dx = Math.cos(a) * Ba * 1.15, dy = Math.sin(a) * Ba * 0.95 - Ba * 0.25;
    el.style.left = Number(ent.cv.dataset.ox) + dx - Number(cv.dataset.ox) + 'px'; el.style.top = Number(ent.cv.dataset.oy) + dy - Number(cv.dataset.oy) + 'px';
    hit.dataset.tip = 'cmd:' + id; hit.tabIndex = 0; hit.setAttribute('role', 'button'); hit.setAttribute('aria-label', cname(c));
    rlWireHit(hit, () => null, () => selectCmd(id));
    hit.addEventListener('mouseenter', () => { ent.subOver++; clearTimeout(ent.fanT); rlDrawPiece(cv, sub, true); });
    hit.addEventListener('mouseleave', () => { ent.subOver = Math.max(0, ent.subOver - 1); rlDrawPiece(cv, sub, false); rlFanRelease(ent); });
    ent.fan.push(el);
  });
  void keepOpen;
}

// ------------------------------------------------------------------ v4 relief: labels, live names, the numbers chips, the path thread and arrows (screen px)
function rlPaintLabels(g, lay) {
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  for (const op of lay.wildOps) {
    if (op.gl) { paintGlyphs(g, op.gl.map((q) => ({ ...q, x: q.x + cam.x, y: q.y + cam.y })), op.font, '#E9E4D8', 'rgba(20,18,15,.55)', 2.5); continue; }
    const [x, y] = rlToScr(op.x, op.y); g.save(); g.translate(x, y); if (op.vertical) g.rotate(-Math.PI / 2); g.font = op.font; if ('letterSpacing' in g) g.letterSpacing = '0.12em';
    g.lineWidth = 2.5; g.strokeStyle = 'rgba(20,18,15,.55)'; g.strokeText(op.w.name, 0, 0); g.fillStyle = '#E9E4D8'; g.fillText(op.w.name, 0, 0); if ('letterSpacing' in g) g.letterSpacing = '0px'; g.restore();
  }
  for (const lb of lay.labels) { const [x, y] = rlToScr(lb.x, lb.y); if (lb.sw) { const tw = lb.box[2] - lb.box[0] - 4; rlSwatch(g, prov[lb.i].terrain, x - tw / 2 + 5, y, 10); rlLabel(g, lb.text, x + 6.5, y, lb.font); } else rlLabel(g, lb.text, x, y, lb.font); }
  for (const c of lay.chips) { const [x, y] = rlToScr(c.x, c.y), w2 = c.box[2] - c.box[0]; g.fillStyle = 'rgba(20,18,15,.88)'; roundRect(g, x - w2 / 2, y - 8, w2, 16, 3); g.fill(); g.font = "600 11px 'IBM Plex Sans Condensed', sans-serif"; g.fillStyle = '#F4EEDF';
    if (c.tg) { rlGlyph(g, c.tg, x - w2 / 2 + 4, y - 5.5, 11, '#F4EEDF'); g.fillText(c.text, x + 6.5, y + 0.5); } else g.fillText(c.text, x, y + 0.5); } // the Terrain mode: the glyph and the word
}
function rlLabel(g, text, x, y, font, strong) { g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.lineWidth = strong ? 4 : 3; g.strokeStyle = strong ? 'rgba(20,18,15,.95)' : 'rgba(20,18,15,.85)'; g.strokeText(text, x, y); g.fillStyle = '#F4EEDF'; g.fillText(text, x, y); }
// the layout's boxes in the live frame (they were laid out at lay.s; during a wheel zoom the frame is already at cam.s)
const rlLiveBox = (lay) => { const k = rlLayK(lay); return (q) => [q[0] * k + cam.x, q[1] * k + cam.y, q[2] * k + cam.x, q[3] * k + cam.y]; };
// where a chip may stand: inside the model's screen box (inset 4 px) and clear of the floating alerts ribbon (canvas px)
function rlChipRoom() {
  const [mx0, my0] = toScreen(0, 0), [mx1, my1] = toScreen(W, H), cr = canvas.getBoundingClientRect(), rbEl = document.getElementById('ribbon'), rb = rbEl && rbEl.offsetParent ? rbEl.getBoundingClientRect() : null;
  const rib = rb && rb.width > 0 && rb.height > 0 ? [rb.left - cr.left, rb.top - cr.top, rb.right - cr.left, rb.bottom - cr.top] : null;
  return { inModel: (r) => r[0] >= mx0 + 4 && r[1] >= my0 + 4 && r[2] <= mx1 - 4 && r[3] <= my1 - 4, clearOfRibbon: (r) => !rib || !(r[2] > rib[0] && r[0] < rib[2] && r[3] > rib[1] && r[1] < rib[3]) };
}
const RL_THREAD_CHIPS = { list: [] }; // review only: the day chips as last drawn (canvas px)
function rlThread(g, ml) { // the planned path (relief): the line from the army's piece, waypoint diamonds, day chips clear of names and pieces and on the model, the path's names on top
  const lay = RL_PIECE_CACHE.get('L'), sh = rlLiveBox(lay), avoid = lay ? [...lay.boxes.map(sh), ...lay.labels.map((l) => sh(l.box))] : [], room = rlChipRoom();
  const sel = state.sel && state.sel.type === 'cmd' ? rlPieceAt(state.sel.id) : null, pts = [sel ?? cent[ml.from], ...ml.path.map((v) => cent[v])].map((q) => toScreen(...q));
  g.save(); g.lineJoin = 'round'; g.setLineDash([8, 6]); g.strokeStyle = '#1C1A17'; g.lineWidth = 5; g.beginPath(); pts.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); g.strokeStyle = '#F4EEDF'; g.lineWidth = 3; g.stroke(); g.setLineDash([]);
  g.font = "600 11.5px 'IBM Plex Sans Condensed', sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle';
  let days = 0; const chips = [];
  ml.path.forEach((v, k) => {
    days += DAYS[prov[v].terrain]; const [x, y] = pts[k + 1], last = k === ml.path.length - 1;
    g.save(); g.translate(x, y); g.rotate(Math.PI / 4); g.fillStyle = '#B8914A'; g.fillRect(-3.5, -3.5, 7, 7); g.strokeStyle = '#1C1A17'; g.lineWidth = 1; g.strokeRect(-3.5, -3.5, 7, 7); g.restore();
    const lbl = last ? `${days}d${ml.around ? ' · around ' + ml.around : ''}` : `${days}d`, lines1 = [lbl], lines2 = last && ml.around ? [`${days}d`, `around ${ml.around}`] : null;
    const chipOf = (lines) => { const tw = Math.max(...lines.map((t) => g.measureText(t).width)) + 10, h = 17 + (lines.length - 1) * 13; return { lines, tw, h, cands: [[8, -h - 6], [-tw - 8, -h - 6], [8, 6], [-tw - 8, 6], [-tw / 2, -h - 14], [-tw / 2, 12], [14, -h / 2], [-tw - 14, -h / 2], [8, h + 10], [-tw / 2, h + 26], [-tw / 2, -2 * h - 16]].map(([ox, oy]) => [x + ox, y + oy]) }; };
    const rectOf = (c, [cx, cy]) => [cx - 1, cy - 1, cx + c.tw + 1, cy + c.h + 1];
    const free = (c, at) => { const r = rectOf(c, at); return room.inModel(r) && room.clearOfRibbon(r) && ![...avoid, ...chips].some((q) => r[2] > q[0] && r[0] < q[2] && r[3] > q[1] && r[1] < q[3]); };
    let C = chipOf(lines1), at = C.cands.find((q) => free(C, q));
    if (!at && lines2) { const C2 = chipOf(lines2), a2 = C2.cands.find((q) => free(C2, q)); if (a2) { C = C2; at = a2; } } // the decision number keeps its chip on the model: on two lines where one does not fit
    if (!at) { if (lines2) C = chipOf(lines2); at = C.cands.find((q) => room.inModel(rectOf(C, q))) ?? C.cands[0]; } // nothing free: the first spot on the model
    const [cx, cy] = at; chips.push([cx, cy, cx + C.tw, cy + C.h]); RL_THREAD_CHIPS.list = chips.map((q, j) => ({ box: q.map((v) => +v.toFixed(1)), text: j === chips.length - 1 ? C.lines.join(' / ') : '' }));
    const drawChip = () => { g.save(); g.font = "600 11.5px 'IBM Plex Sans Condensed', sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = last ? 'rgba(20,18,15,.95)' : 'rgba(20,18,15,.82)'; roundRect(g, cx, cy, C.tw, C.h, 3); g.fill(); if (last) { g.strokeStyle = '#B8914A'; g.lineWidth = 1; g.stroke(); }
      g.fillStyle = '#F4EEDF'; C.lines.forEach((t, j) => g.fillText(t, cx + C.tw / 2, cy + 9 + j * 13)); g.restore(); };
    drawChip(); RL_CHIPS.push({ box: [cx - 1, cy - 1, cx + C.tw + 1, cy + C.h + 1], draw: drawChip, text: C.lines.join(' / ') });
  });
  if (lay) for (const lb of lay.labels) if (ml.path.includes(lb.i) || lb.i === ml.from) { const [x, y] = rlToScr(lb.x, lb.y, lay.s); rlLabel(g, lb.text, x, y, lb.font); } // names stay readable over the line
  g.restore();
}
function rlArrow(g, a, b, to, color, label) { // a planned move: it stops short of the target's seat, and its day chip keeps off the pieces and names
  const lay = RL_PIECE_CACHE.get('L'), sh = rlLiveBox(lay), avoid = lay ? [...lay.boxes.map(sh), ...lay.labels.map((l) => sh(l.box))] : [];
  const [ax, ay] = toScreen(...a), [tx, ty] = toScreen(...b), st = lay && lay.seats.get(to), L = Math.hypot(tx - ax, ty - ay), cut = Math.min(L * 0.45, (st ? st.r * rlLayK(lay) : 0) + 8), bx = tx - ((tx - ax) / L) * cut, by = ty - ((ty - ay) / L) * cut;
  g.save(); g.strokeStyle = 'rgba(20,18,15,.75)'; g.lineWidth = 5; g.setLineDash([8, 6]); g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke(); g.strokeStyle = color; g.lineWidth = 3; g.stroke(); g.setLineDash([]);
  const ang = Math.atan2(by - ay, bx - ax), head = () => { g.beginPath(); g.moveTo(bx + 2 * Math.cos(ang), by + 2 * Math.sin(ang)); g.lineTo(bx - 12 * Math.cos(ang - 0.4), by - 12 * Math.sin(ang - 0.4)); g.lineTo(bx - 12 * Math.cos(ang + 0.4), by - 12 * Math.sin(ang + 0.4)); g.closePath(); };
  head(); g.strokeStyle = 'rgba(20,18,15,.75)'; g.lineWidth = 2; g.stroke(); g.fillStyle = color; g.fill();
  if (label) {
    const La = Math.hypot(bx - ax, by - ay) || 1, nx = -(by - ay) / La, ny = (bx - ax) / La, up = ny < 0 ? 1 : -1; // a short arrow keeps its chip beside the line, so the line still shows
    const cands = []; for (const t of [0.5, 0.4, 0.6, 0.3, 0.7, 0.2, 0.8]) { if (La >= 90) cands.push([t, 0]); cands.push([t, 20 * up], [t, -20 * up]); }
    const at = ([t, o]) => [ax + (bx - ax) * t + nx * o, ay + (by - ay) * t + ny * o], free = (c) => { const [mx, my] = at(c), r = [mx - 17, my - 11, mx + 17, my + 11]; return !avoid.some((q) => r[2] > q[0] && r[0] < q[2] && r[3] > q[1] && r[1] < q[3]); };
    const [mx, my] = at(cands.find(free) ?? cands[0]);
    const drawChip = () => { g.save(); g.fillStyle = 'rgba(20,18,15,.9)'; roundRect(g, mx - 16, my - 10, 32, 20, 4); g.fill(); g.fillStyle = '#F4EEDF'; g.font = `600 12px 'IBM Plex Sans Condensed', sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, mx, my + 1); g.restore(); };
    drawChip(); RL_CHIPS.push({ box: [mx - 17, my - 11, mx + 17, my + 11], draw: drawChip, text: label }); // recorded: a live name keeps off it (natural §10 defect 4)
  }
  g.restore();
}
// the hovered province's and a hovered link's name on the land, when the band does not show it already (natural §10 defect 4: never over a day chip). The name tries six spots
// (its own; below; above the seat; right; left; lower); if none is free the chip is drawn again on top, since the number is the decision. A link's name carries the terrain (§7).
const RL_CHIPS = [], RL_LIVE = { list: [] }; // this frame's day chips (canvas px, with their draw) and the live names (review)
function rlLiveLabels(g, band) {
  const lay = RL_PIECE_CACHE.get('L'); RL_LIVE.list = []; if (!lay) return;
  for (const i of [hoverProv, RL_LINK.prov]) {
    if (i < 0 || isWild(i) || lay.labels.some((q) => q.i === i) || RL_LIVE.list.some((q) => q.i === i)) continue; const c = lay.cand.get(i); if (!c) continue;
    const link = i === RL_LINK.prov && i !== hoverProv, text = link ? `${prov[i].name} · ${TERRAIN[prov[i].terrain].name.toLowerCase()}` : prov[i].name;
    g.font = c.font; const tw = g.measureText(text).width + 8, th = 16, k = rlLayK(lay), [x0, y0] = rlToScr(c.x, c.y, lay.s), st = lay.seats.get(i), sr = st ? (st.r || st.T || 10) * k : 12;
    const spots = [[x0, y0], [x0, y0 + th + 4], [x0, y0 - sr * 2 - th], [x0 + tw / 2 + sr + 6, y0 - sr], [x0 - tw / 2 - sr - 6, y0 - sr], [x0, y0 + 2 * th + 8]];
    const boxAt = ([x, y]) => [x - tw / 2, y - th / 2, x + tw / 2, y + th / 2], hits = (r) => RL_CHIPS.filter((q) => r[2] > q.box[0] && r[0] < q.box[2] && r[3] > q.box[1] && r[1] < q.box[3]);
    const at = spots.find((sp) => !hits(boxAt(sp)).length) ?? spots[0], box = boxAt(at), over = hits(box);
    rlLabel(g, text, at[0], at[1], c.font, true); for (const q of over) q.draw();
    RL_LIVE.list.push({ i, text, box: box.map((v) => +v.toFixed(1)), moved: at !== spots[0], chipsOnTop: over.length });
  }
}
// the terrain glyph on the map (a 24-unit path drawn at size px) and the terrain swatch: the Clear fill with the glyph in its keyline (natural §7)
function rlGlyph(g, t, x, y, size, col) { g.save(); g.translate(x, y); g.scale(size / 24, size / 24); g.strokeStyle = col; g.lineWidth = 2.2; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(tGlyphPath(t)); g.restore(); }
function rlSwatch(g, t, cx, cy, s) { g.fillStyle = 'rgba(20,18,15,.85)'; g.fillRect(cx - s / 2 - 1, cy - s / 2 - 1, s + 2, s + 2); g.fillStyle = RL_ALB[t]; g.fillRect(cx - s / 2, cy - s / 2, s, s); rlGlyph(g, t, cx - s / 2 + 1, cy - s / 2 + 1, s - 2, RL_KEYFOR[t]); }

// ------------------------------------------------------------------ leader portraits: layered SVG busts on one 256-unit grid
// Anchors: crown y 23, eyes y 100, chin y 169, collar y 200, face axis x 120, three-quarter view facing right.
// Every slot is seeded by rngFor('portrait:11:' + id + ':' + slot); state only adds overlays, badges and the frame.
const PTYPES = {
  ashChieftain: { side: 'red', rank: 2, head: 'hornedHelm', collar: 'scale', label: 'Ash Chieftain' },
  emberAdept: { side: 'red', rank: 1, head: 'emberCirclet', collar: 'robe', label: 'Ember Adept' },
  pyrePriest: { side: 'red', rank: 1, head: 'emberHood', collar: 'cowl', label: 'Pyre Priest' },
  cinderScout: { side: 'red', rank: 0, head: 'ashHood', collar: 'cowl', label: 'Cinder Scout' },
  cinderMagus: { side: 'red', rank: 2, head: 'tallCowl', collar: 'robe', label: 'Cinder Magus' },
  wardenCaptain: { side: 'green', rank: 2, head: 'barkHelm', collar: 'barkMail', label: 'Warden Captain' },
  thornScout: { side: 'green', rank: 0, head: 'leafHood', collar: 'leafCloak', label: 'Thorn Scout' },
  grovePriest: { side: 'green', rank: 1, head: 'wreath', collar: 'robe', label: 'Grove Priest' },
  saplingDruid: { side: 'green', rank: 1, head: 'twigCirclet', collar: 'leafCloak', label: 'Sapling Druid' },
  elderDruid: { side: 'green', rank: 2, head: 'antlerHood', collar: 'robe', label: 'Elder Druid' },
  indepCaptain: { side: 'indep', rank: 'indep', head: 'helm', collar: 'outfit', label: 'Independent Captain' },
  titan: { side: 'red', rank: 'god', head: 'crown', collar: 'mantle', label: 'Titan (pretender)' },
};
const FRAMES = { 0: ['#8C6A47', 'oak'], 1: ['#8C6A43', 'bronze'], 2: ['#B8914A', 'brass'], god: ['#B8914A', "god's brass"], indep: ['#91A092', 'pewter'] };
const SKINS = { red: [['#6E6A64', '#8F8C88', '#B9B6B1'], ['#625E59', '#86827D', '#AFABA5'], ['#76716A', '#97928B', '#C1BCB4'], ['#5E5B57', '#7E7B77', '#A6A39F']],
  green: [['#6B4A2B', '#A0785A', '#C9A585'], ['#5E4126', '#906A4E', '#BC987A'], ['#76533A', '#AC8566', '#D2B092'], ['#5A3E28', '#8C6448', '#B48E70']],
  indep: [['#8C6A4A', '#B08A6A', '#D2B293'], ['#6E5038', '#946E50', '#B8937A'], ['#9A7A5E', '#BE9C80', '#E0C2A6'], ['#5A402C', '#7E5C42', '#A27E62'], ['#A08068', '#C4A68C', '#E6CCB4']] };
const HAIRS = { red: ['#2B2A28', '#4A4744', '#7A3E22', '#D9D6D0', '#3A2E28', '#8F8C88'], green: ['#3E2E20', '#5E4630', '#8A6A3A', '#4E5A3A', '#A08A5A'], indep: ['#3A2E23', '#6B4A2B', '#A08050', '#8F8C88', '#7A3E22'] };
const BANNER_OF = { red: '#FD6533', green: '#00674B', indep: '#8C8A80' };
const keylineFor = (b) => (rgb2lab(hex2rgb(b))[0] > 55 ? '#1C1A17' : '#F4EEDF');
let PID = 0;
function portraitSVG(o, size) {
  const T = PTYPES[o.ptype], side = T.side, uid = 'pt' + PID++, px = 256 / size;
  const lod = size >= 96 ? 3 : size >= 48 ? 2 : size > 24 ? 1 : 0;
  const R = (slot) => rngFor('portrait:11:' + o.id + ':' + slot)();
  const pick = (slot, arr) => arr[Math.floor(R(slot) * arr.length)];
  const banner = o.banner ?? BANNER_OF[side], alleg = o.allegiance ?? (side === 'indep' ? 'independent' : side === 'red' ? 'own' : 'other');
  const rank = o.rank ?? T.rank, [fcol] = FRAMES[rank];
  const hp = o.hpFrac ?? 1, seen = o.seen ?? 'live';
  const pips = lod >= 1 ? (o.pips ?? '') : '';
  const ring = pips.length > 0;
  const vb = ring ? [-24, -24, 304, 304] : [0, 0, 256, 256], outPx = (size * vb[2]) / 256;
  const sk = o.ptype === 'titan' ? ['#3A3836', '#5E5953', '#8A857E'] : pick('skin', SKINS[side]);
  const hairC = pick('hairc', HAIRS[side]);
  const cx = 120, cy = 108;
  const HEADS = [[46, 58, 30, 0], [44, 60, 26, 2], [49, 56, 34, -2], [42, 57, 24, 0], [48, 59, 32, 3], [45, 55, 28, -1]];
  let [rx, ry, jw, cdy] = HEADS[Math.floor(R('head') * 6)];
  if (o.ptype === 'titan') { rx = 54; ry = 60; jw = 40; cdy = 2; }
  const fw = Math.max(8, 4 * px), bw = Math.max(3, 3 * px), shape = alleg === 'independent' ? 'square' : 'round';
  const inner = 124 - fw - bw;
  const S = [];
  const dark = (c, k) => mix(c, '#000000', k);
  // 1. backdrop: the banner darkened 35%, with a radial vignette (20% darker when badly wounded)
  const bd = dark(banner, 0.35 + (hp <= 0.25 ? 0.2 : 0));
  S.push(`<defs><radialGradient id="${uid}g" cx="50%" cy="42%" r="62%"><stop offset="0" stop-color="${mix(bd, '#ffffff', 0.06)}"/><stop offset="1" stop-color="${dark(bd, 0.55)}"/></radialGradient><clipPath id="${uid}c">${shape === 'round' ? `<circle cx="128" cy="128" r="${inner}"/>` : `<rect x="${4 + fw + bw}" y="${4 + fw + bw}" width="${248 - 2 * (fw + bw)}" height="${248 - 2 * (fw + bw)}" rx="${Math.max(4, 28 - fw)}"/>`}</clipPath><clipPath id="${uid}h"><path d="${''}HEAD"/></clipPath></defs>`);
  const headPath = `M${cx - rx} ${cy - 2}C${cx - rx} ${cy - ry * 0.9} ${cx + rx * 0.2} ${cy - ry * 1.05} ${cx + rx * 0.75} ${cy - ry * 0.72}C${cx + rx * 1.02} ${cy - ry * 0.45} ${cx + rx + 3} ${cy - 8} ${cx + rx + 1} ${cy + 10}C${cx + rx} ${cy + 30} ${cx + jw + 14} ${cy + 52 + cdy} ${cx + 12} ${169 + cdy}C${cx - 6} ${172 + cdy} ${cx - jw} ${cy + 50} ${cx - rx + 10} ${cy + 30}C${cx - rx + 2} ${cy + 20} ${cx - rx} ${cy + 10} ${cx - rx} ${cy - 2}Z`;
  S[0] = S[0].replace('HEAD', headPath.slice(0));
  const B = []; // everything inside the clip
  B.push(`<rect x="-10" y="-10" width="276" height="276" fill="url(#${uid}g)"/>`);
  // prophet halo behind the head, with a candle-flame rim
  if (o.prophet && lod >= 1) { B.push(`<circle cx="${cx + 6}" cy="92" r="74" fill="none" stroke="#FFE8C3" stroke-opacity=".85" stroke-width="${Math.max(5, 2.2 * px)}"/>`); if (lod >= 2) for (let k = 0; k < 9; k++) { const a = -Math.PI + (k / 8) * Math.PI; const x = cx + 6 + Math.cos(a) * 74, y = 92 + Math.sin(a) * 74; B.push(`<path d="M${x} ${y - 9}c4 5 4 9 0 9s-4-4 0-9z" fill="#FFA757"/>`); } }
  // 2. hair behind the head
  const hairStyles = side === 'red' ? ['bald', 'crop', 'long', 'swept', 'topknot', 'shaved'] : side === 'green' ? ['crop', 'long', 'swept', 'braids', 'braids', 'bald'] : ['bald', 'crop', 'long', 'swept'];
  const hair = o.ptype === 'titan' ? 'bald' : pick('hair', hairStyles);
  if ((hair === 'long' || hair === 'braids') && lod >= 1) B.push(`<path d="M${cx - rx - 4} ${cy - 20}C${cx - rx - 14} ${cy + 40} ${cx - rx - 6} ${cy + 82} ${cx - rx + 18} ${cy + 96}L${cx - 4} ${cy + 70}L${cx - rx + 8} ${cy}Z" fill="${hairC}"/>`);
  // 3. shoulders and clothes, with a tint zone in the banner color
  const sh = `M14 256C22 214 64 196 104 192L150 192C196 196 238 214 248 256Z`;
  const outfit = o.outfit ?? 'levy';
  const cloth = { scale: '#4A4744', robe: dark(banner, 0.45), cowl: '#3A2B22', barkMail: '#6B4A2B', leafCloak: '#3F5E2E', mantle: '#3A3836', outfit: { levy: '#8C7A5A', hunter: '#5E6A40', mountaineer: '#7A6A58', reedman: '#6E7A5A' }[outfit] }[T.collar];
  B.push(`<path d="${sh}" fill="${cloth}" stroke="#1C1A17" stroke-width="${1.5 * px}"/>`);
  if (lod >= 2) {
    if (T.collar === 'scale') for (let r = 0; r < 4; r++) for (let k = 0; k < 9; k++) B.push(`<path d="M${30 + k * 24 + (r % 2) * 12} ${214 + r * 12}a12 10 0 0 0 24 0" fill="none" stroke="#2B2A28" stroke-width="${1.2 * px}"/>`);
    if (T.collar === 'robe' || T.collar === 'cowl') B.push(`<path d="M60 256C70 230 80 214 96 204M196 256C188 232 178 214 166 204M128 256L130 214" stroke="${dark(cloth, 0.35)}" stroke-width="${2 * px}" fill="none"/>`);
    if (T.collar === 'barkMail') for (let k = 0; k < 7; k++) B.push(`<path d="M${40 + k * 28} 256L${50 + k * 24} 206" stroke="#4A3420" stroke-width="${2 * px}"/>`);
    if (T.collar === 'leafCloak') for (let k = 0; k < 10; k++) { const x = 34 + k * 20, y = 222 + (k % 3) * 9; B.push(`<ellipse cx="${x}" cy="${y}" rx="9" ry="4.5" transform="rotate(${-30 + k * 7} ${x} ${y})" fill="#5E7F45" stroke="#2F4A26" stroke-width="${px}"/>`); }
    if (T.collar === 'outfit') { if (outfit === 'levy') for (let k = 0; k < 6; k++) B.push(`<path d="M${36 + k * 32} 256L${46 + k * 28} 204" stroke="${dark(cloth, 0.3)}" stroke-width="${1.6 * px}"/>`); if (outfit === 'mountaineer') for (let k = 0; k < 14; k++) B.push(`<path d="M${70 + k * 9} 202l3 -8l3 8" fill="#A08A70" stroke="#5E4E3E" stroke-width="${px}"/>`); if (outfit === 'hunter') B.push(`<path d="M40 256C48 220 70 200 100 192L96 214C78 222 66 238 64 256Z" fill="#4A5432"/>`); if (outfit === 'reedman') for (let k = 0; k < 8; k++) B.push(`<path d="M${30 + k * 26} 210L${50 + k * 26} 256" stroke="#55603F" stroke-width="${2 * px}"/>`); }
    if (T.collar === 'mantle') B.push(`<path d="M50 256L80 214L104 230M180 256L168 216L150 236" stroke="#FFB347" stroke-width="${1.6 * px}" fill="none"/>`);
  }
  // the banner tint zone: a sash or collar band
  if (T.collar !== 'mantle') B.push(`<path d="M70 256L148 198L170 204L98 256Z" fill="${banner}" stroke="#1C1A17" stroke-width="${1.2 * px}"/>`);
  // 4. neck
  B.push(`<path d="M${cx - 18} 150L${cx - 22} 200L${cx + 22} 200L${cx + 20} 150Z" fill="${sk[0]}"/>`);
  // 5. head (three skin tones), 6. ear
  B.push(`<path d="${headPath}" fill="${sk[1]}" stroke="#1C1A17" stroke-width="${1.6 * px}"/>`);
  B.push(`<g clip-path="url(#${uid}h)"><ellipse cx="${cx + 18}" cy="${cy - 2}" rx="${rx * 0.66}" ry="${ry * 0.8}" fill="${sk[2]}" opacity=".75"/><path d="M${cx - rx - 4} ${cy - 30}C${cx - rx + 10} ${cy + 20} ${cx - 10} ${cy + 64} ${cx + 30} ${cy + 70}L${cx - rx} ${cy + 80}Z" fill="${sk[0]}" opacity=".7"/></g>`);
  if (lod >= 1) B.push(`<ellipse cx="${cx - rx + 13}" cy="${cy + 4}" rx="8" ry="13" fill="${sk[0]}" stroke="#1C1A17" stroke-width="${1.2 * px}"/>`);
  // 7. eyes and brows (a mage's eye glint), 8. nose and mouth
  const glint = (pips.replace(/[^R]/g, '').length >= 2 ? '#FFB347' : pips.replace(/[^G]/g, '').length >= 2 ? '#A6D96A' : null);
  const titanEyes = o.ptype === 'titan';
  if (lod >= 1) {
    const eyes = [[cx + 12, 100, 7.5], [cx + 37, 99, 5.5]];
    if (lod >= 3 && !titanEyes) B.push(`<ellipse cx="${cx + 22}" cy="101" rx="24" ry="9" fill="${sk[0]}" opacity=".35"/>`);
    if (lod >= 3) for (const [x, y, w] of eyes) { if (titanEyes) { B.push(`<path d="M${x - w} ${y}q${w} -4 ${w * 2} 0q${-w} 3 ${-w * 2} 0z" fill="#FFB347"/><ellipse cx="${x}" cy="${y}" rx="${w * 1.6}" ry="5" fill="#FFB347" opacity=".25"/>`); continue; } B.push(`<path d="M${x - w} ${y}q${w} -5 ${w * 2} 0q${-w} 4 ${-w * 2} 0z" fill="#EDE6D6"/><circle cx="${x + 1}" cy="${y}" r="${w * 0.42}" fill="${glint ?? '#2B2620'}"/><circle cx="${x + 1}" cy="${y}" r="${w * 0.18}" fill="#0E0905"/>`); }
    else for (const [x, y, w] of eyes) B.push(`<ellipse cx="${x + 1}" cy="${y}" rx="${w * 0.45}" ry="${w * 0.38}" fill="${titanEyes ? '#FFB347' : glint ?? '#1C1A17'}"/>`);
    const bt = 2.5 + R('brow') * 3.5, ba = (R('browa') - 0.5) * 6;
    if (!titanEyes) B.push(`<path d="M${cx + 2} ${90 + ba}L${cx + 22} ${87}M${cx + 30} ${88}L${cx + 45} ${89 - ba * 0.5}" stroke="${dark(hairC, 0.2)}" stroke-width="${bt * (lod >= 2 ? 1 : 1.4)}" stroke-linecap="round"/>`);
  }
  if (lod >= 2) {
    B.push(`<path d="M${cx + 40} 98L${cx + rx + 9} 126Q${cx + rx + 8} 133 ${cx + rx - 3} 132L${cx + 35} 131" fill="${sk[1]}" stroke="#1C1A17" stroke-width="${1.3 * px}" stroke-linejoin="round"/>`);
    B.push(`<path d="M${cx + 18} 148Q${cx + 30} 152 ${cx + 43} 146" fill="none" stroke="${dark(sk[0], 0.45)}" stroke-width="${2.2 * px}" stroke-linecap="round"/>`);
    if (lod >= 3) B.push(`<path d="M${cx + 22} 155Q${cx + 31} 158 ${cx + 39} 154" fill="none" stroke="${sk[2]}" stroke-width="2" opacity=".7"/><path d="M${cx + 4} 118Q${cx + 14} 134 ${cx + 10} 146" fill="none" stroke="${sk[0]}" stroke-width="3" opacity=".45"/>`);
  }
  // 9. marks, 10. scars
  const mark = side === 'indep' || o.ptype === 'titan' ? null : R('markp') < 0.55 ? pick('mark', side === 'red' ? ['soot', 'soot', 'cracks', 'cracks'] : ['bark', 'bark', 'moss', 'moss']) : null;
  if (o.ptype === 'titan' && lod >= 2) B.push(`<path d="M${cx - 20} 60l14 22l-6 16l12 14M${cx + 30} 130l-10 14l8 10M${cx - 30} 120l10 8" stroke="#FFB347" stroke-width="${2 * px}" fill="none"/>`);
  if (mark && lod >= 2) B.push({ soot: `<path d="M${cx + 6} 112l26 10M${cx + 2} 120l22 9" stroke="#2B2A28" stroke-opacity=".45" stroke-width="${Math.max(4, 2.6 * px)}" stroke-linecap="round"/>`, cracks: `<path d="M${cx + 28} 112l6 8l-4 8l6 6M${cx - 10} 72l8 6l-2 8" stroke="#FFB347" stroke-width="${1.4 * px}" fill="none"/>`, bark: `<path d="M${cx + 20} 120a8 6 0 1 0 14 0a4 3 0 1 0 -7 0M${cx - 18} 70a6 5 0 1 0 10 2" stroke="#5E4630" stroke-width="${1.6 * px}" fill="none"/>`, moss: `<ellipse cx="${cx - 20}" cy="132" rx="12" ry="7" fill="#5E7F45" opacity=".8"/><ellipse cx="${cx + 36}" cy="72" rx="8" ry="4" fill="#5E7F45" opacity=".8"/>` }[mark]);
  if (lod >= 2 && R('scarp') < 0.3) B.push(pick('scar', [`<path d="M${cx + 22} 108l14 18" stroke="${mix(sk[2], '#ffffff', 0.25)}" stroke-width="${2 * px}"/>`, `<path d="M${cx - 4} 84l10 12" stroke="${mix(sk[2], '#ffffff', 0.25)}" stroke-width="${2 * px}"/>`, `<path d="M${cx + 30} 136l10 -4" stroke="${mix(sk[2], '#ffffff', 0.25)}" stroke-width="${2 * px}"/>`]));
  // 11. beard
  const beards = side === 'red' ? ['none', 'stubble', 'goatee', 'full', 'braidRings', 'braidRings'] : side === 'green' ? ['none', 'stubble', 'full', 'long', 'moss', 'moss'] : ['none', 'stubble', 'goatee', 'full', 'long'];
  const beard = o.ptype === 'titan' || lod === 0 ? 'none' : pick('beard', beards);
  if (beard !== 'none') {
    const bc = dark(hairC, 0.05);
    if (beard === 'stubble') { if (lod >= 2) B.push(`<path d="M${cx - rx + 16} ${cy + 26}C${cx - 8} ${cy + 62} ${cx + 20} ${172 + cdy} ${cx + jw + 10} ${cy + 46}L${cx + jw + 4} ${cy + 36}C${cx + 10} ${cy + 56} ${cx - 10} ${cy + 46} ${cx - rx + 18} ${cy + 18}Z" fill="${bc}" opacity=".35"/>`); }
    else {
      const len = beard === 'goatee' ? 8 : beard === 'full' || beard === 'moss' ? 22 : 40;
      const wide = beard === 'goatee' ? 0.4 : 1;
      B.push(`<path d="M${cx - rx + 14 + (1 - wide) * 40} ${cy + 22}C${cx - 16} ${cy + 66 + len} ${cx + 22} ${172 + cdy + len} ${cx + jw + 14 - (1 - wide) * 20} ${cy + 40}L${cx + 36} ${cy + 44}Q${cx + 28} ${cy + 36} ${cx + 16} ${cy + 42}Q${cx - 10} ${cy + 40} ${cx - rx + 22 + (1 - wide) * 40} ${cy + 16}Z" fill="${bc}" stroke="#1C1A17" stroke-width="${1.2 * px}"/>`);
      if (beard === 'braidRings' && lod >= 1) { const by = 169 + cdy + len * 0.55; B.push(`<path d="M${cx + 6} ${by - 8}q-2 14 2 26M${cx + 24} ${by - 10}q2 12 0 24" stroke="${bc}" stroke-width="11" stroke-linecap="round" fill="none"/><path d="M${cx + 6} ${by - 8}q-2 14 2 26M${cx + 24} ${by - 10}q2 12 0 24" stroke="#1C1A17" stroke-opacity=".35" stroke-width="1.5" fill="none" stroke-dasharray="4 4"/><rect x="${cx + 1}" y="${by + 4}" width="12" height="6" rx="1" fill="#8F8C88" stroke="#1C1A17" stroke-width="${px}"/><rect x="${cx + 19}" y="${by + 2}" width="12" height="6" rx="1" fill="#8F8C88" stroke="#1C1A17" stroke-width="${px}"/>`); }
      if (beard === 'moss' && lod >= 2) B.push(`<ellipse cx="${cx + 8}" cy="${cy + 64}" rx="10" ry="5" fill="#5E7F45"/><ellipse cx="${cx + 26}" cy="${cy + 58}" rx="6" ry="4" fill="#6E8F4E"/>`);
    }
  }
  // 12. front hair (when the headgear leaves it showing)
  const openHead = ['emberCirclet', 'wreath', 'twigCirclet'].includes(T.head);
  if (openHead || T.head === 'helm' && R('helm') > 2) {
    if (hair === 'crop' || hair === 'swept' || hair === 'long' || hair === 'braids') B.push(`<path d="M${cx - rx} ${cy - 4}C${cx - rx - 2} ${cy - ry} ${cx + rx * 0.4} ${cy - ry * 1.1} ${cx + rx * 0.9} ${cy - ry * 0.62}C${cx + rx * 0.6} ${cy - ry * 0.7} ${cx + 10} ${cy - ry * 0.55} ${cx - 6} ${cy - ry * 0.42}C${cx - rx * 0.6} ${cy - ry * 0.3} ${cx - rx + 6} ${cy - 10} ${cx - rx + 4} ${cy + 6}Z" fill="${hairC}" stroke="#1C1A17" stroke-width="${1.2 * px}"/>`);
    if (hair === 'topknot') B.push(`<ellipse cx="${cx - 10}" cy="${cy - ry - 8}" rx="12" ry="10" fill="${hairC}" stroke="#1C1A17" stroke-width="${1.2 * px}"/>`);
    if (hair === 'braids' && lod >= 2) B.push(`<path d="M${cx - rx + 6} ${cy}l-4 70" stroke="${hairC}" stroke-width="9" stroke-linecap="round"/><ellipse cx="${cx - rx + 2}" cy="${cy + 72}" rx="7" ry="3.5" fill="#5E7F45"/>`);
  }
  // 13. headgear
  const HG = headgear(T.head, { cx, cy, rx, ry, px, R, banner, side, outfit, lod });
  B.push(HG);
  // 15. state overlays (never the face itself)
  if (hp <= 0.5 && lod >= 2 && o.ptype !== 'titan') B.push(`<path d="M${cx - rx + 4} ${cy - 30}L${cx + rx + 2} ${cy - 40}L${cx + rx + 3} ${cy - 29}L${cx - rx + 5} ${cy - 18}Z" fill="#E9E4D8" stroke="#8F8C88" stroke-width="${px}"/><ellipse cx="${cx + 20}" cy="${cy - 30}" rx="6" ry="4" fill="#7A2E22" opacity=".85"/>`);
  if (hp <= 0.25 && lod >= 2) B.push(`<path d="M${cx + 30} ${cy + 6}c4 10 2 22 -2 30c6 -6 10 -18 6 -30z" fill="#7A2E22"/>`);
  const bodySVG = `<g clip-path="url(#${uid}c)">${B.join('')}</g>`;
  // 16. the frame: shape by allegiance, material by rank, a banner band with its keyline; badges; the gear chip
  const Fr = [];
  const metal = (w, extra = '') => (shape === 'round' ? `<circle cx="128" cy="128" r="${124 - w / 2}" fill="none" stroke="${fcol}" stroke-width="${w}" ${extra}/>` : `<rect x="${4 + w / 2}" y="${4 + w / 2}" width="${248 - w}" height="${248 - w}" rx="${28 - w / 2}" fill="none" stroke="${fcol}" stroke-width="${w}" ${extra}/>`);
  const dotted = seen === 'lastSeen' ? `stroke-dasharray="${fw * 0.6} ${fw * 0.5}"` : '';
  Fr.push(metal(fw, dotted));
  Fr.push(shape === 'round' ? `<circle cx="128" cy="128" r="${124 - fw - bw / 2}" fill="none" stroke="${banner}" stroke-width="${bw}"/><circle cx="128" cy="128" r="${124 - fw - bw - px / 2}" fill="none" stroke="${keylineFor(banner)}" stroke-width="${px}" stroke-opacity=".8"/>` : `<rect x="${4 + fw + bw / 2}" y="${4 + fw + bw / 2}" width="${248 - 2 * fw - bw}" height="${248 - 2 * fw - bw}" rx="${Math.max(3, 28 - fw - bw / 2)}" fill="none" stroke="${banner}" stroke-width="${bw}"/>`);
  Fr.push(shape === 'round' ? `<circle cx="128" cy="128" r="124" fill="none" stroke="#1C1A17" stroke-width="${px}"/>` : `<rect x="4" y="4" width="248" height="248" rx="28" fill="none" stroke="#1C1A17" stroke-width="${px}"/>`);
  if (alleg === 'other') for (let k = 0; k < 8; k++) { const a = (k / 8) * 360 + 22.5; Fr.push(`<rect x="${128 - fw * 0.32}" y="${4 - 1}" width="${fw * 0.64}" height="${fw * 0.62 + 1}" fill="#1C1A17" transform="rotate(${a} 128 128)"/>`); }
  if (rank === 1 && lod >= 1) for (const a of [45, 135, 225, 315]) Fr.push(`<rect x="${128 - fw * 0.22}" y="${4 + fw * 0.28}" width="${fw * 0.44}" height="${fw * 0.44}" fill="#5E4630" stroke="#2B2A28" stroke-width="${px * 0.6}" transform="rotate(${a} 128 128)"/>`);
  if ((rank === 2 || rank === 'god') && lod >= 1) for (const a of [45, 135, 225, 315]) Fr.push(`<path d="M${128 - 16} ${4 - 1}h32" stroke="${rank === 'god' ? '#D4B26A' : '#B8914A'}" stroke-width="${fw * 0.55}" transform="rotate(${a} 128 128)" fill="none"/><path d="M${128 - 16} ${4 - 1}h32" stroke="#1C1A17" stroke-width="${px * 0.8}" transform="rotate(${a} 128 128) translate(0 ${-fw * 0.28})" fill="none"/>`);
  if (rank === 'god') { Fr.push(metal(px, `stroke="#D4B26A"`).replace(`stroke="${fcol}"`, '')); Fr.push(`<path d="M104 ${6 + fw * 0.2}L110 ${-10}L119 ${2}L128 ${-14}L137 ${2}L146 ${-10}L152 ${6 + fw * 0.2}Z" fill="#B8914A" stroke="#1C1A17" stroke-width="${px * 1.2}"/><path d="M110 -10L119 2L128 -14L137 2L146 -10" fill="none" stroke="#D4B26A" stroke-width="${px}"/>`); if (lod >= 2) Fr.push(`<g transform="translate(26 196)"><circle r="${16}" fill="#1C1A17" stroke="#B8914A" stroke-width="${px * 1.5}"/><path d="M0 9c-6 0-8-4-8-8 0-5 4-7 5-12 1 4 3 5 3 7 1-1 2-2 2-5 3 3 5 6 5 10 0 4-3 8-7 8z" fill="#FD6533" transform="scale(.9)"/></g>`); }
  if (rank === 'indep' && lod >= 1) Fr.push(`<path d="M8 40V8h32M216 8h32v32M248 216v32h-32M40 248H8v-32" fill="none" stroke="#6F7C70" stroke-width="${px * 1.5}"/>`);
  // badges: at most 3 (1 at 40 px and below), by priority: role, wound, supply or pay, holy, gear
  const badges = [];
  if (o.pretender) badges.push(['crown', '#B8914A']);
  if (o.prophet && lod <= 1) badges.push(['halo', '#FFE8C3']);
  if (hp <= 0.5 && lod <= 1) badges.push(['heart', hp <= 0.25 ? '#C55B4E' : '#E9E4D8']);
  if (o.starving) badges.push(['wheat', '#E2B843']);
  if (o.unpaid) badges.push(['coin', '#E2B843']);
  if (o.scout) badges.push(['eye', '#E9E4D8']);
  if (o.stealthy) badges.push(['hood', '#E9E4D8']);
  const maxB = lod <= 1 ? 1 : 3, bslots = [[30, 30], [10, 128], [30, 226]];
  const glyphs = { crown: '<path d="M-7 4l-2-9 5 4 4-7 4 7 5-4-2 9z" fill="#B8914A" stroke="#1C1A17" stroke-width="1"/>', halo: '<ellipse cx="0" cy="-2" rx="7" ry="3" fill="none" stroke="#FFE8C3" stroke-width="2"/>', heart: '<path d="M0 7c-9-6-9-12-5-13 3-1 5 2 5 2s2-3 5-2c4 1 4 7-5 13z" fill="currentColor"/><path d="M0 -4l-2 4 3 2-2 4" stroke="#1C1A17" stroke-width="1.2" fill="none"/>', wheat: '<path d="M-6 7L6-7M6 7L-6-7" stroke="currentColor" stroke-width="2"/><circle cx="-5" cy="-5" r="2" fill="currentColor"/><circle cx="5" cy="-5" r="2" fill="currentColor"/>', coin: '<circle r="5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M-7 7L7-7" stroke="currentColor" stroke-width="2"/>', eye: '<path d="M-7 0q7-7 14 0q-7 7-14 0z" fill="none" stroke="currentColor" stroke-width="1.6"/><circle r="2.2" fill="currentColor"/>', hood: '<path d="M-6 7c0-9 2-13 6-13s6 4 6 13z" fill="none" stroke="currentColor" stroke-width="1.8"/>' };
  badges.slice(0, maxB).forEach(([g, col], k) => { const [x, y] = bslots[k], sc = Math.max(1.6, 1.25 * px); Fr.push(`<g transform="translate(${x} ${y}) scale(${sc})" color="${col}"><circle r="10" fill="#1C1A17" stroke="${fcol}" stroke-width="1.2"/>${glyphs[g]}</g>`); });
  if (o.holy && lod >= 1) Fr.push(`<g transform="translate(128 ${248 - fw / 2}) scale(${Math.max(1.4, px * 1.1)})"><rect x="-9" y="-6" width="18" height="12" rx="2" fill="#1C1A17" stroke="${fcol}" stroke-width="1"/><path d="M0 4c-3 0-4-2-4-4 0-3 2-4 3-7 1 2 1 3 1 4 1-1 1-1 1-3 2 2 3 4 3 6 0 2-2 4-4 4z" fill="#FFE8C3"/></g>`);
  if (o.gear && o.gear.n && lod >= 2) { const sym = ['', '○', '◆', '★'][o.gear.tier], sc = Math.max(1.5, px * 1.05); Fr.push(`<g transform="translate(206 214) scale(${sc})"><rect x="-15" y="-9" width="30" height="18" rx="4" fill="#1C1A17" stroke="${fcol}" stroke-width="1"/><text x="0" y="4.5" text-anchor="middle" font-family="IBM Plex Sans Condensed, sans-serif" font-weight="600" font-size="12" fill="#F4EEDF">${o.gear.n} ${sym}</text></g>`); }
  if (seen === 'dead') Fr.push(`<path d="M${shape === 'round' ? 150 : 170} 0H256V${shape === 'round' ? 106 : 86}Z" fill="#0E0905"/><path d="M${shape === 'round' ? 176 : 192} 0L256 80" stroke="#3A3836" stroke-width="${px * 2}"/>`);
  // 17. the pip ring on its separation ring
  if (ring) {
    Fr.push(`<circle cx="128" cy="128" r="${124 + px}" fill="none" stroke="#1C1A17" stroke-width="${2 * px}"/>`);
    const list = pips.length > 6 ? [pips[0], 'n'] : [...pips], pr = Math.max(17, 6 * px);
    list.forEach((c, k) => { const a = (-60 + k * (pr * 2.25 / (124 + pr)) * (180 / Math.PI)) * Math.PI / 180, x = 128 + Math.cos(a) * (124 + pr * 0.55), y = 128 + Math.sin(a) * (124 + pr * 0.55);
      if (c === 'n') { Fr.push(`<g transform="translate(${x} ${y})"><circle r="${pr + 2 * px}" fill="#1C1A17"/><text y="${pr * 0.35}" text-anchor="middle" font-size="${pr}" font-family="IBM Plex Sans Condensed" fill="#F4EEDF">${pips.length}</text></g>`); return; }
      const m = MANA[c]; Fr.push(`<g transform="translate(${x} ${y})"><circle r="${pr + 2 * px}" fill="#1C1A17"/><circle r="${pr}" fill="${m.fill}"/><g transform="translate(${-pr * 0.6} ${-pr * 0.6}) scale(${pr / 20})" fill="none" stroke="${m.ink}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${m.shape}</g></g>`); });
  }
  const filt = seen === 'dead' ? 'grayscale(1)' : seen === 'lastSeen' ? 'saturate(.3)' : '';
  return `<svg width="${outPx.toFixed(1)}" height="${outPx.toFixed(1)}" viewBox="${vb.join(' ')}" role="img" aria-label="${o.label ?? T.label}"${filt ? ` style="filter:${filt}"` : ''}>${S[0]}${bodySVG}${Fr.join('')}</svg>`;
}
function headgear(kind, q) {
  const { cx, cy, rx, ry, px, R, banner, side, outfit, lod } = q, ink = `stroke="#1C1A17" stroke-width="${1.4 * px}"`;
  const cap = (fill, low = 92) => `<path d="M${cx - rx - 4} ${low + 8}C${cx - rx - 6} ${cy - ry - 4} ${cx + rx * 0.3} ${cy - ry * 1.2} ${cx + rx + 6} ${low - 10}L${cx + rx + 6} ${low - 2}C${cx + 10} ${low - 10} ${cx - 20} ${low} ${cx - rx - 4} ${low + 14}Z" fill="${fill}" ${ink}/>`;
  const hood = (fill, trim) => `<path d="M${cx - rx - 18} 210C${cx - rx - 26} 120 ${cx - rx - 14} 36 ${cx + 6} 28C${cx + rx + 22} 30 ${cx + rx + 26} 86 ${cx + rx + 12} 104C${cx + rx - 2} 90 ${cx + rx - 26} 68 ${cx - 2} 68C${cx - rx + 4} 74 ${cx - rx + 2} 132 ${cx - rx + 16} 210Z" fill="${fill}" ${ink}/>` + (trim ? `<path d="M${cx + rx + 12} 104C${cx + rx - 2} 90 ${cx + rx - 26} 68 ${cx - 2} 68C${cx - rx + 4} 74 ${cx - rx + 2} 132 ${cx - rx + 16} 210" fill="none" stroke="${trim}" stroke-width="${Math.max(5, 2 * px)}"/>` : '');
  const v = Math.floor(R('hg') * 3);
  switch (kind) {
    case 'hornedHelm': {
      const horn = v === 0 ? '#CFC6B4' : v === 1 ? '#2B2A28' : '#8F8C88';
      const hornL = [`M${cx - rx + 8} 70C${cx - rx - 22} 64 ${cx - rx - 34} 40 ${cx - rx - 28} 14C${cx - rx - 18} 34 ${cx - rx - 4} 46 ${cx - rx + 16} 56Z`, `M${cx - rx + 8} 70C${cx - rx - 30} 70 ${cx - rx - 40} 50 ${cx - rx - 44} 30C${cx - rx - 26} 44 ${cx - rx - 8} 50 ${cx - rx + 16} 56Z`, `M${cx - rx + 8} 70C${cx - rx - 14} 56 ${cx - rx - 16} 34 ${cx - rx - 4} 18C${cx - rx + 2} 36 ${cx - rx + 8} 46 ${cx - rx + 18} 56Z`][v];
      const hornR = `M${cx + rx - 18} 58C${cx + rx} 46 ${cx + rx + 8} 30 ${cx + rx + 4} 12C${cx + rx + 16} 30 ${cx + rx + 14} 52 ${cx + rx - 6} 66Z`;
      const hv = Math.floor(R('helmv') * 3), capCol = ['#4A4744', '#3A3836', '#5E5953'][Math.floor(R('helmc') * 3)];
      const crest = hv === 1 ? `<path d="M${cx - 34} ${cy - ry + 8}${[0, 1, 2, 3, 4, 5].map((k) => `L${cx - 28 + k * 12} ${cy - ry - 12 - (k % 2) * 4}L${cx - 22 + k * 12} ${cy - ry + 2 - Math.abs(k - 2.5) * 1.5}`).join('')}L${cx + 40} ${cy - ry + 10}Z" fill="#2B2A28" ${ink}/>` : '';
      const cheek = hv === 2 ? `<path d="M${cx - rx + 4} 96L${cx - rx + 2} 142L${cx - rx + 22} 150L${cx - rx + 28} 102Z" fill="${capCol}" ${ink}/>` : '';
      return `<path d="${hornR}" fill="${horn}" ${ink}/>` + cap(capCol, 92) + crest + cheek + `<path d="M${cx - rx - 4} 100C${cx - 20} 86 ${cx + 10} 80 ${cx + rx + 6} 82L${cx + rx + 6} 92C${cx + 10} 90 ${cx - 20} 96 ${cx - rx - 4} 110Z" fill="#3A3836" ${ink}/>` + `<path d="M${cx + rx - 2} 84L${cx + rx + 4} 84L${cx + rx + 6} 118L${cx + rx} 120Z" fill="#4A4744" ${ink}/>` + (lod >= 2 ? [0, 1, 2, 3].map((k) => `<rect x="${cx - rx + 8 + k * 24}" y="${94 - k * 3.6}" width="5" height="5" fill="#6E6A64"/>`).join('') : '') + `<path d="${hornL}" fill="${horn}" ${ink}/>`;
    }
    case 'emberHood': return hood('#3A2B22', mix(banner, '#000000', 0.2)) + `<path d="M${cx + 4} 214c-9 0-12-6-12-12 0-8 6-11 8-18 2 6 4 7 4 10 2-2 3-3 3-7 4 4 7 9 7 14 0 7-4 13-10 13z" fill="#FFB347" stroke="#1C1A17" stroke-width="${px}"/>`;
    case 'emberCirclet': return `<path d="M${cx - rx + 2} 82C${cx - 10} 72 ${cx + 20} 70 ${cx + rx + 3} 78" fill="none" stroke="#6E6A64" stroke-width="${Math.max(6, 2.5 * px)}"/><path d="M${cx + 24} 66l7 8l-7 8l-7 -8z" fill="#FFB347" stroke="#1C1A17" stroke-width="${px}"/>`;
    case 'tallCowl': return `<path d="M${cx - rx - 14} 210C${cx - rx - 20} 110 ${cx - rx - 8} 40 ${cx + 2} 2C${cx + rx + 8} 40 ${cx + rx + 22} 90 ${cx + rx + 12} 106C${cx + rx - 4} 90 ${cx + rx - 28} 68 ${cx - 4} 68C${cx - rx + 8} 76 ${cx - rx + 6} 140 ${cx - rx + 12} 210Z" fill="#2B2A28" ${ink}/><path d="M${cx - 2} 68C${cx - rx + 8} 76 ${cx - rx + 6} 140 ${cx - rx + 12} 210" fill="none" stroke="${banner}" stroke-width="${Math.max(4, 1.6 * px)}"/>`;
    case 'ashHood': return hood('#6E6A64', '#4A4744') + `<path d="M${cx - 6} 70C${cx + 20} 70 ${cx + rx} 82 ${cx + rx + 10} 100C${cx + 20} 86 ${cx} 86 ${cx - 20} 92Z" fill="#1C1A17" opacity=".35"/>`;
    case 'barkHelm': return cap('#6B4A2B', 92) + (lod >= 2 ? [0, 1, 2, 3].map((k) => `<path d="M${cx - rx + 4 + k * 26} ${98 - k * 4}L${cx - rx + 14 + k * 24} ${cy - ry + 4 + Math.abs(k - 1.5) * 6}" stroke="#4A3420" stroke-width="${1.6 * px}"/>`).join('') : '') + `<path d="M${cx - 18} ${cy - ry - 2}l-8 -18l-6 6M${cx + 20} ${cy - ry - 4}l6 -16l8 4" stroke="#CFC6B4" stroke-width="${Math.max(6, 2.4 * px)}" stroke-linecap="round" fill="none"/>`;
    case 'leafHood': return hood('#4E6B3A', null) + (lod >= 2 ? Array.from({ length: 9 }, (_, k) => { const t = k / 8, x = cx + rx + 10 - t * (rx + 20), y = 104 - Math.sin(t * Math.PI) * 30 + t * 30; return `<ellipse cx="${x}" cy="${y}" rx="9" ry="5" transform="rotate(${-20 + k * 14} ${x} ${y})" fill="#6E8F4E" stroke="#2F4A26" stroke-width="${px}"/>`; }).join('') : '');
    case 'wreath': return Array.from({ length: 11 }, (_, k) => { const a = Math.PI * (1.05 + (k / 10) * 0.95), x = cx + 4 + Math.cos(a) * (rx + 4), y = cy - 22 + Math.sin(a) * 26; return `<ellipse cx="${x}" cy="${y}" rx="10" ry="5" transform="rotate(${(a * 180) / Math.PI + 90} ${x} ${y})" fill="${k % 2 ? '#5E7F45' : '#7FA05A'}" stroke="#2F4A26" stroke-width="${px}"/>`; }).join('');
    case 'twigCirclet': return `<path d="M${cx - rx + 2} 80C${cx - 10} 70 ${cx + 20} 68 ${cx + rx + 3} 76" fill="none" stroke="#5E4630" stroke-width="${Math.max(5, 2 * px)}"/><path d="M${cx - 20} 74l-6 -14M${cx + 4} 70l2 -16M${cx + 28} 70l8 -12" stroke="#5E4630" stroke-width="${Math.max(4, 1.6 * px)}" stroke-linecap="round"/><ellipse cx="${cx + 6}" cy="52" rx="6" ry="3" fill="#7FA05A"/>`;
    case 'antlerHood': return hood('#5E4630', '#3E2E20') + `<path d="M${cx - 22} ${cy - ry + 10}c-10 -20 -28 -30 -46 -40M${cx - 44} ${cy - ry - 12}l-6 -22M${cx + 22} ${cy - ry + 6}c8 -22 22 -34 40 -44M${cx + 44} ${cy - ry - 20}l12 -14" stroke="#1C1A17" stroke-width="${Math.max(10, 3.6 * px)}" stroke-linecap="round" fill="none"/><path d="M${cx - 22} ${cy - ry + 10}c-10 -20 -28 -30 -46 -40M${cx - 44} ${cy - ry - 12}l-6 -22M${cx + 22} ${cy - ry + 6}c8 -22 22 -34 40 -44M${cx + 44} ${cy - ry - 20}l12 -14" stroke="#CFC6B4" stroke-width="${Math.max(7, 2.6 * px)}" stroke-linecap="round" fill="none"/>`;
    case 'helm': {
      const kv = { levy: 0, hunter: 3, mountaineer: 2, reedman: 1 }[outfit] ?? v;
      if (kv === 0) return `<path d="M${cx - rx - 26} 90Q${cx + 4} 70 ${cx + rx + 26} 86L${cx + rx + 22} 94Q${cx + 4} 80 ${cx - rx - 22} 98Z" fill="#7A7670" ${ink}/>` + cap('#8F8C88', 90);
      if (kv === 1) return `<path d="M${cx - rx - 4} 100C${cx - rx} 40 ${cx + 4} 20 ${cx + 10} 18C${cx + 18} 24 ${cx + rx + 6} 50 ${cx + rx + 6} 86L${cx + rx + 6} 92C${cx} 88 ${cx - 30} 96 ${cx - rx - 4} 112Z" fill="#9A958C" ${ink}/><path d="M${cx + rx - 2} 84L${cx + rx + 4} 84L${cx + rx + 6} 120L${cx + rx} 122Z" fill="#9A958C" ${ink}/>`;
      if (kv === 2) return hood('#7A7670', null) + (lod >= 2 ? Array.from({ length: 40 }, (_, k) => `<circle cx="${cx - rx - 10 + (k % 8) * 12}" cy="${60 + Math.floor(k / 8) * 26 + (k % 2) * 6}" r="1.6" fill="#5E5953"/>`).join('') : '');
      return cap('#6B4A2B', 94) + `<path d="M${cx - rx - 4} 108C${cx - 20} 94 ${cx + 10} 88 ${cx + rx + 6} 90" fill="none" stroke="#4A3420" stroke-width="${Math.max(5, 2 * px)}"/>`;
    }
    case 'crown': return `<path d="M${cx - rx + 4} 64L${cx - rx + 2} 28L${cx - rx + 22} 46L${cx - 4} 14L${cx + 14} 42L${cx + 34} 18L${cx + 42} 50L${cx + rx + 2} 30L${cx + rx} 66C${cx + 20} 56 ${cx - 20} 56 ${cx - rx + 4} 64Z" fill="#B8914A" ${ink}/><path d="M${cx - rx + 6} 62C${cx - 20} 54 ${cx + 20} 54 ${cx + rx - 2} 64" fill="none" stroke="#D4B26A" stroke-width="${Math.max(3, 1.2 * px)}"/><circle cx="${cx + 4}" cy="52" r="5" fill="#FD6533" stroke="#1C1A17" stroke-width="${px}"/>`;
  }
  return '';
}
function portraitOf(c, size, extra = {}) {
  const T = PTYPES[c.ptype], side = T.side;
  return portraitSVG({ id: c.id, ptype: c.ptype, hpFrac: c.hp ? c.hp[0] / c.hp[1] : 1, pips: c.pips ?? '', holy: c.holy, prophet: !!c.prophet, pretender: !!c.crown, scout: !!c.scout, stealthy: !!c.stealthy, gear: c.gear, label: cname(c), allegiance: side === 'red' ? 'own' : side === 'green' ? 'other' : 'independent', ...extra }, size);
}
const pspan = (svg) => `<span class="pface">${svg}</span>`;
TIPS['cmd'] = (id) => {
  const c = cmd[id]; const troops = c.squads.reduce((n, s) => n + s[1], 0);
  const rows = c.squads.map((s) => [s[0], `${s[1]} · ${s[2]}% HP`]);
  rows.push([term('morale', 'Morale'), String(c.mor)], [term('leadership', 'Leadership'), `${troops} / ${c.lead}`]);
  const portrait = portraitOf(c, 48);
  const where = `In ${prov[c.at].name} (${TERRAIN[prov[c.at].terrain].name.toLowerCase()}).`; // natural §7: the army card's location line names the terrain
  if (c.side === 'green') return { portrait, title: `${cname(c)}`, value: `${troops} troops`, meaning: `Thornwood. ${where} ${term('inbound', 'Hostile')}: marching on ${prov[c.to].name}, arrives in ${c.eta} days.`, rows: rows.slice(0, 2), proj: 'Our estimate: about 1.1 times Varo\'s army. A guess, not a forecast.' };
  if (c.hp[0] / c.hp[1] <= 0.5) rows.unshift(['Wounded', `${c.hp[0]} / ${c.hp[1]} HP`]);
  return { portrait, title: c.name, value: c.unit, meaning: `${where} Order: ${c.order}.${c.pips ? ' Pips: ' + c.pips + '.' : ''}${c.prophet ? ' The prophet.' : ''}${c.gear ? ` Gear: ${c.gear.n} item (${['', 'common', 'rare', 'artifact'][c.gear.tier]}).` : ''}`, rows };
};

// ------------------------------------------------------------------ tooltips: L1 hover, L2 nested terms, lock
const tips = []; let hoverTimer = null, lockTimer = null, hoverTarget = null;
function resolveTip(key) {
  if (key.startsWith('cmd:')) return TIPS.cmd(key.slice(4));
  if (key.startsWith('prov:')) return provTip(Number(key.slice(5)));
  if (key.startsWith('concept:')) { const [t, m] = CONCEPTS[key.slice(8)]; return { title: t, meaning: m, foot: '<span>Click a term to go deeper</span><span>Ctrl+click Codex</span>' }; }
  if (key.startsWith('raw:')) return RAW[key.slice(4)];
  const f = TIPS[key]; return f ? f() : null;
}
const RAW = {};
function showTip(key, anchorRect, level) {
  const t = resolveTip(key); if (!t) return;
  while (tips.length > level) tips.pop().el.remove();
  const el = document.createElement('div'); el.className = 'tip'; el.innerHTML = tipHTML(t); el.dataset.key = key;
  app.appendChild(el);
  const ar = app.getBoundingClientRect();
  const w = el.offsetWidth, h = el.offsetHeight;
  let x, y;
  if (level === 0) { x = anchorRect.left - ar.left; y = anchorRect.bottom - ar.top + 8; if (y + h > ar.height - 6) y = anchorRect.top - ar.top - h - 8; }
  else { x = anchorRect.right - ar.left + 10; y = anchorRect.top - ar.top - 10; if (x + w > ar.width - 6) x = anchorRect.left - ar.left - w - 10; }
  x = Math.max(6, Math.min(x, ar.width - w - 6)); y = Math.max(46, Math.min(y, ar.height - h - 6));
  el.style.left = x + 'px'; el.style.top = y + 'px';
  tips.push({ el, key, locked: false });
  // lock after 0.8 s so the pointer can travel into the tooltip and reach its terms
  clearTimeout(lockTimer);
  requestAnimationFrame(() => el.classList.add('locking'));
  lockTimer = setTimeout(() => lockTop(), 800);
  el.addEventListener('mouseleave', (e) => { if (!tips.some((x) => x.el.contains(e.relatedTarget)) && !(hoverTarget && hoverTarget.contains(e.relatedTarget))) closeFrom(tips.findIndex((x) => x.el === el)); });
  el.querySelectorAll('[data-go]').forEach((l) => l.addEventListener('click', () => { closeAll(); selectProv(Number(l.dataset.go)); }));
  el.querySelectorAll('.term').forEach((tm) => {
    tm.addEventListener('mouseenter', () => { if (tips.length >= 3 && tips.findIndex((x) => x.el === el) >= 2) return; clearTimeout(hoverTimer); hoverTimer = setTimeout(() => showTip('concept:' + tm.dataset.concept, tm.getBoundingClientRect(), tips.findIndex((x) => x.el === el) + 1), 250); });
    tm.addEventListener('click', (e) => { if (e.ctrlKey || e.metaKey) openCodex(tm.dataset.concept); });
  });
}
function lockTop() { const t = tips.at(-1); if (t) { t.locked = true; t.el.classList.add('locked'); } }
function closeFrom(i) { if (i < 0) return; while (tips.length > i) tips.pop().el.remove(); }
function closeAll() { clearTimeout(hoverTimer); clearTimeout(lockTimer); closeFrom(0); }
function bindTips(root) {
  root.addEventListener('mouseover', (e) => {
    const t = e.target.closest('[data-tip]'); if (!t || t === hoverTarget || tips.some((x) => x.el.contains(t))) return;
    hoverTarget = t; clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => showTip(t.dataset.tip, t.getBoundingClientRect(), 0), 400);
  });
  root.addEventListener('mouseout', (e) => {
    const t = e.target.closest('[data-tip]'); if (!t || t.contains(e.relatedTarget)) return;
    if (tips.some((x) => x.el.contains(e.relatedTarget))) return;
    clearTimeout(hoverTimer); hoverTarget = null;
    if (!(tips[0] && tips[0].locked && tips[0].el.matches(':hover'))) closeAll();
  });
  root.addEventListener('focusin', (e) => { const t = e.target.closest('[data-tip]'); if (t) showTip(t.dataset.tip, t.getBoundingClientRect(), 0); });
  root.addEventListener('focusout', () => closeAll());
}
bindTips(app);

// ------------------------------------------------------------------ alerts ribbon
const TIER = {
  urgent: (c) => `<svg width="30" height="30" viewBox="0 0 30 30"><path d="M10 2h10l8 8v10l-8 8H10l-8-8V10z" fill="${c}" stroke="rgba(0,0,0,.5)"/>`,
  important: (c) => `<svg width="30" height="30" viewBox="0 0 30 30"><path d="M15 2l13 25H2z" fill="${c}" stroke="rgba(0,0,0,.5)"/>`,
  opportunity: (c) => `<svg width="30" height="30" viewBox="0 0 30 30"><circle cx="15" cy="15" r="13" fill="${c}" stroke="rgba(0,0,0,.5)"/>`,
  hint: (c) => `<svg width="30" height="30" viewBox="0 0 30 30"><rect x="2" y="2" width="26" height="26" rx="7" fill="${c}" stroke="rgba(0,0,0,.5)"/>`,
};
const ALERTS = [
  { id: 'inbound', tier: 'urgent', color: 'var(--urgent)', glyph: 'sword', title: 'Hostile armies inbound', cases: [[`Ilsa Oakhand (52) → <b>Ashfen</b>, ${cmd.ilsa.eta} days`, () => selectCmd('ilsa')]], meaning: 'A visible enemy march ends where you have troops. Battles resolve the moment armies meet.' },
  { id: 'enemydom', tier: 'important', color: 'var(--important)', glyph: 'candle', title: 'Enemy dominion in your land', cases: [['<b>Ashfen</b>: Thornwood 2', () => selectProv(ashfen)]], meaning: 'Their scales apply here and unrest rises. Preach or build a temple to push back.' },
  { id: 'idle', tier: 'important', color: 'var(--important)', glyph: 'hold', title: 'Idle commanders', cases: [['<b>The Ashen Titan</b> in Kharnath, could lead an army', () => selectCmd('titan')], ['<b>Kesh</b> (scout), idle', () => selectCmd('kesh')]], meaning: 'Commanders without an order. Guard tells the game a wait is on purpose.' },
  { id: 'well', tier: 'opportunity', color: 'var(--opportunity)', glyph: 'well', title: 'Wellspring claimable', cases: [['<b>Sunmere</b> is yours and unclaimed. A priest claims it in 10 days.', () => selectProv(ownWell)]], meaning: 'Claim 2 of 3 Wellsprings to win.' },
  { id: 'hint', tier: 'hint', color: 'var(--hint)', glyph: 'codex', title: 'Moving armies', cases: [['Select an army, then right-click a province.', () => selectCmd('varo')]], meaning: 'The path and its arrival day show before you commit.' },
];
const ribbon = document.getElementById('ribbon');
function renderAlerts() {
  ribbon.innerHTML = '';
  ALERTS.forEach((a, k) => {
    if (a.dismissed) return;
    const b = document.createElement('button'); b.className = 'alert' + (a.tier === 'urgent' && !a.seen ? ' pulse' : ''); a.seen = true;
    b.innerHTML = TIER[a.tier](a.color) + `<g transform="translate(7 ${a.tier === 'important' ? 10 : 7}) scale(.67)" fill="none" stroke="#1C1A17" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${ICON[a.glyph]}</g></svg><span class="count">${a.cases.length}</span>`;
    b.setAttribute('aria-label', `${a.title}, ${a.cases.length}`);
    RAW['alert' + k] = { title: a.title, meaning: a.meaning, rows: a.cases.map((c) => [c[0], '']), foot: '<span>Click go · Right-click dismiss · Shift+right-click mute</span><span></span>' };
    b.dataset.tip = 'raw:alert' + k;
    let cycle = 0;
    b.addEventListener('click', () => { closeAll(); a.cases[cycle % a.cases.length][1](); cycle++; });
    b.addEventListener('contextmenu', (e) => { e.preventDefault(); closeAll(); a.dismissed = true; renderAlerts(); toast(`${a.title}: dismissed until it changes${e.shiftKey ? ' (muted for this game)' : ''}.`); });
    ribbon.appendChild(b);
  });
}
// ------------------------------------------------------------------ outliner and messages
const outliner = document.getElementById('outliner');
const SECTIONS = [
  { key: 'pinned', title: 'Pinned', open: true, rows: () => [['well', 'Sunmere', 'Wellspring', () => selectProv(ownWell)]] },
  { key: 'armies', title: 'Armies', open: true, rows: () => [['cmd:varo', `Varo · ${cmd.varo.order} · ${names[cmd.varo.at]}`, '48', () => selectCmd('varo')]].concat(cmd.dravik.hidden ? [] : [['cmd:dravik', `Dravik · ${cmd.dravik.order} · ${names[cmd.dravik.at]}`, '52', () => selectCmd('dravik')]]) },
  { key: 'pretender', title: 'Pretender', open: true, rows: () => [['cmd:titan', `The Ashen Titan · ${cmd.titan.order}`, 'Kharnath', () => selectCmd('titan')]] },
  { key: 'mages', title: 'Mages', open: true, rows: () => [['cmd:seren', 'Seren · Researching', 'L2', () => selectCmd('seren')]] },
  { key: 'priests', title: 'Priests', open: true, rows: () => [['cmd:ondra', `Ondra · ${cmd.ondra.prophet ? 'Prophet' : 'Preaching'}`, 'holy 2', () => selectCmd('ondra')]] },
  { key: 'scouts', title: 'Scouts', open: false, rows: () => [['cmd:kesh', 'Kesh · Idle', names[scoutAt], () => selectCmd('kesh')]] },
  { key: 'provinces', title: 'Provinces', open: true, rows: () => [['fist', `Ashfen · unrest ${prov[ashfen].unrest} · ${prov[ashfen].owner !== 'red' ? 'lost to Thornwood' : prov[ashfen].dom.n === 'green' ? 'enemy dominion' : 'faith restored'}`, '', () => selectProv(ashfen)]] },
  { key: 'acts', title: 'Activities', open: false, rows: () => [['fort', 'Kharnath recruits 10 Cinder Warriors', '6d', () => selectProv(redCap)], ['book', 'Research Ember L3', '47d', () => openResearch()]] },
  { key: 'wells', title: 'Wellsprings', open: true, rows: () => wells.map((w) => ['well', names[w] + ' · independent', '', () => selectProv(w)]).concat([['well', 'Sunmere · yours', wellClaimed() ? 'claimed' : prov[ownWell].claim ? 'claiming' : 'unclaimed', () => selectProv(ownWell)]]) },
];
function renderOutliner() {
  outliner.innerHTML = '';
  for (const s of SECTIONS) {
    const rows = s.rows();
    const sec = document.createElement('div'); sec.className = 'osec';
    sec.innerHTML = `<button aria-expanded="${s.open}"><span>${s.open ? '▾' : '▸'}</span>${s.title}<span class="cnt">${rows.length}</span></button>`;
    sec.firstChild.addEventListener('click', () => { s.open = !s.open; renderOutliner(); });
    if (s.open) for (const [ic, nm, meta, go] of rows) {
      const r = document.createElement('div'); r.className = 'orow'; r.tabIndex = 0;
      r.innerHTML = `${ic.startsWith('cmd:') ? `<span class="pdot">${portraitOf(cmd[ic.slice(4)], 24)}</span>` : `<span style="color:var(--dim);display:inline-flex;justify-content:center">${svgIcon(ic, 16)}</span>`}<span class="nm">${nm}</span><span class="meta">${meta}</span>`;
      r.addEventListener('click', go); r.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
      sec.appendChild(r);
    }
    outliner.appendChild(sec);
  }
}
const MSGS = [
  { cat: 'Battles', icon: 'sword', when: 'M3 D12', html: `Victory at <span class="link" data-go="${morholt}">${names[morholt]}</span>: Varo routs 22 independents. We lose 4.`, battle: true },
  { cat: 'Military', icon: 'shield', when: 'M3 D12', html: `<span class="link" data-go="${morholt}">${names[morholt]}</span> is ours.` },
  { cat: 'Military', icon: 'sword', when: 'M3 D11', html: `Thornwood army sighted at <span class="link" data-go="${greenFrom}">${names[greenFrom]}</span>.` },
  { cat: 'Dominion', icon: 'candle', when: 'M2 D30', html: `<span class="link" data-go="${ashfen}">Ashfen</span> is now under the dominion of Thornwood.` },
  { cat: 'Economy', icon: 'fort', when: 'M2 D24', html: '10 Flame Archers recruited in <span class="link" data-go="' + redCap + '">Kharnath</span>.' },
  { cat: 'Magic', icon: 'book', when: 'M2 D18', html: 'Ember research reaches level 2: Warcry.' },
  { cat: 'Economy', icon: 'fort', when: 'M2 D09', html: 'Temple completed in <span class="link" data-go="' + redCap + '">Kharnath</span>.' },
];
const chips = document.getElementById('chips'), msgs = document.getElementById('msgs');
function renderFeed() {
  chips.innerHTML = ['All', 'Battles', 'Military', 'Economy', 'Magic', 'Dominion'].map((c) => `<button class="chip ${state.filter === c ? 'on' : ''}" data-c="${c}">${c}</button>`).join('');
  chips.querySelectorAll('.chip').forEach((b) => b.addEventListener('click', () => { state.filter = b.dataset.c; renderFeed(); }));
  msgs.innerHTML = '';
  MSGS.filter((m) => state.filter === 'All' || m.cat === state.filter).forEach((m) => {
    const r = document.createElement('div'); r.className = 'msg';
    r.innerHTML = `<span style="color:var(--dim);display:inline-flex">${svgIcon(m.icon, 16)}</span><span class="when">${m.when}</span><span>${m.html}</span><span class="acts">${m.battle ? '<button data-a="report">Report</button><button data-a="watch">Watch ▸</button>' : ''}<button data-a="gear" aria-label="Message settings">⚙</button></span>`;
    r.querySelectorAll('[data-go]').forEach((l) => l.addEventListener('click', () => selectProv(Number(l.dataset.go))));
    r.querySelector('[data-a="gear"]').addEventListener('click', () => toast(`${m.cat} messages: Display = Feed, Pause = off. Change it here or in Settings → Messages.`));
    if (m.battle) { r.querySelector('[data-a="report"]').addEventListener('click', openReport); r.querySelector('[data-a="watch"]').addEventListener('click', openReport); }
    msgs.appendChild(r);
  });
}

// ------------------------------------------------------------------ selection: province panel and commander strip
const leftDock = document.getElementById('leftDock'), strip = document.getElementById('strip');
let provTab = 'Overview';
function selectProv(i) {
  if (isWild(i)) { clearSel(); return; }
  state.sel = { type: 'prov', id: i }; state.targeting = false; app.classList.remove('strip-on'); moveLine = null; updateDeco();
  renderProvince(); draw(); renderOutlinerSel();
}
function renderOutlinerSel() {}
function statRow(icon, label, val, delta, tipKey, cls = '') {
  return `<div class="stat" ${tipKey ? `data-tip="${tipKey}"` : ''}><span style="color:var(--dim);display:inline-flex">${svgIcon(icon, 17)}</span><span class="lbl">${label}</span><span class="val">${val}</span><span class="dl ${cls}">${delta ?? ''}</span></div>`;
}
function renderProvince() {
  const p = prov[state.sel.id];
  const own = p.owner === 'red';
  leftDock.hidden = false;
  const ownerName = p.owner === 'red' ? 'Cinder Horde' : p.owner === 'green' ? 'Thornwood' : 'Independent';
  const supply = Math.round(({ plains: 60, farmland: 80, forest: 50, hills: 40, mountains: 20, swamp: 30, wasteland: 15 })[p.terrain] + p.pop / 50);
  const gold = Math.round(p.pop / 100 * (p.unrest ? 1 - p.unrest / 200 : 1));
  RAW.pGold = { title: `Gold from ${p.name}`, value: `+${gold} /mo`, rows: [['Population ÷ 100', String(Math.round(p.pop / 100))], [term('taxrate', 'Tax rate') + ' Normal', '×1.0'], ['Turmoil 2', '−4%'], [term('unrest', 'Unrest') + ` ${p.unrest}`, `−${Math.round(p.unrest / 2)}%`], ['Net', `+${gold} /mo`, 'total']] };
  RAW.pSupply = { title: `Supply in ${p.name}`, value: `${p.i === ashfen ? 50 : 0} / ${supply}`, meaning: `Food for armies standing here each day.`, rows: [[`${TERRAIN[p.terrain].name} base`, String(({ plains: 60, farmland: 80, forest: 50, hills: 40, mountains: 20, swamp: 30, wasteland: 15 })[p.terrain])], ['Population ÷ 50', String(Math.round(p.pop / 50))], ['Varo\'s army eats', p.i === ashfen ? '−50' : '0'], ['Left over', String(supply - (p.i === ashfen ? 50 : 0)), 'total']] };
  RAW.pUnrest = { title: `Unrest in ${p.name}`, value: String(p.unrest), meaning: CONCEPTS.unrest[1], rows: [['Enemy dominion (Thornwood 2)', '+0.7 /mo'], ['Garrison and priests', '−1.0 /mo'], ['Trend', '−0.3 /mo', 'total']], proj: p.unrest > 25 ? 'Above 50 recruiting stops here.' : null };
  RAW.pPop = { title: 'Population', value: fmt(p.pop), rows: [['Growth', '+0.4% /mo'], ['Recruits waiting', '0', 'more']] };
  RAW.taxLow = { title: 'Tax: Low', rows: [['Gold', `−${Math.round(gold * 0.5)} /mo`], [term('unrest', 'Unrest'), '−2 /mo']] };
  RAW.taxNormal = { title: 'Tax: Normal', meaning: 'The default rate.' };
  RAW.taxHigh = { title: 'Tax: High', rows: [['Gold', `+${Math.round(gold * 0.5)} /mo`], [term('unrest', 'Unrest'), '+4 /mo']], proj: `Unrest would reach 50 in about ${Math.max(1, Math.round((50 - p.unrest) / 4))} months.` };
  RAW.pd = { title: `${term('pd', 'Provincial defense')} ${p.pd}`, rows: [[`Level ${p.pd + 1}`, `${(p.pd + 1) * 15} gold`], ['Fields', `${(p.pd + 1) * 2} militia, ${Math.floor((p.pd + 1) / 5)} archers`]], foot: '<span>Shift+click buys 5 levels</span><span></span>' };
  RAW.temple = { title: 'Build a Temple', rows: [['Gold', '200'], ['Days', '30'], ['Builder', `Kesh (scout) walks here: 3 days`]], proj: '+1 dominion check a month; priests preach better here.' };
  RAW.claim = { title: 'Claim this Wellspring', why: 'No priest stands here. Ondra could walk from Kharnath in 9 days.' };
  const scale = (l, r, v) => `<div class="scale"><span>${l}</span><div class="bar"><i style="left:calc(${50 + v * 16.6}% - 2px)"></i></div><span>${r}</span></div>`;
  let body = '';
  if (provTab === 'Overview') {
    body += `<div class="section"><h3>Province</h3>${statRow('pop', 'Population', fogOf(p.i) === 'unexplored' ? 'unknown' : fmt(p.pop), fogOf(p.i) === 'unexplored' ? 'not yet painted' : '▲0.4%', 'raw:pPop', 'up')}${own ? statRow('gold', 'Gold', `+${gold}`, '/mo', 'raw:pGold') : ''}${statRow('supply', 'Supply', `${p.i === ashfen ? 50 : 0} / ${supply}`, 'eaten / given', 'raw:pSupply')}${statRow('fist', 'Unrest', String(p.unrest), p.unrest > 25 ? '▼0.3/mo' : '', 'raw:pUnrest', 'down')}${own && p.buildings.includes('fort') ? statRow('anvil', 'Materials', '212 / 360', '▲60/mo', 'materials', 'up') : ''}</div>`;
    if (own) {
      body += `<div class="section"><h3>Orders</h3><div class="row" style="justify-content:space-between"><span class="dimtxt">${term('taxrate', 'Tax rate')}</span><div class="seg" role="group" aria-label="Tax rate"><button data-tip="raw:taxLow">Low</button><button class="on" data-tip="raw:taxNormal">Normal</button><button data-tip="raw:taxHigh">High</button></div></div>
        <div class="row" style="justify-content:space-between;margin-top:8px"><span class="dimtxt">${term('pd', 'Defense')} level <b class="num" style="color:var(--text)">${p.pd}</b></span><button class="btn" data-tip="raw:pd" id="pdBtn">+1 PD <span class="cost">${(p.pd + 1) * 15}g</span></button></div></div>`;
      body += `<div class="section"><h3>Buildings</h3>${['fort', 'temple', 'lab'].map((b) => p.buildings.includes(b) ? `<div class="building"><span style="color:var(--dim);display:inline-flex">${svgIcon(b, 17)}</span><span>${b[0].toUpperCase() + b.slice(1)}</span><span class="dimtxt">built</span></div>` : b === 'fort' ? `<div class="building" style="opacity:.6"><span style="display:inline-flex;color:var(--dim)">${svgIcon('fort', 17)}</span><span>Fort</span><span class="dimtxt">capitals only</span></div>` : `<div class="building"><span style="color:var(--dim);display:inline-flex">${svgIcon(b, 17)}</span><span>${b[0].toUpperCase() + b.slice(1)}</span><button class="btn" data-tip="raw:${b === 'temple' ? 'temple' : 'temple'}">Build <span class="cost">${b === 'temple' ? '200g · 30d' : '300g · 30d'}</span></button></div>`).join('')}</div>`;
    }
    body += `<div class="section"><h3>${term('scales', 'Scales')} here <span style="text-transform:none;letter-spacing:0;font-weight:400">(${p.dom.n ? (p.dom.n === 'red' ? 'Cinder Horde' : 'Thornwood') + ' ' + p.dom.s : 'no dominion'})</span></h3>${p.dom.n === 'red' ? scale('Order', 'Turmoil', p.dom.s >= 4 ? 1 : 0) + scale('Lore', 'Fury', p.dom.s >= 2 ? 1 : 0) : p.dom.n === 'green' ? scale('Growth', 'Rot', -1) + scale('Wild', 'Artifice', -0) : ''}${scale('Sanctity', 'Dread', 0)}</div>`;
    const bwp = wildsBordering(p.i); if (bwp.length) body += `<div class="section"><h3>${term('impassable', 'Impassable')} neighbors</h3><p style="margin:0;color:var(--dim);font-size:13.5px">Borders ${bwp.map((w) => `<b style="color:var(--text);font-weight:500">${w.name.replace('The ', 'the ')}</b>`).join(' and ')}. Armies go around it.</p></div>`;
    if (p.well) body += `<div class="section"><h3>${term('wellspring', 'Wellspring')}</h3><div class="row" style="justify-content:space-between"><span>${p.i === ownWell ? 'Unclaimed. Claim 2 of 3 to win.' : 'Held by independents (strong).'}</span>${p.i === ownWell ? '<button class="btn" aria-disabled="true" data-tip="raw:claim">Claim</button>' : ''}</div></div>`;
  } else if (provTab === 'Recruit') {
    const units = [['Ash Militia', 8, 3, 8, [10, 10, 9, 9, 0], ''], ['Cinder Warrior', 12, 8, 10, [10, 11, 11, 10, 3], ''], ['Flame Archer', 13, 6, 10, [10, 10, 10, 9, 1], 'ranged'], ['Berserker', 18, 10, 12, [13, 13, 12, 7, 2], 'berserk'], ['Ash Rider', 28, 18, 14, [12, 11, 11, 11, 4], 'mounted'], ['Flamebrand', 32, 14, 16, [13, 13, 12, 11, 6], 'sacred']];
    body += `<div class="section"><h3>Recruit at Kharnath · batch <span class="seg" style="vertical-align:middle;text-transform:none"><button class="on">10</button><button>20</button></span></h3><div class="cards">${units.map(([n, g, m, d, s, tag], k) => { RAW['u' + k] = { title: n, value: tag || 'infantry', rows: [['HP', s[0]], ['Strength', s[1]], ['Attack', s[2]], ['Defense', s[3]], ['Protection', s[4]], [term('morale', 'Morale'), 10 + k % 3], [term('upkeep', 'Upkeep'), `${Math.round(g / 6)} /mo`]], proj: `10 cost ${g * 10} gold and ${m * 10} materials; ready in ${d} days.` }; return `<button class="ucard" data-tip="raw:u${k}"><div class="band"><span>${n}</span><span class="num">${tag ? '◆' : ''}</span></div><div class="body"><div class="stats"><span>HP<b>${s[0]}</b></span><span>Att<b>${s[2]}</b></span><span>Def<b>${s[3]}</b></span><span>Prot<b>${s[4]}</b></span></div><div class="costs"><span>${g * 10}g</span><span>${m * 10}m</span><span>${d}d</span></div></div></button>`; }).join('')}</div></div>
      <div class="section"><h3>Queue</h3><div class="queue"><div class="qitem"><span>10 Cinder Warriors</span><span class="num dimtxt">6d</span><div class="prog"><i style="width:40%"></i></div></div><div class="qitem"><span>Ember Adept</span><span class="num dimtxt">waits</span><div class="prog"><i style="width:0"></i></div></div></div></div>`;
  } else if (provTab === 'Forces') {
    const here = Object.values(cmd).filter((c) => c.at === p.i && !c.hidden);
    body += `<div class="section"><h3>Commanders here</h3>${here.length ? here.map((c) => `<div class="orow" data-c="${c.id}" style="padding-left:6px;grid-template-columns:52px 1fr auto;min-height:50px"><span class="pface">${portraitOf(c, 40)}</span><span class="nm">${cname(c)}</span><span class="meta">${c.squads.reduce((n, s) => n + s[1], 0)}</span></div>`).join('') : '<p class="dimtxt" style="margin:0">None.</p>'}</div>${p.buildings.includes('fort') ? '<div class="section"><h3>Garrison</h3><div class="orow" style="padding-left:6px"><span></span><span class="nm">20 Ash Militia</span><span class="meta">reserve</span></div></div>' : ''}`;
  } else {
    body += `<div class="section"><h3>History</h3>${MSGS.filter((m) => m.html.includes(p.name)).map((m) => `<div class="msg" style="padding-left:0"><span style="color:var(--dim);display:inline-flex">${svgIcon(m.icon, 16)}</span><span class="when">${m.when}</span><span>${m.html}</span></div>`).join('') || '<p class="dimtxt" style="margin:0">Nothing has happened here yet.</p>'}</div>`;
  }
  const tabs = own && p.buildings.includes('fort') ? ['Overview', 'Recruit', 'Forces', 'History'] : ['Overview', 'Forces', 'History'];
  if (!tabs.includes(provTab)) provTab = 'Overview';
  leftDock.innerHTML = `<div class="dockhead"><span class="banner">${p.owner ? `<svg width="20" height="26" viewBox="0 0 22 28"><path d="M1 1h20v20l-10 6-10-6z" fill="${BAN[p.owner]}"/></svg>` : ''}</span><div style="min-width:0;flex:1"><h2>${p.name}</h2><div class="sub">${terrainChip(p.terrain)} · ${ownerName}${p.cap ? ' · capital' : ''}</div></div><button class="iconbtn" aria-label="Pin" data-tip="raw:pin">⚲</button><button class="iconbtn" id="closeDock" aria-label="Close">✕</button></div>
    <div class="tabs" role="tablist">${tabs.map((t) => `<button class="tab" role="tab" aria-selected="${t === provTab}">${t}</button>`).join('')}</div><div class="dockbody">${body}</div>`;
  RAW.pin = { title: 'Pin to the outliner', foot: '<span>Key P</span><span></span>' };
  leftDock.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => { provTab = b.textContent; renderProvince(); }));
  leftDock.querySelector('#closeDock').addEventListener('click', clearSel);
  leftDock.querySelectorAll('[data-c]').forEach((r) => r.addEventListener('click', () => selectCmd(r.dataset.c)));
  const pdBtn = leftDock.querySelector('#pdBtn');
  if (pdBtn) pdBtn.addEventListener('click', (e) => { const n = e.shiftKey ? 5 : 1; let cost = 0; for (let k = 0; k < n; k++) cost += (p.pd + 1 + k) * 15; if (cost > state.gold) { toast('Not enough gold.'); return; } state.gold -= cost; p.pd += n; toast(`${p.name}: defense ${p.pd} (−${cost} gold).`); renderProvince(); updateTop(); });
  leftDock.querySelectorAll('.seg button').forEach((b) => b.addEventListener('click', () => { b.parentElement.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); }));
  leftDock.querySelectorAll('.ucard').forEach((b) => b.addEventListener('click', () => toast(`Queued 10 ${b.querySelector('.band span').textContent}s at Kharnath.`)));
}
function selectCmd(id) {
  const c = cmd[id]; state.sel = { type: 'cmd', id }; state.targeting = true; moveLine = null; updateDeco();
  leftDock.hidden = true; app.classList.add('strip-on');
  const troops = c.squads.reduce((n, s) => n + s[1], 0);
  const orders = c.side === 'red' ? [
    ['Idle', null], ['Guard', null], ['Pillage', c.squads.length ? null : 'Needs troops to pillage.'], ['Research', c.pips && !c.crown ? null : c.crown ? 'The Titan cannot research.' : 'Not a mage: no color pips.'],
    ['Preach', c.holy ? null : 'Not a priest: no holy pips.'], ['Claim', c.holy ? 'Stand in an owned Wellspring to claim it.' : 'Not a priest: no holy pips.'], ['Make Prophet', c.crown ? 'The pretender cannot be its own prophet.' : null],
  ] : [];
  orders.forEach(([o, why], k) => { RAW['ord' + k] = why ? { title: o, why } : { title: o, meaning: ({ Idle: 'Waits for orders.', Guard: 'Holds here on purpose; it stays out of the idle alert.', Pillage: 'Takes 2% of the people a day as gold. Unrest +5 a day.', Research: 'Earns research points in a lab.', Preach: 'Spreads dominion: one check per holy pip, +1 at a temple.', 'Make Prophet': 'Holy 3, +1 morale, your bless, one dominion check. One prophet at a time.' })[o] }; });
  const slot = (g) => `<span class="slot" style="color:${g === 'bolt' ? 'var(--red)' : 'var(--dim)'}">${svgIcon(g, 15)}</span>`;
  RAW.script = !c.script ? { title: `${term('script', 'Script')}`, meaning: 'Hidden. You learn an enemy commander\'s plan by fighting it.' } : { title: `${term('script', 'Script')}`, rows: c.script.map((g, k) => [`Round ${k + 1}`, ({ hold: 'Hold', sword: 'Attack', bolt: 'Cast (best spell)' })[g]]).concat([['Round 6 on', 'repeats round 5']]), proj: 'Click to open the Battle Plan.' };
  const psize = app.classList.contains('phone') ? 48 : 64;
  strip.innerHTML = `<div class="portrait" data-tip="cmd:${c.id}">${pspan(portraitOf(c, psize))}<div class="hp" style="width:${psize}px"><i style="width:${(c.hp[0] / c.hp[1]) * 100}%"></i></div><span class="num dimtxt" style="font-size:12px">${c.hp[0]}/${c.hp[1]} HP</span></div>
    <div class="sinfo"><div class="name">${c.name}<span class="dimtxt" style="font:14px var(--font-body)">${c.crown ? ' · ' + c.unit : ', ' + c.unit}${c.pips ? ' · ' + [...c.pips].map(() => manaSym('R', 14)).join('') : ''}</span></div>
      <div class="squads">${c.squads.length ? c.squads.map((s) => `<span class="sq"><b class="num">${s[1]}</b> ${s[0]} <span class="dimtxt num">${s[2]}%</span></span>`).join('') : '<span class="dimtxt" style="font-size:13.5px">Leads no troops.</span>'}</div>
      <div class="script" data-tip="raw:script" tabindex="0">${c.script ? c.script.map(slot).join('') + '<span class="dimtxt" style="font-size:12.5px;margin-left:4px">Battle plan ▸</span>' : '<span class="dimtxt" style="font-size:12.5px">Battle plan unknown</span>'}</div></div>
    <div class="orders">${orders.map(([o, why], k) => `<button class="btn" data-tip="raw:ord${k}" ${why ? 'aria-disabled="true"' : ''} style="${c.order === o ? 'background:#5A5146;' : ''}">${o}</button>`).join('')}${c.side === 'red' && (c.pips) ? '<button class="btn nav" data-tip="raw:cast">Cast ▸</button>' : ''}${c.side === 'green' ? `<span class="dimtxt">Thornwood's army. You see it because it marches next to your land.</span>` : ''}</div>
    <div class="eta">${c.eta ? `<span class="dimtxt" style="font-size:12.5px">arrives in</span><span class="big">${c.eta}d</span>` : c.side === 'red' ? `<span class="dimtxt" style="font-size:12.5px">${app.classList.contains('phone') ? 'Long-press' : 'Right-click'} a province to move</span>` : ''}</div>`;
  RAW.cast = { title: 'Rituals', meaning: 'Opens this mage\'s rituals with their costs and targets.', foot: '<span>Key C</span><span></span>' };
  strip.querySelectorAll('.orders .btn:not(.nav)').forEach((b) => b.addEventListener('click', () => { if (b.getAttribute('aria-disabled') === 'true') return; c.order = b.textContent; selectCmd(id); toast(`${c.name}: ${c.order}.`); renderOutliner(); }));
  if (c.script) strip.querySelector('.script').addEventListener('click', () => toast('The Battle Plan sheet opens over the map: rows, squads, five script slots, copy and paste to all.'));
  const castBtn = strip.querySelector('.nav'); if (castBtn) castBtn.addEventListener('click', () => toast('Rituals tab: castable rituals with mana costs; pick a target on the map.'));
  draw();
}
function clearSel() { state.sel = null; state.targeting = false; updateDeco(); moveLine = null; leftDock.hidden = true; app.classList.remove('strip-on'); draw(); }

// ------------------------------------------------------------------ map input
const cursorLbl = document.getElementById('cursorLbl');
function showCursorLbl(text, cx, cy) { const ar = app.getBoundingClientRect(); cursorLbl.textContent = text; cursorLbl.style.left = cx - ar.left + 16 + 'px'; cursorLbl.style.top = cy - ar.top - 30 + 'px'; cursorLbl.classList.add('show'); canvas.classList.add('nogo'); }
function hideCursorLbl() { cursorLbl.classList.remove('show'); canvas.classList.remove('nogo'); }
const inMap = (x, y) => (RELIEF() ? inModel(x, y) : x >= 0 && y >= 0 && x <= W && y <= H); // v4: the model's rounded corners
const theName = (w) => w.name.replace('The ', 'the ');
let drag = false, dragMoved = 0;
canvas.addEventListener('mousemove', (e) => {
  const r = canvas.getBoundingClientRect(); const [x, y] = toWorld(e.clientX - r.left, e.clientY - r.top);
  if (drag) { cam.x += e.movementX; cam.y += e.movementY; clampCam(); dragMoved += Math.abs(e.movementX) + Math.abs(e.movementY); hideCursorLbl(); requestDraw(); return; }
  if (!inMap(x, y)) { if (hoverProv !== -1) { hoverProv = -1; requestDraw(); closeAll(); } hideCursorLbl(); return; }
  const i = provinceAt(x, y);
  const army = state.sel && state.sel.type === 'cmd' && cmd[state.sel.id].side === 'red';
  if (isWild(i) && army) showCursorLbl('✕ Impassable: ' + theName(wildOf[i]), e.clientX, e.clientY); else hideCursorLbl();
  if (i !== hoverProv) {
    hoverProv = i; requestDraw(); closeAll(); clearTimeout(hoverTimer);
    const sx = e.clientX, sy = e.clientY;
    hoverTimer = setTimeout(() => { if (hoverProv === i) showTip('prov:' + i, { left: sx + 14, right: sx + 14, top: sy + 6, bottom: sy + 6 }, 0); }, 500);
  }
});
canvas.addEventListener('mouseleave', (e) => { // a province tooltip closes when the pointer leaves the map, unless it went into the tooltip
  const ontoPiece = !!(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.mini')); // v4: a drag keeps panning across the army pieces
  hoverProv = -1; if (!ontoPiece) drag = false; hideCursorLbl(); requestDraw();
  if (tips.length && tips[0].key.startsWith('prov:') && !tips.some((x) => x.el.contains(e.relatedTarget))) closeAll(); else if (!tips.length) clearTimeout(hoverTimer);
});
canvas.addEventListener('mousedown', (e) => { if (e.button === 0) { drag = true; dragMoved = 0; } });
window.addEventListener('mouseup', () => { drag = false; });
window.addEventListener('mousemove', (e) => { // v4: a drag that starts on, or passes over, an army piece pans the map like a drag on the land
  if (!drag || e.target === canvas) return;
  if (!(e.target.closest && e.target.closest('.mini'))) { drag = false; return; }
  cam.x += e.movementX; cam.y += e.movementY; clampCam(); dragMoved += Math.abs(e.movementX) + Math.abs(e.movementY); hideCursorLbl(); requestDraw();
});
canvas.addEventListener('click', (e) => {
  if (dragMoved > 6) return;
  const r = canvas.getBoundingClientRect(); const [x, y] = toWorld(e.clientX - r.left, e.clientY - r.top);
  if (!inMap(x, y)) { clearSel(); return; } // bare table and the props are inert: a click clears the selection
  closeAll(); const i = provinceAt(x, y); if (isWild(i)) { clearSel(); return; } selectProv(i);
});
canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); if (e.pointerType !== 'touch') orderMove(e.clientX, e.clientY); });
function orderMove(cx, cy, at) { // at: a province given directly (v4: a right-click or long-press on an army piece targets the piece's province)
  if (!state.sel || state.sel.type !== 'cmd') { toast(`Select one of your armies first, then ${app.classList.contains('phone') ? 'long-press' : 'right-click'} where it should go.`); return; }
  const c = cmd[state.sel.id]; if (c.side !== 'red') return;
  let i = at;
  if (i == null || i < 0) { const r = canvas.getBoundingClientRect(); const [x, y] = toWorld(cx - r.left, cy - r.top); if (!inMap(x, y)) return; i = provinceAt(x, y); }
  if (isWild(i)) { toast(`No path crosses ${theName(wildOf[i])}.`); return; }
  if (i === c.at) return;
  const d = pathTo(c.at, i);
  if (!d) { toast(noPathText(c, i)); return; }
  const bw = barrierOnLine(c.at, i);
  moveLine = { from: c.at, path: d.path, days: d.days, around: bw ? theName(bw) : null }; c.order = 'Move';
  closeAll(); draw(); toast(`${c.name} marches to ${prov[i].name}: ${d.days} days${bw ? ', around ' + theName(bw) : ''}.`);
}
// touch: one finger pans, two fingers pinch, a still long-press orders a march
const touches = new Map(); let pinch = null, pressTimer = null;
canvas.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'touch') return;
  touches.set(e.pointerId, { x: e.clientX, y: e.clientY }); dragMoved = 0; clearTimeout(pressTimer); const onPiece = RL_PRESS.prov; RL_PRESS.prov = -1; // v4: a touch that started on an army piece
  if (touches.size === 1) pressTimer = setTimeout(() => { if (dragMoved < 8) { dragMoved = 99; orderMove(e.clientX, e.clientY, onPiece); } }, 550);
  if (touches.size === 2) { const [a, b] = [...touches.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), s: cam.s }; }
});
canvas.addEventListener('pointermove', (e) => {
  const t = touches.get(e.pointerId); if (!t) return;
  const dx = e.clientX - t.x, dy = e.clientY - t.y; t.x = e.clientX; t.y = e.clientY;
  if (touches.size === 1) { cam.x += dx; cam.y += dy; clampCam(); dragMoved += Math.abs(dx) + Math.abs(dy); }
  else if (pinch) {
    const [a, b] = [...touches.values()], r = canvas.getBoundingClientRect();
    zoomAt((a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top, (pinch.s * Math.hypot(a.x - b.x, a.y - b.y)) / pinch.d); dragMoved = 99;
  }
  if (dragMoved > 8) { clearTimeout(pressTimer); closeAll(); requestDraw(); }
});
const endTouch = (e) => { touches.delete(e.pointerId); if (touches.size < 2) pinch = null; clearTimeout(pressTimer); };
canvas.addEventListener('pointerup', endTouch); canvas.addEventListener('pointercancel', endTouch);
let detentTimer = null;
canvas.addEventListener('wheel', (e) => {
  e.preventDefault(); const r = canvas.getBoundingClientRect();
  zoomingUntil = performance.now() + 140; zoomAt(e.clientX - r.left, e.clientY - r.top, cam.s * Math.exp(-e.deltaY * 0.0012)); closeAll(); hideCursorLbl(); requestDraw();
  clearTimeout(detentTimer); detentTimer = setTimeout(() => { const s0 = startScale(); if (Math.abs(cam.s / s0 - 1) <= 0.08 && cam.s !== s0) animateCam(s0, null); }, 150); // the detent: the start scale (relief), the fit (v3)
}, { passive: false });

// ------------------------------------------------------------------ map modes (the decoration fades out of data modes over 150 ms)
// natural §6: the seventh mode, Terrain (Shift+7; F7 is never bound: caret browsing), shows the Clear bake as baked. It is the relief map's: Painted (v3) shows its fills already.
const MODES = [['ownership', 'ownership', 'Ownership', 'Owner bands over the painted land.'], ['dominion', 'dominion', 'Dominion', 'Who dominates each province, and how strongly.'], ['supply', 'supply', 'Supply', 'Food given per day. Lighter is more.'], ['unrest', 'fist', 'Unrest', 'Lighter is more unrest. Above 50 recruiting stops.'], ['population', 'pop', 'Population', 'Lighter is more people.'], ['springs', 'springs', 'Mana springs', 'Springs by color, with their symbols.'], ['terrain', 'terrainMode', 'Terrain', 'The colour-blind-safe terrain colours, with their relief.']];
const modesFor = () => (RELIEF() ? MODES : MODES.filter((m) => m[0] !== 'terrain'));
const modesEl = document.getElementById('modes');
function setMode(m) {
  if (!modesFor().some((x) => x[0] === m)) m = 'ownership';
  state.mode = m; if (m === 'terrain' && RB.ready) rlEnsureLook('clear'); updateDeco();
  renderModes(); requestDraw();
}
const cycleMode = () => { const L = modesFor(), k = L.findIndex((m) => m[0] === state.mode); setMode(L[(k + 1) % L.length][0]); };
// v3 readability guard (5.1, 5.2): decoration fades out of data modes and dims to 60% while commanders are selected (move targeting).
// Deviation: the mockup's preselected Varo at load is shown without the dim; selecting any army dims.
function updateDeco() {
  const to = state.mode !== 'ownership' ? 0 : state.sel && state.sel.type === 'cmd' && state.targeting && PAINTED() && !RELIEF() ? 0.6 : 1; // v4: the relief map keeps its land at full strength while targeting
  if (to !== decoTo) { decoFrom = decoAlpha; decoTo = to; decoT0 = performance.now(); }
  requestDraw();
}
const rlPreparing = () => RELIEF() && RB.ready && !rlLookReady('clear') && (state.mode === 'terrain' || view.terrain === 'clear');
function renderModes() {
  const L = modesFor(), cur = L.find((m) => m[0] === state.mode) ?? L[0], prep = rlPreparing();
  if (RELIEF()) { MODES[0][3] = 'Owner rails and a glow inside realm edges over the terrain model.'; } else MODES[0][3] = 'Owner bands over the painted land.';
  const tleg = cur[0] === 'terrain' ? `<div class="tlegend">${RL_T.map((t) => `<span class="tl">${terrainSwatch(t, 12)}<span>${TERRAIN[t].name}</span></span>`).join('')}</div>${prep ? '<div class="tprep" role="status">Preparing terrain colours…</div>' : ''}${view.terrain === 'clear' ? '<div class="tnote">Clear terrain colours are on everywhere.</div>' : '<button class="tuse" id="useClear">Use these colours everywhere</button>'}` : '';
  modesEl.innerHTML = `<div class="fitrow"><span class="zoomchip" id="zoomChip" data-tip="raw:zoom">Zoom: ${bandOf(cam.s)[0].toUpperCase() + bandOf(cam.s).slice(1)}</span><button class="fitbtn" id="fitBtn" data-tip="raw:fit">Fit <kbd>Z</kbd></button></div><div class="legend"><b style="color:var(--text)">${cur[2]}</b> · ${cur[3]}${cur[0] !== 'ownership' ? ' Wilds stay drawn: no data, no entry.' : ''}${tleg}</div>` + L.map((m, k) => { const p = m[0] === 'terrain' && prep; return `<button class="modebtn ${m[0] === state.mode ? 'on' : ''}${p ? ' prep' : ''}" data-m="${m[0]}" data-tip="raw:mode${k}" aria-label="${m[2]} map mode${p ? ' (preparing terrain colours…)' : ''}">${svgIcon(m[1], 18)}</button>`; }).join('');
  L.forEach((m, k) => { RAW['mode' + k] = { title: m[2] + ' map', meaning: m[3] + (m[0] === 'terrain' && prep ? ' Preparing terrain colours…' : ''), foot: `<span>Shift+${k + 1} · M cycles</span><span></span>` }; });
  RAW.fit = RELIEF() ? { title: 'Back to the start view', meaning: 'Returns to the start view: your capital at the start zoom, at least 96 px a province. Lean back with the wheel to see the whole terrain model on the oak. Home stays the capital.', foot: '<span>Key Z</span><span></span>' } : { title: 'Fit the cloth', meaning: 'Returns to the standard view: the whole map with a band of oak around it. Home stays the capital.', foot: '<span>Key Z</span><span></span>' };
  RAW.zoom = RELIEF() ? { title: 'Zoom band', meaning: 'Far: the whole model on the table; capitals, Wellsprings and wilds are named. Mid: names for what you point at, plan with or hover in a panel. Near: every name, guards and spring stones. Information is one gesture away: hover, hold Shift, or ` for the numbers.' } : { title: 'Zoom band', meaning: 'Far shows masses and the table; Mid the full detail; Near adds yards, standees and scree. Information never thins, only decoration.' };
  modesEl.querySelectorAll('.modebtn').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.m)));
  modesEl.querySelector('#fitBtn').addEventListener('click', fitToCloth);
  modesEl.querySelector('#useClear')?.addEventListener('click', () => setTerrainColours('clear'));
}

// ------------------------------------------------------------------ time, pause, toasts; the time-lapse
const clock = document.getElementById('clock'), pauseBtn = document.getElementById('pauseBtn'), pausechip = document.getElementById('pausechip');
function updateTop() {
  document.getElementById('date').textContent = `Y${state.year} M${state.month} D${state.day}`;
  document.getElementById('hair').style.width = (state.day / 30) * 100 + '%';
  document.getElementById('goldV').textContent = fmt(Math.round(state.gold));
  clock.classList.toggle('paused', state.paused); document.getElementById('pausedWord').style.visibility = state.paused ? 'visible' : 'hidden';
  pauseBtn.textContent = state.paused ? '▶' : '❚❚';
  document.querySelectorAll('#speed [data-s]').forEach((b) => b.classList.toggle('on', Number(b.dataset.s) <= state.speed));
  const claimed = wellClaimed(); document.getElementById('wellV').textContent = claimed ? '◆◇' : '◇◇'; document.getElementById('wellR').textContent = (claimed ? 1 : 0) + '/2';
}
function setPaused(p, reason) {
  state.paused = p; updateTop(); present(performance.now());
  if (reason) { pausechip.innerHTML = `<span style="color:#FFB4A9">Paused:</span> ${reason} <span class="dimtxt">▸</span>`; pausechip.classList.add('show'); }
  else if (!p) pausechip.classList.remove('show');
}
pausechip.addEventListener('click', () => { pausechip.classList.remove('show'); selectCmd('ilsa'); });
pauseBtn.addEventListener('click', () => setPaused(!state.paused));
document.querySelectorAll('#speed [data-s]').forEach((b) => b.addEventListener('click', () => { state.speed = Number(b.dataset.s); updateTop(); }));
const tl = document.getElementById('tl'), tlv = document.getElementById('tlv');
function setMonth(M) {
  M = Math.max(3, Math.min(70, M));
  const before = provList.map((i) => KEYS[i]);
  deriveMonth(M);
  state.year = Math.floor((M - 1) / 12) + 1; state.month = ((M - 1) % 12) + 1;
  refreshKeys();
  const [vx, vy] = toWorld(cw / 2, ch / 2);
  const changed = provList.filter((i, k) => KEYS[i] !== before[k]).sort((a, b) => Math.hypot(cent[a][0] - vx, cent[a][1] - vy) - Math.hypot(cent[b][0] - vx, cent[b][1] - vy));
  ANIM.clear();
  if (!view.reduced) changed.slice(0, 8).forEach((i) => { const p = prov[i], n = p.dom.n ?? p.owner ?? 'red', cap = n === 'green' ? greenCap : redCap; let dx = cent[i][0] - cent[cap][0], dy = cent[i][1] - cent[cap][1]; const L = Math.hypot(dx, dy) || 1; ANIM.set(i, { from: [dx / L, dy / L] }); });
  { const b = bandOf(cam.s), now = performance.now(); for (const i of changed) if (SPR.has(b + ':' + i)) provSprite(i, b, now, true); } // v3: a month change re-bakes once, at once
  tl.value = String(M); tlv.textContent = `Y${state.year} M${state.month}`;
  updateTop(); renderOutliner();
  if (state.sel && state.sel.type === 'cmd') { const keep = moveLine; selectCmd(state.sel.id); moveLine = keep; } else if (state.sel && state.sel.type === 'prov') renderProvince();
  requestDraw();
}
tl.addEventListener('input', () => setMonth(Number(tl.value)));
let acc = 0, last = performance.now(), lastAmb = 0;
function tick(now) {
  const dt = (now - last) / 1000; last = now;
  if (!state.paused && scrim.hidden) {
    acc += dt * [0, 1, 2, 4, 8][state.speed];
    while (acc >= 1) {
      acc -= 1; state.day++; state.gold += 38 / 30;
      if (state.day > 30) { state.day = 1; const M = (state.year - 1) * 12 + state.month + 1; toast('Month end: dominion spreads. Slow looks on the map change now, once a month.'); if (M <= 70) setMonth(M); else { state.month++; if (state.month > 12) { state.month = 1; state.year++; } } }
      if (cmd.ilsa.eta > 0) { cmd.ilsa.eta = Math.max(0, cmd.ilsa.eta - 1); if (cmd.ilsa.eta === 1 && !state.autoPaused) { state.autoPaused = true; setPaused(true, 'Ilsa Oakhand reaches Ashfen tomorrow'); toast('Auto-pause: a hostile army reaches your troops tomorrow. Set which events pause in Settings → Messages.'); } }
      updateTop(); placeBadges(bandOf(cam.s)); present(now);
      if (state.paused) break;
    }
  }
  if (now - lastAmb >= 33 && ambienceOn()) { lastAmb = now; present(now); }
  requestAnimationFrame(tick);
}
const toasts = document.getElementById('toasts');
function toast(text) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = text; toasts.prepend(t); setTimeout(() => t.remove(), 4200); while (toasts.children.length > 4) toasts.lastChild.remove(); }

// ------------------------------------------------------------------ modals: battle report, Codex, research, the portrait gallery
const scrim = document.getElementById('scrim'), modal = document.getElementById('modal');
function openModal(html, cls = '') { closeAll(); modal.className = 'modal ' + cls; modal.innerHTML = html; scrim.hidden = false; modal.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', closeModal)); modal.querySelector('[data-close]')?.focus(); }
function closeModal() { scrim.hidden = true; requestDraw(); }
scrim.addEventListener('click', (e) => { if (e.target === scrim) closeModal(); });
function openReport() {
  const place = names[morholt];
  const cap = { id: 'indep-captain-' + morholt, ptype: 'indepCaptain', outfit: ({ plains: 'levy', farmland: 'levy', wasteland: 'levy', forest: 'hunter', hills: 'mountaineer', mountains: 'mountaineer', swamp: 'reedman' })[prov[morholt].terrain], seen: 'dead', label: 'Brannoc, Captain of ' + place };
  openModal(`<header><span style="color:var(--opportunity);display:inline-flex">${svgIcon('sword', 22)}</span><h2>Victory at ${place}</h2><span class="dimtxt num">Y1 M3 D12 · 7 rounds</span><button class="iconbtn" data-close aria-label="Close">✕</button></header>
    <div class="mbody"><div class="sides"><div class="side"><h3><span class="banner"><svg width="16" height="20" viewBox="0 0 22 28"><path d="M1 1h20v20l-10 6-10-6z" fill="#FD6533"/></svg></span>Cinder Horde (you)</h3>
      <div class="fates"><div class="fate">${pspan(portraitOf(cmd.varo, 40, { hpFrac: 1 }))}<span><b style="font-weight:500">Varo, Ash Chieftain</b><br><span class="dimtxt num">14 → 14 HP · unhurt</span></span></div></div>
      <div class="cas"><span>Cinder Warriors</span><span>32 → 30</span><span>−2</span><span>Flame Archers</span><span>20 → 18</span><span>−2</span></div></div>
    <div class="side"><h3><span class="banner"><svg width="16" height="20" viewBox="0 0 22 28"><path d="M1 1h20v20l-10 6-10-6z" fill="#8C8A80"/></svg></span>Independents</h3>
      <div class="fates"><div class="fate">${pspan(portraitSVG(cap, 40))}<span><b style="font-weight:500">Brannoc, Captain of ${place}</b><br><span class="dimtxt num">12 → 0 HP · slain</span></span></div></div>
      <div class="cas"><span>Spearmen</span><span>14 → 3</span><span>routed</span><span>Bowmen</span><span>8 → 6</span><span>fled</span></div></div></div>
    <div><h3 style="font:600 11.5px var(--font-body);letter-spacing:.1em;text-transform:uppercase;color:var(--faint);margin:0 0 6px">Key moments</h3><ol class="moments"><li><b>Round 2</b>: the Flame Archers' volley drops 4 Spearmen.</li><li><b>Round 4</b>: the lines meet; Cinder Warriors cut down 6 more.</li><li><b>Round 5</b>: Brannoc, Captain of ${place}, falls to Varo's axe. The Spearmen break.</li><li><b>Round 7</b>: the last Bowmen flee into the marsh.</li></ol></div>
    <div class="row" style="justify-content:flex-end"><button class="btn nav" data-close>Close</button><button class="btn" id="watch">Watch replay ▸</button></div></div>`, 'report');
  modal.querySelector('#watch').addEventListener('click', () => openModal(`<header><h2>Replay · ${place}</h2><button class="iconbtn" data-close aria-label="Close">✕</button></header><div class="mbody"><p style="margin:0;max-width:62ch;line-height:1.5">The replay opens here on a full stage: the player's side on the left, three rows a side, every blow, every death, spells with their own effects and sound. Pause, 0.5× to 4×, Beats mode, and skip to the end. It is being built in the battle presentation track and lands in this modal in Phase 10; its docks and name cards use these portraits.</p><div class="row" style="justify-content:flex-end"><button class="btn" data-close>Back to the map</button></div></div>`));
}
const CODEX_UNITS = { cinderWarrior: ['Cinder Warrior', 'Heavy infantry of the Cinder Horde. hp 11, str 11, att 11, def 10, prot 3, morale 11, map speed 2. Hand axe 6. Costs 12 gold, 8 materials, 10 people; 10 recruit days per 10.'] };
function openCodex(key) {
  const entries = { ...Object.fromEntries(Object.entries(CONCEPTS).map(([k, v]) => [k, v])), ...CODEX_UNITS };
  let cur = key && entries[key] ? key : 'dominion', q = '';
  const render = () => {
    const list = Object.entries(entries).filter(([, v]) => v[0].toLowerCase().includes(q.toLowerCase()));
    modal.querySelector('.codex').innerHTML = `<nav><input id="cq" placeholder="Search the Codex" value="${q}" aria-label="Search the Codex"><div class="grp">Concepts</div>${list.filter(([k]) => CONCEPTS[k]).map(([k, v]) => `<button data-k="${k}" class="${k === cur ? 'on' : ''}">${v[0]}</button>`).join('')}<div class="grp">Units</div>${list.filter(([k]) => CODEX_UNITS[k]).map(([k, v]) => `<button data-k="${k}" class="${k === cur ? 'on' : ''}">${v[0]}</button>`).join('')}</nav><article><h3>${entries[cur][0]}</h3><p>${entries[cur][1]}</p><p class="dimtxt">Every Codex page is generated from the game's own rules and content, so it never disagrees with the game.</p></article>`;
    modal.querySelectorAll('.codex nav button').forEach((b) => b.addEventListener('click', () => { cur = b.dataset.k; render(); }));
    const inp = modal.querySelector('#cq'); inp.addEventListener('input', () => { q = inp.value; const pos = inp.selectionStart; render(); const n = modal.querySelector('#cq'); n.focus(); n.setSelectionRange(pos, pos); });
  };
  openModal(`<header><span style="display:inline-flex;color:var(--dim)">${svgIcon('codex', 22)}</span><h2>Codex</h2><button class="iconbtn" data-close aria-label="Close">✕</button></header><div class="codex"></div>`);
  render();
}
function openResearch() {
  openModal(`<header><span style="display:inline-flex;color:var(--dim)">${svgIcon('book', 22)}</span><h2>Research</h2><button class="iconbtn" data-close aria-label="Close">✕</button></header><div class="mbody"><div class="cards" style="grid-template-columns:repeat(auto-fit,minmax(120px,1fr))">${'WUBRG'.split('').map((c) => `<div class="side" style="gap:4px"><h3>${manaSym(c, 18)} ${MANA[c].name}</h3><span class="num dimtxt">${c === 'R' ? 'Level 2 · 47 days to L3' : c === 'G' ? 'Level 0' : 'Level 0 · no M1 spells'}</span>${c === 'R' ? '<span style="font-size:13.5px">Next: Fireball, Blood Fury</span><button class="btn" aria-disabled="true">Researching</button>' : c === 'G' ? '<button class="btn">Research this</button>' : ''}</div>`).join('')}</div></div>`);
}
function openGallery() {
  const cell = (svg, lbl) => `<div class="gcell">${pspan(svg)}<span>${lbl}</span></div>`;
  const row1 = Array.from({ length: 12 }, (_, k) => cell(portraitSVG({ id: 'gallery-ash-' + k, ptype: 'ashChieftain', allegiance: 'own' }, 64), ['Varo', 'Dravik', 'Ulrek', 'Karsk', 'Mordec', 'Thrain', 'Ashk', 'Vesh', 'Grall', 'Oskar', 'Brannt', 'Hesk'][k])).join('');
  const pips = { emberAdept: 'RR', cinderMagus: 'RRR', pyrePriest: 'R', saplingDruid: 'GG', elderDruid: 'GGG', grovePriest: 'G' };
  const row2 = ['ashChieftain', 'emberAdept', 'pyrePriest', 'cinderScout', 'cinderMagus', 'wardenCaptain', 'thornScout', 'grovePriest', 'saplingDruid', 'elderDruid'].map((t) => cell(portraitSVG({ id: 'type-' + t, ptype: t, allegiance: PTYPES[t].side === 'red' ? 'own' : 'other', pips: pips[t] ?? '', holy: /Priest/.test(PTYPES[t].label) ? 2 : 0 }, 128), PTYPES[t].label + (PTYPES[t].side === 'green' ? ' (Thornwood)' : ''))).join('')
    + ['levy', 'hunter', 'mountaineer', 'reedman'].map((o) => cell(portraitSVG({ id: 'indep-' + o, ptype: 'indepCaptain', outfit: o }, 128), 'Independent Captain · ' + o)).join('');
  const row3 = [256, 128, 96, 64, 48, 40, 24, 16].map((sz) => cell(portraitSVG({ id: 'gallery-ash-0', ptype: 'ashChieftain', allegiance: 'own', gear: { n: 1, tier: 2 } }, sz), sz + ' px')).join('');
  const st = [['healthy', {}], ['under 50%', { hpFrac: 0.43 }], ['under 25%', { hpFrac: 0.2 }], ['prophet', { prophet: true, ptype: 'pyrePriest', holy: 2, pips: 'R', id: 'ondra' }], ['pretender', { ptype: 'titan', pretender: true, pips: 'RRRR', id: 'titan' }], ['starving', { starving: true }], ['unpaid', { unpaid: true }], ['holy', { holy: 2, ptype: 'pyrePriest', id: 'ondra' }], ['gear 2 ★', { gear: { n: 2, tier: 3 } }], ['last seen', { seen: 'lastSeen', allegiance: 'other', ptype: 'wardenCaptain', id: 'ilsa' }], ['dead', { seen: 'dead', ptype: 'indepCaptain', outfit: 'levy', id: 'indep-captain-' + morholt }]];
  const row4 = st.map(([lbl, o]) => cell(portraitSVG({ id: 'varo', ptype: 'ashChieftain', allegiance: 'own', ...o }, 64), lbl)).join('');
  const row5 = [0, 1, 2, 'god', 'indep'].flatMap((rk) => ['own', 'other', 'independent'].map((al) => cell(portraitSVG({ id: 'frame-demo', ptype: rk === 'god' ? 'titan' : rk === 'indep' ? 'indepCaptain' : 'ashChieftain', allegiance: al, rank: rk, banner: al === 'other' ? '#00674B' : al === 'independent' ? '#8C8A80' : '#FD6533' }, 96), `${FRAMES[rk][1]} · ${al === 'own' ? 'own (round)' : al === 'other' ? 'other nation (notched)' : 'independent (square)'}`))).join('');
  openModal(`<header><span style="display:inline-flex;color:var(--dim)">${svgIcon('pop', 22)}</span><h2>Portraits · review gallery</h2><span class="dimtxt" style="font-size:12.5px">Mockup control, not game UI</span><button class="iconbtn" data-close aria-label="Close">✕</button></header><div class="mbody gallery">
    <div><h3>Twelve seeded Ash Chieftains (variety), 64 px</h3><div class="grow">${row1}</div></div>
    <div><h3>Every commander type, and an Independent Captain in each outfit, 128 px</h3><div class="grow">${row2}</div></div>
    <div><h3>One Ash Chieftain at every size (level of detail)</h3><div class="grow">${row3}</div></div>
    <div><h3>States are overlays, badges and frames only; the face never changes, 64 px</h3><div class="grow">${row4}</div></div>
    <div><h3>Frames: rank by material, allegiance by shape, 96 px</h3><div class="grow">${row5}</div></div></div>`, 'wide');
}
document.getElementById('btnF').addEventListener('click', () => openCodex());
document.getElementById('btnR').addEventListener('click', openResearch);
document.getElementById('btnL').addEventListener('click', () => toast('The Ledger: sortable tabs for provinces, commanders, magic, battles, and nations.'));


// ------------------------------------------------------------------ keys
window.addEventListener('keydown', (e) => {
  if (e.target.matches('input:not([type]), input[type=text], input[type=search], select, textarea')) return; // the slider and checkboxes keep the shortcuts
  if (e.key === 'Shift') app.classList.add('shift');
  if (RELIEF() && e.key === 'Shift' && !e.repeat && !state.sel && !tips.length && !RL_NUMBERS.shift) { RL_NUMBERS.shift = true; requestDraw(); } // v4: Shift held alone, nothing selected, no tooltip open: every name and the numbers
  if (RELIEF() && e.key === '`') { RL_NUMBERS.on = !RL_NUMBERS.on; requestDraw(); }
  if (e.key === 'Escape') { if (!scrim.hidden) closeModal(); else if (tips.length) closeAll(); else clearSel(); return; }
  if (e.code === 'Space') { e.preventDefault(); setPaused(!state.paused); }
  if (/^Digit[1-4]$/.test(e.code) && !e.shiftKey) { state.speed = Number(e.code.slice(5)); updateTop(); }
  if (/^Digit[1-7]$/.test(e.code) && e.shiftKey) { const m = modesFor()[Number(e.code.slice(5)) - 1]; if (m) setMode(m[0]); } // Shift+7: the Terrain mode (F7 is never bound)
  if (e.key === 't' || e.key === 'T') lockTop();
  if (e.key === 'f' || e.key === 'F') openCodex();
  if (e.key === 'r' || e.key === 'R') openResearch();
  if (e.key === 'z' || e.key === 'Z') fitToCloth();
  if (e.key === 'h' || e.key === 'H') app.classList.toggle('hidden-ui');
  if (e.key === 'm' || e.key === 'M') cycleMode();
  if (e.key === '[') leftDock.hidden = !leftDock.hidden;
  if (e.key === ']') document.getElementById('rightDock').hidden = !document.getElementById('rightDock').hidden;
});
window.addEventListener('keyup', (e) => { if (e.key === 'Shift') { app.classList.remove('shift'); if (RL_NUMBERS.shift) { RL_NUMBERS.shift = false; requestDraw(); } } });
window.addEventListener('blur', () => { if (RL_NUMBERS.shift) { RL_NUMBERS.shift = false; requestDraw(); } });
// v4: hovering a link to a province (feed, tooltips) gives it its hover look and its name on the land while hovered
document.addEventListener('mouseover', (e) => { if (!RELIEF()) return; const l = e.target.closest && e.target.closest('[data-go]'); const v = l ? Number(l.dataset.go) : -1; if (v !== RL_LINK.prov) { RL_LINK.prov = v; requestDraw(); } });

// ------------------------------------------------------------------ mockup controls (review aids outside the game window)
const warmNote = document.getElementById('warmNote');
warmNote.innerHTML = `<span class="sw"><i style="background:#1C1A17"></i><i style="background:#24211D"></i><i style="background:#2E2A25"></i></span>approved <span class="sw"><i style="background:#2E2219"></i><i style="background:#3A2B1F"></i><i style="background:#4A3727"></i></span>warm <span class="bad">Urgent alert 2.66:1, Tide symbol 2.66:1 on --chrome-2 (under 3:1)</span>`;
document.querySelectorAll('#mockctl .seg').forEach((seg) => seg.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
  seg.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
  const k = seg.dataset.ctl, v = b.dataset.v;
  if (k === 'table') { view.table = v; requestDraw(); }
  if (k === 'detail') { view.detail = v; refreshKeys(); requestDraw(); }
  if (k === 'chrome') { view.chrome = v; app.classList.toggle('warm', v === 'warm'); warmNote.hidden = v !== 'warm'; }
  if (k === 'parch') { view.parch = v === 'on'; app.classList.toggle('parch', view.parch); }
  if (k === 'hand') { view.hand = v; resetGeometryCaches(true); updateDeco(); }
  if (k === 'labels') { view.labels = v; resetGeometryCaches(false); }
  if (k === 'borders') { view.borders = v; npoly = v === 'straight' ? cells : NPOLY_W; resetGeometryCaches(true); }
  if (k === 'bandCap') { view.bandCap = v; requestDraw(); }
  if (k === 'tracks') { view.tracks = v; requestDraw(); }
  if (k === 'farm') { view.farm = v; if (PAINTED_PAL()) return; TERRAIN.farmland.fill = v === 'approved' ? '#EEBA3A' : '#EDB141'; MODE_BASE.farmland = desat(TERRAIN.farmland.fill, 0.8); FILLMEMO.clear(); resetGeometryCaches(false); }
  if (k === 'palette') setPalette(v);
  if (k === 'look') setLook(v);
  if (k === 'tint') { view.tint = v === 'on'; requestDraw(); }
  if (k === 'terrain') setTerrainColours(v);
})));
// v4: Map look. Relief is the relief map (map-design-final.md); Painted (v3) is the page exactly as before (?look=v3 opens on it).
function setLook(v) {
  v = v === 'v3' ? 'v3' : 'relief'; if (view.look === v) return; view.look = v;
  npoly = v === 'relief' || view.borders === 'straight' ? cells : NPOLY_W; resetGeometryCaches(true); TABLEB = null; CLOTHB = null; CK = null; RCK = null;
  layer.innerHTML = ''; badgeSig = ''; badgeEls = []; RL_PIECE_DOM.clear(); rlPieceSigLast = ''; RL_PIECE_CACHE.clear(); hoverProv = -1; RL_LINK.prov = -1;
  if (!modesFor().some((m) => m[0] === state.mode)) state.mode = 'ownership'; // the Terrain mode is the relief map's
  syncLookUI(); updateDeco(); renderModes(); if (!headMoreByHand) headMore.open = headMoreDefault(); layout();
}
function syncLookUI() {
  document.body.classList.toggle('look-relief', RELIEF()); document.body.classList.toggle('look-v3', !RELIEF()); app.classList.toggle('railed', RELIEF());
  document.querySelectorAll('#mockctl [data-ctl="look"] button').forEach((b) => b.classList.toggle('on', b.dataset.v === view.look));
  document.querySelectorAll('#mockctl [data-ctl="tint"] button').forEach((b) => b.classList.toggle('on', (b.dataset.v === 'on') === view.tint));
  document.querySelectorAll('#mockctl [data-ctl="terrain"] button').forEach((b) => { b.classList.toggle('on', b.dataset.v === view.terrain); b.setAttribute('aria-pressed', String(b.dataset.v === view.terrain)); });
}
// natural §6: Settings → Accessibility → Terrain colours: Natural (default) | Clear (?terrain=clear). Clear shows the colour-blind-safe fills in Ownership mode
function setTerrainColours(v) { view.terrain = v === 'clear' ? 'clear' : 'natural'; syncLookUI(); if (RB.ready) rlEnsureLook(rlLandLook()); renderModes(); requestDraw(); }
// ---- the Palette A/B (palette-ab/decision.md): Bright = the approved fills (default); Painted = the painted fills. Only the fills change;
// the marks that derive from a fill follow it (stamp and settlement faces, the pool, the ground marks under Painted, owner art recolored
// through the faces). Data-mode bases stay at the approved values; under Painted the Farmland A/B does not apply and its control is disabled.
function setPalette(v) {
  view.palette = v === 'painted' ? 'painted' : 'bright';
  for (const t of Object.keys(TERRAIN)) TERRAIN[t].fill = PALETTES[view.palette][t];
  if (!PAINTED_PAL()) TERRAIN.farmland.fill = view.farm === 'approved' ? '#EEBA3A' : '#EDB141'; // back on Bright, Farmland takes the Farmland control's value
  MODE_BASE.farmland = desat(PAINTED_PAL() ? PALETTES.bright.farmland : TERRAIN.farmland.fill, 0.8);
  FILLMEMO.clear(); FACEMEMO.clear(); GREYMEMO.clear(); CLOTHB = null; recolorArt(); syncPaletteUI(); resetGeometryCaches(false);
}
function syncPaletteUI() {
  document.querySelectorAll('#mockctl [data-ctl="palette"] button').forEach((b) => b.classList.toggle('on', b.dataset.v === view.palette));
  const farm = document.querySelector('#mockctl [data-ctl="farm"]');
  if (farm) { farm.classList.toggle('off', PAINTED_PAL()); farm.title = PAINTED_PAL() ? 'Palette: Painted sets Farmland to #CEA265; this A/B applies to Bright only' : ''; farm.querySelectorAll('button').forEach((b) => (b.disabled = PAINTED_PAL())); }
}
if (PAINTED_PAL()) syncPaletteUI(); // ?palette=painted: the fills were set before anything read them (p10b), so only the controls follow
function resetGeometryCaches(geom) { // v3 controls: Hand, Labels, Borders, Farmland and Palette join the bake keys
  if (geom) { GEO.clear(); RIBBON.clear(); LITE.clear(); resetFeats(); }
  WGEO.clear(); SPINES.clear(); ZCACHE.clear(); MIDPEAKS.clear(); STL.clear(); invalidateBakes(); refreshKeys(); requestDraw();
}
const visionSel = document.getElementById('vision');
visionSel.addEventListener('change', () => { const v = visionSel.value; view.vision = v; app.style.filter = v === 'normal' ? '' : `url(#cvd-${v})`; document.getElementById('visionNote').hidden = v === 'normal'; });
const rmotion = document.getElementById('rmotion'); rmotion.checked = view.reduced;
rmotion.addEventListener('change', () => { view.reduced = rmotion.checked; ANIM.clear(); requestDraw(); });
document.getElementById('btnPortraits').addEventListener('click', openGallery);
const btnPass = document.getElementById('btnPass');
btnPass.addEventListener('click', () => { view.pass = !view.pass; btnPass.classList.toggle('on', view.pass); btnPass.setAttribute('aria-pressed', String(view.pass)); document.getElementById('reviewChip').classList.toggle('show', view.pass); requestDraw(); });
document.getElementById('wipe').addEventListener('change', (e) => { view.wipe = e.target.checked; });

// natural §7: every link to a province carries its accessible name with the terrain: "Tormere, forest, Cinder Horde"
const provAria = (i) => `${names[i]}, ${TERRAIN[terr[i]].name.toLowerCase()}, ${ownerName(prov[i].owner)}`;
const labelLinks = (root) => root.querySelectorAll('[data-go]').forEach((l) => { const i = Number(l.dataset.go); if (i >= 0 && prov[i] && !isWild(i)) l.setAttribute('aria-label', provAria(i)); });
new MutationObserver((ms) => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1) { if (n.matches && n.matches('[data-go]')) labelLinks(n.parentNode ?? n); else labelLinks(n); } }).observe(document.body, { childList: true, subtree: true });
// ------------------------------------------------------------------ responsive frames
const rightDock = document.getElementById('rightDock');
document.getElementById('railOut').addEventListener('click', () => { rightDock.classList.toggle('fly'); });
document.getElementById('railFeed').addEventListener('click', () => { rightDock.classList.toggle('fly'); msgs.scrollIntoView({ block: 'nearest' }); });
document.getElementById('railMode').addEventListener('click', () => { cycleMode(); const m = MODES.find((x) => x[0] === state.mode); toast(`${m[2]} map: ${m[3]}`); });
RAW.railMode = { title: 'Map mode', meaning: 'Cycles ownership, dominion, supply, unrest, population, mana springs and (on the relief map) terrain.', foot: '<span>Key M</span><span></span>' };
function layout() {
  const w = app.clientWidth;
  app.classList.toggle('mid', w < 1250 && w >= 720); app.classList.toggle('phone', w < 720);
  fit(); draw();
}
new ResizeObserver(layout).observe(app);
document.addEventListener('visibilitychange', () => { if (!document.hidden) requestDraw(); });

// ------------------------------------------------------------------ start
// small screens: the controls fold away. v4: under Relief they and the Try this list start folded at every size, so the first view is the model at its start zoom;
// Painted (v3) keeps its frame as it was (open from 800 px tall), also when it is reached by the Map look switch, unless the controls were folded or opened by hand.
const headMore = document.getElementById('headMore'), headMoreDefault = () => !(RELIEF() || window.innerWidth < 720 || window.innerHeight < 800); let headMoreByHand = false;
headMore.querySelector('summary').addEventListener('click', () => { headMoreByHand = true; });
if (!headMoreDefault()) headMore.open = false;
deriveMonth(3); refreshKeys();
document.getElementById('tryAcross').textContent = acrossTarget != null ? names[acrossTarget] : 'a province across the Ashspine';
document.querySelectorAll('.tryAcross').forEach((el) => (el.textContent = acrossTarget != null ? names[acrossTarget] : 'a province across the Ashspine'));
syncLookUI(); labelLinks(document); // v4: the controls, the Try this list and the right dock's rail follow the Map look
renderAlerts(); renderOutliner(); renderFeed(); renderModes(); updateTop();
// The label zones are measured in the web font, and brooks, ponds, landmarks and vignettes keep out of them: when the fonts arrive after
// the first paint, the features are laid out again once, so every load ends on the same map whatever the font timing.
function onFontsArrived() { TW_CACHE.clear(); ZCACHE.clear(); WGEO.clear(); SPINES.clear(); CLOTHB = null; if (FEATS && FEATS.fk !== true) resetFeats(); invalidateBakes(); firstPaint = true; }
for (const f of ["22px 'Marcellus SC'", '500 13px Alegreya', '600 13px Alegreya', '800 13px Alegreya', 'italic 500 13px Alegreya']) document.fonts?.load?.(f).then(() => requestDraw(), () => {}); // ask for every face the map letters in
document.fonts?.ready?.then(() => { if (checkFonts()) onFontsArrived(); draw(); });
document.fonts?.addEventListener?.('loadingdone', () => requestDraw());
layout();
selectCmd('varo'); state.targeting = false; decoTo = decoAlpha = decoFrom = 1; // the preselected army is shown without the targeting dim
layout();
requestAnimationFrame(tick);
// Review hooks for automated screenshots (read-only helpers; the game UI never calls them).
window.__mock = {
  at: (name) => { const i = names.indexOf(name); const [x, y] = toScreen(...cent[i]); const r = canvas.getBoundingClientRect(); return [r.left + x, r.top + y]; },
  wildAt: (id) => { const w = WILDS.find((q) => q.id === id) ?? WILDS[0]; const c = wgeo(w).labelAt; const [x, y] = toScreen(cent[c][0], cent[c][1] + 30); const r = canvas.getBoundingClientRect(); return [r.left + x, r.top + y]; },
  across: () => (acrossTarget != null ? names[acrossTarget] : null), closed: () => (closedTarget != null ? names[closedTarget] : null),
  setMonth: (m) => setMonth(m), band: () => bandOf(cam.s), scale: () => cam.s, fitScale: () => fitScale, minScale: () => minScale, maxScale: () => maxScale,
  zoomTo: (s, name) => { const i = names.indexOf(name), v = viewRect(); cam.s = s; cam.x = (v.l + v.r) / 2 - cent[i][0] * s; cam.y = (v.t + v.b) / 2 - cent[i][1] * s; clampCam(); draw(); },
  prof: (n = 10) => { for (const k in PROF) delete PROF[k]; for (let k = 0; k < n; k++) draw(); return Object.fromEntries(Object.entries(PROF).map(([k, v]) => [k, +(v / n).toFixed(2)])); },
  perf: (n = 20) => { const t0 = performance.now(); for (let k = 0; k < n; k++) draw(); return (performance.now() - t0) / n; },
  reb: () => ({ ...REB, bakes: BAKES.slice(-6) }),
  sprInfo: () => { const b = bandOf(cam.s); let ok = 0, stale = 0, miss = 0; for (const i of provList) { const sp = SPR.get(b + ':' + i); if (!sp) miss++; else if (sp.key !== KEYS[i]) stale++; else ok++; } return { b, ok, stale, miss, size: SPR.size }; },
  skip: (k, on) => { if (on) SKIP.add(k); else SKIP.delete(k); },
  panFps: (dx = 3, n = 60) => new Promise((res) => { let k = 0, t0 = 0; const step = (now) => { if (k === 1) t0 = now; if (k > n) { res((now - t0) / (n)); return; } cam.x += k % 40 < 20 ? dx : -dx; clampCam(); draw(); k++; requestAnimationFrame(step); }; requestAnimationFrame(step); }),
  pan: (dx, dy, n = 20) => { const t0 = performance.now(); for (let k = 0; k < n; k++) { cam.x += dx; cam.y += dy; clampCam(); draw(); } return (performance.now() - t0) / n; },
  ev: (src) => eval(src), // review only: read internal state
  paintcheck: () => paintCheck(), trackcheck: () => trackCheck(), feats: () => { const F = feats(); return { tracks: F.tracks.length, fallbacks: F.tracks.reduce((o, h) => ((o[h.fallback] = (o[h.fallback] ?? 0) + 1), o), {}), slid: F.tracks.filter((h) => h.slid).length / 2, brooks: [...F.water.values()].filter((w) => w.brook).length, ponds: [...F.water.values()].filter((w) => w.pond).length, bridges: [...F.bridges.values()].reduce((a, b) => a + b.length, 0), mines: [...F.land.values()].filter((l) => l.always && l.always.kind === 'mine').length, windmills: [...F.land.values()].filter((l) => l.always && l.always.kind === 'windmill').length, ruins: [...F.land.values()].filter((l) => l.ruin).length, heroes: [...F.heroes.values()].map((h) => h.kind + '@' + names[[...F.heroes.keys()].find((k) => F.heroes.get(k) === h)]), regions: F.regions.map((r) => r.name + ' (' + r.provs.length + ')'), vignettes: F.vig.size, init: PROF.init }; },
  setTerrain: (v) => { setTerrainColours(v); return view.terrain; }, look: () => ({ want: rlLandLook(), shown: rlShownLook(), natural: rlLookReady('natural'), clear: rlLookReady('clear'), preparing: RB.lookRunning }),
  setView: (k, v) => { const b = document.querySelector(`#mockctl [data-ctl="${k}"] [data-v="${v}"]`); if (b) b.click(); return view[k]; },
  info: () => ({ wilds: WILDS.map((w) => [w.id, w.cells.length]), provinces: provs.length, fog: FOG.filter(Boolean).length, captures: captureTargets.map((i) => names[i]), pillage: names[pillageProv], burn: names[burnProv], ashRain: names[ashRainProv], morholt: names[morholt], sunmere: names[ownWell] }),
};
// Notes for review (decisions where the brief left room):
// - The mockup's sheet has 66 cells, far fewer than a Medium map; with the 3-hop gap between ranges the generator placed all
//   three ranges on only a few seeds and none gave Varo a target across the Ashspine. The mockup uses a 2-hop gap between
//   ranges (3 hops from both capitals, as briefed) and map seed 12. Every other placement rule is as briefed.
// - Houses and their spiral are drawn 1.3x the briefed size so a town reads at the start zoom.
// - The pillaged province loses 8% at M14 and 25% in all by M15, so it drops a tier and reads as declining.
// v3, the painted map (handdrawn-design/final.md §9), decisions and deviations:
// - Fixed zones are sized at each band's design scale, not its widest: at the widest Mid scale the zones span a whole province.
//   The label zone is the name with its halo plus a two-chip second line; the token zone holds 1 stack (2 at Near).
// - Terrain stamps and water may stand in the empty token zone (tokens are opaque plates over them); labels, second lines and
//   seats stay clear. Without this, forests read sparse and only 2 brooks fit on this sheet.
// - Track dots are dropped in the fixed label zone (+2 px) and under the live names and tokens, not in an empty token zone, and
//   not in the seat zone, which the track has to cross to reach the settlement.
// - The features (brooks, ponds, landmarks, vignettes) keep out of the label zones measured in the web fonts. When the fonts
//   arrive after the first paint, the features are laid out again once, so every load ends on the same map; with the fonts
//   blocked (offline) the fallback serif gives a slightly different, equally stable layout. The game bundles its fonts.
// - Mid and Far sprites are drawn without createImageBitmap (rasterizing them cost more than it saved); the deco composite is
//   used at every Mid and Far frame, with the previous sprites cross-faded over it while a month change re-bakes.
// - The footpath stays behind ?footpath: tracks at the start zoom reach about 3.4:1 dot peak but about 1.7:1 line average on
//   Mountains, short of the 1.8:1 the brief asks before it is removed.
// - Region names are placed last and only where a whole name fits on its spine clear of every other label; on this 60-province
//   sheet they appear around Mid scale 0.5 to 0.6 and rarely at the start zoom.
// - Paint lifts, fleck coverage (plains 0.009), forest crown counts (x2 Mid, x1.5 Near) and the strength words (16/24/30) are
//   in PAINT, FLECK, stampSlotsFor and strengthWord; the paint check result is in ui-mockup/v3-paintcheck.txt.
// v3 critique (handdrawn-design/critique.md) applied; where the build departs from its letter:
// - Hill ranges: flankers stand 0.55-0.67 w out (a pair 0.62-0.72 w), 0.5-0.7 w wide and 0.07-0.14 w lower, not 0.35-0.5 w out, so every
//   range stays under the 0.70 silhouette limit against the beast den (40 seeds each for 2, 3 and 4 humps; worst 0.67).
// - Hump shade: a true crescent (the hump in the shade tone, the lit face an ellipse offset toward the light); the critique's literal ellipse
//   at x + 0.3 w split the asymmetric hump down a near-vertical line.
// - Ranges keep their whole box out of the label, second-line and seat zones and away from landmarks, ponds and vignettes; tracks and brooks
//   only have to miss the range's middle (dots are drawn over the bake). TSPEC stays the cap; slots run out before it on this sheet.
// - TSPEC's new counts drive the painted stamps only; v2's slot set and the Hand: v2 toggle keep v2's counts (TSPEC_V2), so landmarks,
//   water and motifs do not move.
// - Tracks: a half that would cross the name zone (Mid and Near name and second line, + 2 u) bows round it from the seat's east or west
//   point; where no bow fits it may run under the name only as one stretch at its town end ('under'), so no dot is dropped mid-run.
// - Brooks: ridge(0.2, 4) on each segment as specified gives about 1.1 sinuosity; seeded uneven bends (two sines) bring them to 1.25 or more
//   where the course stays valid. Bridge parapets take the track's ink (paper ink on dark land), not always feature ink.
// - Names: a crowded name steps down 1 px (never under 11) before it is culled, which keeps the start-zoom label test at 90%.
// - Fog line art keeps the single tuft and a low row of three reed clumps (the clusters' line art crossed the 0.60 limit).
// - The barrow is longer and lower (aspect 6): with the hand's ink its outline had reached 0.73 against the beast den.

// ------------------------------------------------------------------ v3 step 5: "Try your art". The owner drops a ChatGPT sheet (PNG) here; the mockup runs the
// intake's alpha, component and color checks, recolors it through luminance into the terrain's warm-cool faces (H9, 6.5) and redraws the
// map with it. Nothing leaves the browser; the sheet lives for this session only. Every entry has its procedural fallback.
const ART_ENTRIES = {
  paper: { label: 'H1 Paper tile', want: 0 },
  broadleaf: { label: 'H2 Broadleaf clumps', want: 16, terrain: 'forest' },
  conifer: { label: 'H3 Conifer clumps and single trees', want: 16, terrain: 'forest' },
  relief: { label: 'H4 Hills (top rows) and peaks (bottom rows)', want: 16 },
};
const lum = (r, g, b) => (0.2126 * s2l(r) + 0.7152 * s2l(g) + 0.0722 * s2l(b)); // relative luminance 0..1
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function recolorPixels(d, lit, shade) { // pure: pixels in, pixels out (the game's src/present/map/recolor.ts)
  const Lc = hex2rgb(lit), Sc = hex2rgb(shade), Ic = hex2rgb('#3E3428');
  for (let k = 0; k < d.length; k += 4) {
    if (!d[k + 3]) continue; const L = Math.pow(lum(d[k], d[k + 1], d[k + 2]), 1 / 2.2);
    if (L < 0.22) { d[k] = Ic[0]; d[k + 1] = Ic[1]; d[k + 2] = Ic[2]; continue; }
    const t = smooth(0.35, 0.8, L); for (let c = 0; c < 3; c++) d[k + c] = Sc[c] + (Lc[c] - Sc[c]) * t;
  }
  return d;
}
function intakeSheet(img, entry) { // returns { frames, raws, warnings, refusal, summary }
  const t0 = performance.now(), sc = Math.min(1, 1024 / Math.max(img.width, img.height)), w = Math.round(img.width * sc), h = Math.round(img.height * sc);
  const c = makeCanvas(w, h), g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0, w, h);
  const id = g.getImageData(0, 0, w, h), d = id.data, n = w * h, warnings = [];
  if (entry === 'paper') { // H1: luminance, mean 128, contrast clamped to +-20, downscaled to 256 square; the wrapped-seam difference
    const S = 256, t = makeCanvas(S, S), tg = t.getContext('2d', { willReadFrequently: true }); tg.drawImage(c, 0, 0, S, S); const td = tg.getImageData(0, 0, S, S), q = td.data;
    let m = 0; const Ls = new Float32Array(S * S); for (let k = 0; k < S * S; k++) { Ls[k] = 0.2126 * q[k * 4] + 0.7152 * q[k * 4 + 1] + 0.0722 * q[k * 4 + 2]; m += Ls[k]; } m /= S * S;
    let sd = 0; for (let k = 0; k < S * S; k++) sd += (Ls[k] - m) ** 2; sd = Math.sqrt(sd / (S * S)); const kk = sd > 10 ? 10 / sd : 1; // about +-20 at two sigma
    for (let k = 0; k < S * S; k++) { const v = Math.max(108, Math.min(148, 128 + (Ls[k] - m) * kk)); q[k * 4] = q[k * 4 + 1] = q[k * 4 + 2] = v; q[k * 4 + 3] = 255; }
    tg.putImageData(td, 0, 0);
    let seam = 0; for (let y = 0; y < S; y++) seam += Math.abs(q[(y * S) * 4] - q[(y * S + S - 1) * 4]); for (let x = 0; x < S; x++) seam += Math.abs(q[x * 4] - q[((S - 1) * S + x) * 4]); seam /= 2 * S;
    if (seam > 6) warnings.push(`the wrapped seam differs by ${seam.toFixed(1)} grey levels (ask for a seamless tile)`);
    return { tile: t, frames: [], raws: [t], warnings, summary: `Paper tile: mean set to 128, contrast clamped, 256 square; seam ${seam.toFixed(1)}. ${(performance.now() - t0).toFixed(0)} ms.` };
  }
  // alpha: at least 40% fully transparent, else the white key-out; refuse a painted checkerboard
  let clear = 0; for (let k = 3; k < d.length; k += 4) if (d[k] === 0) clear++;
  if (clear < 0.4 * n) {
    const ck = checker(d, w, h); if (ck) return { refusal: `Fake transparency: a two-grey checker of ${ck} px tiles is painted into the image. Ask again: "Make the background truly transparent (an alpha channel), not a drawn checkerboard. Change nothing else."` };
    const key = new Uint8Array(n); for (let k = 0; k < n; k++) { const r = d[k * 4], gg = d[k * 4 + 1], b = d[k * 4 + 2], Lv = 0.2126 * r + 0.7152 * gg + 0.0722 * b, ch = Math.max(r, gg, b) - Math.min(r, gg, b); if (Lv > 250 && ch < 4) key[k] = 1; }
    for (let k = 0; k < n; k++) { if (key[k]) { d[k * 4 + 3] = 0; continue; } const x = k % w, y = (k / w) | 0; let near = 0; for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) { const xx = x + a, yy = y + b; if (xx >= 0 && yy >= 0 && xx < w && yy < h && key[yy * w + xx]) near++; } if (near) d[k * 4 + 3] = Math.round(d[k * 4 + 3] * (1 - near / 50)); }
    warnings.push('no alpha channel: white keyed out (2 px feather)');
    g.putImageData(id, 0, 0);
  }
  // components: 8-connected flood fill on a 256-square alpha mask, kept at 0.2% of the image or more
  const M = 256, mk = makeCanvas(M, M), mg = mk.getContext('2d', { willReadFrequently: true }); mg.drawImage(c, 0, 0, M, M); const md = mg.getImageData(0, 0, M, M).data;
  const lab = new Int32Array(M * M).fill(-1), comps = [];
  for (let s0 = 0; s0 < M * M; s0++) {
    if (lab[s0] >= 0 || md[s0 * 4 + 3] <= 127) continue; const stack = [s0], idc = comps.length; let x0 = M, y0 = M, x1 = 0, y1 = 0, cnt = 0, edge = false; lab[s0] = idc;
    while (stack.length) { const k = stack.pop(), x = k % M, y = (k / M) | 0; cnt++; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); if (!x || !y || x === M - 1 || y === M - 1) edge = true;
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const xx = x + a, yy = y + b; if (xx < 0 || yy < 0 || xx >= M || yy >= M) continue; const kk = yy * M + xx; if (lab[kk] < 0 && md[kk * 4 + 3] > 127) { lab[kk] = idc; stack.push(kk); } } }
    comps.push({ x0, y0, x1, y1, cnt, edge });
  }
  const keep = comps.filter((q) => q.cnt >= 0.002 * M * M), want = ART_ENTRIES[entry].want;
  if (Math.abs(keep.length - want) > 2) warnings.push(`${keep.length} items found, ${want} expected`);
  const edges = keep.filter((q) => q.edge).length; if (edges) warnings.push(`${edges} item(s) touch the edge of the image`);
  const kx = w / M, ky = h / M, frames = [], raws = [];
  let litOK = 0, inkOK = 0;
  for (const q of keep.sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0)) {
    const fx = Math.max(0, Math.floor(q.x0 * kx) - 2), fy = Math.max(0, Math.floor(q.y0 * ky) - 2), fw = Math.min(w - fx, Math.ceil((q.x1 - q.x0 + 1) * kx) + 4), fh = Math.min(h - fy, Math.ceil((q.y1 - q.y0 + 1) * ky) + 4);
    const raw = makeCanvas(fw, fh), rg = raw.getContext('2d', { willReadFrequently: true }); rg.drawImage(c, fx, fy, fw, fh, 0, 0, fw, fh); raws.push(raw);
    const px = rg.getImageData(0, 0, fw, fh).data; let lL = 0, nL = 0, lR = 0, nR = 0, ink = 0, tot = 0;
    for (let k = 0; k < fw * fh; k++) { if (px[k * 4 + 3] < 128) continue; const L = Math.pow(lum(px[k * 4], px[k * 4 + 1], px[k * 4 + 2]), 1 / 2.2); tot++; if (L < 0.22) ink++; if (k % fw < fw / 2) { lL += L; nL++; } else { lR += L; nR++; } }
    if (nL && nR && lL / nL >= lR / nR) litOK++; if (tot && ink / tot >= 0.02) inkOK++;
    frames.push({ raw, cy: (q.y0 + q.y1) / 2 / M });
  }
  if (litOK < keep.length / 2) warnings.push('light check: most items are not lit from the upper left');
  if (inkOK < keep.length / 2) warnings.push('ink check: most items have no dark ink outline');
  const recolor = recolorFrame;
  const res = { warnings, raws, summary: '' };
  if (entry === 'relief') { const top = frames.filter((f) => f.cy < 0.5), bot = frames.filter((f) => f.cy >= 0.5); res.hills = { frames: top.map((f) => recolor(f.raw, 'hills')) }; res.peaks = { frames: bot.map((f) => recolor(f.raw, 'mountains')) }; res.frames = [...res.hills.frames, ...res.peaks.frames]; res.terrains = [...top.map(() => 'hills'), ...bot.map(() => 'mountains')]; }
  else { res.frames = frames.map((f) => recolor(f.raw, 'forest')); res.terrains = frames.map(() => 'forest'); }
  res.summary = `${keep.length} items, ${warnings.length} warning(s), 0 refusals. ${(performance.now() - t0).toFixed(0)} ms.`;
  return res;
}
function recolorFrame(raw, t) { // through luminance into the terrain's faces; the cut-out is kept, so a Palette switch can recolor it again
  const F = faces(TERRAIN[t].fill), out = makeCanvas(raw.width, raw.height), og = out.getContext('2d'); og.drawImage(raw, 0, 0); const im = og.getImageData(0, 0, raw.width, raw.height); recolorPixels(im.data, F.lit, F.shade); og.putImageData(im, 0, 0);
  out.srcRaw = raw; out.srcT = t; return out;
}
function recolorArt() { // the Palette A/B: owner sheets on the map follow the active fills, as at intake
  const rc = (L) => L.map((f) => (f.srcRaw ? recolorFrame(f.srcRaw, f.srcT) : f));
  for (const [k, a] of Object.entries(view.art)) {
    if (k === 'paper' || !a.frames) continue;
    if (a.hills && a.peaks) { a.hills.frames = rc(a.hills.frames); a.peaks.frames = rc(a.peaks.frames); a.frames = [...a.hills.frames, ...a.peaks.frames]; } else a.frames = rc(a.frames);
  }
}
function checker(d, w, h) { // a periodic two-grey checker of 8 to 16 px tiles over most of the image
  for (let p = 8; p <= 16; p++) {
    let a = 0, na = 0, b = 0, nb = 0, grey = 0, tot = 0;
    for (let y = 0; y < h; y += 3) for (let x = 0; x < w; x += 3) { const k = (y * w + x) * 4, r = d[k], gg = d[k + 1], bb = d[k + 2]; tot++; if (Math.max(r, gg, bb) - Math.min(r, gg, bb) > 6) continue; grey++; const L = (r + gg + bb) / 3; if (((Math.floor(x / p) + Math.floor(y / p)) & 1) === 0) { a += L; na++; } else { b += L; nb++; } }
    if (grey < 0.3 * tot || !na || !nb) continue;
    if (Math.abs(a / na - b / nb) > 12) return p;
  }
  return null;
}
function sampleSheet(entry) { // a seeded test sheet in neutral greys with ink outlines, for review without a ChatGPT image
  const S = 1024, c = makeCanvas(S, S), g = c.getContext('2d'), R = rngFor('sample:' + entry);
  if (entry === 'paper') { const im = g.createImageData(S, S); const n1 = vnoiseTile(S, R, 300, 30), n2 = vnoiseTile(S, R, 24, 20); for (let k = 0; k < S * S; k++) { const v = 205 + n1[k] + n2[k]; im.data[k * 4] = v; im.data[k * 4 + 1] = v * 0.97; im.data[k * 4 + 2] = v * 0.9; im.data[k * 4 + 3] = 255; } g.putImageData(im, 0, 0); return c; }
  const cell = S / 4;
  for (let r = 0; r < 4; r++) for (let q = 0; q < 4; q++) {
    const cx = q * cell + cell / 2, cy = r * cell + cell * 0.7;
    const grey = (L) => `rgb(${L},${L},${L})`;
    const shape = entry === 'relief' ? (r < 2 ? 'hill' : 'peak') : entry === 'conifer' ? (r < 2 ? 'fir' : 'single') : 'clump';
    g.save(); g.lineJoin = 'round'; g.lineWidth = 6; g.strokeStyle = grey(30);
    if (shape === 'clump') { const crowns = makeClump(cx, cy - 40, 4 + Math.floor(R() * 3), R, 0, [38, 52]).map((o) => ({ ...o, x: cx + (o.x - cx), y: cy - 10 + (o.y - cy) })); for (const o of crowns) { crownPath(g, o); g.stroke(); } for (const o of crowns) { crownPath(g, o); g.fillStyle = grey(110); g.fill(); const l = litFace(o); crownPath(g, l); g.fillStyle = grey(200); g.fill(); } }
    if (shape === 'fir' || shape === 'single') { const n2 = shape === 'fir' ? 3 : 1; for (let k = 0; k < n2; k++) { const o = { x: cx + (k - (n2 - 1) / 2) * 50, y: cy - 10 - (k % 2) * 10, r: 46, conifer: true }; crownPath(g, o); g.stroke(); g.save(); crownPath(g, o); g.clip(); g.fillStyle = grey(205); g.fillRect(o.x - 60, o.y - 90, 60, 100); g.fillStyle = grey(105); g.fillRect(o.x, o.y - 90, 60, 100); g.restore(); } }
    if (shape === 'hill') { const w = 170, hh = 80; g.beginPath(); g.ellipse(cx, cy, w / 2, hh, 0, Math.PI, 0); g.closePath(); g.fillStyle = grey(200); g.fill(); g.save(); g.clip(); g.fillStyle = grey(110); g.beginPath(); g.ellipse(cx + 40, cy + 8, 70, 86, 0, Math.PI, 0); g.fill(); g.restore(); g.beginPath(); g.ellipse(cx, cy, w / 2, hh, 0, Math.PI, 0); g.stroke(); }
    if (shape === 'peak') { const q2 = peakGeom(cx, cy, 130, 180, R, false); peakPaint(g, q2, { lit: '#C8C8C8', shade: '#6E6E6E', ink: '#1E1E1E', lw: 6 }, { lw: 6 }, null); }
    g.restore();
  }
  return c;
}
// ---- the panel
const artPanel = document.createElement('div'); artPanel.className = 'artpanel'; artPanel.hidden = true; artPanel.setAttribute('role', 'dialog'); artPanel.setAttribute('aria-label', 'Try your art');
artPanel.innerHTML = `<header><b>Try your art</b><span class="dimtxt">mockup only · nothing is uploaded</span><button class="iconbtn" id="artClose" aria-label="Close">✕</button></header>
  <div class="row"><select id="artEntry" aria-label="Sheet entry">${Object.entries(ART_ENTRIES).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('')}</select></div>
  <div class="row"><label class="mbtn">Choose PNG… <input type="file" id="artFile" accept="image/png" hidden></label><button class="mbtn" id="artSample">Use a sample sheet</button><button class="mbtn" id="artBack">Back to procedural</button></div>
  <div class="artsum" id="artSum">Pick an entry and a PNG from ChatGPT. The sheet is checked, recolored into the palette and put on the map beside the procedural look.</div>
  <div class="artres" id="artRes"></div>`;
app.appendChild(artPanel);
const btnTryArt = document.getElementById('btnTryArt');
btnTryArt.addEventListener('click', () => { if (RELIEF() && artPanel.hidden) artPanel.querySelector('#artSum').textContent = 'These sheets are the Painted (v3) map\'s stamps: applying one switches Map look to Painted (v3). The relief map takes ground tiles, figures and town kits (design §11), not yet in this mockup.'; artPanel.hidden = !artPanel.hidden; btnTryArt.classList.toggle('on', !artPanel.hidden); btnTryArt.setAttribute('aria-expanded', String(!artPanel.hidden)); });
artPanel.querySelector('#artClose').addEventListener('click', () => { artPanel.hidden = true; btnTryArt.classList.remove('on'); });
function applyArt(entry, res) {
  const sum = artPanel.querySelector('#artSum'), out = artPanel.querySelector('#artRes');
  if (res.refusal) { sum.innerHTML = `<span class="bad">Refused.</span> ${res.refusal}`; out.innerHTML = ''; return; }
  if (RELIEF()) { setLook('v3'); toast('Your sheet is drawn on the Painted (v3) look. The relief map takes ground tiles, figures and town kits instead (design §11); those intakes are not in this mockup.'); } // v4
  if (entry === 'paper') { view.art.paper = { tile: res.tile }; }
  else if (entry === 'relief') view.art.relief = { hills: res.hills, peaks: res.peaks, frames: res.frames };
  else view.art[entry] = { frames: res.frames };
  sum.innerHTML = `<b>${ART_ENTRIES[entry].label}:</b> ${res.summary}${res.warnings.length ? '<br><span class="warn">Warnings: ' + res.warnings.join('; ') + '</span>' : ''}`;
  out.innerHTML = '';
  const frames = entry === 'paper' ? [res.tile] : res.frames;
  frames.slice(0, 24).forEach((f, k) => { // raw cut-out, recolored, and a swatch on its terrain's paint at Mid size
    const row = document.createElement('div'); row.className = 'artrow';
    const cell = (cv, bg) => { const x = makeCanvas(64, 64), xg = x.getContext('2d'); if (bg) { xg.fillStyle = bg; xg.fillRect(0, 0, 64, 64); } const s = Math.min(60 / cv.width, 60 / cv.height); xg.drawImage(cv, 32 - (cv.width * s) / 2, 32 - (cv.height * s) / 2, cv.width * s, cv.height * s); return x; };
    row.appendChild(cell(res.raws[k] ?? f, '#5A5246'));
    if (entry !== 'paper') { row.appendChild(cell(f, '#5A5246')); const t = res.terrains[k], sw = makeCanvas(64, 64), sg = sw.getContext('2d'); sg.fillStyle = TERRAIN[t].fill; sg.fillRect(0, 0, 64, 64); const wMid = (t === 'forest' ? 18 : t === 'hills' ? 22 : 20) * U * (180 / MED_DIAM); drawArtFrame(sg, { frames: [f] }, 32, 46, wMid, 0); row.appendChild(sw); }
    out.appendChild(row);
  });
  if (entry === 'paper') CLOTHB = null;
  invalidateBakes(); refreshKeys(); requestDraw();
}
async function tryArtFile(entry, blobOrCanvas) {
  const img = blobOrCanvas instanceof HTMLCanvasElement ? blobOrCanvas : await createImageBitmap(blobOrCanvas);
  const res = intakeSheet(img, entry); applyArt(entry, res); return res;
}
artPanel.querySelector('#artFile').addEventListener('change', (e) => { const f = e.target.files && e.target.files[0]; if (f) tryArtFile(artPanel.querySelector('#artEntry').value, f); e.target.value = ''; });
artPanel.querySelector('#artSample').addEventListener('click', () => { const en = artPanel.querySelector('#artEntry').value; tryArtFile(en, sampleSheet(en)); });
artPanel.querySelector('#artBack').addEventListener('click', () => { const en = artPanel.querySelector('#artEntry').value; delete view.art[en]; if (en === 'paper') CLOTHB = null; artPanel.querySelector('#artSum').textContent = `${ART_ENTRIES[en].label}: back to the procedural look.`; artPanel.querySelector('#artRes').innerHTML = ''; invalidateBakes(); refreshKeys(); requestDraw(); });
window.__mock.tryArt = (entry) => { artPanel.hidden = false; btnTryArt.classList.add('on'); artPanel.querySelector('#artEntry').value = entry; return tryArtFile(entry, sampleSheet(entry)).then((r) => r.summary); };

// ------------------------------------------------------------------ v3 step 14 and 15 review aids: the paint check (?paintcheck), the track check and the
// silhouette sheet (?silhouettes). Read-only helpers for automated review; the game UI never calls them.
function dE2000(l1, l2) {
  const [L1, a1, b1] = l1, [L2, a2, b2] = l2, rad = Math.PI / 180;
  const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2), Cm = (C1 + C2) / 2, G = 0.5 * (1 - Math.sqrt(Cm ** 7 / (Cm ** 7 + 25 ** 7)));
  const a1p = (1 + G) * a1, a2p = (1 + G) * a2, C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);
  const h1p = (Math.atan2(b1, a1p) / rad + 360) % 360, h2p = (Math.atan2(b2, a2p) / rad + 360) % 360;
  const dLp = L2 - L1, dCp = C2p - C1p; let dhp = h2p - h1p; if (C1p * C2p === 0) dhp = 0; else if (dhp > 180) dhp -= 360; else if (dhp < -180) dhp += 360;
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp / 2) * rad), Lpm = (L1 + L2) / 2, Cpm = (C1p + C2p) / 2;
  let hpm = h1p + h2p; if (C1p * C2p !== 0) { if (Math.abs(h1p - h2p) > 180) hpm += h1p + h2p < 360 ? 360 : -360; hpm /= 2; }
  const T = 1 - 0.17 * Math.cos((hpm - 30) * rad) + 0.24 * Math.cos(2 * hpm * rad) + 0.32 * Math.cos((3 * hpm + 6) * rad) - 0.2 * Math.cos((4 * hpm - 63) * rad);
  const dTh = 30 * Math.exp(-(((hpm - 275) / 25) ** 2)), Rc = 2 * Math.sqrt(Cpm ** 7 / (Cpm ** 7 + 25 ** 7)), Sl = 1 + (0.015 * (Lpm - 50) ** 2) / Math.sqrt(20 + (Lpm - 50) ** 2), Sc = 1 + 0.045 * Cpm, Sh = 1 + 0.015 * Cpm * T, Rt = -Math.sin(2 * dTh * rad) * Rc;
  return Math.sqrt((dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh));
}
const CVD = { protan: [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998], deutan: [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182, 0.04294, 0.968881], tritan: [1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.3039] };
function cvdRgb(rgb, m) { const l = rgb.map(s2l), o = [0, 1, 2].map((r) => m[r * 3] * l[0] + m[r * 3 + 1] * l[1] + m[r * 3 + 2] * l[2]); return o.map((v) => l2s(Math.max(0, Math.min(1, v)))); }
function meanRgbIn(i, band, opt) { // bake a province and average its polygon's pixels (linear light), returned as sRGB
  const G = geo(i), bb = [G.bb[0] - 2, G.bb[1] - 2, G.bb[2] + 2, G.bb[3] + 2], res = BAND_RES[band];
  const B = bakeWorld(bb, res, (g) => drawProvinceDeco(g, i, band, opt)), c = B.canvas, w = c.width, h = c.height;
  const m = makeCanvas(w, h), mg = m.getContext('2d', { willReadFrequently: true }); mg.setTransform(res, 0, 0, res, -bb[0] * res, -bb[1] * res); pathPoly(mg, G.poly); mg.fillStyle = '#000'; mg.fill();
  const rd = makeCanvas(w, h), rg = rd.getContext('2d', { willReadFrequently: true }); rg.drawImage(c, 0, 0);
  const md = mg.getImageData(0, 0, w, h).data, d = rg.getImageData(0, 0, w, h).data; const acc = [0, 0, 0]; let n = 0;
  for (let k = 0; k < w * h; k++) { if (md[k * 4 + 3] < 255 || d[k * 4 + 3] < 250) continue; acc[0] += s2l(d[k * 4]); acc[1] += s2l(d[k * 4 + 1]); acc[2] += s2l(d[k * 4 + 2]); n++; }
  return acc.map((v) => l2s(v / Math.max(1, n)));
}
function paintCheck() {
  const t0 = performance.now(), per = {}, lines = [];
  for (const i of provList) {
    if (fogOf(i) === 'unexplored') continue; const t = terr[i], f = TERRAIN[t].fill, rgb = meanRgbIn(i, 'mid', { paintOnly: true }), lab = rgb2lab(rgb), fl = rgb2lab(hex2rgb(f)), d = dE2000(lab, fl);
    (per[t] ??= []).push({ d, dL: lab[0] - fl[0] });
  }
  const table = Object.entries(per).map(([t, a]) => ({ terrain: t, fill: TERRAIN[t].fill, n: a.length, meanDE: +(a.reduce((s, q) => s + q.d, 0) / a.length).toFixed(2), worstDE: +Math.max(...a.map((q) => q.d)).toFixed(2), meanDL: +(a.reduce((s, q) => s + q.dL, 0) / a.length).toFixed(2), lift: PAINT[t].lift, pass: Math.max(...a.map((q) => q.d)) <= 2.0 }));
  // (2) at Far with the full decoration: terrain pairs between the provinces' full means, normal and under each deficiency
  const means = {};
  for (const i of provList) { if (fogOf(i) === 'unexplored') continue; const rgb = meanRgbIn(i, 'far', {}); (means[terr[i]] ??= []).push(rgb); }
  const tm = Object.fromEntries(Object.entries(means).map(([t, a]) => [t, [0, 1, 2].map((c) => l2s(a.reduce((s, q) => s + s2l(q[c]), 0) / a.length))]));
  const pairs = [], ts = Object.keys(tm);
  for (let a = 0; a < ts.length; a++) for (let b = a + 1; b < ts.length; b++) {
    const A = tm[ts[a]], B2 = tm[ts[b]], row = { pair: ts[a] + '/' + ts[b], normal: +dE2000(rgb2lab(A), rgb2lab(B2)).toFixed(1) };
    for (const [k, m] of Object.entries(CVD)) row[k] = +dE2000(rgb2lab(cvdRgb(A, m)), rgb2lab(cvdRgb(B2, m))).toFixed(1);
    row.under = row.normal < 20 || row.protan < 12 || row.deutan < 12 || row.tritan < 12; pairs.push(row);
  }
  const out = { ms: Math.round(performance.now() - t0), palette: view.palette, paint: table, farPairsUnder: pairs.filter((r) => r.under), farPairs: pairs };
  console.log('PAINTCHECK ' + JSON.stringify(out)); return out;
}
const wcag = (a, b) => { const la = 0.2126 * s2l(a[0]) + 0.7152 * s2l(a[1]) + 0.0722 * s2l(a[2]), lb = 0.2126 * s2l(b[0]) + 0.7152 * s2l(b[1]) + 0.0722 * s2l(b[2]); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); };
function trackCheck() { // on Mountains track halves at the current zoom: the dot peak and the line average against the ground beside them
  const sample = () => { draw(); const W2 = canvas.width, H2 = canvas.height, cp = makeCanvas(W2, H2), g = cp.getContext('2d', { willReadFrequently: true }); g.drawImage(canvas, 0, 0); const all = g.getImageData(0, 0, W2, H2).data; return (x, y) => { const X = Math.max(0, Math.min(W2 - 1, Math.round(x * dpr))), Y = Math.max(0, Math.min(H2 - 1, Math.round(y * dpr))), k = (Y * W2 + X) * 4; return [all[k], all[k + 1], all[k + 2]]; }; };
  const L = (c) => 0.2126 * s2l(c[0]) + 0.7152 * s2l(c[1]) + 0.0722 * s2l(c[2]), med = (a) => { const b = [...a].sort((x, y) => x - y); return b.length ? b[b.length >> 1] : null; };
  const groundAt = (px, x, y, nx, ny) => { const c = [4, -4, 5, -5, 6, -6].map((d) => px(x + nx * d, y + ny * d)); c.sort((p, q) => L(p) - L(q)); return c[c.length >> 1]; };
  const measure = (px, P, darkInk, drop) => { // P: screen points along the line, about 1 px apart; drop(x, y): where the dots are left out by design
    const peaks = [], avgs = [];
    for (let m = 2; m < P.length - 6; m += 5) {
      const [x, y] = P[m], [x2, y2] = P[m + 4], dx = x2 - x, dy = y2 - y, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l; if (x < 5 || y < 90 || x > cw - 5 || y > ch - 5) continue;
      if (drop && P.slice(m, m + 5).some((q) => drop(q[0], q[1]))) continue;
      const ground = groundAt(px, x, y, nx, ny); let best = null;
      for (let q = m; q < m + 4; q++) for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const c = px(P[q][0] + a * 0.5, P[q][1] + b * 0.5); if (!best || (darkInk ? L(c) < L(best) : L(c) > L(best))) best = c; }
      peaks.push(wcag(best, ground)); const acc = [0, 0, 0]; for (let q = m; q < m + 5; q++) { const c = px(...P[q]); for (let k = 0; k < 3; k++) acc[k] += s2l(c[k]); } avgs.push(wcag(acc.map((v) => l2s(v / 5)), ground));
    }
    return { peak: med(peaks), avg: med(avgs), n: peaks.length };
  };
  const along = (W3) => { const out = []; for (let k = 0; k < W3.length - 1; k++) { const [x0, y0] = toScreen(...W3[k]), [x1, y1] = toScreen(...W3[k + 1]), n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0))); for (let t = 0; t < n; t++) out.push([x0 + ((x1 - x0) * t) / n, y0 + ((y1 - y0) * t) / n]); } return out; };
  let px = sample(); const res = { tracks: [], footpath: [] };
  const band = bandOf(cam.s), placed = layoutLabels(band).placed;
  for (const h of feats().tracks.filter((q) => terr[q.s] === 'mountains' && fogOf(q.s) !== 'unexplored').slice(0, 20)) {
    const z = zones(h.s, band), lz = [z[0], z[1]], drop = (sx, sy) => { const [x, y] = toWorld(sx, sy); return inBoxes(lz, x, y, 4 / cam.s) || inBoxes(placed, sx, sy, 4); };
    const r = measure(px, along(h.pts.filter((q, k) => h.L[k] > 3 / cam.s)), h.ink === FEATURE_INK, drop); if (r.n) res.tracks.push({ prov: names[h.s], ...r });
  }
  view.footpath = true; invalidateBakes(); firstPaint = true; px = sample();
  for (const i of provList.filter((q) => terr[q] === 'mountains' && fogOf(q) !== 'unexplored')) { // the R34 footpath, for comparison
    const G = geo(i), poly = G.poly, edges = []; for (let k = 0; k < cells[i].length - 1; k++) edges.push([cells[i][k], cells[i][k + 1], Math.hypot(cells[i][k + 1][0] - cells[i][k][0], cells[i][k + 1][1] - cells[i][k][1])]);
    edges.sort((a, b) => b[2] - a[2]); const mid = (e) => [(e[0][0] + e[1][0]) / 2, (e[0][1] + e[1][1]) / 2], ins = (q) => [q[0] + (G.c[0] - q[0]) * 0.12, q[1] + (G.c[1] - q[1]) * 0.12], A0 = ins(mid(edges[0])), B0 = ins(mid(edges[1])), ctl = [G.seat[0], G.seat[1] + 6];
    const Wq = []; for (let k = 0; k <= 40; k++) { const u = k / 40; Wq.push([(1 - u) ** 2 * A0[0] + 2 * u * (1 - u) * ctl[0] + u * u * B0[0], (1 - u) ** 2 * A0[1] + 2 * u * (1 - u) * ctl[1] + u * u * B0[1]]); }
    const r = measure(px, along(Wq), true); if (r.n) res.footpath.push({ prov: names[i], ...r }); void poly;
  }
  view.footpath = false; invalidateBakes(); firstPaint = true; draw();
  const summ = (a) => ({ medianPeak: med(a.map((t) => t.peak)), medianAvg: med(a.map((t) => t.avg)), minPeak: Math.min(...a.map((t) => t.peak)), minAvg: Math.min(...a.map((t) => t.avg)), n: a.length });
  res.trackSummary = summ(res.tracks); res.footpathSummary = summ(res.footpath); res.scale = +cam.s.toFixed(3);
  console.log('TRACKCHECK ' + JSON.stringify({ tracks: res.trackSummary, footpath: res.footpathSummary, scale: res.scale })); return res;
}
// ---- the silhouette sheet: every scenery shape beside every reserved shape, greyscale, filled and as fog line art
function silhouetteSheet() {
  const P0 = (line) => ({ lit: '#B8B8B8', shade: '#6A6A6A', ink: '#222', lw: 1, PX: 1, line, fill: '#909090', trunk: '#444', painted: true });
  const R = () => rngFor('sil');
  const sc = []; const rs = [];
  const add = (list, name, fn) => list.push({ name, fn });
  add(sc, 'clump', (g, P) => drawClump(g, makeClump(0, 0, 5, R(), 0, [4.5, 6.5]), P)); add(sc, 'conifer', (g, P) => drawClump(g, makeClump(0, 0, 3, R(), 1), P)); for (const n of [2, 3, 4]) add(sc, 'hills ' + n, (g, P) => { const Rq = R(); hillRange(g, hillRangeGeom(0, 0, 24, Rq, n), P, Rq); }); // v3 critique 4: ranges, never a lone dome
  for (const n of [3, 5]) add(sc, 'peaks ' + n, (g, P) => { const Rq = R(); for (const q of peakRangeGeom(0, 0, 16, Rq, n)) peakPaint(g, peakGeom(q.x, q.y, q.h, q.w, Rq, false), { lit: '#B4C1C6', shade: '#6E7F86', ink: INK, lw: 1 }, P, P.line); }); add(sc, 'sheaves', (g, P) => sheafRow(g, 0, 0, P, 3, 0, P.line)); add(sc, 'outcrop', (g, P) => stampShape(g, { terrain: 'wasteland' }, { x: 0, y: 0, v: 0.3 }, false, 1, R(), { ...P, painted: true }, {})); add(sc, 'reed bed', (g, P) => stampShape(g, { terrain: 'swamp' }, { x: 0, y: 0, v: 0.3 }, false, 1, R(), { ...P, painted: true }, {})); add(sc, 'tufts', (g, P) => stampShape(g, { terrain: 'plains' }, { x: 0, y: 0, v: 0.5 }, false, 1, R(), { ...P, painted: true }, {})); sc.push({ name: 'grass tuft', noLine: true, fn: (g, P) => { const L = 2.9 * U; g.strokeStyle = P.shade; g.lineWidth = 0.9; g.lineCap = 'round'; g.beginPath(); for (const da of [-0.3, 0, 0.3]) { const l = da ? 0.75 * L : L; g.moveTo(0, 0); g.lineTo(Math.cos(-Math.PI / 2 + da) * l, Math.sin(-Math.PI / 2 + da) * l); } g.stroke(); g.lineCap = 'butt'; } }); // palette-ab fix 3: Painted's grass, one tuft, filled only (ground marks are never drawn as fog line art)
  for (const k of Object.keys(LANDMARKS)) add(sc, k, (g, P) => drawLandmark(g, k, 0, 0, 1, P, P.line, false, false));
  for (const k of Object.keys(HEROES)) add(sc, k, (g, P) => drawLandmark(g, k, 0, 0, 1, P, P.line, false, true, 0.9));
  for (const k of ['sheep', 'deer', 'heron', 'goats', 'cows', 'hare']) add(sc, k, (g) => vignette(g, k, 0, 0, 1, R()));
  add(rs, 'camp dome', (g, P) => campTent(g, 0, 0, 1, P.line)); add(rs, 'beast den', (g) => beastDen(g, 0, 0, 1)); add(rs, 'siege tent', (g) => { g.fillStyle = '#888'; g.beginPath(); g.moveTo(-4, 0); g.lineTo(0, -6); g.lineTo(4, 0); g.closePath(); g.fill(); });
  add(rs, 'standing stone', (g) => mossStone(g, 0, 0, 1)); add(rs, 'shard', (g) => shard(g, 0, 0, 1)); add(rs, 'cairn', (g) => cairn(g, 0, 0, 1.4, 1, false)); add(rs, 'house', (g) => house(g, { x: 0, y: 0 }, null, 1, {}));
  add(rs, 'shrine', (g) => landmark(g, 'temple', null, 0, 0, 1)); add(rs, 'smoke', (g) => smokeWisp(g, 0, 0, 1)); add(rs, 'cart', (g) => toppledCart(g, 0, 0, 1)); add(rs, 'skull', (g, P) => skull(g, 0, 0, P)); add(rs, 'pennant', (g) => pennant(g, 0, 0, '#888', 1));
  add(rs, 'bare tree', (g, P) => snag(g, 0, 0, 7, P)); add(rs, 'brazier', (g) => brazier(g, 0, 0, 1)); add(rs, 'blossom', (g) => blossomBush(g, 0, 0, 1, R()));
  const cellPx = 72, k = 3.2, host = document.createElement('div'); host.className = 'silsheet';
  const CS = 240; // each shape on a large card (no clipping), shown at 72 px
  const mk = (list, line) => list.map((it) => { const c = makeCanvas(CS, CS), g = c.getContext('2d', { willReadFrequently: true }); g.fillStyle = '#E8E4DA'; g.fillRect(0, 0, CS, CS); g.filter = 'grayscale(1)'; g.translate(CS / 2, CS * 0.7); g.scale(k, k); try { it.fn(g, P0(line ? '#3E3428' : null)); } catch (e) { void e; } c.style.width = cellPx + 'px'; c.style.height = cellPx + 'px'; return { c, name: it.name }; });
  const iou = (a, b) => { const A = mask48(a), B2 = mask48(b); let i2 = 0, u = 0; for (let m = 0; m < A.length; m++) { if (A[m] || B2[m]) u++; if (A[m] && B2[m]) i2++; } return u ? i2 / u : 0; };
  const sec = (title, list) => `<h3>${title}</h3><div class="silrow">${list.map((q, j) => `<figure data-k="${title}${j}"><figcaption>${q.name}</figcaption></figure>`).join('')}</div>`;
  const scF = mk(sc, false), scL = mk(sc.filter((q) => !q.noLine), true), rsF = mk(rs, false), rsL = mk(rs, true);
  let worst = { f: 0, l: 0, fp: '', lp: '' };
  const over = [];
  for (const a of scF) for (const b of rsF) { const v = iou(a.c, b.c); if (v >= 0.7) over.push(`${a.name}/${b.name} ${v.toFixed(2)}`); if (v > worst.f) worst = { ...worst, f: v, fp: a.name + ' / ' + b.name }; }
  for (const a of scL) for (const b of rsL) { const v = iou(a.c, b.c); if (v >= 0.6) over.push(`line ${a.name}/${b.name} ${v.toFixed(2)}`); if (v > worst.l) worst = { ...worst, l: v, lp: a.name + ' / ' + b.name }; }
  worst.over = over;
  host.innerHTML = `<header><b>Silhouettes</b> · scenery against reserved shapes, greyscale, at 3.2x Mid size. Highest IoU filled ${worst.f.toFixed(2)} (${worst.fp}, limit 0.70); line art ${worst.l.toFixed(2)} (${worst.lp}, limit 0.60). Masks fitted to their bounding box with the aspect kept, so size and color, which also tell these apart, do not count. Over the limit: ${over.join('; ') || 'none'}.</header>` + sec('Scenery, filled', scF) + sec('Scenery, fog line art', scL) + sec('Reserved, filled', rsF) + sec('Reserved, fog line art', rsL);
  document.body.appendChild(host);
  const shown = (c) => { // the card cropped to its shape and fitted to the cell
    const g = c.getContext('2d', { willReadFrequently: true }), d = g.getImageData(0, 0, c.width, c.height).data; let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
    for (let q = 0; q < c.width * c.height; q++) if (d[q * 4] < 200 || d[q * 4 + 1] < 200) { const x = q % c.width, y = (q / c.width) | 0; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    const o = makeCanvas(cellPx * 2, cellPx * 2), og = o.getContext('2d'); og.fillStyle = '#E8E4DA'; og.fillRect(0, 0, o.width, o.height); if (x1 >= x0) { const side = Math.max(x1 - x0, y1 - y0) + 8, sc = (o.width - 12) / side; og.drawImage(c, x0 - 4, y0 - 4, side, side, 6 + ((side - (x1 - x0 + 8)) / 2) * sc, 6 + ((side - (y1 - y0 + 8)) / 2) * sc, side * sc, side * sc); }
    o.style.width = cellPx + 'px'; o.style.height = cellPx + 'px'; return o;
  };
  for (const [title, list] of [['Scenery, filled', scF], ['Scenery, fog line art', scL], ['Reserved, filled', rsF], ['Reserved, fog line art', rsL]]) list.forEach((q, j) => host.querySelector(`[data-k="${title}${j}"]`).prepend(shown(q.c)));
  return worst;
}
function mask48(c) { // the shape's mask normalized to its bounding box on a 48 square
  const g = c.getContext('2d'), d = g.getImageData(0, 0, c.width, c.height).data; let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
  const on = (k) => d[k * 4] < 200 || d[k * 4 + 1] < 200; // not the light card
  for (let k = 0; k < c.width * c.height; k++) if (on(k)) { const x = k % c.width, y = (k / c.width) | 0; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  const out = new Uint8Array(48 * 48); if (x1 < x0) return out;
  const side = Math.max(x1 - x0 + 1, y1 - y0 + 1), ox = x0 - (side - (x1 - x0 + 1)) / 2, oy = y0 - (side - (y1 - y0 + 1)) / 2; // normalized to the bounding box, aspect kept
  for (let y = 0; y < 48; y++) for (let x = 0; x < 48; x++) { const sx = Math.floor(ox + ((x + 0.5) / 48) * side), sy = Math.floor(oy + ((y + 0.5) / 48) * side); out[y * 48 + x] = sx >= 0 && sy >= 0 && sx < c.width && sy < c.height && on(sy * c.width + sx) ? 1 : 0; }
  return out;
}
window.__mock.silhouettes = () => silhouetteSheet();
{
  const qs = new URLSearchParams(location.search);
  if (qs.has('paintcheck')) setTimeout(() => paintCheck(), 1500);
  if (qs.has('silhouettes')) setTimeout(() => silhouetteSheet(), 800);
  if (qs.has('footpath')) { view.footpath = true; invalidateBakes(); requestDraw(); } // the R34 footpath on Mountains (tracks replace it; see the track check)
}

// ---- step 15 checks: hit tests on wobbling borders, the label test, the bake counter while an army moves, a stable redraw
function hitCheck() {
  const R = rngFor('hitcheck'), keys = [...EDGE.keys()].filter((k) => { const e = EDGE.get(k); return !isWild(e.i) && !isWild(e.j); }); let bad = 0, n = 0;
  for (let t = 0; t < 200; t++) {
    const e = EDGE.get(keys[Math.floor(R() * keys.length)]), P = edgePts(e), Lc = cumLen(P), d = (0.1 + 0.8 * R()) * Lc[Lc.length - 1], q = arcAt(P, Lc, d), a = arcAt(P, Lc, d - 1), b = arcAt(P, Lc, d + 1), l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, off = (R() < 0.5 ? -1 : 1) * (0.6 + 1.8 * R());
    const x = q[0] - ((b[1] - a[1]) / l) * off, y = q[1] + ((b[0] - a[0]) / l) * off, truth = [...Array(N).keys()].find((i) => d3.polygonContains(npoly[i], [x, y]));
    if (truth == null) continue; n++; if (provinceAt(x, y) !== truth) bad++;
  }
  return { samples: n, wrong: bad };
}
function labelCheck() {
  const band = bandOf(cam.s), lay = layoutLabels(band), shown = new Set(lay.ops.filter((o) => o.t === 'p').map((o) => o.p.i));
  const vis = provs.filter((p) => { const [sx, sy] = toScreen(...cent[p.i]); return sx > 0 && sy > 90 && sx < cw && sy < ch; });
  const over = lay.ops.filter((o) => o.t === 'p').filter((o) => lay.tokenBoxes.some((b) => o.sx > b[0] && o.sx < b[2] && o.sy - 6 > b[1] && o.sy - 6 < b[3])).length;
  return { band, scale: +cam.s.toFixed(3), visible: vis.length, named: vis.filter((p) => shown.has(p.i)).length, pct: +((100 * vis.filter((p) => shown.has(p.i)).length) / Math.max(1, vis.length)).toFixed(1), namesOverTokens: over };
}
function stableCheck() { // render the static layers twice from scratch and compare
  const snap = () => { invalidateBakes(); firstPaint = true; CK = null; draw(); const cp = makeCanvas(canvas.width, canvas.height), cg = cp.getContext('2d', { willReadFrequently: true }); cg.drawImage(canvas, 0, 0); const d = cg.getImageData(0, 0, canvas.width, canvas.height).data; let h = 0x811c9dc5; for (let k = 0; k < d.length; k += 7) { h ^= d[k]; h = Math.imul(h, 0x01000193); } return h >>> 0; };
  const a = snap(), b = snap(); return { first: a, second: b, identical: a === b };
}
function zoneCheck() { // stamps, water and track dots against the fixed zones; track clearance from the borders outside the crossing zone
  const F = feats(), inZ = (z, x, y) => x > z[0] && x < z[2] && y > z[1] && y < z[3], out = { stamps: { label: 0, second: 0, seat: 0, token: 0, n: 0 }, water: { label: 0, second: 0, seat: 0, token: 0, n: 0 }, dots: { label: 0, second: 0, token: 0, n: 0 }, clearance: { n: 0, under: 0, min: Infinity, fallbacks: {} } };
  const tally = (o, i, band, x, y, seat = true) => { const z = zones(i, band); o.n++; if (inZ(z[0], x, y)) o.label++; if (inZ(z[1], x, y)) o.second++; if (z[2] && inZ(z[2], x, y)) o.token++; if (seat && inZ(z[3], x, y)) o.seat++; };
  for (const i of provList) {
    for (const band of ['mid', 'near']) { for (const s of stampSlotsFor(i, band)) if (!(terr[i] === 'forest' && PAINTED() && fogOf(i) !== 'unexplored')) tally(out.stamps, i, band, s.x, s.y);
      if (terr[i] === 'forest' && PAINTED() && fogOf(i) !== 'unexplored') for (const q of canopyFor(i, band)) tally(out.stamps, i, band, q.x, q.y); // the canopy's crowns
      const w = F.water.get(i); if (w) { if (w.pond) tally(out.water, i, band, w.pond.x, w.pond.y); if (w.brook) w.brook.forEach((q, k) => { if (!(k === 0 && prov[i].well)) tally(out.water, i, band, q[0], q[1]); }); } }
  }
  const sp = 2.5 / DESIGN.mid, C = 10 * U, S0 = 15 * U;
  for (const h of F.tracks) {
    out.clearance.fallbacks[h.fallback] = (out.clearance.fallbacks[h.fallback] ?? 0) + 1;
    const d = trackDots(h, sp), seat = geo(h.s).seat, el = seatEllipse(h.s);
    const z = zones(h.s, 'mid'), lz = [z[0], z[1]];
    for (let m = 0; m < d.length; m += 3) { const x = d[m], y = d[m + 1], dd = d[m + 2]; if (!inBoxes(lz, x, y, 2 / DESIGN.mid)) tally(out.dots, h.s, 'mid', x, y, false);
      if (dd <= h.lastLen || h.corner || Math.hypot(x - seat[0], y - seat[1]) <= S0 + Math.max(el.rx, el.ry)) continue;
      const b = distToEdge(npoly[h.s], x, y); out.clearance.n++; if (b < C - 0.5 * U) out.clearance.under++; if (b < out.clearance.min) out.clearance.min = b; }
  }
  out.clearance.min = +(out.clearance.min / U).toFixed(2); out.clearance.unit = 'u (C = 10 u)'; return out;
}
window.__mock.checks = () => ({ hit: hitCheck(), labels: labelCheck(), zones: zoneCheck(), stable: stableCheck(), bakes: BAKECOUNT });
// v3 critique re-run: the §5.4 density counts (standing items per average province, coverage of items and ponds) per terrain and band,
// the canopy's crown coverage of its free area, and each province's Mid and Near bake time (§7.2: 16 ms and 25 ms)
function densityCheck() {
  const out = { bands: {}, bake: {} };
  for (const band of ['mid', 'near']) {
    const per = {}, times = [];
    for (const i of provList) {
      if (fogOf(i) === 'unexplored') continue;
      const G = geo(i), bb = [G.bb[0] - 2, G.bb[1] - 30, G.bb[2] + 2, G.bb[3] + 8], res = Math.min(1.2, BAND_RES[band]), st = {}, k = areaOf[i] / MEAN_AREA;
      const B = bakeWorld(bb, res, (g) => drawProvinceDeco(g, i, band, { itemsOnly: true, stats: st }), true), c = B.canvas, w = c.width, h = c.height;
      const m = makeCanvas(w, h), mg = m.getContext('2d', { willReadFrequently: true }); mg.setTransform(res, 0, 0, res, -bb[0] * res, -bb[1] * res); pathPoly(mg, G.poly); mg.fillStyle = '#000'; mg.fill();
      const rd = makeCanvas(w, h), rg = rd.getContext('2d', { willReadFrequently: true }); rg.drawImage(c, 0, 0);
      const md = mg.getImageData(0, 0, w, h).data, d = rg.getImageData(0, 0, w, h).data; let inP = 0, on = 0;
      for (let q = 0; q < w * h; q++) { if (md[q * 4 + 3] < 128) continue; inP++; if (d[q * 4 + 3] > 64) on++; }
      const pond = feats().water.get(i)?.pond, pondA = pond ? Math.PI * pond.r * pond.r * 0.75 : 0, cov = (on / Math.max(1, inP)) + pondA / areaOf[i];
      let crownCov = null; if (terr[i] === 'forest') { // the canopy's coverage of its free area: free points (the sampler's own tests on a crown's visual center) under a crown pixel
        const zb = zones(i, band), zS = [zb[0], zb[1], zb[3]], se = settleExtent(i), gl = CANOPY.get(i)?.glades ?? [], Rq = rngFor('freecheck'), r = 5.5 * U; let f = 0, c = 0;
        const freeInset = (PAINTED_PAL() && !prov[i].owner ? 0 : B_U) + 2 * U, freeBlocked = PAINTED_PAL() ? canopyBlocked : stampBlocked; // the sampler's own free area (fix 1 under Painted)
        for (let t = 0; t < 6000; t++) { const x = G.bb[0] + Rq() * (G.bb[2] - G.bb[0]), y = G.bb[1] + Rq() * (G.bb[3] - G.bb[1]); if (!inPoly(G.poly, x, y)) continue; const cy = y + 0.95 * r;
          if (Math.hypot(x - G.seat[0], (cy - G.seat[1]) * 1.3) < 1.3 * se || gl.some(([gx, gy, gr]) => Math.hypot(x - gx, cy - gy) < gr) || !inPoly(cells[i], x, y) || distToEdge(cells[i], x, y) - 6 < freeInset || freeBlocked(i, x, y, r) || boxHit(zS, x - r, cy - 2 * r, x + r, cy)) continue;
          f++; const px = Math.floor((x - bb[0]) * res), py = Math.floor((y - bb[1]) * res); if (px >= 0 && py >= 0 && px < w && py < h && d[(py * w + px) * 4 + 3] > 64) c++; }
        crownCov = c / Math.max(1, f); }
      (per[terr[i]] ??= []).push({ items: st.items / k, cov, crownCov, clumps: st.clumps, crowns: st.crowns, ranges: st.ranges, parts: st.rangeParts, k });
      const t0 = performance.now(); bakeWorld(bb, spriteRes(band), (g) => drawProvinceDeco(g, i, band), band !== 'near'); times.push(performance.now() - t0);
    }
    const r1 = (v) => +v.toFixed(2), avg = (a) => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
    out.bands[band] = Object.fromEntries(Object.entries(per).map(([t, a]) => [t, { n: a.length, itemsPerAvg: r1(avg(a.map((q) => q.items))), itemsMax: r1(Math.max(...a.map((q) => q.items))), covMean: r1(avg(a.map((q) => q.cov))), covMax: r1(Math.max(...a.map((q) => q.cov))), ...(t === 'forest' ? { crownCovOfFree: r1(avg(a.map((q) => q.crownCov))), crownCovMin: r1(Math.min(...a.map((q) => q.crownCov))), crownCovMax: r1(Math.max(...a.map((q) => q.crownCov))), clumpsMax: Math.max(...a.map((q) => q.clumps)), crowns: Math.round(avg(a.map((q) => q.crowns))) } : {}), ...(t === 'hills' || t === 'mountains' ? { ranges: r1(avg(a.map((q) => q.ranges / q.k))), partsPerRange: r1(avg(a.map((q) => q.parts / Math.max(1, q.ranges)))) } : {}) }]));
    times.sort((a, b) => a - b); out.bake[band] = { mean: r1(avg(times)), p95: r1(times[Math.floor(times.length * 0.95)]), max: r1(times[times.length - 1]) };
  }
  return out;
}
window.__mock.density = () => densityCheck();
window.__mock.bakes = () => BAKECOUNT;

// spring stones are baked only once their symbol image has loaded; a late image invalidates those provinces' Near bakes
for (const c of 'WUBRG') if (!manaImg[c].complete) manaImg[c].addEventListener('load', () => { for (const p of provs) if (p.springs.includes(c)) SPR.delete('near:' + p.i); requestDraw(); });

// frame times: per-frame draw cost and the rAF interval while panning (p95), as perf.cjs's panFps but with percentiles
window.__mock.panStats = (dx = 3, n = 90) => new Promise((res) => { const iv = [], dc = []; let k = 0, last = 0; const step = (now) => { if (last) iv.push(now - last); last = now; if (k >= n) { const q = (a, p) => { const b = [...a].sort((x, y) => x - y); return +b[Math.min(b.length - 1, Math.floor(p * b.length))].toFixed(2); }; res({ intervalP50: q(iv, 0.5), intervalP95: q(iv, 0.95), drawP50: q(dc, 0.5), drawP95: q(dc, 0.95), drawMax: +Math.max(...dc).toFixed(2) }); return; } cam.x += k % 40 < 20 ? dx : -dx; clampCam(); const t0 = performance.now(); draw(); dc.push(performance.now() - t0); k++; requestAnimationFrame(step); }; requestAnimationFrame(step); });

// ------------------------------------------------------------------ v4 relief: review checks (window.__mock.relief*). Read-only helpers for automated review.
// Every color check reads the rendered canvas (the composite as drawn), never the design's tables.
const rlHashPx = (d) => { let h = 0x811c9dc5; for (let k = 0; k < d.length; k += 3) { h ^= d[k]; h = Math.imul(h, 0x01000193); } return h >>> 0; };
function rlReadCanvas() { const W2 = canvas.width, H2 = canvas.height; return ctx.getImageData(0, 0, W2, H2).data; }
function rlRedraw(skip) { // a from-scratch frame with some layers off; returns the main canvas pixels
  const was = new Set(SKIP); for (const k of skip ?? []) SKIP.add(k); RCK = null; draw(); const d = rlReadCanvas(); SKIP.clear(); for (const k of was) SKIP.add(k); RCK = null; draw(); return d;
}
const rlLab = (rgb) => rgb2lab(rgb), rlCvd = (rgb, m) => cvdRgb(rgb, m);
function rlPairDE(a, b) { const o = { normal: dE2000(rlLab(a), rlLab(b)) }; for (const [k, m] of Object.entries(CVD)) o[k] = dE2000(rlLab(rlCvd(a, m)), rlLab(rlCvd(b, m))); o.cvd = Math.min(o.protan, o.deutan, o.tritan); return o; }
// the expected color of a province's core in its state (albedo; the unexplored haze; the out-of-sight desaturation as the canvas blends it; the land-look wash)
function rlExpected(p) {
  let c = hex2rgb(RL_ALB[p.terrain]); const f = fogOf(p.i);
  if (f === 'unexplored') c = c.map((v, j) => v + (hex2rgb(RL_C.gesso)[j] - v) * RL_P.haze);
  else if (f === 'outofsight') { const L = 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]; c = c.map((v) => v * (1 - RL_P.outSat) + L * RL_P.outSat); }
  else if (p.dom.n && RL_WASH[p.dom.n] && state.mode === 'ownership') { const w = hex2rgb(RL_WASH[p.dom.n][0]), a = (RL_WASH[p.dom.n][1] * p.dom.s) / 10; c = c.map((v, j) => v + (w[j] - v) * a); }
  return c;
}
// (1) province means on the rendered composite: pure-terrain core pixels beyond 0.06 D of every edge, off the water; rails, pieces and labels off.
// natural N2, N5: the province-mean and terrain-pair rules bind Clear and the Terrain mode; in Natural the readability check stands in (reliefNatural, p88)
function rlMeansCheck() {
  if (rlShownLook() !== 'clear') return { applicable: false, look: rlShownLook(), note: 'not applicable (Natural): the province-mean and 20 / 12 terrain-pair rules bind Clear terrain colours and the Terrain mode; reliefNatural() holds the natural view' };
  const d = rlRedraw(['rails', 'pieces', 'labels', 'badges', 'arrows']), W2 = canvas.width, H2 = canvas.height, { BW, TX, id, pure } = RB, acc = new Map();
  const wm = makeCanvas(W2, H2), wg = wm.getContext('2d', { willReadFrequently: true }); worldT(wg); wg.fillStyle = '#fff'; wg.strokeStyle = '#fff'; wg.lineCap = 'round';
  for (const L of [...RB.water.lakes, ...RB.water.ponds]) { wg.beginPath(); L.P.forEach(([x, y], k) => (k ? wg.lineTo(x, y) : wg.moveTo(x, y))); wg.closePath(); wg.fill(); wg.lineWidth = 6 * RLK; wg.stroke(); }
  for (const s of RB.water.streams) { wg.lineWidth = 2 * (s.w1 + 3 * RLK); wg.beginPath(); s.pts.forEach(([x, y], k) => (k ? wg.lineTo(x, y) : wg.moveTo(x, y))); wg.stroke(); }
  const wd = wg.getImageData(0, 0, W2, H2).data, edgeK = 0.06 * RLD; // the core is the bake's own (pure terrain, eroded 4 texels, beyond 0.06 D)
  const full = new Set(provList.filter((i) => { const b = geo(i).bb, [a0, b0] = toScreen(b[0], b[1]), [a1, b1] = toScreen(b[2], b[3]); return a0 >= 0 && b0 >= 0 && a1 <= cw && b1 <= ch; })); // provinces wholly in view
  for (let py = 0; py < H2; py++) for (let px = 0; px < W2; px++) {
    const k4 = (py * W2 + px) * 4; if (wd[k4 + 3] > 0) continue; const [x, y] = toWorld((px + 0.5) / dpr, (py + 0.5) / dpr); if (!inModel(x, y)) continue;
    const t = Math.floor(y * TX) * BW + Math.floor(x * TX), i = id[t]; if (i === 255 || RL_WILDK[i] || !pure[t] || !full.has(i)) continue;
    if (distToEdge(cells[i], x, y) < edgeK) continue;
    let a = acc.get(i); if (!a) acc.set(i, (a = [0, 0, 0, 0, 0, 0, 0])); const lb = rgb2lab([d[k4], d[k4 + 1], d[k4 + 2]]); a[0] += lb[0]; a[1] += lb[1]; a[2] += lb[2]; a[3]++; a[4] += s2l(d[k4]); a[5] += s2l(d[k4 + 1]); a[6] += s2l(d[k4 + 2]);
  }
  const rows = [];
  for (const [i, a] of acc) { if (a[3] < 40) continue; const p = prov[i], labM = [a[0] / a[3], a[1] / a[3], a[2] / a[3]], mean = lab2rgb(labM), lin = [a[4], a[5], a[6]].map((v) => l2s(v / a[3])), exp = rlExpected(p); const el = rlLab(exp); rows.push({ name: p.name, terrain: p.terrain, fog: fogOf(i) ?? '', n: a[3], mean, dE: dE2000(labM, el), dELinear: dE2000(rlLab(lin), el), dLab: labM.map((v, j) => +(v - el[j]).toFixed(2)) }); }
  const byT = {}; for (const r of rows) { const b = (byT[r.terrain] ??= { n: 0, worst: 0, sum: 0 }); b.n++; b.sum += r.dE; b.worst = Math.max(b.worst, r.dE); }
  const terr2 = Object.fromEntries(Object.entries(byT).map(([t, b]) => [t, { provinces: b.n, meanDE: +(b.sum / b.n).toFixed(2), worstDE: +b.worst.toFixed(2) }]));
  // (2) terrain pairs between the rendered means of provinces of different terrains (each in its own state), normal and under each deficiency
  let worstN = { v: Infinity }, worstC = { v: Infinity }, under = 0, pairs = 0;
  for (let a = 0; a < rows.length; a++) for (let b = a + 1; b < rows.length; b++) {
    if (rows[a].terrain === rows[b].terrain) continue; pairs++; const e = rlPairDE(rows[a].mean, rows[b].mean);
    if (e.normal < 20 || e.cvd < 12) under++;
    if (e.normal < worstN.v) worstN = { v: +e.normal.toFixed(2), pair: rows[a].name + '/' + rows[b].name, terrains: rows[a].terrain + '/' + rows[b].terrain };
    if (e.cvd < worstC.v) worstC = { v: +e.cvd.toFixed(2), pair: rows[a].name + '/' + rows[b].name, terrains: rows[a].terrain + '/' + rows[b].terrain, protan: +e.protan.toFixed(1), deutan: +e.deutan.toFixed(1), tritan: +e.tritan.toFixed(1) };
  }
  return { scale: +cam.s.toFixed(3), provinces: rows.length, measure: 'CIELAB mean of the core pixels, as the design measures it', budget: RL_P.meanBudget, worstDE: +Math.max(...rows.map((r) => r.dE)).toFixed(2), worstDELinearMean: +Math.max(...rows.map((r) => r.dELinear)).toFixed(2), overBudget: rows.filter((r) => r.dE > RL_P.meanBudget).map((r) => `${r.name} (${r.terrain}${r.fog ? ', ' + r.fog : ''}) ${r.dE.toFixed(2)} dLab ${r.dLab.join('/')} n${r.n}`), within: rows.filter((r) => r.dE <= RL_P.meanBudget).length, byTerrain: terr2, pairs: { checked: pairs, under2012: under, worstNormal: worstN, worstCvd: worstC } };
}
// (3) the band (rail) rule on rendered pixels: along realm edges, the dark keyline, banner, light keyline and the ground beyond, as antialiasing left them
function rlRailCheck() {
  const d = rlRedraw(['pieces', 'labels', 'badges', 'arrows']), W2 = canvas.width, H2 = canvas.height, w = rlW(), gap = 1, offs = { dark: gap + w.d / 2, ban: gap + w.d + w.b / 2, light: gap + w.d + w.b + w.l / 2, ground: gap + w.d + w.b + w.l + 2.5 };
  const px = (sx, sy) => { const X = Math.round(sx * dpr - 0.5), Y = Math.round(sy * dpr - 0.5); if (X < 0 || Y < 0 || X >= W2 || Y >= H2) return null; const k = (Y * W2 + X) * 4; return [d[k], d[k + 1], d[k + 2]]; };
  let n = 0, fails = 0, worst = Infinity, worstAt = '', bannerOnly = 0, dotted = 0; const failList = [];
  for (const i of provList) {
    const p = prov[i]; if (!p.owner) continue;
    for (const e of RL_EDGES[i]) {
      if (!isRealmEdge(i, e)) continue; const L = e.len * cam.s; if (L < 24) continue; if (fogOf(i) && fogOf(e.j)) { dotted++; continue; } // dotted in fog (approved meaning); not a solid line to test
      for (let t = 0.2; t <= 0.8001; t += 0.6 / Math.max(1, Math.floor(L / 30))) {
        const bx = e.a[0] + (e.b[0] - e.a[0]) * t, by = e.a[1] + (e.b[1] - e.a[1]) * t, [sx, sy] = toScreen(bx, by); if (sx < 10 || sy < 95 || sx > cw - 10 || sy > ch - 10) continue;
        const at = (o) => px(sx + e.nx * o, sy + e.ny * o), K1 = at(offs.dark), B = at(offs.ban), K2 = at(offs.light), G = at(offs.ground); if (!K1 || !B || !K2 || !G) continue;
        const gw = toWorld(sx + e.nx * offs.ground, sy + e.ny * offs.ground); if (provinceAt(...gw) !== i || !inModel(...gw)) continue;
        n++; const bg = rlPairDE(B, G), ok = (q) => q.normal >= 20 && q.cvd >= 12, keyOK = (K) => ok(rlPairDE(K, B)) && ok(rlPairDE(K, G));
        const pass = ok(bg) || keyOK(K1) || keyOK(K2); if (ok(bg)) bannerOnly++;
        const c = Math.max(rlWcag(K1, G), rlWcag(B, G), rlWcag(K2, G)); if (c < worst) { worst = c; worstAt = `${p.name} (${p.terrain}) against ${names[e.j]}`; }
        if (!pass) { fails++; if (failList.length < 8) failList.push(`${p.name}/${names[e.j]} B${rgb2hex(B)} G${rgb2hex(G)}`); }
      }
    }
  }
  return { scale: +cam.s.toFixed(3), dpr, widths: w, samples: n, fails, passByBannerAlone: bannerOnly, dottedEdgesSkipped: dotted, worstContrast: +worst.toFixed(2), worstAt, failList };
}
// (4) hit tests near the straight borders (1 to 3 screen px off each shared edge) and at the model's rounded corners
function rlHitCheck() {
  const R = rngFor('relief:hitcheck'), keys = [...EDGE.keys()]; let n = 0, bad = 0, cornerN = 0, cornerBad = 0;
  for (let t = 0; t < 400; t++) {
    const e = EDGE.get(keys[Math.floor(R() * keys.length)]), u = 0.08 + 0.84 * R(), qx = e.a[0] + (e.b[0] - e.a[0]) * u, qy = e.a[1] + (e.b[1] - e.a[1]) * u, L = Math.hypot(e.b[0] - e.a[0], e.b[1] - e.a[1]) || 1, off = ((R() < 0.5 ? -1 : 1) * (1 + 2 * R())) / cam.s;
    const x = qx - ((e.b[1] - e.a[1]) / L) * off, y = qy + ((e.b[0] - e.a[0]) / L) * off; if (!inModel(x, y)) continue;
    const truth = [...Array(N).keys()].find((i) => d3.polygonContains(cells[i], [x, y])); if (truth == null) continue; n++; if (provinceAt(x, y) !== truth) bad++;
  }
  for (let t = 0; t < 200; t++) { const cx = R() < 0.5 ? RL_RC : W - RL_RC, cy = R() < 0.5 ? RL_RC : H - RL_RC, a = R() * Math.PI * 2, r = RL_RC + (R() - 0.5) * 6 / cam.s, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; if (x < 0 || y < 0 || x > W || y > H) continue; const inside = (x - cx) ** 2 + (y - cy) ** 2 <= RL_RC * RL_RC || (x > RL_RC && x < W - RL_RC) || (y > RL_RC && y < H - RL_RC); cornerN++; if (inMap(x, y) !== inside) cornerBad++; }
  return { samples: n, wrong: bad, cornerSamples: cornerN, cornerWrong: cornerBad };
}
// (5) labels and pieces at the current zoom: names shown, overlaps among labels, between labels and pieces, and between pieces; slots outside the 2 px inset
function rlLayoutCheck() {
  RCK = null; draw(); const lay = RL_PIECE_CACHE.get('L'), band = lay.band, vis = (b) => b[2] + cam.x > 0 && b[0] + cam.x < cw && b[3] + cam.y > 90 && b[1] + cam.y < ch;
  const hit = rlSilHit; // the slot rule's own silhouettes (p61)
  const plates = [...lay.labels.map((l) => ({ text: l.text, box: l.box })), ...lay.chips.map((c) => ({ text: 'chip ' + c.text, box: c.box }))].filter((q) => vis(q.box)), labels = plates.map((q) => q.box), pieces = lay.shapes.filter(vis), wildB = lay.wildOps.filter((o) => o.box).map((o) => o.box).filter(vis);
  let ll = 0, lp = 0, pp = 0; const lpList = [], ppList = [];
  for (let a = 0; a < labels.length; a++) for (let b = a + 1; b < labels.length; b++) if (hit(labels[a], labels[b])) ll++;
  const wildGl = lay.wildOps.filter((o) => o.gl).flatMap((o) => glyphBoxes(o.gl, 0)).filter(vis); // wild names (straight or along the massif) against the place names
  for (const w of [...wildB, ...wildGl]) for (const l of labels) if (hit(w, l)) ll++;
  for (const l of plates) for (const p of pieces) if (hit(l.box, p)) { lp++; if (lpList.length < 6) lpList.push(`${l.text} / ${p[4]} in ${names[p[5]]}`); }
  for (const l of wildB) for (const p of pieces) if (hit(l, p)) lp++;
  for (let a = 0; a < pieces.length; a++) for (let b = a + 1; b < pieces.length; b++) { if (pieces[a][6] === pieces[b][6]) continue; if (hit(pieces[a], pieces[b]) && !(pieces[a][4] === 'seat' && pieces[b][4] === 'army' && lay.armies.some((q) => q.prov === pieces[b][5] && q.front))) { pp++; if (ppList.length < 6) ppList.push(`${pieces[a][4]} ${names[pieces[a][5]]} / ${pieces[b][4]} ${names[pieces[b][5]]}`); } }
  const inView = provs.filter((p) => { const [sx, sy] = toScreen(...cent[p.i]); return sx > 0 && sx < cw && sy > 90 && sy < ch; }), named = new Set(lay.labels.map((l) => l.i));
  const outside = lay.armies.filter((a) => !a.front && (() => { for (let k = 0; k < 8; k++) { const ang = (k * Math.PI) / 4, qx = (a.x + Math.cos(ang) * a.rx) / cam.s, qy = (a.y + Math.sin(ang) * a.ry) / cam.s; if (!d3.polygonContains(cells[a.prov], [qx, qy]) || distToEdge(cells[a.prov], qx, qy) * cam.s < 1.99) return true; } return false; })()).length;
  return { band, scale: +cam.s.toFixed(3), Dpx: +lay.Dpx.toFixed(1), armyBase: +lay.Ba.toFixed(1), names: lay.labels.length, numberChips: lay.chips.length, wildNames: lay.wildOps.length, provincesInView: inView.length, namedInView: inView.filter((p) => named.has(p.i)).length, pctNamed: +((100 * inView.filter((p) => named.has(p.i)).length) / Math.max(1, inView.length)).toFixed(1), labelOverlaps: ll, labelPieceOverlaps: lp, pieceOverlaps: pp, armiesInFront: lay.armies.filter((a) => a.front).length, armiesOutsideInset: outside, examples: { lpList, ppList } };
}
// (6) a stable redraw (two frames from scratch) and a deterministic bake (the generator run again, compared by hash)
function rlStableCheck(rebake) {
  const a = rlHashPx(rlRedraw()), b = rlHashPx(rlRedraw()), out = { first: a, second: b, identical: a === b };
  if (rebake) { const look = rlShownLook(), t0 = performance.now(), o = {}; for (const _ of rlSharedGen(o)) void _; for (const _ of rlLookGen(o, look)) void _; const A = RB.L[look].img.data, B2 = o.L[look].img.data; out.bake = { look, first: rlHashPx(A), again: rlHashPx(B2), identical: rlHashPx(A) === rlHashPx(B2), rebakeMs: Math.round(performance.now() - t0) }; if (look === 'natural') out.bake.coverIdentical = rlHashPx(RB.nat.cls) === rlHashPx(o.nat.cls); }
  return out;
}
// (7) the design's numbers on this map: own-terrain share, the glow core, the mean-neutral residual, relief invariants, water rules, the escarpment guard
function rlDesignCheck() {
  const { BW, BH, HW, HH, QW, QH, TX, id, LT, hid, hh, hq, pure } = RB, T2 = TX / 2, out = {}; const clearBaked = !!pure; // the escarpment and core-swing rows are Clear's relief (its caps); they run once the Clear pass has
  out.ownTerrainShare = { min: +Math.min(...RB.ownShare.map((o) => o.share)).toFixed(3), under80: RB.ownShare.filter((o) => o.share < 0.8).length, need: 0.8 };
  const GL = rlGlow(), gd = GL.canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, HW, HH).data, tot = new Float64Array(N), core = new Float64Array(N);
  for (let k = 0; k < HW * HH; k++) { const o = hid[k]; if (o === 255 || RL_WILDK[o]) continue; tot[o]++; if (gd[k * 4 + 3] === 0) core[o]++; }
  const cores = provList.filter((i) => prov[i].owner).map((i) => core[i] / tot[i]); out.glowCore = { min: +Math.min(...cores).toFixed(3), median: +cores.sort((a, b) => a - b)[cores.length >> 1].toFixed(3), need: 0.70, note: 'owned provinces; the core is untouched by the glow and the fog hem' };
  out.meanResidualL = clearBaked ? +Math.max(...RB.residual.map((r) => Math.abs(r.dL))).toFixed(4) : null;
  // relief invariants on the quarter-resolution field: peaks above passable land within 2 D; meres below land within 1 D
  const H4 = new Uint8Array(QW * QH); for (let y = 0; y < QH; y++) for (let x = 0; x < QW; x++) H4[y * QW + x] = RB.hLT[(y * 2 + 1) * HW + x * 2 + 1];
  let peakMin = Infinity, landMax = -Infinity, mereMax = -Infinity, landMin = Infinity; for (let k = 0; k < QW * QH; k++) { const t = H4[k]; if (t === 7) peakMin = Math.min(peakMin, hq[k]); else if (t === 8) mereMax = Math.max(mereMax, hq[k]); else if (t < 7) { landMax = Math.max(landMax, hq[k]); landMin = Math.min(landMin, hq[k]); } }
  out.reliefInvariants = { peakMin: +peakMin.toFixed(3), passableMax: +landMax.toFixed(3), peaksAbove: peakMin > landMax, mereMax: +mereMax.toFixed(3), landMin: +landMin.toFixed(3), meresBelow: mereMax < landMin, note: 'checked map-wide (stricter than within 2 D and 1 D)' };
  // water: shares, clearance from every border, inside one province
  const clear = RL_P.waterClearD * RLD; let minClear = Infinity, crossings = 0;
  for (const L of [...RB.water.lakes, ...RB.water.ponds]) for (const [x, y] of L.P) minClear = Math.min(minClear, distToEdge(cells[L.i], x, y));
  for (const s of RB.water.streams) for (const [x, y] of s.pts) { if (s.sink === 'edge' && H - y < clear) continue; if (provinceAt(x, y) !== s.i) crossings++; minClear = Math.min(minClear, distToEdge(cells[s.i], x, y)); }
  out.water = { lakes: RB.water.lakes.length, ponds: RB.water.ponds.length, streams: RB.water.streams.length, waterfalls: RB.water.falls.length, lakeMaxShare: +Math.max(0, ...RB.water.lakes.map((l) => l.share)).toFixed(3), pondMaxShare: +Math.max(0, ...RB.water.ponds.map((l) => l.share)).toFixed(3), minClearD: +(minClear / RLD).toFixed(3), needD: RL_P.waterClearD, streamPointsOutsideTheirProvince: crossings, note: 'clearance for waterfalls is measured off the south edge they fall from' };
  // the escarpment guard: |relief| p90 in a 3-unit band along terrain borders against the cores, per terrain (at most 3 x)
  if (clearBaked) { const bandSet = new Uint8Array(BW * BH), r3 = Math.max(1, Math.round(3 * RLK * TX)), rel = {}, q90 = (a) => { if (!a.length) return 0; a.sort((x, y) => x - y); return a[Math.floor(a.length * 0.9)]; };
  for (let y = 1; y < BH - 1; y++) for (let x = 1; x < BW - 1; x++) { const k = y * BW + x, t = LT[k]; if (t >= 7) continue; if (LT[k + 1] !== t && LT[k + 1] < 7) for (let dy = -r3; dy <= r3; dy++) for (let dx = -r3; dx <= r3; dx++) { const yy = y + dy, xx = x + dx; if (yy >= 0 && yy < BH && xx >= 0 && xx < BW) bandSet[yy * BW + xx] = 1; } }
  for (let k = 0; k < BW * BH; k += 3) { const t = LT[k]; if (t >= 7) continue; const v = Math.abs(rlBilin(RB.fS, HW, HH, (k % BW + 0.5) / 2, (((k / BW) | 0) + 0.5) / 2)) * RL_CAP[RL_T[t]]; const r = (rel[RL_T[t]] ??= { band: [], core: [] }); (bandSet[k] ? r.band : pure[k] ? r.core : null)?.push(v); }
  out.escarpment = Object.fromEntries(Object.entries(rel).map(([t, r]) => { const b = q90(r.band), c = q90(r.core); return [t, { bandP90: +b.toFixed(2), coreP90: +c.toFixed(2), ratio: c ? +(b / c).toFixed(2) : null }]; }));
  // the core swing (§3.2, §13 relief.test.ts): each terrain's core p90 relief swing, cap x |shade| over its pure-core texels, reaches a third of its cap (fix 3)
  const sw = {}; for (let k = 0; k < BW * BH; k += 5) { if (!pure[k]) continue; const t = RL_T[LT[k]]; if (!t) continue; (sw[t] ??= []).push(Math.abs(RL_CAP[t] * rlBilin(RB.fS, HW, HH, (k % BW + 0.5) / 2, (((k / BW) | 0) + 0.5) / 2))); }
  out.coreSwing = Object.fromEntries(RL_T.filter((t) => sw[t]).map((t) => { const p = q90(sw[t]); return [t, { coreP90: +p.toFixed(2), needThirdOfCap: +(RL_CAP[t] / 3).toFixed(2), pass: p >= RL_CAP[t] / 3 }]; })); } else { out.escarpment = 'Clear not baked yet'; out.coreSwing = 'Clear not baked yet'; }
  out.reliefRulesPass = { invariants: out.reliefInvariants.peaksAbove && out.reliefInvariants.meresBelow, escarpmentAtMost3: !clearBaked || Object.values(out.escarpment).every((e) => e.ratio == null || e.ratio <= 3), coreSwingThirdOfCap: !clearBaked || Object.values(out.coreSwing).every((e) => e.pass), ownTerrain80: out.ownTerrainShare.under80 === 0, glowCore70: out.glowCore.min >= 0.7, meanResidual: !clearBaked || out.meanResidualL < 0.05 };
  out.reliefRulesPass.all = Object.values(out.reliefRulesPass).every(Boolean);
  return out;
}
// (8) memory held by the relief layers and the bake times
function rlMemory() {
  const cv = (c) => (c ? c.width * c.height * 4 : 0), mb = (b) => +(b / 1048576).toFixed(2);
  const ta = ['id', 'LT', 'LP', 'hh', 'hid', 'hLT', 'fS', 'sS', 'shd', 'ao', 'snow', 'DL', 'pure', 'modeRelief', 'hq', 'mid1', 'mid2'].reduce((a, k) => a + (RB[k] ? RB[k].byteLength : 0), 0) + (RB.wch ? RB.wch.reduce((a, P) => a + P.byteLength, 0) : 0) + (RB.nat ? ['cls', 'ftone', 'fhedge', 'fph'].reduce((a, k) => a + RB.nat[k].byteLength, 0) + [...RB.nat.wc8, RB.nat.wF8, RB.nat.wA8].reduce((a, P) => a + P.byteLength, 0) : 0);
  const Ls = ['natural', 'clear'].map((k) => RB.L[k]).filter(Boolean), wb = Ls.reduce((a, L) => a + ['img', 'mb1', 'mb2'].reduce((b, k) => b + L[k].data.byteLength, 0), 0);
  const bake = Ls.reduce((a, L) => a + cv(L.canvas), 0), mips = Ls.reduce((a, L) => a + cv(L.mip1) + cv(L.mip2), 0), live = cv(GLOW && GLOW.canvas) + cv(GLOWH && GLOWH.canvas) + cv(MODER && MODER.canvas), rim = RIM ? cv(RIM.canvas) : 0, caches = cv(rlU) + cv(rlO) + cv(canvas) + cv(amb), figs = Object.values(FIGS.fig).reduce((a, f) => a + cv(f.canvas), 0);
  const heap = performance.memory ? mb(performance.memory.usedJSHeapSize) : null;
  return { looksBaked: Ls.map((L) => L.look), bakeMB: mb(bake), mipsMB: mb(mips), bakeWithMipsMB: mb(bake + mips), liveRastersMB: mb(live), rimMB: mb(rim), figureAtlasMB: mb(figs), screenCachesMB: mb(caches), rastersKeptMB: mb(ta), unwashedCopiesMB: mb(wb), totalCanvasMB: mb(bake + mips + live + rim + caches + figs), jsHeapMB: heap,
    design: 'bake RGBA8 with mips 14.0 MB on GPU (2048 x 1280); this mockup holds CPU canvases instead of GPU textures, plus the CPU rasters the checks read' };
}
function rlTimes() { return { firstLook: RB.firstLook, sharedStepsMs: RB.t, naturalStepsMs: RB.L.natural ? RB.L.natural.t : null, clearStepsMs: RB.L.clear ? RB.L.clear.t : null, lookCpu: { natural: RB.L.natural ? RB.L.natural.cpu : null, clear: RB.L.clear ? RB.L.clear.cpu : null }, bakeCpuMs: Math.round(RB.total), bakeWallMs: Math.round(RB.wall), slices: RB.slices, figureAtlasMs: Math.round(FIGS.ms), figureAtlas: FIGS.ready ? 'pixi.js 8.22.0' : 'fallback: ' + FIGS.err, glowMs: GLOW ? +GLOW.ms.toFixed(1) : null, modeRasterMs: MODER ? +MODER.ms.toFixed(1) : null, washComposites: RLW.n, washMsTotal: +RLW.ms.toFixed(1), staticRenders: RREB.n, staticMsMean: RREB.n ? +(RREB.ms / RREB.n).toFixed(1) : null, firstPaintMs: Math.round(window.__firstPaintFromScript ?? 0),
  design: 'GPU bake: a few ms to 15 ms on a GPU (estimate); CPU fallback 1.3 s at 1024 and 3.3 s at 2048 (measured under load in the research)' }; }
Object.assign(window.__mock, {
  relief: () => RELIEF(), reliefReady: () => RB.ready && (FIGS.ready || !!FIGS.err),
  reliefMeans: () => rlMeansCheck(), reliefRails: () => rlRailCheck(), reliefHit: () => rlHitCheck(), reliefLayout: () => rlLayoutCheck(), reliefStable: (rebake) => rlStableCheck(rebake), reliefDesign: () => rlDesignCheck(), reliefMemory: () => rlMemory(), reliefTimes: () => rlTimes(),
  reliefChecks: () => ({ hit: rlHitCheck(), layout: rlLayoutCheck(), means: rlMeansCheck(), rails: rlRailCheck(), stable: rlStableCheck(false), design: rlDesignCheck(), memory: rlMemory(), times: rlTimes() }),
  setScale: (s, wx, wy) => { const v = viewRect(); cam.s = s; cam.x = (v.l + v.r) / 2 - wx * s; cam.y = (v.t + v.b) / 2 - wy * s; clampCam(); RCK = null; draw(); return cam.s; },
  pieceAt: (id) => { const L = RL_PIECE_CACHE.get('L'), a = L && L.armies.find((q) => q.ids.includes(id)); if (!a) return null; const r = canvas.getBoundingClientRect(); const k = cam.s / L.s; return [r.left + a.x * k + cam.x, r.top + a.y * k + cam.y - a.figH * 0.5]; },
});
{ const prev = window.__mock.checks; window.__mock.checks = () => (RELIEF() ? window.__mock.reliefChecks() : prev()); } // the v3 checks under Painted (v3), the relief checks under Relief

// ------------------------------------------------------------------ the natural view's checks (natural §13): window.__mock.reliefNatural, reliefLines, reliefSeats, reliefHoverChips, reliefCliff
// Read-only helpers for automated review. Colours are measured on the rendered canvas (the composite as drawn) or on the bake as baked, never on the design's tables.
const rlL = (r, g, b) => { const y = 0.2126 * s2l(r) + 0.7152 * s2l(g) + 0.0722 * s2l(b); return y > 0.008856 ? 116 * Math.cbrt(y) - 16 : 903.3 * y; };
const rlOk = (r, g, b) => { const l = Math.cbrt(0.4122214708 * s2l(r) + 0.5363325363 * s2l(g) + 0.0514459929 * s2l(b)), m = Math.cbrt(0.2119034982 * s2l(r) + 0.6806995451 * s2l(g) + 0.1073969566 * s2l(b)), s = Math.cbrt(0.0883024619 * s2l(r) + 0.2817188376 * s2l(g) + 0.6299787005 * s2l(b)); return Math.hypot(1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s); };
const rlPct = (a, f) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(f * s.length))]; };
const r3 = (v) => (v == null ? null : +v.toFixed(3));
// (1) chroma: no texel of the natural bake over OKLCH C 0.10, nor any material (§2.3)
function rlNatChroma() {
  const Lk = RB.L.natural; if (!Lk) return { baked: false }; const d = Lk.img.data, { LT } = RB, memo = new Map(); let n = 0, over = 0, max = 0; const hist = [];
  for (let k = 0; k < LT.length; k += 2) { if (LT[k] >= 7) continue; const o = k * 4, key = (d[o] << 16) | (d[o + 1] << 8) | d[o + 2]; let c = memo.get(key); if (c == null) { c = rlOk(d[o], d[o + 1], d[o + 2]); memo.set(key, c); } n++; if (c > 0.10) over++; if (c > max) max = c; if ((k & 63) === 0) hist.push(c); }
  const mats = []; for (const [t, M] of Object.entries(RL_NAT.mat)) for (const [nm, lab] of Object.entries(M)) { const o = [0, 0, 0]; rlLabTo(lab[0], lab[1], lab[2], o, 0); mats.push([t + '.' + nm, rgb2hex(o), +rlOk(...o).toFixed(3)]); }
  mats.sort((a, b) => b[2] - a[2]);
  return { texels: n, over010: over, max: r3(max), p99: r3(rlPct(hist, 0.99)), cap: 0.10, materialsMax: mats[0], materialsOver010: mats.filter((m) => m[2] > 0.10).length, pass: over === 0 && mats.every((m) => m[2] <= 0.10) };
}
// (1b) snow (§10 defect 2, both looks): no passable texel of the bake within 20 / 12 of the snow #F2EEE6, raw and under the unexplored haze of the look
function rlSnowCheck(look = rlShownLook()) {
  const Lk = RB.L[look]; if (!Lk) return { baked: false, look }; const d = Lk.img.data, { LT } = RB, sn = hex2rgb(RL_C.snow), F = RL_P.fog[look], G = hex2rgb(RL_C.gesso), memo = new Map(), byT = {};
  for (let k = 0; k < LT.length; k++) { const t = LT[k]; if (t >= 7 || d[k * 4 + 3] < 255) continue; const key = (d[k * 4] << 16) | (d[k * 4 + 1] << 8) | d[k * 4 + 2]; let v = memo.get(key);
    if (!v) { const c = [d[k * 4], d[k * 4 + 1], d[k * 4 + 2]], e = rlPairDE(c, sn), hz = c.map((x, j) => x + (G[j] - x) * F.hemPeak), eh = rlPairDE(hz, sn); v = [e.normal, e.cvd, eh.normal, eh.cvd]; memo.set(key, v); }
    const b = (byT[RL_T[t]] ??= { n: 0, near: 0, nearHaze: 0, minN: 99, minC: 99 }); b.n++; if (v[0] < 20 || v[1] < 12) b.near++; if (v[2] < 20 || v[3] < 12) b.nearHaze++; b.minN = Math.min(b.minN, v[0]); b.minC = Math.min(b.minC, v[1]); }
  const rows = Object.fromEntries(Object.entries(byT).map(([t, b]) => [t, { texels: b.n, within2012: b.near, withinUnderHaze: b.nearHaze, minNormal: +b.minN.toFixed(1), minCvd: +b.minC.toFixed(1) }]));
  return { look, byTerrain: rows, pass: Object.values(byT).every((b) => !b.near && !b.nearHaze) };
}
// (2) N4: each province's own cover. Whole province >= 0.70 own (copses and hedge trees as forest); core (0.15 D in) >= 0.95 own (copses as its own); copses <= 25% of a core
function rlNatCover() {
  if (!RB.nat) return { baked: false }; const { cls } = RB.nat, { BW, BH, TX, id, LT } = RB, A = new Map();
  for (let ty = 1; ty < BH; ty += 2) for (let tx = 1; tx < BW; tx += 2) {
    const k = ty * BW + tx, i = id[k]; if (i === 255 || RL_WILDK[i] || LT[k] >= 7) continue; const own = RL_TI[terr[i]], c = cls[k], x = (tx + 0.5) / TX, y = (ty + 0.5) / TX;
    let a = A.get(i); if (!a) A.set(i, (a = { n: 0, ownF: 0, ownC: 0, cn: 0, cownC: 0, cownF: 0, ccopse: 0 }));
    const asForest = c === 9 || c === 10 ? 2 : c, isOwnF = asForest === own, isOwnC = c === own || ((c === 9 || c === 10) && (own === 0 || own === 3 || own === 1)) || (c === 9 && own === 2);
    a.n++; if (isOwnF) a.ownF++; if (isOwnC) a.ownC++;
    if (distToEdge(cells[i], x, y) >= 0.15 * RLD) { a.cn++; if (isOwnC) a.cownC++; if (isOwnF) a.cownF++; if (c === 9) a.ccopse++; }
  }
  const rows = [...A].map(([i, a]) => ({ name: names[i], terrain: terr[i], whole: a.ownF / a.n, wholeOwnCopses: a.ownC / a.n, core: a.cn ? a.cownC / a.cn : null, coreCopsesAsForest: a.cn ? a.cownF / a.cn : null, copseCore: a.cn ? a.ccopse / a.cn : 0 }));
  const col = (k) => rows.map((r) => r[k]).filter((v) => v != null), byT = {};
  for (const r of rows) { const b = (byT[r.terrain] ??= { n: 0, wholeMin: 1, coreMin: 1 }); b.n++; b.wholeMin = Math.min(b.wholeMin, r.whole); if (r.core != null) b.coreMin = Math.min(b.coreMin, r.core); }
  const worst = rows.reduce((p, q) => (q.whole < p.whole ? q : p));
  const scan = [rlNatCoverGen, rlParcel, rlH2].map((f) => f.toString()).join('\n').match(/Math\.(cos|sin|tan|exp|log|pow|atan2|random)\b/g) ?? []; // N8: the cover raster uses arithmetic, sqrt, floor and table noise only
  return { sourceScan: { transcendentals: scan, pass: !scan.length }, provinces: rows.length, wholeMin: r3(Math.min(...col('whole'))), wholeMedian: r3(rlPct(col('whole'), 0.5)), wholeOwnCopsesMin: r3(Math.min(...col('wholeOwnCopses'))), coreMin: r3(Math.min(...col('core'))), coreCopsesAsForestMin: r3(Math.min(...col('coreCopsesAsForest'))), copseCoreMax: r3(Math.max(...col('copseCore'))), worst: `${worst.name} (${worst.terrain}) ${worst.whole.toFixed(3)}`, byTerrain: Object.fromEntries(Object.entries(byT).map(([t, b]) => [t, { n: b.n, wholeMin: r3(b.wholeMin), coreMin: r3(b.coreMin) }])), need: { whole: 0.70, core: 0.95, copseCore: 0.25 }, pass: Math.min(...col('whole')) >= 0.70 && Math.min(...col('core')) >= 0.95 && Math.max(...col('copseCore')) <= 0.25 };
}
// (3) the readers (§5): thirteen features of lightness per square patch of 0.3 D_px wholly inside a province (half a patch from its edge), on the rendered land (no rails,
// pieces, labels or water); a linear discriminant trained and tested on disjoint provinces (two folds, stratified by terrain). In sight; and the unexplored state, read by the
// reader trained in sight. Normal vision and the three deficiencies; "texture" drops the mean, p10 and p90.
function rlPatchFeats(Lp, n) { // Lp: n x n lightness; the prototype's thirteen features (proto/classify.py feats)
  const N2 = n * n, v = Array.from(Lp).sort((a, b) => a - b); let mu = 0; for (const x of Lp) mu += x; mu /= N2; let s2 = 0, s3 = 0, dark = 0, light = 0; for (const x of Lp) { const d = x - mu; s2 += d * d; s3 += d * d * d; if (d < -6) dark++; if (d > 6) light++; } const sd = Math.sqrt(s2 / N2) + 1e-6;
  const at = (x, y) => Lp[y * n + x]; let g1 = 0, ng1 = 0, lap = 0, nl = 0, jxx = 0, jyy = 0, jxy = 0;
  for (let y = 1; y < n - 1; y++) for (let x = 1; x < n - 1; x++) { const gx = at(x + 1, y) - at(x - 1, y), gy = at(x, y + 1) - at(x, y - 1); g1 += Math.hypot(gx, gy); ng1++; jxx += gx * gx; jyy += gy * gy; jxy += gx * gy; lap += Math.abs(4 * at(x, y) - at(x - 1, y) - at(x + 1, y) - at(x, y - 1) - at(x, y + 1)); nl++; }
  const h2 = n >> 1, Hh = new Float32Array(h2 * h2); for (let y = 0; y < h2; y++) for (let x = 0; x < h2; x++) Hh[y * h2 + x] = (at(2 * x, 2 * y) + at(2 * x + 1, 2 * y) + at(2 * x, 2 * y + 1) + at(2 * x + 1, 2 * y + 1)) / 4;
  let g2 = 0, ng2 = 0; for (let y = 1; y < h2 - 1; y++) for (let x = 1; x < h2 - 1; x++) { g2 += Math.hypot(Hh[y * h2 + x + 1] - Hh[y * h2 + x - 1], Hh[(y + 1) * h2 + x] - Hh[(y - 1) * h2 + x]); ng2++; }
  const ac = (k) => { let a = 0, na = 0, b = 0, nb = 0; for (let y = 0; y < n; y++) for (let x = 0; x + k < n; x++) { a += (at(x + k, y) - mu) * (at(x, y) - mu); na++; } for (let y = 0; y + k < n; y++) for (let x = 0; x < n; x++) { b += (at(x, y + k) - mu) * (at(x, y) - mu); nb++; } return (a / na + b / nb) / 2 / (sd * sd); };
  const coh = Math.sqrt((jxx - jyy) ** 2 + 4 * jxy * jxy) / (jxx + jyy + 1e-6);
  return [mu, v[Math.floor(0.1 * N2)], v[Math.floor(0.9 * N2)], Math.log(sd), s3 / N2 / sd ** 3, Math.log(g1 / ng1 + 1e-3), Math.log((ng2 ? g2 / ng2 : 0) + 1e-3), Math.log(lap / nl + 1e-3), coh, dark / N2, light / N2, ac(2), ac(4)];
}
function rlLDA(X, y, K) { // standardised features, pooled covariance with 10% shrinkage toward its diagonal; returns predict(x)
  const D = X[0].length, mu = new Array(D).fill(0), sd = new Array(D).fill(0); for (const x of X) x.forEach((v, j) => (mu[j] += v / X.length)); for (const x of X) x.forEach((v, j) => (sd[j] += (v - mu[j]) ** 2 / X.length)); for (let j = 0; j < D; j++) sd[j] = Math.sqrt(sd[j]) || 1;
  const Z = X.map((x) => x.map((v, j) => (v - mu[j]) / sd[j])), cm = [...Array(K)].map(() => new Array(D).fill(0)), cn = new Array(K).fill(0); Z.forEach((z, k) => { cn[y[k]]++; z.forEach((v, j) => (cm[y[k]][j] += v)); }); for (let c = 0; c < K; c++) if (cn[c]) cm[c] = cm[c].map((v) => v / cn[c]);
  const S = [...Array(D)].map(() => new Array(D).fill(0)); Z.forEach((z, k) => { const m = cm[y[k]]; for (let a = 0; a < D; a++) for (let b = 0; b < D; b++) S[a][b] += ((z[a] - m[a]) * (z[b] - m[b])) / Z.length; });
  for (let a = 0; a < D; a++) for (let b = 0; b < D; b++) S[a][b] = a === b ? S[a][b] + 1e-6 : S[a][b] * 0.9;
  const inv = (() => { const n = D, M = S.map((r, i) => [...r, ...[...Array(n)].map((_, j) => (i === j ? 1 : 0))]); for (let c = 0; c < n; c++) { let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r; [M[c], M[p]] = [M[p], M[c]]; const piv = M[c][c] || 1e-9; for (let j = 0; j < 2 * n; j++) M[c][j] /= piv; for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c]; if (f) for (let j = 0; j < 2 * n; j++) M[r][j] -= f * M[c][j]; } } return M.map((r) => r.slice(n)); })();
  const W = cm.map((m) => inv.map((row) => row.reduce((a, v, j) => a + v * m[j], 0))), b0 = cm.map((m, c) => -0.5 * W[c].reduce((a, v, j) => a + v * m[j], 0));
  return (x) => { const z = x.map((v, j) => (v - mu[j]) / sd[j]); let best = -1, bv = -Infinity; for (let c = 0; c < K; c++) { if (!cn[c]) continue; const s = W[c].reduce((a, v, j) => a + v * z[j], 0) + b0[c]; if (s > bv) { bv = s; best = c; } } return best; };
}
function rlReaderPatches(fogState, vision) { // patches of the land as rendered at the current zoom; RL_DBG.fog forces one fog state on every province
  const keep = RL_DBG.fog; RL_DBG.fog = fogState; const d = rlRedraw(['rails', 'pieces', 'labels', 'badges', 'arrows', 'water']); RL_DBG.fog = keep; RCK = null; draw();
  const W2 = canvas.width, Dp = MED_DIAM * cam.s, n = Math.min(48, Math.max(12, Math.round(0.3 * Dp))) * dpr, st = Math.max(4, n >> 1), v = viewRect(), m = vision && vision !== 'normal' ? CVD[vision] : null, out = [];
  const Lof = (k) => { let r = d[k], g = d[k + 1], b = d[k + 2]; if (m) { const c = cvdRgb([r, g, b], m); r = c[0]; g = c[1]; b = c[2]; } return rlL(r, g, b); };
  for (const i of provList) {
    const bb = geo(i).bb, [sx0, sy0] = toScreen(bb[0], bb[1]), [sx1, sy1] = toScreen(bb[2], bb[3]);
    for (let py = Math.ceil(Math.max(v.t, sy0) * dpr); py + n <= Math.min(v.b, sy1) * dpr; py += st) for (let px = Math.ceil(Math.max(v.l, sx0) * dpr); px + n <= Math.min(v.r, sx1) * dpr; px += st) { // stride half a patch (the prototype's)
      const cx = (px + n / 2) / dpr, cy = (py + n / 2) / dpr, [wx, wy] = toWorld(cx, cy); if (!d3.polygonContains(cells[i], [wx, wy]) || !inModel(wx, wy)) continue;
      if (distToEdge(cells[i], wx, wy) < (0.525 * (n / dpr)) / cam.s) continue; // the centre at least half a patch from the edge, and every corner inside (convex cells): wholly inside
      if (![[px, py], [px + n, py], [px, py + n], [px + n, py + n]].every(([qx, qy]) => d3.polygonContains(cells[i], toWorld(qx / dpr, qy / dpr)))) continue;
      const Lp = new Float32Array(n * n), X0 = Math.floor(px), Y0 = Math.floor(py); for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) Lp[y * n + x] = Lof(((Y0 + y) * W2 + X0 + x) * 4);
      out.push({ i, t: RL_TI[terr[i]], f: rlPatchFeats(Lp, n) });
    }
  }
  return { patches: out, n };
}
function rlNatReader(visions = ['normal', 'deutan', 'tritan', 'protan']) {
  const res = { scale: +cam.s.toFixed(3), Dpx: +(MED_DIAM * cam.s).toFixed(1), band: bandOf(cam.s), look: rlShownLook() }, byT = {}; provList.forEach((i) => (byT[terr[i]] ??= []).push(i));
  const fold = new Map(); for (const L of Object.values(byT)) L.sort((a, b) => a - b).forEach((i, k) => fold.set(i, k % 2));
  const run = (train, test, cols) => { const pick = (f) => (cols ? cols.map((c) => f[c]) : f); let ok = 0, n = 0; const votes = new Map();
    for (const F of [0, 1]) { const tr = train.filter((p) => fold.get(p.i) !== F), te = test.filter((p) => fold.get(p.i) === F); if (!tr.length || !te.length) continue; const pred = rlLDA(tr.map((p) => pick(p.f)), tr.map((p) => p.t), 7);
      for (const p of te) { const c = pred(pick(p.f)); n++; if (c === p.t) ok++; const v = votes.get(p.i) ?? new Array(7).fill(0); v[c]++; votes.set(p.i, v); } }
    let pOk = 0; const missed = []; for (const [i, v] of votes) { const c = v.indexOf(Math.max(...v)); if (c === RL_TI[terr[i]]) pOk++; else missed.push(`${names[i]} (${terr[i]} read ${RL_T[c]})`); }
    return { patches: n, patchAcc: r3(ok / Math.max(1, n)), provinces: votes.size, provinceAcc: r3(pOk / Math.max(1, votes.size)), missed: missed.slice(0, 6) }; };
  const TEX = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  for (const vis of visions) {
    const inS = rlReaderPatches(null, vis).patches, unx = vis === 'normal' ? rlReaderPatches('unexplored', vis).patches : null;
    res[vis] = { lightness: run(inS, inS), texture: run(inS, inS, TEX) }; if (unx) { res[vis].unexplored = run(inS, unx); res[vis].unexploredTexture = run(inS, unx, TEX); }
  }
  const N0 = res.normal; res.need = { province: 0.95, patch: 0.90, note: 'at Mid, in sight and on unexplored land' };
  res.pass = N0.lightness.provinceAcc >= 0.95 && N0.lightness.patchAcc >= 0.9 && N0.unexplored.provinceAcc >= 0.95 && N0.unexplored.patchAcc >= 0.9;
  return res;
}
function rlNaturalCheck(readers = true) { return { look: rlShownLook(), chroma: rlNatChroma(), cover: rlNatCover(), snow: rlSnowCheck('natural'), readers: readers && rlShownLook() === 'natural' ? rlNatReader() : 'not run (the look on screen is Clear)' }; }
// (4) lines on rendered pixels (§8.2): per drawn segment, the best contrast of the line's pixels (the partner's counted) against the same pixel without lines.
// Hairline (+-3 px) >= 2.3:1, internal keyline (0 to 6 px on its lower-right side) >= 3.2:1; one keyline per edge; no hairline wider than 3 px. Fog-dashed edges are skipped.
function rlLinesCheck() {
  const land = rlRedraw(['rails', 'pieces', 'labels', 'badges', 'arrows']), lines = rlRedraw(['pieces', 'labels', 'badges', 'arrows']), W2 = canvas.width, H2 = canvas.height, v = viewRect();
  const px = (d, sx, sy) => { const X = Math.floor(sx * dpr), Y = Math.floor(sy * dpr); if (X < 0 || Y < 0 || X >= W2 || Y >= H2) return null; const k = (Y * W2 + X) * 4; return [d[k], d[k + 1], d[k + 2]]; };
  const R = { hair: [], int: [], skippedFog: 0, edges: RL_LINES.drawn.length, flips: RL_LINES.stats.flips, partners: RL_LINES.stats.partners, segs: RL_LINES.stats.segs, maxHairWidthPx: RL_LINES.stats.maxWidthPx }, worst = { hair: null, int: null };
  for (const dr of RL_LINES.drawn) {
    if (dr.fog) { R.skippedFog++; continue; } const e = dr.e;
    const st = rlSegStyles(e, dr.kind, rlLineCtx()), { nx, ny } = st;
    for (const sg of st.segs) {
      const [sx, sy] = toScreen((sg.x0 + sg.x1) / 2, (sg.y0 + sg.y1) / 2), Ls = Math.hypot(sg.x1 - sg.x0, sg.y1 - sg.y0) * cam.s; if (Ls < 6 || sx < v.l + 8 || sx > v.r - 8 || sy < v.t + 8 || sy > v.b - 8) continue;
      let best = 0; const offs = dr.kind === 'hair' ? [-3, 3] : [0, 6];
      for (let o = offs[0]; o <= offs[1]; o += 0.5) { const a = px(lines, sx + nx * o, sy + ny * o), b = px(land, sx + nx * o, sy + ny * o); if (!a || !b) continue; best = Math.max(best, rlWcag(a, b)); }
      R[dr.kind].push(best); if (!worst[dr.kind] || best < worst[dr.kind].c) worst[dr.kind] = { c: +best.toFixed(2), at: `${names[dr.i]}/${names[dr.j]}`, key: sg.key, partner: !!sg.partner };
    }
  }
  const sum = (a, lim) => ({ samples: a.length, min: r3(Math.min(...a)), median: r3(rlPct(a, 0.5)), under: a.filter((x) => x < lim).length, limit: lim });
  return { look: rlShownLook(), band: bandOf(cam.s), dpr, hairline: sum(R.hair, 2.3), internal: sum(R.int, 3.2), worst, edges: R.edges, segs: R.segs, partners: R.partners, keylineFlipsAlongEdges: R.flips, maxHairWidthPx: R.maxHairWidthPx, skippedFogDashed: R.skippedFog,
    pass: R.hair.every((x) => x >= 2.3) && R.int.every((x) => x >= 3.2) && R.flips === 0 && R.maxHairWidthPx <= 3 };
}
// (5) seats (§10 defect 3): the light pixels the pieces layer adds at hamlets and huts against the pixel beneath, p95 per seat <= 2.5 (Mid) or 4 (Near)
function rlSeatsCheck() {
  const on = rlRedraw(['rails', 'labels', 'badges', 'arrows', 'nonseats']), off = rlRedraw(['rails', 'labels', 'badges', 'arrows', 'pieces']), W2 = canvas.width, H2 = canvas.height, lay = RL_PIECE_CACHE.get('L'), k = cam.s / lay.s, v = viewRect(), lim = bandOf(cam.s) === 'near' ? 4 : 2.5, kinds = {};
  for (const [i, st] of lay.seats) {
    if (!st.kind || !st.box) continue; const cx = st.x * k + cam.x, cy = st.y * k + cam.y, bx = st.box.map((q, j) => q * k + (j % 2 ? cam.y : cam.x)); if (cx < v.l || cx > v.r || cy < v.t || cy > v.b) continue; const cs = []; // the seat's own box (houses, roofs to shadows), seats drawn alone
    for (let y = Math.floor((bx[1] - 2) * dpr); y <= (bx[3] + 2) * dpr; y++) for (let x = Math.floor((bx[0] - 2) * dpr); x <= (bx[2] + 2) * dpr; x++) { if (x < 0 || y < 0 || x >= W2 || y >= H2) continue; const q = (y * W2 + x) * 4; if (on[q] === off[q] && on[q + 1] === off[q + 1] && on[q + 2] === off[q + 2]) continue; const A = [on[q], on[q + 1], on[q + 2]], B2 = [off[q], off[q + 1], off[q + 2]]; if (rlL(...A) > rlL(...B2)) cs.push(rlWcag(A, B2)); }
    if (cs.length < 6) continue; const b = (kinds[st.kind] ??= { seats: 0, over: [], p95: [] }); b.seats++; const p = rlPct(cs, 0.95); b.p95.push(p); if (p > lim) b.over.push(`${names[i]} ${p.toFixed(2)}`);
  }
  const out = { band: bandOf(cam.s), Dpx: +(MED_DIAM * cam.s).toFixed(1), limit: lim, look: rlShownLook() }; for (const [kd, b] of Object.entries(kinds)) out[kd] = { seats: b.seats, p95Worst: r3(Math.max(...b.p95)), p95Median: r3(rlPct(b.p95, 0.5)), over: kd === 'town' ? 'towns are not muted (bases with rims)' : b.over };
  out.pass = ['hamlet', 'hut'].every((kd) => !out[kd] || !out[kd].over.length); return out;
}
// (6) hover names against day chips (§10 defect 4): every province in view hovered in turn
function rlHoverChipsCheck() {
  const keep = hoverProv, v = viewRect(); let hovered = 0, moved = 0, chipOnTop = 0, over = 0; const ex = [];
  for (const i of provList) { const [sx, sy] = toScreen(...cent[i]); if (sx < v.l || sx > v.r || sy < v.t || sy > v.b) continue; hoverProv = i; draw(); const L = RL_LIVE.list.find((q) => q.i === i); if (!L) continue; hovered++; if (L.moved) moved++; if (L.chipsOnTop) chipOnTop++;
    const hit = RL_CHIPS.some((q) => L.box[2] > q.box[0] && L.box[0] < q.box[2] && L.box[3] > q.box[1] && L.box[1] < q.box[3]); if (hit && !L.chipsOnTop) { over++; ex.push(names[i]); } else if (L.moved && ex.length < 4) ex.push(`${names[i]} moved`); }
  hoverProv = keep; draw(); return { chips: RL_CHIPS.map((q) => q.text), hovered, namesMoved: moved, chipRedrawnOnTop: chipOnTop, namesOverAChip: over, examples: ex, pass: over === 0 };
}
// (7) the cliff face (§10 defect 5) on the rendered view: the stripe index (the share of gradient energy across x) and light streak columns per 100 px
function rlCliffCheck() {
  const d = rlRedraw([]), W2 = canvas.width, [x0, yE] = toScreen(RL_RC + 4, H), [x1] = toScreen(W - RL_RC - 4, H), fh = (RL_FACE - RL_PLINTH) * cam.s, pw = W / 2, [qx0] = toScreen(pw - (RL_P.plaqueD * RLD) / 2 - 4, H), [qx1] = toScreen(pw + (RL_P.plaqueD * RLD) / 2 + 4, H);
  const X0 = Math.ceil(Math.max(0, x0) * dpr), X1 = Math.floor(Math.min(cw, x1) * dpr), Y0 = Math.ceil((yE + 2) * dpr), Y1 = Math.floor((yE + fh - 2) * dpr); if (Y1 - Y0 < 6 || X1 - X0 < 40) return { visible: false };
  const fall = (X) => RB.water.falls.some((f) => Math.abs(X / dpr - toScreen(f.x, H)[0]) < f.w * cam.s * 1.6 + 3) || (X / dpr > qx0 && X / dpr < qx1); // waterfalls and the plaque are not the rock
  const cols = []; for (let X = X0; X < X1; X++) if (!fall(X)) cols.push(X); const Lm = cols.map((X) => { const c = []; for (let Y = Y0; Y <= Y1; Y++) { const k = (Y * W2 + X) * 4; c.push(rlL(d[k], d[k + 1], d[k + 2])); } return c; });
  let ex = 0, ey = 0; for (let c = 0; c + 1 < Lm.length; c++) { if (cols[c + 1] !== cols[c] + 1) continue; for (let r = 0; r + 1 < Lm[c].length; r++) { ex += (Lm[c + 1][r] - Lm[c][r]) ** 2; ey += (Lm[c][r + 1] - Lm[c][r]) ** 2; } }
  const mean = Lm.map((c) => c.reduce((a, b) => a + b, 0) / c.length); let streak = 0; for (let c = 0; c < mean.length; c++) { const w = mean.slice(Math.max(0, c - 4), c + 5).sort((a, b) => a - b); if (mean[c] - w[w.length >> 1] > 3) streak++; }
  return { visible: true, facePx: +(fh).toFixed(1), columns: cols.length, stripeIndex: r3(ex / (ex + ey)), lightStreaksPer100px: +((100 * streak) / cols.length).toFixed(1), design: { before: [0.568, 15.4], after: [0.141, 0] } };
}
Object.assign(window.__mock, {
  reliefNatural: (readers) => rlNaturalCheck(readers !== false), reliefSnow: (look) => rlSnowCheck(look), reliefLines: () => rlLinesCheck(), reliefSeats: () => rlSeatsCheck(), reliefHoverChips: () => rlHoverChipsCheck(), reliefCliff: () => rlCliffCheck(),
  reliefChecks: () => { const nat = rlShownLook() === 'natural'; return { look: rlShownLook(), mode: state.mode, hit: rlHitCheck(), layout: rlLayoutCheck(), means: rlMeansCheck(), natural: nat ? rlNaturalCheck(true) : 'not applicable (Clear): the 20 / 12 means and pairs run', snow: rlSnowCheck(), rails: rlRailCheck(), lines: rlLinesCheck(), seats: rlSeatsCheck(), stable: rlStableCheck(false), design: rlDesignCheck(), memory: rlMemory(), times: rlTimes() }; },
});
})();
