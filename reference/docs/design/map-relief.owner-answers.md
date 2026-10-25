# Owner answers, 2026-10-23 (binding; quote verbatim in docs)

After the relief map mockup v4 (https://claude.ai/artifact/J9d2JrQYGEhYyfbZyq3uAV), which keeps the docs/09 rule that
every terrain fill differs by CIEDE2000 20 (12 under simulated colour blindness) and so still reads as a patchwork of
single-colour provinces, the owner was asked which the map should do by default and chose:

> Natural + clear option (Recommended)

The option as offered: "Natural landscape by default, like your screenshots. Gentle colours blend across borders and
terrain is read from the drawing. A 'Clear terrain colours' setting and a Terrain map mode bring back the
colour-blind-safe colours, and hovering a province always names its terrain."

Read as:

1. **Default view: a natural landscape.** Gentle, muted terrain colours blend across province borders; terrain is read
   from what is drawn (forest canopy, relief, water, fields, marsh, scrub) rather than from a flat fill per province.
   Ownership stays on top as the thin rails and glow of `map-relief.md`.
2. **Terrain stays knowable for every player:** hovering a province always names its terrain; a Terrain map mode shows
   the colour-blind-safe fills; a "Clear terrain colours" setting makes those fills the default view.
3. **The docs/09 distinct-colours rule** moves from the default view to the Terrain mode and the Clear setting. Nation
   banners, ownership rails and the band rule keep their colour-blind minimums in every view.

## 2026-10-23, province lines in the natural view

Asked how province lines should work, since the thin pale line between every pair of provinces (held at the
colour-blind floor) still drew a grid over the natural landscape, the owner chose:

> Faint lines, realms clear (Recommended)

The option as offered: "Lines between unowned provinces become faint, like your screenshots, and brighten on hover and
in the Clear colours setting. Realm borders keep their colour-blind contrast. Cleanest look; neutral borders are harder
to see at a glance."

Read as: in the natural view, lines between provinces that no realm owns (and the internal lines inside one realm) are
faint; they brighten to the colour-blind floor around the hovered and selected province, and everywhere in the Clear
terrain colours setting and the Terrain mode. Realm borders (the rails between owners, and between an owner and
unowned land) keep their colour-blind contrast in every view.

## 2026-10-24, edges of the wilds in the natural view

After natural-map pass 3 (published at https://claude.ai/artifact/J9d2JrQYGEhYyfbZyq3uAV), the mountain wilds were
crisp ranges growing out of the land, but every wild still read as a framed shape when zoomed out: a hard black
outline with a pale band inside it, kept so that colour-blind players can always see the impassable edge. Asked how
those edges should work in the natural view, the owner chose:

> Soft, like province lines (Recommended)

The option as offered: "Same rule you chose for province lines: in the natural view, mountains and the lake show
their own natural edge, with no outline. The edge comes up to full contrast when you hover or select nearby, when a
march would cross it, and always in Clear colours and the Terrain mode."

Read as: in the natural view a wild has no drawn outline or rim at rest; its edge is the landform itself (rock, scree
and the shore). Around the hovered and selected province, along a planned or previewed march that meets a wild, and
everywhere in the Clear terrain colours setting and the Terrain mode, the wild's edge is drawn at the colour-blind
floor as today. Impassability also stays readable through the hover card ("Impassable"), the path refusal and the
movement preview. Realm borders keep their colour-blind contrast in every view.
