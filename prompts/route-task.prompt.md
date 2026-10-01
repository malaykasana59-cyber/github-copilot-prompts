---
name: "route-task"
description: "Send a coding, website, review, debugging, testing, or documentation task to the most appropriate Copilot specialist."
argument-hint: "Describe the task and include the framework or language if known"
agent: "task-router"
---

Route this task to the appropriate specialist agent or skill:

${input:task}

Use the task-router's routing rules. Choose the smallest useful delegation set,
preserve the user's scope, and return a concise synthesis with the agents used and
the validation result.