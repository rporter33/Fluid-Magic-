// Water, second objective: 20 / 12 from the swamp, the mere and granite (the colors a lake must never be read as), and
// as far as possible from the other albedos (a lake is also told by its shape and shore). OKLCH C <= 0.10.
import { readFileSync } from 'node:fs';
import * as L from './lib.ts';
const P: L.Pal = JSON.parse(readFileSync(process.argv[2]!, 'utf8'));
const must = [['swamp', P.swamp], ['mere', L.MERE], ['granite', L.GRANITE]] as const;
const rest = L.T.filter((t) => t !== 'swamp').map((t) => [t, P[t]] as const);
const out: { h: string; must: number; rest: number }[] = [];
for (let Lk = 0.42; Lk <= 0.7; Lk += 0.01) for (let C = 0.04; C <= 0.1001; C += 0.005) for (let hue = 160; hue <= 250; hue += 3) {
  const h = L.fromOklchSafe(Lk, C, hue); if (!h) continue;
  const m = Math.min(...must.map(([, c]) => Math.min(L.dN(h, c) / 20, L.dC(h, c) / 12)));
  const r = Math.min(...rest.map(([, c]) => Math.min(L.dN(h, c) / 20, L.dC(h, c) / 12)));
  if (m >= 1) out.push({ h, must: m, rest: r });
}
out.sort((a, b) => b.rest - a.rest || L.Ls(a.h) - L.Ls(b.h));
for (const o of out.slice(0, 5)) { console.log(`${o.h} L* ${L.f1(L.Ls(o.h))} OKLCH C ${L.oklch(o.h)[1].toFixed(3)} h ${L.oklch(o.h)[2].toFixed(0)}: must ${o.must.toFixed(2)}, rest ${o.rest.toFixed(2)}`);
  console.log('   ' + [...must, ...rest].map(([n, c]) => `${n} ${L.f1(L.dN(o.h, c))}/${L.f1(L.dC(o.h, c))}`).join(', ')); }
