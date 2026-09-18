# Feature: Completed tab

**From build-plan:** feature 8
**Build attempt:** 1
**Status:** verified
**Branch:** feature/completed-tab

## Goal

A third tab, Completed, that holds every finished task, so done work leaves the
overview but is still there to look back on.

## Design reference

- `prototypes/overview.html` (local only, gitignored), `<header>`: the third tab
  "Completed" with a small raised `.badge.ext-sm` holding the number of finished
  tasks.
- Each finished task reuses the Strategy tab's task card (`TaskProgression`).

## In scope

- **Tab:** "Completed" (`/completed`) after Strategy, with a badge showing how many
  tasks have `status = 'done'`. The badge is hidden at 0. Screen readers hear
  "Completed, N tasks".
- **Completed page (`app/completed/page.tsx`):** every task with `status = 'done'`,
  newest first, each as the Strategy tab's card with its full progression.
- **Empty state:** "No finished tasks yet."
- Finished tasks already leave the overview's Dumped list (`listDumpTasks` skips
  `done`), which this feature keeps as is.

## Out of scope

- Reopening or deleting a finished task from this tab.
- Any schema change or new server action.
- Deleting `prototypes/`: it is local-only and gitignored, and Continuous Mode does
  not delete files. Aariz can remove it himself now that feature 8 is built.

## Build loop

Continuous Mode: build all steps in order, run each step's check, no step commits.

## Build steps

- [x] **1. Completed tab and page.** Add `countDoneTasks` and `listDoneTasks`,
  `listStepsForDoneTasks` to `app/lib/tasks.ts`, the third tab with its badge in
  `TabNav`, and `app/completed/page.tsx`.
  **Done when:** typecheck, lint and build pass and the build lists `/completed` as
  a dynamic route; against a throwaway in-memory database the queries return only
  `done` tasks newest first, their steps in `position` order, and the right count.

## Files / areas

- `app/lib/tasks.ts` - `countDoneTasks`, `listDoneTasks`, `listStepsForDoneTasks`
- `app/components/layout/TabNav.tsx`, `PageHeader.tsx` - third tab and badge
- `app/completed/page.tsx` - new, `force-dynamic`

## Data / contracts

Read only. `SELECT COUNT(*) FROM tasks WHERE status = 'done'`;
`SELECT ... FROM tasks WHERE status = 'done' ORDER BY id DESC`; steps joined to done
tasks ordered by `task_id, position`. Titles render as plain React text.

## Testing

No test runner and no Verify command. The step runs `npx tsc --noEmit`,
`npm run lint`, `npm run build`. Queries are checked with node against an
in-memory database, never Aariz's real file.

## Notes for the AI

- Keep pages `force-dynamic`. Import `getDb()` only from server code.
- No em dashes in code comments or UI text.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":2720,"specSha256":"56e9a8c9b34eb8ce2d20be0dad0920810f51ee71febd024b9a262787ac90901e","branch":"refs/heads/feature/completed-tab","head":"1962228ae2e8d7407ed6415a8da45863f5e42c5b","baseRef":"refs/heads/main","baseCommit":"1962228ae2e8d7407ed6415a8da45863f5e42c5b","sourceTree":"dcfdb73149d21b7e9c80f50a4568e3b03a6398d8","absentOptional":[]} -->
