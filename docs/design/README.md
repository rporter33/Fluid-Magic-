# Design records

Full design specs behind the numbered docs. Each was written by a design pass (research, proposals,
two judges, a final synthesis) and checked against the code and measurements of its day. The
numbered docs (`docs/00` to `docs/12`) are the specification: where a record and a numbered doc
differ, the numbered doc wins, and each record's "Docs text" section says what it moves into them
and in which phase.

| Record | What it covers | Lands in |
|---|---|---|
| `ui-spec.md` | The layered UI: five layers, top bar, alerts ribbon, outliner, panels, map, Codex, keys, component inventory; amended 2026-10-23 with the Court modal, the officer alerts and their sim support, tagged [Phase 9b] (sections 2.5, 3.6b, 6.6, 7.2, 9.2, 9.3) | `docs/07`, Phases 8 to 10; the [Phase 9b] items with Phase 9b |
| `battle-presentation.md` | Visceral battle replays: detail sink, timeline, procedural sound, renderer, battle lab | `docs/12`, Phase 10 stages S1 to S6 (S1 is done) |
| `pretender-and-magic.md` | Sixteen pretender chassis, the blessing menu, boons, appearance and identity, share codes, the magic effects grammar | `docs/05`, Phase 6b (6b.1 and 6b.2 are done), Phases 8 to 12 |
| `units-and-items.md` | Size ladder, mounts, gear pieces, reach, resistances, the abilities catalog, forged magic items | Phase 7b, Phases 8 to 12 |
| `war-table.md` | The oak war table in a tavern, impassable wilds, painted map detail, growth by alignment, leader portraits, the art prompt pack | Phase 1b, Phases 8 to 11 |
| `battle-overhead.md` | Proposed: the overhead three-quarter battle stage with massed formations, monsters at true size, the card bar and hover cards, replacing `docs/12`'s side view (S2.4, S2.5, S4.3, S4.4, S4.6) | Phase 10 S2 and S4, after owner review |
| `map-relief.md` | Proposed: the clean relief-terrain map, a terrain model on the war table, thin owner rails, miniatures on bases, labels by zoom | `docs/07`, `docs/09`, Phase 8, after owner review |
| `painted-units.plan.md` | Stage A of the painted unit art: style lock, camera references, the inventory of troops, commanders, creatures, mounts and gods (`painted-units.inventory.md`), the owner's four review stages, the animation and magic plans, the pipeline; with the art director's pilot review (`painted-units.pilot-review.md`) | Battle presentation S4 and Phase 11, after the owner's verdict |
| `three-kingdoms.md` | Proposed: Romance of the Three Kingdoms as a template for complexity and replayability, thinned after research: named commanders with stats and traits, capture and prisoners, automatic duels, the god's Ascendancy with a field cap and stat-scaled posts, fort governors, officer proposals, comrade and grudge bonds; loyalty states, the coalition rule, Search, legends and ploys after a playtest; what the 15 to 20 hour session unlocks later. Its docs text has landed (2026-10-23) as Phase 9b in `docs/10`, with proposed lines in `docs/00`, `01`, `02`, `03`, `04`, `06`, `07`, `08`, `09-art` and `09-balance`; three owner directions in `three-kingdoms.owner-answers.md` | Phase 9b, after Phase 9 and before Phase 10, gated on its playtest; Tier 2 after it |
| `mid-game.md` | Proposed: the mid-game and the long session, written after the Three Kingdoms and overworld research: seasons, supply lines, rivers and roads as rules, diplomacy promoted with claims and coalitions, mercenaries in the tavern, Great Workings, research as schools, the Vast map with named regions and a staged victory, the automation ladder, and the overworld (the overview band, regions on the land, map search, pins, muting, fog as memory); nine owner questions settled 2026-10-23 (`mid-game.owner-answers.md`: two hops of supply reach, the Vast map at 270 and measured, the rest on defaults) | Map rules with Phase 8 where cheap; the rest after Phase 9b's playtest across M2 and M5 |

`visual-references.analysis.md` and `visual-references.tech.md` are the reference analysis and the measured Pixi research
behind the two proposed records.

The `*.owner-direction.md` and `*.owner-answers.md` files hold the project owner's words and the
answers to each record's open questions; the docs quote them as owner decisions.

`mockup/` holds the clickable mockups the owner reviewed (`game-screen-v2.html`, the war table) and
the art prompt page (`art-prompts.html`). They load d3 from cdnjs and Google Fonts; open them in a
browser.

Art references made with connected image tools live in `art-source/references/`, each with a JSON
record of the tool, model, prompt and date.
