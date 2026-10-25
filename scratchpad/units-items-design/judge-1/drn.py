from fractions import Fraction
from functools import lru_cache
# open-ended d6: 6 rerolls and adds, truncated at depth
def d6(depth=6):
    dist={}
    def go(acc,p,d):
        for f in range(1,7):
            if f==6 and d<depth: go(acc+6,p/6,d+1)
            else: dist[acc+f]=dist.get(acc+f,0)+p/6
    go(0,1.0,0); return dist
D=d6()
drn={}
for a,pa in D.items():
    for b,pb in D.items(): drn[a+b]=drn.get(a+b,0)+pa*pb
diff={}
for a,pa in drn.items():
    for b,pb in drn.items(): diff[a-b]=diff.get(a-b,0)+pa*pb
def p_ge(k): return sum(p for d,p in diff.items() if d>=k)
def wound(base,prot): return p_ge(prot-base+1)
print('EV drn',sum(k*p for k,p in drn.items()))
for name,b,pr in [('sprite +10',6-10,0),('salamander +10',6-10,8),('treant -5',6+5,12),('treant 0',6,12),('oak -3',6+3,10),('oak 0',6,10)]:
    print(name, round(wound(b,pr)*100,1))
# hit chance att vs def
def hit(att,de): return sum(p for d,p in diff.items() if att-de+d>0)
print('11v10',round(hit(11,10)*100,1),'10v10',round(hit(10,10)*100,1))
for a in (10,11,12,13): print('att',a,'vs def 10',round(hit(a,10)*100,1))
