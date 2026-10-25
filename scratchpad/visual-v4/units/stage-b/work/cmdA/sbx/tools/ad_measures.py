# Art director's measures on the pilot picks (pilot-review.md). Read-only on the pilot's files.
#   side   - side share at f = 28 px (checks.side_report) for: as painted, cloth normalisation (pack.cloth_boost),
#            a side-tinted keyline (the atlas keyline drawn in the side's dark cloth shade instead of #1C1A17), both
#   rim    - the keyer's leftover rim: the share of the opaque boundary ring (alpha >= 0.97, within 2 px of alpha < 0.5)
#            whose OKLCH hue has moved more than 20 degrees from the paint 3 to 5 px inside, toward the key's hue (an
#            orange edge mixed with green and then despilled turns yellow-olive; edgeDevPct only looks at alpha 0.3
#            to 0.97 and misses it)
# Usage: python3 -I ad_measures.py side|rim FRAME.png ...
import json, os, sys
import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, '..', '..', 'tools'))
import checks  # noqa: E402
from pack import cloth_boost  # noqa: E402

UNITS = json.load(open(os.path.join(HERE, '..', 'units.json')))
SHADE = {'cinderHorde': '#7E3118', 'thornwood': '#113F2F'}
KEYS = {'green': np.array([0, 255, 0.]), 'magenta': np.array([255, 0, 255.]), 'blue': np.array([0, 0, 255.])}
_orig_keyline = checks.keyline


def tinted_keyline(ink_hex, alpha=0.75):
    ink = checks.hexrgb(ink_hex)

    def kl(rgba):
        a = rgba[..., 3] / 255
        grown = np.asarray(Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))).astype(np.float64) / 255
        la = np.clip(grown * alpha, 0, 1)
        out_a = a + la * (1 - a)
        rgb = (rgba[..., :3] * a[..., None] + ink * la[..., None] * (1 - a[..., None])) / np.maximum(out_a[..., None], 1e-6)
        return np.dstack([rgb, out_a * 255])
    return kl


def figure_meta(png):
    d = os.path.dirname(png)
    base = os.path.basename(png)
    fig, view, name = base[:-4].split('.')[:3]
    meta = json.load(open(os.path.join(d, f'{fig}.{view}.json')))
    f = next(x for x in meta['frames'] if x['file'] == base)
    u = next(x for x in UNITS['units'] if x['id'] == fig)
    return fig, view, f, u


def side(pngs):
    out = {}
    for png in pngs:
        fig, view, f, u = figure_meta(png)
        cloth = UNITS['nations'][u['nation']]['cloth']['hex']
        kind = 'wedge' if u['layout'] in ('cavalry', 'wolfrider') else (u.get('formation') or 'heavy')
        rgba = checks.load(png)
        boosted, _ = cloth_boost(rgba.copy(), cloth)
        res = {}
        for label, img, kl in (('painted', rgba, _orig_keyline), ('normalised', boosted, _orig_keyline),
                               ('sideKeyline', rgba, tinted_keyline(SHADE[u['nation']])),
                               ('normalised+sideKeyline', boosted, tinted_keyline(SHADE[u['nation']]))):
            checks.keyline = kl
            r = checks.side_report(img, f['anchor'], f['height'], cloth, kind)
            res[label] = dict(share=r['share'], worstBelow=min(r[g]['below'] for g in checks.GROUNDS))
        checks.keyline = _orig_keyline
        out[f'{fig}.{view}'] = res
    print(json.dumps(out, indent=1))


def rim(pngs, key='green'):
    out = {}
    K = KEYS[key]
    for png in pngs:
        rgba = checks.load(png)
        a = rgba[..., 3] / 255
        rgb = rgba[..., :3]
        trans = (a < 0.5).astype(np.uint8) * 255
        near = np.asarray(Image.fromarray(trans).filter(ImageFilter.MaxFilter(5))) > 127  # within 2 px of transparency
        ring = near & (a >= 0.97)
        # the colour 3 px further inside: the mean of opaque pixels that are 3 to 5 px from the transparency
        far = np.asarray(Image.fromarray(trans).filter(ImageFilter.MaxFilter(11))) > 127
        core = (~far) & (a >= 0.97)
        num = np.zeros_like(rgb); den = np.zeros(a.shape)
        for dy in range(-4, 5):
            for dx in range(-4, 5):
                num += np.roll(np.roll(rgb * core[..., None], dy, 0), dx, 1)
                den += np.roll(np.roll(core.astype(float), dy, 0), dx, 1)
        ok = ring & (den > 0)
        inner = num[ok] / den[ok][:, None]
        p = rgb[ok]
        from v4color import oklch
        _, Cp, hp = oklch(p[None])
        _, Ci, hi = oklch(inner[None])
        _, Ck, hk = oklch(K[None, None])
        Cp, hp, Ci, hi = Cp[0], hp[0], Ci[0], hi[0]
        d_pk = (hp - hi + 180) % 360 - 180          # how far the ring pixel's hue moved from the inside
        d_ik = (float(hk[0, 0]) - hi + 180) % 360 - 180  # the direction toward the key's hue
        toward = (np.sign(d_pk) == np.sign(d_ik)) & (np.abs(d_pk) > 20) & (np.abs(d_pk) <= np.abs(d_ik) + 10)
        mixed = toward & (Cp > 0.04) & (Ci > 0.04)
        out[os.path.basename(png)] = dict(ringPx=int(ok.sum()), keyHueShiftedPct=round(100 * float(mixed.mean()), 1),
                                          ofColouredRingPct=round(100 * float(mixed.sum() / max(1, ((Cp > 0.04) & (Ci > 0.04)).sum())), 1))
    print(json.dumps(out, indent=1))


if __name__ == '__main__':
    mode, args = sys.argv[1], sys.argv[2:]
    if mode == 'side':
        side(args)
    else:
        key = 'green'
        if '--key' in args:
            i = args.index('--key'); key = args[i + 1]; del args[i:i + 2]
        rim(args, key)
