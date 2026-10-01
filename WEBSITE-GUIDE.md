# Build a Website with Copilot

This `.github` folder gives VS Code Copilot reusable agents, skills, prompts, and coding instructions for building websites.

## 1. Add the library to your project

Copy the `.github` folder into the root of your website project. Then open that project folder in VS Code and make sure GitHub Copilot Chat is installed and signed in.

The files in `.github/instructions/` are applied automatically when their file patterns match. Agents, skills, and prompts can be selected from Copilot Chat.

## 2. Start with a clear request

Open Copilot Chat in **Agent** mode and describe the website, audience, content, and technology. For example:

> Build a responsive portfolio website for a product designer. Use the existing React and Vite setup. The visual direction should be editorial and confident, with a project gallery, about section, contact form, keyboard navigation, and mobile support. First inspect the project and propose the page structure, then implement it and run the available checks.

Let Copilot inspect the project before asking it to create files. Mention any constraints such as React, Vue, Angular, plain HTML, Tailwind, an existing design system, or required browser support.

## 3. Use the right Copilot resource

- **Agent picker:** choose a specialist such as `react-reviewer`, `vue-reviewer`, `a11y-architect`, or `seo-specialist`.
- **Automatic routing:** choose `task-router`, or run `/route-task`, when you want Copilot to select the appropriate specialist for you.
- **Skills:** invoke a focused workflow with `/`, such as `frontend-design-direction`, `accessibility`, `browser-qa`, `frontend-patterns`, or `e2e-testing`.
- **Prompts:** use a reusable task from the `/` menu for reviews, builds, tests, or framework-specific work.
- **Instructions:** matching files automatically receive relevant coding, security, testing, and web-design guidance.

Useful follow-up requests include:

> Review this page for keyboard access, contrast, focus states, and semantic HTML.

> Check the mobile layout at narrow and wide widths. Fix overflow, overlapping text, and unstable controls.

> Run the website checks and summarize any failures before making fixes.

## 4. Work in small passes

Use this sequence for reliable results:

1. Ask Copilot to inspect the existing project and outline the implementation.
2. Implement the page structure and content.
3. Add the visual direction, responsive layout, assets, and interactions.
4. Run the project’s tests, linting, type checks, and build.
5. Use `browser-qa` or `e2e-testing` to verify the page in a browser.
6. Ask `accessibility` and `seo` to review the finished page.

Keep the browser console and terminal output available when asking Copilot to debug. Give it the exact error and the file where it occurs.

## 5. Important boundary

This library provides guidance and reusable prompts; it does not install Node packages, configure hosting, create API keys, or deploy the site automatically. Ask Copilot to inspect the project’s existing setup before adding dependencies or changing deployment configuration.