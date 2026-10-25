import csv, sys
path, mode = sys.argv[1], sys.argv[2]
rows = list(csv.DictReader(open(path, encoding='utf-8', errors='replace'), delimiter='\t'))
if mode == 'find':
    pats = [p.lower() for p in sys.argv[3:]]
    for r in rows:
        n = r['name'].lower()
        if any(p in n for p in pats):
            print(r['id'], r['name'], 'size', r['size'], 'hp', r['hp'], 'mounted', r['mounted'])
elif mode == 'show':
    ids = set(sys.argv[3:])
    cols = ['id','name','size','hp','prot','mr','mor','str','att','def','prec','enc','mapmove','ap','basecost','rcost','rt','wpn1','wpn2','wpn3','armor1','armor2','armor3','mounted','mountmnr','skilledrider','trample','fear','awe','ethereal','regeneration','berserk','undead','inanimate','mind','animal','flying','stealthy','forestsurvival','mountainsurvival','holy','fireres','coldres','shockres','poisonres','fireshield','heat','cold','darkvision','siegebonus','ressize','reform','eyes']
    for r in rows:
        if r['id'] in ids:
            print(' | '.join(f"{c}={r[c]}" for c in cols if r.get(c) not in ('', None, '0')))
