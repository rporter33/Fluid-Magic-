import csv,sys
path=sys.argv[1]
names=sys.argv[2:]
with open(path,newline='') as f:
    r=csv.DictReader(f,delimiter='\t')
    for row in r:
        if any(n.lower() in row['name'].lower() for n in names):
            nz={k:v for k,v in row.items() if v not in ('',None) and k not in ('end',)}
            print(nz)
