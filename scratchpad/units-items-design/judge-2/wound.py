# Exact wound chances: P(base + D1 - prot - D2 > 0), D = 2 open-ended d6 (6 rerolls and adds).
from fractions import Fraction
from functools import lru_cache
MAXV = 80
def die():
    # open-ended d6: value distribution truncated far out
    d = {}
    def rec(acc, p, depth):
        for f in range(1, 7):
            if f == 6 and depth < 8:
                rec(acc + 6, p / 6, depth + 1)  # a 6 is kept and the reroll added
            else:
                d[acc + f] = d.get(acc + f, 0) + p / 6
    rec(0, 1.0, 0)
    return d
D1 = die()
DRN = {}
for a, pa in D1.items():
    for b, pb in D1.items():
        DRN[a + b] = DRN.get(a + b, 0) + pa * pb
def wound(base, prot):
    t = prot - base
    return sum(pa * pb for a, pa in DRN.items() for b, pb in DRN.items() if a - b > t)
print('E[DRN]', sum(k * v for k, v in DRN.items()))
cases = [
  ('fire arrow 6 on Treant prot 12, today', 6, 12),
  ('fire arrow 6 on Treant, fire -5', 11, 12),
  ('fire arrow 6 on Oakheart prot 10, today', 6, 10),
  ('fire arrow 6 on Oakheart, fire -3', 9, 10),
  ('fire arrow 6 on Fire Sprite prot 0, fire +10', -4, 0),
  ('fire arrow 6 on Salamander prot 8, fire +10', -4, 8),
  ('Great Wyrm prot 16 vs Cinder Warrior axe 16', 16, 16),
  ('Great Wyrm prot 17 vs Cinder Warrior axe 16', 16, 17),
  ('Titan prot 10 vs CW 16', 16, 10), ('Titan prot 11 vs CW 16', 16, 11),
]
for name, base, prot in cases:
    print(f'{name}: {100*wound(base, prot):.1f}%')
