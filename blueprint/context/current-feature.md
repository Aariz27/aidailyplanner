# Fix: Add progressions on the Strategy tab

**Type:** Fix
**Status:** in progress
**Branch:** fix/add-progressions-on-the-strategy-tab

## The problem

The Strategy tab shows every task's progression but is read only. Aariz has to go
back to the Overview tab, open a task's Edit view and press "Add progressions" to
change its steps. He wants to do it straight from the Strategy tab.

## The fix

- Each task card on the Strategy tab gets an "Add progressions" pill in its top
  right, next to the status word. It opens the existing `ProgressionsDialog` for
  that task, the same pop-up the Dumped list uses: add, edit, delete steps and set a
  step as a daily priority.
- The Strategy page reads today's daily priorities so the pop-up's "Set as daily
  priority" buttons know which steps are already today and whether today is full.
- Errors the pop-up reports to its parent show in an alert line on that card.
- Every server action revalidates `revalidatePath("/", "layout")` instead of
  `revalidatePath("/")`, so a change made on any tab refreshes the Overview,
  Strategy and Completed pages alike.
- The Completed tab's cards stay read only.
- Each saved step box in the pop-up gets a "Mark as done" button (Aariz's request).
  Pressing it sets `steps.done = 1`, turns the step's circle green and changes the
  button to "Done" (green text, `aria-pressed`); pressing "Done" sets it back to 0.
  A new `setStepDone` action in `app/actions/steps.ts` validates `id` with
  `parseId` and returns `STEP_GONE` when no row changed. It only writes
  `steps.done`; daily priority cards keep their own status.

Must not break: the Dumped list's pop-up, the three-per-day cap, and the Overview
refreshing after an action.

## Build steps

- [ ] **1. Pop-up on the Strategy tab.**
  **Done when:** typecheck, lint and build pass; the Strategy page passes each task,
  its steps, today's step ids and `todayFull` to a client `AddProgressionsButton`;
  no action still calls `revalidatePath("/")` without `"layout"`.

- [ ] **2. Mark a step as done in the pop-up.**
  **Done when:** typecheck, lint and build pass; the button toggles `steps.done`
  and the step shows green on the Strategy card and the Dumped row.

## Verify

Open http://localhost:3000/strategy, press "Add progressions" on a task, add a
step, close the pop-up: the card shows the new step box without a reload. The
Overview's Dumped row shows the same step.
