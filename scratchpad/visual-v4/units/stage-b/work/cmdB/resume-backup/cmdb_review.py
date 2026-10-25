# Stage B, key "cmdB": the picks, the summary table, contact sheets and identity boards.
#   picks: per face and view, the sheet that is used (a re-roll replaces its first roll when it passes, or when it is
#     the better of two failures by the gate count, then the cell count); reused sheets: the pilot's Ash Chieftain 06
#     front (melee layout) and the calibration's AC03, CM03, EA07 fronts.
#   contact sheets: review/contact-<unit>-<view>.png, the picked raw sheets on their key, small.
#   identity boards: review/identity-<unit>-<n>.png: per face, the approved portrait, the upper 55% of the front and
#     back stand frames at 4x (sheet pixels, nearest), and both stand frames at the commander's tier H (128 px) on a
#     mid ground, for ticking the marks (pilot-review change 10, calibration 1.3).
# Usage: python3 cmda_review.py picks | contact | identity | summary
import json, os, sys, glob
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import cmdb as cmda  # noqa: E402
from cmdb_faces import FACES, GROUPS  # noqa: E402

W = cmda.W
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'


def font(sz):
    return ImageFont.truetype(FONT, sz) if os.path.exists(FONT) else ImageFont.load_default()


def score(r):
    g = r['gate']
    return (sum(1 for k in ('cells', 'variety', 'rim', 'fringe', 'side', 'identity') if g.get(k) is not False),
            (r.get('cameraRel') or {}).get('followN', 0))


def picks():
    out = {}
    for unit, faces in GROUPS.items():
        for f in faces:
            for v in ('front', 'back'):
                cands = sorted(glob.glob(os.path.join(W, 'faces', f'{f}.{v}*', 'checks.json')))
                cands = [c for c in cands if os.path.basename(os.path.dirname(c)).split('.')[1] == v]
                if not cands:
                    out[f'{f}.{v}'] = None; continue
                reps = [(json.load(open(c)), os.path.dirname(c)) for c in cands]
                passing = [x for x in reps if x[0]['pass']]
                if passing:  # the latest passing roll (a re-roll is made only because the first failed)
                    best = sorted(passing, key=lambda x: x[1])[-1]
                else:  # both failed: the better by gates passed, then cells
                    best = max(reps, key=lambda x: score(x[0]))
                out[f'{f}.{v}'] = dict(dir=best[1], sheet=best[0]['sheet'], pass_=best[0]['pass'], rolls=len(reps))
    json.dump(out, open(os.path.join(W, 'picks.json'), 'w'), indent=1)
    return out


def frame_png(d, name):
    js = [j for j in glob.glob(os.path.join(d, 'frames', '*.json'))]
    m = json.load(open(js[0]))
    f = next((x for x in m['frames'] if x['name'] == name and not x.get('missing')), None)
    return (os.path.join(d, 'frames', f['file']), f) if f else (None, None)


def contact():
    P = json.load(open(os.path.join(W, 'picks.json')))
    for unit, faces in GROUPS.items():
        for v in ('front', 'back'):
            ims = []
            for f in faces:
                p = P.get(f'{f}.{v}')
                if not p:
                    continue
                im = Image.open(p['sheet']).convert('RGB').resize((384, 384), Image.LANCZOS)
                lab = Image.new('RGB', (384, 404), (28, 26, 23)); lab.paste(im, (0, 20))
                ImageDraw.Draw(lab).text((4, 2), f'{unit} {FACES[f][3]} {v} {"" if p["pass_"] else "FAIL"}', fill=(235, 230, 215), font=font(14))
                ims.append(lab)
            if not ims:
                continue
            cols = 4; rows = (len(ims) + cols - 1) // cols
            sheet = Image.new('RGB', (cols * 384, rows * 404), (20, 18, 15))
            for i, im in enumerate(ims):
                sheet.paste(im, ((i % cols) * 384, (i // cols) * 404))
            sheet.save(os.path.join(W, 'review', f'contact-{unit}-{v}.png'))
            print(unit, v, len(ims))


def on_ground(rgba, ground=(150, 148, 128)):
    bg = Image.new('RGBA', rgba.size, ground + (255,)); bg.alpha_composite(rgba)
    return bg.convert('RGB')


def upper4(png):
    im = Image.open(png).convert('RGBA')
    up = im.crop((0, 0, im.width, int(im.height * 0.55)))
    return on_ground(up).resize((up.width * 4, up.height * 4), Image.NEAREST)


def tierH(png, f, body_h):
    from pack import premul_resize
    rgba = np.asarray(Image.open(png).convert('RGBA')).astype(np.float64)
    s = premul_resize(rgba, 128 / body_h)
    return on_ground(Image.fromarray(np.clip(s, 0, 255).astype(np.uint8), 'RGBA'))


def identity():
    P = json.load(open(os.path.join(W, 'picks.json')))
    scales = json.load(open(os.path.join(W, 'scales.json')))
    for unit, faces in GROUPS.items():
        per = 4
        for b in range(0, len(faces), per):
            rows = []
            for f in faces[b:b + per]:
                if not (P.get(f'{f}.front') or P.get(f'{f}.back')):
                    continue
                kind, nat, u, num, sex, marks = FACES[f]
                por = Image.open(cmda.PORTRAIT.format(nat, u, num)).convert('RGB').resize((340, 340), Image.LANCZOS)
                tiles = [(por, f'portrait {u} {num}')]
                smalls = []
                for v in ('front', 'back'):
                    p = P.get(f'{f}.{v}')
                    if not p:
                        continue
                    png, fr = frame_png(p['dir'], 'stand')
                    tiles.append((upper4(png), f'{v} stand, upper half 4x'))
                    smalls.append(tierH(png, fr, scales[f'{f}.{v}']['bodyH']))
                if smalls:
                    h = max(s.height for s in smalls)
                    pair = Image.new('RGB', (sum(s.width for s in smalls) + 8, h), (150, 148, 128))
                    x = 0
                    for s in smalls:
                        pair.paste(s, (x, h - s.height)); x += s.width + 8
                    tiles.append((pair.resize((pair.width * 2, pair.height * 2), Image.NEAREST), 'tier H 128 px, 2x'))
                H = max(t[0].height for t in tiles) + 24
                row = Image.new('RGB', (sum(t[0].width for t in tiles) + 12 * len(tiles), H + 22), (28, 26, 23))
                d = ImageDraw.Draw(row); x = 0
                for im, lab in tiles:
                    row.paste(im, (x, 24)); d.text((x + 2, 4), lab, fill=(235, 230, 215), font=font(15)); x += im.width + 12
                d.text((4, H + 2), f'{f}: ' + ' | '.join(f'({i + 1}) {m[:48]}' for i, (m, _b) in enumerate(marks)), fill=(200, 196, 180), font=font(12))
                rows.append(row)
            if not rows:
                continue
            Wd = max(r.width for r in rows)
            sheet = Image.new('RGB', (Wd, sum(r.height for r in rows)), (20, 18, 15))
            y = 0
            for r in rows:
                sheet.paste(r, (0, y)); y += r.height
            out = os.path.join(W, 'review', f'identity-{unit}-{b // per + 1}.png')
            sheet.save(out); print(out, sheet.size)


def summary():
    P = json.load(open(os.path.join(W, 'picks.json')))
    rows = {}
    for key, p in P.items():
        if not p:
            rows[key] = None; continue
        r = json.load(open(os.path.join(p['dir'], 'checks.json')))
        ca = r.get('cameraRel') or r.get('cameraAll')
        rows[key] = dict(pass_=r['pass'], rolls=p['rolls'], cells=ca['follow'], failing=ca.get('failing'),
                         inherit=ca.get('inheritMedian'), variety=r['variety']['pass'], marchIoU=r['variety'].get('marchIoU'),
                         rimAfter=r['rim']['afterMax'], edgeDev=r['fringe'].get('edgeDevPct'), keyIn=r['fringe'].get('keyInUnitPct'),
                         side=r['sideCmd']['share'], valueBelow=r['sideCmd']['worstBelow'],
                         identityDE=(r.get('identity') or {}).get('dE2000'), consHist=r['consistency'].get('histMin'),
                         consDE=r['consistency'].get('maxDE'), gate=r['gate'], sheet=os.path.basename(r['sheet']))
    eye = json.load(open(os.path.join(W, 'eye.json'))) if os.path.exists(os.path.join(W, 'eye.json')) else {}
    for key, why in eye.get('facing', {}).items():  # the facing check by eye (the camera gate cannot see a 180 degree turn)
        if rows.get(key):
            rows[key]['pass_'] = False; rows[key]['gate']['facingByEye'] = False; rows[key]['facingByEye'] = why
    for key, v in rows.items():
        if v and eye.get('ticks'):
            t = [m['tick'] for m in eye['ticks'][key.split('.')[0]]]
            v['marksFront'] = ''.join(t) if key.endswith('.front') else None
    json.dump(rows, open(os.path.join(W, 'summary.json'), 'w'), indent=1)
    fails = {k: v for k, v in rows.items() if v and not v['pass_']}
    print(len(rows), 'figures-views;', sum(1 for v in rows.values() if v and v['pass_']), 'pass;', len(fails), 'fail;',
          sum(1 for v in rows.values() if not v), 'missing')
    for k, v in fails.items():
        print(' FAIL', k, {g: x for g, x in v['gate'].items() if x is False}, v['cells'], 'edgeDev', v['edgeDev'], 'keyIn', v['keyIn'])


if __name__ == '__main__':
    {'picks': picks, 'contact': contact, 'identity': identity, 'summary': summary}[sys.argv[1]]()
