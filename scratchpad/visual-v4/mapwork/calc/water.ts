// Water inside provinces (lakes, ponds, streams) and the bases' lip: a grid search over OKLCH for the water color that
// stays farthest from every albedo, both wild grounds and snow, under every vision, with OKLCH C <= 0.10.
// Run from the repo root: npx tsx water.ts <palette.json>
import { readFileSync } from 'node:fs';
import * as L from './lib.ts';
const P: L.Pal = JSON.parse(readFileSync(process.argv[2]!, 'utf8'));
const others = [...L.T.map((t) => [t, P[t]] as const), ['mere', L.MERE] as const, ['granite', L.GRANITE] as const];
let best: { h: string; score: number; worst: string } = { h: '', score: -1, worst: '' };
const rows: string[] = [];
const LMIN = Number(process.env.WLMIN ?? 0.3), LMAX = Number(process.env.WLMAX ?? 0.75);
for (let Lk = LMIN; Lk <= LMAX; Lk += 0.01) for (let C = 0.03; C <= 0.1001; C += 0.005) for (let hue = 150; hue <= 260; hue += 4) {
  const h = L.fromOklchSafe(Lk, C, hue); if (!h) continue;
  let score = 1e9, worst = '';
  for (const [n, c] of others) { const s = Math.min(L.dN(h, c) / 20, L.dC(h, c) / 12); if (s < score) { score = s; worst = n; } }
  if (score > best.score) best = { h, score, worst };
  if (Math.abs(hue - 190) < 3 && Math.abs(C - 0.075) < 0.003) rows.push(`${h} L${Lk.toFixed(2)}: ${score.toFixed(2)} (${worst})`);
}
console.log(`best water ${best.h} L* ${L.f1(L.Ls(best.h))} OKLCH ${L.oklch(best.h).map((x) => x.toFixed(3)).join(' ')}: min(normal/20, deficient/12) = ${best.score.toFixed(2)} (closest: ${best.worst})`);
for (const [n, c] of others) console.log(`  vs ${n}: ${L.f1(L.dN(best.h, c))} / ${L.f1(L.dC(best.h, c))}`);
// the lip of a miniature base: the lightest worn-edge tone that keeps 3:1 on every ground's relief extremes, with the dark base
for (const lip of ['#6E6A64', '#8A857E', '#A29C90', '#B8B1A4']) {
  let w = 1e9, s = ''; for (const t of L.T) for (const g of L.reliefVars(t, P[t], 1)) { const c = Math.max(L.wcag('#1E1B18', g), L.wcag(lip, g)); if (c < w) { w = c; s = t; } }
  console.log(`lip ${lip}: worst max(base, lip) WCAG ${L.f2(w)} (${s})`);
}
