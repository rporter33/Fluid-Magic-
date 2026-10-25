# Running the tasks in Codex cloud

Codex cloud runs each task in a fresh container. The setup script runs first, with internet; then the agent works
offline (internet is off by default), so everything a task needs must be installed by the setup script. Menu names
below may differ slightly in the current Codex interface.

## 1. Connect the repository (once)

1. Open https://chatgpt.com/codex and sign in.
2. Connect GitHub when asked, and give the Codex GitHub app access to `rporter33/Fluid-Magic-`.

## 2. Create the environment (once)

In Codex settings, open Environments and create a new environment:

| Setting | Value |
|---|---|
| Repository | `rporter33/Fluid-Magic-` |
| Name | `Fluid Magic` |
| Node version (if offered) | 22 |
| Environment variable | `NODE_PATH` = `/opt/pw/node_modules` |
| Secrets | none |
| Agent internet access | Off |

Setup script (works for both branches):

```bash
#!/usr/bin/env bash
set -euo pipefail
# Game branch: the project's packages
if [ -f package.json ]; then npm ci; fi
# Art tools: Python imaging
pip install --quiet pillow numpy
# Browser checks: Playwright and its Chromium, outside the repo
mkdir -p /opt/pw && cd /opt/pw
[ -f package.json ] || npm init -y >/dev/null
npm install --silent playwright@1.56.1
npx playwright install --with-deps chromium
```

## 3. Start the tasks

For each task, choose the environment, the branch and the model (the top model in the picker, high reasoning), then
paste the prompt.

| Order | Task | Branch | Prompt |
|---|---|---|---|
| first, together | 1. Code review | `claude/gifted-meitner-v8l3qv` | `Read AGENTS.md, then do Task 1 in docs/codex/TASKS.md.` |
| first, together | 4. Docs audit | `claude/gifted-meitner-v8l3qv` | `Read AGENTS.md, then do Task 4 in docs/codex/TASKS.md.` |
| any time | 5. Battlefields | `claude/art-workspace` | `Read AGENTS.md, then do the task in CODEX-TASK-battlefield.md.` |
| after 1 and 4 | 2. Matrix baseline | `claude/gifted-meitner-v8l3qv` | `Read AGENTS.md, then do Task 2 in docs/codex/TASKS.md.` |
| after 2 is merged | 3. Reliable tests | `claude/gifted-meitner-v8l3qv` | `Read AGENTS.md, then do Task 3 in docs/codex/TASKS.md.` |

Tasks 2 and 3 both edit `docs/09-balance.md` and `docs/PROGRESS.md`. Running them one after the other avoids merge
conflicts.

## 4. When a task finishes

1. Read Codex's summary and look at the diff. Check that it touched only what its task allows: reports only for
   tasks 1 and 4; nothing outside `scratchpad/visual-v4/battlefield/` for task 5.
2. Create the pull request from Codex. Check its base branch: `claude/gifted-meitner-v8l3qv` for tasks 1 to 4,
   `claude/art-workspace` for task 5.
3. Wait for the CI check on the pull request.
4. Leave it unmerged for Claude's review on Thursday, or merge the report-only ones (1 and 4) yourself once CI is
   green.

## If something goes wrong

- **The setup fails:** read the setup log. Most failures are a package download. Re-run the task.
- **Codex says it cannot load PixiJS:** the art branch has `vendor/pixi.min.js`, and its `AGENTS.md` explains how to
  use it offline.
- **`require('playwright')` fails:** check that the environment variable `NODE_PATH` is set to
  `/opt/pw/node_modules`.
- **A task wants to change something outside its scope:** decline the change and note it for Thursday.
