// Independent colour checks on rendered pixels, with the repo's own colour math (tests/content/colorMath.ts, src/content/colors.ts).
import { labAs, deltaE2000, type Vision } from './colorMath.ts';
import { contrastRatio, NATION_BANNERS } from './colors.ts';
import * as fs from 'node:fs';
const DIR = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/review/lines/';
const ALB: Record<string, string> = { plains: '#78894A', farmland: '#D5B16B', forest: '#1A3819', hills: '#6D5303', mountains: '#859BB8', swamp: '#38616D', wasteland: '#877773' }; // design §4.1
const CAP: Record<string, number> = { plains: 4, farmland: 4, forest: 6, hills: 9, mountains: 16, swamp: 3, wasteland: 6 };
const GESSO = '#E8DCC2', ASH = '#8F8C88', MOSS = '#5E7F45', SNOW = '#F2EEE6', WATER = '#50AF9B';
const hex = (c: number[]) => '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a: string, b: string, t: number) => { const A = rgb(a), B = rgb(b); return hex(A.map((v, j) => v + (B[j]! - v) * t)); };
const LABC = new Map<string, readonly [number, number, number]>();
const lab = (h: string, v: Vision = 'normal') => { const k = h + v; let x = LABC.get(k); if (!x) { x = labAs(h, v) as [number, number, number]; LABC.set(k, x); } return x; };
const dN = (a: string, b: string) => deltaE2000(lab(a), lab(b));
const dC = (a: string, b: string) => Math.min(...(['protan', 'deutan', 'tritan'] as Vision[]).map((v) => deltaE2000(lab(a, v), lab(b, v))));
// lab2hex for a CIELAB mean (D65, the same constants as colorMath's forward path)
function lab2hex([L, a, b]: readonly number[]) { const fy = (L! + 16) / 116, fx = fy + a! / 500, fz = fy - b! / 200; const fi = (t: number) => (t ** 3 > 216 / 24389 ? t ** 3 : (116 * t - 16) / (24389 / 27)); const X = fi(fx) * 0.95047, Y = fi(fy), Z = fi(fz) * 1.08883; const r = 3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z, g = -0.969266 * X + 1.8760108 * Y + 0.041556 * Z, bb = 0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z; const s = (c: number) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.max(0, c) ** (1 / 2.4) - 0.055); return hex([s(r), s(g), s(bb)]); }
const greyEqL = (h: string) => lab2hex([lab(h)[0], 0, 0]);
const WASH: Record<string, [string, number]> = { red: [ASH, 0.1], green: [MOSS, 0.06] };
function expected(p: any, mode: string) { // the design's states (mapwork/calc/lib.ts baseState), the wash by dominion strength
  const a = ALB[p.terrain]!; if (p.fog === 'unexplored') return { hex: mix(a, GESSO, 0.04), state: 'haze' };
  if (p.fog === 'outofsight') return { hex: mix(a, greyEqL(a), 0.1), state: 'outOfSight' };
  if (mode === 'ownership' && p.domN && WASH[p.domN]) { const [c, cap] = WASH[p.domN]!; return { hex: mix(a, c, (cap * p.domS) / 10), state: `wash ${p.domN} ${p.domS}` }; }
  return { hex: a, state: 'raw' };
}
const wc = (a: number[], b: number[]) => contrastRatio(hex(a), hex(b));
const q = (arr: number[], p: number) => { const s = [...arr].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))]! : NaN; };
const r2 = (n: number) => +n.toFixed(2);
const report: any = {};
const PFX = process.argv[2] || 'colors';
for (const f of fs.readdirSync(DIR).filter((x) => x.startsWith(PFX + '-') && x.endsWith('.json') && !x.includes('report')).sort()) {
  const D = JSON.parse(fs.readFileSync(DIR + f, 'utf8')); const R: any = { band: D.band, Dpx: D.Dpx == null ? null : +D.Dpx.toFixed(1), dpr: D.dpr };
  // 1. province core means (CIELAB mean) against the expected state colour, and terrain pairs between rendered means
  const rows: any[] = [];
  for (const p of D.cores) for (const which of ['inner', 'outer', 'both']) {
    const px: number[] = which === 'both' ? [...p.inner, ...p.outer] : p[which]; const n = px.length / 3; if (n < 40) continue;
    let L = 0, A = 0, B = 0; const cache = new Map<number, readonly [number, number, number]>();
    for (let k = 0; k < px.length; k += 3) { const key = (px[k]! << 16) | (px[k + 1]! << 8) | px[k + 2]!; let l = cache.get(key); if (!l) { l = labAs(hex([px[k]!, px[k + 1]!, px[k + 2]!]), 'normal') as [number, number, number]; cache.set(key, l); } L += l[0]; A += l[1]; B += l[2]; }
    const m = [L / n, A / n, B / n] as const, e = expected(p, D.mode); rows.push({ which, name: p.name, terrain: p.terrain, state: e.state, n, mean: lab2hex(m), dE: deltaE2000(m, lab(e.hex)), dL: m[0] - lab(e.hex)[0] });
  }
  const summ = (which: string) => { const r = rows.filter((x) => x.which === which); if (!r.length) return null; const w = r.reduce((a, b) => (b.dE > a.dE ? b : a)); let under = 0, pairs = 0, wN = 1e9, wC = 1e9, wNs = '', wCs = '';
    for (let a = 0; a < r.length; a++) for (let b = a + 1; b < r.length; b++) { if (r[a].terrain === r[b].terrain) continue; pairs++; const x = dN(r[a].mean, r[b].mean), y = dC(r[a].mean, r[b].mean); if (x < 20 || y < 12) under++; if (x < wN) { wN = x; wNs = `${r[a].name}/${r[b].name} ${r[a].terrain}/${r[b].terrain}`; } if (y < wC) { wC = y; wCs = `${r[a].name}/${r[b].name} ${r[a].terrain}/${r[b].terrain}`; } }
    return { provinces: r.length, worstDE: r2(w.dE), worstAt: `${w.name} ${w.terrain} ${w.state} dL ${w.dL.toFixed(2)} n${w.n}`, over05: r.filter((x) => x.dE > 0.5).map((x) => `${x.name} ${x.terrain} ${x.state} ${x.dE.toFixed(2)}`), medianDE: r2(q(r.map((x) => x.dE), 0.5)), pairs, under2012: under, worstNormal: `${r2(wN)} ${wNs}`, worstCvd: `${r2(wC)} ${wCs}` }; };
  for (const p of D.pureCores ?? []) { const px: number[] = p.px, n = px.length / 3; if (n < 40) continue; let L = 0, A = 0, B = 0; const cache = new Map<number, readonly [number, number, number]>(); for (let k = 0; k < px.length; k += 3) { const key = (px[k]! << 16) | (px[k + 1]! << 8) | px[k + 2]!; let l = cache.get(key); if (!l) { l = labAs(hex([px[k]!, px[k + 1]!, px[k + 2]!]), 'normal') as [number, number, number]; cache.set(key, l); } L += l[0]; A += l[1]; B += l[2]; } const m = [L / n, A / n, B / n] as const, e = expected(p, D.mode); rows.push({ which: 'pure', name: p.name, terrain: p.terrain, state: e.state, n, mean: lab2hex(m), dE: deltaE2000(m, lab(e.hex)), dL: m[0] - lab(e.hex)[0] }); }
  R.means = { pureMask006D: summ('pure'), inner012D: summ('inner'), ring006to012D: summ('outer'), core006D: summ('both') };
  R.meansStates = [...new Set(rows.map((x) => x.state))];
  // 2. lines: the neutral hairline against its own (lower-right) ground; the internal keyline; the realm rail's band rule
  const hair: Record<string, number[]> = {}, internal: Record<string, number[]> = {}, hairLocal: Record<string, number[]> = {}, intLocal: Record<string, number[]> = {}, rails: any = { n: 0, fail: 0, worst: 99, worstAt: '', failList: [] as string[] };
  const ok = (a: string, b: string) => dN(a, b) >= 20 && dC(a, b) >= 12;
  for (const e of D.edges) {
    if (e.fog || !e.okSides) continue; const prof: number[][] = e.prof, c = (prof.length - 1) / 2; // index of offset 0; 0.5 px a step
    const G = prof[c + 12]!; // the lower-right ground 6 px off the line
    if (e.type === 'neutral' || (e.type === 'internal' && D.band === 'far')) { let best = 0; for (let o = -4; o <= 4; o++) best = Math.max(best, wc(prof[c + o]!, G)); (hair[e.lrT] ??= []).push(best); if (e.lprof) { let bl = 0; for (let o = -3; o <= 3; o++) bl = Math.max(bl, wc(prof[c + o]!, e.lprof[c + o]!)); (hairLocal[e.lrT] ??= []).push(bl); } }
    else if (e.type === 'internal') { let best = 0; for (let o = -2; o <= 8; o++) best = Math.max(best, wc(prof[c + o]!, G)); (internal[e.lrT] ??= []).push(best); if (e.lprof) { let bl = 0; for (let o = 0; o <= 6; o++) bl = Math.max(bl, wc(prof[c + o]!, e.lprof[c + o]!)); (intLocal[e.lrT] ??= []).push(bl); } }
    else { // realm: each owned side carries a rail 1 px inside the border; ground 10 px in; pass if a rail pixel differs from the ground at 20 / 12 (banner, or a keyline that differs from both)
      for (const [side, sgn, own] of [['lr', 1, e.owners[0]], ['ul', -1, e.owners[1]]] as const) {
        if (!own) continue; const G2 = prof[c + sgn * 20]!; const px = []; for (let o = 1; o <= 14; o++) px.push(prof[c + sgn * o]!);
        const gh = hex(G2), pass = px.some((P) => ok(hex(P), gh)); const con = Math.max(...px.map((P) => wc(P, G2))); rails.n++; if (!pass) { rails.fail++; if (rails.failList.length < 6) rails.failList.push(`${side === 'lr' ? e.lrT : e.ulT} ${own} G${gh}`); }
        if (con < rails.worst) { rails.worst = r2(con); rails.worstAt = `${side === 'lr' ? e.lrT : e.ulT} owner ${own}`; }
      }
    }
  }
  R.hairline = Object.fromEntries(Object.entries(hair).map(([t, v]) => [t, { n: v.length, min: r2(Math.min(...v)), p10: r2(q(v, 0.1)), median: r2(q(v, 0.5)), max: r2(Math.max(...v)) }]));
  R.internalKeyline = Object.fromEntries(Object.entries(internal).map(([t, v]) => [t, { n: v.length, min: r2(Math.min(...v)), median: r2(q(v, 0.5)) }]));
  R.rails = rails;
  const st = (o: Record<string, number[]>) => Object.fromEntries(Object.entries(o).map(([t, v]) => [t, { n: v.length, min: r2(Math.min(...v)), p10: r2(q(v, 0.1)), median: r2(q(v, 0.5)), under23: v.filter((x) => x < 2.3).length, under239: v.filter((x) => x < 2.39).length }]));
  R.hairlineLocal = st(hairLocal); R.internalLocal = st(intLocal); R.hairlineAll = (() => { const all = Object.values(hairLocal).flat(); return { n: all.length, min: r2(Math.min(...all)), p10: r2(q(all, 0.1)), median: r2(q(all, 0.5)), under23: all.filter((x) => x < 2.3).length, max: r2(Math.max(...all)) }; })();
  // 3. hamlets and huts muted toward their ground: contrast of the light pixels the pieces layer drew (walls and roofs) against the pixel beneath
  const seat: Record<string, number[]> = {}; const seatMax: Record<string, number[]> = {};
  for (const s of D.seats) { if (!(s.n >= 6)) continue; const cs: number[] = []; for (let k = 0; k < s.pairs.length; k += 6) { const on = s.pairs.slice(k, k + 3), off = s.pairs.slice(k + 3, k + 6); const Lon = lab(hex(on))[0], Loff = lab(hex(off))[0]; if (Lon > Loff) cs.push(wc(on, off)); } if (!cs.length) continue; (seat[s.kind] ??= []).push(q(cs, 0.95)); (seatMax[s.kind] ??= []).push(Math.max(...cs)); }
  R.seatsLightPixels = Object.fromEntries(Object.entries(seat).map(([k, v]) => [k, { seats: v.length, p95PerSeatWorst: r2(Math.max(...v)), p95PerSeatMedian: r2(q(v, 0.5)), maxPerSeatMedian: r2(q(seatMax[k]!, 0.5)), maxPerSeatWorst: r2(Math.max(...seatMax[k]!)) }]));
  // 4. snow: no passable pixel within 20 / 12 of snow; and OKLCH chroma of the land
  const snow: any = {}; const chroma: any = {};
  const okl = (h: string) => { const s2l = (c: number) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; const [r, g, b] = rgb(h).map(s2l) as [number, number, number]; const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b); const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s; return Math.hypot(A, B); };
  for (const [t, m] of Object.entries(D.landColours as Record<string, Record<string, number>>)) {
    let tot = 0, under = 0, wN = 99, wC = 99, c10 = 0, c12 = 0; for (const [k, n] of Object.entries(m)) { const v = Number(k), h = hex([(v >> 16) & 255, (v >> 8) & 255, v & 255]); tot += n; const C = okl(h); if (C > 0.10) c10 += n; if (C > 0.12) c12 += n; if (t.startsWith('wild')) continue; const x = dN(h, SNOW), y = dC(h, SNOW); if (x < 20 || y < 12) under += n; wN = Math.min(wN, x); wC = Math.min(wC, y); }
    const Ls: [number, number][] = Object.entries(m).map(([k, n]) => { const v = Number(k); return [lab(hex([(v >> 16) & 255, (v >> 8) & 255, v & 255]))[0], n]; }); Ls.sort((a, b) => a[0] - b[0]); const lq = (p: number) => { let acc = 0; for (const [l, n] of Ls) { acc += n; if (acc >= p * tot) return +l.toFixed(1); } return NaN; };
    if (!t.startsWith('wild')) snow[t] = { Lp50: lq(0.5), Lp99: lq(0.99), Lmax: lq(1), pixels: tot, nearSnow2012: under, share: +(under / tot).toFixed(5), minNormal: r2(wN), minCvd: r2(wC) };
    chroma[t] = { over010: +(c10 / tot).toFixed(4), over012: +(c12 / tot).toFixed(4) };
  }
  R.snow = snow; R.chroma = chroma;
  // 5. the south face: median of each row across the columns
  if (D.face && D.face.cols.length) { const cols = D.face.cols as number[][][]; const rowsN = cols[0]!.length; const med = (o: number) => [0, 1, 2].map((j) => q(cols.map((c) => c[o]![j]!), 0.5)); const at = (dy: number) => med(Math.max(0, Math.min(rowsN - 1, Math.round(10 + dy)))); const F = D.face.faceShownPx, Pl = D.face.plinthPx;
    R.face = { faceShownPx: r2(F), land: hex(at(-6)), lip: hex(at(-1)), top: hex(at(2)), mid: hex(at(F * 0.5)), foot: hex(at(F - Pl - 2)), plinth: hex(at(F - Pl / 2)), below: hex(at(F + 12)), topVsBelow: r2(wc(at(2), at(F + 12))), landVsTop: r2(wc(at(-6), at(2))), lipVsTop: r2(wc(at(-1), at(2))), plinthVsBelow: r2(wc(at(F - Pl / 2), at(F + 12))) }; }
  report[f.replace(PFX + '-', '').replace('.json', '')] = R;
}
fs.writeFileSync(DIR + PFX + '-report.json', JSON.stringify(report, null, 1));
for (const [k, R] of Object.entries(report) as any) {
  console.log(`== ${k} ${R.band} Dpx ${R.Dpx}`);
  for (const w of ['pureMask006D', 'inner012D']) { const m = R.means[w]; if (m) console.log(`  means ${w}: ${m.provinces} provinces, worst ${m.worstDE} (${m.worstAt}), median ${m.medianDE}, over 0.5: ${m.over05.length} ${m.over05.slice(0, 4).join('; ')}; pairs ${m.pairs} under 20/12 ${m.under2012}; worst ${m.worstNormal} | ${m.worstCvd}`); }
  console.log('  states', R.meansStates.join(', '));
  console.log('  hairlineLocal', JSON.stringify(R.hairlineLocal)); console.log('  hairlineAll', JSON.stringify(R.hairlineAll)); console.log('  internalLocal', JSON.stringify(R.internalLocal)); console.log('  internal keyline', JSON.stringify(R.internalKeyline)); console.log('  rails', JSON.stringify(R.rails));
  console.log('  seats', JSON.stringify(R.seatsLightPixels)); console.log('  snow', JSON.stringify(R.snow)); console.log('  chroma', JSON.stringify(R.chroma)); if (R.face) console.log('  face', JSON.stringify(R.face));
}
