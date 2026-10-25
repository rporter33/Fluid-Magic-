# Fluid Magic

A single-player, browser-based grand strategy game in the lineage of Dominions 6, played
in continuous real time with pause and speed controls, with a five-color magic system
built on the Magic: The Gathering color pie.

## Status

Milestone 1 in progress: Phases 0 to 4 are done. See [docs/PROGRESS.md](docs/PROGRESS.md).

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

`CLAUDE.md` holds the working rules for the implementing model.
