# Stage B troops: one contact sheet per group (Cinder, Thornwood, independents) for review: per troop type, both picked
# raw sheets, the tier H frames of both views (stand, march, strike, recoil, fall, dead) on the swamp ground, the 28 px
# block proof with the side keyline (plains), and the gate line (status, cells, side or foreign share, value margin).
# Usage: python3 tr_contact.py ATLAS_DIR OUT_DIR
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from tr_pack import GROUPS  # noqa: E402

W = os.path.abspath(os.path.join(HERE, '..', '..'))
POSES = ['stand', 'marchA', 'strike', 'draw', 'throw', 'recoil', 'fall', 'deadA']


def frames(atlas, nat, fig, view):
    meta = json.load(open(os.path.join(atlas, f'troops-{nat}-H.0.json')))
    page = Image.open(os.path.join(atlas, f'troops-{nat}-H.0.png')).convert('RGBA')
    out = []
    for p in POSES:
        n = f'{fig}.{view}.{p}'
        if n in meta['frames']:
            f = meta['frames'][n]['frame']
            out.append(page.crop((f['x'], f['y'], f['x'] + f['w'], f['y'] + f['h'])))
    return out[:6]


def gate_line(fig, view, p):
    r = json.load(open(os.path.join(p['dir'], 'checks.json')))
    s = r['side']
    side = (f"foreign {s['sideKeyline']['foreign']:.0%}" if s.get('kind') == 'independent'
            else f"side {s['neutral']['share']:.0%} / {s['sideKeyline']['share']:.0%} kl")
    return (f"{view}: {p['status'].upper()} cells {r['cameraAll']['follow']}  {side}  value -{s['sideKeyline']['worstBelow']:.0f} L*  "
            f"rim {r['rim']['afterMax']}%  {os.path.basename(p['sheet'])}" + (f"  FAILED {','.join(p['failed'])}" if p['failed'] else ''))


def main(atlas, out):
    picks = json.load(open(os.path.join(W, 'picks.json')))
    for nat, figs in GROUPS.items():
        rows = []
        for fig in figs:
            row = Image.new('RGB', (2200, 600), (34, 32, 29))
            d = ImageDraw.Draw(row)
            d.text((8, 6), fig, fill=(240, 230, 210))
            x = 8
            for k, view in enumerate(('back', 'front')):
                p = picks[fig][view]
                sh = Image.open(p['sheet']).convert('RGB').resize((280, 280))
                row.paste(sh, (x, 26))
                d.text((8, 330 + 18 * k), gate_line(fig, view, p), fill=(230, 220, 200) if p['status'] == 'pass' else (255, 150, 120))
                x += 290
            gx = 600
            for view in ('back', 'front'):
                fr = frames(atlas, nat, fig, view)
                strip = Image.new('RGBA', (sum(f.width for f in fr) + 8 * len(fr), max(f.height for f in fr)), (142, 142, 120, 255))
                xx = 0
                for f in fr:
                    strip.alpha_composite(f, (xx, strip.height - f.height)); xx += f.width + 8
                row.paste(strip.convert('RGB'), (gx, 26 if view == 'back' else 180))
            px = 1500
            for view in ('back', 'front'):
                pr = os.path.join(picks[fig][view]['dir'], 'proof.sideKeyline.png')
                if os.path.exists(pr):
                    im = Image.open(pr).convert('RGB')
                    im = im.crop((0, 0, im.width // 4, im.height))  # plains only
                    im.thumbnail((340, 290))
                    row.paste(im, (px, 26)); px += 350
            rows.append(row.crop((0, 0, 2200, 380)))
        sheet = Image.new('RGB', (2200, 380 * len(rows)), (0, 0, 0))
        for i, r in enumerate(rows):
            sheet.paste(r, (0, 380 * i))
        sheet.save(os.path.join(out, f'contact-{nat}.png'))
        print(os.path.join(out, f'contact-{nat}.png'))


if __name__ == '__main__':
    main(*sys.argv[1:3])
