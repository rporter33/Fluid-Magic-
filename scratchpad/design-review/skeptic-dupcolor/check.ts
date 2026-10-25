import { COLOR_DEFS, COLORS, INDEPENDENT_PALETTE } from '/home/user/Fluid-Magic-/src/content/colors';
import { TERRAIN, TERRAIN_IDS } from '/home/user/Fluid-Magic-/src/content/terrain';
import { deltaE2000, labAs, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath';
const others: Record<string,string> = { ...Object.fromEntries(COLORS.map(c=>[c, COLOR_DEFS[c].palette.primary])), I: INDEPENDENT_PALETTE.primary };
const terr: Record<string,string> = Object.fromEntries(TERRAIN_IDS.map(id=>[id, TERRAIN[id].fill]));
const minOf=(a:string,b:string)=>VISIONS.map(v=>`${v[0]}${deltaE2000(labAs(a,v),labAs(b,v)).toFixed(1)}`).join(' ');
for (const [c,k] of [['R','secondary'],['R','accent'],['G','secondary'],['G','accent']] as const) {
  const hex = COLOR_DEFS[c].palette[k];
  console.log(`\n${c}.${k} ${hex}`);
  for (const [n,h] of Object.entries(others)) console.log('  vs primary', n, minOf(hex,h));
  for (const [n,h] of Object.entries(terr)) console.log('  vs terrain', n, minOf(hex,h));
}
console.log('\nR primary vs terrain'); for (const [n,h] of Object.entries(terr)) console.log('  ', n, minOf(COLOR_DEFS.R.palette.primary,h));
console.log('\nG primary vs terrain'); for (const [n,h] of Object.entries(terr)) console.log('  ', n, minOf(COLOR_DEFS.G.palette.primary,h));
