# Stage C creatures: the review images, per figure (../../review/):
#   contact-<figure>.png  - its approved portrait beside every frame of both views (sheet resolution, on the mockup's
#                           plains ground), the stand frames at tier S and H on the four grounds, and the check line;
#   identity-<figure>.png - the portrait beside a 4x crop (nearest) of each view's stand frame at sheet resolution
#                           (big bodies: the head and shoulders at 1x, already larger than tier H), with the portrait's
#                           identity marks listed for ticking (art plan 5.5, pilot review change 10).
# Usage: python3 ccontact.py [FIGURE ...]
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
W = os.path.abspath(os.path.join(HERE, '..', '..'))
UNITS_DIR = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units'
REV = os.path.join(W, 'review')
U = json.load(open(os.path.join(HERE, '..', 'units.json')))
BY = {u['id']: u for u in U['units']}
GROUNDS = ['#A8A784', '#B4A27E', '#938E70', '#8E8E78']
PB = os.path.join(UNITS_DIR, 'stage-b', 'portraits')
MARKS = json.load(open(os.path.join(UNITS_DIR, 'stage-b', 'work', 'portraits', 'ad-review.json')))
PORTRAIT_KEY = {'fireSprite': 'fireSprite.01b.r3', 'hornetSwarm': 'hornetSwarm.01b', 'wolf': 'wolf.01b', 'oakheart': 'oakheart.01b',
                'ashRider': 'ashHorse.01b', 'wolfRider': 'warWolf.01a', 'giant-01': 'giant.01b.r2', 'giant-02': 'giant.02b.r2'}
REPO_MARKS = {
    'salamander-02': ['massive square head, deep underslung jaw', 'hanging dewlap', 'thick worn jaw horns, the largest snapped to a stump',
                      'warty bony brow knobs', 'scales dulled and dusted grey with ash', 'heavy-lidded cloudy eyes'],
    'salamander-03': ['long narrow crocodile-like snout', 'three parallel claw scars across snout and cheek', 'hooked horns sweeping back, one chipped',
                      'low ridge of scutes on top of the head', 'mouth slightly open, a few blunt teeth', 'slit-pupil eye'],
    'salamander-04': ['narrow wedge-shaped viper head', 'two long curved ram-like horns from the rear of the jaw', 'torn ragged frill along the back of the neck',
                      'branching dried-lava cracks, soot in the creases', 'deep-set eyes under a heavy brow ridge'],
    'treant-01': ['grey-green alder bark furred with moss', 'low crown of short budding twigs, pale-green leaves', 'curled fern fronds on the shoulders',
                  'broad brow ridge, knothole eyes, nose bulge', 'mouth a dark crooked split'],
    'treant-02': ['pale grey willow bark in deep vertical furrows', 'long drooping willow fronds', 'two knotholes at different heights',
                  'long ragged split below them', 'no brow, nose or jaw'],
    'treant-03': ['rough dark-brown split-oak bark', 'crown of bare twisted thorny black branches', 'ivy wound around the trunk',
                  'blackened lightning scar down one cheek', 'jutting burl nose, crack mouth'],
    'treant-04': ['chalky white birch bark, black lenticels and patches', 'top forks into two leaning stems', 'drooping dark twigs, yellow-brown leaves',
                  'almond knot-scar eyes, thin horizontal scar', 'dark moss only on the shoulders'],
}


def font(n=14):
    for p in ('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', '/usr/share/fonts/dejavu/DejaVuSans.ttf'):
        if os.path.exists(p):
            return ImageFont.truetype(p, n)
    return ImageFont.load_default()


def hexrgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


def portrait_of(fig):
    u = BY[fig]
    p = u.get('portrait')
    if fig == 'ashRider':
        p = f'{PB}/cinderHorde/ashHorse/01b.webp'
    if p and os.path.exists(p.replace('.webp', '-512.webp')):
        p = p.replace('.webp', '-512.webp')
    return Image.open(p).convert('RGB')


def marks_of(fig):
    if fig in PORTRAIT_KEY:
        return list(MARKS[PORTRAIT_KEY[fig]]['marks'].keys())
    return REPO_MARKS.get(fig, [])


def on_ground(im, g, pad=6):
    bg = Image.new('RGBA', (im.width + 2 * pad, im.height + 2 * pad), hexrgb(g) + (255,))
    bg.alpha_composite(im, (pad, pad))
    return bg.convert('RGB')


def frames_of(d, fig, view):
    vname = 'front' if view == 'frontKept' else view
    js = [f for f in os.listdir(d) if f.endswith('.json') and not f.startswith('checks')]
    meta = json.load(open(os.path.join(d, js[0])))
    if 'frames' in meta:
        return [(f['name'], Image.open(os.path.join(d, f['file'])).convert('RGBA'), f) for f in meta['frames'] if f.get('file') and os.path.exists(os.path.join(d, f['file']))]
    return [(meta['action'], Image.open(os.path.join(d, meta['file'])).convert('RGBA'), meta)]


def check_line(fig, view, p):
    r = json.load(open(os.path.join(p['dir'], 'checks.final.json')))
    st = 'PASS' if p['status'] == 'pass' else 'REPORTED (' + ', '.join(p['failed']) + ')'
    if 'cameraGate' in r:
        s = r['side']
        sd = (f"value {s['neutral']['worstBelow']} below" if s.get('kind') == 'noSide' else
              f"side {s['sideKeyline']['share']:.0%} (side keyline), value {s['sideKeyline']['worstBelow']} below")
        return (f"{view}: {st} | camera {r['cameraGate']['follow']} | variety {r['variety2']['pairs']} | rim {r['rim']['afterMax']} | {sd} | "
                f"keyIn {r['fringe']['keyInUnitPct']} | {p['job']}")
    c = r['camera']
    return (f"{view}: {st} | camera IoU {c['iou']} facing +{round(c['iou'] - c['iouMirrored'], 2)} aspect {c['aspectRatio']} | identity dE {r['identity']['dE2000']} | "
            f"value {r['value']['worstBelow']} below | rim {r['rim']['afterMax']} | keyIn {r['fringe']['keyInUnitPct']} | {p['job']}")


def contact(fig, views):
    F = font(15)
    por = portrait_of(fig).resize((360, 360), Image.LANCZOS)
    rows = []
    for view, p in views.items():
        fr = frames_of(p['dir'], fig, view)
        big = BY[fig]['role'] == 'monster'
        cell = 330 if big else 150
        tiles = []
        for name, im, f in fr:
            t = im.copy(); t.thumbnail((cell, cell), Image.LANCZOS)
            g = on_ground(t, GROUNDS[0])
            c = Image.new('RGB', (cell + 12, cell + 30), (40, 38, 34)); c.paste(g, ((cell + 12 - g.width) // 2, 2))
            ImageDraw.Draw(c).text((4, cell + 12), name, fill=(230, 225, 210), font=font(12))
            tiles.append(c)
        per = 8 if not big else 2
        lines = [tiles[i:i + per] for i in range(0, len(tiles), per)]
        wv = max(sum(t.width for t in l) for l in lines)
        hv = sum(max(t.height for t in l) for l in lines)
        blk = Image.new('RGB', (wv, hv + 26), (28, 26, 23))
        ImageDraw.Draw(blk).text((4, 4), check_line(fig, view, p), fill=(240, 220, 160), font=font(13))
        y = 26
        for l in lines:
            x = 0
            for t in l:
                blk.paste(t, (x, y)); x += t.width
            y += max(t.height for t in l)
        rows.append(blk)
    # tier proofs: the stand frame scaled to its tier S and H heights on the four grounds
    prow = []
    for view, p in views.items():
        fr = frames_of(p['dir'], fig, view)
        st = next((im for n, im, f in fr if n in ('stand', 'wingMid', 'up0', 'idle')), fr[0][1])
        for tier, hpx in tier_heights(fig, view, p, st).items():
            k = hpx / st.height
            s = st.resize((max(1, round(st.width * k)), max(1, round(st.height * k))), Image.LANCZOS)
            for g in GROUNDS:
                prow.append(on_ground(s, g, 4))
    pw = sum(t.width + 4 for t in prow)
    ph = max(t.height for t in prow) + 22
    proof = Image.new('RGB', (pw, ph), (28, 26, 23))
    ImageDraw.Draw(proof).text((4, 2), 'stand frames at tier S then tier H, on plains, farmland, forest and swamp (each view)', fill=(220, 215, 200), font=font(12))
    x = 0
    for t in prow:
        proof.paste(t, (x, 20)); x += t.width + 4
    Wd = max(360 + 20 + max(r.width for r in rows), proof.width)
    Hd = max(400, sum(r.height + 10 for r in rows)) + proof.height + 50
    out = Image.new('RGB', (Wd, Hd), (20, 18, 15))
    d = ImageDraw.Draw(out)
    d.text((8, 6), f'{fig}: approved portrait | standing figure, every frame (stage C, standing only, no animation)', fill=(255, 255, 255), font=F)
    out.paste(por, (8, 30))
    y = 30
    for r in rows:
        out.paste(r, (380, y)); y += r.height + 10
    out.paste(proof, (8, max(400, y) + 10))
    os.makedirs(REV, exist_ok=True)
    out.save(os.path.join(REV, f'contact-{fig}.png'))
    return out.size


def tier_heights(fig, view, p, st):
    u = BY[fig]
    if u['role'] == 'monster':
        js = [f for f in os.listdir(p['dir']) if f.endswith('.idle.json')]
        m = json.load(open(os.path.join(p['dir'], js[0])))
        return {'S': m['heightWu'] / 0.5 * st.height / m['height'], 'H': m['heightWu'] / 0.25 * st.height / m['height']}
    import cpack
    fr, inf = cpack.frames_of(p['dir'], fig, 'front' if view == 'frontKept' else view, 'S')
    return {'S': st.height * inf['scale'], 'H': st.height * inf['scale'] * 2}


def identity(fig, views):
    F = font(15)
    por = portrait_of(fig).resize((420, 420), Image.LANCZOS)
    crops = []
    for view, p in views.items():
        fr = frames_of(p['dir'], fig, view)
        name, st, f = next(((n, im, f) for n, im, f in fr if n in ('stand', 'wingMid', 'up0', 'idle')), fr[0])
        big = BY[fig]['role'] == 'monster'
        if big and BY[fig]['body'] == 'salamander' and view == 'front':  # a low body seen from the front: its head is at the lower left
            c = st.crop((0, int(st.height * 0.5), int(st.width * 0.62), st.height))
            c.thumbnail((520, 420), Image.LANCZOS)
        elif big:
            c = st.crop((0, 0, st.width, int(st.height * 0.42)))
            c.thumbnail((520, 420), Image.LANCZOS)
        else:
            c = st.crop((0, 0, st.width, int(st.height * (0.6 if BY[fig]['layout'] in ('melee',) else 1.0))))
            c = c.resize((c.width * 4, c.height * 4), Image.NEAREST)
            c.thumbnail((520, 420), Image.NEAREST)
        crops.append((view, name, on_ground(c, '#A09C84', 4)))
    mk = marks_of(fig)
    Wd = 440 + sum(c.width + 16 for _, _, c in crops) + 20
    Hd = 470 + 22 * (len(mk) + 2)
    out = Image.new('RGB', (Wd, Hd), (24, 22, 19))
    d = ImageDraw.Draw(out)
    d.text((8, 6), f'{fig}: identity marks: portrait | stand frame crops (small figures 4x nearest from the sheet; big bodies the head at 1x)', fill=(255, 255, 255), font=F)
    out.paste(por, (8, 34))
    x = 440
    for view, name, c in crops:
        out.paste(c, (x, 34)); d.text((x, 34 + c.height + 4), f'{view} {name}', fill=(220, 215, 200), font=font(13)); x += c.width + 16
    y = 470
    d.text((8, y), 'Marks to tick (from the portrait\'s sidecar):', fill=(240, 220, 160), font=F)
    for m in mk:
        y += 22; d.text((24, y), '- ' + m, fill=(230, 225, 210), font=F)
    out.save(os.path.join(REV, f'identity-{fig}.png'))


def main():
    picks = json.load(open(os.path.join(W, 'picks.json')))['figures']
    for fig, views in picks.items():
        if sys.argv[1:] and fig not in sys.argv[1:]:
            continue
        print(fig, contact(fig, views)); identity(fig, views)


if __name__ == '__main__':
    main()
