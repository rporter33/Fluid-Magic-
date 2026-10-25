import { labAs, deltaE2000, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath.ts';
const TERRAIN: Record<string, string> = { Plains: '#C1D29F', Farmland: '#EEBA3A', Forest: '#374C2B', Hills: '#856824', Mountains: '#8DA4AD', Swamp: '#1A727A', Wasteland: '#AE897F' };
const MANA: Record<string, string> = { 'B prim': '#3D2B4F', 'B sec': '#1A1024', 'U sec': '#1E3F7A' };
const BANNERS: Record<string, string> = { R1: '#FD6533', R2: '#51DDFC', R3: '#3186F2', R4: '#C98BAD', G1: '#00674B', G2: '#5C488E', G3: '#B5D69C', G4: '#8F0F04', Indep: '#8C8A80' };
const rep = (c: string, set: Record<string, string>) => VISIONS.map((v) => { let best = 1e9, who = ''; for (const [n, h] of Object.entries(set)) { const d = deltaE2000(labAs(c, v), labAs(h, v)); if (d < best) { best = d; who = n; } } return `${v[0]} ${best.toFixed(1)} ${who}`; }).join(' | ');
for (const c of ['#26232A', '#24222A', '#232127', '#22201F', '#1F1D22', '#2A2730', '#201E1C']) {
  console.log(c, 'L*', labAs(c, 'normal')[0].toFixed(1));
  console.log('   terrain:', rep(c, TERRAIN));
  console.log('   dark mana:', rep(c, MANA));
  console.log('   banners:', rep(c, BANNERS));
}
