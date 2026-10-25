import csv, sys
path = sys.argv[1]; names = sys.argv[2:]
rows = list(csv.DictReader(open(path, encoding='utf-8', errors='replace'), delimiter='\t'))
for r in rows:
    if r['name'] in names:
        print({k: v for k, v in r.items() if v not in ('', None)})
