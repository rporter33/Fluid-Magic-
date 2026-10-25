function run(name, step, inc, up, days=360){
  let s={gold:0,u:0,maxU:0,paid:0};
  for(let d=0;d<days;d++){ step(s,inc,up); s.maxU=Math.max(s.maxU,s.u); }
  console.log(name, `inc=${inc} up=${up}`, 'unpaidDays', s.u.toFixed(2), 'max', s.maxU.toFixed(2), 'penalty', Math.floor(s.u/30), 'gold', s.gold.toFixed(1), 'paidFrac', (s.paid/(up*days)).toFixed(2));
}
const dec17=(s,i,u)=>{ s.gold+=i; if(s.gold>=u){s.gold-=u;s.paid+=u;s.u=0;} else s.u+=1; };
const code=(s,i,u)=>{ s.gold+=i; const p=Math.min(s.gold,u); s.gold-=p; s.paid+=p; s.u = p>=u?0:s.u+(u-p)/u; };
const codePlus1=(s,i,u)=>{ s.gold+=i; const p=Math.min(s.gold,u); s.gold-=p; s.paid+=p; s.u = p>=u?0:s.u+1; };
const debt=(s,i,u)=>{ s.gold+=i-u; s.paid+=u; s.u = s.gold<0? s.u+1 : 0; };
for (const [i,u] of [[10,15],[10,30],[10,100],[10,301],[10,10.5]]) {
  run('dec17   ',dec17,i,u); run('code    ',code,i,u); run('code+1  ',codePlus1,i,u); run('debt    ',debt,i,u);
}
