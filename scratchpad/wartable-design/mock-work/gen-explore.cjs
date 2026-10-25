// Explore the wild placement for the mockup's fixed seed (node, read-only).
const vm = require('vm'); const fs = require('fs'); const ctx0 = {}; vm.createContext(ctx0); vm.runInContext(fs.readFileSync(__dirname + '/../../vendor-d3/package/dist/d3.min.js', 'utf8'), ctx0); const d3 = ctx0.d3;
const seedArg = Number(process.argv[2] ?? 11);
function mulberry32(a) { return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rnd = mulberry32(seedArg);
const W = 1600, H = 1000, COLS = 11, ROWS = 6;
let pts = [];
for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) pts.push([(c + 0.5) / COLS * W + (rnd() - 0.5) * (W / COLS) * 0.8, (r + 0.5) / ROWS * H + (rnd() - 0.5) * (H / ROWS) * 0.8]);
let delaunay, voronoi;
for (let k = 0; k < 2; k++) { delaunay = d3.Delaunay.from(pts); voronoi = delaunay.voronoi([0, 0, W, H]); pts = pts.map((p, i) => d3.polygonCentroid(voronoi.cellPolygon(i))); }
delaunay = d3.Delaunay.from(pts); voronoi = delaunay.voronoi([0, 0, W, H]);
const N = pts.length;
const noise = (x, y) => Math.sin(x * 0.0042 + 1.3) + Math.sin(y * 0.0063 + 0.4) + 0.6 * Math.sin((x + y) * 0.0101 + 2.1) + 0.4 * Math.sin((x - 2 * y) * 0.007);
const wet = (x, y) => Math.sin(x * 0.0051 + 2.7) + Math.sin(y * 0.0047 + 1.9) + 0.6 * Math.sin((x - y) * 0.0089 + 0.6) + 0.4 * Math.sin((2 * x + y) * 0.0061 + 4.2);
const nb = [...Array(N).keys()].map((i) => [...voronoi.neighbors(i)]);
const redCap = delaunay.find(230, 520), greenCap = delaunay.find(1380, 470);
const onRect = (i) => voronoi.cellPolygon(i).some(([x, y]) => x < 0.5 || y < 0.5 || x > W - 0.5 || y > H - 0.5);
function hops(from, blocked) { const d = new Array(N).fill(Infinity); const q = []; for (const f of from) { d[f] = 0; q.push(f); } for (let h = 0; h < q.length; h++) for (const w of nb[q[h]]) if (d[w] === Infinity && !(blocked && blocked.has(w))) { d[w] = d[q[h]] + 1; q.push(w); } return d; }
function hasCut(blocked) { // iterative Tarjan articulation points over cells not blocked
  const disc = new Array(N).fill(-1), low = new Array(N).fill(0); let t = 0; let cut = false;
  const start = [...Array(N).keys()].find((i) => !blocked.has(i));
  const stack = [[start, -1, 0]]; disc[start] = low[start] = t++; let rootKids = 0;
  while (stack.length) {
    const top = stack[stack.length - 1]; const [v, parent] = top; const list = nb[v];
    if (top[2] < list.length) {
      const w = list[top[2]++]; if (blocked.has(w)) continue;
      if (disc[w] < 0) { disc[w] = low[w] = t++; stack.push([w, v, 0]); if (v === start) rootKids++; }
      else if (w !== parent) low[v] = Math.min(low[v], disc[w]);
    } else {
      stack.pop(); if (parent >= 0) { low[parent] = Math.min(low[parent], low[v]); if (parent !== start && low[v] >= disc[parent]) cut = true; }
    }
  }
  if (rootKids > 1) cut = true;
  const reached = disc.filter((x, i) => x >= 0 && !blocked.has(i)).length;
  return { cut, connected: reached === N - blocked.size };
}
const PLAN = [['ashspine', 'peaks', 'the Ashspine', 3], ['stillmere', 'mere', 'the Still Mere', 1], ['greyteeth', 'peaks', 'the Greyteeth', 2]];
const wild = new Map(); // cell -> range id
const ranges = [];
const capHops = hops([redCap, greenCap]);
function eligible(c, rangeCells) {
  if (wild.has(c) || rangeCells.includes(c) || onRect(c) || c === redCap || c === greenCap) return false;
  if (capHops[c] < 3) return false;
  for (const r of ranges) { const d = hops(r.cells); if (d[c] < 3) return false; }
  const blocked = new Set([...wild.keys(), ...rangeCells, c]);
  for (const w of nb[c]) if (!blocked.has(w) && nb[w].filter((x) => !blocked.has(x)).length < 2) return false;
  const { cut, connected } = hasCut(blocked); if (!connected || cut) return false;
  // provinces around each range within 6 hops of each other
  const all = [...ranges.map((r) => r.cells), [...rangeCells, c]];
  for (const cellsR of all) {
    const ring = [...new Set(cellsR.flatMap((x) => nb[x]))].filter((x) => !blocked.has(x));
    for (const a of ring) { const d = hops([a], blocked); for (const b of ring) if (d[b] > 6) return false; }
  }
  return true;
}
for (const [id, kind, name, size] of PLAN) {
  const score = (i) => (kind === 'peaks' ? noise(...pts[i]) : wet(...pts[i]) - noise(...pts[i]));
  const seeds = [...Array(N).keys()].sort((a, b) => score(b) - score(a));
  let tries = 0, done = null;
  for (const s of seeds) {
    if (!eligible(s, [])) continue; if (++tries > 12) break;
    const cells = [s];
    while (cells.length < size) {
      const cand = [...new Set(cells.flatMap((x) => nb[x]))].filter((x) => eligible(x, cells)).sort((a, b) => score(b) - score(a));
      if (!cand.length) break; cells.push(cand[0]);
    }
    if (cells.length === size) { done = cells; break; }
  }
  if (!done) { console.log('FAILED', id); continue; }
  ranges.push({ id, kind, name, cells: done }); for (const c of done) wild.set(c, id);
}
console.log('redCap', redCap, pts[redCap].map(Math.round), 'greenCap', greenCap, pts[greenCap].map(Math.round));
for (const r of ranges) console.log(r.id, r.cells, r.cells.map((c) => pts[c].map(Math.round)));
// owners
const blocked = new Set(wild.keys());
const dRed = hops([redCap], blocked), dGreen = hops([greenCap], blocked);
const provList = [...Array(N).keys()].filter((i) => !wild.has(i));
const owner = new Array(N).fill(null);
[...provList].sort((a, b) => dRed[a] - dRed[b]).slice(0, 9).forEach((i) => (owner[i] = 'red'));
provList.filter((i) => owner[i] === null).sort((a, b) => dGreen[a] - dGreen[b]).slice(0, 8).forEach((i) => (owner[i] = 'green'));
const nbrs = (i) => nb[i].filter((w) => !wild.has(w));
const redBorder = provList.filter((i) => owner[i] === 'red' && nbrs(i).some((w) => owner[w] !== 'red')).sort((a, b) => dGreen[a] - dGreen[b]);
const ashfen = redBorder[0];
console.log('red', provList.filter((i) => owner[i] === 'red').map((i) => [i, pts[i].map(Math.round)]));
console.log('ashfen', ashfen, pts[ashfen].map(Math.round));
// grid print
const rows = [];
for (let r = 0; r < 6; r++) { let s = ''; for (let c = 0; c < 11; c++) { const i = delaunay.find((c + 0.5) / 11 * W, (r + 0.5) / 6 * H); s += (wild.has(i) ? wild.get(i)[0].toUpperCase() : owner[i] === 'red' ? 'r' : owner[i] === 'green' ? 'g' : '.') + (i === ashfen ? '*' : ' ') + ' '; } rows.push(s); }
console.log(rows.join('\n'));
console.log('redBorder', redBorder.map((i) => [i, dGreen[i]]));
console.log('nb0', nb[0], 'nb23', nb[23]);
