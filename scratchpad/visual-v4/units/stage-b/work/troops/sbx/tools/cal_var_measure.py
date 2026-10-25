# Stage B calibration, part 5: measures on the variation page's shots (var_shoot.cjs).
#   variety (lineup, a man 48 px, figures apart): per figure its median CIELAB colour and its side-cloth share; per row
#     the mean CIEDE2000 between figures' median colours, and the neighbour difference (mean |dL*| over the union of two
#     neighbours' silhouettes, aligned on their feet; 0 for copies of one frame);
#   rules (blocks at play zoom, a man 28 px, side keyline): side share (the side-share rule of checks.py), the block's
#     value margin (closed area mean L* below the ground's) on plains and swamp, and per figure the side share against
#     the copies' (no figure may lose its side);
#   colour vision: the two sides' cloths at the tint limits and stencil shades, simulated for protanopia and
#     deuteranopia (Machado 2009, severity 1), the smallest CIEDE2000 between a Cinder and a Thornwood variant.
# Usage: python3 cal_var_measure.py SHOTS_DIR
import json, os, sys
import numpy as np
from PIL import Image, ImageFilter
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, '..', '..', 'tools'))
from v4color import to_lab, oklch, to_oklab  # noqa: E402
from pilot_metrics import de2000  # noqa: E402
from pack import oklab_to_srgb  # noqa: E402

CLOTH = {'cinderHorde': '#C4532C', 'thornwood': '#1F6A50'}
NAT = {'cw.back': 'cinderHorde', 'cw.front': 'cinderHorde', 'wd.front': 'thornwood'}
hexrgb = lambda h: np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], np.float64)


def cloth_rule(rgb, hexc):
    _, cc, ch = oklch(hexrgb(hexc)[None, None])
    _, C, h = oklch(rgb[None])
    dh = np.abs((h[0] - float(ch[0, 0]) + 180) % 360 - 180)
    return (dh <= 20) & (C[0] >= max(0.04, 0.45 * float(cc[0, 0])))


def fig_mask(img, ground, thr=6.0):
    lab = to_lab(img); g = to_lab(hexrgb(ground)[None, None])[0, 0]
    return np.linalg.norm(lab - g, axis=-1) > thr


def variety(shots, layout, ground='#A8A784'):
    img = np.asarray(Image.open(os.path.join(shots, 'var-lineup-A8A784.png')).convert('RGB')).astype(np.float64)
    out = {}
    for row in layout:
        crops = []
        for f in row['figures']:
            x, y = int(round(f['x'])), int(round(f['y']))
            c = img[max(0, y - 92):y + 10, max(0, x - 40):x + 40]
            m = fig_mask(c, ground)
            crops.append((c, m))
        meds, shares = [], []
        for c, m in crops:
            px = c[m]
            meds.append(np.median(to_lab(px[None])[0], 0))
            shares.append(float(cloth_rule(px, CLOTH[NAT[row['fig']]]).mean()))
        n = len(meds)
        pair = [de2000(meds[i], meds[j]) for i in range(n) for j in range(i + 1, n)]
        nb = []
        for i in range(n - 1):
            (a, ma), (b, mb) = crops[i], crops[i + 1]
            u = ma | mb
            La, Lb = to_lab(a)[..., 0], to_lab(b)[..., 0]
            nb.append(float(np.abs(La - Lb)[u].mean()))
        out[f"{row['fig']}|{row['mode']}"] = dict(meanPairDE=round(float(np.mean(pair)), 2), maxPairDE=round(float(np.max(pair)), 2),
                                                 neighbourDL=round(float(np.mean(nb)), 2), identicalNeighbours=int(sum(1 for v in nb if v < 0.5)),
                                                 sideShareMin=round(min(shares), 3), sideShareMedian=round(float(np.median(shares)), 3))
    return out


def blocks(shots, layout, name, ground):
    img = np.asarray(Image.open(os.path.join(shots, f'var-{name}-{ground[1:]}.png')).convert('RGB')).astype(np.float64)
    gL = to_lab(hexrgb(ground)[None, None])[0, 0, 0]
    out = {}
    for b in layout:
        xs = [f['x'] for f in b['figures']]; ys = [f['y'] for f in b['figures']]
        x0, x1 = int(min(xs)) - 30, int(max(xs)) + 30
        y0, y1 = int(min(ys)) - 45, int(max(ys)) + 8
        c = img[y0:y1, x0:x1]
        m = fig_mask(c, ground)
        share = float(cloth_rule(c[m], CLOTH[NAT[b['fig']]]).mean())
        k = 13
        cl = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(k)).filter(ImageFilter.MinFilter(k))) > 127
        L = to_lab(c)[..., 0]
        out[f"{b['fig']}|{b['mode']}"] = dict(side=round(share, 3), valueBelow=round(float(gL - L[cl].mean()), 1))
    return out


MACHADO = {'protan': np.array([[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]]),
           'deutan': np.array([[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]])}


def simulate(rgb, kind):
    lin = np.where(rgb / 255 <= 0.04045, rgb / 255 / 12.92, ((rgb / 255 + 0.055) / 1.055) ** 2.4)
    s = np.clip(lin @ MACHADO[kind].T, 0, 1)
    return 255 * np.where(s <= 0.0031308, 12.92 * s, 1.055 * s ** (1 / 2.4) - 0.055)


def variants(hexc, lim, stencils=True):
    """The cloth at the corners of its tint box (lightness, hue, chroma), and with its stencil shade on top."""
    lab = to_oklab(hexrgb(hexc)[None, None])[0, 0]
    out = []
    dLs = list(lim['clothL'])
    if stencils:
        dLs += [lim['clothL'][0] + lim['stencilDark'], lim['clothL'][1] + lim['stencilDark'],
                lim['clothL'][0] + lim['stencilLight'], lim['clothL'][1] + lim['stencilLight']]
    for dL in dLs:
        for dh in lim['clothHueDeg']:
            for kc in lim['clothC']:
                a = np.radians(dh)
                ab = np.array([np.cos(a) * lab[1] - np.sin(a) * lab[2], np.sin(a) * lab[1] + np.cos(a) * lab[2]]) * kc
                v = np.array([lab[0] + dL, ab[0], ab[1]])
                out.append(np.clip(oklab_to_srgb(v[None, None])[0, 0], 0, 255))
    return out


def side_lim(lim, nat, symmetric=False):
    c = lim['cloth'][nat]
    if symmetric:  # the first, symmetric limits: both shades on both sides, hue and lightness both ways
        return dict(clothL=[-0.035, 0.03], clothHueDeg=[-6, 6], clothC=[0.92, 1.08], stencilDark=lim['stencilDark'], stencilLight=lim['stencilLight'])
    return dict(clothL=c['L'], clothHueDeg=c['hueDeg'], clothC=c['C'],
                stencilDark=lim['stencilDark'] if c['stencil'] == 'dark' else 0.0,
                stencilLight=lim['stencilLight'] if c['stencil'] == 'light' else 0.0)


def cvd(lim):
    res = {}
    for kind in ('protan', 'deutan'):
        base = de2000(to_lab(simulate(hexrgb(CLOTH['cinderHorde']), kind)[None, None])[0, 0],
                      to_lab(simulate(hexrgb(CLOTH['thornwood']), kind)[None, None])[0, 0])
        kl = de2000(to_lab(simulate(hexrgb('#7E3118'), kind)[None, None])[0, 0], to_lab(simulate(hexrgb('#113F2F'), kind)[None, None])[0, 0])
        mins = {}
        for label, st, sym in (('symmetricTints', False, True), ('symmetricTints+stencils', True, True),
                               ('tints', False, False), ('tints+stencils', True, False)):
            A = [to_lab(simulate(v, kind)[None, None])[0, 0] for v in variants(CLOTH['cinderHorde'], side_lim(lim, 'cinderHorde', sym), st)]
            B = [to_lab(simulate(v, kind)[None, None])[0, 0] for v in variants(CLOTH['thornwood'], side_lim(lim, 'thornwood', sym), st)]
            mins[label] = round(min(de2000(a, b) for a in A for b in B), 1)
        res[kind] = dict(cloths=round(base, 1), keylines=round(kl, 1), **mins)
    return res


def main():
    shots = sys.argv[1]
    meta = json.load(open(os.path.join(shots, 'var-shots.json')))
    out = dict(variety=variety(shots, meta['layouts']['lineup-A8A784']),
               blocksPlains=blocks(shots, meta['layouts']['play-A8A784'], 'play', '#A8A784'),
               blocksSwamp=blocks(shots, meta['layouts']['play-8E8E78'], 'play', '#8E8E78'),
               cvd=cvd(meta['limits']), perf=meta['perfPlay'], limits=meta['limits'])
    print(json.dumps(out, indent=1))
    json.dump(out, open(os.path.join(shots, '..', '..', 'work', 'variation.json'), 'w'), indent=1)


if __name__ == '__main__':
    main()
