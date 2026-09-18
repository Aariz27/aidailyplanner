# Feature: Started but not completed list

**From build-plan:** feature 5
**Build attempt:** 1
**Status:** verified
**Branch:** feature/started-but-not-completed-list

## Goal

Show, in the right column of the overview tab under the Today gauge, every item
Aariz started on an earlier day and has not finished, so nothing he began gets lost.
Each entry can be set as a daily priority again today.

## Design reference

- `prototypes/overview.html` (local only, gitignored), block `<!-- RIGHT: STARTED -->`:
  panel with a clock icon well, heading "Started, not completed", a count sub line,
  and `.task-row` entries (icon well, title, meta line, "Set as daily priority" pill
  shown on hover, disabled at `opacity .4` when today is full).
- States section, "Nothing started": `.nothing-empty` text "Nothing started and
  unfinished."
- The header's arrow button in the prototype is left out: it has no destination.
- Build from the existing utilities in `app/globals.css` and `PILL`; no new tokens.

## In scope

- **Placement (Aariz's decision):** the right column holds the Today gauge and, under
  it, the new "Started, not completed" panel.
- **What the list holds (Aariz's rule: status started and not status done):**
  - A whole task shows when `tasks.status = 'started'` and it was a whole-task daily
    priority on a day before today.
  - A step shows when a daily priority row for that step on a day before today has
    `status = 'started'` and the step's `done = 0`.
  - One entry per item (the same task or step chosen on two days shows once), with
    the most recent past day it was chosen on.
  - An item that is already one of today's daily priorities is not listed; setting
    it again moves it to the Today column.
  - Newest chosen day first.
- **Entry content:** step icon (flow) or whole-task icon (clock); title (step text or
  task title); meta "Step 2 of 4 · <task title> · chosen 14.09.2026" or
  "Whole task · chosen 14.09.2026 · due 24.09.2026" (reuse `formatDueDate`).
- **Set as daily priority pill** on each entry's hover/focus action area, calling the
  existing `setDailyPriority` with the entry's `task_id` and `step_id`. Disabled while
  pending and when today already has three. Errors show in the panel's own alert line.
- **Header sub line:** "N items" ("1 item").
- **States:** empty ("Nothing started and unfinished."), one or more entries, today
  full (pills disabled), pending, task or step deleted in another tab
  (`TASK_GONE`/`STEP_GONE` from the action), unexpected error.

## Out of scope

- Any schema change or new server action.
- Changing a task's or step's status from this list.
- Important dates box, Strategy tab, Completed tab (features 6 to 8).

## Build loop

Continuous Mode: build all steps in order, run each step's check, no step commits.
The feature is committed once when it is completed.

## Build steps

- [x] **1. Read the list and show the panel.** Add `listStartedNotCompleted(today)` to
  `app/lib/priorities.ts`, a `StartedItem` type to `app/types/db.ts`, and
  `app/components/priorities/StartedList.tsx`. Render it under `TodayGauge` in the
  right column of `app/page.tsx`.
  **Done when:** `npx tsc --noEmit`, `npm run lint` and `npm run build` pass; the
  query run against a copy of `data/planner.db` with test rows returns a past
  started whole task and a past started step once each, and leaves out a done step,
  a task whose status is not `started`, a row from today and an item set again today.

- [x] **2. Set an entry as a daily priority again.** Add the pill to each entry.
  **Done when:** typecheck, lint and build pass; the pill is disabled when today is
  full; the action it calls is the existing `setDailyPriority`, so today's cap,
  repeat guard and gone errors are unchanged.

## Files / areas

- `app/lib/priorities.ts` - add `listStartedNotCompleted(today)`
- `app/types/db.ts` - add `StartedItem`
- `app/components/priorities/StartedList.tsx` - new client component: panel, entries,
  pill, alert line
- `app/page.tsx` - read the list, stack the panel under the gauge

## Data / contracts

Read only. `listStartedNotCompleted(today)`:

```sql
SELECT p.task_id, p.step_id, MAX(p.priority_date) AS chosen_date,
       t.title AS task_title, t.due_date AS task_due_date,
       s.title AS step_title, s.position AS step_position,
       (SELECT COUNT(*) FROM steps c WHERE c.task_id = p.task_id) AS step_count
FROM daily_priorities p
JOIN tasks t ON t.id = p.task_id
LEFT JOIN steps s ON s.id = p.step_id
WHERE p.priority_date < ?
  AND ((p.step_id IS NULL AND t.status = 'started')
       OR (p.step_id IS NOT NULL AND p.status = 'started' AND s.done = 0))
  AND NOT EXISTS (SELECT 1 FROM daily_priorities q
                  WHERE q.priority_date = ? AND q.task_id = p.task_id AND q.step_id IS p.step_id)
GROUP BY p.task_id, p.step_id
ORDER BY chosen_date DESC, MAX(p.id) DESC
```

`today` comes from `todayDate()` on the server. Titles render as plain React text.
The panel is a `<section>` labelled by its heading; entries are a list; the alert line
uses `role="alert"` and clears on the next successful action.

## Testing

No test runner and no Verify command. Each step runs `npx tsc --noEmit`,
`npm run lint`, `npm run build`. The query is checked with `sqlite3` against a
throwaway copy of the database, never Aariz's real file.

## Notes for the AI

- Keep the page `force-dynamic`. Import `getDb()` only from server code.
- No em dashes in code comments or UI text.
- Keep `prototypes/` until feature 8 is complete.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":5528,"specSha256":"18b00d1b609ab459ae9b041e39b7aaaa29e2277d98a85b58edeef5456ddf8561","branch":"refs/heads/feature/started-but-not-completed-list","head":"6bd0e349a7e87a459d9eabdf517edd1aacabaf1a","baseRef":"refs/heads/main","baseCommit":"6bd0e349a7e87a459d9eabdf517edd1aacabaf1a","sourceTree":"e8289375618132a318ed779f3564d827e2bedc5c","absentOptional":[]} -->
