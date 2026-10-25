# Builds units/stage-c/review.html: the owner's stage C review page (owner review 2: the approved creatures, mounts and
# gods as figures standing in the game). One self-contained file, WebP data URIs, Google Fonts only.
# Usage: python3 build_review.py      (LOOK=1 also writes every embedded picture to look/ for checking)
# Checks after a build: node shoot_page.cjs; node a11y_check.cjs ../review.html a11y-out/a11y.json
import json, os, sys
sys.dont_write_bytecode = True
from html import escape as E

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import assets as A  # noqa: E402
import content as C  # noqa: E402
from script import SCRIPT  # noqa: E402

OUT = os.path.join(A.SC, 'review.html')
NAT = {'cinderHorde': 'Cinder Horde', 'thornwood': 'Thornwood', 'independent': 'Independent', 'common': 'any nation'}


def img(src, alt, cls='z', extra=''):
    url, size = src
    return (f'<img class="{cls}" src="{url}" alt="{E(alt)}" width="{size[0]}" height="{size[1]}" decoding="async" '
            f'loading="lazy"{extra}>')


def zb(label, html):
    """One keyboard stop per group of pictures. It opens the group in the lightbox, stepped with the arrow keys. It is
    hidden until focused; a tap or click on a picture opens it too."""
    n = html.count('<img class="z')
    assert n, label
    what = 'the picture' if n == 1 else f'{n} pictures'
    return f'<button type="button" class="zb" aria-label="View full size, {what}: {E(label)}">View full size, {what}</button>'


def vrow(key, short, buttons, rec=None, rec_text='', note_ph='Note (optional)', label='Your call'):
    b = []
    for v in buttons:
        tag = '<span class="rtag"> recommended</span>' if v == rec else ''
        b.append(f'<button type="button" class="vbtn" data-v="{E(v)}" aria-pressed="false">{E(v)}{tag}</button>')
    r = f'<span class="rec">{rec_text}</span>' if rec_text else ''
    return (f'<div class="vrow" data-key="{E(key)}" data-short="{E(short)}"' + (f' data-def="{E(rec)}"' if rec else '')
            + f'><span class="vq">{E(label)}</span>{"".join(b)}'
            f'<input type="text" aria-label="Note: {E(short)}" placeholder="{E(note_ph)}">{r}</div>')


def notes(items):
    return '<ul class="stat">' + ''.join(
        f'<li class="{"ok" if ok else "flaw"}"><span class="sr">{"Holds: " if ok else "Still off: "}</span>{E(t)}</li>'
        for ok, t in items) + '</ul>'


def men(wu):
    m = wu / C.MAN_WU
    return f'{m:.1f}'.rstrip('0').rstrip('.')


def fig_views(srcs, caps, alts, disp_h, k_embed, cls='z', attrs=''):
    """Views at one scale: each figure's css width from its embedded width, so that the tallest shows disp_h css px."""
    h = srcs[0][1][1]
    s = disp_h / h
    out, tot = [], 0
    for src, cap, alt in zip(srcs, caps, alts):
        w = round(src[1][0] * s)
        tot += w
        out.append(f'<figure style="--w:{w}px">{img(src, alt, cls)}<figcaption>{E(cap)}</figcaption></figure>')
    tot += 8 * (len(srcs) - 1)
    return f'<div class="views" style="--vw:{tot}px"{attrs}>' + ''.join(out) + '</div>'


def disp_height(srcs, k_embed, cap=300, up=1.5):
    """css height: never more than `up` times the packed art's own pixels, never taller than cap."""
    natural = srcs[0][1][1] / k_embed
    return min(cap, round(natural * up))


def por_fig(src, alt, cap, w=180):
    return f'<figure class="por" style="--w:{w}px">{img(src, alt, "z por")}<figcaption>{cap}</figcaption></figure>'


def crop_fig(spec, name):
    key, unit, zoom, box, cap = spec
    src = A.shot(A.battle(key, unit, zoom), box, max_w=1280 if zoom.endswith('dpr2') else None, q=76 if zoom.endswith('dpr2') else 88,
                 name=f'crop-{name}-{key}-{zoom}')
    if zoom.startswith('play'):
        return f'<figure class="crop actual" style="--w:{src[1][0]}px">{img(src, cap, "z")}<figcaption>{E(cap)}</figcaption></figure>'
    return f'<figure class="crop" style="--w:440px">{img(src, cap, "z")}<figcaption>{E(cap)}</figcaption></figure>'


# in-game crops: (battle, unit shot, zoom, box in the shot's pixels, caption). top-dpr2 = the closest zoom at 2x pixels;
# play-dpr1 = play zoom (a man 28 px), actual pixels on a wide screen
CROPS = {
    'fireSprite': [('c', 'fireSprite', 'top-dpr2', (820, 420, 1760, 1060), 'Battle c, zoomed in: a flight of Fire Sprites ahead of the Cinder archers.')],
    'hornetSwarm': [('c', 'hornetSwarm', 'top-dpr2', (840, 500, 1720, 1060), 'Battle c, zoomed in: the swarm, twelve hornets to a figure.'),
                    ('c', 'hornetSwarm', 'play-dpr1', (850, 450, 1260, 720), 'Battle c at play zoom, actual pixels: brown specks beside the Thornwood archers, no longer teal.')],
    'ashRider': [('a', 'ashRider', 'top-dpr2', (820, 360, 1800, 1000), 'Battle a, zoomed in: the Ash Riders from behind (your side), beyond the Cinder skirmishers.')],
    'wolfRider': [('b', 'wolfRider', 'top-dpr2', (360, 160, 1760, 1000), 'Battle b, zoomed in: Wolf Riders from behind, on your side, beside the Wardens.'),
                  ('c', 'wolfRider', 'top-dpr2', (260, 300, 1680, 960), 'Battle c, zoomed in: enemy Wolf Riders from the front (the harness), beside Wardens.'),
                  ('c', 'wolfRider', 'play-dpr1', (720, 330, 1080, 590), 'Battle c at play zoom, actual pixels: the riders read grey-green beside the Wardens.')],
    'treant01': [('b', 'treant', 'top-dpr2', (1000, 320, 2400, 1220), 'Battle b, zoomed in: Treant 01 from behind, beside the Thornwood druids and Wardens.')],
    'greatWyrm': [('a', 'greatWyrm', 'top-dpr2', (560, 100, 1960, 1380), 'Battle a, zoomed in: the Thornwood Great Wyrm from the front.')],
}


# ================================================================== header
def header():
    return f'''<header class="top">
<a class="skip" href="#verdict">Skip to verdict</a>
<span class="eyebrow">Fluid Magic · painted battle figures · stage C</span>
<h1>Creatures, mounts and gods, standing in the game</h1>
<p class="lead">This is the second of your three reviews of the monsters, mounts and gods. You approved their portraits on
the stage B page; stage C makes each approved portrait a figure standing in the game, painted from behind (how your own
units face away from you) and from the front (how the enemy faces you), at its true size on the field. Nothing moves yet:
animation and magic are stage D, your third review.</p>
<p class="lead">Answer what you like: Keep or Redo for each figure, and seven questions at the end, where our suggestion
is already selected. Then press <b>Copy verdict</b> and paste the line into the chat.</p>
<div class="links">
<a id="mockup-link" href="{C.MOCKUP_URL}" target="_blank" rel="noopener"><b>The battle mockup</b><span>the three battles, with every painted creature and god that fights in them</span></a>
<a id="lineup-link" href="{C.LINEUP_URL}" target="_blank" rel="noopener"><b>The lineup</b><span>all 37 figures side by side by size, with a man and a commander for scale</span></a>
</div>
<nav class="toc" aria-label="On this page"><a href="#short">In short</a>
<a href="#creatures">1 · Creatures and mounts</a><a href="#gods">2 · Gods</a><a href="#questions">3 · Questions</a><a href="#verdict">Your verdict</a></nav>
</header>'''


def short():
    left = C.BUDGET['total'] - C.BUDGET['used']
    return f'''<section class="card brass" id="short" aria-labelledby="short-h"><h2 id="short-h">In short</h2>
<ul class="tight">
<li><b>37 figures from your approved portraits:</b> 15 creatures and mounts (section 1) and 16 gods, six of them in both
nations&rsquo; colours (section 2). Each stands in both views at its true size on the field, beside its portrait.</li>
<li><b>We reviewed them ourselves first and fixed what we found</b>, with 17 re-paints and a dozen smaller corrections.
The hornet is now a black-and-ochre wasp and no longer reads teal; the Oakheart wears its tall bark helm; the Treant
crowns are complete; the Wild Spirit stands on four hooves from behind; the Ash Colossus is lean and charcoal like its
portrait; the Ash Rider&rsquo;s horse is dark charcoal from the front; the Wolf Rider is bigger and its wolves keep one
coat; the Ascended Hero no longer shrinks when he turns.</li>
<li><b>What is still not right is marked with !</b> under each figure: the Oakheart is still squat, the Ash Horse has
no caparison over its chest, the hornet has one view and two poses off the camera, far-side Wolf Riders read grey-green
at play zoom, three god fronts (Ascended Hero, Primordial, Ash Phoenix) differ from our camera models, and the Living
Monolith&rsquo;s front came out nearly a copy of its back.</li>
<li><b>Seven questions</b> at the end (section 3), our suggestion selected in each. Two of them are already done so you
can judge them: the Wolf Rider at its planned size, and every pretender god drawn 1.15 times its ladder height.</li>
<li><b>Cost so far:</b> {C.BUDGET["used"]} of stage C&rsquo;s {C.BUDGET["total"]} paintings. {left} are left for your Redo picks; a
Redo usually takes one to three.</li>
</ul></section>'''


# ================================================================== 1. creatures and mounts
def creature(c):
    fig = c['fig']
    meta = A.fig_meta(fig)
    nation = meta.get('nation', 'common')
    por = A.portrait(meta['portrait'], px=448)
    pics = [por_fig(por, f'{c["name"]}: your approved portrait ({c["pick"]})', f'Your portrait, {E(c["pick"])}')]
    if fig == 'hornetSwarm':
        h = A.hornet_images()
        p, s1, cl = h['painted'], h['single'], h['cluster']
        pics.append(f'<figure style="--w:{p[1][0]}px">{img(p, "One hornet as painted, before it is shrunk for the game")}<figcaption>one hornet, as painted</figcaption></figure>')
        pics.append(f'<figure style="--w:{s1[1][0] * 3}px">{img(s1, "One hornet as the game packs it at its closest zoom, shown three times larger")}<figcaption>as packed (×3)</figcaption></figure>')
        pics.append(f'<figure style="--w:{cl[1][0] * 2}px">{img(cl, "One figure of twelve hornets at the closest zoom, shown twice as large")}<figcaption>one figure: 12 hornets (×2)</figcaption></figure>')
    else:
        views = [v for v in ('back', 'front', 'frontKept') if v in meta['views']]
        srcs, k = A.view_set([A.creature_view(fig, v) for v in views], cap_h=560, name=f'cre-{fig}')
        caps = [C.VIEW_CAPTION[v] if not (fig == 'wolfRider' and v == 'front') else 'front: War Wolf harness' for v in views]
        alts = [f'{c["name"]}, {cap}, standing' for cap in caps]
        pics.append(fig_views(srcs, caps, alts, disp_height(srcs, k), k))
    pics_html = ''.join(pics)
    crops = ''.join(crop_fig(s, c['id']) for s in CROPS.get(c['id'], []))
    group_html = pics_html + crops
    tags = ''.join(f'<span class="tag">{E(t)}</span>' for t in c['tags'])
    if c.get('battle'):
        tags += f'<span class="tag field">in battle {E(c["battle"])}</span>'
    else:
        tags += '<span class="tag">not in the three battles</span>'
    hh = height_tag(fig, meta)
    if hh:
        tags += f'<span class="tag">{hh}</span>'
    return (f'<article class="fig {nation}" id="f-{c["id"]}" data-zg aria-labelledby="f-{c["id"]}-h"><header><h4 id="f-{c["id"]}-h">{E(c["name"])}</h4>{tags}</header>'
            f'<p class="what">{E(c["what"])}</p>'
            f'<div class="pics">{zb(c["name"], group_html)}{group_html}</div>'
            + notes(c['notes'])
            + vrow('f:' + c['id'], c['short'], ['Keep', 'Redo'], rec_text='Redo: say what in the note',
                   note_ph='What should change? (needed for Redo)')
            + '</article>')


def height_tag(fig, meta):
    """Height in men (a foot soldier is 1 man, 28 wu) from the packer's own records."""
    v = meta['views']
    if 'heightWu' in v.get('front', {}) and v['front'].get('heightWu'):
        f, b = v['front']['heightWu'], v['back']['heightWu']
        return f'{men(f)} men tall from the front, {men(b)} from behind' if abs(f - b) > 2 else f'{men(max(f, b))} men tall'
    layout = A.KEYPOSE_LAYOUT.get(fig)
    if layout in ('cavalry', 'wolfrider', 'melee'):
        px = v['front']['atlas']['S']['standPx']
        end = {'cavalry': ' (rider’s head to the hooves)', 'wolfrider': ' (rider’s head to the paws)'}.get(layout, '')
        return f'{men(px * A.WU_S)} men tall' + end
    return ''


def creatures():
    out = ['''<section class="piece" id="creatures" aria-labelledby="creatures-h"><div class="phead"><span class="num">1</span>
<h2 id="creatures-h">Creatures and mounts</h2></div>
<p class="lead">For each figure: your approved portrait, then the figure as the game draws it at its closest zoom, from
behind and from the front, on the battle ground&rsquo;s colour. Where it fights in one of the three battles, crops from the
battle mockup follow. &#10003; marks what holds; ! marks what is still off. Heights are given in men: a foot soldier is one
man, a commander 1.14.</p>''']
    for title, lead, items in C.CREATURE_GROUPS:
        out.append(f'<h3 class="grp">{E(title)}</h3><p class="note gl">{E(lead)}</p>')
        out.extend(creature(c) for c in items)
    out.append('</section>')
    return '\n'.join(out)


# ================================================================== 2. gods
def god(g):
    gid = g['id']
    cinder = f'{gid}-cinderHorde' if f'{gid}-cinderHorde' in A.GODS['figures'] else f'{gid}-thornwood'
    f = A.GODS['figures'][cinder]
    nation = f['nation']
    p = f['portrait']
    pick = p.get('pick', '')
    por = A.portrait(p['master'], px=448)
    srcs, k = A.view_set([A.god_view(cinder, v) for v in ('front', 'back')], cap_h=640, name=f'god-{cinder}')
    caps = ['from the front', 'from behind']
    alts = [f'{g["name"]}, {"Cinder Horde colours, " if g.get("both") else ""}{c}' for c in caps]
    pics = por_fig(por, f'{g["name"]}: your approved portrait ({pick})', f'Your portrait, {E(pick)}')
    pics += fig_views(srcs, caps, alts, disp_height(srcs, k, cap=300), k)
    if g.get('both'):
        tf = f'{gid}-thornwood'
        tp = A.GODS['figures'][tf]['portrait']
        tpor = A.portrait(tp['master'], px=160, q=78)
        tsrcs, tk = A.view_set([A.god_view(tf, v) for v in ('front', 'back')], cap_h=260, q=80, name=f'god-{tf}')
        tcaps = ['front', 'behind']
        pics += (f'<div class="tw"><span class="twl">Thornwood colours</span><div class="twr">'
                 f'<figure class="por" style="--w:72px">{img(tpor, g["name"] + ": Thornwood portrait", "z por")}</figure>'
                 + fig_views(tsrcs, tcaps, [f'{g["name"]}, Thornwood colours, {c}' for c in ('from the front', 'from behind')], 130, tk)
                 + '</div></div>')
    crops = ''.join(crop_fig(s, gid) for s in CROPS.get(gid, []))
    fv, bv = f['views']['front'], f['views']['back']
    hh = f'{men(fv["heightWu"])} men tall from the front, {men(bv["heightWu"])} from behind' if abs(fv['heightWu'] - bv['heightWu']) > 2 else f'{men(max(fv["heightWu"], bv["heightWu"]))} men tall'
    tags = f'<span class="tag">size {g["size"]}{", flies" if g.get("flies") else ""}{", does not move" if g.get("still") else ""}</span>'
    if g.get('both'):
        tags += '<span class="tag">either nation: one pick covers both colours</span>'
    if g.get('battle'):
        tags += f'<span class="tag field">in battle {g["battle"]}</span>'
    tags += f'<span class="tag">{hh}</span>'
    return (f'<article class="fig {nation if not g.get("both") else "independent"}" id="g-{gid}" data-zg aria-labelledby="g-{gid}-h"><header><h4 id="g-{gid}-h">{E(g["name"])}</h4>{tags}</header>'
            f'<p class="what">{E(g["what"])}</p>'
            f'<div class="pics">{zb(g["name"], pics + crops)}{pics}{crops}</div>'
            + notes(g['notes'])
            + vrow('g:' + gid, g['name'], ['Keep', 'Redo'], rec_text='Redo: say what in the note',
                   note_ph='What should change? (needed for Redo)')
            + '</article>')


def gods():
    out = ['''<section class="piece" id="gods" aria-labelledby="gods-h"><div class="phead"><span class="num">2</span>
<h2 id="gods-h">Gods</h2></div>
<p class="lead">For each god: your approved portrait, painted whole as you saw it, then the figure from the front and from
behind. The six gods either nation can take carry Thornwood colours as a colour edit of the same painting, shown small
beside them (question 7); one pick covers both colours.</p>
<p class="ad"><b>Size.</b> Every god is drawn at its size&rsquo;s ladder height times 1.15, the pretender factor (the
same lift a commander gets over his men), so a god outgrows its own commanders (question 4). A size 2 god stands about 1.5 to 1.7 men, a
size 6 god 7.5 men or more. Long bodies, the wyrms and the Primordial, stand taller still on screen, because their
length runs back into the depth at the camera&rsquo;s angle (question 5).</p>''']
    for title, items in C.GOD_GROUPS:
        out.append(f'<h3 class="grp">{E(title)}</h3>')
        out.extend(god(g) for g in items)
    out.append('</section>')
    return '\n'.join(out)


# ================================================================== 3. questions
def H(fig_key):
    """Tier H front views for the scale strips: (image, anchor)."""
    kind, ref = fig_key
    if kind == 'man':
        return A.frame(os.path.join(A.SB, 'atlas', 'troops', 'troops-cinderHorde-H'), 'cinderWarrior.front.stand')
    if kind == 'cmd':
        return A.frame(os.path.join(A.SB, 'atlas', 'cmdA', 'ashChieftain.H'), 'ashChieftain-06.front.stand')
    if kind == 'cre':
        return A.creature_view(ref, 'front')
    if kind == 'god':
        return A.god_view(ref, 'front')
    raise ValueError(kind)


def strip_fig(items, k, cap, alt, name, maxw=None):
    src = A.strip(items, k=k, name=name)
    w = src[1][0] if not maxw else min(maxw, src[1][0])
    return f'<figure style="--w:{w}px">{img(src, alt)}<figcaption>{cap}</figcaption></figure>'


def question(n, q):
    head = f'<h3><span class="qn">Question {n}</span><span>{E(q["title"])}</span></h3><p>{E(q["body"])}</p>'
    qid = q['id']
    pics = ''
    if qid == 'hornet':
        pa = A.portrait('stage-b/portraits/thornwood/hornetSwarm/01a-r2.webp', px=448)
        pb = A.portrait('stage-b/portraits/thornwood/hornetSwarm/01b.webp', px=448)
        pics = (por_fig(pb, 'Hornet Swarm portrait B, standing in', '<b>B</b>, standing in: lean, dark, open jaws', 200)
                + por_fig(pa, 'Hornet Swarm portrait A', '<b>A</b>: heavier, hard-shelled', 200))
    elif qid == 'wolfFront':
        srcs, k = A.view_set([A.creature_view('wolfRider', v) for v in ('front', 'frontKept')], name='q-wolffront')
        pics = fig_views(srcs, ['War Wolf harness', 'kept test'], ['Wolf Rider front, War Wolf harness', 'Wolf Rider front, kept test'], disp_height(srcs, k, cap=250), k)
        cmp = os.path.join(A.SHOTS, 'close', 'c-wolfrider-front-compare.png')
        sh = A.shot(cmp, (0, 62, 1200, 900), max_w=900, q=78, name='q-wolffront-harness')
        sk = A.shot(cmp, (1220, 62, 2420, 900), max_w=900, q=78, name='q-wolffront-kept')
        pics += ('<div class="views" style="--vw:808px">'
                 f'<figure style="--w:400px">{img(sh, "Battle c, zoomed in: enemy Wolf Riders with the War Wolf harness front")}<figcaption>Battle c: the harness</figcaption></figure>'
                 f'<figure style="--w:400px">{img(sk, "Battle c, zoomed in: enemy Wolf Riders with the kept test front")}<figcaption>Battle c: the kept test</figcaption></figure></div>')
    elif qid == 'wolfSize':
        wr = H(('cre', 'wolfRider'))
        items = [H(('man', None)), H(('cre', 'wolf')), (wr[0], wr[1], 65 / 74), wr]
        pics = strip_fig(items, 1.0, 'A foot soldier, a summoned Wolf, the Wolf Rider <b>as it was</b>, and <b>now</b> at the plan&rsquo;s size; all from the front, at the closest zoom.',
                         'Scale: a foot soldier, a summoned Wolf, the Wolf Rider as it was, and the Wolf Rider now', 'q-wolfsize')
    elif qid == 'godSize':
        gl = ['oracle-cinderHorde', 'ascendedHero-cinderHorde', 'emberHierophant-cinderHorde', 'wildSpirit-thornwood']
        base = [H(('man', None)), H(('cmd', None))]
        now = base + [H(('god', g)) for g in gl]
        was = base + [(H(('god', g))[0], H(('god', g))[1], 1 / 1.15) for g in gl]
        pics = (strip_fig(now, 0.8, '<b>Now, 1.15 times larger:</b> a foot soldier, a commander, then the size 2 gods Oracle, Ascended Hero, Ember Hierophant and Wild Spirit.',
                          'Now: a foot soldier, a commander and four size 2 gods drawn 1.15 times larger', 'q-godsize-now')
                + strip_fig(was, 0.8, '<b>Without it, at the ladder:</b> the same figures, the gods 1.15 times smaller.',
                            'Without the factor: the same figures with the gods at their ladder height', 'q-godsize-was'))
    elif qid == 'longBodies':
        items = [(i[0], i[1], 0.2) for i in [H(('man', None)), H(('cre', 'giant-01')), H(('god', 'livingMonolith-cinderHorde')),
                                               H(('god', 'greatWyrm-thornwood')), H(('god', 'primordial-cinderHorde')), H(('god', 'elderWyrm-thornwood'))]]
        pics = strip_fig(items, 1.0, 'From the left: a foot soldier, a Giant (size 4), the Living Monolith (size 6, upright), then the long size 6 bodies: Great Wyrm, Primordial and Elder Wyrm, all from the front at one scale.',
                         'Scale: a foot soldier, a Giant, the Living Monolith, the Great Wyrm, the Primordial and the Elder Wyrm', 'q-long')
    elif qid == 'palettes':
        figs = []
        for gid, nm in (('greatWyrm', 'Great Wyrm'), ('titan', 'Titan'), ('oracle', 'Oracle'), ('livingMonolith', 'Living Monolith'),
                        ('ascendedHero', 'Ascended Hero'), ('primordial', 'Primordial')):
            srcs, k = A.view_set([A.god_view(f'{gid}-{n}', 'front') for n in ('cinderHorde', 'thornwood')], cap_h=240, q=78, name=f'q-pal-{gid}')
            figs.append(fig_views(srcs, [f'{nm}, Cinder', 'Thornwood'], [f'{nm}, Cinder Horde colours, front', f'{nm}, Thornwood colours, front'], 120, k,
                                  attrs=f' role="group" aria-label="{E(nm)}"'))
        pics = ''.join(figs)
    rows = ''
    if q.get('rows'):
        for r in q['rows']:
            rp = ''
            if r['key'] == 'q:phoenixFront':
                rp = small_pair('ashPhoenix-cinderHorde', 'Ash Phoenix', god=True)
            elif r['key'] == 'q:primordialFront':
                rp = small_pair('primordial-cinderHorde', 'Primordial', god=True)
            elif r['key'] == 'q:spriteWings':
                rp = small_pair('fireSprite', 'Fire Sprite', god=False)
            rows += (f'<div class="qrow" data-zg><div class="qrl">{zb(r["label"], rp)}{rp}<p><b>{E(r["label"])}.</b> {E(r["text"])}</p></div>'
                     + vrow(r['key'], r['short'], r['buttons'], rec=r['rec'], rec_text=f'Suggested: {E(r["rec"])}, selected for you',
                            note_ph='Note (optional)') + '</div>')
        return f'<article class="q" id="q-{qid}">{head}{rows}</article>'
    group = f'<div class="qpics" data-zg>{zb(q["title"], pics)}{pics}</div>' if pics else ''
    return (f'<article class="q" id="q-{qid}">{head}{group}'
            + vrow(q['key'], q['short'], q['buttons'], rec=q['rec'], rec_text=f'Suggested: {E(q["rec"])}, selected for you',
                   note_ph='Note (optional)') + '</article>')


def small_pair(fig, name, god):
    if god:
        p = A.GODS['figures'][fig]['portrait']['master']
        v = A.god_view(fig, 'front')
    else:
        p = A.fig_meta(fig)['portrait']
        v = A.creature_view(fig, 'front')
    por = A.portrait(p, px=200, q=78)
    srcs, k = A.view_set([v], cap_h=280, q=80, name=f'q-pair-{fig}')
    return (f'<figure class="por" style="--w:110px">{img(por, f"{name}: your approved portrait", "z por")}<figcaption>portrait</figcaption></figure>'
            + fig_views(srcs, ['front'], [f'{name}, from the front'], 150, k))


def questions():
    out = ['''<section class="piece" id="questions" aria-labelledby="questions-h"><div class="phead"><span class="num">3</span>
<h2 id="questions-h">Questions</h2></div>
<p class="lead">Our suggestion is already selected in each and marked &ldquo;recommended&rdquo;; leave it, or press the
other answer. Pressing a selected answer again clears it.</p>''']
    for n, q in enumerate(C.QUESTIONS, 1):
        out.append(question(n, q))
    out.append('</section>')
    return '\n'.join(out)


# ================================================================== verdict
def verdict():
    return '''<section class="verdict" id="verdict" aria-labelledby="ver-h" tabindex="-1"><h2 id="ver-h">Your verdict</h2>
<p class="note" id="count"></p>
<div class="answers" id="answers" role="group" aria-label="Your answers so far. The arrow keys move between them."></div>
<label for="general" class="note">Notes (optional)</label>
<textarea id="general" placeholder="Anything else: a look you want, what to paint next, what to see in stage D"></textarea>
<pre id="summary" aria-live="polite"></pre>
<button class="big-btn" id="copy" type="button">Copy verdict</button>
<p class="note">Your picks are kept in this browser, so you can come back to them.</p>
</section>'''


def main():
    css = open(os.path.join(HERE, 'page.css')).read()
    body = [header(), short(), creatures(), gods(), questions(), verdict()]
    html = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Stage C Review</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Marcellus+SC&family=Alegreya+Sans:ital,wght@0,400;0,500;0,700;1,400&family=IBM+Plex+Mono:wght@500&display=swap">
<style>
{css}
</style>
</head>
<body>
<div class="wrap">
{chr(10).join(body)}
</div>
<div id="lb" role="dialog" aria-modal="true" aria-label="Picture, full size"><img alt=""><button type="button" class="lbx">Close</button><button type="button" class="lbp" aria-label="Previous picture" hidden>&lsaquo;</button><button type="button" class="lbn" aria-label="Next picture" hidden>&rsaquo;</button><p class="lbcap" aria-live="polite"></p></div>
{SCRIPT}
</body>
</html>
'''
    open(OUT, 'w').write(html)
    print(json.dumps({'out': OUT, 'bytes': os.path.getsize(OUT), 'images': A.STATS['n'], 'imageBytes': A.STATS['bytes']}))


if __name__ == '__main__':
    main()
