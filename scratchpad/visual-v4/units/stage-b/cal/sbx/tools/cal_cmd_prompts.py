# Stage B calibration, part 1 (review change 5): the commander route.
#   Step 1: a camera-correct body sheet per kind (Nano Banana Pro from the zoned commander maquette).
#   Step 2: a Nano Banana 2.1 re-dress of that sheet per face, with the face's approved portrait as Image 2.
# Writes ../../prompts/cmd.*.txt and ../../jobs/cmd-*.json. Prompts never name another game, franchise, artist or studio.
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from make_prompts import STYLE, LIGHT, CAMERA, NEVER, KEYWORDS, cell_lines  # noqa: E402

CAL = os.path.abspath(os.path.join(HERE, '..', '..'))
UNITS_DIR = os.path.abspath(os.path.join(CAL, '..', '..'))
SBX = os.path.join(CAL, 'sbx')
REPO = '/home/user/Fluid-Magic-'
ANCHOR = REPO + '/art-source/portraits/anchor-style.webp'
PORTRAIT = REPO + '/art-source/portraits/{}/{}/{}.webp'
U = {u['id']: u for u in json.load(open(os.path.join(SBX, 'units.json')))['units']}
PRO, NB21 = 'gemini-3-pro-image', 'gemini-nano-banana-2.1'

KINDS = {
    'cmdChief': dict(
        ref=f'{UNITS_DIR}/pilot/raw/ad/cw.front.g3pro.png', notsoldier='no shield, no orange surcoat, cape or mantle and no crest',
        legend='bronze for the crown ring of short spikes on the iron helm, near-black for the heavy fur mantle over the '
               'shoulders and down the back, blue-grey for the iron pauldrons',
        kit='An Ash Chieftain of the Cinder Horde, a war leader: heavy and broad; a dark iron helm crowned with a ring of '
            'short iron spikes; a heavy mantle of soot-black fur over both shoulders and hanging down the back to the '
            'knees; dark iron plate pauldrons; charcoal clothes with dark iron scale sleeves, leather bracers and a broad '
            'leather belt, so that little skin shows; dark leather boots; ash-grey skin, a plain face with a short dark '
            'beard; a jagged single-bit dark iron axe in the right hand. He carries no shield and wears no cloth of a '
            'bright colour.',
        detail='the spikes of the crown-helm, the separate tufts of the fur mantle, the plates and rivets of the pauldrons, '
               'scale sleeves, leather straps and buckles, worn metal on the axe',
        values='the crown-helm, the dark mantle and the pauldrons against darker legs'),
    'cmdCaster': dict(
        ref=f'{UNITS_DIR}/pilot/raw/ad/cw.front.g3pro.png', notsoldier='no shield, no armour, no orange surcoat, cape or mantle, no crest and no axe',
        legend='bronze for the thin iron circlet, light grey for the mantle of layered cloth over the shoulders, near-black '
               'for the long robe, orange for the iron cage at the top of the staff',
        kit='A fire mage of the Cinder Horde: a long charcoal robe to the ground; a heavy mantle of layered smoke-grey '
            'cloth over both shoulders and down the back; a thin blackened-iron circlet on the bare head; ash-grey skin, a '
            'plain face with a short dark beard; a tall staff of blackened wood held in the right hand, crowned with a '
            'small iron cage holding a dull ember that does not glow. No armour, no shield, no cloth of a bright colour.',
        detail='the folds and frayed hem of the robe, the layers of the mantle, the circlet, the iron cage and the wood '
               'grain of the staff',
        values='the head, the pale mantle and the staff head against the dark robe'),
    'cmdDruid': dict(
        ref=f'{UNITS_DIR}/pilot/raw/ad/wd.front.g3pro.png', notsoldier='no shield, no armour, no sword, no green surcoat and no leaf crest',
        legend='olive for the soft wool hood, brown for the collar and mantle of feathers and leaves over the shoulders, '
               'dark brown for the long robe, green for the living sprig at the top of the staff',
        kit='An Elder Druid of the Thornwood: a soft loose hood of olive-brown wool; a collar and short mantle of brown '
            'feathers and dry leaves over the shoulders; a long robe of layered bark-brown and olive cloth to the ground; '
            'bark-brown weathered skin, a plain old face with a grey moustache; a gnarled wooden staff held in the right '
            'hand, with a living green sprig at the top. No armour, no shield, nothing bright.',
        detail='the folds of the hood, the separate feathers and leaves of the collar, the layered robe and its frayed hem, '
               'the knots of the staff and the leaves of its sprig',
        values='the hood, the light collar and the staff head against the dark robe'),
}

FACES = {  # face id: (kind, nation dir, unit dir, number, man/woman, identity marks in order)
    'ac06': ('cmdChief', 'cinderHorde', 'ashChieftain', '06', 'man', [
        'the dark iron crown-helm ringed with short iron spikes like flames, with no horns',
        'the very full, untrimmed dark beard going grey, reaching his chest',
        'the dark iron pauldrons engraved with coiled flame sigils',
        'the mantle of soot-black feathers over the shoulders',
        'the pale crack-like scar down the left cheek',
        'the jagged single-bit dark iron axe']),
    'ac03': ('cmdChief', 'cinderHorde', 'ashChieftain', '03', 'man', [
        'the open-faced dark iron helm with two large curled ram horns wrapped in leather cord',
        'his clean-shaven face, dark charcoal-grey skin with three black soot stripes across the brow and cheeks',
        'the mail aventail at the neck',
        'the dark iron pauldrons studded with rows of iron rings',
        'the grey wolf-fur collar over the shoulders',
        'the jagged single-bit dark iron axe']),
    'cm03': ('cmdCaster', 'cinderHorde', 'cinderMagus', '03', 'man', [
        'the tall, straight, peaked charcoal cowl that does not droop, bound in a spiral by a thin band of dark iron from '
        'the brow up to the tip',
        'his very old sunken face, bald, with wispy white stubble and a band of black soot painted across the forehead',
        'the heavy mantle of layered smoke-grey cloth over the shoulders',
        'the pendant of a black iron sun disc on the chest',
        'the long charcoal robe to the ground',
        'the tall staff of blackened wood crowned with an iron cage holding a dull ember']),
    'ea07': ('cmdCaster', 'cinderHorde', 'emberAdept', '07', 'man', [
        'his thick unruly black hair with a thin blackened-iron circlet half-hidden in it, no hood',
        'the short dense black beard on a broad face',
        'the charcoal robe to the ground with a padded quilted collar and a dull ember-red trim',
        'the leather book-strap across the chest, with a book at the hip',
        'the iron key hanging on a cord',
        'the slender staff of blackened wood']),
    'ed08': ('cmdDruid', 'thornwood', 'elderDruid', '08', 'man', [
        'the soft loose hood of faded olive-brown wool hanging in deep folds',
        'the two very short antler nubs barely poking through the hood above the brow',
        'the long thin grey moustache hanging down past the jaw, over a clean-shaven chin',
        'the collar of brown owl feathers',
        'the clasp shaped like a crescent moon',
        'the long robe of layered bark-brown and olive cloth, and the gnarled staff with a living green sprig']),
    'ed05': ('cmdDruid', 'thornwood', 'elderDruid', '05', 'woman', [
        'the grey-green hood',
        'the slender branching antlers rising from the hood',
        'her white hair in many thin braids with tufts of moss, hanging down over the chest',
        'her narrow old woman\'s face with high cheekbones and olive-brown skin',
        'the necklace of acorn cups and the clasp of polished bone',
        'the long robe and the gnarled staff']),
}

FACING_FRONT = ('Facing, again: every figure in every one of the cells faces the same way, toward us and to the lower '
                'left, including the figure that is hit and the falling one; the fleeing figures alone turn away.')


def body_prompt(kind, with_ref=True):
    k = KINDS[kind]; u = U[kind]
    keyname, nokey = KEYWORDS[u['key']]
    cols, rows, lines = cell_lines(u)
    refs = [f'Image 1 is the camera and pose guide: clay maquettes in exactly this grid, rendered from the game\'s battle '
            f'camera; the coloured areas on them mark the leader\'s kit: {k["legend"]}. Copy from it exactly the camera '
            'angle, the direction every figure faces, the pose in each cell, the size of the figure in its cell and the '
            'grid. Do not copy its smooth clay surfaces, its simple shapes or its toy-like proportions.']
    if with_ref:
        refs.append('Image 2 is a finished sprite sheet from the same game, painted at the same camera: match its camera, '
                    'the size of its figures in their cells, its daylight and its painting. Do not copy its soldier or '
                    f'his kit: {k["notsoldier"]}.')
        refs.append('Image 3 is a painting-style reference from the same set: copy its brushwork, palette and edges, not '
                    'its dark background, its candlelight, its framing or its subject.')
    else:
        refs.append('Image 2 is a painting-style reference from the same game: copy its brushwork, palette and edges, not '
                    'its dark background, its candlelight, its framing or its subject.')
    parts = ['\n'.join(refs), '',
             f'A game sprite sheet: 16 full-length painted figures of one leader, one figure in each cell of a {cols} by '
             f'{rows} grid, on a perfectly flat, uniform {keyname} background. The same leader, the same equipment, the '
             'same colours and the same scale in every cell; only the pose changes.', '',
             CAMERA['front'], '', LIGHT, '', STYLE, '',
             f'The leader: {k["kit"]}', '',
             'This sheet is the body that each of this kind\'s leaders is later painted onto, so keep the kit plain: no '
             'personal ornaments, sigils or trophies.', '',
             FACING_FRONT, '',
             f'Detail: at full size each figure is a finished small painting, not a flat icon: {k["detail"]}; varied, '
             f'visible brush strokes. The values stay simple enough that the figure reads at 46 pixels: {k["values"]}.', '',
             'Proportions and scale: realistic adult proportions, the head with its helmet or hood about one sixth of '
             'the standing height; weapons at true size. Standing upright, a figure is about 62% of its cell\'s height; '
             'lying figures are as long as the standing ones are tall.', '',
             'The cells, left to right, row by row (the poses of the camera and pose guide):'] + lines + ['',
             f'Background and separation: one flat {keyname} colour fills the whole image with no gradient, texture, '
             f'floor, vignette or shadow; at least 24 pixels of clean background between any two figures and around the '
             f'edges. {nokey[0].upper() + nokey[1:]}.', '', NEVER]
    return '\n'.join(parts)


def redress_prompt(face, view='front'):
    kind, nat, unit, num, sex, marks = FACES[face]
    u = U[kind]
    keyname, nokey = KEYWORDS[u['key']]
    pr = 'he' if sex == 'man' else 'she'
    cam = ('high above and in front, looking down at about 40 degrees' if view == 'front'
           else 'high above and behind, looking down at about 40 degrees')
    marks_txt = '; '.join(f'({i + 1}) {m}' for i, m in enumerate(marks))
    facing = (FACING_FRONT if view == 'front' else
              'Facing, again: every figure faces exactly as in Image 1, away from us toward the upper right, the hit '
              'and falling figures included: we see the back, the mantle and the back of the headgear, and we never '
              'see the face. Only the edges of the marks show from behind.')
    parts = [f'Image 1 is a finished game sprite sheet of a leader whose drawing is right: keep exactly its camera ({cam}), '
             'the direction every figure faces, every figure\'s pose, size and position in its cell, the 4 by 4 grid and '
             f'the flat {keyname} background.',
             f'Image 2 is this leader\'s own approved painted portrait. Every figure of Image 1 must become the {sex} of '
             'the portrait, seen full length from above.', '',
             f'Repaint every figure of Image 1 as the {sex} of Image 2, the same in every cell. Keep each figure\'s pose, '
             f'the position of its arms, legs and weapon, and its outline as close as the new kit allows. {pr[0].upper() + pr[1:]} has '
             f'these marks, and each one must be clearly visible at full size: {marks_txt}. Paint them in the portrait\'s '
             'hand: painterly oil on a wood panel, visible directional brushwork, a muted earthy palette; nothing glows. '
             'Keep the daylight of Image 1 (a high sun from the upper left, a cool fill on the lower right); do not copy '
             'the portrait\'s candlelight, its dark background or its framing.', '',
             facing, '',
             f'Background: one flat {keyname} colour fills the whole image with no gradient, texture, floor or shadow; '
             f'{nokey}. Never: text, labels, grid lines, borders, a floor, cast shadows, blood, extra people, cropped or '
             'overlapping figures.']
    return '\n'.join(parts)


def main():
    P = os.path.join(CAL, 'prompts'); J = os.path.join(CAL, 'jobs'); R = os.path.join(CAL, 'raw')
    os.makedirs(P, exist_ok=True); os.makedirs(J, exist_ok=True)
    bodies, redress = [], []
    for kind, k in KINDS.items():
        g = os.path.join(SBX, 'refs', 'guides', f'{kind}.front.png')
        pf = os.path.join(P, f'cmd.{kind}.front.body.txt'); open(pf, 'w').write(body_prompt(kind))
        bodies.append(dict(job=f'{kind}.front.body', figure=kind, view='front', model=PRO, aspect='1:1', key=U[kind]['key'],
                           refs=[g, k['ref'], ANCHOR], promptFile=pf, out=os.path.join(R, f'{kind}.front.body.g3pro.png'),
                           purpose=f'commander body sheet {kind} front (Pro, zoned maquette + troop sheet)'))
    pf = os.path.join(P, 'cmd.cmdChief.front.body.zonesonly.txt'); open(pf, 'w').write(body_prompt('cmdChief', with_ref=False))
    bodies.append(dict(job='cmdChief.front.zonesonly', figure='cmdChief', view='front', model=PRO, aspect='1:1', key='green',
                       refs=[os.path.join(SBX, 'refs', 'guides', 'cmdChief.front.png'), ANCHOR], promptFile=pf,
                       out=os.path.join(R, 'cmdChief.front.zonesonly.g3pro.png'),
                       purpose='commander body sheet cmdChief front (Pro, zoned maquette only: hypothesis test)'))
    for face, (kind, nat, unit, num, sex, marks) in FACES.items():
        pf = os.path.join(P, f'cmd.{face}.front.redress.txt'); open(pf, 'w').write(redress_prompt(face))
        redress.append(dict(job=f'{face}.front.redress', figure=kind, face=face, view='front', model=NB21, aspect='1:1',
                            key=U[kind]['key'], refs=[os.path.join(R, f'{kind}.front.body.g3pro.png'), PORTRAIT.format(nat, unit, num)],
                            promptFile=pf, out=os.path.join(R, f'{face}.front.redress.nb21.png'),
                            purpose=f'commander re-dress {unit} {num} front onto {kind} body (nb21)'))
    pf = os.path.join(P, 'cmd.ac06.back.redress.txt'); open(pf, 'w').write(redress_prompt('ac06', 'back'))
    back = [dict(job='ac06.back.redress', figure='cinderWarrior', face='ac06', view='back', model=NB21, aspect='1:1', key='green',
                 refs=[f'{UNITS_DIR}/pilot/raw/r3/cw.back.g3pro.png', PORTRAIT.format('cinderHorde', 'ashChieftain', '06')],
                 promptFile=pf, out=os.path.join(R, 'ac06.back.redress.nb21.png'),
                 purpose='commander re-dress ashChieftain 06 back onto the camera-correct troop back sheet (nb21)')]
    json.dump(bodies, open(os.path.join(J, 'cmd-bodies.json'), 'w'), indent=1)
    json.dump(redress, open(os.path.join(J, 'cmd-redress.json'), 'w'), indent=1)
    json.dump(back, open(os.path.join(J, 'cmd-back.json'), 'w'), indent=1)
    print(len(bodies), len(redress), len(back))


if __name__ == '__main__':
    main()
