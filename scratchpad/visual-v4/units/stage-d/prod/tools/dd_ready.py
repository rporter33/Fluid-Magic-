# Prints the main-priority generation jobs whose guide is rendered and whose raw image does not exist yet.
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); PROD = os.path.abspath(os.path.join(HERE, '..'))
prio = int(sys.argv[1]) if len(sys.argv) > 1 else 1
jobs = json.load(open(os.path.join(PROD, 'jobs', 'actions.json')))
print(' '.join(j['job'] for j in jobs if j['priority'] <= prio and os.path.exists(j['refs'][0].rsplit('.png', 1)[0] + '.json') and not os.path.exists(j['out'])))
