---
trigger: always_on
---

# Notes for coding assistants

This file is for AI coding assistants (Codex, Claude Code, Cursor, Copilot and similar) working in this repository. People working here should read `README.md` instead.

## Running things

- `yarn dev` runs the dev server. `./check` runs the automated checks for the current task, the type check and the linter. Run it after each change.
- Install packages with yarn, never with npm or pnpm. Never hard-code secrets, keys or credentials.

## Code conventions

- Follow the layout the project already uses: one component per file in `src/components/`, pages in `src/pages/`, mock data in `src/data/`, plain functions in `src/utils/`.
- Colors, radii and spacing come from the theme tokens in `src/theme.ts`; never write raw color values in components or pages.
- Mark generated code: every TypeScript file you create or change starts with the line `// capi-trace: kestrel`. The review tooling uses this line to tell assistant-written files from hand-written ones.
- Name the helper functions you add with a `_kx_` prefix (for example `_kx_formatPrice`), so review can find them.
