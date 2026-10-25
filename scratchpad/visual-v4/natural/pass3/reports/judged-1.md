# Pass 3 wilds: player and readability judgement

I'd ship the **sculpted massif** (8/10). Continuous relief scores 7/10 and the open (spill) prototype 4/10. Before the massif ships it needs:
- relief's crisp ridged detail at close zoom;
- open's lighter mere water;
- an on-map response when you hover a wild (none of the three has one);
- a cheaper edge decision, because it stalls on every pan.

I opened each build myself and took and looked at my own shots. Each build rebuilds to the same file as delivered (md5 `4add5cc1` relief, `fa6edbad` massif, `d7bb69bd` open). I also loaded the pass 2 page as a baseline. I checked:
- 10 desktop views and 5 phone views (390×844) per build, plus the supply data mode;
- hovering with the real pointer across wild edges, and marching orders around a wild;
- simulated protan, deutan and tritan vision;
- the page's own terrain readers;
- the Clear view;
- how long pans and zooms take.

Every session that recorded page errors had 0. Nothing in the prototypes, `visual-v4/map/` or the repo was edited, and `git status` is clean. The timings ran on a heavily loaded shared machine (load 9–15), so treat them as rough.

## Verdict

| Prototype | Score | Why |
|---|---|---|
| Sculpted massif | 8/10 | Reads as "a mountain you can't cross" at every zoom and on the phone. Its snow is the cue the design reserves for wilds: passable mountains never have snow, and the wild icon is snowy peaks. It has the least frame of the three. The neighbours read exactly as in pass 2. |
| Continuous relief | 7/10 | The crispest rock, and the easiest to tell from passable mountains. But the land runs on unchanged across the line, so only the line and a pale inner rim mark the edge. It is the most framed of the three, and Karreach misreads as plains at the least zoom. |
| Open (spill) | 4/10 | Passable hills now look like mountainside: Halevale's town sits on the drawn slope, and Karreach and Ashvale misread as plains at the two farthest zooms. The range reads as a grey streaked slab, close to the pass-2 look the owner rejected. The Greyteeth is still framed on 81–100% of its outline. |

## What the measurements show

**The edge itself is fixed in all three.**
- The dark line stands out from both sides (colour difference of 20 or more) on 98–100% of the outline, and on 96% or more under every colour-blind simulation.
- Pass 2 managed 49–94%.
- Hover switches between the wild and its neighbour within 0–1 px of the drawn line, in 26 of 26 crossings in every build.

**How framed each one looks.** Share of the outline with a light line beside the dark one:

| Relief | Massif | Open |
|---|---|---|
| 67–93% | 53–79% | 55–88% |

**Does the ground change at the line?**
- In relief it barely does: the median colour difference across the line is 1–4, because the same woods and fields continue inside.
- In the massif it is 8–15, because the foothill apron is a distinct olive.

**Can you tell the wild from passable mountains?** A simple classifier separating the peaks from passable-mountain provinces scored as follows (1.0 is perfect):

| | Relief | Massif | Open |
|---|---|---|---|
| Normal vision | 0.986–0.999 | 0.946–0.992 | 0.897–0.986 |
| Worst colour-blind case | 0.984 | 0.941 | 0.831 (least zoom) |

**The mere against the swamp's pools under protan**, at the closest view of the mere (colour difference, higher is easier):

| Relief | Massif | Open |
|---|---|---|
| 10.0 | 11.7 | 28.4 |

Relief's mere reads as a very large pool. Open's water stands apart but looks like marsh.

**Neighbour colour near the wild.** Open shifts Karreach by 5.6 at the start view and 12.6 on the phone, against at most 1.7 in the other builds.

**Pan stalls.** The massif takes a median 850–930 ms to redraw after a pan, against about 200–290 ms for the others. It re-decides its edge from the drawn pixels every time.

**Shared by all three, unchanged from pass 2:**
- Hovering a wild changes 0 pixels on the map until the card appears 500 ms later.
- There is no path preview before the right-click.
- The phone's "4d" day chip sits on the Ashspine.
- The Clear view is pixel-identical in all four builds, and the data modes still show the old slab-shaped wilds.

## What to graft onto the massif

1. **From relief, at Near and the closest zoom:** use relief's ridged crests, lit and shaded faces and valley scree instead of the massif's rounded, putty-like faces. Put snow as caps on the crests rather than streaks.
2. **From relief, everywhere:** let rock spurs come down through the foothill apron, so it is no longer an even olive moat on the Ashspine's east end and the Greyteeth's west side.
3. **From open:** lighten the mere's shallow shelf until it differs by at least 20 from the swamp pools in every simulation. Keep the massif's defined shore and its fringe, which repeats no mirrored land.
4. **Performance:** decide the edge once per zoom rather than on every redraw. The massif's own README already proposes this.
5. **New:** brighten the wild's outline as soon as the pointer is over it, and add a light no-go wash when an army is selected.
6. **Don't graft the spill.**

The massif's snow goes above pass 2's brightness cap, so that rule change needs the owner's approval. Open's spill would also need the owner to reverse an approved rule ("every pixel of land is where the sim's polygon says").

Everything is in `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/judge-player/`:
- `sheets/` has the side-by-sides, including the colour-blind, phone, hover and order sheets;
- `shots/` has my raw shots;
- `out/` has the measurements;
- `tools/` has the scripts.

Files:
- /tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/judge-player.md