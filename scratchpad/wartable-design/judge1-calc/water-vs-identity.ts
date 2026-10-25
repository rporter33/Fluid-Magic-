// Judge 1: do the passing impassable grounds collide with mana colors or banners?
import { labAs, deltaE2000, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath.ts';
import { readFileSync } from 'node:fs';
const src = readFileSync('/home/user/Fluid-Magic-/src/content/colors.ts', 'utf8');
const hexes = [...new Set(src.match(/#[0-9A-Fa-f]{6}/g) ?? [])];
const BANNERS: Record<string, string> = { R1: '#FD6533', R2: '#51DDFC', R3: '#3186F2', R4: '#C98BAD', G1: '#00674B', G2: '#5C488E', G3: '#B5D69C', G4: '#8F0F04', Indep: '#8C8A80' };
const ID: Record<string, string> = { ...BANNERS };
hexes.forEach((h, i) => (ID[`colors.ts#${i} ${h}`] = h));
for (const c of ['#343336', '#302F32', '#302858', '#302C40', '#24222A', '#5E5953', '#182A36']) {
  const parts = VISIONS.map((v) => { let best = 1e9, who = ''; for (const [n, h] of Object.entries(ID)) { const d = deltaE2000(labAs(c, v), labAs(h, v)); if (d < best) { best = d; who = n; } } return `${v[0]} ${best.toFixed(1)} (${who})`; });
  console.log(c, parts.join(' | '));
}
