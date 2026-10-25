import csv, sys, collections
path = sys.argv[1]
rows = list(csv.DictReader(open(path, encoding='utf-8', errors='replace'), delimiter='\t'))
print('items', len(rows))
print('columns', len(rows[0]))
by_type = collections.Counter(r['type'] for r in rows)
print('by type', by_type.most_common())
by_level = collections.Counter(r['constlevel'] for r in rows)
print('by constlevel', sorted(by_level.items()))
by_path = collections.Counter(r['mainpath'] for r in rows)
print('by mainpath', by_path.most_common())
tl = collections.Counter((r['type'], r['constlevel']) for r in rows)
types = sorted(by_type)
levels = sorted(by_level, key=lambda x: (len(x), x))
print('type x level')
print('type'.ljust(10), ' '.join(l.rjust(4) for l in levels))
for t in types:
    print(t.ljust(10), ' '.join(str(tl[(t,l)]).rjust(4) for l in levels))
# columns of interest present?
for c in ['cursed','restricted','nofind','heavy','unique']:
    print(c, c in rows[0])
cols = list(rows[0].keys())
print([c for c in cols if any(k in c.lower() for k in ['rest','nat','unique','heavy','mount','slot','cost','gem'])])
