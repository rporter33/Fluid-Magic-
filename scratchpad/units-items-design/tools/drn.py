import random, sys
random.seed(7)
def die():
    t = 0
    while True:
        r = random.randint(1, 6); t += r
        if r != 6: return t
def drn(): return die() + die()
def exp(base, prot, n=200000):
    s = 0; pos = 0
    for _ in range(n):
        v = max(0, base + drn() - prot - drn()); s += v; pos += v > 0
    return s / n, pos / n
cases = [
 ('Fireball 10 fire vs Treant prot 12', 10, 12),
 ('  ... with fire vulnerability 5', 15, 12),
 ('Fireball 10 fire vs Oakheart prot 10', 10, 10),
 ('  ... with fire vulnerability 3', 13, 10),
 ('Fire Arrows 6 vs Warden prot 6', 6, 6),
 ('Salamander breath 10 vs Treant prot 12, vuln 5', 15, 12),
 ('Thorn Spray 8 nature vs Ash Militia prot 1', 8, 1),
 ('Fireball 10 vs Salamander prot 8 with fire res 10', 0, 8),
 ('Fireball 10 vs Flamebrand prot 6 with fire res 5', 5, 6),
 ('Lance charge 6+3+str11 vs Thorn Militia prot 2', 20, 2),
 ('Lance no charge (reach cancels) 6+11 vs prot 2', 17, 2),
 ('Club 12+str18 Giant vs Warden prot 6', 30, 6),
 ('Trample 2x? Primordial crush 12+22 vs militia prot 2', 34, 2),
]
for name, b, p in cases:
    e, pp = exp(b, p)
    print(f"{name}: mean {e:.2f}, P(dmg>0) {pp:.2f}")
def pkill(base, prot, hp, n=200000):
    k = 0
    for _ in range(n):
        if base + drn() - prot - drn() >= hp: k += 1
    return k / n
print('kill chance per hit, Ash Rider lance with charge (20) vs Warden prot 6 hp 11:', round(pkill(20, 6, 11), 2))
print('  without charge (17):', round(pkill(17, 6, 11), 2))
print('  vs Briar Guard prot 9 hp 12, charge 20:', round(pkill(20, 9, 12), 2), 'no charge 17:', round(pkill(17, 9, 12), 2))
print('  vs Thorn Militia prot 2 hp 10, charge 20:', round(pkill(20, 2, 10), 2), 'no charge 17:', round(pkill(17, 2, 10), 2))
