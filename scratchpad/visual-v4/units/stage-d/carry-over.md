# Stage D pilot: carry-over for when the owner approves the pilot

- Record in the repo (docs/09-balance.md rows, docs/PROGRESS.md, art direction decisions): the firelight as an
  additive copy of each lit figure (peak 0.5, centre falloff, only while lit; owner answer "Glow only during own fire"
  allows spell light on figures); the dust shockwave tint #F0E4C8; the light-pool falloff (1 - h/260)^4; the wound-flash
  rules (fire wounds orange #FFB347 one frame + 4 sparks + smoke wisp; reduced motion: #D0605A tint 0.15 s; other wounds
  white 90% one frame); the Entangle numbers (48 thorns at impact, 38 held, coils to the hips, 4 anchor tendrils,
  commander ring 0.3 while held, 8 clods); the burst fit clamp(2.2 x group radius, 120, 180) wu and fragment sizes; the
  burning-kill flames (2-3 for 1.5 s, char 0.3 s); the charge glyph; the load warm-up. All numbers: src/45-fx-looks.js.
- Split src/46-fx.js (422 lines) by moving the light code into its own module.
- Still open: heat shimmer left out; burning-kill flames not depth-sorted against the Wyrm's wing; the Magus lit near
  cream at his own charge peak (owner's light question can say "Subtler").
- Stage D budget: 29 of 40 used for the pilot; the rest of stage D (about 170 by the plan) waits for the pilot verdict.
