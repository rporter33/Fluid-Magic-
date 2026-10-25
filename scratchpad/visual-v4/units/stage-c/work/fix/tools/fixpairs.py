# Stage C fix pass: before-and-after pairs of the battle and lineup shots (fixbattle.cjs and lineup_focus.cjs, run on the
# pre-fix pages and on the rebuilt ones), each pair cropped to its subject and set side by side, captioned.
# Writes stage-c/shots/fix/pair-*.png. Usage: python3 -I fixpairs.py
import os, sys
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
UNITS = os.path.abspath(os.path.join(HERE, '..', '..', '..', '..'))
D = os.path.join(UNITS, 'stage-c', 'shots', 'fix')
B, L = os.path.join(D, 'battle'), os.path.join(D, 'lineup')
FB = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 22)
FS = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 16)


def pair(a, b, title, sub, crop=None, out=None, scale=1.0):
    if not (os.path.exists(a) and os.path.exists(b)):
        print('missing', os.path.basename(a), os.path.basename(b)); return
    A, Bm = Image.open(a).convert('RGB'), Image.open(b).convert('RGB')
    if crop:
        fx = lambda im: im.crop(tuple(round(c * im.width / 1920 if i % 2 == 0 else c * im.height / 1080) for i, c in enumerate(crop)))
        A, Bm = fx(A), fx(Bm)
    if scale != 1.0:
        A = A.resize((round(A.width * scale), round(A.height * scale)), Image.LANCZOS); Bm = Bm.resize((round(Bm.width * scale), round(Bm.height * scale)), Image.LANCZOS)
    W = A.width + Bm.width + 12
    tw = lambda t, f: int(ImageDraw.Draw(Image.new('RGB', (4, 4))).textlength(t, font=f)) + 16
    W = max(W, tw(title, FB), tw(sub, FS))
    o = Image.new('RGB', (W, max(A.height, Bm.height) + 88), (28, 26, 23))
    d = ImageDraw.Draw(o)
    d.text((8, 6), title, font=FB, fill=(244, 238, 223)); d.text((8, 36), sub, font=FS, fill=(183, 173, 154))
    d.text((8, 62), 'before', font=FS, fill=(220, 212, 196)); d.text((A.width + 20, 62), 'after', font=FS, fill=(220, 212, 196))
    o.paste(A, (0, 88)); o.paste(Bm, (A.width + 12, 88))
    o.save(os.path.join(D, out)); print(out, o.size)


def main():
    C = (560, 240, 1360, 840)  # the middle of a 1920 x 1080 close shot
    pair(f'{B}/before-c-hornetSwarm-play-dpr1.png', f'{B}/after-c-hornetSwarm-play-dpr1.png', 'Fix 1 and R4: the Hornet Swarm at play zoom, battle c',
         'tier S, a man 28 px: the teal keyline speckle is gone; black-and-ochre wasps', crop=C, out='pair-01-hornets-play.png', scale=1.5)
    pair(f'{B}/before-c-hornetSwarm-top-dpr2.png', f'{B}/after-c-hornetSwarm-top-dpr2.png', 'Fix 1 and R4: the Hornet Swarm at the top zoom, DPR 2',
         'tier H: a fuzzy amber bee before, a hairless black-and-ochre wasp with smoky wings after', out='pair-01-hornets-top-dpr2.png', scale=0.75)
    pair(f'{B}/before-c-wolfRider-play-dpr1.png', f'{B}/after-c-wolfRider-play-dpr1.png', 'Fixes 2 and 7: the far-side Wolf Riders at play zoom, battle c',
         'harness front: one coat standing and moving, darker cloth, the rider at 74 px (37 wu)', crop=C, out='pair-02-wolfriders-play.png', scale=1.5)
    pair(f'{B}/before-c-wolfRider-top-dpr2.png', f'{B}/after-c-wolfRider-top-dpr2.png', 'Fixes 2 and 7: the far-side Wolf Riders at the top zoom, DPR 2',
         'coat matched in the stand, recoil and fall cells; cloth L toward the Thornwood foot\'s', out='pair-02-wolfriders-top-dpr2.png', scale=0.75)
    pair(f'{B}/before-b-wolfRider-top-dpr1.png', f'{B}/after-b-wolfRider-top-dpr1.png', 'Fix 7: the near-side Wolf Riders beside the Thornwood foot, battle b',
         'the War Wolf now as big as a summoned Wolf; the rider 1.14x a foot man', crop=C, out='pair-07-wolfriders-b.png')
    pair(f'{B}/before-a-ashRider-top-dpr1.png', f'{B}/after-a-ashRider-top-dpr1.png', 'The Ash Riders in battle a (near side, back view: unchanged)',
         'their back view is not re-rolled; far-side Ash Riders (the R6 front) appear in no battle', crop=C, out='pair-09-ashriders-a.png')
    for k in ('a', 'b', 'c'):
        pair(f'{B}/before-{k}-deploy.png', f'{B}/after-{k}-deploy.png', f'Fix 11: battle {k} at deploy, with the HUD',
             'the Wolf Rider front control shows only where a Wolf Rider group can show its front', crop=(0, 0, 1920, 200), out=f'pair-11-control-{k}.png', scale=0.6)
    pair(f'{B}/before-a-greatWyrm-top-dpr1.png', f'{B}/after-a-greatWyrm-top-dpr1.png', 'Owner question 4: the Great Wyrm at the commander factor 1.15, battle a',
         'heightWu 213.2 -> 245.2 (front); long bodies keep their camera-true height (question 5)', out='pair-Q4-greatwyrm.png', scale=0.5)
    for k, u in (('b', 'treant'), ('c', 'salamander')):
        pair(f'{B}/before-{k}-hover-{u}.png', f'{B}/after-{k}-hover-{u}.png', f'Fix 12: the {u} card and hover, battle {k}',
             'the 128 px crop of its approved leader portrait (the battle record\'s 64 px card before)', out=f'pair-12-card-{u}.png', scale=0.5)
    for fid, v, t in (('oakheart', 'front', 'Fix 4 (R1): the Oakheart'), ('oakheart', 'back', 'Fix 4 (R1): the Oakheart'), ('hornetSwarm', 'front', 'R4: the Hornet Swarm'),
                      ('ashRider', 'front', 'Fix 9 (R6): the Ash Rider front'), ('wolfRider', 'front', 'Fixes 2 and 7: the Wolf Rider'),
                      ('treant-04', 'front', 'Fix 5 (R2): Treant 04'), ('treant-04', 'back', 'Fix 5 (R2): Treant 04'), ('treant-02', 'back', 'Fix 5 (R2): Treant 02'),
                      ('ascendedHero-cinderHorde', 'front', 'Fix 6 and Q4: the Ascended Hero'), ('ascendedHero-cinderHorde', 'back', 'Fix 6 and Q4: the Ascended Hero'),
                      ('wildSpirit-thornwood', 'back', 'Fix 5 (R3): the Wild Spirit'), ('ashColossus-cinderHorde', 'front', 'Fix 8 (R5): the Ash Colossus'),
                      ('ashColossus-cinderHorde', 'back', 'Fix 8 (R5): the Ash Colossus'), ('livingMonolith-cinderHorde', 'front', 'Fix 12 (R7): the Living Monolith'),
                      ('livingMonolith-thornwood', 'front', 'Fix 12 (R7): the Living Monolith, Thornwood'), ('hornedHunter-thornwood', 'back', 'Fix 12: the Horned Hunter'),
                      ('wolf', 'front', 'Fix 12: the summoned Wolf')):
        pair(f'{L}/before-focus-{fid}-{v}-dpr2.png', f'{L}/after-focus-{fid}-{v}-dpr2.png', f'{t}, {v} view: the lineup focused, DPR 2',
             'fix 10: tier H above 2 device px a wu (before: tier S magnified), the approved portrait beside the figure, a commander beside the man',
             out=f'pair-10-lineup-{fid}-{v}.png', scale=0.5)
    SH, SH0 = os.path.join(UNITS, 'stage-c', 'shots'), os.path.join(UNITS, 'stage-c', 'pre-fix', 'units', 'stage-c', 'shots')
    for f, t in (('size1-2', 'sizes 1 and 2: a commander (32 wu) after each man; riders by body height; gods x1.15'), ('size3-4', 'sizes 3 and 4: Treant crowns completed, corrected gods'),
                 ('size5-6', 'sizes 5 and 6: the Ash Colossus, the Living Monolith\'s mound'), ('all-back', 'all figures, back view')):
        pair(f'{SH0}/lineup-1440-{f}.png', f'{SH}/lineup-1440-{f}.png', f'Fix 10: the lineup at 1440 x 900, {f}', t, out=f'pair-10-lineup-{f}.png', scale=0.6)


if __name__ == '__main__':
    main()
