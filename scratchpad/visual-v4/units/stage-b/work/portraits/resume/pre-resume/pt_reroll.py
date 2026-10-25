# Stage B portraits: the one re-roll a failing candidate gets (art plan 9, order 4: "re-rolled once with the failure
# named in the prompt; a second failure is reported, not re-rolled again"). Writes prompts/<job>.r2.txt and
# jobs-r2.json; run them with: pt_run.py JOB ... --jobs jobs-r2.json --tag r2, then pt_post.py JOB --raw RAW --tag r2.
# Failures come from checks/<job>.json (automatic gates) and from --note "JOB=text" (the art director's eye: a missing
# identity mark, the wrong facing, a cut-off head).
# Usage: python3 pt_reroll.py JOB [JOB ...] [--note JOB=TEXT ...]
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
W = os.path.abspath(os.path.join(HERE, '..'))

FIX = [
    ('framing: top', lambda j: ('the top of the subject must sit about 9% from the top edge, with nothing cut off by '
                                'the edge' if j['kind'] == 'bust' else 'the top of the figure must sit about 6% from '
                                'the top edge, with nothing cut off by the edge')),
    ('framing: lowest', lambda j: 'the whole figure must be inside the square: its feet or base about 94% from the top, '
                                  'with dark empty space below them'),
    ('framing: body fills', lambda j: 'the figure must fill the height of the square, from about 6% to about 94%'),
    ('framing: off centre', lambda j: 'the subject must be centred in the square'),
    ('background', lambda j: 'the background must be plain, unpatterned, very dark warm brown (#1C1A17), with no '
                             'objects, no ground and no light patches'),
    ('rim', lambda j: 'a thin, clear, warm rim light must run along the top and back edges of the whole silhouette, '
                      'separating it from the dark background'),
    ('read48', lambda j: 'the subject must be lit clearly by the candle light so that it stands out from the dark '
                         'background'),
    ('muted', lambda j: 'apart from the named cloth, nothing in the image may be a saturated colour'),
    ('side', lambda j: (f"the side's colour must show clearly and broadly on {j.get('tintZone') or 'the cloth'}: "
                        + ('dull ember-orange (#C4532C)' if j['nation'] == 'cinderHorde' else
                           'deep pine green (#1F6A50), a clear blue-green, never grey or olive'))),
]


def main(args):
    notes = {}
    while '--note' in args:
        i = args.index('--note'); k, v = args[i + 1].split('=', 1); notes[k] = v; del args[i:i + 2]
    jobs = {j['job']: j for j in json.load(open(os.path.join(W, 'jobs.json')))}
    p2 = os.path.join(W, 'jobs-r2.json')
    out = {j['job']: j for j in json.load(open(p2))} if os.path.exists(p2) else {}
    for jid in args:
        j = dict(jobs[jid])
        ck = os.path.join(W, 'checks', f'{jid}.json')
        fails = json.load(open(ck))['failed'] if os.path.exists(ck) else []
        lines = []
        for f in fails:
            for key, fn in FIX:
                if f.startswith(key):
                    lines.append(f'{fn(j)} (the previous attempt failed: {f})')
                    break
        if jid in notes:
            lines.append(notes[jid])
        base = open(j['promptFile']).read().rstrip()
        txt = base + '\n\nCorrections from the previous attempt, which must be fixed: ' + '; '.join(lines) + '.'
        pf = os.path.join(W, 'prompts', f'{jid}.r2.txt')
        open(pf, 'w').write(txt)
        j.update(promptFile=pf, reroll=dict(of=jid, failed=fails, note=notes.get(jid)))
        out[jid] = j
        print(jid, lines)
    json.dump(list(out.values()), open(p2, 'w'), indent=1)


if __name__ == '__main__':
    main(sys.argv[1:])
