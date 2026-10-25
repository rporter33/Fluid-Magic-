// Tokens (banner colors) on the wash: banner/fill pairs that pass 20/12 direct on the flat fill but fail at the mottle extremes.
import { ALL_BANNERS, BRIGHT, TERRAINS, type Pal, shadeL, dN, dCvd, f1 } from './lib';
const P = JSON.parse(process.argv[2] ?? 'null') as Pal | null ?? BRIGHT; const M = +(process.argv[3] ?? 6), pk = 0.55;
let flatPass = 0, lost = 0; const lostL: string[] = []; let flatFail = 0;
for (const t of TERRAINS) for (const b of ALL_BANNERS) { const f = P[t]; const ok = (g: string) => dN(b, g) >= 20 && dCvd(b, g) >= 12;
  if (!ok(f)) { flatFail++; continue; } flatPass++; for (const g of [shadeL(f, M * pk), shadeL(f, -M * pk)]) if (!ok(g)) { lost++; lostL.push(`${b} on ${t} ${g}: ${f1(dN(b, g))}/${f1(dCvd(b, g))}`); break; } }
console.log(`M ${M}: ${flatPass} banner/fill pairs pass direct on the flat fill (${flatFail} do not: tokens carry those by plate and outline, as approved); ${lost} of them fail at the wash extremes`); lostL.forEach((x) => console.log('  ' + x));
