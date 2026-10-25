# Stage B fix2 (critique-resume fix 8, B3/B4): two card busts in the b1 family (busts.json pattern: the anchor, a
# Thornwood portrait, a kit card), written from the Thorn Militia's b2 prompt (prompts/b2.thornMilitia.bust.txt):
#   B3 wolfRider    - the card for the kept Wolf Rider test figure (not a new figure): the rider in his bottle-green
#                     hood with his grey wolf's head and ruff at his shoulder, so the card reads as a mounted unit; the
#                     kit card is three stand-alone frames of the kept front sheet (kitcards/wolfRider.kit.png)
#   B4 thornMilitia - its own kit, so it is not the Longbow Hunter's twin: hood down on the shoulders, a bark cap, the
#                     spear shaft at the shoulder, the bottle-green tabard; "not hooded, not an archer"
# Usage: python3 t2_busts_fix2.py [ROUND] [JOB=failure ...]   (writes ../prompts/<round>.<fig>.bust.txt, ../jobs/busts-<round>.json)
# Run: T2_KEY='B fix2:' T2_CAP=30 python3 t2run.py ../jobs/busts-f2.json; post: python3 t2_bustpost_fix2.py RAW FIG
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
W2 = os.path.abspath(os.path.join(HERE, '..'))
SB = os.path.abspath(os.path.join(W2, '..', '..'))
RAW = os.path.join(SB, 'raw', 'troops')
REPO = '/home/user/Fluid-Magic-'
BASE = open(os.path.join(W2, 'prompts', 'b2.thornMilitia.bust.txt')).read()
PREV = BASE.split('\n')[5]  # the b2 roll's failure paragraph
assert PREV.startswith('A previous attempt at this bust failed')


def rep(s, a, b):
    assert s.count(a) == 1, a[:70]
    return s.replace(a, b)


def militia():
    s = BASE
    s = rep(s, 'his headgear, his cloth and its colour, his armour and his kit must be the ones in Image 3, now seen close as a portrait.',
            'his cloth and its colour, his armour and his spear must be the ones in Image 3, now seen close as a portrait; '
            'but in this portrait his hood is pushed back off his head.')
    s = rep(s, 'Nothing behind the head or the shoulders: no shield, no sword hilt, no spear, no bow, no hands,',
            'Nothing behind the head: no shield, no sword hilt, no bow, no hands; only the plain dark shaft of his spear '
            'rises upright close behind his far shoulder;')
    s = rep(s, PREV, 'This card must never look like the Longbow Hunter\'s: the militiaman is not hooded and not an '
                     'archer. His hood is pushed back and lies in heavy folds around his neck and shoulders; on his head '
                     'he wears a small, round, close-fitting cap of hardened bark plates over short rough dark hair, his '
                     'whole face and brow open to the candle light; the dark hawthorn shaft of his spear rises past his '
                     'shoulder; a sleeveless tabard of deep bottle-green cloth covers his chest below the folded hood, so '
                     'that broad, clearly coloured green cloth fills most of the lower half of the image.')
    s = rep(s, 'which shows clearly on the raised hood, the short cloak and the long surcoat where the bust shows them',
            'which shows clearly on the hood folded down on his shoulders and on the tabard over his chest')
    s = rep(s, 'a short deep bottle-green hooded cloak with the hood up, covering the shoulders and the upper back;',
            'a short deep bottle-green hooded cloak, the hood pushed back and lying in folds on the shoulders;')
    s = rep(s, 'an ordinary weathered face of the nation above in the shadow of the hood.',
            'an ordinary weathered, open face of the nation under a small cap of hardened bark; not hooded, not an archer, '
            'no bow and no quiver.')
    s = s.replace('sleeveless surcoat of deep bottle-green cloth', 'sleeveless tabard of deep bottle-green cloth')
    return s


def wolf_rider():
    s = BASE
    s = rep(s, 'Image 3 shows this exact soldier as he is painted small on the battlefield, from the front and from behind: '
               'his headgear, his cloth and its colour, his armour and his kit must be the ones in Image 3, now seen close as '
               'a portrait. Do not copy its tiny size, its camera from above, its pose or its flat coloured background.',
            'Image 3 shows this exact rider and his wolf as they are painted on the battlefield, three times, seen from the '
            'front: his hood, his cloth and its colour, his bark armour, the wolf\'s grey-brown fur and its harness must be '
            'the ones in Image 3, now seen close as a portrait. Do not copy its small size, its camera from above, its poses '
            'or its plain grey card.')
    s = rep(s, 'Head-and-shoulders portrait bust of one soldier, three-quarter view, the face turned toward the right side of the image.',
            'Head-and-shoulders portrait bust of one mounted soldier with the head of his wolf, three-quarter view, both '
            'turned toward the right side of the image.')
    s = rep(s, 'One figure only. Nothing behind the head or the shoulders: no shield, no sword hilt, no spear, no bow, no hands,',
            'One rider only, and the head, neck and ruff of his own wolf: the great grey wolf\'s head, ears up and jaws '
            'closed, rises in the lower right of the image in front of the rider\'s chest, at the height of his shoulder, '
            'its shaggy grey ruff filling the lower right corner, so the card reads as a rider on his wolf. Nothing behind '
            'the head: no shield, no sword hilt, no spear, no bow, no hands,')
    s = rep(s, PREV, 'The rider\'s deep bottle-green hood is up and his bottle-green cloak lies over his shoulders and chest, '
                     'so that broad, clearly coloured green cloth fills much of the lower left of the image; the wolf\'s '
                     'grey fur fills the lower right. The wolf is a real, huge timber wolf, not a dog: long muzzle, pointed '
                     'ears, amber eyes, warm grey and brown fur, never pink or violet.')
    s = rep(s, 'a thin soft warm rim light along the back of the head or headgear, the hair and the shoulders',
            'a thin soft warm rim light along the back of the hood, the shoulders and the wolf\'s ears and ruff')
    s = rep(s, 'the shape of the headgear and the light face against the dark background',
            'the shape of the hood, the light face and the wolf\'s head against the dark background')
    s = rep(s, 'which shows clearly on the raised hood, the short cloak and the long surcoat where the bust shows them',
            'which shows clearly on the raised hood and the cloak over his shoulders and chest')
    i = s.index('A Thorn Militia levy spearman:')
    s = s[:i] + ('A Thornwood Wolf Rider: a rider in armour of hard bark plates over a bark-brown leather jerkin, under a deep '
                 'bottle-green hooded cloak with the hood up and a bottle-green tabard; leather bracers; bark-brown weathered '
                 'skin. His mount is a huge grey timber wolf with shaggy grey-brown fur, darker along the spine, in a narrow '
                 'bark-plate harness at its chest.\nPerson: a hard, weathered outrider of the deep wood, not a leader: an '
                 'ordinary face of the nation in the shadow of the hood, a short beard.')
    return s


def main(a):
    rnd = a[0] if a else 'f2'
    notes = dict(x.split('=', 1) for x in a[1:])
    jobs = []
    for fig, txt, img2, r in (('wolfRider', wolf_rider(), f'{REPO}/art-source/portraits/thornwood/thornScout/02.webp', 'B3'),
                              ('thornMilitia', militia(), f'{REPO}/art-source/portraits/thornwood/wardenCaptain/05.webp', 'B4')):
        if notes and fig not in notes:
            continue
        txt = txt.replace("the side's deep pine green cloth (#1F6A50)", "the side's deep bottle-green cloth (#1F6A50), the green of jade in shade")
        if fig in notes:
            txt += '\n' + 'A previous attempt at this card failed: ' + notes[fig] + '.'
        for bad in ('dominions', 'warhammer', 'warcraft', 'total war', 'age of wonders'):
            assert bad not in txt.lower()
        pf = os.path.join(W2, 'prompts', f'{rnd}.{fig}.bust.txt')
        open(pf, 'w').write(txt)
        kit = os.path.join(W2 if fig == 'wolfRider' else os.path.join(SB, 'work', 'troops'), 'kitcards', f'{fig}.kit.png')
        jobs.append(dict(job=f'{fig}.bust', figure=fig, view='bust', round=rnd, model='gemini-nano-banana-2.1', m='nb21',
                         aspect='1:1', key=None, refs=[f'{REPO}/art-source/portraits/anchor-style.webp', img2, kit],
                         promptFile=pf, out=os.path.join(RAW, f't2{rnd}.{fig}.bust.nb21.png'),
                         purpose=f'{r if rnd == "f2" else "B6"} {fig} card bust (b1 family, nb21, anchor + Thornwood portrait + kit card; critique-resume fix 8)'
                         + (' [re-roll, failure named]' if fig in notes else ''), r=r))
    json.dump(jobs, open(os.path.join(W2, 'jobs', f'busts-{rnd}.json'), 'w'), indent=1)
    for j in jobs:
        print(j['job'], j['out'])


if __name__ == '__main__':
    main(sys.argv[1:])
