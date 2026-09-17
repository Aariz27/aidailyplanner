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
