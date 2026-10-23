# Project skills

The folders here are a subset of
[gamedev-skills/awesome-gamedev-agent-skills](https://github.com/gamedev-skills/awesome-gamedev-agent-skills)
(Apache-2.0, see `LICENSE-gamedev-skills.txt` and `NOTICE-gamedev-skills.txt`), copied
unmodified. Claude Code loads a skill automatically when a task matches its description.

| Skill | Used for |
|-------|----------|
| `pixijs-rendering` | PixiJS 8 API and pitfalls for `src/render/**` (async `init`, `app.canvas`, `Assets`, `eventMode`, `globalpointermove`, render groups) |
| `procedural-gen` | Seeded RNG discipline, fBm noise, biome lookup, connectivity validation for `src/mapgen/**` |
| `save-systems` | Versioned schema, migrations, autosave slot rules for `src/sim/serialize.ts` and the IndexedDB layer |
| `performance-optimization` | Profiling method, pooling, draw-call batching for the map and battle views |
| `game-ui-ux` | Screen stack, anchor layout, event-driven HUD updates for `src/ui/**` |

Skills are reference material. `CLAUDE.md` and `docs/**` are the specification and take
precedence wherever they differ (for example: all randomness goes through `state.rng`, and
saves are JSON in IndexedDB via `idb-keyval`, not files).

To refresh or add skills, re-copy from the upstream repo. The full set, including a router that
picks skills by engine, installs on a local machine with
`npx skills add gamedev-skills/awesome-gamedev-agent-skills -g` or
`claude plugin marketplace add gamedev-skills/awesome-gamedev-agent-skills`.
