import json, sys, collections
items = json.load(open(sys.argv[1], encoding='utf-8'))
c = collections.Counter((i.get('slot'), tuple(sorted(d['slot_name'] for d in i.get('disabled_slots', []))), bool(i.get('tier'))) for i in items if i.get('disabled_slots'))
for k, v in c.most_common(): print(k, v)
