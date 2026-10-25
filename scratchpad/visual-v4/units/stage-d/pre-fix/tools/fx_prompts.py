# Writes the prompts and jobs for the nine pilot effect sheets (art plan 7.2 and 7.5): stage-d/work/prompts/<sheet>.txt
# and stage-d/work/jobs.json (two candidates per sheet: a = gemini-nano-banana-2.1, the portraits' model; b =
# gemini-3-pro-image), with the layout guide as Image 1 and the style references after it.
# Prompts never name another game, franchise, artist or studio (checked below).
# Usage: python3 -I fx_prompts.py
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fx_layouts import SHEETS  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
WORK = os.path.abspath(os.path.join(HERE, '..'))
UNITS = os.path.abspath(os.path.join(WORK, '..', '..'))
REPO = '/home/user/Fluid-Magic-'
REF = {
    'anchor': REPO + '/art-source/portraits/anchor-style.webp',
    'fireSprite': UNITS + '/stage-b/portraits/cinderHorde/fireSprite/01b-r3.webp',
    'treant': REPO + '/art-source/portraits/thornwood/treant/01.webp',
    'worldTree': UNITS + '/stage-b/portraits/thornwood/worldTree/01b-r2-512.webp',
    'groundA': WORK + '/refs/ground-a.png',
    'groundC': WORK + '/refs/ground-c.png',
}
REF_WORDS = {
    'anchor': 'a painted portrait from the same game, the approved style anchor',
    'fireSprite': 'the approved painted portrait of the game\'s Fire Sprite, a creature of living flame: it shows how fire, embers and smoke are painted in this game',
    'treant': 'the approved painted portrait of the game\'s Treant: it shows how bark, moss, roots and leaves are painted in this game',
    'worldTree': 'an approved painted portrait from the same game, a great tree: it shows how roots, bark and leaves are painted in this game',
    'groundA': 'a piece of the painted battle ground these marks will lie on (grassland), for its scale and texture only',
    'groundC': 'a piece of the painted battle ground these marks will lie on (swamp meadow), for its scale and texture only',
}
REFS = {'E2': ['fireSprite', 'anchor'], 'E3': ['fireSprite', 'anchor'], 'E4': ['fireSprite', 'anchor'], 'E5': ['fireSprite', 'anchor'],
        'E6': ['anchor', 'fireSprite'], 'L1': ['treant', 'worldTree'], 'L2': ['treant', 'worldTree'], 'L3': ['worldTree', 'anchor'],
        'L4': ['treant', 'worldTree']}
BGW = {'black': 'perfectly flat pure black (#000000)', 'white': 'perfectly flat pure white (#FFFFFF)', 'magenta': 'perfectly flat pure magenta (#FF00FF)'}
EMBER = ('Ember\'s colours: a pale golden-white to golden-yellow core (#FFE9A8 to #FFB347), an orange body (#FD6533) and '
         'deep red edges (#7A1E12) that fade into the black; dark charcoal smoke where the fire thins.')
LOAM = ('Loam\'s colours: living bark-brown roots, deep moss and forest greens (#244F22 to #00674B) with a few small '
        'yellow-green highlights (#A6D96A) on leaves and shoots.')
STYLE = ('Painting style: painterly oil on a wood panel, visible directional brushwork, moderate detail, the same hand as '
         'the painted portrait references; soft painterly edges with a few crisp strokes. Each element has a strong, '
         'simple, readable shape that still reads when it is shrunk to 20 pixels. It is not a cartoon: no cel shading, '
         'no thick black outlines, no glossy 3D render, no vector shapes, no airbrushed gradients, no pixel art, no '
         'photograph.')
CAM = ('Camera: the game\'s battle camera, high above the field and looking down at about 40 degrees, the way a player '
       'looks down at miniatures on a table; orthographic, no perspective. Anything lying on the ground is foreshortened: '
       'a round shape on the ground appears as a flat ellipse about two thirds as tall as it is wide.')
LIGHT_ADD = ('These sprites are light: in the game they are added onto the battle field, so anything that is not black '
             'glows and pure black disappears. Paint them as glowing fire on the black, never on a coloured or grey '
             'background; no ground, no figures, no scenery, no cast shadows.')
LIGHT_MATTER = ('Light: outdoor daylight from a high sun in the upper left of the image: warm highlights on the upper-left '
                'sides of every root, thorn and leaf, a cool blue-grey fill in the shadows on the lower right; nothing '
                'glows; no cast shadow on the background.')
DECAL = ('These are flat marks on the ground (decals) that the game multiplies onto the battle field: pure white means '
         'untouched ground and every darker tone darkens the ground under it. Paint only the marks, as stains seen from '
         'above, with no light and shade of their own, no highlights brighter than the white, no cast shadows, no '
         'objects standing up.')

BODY = {
    'E2': ['A game effects sheet for a fireball spell: six separate painted sprites on black.', '',
           'Top row, left to right, three fireballs, small, medium and large, each exactly the size of its grey ball: a '
           'churning ball of living flame, round overall, with a pale golden-white core, an orange body of swirling '
           'flame tongues and ragged deep-red edges, a few small flame licks trailing up and to the left; painted with '
           'rough flame-shaped brush strokes. The three are the same fireball at three sizes.',
           'Top right: a soft round glow of warm golden light, the size of its grey placeholder, brightest in the middle '
           'and fading evenly to black at its edge; no flames, no rays, no rings: a painted soft light.',
           'Middle band: the fireball\'s trail alone, without a fireball: one long horizontal streak of flame and small '
           'sparks, widest and brightest at its right end, where the fireball would be, thinning to a faint smoky '
           'deep-red wisp at its left end; ragged painterly edges; it fills its grey band from end to end.',
           'Bottom: a falling meteor: a dark rock of charcoal with glowing orange cracks at the lower right, inside a '
           'shell of fire, with a long tail of flame and smoke streaming up to the upper left behind it along the grey '
           'placeholder.'],
    'E3': ['A game effects sheet: six frames of one fireball exploding on the ground, painted on black, one frame in '
           'each cell of a 3 by 2 grid, read left to right, top row then bottom row. Each frame is centred where its '
           'grey placeholder is and is as large as it; the ground ellipse at the bottom of each placeholder is where '
           'the fire meets the ground.', '',
           'Every frame is seen from the battle camera high above: the explosion is a low, wide dome of fire sitting on '
           'the ground, its base a flat ellipse, its height less than its width. Never a tall mushroom cloud, never a '
           'column of fire, never seen from the side or at eye level.',
           '1: ignition: a small brilliant core of golden-white fire just touching the ground, a few sparks flying.',
           '2: the burst: a low dome of orange fire bulging outward over the ground, its core blazing.',
           '3: the full burst, the widest and brightest frame: a low dome of churning flame tongues over the whole '
           'ground ellipse, flames curling outward along the ground at its rim, sparks thrown out.',
           '4: breaking: the dome tears open at its top, flames curl outward and down, orange and deep red, the core '
           'dimmer, the first dark smoke at its top.',
           '5: dying: a ring of low flames running along the ground around a dark, burnt middle, a column of dark '
           'smoke rising from the middle.',
           '6: embers: small glowing embers and flickers lying in a broken ring on the ground, a thin wisp of smoke.'],
    'E4': ['A game effects sheet: 16 small painted particle sprites on black, one in each cell of a 4 by 4 grid, each '
           'centred where its grey placeholder is and as large as it, with black around it.', '',
           'Top row: four ember flecks: small irregular bits of burning matter, a golden core, orange to deep red '
           'edges, each a different shape.',
           'Second row: four sparks: thin bright streaks of golden-white light lying exactly along their grey '
           'placeholders, brightest along their middle, tapering at both ends.',
           'Third row: four small flame licks: single tongues of flame pointing straight up, a golden core, an orange '
           'body, deep red tips, each a different shape.',
           'Bottom row: two soft round glows of golden light fading evenly to black, then two four-pointed star sparks '
           'with thin white-gold rays and a small bright centre.'],
    'E5': ['A game effects sheet: smoke, painted in greys on black: eight puffs of smoke on the left, in two rows of '
           'four, each where its grey placeholder is and as large as it, and two tall columns of smoke on the right.', '',
           'Smoke is painted in greys only: soft, billowing and painterly, a light warm grey where the smoke is thick, '
           'fading through dark grey into the black at its edges. No colour, no fire, no glow, no pure white. In the '
           'game its brightness becomes its opacity and the game tints it, so keep the black background clean.',
           'Each puff is a rounded cluster of billows seen from above, each a different shape. Each column rises from a '
           'narrow base at the bottom of the image to a wider, drifting top, leaning slightly, like the smoke over a '
           'burnt patch of ground.'],
    'E6': ['A game decal sheet: five burn marks left on the ground by fire, painted on white, each exactly where its '
           'grey placeholder is and as large as it.', '',
           'Left, large: the scorch left by an exploding fireball: a broad ring of black soot and charred earth with '
           'short streaks radiating outward, around a scorched dark-brown middle of burnt grass and ash; its outline is '
           'a flat ellipse.',
           'Top middle: a small crater left by a falling meteor: a dark charred pit, ringed by a lighter band of thrown '
           'earth in pale grey-brown; a flat ellipse.',
           'Top right: a small round burn mark: a dark brown-black blot with a soft, feathered edge.',
           'Right middle: the burnt base of a fire burning on the ground: an irregular blackened patch of ash and '
           'charred grass, darkest in its middle.',
           'Bottom: a long track of burnt ground left by a stream of fire: a band of soot and charred grass with ragged '
           'edges, tapering at both ends.',
           'The marks use charcoal, soot black, burnt umber and ash grey; nothing bright, nothing coloured, no embers.'],
    'L1': ['A game effects sheet: thorny roots erupting from the ground, painted on magenta, in twelve separate sprites: '
           'four growth stages from left to right, in three variants from top to bottom, each where its grey '
           'placeholder is and as large as it.', '',
           'Growth stages, left to right: 1: sharp tips just breaking the soil, a little torn earth; 2: half grown; '
           '3: fully grown, the tallest; 4: settled, a little lower and spread wider.',
           'Variants, top to bottom: a cluster of five or six curved thorn spikes; a ring of thorn spikes around an '
           'empty middle where a man would stand; a bigger cluster with one tall central spike.',
           'The thorns are woody spikes of dark bark brown with paler, sharp tips, a little moss and a few small dark '
           'green leaves, the soil torn up in clods around their base. They stand up from the ground, seen from above '
           'at 40 degrees, foreshortened.'],
    'L2': ['A game effects sheet: roots and vines that seize a man by the legs, painted on magenta, in seven separate '
           'sprites, each where its grey placeholder is and as large as it.', '',
           'The man is not painted. The roots form a knotted mound where his feet and lower legs would be, hiding them '
           'completely, and climb no higher than his knees; the top of the mound stays open where his thighs would '
           'come out.',
           'Top row, left to right, living and growing: 1: roots just breaking through the soil around the feet, '
           'ankle high, clods of earth thrown up; 2: roots climbing and twisting to the middle of the shins; 3: fully '
           'grown: a tight tangle of roots and thorny vines spiralling up to the knees, with small leaves.',
           'Second row, left to right, the same roots withering: 1: dried and brown, sagging; 2: collapsing, strands '
           'breaking and falling outward; 3: fallen: a low litter of dry broken root pieces lying on the ground.',
           'Bottom strip: one long living runner of twisted root and vine lying along the ground, the same thickness '
           'all along, with a few small leaves, filling the strip from end to end, for a rope texture.',
           'Living roots: bark brown with deep green vines; withered roots: dry grey-brown, ochre and dead-leaf brown, '
           'with no green.'],
    'L3': ['A game decal sheet: cracks and scars in the ground, painted on white, six separate marks, each exactly '
           'where its grey placeholder is and as large as it.', '',
           'Top: a long thin crack in dry earth running across the whole width, jagged, with small side branches.',
           'Second: a wider crack with dark depths and crumbling edges and a few branches, across the whole width.',
           'Bottom left: split ground: cracks spreading out from a central point across a flat ellipse of earth, the '
           'middle darker where the ground heaved.',
           'Right and bottom right: three root scars: holes of torn earth where roots burst out of the ground, dark '
           'soil, broken root stubs, clods thrown around, each a flat ellipse.',
           'The marks use dark umber, soil brown, bark brown and charcoal.'],
    'L4': ['A game effects sheet: leaves, petals and flowers, painted on magenta, each where its grey placeholder is and '
           'as large as it, with magenta around each.', '',
           'Top two rows: twelve single loose leaves, seen from above: oak, birch, ash, beech and willow shapes, in '
           'greens from deep forest green to yellow-green, a few browning at the edges; each a different leaf.',
           'Third row: eight blossom petals: white, cream and pale yellow, each a different curl.',
           'Bottom left: three small clumps of tiny wildflowers in grass, white, cream and yellow, growing from the '
           'ground and seen from above at 40 degrees, for decals.',
           'Bottom right: leaf litter: fallen green and brown leaves scattered over a flat ellipse of ground.',
           'No pink, no lilac, no purple anywhere.'],
}


def prompt(sheet):
    S = SHEETS[sheet]
    bg = BGW[S['bg']]
    lines = [f'Image 1 is the layout guide: flat grey placeholder shapes on a {bg.split(" (")[0].replace("perfectly flat ", "")} '
             'background, one for each element of this sheet. Keep every element exactly where its placeholder is, at '
             'exactly its size, and paint it as described below; no grey placeholder may remain. Copy only the layout '
             'and the sizes from Image 1, never its flat grey shading.']
    for i, r in enumerate(REFS[sheet], start=2):
        lines.append(f'Image {i} is {REF_WORDS[r]}. Copy its hand, its brushwork and its palette, but nothing of its '
                     'subject, framing, lighting or background.')
    lines.append('')
    lines += BODY[sheet]
    lines.append('')
    lines.append(CAM)
    if S['blend'] == 'add':
        lines += ['', LIGHT_ADD, EMBER]
    elif S['blend'] == 'luma':
        lines += ['', 'The smoke is matter, not light: it does not glow.']
    elif S['blend'] == 'multiply':
        lines += ['', DECAL]
    else:
        lines += ['', LIGHT_MATTER, LOAM]
    lines += ['', STYLE, '',
              f'Background: {bg}, completely uniform from edge to edge, with no texture, no vignette, no grid lines, no '
              'frames, no labels, no numbers and no text. Every element stands apart from the others with clear '
              'background between them, and none touches the edge of the image.']
    if S['bg'] == 'magenta':
        lines.append('No magenta, pink or purple anywhere in the painted elements.')
    txt = '\n'.join(lines) + '\n'
    for w in ('Total War', 'Warhammer', 'Dominions', 'Age of Wonders', 'Riot', 'League of Legends', 'Blizzard', 'Diablo',
              'Warcraft', 'Magic: The Gathering', 'Disney', 'Pixar', 'Ghibli', 'Frazetta', 'Rembrandt', 'Rutkowski'):
        assert w.lower() not in txt.lower(), (sheet, w)
    return txt


def main():
    os.makedirs(os.path.join(WORK, 'prompts'), exist_ok=True)
    jobs = []
    for sheet in SHEETS:
        p = os.path.join(WORK, 'prompts', sheet + '.txt')
        open(p, 'w').write(prompt(sheet))
        refs = [os.path.join(WORK, 'guides', sheet + '.guide.png')] + [REF[r] for r in REFS[sheet]]
        for cand, model, tag in (('a', 'gemini-nano-banana-2.1', 'nb21'), ('b', 'gemini-3-pro-image', 'g3pro')):
            jobs.append({'job': f'{sheet}.{cand}', 'sheet': sheet, 'cand': cand, 'model': model, 'aspect': SHEETS[sheet]['aspect'],
                         'prompt': p, 'refs': refs, 'out': os.path.join(UNITS, 'stage-d', 'raw', f'{sheet}.{cand}.{tag}.png'),
                         'purpose': f'D pilot: {sheet} {SHEETS[sheet]["title"]} sheet, candidate {cand} ({tag})'})
    json.dump(jobs, open(os.path.join(WORK, 'jobs.json'), 'w'), indent=1)
    print(len(jobs), 'jobs')


if __name__ == '__main__':
    main()
