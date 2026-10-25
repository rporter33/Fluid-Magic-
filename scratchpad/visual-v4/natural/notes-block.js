// The natural view (natural/design-final.md), where the build departs from its letter:
// - Hairlines below device pixel ratio 1.5 are 2 px when alone (a 1.5 px line leaves no fully covered pixel at 45 deg and fell under
//   2.3:1); a partnered segment is 1.5 + 1.5 px at every ratio (RL_P.line.pairW1), so none is wider than 3 px, and the narrowed anchor
//   keeps its weight (alpha x 2 / 1.5, at most 1). The partner is drawn at alpha 1, not 0.8 (0.8 left Clear partner segments under).
// - The hairline solve uses coverage 0.8 and the p5 / p95 of the ground (RL_P.line), not 0.75 and p10 / p90, and counts the ground
//   right under the line (a hedge or shore on the border), so rendered pixels hold 2.3:1 in every view of both looks at ratios 1 and 2.
// - Partners: a partner that came and went per 0.1 D segment read as dashes. Solved partners keep the side their anchor fails on; the
//   edge's majority side is extended over the whole edge where a third of it needs one, otherwise by a segment either side with gaps of
//   up to two closed.
// - Data modes: the lines are solved against the mode raster on screen (the design is silent; solving them on the bake left light
//   lines over pale fills and partners in pieces).
// - Seats in unexplored land are muted against the interior haze, not the hem's peak.
// - Snow (Clear): the S6 clamp as designed, plus the same cap after the mean-neutral offset, plus a per-colour L* cap on land over
//   L* 60 (21 / 13 raw, 20.6 / 12.6 under the hem's 12% haze, margins for 8-bit rounding), with four gamut passes instead of two so
//   every province mean stays within 0.5.
// - The natural pass costs about 3.4 to 4.6 s of CPU here (materials 2.4 to 3.0 s under load), not the 1.0 to 1.3 s of the review
//   bench; the shared rasters are as designed. In the game both are GPU passes.
