# Fluid Magic art workspace (snapshot of 2026-10-25)

This branch saves the art and mockup work that lived only in the cloud session's scratchpad. That covers the painted
units (stages A to D), the battle mockup, the game-screen map mockup and their tools, plans and reports. The session
paused on 2026-10-25 to pick up on Thursday, and its machine is recycled when idle.

The branch is a storage branch. Do not merge it into the game branch. The game branch's
[`docs/HANDOFF.md`](https://github.com/rporter33/Fluid-Magic-/blob/claude/gifted-meitner-v8l3qv/docs/HANDOFF.md) is
the pickup guide: what is done, what is in flight, and the owner's open decisions.

## Restore

```sh
git fetch origin claude/art-workspace
git worktree add /home/user/art-ws origin/claude/art-workspace
/home/user/art-ws/restore.sh            # into the original scratchpad path
/home/user/art-ws/restore.sh /some/dir  # or elsewhere; the original path then links to it
```

`restore.sh` copies `scratchpad/` into place, turns every `*.png.webp` atlas page back into the `.png` the tools
read, and links the original path when you restore somewhere else. About 320 tools and scripts name the original
path directly:

`/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad`

Needs Python 3 with Pillow (and numpy for most art tools). The Playwright checks use Chromium at
`/opt/pw-browsers/chromium`.

## What is here

| Kept | How |
|---|---|
| Every generated image (833 in `visual-v4/units/gen-log.tsv`, A 48, B 556, C 111, D 164) and its `.json` sidecar | originals, byte for byte |
| Packed atlases of stages B, C and D (`visual-v4/units/stage-*/atlas/`) | pages as WebP quality 95 with lossless alpha (`*.png.webp`); metadata JSON as is |
| The processed portraits of creatures, mounts and gods (`units/stage-b/portraits`, both candidates, 64 to 512 px) | as is |
| References and guides for re-rolls and mesh weights (`units/refs`, `stage-d/prod/refs`, `prod/guides`, `prod/fixes`, `prod/ashrider`) | as is |
| Build inputs: the stage B paint bundle, the effect atlases' data, the battle data, the generation log | as is |
| Current builds: `visual-v4/battle-mockup.html`, `visual-v4/map/game-screen-v4.html`, `units/stage-d/pilot/pilot.html` | as is |
| Sources, tools, plans, designs, critiques, reports, handoff notes and metadata in every art and mockup folder | as is (text files up to 2 MB; JSON, HTML and TXT up to 300 KB) |
| Past-phase folders (code reviews, QA, integrations), whose code is already in the game branch | their `.md` reports only |

Left out, because they can be remade or are already published:

- screenshots and clips;
- measurement dumps and other large JSON;
- backups of images;
- `stage-d/prod/cut` (510 MB of keyed cutouts, remade from the originals by `prod/tools/dd_*.py`);
- `node_modules`;
- the review pages that are published as artifacts.

`SKIPPED.tsv` totals what was left out, by type, before the past-phase trim. `MANIFEST.tsv` lists every saved file
with its size and sha256.

## Published pages (private artifacts on claude.ai)

| Page | Link |
|---|---|
| Art gallery (everything approved, for sharing) | see `docs/HANDOFF.md` |
| Battle mockup (v6, the magic pilot inside) | https://claude.ai/artifact/9N3xAjDepZNfKB4KnrPs4D |
| Game-screen map (v8, soft wild edges; pass 4 not yet published) | https://claude.ai/artifact/J9d2JrQYGEhYyfbZyq3uAV |
| Magic pilot (approved 2026-10-25) | https://claude.ai/artifact/47Psan2xdhkNw8CUZAbY4r |
| Stage B review (troops, commanders, portraits) | https://claude.ai/artifact/5prV7k1rd8GbmDvcBmgnjb |
| Stage C review (creatures, mounts, gods standing) | https://claude.ai/artifact/UsNsy2gbBS7uiA6VA1YaXi |
| Lineup by size | https://claude.ai/artifact/L5rNYaE838n8aTfNd9TjTU |
