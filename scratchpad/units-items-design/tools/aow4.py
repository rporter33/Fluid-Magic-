import json, sys, collections
items = json.load(open(sys.argv[1], encoding='utf-8'))
print('items', len(items))
print('slots', collections.Counter(i.get('slot') for i in items).most_common())
print('tiers', collections.Counter(i.get('tier') for i in items).most_common())
st = collections.Counter((i.get('slot'), i.get('tier_numerals')) for i in items)
for s in sorted({i.get('slot') for i in items}, key=str):
    print(' ', s, {t: st[(s,t)] for t in ['I','II','III','IV','V'] if st[(s,t)]})
ds = collections.Counter(tuple(sorted(d['slot_name'] for d in i.get('disabled_slots', []))) for i in items)
print('disabled slots combos', ds.most_common(10))
# legendary / unique?
keys = collections.Counter(k for i in items for k in i)
print('keys', keys.most_common())
# sample a few by slot
seen=set()
for i in items:
    s=i.get('slot')
    if (s, i.get('tier_numerals')) in seen: continue
    seen.add((s, i.get('tier_numerals')))
    d = i.get('description','')[:160].replace('\n',' ')
    print('SAMPLE', s, i.get('tier'), i.get('name'), '|', d, '| abilities', len(i.get('ability_slugs',[])))
