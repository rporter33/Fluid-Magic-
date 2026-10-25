# The style references of every figure (art plan section 2.4): its own approved portrait where one exists (commanders,
# the Salamander and Treant faces), else the closest portrait of the same nation, plus the approved style anchor.
# Writes ../refs/style/style-refs.json and, for the pilot, ../refs/style/pilot-refs.png (guide back, guide front,
# portrait, anchor per figure).
# Usage: python3 style_refs.py
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..'))
UNITS = json.load(open(os.path.join(ROOT, 'units.json')))
ANCHOR = '/home/user/Fluid-Magic-/art-source/portraits/anchor-style.webp'
WHY = {
    'ashMilitia': 'scout 04: a poor levy in grey wool with a hood and cape, the militia\'s cloth and poverty',
    'cinderWarrior': 'chieftain 05: the plainest helm and dark scale of the chieftains, a line warrior\'s kit',
    'flameArcher': 'scout 03: hood, cape and scarf over the face, the archer\'s hooded look',
    'emberSkirmisher': 'scout 06: light runner\'s kit, soot-marked bare skin',
    'berserker': 'chieftain 06: the heavy bearded brute with the feather mantle, the closest to a fury-sworn warrior',
    'ashRider': 'chieftain 02: helm and plate of the riding clans',
    'flamebrand': 'pyre priest 06: the temple\'s iron and the god\'s fire, for a sacred warrior',
    'fireSprite': 'ember adept 02: the fire mages who summon it (palette only; it is a creature, portrait first)',
    'thornMilitia': 'scout 01: forest hood and cloak, the levy\'s look',
    'warden': 'warden captain 05: the bark plate and leaf cloak of the line Wardens',
    'briarGuard': 'warden captain 07: dark pine-bark scales, the heaviest Thornwood kit',
    'longbowHunter': 'scout 04: hooded forest hunter',
    'wolfRider': 'scout 02: hooded rider (the War Wolf gets its own portrait first)',
    'hornetSwarm': 'sapling druid 03: the druids who call it (palette only; a creature, portrait first)',
    'greatWyrm-thornwood': 'treant 03 for the Thornwood palette of bark, moss and dark scale (a god: portrait first)',
}


def main():
    out = {}
    for u in UNITS['units']:
        refs = u['styleRefs'] + ([ANCHOR] if ANCHOR not in u['styleRefs'] else [])
        own = bool(u.get('portrait'))
        out[u['id']] = dict(refs=refs, ownPortrait=own,
                            why='its own approved portrait (identity and style)' if own and u['role'] != 'monster' or u['id'] in ('salamander-01', 'treant-01')
                            else WHY.get(u['id'], 'closest portrait of the same nation'),
                            guide={v: f'refs/guides/{u["id"]}.{v}.png' if u['role'] != 'monster' else f'refs/guides/{u["id"]}.idle.{v}.png'
                                   for v in (['back'] if u.get('singleView') else ['back', 'front'])})
    os.makedirs(os.path.join(ROOT, 'refs', 'style'), exist_ok=True)
    json.dump(dict(anchor=ANCHOR, rule='own portrait where one exists, else the closest portrait of the same nation, plus the anchor; '
                   'troops never copy the person of a borrowed portrait, only its hand, palette and materials', figures=out),
              open(os.path.join(ROOT, 'refs', 'style', 'style-refs.json'), 'w'), indent=1)
    files = []
    P = UNITS['pilot']
    for fid in P['core'] + P['second']:
        e = out[fid]
        files += [os.path.join(ROOT, e['guide']['back']), os.path.join(ROOT, e['guide'].get('front', e['guide']['back'])), e['refs'][0], ANCHOR]
    subprocess.run([sys.executable, '-I', os.path.join(HERE, 'contact.py'), os.path.join(ROOT, 'refs', 'style', 'pilot-refs.png'), '220', '8'] + files, check=True)
    print(len(out), 'figures')


if __name__ == '__main__':
    main()
