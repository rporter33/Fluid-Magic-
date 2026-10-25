import csv, sys, collections
d=sys.argv[1]
def load(n):
    return list(csv.DictReader(open(f"{d}/{n}",encoding='utf-8',errors='replace'),delimiter='\t'))
units={r['id']:r for r in load('d6BaseU.csv')}
nations={r['id']:r for r in load('d6_nations.csv')}
abn=load('d6_attributes_by_nation.csv')
realms=load('d6_realms.csv')
add=load('d6_pretender_types_by_nation.csv')
dele=load('d6_unpretender_types_by_nation.csv')
nrealm=collections.defaultdict(list); cheap=collections.defaultdict(list)
for a in abn:
    if a['attribute']=='289': nrealm[a['nation_number']].append(a['raw_value'])
    if a['attribute'] in ('314','315'): cheap[a['nation_number']].append((a['attribute'],a['raw_value']))
rm=collections.defaultdict(list)
for r in realms: rm[r['realm']].append(r['monster_number'])
pret={}
for nid in nations:
    if int(nid)<5: continue
    s=[]
    for rl in nrealm[nid]: s+=rm[rl]
    s+=[a['monster_number'] for a in add if a['nation_number']==nid and a['monster_number']!='134']
    dl={a['monster_number'] for a in dele if a['nation_number']==nid}
    pret[nid]=set(x for x in s if x not in dl)
pret={k:v for k,v in pret.items() if v}
cnt=collections.Counter(m for v in pret.values() for m in v)
print('nations with pretenders', len(pret), 'distinct pretenders', len(cnt))
print('avg per nation', sum(len(v) for v in pret.values())/len(pret), 'min', min(len(v) for v in pret.values()), 'max', max(len(v) for v in pret.values()))
mode=sys.argv[2]
if mode=='count':
    for m,c in cnt.most_common():
        u=units[m]
        print(f"{c:>3} {u['name']} [{m}] realm={u['realm1']} pc={u['pathcost'] or 10} dom={u['startdom'] or 1} basecost={u['basecost']}")
elif mode=='realms':
    names={'1':'?','10':'?'}
    for rl in sorted(rm,key=int):
        print('REALM',rl, ', '.join(units[m]['name'] for m in rm[rl]))
elif mode=='nation':
    for nid in sys.argv[3:]:
        n=nations[nid]
        print(nid, n['name'], n['era'], 'realms', nrealm[nid], 'cheap', cheap[nid])
        print('  ', ', '.join(sorted(units[m]['name'] for m in pret.get(nid,[]))))
elif mode=='cheap':
    for nid,c in cheap.items():
        print(nations[nid]['name'], nations[nid]['era'], [(a, units.get(v,{}).get('name',v)) for a,v in c])
