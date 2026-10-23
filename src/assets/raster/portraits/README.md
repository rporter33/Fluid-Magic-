# Leader portraits (raster)

Approved painted portraits, one folder per nation and unit type, eight faces each
(`docs/design/war-table.md`, section 5.10, and the art prompt pack). Each face has:

- `NN.webp`: 256 px, the size the game draws from (at most 24 KB);
- `NN-64.webp`: 64 px, for the outliner and small frames (at most 4 KB);
- `NN.json`: provenance: the source image's hash, tool, model, date, full prompt, references, and the
  owner's approval and pick.

The 512 px masters are in `art-source/portraits/`. The procedural SVG bust is always the fallback; the game
uses a raster set only when all faces of a type are approved: eight (twelve for each Independent Captain
outfit), four for a summoned commander (`docs/09-art-direction.md`, "Leader portraits"). The style anchor is
`art-source/portraits/anchor-style.webp` (the rim-light Ash Chieftain, owner-approved 2026-10-22).

The first four sets (Ash Chieftain, Warden Captain, Pyre Priest, Grove Priest) were made with Gemini
(`gemini-nano-banana-2.1`) through `tools/art/gemini_gen.py`, with the anchor as the style reference and a
per-face description of the person and their kit, and picked by the owner on 2026-10-22.

The second round (2026-10-22) adds every other leader: Cinder Scout, Ember Adept, Cinder Magus and the summoned
Salamander; Thorn Scout, Sapling Druid, Elder Druid and the summoned Treant; and Independent Captains in four outfits
(`independent/independentCaptain-levy`, `-hunter`, `-mountaineer`, `-reedman`, twelve each, keyed by the terrain the
captain guards). Summoned commanders have four faces each.

Seven faces the owner sent back were made again with two alternatives each, and the owner picked one; their
sidecars record the pick as `redo-A` or `redo-B`. Every set is complete: 136 faces.
