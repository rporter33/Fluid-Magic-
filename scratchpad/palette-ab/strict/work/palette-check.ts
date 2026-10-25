// The repo's tests/content/palette.test.ts assertions for terrain fills, run on a proposed palette (same math, same banner set:
// every NATION_BANNERS entry of the colors the M1 nations use, from src/content/nations), plus the same checks on all 11 banners.
// Run: cd /home/user/Fluid-Magic- && npx tsx <dir>/palette-check.ts '<palette json>'
import { closestPair, deltaE2000, labAs, VISIONS } from './colorMath.ts';
import { contrastRatio, keylineFor, NATION_BANNERS } from './colors.ts';
import { NATIONS } from '/home/user/Fluid-Magic-/src/content/nations/index.ts';
const fills: Record<string, string> = JSON.parse(process.argv[2]!);
const MIN_NORMAL = 20, MIN_DEFICIENT = 12;
let ok = true; const out: string[] = [];
for (const v of VISIONS) { const min = v === 'normal' ? MIN_NORMAL : MIN_DEFICIENT; const { a, b, deltaE } = closestPair(fills, v); const pass = deltaE >= min; ok &&= pass; out.push(`terrain fills distinct with ${v} vision: ${a} vs ${b} ${deltaE.toFixed(2)} (>= ${min}) ${pass ? 'PASS' : 'FAIL'}`); }
for (const [id, f] of Object.entries(fills)) { const c = contrastRatio(keylineFor(f), f); const pass = c >= 3; ok &&= pass; if (!pass) out.push(`keyline on ${id}: ${c.toFixed(2)} FAIL`); }
out.push(`keylines: ${Object.entries(fills).map(([id, f]) => `${id} ${keylineFor(f)} ${contrastRatio(keylineFor(f), f).toFixed(2)}`).join(', ')}`);
const NATION_COLORS = [...new Set(Object.values(NATIONS).map((n) => n.colors[0]))];
for (const [label, banners] of [
  ['M1 nations (the test)', Object.fromEntries(NATION_COLORS.flatMap((c) => NATION_BANNERS[c].map((hex, k) => [`${c}${k}`, hex])))],
  ['all 11 banners', Object.fromEntries(Object.entries(NATION_BANNERS).flatMap(([c, l]) => l.map((hex, k) => [`${c}${k}`, hex])))],
] as const) for (const vision of VISIONS) {
  const min = vision === 'normal' ? MIN_NORMAL : MIN_DEFICIENT; const dE = (x: string, y: string) => deltaE2000(labAs(x, vision), labAs(y, vision));
  let fails = 0, viaKey = 0; for (const [name, banner] of Object.entries(banners)) for (const [id, fill] of Object.entries(fills)) { const k = keylineFor(fill); const direct = dE(banner, fill) >= min; const outlined = dE(k, fill) >= min && dE(k, banner) >= min; if (!direct && outlined) viaKey++; if (!(direct || outlined)) { fails++; out.push(`  band FAIL ${name} on ${id} (${vision})`); } }
  ok &&= fails === 0; out.push(`ownership bands, ${label}, ${vision}: ${fails} fail, ${viaKey} through the keyline`);
}
console.log(out.join('\n')); console.log(ok ? 'ALL PASS' : 'SOME FAIL');
