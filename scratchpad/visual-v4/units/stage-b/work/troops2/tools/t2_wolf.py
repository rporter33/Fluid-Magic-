# Stage B troops2, R29 and R30: the Wolf Rider back view, the missing view of the owner-kept pilot test. Nano Banana Pro on
# the blue key (review change 11.1) from the back maquette guide (refs/guides/wolfRider.back.png, its magenta swapped for
# blue: work/troops2/guides/wolfRider.back.blue.png), with the same two references and the same kit, colours and wolf as
# the kept front (prompts/ad/ad.wr.front.blue.txt), so the two views are one figure. Only the camera, the facing and the
# cells' wording change for the back. Usage: python3 t2_wolf.py [r30 "failure named"]  (writes ../prompts, ../jobs)
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import t2_base  # noqa: E402,F401
from tr_prompts import BANNED, PRO  # noqa: E402

W2 = os.path.abspath(os.path.join(HERE, '..'))
UNITS = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units'
REPO = '/home/user/Fluid-Magic-'
RAW = os.path.join(UNITS, 'stage-b', 'raw', 'troops')
FRONT = open(os.path.join(UNITS, 'prompts', 'ad', 'ad.wr.front.blue.txt')).read()

CAMERA = ('Camera: high above and behind, looking down at about 40 degrees, the way a player looks down at miniatures on a '
          'table; orthographic, with no perspective, so every figure is the same size. Every figure faces away from us, '
          'toward the upper right of the image: we see the rider\'s back, his right side, the top of his hood and the tops of '
          'his shoulders, and the wolf\'s back, haunches, tail and the back of its head; no face is seen. The figures are '
          'foreshortened as seen from above: the top of the head and the shoulders are large, the legs short.')
CELLS = '\n'.join([
    'The cells, left to right, row by row (the poses of the camera and pose guide):',
    '1. (row 1, column 1) the wolf standing square on all four paws, head up and ears forward; the rider sitting upright in the saddle, the spear held upright.',
    '2. (row 1, column 2) the wolf loping away from us, front paws reaching.',
    '3. (row 1, column 3) the wolf loping, legs gathered.',
    '4. (row 1, column 4) the wolf leaping, front paws off the ground, the rider low.',
    '5. (row 2, column 1) the wolf landing from a leap, front paws down, hind legs high.',
    '6. (row 2, column 2) the charge: the mount at full gallop away from us, the rider leaning forward behind the couched spear, aimed at the enemy ahead of him.',
    '7. (row 2, column 3) the rider rising in the saddle, the spear drawn far back over the shoulder to thrust; the wolf crouched, about to spring.',
    '8. (row 2, column 4) the rider thrusting the spear down and forward past the wolf\'s head; the wolf lunging.',
    '9. (row 3, column 1) the wolf biting: head lunged forward away from us, jaws open, the rider holding on.',
    '10. (row 3, column 2) hit from the front: the rider knocked back in the saddle toward us, arms thrown out, his back still turned to us; the wolf flinching sideways.',
    '11. (row 3, column 3) the rider tumbling backward off the wolf\'s back toward us, still seen from behind; the wolf stumbling.',
    '12. (row 3, column 4) the wolf lying dead on its side, the rider lying dead beside it.',
    '13. (row 4, column 1) the wolf and the rider lying dead, a different sprawl.',
    '14. (row 4, column 2) the mount alone without its rider, bolting away from us at a gallop, extended.',
    '15. (row 4, column 3) the mount alone without its rider, bolting away at a gallop, gathered.',
    '16. (row 4, column 4) the wolf with its head thrown up, howling; the rider raising the spear high overhead.'])
FACING = ('Facing, again: every figure in every one of the cells faces the same way, away from us toward the upper right, '
          'including the hit figure, the falling one and the riderless wolves; no face of the rider or the wolf is seen '
          'anywhere on this sheet.')


def prompt(extra=None):
    paras = FRONT.split('\n\n')
    out = []
    for p in paras:
        if p.startswith('Camera:'):
            p = CAMERA
        elif p.startswith('The cells, left to right'):
            p = CELLS
        elif p.startswith('Facing, again:'):
            p = FACING
        elif p.startswith('A game sprite sheet:'):
            p = p.replace('16 full-length painted figures of one rider on his wolf',
                          '16 full-length painted figures of one rider on his wolf, seen from behind')
        p = p.replace(', like fresh fir needles', '')
        out.append(p)
    if extra:
        out.insert(2, extra)
    txt = '\n\n'.join(out)
    if extra:
        txt = txt.replace('Image 3 is a second painting-style reference from the same set; the same rules apply.',
                          'Image 3: see below.')
    assert 'Camera: high above and behind' in txt and 'row 4, column 4' in txt and 'fir needles' not in txt
    assert not BANNED.search(txt)
    return txt


def main():
    a = sys.argv[1:]
    rnd = a[0] if a else 'r29'
    extra = None
    refs = [os.path.join(W2, 'guides', 'wolfRider.back.blue.png'),
            REPO + '/art-source/portraits/thornwood/thornScout/02.webp',
            REPO + '/art-source/portraits/anchor-style.webp']
    if rnd == 'r30':
        extra = ('A previous attempt at this sheet failed: ' + a[1] + '. This time every figure is small in its cell and seen '
                 'from high above and behind exactly like the clay maquettes of Image 1: the top of the hood, the shoulders and '
                 'the wolf\'s back large, the legs short and foreshortened; a rider and his standing wolf about 62% of the cell\'s '
                 'height; never at eye level, never seen from the side, never facing us. In the first cell the rider sits on his '
                 'standing wolf.')
        # Image 3 becomes the owner-kept front sheet of this same rider and wolf (camera-correct, 14/16): it fixes the
        # camera height, the figure's size in its cell and the kit; the facing comes from the maquette
        refs[2] = os.path.join(UNITS, 'pilot', 'raw', 'ad', 'wr.front.blue.g3pro.png')
        extra += (' Image 3 is the finished sheet of this same rider and wolf seen from the front, painted at the right camera '
                  'height and the right size in their cells: paint the same rider, the same wolf, the same kit and colours, at '
                  'the same camera height and size, but seen from behind as Image 1 shows; do not copy its facing.')
    os.makedirs(os.path.join(W2, 'prompts'), exist_ok=True)
    pf = os.path.join(W2, 'prompts', f'{rnd}.wolfRider.back.txt')
    open(pf, 'w').write(prompt(extra))
    j = dict(job='wolfRider.back', figure='wolfRider', view='back', round=rnd, route='pro', model=PRO, m='g3pro', aspect='4:3',
             key='blue', refs=refs,
             promptFile=pf, out=os.path.join(RAW, f't2{rnd}.wolfRider.back.blue.g3pro.png'),
             purpose=f'{rnd.upper()} wolfRider back sheet (Pro, blue key, back maquette; the kept front test\'s missing view)'
             + (' [re-roll, failure named]' if extra else ''))
    json.dump([j], open(os.path.join(W2, 'jobs', f'{rnd}.json'), 'w'), indent=1)
    print(j['out'])


if __name__ == '__main__':
    main()
