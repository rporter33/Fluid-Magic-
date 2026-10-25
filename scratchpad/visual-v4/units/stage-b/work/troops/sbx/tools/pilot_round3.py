# Round 3 of the pilot (after the review of r2; pilot.md "Round 3").
# r2 findings: Pro (gemini-3-pro-image / nano-banana-pro-preview) keeps the camera on people (14-15/15 cells) but
# nano-banana-pro-preview drew the wolf rider from the side (0/16) and ruled grid lines; nb21 reached the camera on
# the Cinder Warrior front (13/15) but not the back (9/15) nor the wolf rider (0/16); nb21 repainting a Pro sheet
# keeps the Pro camera (15/15, 14/16) and adds the portraits' hand. Every model turned the back view's "recoil" cell
# to face the camera; the chieftain portrait put horns on the troops' helms; the Pro back sheet showed shield faces
# on the soldiers' backs; painted cloth is less saturated than the flat procedural cloth, so the side share at
# 28 px stays at 16-20% (back) and 6-17% (front) against the 30% target; the wolf riders' greens stayed blackish.
# r3 changes: the back view's hit and fall cells are re-worded (back still to us, head bowed); the troops' helm has
# no horns; a long cape for the back view and a wide mantle and tall crest for the front view; the cloth's light
# and shade colours named; the shield's back is described for the back view; the wolf riders larger, the spear kept
# in the stand cell, the green named by its light and shade colours. Sub-round r3b: nb21 repaints the r3 Pro sheets.
import os

import pilot_rounds as R2

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..'))
RAW = os.path.join(ROOT, 'pilot', 'raw')

CW_HELM_OLD = 'a rounded dark iron helm with a nasal and a short stiff dull ember-orange horsehair crest running front to back'
CW_HELM_NEW = ('a rounded dark iron helm with a nasal and no horns (horns are a chieftain\'s mark, never a soldier\'s) '
               'and a tall stiff dull ember-orange horsehair crest running front to back')
CLOTH_SAT = ('The ember-orange cloth is clean and fairly saturated: #D9744A where the sun strikes it, #C4532C in its '
             'middle tones and a deep red-orange #7E3118 in the shade, never brown, grey or dusty; it is painted with '
             'the same brushwork as the rest.')
BACK_CELLS = {
    '9. (row 3, column 1) recoiling from a hit: knocked back, head snapped back, arms thrown out, one foot stepping back.':
        '9. (row 3, column 1) hit from the front: the soldier lurches backward toward us with his back still turned to '
        'us, shoulders hunched, arms thrown out to the sides, head bowed forward; we see only the back of his helmet and '
        'his cape, never his face.',
    '10. (row 3, column 2) falling backward, knees buckling, about halfway to the ground.':
        '10. (row 3, column 2) falling backward toward us, knees buckling, about halfway to the ground; still seen from '
        'behind and above: the back of the helmet and the cape toward us.',
}
BACK_SHIELD = ('Seen from behind, the shield on the left arm shows only its back: dark wood, an iron rim and leather '
               'straps; its painted orange face is turned toward the enemy, away from us. Never paint a shield face on '
               'a soldier\'s back.')
BACK_CAPE = ('a long dull ember-orange cape from the shoulders to the backs of the knees that covers the whole back, '
             'over a short dull ember-orange cloth mantle on the shoulders')
FRONT_MANTLE = ('a wide, thick dull ember-orange cloth mantle thrown forward over both shoulders like a short cloak, '
                'covering the tops of the shoulders and the upper chest, so that from above the shoulders are orange')
WR_GREEN = ('The pine-green cloth is clean and clearly coloured, like fresh fir needles: #2F8A68 where the sun strikes '
            'it, #1F6A50 in its middle tones and #113F2F in the shade; never blackish, olive or grey.')


def cw(prompt, view):
    p = prompt.replace(CW_HELM_OLD, CW_HELM_NEW)
    if view == 'back':
        for a, b in BACK_CELLS.items():  # sheet prompts list the cells; a repaint prompt does not
            p = p.replace(a, b)
        p = p.replace('a short dull ember-orange cloth mantle over both shoulders that covers the tops of the shoulders and '
                      'the top of the chest in front and falls to the shoulder blades behind', BACK_CAPE)
        p = p.replace('the shield face is the largest patch of colour on the figure', 'the shield face is orange')
        p = p.replace('cloth on the helmet crest, the shoulder mantle, the tabard and the whole shield face.',
                      'cloth on the helmet crest, the long cape and the shoulder mantle.')
        p = p.replace('Facing, again:', BACK_SHIELD + '\n\nFacing, again:')
    else:
        p = p.replace('a short dull ember-orange cloth mantle over both shoulders that covers the tops of the shoulders and '
                      'the top of the chest in front and falls to the shoulder blades behind', FRONT_MANTLE)
    assert CW_HELM_NEW in p
    return p.replace('The rest of the figure stays muted.', 'The rest of the figure stays muted. ' + CLOTH_SAT)


def revise(jobs):
    """r3: Pro and nb21 on the Cinder Warrior views, Pro on the wolf rider (r3b repaints the Pro sheets with nb21)."""
    r2 = R2.revise('r2', jobs)
    by = {j['job']: j for j in r2}
    out = []
    for v in ('back', 'front'):
        j = dict(by[f'cw.{v}'])
        j['prompt'] = cw(j['prompt'], v)
        j['models'] = ['g3pro', 'nb21']
        out.append(j)
    j = dict(by['wr.front'])
    p = j['prompt'].replace('A rider and his standing wolf together are about 62% of the cell\'s height',
                            'A rider and his standing wolf together are about 66% of the cell\'s height, as large as the '
                            'maquettes of the guide; never smaller')
    p = p.replace("1. (row 1, column 1) the wolf standing square", "1. (row 1, column 1) the rider holding his spear "
                  "upright; the wolf standing square")
    p = p.replace('The rest of the figure stays muted.', 'The rest of the figure stays muted. ' + WR_GREEN)
    assert p != j['prompt']
    j['prompt'] = p
    j['models'] = ['g3pro']
    out.append(j)
    return out


def revise_b(jobs):
    """r3b: nb21 repaints the r3 Pro sheets (camera and poses from Pro, the hand from the portraits)."""
    r2 = R2.revise('r2', jobs)
    by = {j['job']: j for j in r2}
    out = []
    for v in ('back', 'front'):
        j = dict(by[f'cw.{v}.rs'])
        p = cw(j['prompt'], v)
        p = p.replace('Changes to make while repainting: ', 'Changes to make while repainting: keep the helmets without '
                      'horns; ')
        p = p.replace('the knocked-back figure (row 3, column 1) shows its face in Image 1: repaint it seen from behind '
                      'like the others, with the same outline', 'keep every figure facing as in Image 1')
        j['prompt'] = p + '\n' + CLOTH_SAT
        j['refs'] = [os.path.join(RAW, 'r3', f'cw.{v}.g3pro.png')] + j['refs'][1:]
        out.append(j)
    j = dict(by['wr.front.rs'])
    j['prompt'] = j['prompt'] + '\n' + WR_GREEN
    j['refs'] = [os.path.join(RAW, 'r3', 'wr.front.g3pro.png')] + j['refs'][1:]
    out.append(j)
    return out
