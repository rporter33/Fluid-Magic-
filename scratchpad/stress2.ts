import { generateMap } from '../../../../../home/user/Fluid-Magic-/src/mapgen/generate';
import { bfsDistances } from '../../../../../home/user/Fluid-Magic-/src/mapgen/graph';
import { wellspringsToWin } from '../../../../../home/user/Fluid-Magic-/src/mapgen/placement';
import { COLORS } from '../../../../../home/user/Fluid-Magic-/src/content/colors';
import { TERRAIN_SPRING_COLORS } from '../../../../../home/user/Fluid-Magic-/src/content/mapgen';
const R = { color: 'R', terrain: 'plains', name: 'Kharnath' } as const, G = { color: 'G', terrain: 'forest', name: 'Deepmoss' } as const;
const N = Number(process.argv[2] ?? 100);
const hist = (xs: number[]) => { const h: Record<string, number> = {}; xs.forEach(x => h[x] = (h[x] ?? 0) + 1); return JSON.stringify(h); };
for (const [size, caps] of [['small', [R, G]], ['medium', [R, G]], ['large', [R, G]], ['medium', [R, G, R]], ['medium', [R, G, R, G]], ['small', [R, G, R, G]]] as const) {
  let fails = 0, ms = 0, maxMs = 0; const bal: number[] = [], unfair: number[] = [], sep: number[] = [], parity: number[] = [], onTheme: number[] = [], same: number[] = [];
  const slotShare: number[][] = caps.map(() => []);
  for (let seed = 1; seed <= N; seed++) {
    const t0 = performance.now(); let m;
    try { m = generateMap({ seed, size, capitals: caps as any }); } catch (e) { fails++; console.log(' fail', seed, String(e).slice(0, 150)); continue; }
    const dt = performance.now() - t0; ms += dt; maxMs = Math.max(maxMs, dt);
    const ps = Object.values(m.provinces); const idx = new Map(ps.map((p, i) => [p.id, i]));
    const adj = ps.map(p => p.neighbors.map(n => idx.get(n)!));
    const ci = m.capitals.map(c => idx.get(c)!);
    const per = ci.map(c => bfsDistances(adj, [c]));
    const rings = ci.map((c, k) => ps.reduce((s, p, i) => i !== c && per[k]![i]! <= 2 ? s + p.startPop : s, 0));
    bal.push(Math.round(Math.max(...rings) / Math.min(...rings) * 10) / 10);
    const w = m.wellsprings.map(x => idx.get(x)!);
    const need = wellspringsToWin(w.length);
    const reach = per.map(d => w.map(x => d[x]!).sort((a, b) => a - b).slice(0, need).reduce((s, x) => s + x, 0));
    unfair.push(Math.max(...reach) - Math.min(...reach));
    let mn = 99; for (const a of w) { const d = bfsDistances(adj, [a]); for (const b of w) if (a !== b) mn = Math.min(mn, d[b]!); } sep.push(mn);
    const springs = ps.filter(p => p.capitalSlot === undefined).flatMap(p => p.springs);
    const cnt = COLORS.map(c => springs.filter(x => x === c).length); parity.push(Math.max(...cnt) - Math.min(...cnt));
    const suited = ps.filter(p => p.capitalSlot === undefined).flatMap(p => p.springs.map(c => TERRAIN_SPRING_COLORS[p.terrain].includes(c) ? 1 : 0));
    onTheme.push(suited.reduce((s, x) => s + x, 0) / Math.max(1, suited.length));
    let sameN = 0, tot = 0; ps.forEach(p => p.neighbors.forEach(n => { tot++; if (m!.provinces[n]!.terrain === p.terrain) sameN++; })); same.push(sameN / tot);
    // slot territory share
    const owner = ps.map((_, i) => { const ds = per.map(d => d[i]!); const mnd = Math.min(...ds); const ks = ds.flatMap((d, k) => d === mnd ? [k] : []); return ks.length === 1 ? ks[0] : -1; });
    caps.forEach((_, k) => slotShare[k]!.push(owner.filter(o => o === k).length / ps.length));
  }
  const avg = (xs: number[]) => (xs.reduce((s, x) => s + x, 0) / xs.length).toFixed(3);
  console.log(`${size} x${caps.length}: fails=${fails} avgMs=${(ms / (N - fails)).toFixed(1)} maxMs=${maxMs.toFixed(0)}`);
  console.log(`  ring balance hist ${hist(bal)}`);
  console.log(`  wellspring unfairness ${hist(unfair)} sep ${hist(sep)}`);
  console.log(`  spring parity(max-min) ${hist(parity)} onTheme avg ${avg(onTheme)} sameTerrainNeighbor avg ${avg(same)}`);
  console.log(`  slot territory share ${slotShare.map(avg).join(' ')}`);
}
