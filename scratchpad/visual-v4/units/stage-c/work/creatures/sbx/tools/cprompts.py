# Stage C creatures: the prompts and jobs (work/creatures/prompts/*.txt, work/creatures/jobs/<wave>.json).
# Routes (stage B's lessons, stage-b/calibration.md and the evening reports):
#   redress  - Nano Banana 2.1, Image 1 an approved, camera-correct cutout or sheet, framed as a plain re-dress that
#              keeps each outline; Image 2 the face's approved portrait (Salamander 02-04, Treant 02-04, Giant 02);
#   guide    - Nano Banana 2.1, Image 1 the clay camera-and-pose guide, Image 2 the approved portrait (the pilot's
#              Salamander route) for a single big-body cutout (Treant 01, Giant 01);
#   paint    - Nano Banana 2.1 paint-over of the clay guide grid, Image 2 the approved portrait for identity only
#              (cmdB's passing back bodies; stage B fix2 B2's lesson: never a grid sheet as Image 2);
# Every prompt names each identity mark of its portrait. No prompt names another game, franchise, artist or studio
# (checked here). Usage: python3 cprompts.py
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SBX = os.path.abspath(os.path.join(HERE, '..'))
W = os.path.abspath(os.path.join(SBX, '..'))
UNITS = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units'
RAW = os.path.join(UNITS, 'stage-c', 'raw', 'creatures')
PR = os.path.join(W, 'prompts'); JB = os.path.join(W, 'jobs')
G = os.path.join(SBX, 'refs', 'guides')
PB = os.path.join(UNITS, 'stage-b', 'portraits')
REPO_P = '/home/user/Fluid-Magic-/art-source/portraits'
BANNED = ('dominions', 'warhammer', 'blizzard', 'warcraft', 'total war', 'age of wonders', 'paradox', 'games workshop',
          'artstation', 'magic: the gathering', 'diablo', 'elden', 'skyrim', 'tolkien', 'ents', 'groot', 'disney', 'pixar',
          'studio ghibli', 'frazetta', 'rembrandt', 'pokemon', 'dungeons', 'd&d')
KEYS = {'green': ('green', '#00FF00', 'No green anywhere on the creature: no green glow, no green reflections.'),
        'magenta': ('magenta', '#FF00FF', 'No pink, magenta, violet or purple anywhere on the creature.'),
        'blue': ('blue', '#0000FF', 'No blue, violet or purple anywhere on the creature.')}

LIGHT = ('Light: outdoor daylight. A high sun in the upper left of the image lights the top and the upper-left side of '
         'the {who} with warm highlights; a cool blue-grey sky fill lies in the shadows on the lower-right side. No '
         'candlelight, no dramatic dark shadows, nothing glows unless the description says so. No cast shadow on the '
         'background.')
STYLE = ('Painting style: painterly oil on a wood panel, visible directional brushwork, moderate detail, the same hand '
         'as the painted portrait reference; a muted earthy palette with the {who}\'s own colours exactly as its '
         'portrait shows them; soft painterly edges, small crisp highlights and a thin bright rim of light along the '
         'upper-left edges. A strong, simple, readable silhouette that still reads when shrunk to {px} pixels. It is not '
         'a cartoon: no cel shading, no thick black outlines, no chibi or big-headed proportions, no glossy 3D render, '
         'no pixel art.')
NEVER = ('Never: text, letters, numbers, labels, grid lines, borders, frames, signatures, logos; a floor, ground, '
         'scenery or cast shadows; blood; other creatures or people; a cropped {who}.')


def bg(key, sep=''):
    n, h, ban = KEYS[key]
    return (f'Background: one flat pure {n} ({h}) colour fills the whole image with no gradient, texture, floor, vignette '
            f'or shadow{sep}. {ban}')


def cam(view, who='creature'):
    if view == 'back':
        return (f'Camera: high above and behind, looking down at about 40 degrees, the way a player looks down at a '
                f'miniature on a table; orthographic, no perspective. The {who} faces away from us, toward the upper right '
                f'of the image: we see its back, its right side and the top of its head from behind. It is foreshortened '
                f'as seen from above: its back and head large, its legs short.')
    return (f'Camera: high above and in front, looking down at about 40 degrees, the way a player looks down at a '
            f'miniature on a table; orthographic, no perspective. The {who} faces toward us and to the lower left of the '
            f'image: we see its face from above, its chest and its left side. It is foreshortened as seen from above: '
            f'the top of its head and its shoulders large, its legs short.')


# ---------------------------------------------------------------- subjects
SAL_COMMON = ('a Salamander, the great fire lizard of the reference portrait, summoned by Cinder Horde mages (size 3): a '
              'heavy low-slung lizard about two and a half men long, on four short, thick, splayed legs with blunt claws, '
              'with a long thick tail; dull obsidian-black scales with dull ember-orange cracks between them (thin dull '
              'lines, never glowing, never bright orange); no flame on its body and no fire in the image.')
SAL = {
    '02': dict(head='an ancient salamander: a massive, heavy, square head with a deep underslung jaw and a hanging dewlap '
                    'of loose skin under the throat; its scales dulled, pitted and dusted grey with ash, with wide deep '
                    'cracks between them; heavy-lidded, half-closed, cloudy eyes',
               marks=['thick, blunt, worn horns along each side of the jaw, the largest one snapped off to a short stump',
                      'warty bony knobs on the brow', 'the hanging dewlap under the throat', 'scales dusted grey with ash'],
               back='the thick worn jaw horns with the snapped stump, the warty brow knobs and the grey ash dusting show at '
                    'the edges of the head and over the whole back',
               remove='the three round brow knobs, the pale scrape across the snout and the row of short stubby horn nubs of '
                      'Image 1'),
    '03': dict(head='a battle-scarred salamander in its prime: a long, narrow, crocodile-like snout instead of a broad flat '
                    'head; three deep parallel claw scars across the snout and one cheek, where the cracks show no colour; '
                    'a narrow slit-pupil eye with a fierce stare; the mouth slightly open, showing a few blunt teeth',
               marks=['the long narrow crocodile-like snout', 'three deep parallel claw scars across the snout and cheek',
                      'a row of hooked horns sweeping back along each side of the jaw, one of them chipped',
                      'a low ridge of scutes along the top of the head'],
               back='the long narrow snout, the hooked horns sweeping back along the jaw and the low ridge of scutes along '
                    'the top of the head show from behind and above',
               remove='the three round brow knobs, the pale scrape across the snout, the broad flat river-salamander head and '
                      'the short stubby horn nubs of Image 1'),
    '04': dict(head='a lean old salamander: a narrow, wedge-shaped, viper-like head; heavy black soot caked in the creases '
                    'of its scales; its cracks forming a branching pattern like dried lava; deep-set dark eyes under a '
                    'heavy brow ridge, a cold watchful sidelong look',
               marks=['two long curved horns sweeping back from the rear of the jaw like a ram\'s',
                      'a torn, ragged skin frill along the back of the neck',
                      'the narrow wedge-shaped viper-like head', 'cracks branching like dried lava, soot caked in the creases'],
               back='the two long curved ram-like horns, the torn ragged frill along the back of the neck and the branching '
                    'lava-like cracks over the back show clearly from behind and above',
               remove='the three round brow knobs, the pale scrape across the snout, the broad flat river-salamander head and '
                      'the short stubby horn nubs of Image 1'),
}
TREANT_COMMON = ('a Treant, the walking tree of the reference portrait, summoned by Thornwood druids (size 4, about three '
                 'and a half men tall): its trunk is its body and head, two long branch arms ending in knotted twig '
                 'fingers, two short stumpy legs that splay into roots; its face is in the bark near the top of the trunk.')
TREANT = {
    '01': dict(look='a treant only a century old: a thick knotted trunk of grey-green alder bark furred with moss; its face '
                    'is formed in the bark, not a human face: a broad brow ridge of bark, a low rounded bulge where a nose '
                    'would be, two small dark hollow knotholes for eyes, a mouth that is only a dark crooked split low in '
                    'the trunk; no beard',
               marks=['a low crown of short thick budding twigs with a few small pale-green leaves',
                      'curled young fern fronds growing from the moss on its shoulders', 'grey-green alder bark furred with moss',
                      'two small dark knothole eyes under a broad brow ridge of bark'],
               back='the low crown of short budding twigs, the moss and the curled fern fronds on its shoulders show from '
                    'behind and above', remove=''),
    '02': dict(look='an ancient willow treant, a tree first and a creature second: weathered pale grey willow bark in long, '
                    'deep vertical furrows with dark moss packed into the deepest of them; its face is only two deep black '
                    'knotholes set at slightly different heights and a long ragged dark split below them, a little open '
                    'like a hollow, with no brow, no nose, no lips and no jaw; a sorrowful, patient presence',
               marks=['a crown of long thin drooping willow fronds with narrow muted grey-green leaves that rise from the top '
                      'of the trunk and hang down behind it', 'pale grey willow bark in long deep vertical furrows',
                      'two deep black knotholes at slightly different heights', 'a long ragged dark split below them'],
               back='the long drooping willow fronds falling from the top of the trunk over its back and the pale furrowed '
                    'bark show from behind and above',
               remove='the alder\'s grey-green mossy bark, its brow ridge and nose bulge, its short budding twig crown and the '
                      'fern fronds of Image 1'),
    '03': dict(look='a scarred treant in its prime, part of a split oak trunk: long, angular, rough dark-brown oak bark; a '
                    'jutting burl for a nose, a wide mouth that is a deep horizontal crack in the bark, two dark knothole '
                    'eyes deep in the bark, one narrowed by a blackened lightning scar that runs from the crown down across '
                    'one cheek; a stern look; no beard, the jaw bare bark with a few short root tendrils',
               marks=['a crown of bare, twisted, thorny black branches', 'ivy wound around the trunk',
                      'a blackened lightning scar from the crown down across one cheek', 'rough dark-brown oak bark'],
               back='the crown of bare twisted thorny black branches, the ivy wound around the trunk and the dark oak bark '
                    'show from behind and above',
               remove='the alder\'s grey-green mossy bark, its budding twig crown with pale-green leaves and the fern fronds '
                      'of Image 1'),
    '04': dict(look='a slender old birch treant, a tree first and a creature second: chalky white-grey birch bark with '
                    'peeling papery curls, bold black horizontal lenticels and plentiful rough black patches; its face is only two '
                    'black almond-shaped knot scars and a long thin black horizontal scar below them, with no brow, no nose, '
                    'no lips and no jaw; a quiet, uncanny, watchful presence; dark moss only on the shoulders',
               marks=['just above the eye holes the trunk forks into two leaning stems like a split birch, each ending in thin '
                      'drooping dark twigs with a few small dull yellow-brown leaves', 'chalky white-grey birch bark with '
                      'thin black horizontal marks and peeling papery curls', 'two black almond-shaped knot-scar eyes',
                      'dark moss only on the shoulders'],
               back='the two leaning stems of the forked top with their drooping dark twigs and the white birch bark with its '
                    'black marks show from behind and above',
               remove='the alder\'s grey-green mossy bark, its brow ridge and nose bulge, its budding twig crown and the fern '
                      'fronds of Image 1'),
}
GIANT = {
    '01': dict(look='an old mountain giant, four men tall, a giant and not a man: coarse, heavy, massive features, a neck as '
                    'thick as the head; a huge broad brutish face with a heavy jutting brow, small deep-set pale eyes and a '
                    'heavy sullen scowl; weathered grey-tan skin rough as granite with pale lichen-grey patches; a bald head '
                    'with a few long grey wisps; a matted grey beard; a cloak of stitched goat and bear hides over the '
                    'shoulders and back, pulled up high around the neck; a rope of knotted hide across the chest; bare '
                    'heavy arms and legs wrapped in hide; a huge crude wooden club as long as a man, held in the right hand',
               marks=['the bald head with a few long grey wisps', 'small stones and bone beads knotted into the matted grey '
                      'beard', 'a necklace of huge animal teeth', 'the cloak of stitched goat and bear hides',
                      'the broken, flattened nose']),
    '02': dict(look='a younger mountain giant, four men tall, a giant and not a man: a long heavy brutish face with a massive '
                    'square jutting jaw, a heavy brow ridge and small deep-set eyes, a neck as thick as the head; weathered '
                    'tan skin; a rough mantle of grey sheep fleece over the shoulders; bare heavy arms; a huge crude wooden '
                    'club as long as a man, held in the right hand',
               marks=['a wild mane of matted dark brown hair and a short rough dark beard', 'one eye clouded white with a long '
                      'pale scar from the brow down across it', 'a thick crude iron chain worn as a necklace',
                      'a slab of dark slate tied with rope on one shoulder as a shoulder guard', 'the grey sheep-fleece mantle'],
               remove='the bald head with grey wisps, the grey beard with stones and beads, the necklace of teeth, the hide '
                      'cloak and the rope across the chest of Image 1'),
}


def write(name, text):
    low = text.lower()
    bad = [b for b in BANNED if re.search(r'(?<![a-z])' + re.escape(b) + r'(?![a-z])', low)]
    assert not bad, (name, bad)
    os.makedirs(PR, exist_ok=True)
    p = os.path.join(PR, name + '.txt'); open(p, 'w').write(text)
    return p


def job(name, purpose, refs, aspect, key, route, fig, view, model='gemini-nano-banana-2.1', kind='single', size=None, extra=None):
    j = dict(job=name, figure=fig, view=view, route=route, model=model, aspect=aspect, key=key, kind=kind,
             refs=refs, promptFile=os.path.join(PR, name + '.txt'),
             out=os.path.join(RAW, f"{name}.{'nb21' if 'banana' in model else 'g3pro'}{'.' + size.lower() if size else ''}.png"),
             purpose=purpose)
    if size:
        j['size'] = size
    if extra:
        j.update(extra)
    return j


def sal_redress(face, view, base, fix=None):
    s = SAL[face]
    side = 'behind' if view == 'back' else 'in front'
    t = [f'Image 1 is a finished painted game cutout of a salamander whose drawing is right: keep exactly its camera (high '
         f'above and {side}, looking down at about 40 degrees, orthographic), the direction it faces, its pose, its body\'s '
         f'outline, its size and position in the image, its light and the flat pure green background. This is a plain '
         f're-dress of the same body: repaint its head and its scales as the salamander of Image 2, and change the outline '
         f'only where Image 2\'s head and horns are a different shape.',
         'Image 2 is the approved painted portrait of the salamander to paint: the same head, horns, eyes, scales, colours, '
         'cracks and marks, now seen full body from above, in the same painting style. Do not copy its dark background, its '
         'candlelight or its head-and-shoulders framing.',
         f'One large painted creature, full body, alone on a perfectly flat, uniform pure green (#00FF00) background, as a '
         f'game cutout. Pose: exactly the pose of Image 1, standing at rest on all four legs, the head raised on its neck.',
         cam(view),
         'The creature: ' + SAL_COMMON + ' Its head: ' + s['head'] + '. Its marks, every one painted clearly: ' +
         '; '.join(s['marks']) + '. ' + (s['back'][0].upper() + s['back'][1:] + '.' if view == 'back' else
                                          'Seen from in front and above, the face and every mark read clearly.'),
         'Remove from Image 1 what belongs to the other salamander: ' + s['remove'] + '. None of them may remain.',
         LIGHT.format(who='creature') + ' The creature stays as dark as in its portrait, its scales lit only by small cool and '
         'warm highlights, never washed orange.',
         STYLE.format(who='creature', px=120),
         'Size: the creature fills the image as in Image 1, centred, with at least 24 pixels of clean background all around.',
         bg('green'), NEVER.format(who='creature')]
    if fix:
        t.insert(6, 'Corrections from the previous attempt, which must be fixed: ' + fix)
    name = f'sal{face}.{view}.redress' + ('.r2' if fix else '')
    write(name, '\n\n'.join(t))
    return job(name, f'Salamander {face} {view} idle: re-dress of the approved face 01 cutout with portrait {face} (nb21)' +
               (' [re-roll, failure named]' if fix else ''), [base, f'{REPO_P}/cinderHorde/salamander/{face}.webp'], '3:4',
               'green', 'redress', f'salamander-{face}', view)


def treant_from_guide(view, size=None, fix=None):
    s = TREANT['01']
    t = ['Image 1 is the camera and pose guide: a grey clay maquette rendered from the game\'s battle camera. Copy from it '
         'exactly the camera angle, the direction the creature faces, its pose and its size in the frame. Do not copy its '
         'smooth clay surfaces, its simplified shapes, its round knobs or the thickness of its limbs: the anatomy follows '
         'Image 2 and the description.',
         'Image 2 is this creature\'s own approved painted portrait: paint the same treant, with the same bark, moss, face, '
         'crown and marks, now seen full body from above, in the same painting style. Do not copy its dark background, its '
         'candlelight or its framing.',
         'One large painted creature, full body, alone in the image on a perfectly flat, uniform pure magenta (#FF00FF) '
         'background, as a game cutout. Pose: standing at rest on its two root-legs, its long branch arms hanging at its '
         'sides, its head (the top of the trunk) level and looking ahead.',
         cam(view, 'treant'),
         'The creature: ' + TREANT_COMMON + ' It is ' + s['look'] + '. Its marks, every one painted clearly: ' +
         '; '.join(s['marks']) + '. ' + (s['back'][0].upper() + s['back'][1:] + '; its face is hidden.' if view == 'back'
                                          else 'Seen from in front and above, its bark face, knothole eyes and crown read clearly.'),
         LIGHT.format(who='treant'), STYLE.format(who='treant', px=190),
         'Size: the creature fills about 86% of the image\'s height, centred, with at least 24 pixels of clean background '
         'all around.', bg('magenta'), NEVER.format(who='treant')]
    if fix:
        t.insert(5, 'Corrections from the previous attempt, which must be fixed: ' + fix)
    name = f'treant01.{view}.guide' + ('.r2' if fix else '')
    write(name, '\n\n'.join(t))
    return job(name, f'Treant 01 {view} idle from its clay guide with portrait 01 (nb21' + (', 2K output test' if size else '') + ')'
               + (' [re-roll, failure named]' if fix else ''),
               [os.path.join(G, f'treant-01.idle.{view}.png'), f'{REPO_P}/thornwood/treant/01.webp'], '3:4', 'magenta', 'guide',
               'treant-01', view, size=size)


def treant_redress(face, view, base, fix=None, tag=None, extra=None):
    s = TREANT[face]
    side = 'behind' if view == 'back' else 'in front'
    t = [f'Image 1 is a finished painted game cutout of a treant whose drawing is right: keep exactly its camera (high above '
         f'and {side}, looking down at about 40 degrees, orthographic), the direction it faces, its pose, its body\'s outline '
         f'(the trunk, the two branch arms and the two root-legs), its size and position in the image, its light and the '
         f'flat pure magenta background. This is a plain re-dress of the same body: repaint its bark, its face and its crown '
         f'as the treant of Image 2, and change the outline only where Image 2\'s crown or the top of its trunk is a '
         f'different shape.',
         'Image 2 is the approved painted portrait of the treant to paint: the same kind of tree, the same bark, face, crown, '
         'colours and marks, now seen full body from above, in the same painting style. Do not copy its dark background, its '
         'candlelight or its head-and-shoulders framing.',
         'One large painted creature, full body, alone on a perfectly flat, uniform pure magenta (#FF00FF) background, as a '
         'game cutout. Pose: exactly the pose of Image 1.',
         cam(view, 'treant'),
         'The creature: ' + TREANT_COMMON + ' It is ' + s['look'] + '. Its marks, every one painted clearly: ' +
         '; '.join(s['marks']) + '. ' + (s['back'][0].upper() + s['back'][1:] + '; its face is hidden.' if view == 'back'
                                          else 'Seen from in front and above, its face and crown read clearly.'),
         'Remove from Image 1 what belongs to the other treant: ' + s['remove'] + '. None of them may remain.',
         LIGHT.format(who='treant'), STYLE.format(who='treant', px=190),
         'Size: the creature fills the image as in Image 1, centred, with at least 24 pixels of clean background all around.',
         bg('magenta'), NEVER.format(who='treant')]
    if fix:
        t.insert(6, 'Corrections from the previous attempt, which must be fixed: ' + fix)
    if extra:
        t.insert(6, extra)
    name = f'treant{face}.{view}.redress' + (f'.{tag}' if tag else '') + ('.r2' if fix else '')
    write(name, '\n\n'.join(t))
    return job(name, f'Treant {face} {view} idle: re-dress of the Treant 01 cutout' + (' (no-rump base)' if tag else '') +
               f' with portrait {face} (nb21)' + (' [re-roll, failure named]' if fix else ''),
               [base, f'{REPO_P}/thornwood/treant/{face}.webp'], '3:4', 'magenta', 'redress', f'treant-{face}', view)


def giant_from_guide(view, fix=None):
    s = GIANT['01']
    t = ['Image 1 is the camera and pose guide: a grey clay maquette rendered from the game\'s battle camera. Copy from it '
         'exactly the camera angle, the direction the giant faces, its pose, where its club is and its size in the frame. '
         'Do not copy its smooth clay surfaces, its simplified round shapes or its bald clay head: the anatomy follows '
         'Image 2 and the description.',
         'Image 2 is this giant\'s own approved painted portrait: paint the same giant, with the same head, face, beard, '
         'skin, hides and marks, now seen full body from above, in the same painting style. Do not copy its dark background, '
         'its candlelight or its framing.',
         'One huge painted giant, full body, alone in the image on a perfectly flat, uniform pure magenta (#FF00FF) '
         'background, as a game cutout. Pose: standing at rest, heavy and a little stooped, feet apart, the huge club held '
         'low in the right hand, its head end near the ground, the left arm hanging.',
         cam(view, 'giant'),
         'The giant: ' + s['look'] + '. Its marks, every one painted clearly: ' + '; '.join(s['marks']) + '. ' +
         ('Seen from behind and above, the bald head with its grey wisps, the hide cloak over the back and shoulders and the '
          'club show clearly; the beard shows at the sides of the head.' if view == 'back' else
          'Seen from in front and above, the face, the beard with its stones and beads, the necklace of teeth and the hide '
          'cloak read clearly.'),
         'Proportions: a giant\'s body, massive and heavy, with long thick arms and huge hands; the head about one sixth of '
         'the standing height; not a dwarf, not a big-headed figure.',
         LIGHT.format(who='giant'), STYLE.format(who='giant', px=190),
         'Size: the giant fills about 86% of the image\'s height, centred, with at least 24 pixels of clean background all '
         'around.', bg('magenta'), NEVER.format(who='giant')]
    if fix:
        t.insert(6, 'Corrections from the previous attempt, which must be fixed: ' + fix)
    name = f'giant01.{view}.guide' + ('.r2' if fix else '')
    write(name, '\n\n'.join(t))
    return job(name, f'Giant 01 {view} idle from its clay guide with portrait 01 B (nb21)' + (' [re-roll, failure named]' if fix else ''),
               [os.path.join(G, f'giant-01.idle.{view}.png'), f'{PB}/independent/giant/01b-r2.webp'], '1:1', 'magenta', 'guide',
               'giant-01', view)


def giant_redress(view, base, fix=None):
    s = GIANT['02']
    side = 'behind' if view == 'back' else 'in front'
    t = [f'Image 1 is a finished painted game cutout of a giant whose drawing is right: keep exactly its camera (high above '
         f'and {side}, looking down at about 40 degrees, orthographic), the direction it faces, its pose, its body\'s outline, '
         f'its club, its size and position in the image, its light and the flat pure magenta background. This is a plain '
         f're-dress of the same body: repaint its head, hair, face, skin and clothing as the giant of Image 2, and change the '
         f'outline only where Image 2\'s mane, mantle or shoulder guard need it.',
         'Image 2 is the approved painted portrait of the giant to paint: the same head, face, hair, skin, kit and marks, now '
         'seen full body from above, in the same painting style. Do not copy its dark background, its candlelight or its '
         'framing.',
         'One huge painted giant, full body, alone on a perfectly flat, uniform pure magenta (#FF00FF) background, as a game '
         'cutout. Pose: exactly the pose of Image 1, with the same club in the same hand.',
         cam(view, 'giant'),
         'The giant: ' + s['look'] + '. Its marks, every one painted clearly: ' + '; '.join(s['marks']) + '. ' +
         ('Seen from behind and above, the wild dark mane, the fleece mantle, the slate shoulder guard and the chain where it '
          'crosses the shoulders show clearly.' if view == 'back' else
          'Seen from in front and above, the clouded scarred eye, the mane, the chain, the slate guard and the fleece read clearly.'),
         'Remove from Image 1 what belongs to the other giant: ' + s['remove'] + '. None of them may remain.',
         LIGHT.format(who='giant'), STYLE.format(who='giant', px=190),
         'Size: the giant fills the image as in Image 1, centred, with at least 24 pixels of clean background all around.',
         bg('magenta'), NEVER.format(who='giant')]
    if fix:
        t.insert(6, 'Corrections from the previous attempt, which must be fixed: ' + fix)
    name = f'giant02.{view}.redress' + ('.r2' if fix else '')
    write(name, '\n\n'.join(t))
    return job(name, f'Giant 02 {view} idle: re-dress of the Giant 01 cutout with portrait 02 B (nb21)' + (' [re-roll, failure named]' if fix else ''),
               [base, f'{PB}/independent/giant/02b-r2.webp'], '1:1', 'magenta', 'redress', 'giant-02', view)



# ---------------------------------------------------------------- grid sheets (paint-over of the clay guide)
from poses import LAYOUTS, CELL_WORDS  # noqa: E402

GRID = {
    'fireSprite': dict(
        who='fire sprite', nation='cinderHorde', key='blue', px=40, portrait=f'{PB}/cinderHorde/fireSprite/01b-r3.webp',
        what='one Fire Sprite', scale='A sprite is about two thirds of a man\'s height; each painted sprite covers its clay figure\'s outline and no more.',
        desc=('A Fire Sprite, a flicker of living flame summoned by Cinder Horde mages, with no will of its own: its head is '
              'the flame face of Image 2, a narrow head of fire whose flames sweep back from the brow like wind-blown hair, two '
              'short flame points rising like small horns above the brow, two narrow slanted dark eye-slits and a mouth that is '
              'only a ragged dark gap in the flame, open as if roaring, set in a brighter yellow core; below the head the fire '
              'tapers into a long flickering tail of flame, and two broad tongues of flame spread from behind the head like '
              'short wings (they rise and fall from cell to cell); no arms, no legs, no hands, no body other than the tapering '
              'tail of flame; the outer flames deep ember red going to smoky charcoal at their tips, a thin trail of grey '
              'smoke streaming back. A wild, roaring, mindless look; never cute, never a cartoon, no grin, no teeth.'),
        marks=['the swept-back flame hair', 'the two small horn-like flame points above the brow', 'the slanted dark eye-slits',
               'the ragged roaring mouth', 'no body or limbs: only the flame tail and the two flame wings'],
        back='seen from behind, the face is hidden: we see the back of the flame head with its swept-back flame hair and the '
             'two horn points, the flame wings and the tail.',
        front='seen from in front and above, the dark eye-slits and the ragged roaring mouth read clearly in the bright core.',
        light_extra=' The sprite is fire: its core is bright yellow and orange and it lights itself, but its outer flames and '
                    'smoky tips stay dark ember red and charcoal so its silhouette reads on a light ground.',
        words={'wingUp': 'hovering, the two flame wings swept fully up', 'wingMid': 'hovering, the flame wings level',
               'wingDown': 'hovering, the flame wings swept fully down', 'glide': 'gliding forward, the flame wings swept back',
               'dive': 'diving steeply at a target, head first, the tail streaming behind', 'strike': 'striking: the flame '
               'head lunging forward, the mouth wide, the wings flared', 'recoil': 'recoiling from a hit, the flames knocked '
               'back and torn', 'burstA': 'dying: the flame body breaking apart into large glowing embers and smoke',
               'burstB': 'dying: only a few small fading embers and a wisp of smoke left', 'mark': 'no creature: only a small '
               'blackened scorch mark on the ground', 'wingUp2': 'hovering, turned a little, the flame wings up',
               'wingDown2': 'hovering, turned a little, the flame wings down'}),
    'hornetSwarm': dict(
        who='hornet', nation='thornwood', key='magenta', px=20, portrait=f'{PB}/thornwood/hornetSwarm/01b.webp',
        what='one giant forest hornet of a Hornet Swarm', scale='Each painted hornet covers its clay figure\'s outline and no more.',
        desc=('One giant forest hornet of a Hornet Swarm summoned by Thornwood druids, as big as a sparrow: the lean dark hornet '
              'of Image 2, deep umber and charcoal with narrow dull ochre bands across its head, thorax and long tapering '
              'abdomen, huge dark compound eyes, jagged mandibles, long antennae swept back over the head, a thorax furred in '
              'dark umber, a long black sting, and two pairs of smoky wings with a torn edge, painted pale smoky grey and '
              'opaque, not see-through. The swarm is made in the game from many single hornets; each cell shows one hornet.'),
        marks=['the narrow dull ochre bands', 'the jagged mandibles', 'the long swept-back antennae', 'the torn wing edge'],
        back='', front='', light_extra='',
        words={'up0': 'flying, the wings raised high', 'down0': 'flying, the wings swept down', 'up90': 'flying, turned, the '
               'wings raised high', 'down90': 'flying, turned, the wings swept down', 'up180': 'flying, turned the other way, the '
               'wings raised high', 'down180': 'flying, turned the other way, the wings swept down', 'sting0': 'stinging: the '
               'abdomen curled forward under the body, the sting thrust out', 'sting90': 'stinging, turned: the abdomen curled '
               'forward, the sting thrust out', 'glide0': 'gliding, the wings held out flat', 'glide90': 'gliding, turned, the '
               'wings held out flat', 'deadA': 'lying dead on its back on the ground, legs curled, wings crumpled',
               'deadB': 'lying dead on its side, a different sprawl'}),
    'wolf': dict(
        who='wolf', nation='common', key='blue', px=36, portrait=f'{PB}/common/wolf/01b.webp',
        what='one wolf', scale='A standing wolf\'s back is about as high as a man\'s hip; each painted wolf covers its clay '
                           'figure\'s outline and no more.',
        desc=('A Wolf, an old, heavy grey wolf of the deep wood, wild, with no harness, collar, saddle or cloth: the wolf of '
              'Image 2, a big real timber wolf, long legs, a deep narrow chest, a long muzzle, pointed ears half back, a bushy '
              'tail; a dark smoky grey coat that is darker charcoal along the spine, the top of the neck and the tail, grizzled '
              'paler grey on the flanks and legs, going pale on the muzzle; amber eyes under a heavy brow; a hard look. The fur '
              'is grey and dark grey, never pink, violet or blue.'),
        marks=['the grizzled pale muzzle', 'a healed scar across the near eye', 'one long fang showing', 'a thick shaggy ruff'],
        back='seen from behind and above, the dark charcoal saddle of fur along the spine, the thick shaggy ruff and the bushy '
             'tail show; the head is small and far away, its face hidden.',
        front='seen from in front and above, the amber eyes, the scar across the near eye, the one fang and the pale grizzled '
              'muzzle read clearly.', light_extra=' The coat stays dark, as dark as the darkest grey in the portrait along the back.',
        words={'stand': 'the wolf standing square on all four paws, head up, ears half back', 'idle2': 'the wolf standing, its '
               'head turned to one side, one forepaw lifted', 'lopeA': 'the wolf loping, front paws reaching',
               'lopeB': 'the wolf loping, legs gathered under it', 'leapA': 'the wolf leaping, front paws off the ground, jaws open',
               'leapB': 'the wolf landing from a leap, front paws down, hind legs high', 'bite': 'the wolf biting: head lunged '
               'forward and low, jaws wide open', 'howl': 'the wolf howling: head thrown up, the muzzle to the sky',
               'recoil': 'the wolf hit: flinching back, rearing a little, head thrown up', 'fall': 'the wolf falling, legs '
               'buckling, rolling onto its side', 'deadA': 'the wolf lying dead on its side, legs out', 'deadB': 'the wolf lying '
               'dead, curled on its other side, a different sprawl'}),
    'oakheart': dict(
        who='Oakheart', nation='thornwood', key='magenta', px=60, portrait=f'{PB}/thornwood/oakheart/01b.webp',
        what='one Oakheart warrior', scale='An Oakheart is half again as tall as a man and twice as broad; each painted figure '
                                         'covers its clay figure\'s outline and no more.',
        desc=('An Oakheart, a walking oak under thornplate, a sacred warrior of the Thornwood: the warrior of Image 2, a broad, '
              'heavy, broad-shouldered warrior whose whole body is living grey oak wood, deeply furrowed, with moss in the '
              'furrows, armoured in grown thornplate of dark bark plates; not a tree with a face, but a warrior made of oak. Its '
              'head is a block of grey furrowed oak with a face only suggested in the grain: two deep dark knotholes for eyes, '
              'a long crack running down from the brow across the cheek, a jaw of bark knots. A high helm of dark grown bark '
              'plates crowned with a ring of long curved thorns and a fringe of lobed oak leaves around its rim; heavy thornplate '
              'pauldrons studded with thorns. It wields an Oak Maul in both hands or one: a long haft of dark oak ending in a huge '
              'head of knotted oak root bound with dark iron bands. No shield.'),
        marks=['the crown of long curved thorns on the helm', 'the fringe of lobed oak leaves around the helm\'s rim',
               'the crack down the face', 'the moss in the furrows of the grey oak', 'the bottle-green mantle'],
        side=('Side colour: a mantle of deep bottle-green cloth (#1F6A50) over both shoulders, under the pauldrons, wrapped '
              'across the chest in front and hanging down the back to the backs of the knees: large, clean, unbroken areas that '
              'face the sky and the camera, so that a block of Oakhearts reads as that colour from far away; about a third of '
              'what the camera sees of each standing figure is this cloth. The green is a deep bottle green, the green of jade '
              'in shade, clearly coloured, never grey, slate, olive or yellow-green, never blackish or teal-blue. The rest of '
              'the figure stays muted grey oak and dark bark.'),
        back='seen from behind and above, the ring of curved thorns on the helm, the leaf fringe, the green mantle down the back '
             'and the maul show clearly.',
        front='seen from in front and above, the knothole eyes, the crack down the face, the thorn crown and the green mantle '
              'across the chest read clearly.', light_extra='',
        words={'brace': 'braced: the maul held across the body in both hands, knees bent', 'windup': 'attack windup: the maul '
               'swung far back over the shoulder in both hands, body twisted and coiled', 'strike': 'the strike: the maul '
               'brought down in front in a great blow, lunging forward on the front foot', 'follow': 'follow-through: the maul '
               'swept past and low, body turned with the swing', 'fleeA': 'fleeing away from the enemy: lumbering hard, the maul '
               'dropped, looking back over the shoulder', 'fleeB': 'fleeing: the other foot forward, arms swinging, looking back',
               'cheer': 'victory: the maul raised high overhead in one hand, the other fist raised', 'dropped': 'no figure: only '
               'the oak maul lying flat on the ground, as dropped'}),
    'ashRider': dict(
        who='rider and horse', nation='cinderHorde', key='green', px=60, portrait=f'{PB}/cinderHorde/ashHorse/01b.webp',
        what='one Ash Rider on his Ash Horse', scale='A rider and his standing horse together are about 62% of the cell\'s '
                                                   'height; riderless and lying figures keep the same scale.',
        desc=('An Ash Rider of the Cinder Horde on his Ash Horse. The horse is the horse of Image 2: a heavy dark ash-grey '
              'warhorse, bred to carry, not to fight, with paler ash dappling on the neck and a greyer muzzle; a thick soot-black '
              'mane falling on the near side, a soot-black forelock and tail; a riveted plate of dark iron with rusted edges and '
              'a short blunt ridge down its middle over its face from the brow to the nose; a bridle of blackened leather with '
              'iron rings; a caparison of dull ember-orange cloth bordered with a charcoal band, covering its back and rump from '
              'the saddle to the tail and hanging low on both flanks. The rider: a lancer in blackened iron scale with a dull '
              'ember-orange shoulder cape, a rounded dark iron helm with a dull ember-orange horsehair crest, ash-grey skin, a '
              'long ash-wood lance with a dark iron head and a dull ember-orange pennon just below it, a sword at the hip (in the '
              'windup and strike cells the sword is in his hand and the lance is gone).'),
        marks=['the riveted iron face plate', 'the soot-black mane and forelock', 'the ember-orange caparison with its charcoal '
               'border', 'the iron bridle rings', 'the greyer muzzle', 'the dark ash-grey coat with paler dappling'],
        side=('Side colour: dull ember-orange (#C4532C) cloth on the horse\'s caparison over its back, rump and flanks, the '
              'rider\'s shoulder cape and helmet crest, and the lance pennon: large, clean, unbroken areas that face the sky and '
              'the camera, so that a wedge of these riders reads as that colour from far away. The rest stays muted iron, '
              'charcoal and ash grey.'),
        back='seen from behind and above, the caparison over the horse\'s back and rump, the soot-black tail, the rider\'s '
             'cape, crest and lance show; the faces are hidden.',
        front='seen from in front and above, the horse\'s riveted iron face plate, its soot-black mane and forelock, the bridle '
              'rings and the front of the caparison read clearly.', light_extra='',
        words={'stand': 'the horse standing square, the rider sitting upright, the lance held upright', 'walkA': 'walking: one '
               'diagonal pair of legs forward', 'walkB': 'walking: the other diagonal pair forward', 'gallopA': 'galloping, fully '
               'extended: front legs reaching forward, hind legs stretched back', 'gallopB': 'galloping, gathered: all four legs '
               'bunched under the body', 'charge': 'the charge: the horse at full gallop, the rider leaning forward behind the '
               'couched lance, aimed at the enemy', 'windup': 'the horse standing, the rider with the sword drawn far back, '
               'body twisted', 'strike': 'the horse walking, the rider slashing down with the sword', 'recoil': 'hit: the horse '
               'rearing back, the rider knocked back in the saddle, arms out', 'fall': 'the horse collapsing, the rider '
               'tumbling off its back', 'deadA': 'the horse lying dead on its side, the rider lying dead beside it',
               'deadB': 'the horse and the rider lying dead, a different sprawl', 'boltA': 'the horse alone without its rider, '
               'bolting at a gallop, extended', 'boltB': 'the horse alone without its rider, bolting at a gallop, gathered',
               'cheer': 'the horse standing, the rider raising the lance high overhead', 'dropped': 'no figures: only the lance '
               'lying flat on the ground, as dropped'}),
}


def grid_prompt(fig, view, fix=None, model='gemini-nano-banana-2.1'):
    s = GRID[fig]
    cols, rows, aspect, cells = LAYOUTS[LAYOUT_OF[fig]]
    n, h, ban = KEYS[s['key']]
    who = s['who']
    seen = 'seen from behind' if view == 'back' else 'seen from in front'
    single = fig == 'hornetSwarm'
    if single:
        seen = 'seen from above'
    t = [f'Image 1 is the grid of grey clay figures to paint over: keep every figure exactly where it is, at exactly its size, '
         f'pose, facing and camera, and paint each one as the {who} of Image 2 {seen}; no clay may remain. Keep the {cols} by '
         f'{rows} layout of Image 1, with no grid lines drawn, and its flat pure {n} ({h}) background.\n'
         f'Image 2 is the approved painted portrait of this {who}: use it only for its identity, its colours, its materials and '
         f'its marks, painted in the same hand. Do not copy its head-and-shoulders framing, its dark background, its '
         f'candlelight or its facing; every figure is the whole {who}, small in its cell, exactly as large as its clay figure.',
         f'A game sprite sheet: {len(cells)} full-length painted figures of {s["what"]}, {seen}, one figure in each cell of a '
         f'{cols} by {rows} grid, on a perfectly flat, uniform pure {n} ({h}) background. The same {who}, the same colours and '
         f'the same scale in every cell; only the pose changes.']
    if single:
        t.append('Camera: high above, looking down at about 40 degrees, the way a player looks down at a miniature on a table; '
                 'orthographic, no perspective, so every figure is the same size. Each hornet points exactly as its clay figure '
                 'points; we see its back, its wings from above and the top of its head.')
    elif view == 'back':
        t.append(f'Camera: high above and behind, looking down at about 40 degrees, the way a player looks down at miniatures on '
                 f'a table; orthographic, no perspective, so every figure is the same size. Every figure faces away from us, '
                 f'toward the upper right of the image, exactly as its clay figure does: we see its back, its right side and '
                 f'the top of its head; no face is seen. The figures are foreshortened as seen from above: the top of the head '
                 f'and the back large, the legs short; never at eye level, never seen from the side.')
    else:
        t.append(f'Camera: high above and in front, looking down at about 40 degrees, the way a player looks down at miniatures '
                 f'on a table; orthographic, no perspective, so every figure is the same size. Every figure faces toward us '
                 f'and to the lower left of the image, exactly as its clay figure does: we see its face from above, its chest '
                 f'and its left side. The figures are foreshortened as seen from above: the top of the head and the shoulders '
                 f'large, the legs short; never at eye level, never seen from the side.')
    t.append(LIGHT.format(who=who) + s['light_extra'])
    t.append(STYLE.format(who=who, px=s['px']))
    body = 'The ' + ('figures' if not single else 'hornet') + ': ' + s['desc'] + ' Its marks, every one painted clearly: ' + '; '.join(s['marks']) + '.'
    extra = s['back'] if view == 'back' else s['front']
    if extra:
        body += ' ' + extra[0].upper() + extra[1:]
    t.append(body)
    if s.get('side'):
        t.append(s['side'])
    if fix:
        t.append('Corrections from the previous attempt, which must be fixed: ' + fix)
    if not single:
        t.append('Facing, again: every figure in every cell faces the same way as its clay figure, '
                 + ('away from us toward the upper right, including the hit figure and the falling one; no face is seen anywhere '
                    'on this sheet.' if view == 'back' else 'toward us and to the lower left, including the hit figure and the '
                    'falling one.'))
    t.append('Scale: ' + s['scale'])
    lines = []
    for i, c in enumerate(cells):
        wtxt = s['words'].get(c) or CELL_WORDS.get(c, c)
        lines.append(f'{i + 1}. (row {i // cols + 1}, column {i % cols + 1}) {wtxt}.')
    t.append('The cells, left to right, row by row (the poses of the clay figures):\n' + '\n'.join(lines))
    t.append(bg(s['key'], '; at least 24 pixels of clean background between any two figures and around the edges'))
    t.append(NEVER.format(who=who).replace('other creatures or people', 'extra figures').replace(f'a cropped {who}', 'cropped or overlapping figures'))
    name = f'{fig}.{view}.paint' + ('.r2' if fix else '')
    write(name, '\n\n'.join(t))
    guide = os.path.join(G, f'{fig}.{view}.png')
    return job(name, f'{fig} {view} sheet: nb21 paint-over of its clay guide with its approved portrait' +
               (' [re-roll, failure named]' if fix else ''), [guide, s['portrait']], aspect, s['key'], 'paint', fig, view,
               model=model, kind='grid')


def wave2():
    return [treant_from_guide('back'), treant_from_guide('front'), giant_from_guide('back'), giant_from_guide('front'),
            grid_prompt('fireSprite', 'back'), grid_prompt('fireSprite', 'front'), grid_prompt('hornetSwarm', 'back'),
            grid_prompt('wolf', 'back'), grid_prompt('wolf', 'front'), grid_prompt('oakheart', 'back'),
            grid_prompt('oakheart', 'front'), grid_prompt('ashRider', 'back'), grid_prompt('ashRider', 'front')]


def wave2k():
    j = treant_from_guide('back', size='2K')
    j['job'] += '.2k'
    return [j]



GRID['wolfRider'] = dict(
    who='rider and wolf', nation='thornwood', key='blue', px=50, portrait=f'{PB}/thornwood/warWolf/01a.webp',
    what='one Wolf Rider on his War Wolf', scale='A rider and his standing wolf together are about 62% of the cell\'s height; '
                                              'riderless and lying figures keep the same scale.',
    desc=('A Wolf Rider of the Thornwood on his War Wolf. The rider: bark armour under a hooded cloak of deep bottle green, '
          'hood up, the cloak spread over his shoulders and back, a bottle-green tabard over his chest, and a spear with a '
          'leaf-shaped head that flies a long bottle-green pennon edged in pale bone-coloured cord. The War Wolf is the wolf of '
          'Image 2: a huge timber wolf, its shoulder as high as a man\'s chest, long legs, a deep narrow chest, a long muzzle, '
          'pointed ears, a bushy tail; a shaggy grey-brown coat that is darker along the brow, the top of the neck and the '
          'spine, a pale grey muzzle and throat and a thick ruff, amber eyes; a harness across its chest of overlapping plates '
          'of hard dark bark strapped with dark leather; a saddle blanket of deep bottle-green cloth edged with pale '
          'bone-coloured cord over its back under a small bark saddle. The fur is warm grey and brown, never pink, violet or '
          'blue.'),
    marks=['the bark-plate breast harness', 'the bottle-green saddle blanket edged with bone-coloured cord',
           'the grey-brown shaggy coat, dark along the neck and spine', 'the pale muzzle'],
    side=('Side colour: deep bottle-green (#1F6A50) cloth on the wolf\'s saddle blanket, the rider\'s hood, cloak and tabard, '
          'and the spear\'s pennon: large, clean, unbroken areas that face the sky and the camera. The green is a deep bottle '
          'green, the green of jade in shade, clearly coloured, never grey, slate, olive or yellow-green.'),
    back='seen from behind and above, the rider\'s hood and cloak, the saddle blanket with its cord edge, the wolf\'s dark '
         'spine and bushy tail show; no face is seen.',
    front='seen from in front and above, the wolf\'s bark-plate breast harness, its pale muzzle and amber eyes read clearly.',
    light_extra=' The wolf\'s coat stays as dark as the darker greys and browns of the portrait.',
    words={'stand': 'the wolf standing square on all four paws, head up and ears forward; the rider sitting upright, the spear '
           'held upright', 'lopeA': 'the wolf loping, front paws reaching', 'lopeB': 'the wolf loping, legs gathered',
           'leapA': 'the wolf leaping, front paws off the ground, the rider low', 'leapB': 'the wolf landing from a leap, front '
           'paws down, hind legs high', 'charge': 'the charge: the wolf at full stretch, the rider leaning forward behind the '
           'couched spear', 'windup': 'the rider rising in the saddle, the spear drawn far back over the shoulder; the wolf '
           'crouched', 'strike': 'the rider thrusting the spear down and forward past the wolf\'s head; the wolf lunging',
           'bite': 'the wolf biting: head lunged forward, jaws open, the rider holding on', 'recoil': 'hit: the rider knocked '
           'back in the saddle, arms thrown out; the wolf flinching', 'fall': 'the rider tumbling backward off the wolf\'s '
           'back; the wolf stumbling', 'deadA': 'the wolf lying dead on its side, the rider lying dead beside it',
           'deadB': 'the wolf and the rider lying dead, a different sprawl', 'boltA': 'the wolf alone without its rider, '
           'bolting at a run, extended', 'boltB': 'the wolf alone without its rider, bolting, gathered', 'cheer': 'the wolf '
           'with its head thrown up, howling; the rider raising the spear high overhead'})
LAYOUT_OF = {'fireSprite': 'sprite', 'hornetSwarm': 'hornet', 'wolf': 'beast', 'oakheart': 'melee', 'ashRider': 'cavalry',
             'wolfRider': 'wolfrider'}


def fill_prompt(fig, view, base, cells, fix=None, name=None, purpose=None):
    """A re-roll by re-dress: Image 1 the first sheet with its failing cells' figures replaced by the guide's clay figures."""
    s = GRID[fig]
    cols, rows, aspect, allcells = LAYOUTS[LAYOUT_OF[fig]]
    n, h, ban = KEYS[s['key']]
    who = s['who']
    single = fig == 'hornetSwarm'
    seen = 'seen from above' if single else ('seen from behind' if view == 'back' else 'seen from in front')
    pos = [f'row {allcells.index(c) // cols + 1}, column {allcells.index(c) % cols + 1}' for c in cells]
    t = [f'Image 1 is a sprite sheet of {s["what"]}, {seen}, in a {cols} by {rows} grid on a flat pure {n} ({h}) background. '
         f'{len(allcells) - len(cells)} of its figures are finished paintings whose camera, size and pose are right. The '
         f'figures in {len(cells)} cells ({"; ".join(pos)}) are grey clay figures. Keep every finished painted figure exactly '
         f'as it is: its place, size, pose, outline and camera. Paint each grey clay figure as the same {who}, keeping exactly '
         f'the clay figure\'s place, size, outline, pose, facing and camera, so that it matches the painted figures beside it '
         f'in colours, light, scale and hand; no clay may remain. Keep the flat pure {n} background, with no grid lines.',
         f'Image 2 is the approved painted portrait of this {who}: use it only for its identity, its colours, its materials and '
         f'its marks. Do not copy its head-and-shoulders framing, its dark background, its candlelight or its facing.']
    if single:
        t.append('Camera: high above, looking down at about 40 degrees; orthographic, no perspective. Each hornet points exactly '
                 'as its figure in Image 1 points.')
    elif view == 'back':
        t.append('Camera: high above and behind, looking down at about 40 degrees; orthographic, no perspective. Every figure '
                 'faces away from us toward the upper right, exactly as in Image 1: we see its back and the top of its head; '
                 'no face is seen; never at eye level, never seen from the side.')
    else:
        t.append('Camera: high above and in front, looking down at about 40 degrees; orthographic, no perspective. Every figure '
                 'faces toward us and to the lower left, exactly as in Image 1: we see its face from above, its chest and its '
                 'left side; never at eye level, never seen from the side.')
    t.append(LIGHT.format(who=who) + s['light_extra'])
    t.append(STYLE.format(who=who, px=s['px']))
    body = 'The ' + ('figures' if not single else 'hornet') + ': ' + s['desc'] + ' Its marks, every one painted clearly: ' + '; '.join(s['marks']) + '.'
    extra = s['back'] if view == 'back' else s['front']
    if extra:
        body += ' ' + extra[0].upper() + extra[1:]
    t.append(body)
    if s.get('side'):
        t.append(s['side'])
    if fix:
        t.append('Also, on every figure of the sheet, painted or clay, keeping its outline: ' + fix)
    lines = [f'{allcells.index(c) + 1}. (row {allcells.index(c) // cols + 1}, column {allcells.index(c) % cols + 1}) '
             f'{s["words"].get(c) or CELL_WORDS.get(c, c)}.' for c in cells]
    t.append('The clay cells to paint, and their poses:\n' + '\n'.join(lines))
    t.append(bg(s['key'], '; at least 24 pixels of clean background between any two figures and around the edges'))
    t.append(NEVER.format(who=who).replace('other creatures or people', 'extra figures').replace(f'a cropped {who}', 'cropped or overlapping figures'))
    name = name or f'{fig}.{view}.fill'
    write(name, '\n\n'.join(t))
    return job(name, purpose or (f'{fig} {view} sheet re-roll: nb21 re-dress of the first sheet with its {len(cells)} failing '
                                 f'cells laid in as clay (cells: {", ".join(cells)})'),
               [base, s['portrait']], aspect, s['key'], 'fill', fig, view, kind='grid', extra=dict(fillCells=cells))


def wr_front_edit(fix=None):
    t = ['Image 1 is a finished painted sprite sheet of a Wolf Rider on his wolf whose drawing is right: keep exactly every '
         'figure\'s place, size, pose, outline and camera, the rider exactly as he is, the light, and the background exactly '
         'as it is. Change only the wolf\'s tack and coat, on every wolf of the sheet, so that the wolf matches Image 2.',
         'Image 2 is the approved painted portrait of this War Wolf: use it only for its coat, its harness and its saddle '
         'blanket. Do not copy its framing, its dark background or its candlelight.',
         'The changes, on every wolf: (1) the cloth over its chest becomes a harness of overlapping plates of hard dark bark '
         'strapped with dark leather, as in Image 2; (2) the bottle-green saddle blanket over its back gets an edge of pale '
         'bone-coloured cord; (3) its coat becomes the warm grey-brown of Image 2, darker along the brow, the top of the neck '
         'and the spine, with a pale grey muzzle and throat; the coat as dark as the darker greys and browns of the portrait, '
         'never pink, violet or blue.',
         'Keep everything else exactly: the rider\'s bottle-green hood, cloak and tabard, his bark armour, the spear and its '
         'pennon, the poses, the sizes, the outlines, the camera (high above and in front, looking down at about 40 degrees) '
         'and the light from the upper left.',
         'Never: text, letters, numbers, labels, signatures, logos; a floor, ground, scenery or cast shadows; extra figures.']
    if fix:
        t.insert(4, 'Corrections from the previous attempt, which must be fixed: ' + fix)
    name = 'wolfRider.front.harness' + ('.r2' if fix else '')
    write(name, '\n\n'.join(t))
    return job(name, 'wolfRider front: nb21 plain edit of the owner-kept test sheet, the wolf\'s tack and coat matched to the '
               'War Wolf portrait A (bark-plate harness, bone-cord blanket edge, grey-brown coat)' + (' [re-roll, failure named]' if fix else ''),
               [os.path.join(UNITS, 'pilot', 'raw', 'ad', 'wr.front.blue.g3pro.png'), GRID['wolfRider']['portrait']], '4:3', 'blue',
               'edit', 'wolfRider', 'front', kind='grid')


def sprite_r2():
    fix = ('the previous attempt painted every sprite about one and a half times the size of its clay figure, with long '
           'trailing tails and wide spread wings the clay figure does not have, so its outline did not follow the clay; its '
           'smoke turned blue at the tips; and its flames were a brighter orange and yellow than the portrait. This time each '
           'sprite covers its clay figure\'s outline and no more: the flame tail no longer than the clay figure\'s tapered '
           'body, the two flame wings exactly where the clay figure\'s wings are and no wider; the colours are those of '
           'Image 2: deep ember red and dark orange flames with smoky charcoal tips and only a small bright yellow core around '
           'the face, the sprite overall as dark as the portrait; the smoke charcoal grey, never blue or violet.')
    return [grid_prompt('fireSprite', 'back', fix=fix), grid_prompt('fireSprite', 'front', fix=fix)]


def treant_r2():
    fix = ('the previous attempt painted the treant much wider than its clay figure, its branch arms spread out and its '
           'root-legs splayed wide (its outline one and a half times as wide). This time its outline follows the clay '
           'figure\'s: a tall, narrow trunk, the two long branch arms hanging close beside the trunk down to the knees as the '
           'clay arms do, the root-legs close together under the trunk; never wider than the clay figure.')
    return [treant_from_guide('front', fix=fix)]



def wave3():
    from PIL import Image
    import cfill
    SH = os.path.join(W, 'sheets'); BASES = os.path.join(W, 'bases'); os.makedirs(BASES, exist_ok=True)
    rep = {}
    jobs = []
    fills = [('wolf', 'front', None), ('oakheart', 'back', None),
             ('oakheart', 'front', 'make the bottle-green mantle larger, wrapped broadly across the whole chest and both '
              'shoulders and hanging to the knees in front, so that green cloth covers about a third of each standing figure.'),
             ('ashRider', 'back', 'make the dull ember-orange caparison larger: it covers the horse\'s whole back, rump and flanks '
              'down to the knees, and the rider\'s ember-orange cape is broad over both shoulders.'),
             ('ashRider', 'front', 'make the dull ember-orange caparison larger: it reaches forward over the withers and the base '
              'of the neck and hangs down over both shoulders and the chest to the knees, and the rider\'s ember-orange cape and '
              'crest show broadly.'),
             ('hornetSwarm', 'back', 'make every hornet\'s wings opaque: painted solid pale smoky grey-brown, with no background '
              'colour showing through them anywhere.')]
    for fig, view, fix in fills:
        d = os.path.join(SH, f'{fig}.{view}.paint')
        cells = json.load(open(os.path.join(d, 'checks.json')))['cameraGate']['failing']
        base = os.path.join(BASES, f'{fig}.{view}.fill.base.png')
        rep[f'{fig}.{view}'] = cfill.build(d, fig, view, os.path.join(G, f'{fig}.{view}.png'), cells, base)
        jobs.append(fill_prompt(fig, view, base, cells, fix))
    # the Wolf Rider back: a re-dress of the stage B fix2 back sheet (r32, reported: camera 7/16) with its failing cells as clay
    r32 = os.path.join(UNITS, 'stage-b', 'work', 'troops2', 'sheets', 't2r32.wolfRider.back.blue')
    ck = json.load(open(os.path.join(r32, 'checks.json')))['cameraAll']['cells']
    cells = [c for c in LAYOUTS['wolfrider'][3] if c in ck and not (ck[c][0] >= 0.55 and ck[c][1] >= 0)]
    base = os.path.join(BASES, 'wolfRider.back.fill.base.png')
    rep['wolfRider.back'] = cfill.build(r32, 'wolfRider', 'back', os.path.join(UNITS, 'stage-b', 'work', 'troops2', 'guides',
                                                                                 'wolfRider.back.blue.png'), cells, base)
    jobs.append(fill_prompt('wolfRider', 'back', base, cells,
                            'the wolf\'s chest harness is overlapping plates of hard dark bark strapped with dark leather; the '
                            'bottle-green saddle blanket is edged with pale bone-coloured cord; the wolf\'s coat is the warm '
                            'grey-brown of Image 2, darker along the neck and the spine, as dark as the darker greys and '
                            'browns of the portrait.',
                            purpose=f'wolfRider back: nb21 re-dress of the stage B fix2 back sheet (t2r32, camera 7/16) with its '
                                    f'{len(cells)} failing cells laid in as clay, the wolf matched to the War Wolf portrait A'))
    jobs.append(wr_front_edit())
    jobs += sprite_r2() + treant_r2()
    # re-dresses from the passing first cutouts: Giant 02 from Giant 01 (both views), Treant 02-04 backs from Treant 01 back
    # (the 2K roll, which passed; laid down to 1K as Image 1)
    R = os.path.join(UNITS, 'stage-c', 'raw', 'creatures')
    for v in ('back', 'front'):
        jobs.append(giant_redress(v, os.path.join(R, f'giant01.{v}.guide.nb21.png')))
    t2k = os.path.join(BASES, 'treant01.back.base1k.png')
    Image.open(os.path.join(R, 'treant01.back.guide.nb21.2k.png')).convert('RGB').resize((896, 1200), Image.LANCZOS).save(t2k)
    for f in ('02', '03', '04'):
        jobs.append(treant_redress(f, 'back', t2k))
    json.dump(rep, open(os.path.join(BASES, 'fill-report.json'), 'w'), indent=1)
    return jobs



def wave4():
    R = os.path.join(UNITS, 'stage-c', 'raw', 'creatures')
    BASES = os.path.join(W, 'bases')
    jobs = [treant_redress(f, 'front', os.path.join(R, 'treant01.front.guide.r2.nb21.png')) for f in ('02', '03', '04')]
    t2k = os.path.join(BASES, 'treant01.back.base1k.png')
    jobs.append(treant_redress('02', 'back', t2k, fix=(
        'the previous attempt painted the willow much wider than Image 1, its fronds and branch arms spread out to the sides '
        '(its outline about one and a half times as wide), and left magenta showing between the fronds. This time the outline '
        'stays Image 1\'s: the long willow fronds hang close down the back of the trunk inside the width of the body, never '
        'spread out to the sides; the fronds are painted as solid strands with no background showing between them.')))
    jobs.append(treant_redress('04', 'back', t2k, fix=(
        'the previous attempt was too light against the ground at a distance. Keep the birch white-grey bark, but its black '
        'horizontal lenticels and rough black patches are bold and plentiful, its shadow side on the lower right a cool mid '
        'grey, and dark moss covers the shoulders and the root-legs, so the figure as a whole reads darker than a pale ground '
        'while the bark stays clearly white birch.')))
    wr = grid_prompt('wolfRider', 'back', fix=(
        'earlier attempts painted the wolves turned sideways at eye level instead of following the clay figures. This time '
        'every wolf points exactly where its clay wolf points, steeply up and to the right, its back, haunches and tail toward '
        'us and its head small and far away; the rider sits over the wolf\'s shoulders seen from behind, his hood and cloak '
        'toward us; each painted figure covers its clay figure\'s outline and no more.'))
    wr['refs'][0] = os.path.join(UNITS, 'stage-b', 'work', 'troops2', 'guides', 'wolfRider.back.blue.png')
    wr['purpose'] = 'wolfRider back re-roll: a fresh nb21 paint-over of the blue clay guide with the War Wolf portrait A (failure named)'
    jobs.append(wr)
    jobs.append(wr_front_edit(fix=(
        'the previous edit moved outlines: the rider\'s spear in the strike cell (row 2, column 4) and the landing wolf (row 2, '
        'column 1) changed. Keep every outline exactly as in Image 1, cell by cell; change only the colours and textures of '
        'the wolf\'s chest, blanket edge and coat.')))
    return jobs



def wave5():
    R = os.path.join(UNITS, 'stage-c', 'raw', 'creatures')
    return [treant_redress('02', 'front', os.path.join(R, 'treant01.front.guide.r2.nb21.png'), fix=(
        'the background magenta showed through the thin willow fronds and tinted them pink. This time the willow fronds hang '
        'as a few dense, solid locks of narrow grey-green leaves, painted opaque with no background visible between the '
        'strands, close beside the trunk; no pink, violet or magenta anywhere on the treant.'))]



NORUMP = ('Body shape, seen from behind: the trunk runs straight down, as thick as a tree trunk, from the shoulders into the '
          'two root-legs, with no rounded rump, no buttocks and no swelling hips: the lower back is flat furrowed bark that '
          'divides at the knees into the root-legs, the way an old tree divides into roots; never a human backside.')


def treant_back_norump(fix=None):
    """A plain edit of the passing Treant 01 back (the 2K roll laid to 1K): only its lower trunk changes."""
    t = ['Image 1 is a finished painted game cutout of a treant whose drawing is right: keep exactly its camera (high above '
         'and behind, looking down at about 40 degrees, orthographic), the direction it faces, its pose, its crown, its arms, '
         'its root-legs and feet, its size and position in the image, its bark, moss, ferns and colours, its light and the '
         'flat pure magenta background. Change only one thing: the shape of its lower back.',
         'Image 2 is this treant\'s own approved painted portrait: the same grey-green alder bark furred with moss, the low '
         'crown of short budding twigs and the curled fern fronds on its shoulders. Do not copy its dark background, its '
         'candlelight or its framing.',
         'The change: in Image 1 the lower back swells into a rounded rump like a human backside. Repaint that part so that '
         + NORUMP[len('Body shape, seen from behind: '):].replace('the trunk runs', 'the trunk runs') + ' The outline there '
         'becomes straighter and a little narrower; everything else keeps its outline exactly.',
         cam('back', 'treant'),
         LIGHT.format(who='treant'), STYLE.format(who='treant', px=190),
         bg('magenta'), NEVER.format(who='treant')]
    if fix:
        t.insert(3, 'Corrections from the previous attempt, which must be fixed: ' + fix)
    name = 'treant01.back.norump' + ('.r2' if fix else '')
    write(name, '\n\n'.join(t))
    return job(name, 'Treant 01 back idle: nb21 plain edit of the passing 2K back, the rounded rump replaced by a straight '
               'trunk into the root-legs (AD finding)' + (' [re-roll, failure named]' if fix else ''),
               [os.path.join(W, 'bases', 'treant01.back.base1k.png'), f'{REPO_P}/thornwood/treant/01.webp'], '3:4', 'magenta',
               'edit', 'treant-01', 'back')


def wave6a():
    return [treant_back_norump()]


def wave6b():
    base = os.path.join(W, 'bases', 'treant01.back.norump.base1k.png')
    extra02 = ('Keep the willow fronds close: they hang down the back of the trunk inside the width of the body, never spread '
               'out to the sides, painted as dense, solid locks with no background visible between the strands.')
    return [treant_redress('02', 'back', base, tag='v2', extra=NORUMP + ' ' + extra02),
            treant_redress('03', 'back', base, tag='v2', extra=NORUMP),
            treant_redress('04', 'back', base, tag='v2', extra=NORUMP + ' The black horizontal lenticels and rough black '
                           'patches are bold and plentiful, the shadow side a cool mid grey, dark moss on the shoulders and the '
                           'root-legs, so the birch reads darker than a pale ground while the bark stays clearly white birch.')]



def wave6c():
    base = os.path.join(W, 'bases', 'treant01.back.norump.base1k.png')
    return [treant_redress('02', 'back', base, tag='v2', extra=NORUMP, fix=(
        'the willow fronds were spread out far to the left of the trunk, making the figure wider than Image 1 (its outline '
        '1.38 times as wide), and the magenta background showed through them. This time the outline is Image 1\'s, no wider: '
        'the fronds hang straight down over the back and shoulders, inside the width of the trunk and arms, and none reach out '
        'past the arms; they are painted as a few dense, solid, opaque locks of narrow grey-green leaves, with no background '
        'visible between the strands and no pink, violet or magenta anywhere.'))]


PILOT = os.path.join(UNITS, 'pilot', 'raw')
SAL_BASE = {'back': os.path.join(PILOT, 'r2', 'sal.back.nb21.png'), 'front': os.path.join(PILOT, 'ad', 'sal.front.mark.nb21.png')}


def wave1():
    return [sal_redress(f, v, SAL_BASE[v]) for f in ('02', '03', '04') for v in ('back', 'front')]


def main(argv):
    os.makedirs(JB, exist_ok=True)
    waves = {'w1': wave1, 'w2': wave2, 'w2k': wave2k, 'w3': wave3, 'w4': wave4, 'w5': wave5, 'w6a': wave6a, 'w6b': wave6b, 'w6c': wave6c}
    for w in (argv or waves):
        jobs = waves[w]()
        json.dump(jobs, open(os.path.join(JB, f'{w}.json'), 'w'), indent=1)
        print(w, len(jobs), [j['job'] for j in jobs])


if __name__ == '__main__':
    main(sys.argv[1:])
