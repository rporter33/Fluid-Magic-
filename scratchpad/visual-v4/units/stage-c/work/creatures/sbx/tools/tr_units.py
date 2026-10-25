# Stage B troops ("troops"): the troop kits for production, written into the troops sandbox's units.json.
#   - review change 4: every troop kit carries a sleeveless surcoat of the side's cloth from the collar to just below
#     the knee (the maquette's `tabard` zone); the Berserker keeps his bare chest, painted with the side's war paint;
#   - review change 9: Thornwood cloth is named with the calibration's colour words ("deep bottle green ... jade"),
#     the packer's hue lock sets the hue;
#   - the four independent troop types (docs/03 "Independents": nation-neutral, grey and tan), looks from the
#     mockup's LOOKS table (src/40-figures.js), cloth #8C8A80 (docs/09), key magenta (plan 5.2).
# Usage: python3 tr_units.py   (rewrites ../units.json in place; idempotent)
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
P = '/home/user/Fluid-Magic-/art-source/portraits/'
ANCHOR = P + 'anchor-style.webp'
CINDER_SURCOAT = ('worn under a sleeveless surcoat of dull ember-orange cloth that covers his whole chest and belly from '
                  'the collar down to just below the knees, front and back, split at the front below the belt so the legs '
                  'can stride and held at the waist by a belt')
THORN_SURCOAT = ('worn under a sleeveless surcoat of deep bottle-green cloth that covers his whole chest and belly from '
                 'the collar down to just below the knees, front and back, split at the front below the belt so the legs '
                 'can stride and held at the waist by a belt')
GREY_SURCOAT = ('worn under a sleeveless surcoat of undyed grey wool that covers his whole chest and belly from the collar '
                'down to just below the knees, front and back, split at the front below the belt so the legs can stride '
                'and held at the waist by a belt')

KITS = {
    'ashMilitia': dict(
        gear={'weapon': 'spear', 'shield': None, 'helm': 'band', 'cape': True, 'tabard': True},
        kit=('An Ash Militia levy spearman: a quilted smoke-grey padded jack with patches, ' + CINDER_SURCOAT.replace('a belt', 'a knotted rope belt') +
             '; padded sleeves and wrapped forearms so that little skin shows; a plain dark iron skullcap wrapped with a dull '
             'ember-orange cloth band; a short dull ember-orange hooded shoulder cape (hood down) over both shoulders and the '
             'upper back; wrapped legs and soft boots; a long ash-wood spear with a leaf-shaped dark iron head. No shield, no '
             'horns. Poor and plain: patched, frayed, mismatched.'),
        sideZones='the long surcoat, the hooded shoulder cape and the cap band'),
    'berserker': dict(
        gear={'weapon': 'greataxe', 'shield': None, 'helm': 'wild', 'cape': False, 'bare': True, 'bulk': 1.15, 'tabard': True},
        kit=('A Berserker: a huge bare-chested ash-grey brute, broader than the other warriors, no shirt and no armour; his '
             'chest, belly, shoulders and upper back are daubed with thick dull ember-orange war paint in broad solid smeared '
             'patches (paint on his skin, not a garment), with black soot handprints over it; wild matted black hair bound up '
             'with dull ember-orange rags; a long ragged dull ember-orange kilt from the waist to the knees, belted with iron; '
             'a strip of black bear fur over one shoulder; iron arm rings; a massive two-handed jagged great axe with a crescent '
             'blade. No helmet, no shield, no horns. In the brace cell he beats his chest and roars instead.'),
        sideZones='the broad war paint on the chest, shoulders and upper back, the hair rags and the long kilt'),
    'flameArcher': dict(
        kit=('A Flame Archer: a padded smoke-grey jack, ' + CINDER_SURCOAT + '; leather bracers; a deep dull ember-orange '
             'hood worn up with a short hooded cape over the shoulders; a soot-black scarf over the lower face; a short recurve '
             'bow of dark horn; a leather quiver on the back with arrows whose heads are wrapped in black pitch-soaked rag; a '
             'long knife at the belt for melee. No horns. The arrow heads are not lit in the image (the game draws their '
             'flame); in the windup and strike cells the bow is slung on the back and the knife is in hand.'),
        sideZones='the raised hood, the hooded shoulder cape and the long surcoat'),
    'emberSkirmisher': dict(
        kit=('An Ember Skirmisher, a light runner: a sleeveless dull ember-orange tunic from the collar down to just above '
             'the knees, front and back, belted with dark leather; a wide dull ember-orange scarf wound over the head and around '
             'the shoulders with two long tails flying behind; lean arms and legs whose ash-grey skin is blackened with soot, '
             'painted as living skin with warm lights and cool shadows, never as grey clay; dark charcoal cloth wrapped '
             'tightly round the forearms and from the knees to the ankles; a dark leather harness across the chest; a '
             'bundle of three short iron-tipped javelins in the off hand and one ready in the throwing hand; a long knife at '
             'the belt (in the windup and strike cells the knife is in hand). No armour, no shield, no horns.'),
        sideZones='the head-and-shoulder scarf and its tails, and the long tunic'),
    'flamebrand': dict(
        kit=('A Flamebrand, a sacred warrior of the fire god: heavy blackened iron plate over scale with rusted edges on the '
             'arms and legs, ' + CINDER_SURCOAT.replace('a belt', 'a black iron-studded belt') + '; a tall closed dark iron '
             'helm topped by a crest of iron flames and a dull ember-orange plume; a long cape of the same ember-orange cloth '
             'from the shoulders to the backs of the knees; a straight longsword whose blade is wreathed in real flame, the '
             'only bright light on the figure. No shield, no horns. Taller and prouder than a warrior.'),
        sideZones='the plume, the long surcoat and the long cape'),
    'thornMilitia': dict(
        gear={'weapon': 'spear', 'shield': None, 'helm': 'hood', 'cape': True, 'tabard': True},
        kit=('A Thorn Militia levy spearman: a bark-brown leather jerkin, ' + THORN_SURCOAT.replace('a belt', 'a knotted rope belt') +
             '; a short deep bottle-green hooded cloak with the hood up, covering the shoulders and the upper back; padded '
             'sleeves and leather bracers; wrapped legs and soft boots; bark-brown weathered skin; a long dark hawthorn spear '
             'with a barbed head of bone and iron shaped like a great thorn. No shield, no antlers. Plain and poor.'),
        sideZones='the raised hood, the short cloak and the long surcoat'),
    'warden': dict(
        kit=('A Warden: layered bark plates on the shoulders, the arms and the legs, with leather bracers so that little skin '
             'shows; over the body armour a sleeveless surcoat of deep bottle-green cloth that covers his whole chest and belly '
             '(no bark plates over it) from the collar down to just below the knees, front and back, split at the front below '
             'the belt and held at the waist by a dark leather belt; a helm of bark plates with a tall crest of stiff deep green '
             'leaves running front to back, no antlers (antlers are a captain\'s mark, never a soldier\'s); a deep green mantle '
             'of overlapping cloth leaves thrown over both shoulders and the upper back; a round shield of bark-covered wood '
             'whose whole face is painted solid deep green with only a small pale blossom sigil at its centre and a thin '
             'bark-brown rim; a straight leaf-bladed sword; bark-brown weathered skin.'),
        sideZones='the leaf crest, the leaf mantle, the long surcoat and the shield face'),
    'briarGuard': dict(
        gear={'weapon': 'halberd', 'shield': None, 'helm': 'leaf', 'cape': True, 'bulk': 1.12, 'tabard': True},
        kit=('A Briar Guard, heavy infantry: thick armour of black-brown bark plates studded with short thorns on the '
             'shoulders, arms and legs; ' + THORN_SURCOAT.replace('worn under a', 'a').replace('a belt', 'a thorn-studded belt') +
             ', worn over the bark plates of the body; a closed bark helm crowned with a ring of thorns and a deep green leaf '
             'crest; a heavy deep bottle-green mantle across the shoulders and the upper back; a long halberd with a curved '
             'thorn-shaped blade, a back hook and a spike. No shield, no antlers. Big and broad.'),
        sideZones='the leaf crest, the heavy mantle and the long surcoat'),
    'longbowHunter': dict(
        kit=('A Longbow Hunter: a bark-brown leather jerkin, ' + THORN_SURCOAT + '; a deep bottle-green hooded cloak with '
             'the hood up, over the shoulders and down the back to the knees with a ragged leaf-cut hem; leather bracers; '
             'bark-brown weathered skin; a long yew bow about as tall as the hunter himself, held upright and close to his '
             'body; a quiver of grey-fletched arrows on the back; a hunting knife at the belt (in the windup and strike cells '
             'the bow is slung on the back and the knife is in hand). No antlers.'),
        sideZones='the raised hood, the long cloak and the long surcoat'),
}

NEW = [
    dict(id='lightInfantry', unit='lightInfantry', nation='independent', role='troop', body='infantry', layout='melee',
         gear={'weapon': 'spear', 'shield': 'round', 'helm': 'kettle', 'cape': True, 'tabard': True},
         kit=('A Light Infantry levy of the free villages, sworn to no nation: a padded jack of undyed tan linen, ' + GREY_SURCOAT +
              '; padded sleeves and leather bracers; a plain rounded iron skullcap over a padded coif; a short grey wool '
              'shoulder cape; wrapped legs and soft boots; a long ash-wood spear with a leaf-shaped iron head; a small round '
              'wooden shield whose face is painted plain pale grey, with a thin iron rim and a boss. Plain, practical, worn; '
              'no colours but grey, tan, leather brown and iron.'),
         sideZones='the grey surcoat, the shoulder cape and the plain shield face',
         stats='hp 10, prot 2, Spear 3; line formation; size 1 (as Ash Militia with prot 2)', battles=[],
         styleRefs=[P + 'independent/independentCaptain-levy/01.webp', ANCHOR], key='magenta',
         weaponMotion='thrust: windup = spear drawn back at hip height, strike = a straight forward thrust, follow = the point dipping after the thrust',
         formation='line', track='troop', stage='B'),
    dict(id='heavyInfantry', unit='heavyInfantry', nation='independent', role='troop', body='infantry', layout='melee',
         gear={'weapon': 'sword', 'shield': 'kite', 'helm': 'kettle', 'cape': False, 'tabard': True, 'bulk': 1.05},
         kit=('A Heavy Infantry veteran of a free company, sworn to no nation: a long mail hauberk with dull steel plates at '
              'the shoulders, elbows and knees, ' + GREY_SURCOAT + '; a broad-brimmed iron kettle hat over a mail coif; steel '
              'gauntlets; a straight arming sword; a long kite-shaped shield whose face is painted plain pale grey, with an '
              'iron rim. Grim, heavy and well kept; no colours but grey, tan, leather brown and steel.'),
         sideZones='the grey surcoat and the plain shield face',
         stats='hp 11, prot 7, mor 10, Sword 4; heavy block; size 1', battles=[],
         styleRefs=[P + 'independent/independentCaptain-levy/04.webp', ANCHOR], key='magenta',
         weaponMotion='slash: windup = sword raised beside the head, strike = a diagonal slash, follow = blade low across the body',
         formation='heavy', track='troop', stage='B'),
    dict(id='archer', unit='archer', nation='independent', role='troop', body='infantry', layout='archer',
         gear={'weapon': 'bow', 'shield': None, 'helm': 'hood', 'cape': True, 'quiver': True, 'tabard': True},
         kit=('An Archer of the free villages, sworn to no nation: a padded jack of undyed tan linen, ' + GREY_SURCOAT +
              '; a grey wool hood worn up with a short shoulder cape; leather bracers; a short wooden hunting bow; a leather '
              'quiver of grey-fletched arrows on the back; a long knife at the belt (in the windup and strike cells the bow is '
              'slung on the back and the knife is in hand). No colours but grey, tan, leather brown and iron.'),
         sideZones='the hood, the shoulder cape and the grey surcoat',
         stats='Shortbow 5 (range 5, ammo 10); loose staggered lines; size 1', battles=[],
         styleRefs=[P + 'independent/independentCaptain-hunter/03.webp', ANCHOR], key='magenta',
         formation='archers', track='troop', stage='B'),
    dict(id='swampFighter', unit='swampFighter', nation='independent', role='troop', body='infantry', layout='melee',
         gear={'weapon': 'spear', 'shield': None, 'helm': 'hood', 'cape': True, 'tabard': True},
         kit=('A Swamp Fighter of the reed marshes, sworn to no nation: a short cape of woven dry straw-coloured reeds over '
              'the shoulders, a hood of undyed grey wool worn up, a padded jerkin of tan linen, ' + GREY_SURCOAT +
              '; forearms wrapped in strips of cloth; legs wrapped to the knee in mud-stained leather; a long fishing spear '
              'with a barbed iron head, its shaft bound with reed cord. No shield. The reeds are dry and tan, never green; no '
              'colours but grey, tan, straw, leather brown and iron.'),
         sideZones='the hood and the grey surcoat (the reed cape is tan)',
         stats='def 12, Spear 3, swampwalker; line formation; size 1', battles=[],
         styleRefs=[P + 'independent/independentCaptain-reedman/01.webp', ANCHOR], key='magenta',
         weaponMotion='thrust: windup = spear drawn back at hip height, strike = a straight forward thrust, follow = the point dipping after the thrust',
         formation='line', track='troop', stage='B'),
]


def main():
    path = os.path.join(HERE, '..', 'units.json')
    u = json.load(open(path))
    u['nations']['independent'] = dict(
        name='Independents', house=('a free fighter of the independent villages, sworn to no nation: weathered skin, '
                                    'undyed grey wool, tan linen, leather and plain iron'),
        cloth=dict(name='undyed grey wool', hex='#8C8A80', light='#AAA79C', dark='#5C5A54'), key='magenta',
        keylineShade='#4A4A44')
    by = {x['id']: x for x in u['units']}
    for k, v in KITS.items():
        for f, val in v.items():
            by[k][f] = val
    for n in NEW:
        if n['id'] in by:
            by[n['id']].update(n)
        else:
            u['units'].append(n)
    json.dump(u, open(path, 'w'), indent=1)
    print('troops:', [x['id'] for x in u['units'] if x.get('track') == 'troop'])


if __name__ == '__main__':
    main()
