# The full M1 inventory for painted art (art plan section 3): every troop type, commander, summon, monster,
# pretender body (all sixteen chassis) and mount, with its approved portraits, its review track and its stages.
# Sources: src/content/units/*.ts, docs/03-nations.md, docs/05-pretender.md, docs/design/units-and-items.md (A.3, A.4,
# A.11), docs/design/pretender-and-magic.md (A.4, B.3), docs/12 S2.2. Portrait counts are read from the repo.
# Usage: python3 inventory.py   (writes ../inventory.json and ../inventory.md)
import glob, json, os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..'))
REPO = '/home/user/Fluid-Magic-'
UNITS = json.load(open(os.path.join(ROOT, 'units.json')))
inbattles = {}
for u in UNITS['units']:
    inbattles.setdefault(u['unit'], set()).update(u.get('battles', []))


def faces(nation, unit):
    fs = sorted(f for f in glob.glob(f'{REPO}/src/assets/raster/portraits/{nation}/{unit}/[0-9][0-9].webp'))
    return len(fs)


def stage_of(uid, track):
    P = UNITS['pilot']
    for fid in P['core']:
        if fid.split('-')[0] == uid:
            return 'A (pilot)'
    for fid in P['second']:
        if fid.split('-')[0] == uid:
            return 'A (pilot, second wave)'
    return 'B' if track in ('troop', 'commander') else 'C'


T, C_, S, M, G, MT = 'troop', 'commander', 'summon', 'monster', 'god', 'mount'
# id, name, nation, kind, size, body plan / rig, formation or role, layout, notes
ROWS = [
    # ---------------- Cinder Horde troops
    ('ashMilitia', 'Ash Militia', 'cinderHorde', T, 1, 'biped', 'line', 'melee', 'spear; provincial defense'),
    ('cinderWarrior', 'Cinder Warrior', 'cinderHorde', T, 1, 'biped', 'heavy', 'melee', 'axe, round shield'),
    ('emberSkirmisher', 'Ember Skirmisher', 'cinderHorde', T, 1, 'biped', 'screen', 'thrower', 'javelins, knife'),
    ('flameArcher', 'Flame Archer', 'cinderHorde', T, 1, 'biped', 'archers', 'archer', 'fire arrows (flame drawn by the game)'),
    ('berserker', 'Berserker', 'cinderHorde', T, 1, 'biped', 'shock', 'melee', 'great axe; never routs (flee cells replaced)'),
    ('ashRider', 'Ash Rider', 'cinderHorde', 'mounted troop', 2, 'rider (horse)', 'wedge', 'cavalry', 'lance, sword; rides the Ash Horse'),
    ('flamebrand', 'Flamebrand', 'cinderHorde', T, 1, 'biped', 'heavy', 'melee', 'sacred; burning blade'),
    # ---------------- Thornwood troops
    ('thornMilitia', 'Thorn Militia', 'thornwood', T, 1, 'biped', 'line', 'melee', 'boar spear; provincial defense'),
    ('warden', 'Warden', 'thornwood', T, 1, 'biped', 'heavy', 'melee', 'sword, round shield'),
    ('longbowHunter', 'Longbow Hunter', 'thornwood', T, 1, 'biped', 'archers', 'archer', 'yew longbow'),
    ('briarGuard', 'Briar Guard', 'thornwood', T, 1, 'biped', 'heavy', 'melee', 'halberd, thornplate'),
    ('wolfRider', 'Wolf Rider', 'thornwood', 'mounted troop', 2, 'rider (wolf)', 'wedge', 'wolfrider', 'spear; rides the War Wolf, which bites'),
    ('oakheart', 'Oakheart', 'thornwood', 'troop (creature-like)', 2, 'biped (wood)', 'heavy', 'melee', 'sacred; "a walking oak under thornplate": reviewed on the creature track'),
    # ---------------- independents
    ('lightInfantry', 'Light Infantry', 'independent', T, 1, 'biped', 'line', 'melee', 'spear'),
    ('heavyInfantry', 'Heavy Infantry', 'independent', T, 1, 'biped', 'heavy', 'melee', 'sword, mail'),
    ('archer', 'Archer', 'independent', T, 1, 'biped', 'archers', 'archer', 'shortbow'),
    ('swampFighter', 'Swamp Fighter', 'independent', T, 1, 'biped', 'line', 'melee', 'spear; swampwalker'),
    # ---------------- summons and monsters
    ('fireSprite', 'Fire Sprite', 'cinderHorde', S, 1, 'sprite (flier)', 'cloud', 'sprite', 'Call Fire Sprites; Kindle the Host; the Cinder Idol\'s monthly sprites'),
    ('hornetSwarm', 'Hornet Swarm', 'thornwood', S, 1, 'swarm (flier, 12 dots a figure)', 'cloud', 'hornet', 'Swarm spell'),
    ('wolf', 'Wolf', 'common', S, 1, 'quadruped', 'pack', 'beast', 'Call of the Wild; Call the Hunt; Mother of Beasts; independents'),
    ('giant', 'Giant', 'independent', M, 4, 'biped (giant)', 'body', 'monster', 'club; independent monster'),
    # ---------------- commanders (approved leader portraits)
    ('cinderScout', 'Scout (Cinder)', 'cinderHorde', C_, 1, 'biped', 'commander', 'commander', 'dagger; stealthy'),
    ('ashChieftain', 'Ash Chieftain', 'cinderHorde', C_, 1, 'biped', 'commander', 'commander', 'axe; banner'),
    ('pyrePriest', 'Pyre Priest', 'cinderHorde', C_, 1, 'biped', 'commander', 'commander', 'staff; blesses'),
    ('emberAdept', 'Ember Adept', 'cinderHorde', C_, 1, 'biped', 'commander', 'commander', 'staff; casts'),
    ('cinderMagus', 'Cinder Magus', 'cinderHorde', C_, 1, 'biped', 'commander', 'commander', 'staff; casts'),
    ('salamander', 'Salamander', 'cinderHorde', 'summoned commander', 3, 'serpent (low lizard)', 'body', 'monster', 'Bind Salamander; fire breath, tail lash'),
    ('thornScout', 'Scout (Thornwood)', 'thornwood', C_, 1, 'biped', 'commander', 'commander', 'dagger; stealthy'),
    ('wardenCaptain', 'Warden Captain', 'thornwood', C_, 1, 'biped', 'commander', 'commander', 'sword, shield; banner'),
    ('grovePriest', 'Grove Priest', 'thornwood', C_, 1, 'biped', 'commander', 'commander', 'staff; blesses'),
    ('saplingDruid', 'Sapling Druid', 'thornwood', C_, 1, 'biped', 'commander', 'commander', 'staff; casts'),
    ('elderDruid', 'Elder Druid', 'thornwood', C_, 1, 'biped', 'commander', 'commander', 'staff; casts'),
    ('treant', 'Treant', 'thornwood', 'summoned commander', 4, 'treant', 'body', 'monster', 'Awaken Treant; crushing limbs, regenerates'),
    ('independentCaptain-hunter', 'Independent Captain (hunter)', 'independent', C_, 1, 'biped', 'commander', 'commander', 'sword, shield'),
    ('independentCaptain-levy', 'Independent Captain (levy)', 'independent', C_, 1, 'biped', 'commander', 'commander', 'sword, shield'),
    ('independentCaptain-mountaineer', 'Independent Captain (mountaineer)', 'independent', C_, 1, 'biped', 'commander', 'commander', 'sword, shield'),
    ('independentCaptain-reedman', 'Independent Captain (reedman)', 'independent', C_, 1, 'biped', 'commander', 'commander', 'sword, shield'),
    # ---------------- mounts (units-and-items A.4: rider and mount are one Large body in M1)
    ('ashHorse', 'Ash Horse', 'cinderHorde', MT, 2, 'quadruped (horse)', 'mount', 'cavalry', 'no weapon; "bred to carry, not to fight"; ash-grey, soot mane'),
    ('warWolf', 'War Wolf', 'thornwood', MT, 2, 'quadruped (wolf)', 'mount', 'wolfrider', 'Wolf Bite 3; a huge grey timber wolf'),
]
# the sixteen chassis (docs/05 Step 1; pretender-and-magic A.4 looks, B.3 slots: variant 0 of each slot listed)
CHASSIS = [
    ('oracle', 'Oracle of the Flux', 'generic', 2, 'biped, floating 10 wu', 'mage', 'cowl; no mantle; orb staff head; runic robe glyphs; floating hem', False),
    ('titan', 'Titan', 'generic', 4, 'biped', 'leader', 'great helm; no mantle; straight great sword; plain armour', False),
    ('greatWyrm', 'Great Wyrm', 'generic', 6, 'wyrm (winged, flies)', 'monster', 'swept horns; smooth wing membranes; spade tail; banded scales; breath in the nation\'s colour', True),
    ('livingMonolith', 'Living Monolith', 'generic', 6, 'slab (immobile)', 'idol', 'no capstone; no overgrowth; no face; runic glyphs; rooted base', False),
    ('ascendedHero', 'Ascended Hero', 'generic', 2, 'biped', 'leader', 'circlet; long cape; straight blade; plain heraldry', False),
    ('primordial', 'Primordial', 'generic', 6, 'quadruped', 'monster', 'ram horns; moss back; club tail; mottled hide', False),
    ('ashColossus', 'Ash Colossus', 'R', 5, 'biped (ember)', 'fighter', 'brazier head; bare shoulders; bare fists; vein cracks; embers', False),
    ('ashPhoenix', 'Ash Phoenix', 'R', 3, 'wyrm without breath (flies)', 'raider', 'plume crest; fan plumage (wings); long tail; barred feathers; flame trail', True),
    ('pyreLord', 'Pyre Lord', 'R', 4, 'biped', 'summoner', 'flame crown; ember mantle; glaive; ash stripes', False),
    ('cinderIdol', 'Cinder Idol', 'R', 6, 'slab (immobile)', 'idol', 'brazier face; plinth base; soot-and-crack veins; glyphs; smoke', False),
    ('emberHierophant', 'Ember Hierophant', 'R', 2, 'biped', 'mage', 'mask; ember mantle; orb staff head; robe glyphs', False),
    ('wildSpirit', 'Wild Spirit', 'G', 2, 'spirit (beast)', 'raider', 'antlers; leaf ruff; wisps trail; stripes; translucent flicker', False),
    ('worldTree', 'World Tree', 'G', 6, 'treant (immobile)', 'idol', 'round canopy; no trunk face; no blossom; ridged bark; roots', False),
    ('hornedHunter', 'Horned Hunter', 'G', 4, 'biped', 'summoner', 'antlers; leaf mantle; leaf-blade spear; stripe warpaint', False),
    ('elderWyrm', 'Elder Wyrm', 'G', 6, 'serpent (wingless)', 'monster', 'crown of spines; moss back; club tail; scale pattern; no wings', False),
    ('motherOfBeasts', 'Mother of Beasts', 'G', 4, 'biped', 'summoner', 'bear-pelt cloak; antler crown; plain maul; warpaint', False),
]


def main():
    items = []
    for uid, name, nation, kind, size, body, form, layout, notes in ROWS:
        base = uid.split('-')[0]
        nat = nation if nation != 'common' else 'thornwood'
        nfaces = faces(nation if nation != 'common' else 'independent', uid if uid.startswith('independentCaptain') else base) if kind in (C_, 'summoned commander') else 0
        if kind in (C_,):
            track = 'commander'
        elif kind in ('troop', 'mounted troop') and not kind.startswith('mounted'):
            track = 'troop'
        elif kind == 'mounted troop':
            track = 'mount (figure waits for its mount\'s portrait)'
        elif kind == MT:
            track = 'mount'
        else:
            track = 'creature'
        portrait = (f'{nfaces} approved faces' if nfaces else
                    'none: a painted card bust in the portraits\' framing, made after its figure (stage B)' if track in ('troop',) else
                    'none: the rider\'s card bust after the figure; the mount\'s portrait is the Ash Horse / War Wolf row' if kind == 'mounted troop' else
                    'none: painted portrait in stage B, owner review 1')
        if kind == 'summoned commander':
            portrait = f'{nfaces} approved faces (owner review 1 passed); one figure per face, made from that face'
        figure_stage = stage_of(uid, 'troop' if track in ('troop', 'commander') else track)
        if track == 'troop' and figure_stage.startswith('A'):
            portrait = 'none: a painted card bust in the portraits\' framing, made after its figure (stage A)'
        if uid in ('salamander',):
            figure_stage = 'A (face 01, standing only); faces 02-04 in C'
        elif uid == 'treant':
            figure_stage = 'C (standing, all 4 faces); animation D'
        elif track.startswith('mount') or track == 'creature':  # portrait (B), standing figure (C), animation (D)
            figure_stage = 'C standing (after the portrait), D animation'
        items.append(dict(id=uid, name=name, nation=nation, kind=kind, size=size, body=body, formation=form, layout=layout,
                          notes=notes, track=track, portrait=portrait, portraitFaces=nfaces, figureStage=figure_stage,
                          inBattles=sorted(inbattles.get(base, []))))
    for cid, name, realm, size, rig, role, v0, breath in CHASSIS:
        palettes = ['cinderHorde', 'thornwood'] if realm == 'generic' else ['cinderHorde' if realm == 'R' else 'thornwood']
        for p in palettes:
            items.append(dict(id=f'{cid}-{p}', name=f'{name} ({"Cinder" if p == "cinderHorde" else "Thornwood"} palette)', nation=p,
                              kind='god', size=size, body=rig, formation='body', layout='monster', role=role, realm=realm,
                              look=f'variant 0 of every slot: {v0}', breath=breath, track='god', portraitFaces=0,
                              portrait='none: painted full-body portrait in the designer\'s portrait pose, stage B, owner review 1',
                              figureStage='C standing (after the portrait), D animation',
                              inBattles=sorted(inbattles.get(cid, [])) if p == 'thornwood' and cid == 'greatWyrm' else []))
    json.dump(dict(made='inventory.py', items=items), open(os.path.join(ROOT, 'inventory.json'), 'w'), indent=1)
    lines = ['| Id | Name | Kind | Size | Body | Approved portraits | Track | Figure | In battles |', '|---|---|---|---|---|---|---|---|---|']
    for it in items:
        lines.append(f"| `{it['id']}` | {it['name']} | {it['kind']} | {it['size']} | {it['body']} | {it['portrait']} | {it['track']} | {it['figureStage']} | {', '.join(it['inBattles']) or '—'} |")
    open(os.path.join(ROOT, 'inventory.md'), 'w').write('\n'.join(lines) + '\n')
    n = {}
    for it in items:
        n[it['track']] = n.get(it['track'], 0) + 1
    print(len(items), 'items', n, 'faces', sum(it['portraitFaces'] for it in items))


if __name__ == '__main__':
    main()
