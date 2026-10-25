import json,sys,collections
d=json.load(open(sys.argv[1]))
print('battles',len(d))
def pct(xs,p):
    xs=sorted(xs); return xs[min(len(xs)-1,int(p/100*len(xs)))]
tro=[max(b['a']['troops'],b['d']['troops']) for b in d]
tot=[b['a']['troops']+b['d']['troops'] for b in d]
cards=[b[s]['squads']+b[s]['cmd'] for b in d for s in 'ad']
sq=[b[s]['squads'] for b in d for s in 'ad']
mx=[b[s]['maxSquad'] for b in d for s in 'ad']
print('larger side troops p50/p90/p99/max',[pct(tro,p) for p in (50,90,99)],max(tro))
print('both sides troops p50/p90/p99/max',[pct(tot,p) for p in (50,90,99)],max(tot))
print('cards per side (squads+cmd) p50/p90/p99/max',[pct(cards,p) for p in (50,90,99)],max(cards))
print('squads per side p50/p90/max',[pct(sq,p) for p in (50,90)],max(sq))
print('largest squad p50/p90/p99/max',[pct(mx,p) for p in (50,90,99)],max(mx))
rows=collections.Counter()
maxrow=[]
for b in d:
  for s in 'ad':
    r=b[s]['rows']; maxrow.append(max(r.values()))
print('max squads in one row p50/p90/p99/max',[pct(maxrow,p) for p in (50,90,99)],max(maxrow))
print('terrain',collections.Counter(b['terrain'] for b in d))
print('storms',sum(1 for b in d if b['storm']), collections.Counter(json.dumps(b['storm']) for b in d if b['storm']))
print('rounds p50/p90/max',[pct([b['rounds'] for b in d],p) for p in (50,90)],max(b['rounds'] for b in d))
big=collections.Counter(x for b in d for s in 'ad' for x in b[s]['big'])
print('big bodies',big.most_common(20))
print('independent defenders',sum(1 for b in d if b['dn'] is None))
top=sorted(d,key=lambda b:-(b['a']['troops']+b['d']['troops']))[:5]
for b in top: print(b['day'],b['terrain'],b['storm'],b['a']['troops'],b['a']['squads'],b['a']['cmd'],'|',b['d']['troops'],b['d']['squads'],b['d']['cmd'],b['a']['units'][:12],b['d']['units'][:12])
