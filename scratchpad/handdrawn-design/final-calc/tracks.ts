// final.md §3.2: feasibility of the revised track geometry on real game maps (no wilds yet in the game).
// Noisy shared edges (Red Blob quad recursion + 2 Chaikin passes), seats as in the mockup, then the
// track rules: curve from the settlement ellipse to m' (m pushed inward along the local normal by Z),
// a straight perpendicular stub m' -> m, clearance C from every border outside the crossing zone.
// Run: cd /home/user/Fluid-Magic- && npx tsx <this file>
import { generateMap } from '/home/user/Fluid-Magic-/src/mapgen/generate.ts';
import type { CapitalSpec, Point } from '/home/user/Fluid-Magic-/src/mapgen/types.ts';

type P = [number, number];
const caps = (n: number): CapitalSpec[] => [
  { color: 'R', terrain: 'plains', name: 'Kharnath' },
  { color: 'G', terrain: 'forest', name: 'Deepmoss' },
  { color: 'U', terrain: 'swamp', name: 'Tidecourt' },
  { color: 'W', terrain: 'hills', name: 'Lumen' },
].slice(0, n) as CapitalSpec[];
function hash(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rngFor(key: string) { let a = hash(key); return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const lerp = (a: P, b: P, t: number): P => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const mid = (a: P, b: P): P => lerp(a, b, 0.5);
const dist = (a: P, b: P) => Math.hypot(a[0] - b[0], a[1] - b[1]);
function cross(a: P, b: P, c: P, d: P) { const o = (p: P, q: P, r: P) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])); return o(a, b, c) !== o(a, b, d) && o(c, d, a) !== o(c, d, b); }
function noisy(a: P, b: P, p: P, q: P, R: () => number, L: number): P[] {
  if (dist(a, b) < L || !cross(a, b, p, q)) return [a, b];
  const c = lerp(p, q, 0.4 + 0.2 * R());
  const l = noisy(a, c, mid(a, p), mid(a, q), R, L), r = noisy(c, b, mid(b, p), mid(b, q), R, L);
  return l.concat(r.slice(1));
}
function chaikin(pts: P[]): P[] { const out: P[] = [pts[0]!]; for (let k = 0; k < pts.length - 1; k++) { const a = pts[k]!, b = pts[k + 1]!; out.push(lerp(a, b, 0.25), lerp(a, b, 0.75)); } out.push(pts[pts.length - 1]!); return out; }
function segDist(p: P, a: P, b: P) { const dx = b[0] - a[0], dy = b[1] - a[1]; const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1))); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); }
function inPoly(poly: P[], [x, y]: P) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i]!, [xj, yj] = poly[j]!; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; }
const key = (p: Point) => `${p.x.toFixed(6)},${p.y.toFixed(6)}`;

const SIZES = (process.env.SIZES ?? 'small,medium,large').split(',') as ('small'|'medium'|'large')[];
const fail = { start: 0, middle: 0, end: 0, mi: 0 }; const stats = { pairs: 0, lv: [0, 0, 0, 0, 0], stub: 0, noCross: 0, slid: 0, clipDots: 0, dots: 0, shortPairs: 0, halfGap: 0, lastSeg: [] as number[] };
const medD: Record<string, number[]> = { small: [], medium: [], large: [] };
// clearances in u (u = median diameter / 180, one screen px at the Mid top)
const START_U = Number(process.env.START_U ?? 0); const C_U = Number(process.env.C_U ?? 15), Z_U = Number(process.env.Z_U ?? 20), J_U = Number(process.env.J_U ?? 11);
for (const size of SIZES) for (const n of [2, 4]) for (let seed = 1; seed <= Number(process.env.SEEDS ?? 30); seed++) {
  let m; try { m = generateMap({ seed, size, capitals: caps(n) }); } catch { continue; }
  const P = Object.values(m.provinces);
  const diams = P.map((p) => { let A = 0; const g = p.polygon; for (let i = 0; i < g.length; i++) { const a = g[i]!, b = g[(i + 1) % g.length]!; A += a.x * b.y - b.x * a.y; } return 2 * Math.sqrt(Math.abs(A / 2) / Math.PI); }).sort((a, b) => a - b);
  const D = diams[Math.floor(diams.length / 2)]!; medD[size]!.push(D); const u = D / 180;
  // noisy shared edges
  const EDGE = new Map<string, P[]>();
  const byId = m.provinces;
  for (const p of P) for (const nid of p.neighbors) {
    if (p.id > nid) continue; const q = byId[nid]!; const kb = new Set(q.polygon.map(key)); const g = p.polygon;
    const chain: P[] = [];
    for (let i = 0; i < g.length; i++) { const a = g[i]!, b = g[(i + 1) % g.length]!; if (kb.has(key(a)) && kb.has(key(b))) { if (!chain.length) chain.push([a.x, a.y]); chain.push([b.x, b.y]); } }
    if (chain.length < 2) continue;
    const R = rngFor(`edge:${seed}:${p.id}:${nid}`); let pts: P[] = [chain[0]!];
    for (let k = 0; k < chain.length - 1; k++) pts = pts.concat(noisy(chain[k]!, chain[k + 1]!, [p.site.x, p.site.y], [q.site.x, q.site.y], R, 3 * Math.sqrt(6400) / 80 * (D / 90)).slice(1));
    pts = chaikin(chaikin(pts));
    EDGE.set(`${p.id}|${nid}`, pts);
  }
  // noisy polygons
  const npoly = new Map<string, P[]>();
  for (const p of P) {
    const g = p.polygon; const out: P[] = [];
    for (let i = 0; i < g.length; i++) {
      const a = g[i]!, b = g[(i + 1) % g.length]!; let rep: P[] | null = null;
      for (const nid of p.neighbors) { const e = EDGE.get(p.id < nid ? `${p.id}|${nid}` : `${nid}|${p.id}`); if (!e) continue; const s = e[0]!, t = e[e.length - 1]!;
        const near = (x: P, y: Point) => Math.abs(x[0] - y.x) < 1e-6 && Math.abs(x[1] - y.y) < 1e-6;
        // only single-segment edges are replaced in walk order (chains longer than one segment keep straight here)
        if (near(s, a) && near(t, b)) rep = e; else if (near(s, b) && near(t, a)) rep = e.slice().reverse(); }
      if (rep) out.push(...rep.slice(0, -1)); else out.push([a.x, a.y]);
    }
    npoly.set(p.id, out);
  }
  const bdist = (poly: P[], x: P) => { let d = Infinity; for (let i = 0; i < poly.length; i++) d = Math.min(d, segDist(x, poly[i]!, poly[(i + 1) % poly.length]!)); return d; };
  const otherDist = (poly: P[], e: P[], x: P) => { let d = Infinity; const onE = (a: P) => e.some((y) => Math.abs(a[0] - y[0]) < 1e-9 && Math.abs(a[1] - y[1]) < 1e-9); for (let i = 0; i < poly.length; i++) { const a = poly[i]!, b = poly[(i + 1) % poly.length]!; if (onE(a) && onE(b)) continue; d = Math.min(d, segDist(x, a, b)); } return d; };
  for (const [k, e] of EDGE) {
    const [ida, idb] = k.split('|') as [string, string]; stats.pairs++;
    let tot = 0; const cum = [0]; for (let i = 0; i < e.length - 1; i++) { tot += dist(e[i]!, e[i + 1]!); cum.push(tot); }
    if (tot < 0.1 * Math.sqrt(6400) * (D / 90)) stats.shortPairs++;
    const at = (f: number): [P, P] => { const L = f * tot; for (let i = 0; i < e.length - 1; i++) { const l = cum[i + 1]! - cum[i]!; if (cum[i + 1]! >= L) { const T: P = [(e[i + 1]![0] - e[i]![0]) / (l || 1), (e[i + 1]![1] - e[i]![1]) / (l || 1)]; return [lerp(e[i]!, e[i + 1]!, (L - cum[i]!) / (l || 1)), T]; } } return [e[e.length - 1]!, [1, 0]]; };
    const sides = [ida, idb].map((id) => ({ id, poly: npoly.get(id)!, pr: byId[id as never] as unknown as { center: Point } }));
    // 1. the crossing: the arc-length midpoint, else the nearest point in the middle half of the edge whose inward walk reaches clearance C on both sides
    let chosen: { M: P; Mi: P[]; d: number[] } | null = null;
    for (const f of [0.5, 0.45, 0.55, 0.4, 0.6, 0.35, 0.65, 0.3, 0.7, 0.25, 0.75]) {
      const [M, T] = at(f); const Mi: P[] = [], dd: number[] = []; let ok = true;
      for (const sd of sides) {
        let N: P = [-T[1], T[0]]; if (!inPoly(sd.poly, [M[0] + N[0] * 2 * u, M[1] + N[1] * 2 * u])) N = [T[1], -T[0]];
        let found: P | null = null, fd = 0;
        for (let d = Z_U; d <= 0.3 * 180; d += 1) { const x: P = [M[0] + N[0] * d * u, M[1] + N[1] * d * u]; if (!inPoly(sd.poly, x)) break; if (bdist(sd.poly, x) >= C_U * u) { found = x; fd = d; break; } }
        if (!found) { ok = false; break; } Mi.push(found); dd.push(fd);
      }
      if (ok) { chosen = { M, Mi, d: dd }; if (f !== 0.5) stats.slid++; break; }
    }
    if (!chosen) { stats.stub++; stats.noCross++; continue; }
    let pairLevel = 0;
    sides.forEach((sd, si) => {
      const poly = sd.poly, Mi = chosen!.Mi[si]!; stats.lastSeg.push(chosen!.d[si]!);
      const c: P = [sd.pr.center.x, sd.pr.center.y]; let seat = c; const ext = 0.152 * D;
      for (let t = 1; t >= 0; t -= 0.08) { seat = [c[0], c[1] + 0.297 * D * t]; if (inPoly(poly, seat) && bdist(poly, seat) > ext) break; }
      const rx = 0.163 * D, ry = 0.108 * D; const ang = Math.atan2((Mi[1] - seat[1]) / ry, (Mi[0] - seat[0]) / rx); const S: P = [seat[0] + rx * Math.cos(ang), seat[1] + ry * Math.sin(ang)];
      const R = rngFor(`track:${seed}:${k}:${sd.id}`); const sgn = R() < 0.5 ? -1 : 1, k0 = 0.1 + 0.1 * R();
      const len = dist(S, Mi); const nrm: P = [-(Mi[1] - S[1]) / (len || 1), (Mi[0] - S[0]) / (len || 1)];
      const okCurve = (ctl: P) => { if (!(len > 0)) return false; for (let t = 0; t <= 1; t += 1 / Math.max(8, Math.ceil(len / u))) { const x: P = [(1 - t) ** 2 * S[0] + 2 * (1 - t) * t * ctl[0] + t * t * Mi[0], (1 - t) ** 2 * S[1] + 2 * (1 - t) * t * ctl[1] + t * t * Mi[1]]; if (!inPoly(poly, x)) return false; if (t * len > START_U * u && bdist(poly, x) < C_U * u) return false; } return true; };
      let level = 4; // 0 k0, 1 k0/2, 2 zero, 3 via the centroid, 4 stub only
      for (const [lv, kk] of [[0, k0], [1, k0 / 2], [2, 0]] as const) { const ctl: P = [(S[0] + Mi[0]) / 2 + nrm[0] * kk * len * sgn, (S[1] + Mi[1]) / 2 + nrm[1] * kk * len * sgn]; if (okCurve(ctl)) { level = lv; break; } }
      if (level === 4 && inPoly(poly, c)) { const ctl: P = [2 * c[0] - (S[0] + Mi[0]) / 2, 2 * c[1] - (S[1] + Mi[1]) / 2]; if (okCurve(ctl)) level = 3; }
      pairLevel = Math.max(pairLevel, level);
      // the straight last segment Mi -> M: dots within J of any other border are dropped
      let kept = 0, n = 0; for (let t = 0; t <= 1.0001; t += 0.1) { const x = lerp(Mi, chosen!.M, t); n++; stats.dots++; if (otherDist(poly, e, x) < J_U * u) stats.clipDots++; else kept++; }
      if (kept < n / 2) stats.halfGap++;
    });
    stats.lv[pairLevel]!++;
  }
}
const med = (a: number[]) => (a.length ? a.sort((x, y) => x - y)[Math.floor(a.length / 2)]! : NaN);
console.log(`median province diameter (units): small ${med(medD.small!).toFixed(1)}, medium ${med(medD.medium!).toFixed(1)}, large ${med(medD.large!).toFixed(1)}; u on Medium = ${(med(medD.medium!) / 180).toFixed(3)} units`);
const pc = (x: number) => (100 * x / stats.pairs).toFixed(2) + '%';
const ls = stats.lastSeg.sort((a, b) => a - b);
console.log(`C ${C_U} u, Z ${Z_U} u, J ${J_U} u, start ${START_U} u: ${stats.pairs} pairs; curve ${pc(stats.lv[0]!)}, half offset ${pc(stats.lv[1]!)}, zero offset ${pc(stats.lv[2]!)}, via the centroid ${pc(stats.lv[3]!)}, stub only ${pc(stats.lv[4]! + stats.noCross)} (no clear crossing ${pc(stats.noCross)}); crossing slid off the midpoint ${pc(stats.slid)}; short edges ${stats.shortPairs}; straight last segment median ${ls[Math.floor(ls.length / 2)]} u, p95 ${ls[Math.floor(ls.length * 0.95)]} u; last-segment dots dropped near other borders ${(100 * stats.clipDots / stats.dots).toFixed(1)}%, halves with most of the crossing dropped ${(100 * stats.halfGap / (2 * stats.pairs)).toFixed(2)}%`);
