import { COLOR_DEFS, COLORS, INDEPENDENT_PALETTE } from '/home/user/Fluid-Magic-/src/content/colors';
import { TERRAIN, TERRAIN_IDS } from '/home/user/Fluid-Magic-/src/content/terrain';
import { deltaE2000, labAs, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath';

function relLum(hex: string) {
  const f = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const [r, g, b] = [1, 3, 5].map((i) => f(parseInt(hex.slice(i, i + 2), 16) / 255));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}
const cr = (a: string, b: string) => { const [x, y] = [relLum(a), relLum(b)].sort((p, q) => q - p); return (x! + 0.05) / (y! + 0.05); };

const colors: Record<string, string> = {};
for (const c of ['R', 'G'] as const) for (const k of ['primary', 'secondary', 'accent'] as const) colors[`${c}.${k}`] = COLOR_DEFS[c].palette[k];
colors['ind.primary'] = INDEPENDENT_PALETTE.primary;
colors['border'] = '#2B2620';
for (const [name, hex] of Object.entries(colors)) {
  const rows: string[] = [];
  for (const t of TERRAIN_IDS) {
    const d = VISIONS.map((v) => deltaE2000(labAs(hex, v), labAs(TERRAIN[t].fill, v)).toFixed(1));
    rows.push(`${t.padEnd(10)} ${d.join('/')}  CR ${cr(hex, TERRAIN[t].fill).toFixed(2)}`);
  }
  console.log(name, hex); console.log('  ' + rows.join('\n  '));
}
