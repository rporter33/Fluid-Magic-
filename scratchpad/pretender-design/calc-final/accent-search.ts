// Finds accent swatches that pass rule 3 (CIEDE2000 >= 15 from every nation banner normally, >= 10 under each
// simulated deficiency) and picks 8 that differ from each other by >= 10 normally, greedily by margin.
import { labAs, deltaE2000, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath';
import { NATION_BANNERS } from '/home/user/Fluid-Magic-/src/content/colors';
const banners = Object.values(NATION_BANNERS).flat();
const hex = (r: number, g: number, b: number) => '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0').toUpperCase()).join('');
const cands: { h: string; margin: number }[] = [];
for (let r = 0x20; r <= 0xE0; r += 0x10) for (let g = 0x20; g <= 0xE0; g += 0x10) for (let b = 0x20; b <= 0xE0; b += 0x10) {
  // muted only: chroma limited
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (mx - mn > 0x50) continue;
  const h = hex(r, g, b); let margin = Infinity;
  for (const bn of banners) for (const v of VISIONS) { const d = deltaE2000(labAs(h, v), labAs(bn, v)) - (v === 'normal' ? 15 : 10); margin = Math.min(margin, d); }
  if (margin >= 0) cands.push({ h, margin });
}
cands.sort((a, b) => b.margin - a.margin);
const pick: string[] = [];
for (const c of cands) { if (pick.every((p) => deltaE2000(labAs(p, 'normal'), labAs(c.h, 'normal')) >= 10)) pick.push(c.h); if (pick.length === 12) break; }
console.log(cands.length, 'candidates pass rule 3; picks:', pick.map((p) => `${p} (margin ${cands.find((c) => c.h === p)!.margin.toFixed(1)})`).join(', '));
