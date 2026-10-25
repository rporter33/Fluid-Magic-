# Rest of stage D: the action jobs for every big body (art plan 5.3, 6): which figures, which actions on which sheet,
# the guides to render, the references (Image 1 the action maquette guide, Image 2 the approved stage C idle cutout of
# the same figure and view on its key colour), and the prompts ("the same creature, now ..."). Writes
#   prod/jobs/guides.json   the guide jobs (dd_guides.py), the idle guides included (for the idle cutouts' mesh weights)
#   prod/jobs/actions.json  the generation jobs (dd_gen.py), each with its cost and priority
#   prod/prompts/<job>.txt, prod/refs/<figure>.<view>.idle-on-key.png
# Usage: python3 -I dd_jobs.py
import json, os, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
PROD = os.path.abspath(os.path.join(HERE, '..'))
STAGE = os.path.abspath(os.path.join(PROD, '..'))
UNITS = os.path.abspath(os.path.join(STAGE, '..'))
SC = os.path.join(UNITS, 'stage-c')
KEYHEX = {'green': (0, 255, 0), 'magenta': (255, 0, 255), 'blue': (0, 0, 255)}
KEYWORD = {'green': 'pure green (#00FF00)', 'magenta': 'pure magenta (#FF00FF)', 'blue': 'pure blue (#0000FF)'}
KEYBAN = {'green': 'No green anywhere on the figure: no green cloth, no green glow, no green reflections.',
          'magenta': 'No pink, magenta, violet or purple anywhere on the figure.',
          'blue': 'No blue, cyan or violet anywhere on the figure.'}

# ---------------------------------------------------------------- figures
CREATURES = {  # figure: (body, key, noun, priority)
    'salamander-01': ('salamander', 'green', 'salamander', 1), 'salamander-02': ('salamander', 'green', 'salamander', 9),
    'salamander-03': ('salamander', 'green', 'salamander', 1), 'salamander-04': ('salamander', 'green', 'salamander', 1),
    'treant-01': ('treant', 'magenta', 'treant', 1), 'treant-02': ('treant', 'magenta', 'treant', 1),
    'treant-03': ('treant', 'magenta', 'treant', 1), 'treant-04': ('treant', 'magenta', 'treant', 9),
    'giant-01': ('giant', 'magenta', 'giant', 1), 'giant-02': ('giant', 'magenta', 'giant', 1),
}
GODS = {  # figure (the painted palette; the Thornwood palettes of the generic gods are tint edits): (body, key, noun, priority)
    'titan-cinderHorde': ('titan', 'green', 'god', 1), 'ascendedHero-cinderHorde': ('ascendedHero', 'green', 'god', 1),
    'oracle-cinderHorde': ('oracle', 'green', 'god', 1), 'pyreLord-cinderHorde': ('pyreLord', 'green', 'god', 1),
    'emberHierophant-cinderHorde': ('emberHierophant', 'green', 'god', 1), 'ashColossus-cinderHorde': ('ashColossus', 'blue', 'god', 1),
    'hornedHunter-thornwood': ('hornedHunter', 'magenta', 'god', 1), 'motherOfBeasts-thornwood': ('motherOfBeasts', 'magenta', 'god', 1),
    'wildSpirit-thornwood': ('wildSpirit', 'magenta', 'creature', 1), 'ashPhoenix-cinderHorde': ('ashPhoenix', 'blue', 'creature', 1),
    'greatWyrm-cinderHorde': ('greatWyrm', 'green', 'creature', 1), 'primordial-cinderHorde': ('primordial', 'green', 'creature', 1),
    'elderWyrm-thornwood': ('elderWyrm', 'magenta', 'creature', 1), 'worldTree-thornwood': ('worldTree', 'magenta', 'tree', 1),
    'livingMonolith-cinderHorde': ('livingMonolith', 'green', 'standing stone', 9), 'cinderIdol-cinderHorde': ('cinderIdol', 'blue', 'idol', 9),
}
TINTED = {'titan', 'oracle', 'ascendedHero', 'greatWyrm', 'primordial', 'livingMonolith'}  # their Thornwood figures: tint edits (gd_tint)
B_EXTRA = {'oracle': ['castA', 'castB'], 'emberHierophant': ['castA', 'castB'], 'pyreLord': ['call', 'fall'], 'hornedHunter': ['call', 'fall']}
SHEETS = {  # body: [(sheet tag, actions)]; size 5 and 6: one action per image ('single')
    'salamander': [('S', ['breath', 'tailLash', 'hit', 'dead'])],
    'treant': [('S', ['windup', 'slam', 'hit', 'dead'])],
    'wildSpirit': [('S', ['leap', 'rake', 'hit', 'dissolving'])],
    'ashPhoenix': [('A', ['glide', 'wingsUp', 'wingsDown', 'rake']), ('B', ['hit', 'dive', 'burnOutA', 'burnOutB'])],
}
for b in ('giant', 'titan', 'ascendedHero', 'oracle', 'pyreLord', 'emberHierophant', 'hornedHunter', 'motherOfBeasts'):
    SHEETS[b] = [('A', ['stepA', 'stepB', 'windup', 'strike']), ('B', ['hit', 'dead'] + B_EXTRA.get(b, ['follow', 'fall']))]
SINGLES = {'greatWyrm': ['breath', 'flight', 'dead'], 'primordial': ['bite', 'trample', 'dead'], 'elderWyrm': ['bite', 'trample', 'dead'],
           'worldTree': ['windup', 'slam', 'dead'], 'ashColossus': ['stepA', 'stepB', 'windup', 'strike', 'dead'],
           'livingMonolith': ['shattered'], 'cinderIdol': ['shattered']}
SIZE2K = {'greatWyrm', 'primordial', 'elderWyrm', 'worldTree', 'livingMonolith', 'cinderIdol'}  # size 6: 2K, as their idle cutouts
# 2 x 2 sheets at 2K (1024 px cells) where a 512 px cell would hold fewer than 4.5 px a wu at the body's tier H height (stage C's
# 2K rule, gods.json decision 6): the Salamander (98 wu back) and the size-4 bodies (95 to 123 wu, gods x1.15)
GRID2K = {'salamander', 'treant', 'giant', 'titan', 'pyreLord', 'hornedHunter', 'motherOfBeasts'}
# code-only (no generation), recorded in the metadata: the hit of size 5 and 6 bodies is the idle cutout tilted 6 degrees away
# from the blow with the one-frame white flash and the mesh flinch; the idols' pulse is the glyph emissive mask on the idle
CODE_ONLY = {'greatWyrm': ['hit'], 'primordial': ['hit'], 'elderWyrm': ['hit'], 'worldTree': ['hit'], 'ashColossus': ['hit'],
             'livingMonolith': ['hit', 'pulse'], 'cinderIdol': ['hit', 'pulse']}


def idle_path(fig, view):
    if fig == 'salamander-01':
        return os.path.join(UNITS, 'pilot', 'ad', 'frames', f'{fig}.{view}', f'{fig}.{view}.idle.png')
    if fig in CREATURES:
        return os.path.join(SC, 'atlas', 'creatures', 'frames', f'{fig}.{view}', f'{fig}.{view}.idle.png')
    return os.path.join(SC, 'atlas', 'gods', f'{fig}.{view}', f'{fig}.{view}.idle.png')


def source_prompt(fig, view):
    """The prompt text that painted the approved idle cutout (its raw image's sidecar)."""
    if fig == 'salamander-01':
        raw = os.path.join(UNITS, 'pilot', 'raw', 'r2', 'sal.back.nb21.json')
    elif fig in CREATURES:
        raw = os.path.join(UNITS, json.load(open(os.path.join(SC, 'atlas', 'creatures', 'figures', fig + '.json')))['views'][view]['sheet']).rsplit('.png', 1)[0] + '.json'
    else:
        g = json.load(open(os.path.join(SC, 'atlas', 'gods', 'gods.json')))['figures'][fig]['views'][view]
        raw = os.path.join(UNITS, g['source']['raw']).rsplit('.png', 1)[0] + '.json'
    return json.load(open(raw))['prompt']


STOP_AT = ('Size:', 'Remove from', 'Light:', 'Painting style:', 'Background:', 'Never:', 'Camera:', 'Corrections from', 'Image ')


def _desc_from(txt):
    out, on = [], False
    for ln in txt.split('\n'):
        s = ln.strip()
        if s.startswith(('The creature:', 'The giant:', 'The god:', 'The treant:', 'The salamander:')):
            on = True
        elif on and s.startswith(STOP_AT):
            break
        if on and s:
            out.append(s)
    return '\n'.join(out)


def description(fig, view):
    """The figure's description paragraph from the prompt that painted its approved idle cutout; a fix-up prompt without one
    (a re-dress or a local repair) falls back to the other view's, then to the figure's first full prompt in stage C."""
    other = 'front' if view == 'back' else 'back'
    cands = [lambda: source_prompt(fig, view), lambda: source_prompt(fig, other)]
    if fig in CREATURES:
        short = fig.replace('salamander-', 'sal').replace('-', '')
        d = os.path.join(SC, 'work', 'creatures', 'prompts')
        for v in (view, other):
            for f in sorted(os.listdir(d)):
                if f.startswith(f'{short}.{v}.'):
                    cands.append(lambda f=f: open(os.path.join(d, f)).read())
    for c in cands:
        try:
            t = _desc_from(c())
        except Exception:  # noqa: BLE001
            t = ''
        if t:
            return t
    raise SystemExit(f'no description for {fig} {view}')


# ---------------------------------------------------------------- action words
WEAPON = {'giant': 'club', 'titan': 'great sword', 'ascendedHero': 'sword', 'oracle': 'orb staff', 'pyreLord': 'glaive',
          'emberHierophant': 'orb staff', 'hornedHunter': 'spear', 'motherOfBeasts': 'maul', 'ashColossus': 'rock fists'}
TWO = {'titan', 'motherOfBeasts'}


def words(body, action, view, noun):
    w = WEAPON.get(body, '')
    hands = 'in both hands' if body in TWO else 'in its right hand'
    away = 'toward the lower left of the image (it fell backwards, toward us)' if view == 'back' else 'toward the upper right of the image (it fell backwards, away from us)'
    B = {
        ('salamander', 'breath'): 'about to breathe fire, but no fire is painted: crouched low and braced on its four splayed legs, the neck stretched forward and the head thrust out and a little raised, the jaws gaping wide open (the inside of the mouth dark, the teeth showing), the throat swollen and puffed out under the jaw, the tail straight out behind.',
        ('salamander', 'tailLash'): 'lashing its tail: the body curved into a bow, the thick tail swung hard round to its left side in a sweeping arc, the head and neck turned back the other way, the legs braced and splayed.',
        ('salamander', 'hit'): 'struck and recoiling: the front of the body reared up off the ground, the head and neck thrown up and back to its right, the jaws half open in pain, the tail curled, the legs scrabbling.',
        ('salamander', 'dead'): 'dead: rolled over onto its side, the pale belly half turned to the sky, the four legs limp and sticking out sideways, the head lying on the ground with the jaws slack, the tail lying limp in a loose curve.',
        ('treant', 'windup'): 'winding up a blow: rearing back, both branch arms raised high above the crown with the twig fingers spread, the trunk leaning back.',
        ('treant', 'slam'): 'slamming down: the trunk bent forward, both branch arms brought down hard so that their twig fingers strike the ground in front of it, one root-leg stepped forward.',
        ('treant', 'hit'): 'struck and recoiling: the trunk leaning back, both branch arms flung out to the sides, one root-leg stepping back, the face grimacing.',
        ('treant', 'dead'): f'toppled and dead: fallen flat on its back on the ground like a felled tree, its crown {away}, the branch arms limp and spread, the root-legs sticking up.',
        ('wildSpirit', 'leap'): 'leaping: in mid-bound off the ground, the forelegs stretched out forward and the hind legs kicked out behind, the neck reaching forward.',
        ('wildSpirit', 'rake'): 'raking: lunging forward with the head lowered so the tall antlers point forward to gore, the forelegs striking out, the hind legs braced.',
        ('wildSpirit', 'hit'): 'struck: rearing back, the head and long neck thrown up, staggering on its hind legs.',
        ('wildSpirit', 'dissolving'): 'dying: sinking to the ground, the legs folding under it, the head drooping low to the ground (the game adds the mist it dissolves into; paint none).',
        ('ashPhoenix', 'glide'): 'gliding in flight: the body level, the broad wings spread wide and flat to both sides, the long tail streaming out behind, the talons tucked back.',
        ('ashPhoenix', 'wingsUp'): 'flying, the wings at the top of their beat: both wings raised high above the body in a V, the flight feathers fanned, the tail streaming behind.',
        ('ashPhoenix', 'wingsDown'): 'flying, the wings at the bottom of their beat: both wings swept down below the body, the tips curling forward, the tail streaming behind.',
        ('ashPhoenix', 'rake'): 'raking: the body tilted back in the air, the gold talons thrust forward wide open to strike, the wings spread and raised behind, the tail fanned.',
        ('ashPhoenix', 'hit'): 'struck in the air: the body thrown back, the wings flared out unevenly, the head jerked back.',
        ('ashPhoenix', 'dive'): 'diving to attack: the wings swept back close to the body, the head and beak pointing forward and down, the tail streaming behind.',
        ('ashPhoenix', 'burnOutA'): 'burnt out and falling: the wings collapsing and folding, the head drooping, the body tumbling out of the air (the game adds the embers; paint none).',
        ('ashPhoenix', 'burnOutB'): 'dead: lying crumpled on the ground, the wings spread limp over the ground, the head on the ground, the plumage darker, charred (no embers, no fire).',
        ('greatWyrm', 'breath'): 'about to breathe fire, but no fire is painted: rearing up, the chest raised high on the forelegs, the neck stretched forward and the head thrust out, the jaws gaping wide open, the wings half spread and raised.',
        ('greatWyrm', 'flight'): 'flying: aloft above the ground, the wings raised high and spread wide, the legs tucked under the body, the neck stretched forward, the tail streaming out behind.',
        ('greatWyrm', 'dead'): 'dead: sprawled flat on the ground, the legs splayed out, the long neck lying twisted on the ground with the head on its side and the jaws slack, the wings collapsed and spread limp over the ground, the tail lying in a loose curve.',
        ('primordial', 'bite'): 'charging to strike: the great head lowered and thrust forward so the curling ram\'s horns lead, the forelegs braced, the hump bunched over the shoulders.',
        ('primordial', 'trample'): 'trampling: rearing up on its hind legs, the forelegs raised high to stamp down, the head thrown up, the hump towering.',
        ('primordial', 'dead'): 'dead: collapsed onto its side on the ground, the four legs sticking out stiffly, the head lying on the ground.',
        ('elderWyrm', 'bite'): 'biting: the neck lunged forward low over the ground, the jaws gaping wide, the forelegs braced and splayed.',
        ('elderWyrm', 'trample'): 'trampling: rearing up on its hind legs and tail, the front of the long body raised high, the forelegs lifted to stamp down, the jaws open.',
        ('elderWyrm', 'dead'): 'dead: rolled onto its side on the ground, the legs limp and sticking out sideways, the head lying on the ground with the jaws slack, the club tail lying limp.',
        ('worldTree', 'windup'): 'lashing: the great tree leaning back, two great leafy boughs swung up and back out of its canopy, ready to lash down.',
        ('worldTree', 'slam'): 'lashing down: the tree leaning forward, the two great leafy boughs whipped down so their ends strike the ground in front of it.',
        ('worldTree', 'dead'): 'felled: the great tree toppled over and lying on the ground, its roots torn up out of the earth at one end and its canopy crushed against the ground at the other.',
        ('livingMonolith', 'shattered'): 'shattered: the standing stone broken across a third of the way up; the stump still stands on its mound of earth and roots, and the upper part lies broken in three heavy chunks on the mound, the glyphs still on them, with small stones and dust around.',
        ('cinderIdol', 'shattered'): 'shattered: the idol broken across the middle; the lower half still stands on the stepped plinth, the carved face has fallen forward onto the ground in one block, the brazier lies toppled beside the plinth, its coals spilled and dark.',
    }
    if (body, action) in B:
        return B[(body, action)]
    if body == 'ashColossus':
        A = {'stepA': 'walking: a long heavy stride, the right foot forward and planted, the left foot behind on its toes, the arms swinging, the rock fists closed.',
             'stepB': 'the next step: the left foot forward and planted, the right foot behind on its toes, the arms swinging the other way.',
             'windup': 'winding up a punch: the right rock fist drawn back high behind its shoulder, the body twisted back to the right, the left arm forward.',
             'strike': 'punching: the right rock fist driven forward and down in a crushing blow, the body twisted forward and leaning into it, the left foot stepped forward.',
             'dead': f'dead: fallen flat on its back on the ground, the arms flung out, its head {away}.'}
        return A[action]
    A = {
        'stepA': f'walking: a long striding step, the right foot far forward and planted, the left foot far behind on its toes, the body leaning forward, the arms swinging, the {w} carried {hands}.',
        'stepB': f'the next step: the left foot far forward and planted, the right foot far behind on its toes, the body leaning forward, the arms swinging the other way, the {w} carried {hands}.',
        'windup': f'winding up a blow: the {w} raised high over its right shoulder {hands}, the body twisted back to the right and leaning back, the weight on the back foot.',
        'strike': (f'thrusting: the {w} driven straight forward at the enemy in both hands, the body lunging into it, the left foot stepped far forward.'
                   if body in ('pyreLord', 'hornedHunter') else
                   f'striking: the {w} swung round in a heavy blow {hands}, at the moment of impact: the {w} out level in front of the body and to its left, the body twisted round and lunging into the blow, the left foot stepped far forward.'),
        'follow': f'the follow-through: the {w} carried on past the body low to its left after the blow, the body twisted far round to the left.',
        'hit': f'struck and staggering: leaning back, the head thrown back, both arms flung out to the sides, the {w} still held, one foot stepping back.',
        'fall': f'falling: buckling forward onto one knee, the head bowed, the {w} sagging toward the ground.',
        'dead': f'dead: fallen flat on its back on the ground, the arms flung out, the {w} fallen beside it, its head {away}.',
        'castA': f'casting a spell: the {w} raised high above the head in both hands, the face turned up (no light, no magic is painted: the game draws it).',
        'castB': f'releasing the spell: the {w} thrust forward toward the enemy in the right hand, the left palm open and pushed forward, leaning into it (no light, no magic is painted).',
    }
    if action == 'call' and body == 'pyreLord':
        return 'calling his fire sprites: the glaive swept out in a wide flat arc to his right at arm\'s length, the body turned with it, the left hand open (no fire is painted).'
    if action == 'call' and body == 'hornedHunter':
        return 'calling the hunt: a curved hunting horn (dark horn bound with a gold band) raised to his lips in the left hand, the head tilted back, the spear held upright in the right hand.'
    return A[action]


CELL = ['Top left', 'Top right', 'Bottom left', 'Bottom right']


def camera(view, noun):
    if view == 'back':
        return (f'Camera: high above and behind, looking down at about 40 degrees, the way a player looks down at a miniature on a '
                f'table; orthographic, with no perspective. The {noun} faces away from us, toward the upper right of the image, as in '
                f'Image 1 and Image 2: we see its back, its right side and the top of its head from behind; its face is hidden. It is '
                f'foreshortened as seen from above: the top of the head, the shoulders or back and the upper body are large, the legs short.')
    return (f'Camera: high above and in front, looking down at about 40 degrees, the way a player looks down at a miniature on a '
            f'table; orthographic, with no perspective. The {noun} faces toward us and to the lower left of the image, as in Image 1 '
            f'and Image 2: we see its face from above, its chest and its left side. It is foreshortened as seen from above: the top of '
            f'the head, the shoulders or back and the upper body are large, the legs short.')


LIGHT = ('Light: outdoor daylight, exactly as in Image 2; the figure stays as dark and as muted as in Image 2, lit only by small warm and '
         'cool highlights, never washed out or brightened. A high sun in the upper left of the image lights the top and the upper-left '
         'side with warm highlights; a cool blue-grey sky fill lies in the shadows on the lower-right side. No candlelight, no dramatic '
         'dark shadows. Nothing glows more than it does in Image 2. No cast shadow on the background.')
STYLE = ('Painting style: painterly oil on a wood panel, visible directional brushwork, moderate detail, exactly the hand of Image 2; a '
         'muted earthy palette with its own colours exactly as Image 2 shows them; soft painterly edges, small crisp highlights and a '
         'thin bright rim of light along the upper-left edges. A strong, simple, readable silhouette in every pose. It is not a cartoon: '
         'no cel shading, no thick black outlines, no chibi or big-headed proportions, no glossy 3D render, no pixel art.')


def prompt(fig, body, key, noun, view, acts, layout, extra=None):
    kw = KEYWORD[key]
    L = []
    if layout == 'grid':
        L.append('Image 1 is the pose and layout guide: four grey clay maquettes of this ' + noun + ' in a 2 by 2 grid, one action in each '
                 'cell, rendered from the game\'s battle camera. Copy from it exactly, cell by cell, the camera angle, the direction the body '
                 'faces, the pose, the figure\'s size and its place in the cell. Do not copy its smooth clay surfaces, its simplified round '
                 'shapes or the thickness of its limbs: the body, its anatomy and every detail follow Image 2.')
    else:
        L.append('Image 1 is the pose guide: a grey clay maquette of this ' + noun + ' in one action, rendered from the game\'s battle camera. '
                 'Copy from it exactly the camera angle, the direction the body faces, the pose, and the figure\'s size and place in the frame. '
                 'Do not copy its smooth clay surfaces, its simplified round shapes or the thickness of its limbs: the body, its anatomy and '
                 'every detail follow Image 2.')
    L.append('Image 2 is the approved painted game cutout of this exact ' + noun + ', standing at rest, seen from the same camera in the same '
             'view. Paint the same individual, with exactly the same head, shapes, proportions, colours, materials, markings and equipment, '
             'in the same painting style and the same light, now in the action' + ('s of Image 1. It must be unmistakably the same ' + noun +
             ' in all four cells.' if layout == 'grid' else ' of Image 1.'))
    L.append('')
    if layout == 'grid':
        L.append(f'One sheet: four painted figures of the same {noun}, full body, one in each cell of a 2 by 2 grid, on a perfectly flat, '
                 f'uniform {kw} background, as game cutouts. Read left to right, top row first:')
        for c, a in zip(CELL, acts):
            L.append(f'{c}: {words(body, a, view, noun)}')
        L.append(f'Every cell takes its pose from Image 1, never from Image 2: Image 2 shows only what the {noun} looks like, and its '
                 f'standing pose must not be copied into any cell. Each pose is strong and unmistakable at a glance.'
                 + (' The two walking cells show a long, clearly visible stride, the legs far apart, different from each other and from '
                    'the standing pose.' if 'stepA' in acts else ''))
    else:
        L.append(f'One large painted {noun}, full body, alone in the image on a perfectly flat, uniform {kw} background, as a game cutout. '
                 f'Action: {words(body, acts[0], view, noun)}')
    L += ['', camera(view, noun), '', LIGHT, '', STYLE, '', description(fig, view), '']
    if extra:
        L += [extra, '']
    if layout == 'grid':
        L.append('Size: in each cell the figure fills the cell exactly as its maquette does in Image 1 and stands in the same place, '
                 'with clean background all round it; nothing is cropped and no part of one figure reaches into a neighbouring cell.')
    else:
        L.append('Size: the figure fills the image exactly as its maquette does in Image 1, in the same place, with at least 24 pixels of '
                 'clean background all round; nothing is cropped.')
    L += ['', f'Background: one flat {kw} colour fills the whole image with no gradient, texture, floor, vignette or shadow. {KEYBAN[key]}',
          '', 'Never: text, letters, numbers, labels, grid lines, dividing lines between the cells, borders, frames, signatures, logos; a '
          'floor, ground, scenery or cast shadows; blood; other creatures or people; a cropped figure; fire, flames, breath, smoke, sparks, '
          'floating embers, magic light or mist (the game draws every effect).']
    txt = '\n'.join(L) + '\n'
    for wd in ('Total War', 'Warhammer', 'Dominions', 'Age of Wonders', 'Riot', 'League of Legends', 'Blizzard', 'Diablo', 'Warcraft',
               'Magic: The Gathering', 'Disney', 'Pixar', 'Ghibli', 'Frazetta', 'Rembrandt', 'Rutkowski', 'Tolkien'):
        assert wd.lower() not in txt.lower(), (fig, wd)
    return txt


def idle_on_key(fig, view, key):
    os.makedirs(os.path.join(PROD, 'refs'), exist_ok=True)
    out = os.path.join(PROD, 'refs', f'{fig}.{view}.idle-on-key.png')
    im = Image.open(idle_path(fig, view)).convert('RGBA')
    pad = int(max(im.size) * 0.06)
    bg = Image.new('RGBA', (im.width + 2 * pad, im.height + 2 * pad), KEYHEX[key] + (255,))
    bg.alpha_composite(im, (pad, pad))
    bg = bg.convert('RGB')
    if max(bg.size) > 1400:
        bg.thumbnail((1400, 1400), Image.LANCZOS)
    bg.save(out)
    return out


def main():
    figs = {**{f: v for f, v in CREATURES.items()}, **{f: v for f, v in GODS.items()}}
    gjobs, jobs = [], []
    os.makedirs(os.path.join(PROD, 'prompts'), exist_ok=True)
    os.makedirs(os.path.join(PROD, 'jobs'), exist_ok=True)
    seen_idle = set()
    for fig, (body, key, noun, prio) in figs.items():
        rig = 'salamander' if body == 'salamander' else 'treant' if body == 'treant' else body
        for view in ('back', 'front'):
            if (rig, view) not in seen_idle:
                gjobs.append(dict(id=f'{rig}.idle.{view}', body=rig, view=view, actions=['idle'], layout='single', gen=False))
                seen_idle.add((rig, view))
            ref = idle_on_key(fig, view, key)
            if body in SINGLES:
                for a in SINGLES[body]:
                    gid = f'{rig}.{a}.{view}'
                    if gid not in [g['id'] for g in gjobs]:
                        gjobs.append(dict(id=gid, body=rig, view=view, actions=[a], layout='single', gen=True))
                    job = f'{fig}.{view}.{a}'
                    p = os.path.join(PROD, 'prompts', job + '.txt')
                    open(p, 'w').write(prompt(fig, body, key, noun, view, [a], 'single'))
                    size = '2K' if body in SIZE2K else None
                    jobs.append(dict(job=job, figure=fig, body=body, view=view, actions=[a], layout='single', guide=gid, key=key, priority=prio,
                                     model='gemini-nano-banana-2.1', aspect=None, size=size, prompt=p,
                                     refs=[os.path.join(PROD, 'guides', gid + '.png'), ref],
                                     out=os.path.join(STAGE, 'raw', f'act.{job}.nb21' + ('.2k' if size else '') + '.png'),
                                     purpose=f'D rest: {fig} {view} {a} action cutout (nb21: maquette + approved idle cutout{", 2K" if size else ""})'))
            else:
                for tag, acts in SHEETS[body]:
                    gid = f'{rig}.{tag}.{view}'
                    if gid not in [g['id'] for g in gjobs]:
                        gjobs.append(dict(id=gid, body=rig, view=view, actions=acts, layout='grid', gen=True))
                    job = f'{fig}.{view}.{tag}'
                    p = os.path.join(PROD, 'prompts', job + '.txt')
                    open(p, 'w').write(prompt(fig, body, key, noun, view, acts, 'grid'))
                    size = '2K' if body in GRID2K else None
                    jobs.append(dict(job=job, figure=fig, body=body, view=view, actions=acts, layout='grid', guide=gid, key=key, priority=prio,
                                     model='gemini-nano-banana-2.1', aspect='1:1', size=size, prompt=p,
                                     refs=[os.path.join(PROD, 'guides', gid + '.png'), ref],
                                     out=os.path.join(STAGE, 'raw', f'act.{job}.nb21' + ('.2k' if size else '') + '.png'),
                                     purpose=f'D rest: {fig} {view} actions sheet {tag} ({", ".join(acts)}) (nb21: maquette + approved idle cutout{", 2K" if size else ""})'))
    json.dump(gjobs, open(os.path.join(PROD, 'jobs', 'guides.json'), 'w'), indent=1)
    json.dump(jobs, open(os.path.join(PROD, 'jobs', 'actions.json'), 'w'), indent=1)
    main_n = sum(1 for j in jobs if j['priority'] == 1)
    print(len(gjobs), 'guides;', len(jobs), 'generation jobs:', main_n, 'main,', len(jobs) - main_n, 'last priority')


if __name__ == '__main__':
    main()


def figure_rec(fig):
    """(body, key, noun, priority) of a painted figure (a Cinder or realm palette; a Thornwood generic god maps to its Cinder)."""
    if fig in CREATURES:
        return CREATURES[fig]
    if fig in GODS:
        return GODS[fig]
    return GODS[fig.replace('-thornwood', '-cinderHorde')]
