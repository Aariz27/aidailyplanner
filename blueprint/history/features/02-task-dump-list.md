# Feature: Task dump list

**From build-plan:** feature 2
**Build attempt:** 1
**Branch:** feature/task-dump-list
**Status:** verified

## Goal

Give Aariz the left sidebar of the overview tab, titled "Dumped", where he can add a
task by typing its title (with an optional due date), change a task's title or due
date, and delete a task. Every change is saved to the `tasks` table in
`data/planner.db`, so the list is the same after a page reload.

## Design reference

- `prototypes/overview.html` (local only, gitignored): the `LEFT: DUMPED` panel
  (`.panel`, `.panel-head`, `.dump-input`, `.row-list`, `.task-row`, `.row-actions`,
  `.btn-pill`) and the neumorphism helper classes (`.ext-lg`, `.ext-sm`, `.inset-lg`,
  `.inset-sm`, `.circle-inset`).
- `prototypes/theme.css`: the light and dark colour, radius and font tokens.
- Project plan section 7 records the approved design as "Neumorphism with dark mode".

## In scope

- Port the prototype's light and dark tokens into `app/globals.css` (Tailwind v4
  `@theme` plus CSS variables), with dark values under `:root[data-theme="dark"]`.
- Light/dark toggle button from the prototype, top right of the page. The app opens
  in light mode by default and ignores the Mac's light/dark setting. Clicking the
  toggle switches the theme and remembers the choice in `localStorage` under
  `planner-theme`, so a reload keeps it.
- Replace the create-next-app page in `app/page.tsx` with the overview board: the
  three-column grid from the prototype, with only the left column filled by the
  Dumped panel. Set the page title in `app/layout.tsx` metadata to "Daily Planner"
  and drop the Geist fonts in favour of the ported `--font-sans` token.
- Dumped panel header: title "Dumped" and a count line ("1 task", "9 tasks").
- Add a task: title field with placeholder "Dump a task", an optional date input, and a
  plus button. Enter in the title field or the plus button submits. On success the
  title and date clear and focus stays in the title field.
- The title field in the add form and in the edit form wraps long text and grows
  downward instead of scrolling sideways. Line breaks are not allowed in a title;
  pasted line breaks become spaces.
- List every task whose `status` is not `done`, newest first (`id DESC`). Each row
  shows the full title, wrapped onto more lines when long (never cut off with "..."),
  and a meta line: `due 22 Sep` when `due_date` is set, otherwise
  `no due date`.
- Edit a task: an "Edit" button in the row's action area swaps the row for an inline
  form with the title and due date filled in. Save writes the change; Cancel or the
  Escape key restores the row without saving. The due date can be cleared.
- Delete a task: a "Delete" button in the row's action area. The first click changes
  the button to "Confirm delete"; the second click deletes. Moving focus away or
  pressing Escape resets it. Deleting removes the task's steps and daily priorities
  through the existing `ON DELETE CASCADE`.
- Row actions appear on hover, as in the prototype, and also on keyboard focus
  (`:focus-within`) so they can be reached with Tab.
- States: empty list, submit in progress, validation error, task already deleted,
  unexpected database error (details under Build steps and Data / contracts).

## Out of scope

- "Set as daily priority" button (feature 4) and "Add progressions" button and step
  counts in the meta line (feature 3). Do not render disabled placeholders for them.
- Middle column, right column, important dates box, tabs, masthead date line
  (features 4 to 8).
- The arrow button in the prototype's panel header.
- Marking a task done, changing `status`, and the Completed tab.
- Title length limits, sorting controls, search, drag to reorder.

## Build loop

`workflow.stepReview` is `feature` and `workflow.checkpointCommits` is `disabled`:
build all steps in order, run each step's check, then present one review packet at
the end. No commits during implementation; `/complete` makes the feature commit.

## Build steps

- [x] **1. Port the theme, add the toggle, clear the starter page.** Move the `:root`
  and `:root[data-theme="dark"]` token values from `prototypes/theme.css` into
  `app/globals.css`. Port the neumorphism helper classes the Dumped panel and toggle
  use. In `app/layout.tsx`, add a small inline script in `<head>` that reads
  `planner-theme` from `localStorage` (inside try/catch) and sets `data-theme` to
  `dark` only when the saved value is `dark`, otherwise `light`, before the page
  paints; add `suppressHydrationWarning` on `<html>`. Build the toggle as a client
  component with `aria-label="Toggle dark mode"`, `aria-pressed` and a Light/Dark
  label. Replace the starter markup in `app/page.tsx` with the toggle and the empty
  three-column board; keep `export const dynamic = "force-dynamic"` and the `getDb()`
  call. Update `app/layout.tsx` metadata and fonts.
  **Done when:** `npx tsc --noEmit`, `npm run lint` and `npm run build` pass; `/`
  opens in light mode with no saved choice, even when the Mac is in dark mode;
  clicking the toggle switches to dark and a reload stays dark with no flash of light
  mode; clicking again returns to light; no Next.js or Vercel starter content shows.

- [x] **2. Read and add tasks.** Add `listDumpTasks()` in `app/lib/tasks.ts` and the
  `createTask` Server Action in `app/actions/tasks.ts`. Build the Dumped panel with the
  header count, the add form, the rows and the empty state. The form uses
  `useActionState` so the plus button is disabled while saving and errors show inline.
  **Done when:** typecheck, lint and build pass; adding "Software Factory Build" with
  no date shows it at the top with `no due date`; adding a task with 2026-09-22 shows
  `due 22 Sep`; a blank or spaces-only title shows "Type a task first." and saves
  nothing; both tasks are still there after a reload; the empty list shows
  "No tasks yet. Dump one above."

- [x] **3. Edit a task.** Add the `updateTask` Server Action and the inline edit form.
  **Done when:** typecheck, lint and build pass; changing a title and due date saves
  and survives a reload; clearing the due date shows `no due date`; Escape and Cancel
  leave the row unchanged; a blank title shows "Type a task first." and keeps the
  edit form open with the typed text.

- [x] **4. Delete a task.** Add the `deleteTask` Server Action and the two-click
  delete button.
  **Done when:** typecheck, lint and build pass; one click shows "Confirm delete" and
  deletes nothing; Escape or moving focus away resets it; the second click removes the
  row and it stays gone after a reload; the header count updates; deleting a task that
  was already deleted in another browser tab shows "That task no longer exists." and
  the list refreshes.

## Files / areas

- `app/globals.css` - theme tokens and neumorphism classes
- `app/layout.tsx` - metadata title, font, inline theme script
- `app/components/theme/ThemeToggle.tsx` - new, client component
- `app/page.tsx` - server component, reads tasks, renders the board
- `app/lib/tasks.ts` - new, `listDumpTasks()` read query (server only)
- `app/actions/tasks.ts` - new, `"use server"` with `createTask`, `updateTask`,
  `deleteTask`
- `app/components/tasks/TaskDumpList.tsx` - new, panel, header count, empty state
- `app/components/tasks/AddTaskForm.tsx` - new, client component
- `app/components/tasks/TaskList.tsx` - new, client component, add form, rows, and the "no longer exists" message
- `app/components/tasks/TitleTextarea.tsx` - new, title field that grows downward
- `app/components/tasks/TaskRow.tsx` - new, client component with view, edit and
  delete-confirm states
- `app/types/db.ts` - reuse the existing `Task` type; add an `ActionResult` type here
  or in `app/types/tasks.ts` if one is needed

## Data / contracts

Reads and writes only the existing `tasks` table from `app/lib/db.ts`. No schema
change.

- **Read:** `SELECT id, title, due_date, status, created_at FROM tasks WHERE status != 'done' ORDER BY id DESC`.
- **createTask(prevState, formData):** fields `title`, `due_date`. Inserts
  `title` and `due_date` only; `status` (`open`) and `created_at` come from the
  column defaults.
- **updateTask(prevState, formData):** fields `id`, `title`, `due_date`. Updates
  `title` and `due_date` only. Never touches `status` or `created_at`.
- **deleteTask(prevState, formData):** field `id`. Deletes the row; foreign keys are
  already on in `getDb()`, so steps and daily priorities cascade.
- **Validation (server side, in every action, before any query):**
  - `title`: string, trimmed; empty after trimming -> error "Type a task first."
    The trimmed value is what gets stored.
  - `due_date`: empty string or missing -> `NULL`. Otherwise must match
    `YYYY-MM-DD` and be a real calendar date (2026-02-30 fails) -> error
    "Pick a valid due date."
  - `id`: must parse as a positive integer -> error "That task no longer exists."
    An update or delete that changes 0 rows returns the same error.
- **Result shape:** every action returns
  `{ success: true } | { success: false, error: string }`, wraps its database work in
  try/catch, and returns "Could not save. Try again." for an unexpected error without
  sending the raw error text to the browser. On success, and on the "no longer exists"
  error, call `revalidatePath("/")`.
- **Date display:** format `due_date` by splitting the `YYYY-MM-DD` string, not with
  `new Date(...)`, so the day never shifts with the timezone. Output `22 Sep`.
- **Rendering:** titles render as plain React text. No `dangerouslySetInnerHTML`.
- **Accessibility:** the title and date inputs have labels (visually hidden is fine);
  the plus button has `aria-label="Add task"`; errors render in an element with
  `role="alert"` linked by `aria-describedby`; errors clear on the next successful
  submit; after Save or Cancel in edit mode, focus returns to that row's Edit button.

## Testing

- No test runner and no Verify command are configured, so there are no automated
  tests in this feature.
- Every step runs `npx tsc --noEmit`, `npm run lint` and `npm run build`.
- The behaviour in each step's Done when is confirmed by hand (or with `/check`)
  against `npm run dev` on http://localhost:3000. Run that against a real
  `data/planner.db`; it holds Aariz's own tasks, so do not wipe it.

## Notes for the AI

- Read `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md`
  and the Server Actions guide it links before writing the actions. This Next.js
  version differs from older training data.
- Import `getDb()` and `app/lib/tasks.ts` only from server code.
- There is no toast library. Show errors inline; do not add a dependency.
- Keep the pages `force-dynamic` so `npm run build` never opens `data/planner.db`.
- The prototype's markup uses `div` tabs and `readonly` inputs; build real `form`,
  `input` and `button` elements instead.
- No em dashes in code comments or UI text.
- The prototype's theme script falls back to `prefers-color-scheme`. Do not copy that
  fallback: Aariz decided the default is light mode.
- The project overview still lists "Dark mode and the neumorphism look" as an open
  question even though project plan section 7 records it; `/overview` clears that.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":11281,"specSha256":"31563d159251abb49eed6482eda1d965a65a303a6dc90b9489b42bc9201933e8","branch":"refs/heads/feature/task-dump-list","head":"f7e56cab04a9592b3e12af47654a8af0674476ab","baseRef":"refs/heads/main","baseCommit":"bea31c7efbdf18cbd16e4ee28cf24589605dd50a","sourceTree":"76d421531e2f5a0a0091ff58328346b6be2b7099","absentOptional":[]} -->

## Independent review

**Status:** passed
**Target commit:** f7e56cab04a9592b3e12af47654a8af0674476ab
**Base commit:** bea31c7efbdf18cbd16e4ee28cf24589605dd50a
**Base ref:** main
**Spec hash:** 31563d159251abb49eed6482eda1d965a65a303a6dc90b9489b42bc9201933e8
**Prepared by:** claude
**Builder model:** claude-opus-5
**Requested reviewer:** claude
**Requested model:** claude-opus-5
**Requested execution:** automatic
**Requested at:** 2026-09-17T11:49:19Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** claude
**Reviewer model:** claude-opus-5
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-09-17T11:51:25Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

## Handoff

Review the active spec and the complete `bea31c7efbdf18cbd16e4ee28cf24589605dd50a..f7e56cab04a9592b3e12af47654a8af0674476ab` delta in a fresh
session or isolated subagent without the builder conversation. Run all Audit lenses from scratch.
Run Check when required above. Do not edit product code, accept findings, or
reuse the existing findings as the review scope.

## Commands

- `npx tsc --noEmit`: pass (exit 0)
- `npm run lint`: pass (exit 0, no output)
- `npm run build`: pass (exit 0; `/` dynamic, `/_not-found` static; only warning is Next ignoring a stray `package-lock.json` in the home directory)
- Test command: unavailable (no test runner configured)
- Verify command: unavailable (none configured)

## Evidence

- Preconditions matched: `HEAD` = target, `git merge-base main HEAD` = base, SHA-256 of `blueprint/context/current-feature.md` = spec hash (spec is tracked, no snapshot), only `blueprint/context/review.md` differed from target.
- Reviewed all 13 app files in the delta (`app/actions/tasks.ts`, `app/lib/tasks.ts`, `app/lib/format.ts`, `app/types/tasks.ts`, `app/page.tsx`, `app/layout.tsx`, `app/globals.css`, `app/components/tasks/*`, `app/components/theme/ThemeToggle.tsx`) plus `app/lib/db.ts` and `app/types/db.ts`.
- Security: every Server Action validates title, due date and id server side before any query; all SQL uses bound parameters; raw DB errors go only to `console.error`, the browser gets "Could not save. Try again."; titles render as React text; the only `dangerouslySetInnerHTML` is the constant theme script in `app/layout.tsx`.
- Spec contract: read query, insert/update columns, 0-row "no longer exists" handling with `revalidatePath("/")`, split-string date formatting, `force-dynamic` page, light default with no `prefers-color-scheme` fallback all match the spec.
- Performance: single cached `getDb()` connection; one unpaginated list query is proportionate for a single-user local app.
- `data/planner.db` was not opened; build did not touch it (page is `force-dynamic`).

## Findings

- F-01 [P2] open - Enter in the add-task title submits again while a save is pending
- F-02 [P2] unverified - Delete confirmation may not reset on blur or Escape in Safari

## Remaining risk

- Browser behaviour was not run: no dev server, no `/check` (not required). Hover/focus row actions, theme toggle with no flash, edit focus return, Escape handling, textarea growth and delete confirm flow are verified only by reading code.
- No test runner, so parsers (`parseDueDate`, `parseId`) and `formatDueDate` have no automated tests.
- No Verify command configured.
- Server Actions have no authentication; this relies on the server listening only on the Mac, which feature 9 is meant to confirm.
