# Feature: Strategy tab

**From build-plan:** feature 7
**Build attempt:** 1
**Status:** verified
**Branch:** feature/strategy-tab

## Goal

A second tab, Strategy, that lists every task with its full progression, so Aariz
can see how far along each task is, step by step.

## Design reference

- `prototypes/overview.html` (local only, gitignored), `<header>`: the `.tabs.ext-sm`
  bar under the masthead, the active tab pressed in (`inset-lg`), the others muted.
  The prototype's Completed tab and its badge are feature 8.
- The progression is drawn like the "Add progressions" pop-up: one box per step
  joined by the same arrow, read only. A done step is filled with `--done` green.

## In scope

- **Tabs:** "Overview" (`/`) and "Strategy" (`/strategy`) as links under the
  masthead on both pages, the current one pressed in and marked `aria-current="page"`.
- **Shared header:** masthead, tabs and today's long date move into
  `app/components/layout/PageHeader.tsx`; the overview passes its dates box as the
  right side, the Strategy page has no dates box.
- **Strategy page (`app/strategy/page.tsx`):** every task, newest first, each as a
  card with: title, status word in its colour (Open blue, Started orange-yellow,
  Done green), due date when set, "N of M steps done" (or "No steps yet"), and the
  step boxes in `position` order joined by arrows, done steps green, each box
  showing its step text.
- **Empty state:** "No tasks yet. Dump one on the Overview tab."

## Out of scope

- Editing tasks or steps on this tab (that stays in the Dumped list).
- Completed tab (feature 8).
- Any schema change or new server action.

## Build loop

Continuous Mode: build all steps in order, run each step's check, no step commits.

## Build steps

- [x] **1. Shared header with tabs.** Add `PageHeader` and `TabNav`, use them on the
  overview.
  **Done when:** typecheck, lint and build pass; the overview renders the same
  masthead, date and dates box as before, with the tab bar under the masthead.

- [x] **2. Strategy page.** Add `listAllTasks`, `listAllSteps` to `app/lib/tasks.ts`,
  `app/strategy/page.tsx` and `app/components/strategy/TaskProgression.tsx`.
  **Done when:** typecheck, lint and build pass and the build lists `/strategy` as a
  dynamic route; the queries return every task (all statuses, newest first) and
  every step in `position` order against a throwaway in-memory database.

## Files / areas

- `app/components/layout/PageHeader.tsx`, `app/components/layout/TabNav.tsx` - new
- `app/page.tsx` - use `PageHeader`
- `app/strategy/page.tsx` - new, `force-dynamic`
- `app/components/strategy/TaskProgression.tsx` - new, server component
- `app/lib/tasks.ts` - `listAllTasks`, `listAllSteps`

## Data / contracts

Read only. `SELECT id, title, due_date, status, created_at FROM tasks ORDER BY id DESC`
and `SELECT id, task_id, position, title, done FROM steps ORDER BY task_id, position`.
Titles render as plain React text. Each task card is an `<article>` labelled by its
title; the step boxes are an ordered list with the arrows `aria-hidden`; each box
carries "done" as text for screen readers when the step is done.

## Testing

No test runner and no Verify command. Each step runs `npx tsc --noEmit`,
`npm run lint`, `npm run build`. Queries are checked with node against an in-memory
database, never Aariz's real file.

## Notes for the AI

- Read `node_modules/next/dist/docs/01-app/01-getting-started/04-linking-and-navigating.md` for `Link`.
- Keep pages `force-dynamic`. Import `getDb()` only from server code.
- No em dashes in code comments or UI text.
- Keep `prototypes/` until feature 8 is complete.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":3650,"specSha256":"acf74a45e12bf99f565e02a25938946093bb3a366635295c295cc01a262410dc","branch":"refs/heads/feature/strategy-tab","head":"6a0e8d8d874d9e11f488429b0d9ff8a591b6e0d1","baseRef":"refs/heads/main","baseCommit":"6a0e8d8d874d9e11f488429b0d9ff8a591b6e0d1","sourceTree":"1dd309c7f61a93967e23336774bc9e0019cede76","absentOptional":[]} -->
