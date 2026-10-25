# Stage B troops: prompts and jobs for the Nano Banana 2.1 work: the Warden front edit (review change 9's last point: the
# surcoat over the chest, by an edit of the kept camera-correct sheet, change 7), the card busts (plan 5.4: the leader
# portraits' framing and light, the troop's kit, made after its sheet passes with the sheet as the kit reference) and
# the three banners (plan 6: painted banner cloths for the pennant's mesh strip). Prompts never name another game,
# franchise, artist or studio.
# Usage: python3 tr_prompts2.py edit|busts|banners [ID ...] [--round b1]
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from tr_prompts import BY, UNITS, W, B, RAW, PROMPTS, JOBS, NB, ANCHOR, BANNED  # noqa: E402

UNITSDIR = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units'
KITCARDS = os.path.join(W, 'kitcards')
NATION_PORTRAIT = {  # the nation's materials for a bust (the pilot's kept Warden bust used Warden Captain 05)
    'cinderHorde': '/home/user/Fluid-Magic-/art-source/portraits/cinderHorde/ashChieftain/05.webp',
    'thornwood': '/home/user/Fluid-Magic-/art-source/portraits/thornwood/wardenCaptain/05.webp',
}
PERSON = {
    'ashMilitia': 'a poor levy spearman, not a leader; a gaunt, tired, ordinary face of the nation above, a few days of stubble',
    'cinderWarrior': 'a common soldier of the line, not a leader; an ordinary hard face of the nation above',
    'flameArcher': 'a common archer, not a leader; only the eyes and the brow show between the hood and the soot-black scarf',
    'emberSkirmisher': 'a young lean runner, not a leader; a sharp ordinary face of the nation above with soot stripes',
    'berserker': 'a huge wild-eyed brute of the nation above, mouth open in a snarl, not a leader',
    'flamebrand': 'a sacred warrior of the fire temple, not a leader; the tall closed iron helm shows only a dark eye slit',
    'thornMilitia': 'a poor levy spearman, not a leader; an ordinary weathered face of the nation above in the shadow of the hood',
    'warden': 'a common soldier of the line, not a leader; an ordinary weathered face of the nation above',
    'briarGuard': 'a big heavy soldier, not a leader; the closed bark helm shows only a dark eye slit',
    'longbowHunter': 'a common hunter, not a leader; a lean weathered face of the nation above in the shadow of the hood',
    'lightInfantry': 'a common village levy, not a leader; an ordinary weathered face, short beard',
    'heavyInfantry': 'a grim veteran soldier, not a leader; a scarred ordinary face under the brim of the kettle hat',
    'archer': 'a common village archer, not a leader; an ordinary young face in the shadow of the hood',
    'swampFighter': 'a common marsh fighter, not a leader; a weathered ordinary face in the shadow of the hood',
}


def strip_cells(kit):
    kit = re.sub(r'\s*\((in|In) the [^)]*cells?[^)]*\)', '', kit)
    kit = re.sub(r'\s*In the brace cell[^.]*\.', '', kit)
    kit = re.sub(r'\s*The arrow heads are not lit[^.]*\.[^.]*\.', '', kit)
    return kit.strip()


def edit_warden():
    pf = os.path.join(PROMPTS, 'e1.warden.front.surcoat.txt')
    txt = '\n'.join([
        'Image 1 is a finished game sprite sheet whose drawing is right: keep exactly its camera (high above and in front, '
        'looking down at about 40 degrees), the direction every figure faces, every figure\'s pose, outline, size and '
        'position in its cell, the 4 by 4 grid, the flat pure magenta background, and its painting: the same brushwork, '
        'the same bark-plate helmets with their tall leaf crests, the same mantles of cloth leaves, the same swords and the '
        'same green shields with their small pale blossom sigil.',
        'Image 2 is a painted portrait from the same game, a reference for the painting hand only: do not copy its dark '
        'background, its candlelight, its framing or the person in it.', '',
        'Change only the soldier\'s body clothing, the same way in every cell. His green surcoat now lies over his bark '
        'armour, not under it: a sleeveless surcoat of deep green cloth covers his whole chest and belly, from the collar '
        'down to just below the knees, front and back, split at the front below the belt so the legs can stride, and held '
        'at the waist by a dark leather belt. No bark plates show on the chest or the belly any more: the bark plates show '
        'only on the shoulders, the arms and the legs. The leaf mantle stays over both shoulders. Seen from this camera, the '
        'green surcoat, the mantle, the crest and the shield face together make up about a third of each standing figure, '
        'so that a packed block of these soldiers reads as green from far away.', '',
        'The cloth is the same deep green as the soldier\'s mantle and shield, clean and clearly coloured, never grey or '
        'blackish; it is painted with the same brushwork as the rest: folds that follow each pose, a frayed hem.', '',
        'Facing, again: every figure faces exactly as in Image 1, toward us and to the lower left, the hit and the falling '
        'figures included; the fleeing figures run as in Image 1. Nothing else changes: no antlers, no new weapons, no new '
        'people.', '',
        'Background: one flat pure magenta (#FF00FF) colour fills the whole image with no gradient, texture, floor or '
        'shadow; no magenta, pink or purple anywhere on the figures. Never: text, labels, grid lines, borders, a floor, '
        'cast shadows, blood, extra people, cropped or overlapping figures.'])
    assert not BANNED.search(txt)
    open(pf, 'w').write(txt)
    return [dict(job='warden.front.surcoat', figure='warden', view='front', round='e1', model=NB, m='nb21', aspect='1:1',
                 key='magenta', refs=[UNITSDIR + '/pilot/raw/ad/wd.front.g3pro.png', ANCHOR], promptFile=pf,
                 out=os.path.join(RAW, 'e1.warden.front.surcoat.nb21.png'),
                 purpose='warden front: surcoat over the chest, nb21 edit of the kept Pro sheet (review change 9)')]


def bust_prompt(u):
    nat = u['nation']
    kit = strip_cells(u['kit'])
    if nat == 'independent':
        refs2 = ('Image 2 is a painted portrait of an independent captain from the same set, a reference for the '
                 'materials only (plain iron, quilted linen, undyed wool, leather): do not paint that person, and do not '
                 'give the soldier a captain\'s ornaments or rich trim.')
        colors = ('Colors: muted and earthy: undyed grey wool, tan linen, leather brown and plain iron. This soldier '
                  'belongs to no nation and wears no dyed colour at all: no orange, red, green or blue anywhere. Nothing '
                  'in the image glows.')
    else:
        cloth = UNITS['nations'][nat]['cloth']
        who = 'Cinder Horde' if nat == 'cinderHorde' else 'Thornwood'
        mats = ('blackened iron, rusted edges, charcoal cloth, ash-grey skin' if nat == 'cinderHorde'
                else 'bark plate, leaf cloth, weathered bark-brown skin')
        refs2 = (f'Image 2 is a painted portrait of a {who} leader from the same set, a reference for the nation\'s '
                 f'materials only ({mats}): do not paint that person, and do not give the soldier a leader\'s ornaments, '
                 'crown, horns, antlers or rich trim.')
        colors = (f'Colors: muted and earthy, except the side\'s {cloth["name"]} cloth ({cloth["hex"]}), which shows clearly '
                  f'on {u["sideZones"]} where the bust shows them, as on the figure, so the card reads as that side at a '
                  'glance. Nothing in the image glows' + (', except the flame on the sword if it shows.' if u['id'] == 'flamebrand' else '.'))
    house = UNITS['nations'][nat]['house']
    txt = '\n'.join([
        'Image 1 is a style reference only: match its painting style, brushwork, lighting, rim light, framing, background '
        'and proportions. The person, the face, the headgear and every ornament must be different from Image 1 and must '
        'follow the description below exactly; do not copy the man, the helm, the horns or the trim from Image 1.',
        refs2,
        'Image 3 shows this exact soldier as he is painted small on the battlefield, from the front and from behind: his '
        'headgear, his cloth and its colour, his armour and his kit must be the ones in Image 3, now seen close as a '
        'portrait. Do not copy its tiny size, its camera from above, its pose or its flat coloured background.', '',
        'Head-and-shoulders portrait bust of one soldier, three-quarter view, the face turned toward the right side of the '
        'image. Square image. Framing: the top of the head or headgear about 9% from the top edge, the eyes about 39% from '
        'the top, the chin about 62% from the top, the image cut at mid-chest, with dark empty space above and around the '
        'head. One figure only. Nothing behind the head or the shoulders: no shield, no sword hilt, no spear, no bow, no '
        'hands, no text, no border, no frame, no signature, no logo.',
        'Lighting: a single warm candle key light from the upper left, a dim warm fill, deep warm shadows, and a thin soft '
        'warm rim light along the back of the head or headgear, the hair and the shoulders that separates the whole '
        'silhouette clearly from the background. Background: plain, unpatterned, very dark warm brown close to #1C1A17, '
        'with no objects.',
        'Medium: painterly oil on a wood panel, visible brushwork, moderate detail, a strong readable silhouette: the shape '
        'of the headgear and the light face against the dark background must still read when the image is shrunk to 48 '
        'pixels.',
        colors, '',
        f'Subject: {house[0].upper() + house[1:]}.',
        kit,
        f'Person: {PERSON[u["id"]]}.'])
    assert not BANNED.search(txt)
    return txt


def bust_jobs(ids, rnd):
    jobs = []
    for fid in ids:
        u = BY[fid]
        pf = os.path.join(PROMPTS, f'{rnd}.{fid}.bust.txt')
        open(pf, 'w').write(bust_prompt(u))
        p2 = NATION_PORTRAIT.get(u['nation']) or u['styleRefs'][0]
        jobs.append(dict(job=f'{fid}.bust', figure=fid, view='bust', round=rnd, model=NB, m='nb21', aspect='1:1', key=None,
                         refs=[ANCHOR, p2, os.path.join(KITCARDS, f'{fid}.kit.png')], promptFile=pf,
                         out=os.path.join(RAW, f'{rnd}.{fid}.bust.nb21.png'),
                         purpose=f'{fid} card bust ({rnd}, nb21, anchor + nation portrait + the passed sheet as kit card)'))
    return jobs


BANNERS = {
    'cinderHorde': dict(key='green', keyname='pure green (#00FF00)', nokey='No green anywhere on the banner.',
                        cloth=('coarse wool dyed dull ember orange (#C4532C): #D9744A where the light strikes it, #C4532C '
                               'in its middle tones and a deep red-orange #7E3118 in the shade; never brown, pink or dusty'),
                        sigil='a single large black flame, painted by hand in soot-black, tall and narrow, its three tongues licking toward the tail of the banner',
                        wear='scorched and singed along the tail and the lower edge, a few small burn holes, soot smudges'),
    'thornwood': dict(key='magenta', keyname='pure magenta (#FF00FF)', nokey='No magenta, pink or purple anywhere on the banner.',
                      cloth=('wool dyed deep bottle green: the colour of jade or of a green glass bottle held to the light, '
                             'a clear cool green, a little bluer than grass; never leaf-green, olive, grey or teal'),
                      sigil='a single large pale five-pointed leaf in cream and bone white, its veins drawn in fine darker lines',
                      wear='frayed, with a few small tears and a thin hem stitched in bark-brown thread'),
    'independent': dict(key='magenta', keyname='pure magenta (#FF00FF)', nokey='No magenta, pink or purple anywhere on the banner.',
                        cloth=('undyed grey wool (#8C8A80): light grey-beige #AAA79C where the light strikes it and #5C5A54 '
                               'in the shade; no dyed colour at all'),
                        sigil='a plain heater shield outlined in pale bone-coloured stitching, empty inside: a free company\'s mark, no animal, no letter',
                        wear='patched and darned, with a frayed tail'),
}


def banner_jobs(ids, rnd):
    jobs = []
    for nat in ids:
        b = BANNERS[nat]
        txt = '\n'.join([
            'Image 1 is a painting-style reference from the same game: copy its brushwork, its muted oil-on-panel palette '
            'and its soft edges, not its dark background, its candlelight, its framing or its subject.', '',
            f'A game texture: one painted cloth banner, laid out flat and seen straight on, alone on a perfectly flat, '
            f'uniform {b["keyname"]} background. The banner is a long swallow-tailed pennant about three and a half times '
            'as long as it is tall: its left edge is straight and vertical (it is lashed to a pole there, but the pole is '
            'not shown), its top and bottom edges run straight to the right and its right end is cut into two pointed '
            'tails. It fills about 90% of the image\'s width and is centred, with at least 24 pixels of clean background '
            'all around.', '',
            f'The cloth: {b["cloth"]}. On it, centred in the left half: {b["sigil"]}. Wear: {b["wear"]}. The weave of the '
            'wool shows faintly.', '',
            'Light and shape: even outdoor daylight from the upper left, soft and nearly flat; the cloth hangs almost flat '
            'with only a few very soft, shallow folds, because the game waves it. No cast shadow, nothing glows.', '',
            'Painting style: painterly oil on a wood panel, visible directional brushwork, moderate detail, a muted earthy '
            'palette in which the cloth is the one clear hue; soft painterly edges. It is not a cartoon: no cel shading, no '
            'thick black outlines, no glossy 3D render, no pixel art. The sigil reads clearly when the banner is shrunk to '
            '48 pixels wide.', '',
            f'Background: one flat {b["keyname"]} colour fills the whole image with no gradient, texture, floor, vignette '
            f'or shadow. {b["nokey"]}', '',
            'Never: text, letters, numbers, labels, a pole, a hand, a person, a frame, a border, a signature, a logo, a '
            'second banner.'])
        assert not BANNED.search(txt)
        pf = os.path.join(PROMPTS, f'{rnd}.banner-{nat}.txt')
        open(pf, 'w').write(txt)
        jobs.append(dict(job=f'banner-{nat}', figure=f'banner-{nat}', view='flat', round=rnd, model=NB, m='nb21',
                         aspect='16:9', key=b['key'], refs=[ANCHOR], promptFile=pf,
                         out=os.path.join(RAW, f'{rnd}.banner-{nat}.nb21.png'),
                         purpose=f'banner {nat} ({rnd}, nb21, flat pennant cloth for the mesh strip)'))
    return jobs


def main():
    a = sys.argv[1:]
    rnd = a[a.index('--round') + 1] if '--round' in a else None
    a = [x for x in a if x not in ('--round', rnd)]
    what, ids = a[0], a[1:]
    if what == 'edit':
        jobs, name = edit_warden(), 'e1'
    elif what == 'busts':
        jobs, name = bust_jobs(ids, rnd or 'b1'), rnd or 'b1'
    else:
        jobs, name = banner_jobs(ids or list(BANNERS), rnd or 'n1'), rnd or 'n1'
    os.makedirs(JOBS, exist_ok=True)
    json.dump(jobs, open(os.path.join(JOBS, f'{name}.json'), 'w'), indent=1)
    print(name, [j['job'] for j in jobs])


if __name__ == '__main__':
    main()
