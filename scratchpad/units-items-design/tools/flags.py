import csv, sys, collections
rows = list(csv.DictReader(open(sys.argv[1], encoding='utf-8', errors='replace'), delimiter='\t'))
forge = [r for r in rows if r['constlevel'] in ('1','3','5','7','9')]
print('forgeable', len(forge))
for c in ['cursed','nofind','heavy','nomount','bestowtomount','restricted1','fixforge','onlyuseablebyfliersormounted','magerestriction']:
    print(c, sum(1 for r in forge if r.get(c)))
paths='FAWESDNGB'
boost=[r for r in forge if any(r.get(p) for p in paths)]
print('path boosters (any + path col)', len(boost))
# boosters by const level
print(collections.Counter(r['constlevel'] for r in boost))
# mainlevel distribution for forgeable
print('mainlevel', sorted(collections.Counter(r['mainlevel'] for r in forge).items()))
two=[r for r in forge if r['secondarypath']]
print('two-path items', len(two))
