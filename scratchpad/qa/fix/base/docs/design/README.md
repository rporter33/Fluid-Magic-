# Design records

Full design specs behind the numbered docs. Each was written by a design pass (research, proposals,
two judges, a final synthesis) and checked against the code and measurements of its day. The
numbered docs (`docs/00` to `docs/12`) are the specification: where a record and a numbered doc
differ, the numbered doc wins, and each record's "Docs text" section says what it moves into them
and in which phase.

| Record | What it covers | Lands in |
|---|---|---|
| `ui-spec.md` | The layered UI: five layers, top bar, alerts ribbon, outliner, panels, map, Codex, keys, component inventory | `docs/07`, Phases 8 to 10 |
| `battle-presentation.md` | Visceral battle replays: detail sink, timeline, procedural sound, renderer, battle lab | `docs/12`, Phase 10 stages S1 to S6 (S1 is done) |
| `pretender-and-magic.md` | Sixteen pretender chassis, the blessing menu, boons, appearance and identity, share codes, the magic effects grammar | `docs/05`, Phase 6b (6b.1 and 6b.2 are done), Phases 8 to 12 |
| `units-and-items.md` | Size ladder, mounts, gear pieces, reach, resistances, the abilities catalog, forged magic items | Phase 7b, Phases 8 to 12 |
| `war-table.md` | The oak war table in a tavern, impassable wilds, painted map detail, growth by alignment, leader portraits, the art prompt pack | Phase 1b, Phases 8 to 11 |

The `*.owner-direction.md` and `*.owner-answers.md` files hold the project owner's words and the
answers to each record's open questions; the docs quote them as owner decisions.

`mockup/` holds the clickable mockups the owner reviewed (`game-screen-v2.html`, the war table) and
the art prompt page (`art-prompts.html`). They load d3 from cdnjs and Google Fonts; open them in a
browser.

Art references made with connected image tools live in `art-source/references/`, each with a JSON
record of the tool, model, prompt and date.
