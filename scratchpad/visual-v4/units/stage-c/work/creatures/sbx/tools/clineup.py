# Stage C creatures: a lineup by size at the field's scale (tier S: 0.5 wu per px, a man 56 px), every figure's stand frame
# from the packed atlases, back view then front view, standing on the mockup's plains ground with a painted Cinder Warrior
# (stage B troop atlas) for scale; written at 1x and 2x (nearest). Usage: python3 clineup.py
import json, os, sys
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__))
UNITS_DIR = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units'
O = os.path.join(UNITS_DIR, 'stage-c', 'atlas', 'creatures')
REV = os.path.abspath(os.path.join(HERE, '..', '..', 'review'))
sys.path.insert(0, os.path.join(UNITS_DIR, 'stage-b', 'integrate'))
import bundle  # noqa: E402

ORDER = [('troops-cinderHorde', 'cinderWarrior', ('stand',)), ('hornetSwarm', 'hornetSwarm', ('up0',)), ('fireSprite', 'fireSprite', ('wingMid',)),
         ('wolf', 'wolf', ('stand',)), ('oakheart', 'oakheart', ('stand',)), ('wolfRider', 'wolfRider', ('stand',)), ('ashRider', 'ashRider', ('stand',)),
         ('salamander', 'salamander-02', ('idle',)), ('salamander', 'salamander-03', ('idle',)), ('salamander', 'salamander-04', ('idle',)),
         ('treant', 'treant-01', ('idle',)), ('treant', 'treant-02', ('idle',)), ('treant', 'treant-03', ('idle',)), ('treant', 'treant-04', ('idle',)),
         ('giant', 'giant-01', ('idle',)), ('giant', 'giant-02', ('idle',))]


def main(tier='S'):
    items = []
    for fam, fig, poses in ORDER:
        pre = os.path.join(UNITS_DIR, 'stage-b', 'atlas', 'troops', f'{fam}-{tier}') if fam.startswith('troops') else os.path.join(O, f'{fam}-{tier}')
        at = bundle.load_atlas(pre)
        for view in ('back', 'front'):
            n = f'{fig}.{view}.{poses[0]}'
            if n not in at:
                continue
            im, anc = bundle.crop(*at[n])
            sh = at.get(n + '.shadow')
            items.append((fig, view, im, anc, bundle.crop(*sh) if sh else None))
    gap = 10
    base = 40
    W = sum(i[2].width for i in items) + gap * (len(items) + 1)
    H = max(int(i[2].height * i[3][1]) for i in items) + base + 30
    out = Image.new('RGBA', (W, H), (168, 167, 132, 255))
    d = ImageDraw.Draw(out)
    x = gap
    gy = H - base
    for fig, view, im, anc, sh in items:
        ax, ay = anc[0] * im.width, anc[1] * im.height
        if sh:
            sim, sanc = sh
            out.alpha_composite(sim, (int(x + ax - sanc[0] * sim.width + 5 / 0.5 * (1 if tier == 'S' else 2) * 0), int(gy - sanc[1] * sim.height)))
        else:
            d.ellipse((x + ax - im.width * 0.3, gy - 3, x + ax + im.width * 0.3, gy + 3), fill=(60, 58, 45, 90))
        out.alpha_composite(im, (int(x + ax - ax), int(gy - ay)))
        d.text((x, gy + 6), f'{fig.replace("salamander", "sal").replace("treant", "tre")}\n{view}', fill=(30, 28, 24, 255))
        x += im.width + gap
    out = out.convert('RGB')
    out.save(os.path.join(REV, f'lineup-tier{tier}.png'))
    if tier == 'S':
        out.resize((out.width * 2, out.height * 2), Image.NEAREST).save(os.path.join(REV, 'lineup-tierS-2x.png'))
    print(out.size)


if __name__ == '__main__':
    main('S')
