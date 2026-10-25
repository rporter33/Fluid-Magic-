"""compact judge table: python3 -I jsum.py keys views  (keys like f3,fx,fy)"""
import sys, json
sys.path.insert(0, '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/fix/art/tools')
import judge
keys = sys.argv[1].split(','); views = sys.argv[2].split(',')
for v in views:
    for k in keys:
        try: r = judge.run(f'{k}-dpr1-{v}')
        except FileNotFoundError: print(k, v, 'missing'); continue
        s = []
        for w in ['ash', 'grey', 'mere']:
            x = r['w'].get(w)
            if not x or not x.get('n'): continue
            s.append('%s LL%.2f gs%.1f busy%s fine%.2f L%s' % (w, x['lightLine'], x['groundStepP50'], x.get('busy'), x['fineRatio'], x['L']))
        print(k.ljust(4), v.ljust(7), ' | '.join(s))
