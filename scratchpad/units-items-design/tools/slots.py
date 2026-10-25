import csv, sys, collections
rows = list(csv.DictReader(open(sys.argv[1], encoding='utf-8', errors='replace'), delimiter='\t'))
cols = ['hand','bow','head','body','foot','misc','crownon','mounted','size']
combo = collections.Counter(tuple(r.get(c,'') for c in ['hand','head','body','foot','misc']) for r in rows)
print('units', len(rows))
print('top slot combos (hand, head, body, foot, misc):')
for k, v in combo.most_common(15): print(' ', k, v)
names = sys.argv[2:]
for r in rows:
    if r['name'] in names:
        print(r['id'], r['name'], {c: r.get(c,'') for c in cols})
