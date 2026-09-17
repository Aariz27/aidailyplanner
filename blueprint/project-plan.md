# Project Plan

> One of the two planning docs you provide. Use as much detail as the project
> needs, including rationale, constraints, examples, edge cases, and explicit
> exclusions that should guide later feature work. Draft it directly, develop it
> through any AI conversation, or optionally run `/discovery` for a guided deep
> planning session. The content is always yours to direct. When it is filled in,
> run `/overview` to generate the project overview from this plus `build-plan.md`.


## 1. Problem - What problem are we solving?

Aariz keeps every task in his head or scattered across places, and a long list of
tasks does not tell him what to actually do today. He needs one place to dump
every task, then choose a small number of them for the day so the day has a clear
shape.

A second problem: a task written as a single line hides the real point of doing
it. "Software Factory Build" as one line looks like a build job, but the real
intention is to compare two ways of building software. Aariz wants to write out
the ordered steps inside a task himself, in his own words, so the steps carry the
intention and not just the mechanics.

Worked example he gave:

- Task: `Software Factory Build`
- The steps are **not** "write plan.md, write features.md, write spec.md, run the
  feature-to-implementation loop with Claude Code, refine, push to git". Those are
  just the mechanics of one build.
- The steps **are**: build DevStash with AI Blueprint, then build DevStash with
  the modified SSSF, then pick what he liked about each one, then combine both
  into a single software factory.

A third problem: small facts with dates keep getting lost. The date his semester
starts, or the date his Claude Code tokens expire. He wants one place to see
those.

## 2. Users - Who is this for?

Aariz, on his own. One person planning his own day.

## 3. Features - What does the MVP need?

- A single list where every task gets dumped, with no ordering pressure
- Ordered steps written inside a task, in Aariz's own words, describing intention
- Choosing exactly three daily priorities for today
- A daily priority can be a whole task, or one single step from inside a task
- A view of today showing the three daily priorities
- A view of how far along each task is, step by step
- A place for small important details and their dates, for example the semester
  start date or the Claude Code token expiry date
- A easy way to fill in the progression for tasks that need it, but not compulsory for every task.

## 4. Data - What are we storing?

- **Task** - the thing dumped into the list. Has a title, an optional due date,
  and an ordered list of steps. Some tasks have a due date and some do not, so
  the due date is optional and never required to save a task.
- **Step** - one entry inside a task's progression, written by Aariz, in order,
  each one either done or not done. A task can have no steps at all. Writing the
  steps is optional per task, never compulsory.
- **Daily priority** - a record that a whole task, or one specific step, was chosen
  for a given date. There are three of these per day, and three is a hard cap.
- **Detail** - a small fact to remember, with its text and its date, for example
  "semester starts" with a date.

A daily priority that Aariz does not finish on the day he chose it is not dropped and does
not move to tomorrow's three. It shows up in a separate list of everything he has
started and not yet completed, which sits in the right sidebar of the overview
tab.

Rules for how tasks move:

- Setting a task, or a step inside it, as a daily priority changes the task's `status` to `started`.
- Finishing a task changes its `status` to `done`, and the task moves to the
  Completed tab.
- Aariz can set an item from the started-but-not-completed list as a daily
  priority again today, and it counts toward today's three.
- Ticking a daily priority as done, when that daily priority is one step inside
  a task, also marks that step as done, and the step shows a complete indicator
  in the task's progression.
- Deleting a whole task deletes everything inside it: its steps and its daily priorities.
- Aariz can also delete a single step inside a task without deleting the task.

### Draft columns, with one real row each

Draft only. Change any column name, type or row before `/overview` locks it.

**tasks**

| id | title | due_date | status | created_at |
|----|-------|----------|--------|------------|
| 1 | Software Factory Build | _(empty)_ | open | 2026-09-17 09:14 |

- `id` (integer, auto) - the task's own number
- `title` (text, required) - what Aariz typed into the dump list
- `due_date` (date, optional) - left empty on most tasks
- `status` (text) - one of `open`, `started`, `done`
- `created_at` (timestamp) - when he dumped it

**steps**

| id | task_id | position | title | done |
|----|---------|----------|-------|------|
| 1 | 1 | 1 | Build DevStash with AI Blueprint | no |

- `id` (integer, auto)
- `task_id` (integer) - which task this step belongs to
- `position` (integer) - 1, 2, 3 in the order Aariz drew the flow chart
- `title` (text, required) - the step in his own words
- `done` (boolean) - ticked or not

**daily_priorities**

| id | priority_date | task_id | step_id | done |
|----|-----------|---------|---------|------|
| 1 | 2026-09-17 | 1 | 1 | no |

- `id` (integer, auto)
- `priority_date` (date) - the day this was chosen for
- `task_id` (integer) - always filled
- `step_id` (integer, optional) - filled when he chose one single step instead of
  the whole task; empty when he chose the whole task
- `done` (boolean) - a daily priority left at `no` after its day is what shows in the
  started-but-not-completed sidebar
- At most three rows are allowed per `priority_date`

**important_dates**

| id | label | on_date |
|----|-------|---------|
| 1 | Semester starts | 2026-09-28 |

- `id` (integer, auto)
- `label` (text, required) - the fact, for example "Claude Code tokens expire"
- `on_date` (date, required) - the date it happens

## 5. Tech - What stack are we using?

Already scaffolded and committed in this repository:

- Next.js 16, App Router
- React 19
- TypeScript 5
- Tailwind CSS v4
- npm
- better-sqlite3

Storage: the SQLite file lives in a `data/` folder at the root of this project.
The whole `data/` folder is in `.gitignore`, because the repository is public and
the file holds Aariz's real tasks.

## 6. Monetize - How will this make money?

This will not make money.

## 7. UI/UX - How should this look and feel?

The UI and UX need to support the ability to quickly see what tasks i have dumped, which ones are started but not yet finished and whats planned for today (the 3 priorities. Max = 3). Complete tasks can be in a different tab. 

Adding progression tasks to general tasks should be as easy as clicking a "add progressions" which opens the task up and displays a flow chart style diagram like [] -> [] with the default being 2 nodes with one arrow between them and then add option to add " -> []"

Consequently, there will be 3 tabs, 

*first*  is the overview containing:
1. Dumped tasks - left sidebar
2. Daily tasks - middle 
3. Tasks started but not completed - right sidebar
4. Important dates as a little box in the top right corner

*second* is the strategy tab which shows:
1. All tasks and their progressions

*third* is the complete tasks

**Approved Design**
Neumorphism with dark mode. Located in prototypes/

## 8. Deployment - Where and how will this ship?

This app is not going on Vercel. It runs on a server Aariz controls, and he opens
it in his browser locally. Build command is `npm run build` and start command is
`npm run start`. Server runs on this Mac only.

## 9. Usage model and constraints (optional)

One person, Aariz, using it himself. The app is never put on the public internet,
so there is no login and no other accounts.