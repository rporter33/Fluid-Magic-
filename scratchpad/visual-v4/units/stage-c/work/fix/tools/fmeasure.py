# Stage C fix pass: the critique's measurements, on one copy of the stage C atlases (before: pre-fix/units/stage-c,
# after: the live stage-c), so every fix reports its number before and after with the same code.
# Usage: python3 -I fmeasure.py ROOT OUT.json     (ROOT = a directory holding atlas/creatures and atlas/gods)
import json, os, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
UNITS = os.path.abspath(os.path.join(HERE, '..', '..', '..', '..'))
sys.path.insert(0, os.path.join(UNITS, 'stage-c', 'work', 'creatures', 'tools'))
from v4color import to_oklab, oklch  # noqa: E402


def atlas(root, fam, tier):
    out, i = {}, 0
    while os.path.exists(os.path.join(root, 'atlas', 'creatures', f'{fam}-{tier}.{i}.json')):
        j = json.load(open(os.path.join(root, 'atlas', 'creatures', f'{fam}-{tier}.{i}.json')))
        im = np.asarray(Image.open(os.path.join(root, 'atlas', 'creatures', f'{fam}-{tier}.{i}.png')).convert('RGBA')).astype(np.float64)
        for n, f in j['frames'].items():
            r = f['frame']; out[n] = im[r['y']:r['y'] + r['h'], r['x']:r['x'] + r['w']]
        i += 1
    return out


def hue_share(rgba, lo, hi, cmin=0.02, amin=128):
    _, C, h = oklch(rgba[..., :3])
    vis = rgba[..., 3] > amin
    inside = ((h - lo) % 360) <= ((hi - lo) % 360)
    return float((inside & (C > cmin) & vis).sum() / max(1, vis.sum()))


def cloth_mask(rgba):
    _, C, h = oklch(rgba[..., :3])
    return (h >= 90) & (h <= 230) & (C > 0.03) & (rgba[..., 3] > 128)


def coat_cells(frames, prefix):
    """The critique's coat measure: median OKLab a, b (x100) of the lower half of each frame (alpha > 0.5), cloth excluded."""
    out = {}
    for n, f in frames.items():
        if not n.startswith(prefix) or n.endswith('.white'):
            continue
        a = f[..., 3] > 127
        ys = np.nonzero(a.any(1))[0]
        if len(ys) < 4:
            continue
        mid = (ys.min() + ys.max()) // 2
        m = a.copy(); m[:mid] = False
        m &= ~cloth_mask(f)
        if m.sum() < 20:
            continue
        lab = to_oklab(f[..., :3])[m]
        out[n.split('.', 2)[2]] = [round(float(np.median(lab[:, 1])) * 100, 2), round(float(np.median(lab[:, 2])) * 100, 2), round(float(np.median(lab[:, 0])), 3)]
    return out


def cloth_L(f):
    m = cloth_mask(f)
    return round(float(np.median(to_oklab(f[..., :3])[..., 0][m])), 3) if m.sum() > 10 else None


def size(f):
    a = f[..., 3] > 127
    ys, xs = np.nonzero(a)
    return [int(xs.max() - xs.min() + 1), int(ys.max() - ys.min() + 1)]


def cut_top(png):
    a = np.asarray(Image.open(png).convert('RGBA'))[..., 3]
    rows = np.nonzero((a > 128).any(1))[0]
    top = int(rows.min())
    row = a[top] > 200
    run = best = 0
    for v in row:
        run = run + 1 if v else 0; best = max(best, run)
    return dict(topPadPx=top, topRowOpaqueRunPx=int(best), height=int(a.shape[0]))


def main(root, out):
    R = {}
    # fix 1: the hornet's teal share at tier S (hue 150 to 210) and at tier H
    for t in ('S', 'H'):
        fr = atlas(root, 'hornetSwarm', t)
        R[f'hornetTeal{t}'] = round(max(hue_share(f, 150, 210) for n, f in fr.items() if not n.endswith('.white')), 4)
        R[f'hornetTeal{t}_up0'] = round(hue_share(fr['hornetSwarm.back.up0'], 150, 210), 4)
        R[f'hornetAmber{t}_up0'] = round(hue_share(fr['hornetSwarm.back.up0'], 50, 90, 0.04), 4)
        R[f'hornetMeanL{t}_up0'] = round(float(np.median(to_oklab(fr['hornetSwarm.back.up0'][..., :3])[..., 0][fr['hornetSwarm.back.up0'][..., 3] > 128])), 3)
    # fix 2: the Wolf Rider front coat per cell and cloth lightness (tier H frames)
    wr = atlas(root, 'wolfRider', 'H')
    for v in ('front', 'frontKept', 'back'):
        c = coat_cells(wr, f'wolfRider.{v}.')
        bs = [x[1] for k, x in c.items() if k not in ('deadA', 'deadB')]
        R[f'wolfRider.{v}.coat'] = c
        R[f'wolfRider.{v}.coatSpreadB'] = round(max(bs) - min(bs), 2) if bs else None
        R[f'wolfRider.{v}.clothL_stand'] = cloth_L(wr[f'wolfRider.{v}.stand'])
    # fix 7: sizes at tier S
    wrS, wolfS = atlas(root, 'wolfRider', 'S'), atlas(root, 'wolf', 'S')
    R['warWolfBoltA_S'] = size(wrS['wolfRider.front.boltA'])
    R['wolfStand_S'] = size(wolfS['wolf.front.stand'])
    R['wolfRiderStandFront_S'] = size(wrS['wolfRider.front.stand'])
    R['wolfRiderStandBack_S'] = size(wrS['wolfRider.back.stand'])
    fj = json.load(open(os.path.join(root, 'atlas', 'creatures', 'figures', 'wolfRider.json')))
    R['wolfRiderStandPx'] = {v: x['atlas']['S']['standPx'] for v, x in fj['views'].items()}
    # fix 12: the Wolf's mauve rim (hue 330 to 10)
    for v in ('front', 'back'):
        R[f'wolfMauve.{v}'] = round(hue_share(wolfS[f'wolf.{v}.stand'], 330, 10, 0.015), 4)
        R[f'wolfMauveH.{v}'] = round(hue_share(atlas(root, 'wolf', 'H')[f'wolf.{v}.stand'], 330, 10, 0.015), 4)
    # fix 5: the Treants' cut crowns (the full-resolution cutout's top row)
    for fig, v in (('treant-04', 'front'), ('treant-04', 'back'), ('treant-02', 'back'), ('treant-02', 'front'), ('treant-01', 'back')):
        m = json.load(open(os.path.join(root, 'atlas', 'creatures', 'figures', f'{fig}.json')))
        p = os.path.join(root, 'atlas', 'creatures', m['views'][v]['idle'])
        R[f'{fig}.{v}.crown'] = dict(cut_top(p), heightWu=m['views'][v]['heightWu'], job=m['views'][v]['job'])
    # gods: sizes on screen (tier S box, wu), factor
    G = json.load(open(os.path.join(root, 'atlas', 'gods', 'gods.json')))
    for fig in ('ascendedHero-cinderHorde', 'oracle-cinderHorde', 'wildSpirit-thornwood', 'ashColossus-cinderHorde', 'livingMonolith-cinderHorde',
                'greatWyrm-thornwood', 'emberHierophant-cinderHorde', 'hornedHunter-thornwood'):
        f = G['figures'][fig]
        for v in ('front', 'back'):
            x = f['views'][v]
            im = np.asarray(Image.open(os.path.join(root, 'atlas', 'gods', x['tiers']['S']['file'])).convert('RGBA')).astype(np.float64)
            w, h = size(im)
            R[f'{fig}.{v}'] = dict(heightWu=x['heightWu'], tierS=[w, h], boxWu=[round((w - 2) * 0.5, 1), round((h - 2) * 0.5, 1)],
                                  failed=x.get('failed'), status=x.get('status'), factor=x.get('commanderFactor'),
                                  camera={k: x['checks']['camera'].get(k) for k in ('iou', 'facingMargin', 'aspectRatio', 'headDx', 'guideHeadDx')},
                                  identity=x['checks'].get('identity'))
            if fig == 'hornedHunter-thornwood':
                full = np.asarray(Image.open(os.path.join(root, 'atlas', 'gods', x['cutout'])).convert('RGBA')).astype(np.float64)
                hh, ww = full.shape[:2]
                box = full[int(hh * 0.12):int(hh * 0.42), :]  # the shoulders' band
                R[f'{fig}.{v}']['tealShoulders'] = round(hue_share(box, 170, 200, 0.04), 4)
            if fig == 'ashColossus-cinderHorde':
                full = np.asarray(Image.open(os.path.join(root, 'atlas', 'gods', x['cutout'])).convert('RGBA')).astype(np.float64)
                L = to_oklab(full[..., :3])[..., 0][full[..., 3] > 230]
                R[f'{fig}.{v}']['medianL'] = round(float(np.median(L)), 3)
                R[f'{fig}.{v}']['widthToHeight'] = round(w / h, 3)
    json.dump(R, open(out, 'w'), indent=1)
    print(json.dumps(R, indent=None)[:4000])


if __name__ == '__main__':
    main(*sys.argv[1:3])
