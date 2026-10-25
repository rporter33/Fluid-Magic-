# The stage A pilot's generation jobs (the computed pilot brief, 2026-10-23): the Cinder Warrior (back and front
# sheets), the Wolf Rider (front sheet; a mount, generated here only as a pipeline probe: the War Wolf's own
# portrait comes first in stage B), the Salamander face 01 (the face battle c shows; back and front idle cutouts,
# with its approved portrait as the identity reference) and the Warden's card bust.
# Each piece is tried with two models per round; prompts change between rounds (ROUND_NOTES).
# Usage: python3 pilot_jobs.py ROUND [--only JOB,JOB] [--models m1,m2]   writes ../prompts/pilot/<round>.<job>.txt and
#        ../pilot/jobs-<round>.json (job, model, prompt file, refs, aspect, key, out). Run them with run_jobs.py.
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import make_prompts as M  # noqa: E402

ROOT = M.ROOT
REPO = M.REPO
ANCHOR = M.ANCHOR
G = os.path.join(ROOT, 'refs', 'guides')
P = REPO + '/art-source/portraits'
MODELS = {'nb21': 'gemini-nano-banana-2.1', 'g3pro': 'gemini-3-pro-image', 'nbpro': 'nano-banana-pro-preview'}
BYID = {u['id']: u for u in M.UNITS['units']}

# the Wolf Rider's cells, written for a mounted pair (the shared words are for a man on foot)
WOLF_CELLS = {
    'stand': 'the wolf standing square on all four paws, head up and ears forward; the rider sitting upright in the '
             'saddle, the spear held upright',
    'windup': 'the rider rising in the saddle, the spear drawn far back over the shoulder to thrust; the wolf '
              'crouched, about to spring',
    'strike': 'the rider thrusting the spear down and forward past the wolf\'s head; the wolf lunging',
    'recoil': 'hit: the rider knocked back in the saddle, arms thrown out; the wolf flinching sideways',
    'fall': 'the rider tumbling backward off the wolf\'s back; the wolf stumbling',
    'deadA': 'the wolf lying dead on its side, the rider lying dead beside it',
    'deadB': 'the wolf and the rider lying dead, a different sprawl',
    'cheer': 'the wolf with its head thrown up, howling; the rider raising the spear high overhead',
}


def wolf_prompt(view):
    u = dict(BYID['wolfRider'])
    u['cellOverrides'] = WOLF_CELLS
    p = M.sheet_prompt(u, view, M.refs_note_sheet(u))
    p = p.replace('16 full-length painted figures of one soldier', '16 full-length painted figures of one rider on '
                  'his wolf').replace('The same soldier, the same equipment', 'The same rider and the same wolf, the same '
                                      'equipment')
    p = p.replace('The soldier: ', 'The rider and his mount: ')
    p = p.replace("Standing upright, a figure is about 62% of its cell's height; lying figures are as long as the "
                  "standing ones are tall.",
                  "The wolf is a real, huge timber wolf in true proportion to its rider, not a horse and not a dog: "
                  "long legs, a deep narrow chest, a long muzzle, pointed ears, a bushy tail. A rider and his standing "
                  "wolf together are about 62% of the cell's height; riderless and lying figures keep the same scale.")
    p = p.replace('so that a packed block of these soldiers', 'so that a pack of these riders')
    return p


def bust_prompt_no_sheet():
    """The Warden's card bust before any Warden sheet exists: the anchor for the portrait template, a Thornwood
    leader portrait for the nation's materials only, the kit in words."""
    u = BYID['warden']
    p = M.bust_prompt(u)
    p = p.replace('Image 2 is the painted figure sheet of this soldier: the helmet, the cloth, the armour, the shield and '
                  'the weapon must be the ones in Image 2, seen close.',
                  'Image 2 is a painted portrait of a Thornwood leader from the same set, a reference for the nation\'s '
                  'materials only (bark plate, leaf cloth, weathered bark-brown skin): do not paint that person, and do '
                  'not give the soldier a leader\'s ornaments, crown, antlers or rich trim.')
    p = p.replace('which shows clearly on the shoulders and the headgear as on the figure.',
                  'which shows clearly on the shoulders (the leaf mantle), the tabard and the helm\'s leaf crest, so the '
                  'card reads as that side at a glance.')
    return p


def base_jobs():
    """Round 1: the plan's prompts as written (art plan section 9), each piece with two models."""
    cw, sal = BYID['cinderWarrior'], BYID['salamander-01']
    rp = lambda f: open(os.path.join(ROOT, 'prompts', f)).read()
    return [
        dict(job='cw.back', figure='cinderWarrior', view='back', aspect='1:1', key='green', prompt=rp('cinderWarrior.back.txt'),
             refs=[f'{G}/cinderWarrior.back.png', cw['styleRefs'][0], ANCHOR]),
        dict(job='cw.front', figure='cinderWarrior', view='front', aspect='1:1', key='green', prompt=rp('cinderWarrior.front.txt'),
             refs=[f'{G}/cinderWarrior.front.png', cw['styleRefs'][0], ANCHOR]),
        dict(job='wr.front', figure='wolfRider', view='front', aspect='4:3', key='magenta', prompt=wolf_prompt('front'),
             refs=[f'{G}/wolfRider.front.png', BYID['wolfRider']['styleRefs'][0], ANCHOR]),
        dict(job='sal.back', figure='salamander-01', view='back', action='idle', aspect='3:4', key='green',
             prompt=rp('salamander-01.idle.back.txt'), refs=[f'{G}/salamander-01.idle.back.png', sal['portrait']]),
        dict(job='sal.front', figure='salamander-01', view='front', action='idle', aspect='3:4', key='green',
             prompt=rp('salamander-01.idle.front.txt'), refs=[f'{G}/salamander-01.idle.front.png', sal['portrait']]),
        dict(job='warden.bust', figure='warden', view='bust', aspect='1:1', key=None, prompt=bust_prompt_no_sheet(),
             refs=[ANCHOR, f'{P}/thornwood/wardenCaptain/05.webp']),
    ]


def main():
    args = sys.argv[1:]
    rnd = args[0]
    only = models = None
    if '--only' in args:
        only = args[args.index('--only') + 1].split(',')
    if '--models' in args:
        models = args[args.index('--models') + 1].split(',')
    js = base_jobs()
    if rnd != 'r1':
        import pilot_rounds  # later rounds: prompt changes after the review of the round before
        js = pilot_rounds.revise(rnd, js)
    out = []
    for j in js:
        if only and j['job'] not in only:
            continue
        pf = os.path.join(ROOT, 'prompts', 'pilot', f'{rnd}.{j["job"]}.txt')
        os.makedirs(os.path.dirname(pf), exist_ok=True)
        bad = [w for w in ('total war', 'warhammer', 'dominions', 'age of wonders', 'riot') if w in j['prompt'].lower()]
        assert not bad, (j['job'], bad)
        with open(pf, 'w') as f:
            f.write(j['prompt'].rstrip() + '\n')
        for m in (models or j.get('models') or ['nb21', 'g3pro']):
            out.append(dict({k: v for k, v in j.items() if k not in ('prompt', 'models')}, round=rnd, model=MODELS[m], m=m,
                            promptFile=pf, out=os.path.join(ROOT, 'pilot', 'raw', rnd, f'{j["job"]}.{m}.png')))
    jf = os.path.join(ROOT, 'pilot', f'jobs-{rnd}.json')
    json.dump(out, open(jf, 'w'), indent=1)
    print(jf, len(out), 'generations')


if __name__ == '__main__':
    main()
