# Stage B portraits, resume: post-process every candidate version (first and re-roll) with the current gates, overrides,
# reviews and card crops. Usage: python3 -I pt_postall.py
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import pt_post as PP  # noqa: E402
W = PP.W
jobs = json.load(open(os.path.join(W, 'jobs.json')))
crops = json.load(open(os.path.join(W, 'cardcrops.json')))
r2jobs = {j['job']: j for j in json.load(open(os.path.join(W, 'jobs-r2.json')))}
for j in jobs:
    for tag in ('', 'r2'):
        raw = j['out'] if not tag else j['out'].replace('.nb21.png', '.r2.nb21.png')
        if os.path.exists(raw):
            jj = r2jobs.get(j['job'], j) if tag else j
            if tag and 'route' not in jj.get('reroll', {}):
                jj = dict(jj, route=jj.get('route', 'new') + ' (re-roll r2)')
            m = PP.post(jj, raw, tag, PP.OUT, crops)
            print(j['job'] + ('.' + tag if tag else ''), 'PASS' if m['checks']['passed'] else 'FAIL', m['checks']['failed'],
                  [o['gate'][:30] for o in m['checks']['overridden']], (m.get('review') or {}).get('verdict'))
