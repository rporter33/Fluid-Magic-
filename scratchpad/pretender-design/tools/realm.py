import csv, sys
d=sys.argv[1]
rows=list(csv.DictReader(open(f"{d}/d6BaseU.csv",encoding='utf-8',errors='replace'),delimiter='\t'))
pat=sys.argv[2:]
for r in rows:
    if any(p.lower() in r['name'].lower() for p in pat):
        print(r['id'], r['name'], 'realm', r['realm1'], r['realm2'], r['realm3'], 'pc', r['pathcost'], 'dom', r['startdom'], 'hp', r['hp'], 'paths', ' '.join(f"{k}{r[k]}" for k in 'F A W E S D N G B H'.split() if r[k] not in ('','0')), 'shape', r['shapechange'], r['secondshape'], 'basecost', r['basecost'])
