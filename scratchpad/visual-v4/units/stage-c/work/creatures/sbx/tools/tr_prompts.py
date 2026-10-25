# Stage B troops: the prompts and jobs for every foot troop sheet, the Warden front edit, the card busts and the banners.
# Sheets (Nano Banana Pro, gemini-3-pro-image, 1K, review changes 6 and 8): Image 1 the maquette guide (camera, poses,
# cloth zones), Image 2 a camera-correct sheet of the same view (tr_camrefs.py; the calibration's lever for the
# camera), Image 3 the troop's style portrait (hand and the nation's materials). The text is the art director's
# production template (prompts/ad/ad.warden.front.txt and the pilot's r3 back): style lock, daylight, the kit with the
# surcoat (change 4), the side colour named by its light, middle and shade, the back view's shield back and hit and fall
# cells, "facing, again", the detail paragraph. Thornwood cloth uses the calibration's colour words; the hue lock in
# the packer sets the hue (change 9). Prompts never name another game, franchise, artist or studio.
# Usage: python3 tr_prompts.py [--round r1]   writes ../../prompts/<job>.txt and ../../jobs/<round>.json
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from poses import LAYOUTS, CELL_WORDS  # noqa: E402

ROOT = os.path.abspath(os.path.join(HERE, '..'))
W = os.path.abspath(os.path.join(ROOT, '..'))  # stage-b/work/troops
B = os.path.abspath(os.path.join(W, '..', '..'))  # stage-b
UNITS = json.load(open(os.path.join(ROOT, 'units.json')))
BY = {u['id']: u for u in UNITS['units']}
CAMREFS = json.load(open(os.path.join(W, 'camrefs', 'camrefs.json')))
PROMPTS = os.path.join(W, 'prompts')
JOBS = os.path.join(W, 'jobs')
RAW = os.path.join(B, 'raw', 'troops')
REPO = '/home/user/Fluid-Magic-'
ANCHOR = REPO + '/art-source/portraits/anchor-style.webp'
PRO, NB = 'gemini-3-pro-image', 'gemini-nano-banana-2.1'
BANNED = re.compile(r'(warhammer|total war|dominions|blizzard|games workshop|riot|valve|creative assembly|'
                    r'frazetta|rutkowski|ghibli|disney|pixar|marvel|tolkien|elden|diablo|warcraft)', re.I)
KEYWORDS = {'green': ('pure green (#00FF00)', 'No green anywhere on the figures: no green cloth, no green glow, no green reflections.'),
            'magenta': ('pure magenta (#FF00FF)', 'No magenta, pink or purple anywhere on the figures.'),
            'blue': ('pure blue (#0000FF)', 'No blue anywhere on the figures.')}

STYLE = ('Painting style: painterly oil on a wood panel, visible directional brushwork, moderate detail, the same hand '
         'as the painted portrait references; a muted earthy palette of charcoal, ash grey, dull iron, bark brown, '
         'leather and bone, in which the side\'s cloth is the one clear hue; soft painterly edges, with small crisp '
         'highlights on metal edges and a thin bright rim of light along the upper-left edges of every figure. Each '
         'figure has a strong, simple, readable silhouette that still reads when the figure is shrunk to 40 pixels '
         'tall. It is not a cartoon: no cel shading, no thick black outlines, no chibi or big-headed proportions, no '
         'glossy 3D render, no pixel art.')
LIGHT = ('Light: outdoor daylight. A high sun in the upper left of the image lights the tops of helmets and hoods, '
         'the shoulders and the upper-left side of every figure with warm highlights; a cool blue-grey sky fill lies in '
         'the shadows on the lower-right side. No candlelight, no dramatic dark shadows, nothing glows unless the '
         'description below says so. No cast shadow on the background.')
CAMERA = {
    'back': ('Camera: high above and behind, looking down at about 40 degrees, the way a player looks down at '
             'miniatures on a table; orthographic, with no perspective, so every figure is the same size. Every figure '
             'faces away from us, toward the upper right of the image: we see its back, its right side, the top of its '
             'helmet or hood and the tops of its shoulders; its face is hidden. The figures are foreshortened as seen '
             'from above: the top of the head and the shoulders are large, the legs short.'),
    'front': ('Camera: high above and in front, looking down at about 40 degrees, the way a player looks down at '
              'miniatures on a table; orthographic, with no perspective, so every figure is the same size. Every '
              'figure faces toward us and toward the lower left of the image: we see its face from above, the top of '
              'its helmet or hood, its chest and its left side. The figures are foreshortened as seen from above: the '
              'top of the head and the shoulders are large, the legs short.'),
}
FACING = {
    'back': ('Facing, again: every figure in every one of the cells faces the same way, away from us toward the upper '
             'right, including the figure that is hit, the falling one and the fleeing ones; no face is seen anywhere on '
             'this sheet.'),
    'front': ('Facing, again: every figure in every one of the cells faces the same way, toward us and to the lower '
              'left, including the figure that is hit and the falling one; the fleeing figures alone turn away.'),
}
BACK_CELLS = {
    'recoil': ('hit from the front: the soldier lurches backward toward us with his back still turned to us, shoulders '
               'hunched, arms thrown out to the sides, head bowed forward; we see only the back of his head or helmet '
               'and his back, never his face'),
    'fall': ('falling backward toward us, knees buckling, about halfway to the ground; still seen from behind and above: '
             'the back of the head or helmet and the back toward us'),
}
NEVER = ('Never: text, letters, numbers, labels, grid lines, borders, frames, signatures, logos; a floor, ground, '
         'scenery or cast shadows; blood; extra people; cropped or overlapping figures.')
PROPS = ('Proportions and scale: realistic adult proportions, the head with its helmet or hood about one sixth of the '
         'standing height; weapons at true size. Standing upright, a figure is about 62% of its cell\'s height; lying '
         'figures are as long as the standing ones are tall.')

SIDE = {
    'cinderHorde': ('dull ember orange (#C4532C) cloth on {zones}. These are large, clean, unbroken areas that face the sky and '
                    'the camera, so that a packed block of these soldiers reads as that colour from far away: about a third '
                    'of what the camera sees of each standing figure is this cloth. The rest of the figure stays muted. The '
                    'ember-orange cloth is clean and fairly saturated: #D9744A where the sun strikes it, #C4532C in its '
                    'middle tones and a deep red-orange #7E3118 in the shade, never brown, grey or dusty; it is painted with '
                    'the same brushwork as the rest.'),
    'thornwood': ('{zones} are the side\'s cloth, dyed deep bottle green: the colour of jade or of a green glass bottle held '
                  'to the light, a clear and fairly saturated cool green, a little bluer than grass and much more colourful '
                  'than the grey, brown and leather of the rest of the kit. These are large, clean, unbroken areas that face '
                  'the sky and the camera, so that a packed block of these soldiers reads as that green from far away: about '
                  'a third of what the camera sees of each standing figure is this cloth. Lighter and still clearly green '
                  'where the sun strikes it, deep bottle green in its middle tones, dark green in the shade. Never '
                  'leaf-green, yellow-green or olive; never grey, slate, dusty or blackish; never as blue as teal. It is '
                  'painted with the same brushwork as the rest.'),
    'independent': ('undyed grey wool (#8C8A80) on {zones}: these fighters belong to no nation, so they wear no dyed colour '
                    'at all. The grey cloth is a large, clean, unbroken area that faces the sky and the camera, lighter '
                    'grey-beige #AAA79C where the sun strikes it and #5C5A54 in the shade, with tan linen, leather and iron '
                    'around it. Never orange, red, green or blue cloth anywhere.'),
}
DETAIL = {
    'cinderHorde': 'individual iron scales and plates with rusted edges and small bright highlights, rivets, leather straps and buckles, cloth folds and frayed hems, wood grain, worn metal on the weapons',
    'thornwood': 'individual bark plates with worn edges, cloth folds with frayed tips, leather straps and buckles, wood grain, a worn blade or point',
    'independent': 'mail rings and dented iron, quilted linen and coarse wool with frayed hems, leather straps and buckles, wood grain, a worn blade or point',
}
NO_LEAK = {
    'cinderHorde': 'no shield face on a soldier\'s back, no horns',
    'thornwood': 'no orange anywhere, no axe, no horns, no antlers',
    'independent': 'no orange, no green cloth, no crest, no horns',
}


def guide(fig, view):
    return os.path.join(ROOT, 'refs', 'guides', f'{fig}.{view}.png')


def cell_lines(u, view):
    cols, rows, _a, cells = LAYOUTS[u['layout']]
    over = dict(u.get('cellOverrides') or {})
    shield = bool((u.get('gear') or {}).get('shield'))
    lines = []
    for i, c in enumerate(cells):
        w = over.get(c) or CELL_WORDS[c]
        if view == 'back' and c in BACK_CELLS and c not in over:
            w = BACK_CELLS[c]
        if not shield:
            if c == 'brace' and 'brace' not in over:
                w = 'braced: the weapon held ready in both hands across the body, knees bent, leaning into the enemy'
            w = w.replace('weapon and shield dropped', 'weapon dropped').replace('only the weapon and the shield lying flat',
                                                                                 'only the weapon lying flat')
        if u['id'] == 'berserker' and c == 'brace':
            w = 'beating his chest with his free fist and roaring, the great axe in the other hand'
        lines.append(f'{i + 1}. (row {i // cols + 1}, column {i % cols + 1}) {w}.')
    return cols, rows, lines


def refs_note(u, view, camref_kind):
    nat = u['nation']
    lines = ['Image 1 is the camera and pose guide: grey clay maquettes in exactly this grid, rendered from the game\'s '
             'battle camera; the coloured areas on them mark where the side\'s cloth goes. Copy from it exactly the camera '
             'angle, the direction every figure faces, the pose in each cell, the size of the figure in its cell and the '
             'grid. Do not copy its smooth grey clay surfaces, its simple shapes or its toy-like proportions.',
             'Image 2 is a finished sprite sheet from the same game, painted at the same camera and in the same view: match '
             'its camera angle, the size of its figures in their cells, its daylight and its painting. Do not copy its '
             f'soldier, his kit, his weapon or his colours ({NO_LEAK[nat] if camref_kind != "own" else "its kit is a different unit"}); '
             'its grid of poses is not the one to copy (Image 1\'s is).',
             'Image 3 is a painted portrait from the same game, a reference for the painting hand and for the materials '
             'only: do not paint that person, and do not copy its dark background, its candlelight or its '
             'head-and-shoulders framing.']
    return '\n'.join(lines)


def sheet_prompt(u, view, extra=None, camref_kind='derived'):
    nat = UNITS['nations'][u['nation']]
    keyname, nokey = KEYWORDS[u['key']]
    cols, rows, lines = cell_lines(u, view)
    gear = u.get('gear') or {}
    parts = [refs_note(u, view, camref_kind), '',
             f'A game sprite sheet: {cols * rows} full-length painted figures of one soldier, one figure in each cell of a '
             f'{cols} by {rows} grid, on a perfectly flat, uniform {keyname} background. The same soldier, the same '
             'equipment, the same colours and the same scale in every cell; only the pose changes.', '',
             CAMERA[view], '', LIGHT, '', STYLE, '',
             f'The soldier: {u["kit"]}', '',
             'Side colour: ' + SIDE[u['nation']].format(zones=u['sideZones'][0].upper() + u['sideZones'][1:]
                                                       if u['nation'] == 'thornwood' else u['sideZones']), '']
    if view == 'back' and gear.get('shield'):
        parts += ['Seen from behind, the shield on the left arm shows only its back: dark wood, a rim and leather straps; '
                  'its painted face is turned toward the enemy, away from us. Never paint a shield face on a soldier\'s '
                  'back.', '']
    parts += [FACING[view], '',
              f'Detail: at full size each figure is a finished small painting, not a flat icon: {DETAIL[u["nation"]]}; '
              'varied, visible brush strokes. The values stay simple enough that the figure reads at 40 pixels: a light '
              'top (headgear, shoulders, cloth) against darker legs.', '', PROPS, '',
              'The cells, left to right, row by row (the poses of the camera and pose guide):'] + lines + ['']
    if u.get('weaponMotion'):
        parts += [f'Weapon motion: {u["weaponMotion"]}.', '']
    if extra:
        parts += [extra, '']
    parts += [f'Background and separation: one flat {keyname} colour fills the whole image with no gradient, texture, '
              f'floor, vignette or shadow; at least 24 pixels of clean background between any two figures and around the '
              f'edges. {nokey}', '', NEVER]
    txt = '\n'.join(parts)
    assert not BANNED.search(txt), BANNED.search(txt)
    return txt


def camref(u, view):
    own = os.path.join(W, 'camrefs', f'{u["nation"]}.{view}.own.png')
    if os.path.exists(own):
        return own, 'own'
    return CAMREFS[f'{u["nation"]}.{view}'], 'derived'


def sheet_job(fid, view, rnd, extra=None, tag=''):
    u = BY[fid]
    ref2, kind = camref(u, view)
    name = f'{fid}.{view}{tag}'
    pf = os.path.join(PROMPTS, f'{rnd}.{name}.txt')
    open(pf, 'w').write(sheet_prompt(u, view, extra, kind))
    return dict(job=name, figure=fid, view=view, round=rnd, model=PRO, m='g3pro', aspect='1:1', key=u['key'],
                refs=[guide(fid, view), ref2, u['styleRefs'][0]], promptFile=pf,
                out=os.path.join(RAW, f'{rnd}.{name}.g3pro.png'),
                purpose=f'{fid} {view} sheet ({rnd}, Pro, guide + camera sheet + portrait)')


def write(rnd, jobs):
    os.makedirs(JOBS, exist_ok=True)
    json.dump(jobs, open(os.path.join(JOBS, f'{rnd}.json'), 'w'), indent=1)
    print(rnd, len(jobs), 'jobs')


def main():
    os.makedirs(PROMPTS, exist_ok=True)
    rnd = sys.argv[sys.argv.index('--round') + 1] if '--round' in sys.argv else 'r1'
    which = [a for a in sys.argv[1:] if a not in ('--round', rnd)]
    allj = []
    todo = {'ashMilitia': ('back', 'front'), 'emberSkirmisher': ('back', 'front'), 'flameArcher': ('back', 'front'),
            'berserker': ('back', 'front'), 'flamebrand': ('back', 'front'),
            'thornMilitia': ('back', 'front'), 'warden': ('back',), 'longbowHunter': ('back', 'front'),
            'briarGuard': ('back', 'front'),
            'lightInfantry': ('back', 'front'), 'heavyInfantry': ('back', 'front'), 'archer': ('back', 'front'),
            'swampFighter': ('back', 'front')}
    for fid, views in todo.items():
        for v in views:
            if which and f'{fid}.{v}' not in which:
                continue
            allj.append(sheet_job(fid, v, rnd))
    write(rnd, allj)


if __name__ == '__main__':
    main()
