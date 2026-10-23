# Fluid Magic

A single-player, browser-based grand strategy game in the lineage of Dominions 6, played
in continuous real time with pause and speed controls, with a five-color magic system
built on the Magic: The Gathering color pie.

## Status

Milestone 1 in progress. Done: Phases 0 to 7 (scaffold, map, economy, commanders, battle,
magic, pretender and dominion, AI), Phase 1b (impassable terrain), Phases 6b.1 to 6b.3 (pretender
design rules, battle rules, sixteen chassis) and Phase 10 S1 (battle detail records), with a QA
sweep on 2026-10-22. The headless AI vs AI runner plays full games; the game is not yet playable
by a person (Phases 8 and 9, the map renderer and UI, come next). Approved leader portraits and
the design records are in. See [docs/PROGRESS.md](docs/PROGRESS.md).

```
npm install
npm run dev        # Vite dev server
npm test           # vitest
npm run typecheck && npm run lint
```

## Documents

| Doc | Contents |
|-----|----------|
| [docs/00-vision.md](docs/00-vision.md) | Pillars, scope ladder, glossary |
| [docs/01-core-rules.md](docs/01-core-rules.md) | Time, map, population, resources, unrest, armies, buildings, recruitment, sieges, dominion, Wellsprings, victory, fog |
| [docs/02-magic.md](docs/02-magic.md) | Five colors, pips, costs, research, effect primitives, full spell list, blessings |
| [docs/03-nations.md](docs/03-nations.md) | Cinder Horde (R) and Thornwood (G) unit and commander tables, M2 sketches, independents |
| [docs/04-battle.md](docs/04-battle.md) | Battle resolver rules, rounds, dice, scripts, replay log, required tests |
| [docs/05-pretender.md](docs/05-pretender.md) | Pretender design: chassis, pips, dominion, five Scales, awakening, presets |
| [docs/06-architecture.md](docs/06-architecture.md) | Stack, repository layout, simulation contract, commands, game loop, save/load |
| [docs/07-ui.md](docs/07-ui.md) | Screens, game screen layout, panels, overlays, replay viewer, keys |
| [docs/08-ai.md](docs/08-ai.md) | AI priorities, difficulty, behavior tests |
| [docs/09-art-direction.md](docs/09-art-direction.md) | Palettes, SVG sprite part system, procedural animations, icons |
| [docs/09-balance.md](docs/09-balance.md) | Tuning log and playtest checklist |
| [docs/10-milestone-1.md](docs/10-milestone-1.md) | M1 definition, acceptance criteria, phase-by-phase build order, liberties taken |
| [docs/12-battle-presentation.md](docs/12-battle-presentation.md) | Visceral battle replays: the detail sink, timeline, sound, renderer stages |
| [docs/PROGRESS.md](docs/PROGRESS.md) | What is done per phase, deviations from the docs, known issues |

## Design records

Full design specs behind the numbered docs, in [docs/design/](docs/design/README.md). The numbered
docs win where they differ; each record says what moves into them and in which phase. The
`*.owner-direction.md` and `*.owner-answers.md` files beside them quote the project owner's decisions.

| Record | Contents | Lands in |
|--------|----------|----------|
| [ui-spec.md](docs/design/ui-spec.md) | The layered UI: five layers, top bar, alerts ribbon, outliner, panels, map, Codex, keys | docs/07, Phases 8 to 10 |
| [battle-presentation.md](docs/design/battle-presentation.md) | Visceral battle replays: detail sink, timeline, procedural sound, renderer, battle lab | docs/12, Phase 10 (S1 done) |
| [pretender-and-magic.md](docs/design/pretender-and-magic.md) | Sixteen chassis, the blessing menu, boons, appearance and identity, share codes, the magic effects grammar | docs/05, Phase 6b (6b.1 to 6b.3 done), Phases 8 to 12 |
| [units-and-items.md](docs/design/units-and-items.md) | Size ladder, mounts, gear pieces, reach, resistances, the abilities catalog, forged magic items | Phase 7b, Phases 8 to 12 |
| [war-table.md](docs/design/war-table.md) | The oak war table in a tavern, impassable wilds, painted map detail, growth by alignment, leader portraits, the art prompt pack | Phase 1b (done), Phases 8 to 11 |
| [battle-overhead.md](docs/design/battle-overhead.md) | Proposed: the overhead battle stage with massed formations, monsters at true size, the card bar | Phase 10 S2 and S4 |
| [map-relief.md](docs/design/map-relief.md) | Proposed: the relief-terrain map on the war table, owner rails, miniatures, labels by zoom | docs/07, docs/09, Phase 8 |
| [painted-units.plan.md](docs/design/painted-units.plan.md) | Painted unit art: style lock, camera, inventory, review stages, pipeline, with the pilot review | Battle presentation S4, Phase 11 |
| [three-kingdoms.md](docs/design/three-kingdoms.md) | Proposed: Romance of the Three Kingdoms as a template: named commanders, capture and prisoners, duels, the god's Ascendancy, fort governors, proposals, bonds; what the 15 to 20 hour session unlocks | A prototype phase after Phases 8 and 9 |

`CLAUDE.md` holds the working rules for the implementing model.
