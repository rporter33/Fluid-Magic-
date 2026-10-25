const T=[0,60,150,300,500,750,1050];
function dayReached(rate, start, need){ let p=start; for(let d=1; d<5000; d++){ p+=rate/30; if(p>=need) return d; } }
console.log('1 mage fury2 (4/mo) 0->60:', dayReached(4,0,60), 'formula', Math.ceil(60/(4/30)));
console.log('4 mages neutral 60->500:', dayReached(20,60,500), 'formula', 440/(20/30));
console.log('4 mages x0.8 60->500:', dayReached(16,60,500), 'formula', 440/(16/30));
let late=0,total=0;
for(let pips=1;pips<=30;pips++) for(let s=-3;s<=3;s++){ const rate=(3+2*pips)*(1+0.1*s); for(let i=1;i<T.length;i++){ total++; const f=Math.ceil(T[i]/(rate/30)-1e-9); const d=dayReached(rate,0,T[i]); if(d!==f) late++; } }
console.log('mismatch', late, 'of', total);
