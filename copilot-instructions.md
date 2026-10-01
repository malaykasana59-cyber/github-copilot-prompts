# Copilot Customization Library

This repository contains a Copilot-native projection of the reusable agents, instructions, skills, and prompts in the sibling source directories.

- Prefer the specialized custom agent, instruction, skill, or prompt that matches the current task.
- For ambiguous or multi-domain implementation requests, use the `task-router` agent or `/route-task` to delegate to the smallest appropriate specialist set.
- Treat files under `.github/` as Copilot configuration; do not assume Claude Code tools, hooks, sessions, or plugin namespaces are available.
- Runtime-dependent source items are documented in `.github/copilot-migration-manifest.yml` and are intentionally excluded from active Copilot discovery.
- Preserve existing repository conventions and validate changes with the project's available checks.

See (./README.md) for the supported locations and regeneration command.