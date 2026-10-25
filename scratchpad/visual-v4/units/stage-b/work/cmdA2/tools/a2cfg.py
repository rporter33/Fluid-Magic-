# Stage B, key "cmdA2": shared settings. cmdA's sandbox tools are imported, never edited.
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
A2 = os.path.abspath(os.path.join(HERE, '..'))                                   # stage-b/work/cmdA2
STAGEB = os.path.abspath(os.path.join(A2, '..', '..'))
UNITS = os.path.abspath(os.path.join(STAGEB, '..'))
WA = os.path.join(STAGEB, 'work', 'cmdA')                                        # cmdA's work dir (faces/, bodies/, review/)
TOOLS_A = os.path.join(WA, 'sbx', 'tools')
RAW = os.path.join(STAGEB, 'raw', 'cmdA')
sys.path.insert(0, TOOLS_A)

# The battle faces (integrate/bundle-report.json "looks", Cinder): own kit (kits.json) in both views. AC06 is the
# owner-kept pilot face and pp01's kit is its portrait's own brazier (weaponChanged false, mantle from the portrait).
BATTLE = ['ac01', 'ac02', 'ac03', 'ac05', 'ac06', 'cm03', 'ea02', 'ea07', 'pp01', 'pp06']
OWN_KIT = ['ac01', 'ac02', 'ac03', 'ac05', 'cm03', 'ea02', 'ea07', 'pp06']
# own kit made but held back: the back view failed in both its kit rolls while the old-kit pair passes in both views,
# so the face keeps one kit (the old) in both views; its passing kit front waits on disk (faces/<f>.front.kit)
KIT_HELD_BACK = ['cm03', 'ea07', 'ea02']  # ea02: its passing kit back (on the old caster body) kept the body's cage head, not her ring staff

# Body overrides (cause fixes): the scout back rides the levy back body (cmda.VIEW_ROUTE already says so); the caster
# back is re-made from a passing adept back (see a2jobs.caster_back_body) and used for every new caster back re-dress.
CASTER_BACK_R2 = os.path.join(RAW, 'cmdCaster.back.body.r2.nb21.png')
CASTER_BACK_R2_DIR = os.path.join(WA, 'bodies', 'cmdCaster.back.r2')
CASTER_BACK_FALLBACK = os.path.join(RAW, 'ea05.back.redress.nb21.png')           # 15/16, follow and deadB right
CASTER_BACK_FALLBACK_DIR = os.path.join(WA, 'faces', 'ea05.back')

CELL_NO = {c: i + 1 for i, c in enumerate(['stand', 'idle2', 'marchA', 'marchB', 'windup', 'strike', 'follow', 'recoil',
                                           'actA', 'actB', 'fall', 'deadA', 'deadB', 'fleeA', 'fleeB', 'cheer'])}
CELL_SAY = dict(stand='standing ready', idle2='standing at ease', marchA='marching, left foot forward',
                marchB='marching, right foot forward', windup='the attack windup', strike='the strike',
                follow='the follow-through', recoil='recoiling from a hit', actA='the first act beat',
                actB='the second act beat', fall='falling', deadA='lying dead on the back', deadB='lying dead face down',
                fleeA='fleeing', fleeB='fleeing, the other foot forward', cheer='the victory cheer')
