# Stage B fix2 (critique-resume fix 5, B1/B2): the Wolf Rider back view by a new route. Both Pro rolls (R29, R30) came
# back as eye-level side views, so this is a Nano Banana 2.1 paint-over, the route that gave the cmdB bodies their
# passing back views: Image 1 is the back clay guide on the blue key (work/troops2/guides/wolfRider.back.blue.png),
# painted over in place, so the camera, the size, the facing and the poses come from the guide by construction; Image 2
# is the owner-kept front sheet (pilot/raw/ad/wr.front.blue.g3pro.png), used for identity, kit, colours and size only.
# The prompt is the r30 text with its first paragraph replaced, the image references renumbered for two images, and
# "pine green" replaced by the bottle-green wording of calibration decision 2 (#1F6A50).
# Usage: python3 t2_wolf_r31.py [ROUND] ["failure named"]   (writes ../prompts/<round>.wolfRider.back.txt, ../jobs/<round>.json)
# Run: T2_KEY='B fix2:' T2_CAP=30 python3 t2run.py ../jobs/r31.json; gate: python3 t2_check.py r31.json
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
W2 = os.path.abspath(os.path.join(HERE, '..'))
UNITS = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units'
RAW = os.path.join(UNITS, 'stage-b', 'raw', 'troops')
BANNED = ('dominions', 'warhammer', 'blizzard', 'warcraft', 'total war', 'age of wonders', 'paradox', 'games workshop',
          'artstation', 'magic: the gathering')

FIRST = ('Image 1 is the grid of grey clay figures to paint over: keep every figure exactly where it is, at exactly its '
         'size, pose, facing and camera, and paint each one as the rider and wolf of Image 2 seen from behind; no clay '
         'may remain. Keep the 4 by 4 grid of Image 1 and its flat pure blue (#0000FF) background.')
IMG2 = ('Image 2 is the finished sheet of this same rider and wolf seen from the front: use it only for the rider\'s and '
        'the wolf\'s identity, kit, colours and size. Do not copy its facing, its poses, its grid lines or its paler blue '
        'background.')
PREV = ('Two earlier attempts at this sheet painted the figures from the side at eye level and much too large. This time '
        'every figure is painted directly over its clay figure in Image 1, which already has the right camera (high above '
        'and behind), the right size in its cell, the right facing and the right pose: keep every outline where it is, '
        'the top of the hood, the shoulders and the wolf\'s back large, the legs short and foreshortened; never at eye '
        'level, never seen from the side, never facing us.')
GREEN = ('The green is a deep bottle green, the green of jade in shade (#1F6A50), clearly coloured, never grey, slate, '
         'olive or yellow-green, a little lighter where the sun strikes it; never blackish or teal-blue, so the rider reads '
         'as his side from far away.')


# B2 (r32), after r31 copied the front sheet's grid lines, paler blue and size and turned the wolves to the right in
# profile (camera 2/16): Image 2 becomes a kit card of three stand-alone frames of the kept front sheet (no grid, no blue),
# and the correction names the failure
IMG2_KIT = ('Image 2 shows this same rider and wolf close up, three times, seen from the front, on a plain grey card: use it '
            'only for the rider\'s and the wolf\'s identity, kit and colours. Do not copy its facing, its poses, its size, '
            'its grey card or its framing.')


def build(extra=None, kit=False):
    src = open(os.path.join(W2, 'prompts', 'r30.wolfRider.back.txt')).read()
    paras = src.split('\n\n')
    out = []
    for p in paras:
        if p.startswith('Image 1 is the camera and pose guide'):  # its three lines: Image 1, Image 2, Image 3
            p = FIRST + '\n' + (IMG2_KIT if kit else IMG2)
        elif p.startswith('Image 2 is a painted portrait'):
            p = IMG2
        elif p.startswith('Image 3: see below.'):
            continue
        elif p.startswith('A previous attempt at this sheet failed'):
            p = PREV + (' ' + extra if extra else '')
        elif p.startswith('The rider and his mount:'):
            p = p.replace('a hooded cloak of clear pine green', 'a hooded cloak of deep bottle green')
            p = p.replace('a pine-green tabard', 'a bottle-green tabard').replace('a long pine-green pennon', 'a long bottle-green pennon')
            p = p.replace('a large pine-green saddle cloth', 'a large bottle-green saddle cloth')
            p = p.replace('a pine-green quilted cloth bib', 'a bottle-green quilted cloth bib')
            i = p.index('The green is a clean')
            j = p.index('The fur is warm grey')
            p = p[:i] + GREEN + ' ' + p[j:]
        elif p.startswith('Side colour:'):
            p = p.replace('Side colour: pine green (#2F8A68) cloth', 'Side colour: deep bottle-green (#1F6A50) cloth')
        out.append(p)
    txt = '\n\n'.join(out)
    assert not re.search(r'\bpine\b', txt, re.I)
    assert 'Image 3' not in txt and ('Image 2 shows this same' if kit else 'Image 2 is the finished sheet') in txt and 'no clay may remain' in txt and 'row 4, column 4' in txt
    assert not any(b in txt.lower() for b in BANNED)
    return txt


def main(a):
    rnd = a[0] if a else 'r31'
    extra = a[1] if len(a) > 1 else None
    pf = os.path.join(W2, 'prompts', f'{rnd}.wolfRider.back.txt')
    kit = rnd != 'r31'
    open(pf, 'w').write(build(extra, kit))
    j = dict(job='wolfRider.back', figure='wolfRider', view='back', round=rnd, route='paint-over', model='gemini-nano-banana-2.1',
             m='nb21', aspect='4:3', key='blue',
             refs=[os.path.join(W2, 'guides', 'wolfRider.back.blue.png'),
                   os.path.join(W2, 'kitcards', 'wolfRider.kit.png') if kit else os.path.join(UNITS, 'pilot', 'raw', 'ad', 'wr.front.blue.g3pro.png')],
             promptFile=pf, out=os.path.join(RAW, f't2{rnd}.wolfRider.back.blue.nb21.png'),
             purpose=f'{"B1" if rnd == "r31" else "B2"} t2{rnd}.wolfRider.back (nb21 paint-over of the blue clay guide, the kept front sheet for identity; critique-resume fix 5)'
             + (' [re-roll, failure named]' if extra else ''))
    json.dump([j], open(os.path.join(W2, 'jobs', f'{rnd}.json'), 'w'), indent=1)
    print(j['out'])


if __name__ == '__main__':
    main(sys.argv[1:])
