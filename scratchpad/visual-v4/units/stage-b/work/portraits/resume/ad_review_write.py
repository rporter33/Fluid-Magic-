# Stage B portraits, resume: the art director's judgement per candidate version (written by hand after looking at every
# candidate at full size, on the boards, and at 48 px beside the approved leader portraits). Keys: job, or job.r2.
import json, os, sys
P = sys.argv[1]
T, F, H = True, False, 'partly'
R = {}
def rv(key, verdict, note, marks=None):
    R[key] = dict(verdict=verdict, note=note, marks=marks or {}, by='art director (stage B portraits, resume)')
# creatures
rv('fireSprite.01a', 'strong', 'Flame face with hollow eyes, a gasp and a curl of smoke; the dark ground, warm light and oil hand of the leaders; reads at 48 px.',
   {'crown of tall licking flame tongues': T, 'dark hollow eye-holes': T, 'small open mouth': T, 'curl of grey smoke': T, 'no body or limbs': T})
rv('fireSprite.01b', 'replaced', 'A smooth, smiling yellow mask like a cartoon sun; re-rolled.')
rv('fireSprite.01b.r2', 'weak', 'Now formed of smoky flame, but still a grinning, cartoon-like face; the horn points are only flame tips. Second attempt: reported.',
   {'swept-back flame hair': T, 'two horn-like flame points': H, 'slanted dark eye-slits': T, 'thin dark grin': T, 'no body or limbs': T})
rv('hornetSwarm.01a', 'replaced', 'Good painting, but furry like a bumblebee; re-rolled. It passes every gate and is the fallback.')
rv('hornetSwarm.01a.r2', 'good', 'A hard-shelled hornet now, the most convincing insect of the four; its ochre face plate is more saturated than the family allows (muted 0.038 > 0.02, second attempt, reported). The first version passes and is the fallback.',
   {'dull ochre face plate with a dark anchor mark': T, 'curving segmented antennae': T, 'three small crown eyes': T, 'closed dark mandibles': H, 'folded smoky wings': T})
rv('hornetSwarm.01b', 'strong', 'Lean dark hornet with narrow ochre bands, open jagged mandibles and a torn wing; reads as a hornet at 48 px.',
   {'narrow dull ochre bands': T, 'open jagged mandibles': T, 'swept-back antennae': T, 'torn wing edge': T})
rv('wolf.01a', 'strong', 'Lean grey timber wolf with amber eyes, in the leaders\' hand; the notched ear did not come out.',
   {'dark saddle of fur on the nape': H, 'pale throat blaze': T, 'notched ear': F, 'amber eyes': T})
rv('wolf.01b', 'strong', 'Old wolf with the scar across the near eye and one fang showing; the more characterful of the pair.',
   {'grizzled pale muzzle': H, 'scar across the near eye': T, 'one fang showing': T, 'shaggy ruff': T})
G1 = {'broken flattened nose': H, 'bald head with grey wisps': T, 'stones knotted in the grey beard': T, 'necklace of huge teeth': T, 'hide cloak': T}
rv('giant.01a', 'good', 'Old bald giant, coarse heavy features, stones and beads in the beard, the tooth necklace and hide cloak; reads as a giant, not a man.', G1)
rv('giant.01b', 'replaced', 'A near copy of 01a (same text); re-rolled as a real alternative.')
rv('giant.01b.r2', 'good', 'The same giant with a closed, sullen scowl and the hide pulled high on the neck; now a real alternative to 01a.', G1)
G2 = {'clouded white eye with a scar': T, 'wild dark mane': T, 'crude iron chain': T, 'slate shoulder guard': T, 'fleece mantle': T}
rv('giant.02a', 'replaced', 'A rugged, handsome man rather than a giant; re-rolled.')
rv('giant.02a.r2', 'good', 'Brutish profile with a heavy jaw and brow, the clouded scarred eye, chain and slate guard; reads as a giant.', G2)
rv('giant.02b', 'replaced', 'A rugged, handsome man rather than a giant; re-rolled.')
rv('giant.02b.r2', 'good', 'Brutish, heavy face, the clouded eye with its scar, the chain, slate guard and fleece; reads as a giant.', G2)
rv('oakheart.01a', 'replaced', 'A carved man\'s face with eyes, lids, a nose and a beard; re-rolled.')
rv('oakheart.01a.r2', 'weak', 'Closer: a wooden mask with dark knothole eyes under the thorned bark helm, oak leaves, bottle-green mantle and acorns; but the grain still forms a nose and a beard. Second attempt: reported.',
   {'thorned bark helm': T, 'lobed oak leaves at the temples': T, 'dark knothole eyes': H, 'thorny pauldrons': T, 'bottle-green mantle': T, 'cord of acorns': T})
rv('oakheart.01b', 'good', 'Grey furrowed oak with moss, a crown of curved thorns, an oak-leaf fringe and hollow knothole eyes; the face reads a little skull-like.',
   {'crown of curved thorns on the helm': T, 'fringe of oak leaves': T, 'crack across the face': H, 'moss in the furrows': T, 'bottle-green mantle': T})
# mounts
AH = {'riveted iron face plate': T, 'soot-black mane and forelock': T, 'ember-orange caparison edge': T, 'iron bridle rings': T}
rv('ashHorse.01a', 'strong', 'Dark dappled warhorse, riveted iron chanfron with rusted edges, soot-black mane, the ember caparison edge at the withers; fully in the leaders\' hand.', dict(AH, **{'ash-grey dappled coat': T}))
rv('ashHorse.01b', 'strong', 'Older horse, head lowered, greyer muzzle, the same tack; the caparison shows a little more.', dict(AH, **{'greyer muzzle': T}))
rv('warWolf.01a', 'strong', 'Grey-brown timber wolf in a bark-plate harness with the bottle-green blanket and bone cord; its coat matches the grey Wolf Rider test figure (the figure\'s green chest cloth becomes bark plates in stage C).',
   {'bark-plate breast harness': T, 'bottle-green saddle blanket edge': T, 'bone-coloured cord': T, 'grey-brown shaggy coat, dark along the neck': T, 'pale muzzle': T})
rv('warWolf.01b', 'strong', 'The darker coat of review change 11, bared teeth, the same tack; the darker coat helps the stage C value margin on swamp ground.',
   {'dark grey-brown coat': T, 'bark-plate breast harness': T, 'bottle-green saddle blanket edge': T, 'bone-coloured cord': T, 'bared teeth': T})
# gods
def both(ch, cand, verdict, note, marks, tw_note=None, tw_verdict=None, cinder_key=None, thorn_key=None):
    rv(cinder_key or f'{ch}-cinderHorde.01{cand}', verdict, note, marks)
    rv(thorn_key or f'{ch}-thornwood.01{cand}', tw_verdict or verdict, (tw_note or 'Same body as the Cinder candidate; the tint zone repainted bottle green.') , marks)
OR = {'deep cowl shadowing the face': H, "robe in the nation's cloth": T, 'runic glyph band on the robe': T, 'floating ragged hem, no feet': T, 'gold-caged orb staff': T}
both('oracle', 'a', 'good', 'Hooded seer in the robe with its glyph band, the ragged hem drifting above the ground and the gold-caged orb staff; the face shows more than the cowl\'s shadow allows.', OR)
both('oracle', 'b', 'good', 'Deeper candle shadow, the hem floating above its own shadow; read48 overridden (the card crop reads).', OR)
TI = {'closed flat-topped great helm': T, 'plain gold plate armour': T, "tabard in the nation's cloth": T, 'straight great sword held point-down': T, 'no cape': T}
rv('titan-cinderHorde.01a', 'replaced', 'Followed its maquette\'s bulk: squat, short-legged, dwarf-like; re-rolled.')
rv('titan-thornwood.01a', 'replaced', 'Edit of the squat first body; made again from the re-rolled body.')
both('titan', 'a', 'good', 'Tall great-helmed knight in worn gold plate and the tabard, sword point-down: heroic proportions now; close to 01b.', TI, cinder_key='titan-cinderHorde.01a.r2', thorn_key='titan-thornwood.01a.r2', tw_note='Re-edited from the re-rolled body; tabard bottle green.')
both('titan', 'b', 'good', 'Taller and more weathered, torn tabard hem; the gold reads brighter than the leaders\' dull metals.', TI)
GW = {'swept-back horns': T, "smooth wing membranes in the nation's colour": H, 'banded bronze scales': T, 'spade-tipped tail': T, 'four legs and two wings': T}
both('greatWyrm', 'a', 'strong', 'Bronze banded dragon with swept horns, wings in the side\'s colour and the spade tail, standing on a faint floor; the membranes\' trailing edges are a little ragged for variant 0\'s smooth wings.', GW)
both('greatWyrm', 'b', 'strong', 'S-curved neck, tail curled forward round the feet; the same slight raggedness on the membranes.', GW)
LM = {'plain broken top, no capstone': T, "carved runic glyphs filled with the nation's colour": T, 'no face': T, 'no overgrowth': T, 'root-gripped base': T}
rv('livingMonolith-cinderHorde.01a', 'replaced', 'Roots and mound ran out of the bottom edge; re-rolled.')
rv('livingMonolith-thornwood.01a', 'replaced', 'Glyph pigment olive (window 0.002); re-rolled.')
rv('livingMonolith-cinderHorde.01a.r2', 'good', 'Pale slab with rows of glyphs in ember pigment, the root-gripped mound inside the frame; the glyphs look like a real historical alphabet rather than invented ones.', LM)
rv('livingMonolith-thornwood.01a.r2', 'weak', 'Same body; the glyph green still comes out olive grey-green, not bottle green (window 0.007 < 0.01). Second attempt: reported. The 01b Thornwood monolith passes.', dict(LM, **{"carved runic glyphs filled with the nation's colour": H}))
both('livingMonolith', 'b', 'good', 'Weathered slab, ember glyphs, roots and stones at the base.', LM, tw_note='Same body; green glyphs, just over the gate (window 0.011).')
AHo = {'gold circlet': T, "long cape in the nation's cloth": T, 'plain breastplate, no device': T, 'straight sword held upright': T}
both('ascendedHero', 'a', 'good', 'Circlet, long cape, plain breastplate, sword upright before the chest; reads as a noble mortal knight rather than a god.', AHo)
rv('ascendedHero-cinderHorde.01b', 'replaced', 'Boots cut by the bottom edge, sword held low; re-rolled.')
both('ascendedHero', 'b', 'weak', 'Inside the frame now, but the sword is held out at an angle instead of upright before the chest, and the figure is plain.', dict(AHo, **{'straight sword held upright': F}), cinder_key='ascendedHero-cinderHorde.01b.r2', tw_note='Edit of the re-rolled body; cape bottle green; same pose issue.')
PR = {"huge curling ram's horns": T, "moss back in the nation's colour": T, 'mottled brown hide': T, 'club tail': T}
rv('primordial-cinderHorde.01a', 'replaced', 'The moss came out green with orange flecks (side window 0.015); re-rolled.')
both('primordial', 'a', 'weak', 'Massive humped beast with the ember lichen back, mottled hide and club tail; but the head reads as a gentle ram, not a primeval bull-sloth.', PR, cinder_key='primordial-cinderHorde.01a.r2', tw_note='Edit of the re-rolled body; moss bottle green (window 0.053). Same ram head.')
both('primordial', 'b', 'weak', 'Heavier bull-ram body, ember moss; the same ram head. An extra attempt at a bull\'s head (r2) came out thinner and goat-like and was rejected.', PR, tw_note='Same body; moss leaf-green rather than bottle green (window 0.012, at the gate).')
rv('primordial-cinderHorde.01b.r2', 'reject', 'Art director re-roll for the head: still a ram\'s head, and the body came out thin and goat-like; worse than the first. The first version stays; its Thornwood edit stands.')
rv('ashColossus-cinderHorde.01a', 'good', 'Charred ember giant, brazier head with coals and eye-holes, faint cracks, ember kilt on a gold chain, bare fists; the bowl head reads a little comic.',
   {'brazier head with low coals': T, 'net of vein cracks': H, 'bare shoulders': T, 'bare rock-like fists': T, "kilt in the nation's cloth": T, 'drifting ember specks': H})
rv('ashColossus-cinderHorde.01b', 'strong', 'More massive, ash crust on the shoulders, ember cracks and drifting specks; read48 overridden (the card crop reads).',
   {'brazier head with low coals': T, 'net of vein cracks': T, 'bare shoulders': T, 'bare rock-like fists': T, "kilt in the nation's cloth": T, 'drifting ember specks': T})
PH = {'tall plume crest': T, 'fan-spread wings in ember-orange': T, 'barred coal-dark feathers': T, 'long trailing tail': T, 'gold hooked beak': T}
rv('ashPhoenix-cinderHorde.01a', 'strong', 'Coal-dark barred eagle with a plume crest, fan wings in ember, gold beak, trailing tail and ember specks; reads at 48 px.', PH)
rv('ashPhoenix-cinderHorde.01b', 'strong', 'Wings raised higher, rim light along the feathers; the strongest god silhouette.', PH)
PL = {'gold flame crown': T, "ember mantle in the nation's cloth": T, 'glaive': T, 'ash stripes on the face and arms': F, 'dark scale armour': T}
rv('pyreLord-cinderHorde.01a', 'strong', 'Flame crown, ember mantle, scale armour, the glaive with its gold collar and the open palm; the ash stripes did not come out.', PL)
rv('pyreLord-cinderHorde.01b', 'good', 'Same kit, legs sinking into the candle shadow; framing gate overridden (feet at 0.95).', PL)
CI = {'brazier face with a carved stern face': T, 'column of grey smoke': T, 'soot-crusted cracks': H, 'stepped plinth': T, 'carved glyphs in ember-orange pigment': T}
rv('cinderIdol-cinderHorde.01a', 'replaced', 'Smoke ran off the top edge, glyph colour too small; re-rolled.')
rv('cinderIdol-cinderHorde.01b', 'replaced', 'Smoke ran off the top edge, glyph colour too small; re-rolled.')
rv('cinderIdol-cinderHorde.01a.r2', 'good', 'Squat brazier-faced idol on its stepped plinth, broad ember glyphs, a short wisp of smoke; it has stub arms where the design has none.', CI)
rv('cinderIdol-cinderHorde.01b.r2', 'weak', 'Same idol, the glyph colour still small (side window 0.023 < 0.03). Second attempt: reported.', dict(CI, **{'carved glyphs in ember-orange pigment': H}))
EH = {'gold face-mask': T, "ember mantle in the nation's cloth": T, 'orb staff in a gold claw': T, 'robe glyphs': T, 'charcoal hood': T}
rv('emberHierophant-cinderHorde.01a', 'strong', 'Gold mask under the charcoal hood, ember mantle, glyph stole, orb staff in a gold claw, raised palm; the leaders\' light.', EH)
rv('emberHierophant-cinderHorde.01b', 'strong', 'The same priest more frontal; mask and staff read at 48 px.', EH)
WS = {'tall branching antlers': T, "leaf ruff in the nation's colour": T, 'stripes on the flanks and legs': T, 'trailing mist wisps': T}
rv('wildSpirit-thornwood.01a', 'strong', 'Lean striped stag-spirit with the green leaf ruff, half-misty outline and trailing wisps; card crop set by hand on the head.', WS)
rv('wildSpirit-thornwood.01b', 'replaced', 'Faced the left side of the image; re-rolled.')
rv('wildSpirit-thornwood.01b.r2', 'strong', 'Faces right, forefoot lifted, mist at the legs; card crop set by hand on the head.', WS)
WT = {"round dome canopy in the nation's colour": T, 'ridged bark': T, 'faceless trunk': T, 'spreading roots': T, 'no blossom, no fruit': T}
rv('worldTree-thornwood.01a', 'good', 'Correct and clear, but a plain round oak, a little clean-digital; the card shows the whole tree.', WT)
rv('worldTree-thornwood.01b', 'replaced', 'A near copy of 01a with almost no rim light; re-rolled.')
rv('worldTree-thornwood.01b.r2', 'good', 'Gnarled, twisting trunk with buttress roots under the round canopy; a real alternative; the card shows the whole tree.', WT)
HH = {'branching antlers': T, "leaf mantle in the nation's cloth": T, 'leaf-bladed gold spear': T, 'stripe warpaint': T}
rv('hornedHunter-thornwood.01a', 'strong', 'Antlered, bearded hunter-god with warpaint, the green leaf mantle and the gold leaf-bladed spear.', HH)
rv('hornedHunter-thornwood.01b', 'good', 'The same god, a little stiffer; reads at 48 px.', HH)
EW = {'crown of spines': T, "moss back in the nation's colour": T, 'club tail': T, 'banded bronze scales': T, 'no wings': T}
rv('elderWyrm-thornwood.01a', 'good', 'Wingless bronze dragon with the crown of spines, green moss back and club tail; compact rather than long and low.', EW)
rv('elderWyrm-thornwood.01b', 'good', 'Longer body and tail; the moss is leaf-green, near the gate\'s edge (window 0.035).', EW)
MB = {'antler crown': T, "bear-pelt cloak with the bear's head": T, "dress in the nation's cloth": T, 'plain gold-banded maul': T, 'warpaint bands': H}
rv('motherOfBeasts-thornwood.01a', 'good', 'Antler crown, bear pelt with the bear\'s head on her shoulder, green dress, gold-banded maul head-down; reads human-sized rather than towering.', MB)
rv('motherOfBeasts-thornwood.01b', 'replaced', 'Too dark (read48 9.2); re-rolled for the light.')
rv('motherOfBeasts-thornwood.01b.r2', 'good', 'Face, crown and bear\'s head now catch the candle; read48 11.5 overridden (whole-body median; the card crop reads).', MB)
json.dump(R, open(os.path.join(P, 'ad-review.json'), 'w'), indent=1)
print(len(R))
