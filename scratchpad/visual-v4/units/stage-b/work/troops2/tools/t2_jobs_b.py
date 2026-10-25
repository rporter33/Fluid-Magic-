# Stage B troops2, round b: the one re-roll of every round-a sheet that failed a gate, each with its failure named.
# What round a taught (looked at, base against result, review/a-pairs.png, review/fb-a.png):
#   - a whole re-dress keeps every figure's pose when the kit is close (Briar Guard back 14/15 from a spearman base);
#   - the "mixed" edit, which listed the cells, repainted the laid-in figures as the right soldier but in new poses
#     (Flamebrand back: exactly its four laid-in cells failed). Round b frames those bases as a re-dress ("repaint every
#     figure as this soldier, keeping each figure's pose and outline"), lists no cells, and lays each borrowed frame at
#     the size the maquette gives that cell (t2_base guide_scale);
#   - an edit of a sheet whose camera passed keeps its cells (the Longbow Hunter back: 15/15, only its laid-in hit cell
#     kept the archer's colours).
# Usage: python3 t2_jobs_b.py   (writes ../bases/b.*.png, ../prompts/b.*.txt, ../jobs/b.json)
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import t2_base  # noqa: E402
from tr_prompts import BY, BANNED  # noqa: E402
from tr_r2 import dress_prompt, edit_prompt  # noqa: E402
from t2_jobs import job, sh, BASES, JOBS, RAW, GREEN, ORANGE  # noqa: E402

W2 = os.path.abspath(os.path.join(HERE, '..'))
S2 = os.path.join(W2, 'sheets')
KEEP = ('Every figure keeps the outline of Image 1: the same silhouette, the same arms, legs and weapon in the same places, '
        'the same size and the same place in its cell; only the clothes, armour, skin and the weapon\'s own shape change. Do '
        'not re-pose any figure, even where its pose looks unusual for this soldier.')


def failed(prev, cells):
    return f'A previous attempt at this sheet failed: {prev}. ' + cells


def main():
    rep, jobs = {}, []
    B = lambda n: os.path.join(BASES, n)  # noqa: E731
    PREV = lambda n: os.path.join(RAW, f't2a.{n}.nb21.png')  # noqa: E731

    # ---- R15: Longbow Hunter front, the same base and guide; the bow's height named (draw, loose, hit and fall failed)
    u = BY['longbowHunter']
    a = json.load(open(os.path.join(JOBS, 'a.json')))
    ja = next(j for j in a if j['job'] == 'longbowHunter.front')
    p = open(ja['promptFile']).read()
    add = ('\n\nA previous attempt at this sheet was nearly right and failed in four cells only: in the draw and loose cells '
           '(row 2, columns 1 and 2) and in the hit and falling cells (row 3, columns 1 and 2) the long bow was painted much '
           'taller than the hunter, its upper tip far above his hood, so those figures no longer matched Image 1. This time '
           'the long bow is exactly as tall as the hunter himself in every cell: its upper tip level with the top of his hood '
           'and its lower tip at his ankles; in the draw and loose cells he holds it upright on his left side, at the same '
           'height, as the short bow is held in Image 1. ' + KEEP)
    p = p.replace('\n\nThe soldier:', add + '\n\nThe soldier:', 1)
    assert add in p and not BANNED.search(p)
    jobs.append(job('longbowHunter', 'front', 'dress', p, ja['refs'], 'R15 longbowHunter front sheet (re-roll of R14, failure named: '
                    'bow taller than the hunter in draw, loose, hit, fall)', rnd='b'))

    # ---- R16 re-roll: Briar Guard front as a whole re-dress of the Thorn Militia front R17 sheet (green, magenta key, every
    #      cell 0.65 or more on the Briar Guard maquette, no shield): the surcoat edit of its own r1 sheet lost 4 cells
    u = BY['briarGuard']
    base = os.path.join(RAW, 'r3.thornMilitia.front.edit.nb21.png')
    swap = ('He is now a big, broad heavy infantryman: the raised hood becomes a closed bark helm crowned with a ring of short '
            'thorns and a deep green leaf crest running front to back; his sleeves, bracers and wrapped legs become thick '
            'black-brown bark plates studded with short thorns on the shoulders, arms and legs; the short hooded cloak becomes '
            'a heavy deep bottle-green mantle across his shoulders; the long deep bottle-green surcoat stays over his chest and '
            'belly to just below the knees, held by a thorn-studded belt; the spear becomes a long halberd with a curved '
            'thorn-shaped blade, a back hook and a spike, held exactly where the spear is held. ' + KEEP)
    note = 'Image 1 shows a levy spearman of the same nation.'
    p = dress_prompt(u, 'front', swap, note)
    p = p.replace('Repaint every figure of Image 1', failed('the surcoat was added by an edit of another sheet and four cells '
                  'drifted from their poses', 'This time the base is a different sheet whose every pose is right.') + '\n\nRepaint every figure of Image 1', 1)
    jobs.append(job('briarGuard', 'front', 'dress', p, [base, u['styleRefs'][0]],
                    'R16 re-roll briarGuard front sheet (nb21 re-dress of the Thorn Militia front R17 sheet, failure named)', rnd='b'))

    # ---- R18 re-roll: Berserker back, the same base; the three drifted cells named
    u = BY['berserker']
    jb = next(j for j in a if j['job'] == 'berserker.back')
    p = open(jb['promptFile']).read()
    add = ('\n\n' + failed('three cells drifted from Image 1: the windup (row 2, column 1) raised the great axe high over his '
                           'head, and the hit cell (row 3, column 1) and the roar cell (row 4, column 1) changed their poses',
                           'This time the great axe lies along the line where the spear lies in every cell (in the windup '
                           'cell drawn back low beside his hip, its head behind him), and the hit and roar cells keep the pose '
                           'of Image 1 exactly. ' + KEEP))
    p = p.replace('\n\nThe soldier:', add + '\n\nThe soldier:', 1)
    assert add in p and not BANNED.search(p)
    jobs.append(job('berserker', 'back', 'dress', p, jb['refs'], 'R18 re-roll berserker back sheet (same base, windup, hit and roar named)', rnd='b'))

    # ---- Flamebrand back: the mixed base laid again at the maquette's sizes, framed as a re-dress (no cell list)
    u = BY['flamebrand']
    base = t2_base.build(B('b.fb.back.mixed.png'), 'green', sh('r1.flamebrand.back'), 'flamebrand', 'back', 'melee',
                         [('follow', sh('r1.ashMilitia.back'), 'ashMilitia', 'follow', None),
                          ('fall', sh('r2.berserker.back.dress'), 'berserker', 'fall', None),
                          ('deadA', sh('r1.lightInfantry.back'), 'lightInfantry', 'deadA', ('tint', ORANGE)),
                          ('deadB', sh('r2.berserker.back.dress'), 'berserker', 'deadB', None)], report=rep, guide_scale='flamebrand')
    swap = ('Most figures of Image 1 are already this soldier; four (row 2, column 3 and row 3, columns 2, 3 and 4) are other '
            'warriors of the same army. Repaint those four in his kit: the tall closed dark iron helm with its crest of iron '
            'flames and ember-orange plume, the heavy blackened plate, the long ember-orange surcoat and cape, no shield; the '
            'burning longsword where their weapon is (in the two dead cells it lies by the hand, its flame out). ' + KEEP)
    note = 'Image 1 shows this soldier in most cells.'
    p = dress_prompt(u, 'back', swap, note)
    p = p.replace('Repaint every figure of Image 1', failed('the figures in those four cells were repainted in new poses',
                                                             'Keep their poses this time.') + '\n\nRepaint every figure of Image 1', 1)
    jobs.append(job('flamebrand', 'back', 'dress', p, [base, u['styleRefs'][0]],
                    'flamebrand back sheet re-roll (re-dress framing of the r1 sheet with 4 cells laid in at maquette size)', rnd='b'))

    # ---- Ember Skirmisher back: the same, darker, no green
    u = BY['emberSkirmisher']
    base = t2_base.build(B('b.es.back.mixed.png'), 'green', sh('r1.emberSkirmisher.back'), 'emberSkirmisher', 'back', 'thrower',
                         [('throw', sh('r1.ashMilitia.back'), 'ashMilitia', 'follow', None),
                          ('follow', sh('r1.swampFighter.back'), 'swampFighter', 'follow', ('tint', ORANGE)),
                          ('fall', sh('r1.swampFighter.back'), 'swampFighter', 'fall', ('tint', ORANGE)),
                          ('deadA', sh('r1.lightInfantry.back'), 'lightInfantry', 'deadA', ('tint', ORANGE)),
                          ('deadB', sh('r2.berserker.back.dress'), 'berserker', 'deadB', None)], report=rep, guide_scale='emberSkirmisher')
    swap = ('Most figures of Image 1 are already this soldier; five (row 2, columns 1 and 2, and row 3, columns 2, 3 and 4) are '
            'other warriors of the same army. Repaint those five in his kit: the wide scarf over the head and shoulders with '
            'its two long tails, the long sleeveless tunic, the soot-blackened arms and legs, charcoal wraps, no shield, no '
            'helmet; a javelin where their weapon is. Paint every figure a little darker than Image 1: the tunic and scarf in '
            'the deep middle and shade tones of the ember orange, the skin heavily blackened with soot. Every javelin shaft is '
            'dark brown wood with an iron tip; the bundle of javelins is one tight dark bundle with no gaps; no green '
            'anywhere. ' + KEEP)
    note = 'Image 1 shows this soldier in most cells.'
    p = dress_prompt(u, 'back', swap, note)
    p = p.replace('Repaint every figure of Image 1', failed('the figures in those five cells were repainted in new poses, and '
                                                             'green background showed through the javelin bundles',
                                                             'Keep their poses this time.') + '\n\nRepaint every figure of Image 1', 1)
    jobs.append(job('emberSkirmisher', 'back', 'dress', p, [base, u['styleRefs'][0]],
                    'emberSkirmisher back sheet re-roll (re-dress framing of the r1 sheet with 5 cells laid in at maquette size)', rnd='b'))

    # ---- Heavy Infantry back: the same
    u = BY['heavyInfantry']
    base = t2_base.build(B('b.hi.back.mixed.png'), 'magenta', sh('r2.heavyInfantry.back.dress'), 'heavyInfantry', 'back', 'melee',
                         [('recoil', sh('r1.archer.back'), 'archer', 'recoil', None),
                          ('deadA', sh('r1.lightInfantry.back'), 'lightInfantry', 'deadA', None),
                          ('deadB', sh('r2.berserker.back.dress'), 'berserker', 'deadB', ('grey', 15, 60))], report=rep,
                         guide_scale='heavyInfantry')
    swap = ('Most figures of Image 1 are already this soldier; three (row 3, columns 1, 3 and 4) are other fighters. Repaint '
            'those three in his kit: the long mail hauberk with steel plates, the broad-brimmed iron kettle hat over a mail coif, '
            'the long undyed grey surcoat, the long kite shield (its back toward us) on his arm or lying by him, and the '
            'straight arming sword. ' + KEEP)
    note = 'Image 1 shows this soldier in most cells.'
    p = dress_prompt(u, 'back', swap, note)
    p = p.replace('Repaint every figure of Image 1', failed('the figures in those three cells were repainted in new poses',
                                                             'Keep their poses this time.') + '\n\nRepaint every figure of Image 1', 1)
    jobs.append(job('heavyInfantry', 'back', 'dress', p, [base, u['styleRefs'][0]],
                    'heavyInfantry back sheet re-roll (re-dress framing of the r2 sheet with 3 cells laid in at maquette size)', rnd='b'))

    # ---- Longbow Hunter back: an edit of its own round-a sheet (15/15): only the hit cell's colours
    u = BY['longbowHunter']
    change = ('Change only the figure in row 3, column 1 (the hunter hit from the front): it is painted in the wrong colours, '
              'with tan sleeves and a grey hood. Repaint it as the same hunter as every other cell: the deep bottle-green hood '
              'up, the long deep bottle-green hooded cloak with its ragged leaf-cut hem down his back, bark-brown leather '
              'sleeves and bracers, the long yew bow in his hand; keep its pose, outline, size and place exactly. Every other '
              'cell stays exactly as it is, and the cloak is the same deep bottle green in every cell.')
    jobs.append(job('longbowHunter', 'back', 'edit', edit_prompt(u, 'back', change), [PREV('longbowHunter.back.mixed'), u['styleRefs'][0]],
                    'longbowHunter back sheet re-roll (nb21 edit of its round-a sheet, 15/15: the hit cell\'s colours)', rnd='b'))

    json.dump(jobs, open(os.path.join(JOBS, 'b.json'), 'w'), indent=1)
    json.dump(rep, open(os.path.join(BASES, 'bases-b.json'), 'w'), indent=1)
    for j in jobs:
        assert not BANNED.search(open(j['promptFile']).read())
        print(j['job'], j['route'], os.path.basename(j['refs'][0]), os.path.exists(j['out']))


if __name__ == '__main__':
    main()
