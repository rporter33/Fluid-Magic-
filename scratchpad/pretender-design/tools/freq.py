import csv, sys, json, collections
d=sys.argv[1]
units={r['id']:r for r in csv.DictReader(open(f"{d}/d6BaseU.csv",encoding='utf-8',errors='replace'),delimiter='\t')}
costs=json.load(open(f"{d}/zoll/pretender_costs.json"))
ids=[k for k,v in costs.items() if v['pointcost'] is not None and k in units]
n=len(ids)
groups={'flying':['flying'],'fear':['fear'],'awe':['awe','sunawe'],'regeneration':['regeneration'],'immortal or dominion-immortal':['immortal','domimmortal'],'battle-start summons':['batstartsum1','batstartsum2','batstartsum3','batstartsum1d6','batstartsum2d6','batstartsum3d6','batstartsum1d3'],'monthly free summons (domsummon)':['domsummon','domsummon2','domsummon20','raredomsummon'],'heat or cold aura':['heat','cold'],'fire shield':['fireshield'],'ethereal':['ethereal'],'invulnerable':['invulnerable'],'trample':['trample'],'stealthy':['stealthy'],'immobile':['immobile'],'shapechange or second form':['shapechange','secondshape'],'start site':['pretenderstartsite'],'population kill':['popkill'],'supply bonus':['supplybonus'],'research penalty':['researchbonus<0'],'research bonus':['researchbonus>0'],'any scale attunement':['moreorder','moreprod','moreheat','moregrowth','moreluck','moremagic'],'gem income':['gemprod'],'berserk':['berserk'],'trinity':['triplegod'],'teleport':['teleport']}
for g,keys in groups.items():
    c=0
    for i in ids:
        u=units[i]; hit=False
        for k in keys:
            if k.endswith('<0'): hit|= u['researchbonus'] not in ('','0') and int(u['researchbonus'])<0
            elif k.endswith('>0'): hit|= u['researchbonus'] not in ('','0') and int(u['researchbonus'])>0
            else: hit|= u.get(k,'') not in ('','0')
        c+=hit
    print(f"{g}: {c} of {n} ({100*c/n:.0f}%)")
cs=sorted(costs[i]['pointcost'] for i in ids); print('cost range', cs[0], cs[-1], 'median', cs[len(cs)//2])
print('pathcost', collections.Counter(int(units[i]['pathcost'] or 10) for i in ids))
print('startdom', collections.Counter(int(units[i]['startdom'] or 1) for i in ids))
print('mor', collections.Counter(units[i]['mor'] for i in ids).most_common(3), 'mr', collections.Counter(units[i]['mr'] for i in ids).most_common(3))
