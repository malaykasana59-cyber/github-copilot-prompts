# To start, clone this repo into you project folder into a folder named ".github".

# Copilot Customization Library

This `.github` directory is a generated Copilot projection of the source library in `agents/`, `rules/`, `skills/`, and `workflows/`.

New to the library? Start with [Build a Website with Copilot](./WEBSITE-GUIDE.md).

## Contents

| Copilot primitive | Location | Source |
| --- | --- | --- |
| Always-on index | `copilot-instructions.md` | Curated entry point |
| Custom agents | `agents/*.agent.md` | `agents/*.md` |
| File instructions | `instructions/*.instructions.md` | `rules/*.md` |
| Agent skills | `skills/<name>/SKILL.md` | `skills/<name>/` |
| Prompt files | `prompts/*.prompt.md` | `workflows/*.md` |

The `task-router` agent and `/route-task` prompt can forward a request to the most appropriate specialist instead of requiring you to choose one manually.