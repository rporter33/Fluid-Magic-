# Stage B, key "cmdA": the blue key's rim, a post-pass after ad_rimfix on blue-keyed frames. key.py's blue despill clamps
# B to max(R, G); a warm brown edge blended with the blue key (R > G, B high) then keeps B = R and turns a dark mauve,
# a thin lavender-purple outline that the rim measure (opaque ring only) and edgeDevPct (distance > 0.10) do not see.
# On the edge (alpha below 0.97) and on the opaque ring within 2 px of it, B is clamped to min(R, G) + 0.25 (max - min),
# which leaves neutral greys and the warm paint's own blue alone and takes the mauve out.
# Usage: python3 cmda_bluerim.py IN_DIR OUT_DIR   (every .png; .json copied)
import os, shutil, sys
import numpy as np
from PIL import Image, ImageFilter


def fix(rgba):
    a = rgba[..., 3] / 255
    trans = (a < 0.5).astype(np.uint8) * 255
    near = np.asarray(Image.fromarray(trans).filter(ImageFilter.MaxFilter(5))) > 127
    zone = ((a > 0) & (a < 0.97)) | (near & (a > 0))
    r, g, b = rgba[..., 0], rgba[..., 1], rgba[..., 2]
    lo, hi = np.minimum(r, g), np.maximum(r, g)
    cap = lo + 0.25 * (hi - lo)
    nb = np.where(zone & (b > cap), cap, b)
    out = rgba.copy(); out[..., 2] = nb
    return out, float((zone & (b > cap)).sum() / max(1, zone.sum()))


if __name__ == '__main__':
    src, dst = sys.argv[1:3]
    os.makedirs(dst, exist_ok=True)
    for f in sorted(os.listdir(src)):
        if f.endswith('.png'):
            im = np.asarray(Image.open(os.path.join(src, f)).convert('RGBA')).astype(np.float64)
            out, s = fix(im)
            Image.fromarray(np.clip(out + 0.5, 0, 255).astype(np.uint8), 'RGBA').save(os.path.join(dst, f))
        elif f.endswith('.json') and os.path.abspath(src) != os.path.abspath(dst):
            shutil.copy(os.path.join(src, f), os.path.join(dst, f))
