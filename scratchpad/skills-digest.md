# Gamedev skills: what applies to Fluid Magic work

Source: the five skills the "Gamedev agent skills integration" session added on branch `claude/m1-design-docs`
(commit 70e8849; copied from gamedev-skills/awesome-gamedev-agent-skills, Apache-2.0). Installed for this session in
`/root/.claude/skills/<name>/SKILL.md` with their `references/`. They are advisory: `CLAUDE.md` and `docs/**` win
where they differ (all randomness through `state.rng`; saves are JSON in IndexedDB via `idb-keyval`).

Workflow agents: read the named SKILL.md (and reference) before the stage it covers, and apply the checklist below.

## performance-optimization (map mockup, battle mockup, Vast map, Phase 8 render)

- Measure first, then fix the single biggest cost, then re-measure on the same scene. Report before/after numbers;
  never "should be faster". Say when a number comes from a shared, noisy machine.
- Frame budget at 60 fps is 16.67 ms. Split it: sim/update about 5 ms, render submit about 4 ms, UI about 2 ms, slack.
  A subsystem over its slice is the target.
- Triage CPU against GPU first (in headless Chromium the GPU is SwiftShader, so GPU waits are not representative:
  judge CPU per frame, and say so).
- Do less before doing it faster: cache by zoom band, run expensive checks on settle or a timer, amortize bakes
  across frames (time-slice), cull off-screen work, spatial grids for picking.
- Pool short-lived objects (projectiles, particles, damage numbers, chips); pre-warm; no per-frame allocation in hot
  loops (no new arrays or strings per frame).
- Set budgets and add a check so they stay fixed (a `window.__mock` or `window.__battle` perf row).

## pixijs-rendering (battle mockup now; `src/render/**` in Phase 8; stage D magic effects)

- v8: `await app.init({...})`, `app.canvas`; `Assets.load` (Texture.from only reads the cache).
- Ticker callbacks receive the Ticker: scale motion by `ticker.deltaMS` or `deltaTime`, never assume 60 fps.
- Large static subtrees (ground, bodies left on the field, the baked map) as render groups (`isRenderGroup: true`)
  or `cacheAsTexture()`; do not churn their children.
- Many same-texture sprites (spell particles, arrows, embers): `ParticleContainer` with `Particle` records and only
  the changing fields in `dynamicProperties`; keep them on one atlas so the batch never breaks.
- Pointer: `eventMode = 'static'`; drags use `globalpointermove`; `cursor` replaces `buttonMode`.
- Frequently changing text (counters, day chips): `BitmapText`.
- Filters render to a texture: use sparingly and remove when done.
- Cleanup: `destroy({ children: true, texture: true })`, `Assets.unload`; `app.destroy({ releaseGlobalResources: true })`
  when re-creating an app in the same tab.

## game-ui-ux (review pages, the game-screen mockup, `src/ui/**` in Phase 8)

- Anchors and flow containers, not absolute pixels; a reference size with an expand policy for other aspect ratios.
- Safe-area insets on phones (`env(safe-area-inset-*)` in CSS) for critical UI.
- Keyboard: initial focus on every screen or modal; focus trapped inside modals (search on "/", dialogs); a visible
  focus style distinct from hover; every action reachable without a mouse.
- Accessibility: never encode state in colour alone (add icon, shape or text); touch targets at least about 9 mm
  (about 34 CSS px, 44 px preferred) with padding; reduce-motion and reduce-flashing respected
  (`prefers-reduced-motion`); text-size headroom.
- Screens as a stack (push, pop, back), not boolean flags.
- HUD and panels update on events, not by polling state every frame.
- Strings outside layout logic; containers size to content.

## procedural-gen (mapgen; mock data in mockups; terrain noise)

- One seeded RNG threaded everywhere (here `state.rng`; in mockups a seeded PRNG, never `Math.random`).
- fBm octaves normalized by summed amplitude; redistribution (pow) to shape lowlands and peaks; separate seeds or
  offsets for independent fields (elevation, moisture, season noise) so they do not band together.
- Generate into plain data first, render in a separate pass; validate connectivity before use; cap placement loops.

## save-systems (Phase 8 IndexedDB layer; `src/sim/serialize.ts`)

- Save data, never live objects; stamp a version (STATE_VERSION) and migrate step by step; refuse newer versions
  (migrateState already does).
- Validate on load; keep the last good save as a backup and fall back on a parse error.
- Autosave to its own slot on safe boundaries (month end, after a battle resolves), throttled, never over a manual slot.
- Write the new save fully before replacing the old key (IndexedDB has no rename: write `slot.tmp`, verify, then swap).
- Test loading a save from the previous version.
