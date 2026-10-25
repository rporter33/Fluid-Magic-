# Sheet layouts and key poses. Each layout is a grid of named cells; every cell has a pose for the
# clay rig. The same names go into the prompts, the slicer and the atlas metadata.
import numpy as np

# ---- sheet layouts: (cols, rows, aspect, cells) ----
LAYOUTS = {
    'melee': (4, 4, '1:1', ['stand', 'idle2', 'marchA', 'marchB',
                            'windup', 'strike', 'follow', 'brace',
                            'recoil', 'fall', 'deadA', 'deadB',
                            'fleeA', 'fleeB', 'cheer', 'dropped']),
    'archer': (4, 4, '1:1', ['stand', 'marchA', 'marchB', 'nock',
                             'draw', 'loose', 'windup', 'strike',
                             'recoil', 'fall', 'deadA', 'deadB',
                             'fleeA', 'fleeB', 'cheer', 'dropped']),
    'thrower': (4, 4, '1:1', ['stand', 'runA', 'runB', 'aim',
                              'throw', 'follow', 'windup', 'strike',
                              'recoil', 'fall', 'deadA', 'deadB',
                              'fleeA', 'fleeB', 'cheer', 'dropped']),
    'commander': (4, 4, '1:1', ['stand', 'idle2', 'marchA', 'marchB',
                                'windup', 'strike', 'follow', 'recoil',
                                'actA', 'actB', 'fall', 'deadA',
                                'deadB', 'fleeA', 'fleeB', 'cheer']),
    'cavalry': (4, 4, '4:3', ['stand', 'walkA', 'walkB', 'gallopA',
                              'gallopB', 'charge', 'windup', 'strike',
                              'recoil', 'fall', 'deadA', 'deadB',
                              'boltA', 'boltB', 'cheer', 'dropped']),
    'wolfrider': (4, 4, '4:3', ['stand', 'lopeA', 'lopeB', 'leapA',
                                'leapB', 'charge', 'windup', 'strike',
                                'bite', 'recoil', 'fall', 'deadA',
                                'deadB', 'boltA', 'boltB', 'cheer']),
    'sprite': (4, 3, '4:3', ['wingUp', 'wingMid', 'wingDown', 'glide',
                             'dive', 'strike', 'recoil', 'burstA',
                             'burstB', 'mark', 'wingUp2', 'wingDown2']),
    # the Wolf (summon, independents) and stage C creatures of its kind; its guides arrive with stage C
    'beast': (4, 3, '4:3', ['stand', 'idle2', 'lopeA', 'lopeB',
                            'leapA', 'leapB', 'bite', 'howl',
                            'recoil', 'fall', 'deadA', 'deadB']),
    'hornet': (4, 3, '4:3', ['up0', 'down0', 'up90', 'down90',
                             'up180', 'down180', 'sting0', 'sting90',
                             'glide0', 'glide90', 'deadA', 'deadB']),
}

# what each cell is, in words, for the prompts (keyed by cell name; layouts may override)
CELL_WORDS = {
    'stand': 'standing ready, weight on both feet',
    'idle2': 'standing at ease, weight shifted onto one leg, head turned a little to one side',
    'marchA': 'marching: left foot forward in a long stride, right foot pushing off behind',
    'marchB': 'marching: right foot forward in a long stride, left foot pushing off behind',
    'runA': 'running: left foot forward, leaning forward',
    'runB': 'running: right foot forward, leaning forward',
    'windup': 'attack windup: the weapon drawn far back, body twisted and coiled',
    'strike': 'the strike: the weapon fully extended into the blow, lunging forward on the front foot',
    'follow': 'follow-through: the weapon swept past the target and low, body turned with the swing',
    'brace': 'braced: shield raised in front, knees bent, weapon cocked',
    'recoil': 'recoiling from a hit: knocked back, head snapped back, arms thrown out, one foot stepping back',
    'fall': 'falling backward, knees buckling, about halfway to the ground',
    'deadA': 'lying dead on the ground on its back, limbs loose',
    'deadB': 'lying dead on the ground face down, a different sprawl',
    'fleeA': 'fleeing in panic away from the enemy: running hard, weapon and shield dropped, looking back over the shoulder',
    'fleeB': 'fleeing: the other foot forward, arms pumping, looking back',
    'cheer': 'victory cheer: weapon raised high overhead, other fist raised, shouting',
    'dropped': 'no person: only the weapon and the shield lying flat on the ground, as dropped',
    'nock': 'nocking an arrow, the bow raised in front',
    'draw': 'full draw: bow arm straight toward the enemy, string pulled back to the cheek',
    'loose': 'the loose: the arrow just released, the drawing hand flying back past the ear, the bow arm still extended',
    'aim': 'aiming a javelin: the throwing arm cocked far back with a javelin, the other arm pointing at the target',
    'throw': 'throwing: the throwing arm whipped forward and up, the javelin just leaving the hand',
    'actA': 'commanding or casting, first beat (see the unit notes)',
    'actB': 'commanding or casting, second beat (see the unit notes)',
    'walkA': 'walking: the mount with one diagonal pair of legs forward',
    'walkB': 'walking: the other diagonal pair forward',
    'gallopA': 'galloping, fully extended: front legs reaching forward, hind legs stretched back',
    'gallopB': 'galloping, gathered: all four legs bunched under the body',
    'charge': 'the charge: the mount at full gallop, the rider leaning forward behind the couched weapon, aimed at the enemy',
    'boltA': 'the mount alone without its rider, bolting at a gallop, extended',
    'boltB': 'the mount alone without its rider, bolting at a gallop, gathered',
    'lopeA': 'the wolf loping, front paws reaching',
    'lopeB': 'the wolf loping, legs gathered',
    'leapA': 'the wolf leaping, front paws off the ground, the rider low',
    'leapB': 'the wolf landing from a leap, front paws down, hind legs high',
    'bite': 'the wolf biting: head lunged forward, jaws wide open, the rider holding on',
    'howl': 'howling: the head raised high, the muzzle to the sky',
    'wingUp': 'hovering, wings fully up', 'wingMid': 'hovering, wings level', 'wingDown': 'hovering, wings fully down',
    'glide': 'gliding forward, wings swept back', 'dive': 'diving steeply at a target, head first',
    'burstA': 'dying: the flame body breaking apart into large embers', 'burstB': 'dying: only a few small fading embers left',
    'mark': 'no creature: only a small blackened scorch mark on the ground', 'wingUp2': 'hovering, turned a little, wings up',
    'wingDown2': 'hovering, turned a little, wings down',
}

# ---- humanoid key poses (local angles; the same pose is used for the back and the front view) ----
H = {
    'stand': dict(rUA=(-70, 20), rFA=(-25, 5), w=(55, 10), lUA=(-70, -20), lFA=(-15, -25), shieldN=(0, -30)),
    'idle2': dict(roll=4, head=(5, -25), rUA=(-80, 15), rFA=(-60, 10), w=(-30, 10), lUA=(-75, -20), lFA=(-35, -20),
                  rTh=(-92, 10), rSh=(-90, 10), lTh=(-84, -8), lSh=(-90, -4), shieldN=(0, -40)),
    'marchA': dict(lean=7, rUA=(-70, 20), rFA=(-25, 5), w=(55, 10), lUA=(-60, -20), lFA=(-15, -25),
                   lTh=(-60, -4), lSh=(-82, -4), rTh=(-112, 4), rSh=(-128, 4)),
    'marchB': dict(lean=7, rUA=(-80, 20), rFA=(-35, 5), w=(50, 10), lUA=(-75, -20), lFA=(-20, -25),
                   rTh=(-60, 4), rSh=(-82, 4), lTh=(-112, -4), lSh=(-128, -4)),
    'windup': dict(lean=-6, twist=30, rUA=(45, 50), rFA=(60, 160), w=(35, 175), lUA=(-40, -30), lFA=(0, -10),
                   rTh=(-100, 8), rSh=(-100, 6), lTh=(-75, -8), lSh=(-88, -6), shieldN=(0, 0)),
    'strike': dict(lean=18, twist=-20, rUA=(-5, 15), rFA=(-45, 0), w=(-55, 0), lUA=(-60, -40), lFA=(-30, -60),
                   lTh=(-55, -6), lSh=(-80, -6), rTh=(-118, 6), rSh=(-130, 6), shieldN=(0, -60)),
    'follow': dict(lean=20, twist=-35, rUA=(-55, -10), rFA=(-75, -40), w=(-70, -70), lUA=(-70, -50), lFA=(-40, -80),
                   lTh=(-60, -6), lSh=(-82, -6), rTh=(-115, 6), rSh=(-125, 6), shieldN=(0, -80)),
    'brace': dict(lean=10, crouch=0.05, rUA=(-25, 45), rFA=(15, 10), w=(55, 30), lUA=(-25, -15), lFA=(0, 15), shieldN=(0, 0),
                  lTh=(-70, -10), lSh=(-95, -6), rTh=(-105, 10), rSh=(-110, 8)),
    'recoil': dict(lean=-18, twist=18, head=(-25, 10), rUA=(-15, 75), rFA=(-10, 100), w=(20, 110), lUA=(-25, -80), lFA=(-15, -110),
                   rTh=(-110, 8), rSh=(-112, 8), lTh=(-82, -6), lSh=(-92, -6), shieldN=(10, -90)),
    'fall': dict(_pitch=-50, crouch=0.08, head=(-20, 0), rUA=(25, 70), rFA=(30, 90), w=(40, 120), lUA=(20, -70), lFA=(20, -100),
                 rTh=(-60, 8), rSh=(-110, 8), lTh=(-70, -8), lSh=(-120, -8), shieldN=(30, -90)),
    'deadA': dict(_pitch=-90, head=(-10, 25), rUA=(0, 80), rFA=(-10, 110), w=(0, 150), lUA=(-15, -75), lFA=(-25, -60),
                  rTh=(-85, 18), rSh=(-80, 22), lTh=(-75, -10), lSh=(-95, -5), shieldN=(0, -90)),
    'deadB': dict(_pitch=88, _roll=10, head=(0, -40), rUA=(40, 50), rFA=(10, 20), w=(-10, 60), lUA=(-60, -40), lFA=(-80, -20),
                  rTh=(-70, 15), rSh=(-120, 15), lTh=(-95, -10), lSh=(-95, -10), shieldN=(0, -150)),
    'fleeA': dict(lean=22, head=(0, 55), rUA=(-40, 20), rFA=(10, 10), lUA=(-120, -20), lFA=(-150, -10),
                  lTh=(-45, -4), lSh=(-80, -4), rTh=(-120, 4), rSh=(-150, 4), _nogear=True),
    'fleeB': dict(lean=22, head=(0, 60), lUA=(-40, -20), lFA=(10, -10), rUA=(-120, 20), rFA=(-150, 10),
                  rTh=(-45, 4), rSh=(-80, 4), lTh=(-120, -4), lSh=(-150, -4), _nogear=True),
    'cheer': dict(lean=-5, head=(-25, 0), rUA=(65, 25), rFA=(80, 10), w=(85, 0), lUA=(40, -40), lFA=(75, -20), shieldN=(30, -60)),
    # archers
    'nock': dict(lUA=(-20, -10), lFA=(-5, -5), rUA=(-30, 40), rFA=(-10, -40), draw=0.3, rTh=(-95, 10), lTh=(-80, -8)),
    'draw': dict(twist=-15, lUA=(8, -5), lFA=(8, -5), rUA=(10, 120), rFA=(6, -70), draw=1.0, rTh=(-100, 12), rSh=(-95, 10), lTh=(-75, -10), lSh=(-88, -8)),
    'loose': dict(twist=-20, lUA=(8, -5), lFA=(8, -5), rUA=(15, 130), rFA=(20, 165), draw=0.0, rTh=(-100, 12), rSh=(-95, 10), lTh=(-75, -10), lSh=(-88, -8)),
    # javelin throwers
    'aim': dict(twist=35, lean=-5, rUA=(20, 140), rFA=(25, 170), w=(10, 0), lUA=(5, -10), lFA=(5, -5), rTh=(-105, 10), rSh=(-105, 10), lTh=(-70, -8), lSh=(-85, -8)),
    'throw': dict(twist=-30, lean=20, rUA=(40, 10), rFA=(30, -10), w=(30, 0), lUA=(-70, -60), lFA=(-60, -80), lTh=(-55, -6), lSh=(-80, -6), rTh=(-120, 6), rSh=(-140, 6), _thrown=True),
    'runA': dict(lean=18, rUA=(-60, 20), rFA=(10, 0), w=(50, 5), lUA=(-120, -20), lFA=(-130, -10), lTh=(-45, -4), lSh=(-80, -4), rTh=(-120, 4), rSh=(-150, 4)),
    'runB': dict(lean=18, rUA=(-110, 20), rFA=(-120, 10), w=(40, 5), lUA=(-50, -20), lFA=(5, -10), rTh=(-45, 4), rSh=(-80, 4), lTh=(-120, -4), lSh=(-150, -4)),
    # commanders: rally (fighters) and cast (casters)
    'rallyA': dict(lean=-8, head=(-25, 0), rUA=(70, 15), rFA=(85, 0), w=(88, 0), lUA=(-20, -60), lFA=(-10, -90)),
    'rallyB': dict(lean=10, twist=-10, head=(-5, 0), rUA=(10, 5), rFA=(5, 0), w=(5, 0), lUA=(-70, -30), lFA=(-60, -40)),
    'castA': dict(lean=-6, head=(-20, 0), rUA=(60, 20), rFA=(80, 0), w=(85, 0), lUA=(40, -35), lFA=(60, -20)),
    'castB': dict(lean=14, rUA=(-5, 10), rFA=(10, 0), w=(15, 0), lUA=(-10, -25), lFA=(5, -10), lTh=(-60, -6), lSh=(-82, -6), rTh=(-112, 6), rSh=(-125, 6)),
    'blessA': dict(head=(-20, 0), rUA=(50, 25), rFA=(75, 5), w=(85, 0), lUA=(45, -40), lFA=(70, -30)),
    'blessB': dict(lean=-4, head=(-15, 0), rUA=(10, 85), rFA=(15, 90), w=(30, 90), lUA=(10, -85), lFA=(15, -90)),
}


def humanoid_pose(name, act=None):
    if name in ('actA', 'actB'):
        name = {'rally': 'rallyA', 'cast': 'castA', 'bless': 'blessA'}[act] if name == 'actA' else {'rally': 'rallyB', 'cast': 'castB', 'bless': 'blessB'}[act]
    return dict(H[name])


# ---- quadruped gaits: legs as ((thigh elev, azim), (shin elev, azim)), front legs fr/fl, hind br/bl ----
def leg(t, s):
    return ((t, 0), (s, 0))


Q = {
    'stand': dict(fr=leg(-90, -90), fl=leg(-90, -90), br=leg(-90, -90), bl=leg(-90, -90), neck=(38, 0), head=(-50, 0)),
    'walkA': dict(fr=leg(-70, -100), fl=leg(-105, -95), br=leg(-105, -80), bl=leg(-75, -90), neck=(40, 0), head=(-45, 0)),
    'walkB': dict(fr=leg(-105, -95), fl=leg(-70, -100), br=leg(-75, -90), bl=leg(-105, -80), neck=(40, 0), head=(-45, 0)),
    'gallopA': dict(fr=leg(-35, -60), fl=leg(-45, -70), br=leg(-140, -150), bl=leg(-130, -140), neck=(25, 0), head=(-35, 0), lift=0.06, tail=(-10, 180)),
    'gallopB': dict(fr=leg(-120, -60), fl=leg(-110, -80), br=leg(-50, -100), bl=leg(-60, -110), neck=(35, 0), head=(-50, 0), lift=0.1, pitch=-4, tail=(-25, 180)),
    'charge': dict(fr=leg(-30, -55), fl=leg(-40, -65), br=leg(-140, -150), bl=leg(-135, -145), neck=(15, 0), head=(-25, 0), lift=0.06, pitch=3, tail=(0, 180)),
    'recoil': dict(fr=leg(-40, -100), fl=leg(-50, -110), br=leg(-100, -80), bl=leg(-95, -85), neck=(70, 0), head=(-10, 0), pitch=22),
    'fall': dict(fr=leg(-140, -60), fl=leg(-130, -70), br=leg(-100, -80), bl=leg(-100, -85), neck=(10, 20), head=(-60, 30), pitch=-15),
    'dead': dict(fr=leg(-20, -40), fl=leg(-30, -50), br=leg(-160, -170), bl=leg(-150, -160), neck=(0, 30), head=(-10, 50), tail=(-5, 190)),
}
# the rider's pose on each mount pose
RIDER = {
    'stand': dict(rUA=(-60, 25), rFA=(-10, 5), w=(70, 5), lUA=(-60, -20), lFA=(-20, -10)),
    'walk': dict(rUA=(-60, 25), rFA=(-10, 5), w=(70, 5), lUA=(-60, -20), lFA=(-20, -10)),
    'gallop': dict(lean=10, rUA=(-50, 25), rFA=(0, 5), w=(55, 5), lUA=(-50, -20), lFA=(-10, -10)),
    'charge': dict(lean=22, rUA=(-55, 20), rFA=(-5, 0), w=(-3, 0), lUA=(-45, -20), lFA=(-10, -10)),
    'windup': dict(lean=-4, twist=30, rUA=(55, 45), rFA=(65, 150), w=(40, 175), lUA=(-50, -20), lFA=(-15, -10)),
    'strike': dict(lean=18, twist=-25, rUA=(-15, 30), rFA=(-50, 20), w=(-55, 15), lUA=(-50, -20), lFA=(-15, -10)),
    'thrust': dict(lean=18, twist=-10, rUA=(-15, 15), rFA=(-10, 0), w=(-15, 0), lUA=(-50, -20), lFA=(-15, -10)),
    'recoil': dict(lean=-20, head=(-20, 0), rUA=(10, 70), rFA=(20, 90), w=(50, 100), lUA=(0, -70), lFA=(10, -90)),
    'cheer': dict(lean=-5, head=(-20, 0), rUA=(65, 20), rFA=(80, 5), w=(87, 0), lUA=(30, -40), lFA=(70, -20)),
    'fall': dict(lean=-35, head=(-30, 0), rUA=(30, 70), rFA=(40, 90), w=(60, 120), lUA=(30, -70), lFA=(40, -90)),
}
