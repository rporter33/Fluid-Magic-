# Spec additions to fold into the pass 4 build (from the merged docs, commit 74d7ce6)

docs/06-architecture.md "Rendering notes (PixiJS 8)" and "Camera" (reconciled with docs/07 "The table and the camera"):
- Camera state { x, y, zoom } with targets; exponential smoothing by deltaMS each frame (never a per-frame lerp factor).
- Wheel zooms toward the cursor (the world point under it stays fixed), stepped x1.15 per notch, clamped to docs/07's
  range (lean-back at 0.75 of the fit-the-table scale to the Near band's closest zoom), with the 8% settle on the start zoom.
- The view's centre stays over the table (docs/07); re-clamp on resize.
- WASD pans at a constant screen speed (px/s divided by zoom); drag pans 1:1 with no smoothing while held, using
  pointerdown then globalpointermove, ending on pointerup or pointerupoutside; right-click move on rightdown.
- Province polygons and army markers eventMode 'static', everything else 'passive'; the province layer a render group.
- Teardown destroys sprites and unloads textures; Ticker callbacks read ticker.deltaMS.
Check the mockup against each and record any deviation (the mockup is a single canvas page, so map the rules onto its
own camera code in p60a-camera.js).
