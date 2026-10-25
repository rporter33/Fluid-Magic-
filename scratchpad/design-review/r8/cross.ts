import { COLOR_DEFS, INDEPENDENT_PALETTE } from '/home/user/Fluid-Magic-/src/content/colors';
import { TERRAIN, TERRAIN_IDS } from '/home/user/Fluid-Magic-/src/content/terrain';
import { deltaE2000, labAs, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath';
const cands: Record<string,string> = {
  Rp: COLOR_DEFS.R.palette.primary, Rs: COLOR_DEFS.R.palette.secondary, Ra: COLOR_DEFS.R.palette.accent,
  Gp: COLOR_DEFS.G.palette.primary, Gs: COLOR_DEFS.G.palette.secondary, Ga: COLOR_DEFS.G.palette.accent,
  Ip: INDEPENDENT_PALETTE.primary, border: '#2B2620',
};
function lum(hex: string) { const t=(c:number)=>c<=0.04045?c/12.92:((c+0.055)/1.055)**2.4; const [r,g,b]=[1,3,5].map(i=>t(parseInt(hex.slice(i,i+2),16)/255)); return 0.2126*r!+0.7152*g!+0.0722*b!; }
function cr(a:string,b:string){const [x,y]=[lum(a),lum(b)].sort((p,q)=>q-p); return (x!+0.05)/(y!+0.05);}
for (const [k,c] of Object.entries(cands)) {
  for (const t of TERRAIN_IDS) {
    const f = TERRAIN[t].fill;
    const d = VISIONS.map(v => deltaE2000(labAs(c,v), labAs(f,v)).toFixed(1));
    console.log(k.padEnd(7), t.padEnd(10), d.join('/'), 'CR', cr(c,f).toFixed(2));
  }
}
