# Stage B troops: the three banners (plan 6: the pennant is a painted banner cloth on an 8 x 2 mesh strip with a travelling
# sine). Each raw banner is keyed (the stage B keyer), trimmed, hue-locked for Thornwood (change 9), measured and written
# at 1024, 256 and 128 px wide with a sidecar: the pole edge (left), the 8 x 2 strip's vertices in UV (the game waves the
# free end; column 0 stays pinned to the pole), the sha256 of the source, and the checks:
#   shape  - aspect (width / height) between 2.0 and 4.5 (the prompt asked about 3.5; the 8 x 2 strip works at any aspect
#            of 2 or more, so a shorter pennant is flagged, not failed) and the swallowtail notch present (a transparent wedge in the
#            right third, mid-height);
#   side   - the share of the cloth in the side's hue window (>= 45%; independents: no pixel share in either nation's
#            window above 2%);
#   fringe - keyInUnit <= 0.5 and edgeDev <= 8.
# Usage: python3 tr_banners.py RAW_DIR OUT_DIR
import hashlib, json, os, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from key import key_image  # noqa: E402
import tr_huelock  # noqa: E402
from v4color import oklch  # noqa: E402

CLOTH = {'cinderHorde': '#C4532C', 'thornwood': '#1F6A50', 'independent': '#8C8A80'}
KEY = {'cinderHorde': 'green', 'thornwood': 'magenta', 'independent': 'magenta'}
SYMBOL = {'cinderHorde': 'a black flame', 'thornwood': 'a pale five-pointed leaf', 'independent': 'a plain shield'}


def hue_share(rgba, hexc):
    hx = np.array([[[int(hexc[i:i + 2], 16) for i in (1, 3, 5)]]], np.float64)
    _, cc, ch = oklch(hx)
    _, C, h = oklch(rgba[..., :3])
    dh = np.abs((h - float(ch[0, 0]) + 180) % 360 - 180)
    m = (dh <= 20) & (C >= max(0.04, 0.45 * float(cc[0, 0]))) & (rgba[..., 3] > 200)
    return float(m.sum() / max(1, (rgba[..., 3] > 200).sum()))


def main(raw_dir, out):
    os.makedirs(out, exist_ok=True)
    rep = {}
    for nat in ('cinderHorde', 'thornwood', 'independent'):
        src = os.path.join(raw_dir, f'n1.banner-{nat}.nb21.png')
        rgba01, krep = key_image(src, KEY[nat], erode=1)
        rgba = rgba01.copy(); rgba[..., :3] *= 255; rgba[..., 3] *= 255
        from ad_rimfix import fix as rimfix  # the key-hue rim on the cloth's edge (review change 15)
        rgba, _ = rimfix(rgba, KEY[nat])
        # key-coloured specks left in the frayed edges and burn holes (no banner has the key's hue anywhere in its paint):
        # pixels within 30 degrees of the key's hue at chroma >= 0.05 become transparent
        _, Cb, hb = oklch(rgba[..., :3])
        kh = {'green': 142.0, 'magenta': 328.0}[KEY[nat]]
        speck = (np.abs((hb - kh + 180) % 360 - 180) <= 30) & (Cb >= 0.05)
        rgba[..., 3] = np.where(speck, 0, rgba[..., 3])
        if nat in tr_huelock.RULES:
            rgba, locked = tr_huelock.lock(rgba, nat, pale_fade=True)
        a = rgba[..., 3] > 128
        ys, xs = np.nonzero(a)
        rgba = rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
        a = rgba[..., 3] > 128
        H, Wd = a.shape
        # the notch: transparent pixels in the right third around mid-height
        band = a[int(0.4 * H):int(0.6 * H), int(0.75 * Wd):]
        notch = float(1 - band.mean())
        if nat == 'independent':
            side = {n: round(hue_share(rgba, CLOTH[n]), 3) for n in ('cinderHorde', 'thornwood')}
            side_ok = max(side.values()) <= 0.02
        else:
            side = round(hue_share(rgba, CLOTH[nat]), 3)
            side_ok = side >= 0.45
        checks = dict(aspect=round(Wd / H, 2), notchShare=round(notch, 2), side=side, keyInUnitPct=krep['keyInUnitPct'],
                      edgeDevPct=krep['edgeDevPct'])
        checks["aspectAsked"] = 3.5
        checks["pass"] = bool(2.0 <= Wd / H <= 4.5 and notch >= 0.3 and side_ok and krep['keyInUnitPct'] <= 0.5
                              and (krep['edgeDevPct'] or 0) <= 8)
        files = {}
        img = Image.fromarray(np.clip(rgba + 0.5, 0, 255).astype(np.uint8), 'RGBA')
        for w in (1024, 256, 128):
            k = w / img.width
            # premultiplied downscale (no key or black pulled into the edge)
            pm = np.asarray(img).astype(np.float64); al = pm[..., 3:4] / 255
            pmi = Image.fromarray(np.clip(np.dstack([pm[..., :3] * al, pm[..., 3]]), 0, 255).astype(np.uint8), 'RGBA')
            s = np.asarray(pmi.resize((w, max(1, round(img.height * k))), Image.LANCZOS)).astype(np.float64)
            al = s[..., 3:4] / 255
            s[..., :3] = np.where(al > 0, s[..., :3] / np.maximum(al, 1e-6), 0)
            fn = f'banner-{nat}.{w}.png'
            Image.fromarray(np.clip(s, 0, 255).astype(np.uint8), 'RGBA').save(os.path.join(out, fn))
            files[str(w)] = fn
        side_meta = json.load(open(src.replace('.png', '.json')))
        meta = dict(id=f'banner-{nat}', nation=nat, symbol=SYMBOL[nat], cloth=CLOTH[nat], files=files,
                    size=[img.width, img.height], poleEdge='left',
                    mesh=dict(cols=8, rows=2, pinnedColumn=0,
                              uv=[[round(c / 8, 4), round(r / 2, 4)] for r in range(3) for c in range(9)],
                              note='the game draws the pole and waves the strip with a travelling sine; column 0 stays on the pole'),
                    source=dict(file=os.path.relpath(src, os.path.dirname(os.path.dirname(raw_dir))),
                                sha256=hashlib.sha256(open(src, 'rb').read()).hexdigest(), model=side_meta.get('model'),
                                prompt=side_meta.get('promptFile')),
                    hueLocked=nat in tr_huelock.RULES, checks=checks, approved=None)
        json.dump(meta, open(os.path.join(out, f'banner-{nat}.json'), 'w'), indent=1)
        rep[nat] = checks
    print(json.dumps(rep, indent=1))


if __name__ == '__main__':
    main(*sys.argv[1:3])
