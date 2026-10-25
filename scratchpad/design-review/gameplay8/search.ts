import { COLOR_DEFS, COLORS, INDEPENDENT_PALETTE } from '/home/user/Fluid-Magic-/src/content/colors';
import { TERRAIN, TERRAIN_IDS } from '/home/user/Fluid-Magic-/src/content/terrain';
import { deltaE2000, labAs, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath';
const fills = TERRAIN_IDS.map(t => TERRAIN[t].fill);
function minMargin(hex: string, others: string[]): number {
  let m = Infinity;
  for (const o of others) VISIONS.forEach((v, i) => {
    const d = deltaE2000(labAs(hex, v), labAs(o, v)) - (i === 0 ? 20 : 12);
    if (d < m) m = d;
  });
  return m;
}
const hx = (n: number) => n.toString(16).padStart(2, '0').toUpperCase();
for (const target of ['G', 'R'] as const) {
  const others = [...fills, INDEPENDENT_PALETTE.primary, ...COLORS.filter(c => c !== target).map(c => COLOR_DEFS[c].palette.primary)];
  const res: [number, string][] = [];
  for (let r = 0; r < 256; r += 8) for (let g = 0; g < 256; g += 8) for (let b = 0; b < 256; b += 8) {
    const h = '#' + hx(r) + hx(g) + hx(b);
    // keep hue roughly in family
    const [L, a, bb] = labAs(h, 'normal');
    const hue = (Math.atan2(bb, a) * 180 / Math.PI + 360) % 360;
    const C = Math.hypot(a, bb);
    if (C < 25) continue;
    if (target === 'G' && !(hue > 120 && hue < 175)) continue;
    if (target === 'R' && !(hue > 20 && hue < 60)) continue;
    res.push([minMargin(h, others), h]);
  }
  res.sort((x, y) => y[0] - x[0]);
  console.log(target, res.slice(0, 8).map(([m, h]) => `${h} ${m.toFixed(1)}`).join(', '));
}
