# Daily Planner - Project Overview

<!-- blueprint:source-hash 8602db80c7268b82b24c346e95a75e1d16eceeff6f8ab3a9fc046b3a6315ad70 -->

> A personal planner where Aariz dumps every task, writes the intention-driven steps inside a task, and picks at most three things to do each day.

## Problem

Aariz's tasks live in his head or in scattered places, and a long list does not say what to do today. A task written as one line also hides its real intention: "Software Factory Build" is really "build DevStash with AI Blueprint, build DevStash with the modified SSSF, pick what he liked about each, combine both into one software factory", not the mechanics of a single build. Small dated facts, such as when the semester starts or when Claude Code tokens expire, keep getting lost.

## Users

- **Aariz** - the only user, planning his own day.

## Usage model

- One person. No login, no accounts, no other users.
- Runs on Aariz's own Mac only. Never put on the public internet.

## Features

In build-plan order. The headline feature is **4. Pick three for today**.

1. **SQLite storage for tasks** - one SQLite file holding the tasks, steps, picks and important dates tables, so nothing is lost on reload.
2. **Task dump list** - overview tab left sidebar: add, edit and delete tasks, each with an optional due date.
3. **Steps inside a task** - an "Add progressions" button opens a task as a `[] -> []` flow chart, starting with two boxes and one arrow, with a button to add another `-> []`. Steps are optional per task.
4. **Pick three for today** - overview tab middle column: at most three picks per day, each either a whole task or one single step.
5. **Started but not completed list** - overview tab right sidebar: every past pick that was not finished.
6. **Important dates box** - small box in the top right corner of the overview tab.
7. **Strategy tab** - every task with its full progression, showing how far along each task is.
8. **Completed tab** - finished tasks, moved off the overview.
9. **Run it on Aariz's own server** - one documented command that builds and serves the app on his Mac.

## Data model

Locked by this overview. Feature 1 creates these four tables in a SQLite file inside the root `data/` folder, which is gitignored because the repository is public. Features 2 to 8 read and write them. Types are SQLite types.

### tasks

- `id` (INTEGER, primary key, auto) - the task's own number
- `title` (TEXT, required) - what Aariz typed into the dump list
- `due_date` (TEXT `YYYY-MM-DD`, nullable) - most tasks leave it empty; never required to save a task
- `status` (TEXT, required) - one of `open`, `started`, `done`
- `created_at` (TEXT timestamp, required) - when he dumped it
- has many `steps`; referenced by `picks`
- `status` moves `open` -> `started` when the task or any of its steps is picked, and -> `done` when the task is finished; `done` tasks show in the Completed tab, not the overview
- deleting a task deletes its steps and its picks

Example row: `1 | Software Factory Build | NULL | open | 2026-09-17 09:14`

### steps

- `id` (INTEGER, primary key, auto)
- `task_id` (INTEGER, required) - references `tasks.id`
- `position` (INTEGER, required) - 1, 2, 3 in the order the flow chart is drawn
- `title` (TEXT, required) - the step in Aariz's own words
- `done` (INTEGER 0/1, required) - ticked or not
- a task can have zero steps
- a single step can be deleted without deleting its task

Example row: `1 | 1 | 1 | Build DevStash with AI Blueprint | 0`

### picks

- `id` (INTEGER, primary key, auto)
- `pick_date` (TEXT `YYYY-MM-DD`, required) - the day it was chosen for
- `task_id` (INTEGER, required) - references `tasks.id`, always filled
- `step_id` (INTEGER, nullable) - references `steps.id`; filled when one single step was picked, empty when the whole task was picked
- `done` (INTEGER 0/1, required)
- at most three rows per `pick_date` (hard cap)
- a row with `done = 0` whose `pick_date` is before today is what feature 5 lists; it does not roll into tomorrow's three and is not deleted
- an item from that list can be picked again today, as a new row for today, and it counts toward today's three

Example row: `1 | 2026-09-17 | 1 | 1 | 0`

### important_dates

- `id` (INTEGER, primary key, auto)
- `label` (TEXT, required) - for example "Claude Code tokens expire"
- `on_date` (TEXT `YYYY-MM-DD`, required)

Example row: `1 | Semester starts | 2026-09-28`

## Tech stack

- **Next.js 16 (App Router)** - the app and its server
- **React 19** - UI
- **TypeScript 5** - language
- **Tailwind CSS v4** - styling
- **npm** - package manager
- **better-sqlite3** - reads and writes the SQLite file in `data/`

## Monetization

None. This will not make money.

## UI/UX

Must make it quick to see dumped tasks, started-but-unfinished tasks, and today's three picks. Three tabs:

- **Overview** - dumped tasks in the left sidebar, today's picks in the middle (max 3), started-but-not-completed in the right sidebar, important dates in a small box in the top right corner.
- **Strategy** - all tasks and their progressions.
- **Completed** - finished tasks.

Adding steps: an "Add progressions" button opens the task and shows a flow chart, default two boxes joined by one arrow, with a control to add another `-> []`.

## Deployment

- Runs on Aariz's Mac only, opened locally in his browser. Not on Vercel.
- Build: `npm run build`. Start: `npm run start`.
- No env vars, no hosted database, no cron jobs, no domain.
- The server should listen only on this Mac, not on the home network; feature 9 confirms this.

## Open questions

> Resolve these in the plans, then re-run `/overview`.

- **Step picks.** When a pick of a single step is ticked done, is that step's `steps.done` ticked too?
- **Dark mode and the neumorphism look.** The approved prototype in `prototypes/` has a light/dark switch and a neumorphism style, but section 7 of the project plan records neither.
