# Feature: SQLite storage for tasks

**From build-plan:** feature 1
**Build attempt:** 1
**Branch:** feature/sqlite-storage-for-tasks
**Status:** verified

## Goal

Create one SQLite file in the root `data/` folder holding the `tasks`, `steps`,
`daily_priorities` and `important_dates` tables exactly as the project overview's
data model defines them, so features 2 to 8 have somewhere to read and write and
nothing is lost when the app reloads or restarts.

## In scope

- One server-only module that opens `data/planner.db` with `better-sqlite3`,
  creates the `data/` folder if it is missing, and creates the four tables if they
  do not exist yet.
- The data-model rules that belong in the database itself: required columns,
  allowed `status` values, 0/1 `done` values, cascade deletes, and the hard cap of
  three `daily_priorities` rows per `priority_date`.
- TypeScript row types for the four tables.
- Making the home page open the database at request time, so running the app
  creates the file.

## Out of scope

- Any UI for tasks, steps, daily priorities or important dates (features 2 to 6).
- Server Actions or queries beyond opening the database and creating tables.
- Moving `tasks.status` between `open`, `started` and `done`, and ticking
  `steps.done` when a step's daily priority is ticked. These are app rules for
  features 4 and 8, not table definitions.
- Checking that a daily priority's `step_id` belongs to its `task_id` (feature 4
  validates this in its Server Action).
- Removing the Create Next App starter content from `app/page.tsx` (feature 2).
- Migrations tooling. The file is local, gitignored and currently empty, so
  `CREATE TABLE IF NOT EXISTS` is enough.
- Neumorphism and dark mode look (overview open question, not this feature).

## Build loop

`workflow.stepReview` is `feature`: build all steps, then present one review
packet for the whole feature. `workflow.checkpointCommits` is `disabled`: no
commits per step. `/complete` makes the single feature commit.

## Build steps

- [x] **1. Types for `better-sqlite3`.** `better-sqlite3@13.0.3` is installed but
  ships no `.d.ts` files (its `lib/` has only `.js`), and strict TypeScript bans
  `any`. Add `@types/better-sqlite3` as a dev dependency with `npm install -D`.
  Also confirm the native binding loads on this Mac:
  `node -e "new (require('better-sqlite3'))(':memory:').prepare('select 1 as x').get()"`
  prints nothing and exits 0.
  **Done when:** `package.json` lists `@types/better-sqlite3` under
  `devDependencies`, the `node -e` command exits 0, and `npx tsc --noEmit` passes.

- [x] **2. Row types.** Create `app/types/db.ts` with `Task`, `Step`,
  `DailyPriority` and `ImportantDate` interfaces matching the columns below, and a
  `TaskStatus` union of `"open" | "started" | "done"`.
  **Done when:** `npx tsc --noEmit` and `npm run lint` pass.

- [x] **3. Database module.** Create `app/lib/db.ts` exporting `getDb()`, which
  lazily opens one module-level connection to `data/planner.db` (path built from
  `process.cwd()`), runs `fs.mkdirSync(dataDir, { recursive: true })` first, sets
  `PRAGMA foreign_keys = ON` and `PRAGMA journal_mode = WAL`, then runs the schema
  in "Data / contracts" inside one `db.exec`. Every statement uses
  `IF NOT EXISTS`, so running it on an existing file changes nothing.
  **Done when:** `npx tsc --noEmit` and `npm run lint` pass, and no client
  component imports `app/lib/db.ts`.

- [x] **4. Open the database when the app runs.** In `app/page.tsx`, call
  `getDb()` and add `export const dynamic = "force-dynamic"` so the database opens
  per request and `npm run build` does not create or touch `data/planner.db`.
  Leave the starter page markup as it is.
  **Done when:**
  1. `rm -f data/planner.db*`, then `npm run build` succeeds and
     `ls data/` shows no `planner.db`.
  2. `npm run dev`, open http://localhost:3000, and `ls data/` shows
     `planner.db`.
  3. `sqlite3 data/planner.db .schema` prints all four tables and the
     `daily_priorities_max_three` trigger.
  4. Persistence: `sqlite3 data/planner.db "insert into tasks (title) values ('Software Factory Build');"`,
     stop and restart `npm run dev`, reload the page, then
     `sqlite3 data/planner.db "select * from tasks;"` still shows the row with
     `status = open` and a filled `created_at`.
  5. Rules: with `PRAGMA foreign_keys = ON` in the same `sqlite3` session,
     inserting a fourth `daily_priorities` row for one `priority_date` fails with
     `A day holds at most three daily priorities`; inserting a task with
     `status = 'maybe'` fails; deleting a step removes the daily priority row
     that points at it; deleting the task removes its `steps` and
     `daily_priorities` rows.
  6. Clean up the test rows with `rm -f data/planner.db*` and stop the dev server.
  7. `git status --short` shows nothing under `data/`.

## Files / areas

- `package.json`, `package-lock.json` - add `@types/better-sqlite3` (dev)
- `app/types/db.ts` - new, row types
- `app/lib/db.ts` - new, connection and schema
- `app/page.tsx` - call `getDb()`, force dynamic rendering
- `data/planner.db` (plus `-wal` and `-shm` files) - created at runtime, already
  gitignored by `data/` in `.gitignore`

## Data / contracts

Database file: `data/planner.db`, relative to the project root (`process.cwd()`).
Dates are TEXT `YYYY-MM-DD`. `created_at` uses SQLite
`datetime('now', 'localtime')`, which stores `2026-09-17 09:14:00` in Mac local
time, matching the overview's example row.

```sql
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  due_date TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'started', 'done')),
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  title TEXT NOT NULL,
  done INTEGER NOT NULL DEFAULT 0 CHECK (done IN (0, 1))
);

CREATE TABLE IF NOT EXISTS daily_priorities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  priority_date TEXT NOT NULL,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  step_id INTEGER REFERENCES steps(id) ON DELETE CASCADE,
  done INTEGER NOT NULL DEFAULT 0 CHECK (done IN (0, 1))
);

CREATE INDEX IF NOT EXISTS steps_task_id ON steps(task_id);
CREATE INDEX IF NOT EXISTS daily_priorities_date ON daily_priorities(priority_date);

CREATE TRIGGER IF NOT EXISTS daily_priorities_max_three
BEFORE INSERT ON daily_priorities
WHEN (SELECT COUNT(*) FROM daily_priorities WHERE priority_date = NEW.priority_date) >= 3
BEGIN
  SELECT RAISE(ABORT, 'A day holds at most three daily priorities');
END;

CREATE TABLE IF NOT EXISTS important_dates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL,
  on_date TEXT NOT NULL
);
```

Choices made here (internal, reversible while the file is empty):

- `status` defaults to `open` and `done` defaults to `0`, since every new task,
  step and daily priority starts that way in the overview.
- No `UNIQUE (task_id, position)` on `steps`, so feature 3 can renumber steps
  after a delete without tripping a constraint mid-update.
- The three-per-day cap is a trigger, so it holds no matter which Server Action
  inserts the row. An `UPDATE` that changes `priority_date` is not capped; no
  planned feature moves a daily priority to another day.
- Deleting a step deletes any daily priority row that points at it
  (`ON DELETE CASCADE` on `step_id`), as Aariz decided on 2026-09-17.
- `foreign_keys` is off by default in SQLite, so `getDb()` must turn it on for
  every connection or cascade deletes silently do nothing.

## Testing

No test runner is configured, so there are no automated tests in this feature.
Evidence is `npx tsc --noEmit`, `npm run lint`, `npm run build`, and the manual
`sqlite3` checks in step 4. No Verify command exists.

## Notes for the AI

- `better-sqlite3` is already in Next.js's built-in server external packages
  list (`node_modules/next/dist/lib/server-external-packages.json`), so
  `next.config.ts` needs no change.
- Node on this Mac is v23.6.1; `better-sqlite3` requires Node >= 22.
- Never commit anything under `data/`. The repository is public.
- Follow `coding-standards.md`: no `any`, no comments that restate code.
- Record `better-sqlite3`, the `data/planner.db` path, and "no migration tool;
  schema is `CREATE ... IF NOT EXISTS` in `app/lib/db.ts`" under the Database
  section of `coding-standards.md` during this feature.



<!-- blueprint:completion {"schemaVersion":1,"specBytes":8581,"specSha256":"94c9846f321c2fb1650f5078c1bc5f3057e54bba8fd264c483885243d07e3298","branch":"refs/heads/feature/sqlite-storage-for-tasks","head":"43025a896f49ec4538438983339e36b8bdba8b68","baseRef":"refs/heads/main","baseCommit":"43025a896f49ec4538438983339e36b8bdba8b68","sourceTree":"5873192d8fca1ae1e1ff3da8b7c8b99714c499d3","absentOptional":[]} -->
