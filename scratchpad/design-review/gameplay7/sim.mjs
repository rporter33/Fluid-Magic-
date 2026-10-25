const hp=11, supply=24;
function run(squads, days){
  for(let d=1; d<=days; d++){
    const eat = squads.reduce((a,s)=>a+s.count,0)+1;
    const starving = eat>supply;
    for(const s of squads){ const max=s.count*hp; if(starving){ s.hp=Math.max(0,s.hp-max*0.02); s.count=Math.ceil(s.hp/hp);} else s.hp=Math.min(max,s.hp+max*0.02);}
    squads = squads.filter(s=>s.count>0);
    if([10,30,45,49,50,60].includes(d)) console.log(d, squads.reduce((a,s)=>a+s.count,0), squads.reduce((a,s)=>a+s.hp,0).toFixed(1), starving);
  }
}
console.log('one squad'); run([{count:29,hp:29*hp}],60);
console.log('29 singles'); run(Array.from({length:29},()=>({count:1,hp})),60);
console.log('two 15+14'); run([{count:15,hp:15*hp},{count:14,hp:14*hp}],60);
