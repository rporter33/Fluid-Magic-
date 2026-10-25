import { writeFileSync } from 'node:fs';
import { COLOR_DEFS } from '/home/user/Fluid-Magic-/src/content/colors';
import { TERRAIN, TERRAIN_IDS } from '/home/user/Fluid-Magic-/src/content/terrain';
const M: Record<string, number[][]> = {
  normal: [[1,0,0],[0,1,0],[0,0,1]],
  deutan: [[0.367322,0.860646,-0.227968],[0.280085,0.672501,0.047413],[-0.01182,0.04294,0.968881]],
  protan: [[0.152286,1.052583,-0.204868],[0.114503,0.786281,0.099216],[-0.003882,-0.048116,1.051998]],
  tritan: [[1.255528,-0.076749,-0.178779],[-0.078411,0.930809,0.147602],[0.004733,0.691367,0.3039]],
};
const toLin=(c:number)=>c<=0.04045?c/12.92:((c+0.055)/1.055)**2.4;
const toS=(c:number)=>{c=Math.min(1,Math.max(0,c));return c<=0.0031308?12.92*c:1.055*c**(1/2.4)-0.055;};
const hex=(h:string)=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);
const TW=110, TH=70, PAD=6;
const owners: (string|null)[] = [null, COLOR_DEFS.G.palette.primary, COLOR_DEFS.R.palette.primary];
const modes = ['flat','glow'];
const W = (TW+PAD)*TERRAIN_IDS.length+PAD, H=(TH+PAD)*owners.length*modes.length+PAD;
for (const [v,m] of Object.entries(M)) {
  const buf = Buffer.alloc(W*H*3, 0x1c);
  const put=(x:number,y:number,rgb:number[])=>{const lin=rgb.map(toLin);const s=m.map(r=>r[0]*lin[0]+r[1]*lin[1]+r[2]*lin[2]).map(toS);const o=(y*W+x)*3;buf[o]=Math.round(s[0]*255);buf[o+1]=Math.round(s[1]*255);buf[o+2]=Math.round(s[2]*255);};
  modes.forEach((mode,mi)=>owners.forEach((own,oi)=>TERRAIN_IDS.forEach((t,ti)=>{
    const x0=PAD+ti*(TW+PAD), y0=PAD+(mi*owners.length+oi)*(TH+PAD);
    const f=hex(TERRAIN[t].fill), b=hex('#2B2620'), o=own?hex(own):null;
    for(let y=0;y<TH;y++)for(let x=0;x<TW;x++){
      const d=Math.min(x,y,TW-1-x,TH-1-y);
      let c=f;
      if(d<2)c=b; else if(o){
        if(mode==='flat'&&d<7)c=o;
        if(mode==='glow'&&d<12){const a=0.85*(1-(d-2)/10);c=f.map((fv,i)=>fv*(1-a)+o[i]!*a);}
      }
      put(x0+x,y0+y,c);
    }})));
  const p=`/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/design-review/r8/mock-${v}.ppm`;
  writeFileSync(p, Buffer.concat([Buffer.from(`P6\n${W} ${H}\n255\n`), buf]));
}
console.log(TERRAIN_IDS.join(' '));
