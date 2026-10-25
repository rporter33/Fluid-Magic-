# Stage B calibration, part 4b: the War Wolf alone and its rider alone, on separate sheets that composite at the
# maquette's anchors (a probe of the Wolf Rider test; the War Wolf's own figure waits for its portrait, stage C).
# Writes ../../prompts/mount.*.txt and ../../jobs/mount.json.
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from make_prompts import STYLE, LIGHT, CAMERA_CREATURE, NEVER, KEYWORDS  # noqa: E402

CAL = os.path.abspath(os.path.join(HERE, '..', '..'))
SBX = os.path.join(CAL, 'sbx')
REPO = '/home/user/Fluid-Magic-'
REFS = [REPO + '/art-source/portraits/thornwood/thornScout/02.webp', REPO + '/art-source/portraits/anchor-style.webp']
PRO = 'gemini-3-pro-image'
keyname, nokey = KEYWORDS['blue']
GREEN = ('The green is a clean, clearly coloured pine green that catches the sun, like fresh fir needles, never blackish, '
         'olive, grey or teal-blue.')

REFNOTE = ('Image 1 is the camera and pose guide: grey clay maquettes in exactly this grid, rendered from the game\'s battle '
           'camera; the coloured areas on them mark where the side\'s cloth goes. Copy from it exactly the camera angle, the '
           'direction every figure faces, the pose in each cell, the size and the position of the figure in its cell and '
           'the grid. Do not copy its smooth grey clay surfaces, its simple shapes or its toy-like proportions.\n'
           'Image 2 is a painted portrait from the same game, a reference for the painting style and the nation\'s materials '
           'only: do not paint that person, and do not copy its dark background, its candlelight or its framing.\n'
           'Image 3 is a second painting-style reference from the same set; the same rules apply.')

CAM_FRONT = ('Camera: high above and in front, looking down at about 40 degrees, the way a player looks down at miniatures on '
             'a table; orthographic, with no perspective, so every figure is the same size. Every figure faces toward us and '
             'toward the lower left of the image. The figures are foreshortened as seen from above.')

WOLF_CELLS = [
    'the wolf standing square on all four paws, head up and ears forward',
    'the wolf loping, front paws reaching', 'the wolf loping, legs gathered',
    'the wolf leaping, front paws off the ground', 'the wolf landing from a leap, front paws down, hind legs high',
    'the wolf at full gallop, stretched out, charging toward the lower left',
    'the wolf crouched low on its haunches, about to spring', 'the wolf lunging forward, head low',
    'the wolf biting: head lunged forward, jaws wide open', 'the wolf flinching sideways from a hit',
    'the wolf stumbling, its front legs buckling', 'the wolf lying dead on its side',
    'the wolf lying dead, a different sprawl', 'the wolf bolting at a gallop, extended',
    'the wolf bolting at a gallop, gathered', 'the wolf with its head thrown up, howling']

RIDER_CELLS = [
    'sitting upright astride the invisible wolf, the spear held upright with its pennon',
    'riding at a lope, leaning a little forward, the spear held upright',
    'riding at a lope, upright again, the spear held upright',
    'riding low, leaning far forward over the invisible wolf\'s neck as it leaps',
    'rising in the seat, leaning back a little as the wolf lands',
    'the charge: leaning forward, the spear couched and aimed toward the lower left',
    'rising in the seat, the spear drawn far back over the shoulder to thrust',
    'thrusting the spear down and forward toward the lower left',
    'holding on, leaning back, the spear held high',
    'knocked back in the seat, arms thrown out',
    'tumbling backward off the mount, the legs still apart',
    'lying dead on the ground, on his back',
    'lying dead on the ground face down, a different sprawl',
    'dismounted, standing on his own feet on the ground, the spear upright: an unhorsed rider',
    'dismounted, marching on foot, left foot forward, the spear upright',
    'sitting astride the invisible wolf, the spear raised high overhead in victory']


def sheet(subject, kit, cells, extra):
    lines = [f'{i + 1}. (row {i // 4 + 1}, column {i % 4 + 1}) {w}.' for i, w in enumerate(cells)]
    return '\n'.join([REFNOTE, '',
                      f'A game sprite sheet: 16 full-length painted figures of {subject}, one figure in each cell of a 4 by 4 '
                      f'grid, on a perfectly flat, uniform {keyname} background. The same {subject.split(" ", 1)[1]}, the same '
                      'equipment, the same colours and the same scale in every cell; only the pose changes.', '',
                      CAM_FRONT, '', LIGHT, '', STYLE, '', kit, '', extra, '',
                      'The cells, left to right, row by row (the poses of the camera and pose guide):'] + lines + ['',
                      f'Background and separation: one flat {keyname} colour fills the whole image with no gradient, texture, '
                      f'floor, vignette or shadow; at least 24 pixels of clean background between any two figures and around '
                      f'the edges. No blue, violet or purple anywhere on the figures.', '', NEVER])


def main():
    wolf_kit = ('The figure: a War Wolf of the Thornwood, saddled but with no rider: a real, huge timber wolf, its shoulder as '
                'high as a man\'s chest, long legs, a deep narrow chest, a long muzzle, pointed ears, a bushy tail; a thick '
                'dark grey-brown coat, darker along the spine, warm grey and brown, never pink or violet. On its back a large '
                'pine-green saddle cloth with a broad pale bone-coloured border, from the shoulders to the hips and hanging '
                'low on both flanks, under a small empty bark saddle; a pine-green quilted cloth bib over its chest under a '
                'narrow bark-plate harness. ' + GREEN)
    wolf_extra = ('Nobody rides it: the saddle is empty in every cell, and there is no person anywhere on the sheet. Facing, '
                  'again: every wolf faces toward us and to the lower left, the hit and falling ones included.')
    rider_kit = ('The figure: a Wolf Rider of the Thornwood, painted without his wolf: a man in bark armour under a hooded '
                 'cloak of clear pine green, hood up, the cloak spread over his shoulders and back, a pine-green tabard over his '
                 'chest, leather riding boots, and a spear with a leaf-shaped head that flies a long pine-green pennon edged in '
                 'pale bone-coloured cord. ' + GREEN)
    rider_extra = ('He rides a wolf that is NOT painted: in the riding cells he sits in the air exactly as in the guide, knees '
                   'bent and spread wide apart around where the wolf\'s body would be, as if astride it; there is no wolf, no '
                   'saddle, no animal, nothing under him and no ground. The two dismounted cells and the two dead cells are '
                   'on the ground. Facing, again: every figure faces toward us and to the lower left, the hit and falling '
                   'ones included.')
    P, J = os.path.join(CAL, 'prompts'), os.path.join(CAL, 'jobs')
    jobs = []
    for name, subject, kit, cells, extra in (('wolfOnly', 'one saddled war wolf', wolf_kit, WOLF_CELLS, wolf_extra),
                                             ('wolfRiderSeat', 'one wolf rider', rider_kit, RIDER_CELLS, rider_extra)):
        pf = os.path.join(P, f'mount.{name}.front.txt'); open(pf, 'w').write(sheet(subject, kit, cells, extra))
        jobs.append(dict(job=f'{name}.front', figure=name, view='front', model=PRO, aspect='4:3', key='blue',
                         refs=[os.path.join(SBX, 'refs', 'guides', f'{name}.front.png')] + REFS, promptFile=pf,
                         out=os.path.join(CAL, 'raw', f'{name}.front.g3pro.png'),
                         purpose=f'mount and rider apart (Wolf Rider test probe): {name} front sheet (Pro, split maquette)'))
    json.dump(jobs, open(os.path.join(J, 'mount.json'), 'w'), indent=1)
    print(open(jobs[1]['promptFile']).read()[:3000])


if __name__ == '__main__':
    main()
