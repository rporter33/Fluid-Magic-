# Exact FM odds from docs/04: DRN = two open-ended d6 (a 6 rerolls and adds, repeatedly).
from fractions import Fraction as F
from collections import defaultdict
MAXV = 80
def die():
    d = defaultdict(F)
    def rec(base, p, depth):
        for f in range(1, 7):
            if f == 6 and depth < 12:
                rec(base + 6, p / 6, depth + 1)
            else:
                d[base + f] += p / 6
    rec(0, F(1), 0)
    return d
def conv(a, b):
    c = defaultdict(F)
    for x, p in a.items():
        for y, q in b.items():
            c[x + y] += p * q
    return c
D1 = die(); DRN = conv(D1, D1)
diff = defaultdict(F)  # DRN_a - DRN_b
for x, p in DRN.items():
    for y, q in DRN.items():
        diff[x - y] += p * q
def p_hit_melee(att, de):  # att + DRN > def + DRN
    return float(sum(p for k, p in diff.items() if att + k > de))
def p_hit_ranged(prec):  # prec + DRN >= 10 + DRN
    return float(sum(p for k, p in diff.items() if prec + k >= 10))
def dmg_dist(base, prot):  # max(0, base + DRN - prot - DRN)
    out = defaultdict(float)
    for k, p in diff.items():
        out[max(0, base + k - prot)] += float(p)
    return out
def ev(d): return sum(k * p for k, p in d.items())
def p_kill(d, hp): return sum(p for k, p in d.items() if k >= hp)
print('E[DRN]', float(sum(k*p for k,p in DRN.items())))
for a, d in [(9,9),(10,10),(11,10),(11,9),(12,7),(9,11),(13,11)]:
    print(f'melee att {a} vs def {d}: hit {p_hit_melee(a,d):.3f}')
print(f'ranged prec 10: {p_hit_ranged(10):.3f}')
cases = {
 'Briar Guard Halberd (12+7) vs Cinder Warrior prot 3, hp 11': (19, 3, 11),
 'Cinder Warrior Axe (11+5) vs Briar Guard prot 9, hp 12': (16, 9, 12),
 'Flame Archer Fire Arrows (6) vs Warden prot 6, hp 11': (6, 6, 11),
 'Fire Sprite Flame Touch AP (6+5) vs Briar Guard prot 9->4, hp 12': (11, 4, 12),
 'Thorn Militia Spear (10+3) vs Ash Militia prot 1, hp 10': (13, 1, 10),
}
for name, (base, prot, hp) in cases.items():
    dd = dmg_dist(base, prot)
    print(f'{name}: E[dmg] {ev(dd):.2f}, P(0) {dd[0]:.3f}, P(kill one blow) {p_kill(dd,hp):.3f}')
