import { COLOR_DEFS, COLORS } from '/home/user/Fluid-Magic-/src/content/colors';
import { TERRAIN, TERRAIN_IDS } from '/home/user/Fluid-Magic-/src/content/terrain';
import { deltaE2000, labAs, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath';
const score=(c:string,f:string)=>Math.min(...VISIONS.map(v=>deltaE2000(labAs(c,v),labAs(f,v))*(v==='normal'?12/20:1)));
for (const k of COLORS) {
  const row:string[]=[];
  for (const t of TERRAIN_IDS){
    const f=TERRAIN[t].fill; const p=COLOR_DEFS[k].palette;
    const cands=Object.entries(p).map(([n,c])=>[n,score(c,f)] as const).sort((a,b)=>b[1]-a[1]);
    row.push(`${t}:P${score(p.primary,f).toFixed(1)} best ${cands[0]![0][0]}${cands[0]![1].toFixed(1)}`);
  }
  console.log(k, row.join(' | '));
}
