// Data modes against a palette: the approved ramp and alternative 4th stops, R16's own checks (L* 41 to 91 rising, adjacent
// stops at least 13 apart for normal vision, every M1 mode color 20/12 direct against both wild grounds) and how close the
// fills come to any data-mode color. Run from the repo root: npx tsx heat.ts <palette name> [stop4 ...]
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as E from './ev.ts';
const here = dirname(fileURLToPath(import.meta.url));
const PALS: Record<string, E.Pal> = JSON.parse(readFileSync(join(here, 'palettes.json'), 'utf8'));
const [name = 'approved', ...stops] = process.argv.slice(2);
const P = PALS[name]!;
for (const s4 of ['#E6AC6E', ...stops]) {
  const H = ['#4C5E96', '#8170AC', '#C4808E', s4, '#F8E6A6'];
  const Ls = H.map(E.Ls), adj = H.slice(1).map((h, k) => E.dN(H[k]!, h));
  const mv = E.modesVsFills(P, E.APPROVED_BASE, H), gm = E.groundsVsModes(E.APPROVED_BASE, H);
  const ok3 = E.oklch(s4);
  console.log(`${name} ramp stop 4 ${s4} (OKLCH L ${ok3[0].toFixed(3)} C ${ok3[1].toFixed(3)} h ${ok3[2].toFixed(0)}): L* ${Ls.map(E.f1).join(' ')}; adjacent ΔE ${adj.map(E.f1).join(' ')}; ` +
    `fills vs bases+ramp ${E.f1(mv.wN.v)} (${mv.wN.s}) / ${E.f1(mv.wC.v)} (${mv.wC.s}); grounds direct ${gm.granite!.direct}/${gm.granite!.tot} granite, ${gm.mere!.direct}/${gm.mere!.tot} mere`);
}
