
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
};
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

// ------------------------------------------------------------------ seeded randomness (never Math.random) and color helpers
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
  const rows = [['Owner', ownerName(p.owner)], ['Terrain', TERRAIN[p.terrain].name], ['Population', hid ? 'unknown' : fmt(p.pop)], [term('supply', 'Supply') + ' (eaten / given)', hid ? 'unknown' : `${eat} / ${supply}`], [term('unrest', 'Unrest'), hid ? 'unknown' : String(p.unrest)], [term('dominion', 'Dominion'), hid ? 'unknown' : p.dom.n ? `${ownerName(p.dom.n)} ${p.dom.s}` : 'none']];
  if (p.springs.length && !hid) rows.push(['Spring', p.springs.map((c) => MANA[c].name).join(', ')]);
  if (p.well) rows.push([term('wellspring', 'Wellspring'), p.i === ownWell ? (p.claim === 'red' ? 'yours, claimed' : p.claim ? 'claim under way' : 'yours, unclaimed') : 'unclaimed']);
  if (p.owner === null && !hid) rows.push(['Defenders', p.indep < 15 ? 'weak' : p.indep < 25 ? 'moderate' : 'strong']);
  if (fog === 'outofsight') rows.push(['Seen', 'earlier; out of sight now', 'more']);
  const bw = wildsBordering(i);
  const meaning = [hid ? 'Unexplored: not yet painted. Terrain is public; what lives here is unknown.' : '', bw.length ? `Borders ${bw.map((w) => w.name.replace('The ', 'the ')).join(' and ')} (${term('impassable', 'impassable')}).` : ''].filter(Boolean).join(' ');
  const sel = state.sel && state.sel.type === 'cmd' && cmd[state.sel.id].side === 'red' ? cmd[state.sel.id] : null;
  const proj = sel && i !== sel.at ? moveProjection(sel, i) : null;
  return { title: p.name, value: p.cap ? 'capital' : '', meaning: meaning || null, rows, proj };
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
const view = { table: 'full', detail: 'full', chrome: 'approved', parch: false, vision: 'normal', reduced: !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches), pass: false, wipe: false };
const seasonOf = (m) => (m >= 11 || m <= 2 ? 'winter' : m <= 5 ? 'spring' : m <= 8 ? 'summer' : 'autumn');
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
function bakeWorld(rect, res, fn) { // a world-space bake; once drawn it becomes an ImageBitmap, so a blit never re-uploads it
  const [x0, y0, x1, y1] = rect; const c = makeCanvas((x1 - x0) * res, (y1 - y0) * res), g = c.getContext('2d'); g.setTransform(res, 0, 0, res, -x0 * res, -y0 * res); fn(g);
  const out = { canvas: c, src: c, x0, y0, w: x1 - x0, h: y1 - y0 };
  if (window.createImageBitmap) createImageBitmap(c).then((bm) => { out.src = bm; requestDraw(); }).catch(() => {});
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
  const key = view.table + ':' + dpr;
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
    g.save(); g.beginPath(); g.rect(x0, y0, TW, TH); g.rect(CLOTH[0], CLOTH[1], CLOTH[2] - CLOTH[0], CLOTH[3] - CLOTH[1]); g.clip('evenodd');
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
    g.save(); g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 8; g.shadowOffsetX = 3; g.shadowOffsetY = 3; g.fillStyle = '#3E2E20'; g.fillRect(CLOTH[0], CLOTH[1], CLOTH[2] - CLOTH[0], CLOTH[3] - CLOTH[1]); g.restore();
    if (full) drawStaticProps(g, R);
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
function bakeCloth() {
  if (!fontsReady && document.fonts && document.fonts.check) fontsReady = document.fonts.check("22px 'Marcellus SC'");
  const key = dpr + ':' + fontsReady;
  if (CLOTHB && CLOTHKEY === key) return CLOTHB;
  CLOTHKEY = key;
  const res = 1.25 * Math.min(2, dpr);
  CLOTHB = bakeWorld(CLOTH, res, (g) => {
    const R = rngFor('cloth:11'), [x0, y0, x1, y1] = CLOTH;
    g.fillStyle = '#E8DCC2'; g.fillRect(x0, y0, x1 - x0, y1 - y0);
    const fl = [shadeL('#E8DCC2', -3), shadeL('#E8DCC2', 3), shadeL('#E8DCC2', -2)];
    g.lineWidth = 0.7; g.lineCap = 'round';
    for (let k = 0; k < 7000; k++) { // fiber flecks, in the margin only (the map covers the rest)
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
    g.fillStyle = '#1C1A17'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(title, cx, cy + 1.5);
    // the compass rose in the upper-right corner of the margin
    const rx = W + CM / 2 - 2, ry = -CM / 2 + 3, rr = 15;
    g.strokeStyle = '#1C1A17'; g.lineWidth = 0.8; g.beginPath(); g.arc(rx, ry, rr * 0.62, 0, Math.PI * 2); g.stroke();
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 - Math.PI / 2, L = k % 2 ? rr * 0.6 : rr, w = k % 2 ? 2 : 3.2; const tip = [rx + Math.cos(a) * L, ry + Math.sin(a) * L], l = [rx + Math.cos(a - Math.PI / 2) * w, ry + Math.sin(a - Math.PI / 2) * w], r2 = [rx + Math.cos(a + Math.PI / 2) * w, ry + Math.sin(a + Math.PI / 2) * w];
      g.fillStyle = k === 0 ? '#1C1A17' : '#E8DCC2'; g.beginPath(); g.moveTo(...l); g.lineTo(...tip); g.lineTo(...r2); g.closePath(); g.fill(); g.stroke(); }
    g.font = "8px 'Marcellus SC', Georgia, serif"; g.fillStyle = '#1C1A17'; g.fillText('N', rx - rr - 5, ry - rr + 4);
    g.strokeStyle = '#1C1A17'; g.lineWidth = 3; g.strokeRect(-1.5, -1.5, W + 3, H + 3); // the map's outline
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

// ------------------------------------------------------------------ map detail: terrain, settlements, alignment, wilds (baked per province per zoom band)
const MEAN_AREA = provs.reduce((a, p) => a + areaOf[p.i], 0) / provs.length;
const MED_DIAM = (() => { const d = provs.map((p) => 2 * Math.sqrt(areaOf[p.i] / Math.PI)).sort((a, b) => a - b); return d[Math.floor(d.length / 2)]; })();
const bandOf = (s) => (s * MED_DIAM < 70 ? 'far' : s * MED_DIAM <= 180 ? 'mid' : 'near');
const BAND_RES = { far: 70 / MED_DIAM, mid: 180 / MED_DIAM, near: 420 / MED_DIAM }; // px per unit at the top of each band
const DESIGN = { far: 0.3, mid: 0.62, near: 1.5 }; // scale that screen-px sizes (ticks, strokes) are designed for
const EXCL = { far: 0.33, mid: 70 / MED_DIAM, near: 180 / MED_DIAM }; // label boxes are measured at the band's widest
const TSPEC = { plains: [2, 10, 20], farmland: [2, 4, 8], forest: [4, 30, 60], hills: [3, 6, 10], mountains: [3, 5, 8], swamp: [3, 12, 22], wasteland: [2, 8, 14] };
const BIX = { far: 0, mid: 1, near: 2 };
const SU = Math.sqrt(MEAN_AREA / 6400); // the brief's units assume a 6400-unit average province; this sheet's are about 4 times larger
const HSC = 0.92 * SU, HR = 3.2 * HSC, LS = HSC / 1.3, SS = 1.55, MS = 1.45; // houses, spiral, landmarks, stamps, motifs
const INK = '#1C1A17', INK7 = 'rgba(28,26,23,.7)';
function distToEdge(poly, x, y) { let m = Infinity; for (let k = 0; k < poly.length - 1; k++) { const [ax, ay] = poly[k], [bx, by] = poly[k + 1]; const dx = bx - ax, dy = by - ay; const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1))); m = Math.min(m, Math.hypot(x - ax - t * dx, y - ay - t * dy)); } return m; }
const inPoly = (poly, x, y) => d3.polygonContains(poly, [x, y]);
const bboxOf = (poly) => { let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity; for (const [x, y] of poly) { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); d = Math.max(d, y); } return [a, b, c, d]; };
const boxHit = (bs, x0, y0, x1, y1) => bs.some((b) => x1 > b[0] && x0 < b[2] && y1 > b[1] && y0 < b[3]);
const pathPoly = (g, poly) => { g.beginPath(); poly.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };

// ---- per-province geometry: the seat (below the label), stable Poisson slots with ranks
const GEO = new Map();
function geo(i) {
  let G = GEO.get(i); if (G) return G;
  const poly = cells[i], c = cent[i], bb = bboxOf(poly);
  const ext = HR * Math.sqrt((prov[i].cap ? 22 : 12) + 0.35) * 1.3 * 0.62 + 10;
  let seat = [c[0], c[1] + 52];
  for (let t = 1; t >= 0; t -= 0.08) { seat = [c[0], c[1] + 52 * t]; if (inPoly(poly, ...seat) && distToEdge(poly, ...seat) > ext) break; }
  const R = rngFor(`map:11:${i}:slots`), spec = TSPEC[terr[i]] ?? [3, 10, 20];
  const want = Math.round((spec[2] * areaOf[i]) / MEAN_AREA * 1.6) + 10;
  const rad = Math.sqrt(areaOf[i] / want) * 0.78;
  const slots = [];
  for (let t = 0; t < want * 40 && slots.length < want; t++) {
    const x = bb[0] + R() * (bb[2] - bb[0]), y = bb[1] + R() * (bb[3] - bb[1]);
    if (!inPoly(poly, x, y) || distToEdge(poly, x, y) < 15) continue;
    if (slots.some((s) => (s.x - x) ** 2 + (s.y - y) ** 2 < rad * rad)) continue;
    slots.push({ x, y, rank: R(), d: Math.hypot(x - seat[0], (y - seat[1]) * 1.4), v: R(), e: distToEdge(poly, x, y) });
  }
  slots.sort((a, b) => a.d - b.d);
  G = { poly, c, bb, seat, slots, rad };
  GEO.set(i, G); return G;
}
const labelFs = (s) => Math.max(10, Math.min(15, 15 * s * 1.4));
const TW_CACHE = new Map();
let measureCtx = null;
function textW(text, font) { const k = font + '|' + text; let w = TW_CACHE.get(k); if (w == null) { measureCtx ??= makeCanvas(4, 4).getContext('2d'); measureCtx.font = font; w = measureCtx.measureText(text).width; TW_CACHE.set(k, w); } return w; }
const nameFont = (p, fs) => `${p.cap ? 600 : 500} ${p.cap ? fs + 1 : fs}px 'Alegreya Sans', 'Segoe UI', sans-serif`;
function tokensAt(i) { return Object.values(cmd).filter((c) => !c.hidden && c.at === i).length; }
function exclusions(i, band) { // label, token and seat boxes in world units, plus a 4 px margin
  const s = EXCL[band], p = prov[i], G = geo(i), [cx, cy] = G.c, fs = labelFs(s), m = 4 / s;
  const w = Math.max(textW(p.name, nameFont(p, fs)) + 10, 84) / s;
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
  g.fillStyle = 'rgba(28,26,23,.25)'; ellipse(g, x + 0.8 * u, y + 0.4 * u, 3.8 * u, 1.3 * u); g.fill();
  if (kit === 'red') {
    g.fillStyle = '#8F8C88'; g.fillRect(x - 3.6 * u, y - 1.8 * u, 7.2 * u, 1.8 * u); g.strokeRect(x - 3.6 * u, y - 1.8 * u, 7.2 * u, 1.8 * u);
    if (h.ruin) return;
    g.fillStyle = h.fresh ? '#E3CF8F' : '#3A3633'; g.beginPath(); g.moveTo(x - 4 * u, y - 1.8 * u); g.lineTo(x - 2.7 * u, y - 4.6 * u); g.lineTo(x + 2.7 * u, y - 4.6 * u); g.lineTo(x + 4 * u, y - 1.8 * u); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = h.fresh ? '#B89A5A' : '#5E5953'; g.beginPath(); for (let k = 0; k <= 6; k++) { const xx = x - 2.7 * u + (k * 5.4 * u) / 6, yy = y - 4.6 * u - (k % 2 ? 0.9 * u : 0); k ? g.lineTo(xx, yy) : g.moveTo(xx, yy); } g.stroke();
    if (!flags.shut) { g.fillStyle = '#FFB347'; for (const dx of [-1.6, 1.4]) { ellipse(g, x + dx * u, y - 0.9 * u, 0.55 * u, 0.55 * u); g.fill(); } } else { g.fillStyle = '#2B2A28'; for (const dx of [-1.6, 1.4]) g.fillRect(x + dx * u - 0.6 * u, y - 1.4 * u, 1.2 * u, 0.9 * u); }
  } else if (kit === 'green') {
    g.fillStyle = '#A0785A'; ellipse(g, x, y - 0.9 * u, 3 * u, 1.5 * u); g.fill(); g.stroke();
    if (h.ruin) return;
    g.fillStyle = h.fresh ? '#E3CF8F' : '#4E6B3A'; g.beginPath(); g.ellipse(x, y - 1.6 * u, 3.3 * u, 3 * u, 0, Math.PI, 0); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = h.fresh ? '#F2E4B0' : '#6E8F4E'; ellipse(g, x - 1 * u, y - 3.2 * u, 1.3 * u, 0.8 * u); g.fill();
    if (flags.shut) { g.fillStyle = '#2B2A28'; g.fillRect(x - 0.6 * u, y - 1.3 * u, 1.2 * u, 0.9 * u); }
  } else {
    g.fillStyle = '#D8CBB0'; g.fillRect(x - 2.7 * u, y - 2 * u, 5.4 * u, 2 * u); g.strokeRect(x - 2.7 * u, y - 2 * u, 5.4 * u, 2 * u);
    if (h.ruin) return;
    g.fillStyle = h.fresh ? '#E3CF8F' : '#C2A86B'; g.beginPath(); g.moveTo(x - 3.1 * u, y - 2 * u); g.lineTo(x - 1.4 * u, y - 4.7 * u); g.lineTo(x + 1.4 * u, y - 4.7 * u); g.lineTo(x + 3.1 * u, y - 2 * u); g.closePath(); g.fill(); g.stroke();
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
  const lit = o.lit !== false;
  if (kind === 'keep') {
    if (kit === 'green') { g.strokeStyle = '#4E6B3A'; g.lineWidth = PX * 2.2; ellipse(g, x, y - 2, 9, 5); g.stroke(); g.fillStyle = '#6B4A2B'; g.fillRect(x - 3.5, y - 12, 7, 11); g.strokeStyle = INK; g.lineWidth = PX * 0.9; g.strokeRect(x - 3.5, y - 12, 7, 11); g.fillStyle = '#4E6B3A'; ellipse(g, x, y - 13, 5.5, 3.5); g.fill(); g.stroke(); return y - 15; }
    const col = kit === 'red' ? '#3A3836' : '#9A958C', top = kit === 'red' ? '#2B2A28' : '#B9B4AA';
    g.fillStyle = col; g.fillRect(x - 5, y - 12, 10, 12); g.strokeRect(x - 5, y - 12, 10, 12); g.fillStyle = top; g.fillRect(x - 6, y - 15, 12, 3.4); g.strokeRect(x - 6, y - 15, 12, 3.4);
    g.fillStyle = col; for (const xx of [-6, -2, 2]) { g.fillRect(x + xx, y - 17, 2.6, 2.2); g.strokeRect(x + xx, y - 17, 2.6, 2.2); }
    if (kit === 'red') { g.fillStyle = '#FFB347'; g.fillRect(x - 1, y - 8, 2, 2.6); }
    return y - 17;
  }
  if (kind === 'temple') {
    if (kit === 'red') { // a stepped pyre tower with a brazier
      g.fillStyle = '#5E5953'; for (let k = 0; k < 3; k++) { const w = 9 - k * 2.5; g.fillRect(x - w / 2, y - 4 * (k + 1), w, 4); g.strokeRect(x - w / 2, y - 4 * (k + 1), w, 4); }
      if (lit) { const gl = g.createRadialGradient(x, y - 14, 0.3, x, y - 14, 4.5); gl.addColorStop(0, 'rgba(255,179,71,.9)'); gl.addColorStop(1, 'rgba(255,179,71,0)'); g.fillStyle = gl; ellipse(g, x, y - 14, 4.5, 4.5); g.fill(); g.fillStyle = '#FFB347'; ellipse(g, x, y - 13.6, 1.3, 1.3); g.fill(); }
      else { g.fillStyle = '#8F8C88'; ellipse(g, x, y - 13.5, 1.2, 1.2); g.fill(); }
      return y - 15;
    }
    if (kit === 'green') { // a ring of six small trees around an altar
      g.fillStyle = lit ? '#9A958C' : '#7A7670'; g.fillRect(x - 1.6, y - 2.4, 3.2, 2.4); g.strokeRect(x - 1.6, y - 2.4, 3.2, 2.4);
      for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; const tx = x + Math.cos(a) * 6, ty = y - 1 + Math.sin(a) * 3.4; g.fillStyle = '#2F4A26'; ellipse(g, tx, ty - 2.6, 2, 2); g.fill(); g.fillStyle = '#4E6B3A'; ellipse(g, tx - 0.5, ty - 3.1, 1.3, 1.3); g.fill(); g.lineWidth = PX * 0.7; ellipse(g, tx, ty - 2.6, 2, 2); g.stroke(); }
      return y - 6;
    }
    g.fillStyle = '#D8CBB0'; g.fillRect(x - 3, y - 6, 6, 6); g.strokeRect(x - 3, y - 6, 6, 6); g.fillStyle = '#C2A86B'; g.beginPath(); g.moveTo(x - 3.5, y - 6); g.lineTo(x, y - 10); g.lineTo(x + 3.5, y - 6); g.closePath(); g.fill(); g.stroke(); g.beginPath(); g.moveTo(x, y - 10); g.lineTo(x, y - 13); g.moveTo(x - 1.4, y - 11.8); g.lineTo(x + 1.4, y - 11.8); g.stroke();
    return y - 13;
  }
  if (kind === 'lab') {
    if (kit === 'red') { g.fillStyle = '#2B2A28'; g.beginPath(); g.moveTo(x - 3, y); g.lineTo(x - 1.4, y - 16); g.lineTo(x, y - 19); g.lineTo(x + 1.4, y - 16); g.lineTo(x + 3, y); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#FFB347'; g.fillRect(x - 0.6, y - 12, 1.2, 2); return y - 19; }
    if (kit === 'green') { g.fillStyle = '#5E4630'; g.beginPath(); g.moveTo(x - 3.4, y); g.lineTo(x - 2.4, y - 13); g.lineTo(x + 2.4, y - 13); g.lineTo(x + 3.4, y); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#1C1A17'; ellipse(g, x, y - 5, 1, 1.6); g.fill(); g.fillStyle = '#4E6B3A'; ellipse(g, x, y - 15, 5, 3.6); g.fill(); g.stroke(); g.fillStyle = '#6E8F4E'; ellipse(g, x - 1.4, y - 16, 2, 1.4); g.fill(); return y - 18; }
    g.fillStyle = '#B9B4AA'; g.fillRect(x - 2.5, y - 14, 5, 14); g.strokeRect(x - 2.5, y - 14, 5, 14); g.fillStyle = '#9A958C'; g.beginPath(); g.moveTo(x - 3, y - 14); g.lineTo(x, y - 18); g.lineTo(x + 3, y - 14); g.closePath(); g.fill(); g.stroke(); return y - 18;
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
    g.strokeStyle = '#9A958C'; g.lineWidth = 2.6; g.beginPath(); g.ellipse(sx, sy, rx, ry, 0, a0, a1); g.stroke();
    g.strokeStyle = INK7; g.lineWidth = PX * 0.8; for (let a = a0; a < a1; a += 0.22) { const x = sx + Math.cos(a) * rx, y = sy + Math.sin(a) * ry; g.beginPath(); g.moveTo(x, y - 1.3); g.lineTo(x, y - 2.4); g.stroke(); }
    if (pd >= 25) for (const a of [Math.PI * 1.25, Math.PI * 1.75, Math.PI * 0.25, Math.PI * 0.75]) {
      if ((a > Math.PI) !== (half === 'back')) continue;
      const x = sx + Math.cos(a) * rx, y = sy + Math.sin(a) * ry; g.fillStyle = '#9A958C'; g.fillRect(x - 2.4, y - 5, 4.8, 6); g.strokeStyle = INK; g.lineWidth = PX * 0.9; g.strokeRect(x - 2.4, y - 5, 4.8, 6);
    }
    if (pd >= 25 && half === 'front') { const x = sx, y = sy + ry; g.fillStyle = '#B9B4AA'; g.fillRect(x - 4.5, y - 5, 9, 6); g.strokeRect(x - 4.5, y - 5, 9, 6); g.fillStyle = '#2B2A28'; g.fillRect(x - 1.6, y - 3, 3.2, 4); }
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
function rock(g, x, y, r, P, col) { const c1 = col ?? P.lit; g.beginPath(); g.moveTo(x - r, y); g.lineTo(x - r * 0.6, y - r * 0.9); g.lineTo(x + r * 0.2, y - r * 1.05); g.lineTo(x + r * 0.15, y); g.closePath(); fillOr(g, P, c1); g.beginPath(); g.moveTo(x + r * 0.15, y); g.lineTo(x + r * 0.2, y - r * 1.05); g.lineTo(x + r * 0.95, y - r * 0.5); g.lineTo(x + r, y); g.closePath(); fillOr(g, P, col ? shadeL(col, -22) : P.shade); g.beginPath(); g.moveTo(x - r, y); g.lineTo(x - r * 0.6, y - r * 0.9); g.lineTo(x + r * 0.2, y - r * 1.05); g.lineTo(x + r * 0.95, y - r * 0.5); g.lineTo(x + r, y); g.closePath(); stroke(g, P); }
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
function lookKey(i) {
  const p = prov[i], f = fogOf(i);
  if (f === 'unexplored') return 'U|' + view.detail;
  return [f ?? '', houseCount(p), p.pop >= 1.25 * p.startPop ? 'T' : p.pop <= 0.8 * p.startPop ? 'D' : '', p.kitOwner ?? p.owner, p.owner, p.dom.n, p.dom.s, unrestStage(p), p.scar, p.buildings.join(','), p.build ? p.build.q : '', wallStage(p.pd), tokensAt(i), view.detail].join('|');
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

// ---- one province's decoration bake
function drawProvinceDeco(g, i, band) {
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
  const spec = TSPEC[p.terrain], k = areaOf[i] / MEAN_AREA, reduced = view.detail === 'reduced';
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
      if (s.v < 0.18) return tree(g, s.x, s.y, 4.2, P, { blossom: o.blossom }); if (s.v > 0.94) return haystack(g, s.x, s.y, 3.4, P); return tuft(g, s.x, s.y, 4, P);
    case 'farmland': if (far) { g.fillStyle = P.line ? 'rgba(0,0,0,0)' : rgba(P.shade, 0.5); g.fillRect(s.x - 9, s.y - 6, 18, 12); g.strokeStyle = P.line ?? P.ink; g.lineWidth = P.lw; g.strokeRect(s.x - 9, s.y - 6, 18, 12); return; }
      if (s.v > 0.9 && s.rank < 0.5) return windmill(g, s.x, s.y, P); return haystack(g, s.x, s.y, 3.2, P);
    case 'forest': if (o.charred) return charred(g, s.x, s.y, 3.4, P.PX);
      if (far) { for (let n = 0; n < 5; n++) tree(g, s.x + Math.cos(n * 1.3) * 7, s.y + Math.sin(n * 1.3) * 4, 6, P); return; }
      return tree(g, s.x, s.y, (o.great ? 2 : 1) * (3.8 + R() * 1.4), P, { blossom: o.blossom, shade: s.v < 0.5 ? P.shade : shadeL(P.fill, -10), lit: s.v < 0.5 ? P.lit : shadeL(P.fill, 6) });
    case 'hills': return hump(g, s.x, s.y, (12 + R() * 6) * sc, P);
    case 'mountains': return peakStamp(g, s.x, s.y, (9 + R() * 4) * sc, P, { lit: '#B4C1C6', shade: '#6E7F86', ink: INK, lw: P.lw });
    case 'swamp': if (far) { for (let n = 0; n < 3; n++) reeds(g, s.x + (n - 1) * 4, s.y, 7, P); return; } if (s.v > 0.8) return snag(g, s.x, s.y, 7, P); return reeds(g, s.x, s.y, 5.5, P);
    case 'wasteland': if (far) { rock(g, s.x - 3, s.y, 4, P); rock(g, s.x + 4, s.y + 1, 3, P); return; } if (s.v > 0.95) return skull(g, s.x, s.y, P); if (s.v > 0.65) return shrub(g, s.x, s.y, 4, P); return rock(g, s.x, s.y, 2.6 + R() * 1.2, P);
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
  for (const h of st.houses) items.push({ y: ord(h.y), f: () => house(g, h, kit, PX, { shut, vines: vines && h.k % 3 === 0 }) });
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
  items.push({ y: 1e9, f: () => { if (p.owner && !out) pennant(g, top.x, top.y, BAN[p.owner], PX); else if (p.owner === null && !out) pennant(g, top.x, top.y, '#8C8A80', PX); } });
}

// ---- wilds: one bake per range per band (ground, massif or mere marks); contour, ticks and names are drawn live
const WGEO = new Map();
function wgeo(w) {
  let G = WGEO.get(w.id); if (G) return G;
  const eq = (a, b) => Math.abs(a[0] - b[0]) < 0.01 && Math.abs(a[1] - b[1]) < 0.01;
  const edges = [];
  for (const c of w.cells) { const poly = cells[c]; for (let k = 0; k < poly.length - 1; k++) { const a = poly[k], b = poly[k + 1]; const shared = w.cells.some((o) => o !== c && cells[o].some((q) => eq(q, a)) && cells[o].some((q) => eq(q, b))); if (!shared) edges.push({ a, b, c }); } }
  let bb = [Infinity, Infinity, -Infinity, -Infinity]; for (const c of w.cells) { const b = bboxOf(cells[c]); bb = [Math.min(bb[0], b[0]), Math.min(bb[1], b[1]), Math.max(bb[2], b[2]), Math.max(bb[3], b[3])]; }
  const ticks = {};
  for (const band of ['far', 'mid', 'near']) {
    const s = DESIGN[band], sp = (band === 'far' ? 3.5 : 5) / s, R = rngFor(`wild:${w.id}:ticks:${band}`), out = [];
    for (const e of edges) {
      const L = Math.hypot(e.b[0] - e.a[0], e.b[1] - e.a[1]), dx = (e.b[0] - e.a[0]) / L, dy = (e.b[1] - e.a[1]) / L; let nx = -dy, ny = dx;
      const mx = (e.a[0] + e.b[0]) / 2, my = (e.a[1] + e.b[1]) / 2; if (!inPoly(cells[e.c], mx + nx * 2, my + ny * 2)) { nx = -nx; ny = -ny; }
      for (let t = sp / 2; t < L; t += sp) { const j = (R() - 0.5) * 2 / s, len = (4 + R() * 3) / s; const x = e.a[0] + dx * (t + j), y = e.a[1] + dy * (t + j); out.push([x + nx * 1.5 / s, y + ny * 1.5 / s, x + nx * (1.5 / s + len), y + ny * (1.5 / s + len)]); }
    }
    ticks[band] = out;
  }
  const nameFs = Math.max(11, Math.min(16, 11 + (w.cells.reduce((a, c) => a + areaOf[c], 0) / MEAN_AREA) * 1.8));
  const tokenZones = Object.values(cmd).filter((c) => !c.hidden).map((c) => [cent[c.at][0] - 45, cent[c.at][1] - 120, cent[c.at][0] + 45, cent[c.at][1] + 40]);
  const labelAt = [...w.cells].sort((a, b) => areaOf[b] - areaOf[a]).find((c) => !boxHit(tokenZones, cent[c][0] - 80, cent[c][1] - 16, cent[c][0] + 80, cent[c][1] + 16)) ?? w.big;
  G = { edges, bb, ticks, nameFs, labelAt }; WGEO.set(w.id, G); return G;
}
const inWild = (w, x, y) => w.cells.some((c) => inPoly(cells[c], x, y));
function bakeWildInto(g, w, band) {
  const G = wgeo(w), PX = 1 / BAND_RES[band], s = DESIGN[band];
  g.save(); g.beginPath(); for (const c of w.cells) { const poly = cells[c]; poly.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); } g.clip();
  const peaks = w.kind === 'peaks';
  g.fillStyle = peaks ? '#2A292C' : '#24222A'; g.fillRect(G.bb[0], G.bb[1], G.bb[2] - G.bb[0], G.bb[3] - G.bb[1]);
  const [lx, ly] = cent[G.labelAt], lw = Math.min((textW(w.name, `italic 400 ${G.nameFs}px 'Alegreya Sans'`) * 1.1 + 8) / s, (bboxOf(cells[G.labelAt])[2] - bboxOf(cells[G.labelAt])[0]) * 0.85), lh = (G.nameFs + 8) / s;
  const lbox = [[lx - lw / 2, ly - lh / 2, lx + lw / 2, ly + lh / 2]];
  if (!peaks) {
    for (const e of G.edges) { g.strokeStyle = '#2E3138'; g.lineWidth = 10 / s; g.beginPath(); g.moveTo(...e.a); g.lineTo(...e.b); g.stroke(); }
    const R = rngFor('wild:' + w.id + ':ripples'), area = w.cells.reduce((a, c) => a + areaOf[c], 0), n = Math.round(Math.max(8, Math.min(14, (8 * area) / MEAN_AREA))) * (band === 'far' ? 0.4 : 1);
    g.strokeStyle = '#8FC3D3'; g.lineWidth = 1.5 / s; let placed = 0;
    for (let t = 0; t < 400 && placed < n; t++) {
      const x = G.bb[0] + R() * (G.bb[2] - G.bb[0]), y = G.bb[1] + R() * (G.bb[3] - G.bb[1]), wv = (14 + R() * 6) / s;
      if (!inWild(w, x - wv / 2, y) || !inWild(w, x + wv / 2, y) || Math.abs(y - ly) < (G.nameFs * 1.4) / s || w.cells.some((c) => distToEdge(cells[c], x, y) < 14 / s && inPoly(cells[c], x, y))) continue;
      g.beginPath(); g.moveTo(x - wv / 2, y); g.quadraticCurveTo(x - wv / 4, y - 3 / s, x, y); g.quadraticCurveTo(x + wv / 4, y - 3 / s, x + wv / 2, y); g.stroke(); placed++;
    }
    if (band !== 'far') {
      const Rr = rngFor('wild:' + w.id + ':shore'); let reedsN = 5 + Math.floor(Rr() * 4), snags = 2 + Math.floor(Rr() * 2);
      for (const e of G.edges) { if (reedsN <= 0 && snags <= 0) break; if (Rr() < 0.45) continue; const t = 0.3 + Rr() * 0.4; let x = e.a[0] + (e.b[0] - e.a[0]) * t, y = e.a[1] + (e.b[1] - e.a[1]) * t; x += (cent[e.c][0] - x) * 0.09; y += (cent[e.c][1] - y) * 0.09;
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
        if (!inPoly(poly, x, y) || distToEdge(poly, x, y) < base * 0.42) continue;
        if (pts2.some((q) => Math.hypot(q[0] - x, (q[1] - y) * 1.6) < rad)) continue;
        if (boxHit(lbox, x - base * 0.6, y - base, x + base * 0.6, y + 2)) continue;
        pts2.push([x, y]);
      }
      const centers = Math.min(pts2.length, 2 + (R() < 0.5 ? 1 : 0));
      pts2.forEach(([x, y], k) => {
        let h = base * (k < centers ? 1.7 : 0.75 + R() * 0.45) * (band === 'far' ? 1.25 : 1);
        while (h > base * 0.4 && !inWild(w, x, y - h * 0.9)) h *= 0.85;
        if (boxHit(lbox, x - h * 0.6, y - h, x + h * 0.6, y)) h = Math.min(h, Math.max(base * 0.4, y - lbox[0][3] - 2));
        list.push({ x, y, h, big: k < centers });
      });
    }
    list.sort((a, b) => (a.big !== b.big ? (a.big ? -1 : 1) : a.y - b.y));
    const cols = { lit: '#8A857E', shade: '#46423F', snow: '#F2EEE6', snowShade: '#CFCAC1', ink: INK, lw: 1.3 / s };
    for (const q of list) {
      if (band === 'near') { g.strokeStyle = 'rgba(110,106,100,.55)'; g.lineWidth = PX; for (let n = 0; n < 5; n++) { g.beginPath(); g.moveTo(q.x - q.h * 0.3 + n * q.h * 0.15, q.y); g.lineTo(q.x - q.h * 0.42 + n * q.h * 0.21, q.y + q.h * 0.14); g.stroke(); } }
      peakStamp(g, q.x, q.y, q.h, { lw: 1.3 / s }, cols);
    }
  }
}

// ---- the sprite cache: decoration per province per band, wilds per range per band; budgeted, with cross-fades
const SPR = new Map(), WSPR = new Map(), KEYS = new Array(N).fill(''), ANIM = new Map();
const dprC = () => Math.min(2, dpr);
function spriteRes(band) { return Math.min(3.2, BAND_RES[band] * dprC()); }
function bakeProv(i, band) {
  const G = geo(i), pad = [12, 30, 12, 8], bb = [G.bb[0] - pad[0], G.bb[1] - pad[1], G.bb[2] + pad[2], G.bb[3] + pad[3]];
  return bakeWorld(bb, spriteRes(band), (g) => drawProvinceDeco(g, i, band));
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
function invalidateBakes() { SPR.clear(); WSPR.clear(); for (const k in COMP) delete COMP[k]; }

// ------------------------------------------------------------------ canvas, camera, drawing
const app = document.getElementById('app');
const canvas = document.getElementById('map'), ctx = canvas.getContext('2d');
const layer = document.getElementById('layer');
const amb = document.getElementById('amb'), actx = amb.getContext('2d');
const cam = { s: 1, x: 0, y: 0 };
let dpr = 1, cw = 0, ch = 0, moveLine = null, hoverProv = -1, fitScale = 1, minScale = 0.2, maxScale = 2.4, firstPaint = true;
let decoAlpha = 1, decoFrom = 1, decoTo = 1, decoT0 = 0;
const BAN = { red: '#FD6533', green: '#00674B' };
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
  fitScale = Math.min((vw - 64) / (CLOTH[2] - CLOTH[0]), (vh - 64) / (CLOTH[3] - CLOTH[1]));
  minScale = Math.min(fitScale * 0.9, Math.max(0.75 * Math.min(vw / TW, vh / TH), vw / (ROOM[2] - ROOM[0]), vh / (ROOM[3] - ROOM[1])));
  maxScale = 420 / MED_DIAM;
}
function fit() { // the cloth fits the unobscured area with a 32 px oak band; a phone starts closer, on the selected army
  resize(); computeScales();
  const v = viewRect(), phone = app.classList.contains('phone');
  const s = phone ? Math.max(fitScale, 0.5) : fitScale;
  const [fx, fy] = phone ? cent[cmd.varo.at] : [(CLOTH[0] + CLOTH[2]) / 2, (CLOTH[1] + CLOTH[3]) / 2];
  cam.s = s; cam.x = (v.l + v.r) / 2 - fx * s; cam.y = (v.t + v.b) / 2 - fy * s; clampCam();
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
const MODE_BASE = Object.fromEntries(Object.entries(TERRAIN).map(([t, d]) => [t, { forest: '#79786B', hills: '#7E7767', swamp: '#6F7A77' }[t] ?? desat(d.fill, 0.8)]));
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
      if (hid) return memo('u' + f, () => mix(f, '#E8DCC2', 0.04));
      if (fog === 'outofsight') return memo('o' + f, () => desat(f, 0.1));
      if (!p.dom.n) return f;
      return memo(`w${f}${p.dom.n}${p.dom.s}`, () => mix(f, p.dom.n === 'red' ? '#8F8C88' : '#5E7F45', (p.dom.n === 'red' ? 0.1 : 0.06) * p.dom.s / 10));
    }
  }
}
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
const staticSig = () => [state.mode, KEYVER, view.table, view.detail, view.pass, view.reduced, curMonth, fontsReady, dpr, cw, ch, TW_CACHE.size > 0, SPR.size === 0].join('|');
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
  for (const p of provs) { if (!seen(geo(p.i).bb)) continue; pathPoly(g, cells[p.i]); g.fillStyle = fillFor(p); g.fill(); }
  for (const w of WILDS) { g.fillStyle = w.kind === 'peaks' ? '#2A292C' : '#24222A'; for (const c of w.cells) { pathPoly(g, cells[c]); g.fill(); } }
  PM('fills');
  // the decoration layer (Ownership mode; faded out in data modes)
  if (decoAlpha > 0.001 && !SKIP.has('deco')) {
    bakeBudgetEnd = firstPaint ? Infinity : performance.now() + 12;
    if (band === 'near') bakeMissing(provsByY.filter((p) => seen(geo(p.i).bb)).map((p) => p.i), band, now);
    const C = band !== 'near' && !animatingSprites(now) ? decoComposite(band, now) : null;
    if (C) { g.globalAlpha = decoAlpha; blitRegion(g, C, C.x0, C.y0, C.x0 + C.w, C.y0 + C.h); g.globalAlpha = 1; }
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
  // the always-on layer: wilds (every mode, every band), information marks, borders, bands
  if (!SKIP.has('wilds')) for (const w of WILDS) blitW(g, wildSprite(w, band));
  PM('wilds');
  if (!SKIP.has('marks')) drawMarks(g, band, now);
  PM('marks');
  const px = 1 / cam.s;
  if (state.mode === 'ownership') { g.strokeStyle = 'rgba(0,0,0,.12)'; g.lineWidth = 5 * px; for (const p of provs) { pathPoly(g, cells[p.i]); g.stroke(); } }
  g.strokeStyle = '#2B2620'; g.lineWidth = 2 * px;
  for (const p of provs) { const f = fogOf(p.i); if (f) g.setLineDash([2 * px, 3 * px]); else g.setLineDash([]); pathPoly(g, cells[p.i]); g.stroke(); }
  g.setLineDash([]);
  if (state.mode === 'ownership') for (const p of provs) {
    if (!p.owner) continue; const poly = cells[p.i];
    g.save(); pathPoly(g, poly); g.clip(); g.lineWidth = Math.max(5, 11 * cam.s) * px; g.strokeStyle = BAN[p.owner]; g.stroke();
    g.lineWidth = px; g.strokeStyle = p.owner === 'green' ? '#F4EEDF' : '#1C1A17'; g.globalAlpha = 0.7;
    const c = cent[p.i]; g.beginPath(); poly.forEach(([x, y], k) => { const ix = c[0] + (x - c[0]) * 0.86, iy = c[1] + (y - c[1]) * 0.86; k ? g.lineTo(ix, iy) : g.moveTo(ix, iy); }); g.closePath(); g.stroke(); g.restore();
  }
  PM('borders');
  g.strokeStyle = '#1C1A17'; g.lineWidth = 2.5 * px; g.strokeRect(-1, -1, W + 2, H + 2);
  // wild signature: a 3 px ink contour in place of the border, and a light rim inside (ticks on peaks, a keyline on meres)
  for (const w of WILDS) {
    const G = wgeo(w), full = view.pass;
    if (w.kind === 'mere') { g.save(); g.beginPath(); for (const c of w.cells) pathPoly(g, cells[c]); g.clip(); g.strokeStyle = `rgba(233,228,216,${full ? 1 : 0.7})`; g.lineWidth = 7 * px; g.beginPath(); for (const e of G.edges) { g.moveTo(...e.a); g.lineTo(...e.b); } g.stroke(); g.restore(); }
    else { g.strokeStyle = `rgba(233,228,216,${full ? 1 : 0.85})`; g.lineWidth = 1.3 * px; g.beginPath(); for (const t of G.ticks[band]) { g.moveTo(t[0], t[1]); g.lineTo(t[2], t[3]); } g.stroke(); }
    g.strokeStyle = '#1C1A17'; g.lineWidth = 3 * px; g.lineCap = 'round'; g.beginPath(); for (const e of G.edges) { g.moveTo(...e.a); g.lineTo(...e.b); } g.stroke(); g.lineCap = 'butt';
    if (view.pass) { g.strokeStyle = '#E9E4D8'; g.lineWidth = 4 * px; g.beginPath(); for (const e of G.edges) { g.moveTo(...e.a); g.lineTo(...e.b); } g.stroke(); }
  }
  // review overlay: hatch every province Varo cannot reach
  if (view.pass) {
    g.save(); g.beginPath(); for (const p of provs) if (p.i !== cmd.varo.at && !pathTo(cmd.varo.at, p.i)) { const poly = cells[p.i]; poly.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); } g.clip();
    g.strokeStyle = 'rgba(28,26,23,.55)'; g.lineWidth = 1.6 * px; g.beginPath(); for (let d = -H; d < W + H; d += 9 * px) { g.moveTo(d, 0); g.lineTo(d + H, H); } g.stroke(); g.restore();
  }
  screenT(g);
  if (!SKIP.has('labels')) drawLabels(g, band);
  g.setTransform(1, 0, 0, 1, 0, 0);
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
  const now = performance.now(); PT = now; animating = false;
  let decoAnim = false;
  if (decoAlpha !== decoTo) { const t = view.reduced ? 1 : Math.min(1, (now - decoT0) / 150); decoAlpha = decoFrom + (decoTo - decoFrom) * t; if (t < 1) { animating = true; decoAnim = true; } }
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
    if (hw.kind === 'mere') { g.save(); g.beginPath(); for (const c of hw.cells) pathPoly(g, cells[c]); g.clip(); g.strokeStyle = '#E9E4D8'; g.lineWidth = 7 * px; g.beginPath(); for (const e of G.edges) { g.moveTo(...e.a); g.lineTo(...e.b); } g.stroke(); g.restore(); }
    else { g.strokeStyle = '#E9E4D8'; g.lineWidth = 1.3 * px; g.beginPath(); for (const t of G.ticks[band]) { g.moveTo(t[0], t[1]); g.lineTo(t[2], t[3]); } g.stroke(); }
    g.strokeStyle = '#1C1A17'; g.lineWidth = 3 * px; g.lineCap = 'round'; g.beginPath(); for (const e of G.edges) { g.moveTo(...e.a); g.lineTo(...e.b); } g.stroke(); g.lineCap = 'butt';
  }
  if (hoverProv >= 0 && !isWild(hoverProv)) { pathPoly(g, cells[hoverProv]); g.lineWidth = 2 * px; g.strokeStyle = 'rgba(244,238,223,.55)'; g.stroke(); }
  if (state.sel && state.sel.type === 'prov') { pathPoly(g, cells[state.sel.id]); g.lineWidth = 3 * px; g.strokeStyle = '#F4EEDF'; g.stroke(); }
  // transit arrows and the path preview (a thread with square brass tacks and day plates)
  screenT(g);
  if (!cmd.ilsa.hidden) arrow(g, cent[cmd.ilsa.at], cent[cmd.ilsa.to], '#9FE0C2', `${cmd.ilsa.eta}d`);
  if (moveLine) thread(g, moveLine);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  present(now, true);
  if (!SKIP.has('badges')) placeBadges(band);
  PM('badges');
  updateZoomChip(band);
  firstPaint = false;
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
  worldT(g); g.save(); g.beginPath(); g.rect(ROOM[0], ROOM[1], ROOM[2] - ROOM[0], ROOM[3] - ROOM[1]); g.rect(CLOTH[0], CLOTH[1], CLOTH[2] - CLOTH[0], CLOTH[3] - CLOTH[1]); g.clip('evenodd');
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
  for (const [at, list] of byAt) { const [sx, sy] = toScreen(...cent[at]), n = list.length, eta = list.some((c) => c.eta); placed.push([sx - 15 * n - 3, sy - 70 - (band === 'near' ? 40 : 0), sx + 15 * n + 3, sy - 16 + (eta ? 18 : 0)]); }
  const wildLabels = WILDS.map((w) => { const G = wgeo(w); const f = `italic 400 ${G.nameFs}px 'Alegreya Sans', sans-serif`; const tw = textW(w.name, f) * 1.1; const spots = [G.labelAt, ...[...w.cells].sort((a, b) => areaOf[b] - areaOf[a])].flatMap((c) => [[0, 0], [0, 26], [0, -26]].map(([dx, dy]) => { const [sx, sy] = toScreen(...cent[c]); return [sx + dx, sy + dy]; })); return { w, spots, f, tw, fsz: G.nameFs }; });
  const queue = [];
  for (const p of LABEL_ORDER) { if (p.cap || p.well) queue.push(['p', p]); }
  for (const wl of wildLabels) queue.push(['w', wl]);
  for (const p of LABEL_ORDER) { if (!p.cap && !p.well) queue.push(['p', p]); }
  for (const [kind, it] of queue) {
    if (kind === 'w') {
      const spot = it.spots.find(([x, y]) => { const b = [x - it.tw / 2 - 2, y - it.fsz / 2 - 2, x + it.tw / 2 + 2, y + it.fsz / 2 + 2]; return !placed.some((q) => b[2] > q[0] && b[0] < q[2] && b[3] > q[1] && b[1] < q[3]); });
      if (!spot) continue; const [lx, ly] = spot; placed.push([lx - it.tw / 2 - 2, ly - it.fsz / 2 - 2, lx + it.tw / 2 + 2, ly + it.fsz / 2 + 2]);
      g.font = it.f; if ('letterSpacing' in g) g.letterSpacing = '0.08em'; g.fillStyle = '#E9E4D8'; g.fillText(it.w.name, lx, ly); if ('letterSpacing' in g) g.letterSpacing = '0px';
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
    if (p.well) { // the Wellspring monument and its claim state
      const x0 = st.sx - st.rad - 13 * LS, y0 = st.sy + 5; g.save(); g.translate(x0, y0); g.scale(LS, LS); const x = 0, y = 0; g.lineWidth = Math.min(1.2, px * 1.1) / LS; g.strokeStyle = INK;
      if (p.claim === 'red') for (let k = 0; k < 4; k++) { const a = Math.PI + (k / 3) * Math.PI; const qx = x + Math.cos(a) * 9, qy = y + Math.sin(a) * 5; g.fillStyle = '#FD6533'; g.fillRect(qx - 1.3, qy - 6, 2.6, 6); g.strokeRect(qx - 1.3, qy - 6, 2.6, 6); }
      g.fillStyle = '#CFC6B4'; ellipse(g, x, y, 6.5, 3.6); g.fill(); g.stroke(); g.fillStyle = '#7FA9BA'; ellipse(g, x, y - 0.4, 4.2, 2); g.fill();
      g.fillStyle = '#CFE8F0'; for (let k = 0; k < 5; k++) { const a = Math.PI + 0.3 + k * 0.6; ellipse(g, x + Math.cos(a) * 5, y - 4 + Math.sin(a) * 1.5, 0.8, 1.2); g.fill(); }
      g.save(); g.translate(x, y - 10); g.rotate(Math.PI / 4); g.strokeStyle = '#E9E4D8'; g.lineWidth = Math.min(1.4, px * 1.3); g.fillStyle = p.claim === 'red' ? '#FD6533' : 'rgba(0,0,0,0)'; g.fillRect(-2.2, -2.2, 4.4, 4.4); g.strokeRect(-2.2, -2.2, 4.4, 4.4); g.restore();
      if (p.claim === 'running') { g.fillStyle = '#5E4630'; g.fillRect(x + 7, y - 6, 2.4, 6); g.fillStyle = '#E9DFC2'; ellipse(g, x + 8.2, y - 7.3, 1.4, 1.4); g.fill(); g.strokeStyle = '#E9E4D8'; g.lineWidth = Math.min(1.6, px * 1.5) / LS; g.beginPath(); g.arc(x, y - 1, 11, -Math.PI / 2, -Math.PI / 2 + Math.PI); g.stroke(); g.strokeStyle = 'rgba(233,228,216,.3)'; g.beginPath(); g.arc(x, y - 1, 11, Math.PI / 2, Math.PI * 1.5); g.stroke(); }
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
      if (fx.kind === 'ashrain') { g.save(); pathPoly(g, G.poly); g.clip(); g.fillStyle = 'rgba(233,228,216,.75)'; const [x0, y0, x1, y1] = G.bb; for (let k = 0; k < 90 * fx.step; k++) { const x = x0 + R() * (x1 - x0), y = y0 + R() * (y1 - y0); g.fillRect(x, y, 1.6, 1.1); } g.restore(); }
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
      const word = c.indepOf ? (c.indepOf.indep < 15 ? 'weak' : c.indepOf.indep < 25 ? 'moderate' : 'strong') : null;
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
  if (c.side === 'green') return { portrait, title: `${cname(c)}`, value: `${troops} troops`, meaning: `Thornwood. ${term('inbound', 'Hostile')}: marching on ${prov[c.to].name}, arrives in ${c.eta} days.`, rows: rows.slice(0, 2), proj: 'Our estimate: about 1.1 times Varo\'s army. A guess, not a forecast.' };
  if (c.hp[0] / c.hp[1] <= 0.5) rows.unshift(['Wounded', `${c.hp[0]} / ${c.hp[1]} HP`]);
  return { portrait, title: c.name, value: c.unit, meaning: `Order: ${c.order}.${c.pips ? ' Pips: ' + c.pips + '.' : ''}${c.prophet ? ' The prophet.' : ''}${c.gear ? ` Gear: ${c.gear.n} item (${['', 'common', 'rare', 'artifact'][c.gear.tier]}).` : ''}`, rows };
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
  state.sel = { type: 'prov', id: i }; app.classList.remove('strip-on'); moveLine = null;
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
    body += `<div class="section"><h3>Commanders here</h3>${here.length ? here.map((c) => `<div class="orow" data-c="${c.id}" style="padding-left:6px;grid-template-columns:44px 1fr auto;min-height:44px"><span class="pface">${portraitOf(c, 40)}</span><span class="nm">${cname(c)}</span><span class="meta">${c.squads.reduce((n, s) => n + s[1], 0)}</span></div>`).join('') : '<p class="dimtxt" style="margin:0">None.</p>'}</div>${p.buildings.includes('fort') ? '<div class="section"><h3>Garrison</h3><div class="orow" style="padding-left:6px"><span></span><span class="nm">20 Ash Militia</span><span class="meta">reserve</span></div></div>' : ''}`;
  } else {
    body += `<div class="section"><h3>History</h3>${MSGS.filter((m) => m.html.includes(p.name)).map((m) => `<div class="msg" style="padding-left:0"><span style="color:var(--dim);display:inline-flex">${svgIcon(m.icon, 16)}</span><span class="when">${m.when}</span><span>${m.html}</span></div>`).join('') || '<p class="dimtxt" style="margin:0">Nothing has happened here yet.</p>'}</div>`;
  }
  const tabs = own && p.buildings.includes('fort') ? ['Overview', 'Recruit', 'Forces', 'History'] : ['Overview', 'Forces', 'History'];
  if (!tabs.includes(provTab)) provTab = 'Overview';
  leftDock.innerHTML = `<div class="dockhead"><span class="banner">${p.owner ? `<svg width="20" height="26" viewBox="0 0 22 28"><path d="M1 1h20v20l-10 6-10-6z" fill="${BAN[p.owner]}"/></svg>` : ''}</span><div style="min-width:0;flex:1"><h2>${p.name}</h2><div class="sub">${TERRAIN[p.terrain].name} · ${ownerName}${p.cap ? ' · capital' : ''}</div></div><button class="iconbtn" aria-label="Pin" data-tip="raw:pin">⚲</button><button class="iconbtn" id="closeDock" aria-label="Close">✕</button></div>
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
  const c = cmd[id]; state.sel = { type: 'cmd', id }; moveLine = null;
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
function clearSel() { state.sel = null; moveLine = null; leftDock.hidden = true; app.classList.remove('strip-on'); draw(); }

// ------------------------------------------------------------------ map input
const cursorLbl = document.getElementById('cursorLbl');
function showCursorLbl(text, cx, cy) { const ar = app.getBoundingClientRect(); cursorLbl.textContent = text; cursorLbl.style.left = cx - ar.left + 16 + 'px'; cursorLbl.style.top = cy - ar.top - 30 + 'px'; cursorLbl.classList.add('show'); canvas.classList.add('nogo'); }
function hideCursorLbl() { cursorLbl.classList.remove('show'); canvas.classList.remove('nogo'); }
const inMap = (x, y) => x >= 0 && y >= 0 && x <= W && y <= H;
const theName = (w) => w.name.replace('The ', 'the ');
let drag = false, dragMoved = 0;
canvas.addEventListener('mousemove', (e) => {
  const r = canvas.getBoundingClientRect(); const [x, y] = toWorld(e.clientX - r.left, e.clientY - r.top);
  if (drag) { cam.x += e.movementX; cam.y += e.movementY; clampCam(); dragMoved += Math.abs(e.movementX) + Math.abs(e.movementY); hideCursorLbl(); requestDraw(); return; }
  if (!inMap(x, y)) { if (hoverProv !== -1) { hoverProv = -1; requestDraw(); closeAll(); } hideCursorLbl(); return; }
  const i = nearest(x, y);
  const army = state.sel && state.sel.type === 'cmd' && cmd[state.sel.id].side === 'red';
  if (isWild(i) && army) showCursorLbl('✕ Impassable: ' + theName(wildOf[i]), e.clientX, e.clientY); else hideCursorLbl();
  if (i !== hoverProv) {
    hoverProv = i; requestDraw(); closeAll(); clearTimeout(hoverTimer);
    const sx = e.clientX, sy = e.clientY;
    hoverTimer = setTimeout(() => { if (hoverProv === i) showTip('prov:' + i, { left: sx + 14, right: sx + 14, top: sy + 6, bottom: sy + 6 }, 0); }, 500);
  }
});
canvas.addEventListener('mouseleave', () => { hoverProv = -1; drag = false; hideCursorLbl(); requestDraw(); });
canvas.addEventListener('mousedown', (e) => { if (e.button === 0) { drag = true; dragMoved = 0; } });
window.addEventListener('mouseup', () => { drag = false; });
canvas.addEventListener('click', (e) => {
  if (dragMoved > 6) return;
  const r = canvas.getBoundingClientRect(); const [x, y] = toWorld(e.clientX - r.left, e.clientY - r.top);
  if (!inMap(x, y)) { clearSel(); return; } // bare table and the props are inert: a click clears the selection
  closeAll(); const i = nearest(x, y); if (isWild(i)) { clearSel(); return; } selectProv(i);
});
canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); if (e.pointerType !== 'touch') orderMove(e.clientX, e.clientY); });
function orderMove(cx, cy) {
  if (!state.sel || state.sel.type !== 'cmd') { toast(`Select one of your armies first, then ${app.classList.contains('phone') ? 'long-press' : 'right-click'} where it should go.`); return; }
  const c = cmd[state.sel.id]; if (c.side !== 'red') return;
  const r = canvas.getBoundingClientRect(); const [x, y] = toWorld(cx - r.left, cy - r.top); if (!inMap(x, y)) return;
  const i = nearest(x, y);
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
  touches.set(e.pointerId, { x: e.clientX, y: e.clientY }); dragMoved = 0; clearTimeout(pressTimer);
  if (touches.size === 1) pressTimer = setTimeout(() => { if (dragMoved < 8) { dragMoved = 99; orderMove(e.clientX, e.clientY); } }, 550);
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
  clearTimeout(detentTimer); detentTimer = setTimeout(() => { if (Math.abs(cam.s / fitScale - 1) <= 0.08 && cam.s !== fitScale) animateCam(fitScale, null); }, 150);
}, { passive: false });
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
const fitToCloth = () => animateCam(fitScale, [(CLOTH[0] + CLOTH[2]) / 2, (CLOTH[1] + CLOTH[3]) / 2]);

// ------------------------------------------------------------------ map modes (the decoration fades out of data modes over 150 ms)
const MODES = [['ownership', 'ownership', 'Ownership', 'Owner bands over the painted land.'], ['dominion', 'dominion', 'Dominion', 'Who dominates each province, and how strongly.'], ['supply', 'supply', 'Supply', 'Food given per day. Lighter is more.'], ['unrest', 'fist', 'Unrest', 'Lighter is more unrest. Above 50 recruiting stops.'], ['population', 'pop', 'Population', 'Lighter is more people.'], ['springs', 'springs', 'Mana springs', 'Springs by color, with their symbols.']];
const modesEl = document.getElementById('modes');
function setMode(m) {
  const was = state.mode; state.mode = m;
  if ((was === 'ownership') !== (m === 'ownership')) { decoFrom = decoAlpha; decoTo = m === 'ownership' ? 1 : 0; decoT0 = performance.now(); }
  renderModes(); requestDraw();
}
function renderModes() {
  const cur = MODES.find((m) => m[0] === state.mode);
  modesEl.innerHTML = `<div class="fitrow"><span class="zoomchip" id="zoomChip" data-tip="raw:zoom">Zoom: ${bandOf(cam.s)[0].toUpperCase() + bandOf(cam.s).slice(1)}</span><button class="fitbtn" id="fitBtn" data-tip="raw:fit">Fit <kbd>Z</kbd></button></div><div class="legend"><b style="color:var(--text)">${cur[2]}</b> · ${cur[3]}${cur[0] !== 'ownership' ? ' Wilds stay drawn: no data, no entry.' : ''}</div>` + MODES.map((m, k) => `<button class="modebtn ${m[0] === state.mode ? 'on' : ''}" data-m="${m[0]}" data-tip="raw:mode${k}" aria-label="${m[2]} map mode">${svgIcon(m[1], 18)}</button>`).join('');
  MODES.forEach((m, k) => { RAW['mode' + k] = { title: m[2] + ' map', meaning: m[3], foot: `<span>Shift+${k + 1} · M cycles</span><span></span>` }; });
  RAW.fit = { title: 'Fit the cloth', meaning: 'Returns to the standard view: the whole map with a band of oak around it. Home stays the capital.', foot: '<span>Key Z</span><span></span>' };
  RAW.zoom = { title: 'Zoom band', meaning: 'Far shows masses and the table; Mid the full detail; Near adds yards, standees and scree. Information never thins, only decoration.' };
  modesEl.querySelectorAll('.modebtn').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.m)));
  modesEl.querySelector('#fitBtn').addEventListener('click', fitToCloth);
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
  if (e.target.matches('input, select')) return;
  if (e.key === 'Shift') app.classList.add('shift');
  if (e.key === 'Escape') { if (!scrim.hidden) closeModal(); else if (tips.length) closeAll(); else clearSel(); return; }
  if (e.code === 'Space') { e.preventDefault(); setPaused(!state.paused); }
  if (/^Digit[1-4]$/.test(e.code) && !e.shiftKey) { state.speed = Number(e.code.slice(5)); updateTop(); }
  if (/^Digit[1-6]$/.test(e.code) && e.shiftKey) setMode(MODES[Number(e.code.slice(5)) - 1][0]);
  if (e.key === 't' || e.key === 'T') lockTop();
  if (e.key === 'f' || e.key === 'F') openCodex();
  if (e.key === 'r' || e.key === 'R') openResearch();
  if (e.key === 'z' || e.key === 'Z') fitToCloth();
  if (e.key === 'h' || e.key === 'H') app.classList.toggle('hidden-ui');
  if (e.key === 'm' || e.key === 'M') { const k = MODES.findIndex((m) => m[0] === state.mode); setMode(MODES[(k + 1) % MODES.length][0]); }
  if (e.key === '[') leftDock.hidden = !leftDock.hidden;
  if (e.key === ']') document.getElementById('rightDock').hidden = !document.getElementById('rightDock').hidden;
});
window.addEventListener('keyup', (e) => { if (e.key === 'Shift') app.classList.remove('shift'); });

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
})));
const visionSel = document.getElementById('vision');
visionSel.addEventListener('change', () => { const v = visionSel.value; view.vision = v; app.style.filter = v === 'normal' ? '' : `url(#cvd-${v})`; document.getElementById('visionNote').hidden = v === 'normal'; });
const rmotion = document.getElementById('rmotion'); rmotion.checked = view.reduced;
rmotion.addEventListener('change', () => { view.reduced = rmotion.checked; ANIM.clear(); requestDraw(); });
document.getElementById('btnPortraits').addEventListener('click', openGallery);
const btnPass = document.getElementById('btnPass');
btnPass.addEventListener('click', () => { view.pass = !view.pass; btnPass.classList.toggle('on', view.pass); btnPass.setAttribute('aria-pressed', String(view.pass)); document.getElementById('reviewChip').classList.toggle('show', view.pass); requestDraw(); });
document.getElementById('wipe').addEventListener('change', (e) => { view.wipe = e.target.checked; });

// ------------------------------------------------------------------ responsive frames
const rightDock = document.getElementById('rightDock');
document.getElementById('railOut').addEventListener('click', () => { rightDock.classList.toggle('fly'); });
document.getElementById('railFeed').addEventListener('click', () => { rightDock.classList.toggle('fly'); msgs.scrollIntoView({ block: 'nearest' }); });
document.getElementById('railMode').addEventListener('click', () => { const k = MODES.findIndex((m) => m[0] === state.mode); setMode(MODES[(k + 1) % MODES.length][0]); const m = MODES.find((x) => x[0] === state.mode); toast(`${m[2]} map: ${m[3]}`); });
RAW.railMode = { title: 'Map mode', meaning: 'Cycles ownership, dominion, supply, unrest, population and mana springs.', foot: '<span>Key M</span><span></span>' };
function layout() {
  const w = app.clientWidth;
  app.classList.toggle('mid', w < 1250 && w >= 720); app.classList.toggle('phone', w < 720);
  fit(); draw();
}
new ResizeObserver(layout).observe(app);
document.addEventListener('visibilitychange', () => { if (!document.hidden) requestDraw(); });

// ------------------------------------------------------------------ start
if (window.innerWidth < 720) document.getElementById('headMore').open = false;
deriveMonth(3); refreshKeys();
document.getElementById('tryAcross').textContent = acrossTarget != null ? names[acrossTarget] : 'a province across the Ashspine';
renderAlerts(); renderOutliner(); renderFeed(); renderModes(); updateTop();
document.fonts?.ready?.then(() => { TW_CACHE.clear(); CLOTHB = null; invalidateBakes(); firstPaint = true; draw(); });
layout();
selectCmd('varo');
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
  info: () => ({ wilds: WILDS.map((w) => [w.id, w.cells.length]), provinces: provs.length, fog: FOG.filter(Boolean).length, captures: captureTargets.map((i) => names[i]), pillage: names[pillageProv], burn: names[burnProv], ashRain: names[ashRainProv], morholt: names[morholt], sunmere: names[ownWell] }),
};
// Notes for review (decisions where the brief left room):
// - The mockup's sheet has 66 cells, far fewer than a Medium map; with the 3-hop gap between ranges the generator placed all
//   three ranges on only a few seeds and none gave Varo a target across the Ashspine. The mockup uses a 2-hop gap between
//   ranges (3 hops from both capitals, as briefed) and map seed 12. Every other placement rule is as briefed.
// - Houses and their spiral are drawn 1.3x the briefed size so a town reads at the start zoom.
// - The pillaged province loses 8% at M14 and 25% in all by M15, so it drops a tier and reads as declining.
})();
