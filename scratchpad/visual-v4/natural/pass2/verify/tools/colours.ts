// The colour rules on the verifier's rendered samples, with the repo's own colour math (copies of tests/content/colorMath.ts and src/content/colors.ts).
// Run from /home/user/Fluid-Magic-: npx tsx <this file> <samples.json> [...]
import { readFileSync, writeFileSync } from 'node:fs';
import { labAs, deltaE2000, type Lab } from './colorMath';
import { contrastRatio, NATION_BANNERS } from './colors';

type DE = { normal: number; protan: number; deutan: number; tritan: number; cvd: number };
const labCache = new Map<string, Lab>();
const L = (hex: string, v: 'normal' | 'protan' | 'deutan' | 'tritan'): Lab => { const k = hex + v; let r = labCache.get(k); if (!r) { r = labAs(hex, v); labCache.set(k, r); } return r; };
const dE = (a: string, b: string): DE => { const o = { normal: deltaE2000(L(a, 'normal'), L(b, 'normal')), protan: deltaE2000(L(a, 'protan'), L(b, 'protan')), deutan: deltaE2000(L(a, 'deutan'), L(b, 'deutan')), tritan: deltaE2000(L(a, 'tritan'), L(b, 'tritan')), cvd: 0 }; o.cvd = Math.min(o.protan, o.deutan, o.tritan); return o; };
const ok = (d: DE) => d.normal >= 20 && d.cvd >= 12;
const r2 = (x: number) => Math.round(x * 100) / 100;
const pct = (a: number[], f: number) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(f * s.length))] ?? NaN; };
const BAN: Record<string, string> = { red: '#FD6533', green: '#00674B' };
const SNOW = '#F2EEE6';
const out: Record<string, unknown>[] = [];
// the static palette rules first: the eight banners (docs/09: 28 normal, 16.7 under the deficiencies), and the Clear albedos of the mockup
{
  const B = [...NATION_BANNERS.R, ...NATION_BANNERS.G]; let wn = 99, wc = 99;
  for (let a = 0; a < B.length; a++) for (let b = a + 1; b < B.length; b++) { const d = dE(B[a]!, B[b]!); wn = Math.min(wn, d.normal); wc = Math.min(wc, d.cvd); }
  const ALB: Record<string, string> = { plains: '#78894A', farmland: '#D5B16B', forest: '#1A3819', hills: '#6D5303', mountains: '#859BB8', swamp: '#38616D', wasteland: '#877773' };
  const K = Object.keys(ALB); let an = 99, ac = 99, aw = '';
  for (let a = 0; a < K.length; a++) for (let b = a + 1; b < K.length; b++) { const d = dE(ALB[K[a]!]!, ALB[K[b]!]!); if (d.normal < an) { an = d.normal; aw = K[a] + '/' + K[b]; } ac = Math.min(ac, d.cvd); }
  const wild = ['#2A292C', '#24222A'].map((w) => K.map((k) => dE(w, ALB[k]!))).flat();
  console.log(JSON.stringify({ banners8: { minNormal: r2(wn), minCvd: r2(wc), need: [28, 16.7] }, clearAlbedos: { minNormal: r2(an), at: aw, minCvd: r2(ac) }, wildGroundsVsAlbedos: { minNormal: r2(Math.min(...wild.map((d) => d.normal))), minCvd: r2(Math.min(...wild.map((d) => d.cvd))) } }));
}
for (const f of process.argv.slice(2)) {
  const S = JSON.parse(readFileSync(f, 'utf8')); const I = S.info; const R: Record<string, unknown> = { tag: S.tag, look: I.look, mode: I.mode, band: I.band, Dpx: Math.round(I.Dpx), dpr: I.dpr };
  // 1. terrain pairs between rendered province core means (different terrains), each mean measured two ways
  for (const key of ['labMean', 'linMean', 'labMean15'] as const) {
    let under = 0, pairs = 0, wn = { v: 99, at: '' }, wc = { v: 99, at: '' };
    const C = S.cores as { name: string; terrain: string; fog: string; labMean: string; linMean: string; labMean15: string }[];
    for (let a = 0; a < C.length; a++) for (let b = a + 1; b < C.length; b++) { if (C[a]!.terrain === C[b]!.terrain) continue; pairs++; const d = dE(C[a]![key], C[b]![key]); if (!ok(d)) under++; if (d.normal < wn.v) wn = { v: r2(d.normal), at: `${C[a]!.name}/${C[b]!.name} ${C[a]!.terrain}/${C[b]!.terrain}` }; if (d.cvd < wc.v) wc = { v: r2(d.cvd), at: `${C[a]!.name}/${C[b]!.name} ${C[a]!.terrain}/${C[b]!.terrain}` }; }
    R['pairs_' + key] = { provinces: C.length, pairs, under2012: under, worstNormal: wn, worstCvd: wc };
  }
  // 2. the band rule on the rails: B = the profile sample nearest the owner's banner (0 to 6 px in); G = the ground 9 px in (rails and glow on) or the land under B (no rails)
  { let n = 0, failG = 0, failLand = 0; const ex: string[] = []; const worstC: number[] = [];
    for (const s of S.rails as { owner: string; terrain: string; prof: string[]; land: string[]; i: number; j: number }[]) {
      const ban = BAN[s.owner]; if (!ban) continue; n++;
      let bi = 0, bd = 1e9; for (let k = 0; k <= 12; k++) { const d = deltaE2000(L(s.prof[k]!, 'normal'), L(ban, 'normal')); if (d < bd) { bd = d; bi = k; } }
      const B = s.prof[bi]!, G = s.prof[18]!, GL = s.land[bi]!;
      const pass = (g: string) => ok(dE(B, g)) || s.prof.slice(0, 15).some((K, k) => k !== bi && ok(dE(K, B)) && ok(dE(K, g)));
      if (!pass(G)) { failG++; if (ex.length < 6) ex.push(`${s.owner} on ${s.terrain} B${B} G${G}`); }
      if (!pass(GL)) failLand++;
      worstC.push(Math.max(...s.prof.slice(0, 15).map((K) => contrastRatio(K, G))));
    }
    R.rails = { samples: n, failVsGround9px: failG, failVsLandUnderBanner: failLand, worstWcagPeakVsGround: r2(Math.min(...worstC)), examples: ex };
  }
  // 3. hairlines (neutral) >= 2.3:1 and internal keylines >= 3.2:1: the best contrast of a line pixel against the same pixel without lines (the design's rule);
  //    and, for information, against the grounds 7 px either side with the lines on
  { const res: Record<string, number[]> = { neutral: [], internal: [], neutralFog: [], internalFog: [] }, side: number[] = [], byT: Record<string, number[]> = {}; const worst: Record<string, string> = {};
    if (I.band === 'far') for (const h of S.hair) if (h.type === 'internal') h.type = 'neutral'; // at Far one owner's inner borders are hairlines (p59b: internal needs band !== 'far')
    for (const h of S.hair as { type: string; fog: string[]; lines: string[]; land: string[]; lrT: string; ulT: string }[]) {
      const c0 = 14; // index of o = 0 (o from -7 to 7 by 0.5)
      const rng = h.type === 'neutral' ? [-6, 6] : [0, 12];
      let best = 0, bs = 0; for (let k = rng[0]!; k <= rng[1]!; k++) { const a = h.lines[c0 + k]!, b = h.land[c0 + k]!; best = Math.max(best, contrastRatio(a, b)); bs = Math.max(bs, Math.min(contrastRatio(a, h.lines[0]!), contrastRatio(a, h.lines[28]!))); }
      const fogged = !!(h.fog[0] && h.fog[1]); const key = h.type + (fogged ? 'Fog' : ''); res[key]!.push(best);
      if (!fogged && h.type === 'neutral') { side.push(bs); (byT[h.lrT] ??= []).push(best); }
      if (!fogged && (!worst[h.type] || best < Number(worst[h.type]!.split(' ')[0]))) worst[h.type] = `${r2(best)} ${h.ulT}|${h.lrT}`;
    }
    const sum = (a: number[], lim: number) => ({ n: a.length, min: r2(Math.min(...a)), p10: r2(pct(a, 0.1)), median: r2(pct(a, 0.5)), under: a.filter((x) => x < lim).length });
    R.hairline = sum(res.neutral!, 2.3); R.internalKeyline = sum(res.internal!, 3.2); R.foggedEdges = { neutral: sum(res.neutralFog!, 2.3), internal: sum(res.internalFog!, 3.2) }; R.lineWorst = worst;
    R.hairlineVsBothSides = sum(side, 2.3); R.hairlineByLowerRightTerrain = Object.fromEntries(Object.entries(byT).map(([t, a]) => [t, sum(a, 2.3)]));
    // per edge (dense sampling every 2 px along each edge): edges with any point under the floor, and how much of them
    const E = new Map<string, { type: string; n: number; under: number; min: number; ul: string; lr: string; fog: string }>();
    for (const h of S.hair as { type: string; fog: string[]; lines: string[]; land: string[]; lrT: string; ulT: string; i: number; j: number }[]) {
      if (h.fog[0] && h.fog[1]) continue; const rng = h.type === 'neutral' ? [-6, 6] : [0, 12], lim = h.type === 'neutral' ? 2.3 : 3.2;
      let best = 0; for (let k = rng[0]!; k <= rng[1]!; k++) best = Math.max(best, contrastRatio(h.lines[14 + k]!, h.land[14 + k]!));
      const key = h.i + '-' + h.j; const e = E.get(key) ?? { type: h.type, n: 0, under: 0, min: 99, ul: h.ulT, lr: h.lrT, fog: h.fog.join('|') }; e.n++; if (best < lim) e.under++; e.min = Math.min(e.min, best); E.set(key, e);
    }
    const ed = [...E.entries()]; const names = new Map<number, string>(); for (const c of S.cores as { i: number; name: string }[]) names.set(c.i, c.name);
    R.edgesUnder = { neutral: { edges: ed.filter(([, e]) => e.type === 'neutral').length, withUnder: ed.filter(([, e]) => e.type === 'neutral' && e.under).length, points: ed.filter(([, e]) => e.type === 'neutral').reduce((a, [, e]) => a + e.n, 0), pointsUnder: ed.filter(([, e]) => e.type === 'neutral').reduce((a, [, e]) => a + e.under, 0) },
      internal: { edges: ed.filter(([, e]) => e.type === 'internal').length, withUnder: ed.filter(([, e]) => e.type === 'internal' && e.under).length, points: ed.filter(([, e]) => e.type === 'internal').reduce((a, [, e]) => a + e.n, 0), pointsUnder: ed.filter(([, e]) => e.type === 'internal').reduce((a, [, e]) => a + e.under, 0) },
      list: ed.filter(([, e]) => e.under).sort((a, b) => a[1].min - b[1].min).slice(0, 8).map(([k, e]) => { const [i, j] = k.split('-').map(Number); return `${e.type} ${names.get(i!) ?? i}/${names.get(j!) ?? j} ${e.ul}|${e.lr} fog:${e.fog} min ${r2(e.min)} under ${e.under}/${e.n}`; }) };
  }
  // 4. wild rims (docs/09: the wild ground against the fill directly, or through the light rim against both)
  { let n = 0, fail = 0; const ex: string[] = [];
    const med = (a: string[]) => { const s = [...a].sort((x, y) => L(x, 'normal')[0] - L(y, 'normal')[0]); return s[s.length >> 1]!; };
    for (const w of S.wildRims as { prof: string[]; terrain: string; fog: string }[]) {
      const p = w.prof; const Wg = med(p.slice(2, 9)), G = med(p.slice(32, 39)); n++;
      const pass = ok(dE(Wg, G)) || p.slice(12, 29).some((K) => ok(dE(K, Wg)) && ok(dE(K, G)));
      if (!pass) { fail++; if (ex.length < 6) ex.push(`${w.terrain}${w.fog ? ' ' + w.fog : ''} W${Wg} G${G}`); }
    }
    R.wildRims = { samples: n, fails: fail, examples: ex };
  }
  // 5. snow: passable land pixels within 20 (normal) or 12 (any deficiency) of the snow #F2EEE6
  { const byT: Record<string, { px: number; near: number; minN: number; minC: number }> = {};
    for (const [t, s] of Object.entries(S.snow as Record<string, { hex: string[]; n: number[] }>)) { const b = (byT[t] = { px: 0, near: 0, minN: 99, minC: 99 }); s.hex.forEach((h, k) => { const d = dE(h, SNOW); b.px += s.n[k]!; if (!ok(d)) b.near += s.n[k]!; b.minN = Math.min(b.minN, d.normal); b.minC = Math.min(b.minC, d.cvd); }); b.minN = r2(b.minN); b.minC = r2(b.minC); }
    R.snow = byT; R.snowPass = Object.values(byT).every((b) => b.near === 0);
  }
  // 6. hamlets and huts: lighter pixels the pieces add, against the pixel beneath; p95 per seat <= 2.5 (Mid) or 4 (Near)
  { const lim = I.band === 'near' ? 4 : 2.5; const kinds: Record<string, { seats: number; worst: number; over: string[] }> = {};
    for (const s of S.seats as { name: string; kind: string; on: string[]; off: string[] }[]) { if (s.on.length < 6) continue; const c = s.on.map((h, k) => contrastRatio(h, s.off[k]!)); const p = pct(c, 0.95); const b = (kinds[s.kind] ??= { seats: 0, worst: 0, over: [] }); b.seats++; b.worst = Math.max(b.worst, r2(p)); if (p > lim && s.kind !== 'town') b.over.push(`${s.name} ${r2(p)}`); }
    R.seats = { limit: lim, ...kinds };
  }
  out.push(R); console.log(JSON.stringify(R));
}
writeFileSync(process.env.OUTFILE || '/dev/null', JSON.stringify(out, null, 1));
