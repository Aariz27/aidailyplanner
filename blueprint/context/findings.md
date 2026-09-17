# Findings

> **Generated file.** The findings ledger: review findings raised by `/audit`
> against the work in progress, each with a durable ID, severity (P0-P3), and
> status. `/implement` marks repaired findings `fixed`, a later `/audit` pass
> moves them to `closed`, and `/complete` refuses to merge while any P0 or P1
> finding is `open` or `fixed`, then archives resolved findings with the work
> and resets this file.

### F-01 [P2] open - Enter in the add-task title submits again while a save is pending

**File:** app/components/tasks/TitleTextarea.tsx:34
**Found:** 2026-09-17 by /audit independent (scope: current; lens: quality)
**Why it matters:** The spec disables the plus button while saving (`AddTaskForm.tsx:34`), but the textarea's Enter handler calls `form.requestSubmit()` directly. `requestSubmit()` is not implicit submission, so it ignores the disabled submit button. A second Enter before the first `createTask` finishes queues another `useActionState` action with the same, not yet cleared, title, and inserts a duplicate task. Confirmed by code path only; no browser run.
**Suggested fix:** In the Enter handler, skip `requestSubmit()` while the form is saving (for example, pass a `pending` prop into `TitleTextarea` and return early, or skip when the form's submit button is disabled). No current requirement is lost.
**Resolution:**

### F-02 [P2] unverified - Delete confirmation may not reset on blur or Escape in Safari

**File:** app/components/tasks/TaskRow.tsx:152
**Found:** 2026-09-17 by /audit independent (scope: current; lens: quality)
**Why it matters:** The "Confirm delete" state resets only through the form's `onBlur` and `onKeyDown` handlers, which need the Delete button to hold focus. Safari (and Firefox) on macOS do not focus a button on mouse click, so after clicking Delete and moving away, neither handler would fire and the row could keep showing "Confirm delete", so the next click deletes immediately. Not reproduced: no browser was run in this review.
**Suggested fix:** Confirm in Safari. If it reproduces, call `event.currentTarget.focus()` in the first-click `onClick` so blur and Escape work in every browser.
**Resolution:**

### F-03 [P2] open - Saving a later box unmounts an earlier empty box and drops its unsaved typing

**File:** app/components/tasks/ProgressionsDialog.tsx:79
**Found:** 2026-09-17 by /audit independent (scope: current; lens: quality)
**Why it matters:** The spec says empty boxes are keyed "by a local counter so typed text is not lost when the list refreshes", but padding boxes are keyed by position (`pad-${steps.length + index + 1}`). When any box saves, `steps.length` grows and the lowest padding keys disappear. Example: a task with no steps, Aariz types "B" in box 2, Shift+Tabs back to box 1 and starts typing; when the "B" save returns, `pad-1` is no longer in `boxes`, so React unmounts that StepBox with its `text` state and focus, and nothing saves it. The same happens with one saved step when a draft box saves while `pad-2` holds unsaved text. Confirmed by code path only; the window is one save round trip, no browser run.
**Suggested fix:** Key padding boxes by a stable local counter like the drafts (for example, hold the padding keys in state and drop only the key of the box that saved, as `handleSaved` already does for drafts). No current requirement is lost.
**Resolution:** Every empty box, including the two that fill an empty chart, is now held in the `drafts` state with a key from a local counter, and only the saved box's key is removed (`ProgressionsDialog.tsx`). A delete adds an empty box only when fewer than two boxes would remain. Checked with `npx tsc --noEmit`, `npm run lint`, `npm run build`; no browser run.
Reopened 2026-09-17 by /audit independent (target e5e192b): the original defect is gone (empty boxes now keep stable counter keys, `ProgressionsDialog.tsx:24-27` and `:61`). But the repair introduced a new defect: the empty boxes are now computed once when the pop-up mounts (`useState` initialiser, line 25), and only an in-pop-up delete adds one back (`handleDeleted`, line 68). When the saved steps shrink any other way, nothing refills the chart to two boxes, which breaks the spec's "at least two boxes and one arrow always show". Example from the spec's own "step already deleted in another tab" state: a task has 2 steps, the other tab deletes step 1, Aariz clicks "Delete step" then "Confirm delete" on step 1 here; `deleteStep` returns `STEP_GONE`, `handleGone` (line 75) shows the notice but does not refill, and after revalidation the pop-up shows a single box with no arrow between boxes. The same happens after any save once another tab removed steps. `handleDeleted` also reads `steps` from the render where Delete was clicked, so two deletes confirmed within one round trip can leave one box. Confirmed by code path only; no browser run. Suggested repair: keep the stable draft keys, and whenever `steps.length + drafts.length < MIN_BOXES` after `steps` changes, append new counter keys (for example, adjust `drafts` during render or in an effect keyed on `steps.length`), instead of counting boxes in `handleDeleted`.

### F-04 [P3] open - Text typed into a box while its own save is in flight is silently dropped

**File:** app/components/tasks/StepBox.tsx:68
**Found:** 2026-09-17 by /audit independent (scope: current; lens: quality)
**Why it matters:** While a save is pending, a second blur returns early (line 43), which the spec requires. But nothing re-saves the newer text afterwards. For a new box, a successful save then runs `setText("")` and wipes whatever was typed after the save started. For a saved box, the newer text stays on screen but is only sent on a later blur, so closing the pop-up without refocusing that box loses it with no error. Needs a re-focus and typing within one round trip, so it is unlikely. Confirmed by code path only.
**Suggested fix:** After the pending save finishes, compare the box's current text with what was sent: for a new box clear only when the text is unchanged, and for either kind run `save()` again when the text differs. No current requirement is lost.
**Resolution:**

### F-07 [P3] open - The row's action pills now hide while a mouse-armed "Confirm delete" is still focused

**File:** app/components/tasks/TaskRow.tsx:124
**Found:** 2026-09-17 by /audit independent (scope: current; lens: quality)
**Why it matters:** This feature changed the action area of every Dumped row from `group-focus-within` to `group-has-[:focus-visible]`. The spec asks only for a new button in the existing "hover/focus action area" and does not mention changing when feature 2's Edit and Delete pills show. A mouse click on a button does not make it match `:focus-visible` in Chrome, so after Aariz clicks "Delete" on a task and moves the pointer off the row, the pills fade out while the button stays focused and still reads "Confirm delete". Before this change they stayed visible until focus left. The armed state is now invisible until he hovers the row again, where one click deletes the task. Confirmed by code path and CSS selector behaviour only; no browser run.
**Suggested fix:** Either restore `group-focus-within` (and handle the pills staying visible after the pop-up returns focus in another way), or keep the new selector and record the behaviour change in the spec for the owner to approve. Needs an owner decision because it changes shipped feature 2 behaviour.
**Resolution:**
