import csv, sys, collections
d = sys.argv[1]
def load(name):
    with open(f"{d}/{name}", newline='', encoding='utf-8', errors='replace') as f:
        return list(csv.DictReader(f, delimiter='\t'))
units = {r['id']: r for r in load('d6BaseU.csv')}
nations = {r['id']: r for r in load('d6_nations.csv')}
pt = load('d6_pretender_types_by_nation.csv')
by = collections.defaultdict(set)
for r in pt:
    by[r['monster_number']].add(r['nation_number'])
cols = ['basecost','pathcost','startdom','hp','prot','mr','mor','str','att','def','size','mapmove']
paths = ['F','A','W','E','S','D','N','G','B','H']
flags = ['flying','immobile','immortal','domimmortal','stealthy','regeneration','fireshield','awe','fear','heat','cold','trample','ethereal','invulnerable','reform','spy','assassin','inspirational','teleport','reinc','berserk','poisoncloud','diseasecloud','mounted','undead','demon','magicbeing','inanimate','reanimator','darkvision','fireres','coldres','shockres','poisonres','regeneration','damagerev','petrify','ethtrue','deathcurse','stormpower','firepower','coldpower','darkpower','chaospower','magicpower','forgebonus','resources','alc']
print(len(by), 'pretender types', len(set(n for s in by.values() for n in s)), 'nations')
rows=[]
for mid, ns in by.items():
    u = units.get(mid)
    if not u: continue
    p = ' '.join(f"{k}{u[k]}" for k in paths if u.get(k) and u[k] not in ('','0'))
    fl = ' '.join(f"{k}={u[k]}" if u[k] not in ('1',) else k for k in flags if k in u and u[k] not in ('','0'))
    rows.append((len(ns), u['name'], mid, *[u.get(c,'') for c in cols], p, fl))
rows.sort(key=lambda r:(-r[0], r[1]))
mode = sys.argv[2] if len(sys.argv)>2 else 'all'
print('nations\tname\tid\t' + '\t'.join(cols) + '\tpaths\tflags')
for r in rows:
    if mode=='generic' and r[0] < 20: continue
    print('\t'.join(str(x) for x in r))
