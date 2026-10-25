# Stage B fix2 (critique-resume fixes 2 and 6): the r3 jobs, a corrected design for each subject that blocked the owner's
# pick (not a third roll of the same prompt). Writes prompts/<job>.r3.txt and jobs-r3.json.
#   P1, P2   primordial-cinderHorde.01a/b    the new bull-head design on the quadruped maquette
#   P3, P4   primordial-thornwood.01a/b      EDIT of P1, P2 (run after they are judged)
#   P5, P6   cinderIdol-cinderHorde.01a/b    the slab design, the slab maquette restored as Image 1
#   P7, P8   elderWyrm-thornwood.01a/b       the long, low serpent-rig design
#   P9       fireSprite.01b                  no grin
#   P10      oakheart.01a                    no nose, no beard
#   P11      livingMonolith-thornwood.01a    EDIT of livingMonolith-cinderHorde.01a r2, every glyph filled
#   P12      ascendedHero-cinderHorde.01b    its r2 prompt plus the upright-sword correction
#   P13      ascendedHero-thornwood.01b      EDIT of P12
# Run: PT_KEY='B fix2:' PT_CAP=30 python3 pt_run.py JOB ... --jobs jobs-r3.json --tag r3 --workers 2
# then pt_post.py JOB --raw RAW/<job>.r3.nb21.png --tag r3.
# Usage: python3 pt_r3.py [--edit-src JOB=PATH ...]   (an edit's source; default the r3 output of its Cinder job)
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
W = os.path.abspath(os.path.join(HERE, '..'))
SB = os.path.abspath(os.path.join(W, '..', '..'))
RAW = os.path.join(SB, 'raw', 'portraits')
import pt_prompts as PP  # noqa: E402  (importing it does not rebuild: build() runs only as __main__)

CORR = 'Corrections from the previous attempt, which must be fixed: '
NOTES = {
    'primordial-cinderHorde.01a': 'the head must be a heavy bull\'s or bison\'s head carried low and forward, below the '
                                  'line of the shoulders, never a sheep\'s or a ram\'s gentle face; the club tail must be '
                                  'clearly visible behind the haunches.',
    'primordial-cinderHorde.01b': 'the head must be a heavy bull\'s or bison\'s head carried low and forward, below the '
                                  'line of the shoulders, never a sheep\'s or a ram\'s gentle face, with a shaggy beard '
                                  'under the jaw; the body stays massive and heavy, never thin or goat-like; the club tail '
                                  'must be clearly visible behind the haunches.',
    'cinderIdol-cinderHorde.01a': 'the idol must be a standing slab like Image 1, with no arms, no legs, no shoulders and '
                                  'no seated body: its face is carved flat into the slab\'s upper front; the smoke must '
                                  'fade out well below the top edge; the glyph pigment must show clearly and broadly.',
    'cinderIdol-cinderHorde.01b': 'the idol must be a standing slab like Image 1, with no arms, no legs, no shoulders and '
                                  'no seated body: its face is carved flat into the slab\'s upper front, more worn and '
                                  'deeply cut than a fresh carving, the slab chipped and broken at its top corners; the '
                                  'smoke must fade out well below the top edge; the glyph pigment must show clearly and '
                                  'broadly.',
    'elderWyrm-thornwood.01a': 'the wyrm must be long and low, at most half as tall as it is long, its belly near the '
                               'ground and its head held low and level near the ground; never sitting up, rearing or '
                               'raising its chest and head high.',
    'elderWyrm-thornwood.01b': 'the wyrm must be long and low, at most half as tall as it is long, its belly near the '
                               'ground and its head held low and level near the ground; never sitting up, rearing or '
                               'raising its chest and head high.',
    'fireSprite.01b': 'no grin, no smile and no teeth: the mouth is only a ragged dark gap, open as if roaring; the face '
                      'is wild, never sly, cute or cartoon-like.',
    'oakheart.01a': 'the grain must not form a nose, a moustache, a beard or lips: below the dark knothole eyes the head is '
                    'one heavy, smooth, split block of bark like a war mask.',
    'ascendedHero-cinderHorde.01b': 'the straight sword must be held upright before the chest in the right hand, point '
                                    'up, the blade vertical, not held out to the side.',
}


def main(args):
    srcs = {}
    while '--edit-src' in args:
        i = args.index('--edit-src'); k, v = args[i + 1].split('=', 1); srcs[k] = v; del args[i:i + 2]
    jobs = {j['job']: j for j in json.load(open(os.path.join(W, 'jobs.json')))}
    out = []

    def put(jid, prompt, refs, **extra):
        j = dict(jobs[jid])
        pf = os.path.join(W, 'prompts', f'{jid}.r3.txt')
        open(pf, 'w').write(PP.safe(prompt))
        j.update(promptFile=pf, refs=refs, out=os.path.join(RAW, f'{jid}.nb21.png'),
                 reroll=dict(of=jid, tag='r3', why='critique-resume fix 2/6: corrected design'), **extra)
        out.append(j)

    for jid in ('primordial-cinderHorde.01a', 'primordial-cinderHorde.01b', 'cinderIdol-cinderHorde.01a',
                'cinderIdol-cinderHorde.01b', 'elderWyrm-thornwood.01a', 'elderWyrm-thornwood.01b', 'fireSprite.01b',
                'oakheart.01a'):
        base = open(jobs[jid]['promptFile']).read().rstrip()
        put(jid, base + '\n\n' + CORR + NOTES[jid], jobs[jid]['refs'])
    # P12: the r2 prompt (its framing correction kept) plus the sword correction
    jid = 'ascendedHero-cinderHorde.01b'
    base = open(os.path.join(W, 'prompts', f'{jid}.r2.txt')).read().rstrip()
    put(jid, base + '\n\n' + CORR + NOTES[jid], jobs[jid]['refs'])
    # the edits: the Thornwood palette of a Cinder body
    edits = {'primordial-thornwood.01a': ('primordial-cinderHorde.01a', None),
             'primordial-thornwood.01b': ('primordial-cinderHorde.01b', None),
             'ascendedHero-thornwood.01b': ('ascendedHero-cinderHorde.01b', None),
             'livingMonolith-thornwood.01a': ('livingMonolith-cinderHorde.01a',
                                              'the pigment in the carved glyphs, every glyph filled edge to edge')}
    defaults = {'livingMonolith-thornwood.01a': os.path.join(RAW, 'livingMonolith-cinderHorde.01a.r2.nb21.png')}
    for jid, (src, zone2) in edits.items():
        zone = zone2 or PP.GODS[jobs[jid]['unit']]['tint_words']
        p = PP.EDIT.format(zone=zone[0].upper() + zone[1:], zone2=zone)
        ref = srcs.get(jid) or defaults.get(jid) or os.path.join(RAW, f'{src}.r3.nb21.png')
        put(jid, p, [ref], after=src, route='edit of ' + os.path.basename(ref).replace('.nb21.png', ''))
    json.dump(out, open(os.path.join(W, 'jobs-r3.json'), 'w'), indent=1)
    for j in out:
        print(j['job'], [os.path.basename(r) for r in j['refs']])


if __name__ == '__main__':
    main(sys.argv[1:])
