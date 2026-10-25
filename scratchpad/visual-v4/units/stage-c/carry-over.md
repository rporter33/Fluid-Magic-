# Carried over from stage C into the next mockup fix pass

1. Ash Rider front scale. The shipped scale was measured to the pennon top (147 px) instead of hood to hooves (126 px),
   so the front-view rider stands about 14% smaller than the 79/159 px rule and shrinks when a block turns or routs.
   Zero-generation fix: pin the front view's scale to the body measure (lance-fix/record.json, cpack.py STAND_PX), re-pack
   the ashRider family with key.py --shafts kept (run lance_fix.py, not a bare cgrid.py re-run), re-bundle. Held back so it
   does not race the magic pilot's integration into the mockup.
2. Ash Rider back now fails the variety gate by 0.005 (walkA/walkB overlap 0.865 against 0.86) because both walk cells
   hold the same whole lance; bodies unchanged. Cosmetic; leave unless a re-roll happens anyway.
3. Salamander 04's portrait shows it upright (owner's note); the figure is the four-legged Salamander body. Kept by the
   owner; no change unless the owner asks.
4. Not yet picked by the owner, staying as painted: Salamander 02, Treant 04, Living Monolith, Cinder Idol.
