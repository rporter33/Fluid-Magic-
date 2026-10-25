# Prompt changes between pilot rounds, from the art director's review of the round before (pilot.md records why).
# r2 (after r1): Nano Banana 2.1 (nb21) painted in the portraits' hand but ignored the camera for people and the
#   wolf rider (all-cell camera follow 10/15, 8/15, 0/16); Nano Banana Pro (g3pro) followed the camera (15/15, 14/15,
#   14/16) but painted flatter, with bare clay-grey arms (the kit's "ash-grey skin") and one cell turned the wrong
#   way. Side colour failed everywhere in front: brown wooden shields (7 to 8%); the wolf riders' greens were
#   blackish (0.3 to 0.4%). The Salamander (nb21) matched its portrait at the right camera in both views.
#   Changes: (1) the kits move the side colour onto what a front view sees from above (solid shield faces, a shoulder
#   mantle, a wolf's chest cloth) and name the green as a clean mid pine green; (2) armoured sleeves hide most skin;
#   (3) one facing for every cell, said twice; (4) a detail paragraph; (5) a two-step job: nb21 repaints the r1 Pro
#   sheet (camera and poses kept, the portraits' hand added); (6) nano-banana-pro-preview tried on the two sheets
#   whose nb21 attempt failed the camera, as the brief asks.
# r3 (after r2): see R3_NOTES below.
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..'))
RAW = os.path.join(ROOT, 'pilot', 'raw')

CW_OLD_CAPE = ('a short dull ember-orange cape over both shoulders down to the shoulder blades, a dull ember-orange '
               'tabard over the scales from the chest to mid-thigh, front and back, a round wooden shield whose face is '
               'painted dull ember orange with a black flame sigil, with a dark iron rim and boss')
CW_NEW_CAPE = ('arms covered by dark iron scale sleeves and dark leather bracers so that almost no skin shows, a short '
               'dull ember-orange cloth mantle over both shoulders that covers the tops of the shoulders and the top of '
               'the chest in front and falls to the shoulder blades behind, a dull ember-orange tabard over the scales '
               'from the chest to mid-thigh, front and back, a round shield whose whole face is painted solid dull ember '
               'orange (#C4532C), with only a small black flame sigil at its centre, a thin dark iron rim and a dark iron '
               'boss; the shield face is the largest patch of colour on the figure')
WR_OLD = ('A Wolf Rider: the rider in bark armor with a deep pine-green hooded cloak (hood up) and a spear with a '
          'leaf-shaped head. The mount: a huge grey timber wolf, its shoulder as high as a man\'s chest, shaggy grey-brown '
          'fur darker along the spine, a deep pine-green saddle blanket over its back under a small bark saddle, a '
          'bark-plate harness across its chest.')
WR_NEW = ('A Wolf Rider: the rider in bark armor under a hooded cloak of clear deep pine green (#1F6A50), hood up, the '
          'cloak spread over his shoulders, back and the wolf\'s hindquarters, a pine-green tabard over his chest, and a '
          'spear with a leaf-shaped head. The mount: a huge grey timber wolf, its shoulder as high as a man\'s chest, '
          'shaggy grey-brown fur darker along the spine, a large pine-green saddle blanket edged with bark-brown leather '
          'that covers its back from the shoulders to the hips and hangs low on both flanks under a small bark saddle, '
          'and a pine-green quilted cloth bib over its chest under a narrow bark-plate harness. The green is a clean, '
          'clearly coloured mid-dark pine green, never blackish, olive or grey, so the rider reads as his side from far '
          'away.')
FACING = {
    'back': ('Facing, again: every figure in every one of the cells faces the same way, away from us toward the upper '
             'right, including the figure that is hit, the falling one and the fleeing ones; no face is seen anywhere on '
             'this sheet.'),
    'front': ('Facing, again: every figure in every one of the cells faces the same way, toward us and to the lower '
              'left, including the figure that is hit and the falling one; the fleeing figures alone turn away.'),
}
DETAIL = ('Detail: at full size each figure is a finished small painting, not a flat icon: individual iron scales with '
          'rusted edges and small bright highlights, rivets, leather straps and buckles, cloth folds and frayed hems, '
          'wood grain and dents on the shield, worn metal on the axe; varied, visible brush strokes. The values stay '
          'simple enough that the figure reads at 40 pixels: a light top (helm, shoulders, cloth) against darker legs.')


def restyle_prompt(src_desc, kit, view, fixes):
    return '\n'.join([
        'Image 1 is a finished game sprite sheet whose drawing is right: keep exactly its camera (high above, looking '
        'down at about 40 degrees), the direction every figure faces, every figure\'s pose, outline, size and position in '
        'its cell, the grid, and the flat pure green background.',
        'Images 2 and 3 are painted portraits from the same game: repaint every figure of Image 1 in their hand. Do not '
        'copy their dark backgrounds, their candlelight, their framing or the people in them.', '',
        f'Repaint {src_desc} as painterly oil on a wood panel: visible directional brushwork, a muted earthy palette of '
        'charcoal, ash grey, dull iron with rusted edges, leather and bone in which the side\'s dull ember-orange cloth '
        'is the one clear hue; soft painterly edges with small crisp highlights on metal and a thin bright rim of light '
        'along the upper-left edges. Outdoor daylight from the upper left, a cool fill on the lower right, no cast '
        'shadows. Not a cartoon: no cel shading, no thick outlines, no glossy 3D render.', '',
        f'The soldier, the same in every cell: {kit}', '',
        DETAIL, '', 'Changes to make while repainting: ' + fixes, '',
        FACING[view], '',
        'Background: one flat pure green (#00FF00) colour fills the whole image with no gradient, texture, floor or '
        'shadow; no green anywhere on the figures. Never: text, labels, grid lines, borders, a floor, cast shadows, '
        'blood, extra people, cropped or overlapping figures.'])


def revise(rnd, jobs):
    by = {j['job']: j for j in jobs}
    out = []
    if rnd == 'r2':
        for v in ('back', 'front'):
            j = dict(by[f'cw.{v}'])
            p = j['prompt'].replace(CW_OLD_CAPE, CW_NEW_CAPE)
            assert p != j['prompt']
            p = p.replace('cloth on the helmet crest, the shoulder cape, the tabard and the shield face.',
                          'cloth on the helmet crest, the shoulder mantle, the tabard and the whole shield face.')
            p = p.replace('Proportions and scale:', FACING[v] + '\n\n' + DETAIL + '\n\nProportions and scale:')
            j['prompt'] = p
            j['models'] = ['g3pro', 'nb21'] + (['nbpro'] if v == 'back' else [])
            out.append(j)
            kit = by[f'cw.{v}']['prompt'].split('The soldier: ')[1].split('\n')[0].replace(CW_OLD_CAPE, CW_NEW_CAPE)
            fixes = ('paint the arms in dark iron scale sleeves and leather bracers instead of bare grey skin; paint the '
                     'whole face of every shield solid dull ember orange with a small black flame sigil; make the '
                     'shoulder mantle and the tabard clearly dull ember orange')
            if v == 'back':
                fixes += ('; the knocked-back figure (row 3, column 1) shows its face in Image 1: repaint it seen from '
                          'behind like the others, with the same outline')
            out.append(dict(by[f'cw.{v}'], job=f'cw.{v}.rs', models=['nb21'],
                            prompt=restyle_prompt('every figure of Image 1, a Cinder Horde line warrior', kit, v, fixes),
                            refs=[os.path.join(RAW, 'r1', f'cw.{v}.g3pro.png')] + by[f'cw.{v}']['refs'][1:]))
        j = dict(by['wr.front'])
        p = j['prompt'].replace(WR_OLD, WR_NEW)
        assert p != j['prompt']
        p = p.replace("cloth on the wolf's saddle blanket, the rider's hood and cloak.",
                      "cloth on the wolf's saddle blanket and chest cloth, the rider's hood, cloak and tabard.")
        p = p.replace('Proportions and scale:', FACING['front'].replace('the fleeing figures alone turn away',
                      'the riderless wolves too') + '\n\nProportions and scale:')
        j['prompt'] = p
        j['models'] = ['g3pro', 'nb21', 'nbpro']
        out.append(j)
        rs = restyle_prompt('every figure of Image 1, a Thornwood wolf rider and his huge grey timber wolf', WR_NEW, 'front',
                            'make the rider\'s hood, cloak and tabard, the saddle blanket and the wolf\'s chest cloth a '
                            'clean, clearly coloured deep pine green (#1F6A50), large and unbroken; paint the wolf\'s fur '
                            'as thick, shaggy, brushed grey-brown fur')
        rs = rs.replace('flat pure green background', 'flat pure magenta background').replace(
            'one flat pure green (#00FF00) colour', 'one flat pure magenta (#FF00FF) colour').replace(
            'no green anywhere on the figures', 'no magenta, pink or purple anywhere on the figures').replace(
            "the side's dull ember-orange cloth", "the side's deep pine-green cloth").replace(
            'The soldier, the same in every cell', 'The rider and his wolf, the same in every cell').replace(
            'individual iron scales with rusted edges and small bright highlights, rivets,', 'overlapping bark plates, '
            'shaggy fur with brushed locks,').replace('wood grain and dents on the shield, worn metal on the axe',
                                                     'a worn wooden spear shaft and a leaf-shaped iron head')
        out.append(dict(by['wr.front'], job='wr.front.rs', models=['nb21'], prompt=rs,
                        refs=[os.path.join(RAW, 'r1', 'wr.front.g3pro.png')] + by['wr.front']['refs'][1:]))
        for v in ('back',):
            j = dict(by[f'sal.{v}'])
            p = j['prompt'].replace('dull obsidian-black scales with a fine net of dull ember-orange cracks between them',
                                    'dull obsidian-black scales with a fine net of dull ember-orange cracks between them '
                                    'that shows clearly over the whole back, the neck and the tail (thin dull lines, never '
                                    'glowing, never bright orange)')
            p = p.replace('a pale healed scrape across the snout.', 'a pale healed scrape across the snout; seen from '
                          'behind and above, the broad flat head, the horn nubs along the jaw and the three brow knobs '
                          'still show at its edges.')
            p = p.replace('Light: outdoor daylight.', 'Light: outdoor daylight; the creature stays as dark as in its '
                          'portrait, its scales only lit by small cool and warm highlights, never washed orange.')
            assert p != j['prompt']
            j['prompt'] = p
            j['models'] = ['nb21', 'g3pro']
            out.append(j)
        j = dict(by['warden.bust'])
        j['prompt'] = j['prompt'].replace('One figure only. No hands, no weapons raised toward the face,',
                                          'One figure only. Nothing behind the head or the shoulders: no shield, no sword '
                                          'hilt, no spear, no hands,').replace(
            'a helm of bark plates with a crest of stiff deep pine-green leaves running front to back',
            'a rounded helm of overlapping bark plates (not a classical crested metal helmet) with a low crest of stiff '
            'deep pine-green leaves running front to back, the face open')
        j['models'] = ['nb21', 'g3pro']
        out.append(j)
        return out
    if rnd == 'r3':
        import pilot_round3
        return pilot_round3.revise(jobs)
    if rnd == 'r3x':  # the plan's one re-roll of a sheet that failed a check: the r3 Pro sheets that broke the camera
        import pilot_round3
        return [dict(j, models=['g3pro']) for j in pilot_round3.revise(jobs) if j['job'] in ('cw.front', 'wr.front')]
    if rnd == 'r3b':
        import pilot_round3
        return pilot_round3.revise_b(jobs)
    raise SystemExit(f'no revision for {rnd}')
