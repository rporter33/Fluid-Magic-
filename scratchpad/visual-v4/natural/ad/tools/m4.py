import sys, json, numpy as np
sys.argv = ['x']; exec(open('m3.py').read().split('# ref-2 land patches')[0].split("for view, D in")[0])
P = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/'
sys.path.insert(0, P + 'proto'); from natlib import rgb2lab
for view, D in [('start', 96), ('refW', 200)]:
    for v in ['build', 'caps', 'capsLP']:
        r = busy(P + f'ad/shots/M-{view}-{v}.png', view, D)
        a = np.asarray(Image.open(P + f'ad/shots/M-{view}-{v}.png').convert('RGB'), np.float64)
        print(view, v, {k: r[k] for k in ('mountains', 'hills', 'WILD', 'plains') if k in r})
