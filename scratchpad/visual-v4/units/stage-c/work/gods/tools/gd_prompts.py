# Stage C gods: the prompt and job for every god body's idle cutout in both views (the Salamander's pilot route:
# Nano Banana 2.1, Image 1 the exact-camera maquette, Image 2 the god's own approved portrait). The body text is the
# picked portrait's own description (its sidecar prompt), with the portrait-only parts taken out and the battle's needs
# put in (daylight, the battle camera, the key colour, effects left to the game). No prompt names another game,
# franchise, artist or studio (checked below). Writes work/gods/prompts/<god>.<view>.txt and work/gods/jobs.json.
# Usage: python3 -I gd_prompts.py
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from picks import resolve, GODS, UNITS  # noqa: E402

W = os.path.abspath(os.path.join(HERE, '..'))
GUIDES = os.path.join(W, 'guides')
RAW = os.path.join(UNITS, 'stage-c', 'raw', 'gods')
KEYHEX = {'green': '#00FF00', 'magenta': '#FF00FF', 'blue': '#0000FF'}
CLOTH_WORDS = {'cinderHorde': "dull ember-orange (#C4532C), the Cinder Horde's colour",
               'thornwood': "deep bottle green, the green of jade in shade (#1F6A50), the Thornwood's colour"}
KIND = dict(titan='man', ascendedHero='man', oracle='man', pyreLord='man', emberHierophant='man', hornedHunter='man',
            motherOfBeasts='woman', ashColossus='man', greatWyrm='beast', elderWyrm='beast', primordial='beast',
            wildSpirit='beast', ashPhoenix='bird', worldTree='tree', livingMonolith='slab', cinderIdol='slab')
POSE = dict(
    greatWyrm='standing four-square at rest on its four clawed feet, its long neck raised high in an S-curve so that its head is the highest point, jaws closed, the wings half raised and folded at the elbows above and behind its shoulders, its long tail curving round beside its feet',
    titan='standing at rest with the feet apart, both gauntleted hands resting on the pommel of the great sword, whose point rests on the ground before its feet',
    oracle='floating upright at rest a hand above the ground, the ragged hem of the robe hanging free with no feet showing, the tall orb staff held upright in its right hand, the left hand low and open',
    livingMonolith='standing upright and perfectly still, rooted in its mound',
    ascendedHero='standing at rest, the straight sword held upright before the chest in the right hand, the left hand at the side, the long cape hanging from both shoulders',
    primordial='standing four-square and heavy at rest, its great head carried low and forward below the line of the shoulders, the club tail hanging behind the haunches',
    ashColossus='standing at rest with the feet apart, the bare arms hanging at the sides, the rock-like fists closed',
    ashPhoenix='standing upright on its talons with its broad wings raised high and spread wide like fans, the long tail trailing down behind it to the ground',
    pyreLord='standing at rest, the glaive held upright in the right hand with its butt on the ground, the left hand open at the side, palm out',
    cinderIdol='upright and perfectly still on its stepped plinth',
    emberHierophant='standing at rest, the orb staff upright in the right hand, the left palm raised before the chest',
    wildSpirit='standing with the right forefoot lifted, the long neck raised and the head up under the tall antlers',
    worldTree='standing still, the dome canopy spread wide over the trunk',
    hornedHunter='standing at rest, the leaf-bladed spear held upright in the right hand with its butt on the ground, the left arm at the side',
    elderWyrm="crawling low at rest like a giant lizard: its belly a hand's breadth above the ground, its short, powerful legs splayed out to the sides, its thick neck carried low and forward and its head held level and a little raised, jaws closed, the long heavy tail curving behind it",
    motherOfBeasts='standing at rest, the maul held at her right side with its head resting on the ground, the left hand at her side',
)
FACING = {
    ('man', 'back'): 'The figure faces away from us, toward the upper right of the image: we see its back, its right side and the top of its head from behind; its face is hidden.',
    ('man', 'front'): 'The figure faces toward us and toward the lower left of the image: we see its face from above, its chest and its left side.',
    ('beast', 'back'): 'The beast faces away from us, toward the upper right of the image: we see its back, its right flank and the top of its head from behind; its face is mostly hidden.',
    ('beast', 'front'): 'The beast faces toward us and toward the lower left of the image: we see its head and face from above, its chest and its left flank.',
    ('slab', 'back'): "The stone's back face is toward us: we see its back face, its right narrow side and its top from above and behind; its front is on the far side, out of sight.",
    ('slab', 'front'): "The stone's carved front face is toward us and toward the lower left: we see its front face, its left narrow side and its top from above.",
    ('tree', 'back'): 'A tree has no front: we look down on its dome canopy from high above at 40 degrees, the trunk and the roots below it.',
    ('tree', 'front'): 'A tree has no front: we look down on its dome canopy from high above at 40 degrees, the trunk and the roots below it.',
}
FACING[('woman', 'back')] = FACING[('man', 'back')]; FACING[('woman', 'front')] = FACING[('man', 'front')]
FACING[('bird', 'back')] = FACING[('beast', 'back')]; FACING[('bird', 'front')] = FACING[('beast', 'front')]
FORESHORTEN = {'man': 'the top of its head, its shoulders and its upper body are large, its legs short',
               'woman': 'the top of her head, her shoulders and her upper body are large, her legs short',
               'beast': 'its back and head are large, its legs short', 'bird': 'its head, back and raised wings are large, its legs short',
               'slab': 'its top shows and its height is shortened', 'tree': 'the top of the canopy is large and the trunk short'}
# what each body needs on the field that its portrait does not say (rules recorded in the report)
BATTLE_NOTES = dict(
    greatWyrm='No fire in the image: the game draws its breath.',
    livingMonolith='The same rows of carved glyphs run down both of its broad faces, the front and the back, so that the colour shows from either side.',
    cinderIdol='The same glyphs in ember pigment also run down its back face and round all four sides of the plinth, so that the colour shows from either side. The coals are low and dull; there is no smoke and no flame: the game draws them.',
    ashColossus='There is no smoke and no floating ember: the game draws them.',
    ashPhoenix='There is no flame, no glow and no trail of embers: the game draws them.',
    wildSpirit='Its outline is clean and solid, with no mist and no wisps: the game draws its flicker and its mist.',
    oracle='The orb is dark smoky glass and does not glow.',
    emberHierophant='The orb is dark smoky glass and does not glow.',
)
EXCISE = [  # portrait-only phrases, and effects the game draws
    (r'\s*seen three-quarter front so that its broad face and one narrow side show;', ''),
    (r'running down its broad face', 'running down both of its broad faces'),
    (r' like the maquette', ''),
    (r' that send up a thin, short wisp of grey smoke that fades out well below the top edge of the image; no tall flames\.', ', with no smoke and no flames.'),
    (r' with a thin wisp of grey smoke and no tall flames', ', with no smoke and no flames'),
    (r' A faint trail of dull ember specks drifts from the wing tips and the tail\.', ''),
    (r'; its outline is soft and a little misty, as if it is only half there', ''),
    (r' Wisps: thin pale wisps of mist trail from its legs and its tail\.', ''),
    (r', only a faint trail of dull ember specks[^.;]*', ''),
]


def portrait_parts(prompt):
    name = re.search(r'portrait of the (.*?)(?:, in a regal pose| in a regal pose)', prompt).group(1)
    col = re.search(r'Colors: (.*?)\n', prompt).group(1)
    sub = prompt[prompt.index('Subject:') + len('Subject:'):]
    sub = re.split(r'\n\s*Paint it as described|\n\s*Corrections from', sub)[0].strip()
    for a, b in EXCISE:
        sub = re.sub(a, b, sub); col = re.sub(a, b, col)
    return name, col.strip(), sub


def tier_h_need(g):
    """Painted px per world unit at 1K against tier H's 4 px/wu: the Gemini 1K frame for the guide's aspect, the body
    filling 86% of its limiting side as the maquette does."""
    px = {'1:1': (1024, 1024), '3:4': (896, 1200), '4:3': (1200, 896), '2:3': (832, 1248), '3:2': (1248, 832),
          '9:16': (768, 1344), '16:9': (1344, 768), '21:9': (1536, 672)}[g['aspect']]
    sx, sy = px[0] / g['size'][0], px[1] / g['size'][1]
    return min(sx, sy) / g['wuPerPx']


def build_prompt(g, view, R, G):
    nat = 'thornwood' if G['key'] == 'magenta' else 'cinderHorde'
    pick = R[g][nat]
    side = json.load(open(pick['sidecar']))
    name, col, sub = portrait_parts(side['prompt'])
    tint = side['tintZone']
    kind = KIND[g]
    key = G['key']; kh = KEYHEX[key]
    fill = 'grey' if key == 'blue' else 'blue-grey'
    no_key = {'green': 'No green anywhere on the figure: no green cloth, no green glow, no green reflections; any lichen grey-green trim stays a pale grey.',
              'blue': 'No blue anywhere on the figure: no blue cloth, no blue glow, no blue reflections; its shadows are cool grey, never blue.',
              'magenta': 'No pink, purple or magenta anywhere on the figure: no pink cloth, no pink glow, no pink reflections; its greens stay green.'}[key]
    who = {'man': 'figure', 'woman': 'figure', 'beast': 'beast', 'bird': 'bird', 'tree': 'tree', 'slab': 'stone'}[kind]
    head = {'tree': 'the top of the canopy', 'slab': 'the top of the stone'}.get(kind, 'the top of the head')
    lines = [
        f"Image 1 is the camera and pose guide: a grey clay maquette rendered from the game's battle camera, with {tint} painted in the god's colour. Copy from it exactly the camera angle, the direction the {who} faces, its pose, and its size and place in the frame. Do not copy its smooth clay surfaces, its simplified shapes or the thickness of its limbs: the anatomy, the face and every ornament follow Image 2 and the description.",
        f"Image 2 is this god's own approved painted portrait: paint the same {who}, with the same shapes, colours, materials and marks, now seen full length from above at the battle camera, in the same painting style. Do not copy its dark background, its candlelight or its framing.",
        '',
        f"One large painted {who}, full length, alone in the image on a perfectly flat, uniform pure {key} ({kh}) background, as a game cutout. Pose: {POSE[g]}.",
        '',
        f"Camera: high above and {'behind' if view == 'back' and kind not in ('tree',) else 'in front' if kind != 'tree' else 'to one side'}, looking down at about 40 degrees, the way a player looks down at a miniature on a table; orthographic, with no perspective. {FACING[(kind, view)]} It is foreshortened as seen from above: {FORESHORTEN[kind]}.",
        '',
        f"Light: outdoor daylight; the {who} stays as dark and as muted as in its portrait, lit only by small warm and cool highlights, never washed out or brightened. A high sun in the upper left of the image lights {head}, the upper surfaces and the upper-left side of the {who} with warm highlights; a cool {fill} sky fill lies in the shadows on the lower-right side. No candlelight, no dramatic dark shadows, nothing glows unless the description below says so. No cast shadow on the background.",
        '',
        f"Painting style: painterly oil on a wood panel, visible directional brushwork, moderate detail, the same hand as the painted portrait; a muted earthy palette with the god's own colours as its portrait shows them, in which {tint} in {CLOTH_WORDS[nat]} is the one clear hue; soft painterly edges, with small crisp highlights on metal edges and a thin bright rim of light along the upper-left edges of the {who}. The {who} has a strong, simple, readable silhouette that still reads when it is shrunk to 120 pixels tall. It is not a cartoon: no cel shading, no thick black outlines, no chibi or big-headed proportions, no glossy 3D render, no pixel art.",
        '',
        f"The god: the {name}. Colours: {col}",
        sub,
    ]
    if g in BATTLE_NOTES:
        lines.append(BATTLE_NOTES[g])
    lines += [
        '',
        f"Size: the {who} fills about 86% of the image along its longest side, placed as in Image 1, with at least 24 pixels of clean background all around; nothing is cropped.",
        '',
        f"Background: one flat pure {key} ({kh}) colour fills the whole image with no gradient, texture, floor, vignette or shadow. {no_key}",
        '',
        "Never: text, letters, numbers, labels, grid lines, borders, frames, signatures, logos; a floor, ground, scenery or cast shadows; blood; other creatures or people; a cropped figure; smoke, flames, sparks, floating embers or mist.",
    ]
    return '\n'.join(lines) + '\n', pick, side


BANNED = re.compile(r'\b(dominions|warhammer|age of wonders|total war|blizzard|games workshop|frazetta|rutkowski|magic: the gathering|dungeons|tolkien|elden|skyrim|diablo|warcraft|illyria)\b', re.I)


def main():
    R = resolve()
    Gs = json.load(open(os.path.join(GUIDES, 'guides-merged.json')))
    os.makedirs(os.path.join(W, 'prompts'), exist_ok=True)
    jobs = []
    for g in GODS:
        for view in ('back', 'front'):
            G = Gs.get(f'{g}.idle.{view}')
            if not G:
                print('no guide yet:', g, view); continue
            text, pick, side = build_prompt(g, view, R, G)
            assert not BANNED.search(text), (g, BANNED.search(text).group(0))
            pf = os.path.join(W, 'prompts', f'{g}.{view}.txt')
            open(pf, 'w').write(text)
            need = tier_h_need(G)
            size = '2K' if need < 4.5 else None
            jobs.append(dict(god=g, view=view, nation='thornwood' if G['key'] == 'magenta' else 'cinderHorde', key=G['key'],
                             model='gemini-nano-banana-2.1', aspect=G['aspect'], size=size, pxPerWu1K=round(need, 2),
                             prompt=os.path.relpath(pf, UNITS),
                             refs=[os.path.relpath(os.path.join(GUIDES, f'{g}.idle.{view}.png'), UNITS), os.path.relpath(pick['source'], UNITS)],
                             portrait=os.path.relpath(pick['game'], UNITS), portraitJob=pick['job'], pick=pick['pick'],
                             tintZone=side['tintZone'], marks=[m['mark'] for m in side.get('identityMarks', [])],
                             out=os.path.relpath(os.path.join(RAW, f"{g}.{view}.nb21{'.2k' if size else ''}.png"), UNITS)))
    json.dump(jobs, open(os.path.join(W, 'jobs.json'), 'w'), indent=1)
    for j in jobs:
        print(j['god'], j['view'], j['aspect'], j['size'], j['pxPerWu1K'])


if __name__ == '__main__':
    main()
