// The relief texture floor as map-design §4.3 states it: every pair of different terrains, each at its albedo and at
// +- 0.4 x its relief amplitude (the interquartile range of the shading), in the explored states (raw, out of sight,
// ash 10%, moss 6%), and unexplored land at +- 0.2 x (half relief, §9) under the 4% haze. Also k = 0.25 and 0.5.
import { readFileSync } from 'node:fs';
import * as L from './lib.ts';
for (const path of process.argv.slice(2)) {
  const P: L.Pal = JSON.parse(readFileSync(path, 'utf8'));
  const row: string[] = [];
  for (const k of [0.25, 0.4, 0.5]) {
    const r = L.pairs(P, (t, f) => [...(['raw', 'outOfSight', 'ash10', 'moss6'] as const).flatMap((s) => L.reliefVars(t, f, k).map((x) => L.baseState(x, s, f))), ...L.reliefVars(t, f, k / 2).map((x) => L.baseState(x, 'haze', f))]);
    row.push(`k ${k}: ${L.f1(r.wN.v)} / ${L.f1(r.wC.v)} (${r.under} of ${r.tot} under 20 / 12)`);
  }
  console.log(path.split('/').pop(), '|', row.join(' | '));
}
