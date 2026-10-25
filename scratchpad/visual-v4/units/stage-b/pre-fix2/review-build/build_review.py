# Builds units/stage-b/review.html: the owner's stage B review page (one self-contained file, WebP data URIs,
# Google Fonts only). Usage: python3 build_review.py
import json, os, sys
from html import escape as E

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import assets as A  # noqa: E402
import content as C  # noqa: E402

SB = A.SB
OUT = os.path.join(SB, 'review.html')
SHOTS = os.path.join(HERE, 'shots')


def img(src, alt, w=None, h=None, cls='z', extra=''):
    url, size = src
    w = w or size[0]
    h = h or size[1]
    return f'<img class="{cls}" src="{url}" alt="{E(alt)}" width="{w}" height="{h}" decoding="async" loading="lazy"{extra}>'


def vrow(key, short, buttons, rec='', note_ph='Note (optional)', disabled=()):
    b = ''.join(
        f'<button type="button" class="vbtn" data-v="{E(v)}" aria-pressed="false"'
        + (' disabled title="Nothing to choose between until the paintings exist"' if v in disabled else '')
        + f'>{E(v)}</button>' for v in buttons)
    r = f'<span class="rec">{rec}</span>' if rec else ''
    return (f'<div class="vrow" data-key="{E(key)}" data-short="{E(short)}"><span class="vq">Your call</span>{b}'
            f'<input type="text" aria-label="Note: {E(short)}" placeholder="{E(note_ph)}">{r}</div>')


# ================================================================== header
def header():
    return '''<header class="top">
<span class="eyebrow">Fluid Magic · painted battle figures · stage B</span>
<h1>Troops, commanders and portraits</h1>
<p class="lead">You said Go on the pilot. This is what stage B made: every foot soldier painted in both views, a figure for
every commander face we could paint, the battles updated, and the start of the monster, mount and god portraits. One
thing stopped us partway: the picture service ran out of prepaid credit this morning, so the portraits, the card busts
and the Thornwood commanders could not be painted yet. The page says plainly what is missing and what you can still
decide now.</p>
<p class="lead">Answer what you like: a pick per portrait subject, Keep or Redo per commander kind, Now or Later for the
mounts. Then press <b>Copy verdict</b> at the end and paste the line into the chat.</p>
<nav class="toc" aria-label="On this page"><a href="#short">In short</a><a href="#blocked">What is waiting</a>
<a href="#portraits">1 · Portraits</a><a href="#troops">2 · Troops</a><a href="#commanders">3 · Commanders</a>
<a href="#mounts">4 · Mounts</a><a href="#mockup">5 · Battle mockup</a><a href="#verdict">Your verdict</a></nav>
</header>'''


def short():
    return '''<section class="card brass" id="short" aria-labelledby="short-h"><h2 id="short-h">In short</h2>
<ul class="tight">
<li><b>All 14 foot soldier types are painted</b> from behind and from the front; the ten that fight in the three battles
stand in them. Men in a block now differ through tints, shield designs, size, rest pose and timing, with no new painted sheets, as you asked
(section 2).</li>
<li><b>66 of the 128 commander faces have their own figure</b>, each made from its portrait: every Cinder Horde leader,
the hunter and levy captains, and two Elder Druids. Thornwood&rsquo;s other leaders wait on picture credits
(section 3).</li>
<li><b>The portraits of monsters, mounts and gods could not be painted.</b> Every request since 09:13 today was refused
because the picture service&rsquo;s prepaid credit is used up. Section 1 shows each subject and its two written
directions; you can steer them now or decide when the paintings exist.</li>
<li><b>The Wolf Rider now has a man-sized rider</b> (he was drawn 1.56&times; too big); that fix cost nothing. Painting
mounts apart from their riders works and costs about 7 pictures per mounted unit: we suggest doing it in stage C, with
the mount figures (section 4).</li>
<li><b>The battle mockup is updated</b> with everything that needed no new picture: greener far Thornwood blocks,
banners, commanders kept in view, no sliding feet, the Salamander collapsing (section 5).</li>
</ul></section>'''


def blocked():
    return '''<section class="card warn" id="blocked" aria-labelledby="blocked-h"><h2 id="blocked-h">What is waiting on picture credits</h2>
<p class="lead">The picture service answered every request since 09:13 today with &ldquo;prepaid credits depleted&rdquo;.
We retried after waiting, three times, then stopped. Nothing else is broken: once the credit is topped up (the billing of
the image account), the queued work runs as planned.</p>
<div class="tablewrap"><table>
<thead><tr><th scope="col">Waiting</th><th scope="col">Pictures</th><th scope="col">Where it shows</th></tr></thead>
<tbody>
<tr><th scope="row">Portraits of 6 creatures, 2 mounts and 22 god bodies, two each</th><td class="n" data-label="Pictures">about 70</td><td data-label="Where">section 1</td></tr>
<tr><th scope="row">The six Thornwood commanders in the battles, and Elder Druid 08&rsquo;s back view</th><td class="n" data-label="Pictures">13</td><td data-label="Where">section 3; the battles show stand-ins</td></tr>
<tr><th scope="row">Nine painted card busts</th><td class="n" data-label="Pictures">9</td><td data-label="Where">section 2; the cards show figure crops</td></tr>
<tr><th scope="row">Troop fixes: Longbow Hunter front, Berserker, Thorn Militia, Briar Guard; the Wolf Rider&rsquo;s back view</th><td class="n" data-label="Pictures">8</td><td data-label="Where">sections 2 and 4</td></tr>
<tr><th scope="row">The rest of the 62 commander faces not yet painted (most of Thornwood; the mountaineer and reedman captains)</th><td class="n" data-label="Pictures">about 150</td><td data-label="Where">section 3</td></tr>
</tbody></table></div>
<p class="note">Stage B so far: 235 picture requests, 205 painted; of the 30 that failed, 29 were refused for credit and one was a server error.</p>
</section>'''


# ================================================================== 1. portraits
def slot(letter, text, same=False, both=False):
    t = E(text)
    sub = ''
    return (f'<div class="slot" role="img" aria-label="Candidate {letter}: not painted yet. {t}">'
            f'<span class="sl">{letter}</span><span class="np">Not painted yet</span><p class="sd">{t}</p>{sub}</div>')


def subject(s, kind):
    key = 'p:' + s['id']
    bt = s.get('battles')
    tags = f'<span class="tag">{E(s["tag"])}</span>'
    if bt:
        tags += f'<span class="tag field">in battle {E(bt)}</span>'
    if s.get('both'):
        tags += '<span class="tag">both nations</span>'
    if kind == 'gods':
        a, b = C.GOD_A + s['parts'] + '.', C.GOD_B
    else:
        a, b = s['a'], s['b']
    same = s.get('same', False)
    rec = 'A or B: we paint only that one' if not same else 'Two paintings of one description'
    return (f'<article class="subj" id="p-{s["id"]}"><div class="sinfo"><h4>{E(s["name"])}</h4><div class="tags">{tags}</div>'
            f'<p>{E(s["what"])}</p>'
            + vrow(key, s['name'], ['A', 'B', 'Redo'], rec=rec,
                   note_ph='What should it look like? (needed for Redo)', disabled=('A', 'B') if same else ())
            + f'</div><div class="slots">{slot("A", a, same, s.get("both"))}{slot("B", b, same)}</div></article>')


def portraits(sal, tre):
    out = ['''<section class="piece" id="portraits" aria-labelledby="portraits-h"><div class="phead"><span class="num">1</span>
<h2 id="portraits-h">Portraits of creatures, mounts and gods</h2><span class="probe">Not painted: no credit</span></div>
<p class="lead">This was to be the main decision on this page: two painted candidates for each monster, mount and god, and
you pick one. The picture service ran out of credit before the first of the 60 could be painted, so there is nothing to
look at yet. What you can do now:</p>
<ul class="tight">
<li><b>Pick A or B</b> if one of the two written directions is clearly right. We then paint only that one, which saves a
picture each.</li>
<li><b>Redo</b> if neither is what you want: say what it should be in the note, and we rewrite it before painting.</li>
<li><b>Leave it blank</b> to choose between the paintings when they exist. Nothing is painted as a figure before you
approve its portrait, as you asked.</li>
</ul>
<div class="refrow">''']
    out.append(f'<figure class="ref">{img(sal, "Salamander portrait, face 01 (approved)", 160, 160)}<figcaption><b>Salamander</b>, approved</figcaption></figure>')
    out.append(f'<figure class="ref">{img(tre, "Treant portrait, face 01 (approved)", 160, 160)}<figcaption><b>Treant</b>, approved</figcaption></figure>')
    out.append('''<p class="note">What a finished creature portrait looks like: your two approved ones, in the leaders&rsquo; framing,
candle light and dark background. Every candidate below is painted to the same template, with the same model that
painted your leaders. The Thornwood colour is now asked for as a deep bottle green; the earlier wording came out grey.</p></div>''')
    for g in C.PORTRAIT_GROUPS:
        out.append(f'<h3 class="grp">{E(g["title"])}</h3><p class="note gl">{E(g["lead"])}</p>')
        if 'subjects' in g:
            out.extend(subject(s, g['id']) for s in g['subjects'])
        else:
            for title, subs in g['subgroups']:
                out.append(f'<h4 class="sub">{E(title)}</h4>')
                if subs[0].get('both'):
                    out.append('<p class="note gl">Painted once in Cinder colours and recoloured green for Thornwood, so one '
                               'pick covers both.</p>')
                out.extend(subject(s, 'gods') for s in subs)
    out.append('</section>')
    return '\n'.join(out)


# ================================================================== 2. troops
def troops(blocks):
    out = ['''<section class="piece" id="troops" aria-labelledby="troops-h"><div class="phead"><span class="num">2</span>
<h2 id="troops-h">Troops</h2></div>
<p class="lead">Every foot soldier type, painted in both views: from behind (the near side, facing up and right) and from
the front (the far side, facing down and left); the other two facings are mirror images. Each sheet is sixteen poses of
one man. The card is what shows in the card bar.</p>
<h3>Variety within a block (your note 1)</h3>
<p class="lead">No new painted sheets. Each man gets, from his own seed: a tint of his cloth within his side&rsquo;s colour,
his skin, metal and leather a little lighter or darker, one of eight shared shield designs, a size within &plusmn;4%, his
own rest pose, step timing and tempo. Neighbours never match, the side&rsquo;s colour holds, and the colour-blind contrast between the two sides is unchanged. Tap a picture to see it
full size.</p>
<div class="grid g2 stack">''']
    cap = {
        'c-cinderWarrior': '<b>Cinder Warriors from behind</b>, battle c, zoomed in. Every cape a slightly different orange, each man in his own pose and size.',
        'c-warden': '<b>Wardens from the front</b>, battle c, zoomed in. The shield designs and green tints vary, and each man stands in his own rest pose.',
        'b-thornMilitia': '<b>Thorn Militia from behind</b>, battle b, on snow.',
        'a-flameArcher': '<b>Flame Archers from behind</b>, battle a, with two of their commanders.',
    }
    for k in ('c-cinderWarrior', 'c-warden'):
        out.append(f'<figure>{img(blocks[k + "-170"], cap[k].replace("<b>", "").replace("</b>", ""), 900, 560)}<figcaption>{cap[k]}</figcaption></figure>')
    out.append('</div><div class="grid g2 stack play">')
    for k in ('c-cinderWarrior', 'c-warden', 'b-thornMilitia', 'a-ashMilitia'):
        nm = {'c-cinderWarrior': 'Cinder Warriors', 'c-warden': 'Wardens', 'b-thornMilitia': 'Thorn Militia', 'a-ashMilitia': 'Ash Militia'}[k]
        out.append(f'<figure class="true" style="--w:420px">{img(blocks[k + "-28"], nm + " at play zoom", 420, 260)}<figcaption>{nm} at play zoom (actual pixels on a wide screen).</figcaption></figure>')
    out.append('</div>')
    out.append('<details class="more"><summary>Two more blocks, zoomed in</summary><div class="grid g2 stack">')
    for k in ('b-thornMilitia', 'a-flameArcher'):
        out.append(f'<figure>{img(blocks[k + "-170"], cap[k].replace("<b>", "").replace("</b>", ""), 900, 560)}<figcaption>{cap[k]}</figcaption></figure>')
    out.append('</div></details>')
    out.append('<h3>The gallery</h3><p class="note">Figures stand on the battle ground&rsquo;s colour at the size the game '
               'uses when zoomed in. &ldquo;Kept with a flaw&rdquo; means the sheet missed one of our checks and its '
               'one re-paint did not do better, or could not run; the battles use it until a fix lands.</p>')
    out.append('<div class="troops">')
    nat_name = {'cinderHorde': 'Cinder Horde', 'thornwood': 'Thornwood', 'independent': 'Independent'}
    for unit, name, nation, battles, kind in C.TROOPS:
        fig = json.load(open(os.path.join(SB, 'atlas', 'troops', 'figures', f'{unit}.json')))
        views = {}
        for v in ('back', 'front'):
            poses = [x.split('.', 2)[2] for x in fig['views'][v]['atlas']['H']['frames'] if not x.endswith('.white')]
            views[v] = (A.troop_view(unit, nation, v, poses), poses)
        card, ckind = A.troop_card(unit, nation)
        stat = []
        for v, lab in (('back', 'From behind'), ('front', 'From the front')):
            ok, note = C.TROOP_NOTES.get((unit, v), (True, 'Passes every check.'))
            cls = 'ok' if ok else 'flaw'
            word = 'Passes' if ok else 'Kept with a flaw'
            if ok:
                txt = note
            else:
                txt = f'{word}: ' + (note[0].lower() + note[1:] if note[0].isalpha() else note)
            stat.append(f'<li class="{cls}"><b>{lab}.</b> {E(txt)}</li>')
        if ckind == 'bust':
            cnote = 'Painted bust: the one you kept from the pilot.'
        elif battles:
            cnote = 'Stand-in card: a crop of the figure. Its painted bust is queued.'
        else:
            cnote = 'Stand-in card: a crop of the figure. Its bust comes with production.'
        bt = f' · in battle {battles}' if battles else ' · not in the three battles'
        (bs, bstrip), bposes = views['back']
        (fs, fstrip), fposes = views['front']
        plist = ', '.join(C.POSE_NAMES.get(p, p) for p in fposes)
        out.append(f'''<article class="troop {nation}"><header><h4>{E(name)}</h4><span class="tag">{nat_name[nation]} · {E(kind)}{E(bt)}</span></header>
<div class="tview"><figure class="gf">{img(bs, name + " from behind, standing")}<figcaption>behind</figcaption></figure>
<figure class="gf">{img(fs, name + " from the front, standing")}<figcaption>front</figcaption></figure>
<figure class="cardf{' bust' if ckind == 'bust' else ''}">{img(card, name + " card", 128 if ckind != 'bust' else 128, 120 if ckind != 'bust' else 128)}<figcaption>card</figcaption></figure></div>
<ul class="stat">{''.join(stat)}<li class="{'ok' if ckind == 'bust' else 'flaw'}"><b>Card.</b> {E(cnote)}</li></ul>
<details class="more"><summary>All sixteen poses</summary>
<figure class="strip">{img(bstrip, name + " from behind, all poses")}</figure>
<figure class="strip">{img(fstrip, name + " from the front, all poses")}<figcaption>Behind, then front: {E(plist)}.</figcaption></figure></details>
</article>''')
    out.append('</div>')
    out.append('<p class="ad"><b>What we found.</b> The Cinder side reads as painted troops of one hand: orange, varied and '
               'alive. Thornwood&rsquo;s far blocks were too dark at play zoom; the mockup now lifts their green (32% '
               'of the block in the side&rsquo;s colour, from 24%) with the colour-blind contrast kept. Six sheets '
               'miss the battle camera in some poses, most often the dead and follow-through poses that show only for '
               'a moment; the two worst (the Berserker from behind, the Longbow Hunter from the front) have fixes '
               'queued.</p>')
    out.append(vrow('troops', 'Troops', ['Keep', 'Change'], rec='Change: say what in the note',
                    note_ph='A troop that feels wrong, more or less variety, a card…'))
    out.append('</section>')
    return '\n'.join(out)


# ================================================================== 3. commanders
def cmd_status(summary, prefix, face):
    """Plain status per view from the stage's summary: (front_ok, back_ok, front_why, back_why, marks)."""
    res = {}
    for v in ('front', 'back'):
        s = summary.get(f'{prefix}{face}.{v}')
        if not s:
            res[v] = (None, 'not painted')
            continue
        if s.get('pass_'):
            res[v] = (True, '')
            continue
        g = s.get('gate', {})
        why = []
        if isinstance(s.get('facingByEye'), str) or g.get('facingByEye') is False:
            why.append('4 poses face the wrong way')
        if g.get('cells') is False:
            n = s.get('cells', '').split('/')[0]
            why.append(f'{n} of 16 poses at the battle camera')
        if g.get('fringe') is False:
            why.append('a thin off-colour edge')
        res[v] = (False, ', '.join(why) or 'a check missed')
    m = (summary.get(f'{prefix}{face}.front') or {}).get('marksFront') or ''
    return res, m


def commanders(groups):
    sumA = json.load(open(os.path.join(SB, 'work', 'cmdA', 'summary.json')))
    sumB = json.load(open(os.path.join(SB, 'work', 'cmdB', 'summary.json')))
    in_battle = {}
    for g in groups:
        if g.get('cmd') and g.get('face'):
            side = 'near' if g['mainView'] == 'back' else 'far'
            in_battle.setdefault((g['unit'], g['face']), []).append(f'{g["battle"]} ({side})')
    out = ['''<section class="piece" id="commanders" aria-labelledby="commanders-h"><div class="phead"><span class="num">3</span>
<h2 id="commanders-h">Commanders</h2></div>
<p class="lead">Every face below has its own field figure, made from its approved portrait: the portrait was handed to the
painter with the body of its kind, and the headgear, beard, mantle and weapon were painted to match it. Each tile shows
the portrait, then the figure from the front, from behind, and rallying or casting. Commanders get no tints: a figure must
look like its card.</p>
<p class="lead"><b>Your note 2, more variety within the game&rsquo;s limits:</b> today the faces of one kind share one
body, one weapon and one set of poses, which keeps every commander the size, angle and timing the battle expects. The
next pass gives each face its own weapon from its family, and a cloak or collar where the portrait leaves it free. That
needs new paintings, so it waits on credit with the rest.</p>''']
    for unit, label, nation, batch, n, prefix, variety in C.CMD_KINDS:
        summary = sumA if batch == 'cmdA' else sumB
        faces = sorted(f.split('-')[-1].split('.')[0] for f in os.listdir(os.path.join(SB, 'atlas', batch, 'figures'))
                       if f.startswith(unit + '-') and f[len(unit) + 1:-5].isdigit())
        tiles, fo, bo, fails = [], 0, 0, []
        for face in faces:
            st, marks = cmd_status(summary, prefix, face)
            fig, have = A.cmd_figure(unit, face, batch)
            por = A.portrait(nation, unit, face)
            fok, fwhy = st['front']
            bok, bwhy = st['back']
            fo += 1 if fok else 0
            bo += 1 if bok else 0
            if fok is False:
                fails.append(f'{face} front: {fwhy}')
            if bok is False:
                fails.append(f'{face} back: {bwhy}')
            flags = []
            flags.append('<span class="ok">front ✓</span>' if fok else f'<span class="bad">front: {E(fwhy)}</span>')
            if bok is None:
                flags.append('<span class="bad">back: not painted yet</span>')
            else:
                flags.append('<span class="ok">back ✓</span>' if bok else f'<span class="bad">back: {E(bwhy)}</span>')
            if marks:
                y, p = marks.count('y'), marks.count('p')
                flags.append(f'<span class="mk">portrait marks: {y} clear{f", {p} partly" if p else ""} of {len(marks)}</span>')
            ib = in_battle.get((unit, face))
            bl = f'<span class="inb">in battle {", ".join(ib)}</span>' if ib else ''
            acts = 'rallying' if unit not in ('pyrePriest', 'emberAdept', 'cinderMagus', 'elderDruid') else 'casting'
            alt = f'{label} {face}: front, ' + ('back, ' if have[1] else '') + acts
            tiles.append(f'<figure class="face">{img(por, f"{label} {face}, portrait", 104, 104, cls="z por")}'
                         f'<div class="ffig">{img(fig, alt, cls="z fig")}</div>'
                         f'<figcaption><b>{face}</b>{bl}<span class="flags">{"".join(flags)}</span></figcaption></figure>')
        nf = len(faces)
        head = f'{nf} of {n} faces painted' if nf < n else f'all {n} faces painted'
        summ = f'Front views pass: {fo} of {nf}. Back views pass: {bo} of {nf}.' if unit != 'elderDruid' else \
            f'Front views pass: {fo} of {nf}. Back views: not painted yet.'
        if unit == 'cinderScout':
            summ += (' Every scout&rsquo;s back view turns to face us in four poses (stand, at ease, rallying, falling): '
                     'the shared back body was painted that way. It needs a new back body, waiting on credit.')
        elif unit == 'cinderMagus':
            summ += (' The backs keep a thin off-colour edge and lose the camera in the hit, follow-through and dead '
                     'poses; standing and walking read right.')
        out.append(f'''<article class="kind" id="k-{unit}"><header><h3 class="grp">{E(label)}</h3><span class="tag">{head}</span></header>
<p class="note">{summ}</p><p class="note">{E(variety)}</p>
<div class="faces">{''.join(tiles)}</div>
{vrow('c:' + unit, label, ['Keep', 'Redo'], rec='Redo: say what in the note', note_ph='What should change for this kind?')}
</article>''')
    # the battle faces not painted
    missing = []
    seen = set()
    for g in groups:
        if not (g.get('cmd') and g.get('face')):
            continue
        k = (g['unit'], g['face'])
        if k in seen or os.path.exists(os.path.join(SB, 'atlas', 'cmdB', 'figures', f'{g["unit"]}-{g["face"]}.json')) \
                or os.path.exists(os.path.join(SB, 'atlas', 'cmdA', 'figures', f'{g["unit"]}-{g["face"]}.json')):
            continue
        seen.add(k)
        missing.append(k)
    tiles = []
    for unit, face in missing:
        por = A.portrait('thornwood', unit, face)
        nm = C.UNIT_NAMES.get(unit, unit)
        ib = ', '.join(in_battle.get((unit, face), []))
        tiles.append(f'<figure class="face miss">{img(por, f"{nm} {face}, portrait", 104, 104, cls="z por")}'
                     f'<div class="ffig empty"><span>Not painted yet. The battle shows a flat stand-in.</span></div>'
                     f'<figcaption><b>{E(nm)} {face}</b><span class="inb">in battle {E(ib)}</span></figcaption></figure>')
    rest = ', '.join(f'{k} ({n})' for k, _, n in C.NOT_PAINTED_KINDS)
    out.append(f'''<article class="kind" id="k-missing"><header><h3 class="grp">In the battles, not painted yet</h3>
<span class="tag">waiting on credit</span></header>
<p class="note">These six Thornwood leaders show their portrait on the card and a flat stand-in on the field. That breaks
your rule that a figure matches its portrait, so they are first in the queue (13 pictures with Elder Druid 08&rsquo;s back
view). Also waiting, not in the battles: {E(rest)}.</p>
<div class="faces">{''.join(tiles)}</div></article>''')
    out.append('</section>')
    return '\n'.join(out)


# ================================================================== 4. mounts
def mounts(scale_img, wr_block, split):
    heads = ('Joint figure', 'Wolf alone (edit)', 'Rider alone (edit)', 'Put back together')
    cells = ['<span class="sh blank"></span>'] + [f'<span class="sh">{h}</span>' for h in heads]
    for pose, lab in (('stand', 'standing'), ('charge', 'charging'), ('deadA', 'dead'), ('cheer', 'cheering')):
        cells.append(f'<span class="sp">{lab}</span>')
        cells.extend(f'<div class="sc">{img(c, f"Wolf Rider {lab}: {h.lower()}")}</div>' for c, h in zip(split[pose], heads))
    rows = ''.join(cells)
    return f'''<section class="piece" id="mounts" aria-labelledby="mounts-h"><div class="phead"><span class="num">4</span>
<h2 id="mounts-h">Mounts: size, and painting them apart from riders</h2></div>
<p class="lead">Your note 3: match the mount&rsquo;s size to its rider if that is easy; ideally paint every mount apart from
its rider so a rider can be dismounted; leave it for later if it costs much now. We tested both on the Wolf Rider.</p>
<h3>Size: fixed, at no cost</h3>
<p class="lead">The painting was right; our packing was wrong. It measured the Wolf Rider from hood to chest, missed the
wolf&rsquo;s legs, and so drew the whole figure 1.56&times; too big: the rider&rsquo;s head was half again a foot
soldier&rsquo;s. It now measures hood to paws: the rider&rsquo;s head is exactly a foot soldier&rsquo;s, and the wolf&rsquo;s
back stands at about two-thirds of a man&rsquo;s height (the brief asks for a man&rsquo;s chest). The Ash Rider, painted in
stage C, is measured the same way; its clay model already stands at the design&rsquo;s height. If you want a bigger wolf, that goes into the wolf&rsquo;s stage C
figure, at no extra cost.</p>
<div class="grid g2 stack"><figure>{img(scale_img, "Two foot soldiers, the Wolf Rider as it was, and the Wolf Rider fixed, at four times play size")}<figcaption>Two foot soldiers, then the Wolf Rider <b>as it was</b> (too big) and <b>fixed</b>, at four times play size.</figcaption></figure>
<figure>{img(wr_block, "Wolf Riders beside Wardens in battle c, zoomed in")}<figcaption><b>In the battle now</b> (battle c): the Wolf Riders beside a block of Wardens.</figcaption></figure></div>
<h3>Mount and rider painted apart: works, about 7 pictures per mounted unit</h3>
<p class="lead">Painting the wolf alone and the rider alone from scratch failed: the painter lost the battle camera (1 and
6 poses of 16 right, and worse on the re-try). What works is <b>editing the joint picture</b>: &ldquo;the same picture with
the rider removed&rdquo;, and &ldquo;with the wolf removed&rdquo;. The wolf alone kept the camera in 15 of 16 poses, and
the two halves put back together match the joint figure (95% overlap, same light, same scale). A few rider poses lost
the spear and one came out empty; those are normal re-paint work.</p>
<div class="splitg" role="group" aria-label="The Wolf Rider painted apart, four poses">{rows}</div>
<div class="tablewrap"><table>
<thead><tr><th scope="col">Per mounted unit, both views</th><th scope="col">Pictures</th></tr></thead>
<tbody>
<tr><th scope="row">The joint figure only, as today</th><td class="n" data-label="Pictures">about 5</td></tr>
<tr><th scope="row">Joint figure, plus mount alone and rider alone</th><td class="n" data-label="Pictures">about 10 (+5)</td></tr>
<tr><th scope="row">Plus a full set of dismounted poses on foot</th><td class="n" data-label="Pictures">about 12 (+7)</td></tr>
<tr><th scope="row">A second unit on the same mount (reuses the mount alone)</th><td class="n" data-label="Pictures">about 5</td></tr>
</tbody></table></div>
<p class="ad"><b>Our suggestion: later, in stage C</b>, when the War Wolf and Ash Horse are painted standing after you approve
their portraits. That keeps your order (portrait, then figure), and the rules today have no unhorsing: a mounted unit is one
body. Adding it means a rule change too. Cost then: about 14 pictures for both mounted units. &ldquo;Now&rdquo; would mean
doing those 14 in stage B, once credit is back.</p>
{vrow('mounts', 'Mounts apart from riders', ['Now', 'Later'], rec='Suggested: Later', note_ph='Anything about mount size or dismounting')}
</section>'''


# ================================================================== 5. mockup
def mockup():
    return '''<section class="piece" id="mockup" aria-labelledby="mockup-h"><div class="phead"><span class="num">5</span>
<h2 id="mockup-h">The battle mockup</h2></div>
<p class="lead mockline">The battle mockup has been updated with all of this: <a id="mockup-link" href="#mockup-url">open the
battle mockup</a>.</p>
<ul class="tight">
<li>Thornwood&rsquo;s far blocks read green at play zoom, no longer near-black.</li>
<li>Every block and every general carries a painted banner; a general&rsquo;s banner flares as he rallies.</li>
<li>The camera keeps the commanders in view: under the card bar for at most 5% of their time, down from as much as half.</li>
<li>No more sliding feet: steps follow the speed, men shuffle as they close ranks, routers run and then stop.</li>
<li>A falling man lands in the pose he fell in; the Salamander now tips over and settles when it dies.</li>
<li>No more half-second freeze when the camera leans in on a big moment.</li>
<li>Pink staffs and green javelins, left by the painter&rsquo;s background, are gone.</li>
<li>Still flat stand-ins: the Ash Riders, Fire Sprites, hornets, the Treant, the Great Wyrm (they wait on their portraits)
and the six Thornwood leaders (waiting on credit). The Figures switch at the top shows the old flat figures.</li>
</ul>
</section>'''


# ================================================================== verdict + script
def verdict():
    return '''<section class="verdict" id="verdict" aria-labelledby="ver-h"><h2 id="ver-h">Your verdict</h2>
<p class="note" id="count"></p>
<div class="answers" id="answers"></div>
<label for="general" class="note">Notes (optional)</label>
<textarea id="general" placeholder="Anything else: a look you want, what to paint first when credit is back, what to see next"></textarea>
<pre id="summary" aria-live="polite"></pre>
<button class="big-btn" id="copy" type="button">Copy verdict</button>
<p class="note">Your picks are kept in this browser, so you can come back to them.</p>
</section>'''


SCRIPT = r'''<script>
(() => {
  const KEY = 'fm-stage-b-review-v1';
  const load = () => { try { const v = JSON.parse(localStorage.getItem(KEY) || 'null'); return v && typeof v === 'object' ? v : null; } catch { return null; } };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage unavailable: picks live for this visit only */ } };
  const saved = load() || {};
  const state = { picks: saved.picks || {}, notes: saved.notes || {}, general: saved.general || '' };
  const ROWS = [...document.querySelectorAll('.vrow[data-key]')].map((r) => ({ el: r, key: r.dataset.key, short: r.dataset.short }));
  const sumEl = document.getElementById('summary'), countEl = document.getElementById('count'), ansEl = document.getElementById('answers');
  const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim();
  const item = (r) => { const v = state.picks[r.key], n = clean(state.notes[r.key]); return v || n ? `${r.short} ${v || 'note'}${n ? ' (' + n + ')' : ''}` : ''; };
  function line() {
    const P = ROWS.filter((r) => r.key.startsWith('p:')), K = ROWS.filter((r) => r.key.startsWith('c:'));
    const pa = P.map(item).filter(Boolean), ka = K.map(item).filter(Boolean);
    const t = ROWS.find((r) => r.key === 'troops'), m = ROWS.find((r) => r.key === 'mounts');
    const parts = [];
    parts.push(`Portraits: ${pa.length ? pa.join('; ') + (pa.length < P.length ? '; the rest when painted' : '') : 'decide when painted'}`);
    parts.push(`Troops: ${item(t).replace(/^Troops /, '') || 'no answer'}`);
    parts.push(`Commanders: ${ka.length ? ka.join('; ') : 'no answer'}`);
    parts.push(`Mounts apart from riders: ${item(m).replace(/^Mounts apart from riders /, '') || 'no answer'}`);
    const g = clean(state.general);
    return `Stage B verdict. ${parts.join('. ')}.${g ? ' Notes: ' + g : ''}`;
  }
  function render() {
    for (const r of ROWS) for (const b of r.el.querySelectorAll('.vbtn')) b.setAttribute('aria-pressed', String(state.picks[r.key] === b.dataset.v));
    const P = ROWS.filter((r) => r.key.startsWith('p:'));
    const np = P.filter((r) => state.picks[r.key]).length, nr = ROWS.filter((r) => !r.key.startsWith('p:') && state.picks[r.key]).length;
    countEl.textContent = `${np} of ${P.length} portrait subjects picked (blank means you will choose between the paintings); ${nr} of ${ROWS.length - P.length} other questions answered.`;
    ansEl.innerHTML = '';
    for (const r of ROWS.filter((x) => !x.key.startsWith('p:') || state.picks[x.key])) {
      const d = document.createElement('div'), a = document.createElement('a'), s = document.createElement('span');
      a.href = '#' + (r.key.startsWith('p:') ? 'p-' + r.key.slice(2) : r.key.startsWith('c:') ? 'k-' + r.key.slice(2) : r.key); a.textContent = r.short;
      const v = state.picks[r.key]; s.textContent = v || 'no answer';
      s.className = !v ? 'u' : (v === 'Redo' || v === 'Change') ? 'c' : 'k';
      d.append(a, s); ansEl.appendChild(d);
    }
    sumEl.textContent = line();
  }
  for (const r of ROWS) {
    for (const b of r.el.querySelectorAll('.vbtn')) b.addEventListener('click', () => { if (b.disabled) return; state.picks[r.key] = state.picks[r.key] === b.dataset.v ? '' : b.dataset.v; save(); render(); });
    const inp = r.el.querySelector('input'); inp.value = state.notes[r.key] || '';
    inp.addEventListener('input', () => { state.notes[r.key] = inp.value; save(); sumEl.textContent = line(); });
  }
  const gen = document.getElementById('general'); gen.value = state.general;
  gen.addEventListener('input', () => { state.general = gen.value; save(); sumEl.textContent = line(); });
  document.getElementById('copy').addEventListener('click', async (e) => {
    const btn = e.currentTarget, text = line();
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch { /* fall back below */ }
    if (!ok) {
      try {
        const range = document.createRange(); range.selectNodeContents(sumEl);
        const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
        ok = document.execCommand('copy');
      } catch { ok = false; }
    }
    btn.textContent = ok ? 'Copied: paste it in the chat' : 'Selected: copy it by hand';
    setTimeout(() => { btn.textContent = 'Copy verdict'; }, 2400);
  });
  render();

  // tap a picture to see it full size
  const lb = document.getElementById('lb'), lbImg = lb.querySelector('img');
  let opener = null;
  const close = () => { lb.classList.remove('show'); lbImg.removeAttribute('src'); if (opener) opener.focus(); };
  for (const im of document.querySelectorAll('img.z')) {
    im.tabIndex = 0; im.setAttribute('role', 'button');
    const open = () => { opener = im; lbImg.src = im.src; lbImg.alt = im.alt; lb.classList.toggle('dark', im.classList.contains('por') || im.closest('.cardf') !== null || im.closest('.ref') !== null); lb.classList.add('show'); lb.querySelector('button').focus(); };
    im.addEventListener('click', open);
    im.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  }
  lb.addEventListener('click', close);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && lb.classList.contains('show')) close(); });
})();
</script>'''


def main():
    css = open(os.path.join(HERE, 'page.css')).read()
    sal = A.portrait('cinderHorde', 'salamander', '01', px=256)
    tre = A.portrait('thornwood', 'treant', '01', px=256)
    blocks = {}
    for k in ('c-cinderWarrior', 'c-warden', 'b-thornMilitia', 'a-flameArcher', 'a-ashMilitia'):
        for z in ('170', '28'):
            p = os.path.join(SHOTS, f'blk-{k}-{z}.png')
            if os.path.exists(p):
                blocks[f'{k}-{z}'] = A.file_img(p, q=80 if z == '170' else 88)
    groups = json.load(open(os.path.join(SB, 'integrate', 'paint-data.json')))['groups']
    scale_img = A.file_img(os.path.join(SB, 'cal', 'review', 'mount-scale-tierS.png'), q=86)
    wr_block = A.file_img(os.path.join(SHOTS, 'blk-c-wolfRider-130.png'), q=80)
    split = A.mount_split()
    body = [header(), short(), blocked(), portraits(sal, tre), troops(blocks), commanders(groups),
            mounts(scale_img, wr_block, split), mockup(), verdict()]
    html = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Stage B Review</title>
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
<div id="lb" role="dialog" aria-modal="true" aria-label="Picture, full size"><img alt=""><button type="button">Close</button></div>
{SCRIPT}
</body>
</html>
'''
    open(OUT, 'w').write(html)
    print(json.dumps({'out': OUT, 'bytes': os.path.getsize(OUT), 'images': A.STATS['n'], 'imageBytes': A.STATS['bytes']}))


if __name__ == '__main__':
    main()
