# Art director's anchor check for frames with no two feet to walk from (four-footed bodies, flyers, the rubble): the frame's
# silhouette is slid over the approved idle's at one scale (1 wu per px) and the best overlap (FFT cross-correlation of
# the masks, whole and lower half) gives the anchor the frame would have if its body stayed where the idle's stands.
# Prints, per frame, the shipped anchor's offset from that (in wu) and the overlap; used to find broken registrations.
import json, os, sys
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import dd_pack, dd_final  # noqa: E402


def mask(png, wpp, W=1.0):
    im = Image.open(png).convert('RGBA'); k = wpp / W
    return np.asarray(im.resize((max(1, int(im.width * k)), max(1, int(im.height * k))), Image.BILINEAR))[..., 3] > 127, k


def best_shift(a, b):
    """The shift (dx, dy) that puts b's pixels on a's with the largest overlap, and the IoU there."""
    H = a.shape[0] + b.shape[0]; W = a.shape[1] + b.shape[1]
    A = np.fft.rfft2(a.astype(np.float32), (H, W)); B = np.fft.rfft2(b.astype(np.float32), (H, W))
    c = np.fft.irfft2(A * np.conj(B), (H, W))
    iy, ix = np.unravel_index(np.argmax(c), c.shape)
    dy = iy if iy < a.shape[0] else iy - H
    dx = ix if ix < a.shape[1] else ix - W
    inter = c[iy, ix]
    return dx, dy, float(inter / (a.sum() + b.sum() - inter))


def check(fig, lower=False):
    out = []
    for (view, act, png, fr, j, tag, rep) in dd_pack.frames_of(fig):
        idle = dd_final.idle_rec(fig, view)
        ma, ka = mask(os.path.join(dd_final.UNITS, idle['file']), idle['wuPerPx'])
        mb, kb = mask(png, fr['wuPerPx'])
        if lower:
            ma = ma.copy(); mb = mb.copy()
            ya = np.nonzero(ma.any(1))[0]; yb = np.nonzero(mb.any(1))[0]
            ma[:int(ya[0] + 0.5 * (ya[-1] - ya[0]))] = False; mb[:int(yb[0] + 0.5 * (yb[-1] - yb[0]))] = False
        dx, dy, iou = best_shift(ma, mb)
        # idle anchor in wu-px; frame px p maps to idle px p + (dx, dy): implied frame anchor = idle anchor - shift
        ax_i, ay_i = idle['anchor'][0] * ka, idle['anchor'][1] * ka
        ax_f, ay_f = fr['anchor'][0] * kb, fr['anchor'][1] * kb
        out.append((view, act, fr.get('kind'), round(ax_f + dx - ax_i, 1), round(ay_f + dy - ay_i, 1), round(iou, 2)))
    return out


if __name__ == '__main__':
    lower = '--lower' in sys.argv
    for fig in [a for a in sys.argv[1:] if not a.startswith('--')]:
        for r in check(fig, lower):
            print(fig, *r)
