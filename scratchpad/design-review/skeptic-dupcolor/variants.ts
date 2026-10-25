import { COLOR_DEFS, COLORS, INDEPENDENT_PALETTE } from '/home/user/Fluid-Magic-/src/content/colors';
import { deltaE2000, labAs, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath';
const hex=(r:number,g:number,b:number)=>'#'+[r,g,b].map(v=>Math.round(Math.max(0,Math.min(255,v))).toString(16).padStart(2,'0')).join('').toUpperCase();
function hsl(h:number,s:number,l:number){const a=s*Math.min(l,1-l);const f=(n:number)=>{const k=(n+h/30)%12;return l-a*Math.max(-1,Math.min(k-3,9-k,1));};return hex(f(0)*255,f(8)*255,f(4)*255);}
const ok=(a:string,b:string)=>VISIONS.every(v=>deltaE2000(labAs(a,v),labAs(b,v))>=(v==='normal'?20:12));
const prim=[...COLORS.map(c=>COLOR_DEFS[c].palette.primary), INDEPENDENT_PALETTE.primary];
console.log('#F0E6D1 vs W ok?', ok('#F0E6D1', COLOR_DEFS.W.palette.primary));
// hue windows that still read as the color: R 0-30, G 90-165; saturation >= 0.5, lightness 0.2-0.75
const cands=(h0:number,h1:number)=>{const o:string[]=[];for(let h=h0;h<=h1;h+=3)for(const s of [0.5,0.65,0.8,1])for(let l=0.2;l<=0.75;l+=0.02)o.push(hsl(h,s,l));return o;};
for (const [c,h0,h1] of [['R',0,30],['G',90,165]] as const) {
  const set=[COLOR_DEFS[c].palette.primary];
  const others=prim.filter(p=>p!==set[0]);
  for(let k=0;k<3;k++){
    const pool=cands(h0,h1).filter(x=>others.every(o=>ok(x,o))&&set.every(s=>ok(x,s)));
    if(!pool.length){console.log(c,'no variant',k+2);break;}
    // pick the one maximizing min distance to set
    let best=pool[0]!,bs=-1;for(const x of pool){const m=Math.min(...[...set,...others].map(s=>Math.min(...VISIONS.map(v=>deltaE2000(labAs(x,v),labAs(s,v))))));if(m>bs){bs=m;best=x;}}
    set.push(best);console.log(c,'variant',k+2,best,'pool',pool.length,'minDE',bs.toFixed(1));
  }
}
