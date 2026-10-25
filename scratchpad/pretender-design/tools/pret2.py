import csv, sys, collections
d = sys.argv[1]
def load(name):
    with open(f"{d}/{name}", newline='', encoding='utf-8', errors='replace') as f:
        return list(csv.DictReader(f, delimiter='\t'))
units = {r['id']: r for r in load('d6BaseU.csv')}
pt = load('d6_pretender_types_by_nation.csv')
by = collections.defaultdict(set)
for r in pt: by[r['monster_number']].add(r['nation_number'])
paths = ['F','A','W','E','S','D','N','G','B','H']
flags = ['flying','immobile','unteleportable','immortal','domimmortal','reform','reformtime','stealthy','regeneration','fireshield','awe','sunawe','fear','heat','cold','trample','ethereal','invulnerable','inspirational','teleport','berserk','poisoncloud','diseasecloud','undead','demon','magicbeing','inanimate','reanimator','damagerev','petrify','deathcurse','stormpower','firepower','coldpower','darkpower','magicpower','forgebonus','researchbonus','fixedresearch','gemprod','supplybonus','spreaddom','spreadorder','spreadgrowth','spreaddeath','spreadchaos','popkill','incunrest','moreorder','moregrowth','moreprod','moreheat','moreluck','moremagic','triplegod','triplegodmag','sleepaura','domsummon','domsummon2','domsummon20','raredomsummon','makemonsters1','summon1','batstartsum1','batstartsum2','batstartsum1d6','batstartsum2d6','onebattlespell','autoblessed','alchemy','spy','assassin','seduce','heal','autohealer','poisonarmor','acidshield','banefireshield','slimer','chaospower','winterpower','summerpower','springpower','fallpower','mastersmith','castledef','incprovdef','horror','twiceborn','spiritform','lich','unify','blessfly','dragonlord','divinebeing','glamour','pretenderstartsite','startitem','localsun','corpseeater','shatteredsoul','insane','taxcollector','beastmaster','taskmaster','elegist','templetrainer','magicstudy','spellsinger','ivylord','clockworklord','labpromotion']
def name(i):
    u = units.get(i); return u['name'] if u else i
out=[]
for mid, ns in by.items():
    u = units.get(mid)
    if not u: continue
    p = ' '.join(f"{k}{u[k]}" for k in paths if u.get(k) and u[k] not in ('','0'))
    rnd = []
    for i in range(1,5):
        if u.get(f'rand{i}') and u[f'rand{i}'] not in ('','0'):
            rnd.append(f"rand{u[f'rand{i}']}%x{u.get(f'nbr{i}','')}m{u.get(f'mask{i}','')}")
    fl=[]
    for k in flags:
        v=u.get(k,'')
        if v in ('','0'): continue
        if k in ('domsummon','domsummon2','domsummon20','raredomsummon','summon1','batstartsum1','batstartsum2','batstartsum1d6','batstartsum2d6','twiceborn'):
            fl.append(f"{k}:{name(v)}")
        elif k=='onebattlespell': fl.append(f"onebattlespell:{v}")
        else: fl.append(k if v=='1' else f"{k}={v}")
    sh=''
    for k in ('shapechange','secondshape','secondtmpshape','firstshape'):
        v=u.get(k,'')
        if v not in ('','0'):
            s=units.get(v)
            sh+=f"{k}->{name(v)}(hp{s['hp'] if s else '?'} prot{s['prot'] if s else '?'} str{s['str'] if s else '?'}) "
    out.append(dict(n=len(ns),name=u['name'],id=mid,pc=u['pathcost'],dom=u['startdom'] or '1',hp=u['hp'],prot=u['prot'],mr=u['mr'],mor=u['mor'],str=u['str'],att=u['att'],df=u['def'],size=u['size'],mv=u['mapmove'],paths=p,rnd=' '.join(rnd),fl=' '.join(fl),sh=sh, nations=sorted(ns,key=int)))
out.sort(key=lambda r:(-r['n'], r['name']))
for r in out:
    print(f"{r['n']:>3} | {r['name']} [{r['id']}] | pc {r['pc']} dom {r['dom']} | hp {r['hp']} prot {r['prot']} mr {r['mr']} mor {r['mor']} str {r['str']} att {r['att']} def {r['df']} sz {r['size']} mv {r['mv']} | {r['paths']} {r['rnd']} | {r['fl']} | {r['sh']}")
