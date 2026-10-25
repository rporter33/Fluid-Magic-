# The key's cast painted into a figure (stage B fix pass, critique fix 9). key.py removes the key where it is mixed into
# the edge (despill, the calibration's thin-feature hue_despill); it cannot see the key's hue when the generator painted
# it into the figure itself, because such paint does not lean toward the key in RGB:
#   - on the green key, Cinder javelin bundles and scarf ends come out olive and yellow-green (hue 85 to 175 degrees);
#     a Cinder kit holds no green at all, so on a green-keyed Cinder figure every such pixel is the key's cast;
#   - on the magenta key, staffs, bows and spear shafts (thin features) come out rose and salmon (hue 350 to 45 degrees):
#     the "pink staff". Skin and lips share those hues, so only thin features (narrower than the opening) are touched;
#   - on the blue key, thin features keep a blue-violet cast (hue 215 to 300); it is desaturated.
# The cast pixels are turned to the kit's warm wood and leather hue, their lightness and brush strokes kept, their chroma
# reduced; the window's edges are ramped so no seam shows. A frames post-pass at sheet resolution (after slice and the
# rim fix, before the hue lock and the packer), like ad_rimfix.py and cmdb_magrim.py.
# Usage: python3 -I keycast.py KEY IN_DIR OUT_DIR [--whole | --thin K]   (every .png; .json copied; prints the shares)
import json, os, shutil, sys
import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, '..', '..', 'tools'))
from v4color import to_oklab  # noqa: E402
from pack import oklab_to_srgb  # noqa: E402

# per key: hue window (degrees, may wrap), ramp width, chroma floor, target hue (None: desaturate), chroma factor, scope
RULES = {
    # key.py's despill caps a green-cast pixel's hue near 112 degrees, so the cast shows as olive; light yellows (fire,
    # L above 0.75) are the Cinder kit's own and are never touched
    'green': dict(lo=85.0, hi=175.0, ramp=10.0, cmin=0.02, to=70.0, cf=0.75, scope='whole', lmax=0.75),
    'magenta': dict(lo=350.0, hi=45.0, ramp=8.0, cmin=0.02, to=58.0, cf=0.85, scope='thin'),
    'blue': dict(lo=215.0, hi=300.0, ramp=10.0, cmin=0.02, to=None, cf=0.3, scope='thin'),
}


def thin_mask(alpha, k=9):
    """Opaque pixels of features narrower than k px (an opening removes them), grown by 1 px into the feature's edge."""
    solid = alpha > 128
    m = Image.fromarray((solid * 255).astype(np.uint8))
    op = np.asarray(m.filter(ImageFilter.MinFilter(k)).filter(ImageFilter.MaxFilter(k))) > 127
    thin = solid & ~op
    grown = np.asarray(Image.fromarray((thin * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))) > 127
    return grown & (alpha > 0)


def window(h, r):
    """1 inside the hue window, ramping to 0 over r['ramp'] degrees outside it."""
    span = (r['hi'] - r['lo']) % 360
    d = (h - r['lo']) % 360
    inside = d <= span
    out_lo = (r['lo'] - h) % 360   # degrees below lo
    out_hi = (h - r['hi']) % 360   # degrees above hi
    dist = np.where(inside, 0.0, np.minimum(out_lo, out_hi))
    return np.clip(1 - dist / r['ramp'], 0, 1)


def fix(rgba, key, scope=None, k=9):
    r = RULES[key]
    scope = scope or r['scope']
    lab = to_oklab(rgba[..., :3])
    C = np.hypot(lab[..., 1], lab[..., 2])
    h = np.degrees(np.arctan2(lab[..., 2], lab[..., 1])) % 360
    w = window(h, r) * np.clip((C - r['cmin']) / 0.015, 0, 1) * (rgba[..., 3] > 0)
    if r.get('lmax'):
        w = w * np.clip((r['lmax'] + 0.05 - lab[..., 0]) / 0.05, 0, 1)
    if scope == 'thin':
        w = w * thin_mask(rgba[..., 3], k)
    if r['to'] is None:
        a2, b2 = lab[..., 1] * r['cf'], lab[..., 2] * r['cf']
    else:
        t = np.radians(r['to'])
        a2, b2 = C * r['cf'] * np.cos(t), C * r['cf'] * np.sin(t)
    lab2 = np.dstack([lab[..., 0], lab[..., 1] + w * (a2 - lab[..., 1]), lab[..., 2] + w * (b2 - lab[..., 2])])
    out = rgba.copy()
    out[..., :3] = np.where(w[..., None] > 0, oklab_to_srgb(lab2), rgba[..., :3])
    vis = rgba[..., 3] > 128
    return out, float((w[vis] > 0.5).sum() / max(1, vis.sum()))


def run_dir(key, src, dst, scope=None, k=9):
    os.makedirs(dst, exist_ok=True)
    shares = {}
    for f in sorted(os.listdir(src)):
        p = os.path.join(src, f)
        if f.endswith('.png'):
            rgba = np.asarray(Image.open(p).convert('RGBA')).astype(np.float64)
            if f.endswith('.white.png'):
                out, s = rgba, 0.0
            else:
                out, s = fix(rgba, key, scope, k)
            Image.fromarray(np.clip(out + 0.5, 0, 255).astype(np.uint8), 'RGBA').save(os.path.join(dst, f))
            shares[f] = round(s, 4)
        elif f.endswith('.json') and os.path.abspath(src) != os.path.abspath(dst):
            shutil.copy(p, os.path.join(dst, f))
    return shares


if __name__ == '__main__':
    a = sys.argv[1:]
    scope, k = None, 9
    if '--whole' in a:
        a.remove('--whole'); scope = 'whole'
    if '--thin' in a:
        i = a.index('--thin'); k = int(a[i + 1]); del a[i:i + 2]; scope = 'thin'
    sh = run_dir(a[0], a[1], a[2], scope, k)
    print(json.dumps(dict(key=a[0], scope=scope or RULES[a[0]]['scope'], maxShare=max(sh.values()) if sh else 0,
                          meanShare=round(sum(sh.values()) / max(1, len(sh)), 4))))
