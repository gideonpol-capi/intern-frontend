# Capisoft intern frontend

The frontend track of the Trainee Guide: you create a React app with Vite and build it from a Figma design, in a
setup stage and nine tasks.

## Stack

| What | Used for |
|---|---|
| React 19 + TypeScript | the app, written in TypeScript only |
| Vite | creating the project, dev server and build (setup) |
| React Router | pages and route guards (Task 1) |
| Chakra UI v3 | components and theme (Task 2 on) |
| react-icons (Lucide set) | icons that aren't in the Figma (Task 3) |
| Recharts | charts (Task 9) |
| Vitest + Testing Library | the checks, and your own tests (setup) |

You install each package when a task asks for it. Ask a reviewer before adding anything else.

## Figma

| File | What's in it |
|---|---|
| [Trainee Docs – Components](https://www.figma.com/design/azVEHhurUFPvdKzPRuEDOM) | the tokens and every component you build (Tasks 2 to 4) |
| [Trainee Docs – App Pages](https://www.figma.com/design/mI5KPjf2dWr4LscDlLOveI) | the layout, Users, Login and Sign up pages (Tasks 5, 6 and 8) |
| [Trainee Docs Design](https://www.figma.com/design/TbVKdzEuboBFDhK2c9b9cF) | the original design, where you copy the icons from (Task 3) |

The designs are desktop only. How the app looks on a phone is yours to design: every page has to work at 375px wide.

## How the tasks work

Each stage lives on its own branch in this repository, and every branch builds on the one before it:

| Branch | Task |
|---|---|
| `main` | Setup: start the Vite project |
| `task/01-routing` | Routing and login state |
| `task/02-theme` | Chakra, theme tokens and dark mode |
| `task/03-components` | Icons and the basic components |
| `task/04-overlays-tables` | Modal, table and chart card |
| `task/05-layout` | App layout, sidebar and hamburger menu |
| `task/06-forms` | Login and sign-up forms |
| `task/07-products` | Products, a responsive card grid |
| `task/08-users` | Users and Admins, tables that become cards |
| `task/09-dashboard` | Dashboard, charts and aggregates |

A task branch adds the instructions (`tasks/NN-*.md`), the automated checks for that task (`checks/NN-*.test.tsx`)
and the task number (`.task`). You never edit those files.

Every task file has the same parts: **Background** explains the ideas and links the docs, **Videos (optional)** lists
videos for when a topic is new to you (skip them if you know it), **Steps** says what to build, and **Done when** says
when you're finished.

### Start

```bash
git clone https://github.com/gideonpol-capi/intern-frontend.git
cd intern-frontend
git fetch origin 'refs/heads/task/*:refs/heads/task/*'
git switch -c frontend/00-setup
```

The fetch matters: `git switch` and `./changes` work with the local `task/*` branches. Then open
`tasks/00-setup.md`: you create the Vite project there. Your work stays on your own machine; you cannot push to this
repository.

### Everyday commands

After the setup:

```bash
yarn dev          # dev server on http://localhost:5173, reloads when you save
yarn build        # type check and production build
yarn lint         # oxlint
./check           # the checks for your current task (see below)
```

### Checks

```bash
./check
```

runs the checks for the setup, the current task and every task before it, then the type check and the linter. A
failing check says what is expected; read the message before reading the test. The checks find your code by the file
names, export names and labels the task asks for, so use exactly those.

### Review

When the checks pass, you go through your work with a reviewer. `./changes` shows exactly what you changed in the
current task (`./changes --stat` for a summary). Written answers that a task asks for go in `NOTES.md`, one heading per
task.

### From one task to the next

You wait for the reviewer's approval before starting the next task. Each task file ends with a "Moving on" section
with the exact commands. In short:

```bash
git switch -c frontend/02-theme       # starts from your approved Task 1 branch
git rebase task/02-theme              # puts your work on top of the Task 2 branch
```

The rebase brings in the new instructions and checks and keeps everything you built.
