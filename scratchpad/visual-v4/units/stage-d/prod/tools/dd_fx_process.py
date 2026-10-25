# Rest of stage D: keys and slices the new effect sheet candidates with the pilot's own cutter (stage-d/work/tools/
# fx_process.py: additive light on black -> premultiplied alpha; grey on black -> luminance as alpha; white -> the
# multiply form; a key colour -> units' keyer with despill and colour bleed), on this part's layouts (dd_fx.SHEETS).
# The blue-key billows (E7b) go through the same keyer as the magenta sheets, with the blue key. L5 (an opaque tile) is
# made seamless here: the image is offset by half its size and the seams are blended over a 96 px band with the original,
# then cut to 512 and 256 px tiles.
# Usage: python3 -I dd_fx_process.py [JOB ...]     (JOB like E1.a; default: every raw candidate of dd_fx.SHEETS)
import json, os, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import dd_fx  # noqa: E402  (puts the pilot's tools on the path)
import fx_process as FPR  # noqa: E402

FX = dd_fx.FX
STAGE = dd_fx.STAGE
FPR.SHEETS = dict(FPR.SHEETS, **dd_fx.SHEETS)
_KEY = ['magenta']


def _key_any(path):
    sys.path.insert(0, os.path.join(dd_fx.UNITS, 'stage-c', 'work', 'creatures', 'sbx', 'tools'))  # tools/key.py with --shafts
    from key import key_image
    rgba, rep = key_image(path, _KEY[0], 1)
    return rgba.astype(np.float32), rep


FPR.key_magenta = _key_any


def seamless(raw, outdir):
    im = np.asarray(Image.open(raw).convert('RGB')).astype(np.float32)
    h, w, _ = im.shape
    sh = np.roll(np.roll(im, h // 2, 0), w // 2, 1)  # the original seams now cross the middle
    band = 96
    yy, xx = np.mgrid[0:h, 0:w]
    dx = np.abs(xx - w / 2); dy = np.abs(yy - h / 2)
    wgt = np.clip(1 - np.minimum(dx, dy) / band, 0, 1)  # 1 on the middle cross, 0 beyond the band
    wgt = wgt * wgt * (3 - 2 * wgt)
    # under the cross, take the un-shifted image (whose middle is seamless); elsewhere the shifted one (seamless at its edges)
    out = sh * (1 - wgt[..., None]) + im * wgt[..., None]
    os.makedirs(outdir, exist_ok=True)
    full = Image.fromarray(np.clip(out + 0.5, 0, 255).astype(np.uint8))
    full.save(os.path.join(outdir, 'barkTile-1024.png'))
    for n in (512, 256):
        full.resize((n, n), Image.LANCZOS).save(os.path.join(outdir, f'barkTile-{n}.png'))
    # the seam check: the mean absolute step across the tile's wrapped edges against the mean step inside
    t = np.asarray(full).astype(np.float32)
    edge = (np.abs(t[0] - t[-1]).mean() + np.abs(t[:, 0] - t[:, -1]).mean()) / 2
    inner = (np.abs(t[1:] - t[:-1]).mean() + np.abs(t[:, 1:] - t[:, :-1]).mean()) / 2
    rep = dict(raw=os.path.abspath(raw), sheet='L5', blend='opaque', size=[w, h], seamStep=round(float(edge), 2), innerStep=round(float(inner), 2),
               meanRGB=[round(float(v), 1) for v in t.reshape(-1, 3).mean(0)],
               elements=[dict(name='barkTile', w=512, h=512, files=['barkTile-1024.png', 'barkTile-512.png', 'barkTile-256.png'])])
    json.dump(rep, open(os.path.join(outdir, 'cut.json'), 'w'), indent=1)
    return rep


def main(only):
    raws = sorted(f for f in os.listdir(os.path.join(STAGE, 'raw')) if f.endswith('.png') and f.split('.')[0] in dd_fx.SHEETS)
    for f in raws:
        sheet, cand = f.split('.')[:2]
        job = f'{sheet}.{cand}'
        if only and job not in only:
            continue
        raw = os.path.join(STAGE, 'raw', f)
        outdir = os.path.join(FX, 'cut', job)
        if sheet == 'L5':
            r = seamless(raw, outdir)
            print(job, 'seam', r['seamStep'], 'inner', r['innerStep'])
            continue
        _KEY[0] = 'blue' if dd_fx.SHEETS[sheet]['bg'] == 'blue' else 'magenta'
        r = FPR.process(raw, sheet, outdir)
        miss = [e['name'] for e in r['elements'] if e.get('missing')]
        edge = [e['name'] for e in r['elements'] if e.get('touchesSheetEdge')]
        k = r.get('key', {})
        print(job, 'stray', r['strayAlphaPct'], 'missing', miss, 'edge', edge, 'unowned', r['unownedComponents'],
              {x: k.get(x) for x in ('keyInUnitPct', 'fringePct', 'edgeDevPct') if x in k})


if __name__ == '__main__':
    main(sys.argv[1:])
