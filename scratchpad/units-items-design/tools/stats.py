import csv, sys, collections
rows = [r for r in csv.DictReader(open(sys.argv[1], encoding='utf-8', errors='replace'), delimiter='\t') if r['name'] and not r['name'].startswith('Test')]
n = len(rows)
print('units', n)
sz = collections.Counter(r['size'] for r in rows)
print('size', sorted(((int(k) if k.lstrip('-').isdigit() else -99), v) for k, v in sz.items()))
def has(c): return sum(1 for r in rows if r.get(c) not in ('', '0', None))
for c in ['mountmnr','trample','fear','awe','animalawe','ethereal','regeneration','berserk','undead','inanimate','mind','demon','magicbeing','animal','flying','stealthy','holy','forestsurvival','mountainsurvival','swampsurvival','wastesurvival','fireres','coldres','shockres','poisonres','fireshield','heat','cold','poisonarmor','darkvision','siegebonus','reform','immortal','domimmortal','undisciplined','standard','inspirational','formationfighter','skilledrider','amphibian','aquatic','immobile','heal','autohealer']:
    print(f"{c}: {has(c)} ({100*has(c)/n:.1f}%)")
# hp and prot spread by size
by = collections.defaultdict(list)
for r in rows:
    try: by[int(r['size'])].append(int(r['hp']))
    except: pass
for k in sorted(by): 
    v = sorted(by[k]); print('size', k, 'count', len(v), 'median hp', v[len(v)//2])
