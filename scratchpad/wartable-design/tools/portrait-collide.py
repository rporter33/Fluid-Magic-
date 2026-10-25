"""Portrait repeat math for research-portraits.md.

Run: python3 -I portrait-collide.py > portrait-collide.out
No inputs; pure arithmetic plus a seeded simulation (FNV-1a + Mulberry32, as DiceBear).
"""
from math import comb, prod

MASK = 0xFFFFFFFF


def fnv1a(s: str) -> int:
    h = 0x811C9DC5
    for ch in s:
        h ^= ord(ch)
        h = (h * 0x01000193) & MASK
    return h


def mulberry32_first(seed: int) -> float:
    z = (seed + 0x6D2B79F5) & MASK
    t = ((z ^ (z >> 15)) * (z | 1)) & MASK
    t ^= (t + (((t ^ (t >> 7)) * (t | 61)) & MASK)) & MASK
    return ((t ^ (t >> 14)) & MASK) / 2**32


def value(seed: str, key: str) -> float:
    """DiceBear Prng.getValue: new Mulberry32(fnv1a(seed + ':' + key)).nextFloat()."""
    return mulberry32_first(fnv1a(seed + ':' + key))


def p_any_repeat(n: int, k: int) -> float:
    """Birthday problem: P(at least two of n share one of k equally likely looks)."""
    if n > k:
        return 1.0
    return 1 - prod((k - i) / k for i in range(n))


def min_k(n: int, target: float) -> int:
    k = n
    while p_any_repeat(n, k) > target:
        k += 1
    return k


print("== A. P(some pair of n portraits is identical), k equally likely full looks")
for k in (1_000, 10_000, 100_000, 1_000_000):
    row = ", ".join(f"n={n}: {p_any_repeat(n, k):.3f}" for n in (30, 60, 110))
    print(f"k={k:>9,}  {row}")

print()
print("== B. Salient looks (what reads at 64 px: headgear/hair silhouette x beard x face shape)")
print("   group = commanders compared side by side (same nation and same unit type)")
for g in (4, 8, 12, 20, 58):
    ks = [min_k(g, t) for t in (0.5, 0.25, 0.10)]
    pairs = comb(g, 2)
    print(
        f"group {g:>2}: k for P(repeat)<=50%: {ks[0]:>5}; <=25%: {ks[1]:>5}; <=10%: {ks[2]:>5};"
        f" expected repeated pairs at k=48: {pairs / 48:.2f}, at k=120: {pairs / 120:.2f}"
    )

print()
print("== C. Seeded hash vs a stored ordinal (deck) for one group")
print("   hash: pick = floor(value(seed, 'c<id>:look') * k); deck: ordinal-th entry of a seeded permutation")
for g, k in ((8, 48), (12, 48), (58, 48), (58, 120)):
    trials, repeats = 2000, 0
    for t in range(trials):
        seen = set()
        hit = False
        for i in range(g):
            pick = int(value(f"game{t}", f"c{i * 7 + 3}:look") * k)
            if pick in seen:
                hit = True
            seen.add(pick)
        repeats += hit
    deck = "none" if g <= k else f"cycles after {k}"
    print(f"g={g:>2} k={k:>3}: hash repeat rate {repeats / trials:.3f} (birthday {p_any_repeat(g, k):.3f}); deck repeats: {deck}")

print()
print("== D. Adding one part to a slot: share of existing commanders whose part changes")
ids = [f"c{i}" for i in range(5000)]
for n in (8, 12, 20):
    mod_changed = sum(
        1 for c in ids if fnv1a("7:" + c) % n != fnv1a("7:" + c) % (n + 1)
    )

    def hrw(c: str, parts: int) -> int:
        # rendezvous (highest random weight): each part scores value(seed, c + part); the best wins
        return max(range(parts), key=lambda p: value("7", f"{c}:hair{p}"))

    hrw_changed = sum(1 for c in ids[:1500] if hrw(c, n) != hrw(c, n + 1))
    print(
        f"{n} -> {n + 1} parts: index = hash % n changes {mod_changed / len(ids):.3f};"
        f" rendezvous changes {hrw_changed / 1500:.3f} (theory {1 / (n + 1):.3f})"
    )

print()
print("== E. Proposed library: salient looks per (nation, commander type) and the repeat risk")
cases = {
    "helmeted (chieftain/captain): helm 3 x beard 8 x face 6 x mark 5": 3 * 8 * 6 * 5,
    "hooded (scout): hood 3 x beard 8 x face 6": 3 * 8 * 6,
    "bare-headed (priest/mage): hair 11 x beard 8 x face 6 x mark 5": 11 * 8 * 6 * 5,
    "independent captain (shared human set): helm 4 x hair-under 1 x beard 8 x face 6 x scar 3": 4 * 8 * 6 * 3,
}
for label, k in cases.items():
    row = ", ".join(f"g={g}: {p_any_repeat(g, k):.3f}" for g in (4, 8, 12, 20, 58))
    print(f"k={k:>5} {label}\n        P(any salient repeat) {row}")
