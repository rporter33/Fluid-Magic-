# Exact-ish DRN distribution (open-ended 2d6: each 6 rerolled and added), truncated at depth.
from collections import defaultdict
def die():
    d = defaultdict(float)
    def rec(total, p, depth):
        for f in range(1,7):
            if f == 6 and depth < 6: rec(total+6, p/6, depth+1)
            else: d[total+f] += p/6
    rec(0,1.0,0); return d
D1 = die()
drn = defaultdict(float)
for a,pa in D1.items():
    for b,pb in D1.items(): drn[a+b]+=pa*pb
def p_wound(base, armor):
    return sum(pa*pb for a,pa in drn.items() for b,pb in drn.items() if base + a - armor - b > 0)
print("Fire Sprite (prot 0, fire +10) vs fire arrow 6: base -4:", round(p_wound(-4,0),3))
print("Salamander (prot 8, fire +10) vs fire arrow 6:", round(p_wound(-4,8),4))
print("Treant (prot 12, fire -5) vs fire arrow 6: base 11:", round(p_wound(11,12),3), "without:", round(p_wound(6,12),3))
print("Oakheart (prot 10, fire -3) vs fire arrow 6: base 9:", round(p_wound(9,10),3), "without:", round(p_wound(6,10),3))
