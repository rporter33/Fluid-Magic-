import sys, json
for line in sys.stdin:
    try: r = json.loads(line)
    except Exception: print(line.strip()); continue
    out = [r['tag'], str(r['Dpx'])]
    for w in ('ash', 'grey', 'mere'):
        x = r.get(w)
        if not x: continue
        out.append(w + ': light %s rim %s step %s busy %s fine %s L %s' % (x.get('lightLine'), x.get('rim65'), x.get('groundStepP50'), x.get('busy'), x.get('fineRatio'), x.get('L')))
    print(' | '.join(out))
