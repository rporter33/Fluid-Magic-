# Writes the generation prompts and the job manifest (art plan sections 1, 5 and 9) from ../units.json, the pose
# words in poses.py and the guides in ../refs/guides. Stage A writes the pilot's jobs; stage B reuses the builders.
# Usage: python3 make_prompts.py [--all]   (default: the pilot: calibration, core and second waves)
# Writes ../prompts/<job>.txt and ../prompts/manifest.json (each job: prompt, refs in order, model, aspect, out).
# Prompts never name another game, franchise, artist or studio.
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from poses import LAYOUTS, CELL_WORDS  # noqa: E402

ROOT = os.path.abspath(os.path.join(HERE, '..'))
UNITS = json.load(open(os.path.join(ROOT, 'units.json')))
GUIDES = json.load(open(os.path.join(ROOT, 'refs', 'guides', 'guides.json')))
OUT = os.path.join(ROOT, 'prompts')
GEN = 'gen/A'  # outputs, relative to units/
REPO = '/home/user/Fluid-Magic-'
ANCHOR = REPO + '/art-source/portraits/anchor-style.webp'
MODEL = 'gemini-nano-banana-2.1'  # the approved portraits' model; the calibration jobs may replace it
KEYWORDS = {'green': ('pure green (#00FF00)', 'no green anywhere on the figures: no green cloth, no green glow, no green reflections'),
            'magenta': ('pure magenta (#FF00FF)', 'no magenta, pink or purple anywhere on the figures'),
            'blue': ('pure blue (#0000FF)', 'no blue anywhere on the figures: no blue cloth, no blue light, no blue reflections')}

# ---------------------------------------------------------------- the style lock (art plan section 1)
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
CAMERA_CREATURE = {
    'back': ('Camera: high above and behind, looking down at about 40 degrees, the way a player looks down at a '
             'miniature on a table; orthographic, with no perspective. The creature faces away from us, toward the upper '
             'right of the image: we see its back, its right flank and the top of its head from behind; its face is '
             'mostly hidden. It is foreshortened as seen from above: its back and head are large, its legs short.'),
    'front': ('Camera: high above and in front, looking down at about 40 degrees, the way a player looks down at a '
              'miniature on a table; orthographic, with no perspective. The creature faces toward us and toward the '
              'lower left of the image: we see its head and face from above, its chest and its left flank. It is '
              'foreshortened as seen from above: its back and head are large, its legs short.'),
}
NEVER = ('Never: text, letters, numbers, labels, grid lines, borders, frames, signatures, logos; a floor, ground, '
         'scenery or cast shadows; blood; extra people; cropped or overlapping figures.')
ACT = {
    'rally': ('rallying: the weapon raised high, the head turned back over the shoulder, shouting an order',
              'commanding the advance: the weapon pointed straight toward the enemy, the free arm sweeping forward'),
    'cast': ('casting, the gathering: the staff raised in both hands above the head, body drawn up, head tipped back',
             'casting, the release: the staff thrust forward toward the enemy, the free hand thrown open after it'),
    'bless': ('blessing: the staff raised high, the free hand lifted palm up toward the sky',
              'blessing: the free hand held out flat over the troops, the staff planted beside the feet'),
}


def guide(fig, view, action=None):
    k = f'{fig}.{action}.{view}' if action else f'{fig}.{view}'
    return os.path.join(ROOT, 'refs', 'guides', k + '.png'), GUIDES[k]


def portrait(u):
    if u.get('portrait'):
        return u['portrait']
    return u['styleRefs'][0]


def cell_lines(u):
    cols, rows, _a, cells = LAYOUTS[u['layout']]
    over = u.get('cellOverrides') or {}
    lines = []
    for i, c in enumerate(cells):
        if c in ('actA', 'actB'):
            w = ACT[u.get('act', 'rally')][0 if c == 'actA' else 1]
        else:
            w = over.get(c) or CELL_WORDS[c]
        lines.append(f'{i + 1}. (row {i // cols + 1}, column {i % cols + 1}) {w}.')
    return cols, rows, lines


def sheet_prompt(u, view, refs_note):
    nat = UNITS['nations'][u['nation']]
    keyname, nokey = KEYWORDS[u['key']]
    cols, rows, lines = cell_lines(u)
    n = cols * rows
    who = 'soldier' if u['role'] == 'troop' else 'leader' if u['role'] == 'commander' else 'creature'
    parts = [refs_note, '',
             f'A game sprite sheet: {n} full-length painted figures of one {who}, one figure in each cell of a {cols} by '
             f'{rows} grid, on a perfectly flat, uniform {keyname} background. The same {who}, the same equipment, the '
             'same colours and the same scale in every cell; only the pose changes.', '',
             CAMERA[view], '', LIGHT, '', STYLE, '',
             f'The {who}: {u["kit"]}', '']
    if u['role'] == 'troop' and u.get('sideZones') and not u['sideZones'].startswith('none'):
        parts += [f'Side colour: {nat["cloth"]["name"]} ({nat["cloth"]["hex"]}) cloth on {u["sideZones"]}. These are '
                  'large, clean, unbroken areas that face the sky and the camera, so that a packed block of these '
                  'soldiers reads as that colour from far away: about a third of what the camera sees of each standing '
                  'figure is this cloth. The rest of the figure stays muted.', '']
    if u['role'] == 'commander':
        parts += ['Identity: this is the person of the portrait reference, seen full length: the same face, hair and '
                  'beard, the same headgear with its exact shape, the same mantle, armour and ornaments, as the '
                  'description above lists them. At this size the headgear, the mantle and the weapon carry his identity, '
                  'so paint them exactly.', '']
    parts += ['Proportions and scale: realistic adult proportions, the head with its helmet or hood about one sixth of '
              'the standing height; weapons at true size. Standing upright, a figure is about 62% of its cell\'s '
              'height; lying figures are as long as the standing ones are tall.', '',
              'The cells, left to right, row by row (the poses of the camera and pose guide):'] + lines + ['']
    if u.get('weaponMotion'):
        parts += [f'Weapon motion: {u["weaponMotion"]}.', '']
    parts += [f'Background and separation: one flat {keyname} colour fills the whole image with no gradient, texture, '
              f'floor, vignette or shadow; at least 24 pixels of clean background between any two figures and around '
              f'the edges. {nokey[0].upper() + nokey[1:]}.', '', NEVER]
    return '\n'.join(parts)


def refs_note_sheet(u, with_portrait=True):
    lines = ['Image 1 is the camera and pose guide: grey clay maquettes in exactly this grid, rendered from the game\'s '
             'battle camera' + ('; the coloured areas on them mark where the side\'s cloth goes' if u['role'] == 'troop' else '') +
             '. Copy from it exactly the camera angle, the direction every figure faces, the pose in each cell, the '
             'size of the figure in its cell and the grid. Do not copy its smooth grey clay surfaces, its simple '
             'shapes or its toy-like proportions.']
    if with_portrait:
        if u['role'] == 'commander':
            lines.append('Image 2 is this leader\'s own painted portrait: paint the same person, with the same headgear, '
                         'mantle, armour and colours, in the same painting style. Do not copy its dark background, its '
                         'candlelight or its head-and-shoulders framing.')
        else:
            lines.append('Image 2 is a painted portrait from the same game, a reference for the painting style and for '
                         'the nation\'s materials and colours only: do not paint that person, and do not copy its dark '
                         'background, its candlelight or its head-and-shoulders framing.')
        lines.append('Image 3 is a second painting-style reference from the same set; the same rules apply.')
    else:
        lines.append('Image 2 is a painting-style reference from the same game: copy its brushwork, palette and edges, '
                     'not its dark background, its candlelight, its framing or its subject.')
    return '\n'.join(lines)


def monster_prompt(u, view, action, g):
    keyname, nokey = KEYWORDS[u['key']]
    pose = {'idle': 'standing at rest on all four legs, the head raised on its neck and looking ahead, the mouth closed, '
                    'the tail curved behind it' if u['body'] == 'salamander' else 'standing at rest'}[action]
    return '\n'.join([
        'Image 1 is the camera and pose guide: a grey clay maquette rendered from the game\'s battle camera. Copy from '
        'it exactly the camera angle, the direction the creature faces, its pose and its size in the frame. Do not copy '
        'its smooth clay surfaces, its simplified shapes or the thickness of its limbs: the anatomy follows Image 2 and '
        'the description.',
        'Image 2 is this creature\'s own approved painted portrait: paint the same creature, with the same head, '
        'scales, colours, cracks, horns and marks, now seen full body from above, in the same painting style. Do not '
        'copy its dark background, its candlelight or its framing.', '',
        f'One large painted creature, full body, alone in the image on a perfectly flat, uniform {keyname} background, '
        f'as a game cutout. Pose: {pose}.', '',
        CAMERA_CREATURE[view], '',
        LIGHT.replace('the tops of helmets and hoods, the shoulders and the upper-left side of every figure',
                      'the top of the head, the back and the upper-left side of the creature'), '',
        STYLE.replace('Each figure has', 'The creature has').replace('every figure', 'the creature')
        .replace(", in which the side's cloth is the one clear hue", ', with the creature\'s own colours as the portrait shows them')
        .replace('the figure is shrunk to 40 pixels tall', 'the creature is shrunk to 120 pixels long'), '',
        f'The creature: {u["kit"]}', '',
        'Size: the creature fills about 85% of the image along its longest side, centred, with at least 24 pixels of '
        'clean background all around.', '',
        f'Background: one flat {keyname} colour fills the whole image with no gradient, texture, floor, vignette or '
        f'shadow. {(nokey[0].upper() + nokey[1:]).replace("on the figures", "on the creature")}.', '',
        NEVER.replace('extra people', 'other creatures or people').replace('cropped or overlapping figures', 'a cropped creature')])


def bust_prompt(u):
    nat = UNITS['nations'][u['nation']]
    house = nat['house']
    return '\n'.join([
        'Image 1 is a style reference only: match its painting style, brushwork, lighting, rim light, framing, '
        'background and proportions. The person, the face, the headgear and every ornament must be different from '
        'Image 1 and must follow the description below exactly; do not copy the man, the helm, the horns or the trim '
        'from Image 1.',
        'Image 2 is the painted figure sheet of this soldier: the helmet, the cloth, the armour, the shield and the '
        'weapon must be the ones in Image 2, seen close.', '',
        'Head-and-shoulders portrait bust of one soldier, three-quarter view, the face turned toward the right side of '
        'the image. Square image. Framing: the top of the head or headgear about 9% from the top edge, the eyes about '
        '39% from the top, the chin about 62% from the top, the image cut at mid-chest, with dark empty space above and '
        'around the head. One figure only. No hands, no weapons raised toward the face, no text, no border, no frame, '
        'no signature, no logo.',
        'Lighting: a single warm candle key light from the upper left, a dim warm fill, deep warm shadows, and a thin '
        'soft warm rim light along the back of the head or headgear, the hair and the shoulders that separates the '
        'whole silhouette clearly from the background. Background: plain, unpatterned, very dark warm brown close to '
        '#1C1A17, with no objects.',
        'Medium: painterly oil on a wood panel, visible brushwork, moderate detail, a strong readable silhouette: the '
        'shape of the headgear and the light face against the dark background must still read when the image is shrunk '
        'to 48 pixels.',
        f'Colors: muted and earthy, except the side\'s {nat["cloth"]["name"]} cloth ({nat["cloth"]["hex"]}), which shows '
        'clearly on the shoulders and the headgear as on the figure. Nothing in the image glows.', '',
        f'Subject: {house[0].upper() + house[1:]}.', u['kit'],
        'Person: a common soldier of the line, not a leader; an ordinary weathered face of the nation above.'])


def jobs(all_units=False):
    P = UNITS['pilot']
    out = []
    ids = P['core'] + P['second'] if not all_units else [u['id'] for u in UNITS['units'] if 'C (' not in u['stage']]
    wave = {i: 'core' for i in P['core']}; wave.update({i: 'second' for i in P['second']})
    byid = {u['id']: u for u in UNITS['units']}
    # calibration: the Cinder Warrior's back sheet with three models, then without the portrait reference
    u = byid['cinderWarrior']
    g, gm = guide('cinderWarrior', 'back')
    for i, c in enumerate(P['calibration']):
        with_p = 'no portrait' not in c['refs']
        refs = [g] + ([portrait(u), ANCHOR] if with_p else [ANCHOR])
        model = c['model'] if c['model'].startswith('g') or c['model'].startswith('n') else 'BEST'
        out.append(dict(job=f'cal{i + 1}.cinderWarrior.back', wave='calibration', figure='cinderWarrior', view='back',
                        model=model, aspect=gm['aspect'], refs=refs, out=f'{GEN}/cal/cal{i + 1}.cinderWarrior.back.png',
                        prompt=sheet_prompt(u, 'back', refs_note_sheet(u, with_p)), key=u['key']))
    for fid in ids:
        u = byid[fid]
        views = ['back'] if u.get('singleView') else ['back', 'front']
        for v in views:
            if u['role'] == 'monster':
                g, gm = guide(fid, v, 'idle')
                out.append(dict(job=f'{fid}.idle.{v}', wave=wave.get(fid, 'B'), figure=fid, view=v, action='idle', model=MODEL,
                                aspect=gm['aspect'], refs=[g, u['portrait']], out=f'{GEN}/{fid}.idle.{v}.png',
                                prompt=monster_prompt(u, v, 'idle', gm), key=u['key']))
                continue
            g, gm = guide(fid, v)
            refs = [g, portrait(u)] + ([ANCHOR] if u['role'] != 'commander' or True else [])
            out.append(dict(job=f'{fid}.{v}', wave=wave.get(fid, 'B'), figure=fid, view=v, model=MODEL, aspect=gm['aspect'],
                            refs=refs, out=f'{GEN}/{fid}.{v}.png', prompt=sheet_prompt(u, v, refs_note_sheet(u)), key=u['key']))
        if u['role'] == 'troop':
            out.append(dict(job=f'{fid}.bust', wave=wave.get(fid, 'B'), figure=fid, view='bust', model=MODEL, aspect='1:1',
                            refs=[ANCHOR, os.path.join(ROOT, f'{GEN}/{fid}.front.png')], out=f'{GEN}/{fid}.bust.png',
                            prompt=bust_prompt(u), key=None, after=f'{fid}.front approved'))
    return out


def main():
    os.makedirs(OUT, exist_ok=True)
    js = jobs('--all' in sys.argv)
    for j in js:
        with open(os.path.join(OUT, j['job'] + '.txt'), 'w') as f:
            f.write(j['prompt'] + '\n')
        j['promptFile'] = f'prompts/{j["job"]}.txt'
    man = [{k: v for k, v in j.items() if k != 'prompt'} for j in js]
    bad = [j['job'] for j in js for w in ('Total War', 'Warhammer', 'Dominions', 'Age of Wonders', 'Riot') if w.lower() in j['prompt'].lower()]
    assert not bad, bad
    json.dump(dict(stage='A', model=MODEL, budget=UNITS['pilot']['budget'], jobs=man), open(os.path.join(OUT, 'manifest.json'), 'w'), indent=1)
    by = {}
    for j in js:
        by[j['wave']] = by.get(j['wave'], 0) + 1
    print(len(js), 'jobs', by)


if __name__ == '__main__':
    main()
