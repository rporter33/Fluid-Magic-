import sys, json, numpy as np
P = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/'
sys.path.insert(0, P + 'proto'); from natlib import rgb2lab, oklch
from PIL import Image, ImageDraw
polys = json.load(open(P + 'ad/polys.json'))
def mask(poly, shape, erode):
    im = Image.new('L', (shape[1], shape[0]), 0); d = ImageDraw.Draw(im); pts = [tuple(p) for p in poly]; d.polygon(pts, fill=255)
    if erode > 0: d.line(pts + [pts[0]], fill=0, width=2 * erode, joint='curve')
    return np.asarray(im) > 0
for view, D, var in [('start', 96, 'landonly'), ('refC', 200, 'landonly'), ('refW', 200, 'landonly')]:
    a = np.asarray(Image.open(P + f'ad/shots/L-{view}-{var}.png').convert('RGB'), np.float64)
    L = rgb2lab(a)[..., 0]; C = oklch(a)[..., 1]
    clip = np.zeros(L.shape, bool); clip[165:735, 20:1230] = True
    er = int(0.15 * D)
    acc = {}
    for pr in polys[view]['provs']:
        m = mask(pr['poly'], L.shape, er) & clip
        if m.sum() < 150: continue
        k = 'WILD ' + pr['n'] if pr['wild'] else pr['t'] + (' (fog)' if pr['fog'] == 'unexplored' else '')
        acc.setdefault(k, []).append(m)
    print(f'== {view} {var} (cores, erode {er}px)')
    print('| terrain | n | L p10 / p50 / p90 | L>60 % | L>70 % | C mean |')
    print('|---|---|---|---|---|---|')
    for k, ms in sorted(acc.items()):
        m = np.any(ms, axis=0); l = L[m]; c = C[m]
        print(f'| {k} | {len(ms)} | {np.percentile(l,10):.1f} / {np.percentile(l,50):.1f} / {np.percentile(l,90):.1f} | {(l>60).mean()*100:.1f} | {(l>70).mean()*100:.1f} | {c.mean():.3f} |')
