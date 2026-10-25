# Stage B troops2, round a: the re-rolls R14 to R19 and every troop sheet the troops report left failed twice or as a
# flagged stand-in. Every job is a Nano Banana 2.1 re-dress or edit of a base whose frames already sit at the target
# maquette's camera (t2_probe.py; review change 7: never a new roll from the maquette):
#   whole  - another camera-correct sheet of the same view and layout, its cloth moved to the target side and laid on the
#            target key (R14 Longbow Hunter front from the Flame Archer front; Briar Guard back from the Ash Militia back,
#            the base the passing Thorn Militia back was re-dressed from; R18 Berserker back from the Ash Militia back);
#   mixed  - the figure's own best sheet with its failing cells replaced by passing frames of other sheets (t2_base.py),
#            then an edit that repaints the laid-in figures as this soldier and makes the named change.
# R17 (Thorn Militia front) runs as queued in work/troops/jobs/r3.json.
# Usage: python3 t2_jobs.py   (writes ../bases/*.png, ../prompts/a.*.txt, ../jobs/a.json, ../bases/bases.json)
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import t2_base  # noqa: E402  (puts the troops sandbox tools on the path)
from tr_prompts import BY, KEYWORDS, BANNED, NB, cell_lines  # noqa: E402
from tr_r2 import dress_prompt, CAM, FACE, CLOTHWORDS  # noqa: E402

W2 = os.path.abspath(os.path.join(HERE, '..'))
TR = t2_base.TR
SH = os.path.join(TR, 'sheets')
SB = os.path.abspath(os.path.join(TR, '..', '..'))
RAW = os.path.join(SB, 'raw', 'troops')
BASES, PROMPTS, JOBS = (os.path.join(W2, x) for x in ('bases', 'prompts', 'jobs'))
GREEN, ORANGE = '#1F6A50', '#C4532C'


def sh(n):
    return os.path.join(SH, n)


def where(u, cell):
    cols, _r, _a, cells = __import__('poses').LAYOUTS[u['layout']]
    i = cells.index(cell)
    return f'row {i // cols + 1}, column {i % cols + 1}'


def paint_lines(u, view):
    return [
        'Paint him in the hand of the game\'s painted portraits: painterly oil on a wood panel, visible directional brushwork, '
        'a muted earthy palette, small crisp highlights on metal edges and a thin bright rim of light along the upper-left '
        'edges; nothing glows unless the description says so. Keep the daylight of Image 1 (a high sun from the upper left, a '
        'cool fill on the lower right). Realistic adult proportions; no cartoon, no thick outlines.', '',
        f'Facing, again: every figure faces exactly as in Image 1, {FACE[view]}.', '']


def tail(u):
    keyname, nokey = KEYWORDS[u['key']]
    return (f'Background: one flat {keyname} colour fills the whole image with no gradient, texture, floor or shadow. {nokey} '
            'Never: text, labels, grid lines, borders, a floor, cast shadows, blood, extra people, cropped or overlapping figures.')


def mixed_prompt(u, view, foreign, change, guide_note=None):
    keyname, _ = KEYWORDS[u['key']]
    cells = '; '.join(f'{where(u, c)} (the {c})' for c in foreign)
    _c, _r, lines = cell_lines(u, view)
    txt = '\n'.join([
        f'Image 1 is a finished game sprite sheet whose drawing is right: keep exactly its camera ({CAM[view]}), the direction '
        f'every figure faces, every figure\'s pose, outline, size and position in its cell, the 4 by 4 grid and the flat '
        f'{keyname} background.',
        f'Most cells of Image 1 already show this soldier, painted as he must stay. In {len(foreign)} cells a figure of another '
        f'soldier was laid in only for its pose: {cells}. Repaint each of those figures as this same soldier, in his kit and '
        'his colours, keeping the pose, the position of the arms, legs and weapon, the outline, the size and the place in '
        'the cell exactly as they are, so that all 16 cells show one and the same soldier.',
        'Image 2 is a painted portrait from the same game, a reference for the painting hand and the materials only: do not '
        'paint that person, and do not copy its dark background, its candlelight or its framing.'
        + (f' {guide_note}' if guide_note else ''), '',
        f'The soldier: {u["kit"]}', '',
        f'Side colour: {u["sideZones"]} are {CLOTHWORDS[u["nation"]]}. These are large, clean, unbroken areas that face the '
        'sky and the camera, so that a packed block of these soldiers reads as that colour from far away.', '',
        change, '',
        'The cells, for reference (keep each figure\'s pose as Image 1 has it):', *lines, '',
        *paint_lines(u, view),
        tail(u)])
    assert not BANNED.search(txt)
    return txt


def job(fig, view, route, prompt, refs, purpose, rnd='a'):
    name = f'{fig}.{view}'
    pf = os.path.join(PROMPTS, f'{rnd}.{name}.{route}.txt')
    open(pf, 'w').write(prompt)
    return dict(job=name, figure=fig, view=view, round=rnd, route=route, model=NB, m='nb21', aspect='1:1', key=BY[fig]['key'],
                refs=refs, promptFile=pf, out=os.path.join(RAW, f't2{rnd}.{name}.{route}.nb21.png'), purpose=purpose)


def main():
    for d in (BASES, PROMPTS, JOBS):
        os.makedirs(d, exist_ok=True)
    rep, jobs = {}, []
    B = lambda n: os.path.join(BASES, n)  # noqa: E731

    # ---- R14: Longbow Hunter front, a re-dress of the Flame Archer front (15/15 on the hunter's own maquette)
    u = BY['longbowHunter']
    base = t2_base.build(B('lbh.front.from-flameArcher.png'), 'magenta', sh('r1.flameArcher.front'), 'flameArcher', 'front',
                         'archer', [], recolor_primary=('hue', ORANGE, GREEN), report=rep)
    swap = ('His short recurve bow becomes a long yew bow, held exactly where the short bow is held and as Image 3 (the '
            'grey clay pose guide of this sheet) shows it in each cell: in the stand and march cells it hangs upright at his '
            'side, close to his body, its upper tip at his shoulder and its lower tip by his ankle, never raised above his '
            'head; in the nock, draw and loose cells it stands upright in front of him; in the hit and falling cells it '
            'stays in his hand as Image 3 shows. His soot-black face scarf is gone: his bark-brown weathered face shows under '
            'the hood. His hood, shoulder cape and long surcoat are deep bottle-green cloth (Image 1 already shows them '
            'green: keep that green, do not turn it orange), and a deep bottle-green hooded cloak with a ragged leaf-cut hem '
            'hangs behind him to the knees. His arrows are plain, grey-fletched, with iron heads; nothing burns. His padded '
            'jack becomes a bark-brown leather jerkin.')
    note = ('Image 1 shows an archer of another army whose cloth was already dyed green for this sheet.')
    p = dress_prompt(u, 'front', swap, note)
    p = p.replace('Image 2 is a painted portrait from the same game, a reference for the painting hand and the materials only: '
                  'do not paint that person, and do not copy its dark background, its candlelight or its framing.',
                  'Image 2 is a painted portrait from the same game, a reference for the painting hand and the materials only: '
                  'do not paint that person, and do not copy its dark background, its candlelight or its framing.\n'
                  'Image 3 is the grey clay pose guide of this sheet, rendered from the same camera: use it only to see where '
                  'the long bow is in each cell; do not copy its clay surfaces, its colours or its toy-like shapes.')
    assert 'Image 3 is the grey clay' in p and not BANNED.search(p)
    jobs.append(job('longbowHunter', 'front', 'dress', p, [base, u['styleRefs'][0], t2_base.os.path.join(TR, 'sbx', 'refs', 'guides', 'longbowHunter.front.png')],
                    'R14 longbowHunter front sheet (nb21 re-dress of the Flame Archer front r1 15/15, cloth moved to green, on magenta)'))

    # ---- R16: Briar Guard front, the surcoat; its two failing cells (idle2, strike) laid in from the Thorn Militia front
    u = BY['briarGuard']
    base = t2_base.build(B('bg.front.mixed.png'), 'magenta', sh('r1.briarGuard.front'), 'briarGuard', 'front', 'melee',
                         [('idle2', sh('r1.thornMilitia.front'), 'thornMilitia', 'idle2', None),
                          ('strike', sh('r1.thornMilitia.front'), 'thornMilitia', 'strike', None)], report=rep)
    change = ('One change for every cell, the same way in all 16: a sleeveless surcoat of deep bottle-green cloth now covers '
              'his whole chest and belly from the collar down to just below the knees, over the bark plates of the body, '
              'split at the front below the belt and held at the waist by a thorn-studded belt; only his shoulders, arms and '
              'legs keep their bark plates, and the heavy deep bottle-green mantle stays across his shoulders. In the two '
              'laid-in cells the spear becomes his long halberd with a curved thorn-shaped blade, a back hook and a spike, '
              'held where the spear is held, and he wears his closed bark helm with its ring of thorns and green leaf crest.')
    jobs.append(job('briarGuard', 'front', 'mixed', mixed_prompt(u, 'front', ['idle2', 'strike'], change), [base, u['styleRefs'][0]],
                    'R16 briarGuard front sheet (nb21 surcoat edit of r1 with idle2 and strike laid in from the Thorn Militia front)'))

    # ---- R18: Berserker back, a re-dress of the Ash Militia back (14/15 on the berserker maquette); its roar cell laid in
    u = BY['berserker']
    base = t2_base.build(B('bk.back.from-ashMilitia.png'), 'green', sh('r1.ashMilitia.back'), 'ashMilitia', 'back', 'melee',
                         [('fleeA', sh('r1.briarGuard.back'), 'briarGuard', 'cheer', ('hue', GREEN, ORANGE))], report=rep)
    swap = ('He is now a huge bare-chested brute, broader than the levy: no padded jack, no surcoat, no skullcap, no shoulder '
            'cape; his back, shoulders and arms are bare ash-grey skin daubed with broad solid patches of dull ember-orange war '
            'paint, with iron arm rings; a broad ember-orange cloth sash crosses his back from one shoulder to the opposite '
            'hip; a broad, long, ragged dull ember-orange kilt hangs from his waist to his knees, belted with iron, and covers '
            'his hips and thighs all round; wild matted black hair bound with ember-orange rags; a strip of black bear fur over '
            'one shoulder. The spear becomes a massive two-handed jagged great axe with a crescent blade, held exactly where the '
            'spear is held. In row 4, column 1 he roars with his arms wide, as Image 1 shows the pose.')
    note = 'Image 1 shows a levy spearman of the same army (one cell, row 4, column 1, holds another soldier laid in for its pose).'
    jobs.append(job('berserker', 'back', 'dress', dress_prompt(u, 'back', swap, note), [base, u['styleRefs'][0]],
                    'R18 berserker back sheet (nb21 re-dress of the Ash Militia back r1, roar cell laid in)'))

    # ---- R19: Berserker front, the kilt and the sash; its failing idle2 and strike laid in from the Ash Militia front
    base = t2_base.build(B('bk.front.mixed.png'), 'green', sh('r1.berserker.front'), 'berserker', 'front', 'melee',
                         [('idle2', sh('r2.ashMilitia.front.dress'), 'ashMilitia', 'idle2', None),
                          ('strike', sh('r2.ashMilitia.front.dress'), 'ashMilitia', 'strike', None)], report=rep)
    change = ('One change for every cell, the same way in all 16: he wears a broad, long, ragged dull ember-orange kilt from '
              'the waist to the knees, belted with iron, that covers his hips and thighs all round, and a broad dull '
              'ember-orange cloth sash across his bare chest from his left shoulder to his right hip; his chest and shoulders '
              'keep their ember-orange war paint. In the two laid-in cells the levy becomes this bare-chested brute with his '
              'massive jagged great axe, held where the spear is held.')
    jobs.append(job('berserker', 'front', 'mixed', mixed_prompt(u, 'front', ['idle2', 'strike'], change), [base, u['styleRefs'][0]],
                    'R19 berserker front sheet (nb21 kilt and sash edit of r1 with idle2 and strike laid in from the Ash Militia front)'))

    # ---- Briar Guard back: a re-dress of the Ash Militia back moved to green (15/15 on the Briar Guard maquette)
    u = BY['briarGuard']
    base = t2_base.build(B('bg.back.from-ashMilitia.png'), 'magenta', sh('r1.ashMilitia.back'), 'ashMilitia', 'back', 'melee', [],
                         recolor_primary=('hue', ORANGE, GREEN), report=rep)
    swap = ('He is now a big, broad heavy infantryman: the skullcap becomes a closed bark helm crowned with a ring of short '
            'thorns and a deep green leaf crest running front to back; the padded sleeves and wrapped legs become thick '
            'black-brown bark plates studded with short thorns on the shoulders, arms and legs; the short hooded cape becomes a '
            'heavy deep bottle-green mantle across his shoulders and upper back; the long surcoat stays, deep bottle green, to '
            'just below the knees, held by a thorn-studded belt; the spear becomes a long halberd with a curved thorn-shaped '
            'blade, a back hook and a spike, held exactly where the spear is held.')
    note = 'Image 1 shows a levy spearman of another army whose cloth was already dyed green for this sheet.'
    jobs.append(job('briarGuard', 'back', 'dress', dress_prompt(u, 'back', swap, note), [base, u['styleRefs'][0]],
                    'briarGuard back sheet (stand-in re-roll: nb21 re-dress of the Ash Militia back r1 15/15, moved to green)'))

    # ---- Flamebrand back: its own r1 sheet (11/15) with follow, fall and both dead cells laid in
    u = BY['flamebrand']
    base = t2_base.build(B('fb.back.mixed.png'), 'green', sh('r1.flamebrand.back'), 'flamebrand', 'back', 'melee',
                         [('follow', sh('r1.ashMilitia.back'), 'ashMilitia', 'follow', None),
                          ('fall', sh('r2.berserker.back.dress'), 'berserker', 'fall', None),
                          ('deadA', sh('r1.lightInfantry.back'), 'lightInfantry', 'deadA', ('tint', ORANGE)),
                          ('deadB', sh('r2.berserker.back.dress'), 'berserker', 'deadB', None)], report=rep)
    change = ('In the laid-in cells he wears his full kit: the tall closed dark iron helm with its crest of iron flames and '
              'ember-orange plume, the heavy blackened plate on arms and legs, the long ember-orange surcoat and the long '
              'ember-orange cape, and no shield anywhere; in the follow cell his burning longsword is low on the far side after the slash; in the '
              'fall and the dead cells the sword lies by his hand, its flame out.')
    jobs.append(job('flamebrand', 'back', 'mixed', mixed_prompt(u, 'back', ['follow', 'fall', 'deadA', 'deadB'], change),
                    [base, u['styleRefs'][0]],
                    'flamebrand back sheet (stand-in re-roll: nb21 edit of r1 with follow, fall, deadA, deadB laid in)'))

    # ---- Ember Skirmisher back: its own r1 sheet (10/15) with throw, follow, fall and both dead cells laid in; darker
    u = BY['emberSkirmisher']
    base = t2_base.build(B('es.back.mixed.png'), 'green', sh('r1.emberSkirmisher.back'), 'emberSkirmisher', 'back', 'thrower',
                         [('throw', sh('r1.ashMilitia.back'), 'ashMilitia', 'follow', None),
                          ('follow', sh('r1.swampFighter.back'), 'swampFighter', 'follow', ('tint', ORANGE)),
                          ('fall', sh('r1.swampFighter.back'), 'swampFighter', 'fall', ('tint', ORANGE)),
                          ('deadA', sh('r1.lightInfantry.back'), 'lightInfantry', 'deadA', ('tint', ORANGE)),
                          ('deadB', sh('r2.berserker.back.dress'), 'berserker', 'deadB', None)], report=rep)
    change = ('Two more changes, the same way in every cell: (1) paint every figure darker than Image 1 shows him: the tunic '
              'and the scarf in the deep middle and shade tones of the ember orange (#C4532C and #7E3118, rarely #D9744A), '
              'the skin heavily blackened with soot, the wraps charcoal; a packed block of them must read clearly darker than '
              'dry grass. (2) Every javelin shaft is dark brown wood with an iron tip; there is no green anywhere on him. In '
              'the throw cell his throwing arm is the one reaching forward, the javelin just gone from his hand; in the follow '
              'cell he follows through. The laid-in figures get the scarf with its two long tails, the long tunic and the '
              'bundle of javelins in the off hand, and no shield anywhere.')
    jobs.append(job('emberSkirmisher', 'back', 'mixed', mixed_prompt(u, 'back', ['throw', 'follow', 'fall', 'deadA', 'deadB'], change),
                    [base, u['styleRefs'][0]],
                    'emberSkirmisher back sheet (stand-in re-roll: nb21 edit of r1 with 5 cells laid in, darker, no green)'))

    # ---- Heavy Infantry back: its r2 sheet (12/15) with recoil and both dead cells laid in
    u = BY['heavyInfantry']
    base = t2_base.build(B('hi.back.mixed.png'), 'magenta', sh('r2.heavyInfantry.back.dress'), 'heavyInfantry', 'back', 'melee',
                         [('recoil', sh('r1.archer.back'), 'archer', 'recoil', None),
                          ('deadA', sh('r1.lightInfantry.back'), 'lightInfantry', 'deadA', None),
                          ('deadB', sh('r2.berserker.back.dress'), 'berserker', 'deadB', ('grey', 15, 60))], report=rep)
    change = ('In the laid-in cells he wears his full kit: the long mail hauberk with steel plates, the broad-brimmed iron '
              'kettle hat over a mail coif, the long undyed grey surcoat, the long kite shield (its back toward us, wood, rim '
              'and straps, on the same arm as in the other cells) and the straight arming sword; in the dead cells the shield '
              'and sword lie by him.')
    jobs.append(job('heavyInfantry', 'back', 'mixed', mixed_prompt(u, 'back', ['recoil', 'deadA', 'deadB'], change),
                    [base, u['styleRefs'][0]],
                    'heavyInfantry back sheet (stand-in re-roll: nb21 edit of r2 with recoil, deadA, deadB laid in)'))

    # ---- Longbow Hunter back: its r2 sheet (13/15, consistency 12.7) with recoil and cheer laid in from the Archer back
    u = BY['longbowHunter']
    base = t2_base.build(B('lbh.back.mixed.png'), 'magenta', sh('r2.longbowHunter.back.dress'), 'longbowHunter', 'back', 'archer',
                         [('recoil', sh('r1.archer.back'), 'archer', 'recoil', ('tint', GREEN)),
                          ('cheer', sh('r1.archer.back'), 'archer', 'cheer', ('tint', GREEN))], report=rep)
    change = ('One more change: his hooded cloak, hood and surcoat are the same deep bottle green in every cell, the windup '
              'cell (row 2, column 3) included, where they must be neither lighter, greyer nor more yellow than in the first '
              'cell. The laid-in figures get the long yew bow (in the cheer cell raised in his hand), the quiver, the long '
              'green hooded cloak with its ragged leaf-cut hem and the hood up.')
    jobs.append(job('longbowHunter', 'back', 'mixed', mixed_prompt(u, 'back', ['recoil', 'cheer'], change), [base, u['styleRefs'][0]],
                    'longbowHunter back sheet (stand-in re-roll: nb21 edit of r2 with recoil and cheer laid in, one green)'))

    json.dump(jobs, open(os.path.join(JOBS, 'a.json'), 'w'), indent=1)
    json.dump(rep, open(os.path.join(BASES, 'bases.json'), 'w'), indent=1)
    for j in jobs:
        assert not BANNED.search(open(j['promptFile']).read())
        print(j['job'], j['route'], os.path.basename(j['refs'][0]), os.path.exists(j['out']))


if __name__ == '__main__':
    main()
