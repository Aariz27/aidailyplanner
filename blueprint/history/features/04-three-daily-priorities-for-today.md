# Feature: Three daily priorities for today

**From build-plan:** feature 4
**Build attempt:** 1
**Branch:** feature/three-daily-priorities-for-today
**Status:** verified

## Goal

Fill the middle column of the overview tab with today's daily priorities. Aariz can
set a whole task, or one single step inside a task, as a daily priority for today.
Today holds at most three. Each daily priority shows as a card with three status
buttons, "Open" (blue), "Started" (orange-yellow) and "Done" (green). A new daily
priority starts as Open. Aariz can also remove a card from today. Everything is saved
in the database, so it survives a reload.

## Design reference

- `prototypes/overview.html` (local only, gitignored), block `<!-- MIDDLE: TODAY -->`
  and its CSS under `/* middle column: today */`:
  - `.gauge-card`: "Today" heading, sub line "3 daily priorities", a half-circle of
    tick lines, readout "3" over "of 3 today".
  - `.priority-card`: round icon well, `.priority-dots` in the top right, title (17px,
    semibold), meta line (12px, muted), for a step a row of `.step-node` circles
    joined by `.step-line`.
  - `.priority-note`: "3 of 3 daily priorities set. Finish or remove one to add another."
- The States section of the same file:
  - "Today, 2 of 3": two cards plus one `.empty-slot.inset-lg` reading
    "Choose a task or a step". The prototype's breathing animation is left out:
    Aariz found the constant pulsing distracting.
  - "Daily priority done": title struck through (`.strike`).
- The prototype's round `.checkbox` on each card is replaced by the three status
  buttons (Aariz's revision).
- Dumped rows in the prototype carry a "Set as daily priority" pill, shown disabled
  (`opacity .4`) when today is full.
- Build from the existing utilities in `app/globals.css` (`ext-lg`, `ext-sm`,
  `inset-lg`, `inset-sm`, `circle-inset`, `pressed`) and `PILL`. Add only the few
  tokens and classes the middle column needs that do not exist yet: `--open` (blue)
  and `--started` (orange-yellow) in both themes next to the existing `--done`
  green.

## In scope

- **Today gauge** (right column of the grid in `app/page.tsx`, Aariz's revision: the
  middle column holds only the cards): heading "Today", sub line "N daily priorities"
  ("1 daily priority" for one), the tick-line half circle, readout N over "of 3
  today", and under it one line per daily priority with a dot in its status colour,
  its title and its status word. The arc is cut into three equal blocks, one per place
  in the day; a block takes the colour of the daily priority in that place (blue for
  Open, orange-yellow for Started, green for Done) and stays grey while the place is
  free.
- **Today column** (middle of the grid):
  - One card per daily priority for today, in the order they were set (`id`).
  - One "Choose a task or a step" empty slot for each free place, so cards plus empty
    slots always make three.
  - The note "3 of 3 daily priorities set. Finish or remove one to add another." shows
    only when three are set.
- **Card content:**
  - Whole task: title is the task title; meta is "Whole task", plus
    " · due 22.09.2026" when the task has a due date (reuse `formatDueDate`, which
    feature 3 made the date format across the app).
  - One step: title is the step text; meta is "Step 2 of 4 · <task title>"; under it
    one small circle per step of that task in `position` order, joined by short
    lines, a done step filled with the `--done` green used by the Dumped row chart.
    Screen readers get "4 steps, 1 done" like the Dumped row chart.
  - Icon well: the document icon from `TaskRow` for a whole task, the flow icon from
    the prototype for a step.
  - Three status buttons in a row at the bottom of the card: "Open", "Started",
    "Done". Each button uses its own colour (`--open` blue, `--started`
    orange-yellow, `--done` green) for its text. The button for the card's current
    status is pressed in (`pressed`) and filled with its colour.
  - A card whose status is Done shows its title struck through.
- **Set a whole task as a daily priority:** a "Set as daily priority" pill first in
  each Dumped row's hover/focus action area, before Edit and Delete. It is
  disabled when today already has three. Four pills do not fit the column's width,
  so "Add progressions" moves from the row into the Edit view, next to Cancel and
  Save (Aariz's revision). The task's `status` is not changed by
  setting it; a new daily priority shows as Open.
- **Set one step as a daily priority:** a "Set as daily priority" button on each
  saved step box inside the "Add progressions" pop-up, next to "Delete step". It is
  disabled when today already has three. The pop-up stays open after it succeeds and
  its status line reads "Saved"; errors show in the pop-up's existing alert line.
  Empty (unsaved) boxes have no such button.
- **Dumped row outline:** a task row in the Dumped list carries a thin outline in its
  status colour, the same blue for `open` and orange-yellow for `started` used by the
  card's status buttons, so the two columns match. A task that has never been a daily
  priority shows no colour; the outline appears when the task is added to the priority
  list, and it is blue because a new daily priority starts as Open (Aariz's revision).
- **No repeats in today's list (Aariz's revision):** a whole task that is already one
  of today's daily priorities cannot be added again, and neither can a step that is
  already there. The button that would add it is disabled, and the server refuses the
  repeat with "That is already one of today's daily priorities." A whole task and one
  of its own steps are different items, so both can sit in today's list.
- **Status buttons on a whole-task card** set the card's own status and the task's
  `status` to the same value:
  - Open: the row's `status = 'open'` and `done = 0`, `tasks.status = 'open'`.
  - Started: the row's `status = 'started'` and `done = 0`,
    `tasks.status = 'started'`.
  - Done: the row's `status = 'done'` and `done = 1`, `tasks.status = 'done'`. The task leaves
    the Dumped list straight away; its card stays in today's column. Pressing Open or
    Started afterwards puts the task back in the Dumped list.
- **Status buttons on a step card** never change the task's `status`. The card keeps
  its own status in a new `status` column on `daily_priorities`:
  - Open: the row's `status = 'open'`, `done = 0`, and `steps.done = 0`.
  - Started: the row's `status = 'started'`, `done = 0`, and `steps.done = 0`.
  - Done: the row's `status = 'done'`, `done = 1`, and `steps.done = 1`, so the step
    turns green in the Dumped row chart and in the card's own circles.
- **Remove a daily priority from today:** the card's dots button opens a small menu
  with "Remove from today". The row is deleted and its place frees up. The task's
  `status` stays as it is.
- **States:** no daily priorities today (gauge 0, three empty slots), one to three
  set, all three set (pills and step buttons disabled, note shown), a Done card, a
  request in progress (the pressed control is disabled while its request runs), today
  full when another tab filled it first, the task, step or daily priority deleted in
  another tab, an unexpected database error.

## Out of scope

- The right sidebar "Started, not completed" list and its "Set as daily priority"
  pill (feature 5). Past days' unfinished daily priorities are not shown anywhere in
  this feature.
- Important dates box (feature 6), Strategy tab (feature 7), Completed tab (feature 8).
- Showing or changing a task's status anywhere except on its daily priority card.
- Choosing daily priorities for any day other than today.
- Reordering cards.
- Ticking steps done anywhere except through a step's daily priority card.
- Any schema change beyond the one new `daily_priorities.status` column. The tables,
  cascade deletes and the three-per-day trigger already exist in `app/lib/db.ts`.

## Build loop

`workflow.stepReview` is `feature` and `workflow.checkpointCommits` is `disabled`:
build all steps in order, run each step's check, then present one review packet at
the end. No commits during implementation; `/complete` makes the feature commit.

## Build steps

- [x] **1. Add the status column, read today's daily priorities, show the Today
  column.** Add the `status` column to `daily_priorities` in `app/lib/db.ts` with the
  migration described under Data / contracts. Add
  `app/lib/priorities.ts` with `todayDate()` and `listTodayPriorities(today)`. Add
  the `--open` and `--started` tokens. Add `app/components/priorities/TodayColumn.tsx`
  and `PriorityCard.tsx` (display only, status buttons and dots not wired yet) and
  render the column as the second grid child in `app/page.tsx`.
  **Done when:** `npx tsc --noEmit`, `npm run lint` and `npm run build` pass;
  `sqlite3 data/planner.db "PRAGMA table_info(daily_priorities)"` lists `status` and
  every existing row prints `open`, while the rows Aariz already has keep their
  `priority_date`, `task_id`, `step_id` and `done`; with no
  rows for today the column shows the gauge reading 0, sub line "0 daily priorities"
  and three "Choose a task or a step" slots; after inserting test rows by hand for a
  throwaway task (`sqlite3 data/planner.db "INSERT INTO daily_priorities (priority_date, task_id, step_id) VALUES (date('now','localtime'), <id>, NULL)"`)
  a whole-task card and a step card show the meta lines described above and three
  coloured status buttons with Open pressed in, the empty slots shrink to fill three,
  and at three the note shows; the colours are readable in light and dark mode.

- [x] **2. Set a whole task as a daily priority.** Add `app/actions/priorities.ts`
  with `setDailyPriority`. Add the "Set as daily priority" pill to `TaskRow`, pass a
  `todayFull` flag from `app/page.tsx` through `TaskDumpList` and `TaskList`, and
  report errors through the existing Dumped list notice.
  **Done when:** typecheck, lint and build pass; clicking the pill on a throwaway
  `open` task adds its card with Open pressed in, and
  `sqlite3 data/planner.db "SELECT status FROM tasks WHERE id = <id>"` still prints
  `open`; clicking the pill again on the same task adds a second card; after three
  are set every pill is disabled; submitting a fourth from a second tab opened before
  the third was set shows "Today already has three daily priorities." and no fourth
  row exists; a task deleted in another tab shows "That task no longer exists."

- [x] **3. Set one step as a daily priority.** Pass `todayFull` through `TaskRow` and
  `ProgressionsDialog` to `StepBox`, and add the "Set as daily priority" button that
  calls `setDailyPriority` with `step_id`.
  **Done when:** typecheck, lint and build pass; clicking the button on step 2 of a
  throwaway task keeps the pop-up open, shows "Saved", and after closing the pop-up
  the Today column shows a card "Step 2 of N · <task title>" with the step circles;
  an empty box shows no button; with three set the button is disabled; a step
  deleted in another tab shows "That step no longer exists." in the pop-up and no
  row is written.

- [x] **4. Wire the status buttons.** Add `setDailyPriorityStatus` and wire the three
  buttons on both kinds of card.
  **Done when:** typecheck, lint and build pass; on a whole-task card pressing
  Started fills Started orange-yellow and the task's status prints `started`;
  pressing Done fills Done green, strikes the title, removes the task from the Dumped
  list and the status prints `done`; pressing Open fills Open blue, puts the task
  back in the Dumped list and the status prints `open`; on a step card pressing Done
  turns that step green in the card circles and in the Dumped row chart while
  `sqlite3 data/planner.db "SELECT status FROM tasks WHERE id = <id>"` still prints
  the value it had before; pressing Started or Open on the step card turns the step
  back to not green and still leaves the task's status alone; all of this survives a
  reload; a daily priority deleted in another tab shows "That daily priority no
  longer exists."

- [x] **5. Remove a daily priority from today.** Add `removeDailyPriority` and the
  dots menu with "Remove from today".
  **Done when:** typecheck, lint and build pass; removing a card frees its place
  (an empty slot returns, pills and step buttons re-enable, the note hides), a reload
  confirms the row is gone, and the task's status prints the same value as before;
  Escape or clicking outside closes the menu and focus returns to the dots button.

## Files / areas

- `app/lib/priorities.ts` - new, server only: `todayDate(now = new Date())` and
  `listTodayPriorities(today)`
- `app/actions/priorities.ts` - new, `"use server"`: `setDailyPriority`,
  `setDailyPriorityStatus`, `removeDailyPriority`
- `app/types/tasks.ts` - add `TODAY_FULL`, `PRIORITY_GONE` and
  `ALREADY_TODAY = "That is already one of today's daily priorities."`
- `app/types/db.ts` - add a `TodayPriority` row type for the joined read; reuse
  `TaskStatus`
- `app/page.tsx` - read today's priorities, pass them to `TodayColumn`, pass
  `todayFull` to `TaskDumpList`
- `app/components/priorities/TodayColumn.tsx` - new: cards, empty slots, note, its
  own error notice
- `app/components/priorities/TodayGauge.tsx` - new: the right column's Today gauge
  with its colour-coded arc and status list
- `app/components/priorities/PriorityCard.tsx` - new client component: one card, its
  three status buttons and its dots menu
- `app/components/tasks/TaskDumpList.tsx`, `TaskList.tsx`, `TaskRow.tsx` - pass
  `todayFull` down; "Set as daily priority" pill in the row's actions, and
  "Add progressions" moved into the Edit view, which now owns the pop-up
- `app/components/tasks/ProgressionsDialog.tsx`, `StepBox.tsx` - pass `todayFull`
  down; "Set as daily priority" button on saved step boxes, using the pop-up's
  existing status line and alert line
- `app/globals.css` - `--open` and `--started` tokens for both themes, exposed as
  Tailwind colours like `--done`
- `app/lib/form.ts` - reuse `parseId`; `app/lib/format.ts` - reuse `formatDueDate`

## Data / contracts

Reads and writes the existing `daily_priorities`, `tasks` and `steps` tables from
`app/lib/db.ts`, and adds one column to `daily_priorities`.

- **Schema change:** `status TEXT NOT NULL DEFAULT 'open'` on `daily_priorities`,
  holding `open`, `started` or `done`. `data/planner.db` already exists on Aariz's
  Mac and `CREATE TABLE IF NOT EXISTS` never alters a table that is already there, so
  `getDb()` runs a migration after the schema: read
  `PRAGMA table_info(daily_priorities)` and, when no `status` column is listed, run
  `ALTER TABLE daily_priorities ADD COLUMN status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'started', 'done'))`
  followed by `UPDATE daily_priorities SET status = 'done' WHERE done = 1`, both in
  one transaction. The new `CREATE TABLE` text carries the same column, so a fresh
  database needs no migration. No existing row loses data and nothing is dropped.
- **`done` stays in step with `status`:** `done = 1` exactly when `status = 'done'`.
  The overview's data model and feature 5 both read `done`, so every write sets both.

This spec changes one rule from `blueprint/project-plan.md` and
`blueprint/context/project-overview.md`: setting a daily priority no longer moves the
task from `open` to `started`. Aariz sets the status himself with the card buttons.

- **Today:** `todayDate()` returns the Mac's local date as `YYYY-MM-DD` built from
  `getFullYear()`, `getMonth()` and `getDate()`, never `toISOString()` (that is UTC
  and shifts the day in the evening). The server computes it on every page request
  and inside every action; the browser never sends a date. A page left open past
  midnight shows yesterday's column until it reloads, but any action it submits
  writes to the new day.
- **Read (`listTodayPriorities`):** `daily_priorities` rows where
  `priority_date = today`, ordered by `id`, with their own `status`, joined to
  `tasks` for `title`, `due_date`
  and `status`, and left-joined to `steps` for the chosen step's `title`, `position`
  and `done`. The page also needs every step of each step card's task (for "of N" and
  the circles); read them in one query by `task_id` and group like `app/page.tsx`
  already does. Tasks of any `status` are included, so a `done` whole task keeps its
  card.
- **`setDailyPriority(prevState, formData)`:** fields `task_id` (required),
  `step_id` (optional, empty means whole task). In one `getDb().transaction(...)`:
  1. the task must exist, otherwise `TASK_GONE`;
  2. when `step_id` is given, the step must exist with that `task_id`, otherwise
     `STEP_GONE`;
  3. count today's rows; at 3 return `TODAY_FULL`;
  4. refuse a repeat with `ALREADY_TODAY` when a row for today already has the same
     `task_id` and the same `step_id` (compared with SQLite's `IS`, so two whole-task
     rows match on a NULL `step_id`);
  5. `INSERT INTO daily_priorities (priority_date, task_id, step_id) VALUES (?, ?, ?)`;
     `status` and `done` come from the column defaults, so the new card starts as Open.
  It never changes `tasks.status`. The existing `daily_priorities_max_three` trigger
  stays the final guard; if it raises, return `TODAY_FULL`.
- **`setDailyPriorityStatus(prevState, formData)`:** fields `id`, `status` (`open`,
  `started` or `done`; anything else is rejected as an unexpected error). In one
  transaction: read the row's `task_id` and `step_id`, missing returns
  `PRIORITY_GONE`. Every row gets
  `UPDATE daily_priorities SET status = ?, done = ? WHERE id = ?`, with `done` 1 for
  `done` and 0 otherwise. Then, for a whole-task row,
  `UPDATE tasks SET status = ? WHERE id = ?` with the same status; for a step row,
  `UPDATE steps SET done = ? WHERE id = ?` with the same `done` value and no write to
  `tasks`.
- **Card's current status:** both kinds of card show the daily priority row's own
  `status`. A whole-task card's `status` and its task's `status` always hold the same
  value, because the same action writes both and nothing else changes a task's
  status in this feature. When the same step is set twice today, each card keeps its
  own status, and the step's `done` follows whichever card was pressed last.
- **`removeDailyPriority(prevState, formData)`:** field `id`.
  `DELETE FROM daily_priorities WHERE id = ?`; 0 rows deleted returns
  `PRIORITY_GONE`. No other table changes.
- **Validation (server side, before any query):** `task_id` must parse with
  `parseId`, otherwise `TASK_GONE`; `step_id` is either empty or passes `parseId`,
  otherwise `STEP_GONE`; `id` must pass `parseId`, otherwise `PRIORITY_GONE`.
- **Result shape:** the existing `ActionResult`. Database work in try/catch;
  unexpected errors log on the server and return "Could not save. Try again." with no
  raw error text. `revalidatePath("/")` on success, `TASK_GONE`, `STEP_GONE`,
  `PRIORITY_GONE`, `TODAY_FULL` and `ALREADY_TODAY`, so the page shows the real state.
- **Deletes:** deleting a task or step already removes its daily priorities through
  the existing `ON DELETE CASCADE`; the card disappears on revalidation.
- **Double submit:** each pill, step button, status button and menu item is disabled
  while its request is pending, so a double click sends one request.
- **Rendering:** task and step titles render as plain React text. No
  `dangerouslySetInnerHTML`.
- **Accessibility:** the column is a `<section>` labelled by its "Today" heading;
  cards are a list; the three status buttons sit in a `role="group"` labelled
  "Status of <title>", each a `<button>` with `aria-pressed` true on the current
  status, and each colour is paired with its text label so status never depends on
  colour alone; the dots button has `aria-label` "More options for <title>",
  `aria-expanded`, and the menu closes on Escape or an outside click with focus back
  on the dots button; the gauge and step circles are `aria-hidden` with a text
  equivalent; column errors render with `role="alert"` and clear on the next
  successful action.

## Testing

- No test runner and no Verify command are configured, so there are no automated
  tests in this feature.
- Every step runs `npx tsc --noEmit`, `npm run lint` and `npm run build`.
- Each Done when is confirmed by hand (or with `/check`) against `npm run dev` on
  http://localhost:3000. `data/planner.db` holds Aariz's real tasks and today's real
  daily priorities, and test rows for today use up his three places. Create
  throwaway tasks, and delete them when done so the cascade removes their daily
  priorities.

## Notes for the AI

- Read `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md`
  before writing the actions.
- Import `getDb()`, `app/lib/tasks.ts` and `app/lib/priorities.ts` only from server
  code.
- Keep the page `force-dynamic` so `npm run build` never opens `data/planner.db`.
- Do not pass the date from the browser to any action.
- No em dashes in code comments or UI text.
- Keep `prototypes/`; AGENTS.md says it stays until feature 8 is complete.



<!-- blueprint:completion {"schemaVersion":1,"specBytes":21165,"specSha256":"fcf5709431dbc3bf0b398b2d6a0551482cd5ba6965f420c744dcd19134586eea","branch":"refs/heads/feature/three-daily-priorities-for-today","head":"d12d7d1641f6dec37b840509b678e3d90624629c","baseRef":"refs/heads/main","baseCommit":"94ef93d6870faee518858f9775f0b21a4dff93d9","sourceTree":"3743f36e046082a9c556bcad88934e36ea5fa31e","absentOptional":[]} -->

## Independent review

**Status:** passed
**Target commit:** d12d7d1641f6dec37b840509b678e3d90624629c
**Base commit:** 94ef93d6870faee518858f9775f0b21a4dff93d9
**Base ref:** refs/heads/main
**Spec hash:** fcf5709431dbc3bf0b398b2d6a0551482cd5ba6965f420c744dcd19134586eea
**Prepared by:** claude
**Builder model:** claude-opus-5[1m]
**Requested reviewer:** claude
**Requested model:** runtime default (exact model not known until reviewer starts)
**Requested execution:** automatic
**Requested at:** 2026-09-18T08:45:03Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** claude
**Reviewer model:** claude-opus-5[1m]
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-09-18T08:50:36Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

### Commands

- `npx tsc --noEmit`: pass (exit 0, no output)
- `npm run lint`: pass (exit 0, eslint reported nothing)
- `npm run build`: pass (exit 0, Next.js 16.3.5 Turbopack, compiled in 796ms, 3 static pages, `/` dynamic)

### Evidence

- `HEAD` is d12d7d1641f6dec37b840509b678e3d90624629c, `git merge-base refs/heads/main d12d7d1` is 94ef93d6870faee518858f9775f0b21a4dff93d9, and `shasum -a 256 blueprint/context/current-feature.md` matches the recorded Spec hash.
- `git status --porcelain` showed only ` M blueprint/context/review.md` before the review wrote its files.
- Read the whole `94ef93d..d12d7d1` delta: 19 files, 1238 insertions, 47 deletions, including `app/actions/priorities.ts`, `app/lib/priorities.ts`, `app/lib/db.ts`, the three new components under `app/components/priorities/`, the changed task components, `app/page.tsx`, `app/globals.css`, `AGENTS.md` and `.gitignore`.
- Traced the spec's data contract in the code: the `daily_priorities.status` migration in `app/lib/db.ts:66-79`, the `daily_priorities_max_three` trigger text (`A day holds at most three daily priorities`) against the catch in `app/actions/priorities.ts:68`, the `step_id IS ?` repeat guard, and the `done = 1` exactly when `status = 'done'` invariant across every write.
- Confirmed step numbering is safe: `deleteStep` (`app/actions/steps.ts:73-77`) closes the position gap, so the card's "Step N of M" line stays correct.
- Verified the duplicate ignore entry with `tail -c 40 .gitignore | od -c` (no trailing newline) and `grep -n sessions.json .gitignore` (lines 44 and 54).

### Findings

- F-08 [P2] open - A refreshed whole-task card shows Open while its Dumped row outline keeps the task's older colour
- F-09 [P2] open - The feature checkpoint changes the repository's push-approval rule, which is outside this feature's scope
- F-10 [P3] open - Duplicate `sessions.json` entry added to .gitignore, and the file loses its trailing newline
- F-11 [P3] open - A "today is full" or "already a daily priority" error marks the step's title box invalid
- No P0 or P1 finding was raised. F-01, F-02, F-03, F-04 and F-07 were not re-reviewed by this pass and keep their recorded status.

### Remaining risk

- No test runner and no Verify command exist in this project, so the tests lens had no automated coverage to inspect and no test command could be run. Every daily-priority action, the status/`done` invariant and the three-per-day cap are proved only by reading the code.
- No browser was run in this review (Check was not required), so nothing visual was confirmed: the gauge arc colours, the card layout, light and dark readability of `--open` and `--started`, the dots menu closing on Escape or an outside click, and the multi-tab states the spec lists are all unverified here.
- The SQLite migration in `app/lib/db.ts` was read but not executed against `data/planner.db`, so the claim that every existing row keeps its data was not observed on the real database.
- Server actions in this app have no authentication or ownership check, which matches the rest of the project (a single local user, a local SQLite file) and is proportional, but it means any caller reaching the running server can set, restatus or remove daily priorities.
- `npm run build` printed a warning that Next.js ignored a `package-lock.json` outside the repository and suggested setting `turbopack.root`; the build still succeeded.
