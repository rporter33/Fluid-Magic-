# Stage B, key "cmdB": the magenta key's rose cast, a post-pass after ad_rimfix on magenta-keyed frames (the twin of
# cmdA's cmda_bluerim.py for the blue key). key.py's magenta despill pulls R and B down by their common excess over G, so
# a brown staff, antler or edge blended with the magenta key comes out with B equal to G and R above them: a dusty rose
# (OKLCH hue 10 to 20 degrees) that the calibration left as "a slight mauve on the magenta-keyed staffs". Brown paint has
# B below G. In the thin-feature and edge zone (within 4 px of the transparent background), a pixel with that despill
# signature (|B - G| <= 3, R - G >= 10) gets B = G - 0.6 (R - G), the blue of the warm browns the sheets are painted in;
# its R and G (and so nearly all of its lightness) are kept. Greys (R = G = B) and every pixel inside the figure are
# left alone. Usage: python3 cmdb_magrim.py IN_DIR OUT_DIR   (every .png; .json copied)
import os, shutil, sys
import numpy as np
from PIL import Image, ImageFilter


def fix(rgba):
    a = rgba[..., 3] / 255
    trans = (a < 0.5).astype(np.uint8) * 255
    zone = (np.asarray(Image.fromarray(trans).filter(ImageFilter.MaxFilter(9))) > 127) & (a > 0)
    r, g, b = rgba[..., 0], rgba[..., 1], rgba[..., 2]
    sig = zone & (np.abs(b - g) <= 3) & (r - g >= 10)
    out = rgba.copy()
    out[..., 2] = np.where(sig, np.clip(g - 0.6 * (r - g), 0, 255), b)
    return out, int(sig.sum())


if __name__ == '__main__':
    src, dst = sys.argv[1:3]
    os.makedirs(dst, exist_ok=True)
    for f in sorted(os.listdir(src)):
        if f.endswith('.png'):
            im = np.asarray(Image.open(os.path.join(src, f)).convert('RGBA')).astype(np.float64)
            out, n = fix(im)
            Image.fromarray(np.clip(out + 0.5, 0, 255).astype(np.uint8), 'RGBA').save(os.path.join(dst, f))
        elif f.endswith('.json') and os.path.abspath(src) != os.path.abspath(dst):
            shutil.copy(os.path.join(src, f), os.path.join(dst, f))
