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
