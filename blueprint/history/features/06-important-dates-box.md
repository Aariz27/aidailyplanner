# Feature: Important dates box

**From build-plan:** feature 6
**Build attempt:** 1
**Status:** verified
**Branch:** feature/important-dates-box

## Goal

A small box in the top right corner of the overview tab where Aariz keeps dated
facts, such as "Semester starts 28.09.2026" or "Claude Code tokens expire", and
sees how many days are left until each one.

## Design reference

- `prototypes/overview.html` (local only, gitignored), `<header>` and its CSS under
  `/* ---------- header ---------- */` and `/* ---------- important dates (top right) ---------- */`:
  - Left: masthead "DAILY" (outlined) "PLANNER" (solid), today's long date under it.
    The tabs are feature 7 and are not built here.
  - Right, `.dates-corner` (340px): a `.dates-pill-row` with a round calendar icon
    (`.avatar.circle-ext`) and a `.next-pill` reading "Next: <label>" over
    "in N days"; under it a `.dates-card` with one `.date-row` per date: label,
    date, and "in N days" on the right, in `--warn` when it is 7 days away or less.
- Add a `circle-ext` utility to `app/globals.css` next to `circle-inset`.

## In scope

- **Header row** above the three columns: masthead and today's date on the left
  ("Friday 18 September 2026", built on the server from today's local date), dates
  box on the right. The theme switch stays in its own row above.
- **Next pill:** the nearest date that is today or later: "Next: <label>" over its
  "today" / "tomorrow" / "in N days". With no such date: "Nothing coming up".
- **Dates card:** every important date, upcoming ones first (soonest first), then
  passed ones (most recent first). Each row: label, date as `dd.mm.yyyy`
  (`formatDueDate`), and "today", "tomorrow", "in N days", "yesterday" or
  "N days ago". Upcoming dates 7 days away or less show that text in `--warn`.
- **Add a date:** a form at the bottom of the card with a label field and a date
  field (both required) and a plus button. Errors "Type a label first." and
  "Pick a valid date." show under the form.
- **Delete a date:** a small "Delete" pill on each row shown on hover/focus; the
  first click turns it into "Confirm delete", the second deletes (the same
  two-click pattern as the Dumped rows).
- **States:** no dates ("No important dates yet."), one or more, a date deleted in
  another tab ("That date no longer exists."), unexpected error ("Could not save.
  Try again.").

## Out of scope

- Editing a date in place (delete and add again).
- Tabs (feature 7), Completed tab (feature 8).
- Any schema change: `important_dates` already exists in `app/lib/db.ts`.

## Build loop

Continuous Mode: build all steps in order, run each step's check, no step commits.

## Build steps

- [x] **1. Header and read-only dates box.** Add `app/lib/dates.ts`
  (`listImportantDates`, `daysBetween`, `longDate`), `circle-ext`,
  `app/components/dates/DatesBox.tsx`, and the header row in `app/page.tsx`.
  **Done when:** typecheck, lint and build pass; `daysBetween` gives 0, 1, 7 and -1
  for today, tomorrow, a week ahead and yesterday; the list query orders upcoming
  soonest first then passed most recent first against a throwaway in-memory
  database.

- [x] **2. Add and delete dates.** Add `app/actions/dates.ts` with
  `createImportantDate` and `deleteImportantDate`, the add form and the delete pill.
  **Done when:** typecheck, lint and build pass; the actions reject an empty label,
  a malformed date and a bad id before any query, and a delete of a missing id
  returns "That date no longer exists."

## Files / areas

- `app/lib/dates.ts` - new, server only
- `app/actions/dates.ts` - new, `"use server"`
- `app/components/dates/DatesBox.tsx` - new client component
- `app/types/tasks.ts` - add `DATE_GONE`
- `app/lib/form.ts` - add a `field` argument to the date parser so `on_date` reuses
  the same real-calendar-date check as `due_date`
- `app/globals.css` - `circle-ext`
- `app/page.tsx` - header row

## Data / contracts

- **Read:** `SELECT id, label, on_date FROM important_dates ORDER BY on_date < ?, CASE WHEN on_date < ? THEN on_date END DESC, on_date, id`
  with today from `todayDate()`.
- **Create:** fields `label` (trimmed, required) and `on_date` (`YYYY-MM-DD`, a real
  calendar date, required). `INSERT INTO important_dates (label, on_date) VALUES (?, ?)`.
- **Delete:** field `id` (`parseId`). `DELETE FROM important_dates WHERE id = ?`;
  0 rows returns `DATE_GONE`.
- **Days away:** whole days between today and `on_date`, computed on the server from
  the `YYYY-MM-DD` parts with `Date.UTC`, never from local `Date` parsing.
- Result shape `ActionResult`; try/catch with "Could not save. Try again.";
  `revalidatePath("/")` on success and on `DATE_GONE`. Labels render as plain text.
- Accessibility: the box is a `<section>` labelled "Important dates"; fields have
  labels; errors use `role="alert"`; the delete pill's label names the date.

## Testing

No test runner and no Verify command. Each step runs `npx tsc --noEmit`,
`npm run lint`, `npm run build`. Logic is checked with node against an in-memory
database, never Aariz's real file.

## Notes for the AI

- Keep the page `force-dynamic`. Import `getDb()` only from server code.
- No em dashes in code comments or UI text.
- Keep `prototypes/` until feature 8 is complete.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":5275,"specSha256":"6dc059eb1638cb04159e54a14611b636af8dad1cf7e62c83bf4c6f434415f79e","branch":"refs/heads/feature/important-dates-box","head":"a2d28d569c73bb3bed43e2d2dcad61ddd72755ea","baseRef":"refs/heads/main","baseCommit":"815c7562f0b2eb80c46fdfef41fb8277676c7b7b","sourceTree":"164f7d19d5fa2fdee4e5b293b37bd9c1f0537f03","absentOptional":[]} -->

## Independent review

**Status:** passed
**Target commit:** a2d28d569c73bb3bed43e2d2dcad61ddd72755ea
**Base commit:** 815c7562f0b2eb80c46fdfef41fb8277676c7b7b
**Base ref:** refs/heads/main
**Spec hash:** 6dc059eb1638cb04159e54a14611b636af8dad1cf7e62c83bf4c6f434415f79e
**Prepared by:** claude
**Builder model:** claude-opus-5[1m]
**Requested reviewer:** claude
**Requested model:** runtime default (exact model not known until reviewer starts)
**Requested execution:** automatic
**Requested at:** 2026-09-18T09:23:01Z
**Workflow:** continuous
**Check required:** no
**Reviewer adapter:** claude
**Reviewer model:** claude-sonnet-5
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-09-18T09:26:18Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required


### Commands

- `npx tsc --noEmit`: pass
- `npm run lint`: pass
- `npm run build`: pass

### Evidence

- Reviewed the complete `815c7562f0b2eb80c46fdfef41fb8277676c7b7b..a2d28d569c73bb3bed43e2d2dcad61ddd72755ea` delta fresh, against `blueprint/context/current-feature.md` (feature 6, "Important dates box"): `app/actions/dates.ts` (new), `app/components/dates/DatesBox.tsx` (new), `app/lib/dates.ts` (new), `app/lib/form.ts` (`parseDueDate` field parameter), `app/globals.css` (`circle-ext`, `masthead-outline`), `app/page.tsx` (header row), `app/types/tasks.ts` (`DATE_GONE`).
- Verified the list query's `ORDER BY on_date < ?, CASE WHEN on_date < ? THEN on_date END DESC, on_date, id` sorts upcoming dates ascending then passed dates descending by tracing SQLite's boolean-to-integer and `CASE`/`NULL` ordering semantics by hand; matches the spec's Data/contracts query verbatim.
- Verified `daysBetween` and `longDate` build only from the `YYYY-MM-DD` parts via `Date.UTC`, never local `Date` parsing, matching the spec's "Days away" contract.
- Verified `parseDueDate("on_date")` rejects non-existent calendar dates (for example 2026-02-30) via the `getUTCFullYear`/`getUTCMonth`/`getUTCDate` round-trip check, reused unchanged from the existing `due_date` path.
- Verified the add-date submit button is `disabled={pending}` and relies on native implicit-submission (no `form.requestSubmit()` bypass as in prior finding F-01), so a second Enter cannot queue a duplicate create while a save is pending.
- Verified `DeleteDateButton` calls `event.currentTarget.focus()` on the first click before flipping to "Confirm delete", which is the Safari/Firefox fix prior finding F-02 recommended for the older Dumped-row delete pattern; this new component does not repeat that defect.
- Confirmed labels render as plain JSX text (no `dangerouslySetInnerHTML`) and all queries in `app/actions/dates.ts` and `app/lib/dates.ts` are parameterized `better-sqlite3` statements; no injection or unsanitized-output path found.
- Confirmed `circle-ext` sits immediately after `circle-inset` in `app/globals.css`, and `parseDueDate`'s new `field` parameter defaults to `"due_date"`, so the existing task due-date call sites are unaffected.
- No new em dashes introduced in the reviewed files.
- Scope excluded: `blueprint/context/current-feature.md` (the spec itself) and the request/ledger files, per the reviewer's own file-write boundary.

### Findings

- None

### Remaining risk

- No browser was run: the header layout, masthead outline/solid rendering, the dates card's visual match to `prototypes/overview.html`, and the delete pill's hover/focus reveal were verified by reading code only, not by rendering the page.
- No test runner is configured for this project (per `AGENTS.md` Commands), so step 1's done-when checks (`daysBetween` at 0/1/7/-1, list ordering against a throwaway in-memory database) were traced by hand against the shipped code rather than re-run as an executable check.
- `/check` was not required for this receipt and was not run.
