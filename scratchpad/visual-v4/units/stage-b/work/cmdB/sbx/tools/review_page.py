#!/usr/bin/env python3
"""Builds pilot-review.html, the owner's review page for the stage A pilot (pilot.md, pilot-review.md).

One self-contained file: every picture is a WebP data URI; fonts come from Google Fonts. The in-game crops come from
review_shoot.cjs (the art director's test page, devicePixelRatio 2); sheets, poses and portraits come from the pilot's
work folders and the repo's approved portraits (read only).
Usage: python3 review_page.py
"""
import base64
import html
import io
import json
import os

from PIL import Image

U = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units'
P = f'{U}/pilot'
W = f'{P}/work'
F = f'{P}/ad/frames'
SH = f'{U}/review-page/shots'
ART = '/home/user/Fluid-Magic-/art-source/portraits'
OUT = f'{U}/pilot-review.html'
GROUND = (141, 141, 120)  # battle c's swamp ground, sampled from the shots
SIZES = {}
esc = html.escape


def enc(im, key, q=80):
    buf = io.BytesIO()
    im.save(buf, 'WEBP', quality=q, method=6)
    b = buf.getvalue()
    SIZES[key] = len(b)
    return 'data:image/webp;base64,' + base64.b64encode(b).decode()


def fit(im, max_w=None, max_h=None):
    s = 1.0
    if max_w and im.width > max_w:
        s = min(s, max_w / im.width)
    if max_h and im.height > max_h:
        s = min(s, max_h / im.height)
    return im if s == 1.0 else im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)


def on_ground(im, pad=0):
    im = im.convert('RGBA')
    bg = Image.new('RGBA', (im.width + 2 * pad, im.height + 2 * pad), GROUND + (255,))
    bg.alpha_composite(im, (pad, pad))
    return bg.convert('RGB')


class Img:
    def __init__(self, key, im, q=80, css_w=None):
        self.key, self.w, self.h = key, im.width, im.height
        self.css_w = css_w or im.width
        self.css_h = round(self.h * self.css_w / self.w)
        self.src = enc(im, key, q)


def sheet(path, key, max_w=1024):
    return Img(key, fit(on_ground(Image.open(path)), max_w), 84, css_w=min(512, max_w))


def cutout(path, key, max_h=520, pad=12):
    return Img(key, fit(on_ground(Image.open(path), pad), None, max_h), 86)


def shot(name, q=86):
    im = Image.open(f'{SH}/{name}.png').convert('RGB')
    return Img(name, im, q, css_w=im.width // 2)  # shot at devicePixelRatio 2: half is true size


def portrait(rel, key, px=512):
    return Img(key, fit(Image.open(f'{ART}/{rel}').convert('RGB'), px), 88)


def crop(path, box, key, scale=1.0, q=88):
    im = Image.open(path).convert('RGB').crop(box)
    if scale != 1.0:
        im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    return Img(key, im, q)


def anim(name, q=82):
    d = f'{SH}/{name}'
    frames = [Image.open(f'{d}/{f}').convert('RGB') for f in sorted(os.listdir(d)) if f.endswith('.png')]
    buf = io.BytesIO()
    frames[0].save(buf, 'WEBP', save_all=True, append_images=frames[1:], duration=50, loop=0, quality=q, method=6,
                   minimize_size=True)
    b = buf.getvalue()
    SIZES[name] = len(b)
    i = Img.__new__(Img)
    i.key, i.w, i.h, i.css_w = name, frames[0].width, frames[0].height, frames[0].width // 2
    i.css_h = frames[0].height // 2
    i.src = 'data:image/webp;base64,' + base64.b64encode(b).decode()
    return i


POSE_WORDS = {
    'stand': 'stand', 'idle2': 'at ease', 'marchA': 'step 1', 'marchB': 'step 2', 'windup': 'wind-up', 'strike': 'strike',
    'follow': 'follow-through', 'brace': 'brace', 'recoil': 'hit', 'fall': 'falling', 'deadA': 'dead 1', 'deadB': 'dead 2',
    'fleeA': 'flee 1', 'fleeB': 'flee 2', 'cheer': 'cheer', 'dropped': 'dropped arms', 'lopeA': 'lope 1', 'lopeB': 'lope 2',
    'leapA': 'leap 1', 'leapB': 'leap 2', 'charge': 'charge', 'bite': 'bite', 'boltA': 'wolf bolts 1', 'boltB': 'wolf bolts 2',
}


def poses(folder, key, scale=0.72):
    """Every sliced pose of a sheet at one common scale, standing on one ground point, on the battle ground."""
    js = [f for f in os.listdir(folder) if f.endswith('.json')][0]
    meta = json.load(open(f'{folder}/{js}'))
    fr = meta['frames']
    left = max(f['anchor'][0] for f in fr)
    right = max(f['size'][0] - f['anchor'][0] for f in fr)
    up = max(f['anchor'][1] for f in fr)
    down = max(f['size'][1] - f['anchor'][1] for f in fr)
    cw, ch = round(left + right + 16), round(up + down + 12)
    out = []
    for f in fr:
        im = Image.open(f"{folder}/{f['file']}").convert('RGBA')
        c = Image.new('RGBA', (cw, ch), GROUND + (255,))
        c.alpha_composite(im, (round(8 + left - f['anchor'][0]), round(6 + up - f['anchor'][1])))
        c = c.convert('RGB').resize((round(cw * scale), round(ch * scale)), Image.LANCZOS)
        out.append((POSE_WORDS.get(f['name'], f['name']), Img(f"{key}.{f['name']}", c, 88)))
    return out


# ---------------------------------------------------------------- markup helpers

def img_tag(i, alt, cls='z', idattr=True):
    ida = f' id="img-{i.key}"' if idattr else ''
    return (f'<img class="{cls}"{ida} src="{i.src}" alt="{esc(alt)}" width="{i.css_w}" height="{i.css_h}" '
            f'decoding="async">')


def fig(i, alt, cap, badge=None, true=False, dark=False, w=None):
    b = ''
    if badge:
        kind, text = badge
        b = f'<span class="badge {kind}">{esc(text)}</span>'
    cls = ' '.join(c for c in ['true' if true else '', 'dark' if dark else ''] if c)
    style = f' style="--w:{w or i.css_w}px"' if (true or w) else ''
    return f'<figure class="{cls}"{style}>{img_tag(i, alt)}<figcaption>{b}{cap}</figcaption></figure>'


def same(i, alt, cap, badge=None, true=False):
    """A picture already on the page, shown again without a second embedded copy (filled in by the page's script)."""
    b = f'<span class="badge {badge[0]}">{esc(badge[1])}</span>' if badge else ''
    style = f' style="--w:{i.css_w}px"' if true else ''
    return (f'<figure class="{"true" if true else ""}"{style}><img class="z" data-same="img-{i.key}" alt="{esc(alt)}" '
            f'width="{i.css_w}" height="{i.css_h}"><figcaption>{b}{cap}</figcaption></figure>')


def grid(cls, items):
    return f'<div class="grid {cls}">' + ''.join(items) + '</div>'


def row(items, wrap=False):
    return f'<div class="flex{" fwrap" if wrap else ""}">' + ''.join(items) + '</div>'


def pose_grid(ps, what):
    cells = ''.join(f'<figure>{img_tag(i, f"{what}: {w}")}<figcaption>{esc(w)}</figcaption></figure>' for w, i in ps)
    return f'<div class="poses">{cells}</div>'


def vrow(pid, rec):
    return (f'<div class="vrow" data-piece="{pid}"><span class="vq">Your call</span>'
            f'<button type="button" class="vbtn" data-v="Keep" aria-pressed="false">Keep</button>'
            f'<button type="button" class="vbtn" data-v="Change" aria-pressed="false">Change</button>'
            f'<input type="text" aria-label="Note for this piece" placeholder="What should change? (optional)">'
            f'<span class="rec">Art director: {esc(rec)}</span></div>')


def piece(num, pid, title, lead, parts, rec, probe=None):
    p = f'<span class="probe">{esc(probe)}</span>' if probe else ''
    return (f'<section class="piece" id="{pid}" aria-labelledby="{pid}-h"><div class="phead"><span class="num">{num}</span>'
            f'<h2 id="{pid}-h">{title}</h2>{p}</div><p class="lead">{lead}</p>' + ''.join(parts) + vrow(pid.removeprefix('p-'), rec) + '</section>')


def h3(t):
    return f'<h3>{t}</h3>'


def ad(t):
    return f'<p class="ad"><b>Art director.</b> {t}</p>'


# ---------------------------------------------------------------- pictures

PICK, OTHER, FLAT = ('pick', 'Picked'), ('other', 'Other model'), ('flat', 'Flat, today')
I = {}
# sheets
I['cwb'] = sheet(f'{W}/r3/cw.back.g3pro/keyed.png', 'sheet.cwb')
I['cwb2'] = sheet(f'{W}/r3/cw.back.nb21/keyed.png', 'sheet.cwb2')
I['cwf'] = sheet(f'{W}/ad/cw.front.rs.nb21/keyed.png', 'sheet.cwf')
I['cwf2'] = sheet(f'{W}/ad/cw.front.g3pro/keyed.png', 'sheet.cwf2')
I['ac'] = sheet(f'{W}/ad/ac06.front.redress.nb21/keyed.png', 'sheet.ac')
I['ac2'] = sheet(f'{W}/ad/ac06.front.g3pro/keyed.png', 'sheet.ac2')
I['wd'] = sheet(f'{W}/ad/wd.front.g3pro/keyed.png', 'sheet.wd')
I['wd2'] = sheet(f'{W}/ad/wd.front.rs.nb21/keyed.png', 'sheet.wd2')
I['wr'] = sheet(f'{W}/ad/wr.front.blue.g3pro/keyed.png', 'sheet.wr')
I['wr2'] = sheet(f'{W}/r1/wr.front.nb21/keyed.png', 'sheet.wr2')
# cut-out poses
PS = {
    'near': poses(f'{F}/cinderWarrior.back', 'pose.near'),
    'far': poses(f'{F}/cinderWarrior.front', 'pose.far'),
    'ac': poses(f'{F}/ashChieftain-06.front', 'pose.ac'),
    'wd': poses(f'{F}/warden.front.lock', 'pose.wd'),
    'wr': poses(f'{F}/wolfRider.front', 'pose.wr'),
}
# the field (labels hidden; one block per crop)
S = {n: shot(n) for n in [
    'play-near-1', 'play-near-2', 'play-near-3', 'play-near-5', 'close-near-1', 'close-near-2', 'close-near-5',
    'play-far-1', 'play-far-2', 'play-far-3', 'play-far-5', 'close-far-1', 'close-far-2', 'close-far-5',
    'play-thorn-1', 'play-thorn-2', 'play-thorn-3', 'play-thorn-4', 'close-thorn-1', 'close-thorn-2', 'close-thorn-4',
    'play-wolves-1', 'play-wolves-2', 'play-wolves-3', 'play-wolves-4', 'close-wolves-1', 'close-wolves-2', 'close-wolves-4',
    'close-chief', 'close-chief-ctx', 'play-sal', 'play-sal-proc', 'close-sal-old', 'close-sal-fix', 'close-sal-front',
    'close-sal-proc']}
MO = {n: anim(n) for n in ['motion-near', 'motion-far']}
# portraits and creature cut-outs
I['salP'] = portrait('cinderHorde/salamander/01.webp', 'port.sal')
I['acP'] = portrait('cinderHorde/ashChieftain/06.webp', 'port.ac', 400)
I['wcP'] = portrait('thornwood/wardenCaptain/07.webp', 'port.wc')
I['edP'] = portrait('thornwood/elderDruid/08.webp', 'port.ed')
I['salF'] = cutout(f'{F}/salamander-01.front/salamander-01.front.idle.png', 'cut.salF')
I['salB'] = cutout(f'{F}/salamander-01.back/salamander-01.back.idle.png', 'cut.salB')
I['salF2'] = cutout(f'{W}/r1/sal.front.g3pro/frames/salamander-01.front.idle.png', 'cut.salF2', 420)
I['salB2'] = cutout(f'{W}/r1/sal.back.g3pro/frames/salamander-01.back.idle.png', 'cut.salB2', 420)
I['acStand'] = cutout(f'{F}/ashChieftain-06.front/cinderWarrior.front.stand.png', 'cut.acStand', 400, 20)
I['acPro'] = cutout(f'{W}/ad/ac06.front.g3pro/frames/ashChieftain-06.front.stand.png', 'cut.acPro', 400, 20)
I['acCam'] = cutout(f'{W}/ad/ac06.front.cam.g3pro/frames/ashChieftain-06.front.stand.png', 'cut.acCam', 400, 20)
# the bust and the leaders (the bust as painted; it keeps its own dark ground)
I['bust'] = Img('bust', fit(Image.open(f'{P}/raw/r2/warden.bust.nb21.png').convert('RGB'), 512), 82)
I['bust2'] = Img('bust2', fit(Image.open(f'{P}/raw/r2/warden.bust.g3pro.png').convert('RGB'), 512), 80)
I['bustS'] = Img('bustS', fit(Image.open(f'{P}/raw/r2/warden.bust.nb21.png').convert('RGB'), 128), 85, css_w=64)
I['wcS'] = Img('wcS', fit(Image.open(f'{ART}/thornwood/wardenCaptain/07.webp').convert('RGB'), 128), 85, css_w=64)
I['edS'] = Img('edS', fit(Image.open(f'{ART}/thornwood/elderDruid/08.webp').convert('RGB'), 128), 85, css_w=64)
# details, cropped from the art director's review images without their labels
R = f'{P}/ad/review'
I['scarP'] = crop(f'{R}/salamander-scar.png', (10, 40, 470, 358), 'scar.portrait')
salF_old = Image.open(f'{W}/r1/sal.front.nb21/frames/salamander-01.front.idle.png')
salF_new = Image.open(f'{F}/salamander-01.front/salamander-01.front.idle.png')
I['scarA'] = Img('scar.before', fit(on_ground(salF_old.crop((0, 470, 440, 900))), 460), 82)
I['scarB'] = Img('scar.after', fit(on_ground(salF_new.crop((0, 470, 440, 900))), 460), 82)
I['rimA'] = crop(f'{P}/ad/review/rimfix.png', (10, 40, 454, 616), 'rim.before')
I['rimB'] = crop(f'{P}/ad/review/rimfix.png', (464, 40, 908, 616), 'rim.after')
I['coatA'] = crop(f'{R}/front-before-after.png', (10, 40, 522, 716), 'coat.before', 0.8)
I['coatB'] = crop(f'{R}/front-before-after.png', (532, 40, 1044, 716), 'coat.after', 0.8)
I['grA'] = crop(f'{R}/warden-green.png', (10, 40, 331, 505), 'green.painted')
I['grB'] = crop(f'{R}/warden-green.png', (341, 40, 662, 505), 'green.locked')
I['grC'] = crop(f'{R}/warden-green.png', (672, 40, 990, 502), 'green.teal')
I['wkA'] = crop(f'{R}/wolf-key.png', (10, 40, 325, 589), 'wolf.magenta')
I['wkB'] = crop(f'{R}/wolf-key.png', (335, 40, 602, 514), 'wolf.blue')

# ---------------------------------------------------------------- the page

PIECES = [
    ('near', 'p-near', 'Near soldier', 'Keep'),
    ('far', 'p-far', 'Far soldier with surcoat', 'Keep'),
    ('outline', 'p-outline', 'Side-colour outline', 'Keep'),
    ('chief', 'p-chief', 'Ash Chieftain 06', 'Keep, test the route first'),
    ('warden', 'p-warden', 'Thornwood Warden', 'Change: surcoat over the chest'),
    ('sal', 'p-sal', 'Salamander', 'Keep'),
    ('wolf', 'p-wolf', 'Wolf Rider test', 'Keep as a test only'),
    ('bust', 'p-bust', 'Card bust', 'Keep'),
    ('motion', 'p-motion', 'Motion', 'Keep, see it again in the animation review'),
]
REC = {p[0]: p[3] for p in PIECES}

body = []
body.append('''<header class="top">
<span class="eyebrow">Fluid Magic · painted battle figures · stage A</span>
<h1>The painted pilot</h1>
<p class="lead">Before painting the whole army we painted a few figures for battle c, &ldquo;The Fight in Wickemoss&rdquo;, and
stood them on its swamp ground beside today&rsquo;s flat figures. This page shows what came out, what the art director found,
and what we will change before production. Nothing has gone into the game. Give each piece a <b>Keep</b> or a <b>Change</b>,
then <b>Go</b> or <b>Not yet</b> at the end, and paste the verdict line into the chat.</p>
<nav class="toc" aria-label="On this page"><a href="#next">What comes next</a><a href="#p-near">The pieces</a>
<a href="#p-sal">Salamander</a><a href="#p-bust">Card bust</a><a href="#p-motion">Motion</a><a href="#director">Art director</a>
<a href="#numbers">Numbers</a><a href="#verdict">Your verdict</a></nav>
</header>''')

body.append('''<section class="card brass" aria-labelledby="short-h"><h2 id="short-h">In short</h2>
<ul class="tight">
<li><b>Painted figures work at the battle camera</b>, in the same oil hand as your leader portraits. Up close they hold up;
today&rsquo;s flat figures look like toys beside them.</li>
<li><b>The Salamander now matches its portrait:</b> dark obsidian scales, fine dull ember cracks, the broad flat head, the
horn nubs, and the pale scrape across the snout.</li>
<li><b>Three faults were found and are fixed in what you see here:</b> the Salamander stood on its tail tip, a yellow-olive
rim ran along every orange edge, and the far side hardly showed its colour.</li>
<li><b>Two routes are not proven yet</b> and get a small test at the start of the next stage: commanders painted from
their faces, and Thornwood&rsquo;s green.</li>
<li>48 of the pilot&rsquo;s 60 pictures were used. The art director says <b>Go, with changes</b>.</li>
</ul></section>''')

body.append('''<section class="card" id="next" aria-labelledby="next-h"><h2 id="next-h">What this pilot is, and what comes next</h2>
<p class="lead">You asked for painted art for every figure on the field, in the style of the approved leader portraits;
more animation; every figure matching its portrait; and three looks at each monster, god and mount, in order. You also
wrote:</p>
<blockquote>the magic will need the same attention to detail as the animation and monsters</blockquote>
<p class="lead">So the work runs in four stages, each ending with a page like this one. Nothing moves on until you answer.</p>
<div class="stages">
<div class="stage now"><span class="tag">Now · stage A</span><h4>The pilot</h4><p>A few figures painted, tested on the
field and reviewed by the art director. This page.</p></div>
<div class="stage"><span class="tag">Stage B · your review 1</span><h4>Troops, commanders, portraits</h4><p>Every foot
soldier in both views with its card bust; a figure for every commander face, made from that face; and the painted
<b>portraits</b> of every monster, god and mount, two to choose from each.</p></div>
<div class="stage"><span class="tag">Stage C · your review 2</span><h4>Standing in the game</h4><p>Each approved monster,
god and mount painted <b>standing on the field</b> beside its portrait, at true size, with no animation yet. Mounted troops
too.</p></div>
<div class="stage"><span class="tag">Stage D · your review 3</span><h4>Animation and magic</h4><p>Marching, galloping,
strikes, hits, deaths, routs and monster attacks; then the <b>magic</b>, painted with the same care: flames, smoke, roots
and light that falls on figures and ground, every spell drawn beat by beat. Fireball against Entangle comes first,
slowed and at speed, beside its storyboard.</p></div>
</div>
<p class="note">How a figure is made: a painter model paints sixteen poses of one soldier in one picture, posed by a grey
clay model we set at the battle camera; we cut the poses out and the game plays them. Each figure is painted twice,
from behind (the near side, bottom left, facing up and right) and from the front (the far side, top right, facing down and
left); the other two facings are mirror images. Two painter models were tried: <b>Nano Banana Pro</b>, and <b>Nano Banana
2.1</b>, the one that painted your leader portraits. Cities in battles come in a later build, as you asked.</p>
</section>''')

# 1 near soldier
body.append(piece(1, 'p-near', 'Near side: the Cinder Warrior from behind',
    'The near side faces up and to the right, so we see its back. A long orange cape carries the side&rsquo;s colour.',
    [h3('The painted sheet'),
     grid('g2 stack', [
         fig(I['cwb'], 'Cinder Warrior back-view sheet, sixteen poses', 'Nano Banana Pro, posed by the clay model. <b>14 of 15 poses</b> at the battle camera; the sixteenth cell is the dropped weapons.', PICK),
         fig(I['cwb2'], 'Cinder Warrior back-view sheet by the other model', 'Nano Banana 2.1 on the same request: richer paint, but <b>8 of 15</b> poses at the camera; the rest drop to eye level with long legs.', OTHER)]),
     h3('The poses, cut out'),
     pose_grid(PS['near'], 'Cinder Warrior from behind'),
     h3('Standing on the field, play zoom (true size)'),
     grid('g4', [
         fig(S['play-near-1'], 'Near block, pilot as first shown', '<b>Pilot</b>, as first made: thirty copies of one frame.', true=True),
         fig(S['play-near-2'], 'Near block, edges cleaned and figures varied', '<b>Now</b>: edges cleaned, every man a little different.', true=True),
         fig(S['play-near-3'], 'Near block with the side-colour outline', '<b>Now, with the side outline</b> (piece 3).', true=True),
         fig(S['play-near-5'], 'Near block of flat figures', 'Today&rsquo;s flat figures.', FLAT, true=True)]),
     h3('Closest zoom'),
     grid('g3 stack', [
         fig(S['close-near-1'], 'Near block at closest zoom, pilot', '<b>Pilot</b>.'),
         fig(S['close-near-2'], 'Near block at closest zoom, now', '<b>Now</b>: no olive rim on the capes, varied rest poses and sizes.'),
         fig(S['close-near-5'], 'Near block of flat figures at closest zoom', 'Today&rsquo;s flat figures.', FLAT)]),
     h3('The edge fix, close up'),
     row([
         fig(I['rimA'], 'Back view before the edge fix', '<b>Before</b>: a yellow-olive rim along the crest and the cape&rsquo;s edge, left by the painter&rsquo;s green background.', w=300),
         fig(I['rimB'], 'Back view after the edge fix', '<b>After</b>: the edge takes the cloth&rsquo;s own colour. Every sheet is now checked for it.', w=300)]),
     ad('Reads as real troops, slimmer and heavier than the flat ones, and the cape carries the side well. Both views of a '
        'unit will come from the same model, so they match when you zoom in.')],
    REC['near']))

# 2 far soldier
body.append(piece(2, 'p-far', 'Far side: the Cinder Warrior from the front, with a surcoat',
    'The far side faces down and to the left. In the pilot this view showed mostly grey helmets and mail, so its side '
    'hardly showed (17% of the block in the side&rsquo;s colour; we aim for 30%). One edit gave the soldier a sleeveless '
    'surcoat in the side&rsquo;s cloth, collar to knee, and changed nothing else: now 37%. In battle c the far side is '
    'Thornwood (piece 5); the Cinder front view stands in here.',
    [h3('The surcoat, before and after'),
     row([
         fig(I['coatA'], 'Front view, pilot pick', '<b>Pilot</b>: orange mantle and shield, grey mail chest.', w=300),
         fig(I['coatB'], 'Front view with the surcoat', '<b>Now</b>: the surcoat covers chest and belly, split below the belt.', w=300)]),
     h3('The painted sheet'),
     grid('g2 stack', [
         fig(I['cwf'], 'Cinder Warrior front-view sheet with surcoat', 'Nano Banana 2.1, an edit of the pilot&rsquo;s pick. <b>13 of 15</b> poses at the camera; the same man in every cell.', PICK),
         fig(I['cwf2'], 'Cinder Warrior front-view sheet by the other model', 'Nano Banana Pro from the clay model, same surcoat: <b>15 of 15</b> at the camera, but flatter paint and less orange (25%).', OTHER)]),
     h3('The poses, cut out'),
     pose_grid(PS['far'], 'Cinder Warrior from the front'),
     h3('Standing on the field, play zoom (true size)'),
     grid('g4', [
         fig(S['play-far-1'], 'Far block, pilot', '<b>Pilot</b>: grey helmets win.', true=True),
         fig(S['play-far-2'], 'Far block with surcoats, with the Ash Chieftain', '<b>Now</b>: surcoats, edges cleaned, varied; the chieftain in front.', true=True),
         fig(S['play-far-3'], 'Far block with the side-colour outline', '<b>Now, with the side outline</b>.', true=True),
         fig(S['play-far-5'], 'Far block of flat figures', 'Today&rsquo;s flat figures.', FLAT, true=True)]),
     h3('Closest zoom'),
     grid('g3 stack', [
         fig(S['close-far-1'], 'Far block at closest zoom, pilot', '<b>Pilot</b>.'),
         fig(S['close-far-2'], 'Far block at closest zoom, now', '<b>Now</b>.'),
         fig(S['close-far-5'], 'Far block of flat figures at closest zoom', 'Today&rsquo;s flat figures.', FLAT)]),
     ad('With the surcoat both sides read at least as clearly as the flat blocks while staying painted. Every troop kit '
        'gets one; robed casters keep their robes.')],
    REC['far']))

# 3 outline
body.append(piece(3, 'p-outline', 'The side&rsquo;s colour on the outline, at play zoom',
    'At play zoom every painted figure gets a thin outline in its side&rsquo;s dark shade: deep orange for the Cinder Horde, '
    'deep green for Thornwood. It makes both sides unmistakable (63% and 61% of a block in the side&rsquo;s colour) and gives '
    'a lone commander his side. Up close the outline stays a neutral dark, because there the painted cloth speaks for '
    'itself and a coloured edge would blur figures together. The two shades stay as far apart for colour-blind players as '
    'the cloths themselves.',
    [h3('Without and with, true size'),
     grid('g4', [
         same(S['play-near-2'], 'Near block without the side outline', 'Near side, <b>neutral outline</b>.', true=True),
         same(S['play-near-3'], 'Near block with the side outline', 'Near side, <b>side outline</b>.', true=True),
         same(S['play-far-2'], 'Far block without the side outline', 'Far side, <b>neutral outline</b>.', true=True),
         same(S['play-far-3'], 'Far block with the side outline', 'Far side, <b>side outline</b>.', true=True)]),
     ad('Recommended. It is a question for you because it changes the look at play zoom: a faint coloured edge around each '
        'figure.')],
    REC['outline']))

# 4 chieftain
body.append(piece(4, 'p-chief', 'Ash Chieftain, face 06: a commander made from his portrait',
    'Every commander must match his card portrait, as the Salamander now does. Painting the chieftain straight from a clay '
    'model failed twice: the camera dropped to eye level (2 and 1 of 16 poses right). Re-dressing the camera-right soldier '
    'sheet as the chieftain worked: spiked crown-helm, full dark beard, soot-black feather mantle, engraved shoulder plates, '
    'and 13 of 15 poses at the camera.',
    [h3('Portrait and figure'),
     grid('g4', [
         fig(I['acP'], 'Ash Chieftain face 06, approved portrait', '<b>His approved portrait</b>, face 06, the one battle c shows.', dark=True),
         fig(I['acStand'], 'Ash Chieftain painted figure, standing', '<b>The figure</b>: re-dressed soldier sheet (Nano Banana 2.1).', PICK),
         fig(I['acPro'], 'Failed try with the portrait as reference', 'Nano Banana Pro with the portrait: eye-level camera.', OTHER),
         fig(I['acCam'], 'Failed try without the portrait', 'Nano Banana Pro without it: stubby, facing the wrong way.', OTHER)]),
     h3('The painted sheet'),
     grid('g2 stack', [
         fig(I['ac'], 'Ash Chieftain sheet, re-dressed', 'The re-dressed sheet: <b>13 of 15</b> poses at the camera.', PICK),
         fig(I['ac2'], 'Ash Chieftain sheet by the other route', 'Nano Banana Pro from a commander clay model with the portrait: <b>2 of 16</b>, figures nearly fill their cells.', OTHER)]),
     h3('The poses, cut out'),
     pose_grid(PS['ac'], 'Ash Chieftain'),
     h3('On the field'),
     row([
         fig(S['close-chief'], 'Ash Chieftain at closest zoom', '<b>Closest zoom</b>, true size: he stands a little taller than his men.', w=170),
         fig(S['close-chief-ctx'], 'Ash Chieftain in front of his block', '<b>In front of his block</b>.', w=520)], wrap=True),
     ad('The route works on one face. The next stage opens with a 12-picture test on three kinds of commander (an armoured '
        'chief, a robed caster with a staff, a hooded druid), two faces each, every mark checked against its portrait.')],
    REC['chief']))

# 5 warden
body.append(piece(5, 'p-warden', 'Thornwood Warden from the front: getting the green right',
    'Thornwood&rsquo;s cloth is a deep blue-green. Asked for &ldquo;green&rdquo;, the painters paint leaf-green; asked for '
    'the exact colour, they overshoot to teal. So the side barely shows (3%). A colour lock after painting moves the cloth '
    'to Thornwood&rsquo;s green and keeps the brushwork: 18%, and 35% with the side outline. The prompts will also call '
    'it &ldquo;blue-green like fir needles in shade&rdquo;.',
    [h3('The green, three ways'),
     row([
         fig(I['grA'], 'Warden as painted', '<b>As painted</b>: leaf-green.', w=240),
         fig(I['grB'], 'Warden with the colour lock', '<b>Colour-locked</b> to Thornwood&rsquo;s green.', PICK, w=240),
         fig(I['grC'], 'Warden after asking for the exact colour', '<b>Asked for the exact colour</b>: teal.', w=240)]),
     h3('The painted sheet'),
     grid('g2 stack', [
         fig(I['wd'], 'Warden front-view sheet', 'Nano Banana Pro from the clay model: <b>15 of 15</b> poses at the camera.', PICK),
         fig(I['wd2'], 'Warden sheet edited by the other model', 'Nano Banana 2.1 edit naming the colour: teal, 15 of 15.', OTHER)]),
     h3('The poses, cut out (colour-locked)'),
     pose_grid(PS['wd'], 'Thornwood Warden'),
     h3('Standing on the field, play zoom (true size)'),
     grid('g4', [
         fig(S['play-thorn-1'], 'Warden block as painted', '<b>As painted</b>.', true=True),
         fig(S['play-thorn-2'], 'Warden block colour-locked', '<b>Colour-locked</b>.', true=True),
         fig(S['play-thorn-3'], 'Warden block colour-locked with the side outline', '<b>Locked, with the side outline</b>.', true=True),
         fig(S['play-thorn-4'], 'Warden block of flat figures', 'Today&rsquo;s flat figures.', FLAT, true=True)]),
     h3('Closest zoom'),
     grid('g3 stack', [
         fig(S['close-thorn-1'], 'Warden block at closest zoom, as painted', '<b>As painted</b>.'),
         fig(S['close-thorn-2'], 'Warden block at closest zoom, colour-locked', '<b>Colour-locked</b>.'),
         fig(S['close-thorn-4'], 'Warden flat figures at closest zoom', 'Today&rsquo;s flat figures.', FLAT)]),
     ad('Not ready yet. The surcoat sits under the bark breastplate instead of over the chest; one edit fixes that. The '
        'colour range is set per nation from its first approved sheet, and the Cinder orange needs no lock.')],
    REC['warden']))

# 6 salamander
body.append(piece(6, 'p-sal', 'The Salamander, face 01, standing in the game',
    'Your note was that the Salamander on the field did not match its portrait. It is now painted from portrait 01: dark '
    'obsidian scales with a fine net of dull ember cracks, the broad flat head and folded neck, horn nubs along the jaw, '
    'three knobs on the brow, and the pale scrape across the snout. It stays as dark as the portrait. This is the second '
    'of its three reviews: standing in the game, not yet animated.',
    [h3('Beside its card portrait'),
     grid('g4', [
         fig(I['salP'], 'Salamander face 01, approved card portrait', '<b>The approved card portrait</b>, face 01.', dark=True),
         fig(I['salF'], 'Painted Salamander, front view', '<b>Front view</b> (when it is on the far side).', PICK),
         fig(I['salB'], 'Painted Salamander, back view', '<b>Back view</b>: battle c&rsquo;s near side.', PICK),
         fig(S['close-sal-proc'], 'The flat Salamander body used today', 'The flat body it replaces.', FLAT)]),
     h3('The scrape across the snout'),
     grid('g3 stack', [
         fig(I['scarP'], 'Portrait close-up of the snout scrape', '<b>Portrait</b>: the pale scrape.', dark=True),
         fig(I['scarA'], 'Front view head in the pilot', '<b>Pilot</b>: the scrape is faint.'),
         fig(I['scarB'], 'Front view head after one edit', '<b>Now</b>: one edit; nothing else changed.')]),
     h3('Standing on the field, closest zoom'),
     row([
         fig(S['close-sal-old'], 'Pilot Salamander standing on its tail tip', '<b>Pilot</b>: placed by its tail tip, so it seemed to rear up. The ring is where the battle stands it.', w=330),
         fig(S['close-sal-fix'], 'Fixed Salamander with a man for scale', '<b>Now</b>: hips on the ring, a shadow shaped like its body; a man for scale.', w=520),
         fig(S['close-sal-front'], 'Fixed Salamander front view on the field', '<b>Front view</b>, now.', w=340)], wrap=True),
     h3('Play zoom (true size)'),
     grid('g2', [
         fig(S['play-sal'], 'Salamander back and front views with a man at play zoom', 'Back view, a man, front view.', true=True),
         fig(S['play-sal-proc'], 'Flat Salamander at play zoom', 'Today&rsquo;s flat body.', FLAT, true=True)]),
     h3('The other model'),
     row([
         fig(I['salB2'], 'Salamander back view by Nano Banana Pro', 'Nano Banana Pro, back view: lit orange with glowing cracks, and turned toward the side (camera match 41%).', OTHER, w=260),
         fig(I['salF2'], 'Salamander front view by Nano Banana Pro', 'Nano Banana Pro, front view: it passes, but smoother and plainer than the portrait, with a looser fit to the camera (60% against 89%).', OTHER, w=260)]),
     ad('The most convincing figure on the field. At play zoom it is a dark shape on a mid ground; it must not be lightened, '
        'because the portrait is dark. It gains presence from its shadow now and, in the animation stage, from its ember '
        'cracks and throat glowing when it breathes fire.')],
    REC['sal']))

# 7 wolf rider
body.append(piece(7, 'p-wolf', 'Wolf Rider: a test of mounted figures',
    'Mounts keep your order: portrait first, then the figure standing in the game, then animation. This only tests whether '
    'the painter can do riders at the battle camera. On the first background (magenta) the grey fur came out pink; on blue '
    'it is clean (pink fur 30% down to 1%), with a lighter green and a pennon.',
    [h3('Two backgrounds'),
     row([
         fig(I['wkA'], 'Wolf Rider on the magenta background', '<b>Pilot</b>: pink cast on the fur, dark green.', w=260),
         fig(I['wkB'], 'Wolf Rider on the blue background', '<b>Blue background</b>: clean fur, lighter green, pennon.', w=222)]),
     h3('The painted sheet'),
     grid('g2 stack', [
         fig(I['wr'], 'Wolf Rider sheet on blue', 'Nano Banana Pro: <b>14 of 16</b> poses at the camera.', PICK),
         fig(I['wr2'], 'Wolf Rider sheet by the other model', 'Nano Banana 2.1: a fine wolf, but only in profile (<b>0 of 16</b>).', OTHER)]),
     h3('The poses, cut out'),
     pose_grid(PS['wr'], 'Wolf Rider'),
     h3('Standing on the field, play zoom (true size)'),
     grid('g4', [
         fig(S['play-wolves-1'], 'Wolf Riders, pilot', '<b>Pilot</b>.', true=True),
         fig(S['play-wolves-2'], 'Wolf Riders on the blue background, varied', '<b>Blue background</b>.', true=True),
         fig(S['play-wolves-3'], 'Wolf Riders with the side outline', '<b>With the side outline</b>.', true=True),
         fig(S['play-wolves-4'], 'Wolf Riders, flat figures', 'Today&rsquo;s flat figures.', FLAT, true=True)]),
     h3('Closest zoom'),
     grid('g3 stack', [
         fig(S['close-wolves-1'], 'Wolf Riders at closest zoom, pilot', '<b>Pilot</b>.'),
         fig(S['close-wolves-2'], 'Wolf Riders at closest zoom, blue background', '<b>Blue background</b>.'),
         fig(S['close-wolves-4'], 'Flat Wolf Riders at closest zoom', 'Today&rsquo;s flat figures.', FLAT)]),
     ad('Promising, not for approval. The wolves need a darker coat to stand out from swamp ground, and the War Wolf&rsquo;s '
        'portrait comes first, in the next stage.')],
    REC['wolf'], probe='Test only'))

# 8 bust
body.append(piece(8, 'p-bust', 'Warden card bust, beside two leader portraits',
    'Troop cards get a painted bust in the same framing and candlelight as your leader portraits, so troops and leaders '
    'read as one family. The side&rsquo;s green shows on the leaf mantle, the tunic and the helm&rsquo;s leaf crest. In '
    'production each bust is painted after its troop&rsquo;s figure, so the two match.',
    [h3('Large'),
     grid('g3 stack', [
         fig(I['bust'], 'Warden card bust', '<b>Warden card bust</b>, Nano Banana 2.1.', PICK, dark=True),
         fig(I['wcP'], 'Warden Captain 07 leader portrait', 'Warden Captain 07, approved leader.', dark=True),
         fig(I['edP'], 'Elder Druid 08 leader portrait', 'Elder Druid 08, approved leader.', dark=True)]),
     h3('At card size'),
     '<div class="grid" style="grid-template-columns:repeat(3,max-content);gap:14px;align-items:end">'
     + fig(I['bustS'], 'Warden bust at card size', 'Bust', true=True, dark=True)
     + fig(I['wcS'], 'Warden Captain 07 at card size', 'Captain', true=True, dark=True)
     + fig(I['edS'], 'Elder Druid 08 at card size', 'Druid', true=True, dark=True) + '</div>',
     h3('The other model'),
     row([fig(I['bust2'], 'Warden card bust by Nano Banana Pro', 'Nano Banana Pro: shield and sword still in frame, a classical crested helmet.', OTHER, dark=True, w=340)]),
     ad('Same hand, framing and light as the leaders.')],
    REC['bust']))

# 9 motion
body.append(piece(9, 'p-motion', 'Motion from the painted poses',
    'A first look at the animation, made only from the painted poses: the near side marches in place (two stepping poses '
    'with a bob), and the far side&rsquo;s front rank strikes (wind-up, strike, follow-through, with a lunge). Each man keeps '
    'his own timing. Shown at closest zoom.',
    [grid('g2 stack', [
        fig(MO['motion-near'], 'Near side marching in place, looping', '<b>Near side</b>: marching in place.'),
        fig(MO['motion-far'], 'Far side front rank striking, looping', '<b>Far side</b>: the front rank strikes.')]),
     ad('It reads as motion. If it still looks stiff at the animation review, we add a second sheet of poses per view: four '
        'walking and two running frames, a second strike and a second death.')],
    REC['motion']))

body.append('''<section class="card" id="director" aria-labelledby="dir-h"><h2 id="dir-h">The art director&rsquo;s verdict</h2>
<p class="lead"><b>Go, with changes.</b> The painted direction is right, and the pilot proved the hard part: painted figures
can be made at the battle camera, in the portraits&rsquo; hand, and the Salamander now matches its portrait. Show you this
pilot with the fixes in, then start the next stage for troops and commanders. Monsters, gods and mounts keep your order.</p>
<h3>Changes planned for production</h3>
<ol class="tight">
<li>Every soldier wears a sleeveless surcoat in his side&rsquo;s cloth; robed casters keep their robes.</li>
<li>At play zoom a thin outline in the side&rsquo;s dark shade; up close a neutral one.</li>
<li>Clean edges and lively blocks: the coloured rim is removed automatically (a check stops any sheet that keeps one), and
no two men in a block are alike in rest pose, size, shade or timing.</li>
<li>Big creatures stand where the battle puts them, and cast a shadow shaped like their body.</li>
<li>Commanders: a camera-right body first, then each face painted on from its approved portrait. A 12-picture test opens
the next stage.</li>
<li>Both views of a unit come from the same model, so they match up close; every mark of a monster, god or commander
(scars, crowns, horns) is named and checked against its portrait close up.</li>
<li>Thornwood&rsquo;s green is named as blue-green and locked to the nation&rsquo;s colour after painting.</li>
<li>Mounts, after their portraits: a blue background for grey fur, lighter cloth, darker coats.</li>
<li>Animation starts from the painted poses; a monster&rsquo;s action poses are edits of its approved standing figure; the
Salamander&rsquo;s ember cracks get their own glow.</li>
<li>Magic is reviewed to this same standard: painted, at both zooms, with its light on figures and ground, beside its
storyboard. Fireball against Entangle first.</li>
</ol>
<p class="note"><b>For you to decide later:</b> the battle ground and its trees, reeds and river are still in the flat
style, and beside painted figures they now look different. A painted ground would fit with the later build that brings
cities into battles.</p>
</section>''')

body.append('''<section class="card" id="numbers" aria-labelledby="num-h"><h2 id="num-h">The numbers that matter</h2>
<div class="tablewrap"><table>
<thead><tr><th scope="col">Piece</th><th scope="col">Side colour at play zoom</th><th scope="col">Poses at the camera</th><th scope="col">Rim on the edges</th></tr></thead>
<tbody>
<tr><th scope="row">Near soldier</th><td data-label="Side colour" class="n">33% → 38% <span class="sub">63% with the side outline</span></td><td data-label="At the camera" class="n ok">14 of 15</td><td data-label="Rim on edges" class="n">17% → <span class="ok">0%</span></td></tr>
<tr><th scope="row">Far soldier</th><td data-label="Side colour" class="n"><span class="bad">17%</span> → 37% <span class="sub">with surcoat; 61% with outline</span></td><td data-label="At the camera" class="n ok">13 of 15</td><td data-label="Rim on edges" class="n">25% → <span class="ok">0%</span></td></tr>
<tr><th scope="row">Thornwood Warden</th><td data-label="Side colour" class="n"><span class="bad">3%</span> → 18% <span class="sub">colour-locked; 35% with outline</span></td><td data-label="At the camera" class="n ok">15 of 15</td><td data-label="Rim on edges" class="n">not measured yet</td></tr>
<tr><th scope="row">Wolf Rider (test)</th><td data-label="Side colour" class="n"><span class="bad">1%</span> → 13% <span class="sub">blue background; 32% with outline</span></td><td data-label="At the camera" class="n ok">14 of 16</td><td data-label="Rim on edges" class="n">0.4% → <span class="ok">0%</span></td></tr>
<tr><th scope="row">Ash Chieftain 06</th><td data-label="Side colour">no cloth <span class="sub">his side shows by the outline</span></td><td data-label="At the camera" class="n"><span class="ok">13 of 15</span> <span class="sub">other route 2 of 16</span></td><td data-label="Rim on edges" class="n">—</td></tr>
<tr><th scope="row">Salamander</th><td data-label="Side colour">matches the portrait <span class="sub">colour gap 3.0 and 4.5; limit 18</span></td><td data-label="At the camera" class="n"><span class="ok">92% / 89%</span> <span class="sub">outline match, back / front</span></td><td data-label="Rim on edges" class="n">6% / 24% → <span class="ok">0%</span></td></tr>
</tbody></table></div>
<p class="note"><b>Side colour</b>: the share of a block that shows its side&rsquo;s colour at play zoom. We aim for 30% or
more; today&rsquo;s flat figures show 33 to 38%. <b>Poses at the camera</b>: how many of a sheet&rsquo;s poses match the clay
model&rsquo;s view from above (the sixteenth cell of a foot sheet holds the dropped weapons); we ask for 13 of 15, 14 of 16
for riders. For the Salamander it is how closely its outline covers the clay model&rsquo;s. <b>Rim on the edges</b>: the share
of a figure&rsquo;s outline tinted by the painter&rsquo;s background; the limit is 2%.</p>
</section>''')

body.append('''<section class="verdict" id="verdict" aria-labelledby="ver-h"><h2 id="ver-h">Your verdict</h2>
<p class="note" id="count"></p>
<div class="answers" id="answers"></div>
<div class="vrow" id="overall" style="border-top:none;padding-top:0"><span class="vq">Overall</span>
<button type="button" class="vbtn" data-v="Go" aria-pressed="false">Go</button>
<button type="button" class="vbtn" data-v="Not yet" aria-pressed="false">Not yet</button>
<span class="rec">Go starts stage B for troops and commanders, with the changes above.</span></div>
<label for="general" class="note">Notes (optional)</label>
<textarea id="general" placeholder="Anything else: a look you want, a figure that feels wrong, what to see next"></textarea>
<pre id="summary" aria-live="polite"></pre>
<button class="big-btn" id="copy" type="button">Copy verdict</button>
<p class="note">Your picks are kept in this browser, so you can come back to them.</p>
</section>''')

pieces_json = json.dumps([{'id': a, 'anchor': b, 'short': c} for a, b, c, _ in PIECES]).replace('</', '<\\/')
tpl = open(f'{U}/review-page/template.html').read()
page = tpl.replace('__BODY__', '\n'.join(body)).replace('__PIECES__', pieces_json)
open(OUT, 'w').write(page)
total = os.path.getsize(OUT)
print(f'{OUT}: {total / 1e6:.2f} MB, {len(SIZES)} pictures, {sum(SIZES.values()) / 1e6:.2f} MB of WebP')
for k, v in sorted(SIZES.items(), key=lambda kv: -kv[1])[:12]:
    print(f'  {k}: {v // 1024} KB')
