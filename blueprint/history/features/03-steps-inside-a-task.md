# Feature: Steps inside a task

**From build-plan:** feature 3
**Build attempt:** 1
**Branch:** feature/steps-inside-a-task
**Status:** verified

## Goal

Let Aariz write the ordered steps inside a task in his own words. An "Add progressions"
button on a Dumped task row opens a pop-up window over the page that shows the task's
steps as a `[] -> []` flow chart. A task with no steps starts with two empty boxes and
one arrow, and a button adds another `-> []`. Each box saves itself to the `steps`
table when Aariz clicks out of it, so the steps are still there after a page reload.
A single step can be deleted without deleting its task.

## Design reference

- `prototypes/overview.html` (local only, gitignored): the `Add progressions` pill in
  `.row-actions`, the meta line `due 24 Sep · 3 steps · 1 done`, and `.step-node.done`
  (accent fill) for how a finished step looks.
- The prototype has no mockup of the opened pop-up. Build it from the existing
  neumorphism classes already in `app/globals.css` (`.ext-lg`, `.ext-sm`, `.inset-sm`,
  `.circle-inset`) and the existing `PILL` button style.

## In scope

- An "Add progressions" button in each Dumped row's hover/focus action area, before
  Edit and Delete.
- A small copy of the progression chart in the row meta line, in place of step count
  text: one small rectangle per step joined by `→` arrows, in the meta line's existing
  font size, muted colour and position. A done step's rectangle is filled green
  (`--done` token). The chart shows at most four rectangles and three arrows per line.
  Whatever does not fit moves down to the next line in order (so the arrow into step 5
  starts line 2), and the task row grows taller.
  The chart sits on the left of the meta line. The due date shows as
  `24.09.2026`, or the placeholder `dd.mm.yyyy` when there is none, starting at the
  same horizontal position as the date field in the add-task form. This replaces
  feature 2's `due 24 Sep` / `no due date` text. Screen readers get "3 steps, 1 done". A task with zero steps
  shows only the date (`24.09.2026` or `dd.mm.yyyy`) with no chart.
  (Revised after Aariz tried the feature: he asked for the small chart instead of
  "5 steps".)
- A pop-up window (native `<dialog>` opened with `showModal()`) with the task title as
  its heading, a "Progressions" label, and a Close button. Escape, the Close button, or
  a click on the dimmed backdrop closes it. Focus goes to the first box on open and
  returns to the "Add progressions" button on close.
- The flow chart: saved steps in `position` order, each in a box, joined by arrows,
  wrapping onto the next line when they do not fit. When fewer than two steps are
  saved, empty boxes are added so at least two boxes and one arrow always show. A
  button at the end (`aria-label="Add another step"`, shown as `-> +`) adds one more
  empty box and arrow and moves focus into the new box.
- Auto-save, per box:
  - An empty box that gets text is saved as a new step when Aariz clicks or tabs out
    of it, presses Enter, or closes the pop-up.
  - A saved box whose text changed is saved the same way.
  - A box whose text did not change sends nothing.
  - An empty box that stays empty is never saved.
  - A saved box cleared to blank shows "Type a step first." and the step keeps its
    old text in the database.
- A small status line in the pop-up (`aria-live="polite"`) that reads "Saving..." while
  a save runs and "Saved" after it succeeds.
- A finished step (`done = 1`) shows the accent fill from `.step-node.done` on its
  box. Its text can still be edited.
- Delete a step: a "Delete step" button on each saved box. The first click changes it to
  "Confirm delete"; the second click deletes. Moving focus away or pressing Escape
  resets it (Escape resets the button without closing the pop-up while it is
  confirming). The later steps move up one position so positions stay 1, 2, 3.
- States: a task with no steps, a save in progress, a blank saved box, the task already
  deleted in another tab, the step already deleted in another tab, an unexpected
  database error.

## Out of scope

- Ticking a step done or undone (feature 4 sets `done` through daily priorities).
- "Set as daily priority" button and anything in the middle or right columns
  (features 4 and 5).
- Reordering steps by dragging, inserting a step between two boxes, step length limits.
- The Strategy tab's full progression view (feature 7).
- Changing task `status` because steps were added.
- A dedicated page or URL for a task.

## Build loop

`workflow.stepReview` is `feature` and `workflow.checkpointCommits` is `disabled`:
build all steps in order, run each step's check, then present one review packet at
the end. No commits during implementation; `/complete` makes the feature commit.

## Build steps

- [x] **1. Read steps, show counts, open the pop-up.** Add `listStepsForDumpTasks()`
  to `app/lib/tasks.ts` and pass each task's steps from `app/page.tsx` through
  `TaskDumpList` and `TaskList` to `TaskRow`. Add the step counts to the meta line.
  Add the "Add progressions" button and the `ProgressionsDialog` client component with
  the heading, Close button, saved steps as read-only-looking boxes, empty boxes padded
  to two, arrows, and the add-box button. Boxes are editable text fields but nothing
  saves yet.
  **Done when:** `npx tsc --noEmit`, `npm run lint` and `npm run build` pass; a task
  with no steps shows only its date (`24.09.2026` or `dd.mm.yyyy`) with no chart; clicking "Add progressions" opens the
  pop-up with the task title, two empty boxes and one arrow; the add button adds a
  third box and arrow and focuses it; Escape, Close and the backdrop close the pop-up
  and focus returns to the "Add progressions" button; the page behind cannot be
  clicked while the pop-up is open.

- [x] **2. Auto-save new and changed steps.** Add `app/actions/steps.ts` with
  `createStep` and `updateStep`. Wire each box to save on blur, Enter and pop-up close
  as described under In scope, with the status line and inline errors.
  **Done when:** typecheck, lint and build pass; typing "Build DevStash with AI
  Blueprint" into box 1 and clicking out shows "Saving..." then "Saved"; typing into
  box 2 and pressing Escape saves it and closes the pop-up; after a reload the row
  shows two empty rectangles joined by an arrow and reopening shows both steps in order; editing box 1 and
  tabbing out saves the new text; clicking into and out of a box without changing it
  sends no request (no "Saving..."); clearing a saved box and clicking out shows "Type a
  step first." and a reload still shows the old text; leaving boxes empty saves nothing.

- [x] **3. Delete a step.** Add `deleteStep` to `app/actions/steps.ts` and the two-click
  "Delete step" button on saved boxes.
  **Done when:** typecheck, lint and build pass; one click shows "Confirm delete" and
  deletes nothing; Escape or moving focus away resets it and the pop-up stays open; the
  second click removes the box, the later steps shift left, and after a reload the
  positions are 1, 2, ... with no gap (check with
  `sqlite3 data/planner.db "SELECT task_id, position, title FROM steps ORDER BY task_id, position"`);
  the small chart in the row loses one rectangle; the task itself is not deleted; deleting a step that was
  already deleted in another tab shows "That step no longer exists." and the pop-up
  refreshes.

## Files / areas

- `app/lib/tasks.ts` - add `listStepsForDumpTasks()` (server only)
- `app/lib/form.ts` - new, form field parsers moved out of `app/actions/tasks.ts` so both
  action files share them (a `"use server"` file can only export async functions)
- `app/actions/tasks.ts` - import the moved parsers; behaviour unchanged
- `app/actions/steps.ts` - new, `"use server"` with `createStep`, `updateStep`,
  `deleteStep`
- `app/types/tasks.ts` - add `STEP_GONE = "That step no longer exists."`
- `app/page.tsx` - read steps and group them by `task_id`
- `app/components/tasks/TaskDumpList.tsx`, `TaskList.tsx` - pass steps down
- `app/components/tasks/TaskRow.tsx` - meta line counts, "Add progressions" button
- `app/components/tasks/ProgressionsDialog.tsx` - new, client component: dialog, flow
  chart, add-box button, status line
- `app/components/tasks/StepBox.tsx` - new, client component: one box with auto-save and
  the "Delete step" button
- `app/components/tasks/TitleTextarea.tsx` - reuse for step text (wraps, no line breaks,
  Enter submits)
- `app/lib/format.ts` - add a small helper for the step count text if it keeps
  `TaskRow` readable
- `app/types/db.ts` - reuse the existing `Step` type

## Data / contracts

Reads and writes only the existing `steps` table from `app/lib/db.ts`. No schema change.

- **Read:** `SELECT s.id, s.task_id, s.position, s.title, s.done FROM steps s JOIN tasks t ON t.id = s.task_id WHERE t.status != 'done' ORDER BY s.task_id, s.position`.
  `app/page.tsx` groups the rows by `task_id`; a task with no rows gets `[]`. Counts in
  the meta line come from that array (`length` and number with `done === 1`).
- **createStep(prevState, formData):** fields `task_id`, `title`. Appends the step at the
  end in one statement so two quick saves never get the same position:
  `INSERT INTO steps (task_id, position, title) SELECT ?, COALESCE(MAX(position), 0) + 1, ? FROM steps WHERE task_id = ?`.
  `done` comes from the column default. Before inserting, check the task exists
  (`SELECT 1 FROM tasks WHERE id = ?`); if not, return `TASK_GONE`. A step typed into
  a later empty box while an earlier box is still empty is still appended at the end,
  so it shows as the next saved step after the reload.
- **updateStep(prevState, formData):** fields `id`, `title`. Runs
  `UPDATE steps SET title = ? WHERE id = ?`. Never touches `task_id`, `position` or
  `done`. 0 rows changed returns `STEP_GONE`.
- **deleteStep(prevState, formData):** field `id`. In one `getDb().transaction(...)`:
  read the step's `task_id` and `position`; if missing return `STEP_GONE`; delete it;
  run `UPDATE steps SET position = position - 1 WHERE task_id = ? AND position > ?`.
  The existing `ON DELETE CASCADE` on `daily_priorities.step_id` removes any daily
  priority that pointed at the step (none exist until feature 4).
- **Validation (server side, in every action, before any query):**
  - `title`: string, trimmed; empty after trimming -> error "Type a step first." The
    trimmed value is stored.
  - `task_id` must parse as a positive integer, otherwise `TASK_GONE`.
  - `id` must parse as a positive integer, otherwise `STEP_GONE`.
- **Result shape:** every action returns the existing `ActionResult`
  (`{ success: true } | { success: false, error: string }`), wraps its database work in
  try/catch, and returns "Could not save. Try again." for an unexpected error without
  sending the raw error text to the browser. On success, `TASK_GONE` and `STEP_GONE`,
  call `revalidatePath("/")`.
- **Task deleted while the pop-up is open:** after `TASK_GONE` the row disappears on
  revalidation; the pop-up closes with it and the Dumped list shows "That task no
  longer exists." through the existing `onResult` notice.
- **Client box state:** each box keeps the last saved text. A save runs only when the
  trimmed text differs from it. While a box's save is pending, a second blur or Enter
  does not send another request. A new box's saved step replaces the empty box after
  revalidation; the pop-up keys saved boxes by step `id` and empty boxes by a local
  counter so typed text is not lost when the list refreshes.
- **Rendering:** step and task titles render as plain React text. No
  `dangerouslySetInnerHTML`.
- **Accessibility:** the dialog has `aria-labelledby` pointing at its heading; each box
  has a visually hidden label "Step 1", "Step 2", ...; errors render with `role="alert"`
  and are linked by `aria-describedby`; an error clears on that box's next successful
  save; arrows are `aria-hidden`.

## Testing

- No test runner and no Verify command are configured, so there are no automated tests
  in this feature.
- Every step runs `npx tsc --noEmit`, `npm run lint` and `npm run build`.
- The behaviour in each step's Done when is confirmed by hand (or with `/check`) against
  `npm run dev` on http://localhost:3000. `data/planner.db` holds Aariz's own tasks, so
  do not wipe it; create a throwaway task for testing and delete it after.

## Notes for the AI

- Read `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md` before
  writing the actions. This Next.js version differs from older training data.
- Import `getDb()` and `app/lib/tasks.ts` only from server code.
- Use the native `<dialog>` element and `showModal()`; do not add a modal library.
  Closing on a backdrop click means checking that the click target is the dialog element
  itself.
- Moving the parsers into `app/lib/form.ts` must keep every task action message and
  behaviour from feature 2 identical.
- Keep the page `force-dynamic` so `npm run build` never opens `data/planner.db`.
- No em dashes in code comments or UI text.
- Open findings from feature 2 (F-01 double submit on Enter, F-02 Safari delete reset)
  are not part of this feature. Do not copy the same double-submit gap into step boxes.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":13283,"specSha256":"83eecc8c8896b8e140eaef90521da9a0d2f5a400efd0f7374803dc3ab7656a14","branch":"refs/heads/feature/steps-inside-a-task","head":"e5e192b4c68301250b7e2a109d3af15627593352","baseRef":"refs/heads/main","baseCommit":"f7650e5f8f80fc887ca547906b2524b0fe688e2c","sourceTree":"03be4f006fa1ed263e47bb20bb3bc4c5f686f943","absentOptional":[]} -->

## Findings

### 3/F-05 [P3] closed - The spec contradicts itself about the meta line for a task with no steps

**File:** blueprint/context/current-feature.md:40
**Found:** 2026-09-17 by /audit independent (scope: current; lens: quality)
**Why it matters:** The revised In scope text says the date shows as `24.09.2026` or `dd.mm.yyyy` and "replaces feature 2's `due 24 Sep` / `no due date` text", but the next sentence (line 40) and Step 1's Done when (line 98) still say a task with zero steps shows `due 22 Sep` or `no due date` unchanged. The code (`app/components/tasks/TaskRow.tsx:120`, `app/lib/format.ts:2`) follows the revision for every task. A later `/check` against line 40 or 98 would report a false failure.
**Suggested fix:** Update lines 40 and 98 of the spec to say a zero-step task shows only the date (`24.09.2026` or `dd.mm.yyyy`) with no chart. No code change; this is a spec edit for the owner to approve.
**Resolution:** Spec In scope and step 1 Done when now say a task with no steps shows only its date (`24.09.2026` or `dd.mm.yyyy`) with no chart.
Closed 2026-09-17 by /audit independent (target e5e192b, spec hash 83eecc8c...): `current-feature.md` lines 39-40 and Step 1's Done when (lines 97-98) now match the code (`TaskRow.tsx:116-121`, `format.ts:2-5`); no remaining `due 22 Sep` / `no due date` requirement for zero-step tasks.

### 3/F-06 [P3] closed - Focus may not return to "Add progressions" after closing the pop-up in Safari

**File:** app/components/tasks/TaskRow.tsx:125
**Found:** 2026-09-17 by /audit independent (scope: current; lens: quality)
**Why it matters:** The spec requires focus to return to the "Add progressions" button on close. The code relies on the native `<dialog>` restoring focus to the element that was focused when `showModal()` ran. Safari and Firefox on macOS do not focus a button on mouse click (the same reason `StepBox.tsx` calls `event.currentTarget.focus()` for the Delete step button), so after a mouse open the restored focus would be the page body. Not reproduced: no browser was run in this review.
**Suggested fix:** Confirm in Safari. If it reproduces, focus the button in its `onClick` before opening, or focus it from `TaskRow` when the dialog's `onClose` runs, like the existing `returnFocus` pattern for Edit.
**Resolution:** The "Add progressions" button now focuses itself on click before opening the pop-up, so the dialog has it to return focus to (`TaskRow.tsx`). Not run in Safari.
Closed 2026-09-17 by /audit independent (target e5e192b): `TaskRow.tsx:127-131` calls `event.currentTarget.focus()` before `setProgressionsOpen(true)`, and `showModal()` runs later in the dialog's mount effect (`ProgressionsDialog.tsx:33-39`), so the button is the focused element when the dialog opens in every browser. The original gap is gone and the repair adds no new defect. Still not run in Safari, so the browser's own focus restore on `close()` remains unobserved.

## Independent review

**Status:** passed
**Target commit:** e5e192b4c68301250b7e2a109d3af15627593352
**Base commit:** f7650e5f8f80fc887ca547906b2524b0fe688e2c
**Base ref:** main
**Spec hash:** 83eecc8c8896b8e140eaef90521da9a0d2f5a400efd0f7374803dc3ab7656a14
**Prepared by:** claude
**Builder model:** claude-opus-5[1m]
**Requested reviewer:** claude
**Requested model:** claude-opus-5[1m]
**Requested execution:** automatic
**Requested at:** 2026-09-17T15:58:07Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** claude
**Reviewer model:** claude-opus-5[1m]
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-09-17T16:02:03Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

## Commands

- `git rev-parse HEAD`: pass (equals Target commit)
- `git merge-base main HEAD`: pass (equals Base commit)
- `shasum -a 256 blueprint/context/current-feature.md`: pass (equals Spec hash)
- `git status --porcelain --untracked-files=all`: pass (only `blueprint/context/findings.md` and `blueprint/context/review.md` differ)
- `npx tsc --noEmit`: pass
- `npm run lint`: pass
- `npm run build`: pass (`/` is dynamic, so the build did not open `data/planner.db`)
- Test command: unavailable (no test runner configured)
- Verify command: unavailable (none configured)

## Evidence

- Reviewed the full `f7650e5..e5e192b` delta: `app/actions/steps.ts`, `app/actions/tasks.ts`, `app/lib/form.ts`, `app/lib/format.ts`, `app/lib/tasks.ts`, `app/page.tsx`, `app/types/tasks.ts`, `app/globals.css`, `app/components/tasks/{ProgressionsDialog,StepBox,TaskRow,TaskList,TaskDumpList,pill}`, plus `TitleTextarea.tsx` and `app/lib/db.ts` for context, against the active spec.
- Security: every step action parses `id` / `task_id` as a positive safe integer and trims `title` before any query; all SQL is parameterised; `createStep` and `deleteStep` run in `db.transaction`; unexpected errors are logged server side and return "Could not save. Try again."; step and task titles render as React text (the only `dangerouslySetInnerHTML` is the pre-existing theme script in `app/layout.tsx`, not in this delta). No unique index on `steps(task_id, position)`, so the position shift after delete cannot hit a constraint.
- Performance: one extra indexed query per page load (`steps_task_id` index); no per-row queries, no unbounded client work. No issues found.
- Quality: parser move keeps the task messages identical; no nested forms (the dialog renders outside the row's forms); Enter in a step box blurs instead of submitting twice, so F-01's gap is not copied. Mini chart line breaking matches the spec (4 boxes / 3 arrows per line, arrow into step 5 starts line 2). `.step-node.done` in the prototype is a 14px circle, matching the step box's accent dot.
- Tests: no test runner is configured and the spec declares no automated tests; no skipped or placeholder tests exist.
- Ledger re-examination: F-05 and F-06 repairs confirmed and closed; F-03's original defect is gone but its repair broke the two-box minimum, so F-03 is reopened. F-04 unchanged and still present (`StepBox.tsx`).
- No dev server started, no browser run, `data/planner.db` not opened.

## Findings

- F-03 [P2] open (reopened: two-box minimum lost when saved steps shrink without an in-pop-up delete)
- F-07 [P3] open (new: action pills hide while a mouse-armed "Confirm delete" stays focused)
- F-04 [P3] open (unchanged)
- F-05 [P3] closed
- F-06 [P3] closed
- No P0 or P1 finding is open or fixed.

## Remaining risk

- No test runner configured: no automated tests cover `createStep`, `updateStep`, `deleteStep` or the form parsers.
- No Verify command configured.
- Check was not required and was not run; no browser evidence for auto-save, focus return, Escape handling or the mini chart layout.
- Safari not run: whether clicking a button in Safari clears the programmatic focus that the "Delete step" and "Add progressions" buttons rely on is unobserved (same area as F-02).
