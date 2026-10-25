import csv, sys, json, collections
d=sys.argv[1]
units={r['id']:r for r in csv.DictReader(open(f"{d}/d6BaseU.csv",encoding='utf-8',errors='replace'),delimiter='\t')}
costs=json.load(open(f"{d}/zoll/pretender_costs.json"))
calc=json.load(open(f"{d}/zoll/pretenders.json"))
P='F A W E S D N G B'.split()
def cls(u, c):
    if u['immobile'] not in ('','0'): return 'immobile'
    if u.get('triplegod') not in ('','0'): return 'trinity'
    if u.get('shapechange') not in ('','0') and u.get('dragonlord') not in ('','0'): return 'dragon(wizard form)'
    if u['undead'] not in ('','0') or u['immortal'] not in ('','0'): return 'undead/immortal'
    if u['ethereal'] not in ('','0') or (u['magicbeing'] not in ('','0') and int(u['hp'] or 0)<80): return 'spirit'
    dom=int(u['startdom'] or 1); hp=int(u['hp'] or 0)
    if dom==1 or int(u['pathcost'] or 10)<=20: return 'mage'
    if dom>=3: return 'titan'
    return 'monster'
rows=[]
for pid,c in costs.items():
    if pid not in units or c['pointcost'] is None: continue
    u=units[pid]; k=calc.get(pid,{})
    paths=' '.join(f"{p}{u[p]}" for p in P if u[p] not in ('','0'))
    abil=[]
    for f,lab in [('flying','fly'),('immobile','immobile'),('immortal','immortal'),('domimmortal','dom-immortal'),('stealthy','stealth'),('regeneration','regen'),('fireshield','fireshield'),('awe','awe'),('fear','fear'),('heat','heat aura'),('cold','cold aura'),('trample','trample'),('ethereal','ethereal'),('invulnerable','invuln'),('poisoncloud','poison cloud'),('popkill','popkill'),('supplybonus','supply'),('researchbonus','research'),('gemprod','gems'),('domsummon','domsummon'),('domsummon2','domsummon'),('domsummon20','domsummon'),('batstartsum1','battle summon'),('batstartsum2','battle summon'),('batstartsum1d6','battle summon'),('batstartsum2d6','battle summon'),('berserk','berserk'),('teleport','teleport'),('shapechange','shapechange'),('secondshape','second form'),('twiceborn','twiceborn'),('triplegod','trinity'),('alchemy','alchemy'),('forgebonus','forge'),('autohealer','healer'),('spy','spy'),('assassin','assassin'),('damagerev','damage reversal'),('petrify','petrify'),('stormpower','storm power'),('firepower','fire power'),('darkpower','dark power'),('chaospower','chaos power'),('springpower','spring power'),('localsun','local sun'),('ivylord','ivy lord'),('beastmaster','beastmaster'),('pretenderstartsite','start site'),('crossbreeder','crossbreeder'),('incunrest','unrest')]:
        v=u.get(f,'')
        if v not in ('','0'):
            abil.append(lab if v=='1' else f"{lab} {v}")
    att=[f"{s}{'+' if int(k.get('more'+s,0))>0 else ''}{k.get('more'+s)}" for s in ('order','prod','heat','growth','luck','magic') if k.get('more'+s) not in (0,None)]
    rows.append(dict(id=pid,name=u['name'],cost=c['pointcost'],cls=cls(u,c),pc=int(u['pathcost'] or 10),dom=int(u['startdom'] or 1),hp=u['hp'],prot=u['prot'],str=u['str'],att=u['att'],df=u['def'],size=u['size'],move=u['mapmove'],ldr=u['leader'],paths=paths,abil=', '.join(dict.fromkeys(abil)),scales=' '.join(att),minprison=k.get('minprison',0),realm=u['realm1']))
mode=sys.argv[2]
if mode=='summary':
    g=collections.defaultdict(list)
    for r in rows: g[r['cls']].append(r)
    for k,v in g.items():
        cs=sorted(r['cost'] for r in v); pcs=collections.Counter(r['pc'] for r in v); doms=collections.Counter(r['dom'] for r in v)
        print(f"{k}: n={len(v)} cost min {cs[0]} median {cs[len(cs)//2]} max {cs[-1]} | pathcost {dict(pcs)} | dom {dict(doms)}")
    print('minprison', collections.Counter(r['minprison'] for r in rows))
    print([ (r['name'],r['minprison']) for r in rows if r['minprison']])
else:
    ids=sys.argv[3:]
    for r in rows:
        if ids and r['id'] not in ids: continue
        print(f"| {r['name']} [{r['id']}] | {r['cls']} | {r['cost']} | {r['paths']} | {r['pc']} | {r['dom']} | hp {r['hp']} prot {r['prot']} str {r['str']} att {r['att']} def {r['df']} sz {r['size']} mv {r['move']} | {r['abil']} | {r['scales']} | realm {r['realm']} minprison {r['minprison']} |")
