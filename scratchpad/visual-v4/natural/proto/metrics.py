"""Look metrics on screen crops, the same measures as refs-analysis §1.1 and review/patchiness.py: L* percentiles and sd, OKLCH chroma,
coarse busyness (6 px cells on a 1440-wide screen, adjacent dL* > 10 / > 20) and province-scale patchwork (adjacent blocks a quarter of a
province wide, CIEDE2000 > 10 / > 15). Usage: python3 -I metrics.py"""
import sys, os, json, numpy as np
sys.path.insert(0, os.path.dirname(__file__))
from natlib import rgb2lab, oklch, de2000
from PIL import Image
R = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-refs/'
O = os.path.join(os.path.dirname(__file__), 'renders') + '/'

def measure(path, box, prov_px, screen_w):
    im = Image.open(path).convert('RGB').crop(box); a = np.asarray(im, np.float64)
    L = rgb2lab(a)[..., 0]; C = oklch(a)[..., 1]
    k = 1440 / screen_w / 6
    sm = np.asarray(im.resize((max(8, int(im.width * k)), max(8, int(im.height * k))), Image.BOX), np.float64); Ls = rgb2lab(sm)[..., 0]
    g = np.maximum(np.abs(Ls[:-1, 1:] - Ls[:-1, :-1]), np.abs(Ls[1:, :-1] - Ls[:-1, :-1]))
    b = max(2, int(round(prov_px / 4))); w, h = im.width // b, im.height // b
    bl = rgb2lab(np.asarray(im.resize((w, h), Image.BOX), np.float64))
    d = np.concatenate([de2000(bl[:, 1:], bl[:, :-1]).ravel(), de2000(bl[1:, :], bl[:-1, :]).ravel()])
    return {'Lp5': round(float(np.percentile(L, 5)), 1), 'Lp50': round(float(np.percentile(L, 50)), 1), 'Lp95': round(float(np.percentile(L, 95)), 1), 'Lsd': round(float(L.std()), 1),
            'Cmean': round(float(C.mean()), 3), 'Cp90': round(float(np.percentile(C, 90)), 3), 'Cover012pct': round(float((C > 0.12).mean() * 100), 2),
            'busy10': round(float((g > 10).mean() * 100), 1), 'busy20': round(float((g > 20).mean() * 100), 1),
            'patch10': round(float((d > 10).mean() * 100), 1), 'patch15': round(float((d > 15).mean() * 100), 1), 'block': b}

if __name__ == '__main__':
    rows = []
    # ref-2: game area about 1630 of 2000 display px wide in a 2868 px capture; provinces about 400 px across (refs-analysis); land crop as review/patchiness.py
    rows.append(('ref-2 (zoomed in, land and tokens)', measure(R + 'ref-2.png', (800, 129, 2230, 1144), 400, 1630 * 2868 / 2000)))
    rows.append(('ref-4 (further out)', measure(R + 'ref-4.png', (800, 129, 2230, 1144), 300, 1630 * 2868 / 2000)))
    tags = sys.argv[1:] or ['']
    for look in ['before', 'after']:
        for tg in (tags if look == 'after' else ['']):
            for v, box, pp in [('ref200a', (30, 160, 1330, 730), 200), ('ref200b', (30, 160, 1330, 730), 200), ('mid', (30, 160, 1330, 730), 108), ('start', (322, 197, 1070, 660), 85)]:
                f = f'{O}{look}{tg}-{v}.png'
                if os.path.exists(f): rows.append((f'{look}{tg} {v}', measure(f, box, pp, 1440)))
    keys = ['Lp5', 'Lp50', 'Lp95', 'Lsd', 'Cmean', 'Cp90', 'Cover012pct', 'busy10', 'busy20', 'patch10', 'patch15']
    print('| view | ' + ' | '.join(keys) + ' |'); print('|' + '---|' * (len(keys) + 1))
    for n, r in rows: print(f'| {n} | ' + ' | '.join(str(r[k]) for k in keys) + ' |')
    json.dump(dict(rows), open(O + 'metrics.json', 'w'), indent=1)
