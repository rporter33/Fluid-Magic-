# Stage C gods: the Thornwood palette of a generic god as a tint-zone edit of its Cinder figure (owner, 2026-10-24: "a
# pick for a god covers both nations' palettes: the Thornwood version is the green edit of the same painting"). No new
# generation and no new body: the Cinder cutout's tint zone (the pixels at the zone's own ember hue and chroma, a soft
# mask cleaned of specks) is moved in OKLCH by the same transform the owner-approved portrait edit made, measured on
# that portrait pair (stage-b/portraits/{cinderHorde,thornwood}/<god>/<pick>): lightness L' = a L + b (fitted), chroma
# times the pair's median ratio, hue turned by the pair's median shift. Every other pixel is left exactly as painted.
# Writes the edited keyed image, a mask proof, and runs gd_post on it as <god>-thornwood.
# Usage: python3 -I gd_tint.py GOD VIEW CINDER_TAG
import json, os, shutil, sys
import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from picks import resolve, UNITS  # noqa: E402
sys.path.insert(0, os.path.join(UNITS, 'tools'))
sys.path.insert(0, os.path.join(UNITS, '..', 'tools'))
from v4color import to_oklab, oklch  # noqa: E402
from pack import oklab_to_srgb  # noqa: E402
import slice as slicer  # noqa: E402

W = os.path.abspath(os.path.join(HERE, '..'))


def pair_transform(god):
    """The owner-approved portrait edit, measured: the zone is where the Thornwood portrait differs from the Cinder one
    (OKLab distance > 0.06) at a Cinder chroma above 0.05."""
    R = resolve()
    c = np.asarray(Image.open(R[god]['cinderHorde']['source']).convert('RGB').resize((512, 512))).astype(float)
    t = np.asarray(Image.open(R[god]['thornwood']['source']).convert('RGB').resize((512, 512))).astype(float)
    d = np.linalg.norm(to_oklab(c) - to_oklab(t), axis=-1)
    Lc, Cc, hc = oklch(c); Lt, Ct, ht = oklch(t)
    z = (d > 0.06) & (Cc > 0.05)
    a, b = np.polyfit(Lc[z], Lt[z], 1)
    # the portrait edit's own green, raised into the Thornwood cloth window (166 +- 25 deg, 5 deg inside it) where the
    # portrait's sat below it (Living Monolith 131, Primordial 139: their portraits passed the lock but not the window)
    hT = float(np.median(ht[z])); hT2 = max(hT, 146.0)
    return dict(La=float(a), Lb=float(b), Cratio=float(np.median(Ct[z] / np.maximum(Cc[z], 1e-3))),
                hueC=float(np.median(hc[z])), hueT=hT, hueTarget=hT2, dHue=float(hT2 - np.median(hc[z])),
                zonePx=int(z.sum()), portraitPair=[R[god]['cinderHorde']['job'], R[god]['thornwood']['job']])


# per body: the Primordial's brown hide sits a few degrees yellower than its ember moss at low chroma (C 0.03 to 0.06,
# hue 50 to 75, against the moss's C 0.09+ at hue 48), so its mask needs a fixed chroma floor and a tighter yellow side
MASK = {'primordial': dict(c0=0.065, up=(5.0, 9.0))}


def zone_mask(rgba, hue_c, god=None):
    """A soft mask of the figure's tint zone: hue from 14 below to 8 above the zone's own hue at full weight (fading out
    by 24 below and 14 above: redder shadowed cloth is still the zone, the yellower bronze, hide, gold and skin are not),
    chroma ramping up over 0.03 from a floor that rises with lightness (0.025 for dark shadowed membranes, 0.075 for
    light pixels), opaque pixels; then cleaned: components under 60 px dropped and the mask blurred 1 px."""
    a = rgba[..., 3] / 255
    L, C, h = oklch(rgba[..., :3])
    # the zone's own hue on this figure: the median of strong pixels near the portrait's zone hue
    near = (np.abs((h - hue_c + 180) % 360 - 180) <= 18) & (C > 0.08) & (a > 0.9)
    hz = float(np.median(h[near])) if near.sum() > 200 else hue_c
    dh = (h - hz + 180) % 360 - 180
    o = MASK.get(god, {})
    u0, u1 = o.get('up', (8.0, 14.0))
    wh = np.where(dh < 0, np.clip((24 + dh) / 10, 0, 1), np.clip((u1 - dh) / (u1 - u0), 0, 1))
    c0 = o['c0'] if 'c0' in o else 0.025 + 0.05 * np.clip((L - 0.35) / 0.25, 0, 1)
    wc = np.clip((C - c0) / 0.03, 0, 1)
    m = wh * wc * (a > 0.02)
    hard = m > 0.5
    lab = slicer.label(hard)
    ids, n = np.unique(lab[lab > 0], return_counts=True)
    small = np.isin(lab, ids[n < 60])
    m = np.where(small, 0, m)
    m = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.0))).astype(float) / 255
    return np.minimum(m, wh), hz


def recolor(rgba, T, m):
    lab = to_oklab(np.clip(rgba[..., :3], 0, 255))
    L = lab[..., 0]; C = np.hypot(lab[..., 1], lab[..., 2]); h = np.degrees(np.arctan2(lab[..., 2], lab[..., 1]))
    L2 = T['La'] * L + T['Lb']; C2 = C * T['Cratio']; h2 = np.radians(h + T['dHue'])
    new = np.dstack([L2, C2 * np.cos(h2), C2 * np.sin(h2)])
    out = lab * (1 - m[..., None]) + new * m[..., None]
    rgb = oklab_to_srgb(out)
    return np.dstack([np.clip(rgb, 0, 255), rgba[..., 3]])


def main(god, view, ctag):
    T = pair_transform(god)
    cdir = os.path.join(W, 'cut', ctag)
    keyed = os.path.join(cdir, f'{ctag}.keyed.png')
    rgba = np.asarray(Image.open(keyed).convert('RGBA')).astype(np.float64)
    m, hz = zone_mask(rgba, T['hueC'], god)
    out = recolor(rgba, T, m)
    ttag = f'{god}.{view}.thornwood'
    tdir = os.path.join(W, 'cut', ttag)
    os.makedirs(tdir, exist_ok=True)
    tkeyed = os.path.join(tdir, f'{ttag}.keyed.png')
    Image.fromarray(np.clip(out + 0.5, 0, 255).astype(np.uint8), 'RGBA').save(tkeyed)
    shutil.copy(os.path.join(cdir, 'key.json'), os.path.join(tdir, 'key.json'))
    T.update(figureZoneHue=round(hz, 1), maskShare=round(float((m > 0.5).sum() / max(1, (rgba[..., 3] > 230).sum())), 4),
             source=os.path.relpath(keyed, UNITS))
    json.dump(T, open(os.path.join(tdir, 'tint.json'), 'w'), indent=1)
    # mask proof: the Cinder figure, the mask in magenta over it, the Thornwood result, on grey
    bg = np.array([90, 90, 90.])
    a = rgba[..., 3:4] / 255
    p1 = rgba[..., :3] * a + bg * (1 - a)
    p2 = p1 * (1 - m[..., None]) + np.array([255, 0, 255.]) * m[..., None]
    p3 = out[..., :3] * a + bg * (1 - a)
    proof = np.concatenate([p1, p2, p3], 1)
    im = Image.fromarray(np.clip(proof, 0, 255).astype(np.uint8))
    im.thumbnail((2400, 1200))
    im.save(os.path.join(tdir, 'mask-proof.png'))
    import gd_post
    raw = json.load(open(os.path.join(cdir, 'checks.json')))['raw']
    rep = gd_post.process(god, view, os.path.join(UNITS, raw), fig=f'{god}-thornwood', nation='thornwood', keyed=tkeyed, tag=ttag)
    rep['tint'] = T
    json.dump(rep, open(os.path.join(tdir, 'checks.json'), 'w'), indent=1)
    print(json.dumps({k: rep[k] for k in ('god', 'view', 'pass', 'failed')}), json.dumps(rep['side']), 'value', rep['value']['worstBelow'],
          'identity', rep['identity'], 'mask', T['maskShare'], 'dHue', round(T['dHue'], 1))


if __name__ == '__main__':
    main(*sys.argv[1:4])
