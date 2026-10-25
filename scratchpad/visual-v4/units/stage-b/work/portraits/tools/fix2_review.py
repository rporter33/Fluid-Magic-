# Stage B fix2 (critique-resume fixes 2 and 6): the art director's judgement of the r3/r4 candidates, written after
# looking at each at full size, beside the rig maquettes (fix2/look/wyrm-vs-rig.png) and at 48/64 px
# (fix2/look/p1-p8-small.png, batch2.png, before-after-6.png). Merged into ad-review.json; older versions a new one
# supersedes are marked 'replaced'.
import json, os
W = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
T, F, H = True, False, 'partly'
BY = 'art director (stage B fix2)'
R = json.load(open(os.path.join(W, 'ad-review.json')))


def rv(key, verdict, note, marks=None):
    R[key] = dict(verdict=verdict, note=note, marks=marks or {}, by=BY)


def sup(key, note):
    old = R.get(key, {})
    R[key] = dict(old, verdict='replaced', note=(old.get('note', '') + ' ' + note).strip(), by=old.get('by', BY))


PM = {'huge curling ram\'s horns': T, 'moss back in the nation\'s colour': T, 'mottled brown hide': T, 'club tail': T}
sup('primordial-cinderHorde.01a.r2', 'Superseded by the corrected bull-head design (fix2 r3).')
sup('primordial-cinderHorde.01b', 'Superseded by the corrected bull-head design (fix2 r3).')
sup('primordial-thornwood.01a', 'Superseded: edit of the corrected r3 body (fix2).')
sup('primordial-thornwood.01b', 'Superseded: edit of the corrected r3 body (fix2).')
rv('primordial-cinderHorde.01a.r3', 'good', 'A heavy bull-bison face with a deep brow, furious small eyes, broad muzzle and shaggy beard, framed by the ridged ram\'s horns; the head is carried forward at chest height, well below the mossy hump; the studded club tail is raised and reads. The face is turned almost straight at us.', PM)
rv('primordial-cinderHorde.01b.r3', 'strong', 'The head hangs low and forward below the shoulder line like a bison\'s, bearded, ram\'s horns curling round the skull; massive body, ember lichen hump, studded club tail clear behind the haunches. Matches the quadruped maquette\'s low head.', PM)
rv('primordial-thornwood.01a.r3', 'good', 'Edit of the r3 body; the moss repainted bottle green (window 0.085, lock 0.22).', PM)
rv('primordial-thornwood.01b.r3', 'good', 'Edit of the r3 body; moss bottle green (window 0.055); read48 11.9 overridden (the same body read 12.3 in its Cinder palette).', PM)
IM = {'brazier face with a carved stern face': T, 'column of grey smoke': H, 'soot-crusted cracks': T, 'stepped plinth': T,
      'carved glyphs in ember-orange pigment': T}
sup('cinderIdol-cinderHorde.01a.r2', 'Superseded by the slab design that fits its rig (fix2 r3).')
sup('cinderIdol-cinderHorde.01b.r2', 'Superseded by the slab design that fits its rig (fix2 r3).')
rv('cinderIdol-cinderHorde.01a.r3', 'good', 'Now a standing slab like its maquette: no arms, no legs; a stern carved face in the upper front with coals glowing in the eyes and mouth, a gold-rimmed brazier of coals on top, two rows of ember glyphs and a glyph band on the stepped plinth. The slab is a little rounded and the face more naturalistic than flat. Side window 0.0299 overridden (the glyphs read ember at 64 px).', IM)
rv('cinderIdol-cinderHorde.01b.r3', 'replaced', 'A slab with a face as designed, but its smoke ran off the top edge (framing: top 0.0); re-rolled once (r4).')
rv('cinderIdol-cinderHorde.01b.r4', 'good', 'A squared granite slab broken at its top corner, a deeper-cut stern face, four rows of ember glyphs and a band on the plinth, a short wisp of smoke inside the frame; a real alternative to A, not a copy.', IM)
WM = {'crown of spines': T, 'moss back in the nation\'s colour': T, 'club tail': T, 'banded bronze scales': T, 'no wings': T}
sup('elderWyrm-thornwood.01a', 'Superseded: it sat up on its haunches, against its low serpent rig (fix2 r3).')
sup('elderWyrm-thornwood.01b', 'Superseded: upright chest and raised head, against its low serpent rig (fix2 r3).')
rv('elderWyrm-thornwood.01a.r3', 'good', 'Crawls low like the serpent rig: splayed legs, belly near the ground, head level and low, the long tail arching back to the upper right; crown of spines, green moss back, club tail. Its claws stand at about 0.90 (lowest-row override: the floor shadow reaches the edge) and read48 11.6 is overridden (reads on the 48 px board).', WM)
rv('elderWyrm-thornwood.01b.r3', 'replaced', 'The truest to the rig (a long, flat salamander body) but small in the square (top 0.15, lowest 0.77, fill 0.63); re-rolled once for the framing (r4).')
rv('elderWyrm-thornwood.01b.r4', 'good', 'Fills the square now, the tail club curling up near the top; long and low-slung, its height well under half its length, but it walks on straighter legs than the rig\'s splayed crawl, so the belly is clear of the ground. Body-fill 0.705 against 0.72 overridden.', WM)
sup('fireSprite.01b.r2', 'Superseded by the no-grin wording (fix2 r3).')
rv('fireSprite.01b.r3', 'good', 'No grin now: a wild flame face roaring with a ragged open mouth, swept-back flame hair and smoke; the ragged edge of the mouth reads a little like fangs and the face a little skull-like.',
   {'swept-back flame hair': T, 'two horn-like flame points': H, 'slanted dark eye-slits': T, 'ragged roaring mouth': T, 'no body or limbs': T})
sup('oakheart.01a.r2', 'Superseded by the no-nose wording (fix2 r3).')
rv('oakheart.01a.r3', 'weak', 'Better: no beard or moustache now, a heavy split block of bark under the thorned helm; but the grain still carves a straight nose and lidded eyes, so it still reads as a man in a wooden mask. The corrected design\'s one roll: reported, not rolled again. B remains the stronger Oakheart.',
   {'thorned bark helm': T, 'lobed oak leaves at the temples': T, 'dark knothole eyes': H, 'thorny pauldrons': T, 'bottle-green mantle': T, 'cord of acorns': T})
sup('livingMonolith-thornwood.01a.r2', 'Superseded by the every-glyph-filled edit (fix2 r3).')
rv('livingMonolith-thornwood.01a.r3', 'good', 'Same slab as the Cinder 01a r2; every glyph now filled bottle green (window 0.011, lock 0.11).',
   {'plain broken top, no capstone': T, 'carved runic glyphs filled with the nation\'s colour': T, 'no face': T, 'no overgrowth': T, 'root-gripped base': T})
rv('ascendedHero-cinderHorde.01b.r3', 'reject', 'Same failure as r2: the sword is held low at the side on a diagonal, not upright before the chest, and the figure is a near copy of r2. The corrected design\'s one roll: reported, not rolled again; r2 stays as candidate B, and its Thornwood edit (P13) was not made from a failing body.')
json.dump(R, open(os.path.join(W, 'ad-review.json'), 'w'), indent=1)
print(len(R))
