# hfref.py: fine-detail energy (mean |L - box5(L)|) and L* quantiles in regions of a reference or a shot, after scaling to a 1440 px game area
import sys, numpy as np
from PIL import Image
def lab_L(rgb):
    c = rgb / 255.0; c = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4); Y = c[..., 0] * 0.2126 + c[..., 1] * 0.7152 + c[..., 2] * 0.0722
    return np.where(Y > 0.008856, 116 * np.cbrt(Y) - 16, 903.3 * Y)
def box(L, r):
    k = 2 * r + 1; P = np.pad(L, r, mode='edge'); S = P.cumsum(0).cumsum(1); S = np.pad(S, ((1, 0), (1, 0)))
    return (S[k:, k:] - S[:-k, k:] - S[k:, :-k] + S[:-k, :-k]) / (k * k)
def hf(path, regions, scale):
    im = Image.open(path).convert('RGB'); im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS); a = np.asarray(im).astype(float); L = lab_L(a); B = box(L, 2); H = np.abs(L - B)
    out = {}
    for name, (x0, y0, x1, y1) in regions.items():
        X0, Y0, X1, Y1 = [round(v * scale) for v in (x0, y0, x1, y1)]; h = H[Y0:Y1, X0:X1]; l = L[Y0:Y1, X0:X1]
        out[name] = dict(hf=round(float(h.mean()), 2), Lp5=round(float(np.percentile(l, 5)), 1), Lp50=round(float(np.percentile(l, 50)), 1), Lp95=round(float(np.percentile(l, 95)), 1))
    return out
R = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-refs/'
s = 1440 / 2294
print('ref-2', hf(R + 'ref-2.png', {'mountains': (1990, 140, 2520, 640), 'land_forest_grass': (700, 650, 1750, 1100), 'forest': (850, 560, 1150, 700)}, s))
print('ref-4', hf(R + 'ref-4.png', {'mountains_ridge': (1080, 60, 1700, 380), 'land': (900, 600, 1500, 820), 'cliff': (420, 500, 700, 900)}, s))
