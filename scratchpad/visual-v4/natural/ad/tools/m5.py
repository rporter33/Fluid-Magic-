import sys, json, numpy as np
exec(open('m3.py').read().split('# ref-2 land patches')[0].split("for view, D in")[0])
P = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/'
for view, D in [('start', 96), ('refW', 200)]:
    for f in [f'M-{view}-build', f'W-{view}-calm']:
        r = busy(P + f'ad/shots/{f}.png', view, D); print(f, r.get('WILD'))
