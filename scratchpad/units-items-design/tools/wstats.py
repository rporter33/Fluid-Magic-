import csv, sys, collections
d = sys.argv[1]
def rd(n): return list(csv.DictReader(open(f"{d}/{n}", encoding='utf-8', errors='replace'), delimiter='\t'))
W = rd('d6_weapons.csv'); E = {r['record_id']: r for r in rd('d6_effects_weapons.csv')}
U = rd('d6_BaseU.csv')
used = collections.Counter()
for u in U:
    for k in ['wpn1','wpn2','wpn3','wpn4','wpn5','wpn6','wpn7']:
        if u.get(k) and u[k] != '0': used[u[k]] += 1
BITS = {'AP':64,'AN':128,'charge':2147483648,'bonus':134217728,'fire':32,'cold':512,'shock':2048,'2h':2,'pierce':274877906944,'blunt':549755813888,'slash':1099511627776}
c = collections.Counter(); n = 0; magic = 0; multi = 0; lens = collections.Counter(); ranged = 0
for w in W:
    if w['id'] not in used: continue
    n += 1
    e = E.get(w['effect_record_id'], {})
    m = int(e.get('modifiers_mask') or 0)
    for k, b in BITS.items():
        if m & b: c[k] += 1
    if not (m & 2097152): magic += 1
    if int(w['nratt'] or 1) > 1: multi += 1
    if int(w['ammo'] or 0) > 1: ranged += 1
    lens[w['len']] += 1
print('weapons used by units', n, dict(c), 'magic', magic, 'multi-attack', multi, 'ranged(ammo>1)', ranged)
print('lengths', sorted(lens.items(), key=lambda kv: int(kv[0]) if kv[0].lstrip('-').isdigit() else 99))
print('top weapons', [(next(x['name'] for x in W if x['id']==i), k) for i, k in used.most_common(15)])
A = rd('d6_armors.csv'); print('armors', len(A), collections.Counter(a['type'] for a in A))
