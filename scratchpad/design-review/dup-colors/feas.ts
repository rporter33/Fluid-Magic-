import { labAs, deltaE2000, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath';
const hex = (r:number,g:number,b:number)=>'#'+[r,g,b].map(v=>Math.round(Math.max(0,Math.min(255,v))).toString(16).padStart(2,'0')).join('').toUpperCase();
function hsl(h:number,s:number,l:number){const a=s*Math.min(l,1-l);const f=(n:number)=>{const k=(n+h/30)%12;return l-a*Math.max(-1,Math.min(k-3,9-k,1));};return hex(f(0)*255,f(8)*255,f(4)*255);}
const ok=(a:string,b:string)=>VISIONS.every(v=>deltaE2000(labAs(a,v),labAs(b,v))>=(v==='normal'?20:12));
const minD=(a:string,b:string)=>Math.min(...VISIONS.map(v=>deltaE2000(labAs(a,v),labAs(b,v))-(v==='normal'?8:0)));
const grey='#8C8A80';
const cands=(h0:number,h1:number)=>{const out:string[]=[];for(let h=h0;h<=h1;h+=5)for(const s of [0.5,0.7,0.9,1])for(let l=0.12;l<=0.9;l+=0.04)out.push(hsl(h,s,l));return out.filter(c=>ok(c,grey));};
const R=cands(0,40), G=cands(90,170);
// greedy: R0=#FD6533, G0=#00674B base; then add R1,G1 so that {R0,R1,G0,G1,grey} pairwise ok, then R2 with R0,R1,G0 etc.
const set:{R:string[],G:string[]}={R:['#FD6533'],G:['#00674B']};
console.log('base R vs G', ok('#FD6533','#00674B'));
// co-occurrence: R_i with G_j allowed when i+1 + j+1 <= 4
function valid(){for(let i=0;i<set.R.length;i++)for(let k=i+1;k<set.R.length;k++)if(!ok(set.R[i]!,set.R[k]!))return false;
for(let i=0;i<set.G.length;i++)for(let k=i+1;k<set.G.length;k++)if(!ok(set.G[i]!,set.G[k]!))return false;
for(let i=0;i<set.R.length;i++)for(let j=0;j<set.G.length;j++)if(i+j+2<=4&&!ok(set.R[i]!,set.G[j]!))return false;return true;}
for(const step of ['R','G','R','G','R','G'] as const){const pool=step==='R'?R:G;let best:string|null=null,bs=-1;
for(const c of pool){set[step].push(c);if(valid()){const s=Math.min(...[...set.R,...set.G].filter(x=>x!==c).map(x=>minD(c,x)));if(s>bs){bs=s;best=c;}}set[step].pop();}
if(best){set[step].push(best);}console.log(step,best,bs.toFixed(1));}
console.log(set);
