import csv, sys
d = sys.argv[1]
def rd(n): return list(csv.DictReader(open(f"{d}/{n}", encoding='utf-8', errors='replace'), delimiter='\t'))
W = rd('d6_weapons.csv'); E = {r['record_id']: r for r in rd('d6_effects_weapons.csv')}
A = rd('d6_armors.csv'); P = rd('d6_protections_by_armor.csv')
BITS = [(1,'+str'),(2,'2h'),(32,'fire'),(64,'AP'),(128,'AN'),(512,'cold'),(2048,'shock'),(134217728,'bonus'),(2147483648,'charge'),(137438953472,'unrepellable'),(274877906944,'pierce'),(549755813888,'blunt'),(1099511627776,'slash'),(2199023255552,'acid')]
mode = sys.argv[2]; ids = set(sys.argv[3:])
if mode == 'w':
    for w in W:
        if w['id'] in ids or (ids and any(i.startswith('name:') and i[5:].lower() in w['name'].lower() for i in ids)):
            e = E.get(w['effect_record_id'], {})
            m = int(e.get('modifiers_mask') or 0)
            flags = [n for b,n in BITS if m & b]
            if not (m & 2097152): flags.append('MAGIC')
            print(f"{w['id']} {w['name']}: dmg {e.get('raw_argument')} att {w['att']} def {w['def']} len {w['len']} attacks {w['nratt']} ammo {w['ammo']} eff {e.get('effect_number')} flags {','.join(flags)} 2nd {w['secondaryeffect']}")
else:
    zones = {}
    for p in P: zones.setdefault(p['armor_number'], []).append(f"z{p['zone_number']}:{p['protection']}")
    for a in A:
        if a['id'] in ids or any(i.startswith('name:') and i[5:].lower() in a['name'].lower() for i in ids):
            print(f"{a['id']} {a['name']}: type {a['type']} def {a['def']} enc {a['enc']} rcost {a['rcost']} prot {' '.join(zones.get(a['id'], []))}")
