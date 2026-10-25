# Stage B troops, round 2: the one re-roll of every sheet that failed a check in round 1, by the route most likely to
# hold the camera (review change 7: "change clothing and marks by a Nano Banana 2.1 edit of a camera-correct sheet, not by
# a new roll from the maquette"):
#   pro   - a new Pro roll with the failure named (no camera-correct sheet of the layout exists: the thrower; or the
#           sheet failed on its background, not its camera);
#   dress - a Nano Banana 2.1 re-dress of a camera-correct sheet of the same view and layout, chosen for the same weapon
#           motion; a base of another nation is keyed, its cloth moved to the target side and laid on the target key
#           first (so nb21 never has to change the background);
#   edit  - a Nano Banana 2.1 edit of the round 1 sheet itself, whose camera passed (side colour, kit consistency).
# Usage: python3 tr_r2.py   (writes ../../prompts/r2.*.txt, ../../bases/*.png and ../../jobs/r2.json)
import json, os, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from tr_prompts import BY, UNITS, W, RAW, PROMPTS, JOBS, PRO, NB, ANCHOR, BANNED, KEYWORDS, SIDE, sheet_job  # noqa: E402
from tr_camrefs import keyed, on_key, grey_cloth  # noqa: E402
from pack import recolor_cloth  # noqa: E402

UNITSDIR = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units'
BASES = os.path.join(W, 'bases')
R1 = lambda n: os.path.join(RAW, f'r1.{n}.g3pro.png')  # noqa: E731
CAM = {'back': 'high above and behind, looking down at about 40 degrees',
       'front': 'high above and in front, looking down at about 40 degrees'}
FACE = {'back': 'away from us toward the upper right, the hit and falling figures included: we see the back and the back of the head, never a face',
        'front': 'toward us and to the lower left, the hit and the falling figures included; the fleeing figures run as in Image 1'}
CLOTHWORDS = {
    'cinderHorde': ('dull ember-orange cloth, clean and fairly saturated: #D9744A where the sun strikes it, #C4532C in its middle '
                    'tones and a deep red-orange #7E3118 in the shade; never brown, grey or dusty'),
    'thornwood': ('cloth dyed deep bottle green: the colour of jade or of a green glass bottle held to the light, a clear and '
                  'fairly saturated cool green; never leaf-green, olive, grey or blackish, never as blue as teal'),
    'independent': ('undyed grey wool (#8C8A80), lighter grey-beige where the sun strikes it; these fighters belong to no nation and '
                    'wear no dyed colour: no orange, red, green or blue anywhere'),
}


def derived_base(src, src_key, dst_key, cloth_from=None, cloth_to=None, grey=None):
    os.makedirs(BASES, exist_ok=True)
    rgba = keyed(src, src_key)
    if cloth_from and cloth_to:
        rgba, _ = recolor_cloth(rgba, cloth_from, cloth_to)
    if grey:
        rgba = grey_cloth(rgba, *grey)
    out = os.path.join(BASES, os.path.basename(src).replace('.png', f'.to-{dst_key}' + (f'-{cloth_to[1:]}' if cloth_to else '') + '.png'))
    Image.fromarray(on_key(rgba, dst_key)).save(out)
    return out


def dress_prompt(u, view, swap, base_note):
    keyname, nokey = KEYWORDS[u['key']]
    nat = u['nation']
    kit = u['kit']
    txt = '\n'.join([
        f'Image 1 is a finished game sprite sheet whose drawing is right: keep exactly its camera ({CAM[view]}), the direction '
        f'every figure faces, every figure\'s pose, size and position in its cell, the 4 by 4 grid and the flat {keyname} '
        f'background. {base_note}',
        'Image 2 is a painted portrait from the same game, a reference for the painting hand and the materials only: do not '
        'paint that person, and do not copy its dark background, its candlelight or its framing.', '',
        'Repaint every figure of Image 1 as a different soldier, the same soldier in every cell. Keep each figure\'s pose, the '
        'position of its arms, legs and weapon, and its outline as close as the new kit allows. ' + swap, '',
        f'The soldier: {kit}', '',
        f'Side colour: {u["sideZones"]} are {CLOTHWORDS[nat]}. These are large, clean, unbroken areas that face the sky and the '
        'camera, so that a packed block of these soldiers reads as that colour from far away.', '',
        'Paint him in the hand of the game\'s painted portraits: painterly oil on a wood panel, visible directional brushwork, '
        'a muted earthy palette, small crisp highlights on metal edges and a thin bright rim of light along the upper-left '
        'edges; nothing glows unless the description says so. Keep the daylight of Image 1 (a high sun from the upper left, a '
        'cool fill on the lower right). Realistic adult proportions; no cartoon, no thick outlines.', '',
        f'Facing, again: every figure faces exactly as in Image 1, {FACE[view]}.', '',
        f'Background: one flat {keyname} colour fills the whole image with no gradient, texture, floor or shadow. {nokey} '
        'Never: text, labels, grid lines, borders, a floor, cast shadows, blood, extra people, cropped or overlapping figures.'])
    assert not BANNED.search(txt)
    return txt


def edit_prompt(u, view, change):
    keyname, nokey = KEYWORDS[u['key']]
    txt = '\n'.join([
        f'Image 1 is a finished game sprite sheet whose drawing is right: keep exactly its camera ({CAM[view]}), the direction '
        f'every figure faces, every figure\'s pose, outline, size and position in its cell, the 4 by 4 grid, the flat {keyname} '
        'background, and its painting: the same brushwork, the same soldier, the same weapon.',
        'Image 2 is a painted portrait from the same game, a reference for the painting hand only: do not copy its dark '
        'background, its candlelight, its framing or the person in it.', '',
        change, '',
        f'Facing, again: every figure faces exactly as in Image 1, {FACE[view]}. Nothing else changes: no new weapons, no new '
        'people.', '',
        f'Background: one flat {keyname} colour fills the whole image with no gradient, texture, floor or shadow. {nokey} '
        'Never: text, labels, grid lines, borders, a floor, cast shadows, blood, extra people, cropped or overlapping figures.'])
    assert not BANNED.search(txt)
    return txt


def job(fid, view, route, prompt, refs, purpose, model):
    name = f'{fid}.{view}'
    pf = os.path.join(PROMPTS, f'r2.{name}.{route}.txt')
    open(pf, 'w').write(prompt)
    m = 'g3pro' if model == PRO else 'nb21'
    return dict(job=name, figure=fid, view=view, round='r2', route=route, model=model, m=m, aspect='1:1', key=BY[fid]['key'],
                refs=refs, promptFile=pf, out=os.path.join(RAW, f'r2.{name}.{route}.{m}.png'), purpose=purpose)


def main():
    os.makedirs(PROMPTS, exist_ok=True)
    jobs = []
    # ---- Pro re-rolls with the failure named
    pro = {
        ('emberSkirmisher', 'back'): 'it failed the camera on 5 of 15 cells (the throw, the follow-through, the fall and both dead cells came out turned and too low), and the figures were too light against the ground',
        ('emberSkirmisher', 'front'): 'it painted the figures at eye level, much too large in their cells and seen from the side, and the figures were too light against the ground',
        ('briarGuard', 'front'): 'it painted the background flat white instead of pure magenta',
        ('briarGuard', 'back'): 'four cells drifted from the camera (the follow-through, the brace and both dead cells), and the falling figure was painted in different colours',
        ('flamebrand', 'back'): 'the follow-through cell turned toward us and the falling and dead cells were drawn from too low',
    }
    for (fid, view), why in pro.items():
        extra = (f'A previous attempt at this sheet failed: {why}. This time every figure is small in its cell and seen from high '
                 'above exactly like the clay maquettes of Image 1 and the figures of Image 2: the top of the head and the '
                 'shoulders large, the legs short and foreshortened, a standing figure about 60% of its cell\'s height; never at '
                 'eye level, never seen from the side; the background is one flat key colour from edge to edge.')
        j = sheet_job(fid, view, 'r2', extra=extra, tag='')
        os.replace(j['promptFile'], os.path.join(PROMPTS, f'r2.{fid}.{view}.pro.txt'))
        j.update(promptFile=os.path.join(PROMPTS, f'r2.{fid}.{view}.pro.txt'), route='pro',
                 out=os.path.join(RAW, f'r2.{fid}.{view}.pro.g3pro.png'),
                 purpose=f'{fid} {view} sheet (r2 re-roll, Pro, failure named: {why[:60]})')
        jobs.append(j)
    # ---- nb21 re-dresses of camera-correct sheets of the same view and layout
    li_front_green = derived_base(R1('lightInfantry.front'), 'magenta', 'green')
    am_back_thorn = derived_base(R1('ashMilitia.back'), 'green', 'magenta', '#C4532C', '#1F6A50')
    dress = [
        ('longbowHunter', 'front', R1('archer.front'), 'Image 1 shows an archer of another army.',
         'His short bow becomes a long yew bow about as tall as the hunter, held exactly where the short bow is held; his grey '
         'hood, cape and surcoat become deep bottle-green cloth; the ragged leaf-cut hem of the long cloak hangs to the knees.'),
        ('longbowHunter', 'back', R1('archer.back'), 'Image 1 shows an archer of another army.',
         'His short bow becomes a long yew bow about as tall as the hunter, held exactly where the short bow is held; his grey '
         'hood, cape and surcoat become deep bottle-green cloth; the long cloak with a ragged leaf-cut hem hangs down his back '
         'to the knees.'),
        ('heavyInfantry', 'front', UNITSDIR + '/pilot/raw/ad/wd.front.g3pro.png', 'Image 1 shows a soldier of another army.',
         'The bark armour becomes a mail hauberk with dull steel plates; the leaf-crested bark helm becomes a broad-brimmed iron '
         'kettle hat over a mail coif; the green cloth becomes undyed grey wool; the round green shield becomes a long '
         'kite-shaped shield painted plain pale grey, on the same arm; the leaf-bladed sword becomes a straight steel arming sword.'),
        ('heavyInfantry', 'back', R1('warden.back'), 'Image 1 shows a soldier of another army.',
         'The bark armour becomes a mail hauberk with dull steel plates; the leaf-crested bark helm becomes a broad-brimmed iron '
         'kettle hat over a mail coif; the green leaf cloak becomes a sleeveless surcoat of undyed grey wool, plain and smooth, '
         'hanging to just below the knees; the round shield becomes a long kite-shaped shield, its back toward us (wood, rim and '
         'straps); the green-tinted sword becomes a straight grey steel arming sword.'),
        ('swampFighter', 'front', R1('lightInfantry.front'), 'Image 1 shows a levy of the same free villages.',
         'He carries no shield: his left hand is empty or helps hold the spear; the spear becomes a long fishing spear with a '
         'barbed iron head, its shaft bound with reed cord; the iron skullcap becomes a hood of undyed grey wool, worn up; a '
         'short cape of woven dry straw-coloured reeds covers his shoulders.'),
        ('ashMilitia', 'front', li_front_green, 'Image 1 shows a levy of another army.',
         'He carries no shield: his left hand is empty or helps hold the spear; the grey surcoat and cape become dull '
         'ember-orange cloth; the skullcap is wrapped with an ember-orange cloth band; the spear stays a long ash-wood spear.'),
        ('thornMilitia', 'back', am_back_thorn, 'Image 1 shows a levy of another army.',
         'The skullcap becomes a deep bottle-green hood, worn up; the short cape becomes a short hooded cloak of the same green '
         'over the shoulders and the upper back; below it the long green surcoat hangs to just below the knees; the spear '
         'becomes a long dark hawthorn spear with a barbed head of bone and iron.'),
        ('berserker', 'back', UNITSDIR + '/pilot/raw/r3/cw.back.g3pro.png', 'Image 1 shows a warrior of the same army.',
         'He is now a huge bare-chested brute: no scale shirt, no helmet, no cape, no shield (his left arm is bare, with iron '
         'arm rings); his back and shoulders are bare ash-grey skin daubed with broad solid patches of dull ember-orange war '
         'paint; the axe becomes a massive two-handed jagged great axe with a crescent blade, held in the same place.'),
    ]
    for fid, view, base, note, swap in dress:
        u = BY[fid]
        jobs.append(job(fid, view, 'dress', dress_prompt(u, view, swap, note), [base, u['styleRefs'][0]],
                        f'{fid} {view} sheet (r2 re-roll, nb21 re-dress of a camera-correct sheet: {os.path.basename(base)})', NB))
    # ---- nb21 edits of the round 1 sheet (its camera passed)
    edits = [
        ('berserker', 'front', 'Change only how much of the side\'s colour he wears, the same way in every cell: his bare chest, '
         'belly and both shoulders are now daubed with broad, solid patches of dull ember-orange war paint (#C4532C, #D9744A '
         'where the sun strikes it, #7E3118 in the shade) that cover most of the skin you can see from this camera, painted '
         'over his skin with rough brush strokes; his ragged kilt is the same dull ember orange and hangs from the waist to the '
         'knees; the rags in his hair are ember orange. A packed block of these warriors must read as orange from far away.'),
        ('warden', 'back', 'Change only the soldier\'s cloak, the same way in every cell, to match the first cell (row 1, '
         'column 1): a short mantle of overlapping deep green cloth leaves covers only his shoulders and upper back, down to the '
         'shoulder blades; below it the smooth deep green surcoat of plain woven cloth hangs down his back to just below the '
         'knees. No long cloak of leaves anywhere. His sword blade is grey steel, not green.'),
    ]
    for fid, view, change in edits:
        u = BY[fid]
        jobs.append(job(fid, view, 'edit', edit_prompt(u, view, change), [R1(f'{fid}.{view}'), u['styleRefs'][0]],
                        f'{fid} {view} sheet (r2 re-roll, nb21 edit of its own r1 sheet: {change[:50]})', NB))
    json.dump(jobs, open(os.path.join(JOBS, 'r2.json'), 'w'), indent=1)
    print(len(jobs), [j['job'] + ':' + j['route'] for j in jobs])


if __name__ == '__main__':
    main()
