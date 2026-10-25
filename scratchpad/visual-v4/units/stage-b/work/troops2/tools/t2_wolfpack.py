# Stage B troops2: the Wolf Rider's two views packed at the calibration's mounted height (stage-b/calibration.md 4.1:
# hood to paws 32.7 wu, tier S 65 px, tier H 131 px; the calibration sandbox's pack.frames_of, the same call the
# integration bundle makes for the kept front), with the Thornwood cloth hue lock on both views:
#   front - the owner-kept pilot test (pilot/ad/frames/wolfRider.front, blue key), hue-locked as the fix pass did;
#   back  - the passing R29/R30 sheet's rim-fixed, hue-locked frames (work/troops2/sheets/<sheet>/frames).
# Writes atlas/troops/wolfRider/wolfRider-{S,H}.0.png/.json (tier S keyline in the side's shade #113F2F at 75%, tier H
# neutral), wolfRider.json (sizes measured back from the packed stand frames, provenance, checks) and a 4x size proof
# beside the foot troops' stand frames. Usage: python3 t2_wolfpack.py SHEET_NAME
import hashlib, json, os, sys
import numpy as np
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
W2 = os.path.abspath(os.path.join(HERE, '..'))
SB = os.path.abspath(os.path.join(W2, '..', '..'))
UNITS = os.path.abspath(os.path.join(SB, '..'))
CAL = os.path.join(SB, 'cal', 'sbx', 'tools')
sys.path.insert(0, CAL)
import pack as calpack  # noqa: E402
import checks as calchecks  # noqa: E402
from ad_measures import tinted_keyline  # noqa: E402
sys.path.insert(0, os.path.join(SB, 'work', 'troops', 'sbx', 'tools'))
import tr_huelock  # noqa: E402

OUT = os.path.join(SB, 'atlas', 'troops', 'wolfRider')
WU = {'S': 0.5, 'H': 0.25}


def main(sheet):
    os.makedirs(OUT, exist_ok=True)
    front_src = os.path.join(UNITS, 'pilot', 'ad', 'frames', 'wolfRider.front')
    front = os.path.join(W2, 'packw', 'wolfRider.front.locked')
    lock_front = tr_huelock.run_dir('thornwood', front_src, front)
    back = os.path.join(W2, 'sheets', sheet, 'frames')
    ck = json.load(open(os.path.join(W2, 'sheets', sheet, 'checks.json')))
    info, sizes = {}, {}
    for tier in ('S', 'H'):
        calpack.keyline = tinted_keyline('#113F2F') if tier == 'S' else calchecks.keyline
        items = []
        for view, d in (('front', front), ('back', back)):
            fr, inf = calpack.frames_of(d, 'wolfRider', view, tier)
            items += fr
            info.setdefault(view, {})[tier] = dict(scale=inf['scale'], standPx=inf['standPx'], frames=[n for n, _, _ in fr])
            st = next(img for n, img, _ in fr if n.endswith('.stand'))
            m = st[..., 3] > 0.35 * 255
            sizes.setdefault(view, {})[tier] = dict(hoodToPawsPx=calpack.mounted_height(m),
                                                    hoodToPawsWu=round(calpack.mounted_height(m) * WU[tier], 1))
        calpack.keyline = calchecks.keyline
        pages, placed = calpack.pack(items)
        for i, pg in enumerate(pages):
            rows = np.nonzero(pg[..., 3].max(1) > 0)[0]
            h = 1 << (int(rows.max() + 1) - 1).bit_length()
            Image.fromarray(np.clip(pg[:h], 0, 255).astype(np.uint8), 'RGBA').save(os.path.join(OUT, f'wolfRider-{tier}.{i}.png'))
            json.dump(dict(frames={n: {k: v for k, v in dd.items() if k != 'page'} for n, dd in placed.items() if dd['page'] == i},
                           meta=dict(image=f'wolfRider-{tier}.{i}.png', size=dict(w=calpack.PAGE, h=h), tier=tier,
                                     keyline='side #113F2F 75%' if tier == 'S' else 'neutral #1C1A17 60%',
                                     app='stage-b/work/troops2/tools/t2_wolfpack.py (calibration sandbox pack.frames_of)')),
                      open(os.path.join(OUT, f'wolfRider-{tier}.{i}.json'), 'w'), indent=1)
    raw = ck['sheet']
    side = json.load(open(raw.rsplit('.', 1)[0] + '.json'))
    meta = dict(figure='wolfRider', nation='thornwood', key='blue', hueLocked=True,
                mountedHeight='calibration 4.1: hood to paws 32.7 wu (tier S 65 px, tier H 131 px), a man-sized rider',
                sizesMeasured=sizes, views=dict(
                    front=dict(source='pilot/ad/frames/wolfRider.front (owner: Wolf Rider test, Keep)', atlas=info['front'],
                               hueLockShareMax=max(lock_front.values())),
                    back=dict(source=os.path.relpath(raw, UNITS), sha256=hashlib.sha256(open(raw, 'rb').read()).hexdigest(),
                              model=side.get('model'), references=side.get('referencePaths'), atlas=info['back'],
                              checks=dict(cameraAll=ck['cameraAll']['follow'], cells=ck['cameraAll']['cells'], gates=ck['gates'],
                                          side=ck['side'], hueLockShare=ck.get('hueLockShare'), rim=ck['rim'], fringe=ck['fringe'],
                                          consistency={k: v for k, v in ck['consistency'].items() if k != 'lying'}),
                              status='pass' if ck['pass'] else 'reported')),
                note='stage C reviews mounts standing in game; this extends the owner-kept Wolf Rider test with its back view',
                approved=None)
    json.dump(meta, open(os.path.join(OUT, 'wolfRider.json'), 'w'), indent=1)
    # size proof at tier S, 4x: two foot soldiers' stand frames beside both Wolf Rider views
    pg = Image.open(os.path.join(OUT, 'wolfRider-S.0.png'))
    js = json.load(open(os.path.join(OUT, 'wolfRider-S.0.json')))['frames']
    tp = Image.open(os.path.join(SB, 'atlas', 'troops', 'troops-thornwood-S.0.png'))
    tj = json.load(open(os.path.join(SB, 'atlas', 'troops', 'troops-thornwood-S.0.json')))['frames']
    crops = []
    for src, j, n in ((tp, tj, 'warden.back.stand'), (pg, js, 'wolfRider.back.stand'), (pg, js, 'wolfRider.front.stand'),
                      (tp, tj, 'thornMilitia.front.stand')):
        f = j[n]['frame']
        crops.append(src.crop((f['x'], f['y'], f['x'] + f['w'], f['y'] + f['h'])))
    H = max(c.height for c in crops)
    canvas = Image.new('RGBA', (sum(c.width for c in crops) + 12 * len(crops), H + 4), (168, 167, 132, 255))
    x = 4
    for c in crops:
        canvas.alpha_composite(c, (x, H - c.height)); x += c.width + 12
    canvas = canvas.resize((canvas.width * 4, canvas.height * 4), Image.NEAREST)
    ImageDraw.Draw(canvas).text((6, 6), 'tier S, 4x: Warden back | Wolf Rider back | Wolf Rider front | Thorn Militia front', fill=(20, 20, 20))
    canvas.convert('RGB').save(os.path.join(W2, 'review', 'wolfRider-size-tierS-4x.png'))
    print(json.dumps(dict(sizes=sizes, back=meta['views']['back']['status']), indent=1))


if __name__ == '__main__':
    main(sys.argv[1])
